"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { updateDisplayNameAction } from "@/app/(app)/account/actions";
import { DOOR_WEAR } from "@/components/auth/account-door";
import { AskStep } from "@/components/guest/door/ask-step";
import { chooserCopy, DoorChooser } from "@/components/guest/door/chooser";
import { DOOR_SCRIM, DoorCheck } from "@/components/guest/door/lit";
import { SigninStep, signinCopy } from "@/components/guest/door/signin-step";
import {
  DoorStage,
  RestWords,
  StageBeat,
  type StageDoor,
} from "@/components/guest/door/stage";
import { walkThrough, type Walk } from "@/components/guest/door/stage-walk";
import {
  SendingPicks,
  type WaitPick,
} from "@/components/guest/door/wait-picks";
import { WaitingDoor, WaitingStep } from "@/components/guest/door/waiting-step";
import { RoleWords, WelcomeWords } from "@/components/guest/door/welcome";
import { EntryShell, type DismissMode } from "@/components/guest/entry-shell";
import { EntryStepTransition } from "@/components/guest/entry-step-transition";
import {
  GuestNameStep,
  guestNameCopy,
  type GuestNameMode,
} from "@/components/guest/guest-name-step";
import { identifyCopy, IdentifyStep } from "@/components/guest/identify-step";
import { PasswordGate } from "@/components/guest/password-gate";
import {
  captureKeepNewsletter,
  KeepConfirm,
  keepCopy,
  KeepOffer,
} from "@/components/guest/save-account-prompt";
import { UploadStep, uploadStepReason } from "@/components/guest/upload-step";
import { Button } from "@/components/ui/button";
import type { GalleryAccess, GalleryGate } from "@/lib/events/gallery-access";
import { markPendingOffer } from "@/lib/guest/album-return";
import { claimAnonymousUploads } from "@/lib/guest/claim-uploads";
import {
  lastClaimPlayedMoment,
  reportConfirmBeat,
} from "@/lib/guest/confirm-beat";
import {
  computeDoor,
  doorBack,
  stageFaceOf,
  stepOpensAlbum,
  type DoorArrival,
  type DoorPath,
  type EntryStep,
  type StageFace,
} from "@/lib/guest/entry-steps";
import { joinEvent } from "@/lib/guest/join";
import { putDownKeepAsk } from "@/lib/guest/keep-ask";
import type { NameDoorMode } from "@/lib/guest/name-door";
import { ARRIVAL_BEAT_MS, useArrivalBeat } from "@/lib/guest/use-arrival-beat";
import { setLastName, setStoredName } from "@/lib/guest/use-stored-name";
import { useSuccessHold } from "@/lib/guest/use-success-hold";
import { useWelcomeSeen } from "@/lib/guest/use-welcome-seen";
import type { QueueItem } from "@/lib/guest/use-upload-queue";
import { useHydrated } from "@/lib/shared/use-hydrated";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/**
 * The invitation's first promise, in the album's own kinds: its home is the welcome at the doorway
 * (`door/welcome.tsx`); said here too for the readers that know it by this module.
 */
export { welcomeAddLine } from "@/components/guest/door/welcome";

/** How long a stage that has left stays drawn: its fade (`doorway.css`, 320ms) and a margin. */
const STAGE_EXIT_MS = 400;

/**
 * How long the album stands, once she has walked in, before a step the door still owes rises over it: the
 * arrival lands (the cover's words rising) and then the next ask comes, never on top of it.
 */
const SETTLE_AFTER_WALK_MS = 420;

/** A door the page drew nothing for (the tests' default, and a page with no arrival to say). */
const NO_ARRIVAL: DoorArrival = { face: null, scrim: false };

export type EntryModalHandle = {
  /** The teaser's "See all N" re-asserts the sheet at whatever step it is on. */
  openToGate: () => void;
  /**
   * THE EDIT DOOR, and only that. The join/profile modes are steps of the itinerary; "Change
   * name" in the album's menu is the one name door raised imperatively, and the one surface in this
   * whole sheet that a guest may close. `account` is the same door for a CONFIRMED account (the told
   * name's Change, `confirm-beat.ts`): it writes the profile's name, since a confirmed row carries
   * none of its own.
   */
  openToName: (mode: NameDoorMode, name?: string | null) => void;
};

/**
 * THE GUEST DOOR: THE DOORWAY, ONE HELD SHEET, THEN THE ALBUM. The welcome, the password when the
 * event has one, then who the guest is (on a name-only event the chooser: Continue as guest, Create
 * account or Log in; on a verification event one name-and-email screen confirmed by code), then the
 * first upload asked inside the sheet. The album is the reward held out for the guest's name or email
 * and their media: seen through the open door at the welcome, blurred behind the sheet after it.
 *
 * ★ THE DOOR IS THE PAGE (`locked-door` r2, Will's `family=doorway` and `shape=shared`). The steps a
 * guest reads AT the door stand on the stage as the doorway's own page (`door/stage.tsx`): the welcome
 * (the door open onto a Public album, shut at a gate), the ask (shut), the wait (ajar, with her choice
 * of what to add) and the moment she is let in (the door swinging the rest of the way). The steps that
 * ask something of her (the password, the chooser, the name, the email, Log in, the upload, the keep)
 * rise as the sheet: over the album at a Public album she has walked into, over the door at a gate she
 * is still outside, which keeps its state above them.
 *
 * ★ NO EXIT. A "Just browsing" row, or any other way around the door, would defeat the whole
 * purpose of using the album to justify the name or email friction.
 * Every step is HELD: no X, Escape and the backdrop inert. The one dismissible door left in this
 * file is the album menu's "Change name", which is opened from an album the guest is already
 * standing in and posts nothing when it closes.
 *
 * ★ THE ITINERARY IS DERIVED, NOT SEQUENCED. `computeDoor` (lib/guest/entry-steps.ts) takes the
 * server's decision and this browser's own facts (the way in picked at the chooser among them)
 * and answers an ordered list; the CURRENT step is always its first. The server steps (password,
 * identify) drop through the RSC's refresh; the client steps (chooser, name, upload) drop through
 * state here. There is no step counter to desync.
 *
 * ★ THE "YOU'RE IN" BEAT PLAYS ONCE, ON THE LAST STEP. Every other step hands forward with no
 * celebration, the way the welcome always has: three green checks on the way into one album would
 * be three lies about how much has been achieved.
 *
 * ★ THE KEYBOARD IS THE GUEST'S (door-flow's focus rules). No step autofocuses a field, and the
 * shell stops Radix from focusing one on open; focus moves only inside the guest's own tap or
 * Return; and a step change never unmounts a focused field (the field lets go first, and the step
 * container blurs one as a last resort). The sheet itself stands on the keyboard while a field is
 * focused (`use-keyboard-inset.ts`, through the responsive Sheet).
 */
export const EntryModal = forwardRef<
  EntryModalHandle,
  {
    qrToken: string;
    eventName: string;
    /** The server's decision for this render (re-derived from every poll upstream). */
    access: GalleryAccess;
    gate: GalleryGate | null;
    /**
     * The gate a newcomer stands at when the door, not the album, is what she meets (the doors,
     * event-settings r1): letting each person in, or an invite list. It words the email step and the
     * ask; null everywhere else.
     */
    doorGate?: "approve" | "invite" | null;
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
    /** Approved media count (numbers only) — the verification door's "N photos are
     *  waiting" tease + the welcome's count proof (a deliberate
     *  cardinality-only leak). */
    mediaTotal?: number;
    /** Welcome byline (null on locked pages: the redacted shellEvent). */
    hostName?: string | null;
    eventDate?: string | null;
    /** The success-hold signal for the page's REVEAL CURTAIN: the freshly
     *  mounted header/gallery wait at their pre-entrance state while the
     *  beat holds, then rise AS the sheet exits (event-experience). */
    onHoldingChange?: (holding: boolean) => void;
    /**
     * ★ THE WELCOME COMES FIRST: everyone without a guest name (unverified events) or a confirmed
     * email (verified events) is routed through the welcome flow, which approves the guest and only
     * then drops them off on the event page.
     * Whether this visitor still owes the door (a step pending, or the "You're in" beat still
     * holding), reported once hydrated and again on every change, so what an address asks for
     * (the reel's `?reel` and `?reel=screen`) waits until they are through. The owner never owes
     * it. Until the first report the page treats the door as owed.
     */
    onPendingChange?: (pending: boolean) => void;
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
      /**
       * The row also carries an UNCONFIRMED address (the door's optional
       * field). `emailAttached` is the device flag the guest's own menu
       * reads; `email` rides up IN MEMORY for this visit alone, to prefill the
       * offer card's door, and is never written to storage.
       */
      emailAttached: boolean;
      email: string | null;
    }) => void;
    /* ── the upload step's half of the lifted queue (event-experience owns it) ── */
    queue: readonly QueueItem[];
    capBytes?: number | null;
    /** Whether this album takes a video from a guest (the upload step's picker and line). */
    acceptsVideo?: boolean;
    onSend: (files: File[]) => void;
    onRetry: (id: string) => void;
    onDismissFailures: (ids: string[]) => void;
    /**
     * The door's upload step is the surface a run's failures belong to right now. The album's own
     * failure sheet stands down while it is, and a mid-run `verification_required` refreshes at
     * once instead of waiting for a sheet that is not there (see event-experience's own note).
     */
    onUploadStepActive?: (active: boolean) => void;
    /* ── the keep, the door's last screen (`guest-capture` r1; the page decides when it is due) ── */
    /** The ask to keep what she added is due (`computeDoor`'s rule 7). */
    keepDue?: boolean;
    /** Her photographs that landed this visit, which the ask counts (live). */
    keepCount?: number;
    /** The event holds uploads for the host, so what she sent is waiting rather than in. */
    keepHeld?: boolean;
    /**
     * The address typed under her name this visit, in memory only (the page's state), so the keep's
     * account door opens on it rather than asking twice.
     */
    hintEmail?: string | null;
    /** The keep was confirmed here: the page stops asking before the refresh lands. */
    onKeepAnswered?: () => void;
    /**
     * The door stands as the page (the stage is open, or walking through), reported before paint and
     * again on every change, so the page holds the album under it `inert` and its words back.
     */
    onStageChange?: (open: boolean) => void;
    /**
     * Her choice at the held door, for the page's queue to hold until the door lets her in
     * (`holdAtDoor`): never sent before.
     */
    onHold?: (files: File[]) => void;
    /** The page's word on the welcome: whether this request carried its cookie (`use-welcome-seen.ts`). */
    welcomeSeen?: boolean;
    /**
     * ★ WHAT THE PAGE'S FIRST BYTE DREW (`entry-steps.ts`'s `doorArrival`): the door's page standing from the
     * first byte, or the door's scrim over the album where a sheet step comes first. The door draws exactly
     * that on the server and in the hydration, and its own machine takes over after.
     */
    arrival?: DoorArrival;
    /** The album's cover for the open door's opening (`CoverPicture`), where she may see it. */
    view?: ReactNode;
    /** Where on the wheel the resting light starts its turn (the page draws one per visit). */
    phase?: number;
    /**
     * The page is still finding out who this browser is (its ticket heal, `event-experience.tsx`): the
     * sheet waits, the door's page stands.
     */
    healing?: boolean;
  }
>(function EntryModal(
  {
    qrToken,
    eventName,
    access,
    gate,
    doorGate = null,
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
    onHoldingChange,
    onPendingChange,
    sessionToken,
    storedName,
    onNamed,
    queue,
    capBytes,
    acceptsVideo = true,
    onSend,
    onRetry,
    onDismissFailures,
    onUploadStepActive,
    keepDue = false,
    keepCount = 0,
    keepHeld = false,
    hintEmail = null,
    onKeepAnswered,
    onStageChange,
    onHold,
    welcomeSeen = false,
    arrival = NO_ARRIVAL,
    view,
    phase,
    healing = false,
  },
  ref,
) {
  const router = useRouter();
  // The demo never persists "seen": every visit is fresh, even a returning one, so the hook
  // itself is told which visitor this is; and the page's word stands for the server and the hydration.
  const [seen, markSeen] = useWelcomeSeen(qrToken, isDemo, welcomeSeen);
  // THE EDIT DOOR's own open state: a SECOND door through the same shell rather than a step, and
  // the only free surface here (see the handle's comment). Its value is the door's mode: a guest's
  // row (`edit`) or a confirmed account's profile (`account`).
  const [editOpen, setEditOpen] = useState<NameDoorMode | null>(null);
  const [editPrefill, setEditPrefill] = useState<string | null>(null);
  // THE KEEP'S SECOND VIEW: Confirm your email opens the account door in this same sheet. Modal
  // state for this pass alone; the chevron goes back to the offer.
  const [keepConfirming, setKeepConfirming] = useState(false);
  /* ★ THE WAY IN, picked at the chooser. Modal state for this visit alone: going back to the
     chooser clears it and nothing persists it (entry-steps.ts's own note on `DoorPath`). */
  const [path, setPath] = useState<DoorPath | null>(null);
  /* ★ THE NAME TYPED ON A NAME-ONLY EVENT'S CREATE ACCOUNT (`identify`'s `create`), kept for the
     confirmation's four writes (a profile with no name takes it). A verification event's `identify`
     types none: there the email comes first and the name after, asked only of an account that has
     none (the door's `profile` name step). A magic-link round trip that loses it recovers as the
     `profile` mode, prefilled from `pr_guest_name_last`, or through the `door_name` the code request
     carried. */
  const [typedName, setTypedName] = useState<string | null>(null);
  // The OFF state's soft skip, once per pass. ON there is no skip to press, and `computeDoor`
  // ignores this flag entirely in that state so a stale one can never open an album.
  const [skipped, setSkipped] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  // The SHEET opens only AFTER hydration: it is the browser's own (the name this device typed, the way
  // in it picked), which no server render knows. The door's page is the server's (below).
  const hydrated = useHydrated();

  /* THE NAME THIS BROWSER HAS: a confirmed account's own profile name (a fact about the person, not a
     question for this album), else the per-event key a join wrote. ★ A CONFIRMED ACCOUNT'S NAME IS ITS
     PROFILE'S, NEVER A NAME THIS DEVICE TYPED AT SOME EARLIER DOOR: her photographs carry the profile's
     name, so an account with none is asked for one (Will, 2026-10-02: the name after the email, asked
     only of an account that has none), whatever an old ticket's name says. */
  const hasName = isVerified ? hasProfileName : Boolean(storedName);

  const { steps, autoOpen } = computeDoor({
    gate,
    access,
    hasContributed,
    uploadsOpen,
    requireUpload,
    welcomeSeen: seen,
    hasName,
    isVerified,
    path,
    contributed,
    skipped,
    returning,
    isOwner,
    isDemo,
    keepDue,
  });
  const current: EntryStep | null = steps[0] ?? null;
  // ★ "YOU'RE IN" ONLY WHERE THE ALBUM IS BEHIND THE STEP: at a gate the host answers, confirming an
  // email or asking leads to the held door, so the beat waits for the door itself to open.
  const isLastStep = steps.length === 1 && stepOpensAlbum({ access, gate });

  /* WHICH NAME IS BEING ASKED FOR. A confirmed account with no profile name writes the PROFILE;
     everyone else (Continue as guest) joins under it. */
  const nameMode: GuestNameMode =
    isVerified && !hasProfileName ? "profile" : "join";

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
  // THE SUCCESS HOLD: the step whose exit is the album fires
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
  /* ★ THE WALK THROUGH THE DOOR (locked-door r3, `reveal=through`; `door/stage-walk.ts`): where the door is
     open onto the album (a Public album's welcome, the moment she is let in), she does not watch it fade,
     she walks through it onto the album's cover. While she walks, the stage holds its last face and the
     sheet waits; once she has arrived the stage goes in a breath, and a step the door still owes rises
     only after the album has stood a moment (`SETTLE_AFTER_WALK_MS`). */
  const [walk, setWalk] = useState<"welcome" | "beat" | null>(null);
  const [walked, setWalked] = useState(false);
  const [settling, setSettling] = useState(false);
  useEffect(() => {
    if (!settling) return;
    const id = setTimeout(() => setSettling(false), SETTLE_AFTER_WALK_MS);
    return () => clearTimeout(id);
  }, [settling]);
  const onWalked = useCallback(() => {
    setWalk(null);
    setWalked(true);
    setSettling(true);
  }, []);
  // The stage's own box, and the walk running through it (the compositor's from its first frame).
  const stageEl = useRef<HTMLDivElement>(null);
  const running = useRef<Walk | null>(null);
  /** The last walk that arrived: one whose own work comes after it (`Walk.started`) must not walk it again. */
  const arrived = useRef<Walk | null>(null);
  /** Walk through the stage's open door now; null where it cannot be walked (the stage then fades). */
  const startWalk = useCallback((): Walk | null => {
    const el = stageEl.current;
    const run = el ? walkThrough(el) : null;
    if (!run) return null;
    running.current = run;
    run.done.then(
      () => {
        arrived.current = run;
        if (running.current === run) onWalked();
      },
      () => {},
    );
    return run;
  }, [onWalked]);
  // ★ A WALK THAT ARRIVED KEEPS ITS LAST FRAME while the stage goes in its breath (`walked`); it lets go of
  // its frames only when the door opens again (a review of the welcome stands as itself) or goes away.
  useEffect(
    () => () => {
      running.current?.cancel();
      running.current = null;
    },
    [],
  );
  const walkedBefore = useRef(walked);
  useLayoutEffect(() => {
    if (walkedBefore.current && !walked && running.current) {
      running.current.cancel();
      running.current = null;
    }
    walkedBefore.current = walked;
  }, [walked]);
  // The door she waited at opened (the beat), and the refresh has brought the album under it: she walks
  // through it the moment the beat lets go, rather than watching the door fade.
  const beatNow = holding && heldStep === "waiting";
  const [beatWas, setBeatWas] = useState(beatNow);
  if (beatNow !== beatWas) {
    setBeatWas(beatNow);
    if (!beatNow && access !== "none") setWalk("beat");
  }
  useLayoutEffect(() => {
    if (walk !== "beat" || running.current) return;
    // A door that cannot be walked through (reduced motion, nothing measured) fades where it stood.
    if (!startWalk()) void Promise.resolve().then(onWalked);
  }, [walk, startWalk, onWalked]);

  // And whether the door is still owed (see the prop's own note), walking through it included. Hydrated
  // only: the page treats the door as owed until it hears, so a `?reel` never opens under a door.
  const pending = current !== null || holding || walk !== null;
  useEffect(() => {
    if (!hydrated) return;
    onPendingChange?.(pending);
  }, [hydrated, pending, onPendingChange]);
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
  // A newcomer's email step at a gate the host answers or a list keeps, whose join decides the beat.
  const atDoorEmail =
    steps.length === 1 && access === "none" && gate === "account";

  // The door's steps open after hydration and the arrival beat; the ticket heal and an arrival still
  // settling (`walk`) hold the sheet a moment more. The door's own page does not wait (below).
  const open =
    (hydrated &&
      current !== null &&
      (!autoOpen || beatReady) &&
      !healing &&
      !settling) ||
    holding ||
    // The edit door, ORed in: it opens over an album with no step pending at all.
    (hydrated && editOpen !== null);

  /* THE BACK AFFORDANCE (`doorBack`, entry-steps.ts): the welcome and the name are transient
     client VIEWS over the derived machine (markSeen and the steps untouched); the chooser is a
     real input, so going back to it clears the pick. Views reset when the FLOW advances (the
     sanctioned adjust-state-during-render pattern), and a step change caused by going back to the
     chooser keeps the backward direction. */
  const [backView, setBackView] = useState<"welcome" | "name" | null>(null);
  const [direction, setDirection] = useState<"fwd" | "back">("fwd");
  const [goingBack, setGoingBack] = useState(false);
  const [prevStep, setPrevStep] = useState(current);
  if (current !== prevStep) {
    setPrevStep(current);
    setBackView(null);
    // The keep's confirm view belongs to the keep: leaving the step (a dismissal, an answer)
    // leaves it too, so a later keep opens on its offer.
    setKeepConfirming(false);
    setDirection(goingBack ? "back" : "fwd");
    if (goingBack) setGoingBack(false);
  }
  const back = doorBack({ current, path, gate, isVerified, isDemo });
  const reviewing = backView !== null && current !== null && !holding;

  /** Rule 4: a step change never unmounts a focused field; the field inside the sheet lets go. */
  const letGo = useCallback(() => {
    const active = document.activeElement;
    if (active instanceof HTMLElement && sheetRef.current?.contains(active)) {
      active.blur();
    }
  }, []);

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
      openToName: (mode, name) => {
        if (holding || isDemo) return;
        // The name being changed, when the caller knows it better than this device's stored one
        // (the told name is the ACCOUNT's, which may not be what was typed here).
        setEditPrefill(name?.trim() || null);
        setEditOpen(mode);
      },
    }),
    [holding, isDemo],
  );

  /* ────────────────────────────────────────────────────────────────────────
     WHAT HAPPENS THE INSTANT A CODE CONFIRMS (identify and Log in share it).

     The steps cannot own this: a name-only event's Create account (`identify`'s `create`) holds a NAME
     that has never been sent anywhere, and the order the four writes happen in is the whole difference
     between a guest who lands named and one whose photographs carry no name. So both steps take a plain
     callback and the sequence is the modal's:

       1. claim this browser's anonymous uploads onto the freshly confirmed account;
       2. join, VERIFIED and nameless (create_guest nulls a typed name beside a confirmed
          account, so sending one would be asking to have it thrown away);
       3. read this account's OWN profile row for a display name;
       4. when there is none and a name was typed at the door, write it as the profile name;
       5. hold the beat (when the album is directly behind), then refresh.

     ★ THE ACCOUNT'S NAME WINS. A confirmed viewer whose profile already says "Priya" is credited
     as Priya even if they typed "P" at Create account a minute ago: one person, one name, and the
     identify step says so under the name field before they confirm. ★ WHERE VERIFICATION IS
     REQUIRED NOTHING IS TYPED BEFORE THE CODE (Will, 2026-10-02: "handle name after so we aren't
     handling two different versions for every new event on that account"): the account a code reaches
     keeps its own name, and an account with none is asked for one by the door's next step, as its own
     (the name step's `profile` mode), once.

     ★ AND THEN SHE IS TOLD (`guest-capture` r1, Will's `name=told`): the name her photographs now
     carry, whenever she typed one at this door, whichever name won. Told once, with whatever the
     claim carried from other events, by the page when the door has closed (`confirm-beat.ts`),
     never as a second or third toast in the same beat.

     The whole sequence runs UNDER the hold, so a guest sees one beat rather than four flickers.
     ──────────────────────────────────────────────────────────────────────── */
  const handleEmailVerified = useCallback(async () => {
    // Blur FIRST so the iOS keyboard retracts during the success beat, never mid-exit.
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    handleUnlocked();
    const claimed = await claimAnonymousUploads({ silent: true });

    const joined = await joinEvent({ qrToken });
    const mintedToken = joined.ok ? joined.guest.sessionToken : null;
    // ★ AT A DOOR'S EMAIL STEP THE JOIN DECIDES THE BEAT: an address the invite list names comes
    // straight in ("You're in", then the album); where the host lets each guest in, the join is the
    // ask, and the refresh lands on the held door with no beat (nor for an address the list does not
    // name, whose refresh lands on the shut door's ask).
    if (atDoorEmail && joined.ok && joined.guest.admission === "in") {
      onUnlocked();
    }

    let landedName: string | null = null;
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // The viewer's OWN row, by their own id: RLS scopes it and nothing else is read.
        // DELIBERATE SWALLOW: a failed name read costs the credit line for one refresh, never
        // the entry (the catch below says the same thing about a throw). The guest is confirmed
        // and joined either way, and the poll's own truth lands a tick later.
        // eslint-disable-next-line partyreel/no-swallowed-db-error
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
      // A confirmed account has no pending address by construction: the RPC
      // nulls `pending_email` beside a confirmed session, and the claim is what
      // moves an old one onto the account.
      emailAttached: false,
      email: null,
    });
    // The beat, unless the claim played the follow moment (a confirm door opened here earlier left
    // its marker), whose card says all of it. Log in types no name, so it tells none.
    if (!lastClaimPlayedMoment(qrToken)) {
      const told = typedName ? landedName : null;
      const elsewhere = claimed?.elsewhere ?? 0;
      if (told || elsewhere > 0) {
        reportConfirmBeat({ album: qrToken, name: told, elsewhere });
      }
    }
    router.refresh();
  }, [
    atDoorEmail,
    handleUnlocked,
    onNamed,
    onUnlocked,
    qrToken,
    router,
    typedName,
  ]);

  /* ────────────────────────────────────────────────────────────────────────
     THE KEEP, CONFIRMED: the claim is the whole keep (her uploads, and this event with them, become
     the account's), so it is AWAITED before anything redraws, then the newsletter she switched on
     here, then the page stops asking and refreshes onto her confirmed self. The door wrote the
     album's return marker when the confirm opened, so the claim plays the follow moment on the
     album: its card says what she keeps, the other events, the host to follow and the name she is
     now on as. Only a claim that somehow played no moment reports a beat of its own.
     ──────────────────────────────────────────────────────────────────────── */
  const handleKeepVerified = useCallback(
    async ({ newsletter }: { newsletter: boolean }) => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      const claimed = await claimAnonymousUploads({ silent: true });
      if (newsletter) await captureKeepNewsletter(sessionToken ?? null);
      if (!lastClaimPlayedMoment(qrToken)) {
        // The page settles the name her photos now carry and says it once (`confirm-beat.ts`).
        reportConfirmBeat({
          album: qrToken,
          name: null,
          elsewhere: claimed?.elsewhere ?? 0,
          settle: true,
        });
      }
      onKeepAnswered?.();
      router.refresh();
    },
    [onKeepAnswered, qrToken, router, sessionToken],
  );

  // THE HELD VIEW + EXIT LATCH: while a PASSWORD hold plays, the gate stays
  // PLANTED and its own button morphs green (an in-place success - no step
  // swap); every other hold shows the SuccessStep. While the shell is
  // closed/exiting, the LAST open-state view stays latched so the sheet never
  // deflates to an empty strip mid-exit (the step content would otherwise
  // unmount in the same commit that starts the close).
  const stepKey = holding
    ? heldStep === "password"
      ? "password"
      : "success"
    : editOpen !== null
      ? "name-edit"
      : reviewing
        ? backView === "name"
          ? `name-${nameMode}`
          : "welcome-review"
        : current === "name"
          ? `name-${nameMode}`
          : current === "keep"
            ? keepConfirming
              ? "keep-confirm"
              : "keep"
            : (current ?? "none");
  const [lastKey, setLastKey] = useState(stepKey);
  if (open && stepKey !== lastKey) setLastKey(stepKey);
  const displayKey = open ? stepKey : lastKey;
  // The edit door's mode, latched the same way, so a door that is leaving keeps the mode it opened in.
  const [editMode, setEditMode] = useState<NameDoorMode>("edit");
  if (editOpen !== null && editOpen !== editMode) setEditMode(editOpen);

  /* ────────────────────────────────────────────────────────────────────────
     THE STAGE: WHICH OF THE DOOR'S STEPS STAND AS ITS PAGE (`locked-door` r2, `shape=shared`).

     The steps a guest reads AT the door are the doorway's own page: the welcome (the demo's role
     step too), the ask, the wait, and the moment the door she waited at opens (`beat`). At a gate,
     every other step rises as the sheet over the door at rest (`rest`), which keeps the state above
     it: shut while she is outside, swinging open on a step's own success. At a Public album she has
     walked through the open door, so the steps after the welcome rise over the album, as ever.

     ★ ONLY A STAGE THAT HAS OPENED IS DRAWN, and it stays drawn while it leaves (its last words and door
     latched, as the sheet's are), so it fades where it stood and its words rise afresh each time it opens.

     ★ THE DOOR'S PAGE IS THE SERVER'S, SO IT IS THE FIRST BYTE (door-reveal; Will's rule: "the album is
     never visible before any door/gate that should be encountered first"). A face the machine stands on
     by itself (the welcome, the ask, the wait, a gate's door at rest) is decided from what the server knows,
     so it is drawn in the page's own HTML and the hydration, open from the first frame with no beat and no
     fade (`first`); only the sheet's steps, the browser's own, wait for hydration and the arrival beat.
     ──────────────────────────────────────────────────────────────────────── */
  const face: StageFace | null =
    editOpen !== null
      ? null
      : holding && heldStep === "waiting"
        ? "beat"
        : displayKey === "welcome" || displayKey === "welcome-review"
          ? isDemo
            ? "role"
            : "welcome"
          : displayKey === "waiting" || displayKey === "ask"
            ? displayKey
            : access === "none" && (current !== null || holding)
              ? "rest"
              : null;
  // ★ WHAT THE DOOR SHOWS IS HER ACCESS'S ANSWER: the album's light and the album through the opening
  // only where she may see it (a Public album's welcome, the moment she is let in); the house five at a
  // gate, where the page has nothing of the album to show.
  const stageDoor: StageDoor =
    face === "beat"
      ? { state: "open", album: true, from: "ajar" }
      : face === "role" || (face === "welcome" && access !== "none")
        ? { state: "open", album: true }
        : face === "waiting" || (face === "rest" && gate === "waiting")
          ? { state: holding ? "open" : "ajar", album: false, from: "ajar" }
          : face === "rest" && holding
            ? { state: "open", album: false }
            : { state: "shut", album: false };
  // The machine's own face: the one the server drew, standing with no beat and no hydration to wait for.
  const machineFace = stageFaceOf({ current, access, isDemo });
  const stageOpen =
    walk !== null || (face !== null && (face === machineFace || open));
  const [stage, setStage] = useState<{
    face: StageFace;
    door: StageDoor;
    /** How many times the stage has opened: its words rise afresh each time. */
    opened: number;
  } | null>(() =>
    stageOpen && face !== null ? { face, door: stageDoor, opened: 1 } : null,
  );
  // Whether the page's first byte drew the stage: that one arrives with no fade of its own.
  const [drawnFirst] = useState(() => stageOpen && arrival.face !== null);
  // The sanctioned adjust-state-during-render pattern (the step latch's own): what the stage shows is
  // latched while it is open (and while she walks through it), and counted each time it opens.
  const [stageWasOpen, setStageWasOpen] = useState(stageOpen);
  const reopened = stageOpen && !stageWasOpen;
  if (stageOpen !== stageWasOpen) setStageWasOpen(stageOpen);
  if (reopened && walked) setWalked(false);
  if (
    stageOpen &&
    walk === null &&
    face !== null &&
    (reopened ||
      stage === null ||
      stage.face !== face ||
      stage.door.state !== stageDoor.state ||
      stage.door.album !== stageDoor.album ||
      stage.door.from !== stageDoor.from)
  ) {
    setStage({
      face,
      door: stageDoor,
      opened: (stage?.opened ?? 0) + (reopened ? 1 : 0),
    });
  }
  // A stage that has left goes once its fade has played (`doorway.css`'s 320ms), so nothing of a door she
  // walked through lingers in the page (its words, its photographs, its light still drifting).
  useEffect(() => {
    if (stageOpen || stage === null) return;
    const gone = setTimeout(() => setStage(null), STAGE_EXIT_MS);
    return () => clearTimeout(gone);
  }, [stageOpen, stage]);
  // The sheet rises for every step that is not the stage's alone (a gate's steps over the door at rest),
  // never while she is walking through the door.
  const sheetOpen = open && walk === null && (face === null || face === "rest");

  /* ★ THE DOOR'S SCRIM FROM THE FIRST BYTE (`arrival.scrim`): where a sheet step comes first (the email
     step past the welcome, the name, the first photo), the page drew the album behind the door's own scrim,
     never bare, and the sheet rises into it: the moment its own scrim stands, this one hands over with no
     fade of either. Where the browser turns out to owe nothing (the server's guess at a name it could not
     see), it lifts off the album. */
  const [firstScrim, setFirstScrim] = useState<"up" | "lifting" | null>(
    arrival.scrim ? "up" : null,
  );
  const scrimOwed =
    current !== null || holding || (hydrated && editOpen !== null);
  // In the render that opens the sheet, so the two scrims trade places inside one commit, before paint:
  // the sheet's own scrim then arrives standing (`arriving`), never fading in over this one's going.
  const [handedOver, setHandedOver] = useState(false);
  if (firstScrim === "up") {
    if (sheetOpen) {
      setFirstScrim(null);
      setHandedOver(true);
    } else if (hydrated && !healing && !scrimOwed) setFirstScrim("lifting");
  }
  if (handedOver && !sheetOpen) setHandedOver(false);
  useEffect(() => {
    if (firstScrim !== "lifting") return;
    const gone = setTimeout(() => setFirstScrim(null), STAGE_EXIT_MS);
    return () => clearTimeout(gone);
  }, [firstScrim]);
  // The sheet's own exit latch: a sheet leaving for the stage keeps the step it showed until it is gone.
  const [lastSheetKey, setLastSheetKey] = useState(displayKey);
  if (sheetOpen && displayKey !== lastSheetKey) setLastSheetKey(displayKey);
  const sheetKey = sheetOpen ? displayKey : lastSheetKey;

  // Tell the page before it paints: it holds the album `inert` under an open stage (and its words back
  // while she walks through), and its header off the cover.
  useLayoutEffect(() => {
    onStageChange?.(stageOpen);
  }, [stageOpen, onStageChange]);
  useLayoutEffect(() => () => onStageChange?.(false), [onStageChange]);

  /* ★ THE DISMISSABILITY TABLE IS ONE ROW. "No exit": every step of the door is HELD, so there
     is no X, and Escape and the backdrop do nothing. The one free surface is the album
     menu's "Change name", which sits over an album the guest already reached and posts nothing when
     it closes. A closed/exiting shell is held too, so affordances cannot pop in mid-exit. */
  const dismissMode: DismissMode =
    open && editOpen !== null && !holding ? "free" : "held";

  // Fired by the shell ONLY for a user dismissal of a "free" surface, which is the edit door alone.
  function handleDismiss() {
    if (holding) return; // defense in depth; the hold is never dismissable
    setEditOpen(null);
  }

  function continueFromWelcome() {
    // ★ AT A PUBLIC ALBUM SHE WALKS THROUGH (`reveal=through`): the welcome's door is open onto the
    // album's cover, so her Continue is the walk, and the stage holds until she has arrived. ★ THE WALK
    // STARTS IN HER PRESS, BEFORE THE PAGE DOES ANY WORK OF ITS OWN: it is the compositor's from its first
    // frame, and the page's re-render for the welcome seen (the cookie, the steps after it, the album's own
    // listeners) waits for that frame, so no render ever stands between her press and the first stride. At a
    // gate the door is shut, and the next step simply rises over it.
    // A second press while she walks is the same press (the stage takes none once the walk is the page's).
    if (running.current && arrived.current !== running.current) return;
    const run =
      walk === null &&
      !running.current &&
      stage?.door.album &&
      stage.door.state === "open"
        ? startWalk()
        : null;
    if (run) {
      void run.started.then(() => {
        // Still walking, the stage holds until she has arrived; a walk that arrived first (a tab put away
        // mid-walk runs no frames) is not walked again, and the stage goes.
        if (running.current === run && arrived.current !== run) {
          setWalk("welcome");
        }
        markSeen();
      });
      return;
    }
    markSeen();
  }

  function goBack() {
    letGo();
    if (displayKey === "keep-confirm") {
      // The keep's own second view: back to the offer, whose face carries Maybe later.
      setDirection("back");
      setKeepConfirming(false);
      return;
    }
    if (back === "chooser") {
      // A real change of input: the pick clears, and the chooser arrives from the left.
      setGoingBack(true);
      setPath(null);
      return;
    }
    if (back) {
      setDirection("back");
      setBackView(back);
    }
  }

  const nameStepNode = (
    <GuestNameStep
      qrToken={qrToken}
      mode={displayKey === "name-edit" ? editMode : nameMode}
      hostName={hostName}
      storedName={
        displayKey === "name-edit" && editPrefill ? editPrefill : storedName
      }
      sessionToken={sessionToken}
      onNamed={(result) => {
        if (displayKey === "name-edit") {
          setEditOpen(null);
          onNamed?.({ ...result, source: "edit" });
          return;
        }
        // A real row (or profile) carries the name now: the caller adopts the session, and the
        // machine advances on the stored name the step just wrote (no refresh: the next step is
        // in this sheet).
        setBackView(null);
        onNamed?.({ ...result, source: "step" });
      }}
      onVerificationRequired={() => {
        // The host turned Require verified emails ON while this guest stood at the door. The name
        // is worth nothing now, so the page's own refresh re-gates to `identify`, which is the
        // honest surface for what just changed.
        setEditOpen(null);
        router.refresh();
      }}
    />
  );

  const sheetCopy = entrySheetCopy({
    holding,
    displayKey: sheetKey,
    eventName,
    hostName,
    nameMode,
    editMode,
    verification: gate === "account",
    doorGate,
    mediaTotal,
    keepCount,
    uploadReason: uploadStepReason({
      isDemo,
      requireUpload,
      albumEmpty,
    }),
  });
  // The keep's confirm view has a way back to its offer; every other step's is the machine's.
  const showBack =
    sheetKey === "keep-confirm" ||
    (Boolean(back) && !reviewing && !holding && editOpen === null);

  // What she chose while she waited: the page's queue, held (and going in once she is let in).
  const heldPicks: WaitPick[] = queue.filter((it) => it.status !== "error");

  /** The words on the stage, per face (a closed stage keeps its last ones, inert, while it leaves). */
  function stageWords(shown: StageFace): React.ReactNode {
    switch (shown) {
      case "welcome":
        return (
          <WelcomeWords
            eventName={eventName}
            hostName={hostName}
            eventDate={eventDate}
            mediaTotal={mediaTotal}
            acceptsVideo={acceptsVideo}
            onContinue={
              reviewing
                ? () => {
                    setDirection("fwd");
                    setBackView(null);
                  }
                : continueFromWelcome
            }
          />
        );
      case "role":
        return (
          <RoleWords
            eventName={eventName}
            hostName={hostName}
            onContinue={
              reviewing
                ? () => {
                    setDirection("fwd");
                    setBackView(null);
                  }
                : continueFromWelcome
            }
          />
        );
      case "ask":
        return (
          <AskStep
            qrToken={qrToken}
            hostName={hostName}
            onAsked={(guest) => {
              // The waiting ticket the ask minted, adopted the way the confirmation's own join is;
              // the refresh lands on the held door, and the door swings ajar.
              onNamed?.({
                sessionToken: guest.sessionToken,
                displayName: "",
                source: "verified",
                emailAttached: false,
                email: null,
              });
              router.refresh();
            }}
          />
        );
      case "waiting":
        // THE HELD DOOR (`waiting=held`): it checks in about every 30 s and opens by itself the moment
        // the host lets her in; any other change to the door refreshes onto whatever the server now
        // says. ★ Only while it stands: a stage leaving keeps the face and stops the check-in.
        return stageOpen ? (
          <WaitingStep
            qrToken={qrToken}
            sessionToken={sessionToken ?? null}
            hostName={hostName}
            onLetIn={() => {
              handleUnlocked();
              router.refresh();
            }}
            onMoved={() => router.refresh()}
            picks={heldPicks}
            onPick={onHold}
            acceptsVideo={acceptsVideo}
          />
        ) : (
          <WaitingDoor
            hostName={hostName}
            picks={heldPicks}
            acceptsVideo={acceptsVideo}
          />
        );
      case "beat":
        return (
          <StageBeat
            slow={slow}
            stalled={stalled}
            onRetry={() => router.refresh()}
            sending={
              heldPicks.length > 0 ? (
                <SendingPicks picks={heldPicks} />
              ) : undefined
            }
          />
        );
      case "rest":
        // ★ THE DOOR AT REST, AS THE PAGE'S FIRST BYTE DRAWS IT: the album's name and what it holds under
        // the shut door, until the sheet rises over it and says everything (the album's name among it);
        // the doorway then keeps its state above the sheet, shut, or swinging open on the step's success.
        return sheetOpen ? null : (
          <RestWords eventName={eventName} mediaTotal={mediaTotal} />
        );
    }
  }

  return (
    <>
      {stage && (
        <DoorStage
          open={stageOpen}
          at={access === "none" ? "gate" : "album"}
          door={stage.door}
          focusKey={`${stage.face}-${stage.opened}`}
          first={drawnFirst && stage.opened === 1}
          view={view}
          phase={phase}
          walk={walk !== null}
          walked={walked}
          stageRef={(el) => {
            stageEl.current = el;
          }}
          // A gate's step of the sheet stands beside the door at a desk.
          aside={stage.face === "rest" && sheetOpen}
          back={
            stage.face === "ask" && showBack ? (
              <button
                type="button"
                aria-label="Back to the welcome"
                onClick={goBack}
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ChevronLeft className="size-5" />
              </button>
            ) : undefined
          }
        >
          <div
            key={`${stage.face}-${stage.opened}`}
            className="flex w-full flex-col items-center"
          >
            {stageWords(stage.face)}
          </div>
        </DoorStage>
      )}
      {firstScrim && (
        // The door's scrim the page's first byte drew over the album (`arrival.scrim`): the sheet's own
        // look, so the sheet rises into it and takes its place.
        <div
          aria-hidden
          data-door-first-scrim={firstScrim}
          className={cn(
            "fixed inset-0 z-50 transition-opacity duration-300 ease-emphasis",
            DOOR_SCRIM,
            firstScrim === "lifting" && "opacity-0",
          )}
        />
      )}
      {hydrated && renderSheet()}
    </>
  );

  /** THE SHEET: the browser's own steps, after hydration (the door's page above is the server's). */
  function renderSheet() {
    return (
      <EntryShell
        ref={sheetRef}
        open={sheetOpen}
        arriving={handedOver}
        dismissMode={dismissMode}
        onDismiss={handleDismiss}
        title={sheetCopy.title}
        // ALBUM, NOT GALLERY: the site, the app and the reel all say album, so
        // the guest's phone says it too.
        // One noun for one object, because a guest who becomes a host meets both
        // words. The CODE noun deliberately stays "gallery" (/api/guests/
        // gallery, gallery-access, the RPCs): renaming a live route buys a guest
        // nothing and risks the one flow with no account behind it.
        description={sheetCopy.description}
        // The lamp blooms on "You're in" (the success beat, and the password's in-place morph), and
        // rests while a stalled beat offers its retry. ★ The keep rests too, though the board draws
        // its "Sent" blooming: its words stand at the sheet's top, where a bloom's wash reads 2:1 in
        // dark (`lit.css`); "You're in" stands below it. The keep's own lit check is its beat.
        lamp={holding && !stalled ? "bloom" : "base"}
        // ★ Over the door at a gate, a light dim and no blur: the doorway keeps its state above the
        // sheet. Over the album, the door's own scrim, the album blurred as the reward.
        scrim={stage?.face === "rest" && stageOpen ? "door" : "album"}
      >
        {/* ★ "YOU'RE IN" ARRIVES IN PLACE (`beat=lit`): its check blooms and its words reveal where
            the step stood, and the step it replaces fades there, rather than one more slide from
            the right (the text reveal and the side-by-side move never stack: door.css). */}
        <EntryStepTransition
          stepKey={sheetKey}
          direction={sheetKey === "success" ? "place" : direction}
        >
          <div className="relative pt-1">
            {sheetKey === "success" && (
              <SuccessStep
                slow={slow}
                stalled={stalled}
                onRetry={() => router.refresh()}
              />
            )}
            {/* The chevron back to the step behind this one (the guest can always re-read what
                this is) - hidden while the success beat plays, and on the edit door, which has a
                real X of its own. */}
            {showBack && (
              <button
                type="button"
                aria-label={
                  sheetKey === "keep-confirm"
                    ? "Back to keeping your photos"
                    : back === "name"
                      ? "Back to your name"
                      : back === "chooser"
                        ? "Back to how you join"
                        : "Back to the welcome"
                }
                onClick={goBack}
                className="absolute top-0 left-0 z-10 flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ChevronLeft className="size-5" />
              </button>
            )}
            {(sheetKey === "name-join" ||
              sheetKey === "name-edit" ||
              sheetKey === "name-profile") && (
              <div className={sheetKey === "name-edit" ? undefined : "pt-7"}>
                {nameStepNode}
              </div>
            )}
            {/* pt-7 clears the absolute back chevron's row so it never
                overlaps the centered gate heading (long event names). The gate
                stays MOUNTED through the password hold + the exit (the latch
                keeps sheetKey "password"), so its in-place morph rides the
                whole choreography on one instance. */}
            {sheetKey === "password" && (
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
            {sheetKey === "chooser" && (
              <div className="pt-7">
                <DoorChooser
                  onPick={(picked) => {
                    setDirection("fwd");
                    setPath(picked);
                  }}
                />
              </div>
            )}
            {sheetKey === "identify" && (
              <div className="pt-7">
                <IdentifyStep
                  qrToken={qrToken}
                  verification={gate === "account"}
                  door={access === "none" ? doorGate : null}
                  hostName={hostName}
                  mediaTotal={mediaTotal}
                  storedName={storedName}
                  onTypedName={setTypedName}
                  onVerified={handleEmailVerified}
                />
              </div>
            )}
            {sheetKey === "signin" && (
              <div className="pt-7">
                <SigninStep
                  qrToken={qrToken}
                  onVerified={handleEmailVerified}
                />
              </div>
            )}
            {sheetKey === "upload" && (
              <div className="pt-7">
                <UploadStep
                  isDemo={isDemo}
                  requireUpload={requireUpload}
                  albumEmpty={albumEmpty}
                  capBytes={capBytes}
                  acceptsVideo={acceptsVideo}
                  queue={queue}
                  onSend={onSend}
                  onRetry={onRetry}
                  onDismiss={onDismissFailures}
                  /* ★ THE SKIP EXISTS ONLY IN THE OFF STATE, and it is a GHOST: a host who did not
                     ask for a photograph is not owed one, and a guest who came for the album gets
                     it. ON there is no skip at all, which is the switch's whole meaning. Never
                     marks the welcome seen (the demo's own hook already never persists it): a
                     markSeen() here would turn a demo visitor into a "returning" one, when every
                     demo visit is meant to start fresh. */
                  onSkip={
                    requireUpload
                      ? undefined
                      : () => {
                          setSkipped(true);
                        }
                  }
                  onContinueWithout={() => router.refresh()}
                />
              </div>
            )}
            {/* THE KEEP, the door's last screen: no chevron on its offer (what it follows is done),
                and the account door in this same sheet behind its Confirm. */}
            {sheetKey === "keep" && (
              <KeepOffer
                count={keepCount}
                held={keepHeld}
                hostName={hostName}
                eventName={eventName}
                onConfirm={() => {
                  // BEFORE the account door shows: Google and a magic link leave the page, and the
                  // marker is what plays the follow moment when they come back.
                  markPendingOffer(qrToken);
                  setDirection("fwd");
                  setKeepConfirming(true);
                }}
                onLater={() => {
                  // Put down for this event on this device; the door closes onto the album.
                  putDownKeepAsk(qrToken);
                }}
              />
            )}
            {sheetKey === "keep-confirm" && (
              <div className="pt-7">
                <KeepConfirm
                  qrToken={qrToken}
                  hintEmail={hintEmail}
                  onVerified={handleKeepVerified}
                />
              </div>
            )}
          </div>
        </EntryStepTransition>
      </EntryShell>
    );
  }
});

/**
 * The sheet's sr-only accessible name and description, per step, in one place (the shell's own
 * division of labour: the shell announces, the step renders). Pure and exported so the copy table
 * is readable as a table rather than as nested ternaries inside JSX. ★ Only the sheet's own steps: the
 * welcome, the ask and the wait stand on the stage (`door/stage.tsx`), named by their own headlines.
 */
export function entrySheetCopy(input: {
  holding: boolean;
  displayKey: string;
  eventName: string;
  hostName?: string | null;
  nameMode: GuestNameMode;
  /** The edit door's mode (a guest's row, or a confirmed account's profile). */
  editMode?: NameDoorMode;
  /** A verification event (its `identify` sells the album with the host's reason). */
  verification: boolean;
  /** The gate a newcomer stands at (the email step's and the ask's words). */
  doorGate?: "approve" | "invite" | null;
  mediaTotal?: number;
  /** Her photographs that landed this visit (the keep's count). */
  keepCount?: number;
  uploadReason: string;
}): { title: string; description: string } {
  const {
    holding,
    displayKey,
    eventName,
    hostName,
    nameMode,
    editMode = "edit",
    verification,
    doorGate = null,
    mediaTotal,
    keepCount = 0,
    uploadReason,
  } = input;
  if (holding) return { title: "You're in", description: "Opening the album." };
  if (displayKey.startsWith("name-")) {
    const mode: GuestNameMode =
      displayKey === "name-edit" ? editMode : nameMode;
    const copy = guestNameCopy(mode, hostName);
    return { title: copy.title, description: copy.reason };
  }
  if (displayKey === "upload") {
    return { title: "Add your photos", description: uploadReason };
  }
  if (displayKey === "keep") {
    const copy = keepCopy(keepCount, eventName);
    return { title: copy.title, description: copy.reason };
  }
  if (displayKey === "keep-confirm") {
    return {
      title: DOOR_WEAR.keep.heading,
      description: DOOR_WEAR.keep.reason,
    };
  }
  if (displayKey === "password") {
    // The gate's own heading, word for word (voice-guest r1 `ask=warm`, `password-gate.tsx`): a
    // screen reader hears one door, never an older line beside the one on screen. A pin holds the
    // two as one (`entry-modal.test.tsx`).
    return {
      title: `${eventName} is private`,
      description:
        "This album is just for the guests. One password and you're in.",
    };
  }
  if (displayKey === "chooser") {
    const copy = chooserCopy();
    return { title: copy.title, description: copy.reason };
  }
  if (displayKey === "signin") {
    const copy = signinCopy();
    return { title: copy.title, description: copy.reason };
  }
  // `identify`: the verification door sells the album with the host's ruled reason, a name-only
  // event's Create account says what confirming keeps, and a gate's newcomer hears who lets her in.
  const copy = identifyCopy({
    verification,
    mediaTotal,
    door: doorGate,
    hostName,
  });
  return { title: copy.title, description: copy.reason };
}

/**
 * A line of a step that arrives in place, in the text reveal's stagger (`door.css`'s
 * `[data-door-line]`): its place in the stagger, and a base delay for a group that waits on
 * something (the beat's words wait for its check).
 */
function lineStyle(i: number, baseMs = 0): CSSProperties {
  return {
    "--door-line-i": i,
    ...(baseMs ? { "--door-line-base": `${baseMs}ms` } : {}),
  } as CSSProperties;
}

// THE SUCCESS BEAT: the held "You're in" view that masks the refresh roundtrip. The check in the
// album's light (`identity-door` r3, Will's `beat=lit`, overruling `hers`: the success green
// swapped for the lamp's hues), "You're in", and "Opening the album" once it runs slow. If the
// refresh hangs past the watchdog, a Retry (the unlock cookie is already set, so it always
// recovers). On the full path this exits into the reveal; on a password->account hop it hands
// forward to the account step.
//
// ★ IT ARRIVES AS A DELIGHT (his note: transitions.dev's success-check plus texts-reveal). The check
// blooms (a fade, a turn upright, a blur sharpening and a bob, its stroke drawing), and the words
// reveal just behind it, the headline first. The view arrives IN PLACE (the step transition's
// `place`), so no slide stacks on either. Reduced motion shows the end state.
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
      <div
        data-door-beat="stalled"
        className="flex flex-col items-center gap-4 py-6 text-center"
      >
        {/* The sheet's title slot keeps the event name's step on every screen
            of the flow (the welcome, the gate, this stall and the arrival). */}
        <p
          data-door-line
          style={lineStyle(0)}
          className="font-heading text-page text-balance"
        >
          That took longer than it should
        </p>
        <p
          data-door-line
          style={lineStyle(1)}
          className="max-w-xs text-base leading-relaxed text-muted-foreground"
        >
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
    <div
      data-door-beat="in"
      className="flex flex-col items-center gap-4 py-8 text-center"
    >
      <DoorCheck size="mark" />
      <div>
        <p
          data-door-line
          style={lineStyle(0, 140)}
          className="font-heading text-page"
        >
          You&rsquo;re in
        </p>
        {/* Keyed by what it says: a slow refresh's "Opening the album" arrives with the same
            reveal, in place, rather than swapping under her eyes. */}
        <p
          key={slow ? "slow" : "welcome"}
          data-door-line
          style={slow ? lineStyle(0) : lineStyle(1, 140)}
          className="mt-1 text-base text-muted-foreground"
        >
          {slow ? "Opening the album" : "Welcome to the party"}
        </p>
      </div>
    </div>
  );
}
