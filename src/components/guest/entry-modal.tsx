"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Check, ChevronLeft, ImageUp, Images, QrCode } from "lucide-react";

import { updateDisplayNameAction } from "@/app/(app)/account/actions";
import { initial } from "@/components/app/user-menu";
import { EnterEventPrompt } from "@/components/guest/enter-event-prompt";
import { EntryShell, type DismissMode } from "@/components/guest/entry-shell";
import { EntryStepTransition } from "@/components/guest/entry-step-transition";
import {
  GuestNameStep,
  guestNameCopy,
  type GuestNameMode,
} from "@/components/guest/guest-name-step";
import { PasswordGate } from "@/components/guest/password-gate";
import { UploadStep, uploadStepReason } from "@/components/guest/upload-step";
import { LegalConsentLine } from "@/components/shared/legal-consent-line";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { GalleryAccess, GalleryGate } from "@/lib/events/gallery-access";
import { claimAnonymousUploads } from "@/lib/guest/claim-uploads";
import { computeDoor, type EntryStep } from "@/lib/guest/entry-steps";
import { joinEvent } from "@/lib/guest/join";
import { ARRIVAL_BEAT_MS, useArrivalBeat } from "@/lib/guest/use-arrival-beat";
import { setLastName, setStoredName } from "@/lib/guest/use-stored-name";
import { useSuccessHold } from "@/lib/guest/use-success-hold";
import { useWelcomeSeen } from "@/lib/guest/use-welcome-seen";
import type { QueueItem } from "@/lib/guest/use-upload-queue";
import { createClient } from "@/lib/supabase/client";
import { formatEventDate } from "@/lib/utils";

// Stable no-op subscribe for the hydration flag (useSyncExternalStore wants a stable subscribe).
const subscribeNoop = () => () => {};

export type EntryModalHandle = {
  /** The teaser's "See all N" re-asserts the sheet at whatever step it is on. */
  openToGate: () => void;
  /**
   * THE EDIT DOOR, and only that. The join/hold/profile modes are steps of the itinerary now (the
   * door as three steps, 2026-09-21); "Change name" in the album's menu is the one name door that
   * is still raised imperatively, and the one surface in this whole sheet that a guest may close.
   */
  openToName: (mode: "edit") => void;
};

/**
 * THE GUEST DOOR: ONE HELD SHEET, THEN THE ALBUM (Will, 2026-09-21, rulings.md "the door as three
 * steps"). The welcome, the password when the event has one, the name, the email held until it is
 * confirmed when the host requires verified emails, then the first upload asked actively inside
 * this same sheet. The nine-tile teaser sits blurred behind it the whole way, which is the point:
 * "we're simply teasing them with the album reward for their info and media".
 *
 * ★ NO EXIT (his words, at the question about a "Just browsing" row: "Including 'just browsing'
 * defeats this entire purpose of using the album to justify the name or email friction. No exit.").
 * Every step is HELD: no X, no drag handle, Escape and the backdrop inert. The one dismissible door
 * left in this file is the album menu's "Change name", which is opened from an album the guest is
 * already standing in and posts nothing when it closes.
 *
 * ★ THE ITINERARY IS DERIVED, NOT SEQUENCED. `computeDoor` (lib/guest/entry-steps.ts) takes the
 * server's decision and this browser's own facts and answers an ordered list; the CURRENT step is
 * always its first. The server steps (password, email) drop through the RSC's refresh; the client
 * steps (name, upload) drop through flags here. There is no step counter to desync.
 *
 * ★ THE "YOU'RE IN" BEAT PLAYS ONCE, ON THE LAST STEP. Every other step hands forward with no
 * celebration, the way the welcome always has: three green checks on the way into one album would
 * be three lies about how much has been achieved.
 */
export const EntryModal = forwardRef<
  EntryModalHandle,
  {
    qrToken: string;
    eventName: string;
    /** The server's decision for this render (re-derived from every poll upstream). */
    access: GalleryAccess;
    gate: GalleryGate | null;
    /** The server's answer to "has this viewer ever contributed to this event". */
    hasContributed: boolean;
    /** This visit's own completed upload (the client half, before any refresh lands). */
    contributed: boolean;
    /** This browser already held a session at load (snapshotted upstream at hydration). */
    returning: boolean;
    /** The host is accepting uploads. */
    uploadsOpen: boolean;
    /** The host's switch: ON, the upload step has no skip. */
    requireUpload: boolean;
    /** The album has nothing in it yet (the upload step's own first-photograph line). */
    albumEmpty: boolean;
    isOwner: boolean;
    isDemo: boolean;
    /** The viewer holds a CONFIRMED account. */
    isVerified: boolean;
    /** That account already has a profile display name (so the name is a fact, not a question). */
    hasProfileName: boolean;
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
    /**
     * The row now carries a name: the caller adopts the session and trues up its own credits.
     * `source` says which door it came from, because only one of the three owes a refresh: the
     * album menu's EDIT (the server-baked Guests list has no live subscription of its own). A
     * name STEP hands forward inside this same sheet, and the CONFIRMATION sequence issues its
     * own refresh under the hold.
     */
    onNamed?: (result: {
      sessionToken: string | null;
      displayName: string;
      source: "step" | "edit" | "verified";
    }) => void;
    /* ── the upload step's half of the lifted queue (event-experience owns it) ── */
    queue: readonly QueueItem[];
    capBytes?: number | null;
    onSend: (files: File[]) => void;
    onRetry: (id: string) => void;
    onDismissFailures: (ids: string[]) => void;
    /**
     * The door's upload step is the surface a run's failures belong to right now. The album's own
     * failure sheet stands down while it is, and a mid-run `verification_required` refreshes at
     * once instead of waiting for a sheet that is not there (see event-experience's own note).
     */
    onUploadStepActive?: (active: boolean) => void;
  }
>(function EntryModal(
  {
    qrToken,
    eventName,
    access,
    gate,
    hasContributed,
    contributed,
    returning,
    uploadsOpen,
    requireUpload,
    albumEmpty,
    isOwner,
    isDemo,
    isVerified,
    hasProfileName,
    mediaTotal,
    hostName,
    eventDate,
    hostAvatarUrl,
    hostSeed,
    onHoldingChange,
    sessionToken,
    storedName,
    onNamed,
    queue,
    capBytes,
    onSend,
    onRetry,
    onDismissFailures,
    onUploadStepActive,
  },
  ref,
) {
  const router = useRouter();
  const [seen, markSeen] = useWelcomeSeen(qrToken);
  // THE EDIT DOOR's own open state: a SECOND door through the same shell rather than a step, and
  // the only free surface here (see the handle's comment).
  const [editOpen, setEditOpen] = useState(false);
  /* ★ THE HELD NAME (verified mode). The join would answer 422 before the code confirms, so the
     name lives here until the confirmation's sequence has a row to put it on. It also counts as
     `hasName` for the machine, which is what lets the email step follow the name step instead of
     re-asking it. A magic-link round trip that loses this recovers as the `profile` mode, prefilled
     from `pr_guest_name_last`. */
  const [typedName, setTypedName] = useState<string | null>(null);
  // The OFF state's soft skip, once per pass. ON there is no skip to press, and `computeDoor`
  // ignores this flag entirely in that state so a stale one can never open an album.
  const [skipped, setSkipped] = useState(false);
  // Open only AFTER hydration: useWelcomeSeen's server snapshot is `seen=true`, so deciding `open`
  // during SSR/hydration would flash the wrong step before the real value resolves. useSyncExternalStore
  // (server=false, client=true) gives a hydrated flag without a setState-in-effect mount flag.
  const hydrated = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  /* THE NAME THIS BROWSER HAS, from whichever of the three places holds it: the per-event key a
     join wrote, the held name typed a moment ago, or a confirmed account's own profile name (which
     is a fact about the person, not a question for this album). */
  const hasName =
    Boolean(storedName) || Boolean(typedName) || (isVerified && hasProfileName);

  const { steps, autoOpen } = computeDoor({
    gate,
    access,
    hasContributed,
    uploadsOpen,
    requireUpload,
    welcomeSeen: seen,
    hasName,
    contributed,
    skipped,
    returning,
    isOwner,
    isDemo,
  });
  const current: EntryStep | null = steps[0] ?? null;
  const isLastStep = steps.length === 1;

  /* WHICH NAME IS BEING ASKED FOR. A confirmed account with no profile name writes the PROFILE; an
     unconfirmed guest of a verified-emails event HOLDS the name until the code lands; everyone else
     joins under it. */
  const nameMode: GuestNameMode =
    isVerified && !hasProfileName
      ? "profile"
      : gate === "account"
        ? "hold"
        : "join";

  // The arrival beat holds ONLY the auto-open (Act 1 settles, then Act 2
  // arrives); a re-assert stays instant. 700ms for the first-visit
  // invitation, 350ms for a password re-visit (see ARRIVAL_BEAT_MS).
  const beatReady = useArrivalBeat({
    enabled: autoOpen,
    ms:
      current === "welcome"
        ? ARRIVAL_BEAT_MS.welcome
        : ARRIVAL_BEAT_MS.password,
  });
  // THE SUCCESS HOLD (Phase 4.5 S5): the step whose exit is the album fires
  // onUnlocked() + router.refresh(); this holds the sheet on the "You're in"
  // beat (masking the refresh roundtrip) until the RSC drops the step, then
  // releases into the reveal. `holding` ORs into open so the derived close
  // can't slam shut before the beat plays.
  const { holding, heldStep, slow, stalled, onUnlocked } = useSuccessHold({
    current,
  });
  // Mirror the hold to the page (the reveal curtain). Post-commit, parent
  // setState from a child effect - the sanctioned external-sync shape.
  useEffect(() => {
    onHoldingChange?.(holding);
  }, [holding, onHoldingChange]);
  // And mirror which surface owns a run's failures (see the prop's own note). Same shape.
  const uploadStepShowing = current === "upload" && !holding;
  useEffect(() => {
    onUploadStepActive?.(uploadStepShowing);
    return () => onUploadStepActive?.(false);
  }, [uploadStepShowing, onUploadStepActive]);

  /**
   * ★ THE BEAT BELONGS TO THE LAST STEP ALONE. A password unlock on an event that still wants a
   * name, or a name on an event that still wants a photograph, hands FORWARD: the next step simply
   * arrives, as the welcome's Continue always has. Only the step the album is directly behind gets
   * the green check and the "You're in".
   */
  const handleUnlocked = useCallback(() => {
    if (isLastStep) onUnlocked();
  }, [isLastStep, onUnlocked]);

  const open =
    (hydrated && current !== null && (!autoOpen || beatReady)) ||
    holding ||
    // The edit door, ORed in: it opens over an album with no step pending at all.
    (hydrated && editOpen);

  // THE BACK AFFORDANCE (Phase 4.5 S3, carried onto the itinerary): a transient client view OVER
  // the derived machine. The password, the name and the email go back to the WELCOME (the guest can
  // always re-read what this is); the upload goes back to the NAME, which is the step it followed.
  // The machine never knows (markSeen/steps untouched). Both reset when the FLOW advances (the
  // sanctioned adjust-state-during-render pattern).
  const [backView, setBackView] = useState<"welcome" | "name" | null>(null);
  const [direction, setDirection] = useState<"fwd" | "back">("fwd");
  const [prevStep, setPrevStep] = useState(current);
  if (current !== prevStep) {
    setPrevStep(current);
    setBackView(null);
    setDirection("fwd");
  }
  const backTarget: "welcome" | "name" | null =
    current === "password" || current === "name" || current === "email"
      ? "welcome"
      : current === "upload"
        ? // The demo asks no name, so its one step behind the upload is the role screen.
          isDemo
          ? "welcome"
          : "name"
        : null;
  const reviewing = backView !== null && current !== null && !holding;

  useImperativeHandle(
    ref,
    () => ({
      // The teaser's "See all N" re-asserts the sheet. With no exit the sheet is already open
      // whenever a step exists, so the one thing this has to undo is the OFF state's soft skip.
      openToGate: () => {
        if (holding) return;
        setSkipped(false);
        setBackView(null);
      },
      // ★ NEVER IN THE DEMO, as a belt under the caller's own guard: nothing a
      // demo visitor adds is persisted, so there is no row to name and a form
      // between the tap and the picture would be the one lie the demo tells.
      openToName: () => {
        if (holding || isDemo) return;
        setEditOpen(true);
      },
    }),
    [holding, isDemo],
  );

  /* ────────────────────────────────────────────────────────────────────────
     WHAT HAPPENS THE INSTANT THE CODE CONFIRMS (verified mode).

     `EnterEventPrompt` used to own this: it claimed, called back, and refreshed. It cannot own it
     any more, because the door now holds a NAME that has never been sent anywhere, and the order
     the four writes happen in is the whole difference between a guest who lands named and one who
     lands as "A guest". So the prompt is a plain callback and this sequence is the modal's:

       1. claim this browser's anonymous uploads onto the freshly confirmed account;
       2. join, VERIFIED and nameless (create_guest nulls a typed name beside a confirmed
          account, so sending one would be asking to have it thrown away);
       3. read this account's OWN profile row for a display name;
       4. when there is none and a name was typed at the door, write it as the profile name;
       5. hold the beat, then refresh.

     ★ THE ACCOUNT'S NAME WINS. A confirmed viewer whose profile already says "Priya" is credited
     as Priya even if they typed "P" at the door a minute ago: one person, one name, and the email
     step says so out loud above the field. (His to overrule.)

     The whole sequence runs UNDER the hold, so a guest sees one beat rather than four flickers.
     ──────────────────────────────────────────────────────────────────────── */
  const handleEmailVerified = useCallback(async () => {
    // Blur FIRST so the iOS keyboard retracts during the success beat, never mid-exit.
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    handleUnlocked();
    await claimAnonymousUploads({ silent: true });

    const joined = await joinEvent({ qrToken });
    const mintedToken = joined.ok ? joined.guest.sessionToken : null;

    let landedName: string | null = null;
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // The viewer's OWN row, by their own id: RLS scopes it and nothing else is read.
        const { data } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .maybeSingle();
        landedName = data?.display_name ?? null;
        if (!landedName && typedName) {
          const saved = await updateDisplayNameAction(typedName);
          if (saved.ok) landedName = typedName;
        }
      }
    } catch {
      // A failed name read costs the credit line for one refresh, never the entry: the guest is
      // confirmed and joined either way, and the poll's own truth arrives a tick later.
    }

    if (landedName) {
      setStoredName(qrToken, landedName);
      setLastName(landedName);
    }
    onNamed?.({
      sessionToken: mintedToken,
      displayName: landedName ?? "",
      source: "verified",
    });
    router.refresh();
  }, [handleUnlocked, onNamed, qrToken, router, typedName]);

  // THE HELD VIEW + EXIT LATCH (Phase 4.5 audit fixes): while a PASSWORD hold
  // plays, the gate stays PLANTED and its own button morphs green (the
  // ratified in-place success - no step swap); every other hold shows the
  // SuccessStep. While the shell is closed/exiting, the LAST open-state view
  // stays latched so the sheet never deflates to an empty strip mid-exit (the
  // step content would otherwise unmount in the same commit that starts the
  // close).
  const stepKey = holding
    ? heldStep === "password"
      ? "password"
      : "success"
    : editOpen
      ? "name-edit"
      : reviewing
        ? backView === "name"
          ? `name-${nameMode}`
          : "welcome-review"
        : current === "name"
          ? `name-${nameMode}`
          : (current ?? "none");
  const [lastKey, setLastKey] = useState(stepKey);
  if (open && stepKey !== lastKey) setLastKey(stepKey);
  const displayKey = open ? stepKey : lastKey;

  /* ★ THE DISMISSABILITY TABLE IS ONE ROW NOW. "No exit": every step of the door is HELD, so there
     is no X, no handle, and Escape and the backdrop do nothing. The one free surface is the album
     menu's "Change name", which sits over an album the guest already reached and posts nothing when
     it closes. A closed/exiting shell is held too, so affordances cannot pop in mid-exit. */
  const dismissMode: DismissMode =
    open && editOpen && !holding ? "free" : "held";

  // Fired by the shell ONLY for a user dismissal of a "free" surface, which is the edit door alone.
  function handleDismiss() {
    if (holding) return; // defense in depth; the hold is never dismissable
    setEditOpen(false);
  }

  function continueFromWelcome() {
    markSeen();
  }

  const nameStepNode = (
    <GuestNameStep
      qrToken={qrToken}
      mode={displayKey === "name-edit" ? "edit" : nameMode}
      hostName={hostName}
      storedName={storedName}
      sessionToken={sessionToken}
      onNamed={(result) => {
        if (displayKey === "name-edit") {
          setEditOpen(false);
          onNamed?.({ ...result, source: "edit" });
          return;
        }
        if (nameMode === "hold") {
          // Nothing was sent: the name waits here for the confirmation's sequence, and the email
          // step follows because `hasName` now answers true.
          setTypedName(result.displayName);
          setBackView(null);
          return;
        }
        // A real row carries the name now: the caller adopts the session, and the machine advances
        // on the stored name the step just wrote (no refresh: the next step is in this sheet).
        setBackView(null);
        onNamed?.({ ...result, source: "step" });
      }}
      onVerificationRequired={() => {
        // The host turned Require verified emails ON while this guest stood at the door. The name
        // is worth nothing now, so the page's own refresh re-gates to the email step, which is the
        // honest surface for what just changed.
        setEditOpen(false);
        router.refresh();
      }}
    />
  );

  // Nothing renders pre-hydration (open is always false there anyway); the
  // early return keeps the shell branch (drawer vs dialog) client-only.
  if (!hydrated) return null;

  const sheetCopy = entrySheetCopy({
    holding,
    displayKey,
    reviewing,
    isDemo,
    eventName,
    hostName,
    nameMode,
    uploadReason: uploadStepReason({
      isDemo,
      requireUpload,
      albumEmpty,
      hostName: hostName?.trim() || "The host",
    }),
  });

  return (
    <EntryShell
      open={open}
      dismissMode={dismissMode}
      onDismiss={handleDismiss}
      title={sheetCopy.title}
      // ALBUM, NOT GALLERY (Will, 2026-09-17, the `noun=album` pick): the site,
      // the app and the reel all say album, so the guest's phone says it too.
      // One noun for one object, because a guest who becomes a host meets both
      // words. The CODE noun deliberately did not move with it (/api/guests/
      // gallery, gallery-access, the RPCs): renaming a live route buys a guest
      // nothing and risks the one flow with no account behind it.
      description={sheetCopy.description}
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
              continueLabel={
                current === "password" ? "Back to the password" : "Back"
              }
              onContinue={() => {
                setDirection("fwd");
                setBackView(null);
              }}
            />
          )}
          {/* The chevron back to the step behind this one (R5: the guest can always re-read what
              this is) - hidden while the success beat plays, and on the edit door, which has a
              real X of its own. */}
          {backTarget && !reviewing && !holding && !editOpen && (
            <button
              type="button"
              aria-label={
                backTarget === "name" ? "Back to your name" : "Back to the welcome"
              }
              onClick={() => {
                setDirection("back");
                setBackView(backTarget);
              }}
              className="absolute top-0 left-0 z-10 flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="size-5" />
            </button>
          )}
          {(displayKey === "name-join" ||
            displayKey === "name-edit" ||
            displayKey === "name-hold" ||
            displayKey === "name-profile") && (
            <div className={displayKey === "name-edit" ? undefined : "pt-7"}>
              {nameStepNode}
            </div>
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
              onContinue={continueFromWelcome}
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
          {displayKey === "email" && (
            <div className="pt-7">
              <EnterEventPrompt
                qrToken={qrToken}
                mediaTotal={mediaTotal}
                // ★ THE NAME THE ACCOUNT ALREADY HAS IS THE ONE THAT SHOWS, and the guest is told
                // so before they confirm rather than after they see somebody else's version of
                // their own name on a photograph.
                accountNameNote={Boolean(typedName)}
                onVerified={handleEmailVerified}
              />
            </div>
          )}
          {displayKey === "upload" && (
            <div className="pt-7">
              <UploadStep
                hostName={hostName?.trim() || "The host"}
                isDemo={isDemo}
                requireUpload={requireUpload}
                albumEmpty={albumEmpty}
                capBytes={capBytes}
                queue={queue}
                onSend={onSend}
                onRetry={onRetry}
                onDismiss={onDismissFailures}
                /* ★ THE SKIP EXISTS ONLY IN THE OFF STATE, and it is a GHOST: a host who did not
                   ask for a photograph is not owed one, and a guest who came for the album gets
                   it. ON there is no skip at all, which is the switch's whole meaning. */
                onSkip={
                  requireUpload
                    ? undefined
                    : () => {
                        setSkipped(true);
                        if (isDemo) markSeen();
                      }
                }
                onContinueWithout={() => router.refresh()}
              />
            </div>
          )}
        </div>
      </EntryStepTransition>
    </EntryShell>
  );
});

/**
 * The sheet's sr-only accessible name and description, per step, in one place (the shell's own
 * division of labour: the shell announces, the step renders). Pure and exported so the copy table
 * is readable as a table rather than as five nested ternaries inside JSX.
 */
export function entrySheetCopy(input: {
  holding: boolean;
  displayKey: string;
  reviewing: boolean;
  isDemo: boolean;
  eventName: string;
  hostName?: string | null;
  nameMode: GuestNameMode;
  uploadReason: string;
}): { title: string; description: string } {
  const {
    holding,
    displayKey,
    reviewing,
    isDemo,
    eventName,
    hostName,
    nameMode,
    uploadReason,
  } = input;
  if (holding) return { title: "You're in", description: "Opening the album." };
  if (displayKey.startsWith("name-")) {
    const mode: GuestNameMode = displayKey === "name-edit" ? "edit" : nameMode;
    const copy = guestNameCopy(mode, hostName);
    return { title: copy.title, description: copy.reason };
  }
  if (displayKey === "upload") {
    return { title: "Add your photos", description: uploadReason };
  }
  if (displayKey === "welcome" && !reviewing && isDemo) {
    return {
      title: "You're trying a live demo",
      description: "A real album, running exactly as a guest would see it.",
    };
  }
  if (reviewing || displayKey === "welcome" || displayKey === "welcome-review") {
    return {
      title: `Welcome to ${eventName}`,
      description: "A shared album for the whole event.",
    };
  }
  if (displayKey === "password") {
    return {
      title: `${eventName} is private`,
      description: "Enter the event password to view it.",
    };
  }
  // ★ THE GATE LINE, RESHAPED (2026-09-21): an account is not what is being asked for, a confirmed
  // address is, and the free account is what confirming makes.
  return {
    title: "See all the photos",
    description:
      "Confirm your email to see the full album and add your own photos.",
  };
}

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
// branding).
//
// ★ ONE PRIMARY, AND IT IS ALWAYS "CONTINUE" (Will, 2026-09-21, "No exit"). The welcome had two
// other exits: "View the album" when nothing followed, and a ghost "Just browsing" that dismissed
// to the teaser. Both are gone, because there is always something behind the welcome now (a name
// at the very least) and because the teaser is the reward being teased, not a lobby. His words:
// "Including 'just browsing' defeats this entire purpose of using the album to justify the name or
// email friction."
//
// The whole block staggers in on mount.
function WelcomeStep({
  eventName,
  hostName,
  eventDate,
  hostAvatarUrl,
  hostSeed,
  mediaTotal,
  continueLabel,
  onContinue,
}: {
  eventName: string;
  hostName?: string | null;
  eventDate?: string | null;
  hostAvatarUrl?: string | null;
  hostSeed?: string | null;
  mediaTotal?: number;
  /** Override for the review view ("Back to the password"). */
  continueLabel?: string;
  onContinue: () => void;
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
          {continueLabel ?? "Continue"}
        </Button>
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

      {/* ★ "LOOK AROUND" MOVED ONE STEP ON (the door as three steps, 2026-09-21): it is the
          DEMO's own skip on the upload step now, where looking around is actually the alternative
          being offered. Here the primary is the same "Continue" every guest's welcome carries. */}
      <div className="mt-auto flex flex-col gap-2">
        <Button onClick={onContinue} size="cta" className="w-full">
          Continue
        </Button>
        <Button asChild variant="ghost" className="w-full text-muted-foreground">
          <Link href="/">Start your own</Link>
        </Button>
      </div>
    </div>
  );
}
