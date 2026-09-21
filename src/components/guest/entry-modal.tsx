"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Check, ChevronLeft, ImageUp, Images, QrCode } from "lucide-react";

import { initial } from "@/components/app/user-menu";
import { EnterEventPrompt } from "@/components/guest/enter-event-prompt";
import { EntryShell, type DismissMode } from "@/components/guest/entry-shell";
import { EntryStepTransition } from "@/components/guest/entry-step-transition";
import {
  GuestNameStep,
  guestNameCopy,
} from "@/components/guest/guest-name-step";
import { PasswordGate } from "@/components/guest/password-gate";
import { LegalConsentLine } from "@/components/shared/legal-consent-line";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { computeEntry, type GateStep } from "@/lib/guest/entry-steps";
import { ARRIVAL_BEAT_MS, useArrivalBeat } from "@/lib/guest/use-arrival-beat";
import { useSuccessHold } from "@/lib/guest/use-success-hold";
import { useWelcomeSeen } from "@/lib/guest/use-welcome-seen";
import { formatEventDate } from "@/lib/utils";

// Stable no-op subscribe for the hydration flag (useSyncExternalStore wants a stable subscribe).
const subscribeNoop = () => () => {};

export type EntryModalHandle = {
  openToGate: () => void;
  /**
   * THE NAME STEP (the identity reshape, 2026-09-21). Imperative ONLY: it is
   * never one of `computeEntry`'s ordered steps and never auto-opens, because it
   * is asked at the first Add rather than at arrival. `join` mints this device's
   * session under a typed name; `edit` renames the row it already holds.
   */
  openToName: (mode: "join" | "edit") => void;
};

/**
 * The unified guest ENTRY surface: one shell (a Vaul drawer on phones, the
 * centered Dialog on sm+ - see entry-shell.tsx) whose ordered steps adapt to the event
 * (`welcome -> password? -> account?`). The CURRENT step is always the first un-satisfied one; it is
 * SERVER-DRIVEN -- each step's existing form (`<PasswordGate>` / `<EnterEventPrompt>`) calls
 * `router.refresh()` on success, which re-runs the RSC, drops the satisfied gate from `gateSteps`, and
 * re-derives the step here. No client step-machine to desync.
 *
 * Dismissibility fits what's behind each step (the "dismiss to what?" rule,
 * tightened in Phase 4.5 to the HONEST-AFFORDANCE table):
 * - welcome BEFORE a password gate: HELD (the old X "closed" it only for the
 *   firm gate to instantly re-open - a disorienting lie; the flow is now
 *   continuous: Continue is the path, drag rubber-bands).
 * - welcome before an account gate / standalone: free -> dismiss to the page
 *   behind (teaser or full gallery), marking the welcome seen.
 * - password: HELD (it IS the gated page, nothing real behind it).
 * - account: free -> closes to the BROWSABLE teaser; the gallery's "See all"
 *   caption re-opens it via the `openToGate` handle.
 */
export const EntryModal = forwardRef<
  EntryModalHandle,
  {
    qrToken: string;
    eventName: string;
    gateSteps: GateStep[];
    isOwner: boolean;
    isDemo: boolean;
    /** Approved media count (numbers only) — the gate steps' "N photos are
     *  waiting" tease + the welcome's count proof (the ratified
     *  cardinality-only leak). */
    mediaTotal?: number;
    /** Welcome byline (null on locked pages: the redacted shellEvent). */
    hostName?: string | null;
    eventDate?: string | null;
    hostAvatarUrl?: string | null;
    /** `seedFor(host_id)`, computed server-side (page.tsx via
     *  `getHostAvatarSeed`) — never the raw host id itself. Paints the
     *  byline's Avatar the same colour that host wears everywhere else
     *  (docs/design/rulings.md, the sixth batch, `seed=account`). Null exactly
     *  where `hostAvatarUrl` is: a locked page's redacted shellEvent, or no
     *  host on the event at all. */
    hostSeed?: string | null;
    /** The success-hold signal for the page's REVEAL CURTAIN: the freshly
     *  mounted header/gallery wait at their pre-entrance state while the
     *  beat holds, then rise AS the sheet exits (event-experience). */
    onHoldingChange?: (holding: boolean) => void;
    /** This device's guest capability, needed only to RENAME its row. */
    sessionToken?: string | null;
    /** The name this device already typed at this event (the step's prefill). */
    storedName?: string | null;
    /** The row now carries a name: the shell closes and the caller decides what
     *  follows (the intent sheet, on the Add this step interrupted). */
    onNamed?: (result: {
      sessionToken: string | null;
      displayName: string;
    }) => void;
  }
>(function EntryModal(
  {
    qrToken,
    eventName,
    gateSteps,
    isOwner,
    isDemo,
    mediaTotal,
    hostName,
    eventDate,
    hostAvatarUrl,
    hostSeed,
    onHoldingChange,
    sessionToken,
    storedName,
    onNamed,
  },
  ref,
) {
  const [seen, markSeen] = useWelcomeSeen(qrToken);
  // THE NAME STEP's own open state (the identity reshape). It is a SECOND door
  // through the same shell rather than a step in the ordered machine: the
  // machine is server-driven and drops a step when the RSC says it is satisfied,
  // and nothing on the server knows this browser typed a name. null = closed.
  const [nameOpen, setNameOpen] = useState<"join" | "edit" | null>(null);
  // `proceeded` = the guest advanced past the welcome into the gate (keeps a non-auto-opening account
  // gate open). `manuallyClosed` = they closed the account step back to the teaser.
  const [proceeded, setProceeded] = useState(false);
  const [manuallyClosed, setManuallyClosed] = useState(false);
  // Open only AFTER hydration: useWelcomeSeen's server snapshot is `seen=true`, so deciding `open`
  // during SSR/hydration would flash the wrong step before the real value resolves. useSyncExternalStore
  // (server=false, client=true) gives a hydrated flag without a setState-in-effect mount flag.
  const hydrated = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  const { steps, autoOpen } = computeEntry({
    gateSteps,
    welcomeSeen: seen,
    isOwner,
  });
  const current = steps[0] ?? null;
  // The arrival beat holds ONLY the auto-open (Act 1 settles, then Act 2
  // arrives); proceeded/openToGate stay instant. 700ms for the first-visit
  // invitation, 350ms for a password re-visit (see ARRIVAL_BEAT_MS).
  const beatReady = useArrivalBeat({
    enabled: autoOpen,
    ms:
      current === "welcome"
        ? ARRIVAL_BEAT_MS.welcome
        : ARRIVAL_BEAT_MS.password,
  });
  const router = useRouter();
  // THE SUCCESS HOLD (Phase 4.5 S5): on unlock the gate fires onUnlocked() +
  // router.refresh(); this holds the sheet on the "You're in" beat (masking
  // the refresh roundtrip) until the RSC drops the gate, then releases into
  // the reveal. `holding` ORs into open so the derived close can't slam shut
  // before the beat plays.
  const { holding, heldStep, slow, stalled, onUnlocked } = useSuccessHold({
    current,
  });
  // Mirror the hold to the page (the reveal curtain). Post-commit, parent
  // setState from a child effect - the sanctioned external-sync shape.
  useEffect(() => {
    onHoldingChange?.(holding);
  }, [holding, onHoldingChange]);
  // A success must be SEEN (clear any prior manual close), and an unlocking
  // guest has definitionally advanced past the welcome: `proceeded` keeps the
  // surface open when the hold releases into a NON-auto-opening account step
  // (the lighter path for a returning guest, who never tapped Continue).
  function handleUnlocked() {
    setManuallyClosed(false);
    setProceeded(true);
    onUnlocked();
  }

  const open =
    (hydrated &&
      current !== null &&
      ((autoOpen && beatReady) || proceeded) &&
      !manuallyClosed) ||
    holding ||
    // The name step's own door. ORed in rather than folded into the machine, so
    // an event with no gate at all (the whole point of a name-only event) can
    // still raise this one surface on a guest's first Add.
    (hydrated && nameOpen !== null);

  // THE BACK AFFORDANCE (Phase 4.5 S3): `reviewing` is a transient client
  // view OVER the server-driven machine - a gate step's chevron re-shows the
  // welcome content; its primary returns forward. The machine never knows
  // (markSeen/steps untouched). Direction is event-driven state: only the
  // chevron goes "back". Both reset when the FLOW advances (the sanctioned
  // adjust-state-during-render pattern).
  const [reviewing, setReviewing] = useState(false);
  const [direction, setDirection] = useState<"fwd" | "back">("fwd");
  const [prevStep, setPrevStep] = useState(current);
  if (current !== prevStep) {
    setPrevStep(current);
    setReviewing(false);
    setDirection("fwd");
  }
  const isReviewing = reviewing && current !== "welcome" && current !== null;

  useImperativeHandle(
    ref,
    () => ({
      // The teaser's "See all" caption re-opens the gate (to the account step).
      // A no-op while the success beat holds (the plan's hold contract).
      openToGate: () => {
        if (holding) return;
        setManuallyClosed(false);
        setProceeded(true);
      },
      // ★ NEVER IN THE DEMO, as a belt under the caller's own guard: nothing a
      // demo visitor adds is persisted, so there is no row to name and a form
      // between the tap and the picture would be the one lie the demo tells.
      openToName: (mode) => {
        if (holding || isDemo) return;
        setNameOpen(mode);
      },
    }),
    [holding, isDemo],
  );

  // THE HELD VIEW + EXIT LATCH (Phase 4.5 audit fixes): while a PASSWORD hold
  // plays, the gate stays PLANTED and its own button morphs green (the
  // ratified in-place success - no step swap); an ACCOUNT hold shows the
  // SuccessStep instead (the OTP machinery has no single button to morph,
  // and the plan's out-of-scope clause bars reworking EmailSignIn internals -
  // a recorded judgment call). While the shell is closed/exiting, the LAST
  // open-state view stays latched so the sheet never deflates to an empty
  // strip mid-exit (the step content would otherwise unmount in the same
  // commit that starts the close).
  const stepKey = holding
    ? heldStep === "password"
      ? "password"
      : "success"
    : nameOpen
      ? `name-${nameOpen}`
      : isReviewing
        ? "welcome-review"
        : (current ?? "none");
  const [lastKey, setLastKey] = useState(stepKey);
  if (open && stepKey !== lastKey) setLastKey(stepKey);
  const displayKey = open ? stepKey : lastKey;

  // THE HONEST-AFFORDANCE TABLE (Phase 4.5, ratified): dismissal exists only
  // when there is something to dismiss TO. A welcome whose NEXT step is the
  // firm password gate is held (the continuous invitation -> gate flow), ANY
  // step is held while the success beat plays (`current` flips under the
  // hold when the refresh lands - without this row the X/handle would pop in
  // over the "You're in" view and a dismissal could corrupt the release),
  // and a CLOSED/exiting shell is held so affordances can't pop in mid-exit.
  const dismissMode: DismissMode =
    !open || holding
      ? "held"
      : // ★ THE NAME STEP IS ALWAYS FREE, even on a password event: the album
        // behind it is already unlocked and already browsable (it is opened at
        // the first Add, not at the door), so there IS something to dismiss to.
        // Closing it posts nothing, which is what makes "just looking" free.
        nameOpen
        ? "free"
        : current === "password" ||
            (current === "welcome" && steps[1] === "password")
          ? "held"
          : "free";

  // Fired by the shell ONLY for a user dismissal of a "free" surface.
  function handleDismiss() {
    if (holding) return; // defense in depth; the hold is never dismissable
    if (nameOpen) {
      // Nothing was sent, so nothing is undone: no row was minted and no name
      // was stored. The guest is back on the album exactly as they were.
      setNameOpen(null);
      return;
    }
    if (current === "welcome") {
      // Dismissing the welcome marks it seen; re-derivation decides what shows: an account gate
      // closes to the teaser, public closes to the gallery (password welcomes are held, never here).
      markSeen();
    } else if (current === "account") {
      setManuallyClosed(true); // close to the browsable teaser; the "See all" caption reopens it
    }
  }

  function continueFromWelcome() {
    markSeen();
    // If a gate follows (steps had welcome + a gate), keep the modal open into it; an account gate
    // wouldn't auto-open on its own, so `proceeded` carries it. For a public event (welcome only),
    // markSeen empties the steps and the modal closes to the gallery.
    if (steps.length > 1) setProceeded(true);
  }

  // Nothing renders pre-hydration (open is always false there anyway); the
  // early return keeps the shell branch (drawer vs dialog) client-only.
  if (!hydrated) return null;

  return (
    <EntryShell
      open={open}
      dismissMode={dismissMode}
      onDismiss={handleDismiss}
      title={
        holding
          ? "You're in"
          : nameOpen
            ? guestNameCopy(nameOpen, hostName).title
            : current === "welcome" && !isReviewing && isDemo
            ? "You're trying a live demo"
            : isReviewing || current === "welcome"
              ? `Welcome to ${eventName}`
              : current === "password"
                ? `${eventName} is private`
                : "See all the photos"
      }
      // ALBUM, NOT GALLERY (Will, 2026-09-17, the `noun=album` pick): the site,
      // the app and the reel all say album, so the guest's phone says it too.
      // One noun for one object, because a guest who becomes a host meets both
      // words. The CODE noun deliberately did not move with it (/api/guests/
      // gallery, gallery-access, the RPCs): renaming a live route buys a guest
      // nothing and risks the one flow with no account behind it.
      description={
        holding
          ? "Opening the album."
          : nameOpen
            ? guestNameCopy(nameOpen, hostName).reason
            : current === "welcome" && !isReviewing && isDemo
              ? "A real album, running exactly as a guest would see it."
              : isReviewing || current === "welcome"
                ? "A shared album for the whole event."
                : current === "password"
                  ? "Enter the event password to view it."
                  : // ★ THE GATE LINE, RESHAPED (2026-09-21): an account is not
                    // what is being asked for, a confirmed address is, and the
                    // free account is what confirming makes.
                    "Confirm your email to see the full album and add your own photos."
      }
    >
      <EntryStepTransition stepKey={displayKey} direction={direction}>
        <div className="relative pt-1">
          {displayKey === "success" && (
            <SuccessStep
              slow={slow}
              stalled={stalled}
              onRetry={() => router.refresh()}
            />
          )}
          {displayKey === "welcome-review" && (
            <WelcomeStep
              eventName={eventName}
              hostName={hostName}
              eventDate={eventDate}
              hostAvatarUrl={hostAvatarUrl}
              hostSeed={hostSeed}
              mediaTotal={mediaTotal}
              gateNext
              browseAvailable={false}
              continueLabel={
                current === "password" ? "Back to the password" : "Back"
              }
              onContinue={() => {
                setDirection("fwd");
                setReviewing(false);
              }}
              onBrowse={() => {}}
            />
          )}
          {/* The gate steps carry a chevron back to the welcome (R5: the
              guest can always re-read what this is) - hidden while the
              success beat plays (nothing to go back to mid-celebration). */}
          {(displayKey === "password" || displayKey === "account") &&
            !holding && (
              <button
                type="button"
                aria-label="Back to the welcome"
                onClick={() => {
                  setDirection("back");
                  setReviewing(true);
                }}
                className="absolute top-0 left-0 flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ChevronLeft className="size-5" />
              </button>
            )}
          {/* THE NAME STEP (the identity reshape): the whole door on a name-only
              event. It carries no back chevron, because there is no step behind
              it: it was opened by an Add on an album the guest is already
              standing in, and the X goes back to exactly that. */}
          {(displayKey === "name-join" || displayKey === "name-edit") && (
            <GuestNameStep
              qrToken={qrToken}
              mode={displayKey === "name-edit" ? "edit" : "join"}
              hostName={hostName}
              storedName={storedName}
              sessionToken={sessionToken}
              onNamed={(result) => {
                setNameOpen(null);
                onNamed?.(result);
              }}
              onVerificationRequired={() => {
                // The host turned Require verified emails ON while this guest
                // stood at the door. The name is worth nothing now, so the step
                // closes and the page's own refresh re-gates to the account
                // step, which is the honest surface for what just changed.
                setNameOpen(null);
                router.refresh();
              }}
            />
          )}
          {displayKey === "welcome" && isDemo && (
            <RoleStep
              eventName={eventName}
              hostName={hostName}
              onContinue={continueFromWelcome}
            />
          )}
          {displayKey === "welcome" && !isDemo && (
            <WelcomeStep
              eventName={eventName}
              hostName={hostName}
              eventDate={eventDate}
              hostAvatarUrl={hostAvatarUrl}
              hostSeed={hostSeed}
              mediaTotal={mediaTotal}
              gateNext={steps.length > 1}
              // "Just browsing" only when a BROWSABLE teaser sits behind (an
              // account gate); a password gate has nothing to browse, and it
              // would auto-reopen anyway.
              browseAvailable={steps[1] === "account"}
              onContinue={continueFromWelcome}
              onBrowse={() => markSeen()}
            />
          )}
          {/* pt-7 clears the absolute back chevron's row so it never
              overlaps the centered gate heading (long event names). The gate
              stays MOUNTED through the password hold + the exit (the latch
              keeps displayKey "password"), so its in-place morph rides the
              whole choreography on one instance. */}
          {displayKey === "password" && (
            <div className="pt-7">
              <PasswordGate
                token={qrToken}
                eventName={eventName}
                onUnlocked={handleUnlocked}
                stalled={stalled}
                onRetry={() => router.refresh()}
              />
            </div>
          )}
          {displayKey === "account" && (
            <div className="pt-7">
              <EnterEventPrompt
                qrToken={qrToken}
                mediaTotal={mediaTotal}
                onUnlocked={handleUnlocked}
              />
            </div>
          )}
        </div>
      </EntryStepTransition>
    </EntryShell>
  );
});

// THE SUCCESS BEAT (Phase 4.5 S5): the held "You're in" view that masks the
// refresh roundtrip. A --success green check (the system's sanctioned feedback
// color), "You're in", and "Opening the album" once it runs slow. If the
// refresh hangs past the watchdog, a Retry (the unlock cookie is already set,
// so it always recovers). On the full path this exits into the reveal; on a
// password->account hop it hands forward to the account step.
function SuccessStep({
  slow,
  stalled,
  onRetry,
}: {
  slow: boolean;
  stalled: boolean;
  onRetry: () => void;
}) {
  if (stalled) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        {/* The sheet's title slot keeps the event name's step on every screen
            of the flow (the welcome, the gate, this stall and the arrival). */}
        <p className="font-heading text-page text-balance">
          That took longer than it should
        </p>
        <p className="max-w-xs text-base leading-relaxed text-muted-foreground">
          You&rsquo;re unlocked, the album just didn&rsquo;t open. Give it one
          more tap.
        </p>
        <Button onClick={onRetry} size="cta" className="w-full">
          Open the album
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-success text-success-foreground">
        <Check className="size-7" />
      </div>
      <div>
        <p className="font-heading text-page">You&rsquo;re in</p>
        <p className="mt-1 text-base text-muted-foreground">
          {slow ? "Opening the album" : "Welcome to the party"}
        </p>
      </div>
    </div>
  );
}

// THE INVITATION (Phase 4.5): the warm front door. An eyebrow over the event
// name as the Instrument Serif hero, the host's byline, the count as social
// proof, then two reading rows in the host's event voice (minimal Partyreel
// branding). One primary advances ("Continue" when a gate follows) or
// dismisses ("View the album"). The whole block staggers in on mount.
function WelcomeStep({
  eventName,
  hostName,
  eventDate,
  hostAvatarUrl,
  hostSeed,
  mediaTotal,
  gateNext,
  browseAvailable,
  continueLabel,
  onContinue,
  onBrowse,
}: {
  eventName: string;
  hostName?: string | null;
  eventDate?: string | null;
  hostAvatarUrl?: string | null;
  hostSeed?: string | null;
  mediaTotal?: number;
  gateNext: boolean;
  /** A browsable teaser exists behind the next gate (account gates only). */
  browseAvailable: boolean;
  /** Override for the review view ("Back to the password"). */
  continueLabel?: string;
  onContinue: () => void;
  /** Dismiss to the teaser (marks the welcome seen WITHOUT advancing). */
  onBrowse: () => void;
}) {
  const host = hostName?.trim();
  const hasByline = Boolean(host || eventDate);
  const count = mediaTotal ?? 0;

  return (
    // data-welcome-step: the ratified "tall" presence (~55svh) applies ONLY
    // inside the phone sheet, via [data-entry-drawer] [data-welcome-step] in
    // globals.css; the desktop dialog stays content-height. The CTA block's
    // mt-auto pins it to the sheet's foot when the minimum height engages.
    <div data-welcome-step className="flex flex-col gap-5">
      <div className="flex flex-col">
        <p className="text-label font-medium text-muted-foreground uppercase">
          You&rsquo;re invited to
        </p>
        <p className="mt-1.5 font-heading text-page text-balance">
          {eventName}
        </p>
        {hasByline && (
          <p className="mt-2 flex items-center gap-1.5 text-working text-muted-foreground">
            {host && (
              <>
                {/* Every host wears their seeded colour here now, photo or not
                    (`the-crowd=full`, docs/design/rulings.md the sixth
                    batch) — the raw <img> used to skip entirely without an
                    avatar; the fallback initial means this byline is never
                    bare again. */}
                <Avatar seed={hostSeed ?? undefined} size="sm">
                  <AvatarImage src={hostAvatarUrl ?? undefined} alt="" />
                  <AvatarFallback>{initial(null, host)}</AvatarFallback>
                </Avatar>
                <span>
                  Hosted by{" "}
                  <span className="font-medium text-foreground">{host}</span>
                </span>
              </>
            )}
            {host && eventDate && (
              <span aria-hidden className="text-faint">
                ·
              </span>
            )}
            {eventDate && <span>{formatEventDate(eventDate)}</span>}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3.5">
        <p className="flex items-start gap-3 text-base leading-relaxed">
          <Camera className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" />
          Add your photos and videos in seconds. No app required.
        </p>
        <p className="flex items-start gap-3 text-base leading-relaxed">
          <Images className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" />
          {count > 0
            ? `Everyone's shots land in one album. ${count} ${count === 1 ? "is" : "are"} already inside.`
            : "Everyone's shots land in one album, yours included."}
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-1">
        <Button onClick={onContinue} size="cta" className="w-full">
          {continueLabel ?? (gateNext ? "Continue" : "View the album")}
        </Button>
        {browseAvailable && (
          <Button
            variant="ghost"
            onClick={onBrowse}
            className="w-full text-muted-foreground"
          >
            Just browsing
          </Button>
        )}
        {/* The acceptance line rides the door every guest passes once (the
            legal round's ruling); links open in a new tab so the sheet the
            guest is standing in survives the tap. */}
        <LegalConsentLine newTab className="mt-2 text-center" />
      </div>
    </div>
  );
}

// THE DEMO'S OWN ARRIVAL (Will, `arrival=role`, the sixth batch, 2026-09-20:
// "the demo welcome feels more correct for this generic guest welcome").
// `computeEntry` no longer special-cases the demo (entry-steps.ts) — it is
// the SAME "welcome" step every guest gets, wearing different words, so its
// DESIGN stays exactly WelcomeStep's (guest-shape round two redraws both
// together; see spec.ts's own note that this board never touches it). Three
// things a visitor here needs and the ordinary welcome's copy does not give
// them: what this is (a real album, standing in for theirs), where they are
// standing (in a guest's shoes, at somebody's party), and the one thing to
// try. The two reading rows deliberately MIRROR WelcomeStep's own two
// promises rather than inventing a second voice — the same measure, the same
// order, said to a prospective HOST instead of a guest (bible 4 still holds
// behind it: this sheet is the only place on the page that speaks as
// Partyreel). No LegalConsentLine here — looking around a demo agrees to
// nothing (the `PartyDoor` precedent in the board's own sandbox).
function RoleStep({
  eventName,
  hostName,
  onContinue,
}: {
  eventName: string;
  hostName?: string | null;
  onContinue: () => void;
}) {
  const host = hostName?.trim();
  return (
    <div data-welcome-step className="flex flex-col gap-5">
      <div className="flex flex-col">
        <p className="text-label font-medium text-muted-foreground uppercase">
          A live demo
        </p>
        <p className="mt-1.5 font-heading text-page text-balance">
          You&rsquo;re a guest at {eventName}
        </p>
        <p className="mt-2 text-working text-muted-foreground">
          This is a real album, exactly as{" "}
          {host ? `${host}’s` : "the host’s"} guests see it.
        </p>
      </div>

      <div className="flex flex-col gap-3.5">
        <p className="flex items-start gap-3 text-base leading-relaxed">
          <ImageUp className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" />
          Add a photo the way a guest would. Nothing you add is saved.
        </p>
        <p className="flex items-start gap-3 text-base leading-relaxed">
          <QrCode className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" />
          One code did all of this. Yours takes about a minute.
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <Button onClick={onContinue} size="cta" className="w-full">
          Look around
        </Button>
        <Button asChild variant="ghost" className="w-full text-muted-foreground">
          <Link href="/">Start your own</Link>
        </Button>
      </div>
    </div>
  );
}
