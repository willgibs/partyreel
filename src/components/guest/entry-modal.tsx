"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, ChevronLeft, Images } from "lucide-react";

import { EnterEventPrompt } from "@/components/guest/enter-event-prompt";
import { EntryShell, type DismissMode } from "@/components/guest/entry-shell";
import { EntryStepTransition } from "@/components/guest/entry-step-transition";
import { PasswordGate } from "@/components/guest/password-gate";
import { LegalConsentLine } from "@/components/shared/legal-consent-line";
import { Button } from "@/components/ui/button";
import { computeEntry, type GateStep } from "@/lib/guest/entry-steps";
import { ARRIVAL_BEAT_MS, useArrivalBeat } from "@/lib/guest/use-arrival-beat";
import { useSuccessHold } from "@/lib/guest/use-success-hold";
import { useWelcomeSeen } from "@/lib/guest/use-welcome-seen";
import { formatEventDate } from "@/lib/utils";

// Stable no-op subscribe for the hydration flag (useSyncExternalStore wants a stable subscribe).
const subscribeNoop = () => () => {};

export type EntryModalHandle = { openToGate: () => void };

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
    /** The success-hold signal for the page's REVEAL CURTAIN: the freshly
     *  mounted header/gallery wait at their pre-entrance state while the
     *  beat holds, then rise AS the sheet exits (event-experience). */
    onHoldingChange?: (holding: boolean) => void;
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
    onHoldingChange,
  },
  ref,
) {
  const [seen, markSeen] = useWelcomeSeen(qrToken);
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
    isDemo,
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
    holding;

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
    }),
    [holding],
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
    !open ||
    holding ||
    current === "password" ||
    (current === "welcome" && steps[1] === "password")
      ? "held"
      : "free";

  // Fired by the shell ONLY for a user dismissal of a "free" surface.
  function handleDismiss() {
    if (holding) return; // defense in depth; the hold is never dismissable
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
          : isReviewing || current === "welcome"
            ? "A shared album for the whole event."
            : current === "password"
              ? "Enter the event password to view it."
              : "Create a free account to see the full album and add your own photos."
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
          {displayKey === "welcome" && (
            <WelcomeStep
              eventName={eventName}
              hostName={hostName}
              eventDate={eventDate}
              hostAvatarUrl={hostAvatarUrl}
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
        <Button onClick={onRetry} size="lg" className="w-full text-[15px]">
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
        <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          You&rsquo;re invited to
        </p>
        <p className="mt-1.5 font-heading text-page text-balance">
          {eventName}
        </p>
        {hasByline && (
          <p className="mt-2 flex items-center gap-1.5 text-[13px] text-muted-foreground">
            {host && (
              <>
                {hostAvatarUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL, short-lived
                  <img
                    src={hostAvatarUrl}
                    alt=""
                    className="size-5 rounded-full object-cover"
                  />
                )}
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
          Add your photos and videos in seconds. No app, no account.
        </p>
        <p className="flex items-start gap-3 text-base leading-relaxed">
          <Images className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" />
          {count > 0
            ? `Everyone's shots land in one album. ${count} ${count === 1 ? "is" : "are"} already inside.`
            : "Everyone's shots land in one album, yours included."}
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-1">
        <Button onClick={onContinue} size="lg" className="w-full text-[15px]">
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
