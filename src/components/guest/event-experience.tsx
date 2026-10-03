"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  Camera,
  ImageUp,
  Laptop,
  Play,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";

import { AlbumBoundary } from "@/components/guest/album-boundary";
import { ClaimHandlePrompt } from "@/components/guest/claim-handle-prompt";
import { AlbumLightSampler } from "@/components/guest/door/album-light";
import { pickedLine } from "@/components/guest/door/wait-picks";
import {
  doorOwner,
  forgetHeldPicks,
  readHeldPicks,
} from "@/components/guest/door/wait-picks-store";
import {
  EntryModal,
  type EntryModalHandle,
} from "@/components/guest/entry-modal";
import {
  AlbumCover,
  CoverGround,
  CoverPicture,
  createHeadBridge,
  useHeadBridge,
} from "@/components/guest/event-experience-head";
import {
  addsWaitFor,
  useLiveUploadsWait,
} from "@/components/guest/event-experience-wait";
import type { FollowMomentHost } from "@/components/guest/follow-moment-card";
import { GuestActionDock } from "@/components/guest/guest-action-dock";
import { publishCoverUnderHeader } from "@/components/guest/guest-header-cover";
import {
  AlbumWait,
  AlbumWaitSource,
} from "@/components/guest/gallery-empty-state-wait";
import { GallerySkeleton } from "@/components/guest/gallery-skeleton";
import { GalleryLiveProvider } from "@/components/guest/gallery-live";
import { GuestShare } from "@/components/guest/guest-share";
import {
  GuestUpload,
  TurnCard,
  type GuestUploadHandle,
  type UploadedItem,
} from "@/components/guest/guest-upload";
import {
  LiveGallery,
  type GalleryPayload,
  type LiveGalleryHandle,
} from "@/components/guest/live-gallery";
import { LiveReel } from "@/components/guest/reel/live-reel";
import { ReportFoot } from "@/components/guest/report-dialog";
import {
  createUploadTrackerStore,
  UploadTracker,
  UploadTrackerButton,
} from "@/components/guest/upload-tracker";
import { Button } from "@/components/ui/button";
import type { GuestEvent } from "@/lib/db/queries/guest-events";
import {
  DEMO_PAIR_EVENT,
  DEMO_PAIR_PARAM,
  fileToPairThumbnail,
  newPairId,
  pairChannelName,
  pairThumbnailToFile,
  pickAboveAlbumState,
  type DemoPairArrival,
} from "@/lib/demo";
import type { GalleryAccess, GalleryGate } from "@/lib/events/gallery-access";
import { formatCount } from "@/lib/format/count";
import { useInViewSentinel } from "@/lib/shared/use-in-view-sentinel";
import { DEFAULT_ROW_STEP, type RowStep } from "@/lib/shared/album-rows";
import { useWaitClock } from "@/lib/disposable/use-wait-clock";
import { coverEyebrow, waitWords } from "@/lib/disposable/wait-words";
import { addWords } from "@/lib/guest/camera/words";
import { claimLeftForAnotherAddress } from "@/lib/guest/claim-uploads";
import {
  confirmBeatToast,
  mergeConfirmBeats,
  onConfirmBeat,
  type ConfirmBeat,
} from "@/lib/guest/confirm-beat";
import {
  openToldNameChange,
  ToldNameForm,
} from "@/lib/guest/confirm-beat-name";
import { closesOnLastRemoval as lastRemovalCloses } from "@/lib/guest/delete-consequence";
import { createDoorHold, heldDoorName } from "@/lib/guest/door-hold";
import { useDoorHues, useLampLit } from "@/lib/guest/door-light";
import {
  contributionAnswered,
  type DoorArrival,
} from "@/lib/guest/entry-steps";
import { joinEvent, passedTicket } from "@/lib/guest/join";
import { useKeepAskPutDown } from "@/lib/guest/keep-ask";
import { onNameDoorRequest } from "@/lib/guest/name-door";
import { settleConfirmedName } from "@/lib/guest/settle-name";
import type { UploadsWait } from "@/lib/guest/upload-tracker";
import { useConfirmReturn } from "@/lib/guest/use-confirm-return";
import { useLiveQueue, useUploadQueue } from "@/lib/guest/use-upload-queue";
import {
  setStoredEmailAttached,
  useStoredName,
} from "@/lib/guest/use-stored-name";
import {
  readStoredSession,
  useStoredSession,
} from "@/lib/guest/use-stored-session";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/**
 * THE PAGE'S TWO BOXES.
 *
 * The album runs the window's width, to 20 px from each edge (12 px under 640, where a phone's
 * few columns want every pixel), so every window gets every column it can hold. The words sit on the left edge: the logo, the
 * name, the buttons and the photographs share one left line, the way a photo
 * app reads, and the room to the right of the words stays open.
 *
 * So the page root is not a column: it carries no measure and no gutter of its
 * own, and each block declares which of the two it is. COLUMN is the 632 px of
 * reading measure (42rem less its two 20 px gutters), pinned LEFT rather than
 * centred, so its first letter lands on the same 20 px line as the header's logo
 * above it and the album's first column below it. BLEED is the album: the
 * gutter alone (narrower on a phone), and the window decides the rest.
 *
 * ★ ONLY THE PHOTOGRAPHS LEAVE THE COLUMN. Everything the page SAYS — the name,
 * the byline, the buttons, the reel card, the upload panel, the guest list —
 * keeps the measure it was written for. A line of copy does not get better at
 * 1920, and a gallery is the one thing on the page that does.
 */
const COLUMN = "w-full max-w-2xl px-5";
const BLEED = "px-3 sm:px-5";

// Stable no-op subscribe for `phonePairId`'s useSyncExternalStore read below
// (entry-modal.tsx's own hydration flag uses the identical shape — it wants a
// stable subscribe, never a resubscribe every render).
const subscribeNoop = () => () => {};

/** A page with nothing to say about the door's first paint (the tests', and the demo's own page). */
const NO_ARRIVAL: DoorArrival = { face: null, scrim: false };

/** The albums whose held-door choice is being sent right now (one sending per album, whatever mounts). */
const deliveringPicks = new Set<string>();

// ★ THE DOOR IS IN THE FIRST BYTE, SO IT IS NOT A LAZY CHUNK ANY MORE (door-reveal). The entry-modal tree
// was split out of first-load JS when it only ever opened after hydration; the door's page is now the
// server's own first paint (the welcome, a gate's door at rest, the ask, the wait), so the server renders
// it in the shell and the hydration needs its code at once. Its heavy pieces (the account door, the upload
// sheets, the keep) were already in the page's JS through the header's name menu and the album's Add.

// The guest event SHELL (the streaming split): header + entry modal +
// upload slot render immediately; the presign-heavy gallery streams in behind
// <Suspense> as LiveGallery (which owns all gallery state + the doorbell/poll
// machine). Only rendered when the event is public (the server gates that).
export function EventExperience({
  event,
  qrToken,
  joinUrl,
  galleryPromise,
  stats,
  isDemo,
  access,
  gate,
  doorGate = null,
  needsName,
  hostAvatarUrl,
  hostSeed,
  isOwner,
  guestListSlot,
  canDeleteIds,
  isAuthed,
  isVerified = false,
  hostCard = null,
  initialRowStep,
  firstPaintWidth = null,
  rhythmSeed = 0,
  albumFull = false,
  waitingOnArrival = false,
  reelAsked = false,
  welcomeSeen = false,
  arrival = NO_ARRIVAL,
  doorPhase,
  uploadsWait,
}: {
  event: GuestEvent;
  qrToken: string;
  joinUrl: string;
  /** The page's album seed (the manifest and the first window's links), NOT awaited server-side:
   *  the live gallery resolves it via use() inside the Suspense boundary so the shell paints first. */
  galleryPromise: Promise<GalleryPayload>;
  /** Header stats: numbers only, never identities. N goes live via
   *  LiveGallery's onCountChange; M is THE ONE COUNT of guests (getEventGuests,
   *  the same the host's hub reads; never the host), seeded here and kept
   *  current by the gallery poll (`onGuestCountChange`). */
  stats: { approvedTotal: number; guestCount: number };
  /** The demo event: "uploads" are simulated locally + nothing is polled/persisted. */
  isDemo: boolean;
  /** Server-resolved gallery access (none/teaser/full), driving the entry modal's gate. `none` =
   *  password not yet unlocked (a locked backdrop; the modal shows the password step). `teaser` = the
   *  capped preview + a "See all" button that opens the modal's account step. `full` = full experience. */
  access: GalleryAccess;
  /**
   * WHICH DOOR THE SERVER PUT IN FRONT OF THIS VIEWER. `teaser` has two causes — an unconfirmed
   * email and an unmade contribution — and the door's step machine reads this rather than trying
   * to infer it from the level.
   */
  gate: GalleryGate | null;
  /**
   * The gate a newcomer stands at when the door is what she meets (the doors, event-settings r1:
   * letting each person in, or an invite list), for the email step's and the ask's words. Null
   * everywhere else.
   */
  doorGate?: "approve" | "invite" | null;
  /** Signed-in uploader without a public display name: the door asks for it as its NAME step, in
   *  `profile` mode (it writes the account's own name). */
  needsName: boolean;
  /** Presigned host avatar URL for the "Hosted by" byline, or null (no photo — the seeded
   *  initial fallback below carries it). */
  hostAvatarUrl: string | null;
  /** `seedFor(host_id)`, computed server-side (page.tsx via `getHostAvatarSeed`) — never the
   *  raw host id itself. Null exactly where `hostAvatarUrl` is. */
  hostSeed?: string | null;
  /** Viewer is the event host -> the entry modal is suppressed (the owner bypasses the gate). */
  isOwner: boolean;
  /** The server-composed named Guests section (profiles-social.md) — non-null ONLY when access is
   *  full and somebody is on the list (the page owns that gate; the list itself is always on). */
  guestListSlot?: React.ReactNode;
  /** The media ids in this album this SIGNED-IN viewer uploaded — resolved in the
   *  page RSC, never asserted by the browser. Empty for an anonymous guest, whose
   *  list comes from `/api/guests/mine` instead. */
  canDeleteIds: string[];
  /** Viewer holds an account -> the signed-in remove path (a Server Function on
   *  `remove_my_upload`); otherwise the anonymous one (the session token). */
  isAuthed: boolean;
  /**
   * Viewer holds a CONFIRMED account, which is a different question from
   * `isAuthed` and the one identity keys on (an unconfirmed session carries a
   * uid and still keeps a typed name, so `user_id` alone is never the test).
   */
  isVerified?: boolean;
  /** The event's host as a public card, for the capture flow's follow moment. */
  hostCard?: FollowMomentHost | null;
  /** The album's density step, server-resolved from the shared `pr_tile_size` cookie (page.tsx):
   *  threaded straight through to the album's View menu and to the streaming skeleton, so both lay
   *  out one number of photographs a row; this shell holds no step of its own. */
  initialRowStep?: RowStep;
  /** The width the album last laid its rows at (the page's `pr_album_w` cookie; null cold). */
  firstPaintWidth?: number | null;
  /** The visit's seed for the rows' rhythm (drawn by the page once a visit). */
  rhythmSeed?: number;
  /**
   * The album cannot take another upload (the presign's own caps, read off the
   * upload gate by the page: `resolveViewerDecision`'s `albumFull`). The gate
   * FAILS OPEN on a full album, so there a guest's own last removal does not
   * close it, and the lightbox must not say it does.
   */
  albumFull?: boolean;
  /**
   * Something waits on an album still empty to the eye, hers or anyone's (the page's server read,
   * `lib/disposable/waiting.server.ts`): the cover's Add never says "the first photo" over it, from the first paint.
   */
  waitingOnArrival?: boolean;
  /**
   * A viewer who owes no door arrived asking for the reel (`?reel`: the hub's Reel card's door for the owner, a
   * shared reel link for a returning guest): the page's server knows it before any script runs, so the reel's black
   * stands from the first byte instead of the album flashing under a view still loading (see the curtain below).
   */
  reelAsked?: boolean;
  /** The request carried this album's welcome cookie (the door's word on whether she has met it). */
  welcomeSeen?: boolean;
  /**
   * ★ WHAT THE FIRST BYTE DRAWS FOR THE DOOR (`entry-steps.ts`'s `doorArrival`, decided by the page): the
   * door's page standing over the album (inert under it, its words held), or the door's scrim over it, so
   * the album is never visible before a door she should meet first.
   */
  arrival?: DoorArrival;
  /** Where on the wheel the resting door's light starts its turn (the page draws one per visit). */
  doorPhase?: number;
  /**
   * ★ WHETHER WHAT SHE ADDS WAITS, AND FOR WHAT (`upload-tracker.ts`'s `uploadsWait`, read by the page's server):
   * the host's approval, or the album's develop time ahead. Where it waits, her tracker is where hers show and the
   * keep says they wait, never that they joined (red-team 43: a develop album's shots read as joined, then vanished).
   * The page's first word only: the page holds it live from here (`useLiveUploadsWait`, red-team 44).
   */
  uploadsWait: UploadsWait;
}) {
  const router = useRouter();
  // ONE resolution of the step for both boxes the album occupies: the skeleton
  // while it streams and the gallery once it lands.
  const rowStep = initialRowStep ?? DEFAULT_ROW_STEP;
  // The visit's rhythm seed, held for the visit: a same-access refresh (a rename,
  // a claim) re-renders the page with a fresh seed, which must not re-pick the
  // feature rows under a reader's eyes (an access flip remounts the album anyway).
  const [visitSeed] = useState(rhythmSeed);
  /* ★ THE RETURN. This album claims the browser's uploads at mount (a Google or
     magic-link confirmation comes back here signed in) and hears every claim
     made on it, whichever door started it; `moment` is true once a confirm door
     opened here AND a claim moved this album's own uploads, and the post-upload
     slot then plays the follow moment with no upload needed this visit, saying
     the other events once, in one line: `elsewhere` from here, and the events
     waiting under her email, which the slot reads for the moment alone. Never
     in the demo, never for the host. (lib/guest/use-confirm-return.ts owns the
     rule.) */
  const { moment, elsewhere } = useConfirmReturn(qrToken, !isDemo && !isOwner);
  const [sessionToken, setSessionToken] = useStoredSession(qrToken);
  // The name this device typed at this event. Beside the session, never
  // instead of it: the token is the capability, this is the label.
  const [storedName] = useStoredName(qrToken);
  /* ★ THE DOOR WAITS FOR THE SERVER TO SAY WHO IS HERE (crumbs-29, `lib/guest/door-hold.ts`). When the page must
     re-read who is holding the phone (`settleViewer`, below), the door is handed the name it had until the
     server's next render lands: a ticket the queue put down took its name with it, and the door drew the name
     step for the seconds a blocked phone's shut screen took to arrive. The hold is keyed to this render's
     seed, which every server render makes anew, so the answer ends it. */
  const [doorHold] = useState(createDoorHold);
  const hold = useSyncExternalStore(
    doorHold.subscribe,
    doorHold.get,
    doorHold.get,
  );
  const doorName = heldDoorName(hold, galleryPromise, storedName);
  // What a hold is taken under: this render's seed and the name the door has now (a hold kept while held).
  const heldUnderRef = useRef({ render: galleryPromise as unknown, doorName });
  useEffect(() => {
    heldUnderRef.current = { render: galleryPromise, doorName };
  });
  /* ★ THE ADDRESS TYPED AT THE DOOR, FOR THIS VISIT AND NO LONGER. It lives in
     React state on purpose: its ONE job is to prefill the keep's account door
     (the door's last screen), so a guest who has just typed it under their name
     does not type it again three taps later. Writing it to localStorage would hand it to the next person on a
     shared phone, which is precisely what `lib/auth/remembered-email.ts` is
     `/login`-only to prevent; a reload loses it and the door simply asks, which
     is the right cost. */
  const [attachedEmail, setAttachedEmail] = useState<string | null>(null);
  const entryRef = useRef<EntryModalHandle>(null);
  /* ★ "RETURNING", SNAPSHOTTED ONCE AT MOUNT: did this browser already hold a session for this
     event when the page loaded? It is what keeps the OFF-state upload step from asking a guest
     who came back on Sunday to look at the album. A lazy initializer rather than the live
     `sessionToken`, because the live value flips the instant this visit's own join mints a row
     and would drop the step under a guest's thumb. It reads storage during the hydration render
     and feeds only the lazily-loaded entry sheet, which renders nothing until after hydration,
     so no server-rendered DOM depends on it. */
  const [returning] = useState(() => Boolean(readStoredSession(qrToken)));
  // The live media count: seeded by the RSC stats' head count, then kept current
  // by LiveGallery at `teaser` and `full` (the exact, live count: the head count
  // every gallery payload carries, plus this device's own optimistic tiles and
  // removals). A locked page mounts no gallery and runs no poll, so there it
  // stays the render's exact count. M (the guests) is the SERVER's count, seeded
  // by the RSC and refreshed by any gallery poll that changed something: a
  // guest's own first upload makes them one, and only the server can tell a
  // first upload from a returning contributor's.
  const [mediaCount, setMediaCount] = useState(stats.approvedTotal);
  // ★ WHAT THAT COUNT SAYS IT HOLDS (`albumCountWords`, crumbs-61): the album's source names the kinds it can see ("12
  // photos"), told with each count so the cover and the album's own line say one thing. Null until the album has
  // told it, and the cover then says both nouns, as the server's first paint does (it knows a total, never its kinds).
  const [mediaWords, setMediaWords] = useState<string | null>(null);
  // ★ WHETHER ANYTHING WAITS IN THE ALBUM, AS ITS SYNC LAST SAID IT (`onWaitingChange`): the server's read at render
  // (`waitingOnArrival`) is the first paint's word, and this is the live one, so the cover's Add stops asking for "the
  // first photo" the moment others' shots begin to wait, as a newcomer's never did.
  const [waitsLive, setWaitsLive] = useState(false);
  const [guestCount, setGuestCount] = useState(stats.guestCount);
  // A refresh re-renders the page with a fresh server count: adopt it (the sanctioned
  // adjust-state-during-render pattern, as `contributionSeen` below), so the poll's number and
  // the render's number can never disagree for longer than one of them takes to arrive.
  const [seededGuestCount, setSeededGuestCount] = useState(stats.guestCount);
  if (stats.guestCount !== seededGuestCount) {
    setSeededGuestCount(stats.guestCount);
    setGuestCount(stats.guestCount);
  }
  const uploadRef = useRef<GuestUploadHandle>(null);

  /* ────────────────────────────────────────────────────────────────────────
     ONE QUEUE FOR BOTH DOORS.

     `GuestUpload` only exists at FULL access and inside the album. The door's third step asks for
     the first photograph BEFORE the album, from a sheet that is not inside `GuestUpload` at all,
     and the run it starts has to keep going after the door is gone: the first completion opens
     the album and the other eleven files finish behind it, drawing their tiles at the album's
     head. So the queue lives here, where both surfaces can reach it, and `GuestUpload` is handed
     its snapshot.

     The deferred refresh lives here with it. A mid-run `verification_required` must not
     `router.refresh()` while the guest is still reading the surface that explains it: the
     refresh's access flip remounts the gallery-and-upload slot and tears that surface down.
     Which surface it is depends on where the run was started, so the deferral asks: the ALBUM's
     failure sheet is inside the remounted slot and must be waited for; the DOOR's own step is not
     (the entry sheet sits outside `key={access}`), and re-gating it to the email step
     immediately is exactly the right answer there.
     ──────────────────────────────────────────────────────────────────────── */
  const pendingVerificationRef = useRef<string | null>(null);
  // The door is showing its upload step right now: a ref so the queue's callback reads it
  // synchronously, mirrored into state only for the render that hides the album's failure sheet.
  const uploadStepActiveRef = useRef(false);
  const [uploadStepActive, setUploadStepActive] = useState(false);
  const onUploadStepActive = useCallback((active: boolean) => {
    uploadStepActiveRef.current = active;
    setUploadStepActive(active);
  }, []);
  const flushPendingVerification = useCallback(() => {
    if (pendingVerificationRef.current === null) return;
    pendingVerificationRef.current = null;
    router.refresh();
  }, [router]);
  /* The queue is created ABOVE the callbacks that consume its completions (they need the gallery
     handle, attached further down this file), so a completion travels through a ref kept current
     by the effect beside `handleUploaded`. One indirection, rather than reordering the whole
     shell around a hook that has to exist before the album does. */
  const handleUploadedRef = useRef<(u: UploadedItem) => void>(() => {});
  /* ★ RE-READ WHO IS HERE, THE DOOR HELD MEANWHILE (crumbs-29). The page refreshes, so the server says who is
     holding the phone (a sign-out or a sign-in in another tab, a block), and until its render lands the door keeps
     the name it had (the hold above). A ticket still going down is waited for first (`ticketDown`), so the
     refresh never carries the cookie the ticket is leaving. */
  const settleViewer = useCallback(
    (ticketDown?: Promise<void>) => {
      const { render, doorName: name } = heldUnderRef.current;
      doorHold.set({ under: render, name });
      void (ticketDown ?? Promise.resolve()).then(() => router.refresh());
    },
    [doorHold, router],
  );
  const {
    items: queue,
    progress: uploadProgress,
    addFiles,
    addClip,
    holdAtDoor,
    retry,
    dismiss,
  } = useUploadQueue({
    qrToken,
    sessionToken,
    onSession: setSessionToken,
    onUploaded: (u) => handleUploadedRef.current(u),
    isDemo,
    isVerified,
    /* ★ FILES HELD FOR THE DOOR GO WHEN IT OPENS (crumbs-27): a silent join that landed waiting hands her to
       the held door with her files `queued`, and this is what tells the queue she is through. */
    doorOpen: access !== "none",
    /* ★ THE OWNER'S ADD IS THE HOST'S (crumbs-29's Deferred): her files ride the host's own pair, never a
       guest ticket at her own door, which every door but the open one held (the queue's head note). */
    ownerEventId: isOwner && !isDemo ? event.id : null,
    onVerificationRequired: (message, hadQueuedFiles) => {
      if (hadQueuedFiles && !uploadStepActiveRef.current) {
        pendingVerificationRef.current = message;
        return;
      }
      router.refresh();
    },
    /* ★ A TICKET THAT WAS NOT THIS VIEWER'S GOES DOWN, AND ONLY THE DOOR CAN MINT THEIR OWN. The
       queue tells the page before it puts the ticket down (token, name, address flag, cookie) and
       keeps the files waiting; the refresh re-resolves who is here from the server's side, so a
       sign-out in another tab is seen as one, and the door opens on the step that names them (the
       name, or the email step on a verified event), or the page is the shut door. Nothing is failed,
       so there is no failure sheet to wait for, unlike the flip above. */
    onDoorNeeded: settleViewer,
  });
  /* ★ A PROGRESS TICK RE-RENDERS NOTHING HERE. The queue's `items` change only on a status change;
     each file's progress lives in its own store (`uploadProgress`), which the album's stack tile
     reads for itself. The door's upload step draws a bar a pick off the items, so while it is on
     screen (and only then) it gets the queue with live progress folded in. */
  const doorQueue = useLiveQueue(queue, uploadProgress, uploadStepActive);
  /* ★ HER CHOICE FROM THE HELD DOOR, SENT ON HER RETURN (`door/wait-picks-store.ts`): she chose what she would
     add while the host decided, then left (a closed tab, her phone in her pocket), and the host let her in
     meanwhile; the album she comes back to (the let-in mail, a reload) sends that choice, once, as the door
     would have the moment it opened. Put down on the device first, so a second tab never sends it twice. */
  const queueNow = useRef(queue);
  useEffect(() => {
    queueNow.current = queue;
  });
  useEffect(() => {
    if (isDemo || isOwner || !isVerified || access === "none") return;
    if (!event.accepting_uploads || deliveringPicks.has(qrToken)) return;
    deliveringPicks.add(qrToken);
    void (async () => {
      try {
        const owner = await doorOwner();
        const files = owner ? await readHeldPicks(qrToken, owner) : null;
        if (!files?.length) return;
        await forgetHeldPicks(qrToken);
        // The tab that waited still holds her choice in its queue: that copy goes, never both.
        if (queueNow.current.length > 0) return;
        addFiles(files);
        toast.success(
          `Sending your ${pickedLine(
            files.map((file) => ({
              kind: file.type.startsWith("video/") ? "video" : "photo",
            })),
          )} from the door`,
        );
      } finally {
        deliveringPicks.delete(qrToken);
      }
    })();
  }, [
    access,
    addFiles,
    event.accepting_uploads,
    isDemo,
    isOwner,
    isVerified,
    qrToken,
  ]);

  /* THIS DEVICE HAS PUT SOMETHING IN, this visit, before any refresh has landed. It is the client
     half of the server's `hasContributed`, and either one closes the door's upload step. */
  const contributed = queue.some((it) => it.status === "done");
  /* ★ AND WHEN THAT HALF RETIRES: a guest's own deletes can close the door again. `contributed`
     stays true all visit, but on a Require-an-upload-to-view event the server can take a
     contribution back: a guest who removes their only upload is a guest who owes one again. So the
     client's flag stands only until the server has answered since it (its gate moved off `upload`);
     from then on the server's gate alone decides, and a later `upload` gate (after the removal's
     refresh) puts the door back WITH its upload step, never a teaser with no way through.
     The sanctioned adjust-state-during-render pattern (entry-modal.tsx's `prevStep`), so the
     retired flag never reaches a render. */
  const [contributionSeen, setContributionSeen] = useState(false);
  const seenNow = contributionAnswered({
    answered: contributionSeen,
    contributed,
    gate,
    requireUpload: event.require_upload_to_view,
  });
  if (seenNow !== contributionSeen) setContributionSeen(seenNow);
  const clientContributed = contributed && !seenNow;
  /* AND THE SERVER'S HALF, read off the decision it already made. With the switch ON the resolver
     answers `upload` exactly when this viewer owes a photograph, so anything else means they do
     not (they contributed, or the album cannot take one and the gate failed open). With the
     switch OFF the resolver never evaluates the question at all, so the door falls back to its
     own softer rule: ask a first-time visitor once, never a returning one. */
  const serverContributed = event.require_upload_to_view
    ? gate !== "upload"
    : false;

  const uploadingCount = queue.filter(
    (it) => it.status === "uploading" || it.status === "queued",
  ).length;
  // The cover's row on landing, the SHUTTER once that row scrolls away: one sentinel decides which,
  // and the shutter carries every one of the row's actions, not only Add.
  const { sentinelRef, inView: headerActionsInView } =
    useInViewSentinel<HTMLDivElement>();
  // The album's end: while it is below the screen, the shutter's foot fade stands over the album (his
  // note on `stays=shutter`: "when there is more to scroll"), and it goes once the end is in view.
  const { sentinelRef: albumEndRef, inView: albumEndInView } =
    useInViewSentinel<HTMLDivElement>();
  const canUpload = access === "full" && event.accepting_uploads;
  /* ★ THE CAP A GUEST'S FILE MEETS, SAID BEFORE THE PICKER (crumbs-43): the host's own per-file cap
     (`events.max_upload_bytes`) on the Add sheet's terms line, at the door's upload step and the album's Add
     alike, so the number she reads is the one the presign holds her to. Never the host's on her own album: her
     uploads ride the host's pair, which the cap exempts (`create_media_as_host`). */
  const hostCap = isOwner ? null : (event.max_upload_bytes ?? null);

  /* ────────────────────────────────────────────────────────────────────────
     A DRIFTING DECISION, AND WHICH WAY IT DRIFTED.

     The poll re-resolves the whole decision server-side, so it sees a change before this page
     does. What to do about one is not symmetrical:

     ★ LOOSER (the gate fell away: a contribution made in another tab, a host closing uploads, an
     album filling up) refreshes AT ONCE. The guest is being let in; there is nothing to protect
     them from.

     ★ STRICTER (the host turned Require an upload to view ON while this guest was inside) NEVER
     yanks an open album out from under a thumb. Mid-scroll, `key={access}` would remount the
     whole gallery and throw away their place in it, for a switch they did not touch. It is
     remembered instead and spent on their NEXT act: the sheet reopening, or an Add.

     Two tabs at the upload step land on the same rule: the second drops its picks when the first
     completes, and reaches the album at its next act.
     ──────────────────────────────────────────────────────────────────────── */
  const pendingStricterRef = useRef(false);
  const handleAccessDrift = useCallback(
    (next: { access: GalleryAccess; gate: string | null }) => {
      const looser = next.access === "full" && access !== "full";
      if (looser) {
        router.refresh();
        return;
      }
      if (next.access !== access || next.gate !== gate) {
        pendingStricterRef.current = true;
      }
    },
    [access, gate, router],
  );
  /** The guest's next act: spend a remembered stricter drift, then do the thing they asked for. */
  const spendStricterDrift = useCallback(() => {
    if (!pendingStricterRef.current) return false;
    pendingStricterRef.current = false;
    router.refresh();
    return true;
  }, [router]);

  /* ────────────────────────────────────────────────────────────────────────
     EVERY ADD IS JUST AN ADD.

     The name is one of the door's ordered steps, a step BEFORE the album, so by the time any of
     the three affordances (the row, the dock, the empty album's CTA) exists this guest is already
     named and the Add is only ever an Add. Asking for the name at the first Add instead would let
     a guest reach the album's media without a name and reap all its rewards anonymously, meeting
     friction only when they went to contribute.
     ──────────────────────────────────────────────────────────────────────── */
  const openAdd = useCallback(() => {
    // Their next act is where a remembered stricter drift is spent (see the drift's own note).
    if (spendStricterDrift()) return;
    uploadRef.current?.openAdd();
  }, [spendStricterDrift]);

  /* ────────────────────────────────────────────────────────────────────────
     REMOVING YOUR LAST UPLOAD CLOSES A REQUIRE-UPLOAD ALBUM AGAIN.

     While uploads are open on such an event, the door opens only for a guest with an upload that
     counts, and one they removed themselves no longer does. The lightbox's confirm says so before
     it happens (LiveGallery hands it the line), and when the removal lands with nothing of this
     guest's left, the page refreshes onto the server's answer AT ONCE rather than holding the album
     until their next act the way a host's stricter switch is held: the guest chose this, after
     being told. The server decides (a held upload still counts), so a refresh that finds the door
     still open changes nothing, and the one that finds it shut brings the door back WITH its upload
     step (see `contributionAnswered`).
     ──────────────────────────────────────────────────────────────────────── */
  // ★ NOT ON A FULL ALBUM: the gate fails open there (a guest must never be held at a step they
  // cannot pass), so the last removal closes nothing and the confirm says nothing about it.
  const closesOnLastRemoval = lastRemovalCloses({
    isDemo,
    isOwner,
    requireUpload: event.require_upload_to_view,
    acceptingUploads: event.accepting_uploads,
    albumFull,
  });
  /* The uploads this visit removed again, by id. The post-upload card counts what is still in the
     album (a finished queue item whose upload was removed is not "on this album" any more), so the
     card says "Your 1 photo" after one of two goes, and leaves once none is left. */
  const [removedIds, setRemovedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const handleOwnRemoved = useCallback(
    (removedId: string, remaining: number) => {
      setRemovedIds((prev) => new Set(prev).add(removedId));
      if (!closesOnLastRemoval || remaining > 0) return;
      pendingStricterRef.current = false;
      router.refresh();
    },
    [closesOnLastRemoval, router],
  );
  // WHAT THIS DEVICE HAS SENT THAT THE ALBUM DOES NOT SHOW YET: everything in
  // flight (the head's stack), AND anything a hold-for-approval event finished
  // but is keeping back, which draws nowhere in the album (`held=uploads`) but
  // keeps its object URL alive for her uploads' picture of it, and counts
  // toward her own-delete consequence, until the host decides. ★ AND A LANDING
  // THE SERVER SEALED UNTIL THE ALBUM DEVELOPS (`mediaStatus === "sealed"`, the
  // queue's `landedAs`: any album with a develop time ahead, the camera's shots
  // and a free upload alike) is kept the same way: nothing draws it, her tracker
  // draws this visit's picture of it, and the cover says Add photos once she has
  // shot, never "the first photo" over an album she has added to (red-team 43).
  // ★ Never one she took back from her list (her tracker's Remove, or the
  // camera's, `onOwnRemoved`): it is hers no longer, so it neither counts toward
  // that consequence nor keeps the album from being empty.
  const inFlightUploads = queue.filter(
    (it) =>
      (it.status !== "done" ||
        it.mediaStatus === "pending" ||
        it.mediaStatus === "sealed") &&
      !(it.mediaId && removedIds.has(it.mediaId)),
  );
  /* ★ WHETHER WHAT SHE ADDS WAITS, LIVE (`useLiveUploadsWait`, red-team 44): the server's reading at render, ended by
     the develop time coming on this device's clock and moved by every word the album's sync carries about the develop
     (a Develop now, a time set, moved or taken away), so a page left open across a develop never keeps its promise
     over the developed album, nor keeps her next upload out of it. Everything that speaks of the wait reads this one:
     the slot's line and the camera, the album's head, her tracker, the keep and the failure sheet. And what hers wait
     for, as it falls on this viewer (`addsWaitFor`): where they wait, the album draws nothing of hers in the air
     either (her tracker has it from the press), and the failure sheet says the rest waits. */
  const {
    reading: liveWait,
    onSynced: onDevelopsAtChange,
    developsAt: liveDevelopsAt,
  } = useLiveUploadsWait({
    initial: uploadsWait,
    moderationMode: event.moderation_mode,
  });
  const addsWait = addsWaitFor({ uploadsWait: liveWait, isOwner, isDemo });
  /* ★ THE WAIT, ONE QUESTION OF TIME (the-wait r1, Will's `model=time`): the album's live reading as a clock, the host's
     approval or a develop time ahead, so the album's contact sheet, her tracker and the slot all say one wait,
     "Developing", told apart by its clock alone ("As Maya lets them in", "All at once at 9 am"). */
  const waitClock = useMemo(
    () => waitWords(liveWait, event.host_display_name ?? null),
    [liveWait, event.host_display_name],
  );
  /* ★ THE PRESET NAMED ON THE COVER (Will's `name=disposable`): "Disposable · develops at 9 am" over the event's name on
     an album with its camera and a develop time, "developed" the morning after; the time in her own clock, so only once
     it is known (the server's render names the preset alone). */
  const wallClock = useWaitClock();
  const eyebrow = coverEyebrow(
    { capture: event.capture ?? "upload", developsAt: liveDevelopsAt },
    wallClock,
  );

  // The header's own name menu is a SIBLING island and cannot reach the modal's
  // handle; `lib/guest/name-door.ts` is the one channel between them (the same
  // module-singleton shape the stored session uses for the same reason).
  useEffect(
    () => onNameDoorRequest((mode) => entryRef.current?.openToName(mode)),
    [],
  );
  /* ★ THE COVER'S ADD IS THE ONE ADD (`event-header` r1, `guest=cover`). The album's empty state draws
     its river and its words and no button of its own: the cover's white Add asks for the first photo
     on an album with nothing in it yet, in the first screen, and says its ordinary words once anything is (her own
     files on their way, held for the host, or waiting from an earlier visit count from the first paint,
     crumbs-43's `waitingOnArrival`; and anyone's shots that begin to wait while she watches, `waitsLive`), so a guest
     always has exactly one Add in front of her. Its words are `addWords`'. */
  const galleryEmpty =
    mediaCount === 0 &&
    inFlightUploads.length === 0 &&
    !waitingOnArrival &&
    !waitsLive;
  /* ★ WHERE THE ADD OPENS THE ALBUM'S CAMERA it says so (`disposable-camera`'s Question, taken): Take, not Add,
     with the camera glyph, on the cover's white Add and on the shutter's face (the dock's `camera`), the first
     of them asked for while nothing is on the roll. The one Add is `GuestUpload.openAdd`, which opens the camera
     for any viewer of such an album, the host's included. */
  const cameraAlbum = event.capture === "camera";
  // ★ THE ADD'S WORDS ARE `addWords`', ONE HOME (crumbs-61): the page and See it as a guest say one thing.
  const addLabel = addWords({ camera: cameraAlbum, empty: galleryEmpty });
  // Her tracker (`guest-capture` r1, `tracker=button`): the two facts its button needs, kept
  // outside the page's state so a sync re-renders the tracker and never this shell.
  const [trackerStore] = useState(createUploadTrackerStore);
  const [trackerOpen, setTrackerOpen] = useState(false);
  const openTracker = useCallback(() => setTrackerOpen(true), []);
  /* ★ WHAT THE LIVE ALBUM TELLS THE HEAD (`event-experience-head.tsx`'s bridge): the album streams in
     under its own <Suspense>, and the cover is the shell, so the album's reel controller publishes the
     cover's photographs and the reel's door here (`LiveReel`'s `headBridge`), as her tracker publishes
     its button's two facts through `trackerStore`. Null until the album has mounted. */
  const [headBridge] = useState(createHeadBridge);
  const head = useHeadBridge(headBridge);
  /* Whether the album has a reel to play from the cover's round: the album's own word once it has one,
     and until then the page's guess from what it knows at render (the host's switch, and two photos at
     least), so the round stands from the first paint rather than pushing Add over when the album lands.
     A guess the album corrects is the rare album whose two are a clip or a video with no poster. */
  const reelRound = head
    ? head.reel.available
    : access === "full" && event.show_reel && mediaCount >= 2;
  const openReel = useCallback(() => head?.reel.open(), [head]);
  const preloadReel = useCallback(() => head?.reel.preload(), [head]);
  /* ★ A VIEWER ARRIVING ON `?reel` WITH NO DOOR TO PASS MEETS THE REEL, NOT HER ALBUM (`event-header` r1's
     folded fix, his note: "some (reel) seems to flash a guest album as it loads the slideshow"). The
     view is a lazy chunk that opens after the page hydrates, so the album painted first and flashed
     under it. The page knows at render that she asked for the reel (`reelAsked`: the owner from her hub,
     or a returning guest on a shared reel link, red-team 44, either owing the door nothing, with `?reel`
     in the address), so the view's own black stands from the first byte and the view opens over it; a
     newcomer meets the door first, and the reel after it. The curtain goes the moment the address stops
     asking (the view closed, or the reel turned out not to play and the album dropped `?reel`), and never
     comes back: a reel she opens later from the cover opens over the album, as it should.
     ★ THE HUB'S REEL CARD IS A `<Link>`, A SOFT NAVIGATION, AND THE BLACK STANDS THROUGH IT TOO (crumbs-52,
     red-team 43): the album mounts in the commit that writes `?reel` to the address, so its first render
     reads the address it left. The line below drops the curtain on the album's word alone, so that word is the
     address read when it is told (`live-reel.tsx`), never a render's copy: a copied "absent" let the curtain
     go in the very task it was drawn in. */
  const [curtainDown, setCurtainDown] = useState(!reelAsked);
  if (!curtainDown && head && !head.reel.viewAsked) setCurtainDown(true);
  const reelCurtain = !curtainDown;
  // The shutter's ring: the run reads the page's queue and its progress store (`useRunProgress`, inside
  // the shutter, so a tick re-renders the shutter alone), in the album's own light.
  const shutterRun = useMemo(
    () => ({ items: queue, progress: uploadProgress }),
    [queue, uploadProgress],
  );
  const { hues: albumHues } = useDoorHues();
  /* ────────────────────────────────────────────────────────────────────────
     THE IMMEDIATE HEAL.

     The server resolves Require an upload to view from the `pr_guest_<eventId>` cookie, because an
     RSC cannot read localStorage. A session minted before the cookie existed has the localStorage
     half and not the cookie, so the first render of an ON event resolves that guest as
     uncontributed and puts the upload step in front of somebody who already gave the host
     twenty photographs. That is the one case worth a round trip: when the RSC's gate is `upload`
     and this browser holds a stored token, POST the poll ONCE with it (no `If-None-Match`, so the
     answer is a real decision rather than a 304), which also writes the cookie. If the decision
     came back changed, refresh onto it.

     The sheet's auto-open WAITS for that answer, which is why this is state and not an effect
     that only refreshes: a held door that flashes up and vanishes half a second later is worse
     than a door that arrives a beat late, and the arrival beat is already 350-700 ms long.
     ──────────────────────────────────────────────────────────────────────── */
  const [healing, setHealing] = useState(
    () => gate === "upload" && Boolean(readStoredSession(qrToken)),
  );
  useEffect(() => {
    if (!healing) return;
    let cancelled = false;
    void (async () => {
      const token = readStoredSession(qrToken);
      if (!token) {
        if (!cancelled) setHealing(false);
        return;
      }
      try {
        // The album's own poll, carrying the token in the BODY: it resolves the decision with that
        // ticket and writes the cookie on its answer (the heal), with no validator to 304 against.
        const res = await fetch("/api/album/guest/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qr_token: qrToken, session_token: token }),
        });
        const body = (await res.json()) as {
          ok?: boolean;
          gate?: string | null;
        };
        if (cancelled) return;
        // The decision came back different from the one this page was rendered with: the cookie
        // is written now, so the refresh resolves the same guest the browser thinks it is.
        if (body?.ok && body.gate !== "upload") {
          router.refresh();
          return;
        }
      } catch {
        // A failed heal costs one extra step, never the page: the door simply asks.
      }
      if (!cancelled) setHealing(false);
    })();
    return () => {
      cancelled = true;
    };
    // Once per mount: `gate` moving is the refresh's own business, not a second heal's.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [healing, qrToken]);

  // THE REVEAL CURTAIN: while the entry sheet's success beat holds, the
  // freshly mounted reveal targets + masonry tiles wait at their pre-entrance
  // state (globals.css [data-reveal-curtain]); when the hold releases the
  // attribute drops and everything rises AS the sheet exits, instead of
  // playing invisibly behind it during the refresh roundtrip.
  const [holdCurtain, setHoldCurtain] = useState(false);
  /* ★ THE DOOR STANDS AS THE PAGE (`locked-door` r2, `door/stage.tsx`), as the door itself reports it
     (EntryModal's `onStageChange`, before paint), and from the page's first byte where the server put it
     there (`arrival`): the album keeps its layout under the stage and goes `inert` there. */
  const [stageUp, setStageUp] = useState(arrival.face !== null);
  /* ★ AND THE ALBUM'S WORDS WAIT FOR HER (door-reveal): while the door stands over an album she may see,
     the cover is only its photographs (its name, byline and actions held, the album below it too), so the
     walk through lands on exactly the picture the doorway showed, and the words rise as she arrives. */
  const curtain = holdCurtain || (stageUp && access !== "none");
  // ★ THE WELCOME COMES FIRST: whether this visitor still owes the door, as the door itself reports
  // it (EntryModal's `onPendingChange`). OWED until its first report, because the door is a lazy
  // chunk and a hydrating page cannot know yet: a `?reel` waits a beat for the owner rather than
  // opening under a welcome that is about to arrive for a guest.
  const [welcomePending, setWelcomePending] = useState(true);

  /* ★ THE HEADER STANDS ON THE COVER WHILE THE COVER IS UNDER IT (`guest-header-cover.ts`): the page
     says so at render, and this moves it as the page does. The door's stage arriving over the album
     takes the header back to paper over a paper door. And the demo's header, pinned to the top for its
     Demo mark, stands on the cover only at the page's top: the moment the page moves, the cover's words
     would slide under a see-through bar and collide with its own, so it takes the paper (a real event's
     header scrolls away with its cover and never needs to). */
  const [coverEl, setCoverEl] = useState<HTMLElement | null>(null);
  const [coverUnderBar, setCoverUnderBar] = useState(true);
  useEffect(() => {
    if (!isDemo) return;
    const read = () => setCoverUnderBar(window.scrollY < 8);
    // A reload restored mid-page reads where it landed; every later move is the scroll's own event.
    const first = requestAnimationFrame(read);
    window.addEventListener("scroll", read, { passive: true });
    return () => {
      cancelAnimationFrame(first);
      window.removeEventListener("scroll", read);
    };
  }, [isDemo]);
  const coverUnderHeader =
    access !== "none" && !stageUp && (!isDemo || coverUnderBar);
  useEffect(() => {
    publishCoverUnderHeader(coverUnderHeader);
  }, [coverUnderHeader]);
  // A page left takes its word with it, so the next page's header follows its own render.
  useEffect(() => () => publishCoverUnderHeader(null), []);
  /* THE WAY BACK TO THE COVER, the shutter's right flank on an album with no reel: the page's top, and
     a keyboard's focus with it (the shutter goes inert as the cover's row returns, so a focus left on it
     would fall to the page), handed to the event's name, which takes it as a landmark and never as a stop
     in the tab order. */
  const backToCover = useCallback(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: still ? "auto" : "smooth" });
    const title = coverEl?.querySelector<HTMLElement>("h1");
    if (!title) return;
    if (!title.hasAttribute("tabindex")) title.setAttribute("tabindex", "-1");
    title.focus({ preventScroll: true });
  }, [coverEl]);

  /* ★ PAST THE DOOR IS A TICKET (the doors, event-settings r1). "Already in" means everyone past the
     door, a confirmed guest who only looks included (Will's `inside` note: "X guests are already
     in"), so a confirmed visitor with no ticket for this album joins silently, once, the moment the
     door is behind her. Without it, a host who later closed the door would shut her out as a newcomer
     she never was. A typed name's own step already mints her ticket, and an unconfirmed visitor has not
     passed the door. The upload queue's own join then finds the ticket and mints nothing more; one racing
     it shares this one's answer (a nameless join is asked once at a time, `joinEvent`), and the server
     answers her one ticket either way (crumbs-29). */
  const joinedAtDoorRef = useRef(false);
  useEffect(() => {
    if (isDemo || isOwner || !isVerified || welcomePending) return;
    if (access === "none" || sessionToken || joinedAtDoorRef.current) return;
    joinedAtDoorRef.current = true;
    void joinEvent({ qrToken }).then((joined) => {
      // ★ A JOIN THAT LANDED WAITING IS THE ASK, NOT A TICKET (crumbs-27): adopted, the queue would send a
      // file on it and it would be refused "This event is private."; the door reads the cookie the join set.
      const ticket = passedTicket(joined);
      if (ticket) {
        setSessionToken(ticket);
        return;
      }
      // ★ THE SERVER SEES NO CONFIRMED ACCOUNT HERE (crumbs-29): the page rendered across a sign-out still in
      // flight, and its door skipped the steps that name her. It re-reads who is here, and the door asks them.
      if (
        !joined.ok &&
        (joined.refusal.kind === "name_required" ||
          joined.refusal.kind === "verification_required")
      ) {
        settleViewer();
      }
    });
  }, [
    access,
    isDemo,
    isOwner,
    isVerified,
    qrToken,
    sessionToken,
    setSessionToken,
    settleViewer,
    welcomePending,
  ]);

  /* ────────────────────────────────────────────────────────────────────────
     THE KEEP: THE DOOR'S LAST SCREEN (`guest-capture` r1, `moment=first` and `shape=sheet-step`).

     The ask to keep what she added arrives the instant her first file lands, as the door's last
     screen, whichever Add sent it (the door's own upload step, or the album's once she is inside):
     the door simply has one more step, and opens for it. It is due for a guest with no account
     here (a session of any kind means there is nothing to keep that confirming would add), never
     in the demo or for the host, once something of hers landed this visit and is still in the
     album, until she puts it down (Maybe later, remembered for this event on this device) or
     confirms (the refresh then says who she is; `keepAnswered` stops the ask before it lands).

     ★ THE ALBUM'S OFFER CARD IS GONE WITH IT (`claim-handle-prompt.tsx`'s own note says what the
     slot keeps): every first landing now meets the ask in the door, and a guest who answered or put
     it down there is not asked again under the album. Her menu's card stays the ask's standing home.
     ──────────────────────────────────────────────────────────────────────── */
  const keepPutDown = useKeepAskPutDown(qrToken);
  const [keepAnswered, setKeepAnswered] = useState(false);
  /* ★ THE KEEP WAITS WHILE SHE SHOOTS (`disposable-camera`'s Question, taken). A signed-out guest's first landed
     shot makes it due, and its sheet used to open over the camera mid-shoot; `GuestUpload` says when the camera
     is open (`onCameraOpenChange`), the keep is held until she closes it, and it comes the moment she does. */
  const [cameraOpen, setCameraOpen] = useState(false);
  // What landed this visit and is still hers, and what each one is: the keep counts them and names them (red-team
  // 44's NIT: "Your 5 photos" with a video among them), a camera album's as shots.
  const keepSent = useMemo(
    () => ({
      kinds: queue
        .filter(
          (it) =>
            it.status === "done" && !(it.mediaId && removedIds.has(it.mediaId)),
        )
        .map((it) => it.kind),
      camera: cameraAlbum,
    }),
    [queue, removedIds, cameraAlbum],
  );
  const landedCount = keepSent.kinds.length;
  const keepDue =
    !isDemo &&
    !isOwner &&
    !isAuthed &&
    !keepPutDown &&
    !keepAnswered &&
    landedCount > 0 &&
    !cameraOpen;
  const onKeepAnswered = useCallback(() => setKeepAnswered(true), []);

  /* ────────────────────────────────────────────────────────────────────────
     ONE BEAT PER CONFIRMATION (`confirm-beat.ts`). A confirmation that plays the follow moment says
     everything in its card; any other reports its beat here (the name her photos now carry, the
     other events), and the page says it ONCE, as one toast, and only once the door has closed, so
     it never lands on a sheet she is still answering. The name's Change is the toast's action: a
     small name form (`confirm-beat-name.tsx`, `popups` r1's `forms=dialog`), mounted below.
     ★ Photos typed here under another address than the one confirmed stay with that address (the
     claim never takes them), so before it speaks the page asks what the claim left here
     (`claimLeftForAnotherAddress`): then the toast says where they are, and no name is settled or
     told for photos that did not move (crumbs-24).
     ──────────────────────────────────────────────────────────────────────── */
  const pendingBeatRef = useRef<ConfirmBeat | null>(null);
  const welcomePendingRef = useRef(welcomePending);
  const sayPendingBeat = useCallback(() => {
    const beat = pendingBeatRef.current;
    pendingBeatRef.current = null;
    if (!beat) return;
    void (async () => {
      const left = await claimLeftForAnotherAddress(beat.album);
      // A door on another island could not settle the name (`confirm-beat.ts` says why): the
      // page does, here, before it speaks, so the name told is the one her photos now carry.
      const name =
        left > 0
          ? null
          : beat.settle
            ? (beat.name ?? (await settleConfirmedName(beat.album)))
            : beat.name;
      const words = confirmBeatToast({
        name,
        elsewhere: beat.elsewhere,
        left,
      });
      if (!words) return;
      toast.success(words.title, {
        description: words.description,
        action: name
          ? {
              label: "Change",
              onClick: () => openToldNameChange(name),
            }
          : undefined,
      });
    })();
  }, []);
  useEffect(() => {
    welcomePendingRef.current = welcomePending;
    if (!welcomePending) sayPendingBeat();
  }, [welcomePending, sayPendingBeat]);
  useEffect(
    () =>
      onConfirmBeat((beat) => {
        if (beat.album !== qrToken) return;
        pendingBeatRef.current = mergeConfirmBeats(
          pendingBeatRef.current,
          beat,
        );
        if (!welcomePendingRef.current) sayPendingBeat();
      }),
    [qrToken, sayPendingBeat],
  );

  // Upload bridge: completions route to LiveGallery's imperative handle. The
  // gallery streams in async, so anything finishing before it mounts (rare —
  // the seed resolves in well under a second) buffers and flushes through the
  // callback ref below.
  const galleryRef = useRef<LiveGalleryHandle | null>(null);
  const pendingUploads = useRef<UploadedItem[]>([]);
  const attachGallery = useCallback((handle: LiveGalleryHandle | null) => {
    galleryRef.current = handle;
    if (handle && pendingUploads.current.length > 0) {
      const queued = pendingUploads.current;
      pendingUploads.current = [];
      for (const u of queued) handle.notifyUploaded(u);
    }
  }, []);
  // The one place a tile reaches the gallery, whichever door it came through:
  // this tab's own (real or simulated) upload, or a paired phone's broadcast
  // (below) landing on a laptop that never touched its file picker at all.
  const deliverToGallery = useCallback((u: UploadedItem) => {
    const handle = galleryRef.current;
    if (handle) {
      handle.notifyUploaded(u);
    } else {
      pendingUploads.current.push(u);
    }
  }, []);

  /* ────────────────────────────────────────────────────────────────────────
     THE PHONE PAIR: what the phone adds appears on the laptop's album a second
     later, and the laptop says where it came from. One broadcast channel, no
     stored bytes. lib/demo.ts is the single source for the channel naming +
     the two data-URL <-> File conversions; everything below is the wiring.

     ★ TWO ROLES, NEVER BOTH. A tab that loaded with `?pair=<id>` in its URL
     (it was scanned off another screen) is THE PHONE: it never listens, it
     only broadcasts its own uploads outward. Every other demo tab mints its
     OWN id and folds it into the link its own Invite sheet shows (`shareUrl`
     below) — THE LAPTOP, which listens on that id and never broadcasts. The
     id is unguessable and never persisted, so a listener's channel can only
     ever hear this one visitor's own second screen, never a stranger's.
     ──────────────────────────────────────────────────────────────────────── */
  // THE LAPTOP'S id: crypto.randomUUID() is safe in both environments (Node
  // 22 has it globally), so a lazy initializer mints it directly — no effect,
  // no react-hooks/set-state-in-effect. The server's own copy is simply
  // discarded (this is browser-only behaviour end to end): nothing renders
  // it into HTML before a visitor opens the Invite sheet, well after
  // hydration, so the server and client minting different values is never a
  // mismatch React can see.
  const [ownPairId] = useState<string | null>(() =>
    isDemo ? newPairId() : null,
  );
  // THE PHONE's id, read off `?pair=<id>` — `window` genuinely does not exist
  // during SSR (unlike crypto above), so this DOES need the hydration-safe
  // read: useSyncExternalStore's server snapshot (null) matches the first
  // client render exactly (the store read `useHydrated` is made of, with a
  // value in place of its `true`). Not next/navigation's useSearchParams,
  // which would ask this whole shell to grow a Suspense boundary for one
  // demo delight nothing else here needs.
  const phonePairId = useSyncExternalStore(
    subscribeNoop,
    () =>
      isDemo
        ? new URLSearchParams(window.location.search).get(DEMO_PAIR_PARAM)
        : null,
    () => null,
  );
  // "It's on your laptop already" (the phone's own line) once its first
  // paired upload has actually gone out; "that one just came from your
  // phone" (the laptop's line) once at least one has arrived.
  const [pairedAsPhone, setPairedAsPhone] = useState(false);
  const [pairedArrivals, setPairedArrivals] = useState(0);

  // THE LAPTOP'S HALF: listen on its own id for as long as it holds one.
  useEffect(() => {
    if (!isDemo || !ownPairId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(pairChannelName(ownPairId))
      .on("broadcast", { event: DEMO_PAIR_EVENT }, ({ payload }) => {
        const arrival = payload as DemoPairArrival;
        setPairedArrivals((n) => n + 1);
        if (!arrival.dataUrl) return; // a video: the line alone says it arrived
        void pairThumbnailToFile(arrival.dataUrl)
          .then((file) => {
            deliverToGallery({
              mediaId: crypto.randomUUID(),
              queueId: `pair-${crypto.randomUUID()}`,
              file,
              kind: arrival.kind,
              status: "approved",
            });
          })
          .catch(() => {
            // The status line already said one arrived; a decode failure
            // costs only the tile, never the (already true) fact of it.
          });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isDemo, ownPairId, deliverToGallery]);

  const handleUploaded = useCallback(
    (u: UploadedItem) => {
      deliverToGallery(u);
      // THE PHONE'S HALF: this tab's own upload also travels to whichever
      // screen showed the code it scanned. REST, not the websocket send — no
      // subscribe/teardown dance for a message this tab sends at most a
      // handful of times a visit (Realtime broadcast docs, "REST calls are
      // only available from 2.37.0 onwards"; the client here is 2.106).
      if (isDemo && phonePairId && u.status === "approved") {
        void (async () => {
          const supabase = createClient();
          const channel = supabase.channel(pairChannelName(phonePairId));
          try {
            const dataUrl = await fileToPairThumbnail(u.file);
            await channel.httpSend(DEMO_PAIR_EVENT, {
              dataUrl: dataUrl ?? undefined,
              kind: u.kind,
            } satisfies DemoPairArrival);
            setPairedAsPhone(true);
          } catch {
            // Best-effort delight: the upload itself already succeeded
            // either way (GuestUpload's own toast/tile owns that feedback).
          } finally {
            await supabase.removeChannel(channel);
          }
        })();
      }
    },
    [deliverToGallery, isDemo, phonePairId],
  );
  // Keep the queue's completion channel pointed at the live callback (see its own note above).
  useEffect(() => {
    handleUploadedRef.current = handleUploaded;
  }, [handleUploaded]);

  /* The told name, changed in the follow moment's own line (`name=told`'s Change): this device's
     credits say the new name at once (the rename patch, as the album menu's Change name does), and
     the refresh trues up everything server-baked (the Guests list, the header's account). */
  const handleAccountRenamed = useCallback(
    (displayName: string) => {
      galleryRef.current?.renameMine(displayName);
      router.refresh();
    },
    [router],
  );

  // The demo's OWN share link carries its pairing id (a plain event never
  // does: shareUrl === joinUrl). GuestShare takes whatever string it is
  // handed and never re-derives it, so this is the entire integration.
  const shareUrl =
    isDemo && ownPairId
      ? `${joinUrl}?${DEMO_PAIR_PARAM}=${ownPairId}`
      : joinUrl;

  /* ★ THE CLIP'S SEAM: the on-device creator's finished clip goes through this page's ONE queue like
     any upload, written `reel_eligible = false` so the live reel never plays a reel
     (use-upload-queue.ts's `addClip`). The creator itself sits behind reel/creator-seam.ts; this is
     only the door it will use. */
  const addClipToAlbum = useCallback(
    (file: File, poster: Blob) => addClip(file, poster),
    [addClip],
  );
  /* The address the reel's code plate prints for a person to read: the custom slug's when the
     event has one (what the host chose to be read aloud), the token's otherwise. The CODE always
     carries the canonical token link (`joinUrl`); this is words, never a link. */
  const displayAddress = (() => {
    try {
      const host = new URL(joinUrl).host;
      return `${host}/e/${event.custom_slug ?? qrToken}`;
    } catch {
      return joinUrl;
    }
  })();

  // THE DEMO'S TURN CARD: the same upload, then one card. Paired, the two
  // lines above say more (the SAME moment, worded for a second screen);
  // unpaired, the plain turn card owns it. One slot, never stacked.
  const demoUploaded = isDemo && contributed;
  const aboveAlbumState = pickAboveAlbumState({
    isDemo,
    pairedAsPhone,
    pairedArrivals,
    demoUploaded,
  });
  const aboveAlbum =
    aboveAlbumState === "paired-phone" ? (
      <PairedPhoneLine />
    ) : aboveAlbumState === "paired-laptop" ? (
      <PairedLaptopLine />
    ) : aboveAlbumState === "turn" ? (
      <TurnCard />
    ) : null;

  return (
    <div
      // `relative`: the door's stage stands over this box (`door/stage.tsx`), and the page holds to one
      // screen while it does (`data-guest-experience`, `door/doorway.css`).
      data-guest-experience=""
      className={cn(
        "relative w-full flex-1",
        // The shutter is fixed, so the page owes it room or it crops the last row
        // and the report line. Reserved for as long as it is MOUNTED rather than
        // while it is visible: a padding that appeared with the shutter would grow
        // the page under a guest's thumb mid-scroll. Past the door the cover
        // reaches the top itself (under the header); a door that is the page keeps
        // its own air above.
        access !== "none"
          ? "pb-[calc(7.5rem+env(safe-area-inset-bottom))]"
          : "pt-8 pb-8",
      )}
      data-reveal-curtain={curtain ? "" : undefined}
    >
      {/* ★ THE DOOR, IN THE PAGE'S FIRST BYTE: its page (the welcome, the ask, the wait, a gate's door at
          rest) and the scrim of a sheet step that comes first are the server's, drawn here before any
          script, and the hydration draws the same (`arrival`). The heal holds only the sheet (see its own
          note): a sheet that appears and vanishes half a second later is worse than one a beat late. */}
      <EntryModal
        ref={entryRef}
        arrival={arrival}
        welcomeSeen={welcomeSeen}
        healing={healing}
        phase={doorPhase}
        // The album's cover through the open door, where she may see it: the cover's own photographs,
        // from the same seed and the same live album (`CoverPicture`), so the walk lands on them.
        view={
          access !== "none" ? (
            <CoverPicture
              seed={galleryPromise}
              bridge={headBridge}
              eventId={event.id}
            />
          ) : undefined
        }
        qrToken={qrToken}
        eventName={event.name}
        access={access}
        gate={gate}
        doorGate={doorGate}
        acceptsVideo={event.accepts_video}
        capBytes={hostCap}
        hasContributed={serverContributed}
        contributed={clientContributed}
        returning={returning}
        uploadsOpen={event.accepting_uploads}
        requireUpload={event.require_upload_to_view}
        albumEmpty={mediaCount === 0}
        isOwner={isOwner}
        isDemo={isDemo}
        isVerified={isVerified}
        // A confirmed account WITHOUT a profile name is the door's `profile` name step; with
        // one, the name is a fact about the person and is never asked for again.
        hasProfileName={!needsName}
        queue={doorQueue}
        onSend={addFiles}
        onRetry={retry}
        onDismissFailures={dismiss}
        onUploadStepActive={onUploadStepActive}
        keepDue={keepDue}
        keepCount={landedCount}
        keepSent={keepSent}
        keepHeld={liveWait.waits}
        keepDevelopsAt={liveWait.developsAt}
        // The address typed under her name a few minutes ago, so the keep's account door
        // opens on it instead of asking twice.
        hintEmail={attachedEmail}
        onKeepAnswered={onKeepAnswered}
        // The header's own live number, so a door opened over the teaser
        // never says a different size than the line beside it.
        mediaTotal={mediaCount}
        // The welcome's byline. On a locked page `event` is the REDACTED
        // shellEvent (host_display_name null), so the host name hides
        // itself there - the privacy rule needs no extra guard.
        hostName={event.host_display_name}
        eventDate={event.event_date}
        eventEndDate={event.event_end_date}
        onHoldingChange={setHoldCurtain}
        onStageChange={setStageUp}
        // Her choice at the held door: the queue holds it until the door lets her in.
        onHold={holdAtDoor}
        onPendingChange={setWelcomePending}
        sessionToken={sessionToken}
        // Held while the page re-reads who is here (`doorName`, the hold above).
        storedName={doorName}
        onNamed={({
          sessionToken: token,
          displayName,
          source,
          emailAttached,
          email,
        }) => {
          // The row carries a name now. Adopt the session this device just
          // minted (a rename hands back the one it already had).
          if (token) setSessionToken(token);
          /* The device flag and the in-memory address, in that order. The
               FLAG is what the header's menu island reads (it subscribes to the
               same store the name does); the ADDRESS never leaves this state.
               Only a true attach writes either: a door that offered the field
               and got nothing leaves both exactly as they were, so a guest who
               added an address a week ago and skipped it tonight keeps the
               menu row they earned. */
          if (emailAttached) {
            setStoredEmailAttached(qrToken, true);
            setAttachedEmail(email);
          }
          /* ──────────────────────────────────────────────────────────────
               THE RENAME PATCH: "Change name" updates the header chip and
               localStorage at once, so the loaded credits follow at once too,
               or the lightbox pill would read the old name until the next poll
               and the GUESTS list until a reload. `renameMine` patches THIS
               device's own tiles/credits locally, no network round trip; the
               poll's truth replaces it on the next tick, unchanged. The Guests
               list (src/components/social/guest-list.tsx) is a plain,
               server-baked ReactNode with no live subscription of its own, so
               it cannot be patched the same way; `router.refresh()` is the
               honest way to true it up promptly instead of leaving it stale
               until a guest happens to reload. It is safe here specifically
               because a rename never changes `access`, so `key={access}` never
               remounts the gallery (unlike a looser access flip, which does). */
          if (displayName) galleryRef.current?.renameMine(displayName);
          /* ★ THE REFRESH IS ONLY THE RENAME'S. The door's own name STEP must not refresh: it
               hands forward to the next step in the same sheet, and a refresh there would remount
               the gallery under an open door for nothing. A rename from the album menu still needs
               one (the server-baked Guests list has no live subscription of its own), and the
               CONFIRMATION sequence issues its own inside the hold. So this only fires when there
               is no step behind the name. */
          if (source === "edit") router.refresh();
        }}
      />
      {access !== "none" && (
        // ★ THE ALBUM UNDER AN OPEN STAGE IS `inert`: the door is the page, so nothing behind it can be
        // reached by a tab or read aloud until the door lets her through.
        <div data-door-behind="" inert={stageUp || undefined}>
          {/* ★ THE COVER (`event-header` r1, `guest=cover`): the reel's own photographs dissolving edge
              to edge under the event's name, on the house light until there are any; Add photos white on
              them, the reel and Invite beside it. It reaches up under the header (`-mt-14`, the
              header's own `h-14`), which stands on it in white (`guest-header-cover.ts`). ★ The words
              keep the page's left line (the header's logo, the album's first column): 20px in. */}
          <AlbumCover
            ref={setCoverEl}
            className="-mt-14"
            eyebrow={eyebrow}
            ground={
              <CoverGround
                seed={galleryPromise}
                bridge={headBridge}
                eventId={event.id}
              />
            }
            name={event.name}
            host={
              event.host_display_name?.trim()
                ? {
                    name: event.host_display_name,
                    avatarUrl: hostAvatarUrl,
                    seed: hostSeed ?? null,
                  }
                : null
            }
            date={event.event_date}
            endDate={event.event_end_date}
            description={event.description}
            mediaCount={mediaCount}
            mediaWords={mediaWords ?? undefined}
            guestCount={guestCount}
            actionsRef={sentinelRef}
            actions={
              <>
                {canUpload && (
                  <Button
                    type="button"
                    variant="on-photo"
                    size="cta"
                    onClick={openAdd}
                    className="min-w-0 flex-1 md:flex-none"
                  >
                    {cameraAlbum ? <Camera /> : <ImageUp />} {addLabel}
                  </Button>
                )}
                <UploadTrackerButton
                  look="glass"
                  store={trackerStore}
                  onOpen={openTracker}
                />
                {reelRound && (
                  <Button
                    type="button"
                    variant="glass"
                    size="icon-cta"
                    aria-label="Watch the highlight reel"
                    title="Watch the highlight reel"
                    onClick={openReel}
                    onPointerEnter={preloadReel}
                    onFocus={preloadReel}
                  >
                    <Play className="fill-current" />
                  </Button>
                )}
                <GuestShare
                  look="glass"
                  joinUrl={shareUrl}
                  qrStyle={event.qr_style}
                  eventName={event.name}
                />
                {/* ★ THE DEMO'S CONVERSION OBJECT rides the same row (its visitor is a prospective
                    host, not a guest choosing whether to keep an album), on a line of its own at a
                    phone, where the row has no room for its words. */}
                {isDemo && (
                  <Button
                    variant="glass"
                    size="cta"
                    className="w-full md:w-auto"
                    asChild
                  >
                    <Link href="/">Start your own</Link>
                  </Button>
                )}
              </>
            }
          />

          {/* ★ EVERYTHING BELOW THE COVER WAITS WITH ITS WORDS (`data-door-below`, `door.css`): while the
              door stands over the album, and on a success beat, the page under the cover is its ground
              alone, so the walk through lands on the picture the doorway showed, and the album rises in. */}
          <div data-door-below="">
            {/* Upload area: only at `full` access (a `teaser` viewer is still at the door, which owns every
              step in front of them). Uploads off => a quiet view-only line. ★ NO SAVE, AND NO INLINE "Add
              your name to upload" PANEL: a confirmed account with no profile name is asked at the DOOR,
              as its name step in `profile` mode, like every other guest and before the album. */}
            <div className={COLUMN}>
              {access === "full" &&
                (event.accepting_uploads ? (
                  <div className="mt-5 empty:hidden">
                    <GuestUpload
                      ref={uploadRef}
                      event={event}
                      qrToken={qrToken}
                      queue={queue}
                      onAddFiles={addFiles}
                      onRetry={retry}
                      onDismiss={dismiss}
                      // The door's own step is showing this run's failures, or its keep stands in
                      // front of the album: one run never gets two surfaces, and the failure sheet
                      // waits for the keep to be answered (see the one queue's note above).
                      suppressFailures={uploadStepActive || keepDue}
                      onFailuresClosed={flushPendingVerification}
                      isDemo={isDemo}
                      host={hostCard}
                      moment={moment}
                      elsewhere={elsewhere}
                      onAccountRenamed={handleAccountRenamed}
                      removedIds={removedIds}
                      capBytes={hostCap}
                      // The album's host (never the demo's visitor, who owns nothing): her camera keeps no roll.
                      isOwner={isOwner && !isDemo}
                      // A shot taken back inside the camera is the page's removal too, as her tracker's Remove is.
                      onOwnRemoved={handleOwnRemoved}
                      // The door's keep is held while she shoots (`keepDue`).
                      onCameraOpenChange={setCameraOpen}
                      // The album's live reading: its line, the camera's develop and the failure sheet's words.
                      uploadsWait={liveWait}
                    />
                  </div>
                ) : (
                  !isDemo && (
                    <>
                      <p className="mt-5 text-center text-reading text-muted-foreground">
                        The host has closed uploads. You can still browse the
                        album.
                      </p>
                      {/* A confirmation from the name menu or the mark can land
                      here too, on an album whose uploads have since closed:
                      the moment still plays, in the slot's place. */}
                      {moment && (
                        <div className="mt-4">
                          <ClaimHandlePrompt
                            doneCount={0}
                            qrToken={qrToken}
                            host={hostCard}
                            moment
                            elsewhere={elsewhere}
                            onAccountRenamed={handleAccountRenamed}
                          />
                        </div>
                      )}
                    </>
                  )
                ))}
            </div>

            {/* THE ALBUM, and nothing else, leaves the column to run the window's
              width. It is a sibling of the words box, not a block inside it. */}
            {/* ★ ONE LIVE SOURCE BELOW THE COVER, FOR THE ALBUM AND THE REEL. The provider owns the
              gallery's live state (the refreshed list, the arrivals, this device's own ids, the doorbell
              and the poll), so the cover's photographs, the full-screen reel and the album all read ONE
              list: an upload reaches the grid and the reel in the same breath. The gallery streams in
              (the presign-heavy payload): the skeleton holds its layout slot, and nothing above the
              album waits for it (the cover reads the same seed in a boundary of its own). key={access}
              makes an access flip (teaser -> full after sign-in via router.refresh(), a transition - old
              UI holds) a clean remount that re-seeds from the fresh promise. The fallback wears the SAME
              box as the gallery, and the skeleton the same column rule AT THE SAME TILE SIZE, so the swap
              is layout-stable at every window. */}
            {/* ★ AND ITS FAILURE IS THE ALBUM'S ALONE (crumbs-28, `album-boundary.tsx`): a crash where
              the album renders stays here, so the header, the cover, the door and Add photos stand while
              the album says it could not load, with a Try again that asks the page again. A seed whose
              read failed never throws (crumbs-30): the live source stands, her uploads list with it,
              and heals the album with its own sync. Keyed as the provider is, so an access flip
              starts it clean too. */}
            <AlbumBoundary key={access} className={COLUMN}>
              <Suspense
                fallback={
                  <div className={cn(BLEED, "mt-5")}>
                    <GallerySkeleton step={rowStep} />
                  </div>
                }
              >
                <GalleryLiveProvider
                  key={access}
                  ref={attachGallery}
                  galleryPromise={galleryPromise}
                  qrToken={qrToken}
                  access={access}
                  isDemo={isDemo}
                  onAccessDrift={handleAccessDrift}
                  onCountChange={setMediaCount}
                  onCountWordsChange={setMediaWords}
                  onWaitingChange={setWaitsLive}
                  pendingUploads={inFlightUploads}
                  uploadProgress={uploadProgress}
                  canDeleteIds={canDeleteIds}
                  isOwner={isOwner && !isDemo}
                  isAuthed={isAuthed}
                  sessionToken={sessionToken}
                  approvedTotal={stats.approvedTotal}
                  onOwnRemoved={handleOwnRemoved}
                  onGuestCountChange={setGuestCount}
                  // The album's sync's word on its develop: the page's live reading follows it.
                  onDevelopsAtChange={onDevelopsAtChange}
                >
                  {/* ★ THE ALBUM'S WAIT READS HERE (the-wait r1, `wait=sheet`): what waits off the album's sync,
                  hers off her tracker, one reading for the sheet over the rows and the empty album under it. */}
                  <AlbumWaitSource
                    clock={waitClock}
                    hers={trackerStore.hers}
                    onOpenHers={openTracker}
                    firstPaintWidth={firstPaintWidth}
                    rule={canUpload && !isDemo}
                  >
                    {/* The door's light takes its colour from here, the album's three newest (it draws
                  nothing; `door/album-light.tsx`). */}
                    <AlbumLightSampler />
                    {/* Her tracker's list, inside the one live source it reads (its button sits on the
                  cover and the shutter, above this provider, reading `trackerStore`). */}
                    <UploadTracker
                      store={trackerStore}
                      queue={queue}
                      qrToken={qrToken}
                      sessionToken={sessionToken}
                      isAuthed={isAuthed}
                      moderated={liveWait.waits}
                      developsAt={liveWait.developsAt}
                      hostName={event.host_display_name ?? null}
                      isDemo={isDemo}
                      isOwner={isOwner}
                      removedIds={removedIds}
                      // Her Remove on what waits for the host: the page's own record of what she took back.
                      onOwnRemoved={handleOwnRemoved}
                      open={trackerOpen}
                      onOpenChange={setTrackerOpen}
                    />
                    <LiveReel
                      eventId={event.id}
                      eventName={event.name}
                      joinUrl={joinUrl}
                      displayAddress={displayAddress}
                      qrStyle={event.qr_style}
                      isDemo={isDemo}
                      moderated={event.moderation_mode !== "live"}
                      onAddYours={canUpload ? openAdd : undefined}
                      // A clip is a video: with the host's Videos off (`accepts_video`), a guest's clip
                      // stays hers to save or share, rather than an Add the upload would refuse.
                      addClipToAlbum={
                        canUpload && event.accepts_video ? addClipToAlbum : null
                      }
                      queue={queue}
                      // Her tracker's own-rows read carries the server's news (what a decision let in since
                      // she was last told): the toast says it on her return too (crumbs-38).
                      approvalNews={trackerStore.news}
                      welcomePending={welcomePending}
                      isOwner={isOwner}
                      // The cover's photographs and the reel's door, told to the head above the album.
                      headBridge={headBridge}
                    >
                      {/* The demo's turn card or the phone pair: one card directly
                    above the album's first tile — the photograph a visitor just
                    added IS that tile (the album is newest first), so whatever is
                    said here is said right beside it. It keeps the ALBUM's own box
                    (BLEED), not the words' column, so it lines up with the
                    photographs under it; the album itself is one CSS multi-column
                    box and nothing can be put in the middle of one. */}
                      {aboveAlbum && (
                        <div className={cn(BLEED, "mt-5")}>{aboveAlbum}</div>
                      )}
                      {/* ★ THE WAIT OVER THE ALBUM (the-wait r1, `wait=sheet`): the contact sheet wherever photos wait,
                      hers lit, everyone's counted; the empty album under it yields to it. */}
                      <AlbumWait
                        className={cn(BLEED, "mt-5")}
                        ruleClassName={cn(COLUMN, "mt-5")}
                      />
                      <div className={cn(BLEED, aboveAlbum ? "mt-4" : "mt-5")}>
                        <LiveGallery
                          galleryPromise={galleryPromise}
                          qrToken={qrToken}
                          access={access}
                          isDemo={isDemo}
                          onOpenGate={() => entryRef.current?.openToGate()}
                          // ★ No Add of its own: the cover's is the one Add (see `galleryEmpty`).
                          onAddFirst={undefined}
                          joinUrl={joinUrl}
                          initialRowStep={rowStep}
                          firstPaintWidth={firstPaintWidth}
                          rhythmSeed={visitSeed}
                          closesOnLastRemoval={closesOnLastRemoval}
                          // Where hers wait, nothing of hers in the air stands at the album's head (red-team 44).
                          addsWait={addsWait.waits}
                        />
                      </div>
                    </LiveReel>
                  </AlbumWaitSource>
                </GalleryLiveProvider>
              </Suspense>
            </AlbumBoundary>
            {/* The album's end, which the shutter's foot fade watches for. */}
            <div ref={albumEndRef} aria-hidden data-album-end="" />

            {/* The named Guests section (profiles-social.md, host-keyed) — after the album,
              before the report footer: context about who filled it, never
              competing with the media. Server-composed slot; null = key off.
              It is words, so it keeps the column. */}
            {guestListSlot && <div className={COLUMN}>{guestListSlot}</div>}
          </div>

          {/* WHAT STAYS (`event-header` r1, `stays=shutter`): the cover's row sits on landing, and
              the shutter takes its place the moment it leaves the screen (mounted-but-inert until
              then, so it travels in rather than appearing): Invite on its left, the round Add in the
              album's light at the centre, its ring the progress of hers on their way, and Invite's
              twin on its right, the reel's round (or, on an album with no reel, the way back to the
              cover). The page's ground rises under them while more album lies below. */}
          <GuestActionDock
            // Under an open stage the door is the page, so the shutter waits with the rest of the album.
            hidden={headerActionsInView || stageUp}
            uploadingCount={uploadingCount}
            onAdd={canUpload ? openAdd : undefined}
            camera={cameraAlbum}
            run={shutterRun}
            hues={albumHues}
            more={!albumEndInView}
            invite={
              <GuestShare
                look="round"
                joinUrl={shareUrl}
                qrStyle={event.qr_style}
                eventName={event.name}
              />
            }
            twin={
              reelRound ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon-cta"
                  aria-label="Watch the highlight reel"
                  title="Watch the highlight reel"
                  onClick={openReel}
                  onPointerEnter={preloadReel}
                  onFocus={preloadReel}
                  className="bg-background shadow-layer"
                >
                  <Play className="fill-current" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="icon-cta"
                  aria-label="Back to the top"
                  title="Back to the top"
                  onClick={backToCover}
                  className="bg-background shadow-layer"
                >
                  <ArrowUp />
                </Button>
              )
            }
            tracker={
              <UploadTrackerButton
                look="round"
                store={trackerStore}
                onOpen={openTracker}
              />
            }
          />
          {/* The album's light is asked for only while the shutter stands to wear it. */}
          {!(headerActionsInView || stageUp) && <LampWhileShown />}
          {/* The reel's own black, for an owner arriving on `?reel` (the curtain's note above), under
              the view's own overlay (z-50) and over everything else on the page. */}
          {reelCurtain && (
            <div
              aria-hidden
              data-reel-curtain=""
              className="fixed inset-0 z-[49] bg-black"
            />
          )}

          {/* Discreet anonymous report path (the report capability is the qr_token), never
              for the album's own host: without it no photo offers Report to her either
              (build 23's BUG-3, `ReportFoot`). */}
          <ToldNameForm
            onRenamed={(renamed) => {
              galleryRef.current?.renameMine(renamed);
              router.refresh();
            }}
          />
          <div data-door-below="">
            <ReportFoot qrToken={qrToken} isOwner={isOwner} isDemo={isDemo} />
            {/* The demo's closing card at the foot, in the slot a real event gives
                the report footer (hidden here — nothing to report in a demo) and,
                once uploads are ever closed, the reel. Below the whole album on
                purpose: the ask belongs after a visitor has actually seen what
                they came to see. */}
            {isDemo && (
              <div className={COLUMN}>
                <ClosingCard guestCount={guestCount} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** The album's light is sampled only while a lamp stands to wear it (`door-light.ts`): the shutter, here. */
function LampWhileShown() {
  useLampLit();
  return null;
}

/** The closing card at the demo's foot: "Yours would look like this" — the
 *  demo's second, patient conversion object, real numbers standing in for the
 *  fixture's. */
function ClosingCard({ guestCount }: { guestCount: number }) {
  return (
    <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-8 text-center">
      <p className="font-heading text-subsection text-balance">
        Yours would look like this
      </p>
      <p className="max-w-sm text-reading text-pretty text-muted-foreground">
        One code
        {guestCount > 0
          ? `, ${formatCount(guestCount)} ${guestCount === 1 ? "guest" : "guests"},`
          : ","}{" "}
        and every photo in one place. Free to start, nothing to install.
      </p>
      <Button size="lg" className="mt-1" asChild>
        <Link href="/">Start your own</Link>
      </Button>
    </div>
  );
}

/** The phone pair's SENDING half, on the screen that scanned the code: the
 *  reassurance a "turn card" already gives every other demo upload, worded
 *  for the fact that this one travelled somewhere else. */
function PairedPhoneLine() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5">
      <Laptop className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <p className="text-reading text-pretty">
        It&rsquo;s on your laptop already.
        <span className="text-muted-foreground">
          {" "}
          That is what your guests do all night, from their own phones.
        </span>
      </p>
    </div>
  );
}

/** The phone pair's RECEIVING half, on the screen that showed the code: where
 *  the photograph at the top of the album — the one this tab never touched a
 *  file picker for — actually came from. */
function PairedLaptopLine() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <Smartphone className="size-4 shrink-0 text-muted-foreground" />
      <p className="text-reading">
        That one just came from your phone.
        <span className="text-muted-foreground">
          {" "}
          Your guests&rsquo; photos arrive the same way.
        </span>
      </p>
    </div>
  );
}
