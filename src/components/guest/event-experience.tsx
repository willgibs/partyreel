"use client";

import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImageUp, Laptop, Lock, Smartphone } from "lucide-react";

import { initial } from "@/components/app/user-menu";
import { ClaimHandlePrompt } from "@/components/guest/claim-handle-prompt";
import type { EntryModalHandle } from "@/components/guest/entry-modal";
import type { FollowMomentHost } from "@/components/guest/follow-moment-card";
import { GuestActionDock } from "@/components/guest/guest-action-dock";
import { GallerySkeleton } from "@/components/guest/gallery-skeleton";
import { GhostRiver } from "@/components/guest/gallery-empty-state";
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
import { LiveReel, LiveReelTile } from "@/components/guest/reel/live-reel";
import { ReportDialog } from "@/components/guest/report-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  DEFAULT_TILE_SIZE,
  type TileSize,
} from "@/lib/shared/tile-size-cookie";
import { closesOnLastRemoval as lastRemovalCloses } from "@/lib/guest/delete-consequence";
import { contributionAnswered } from "@/lib/guest/entry-steps";
import { onNameDoorRequest } from "@/lib/guest/name-door";
import { useConfirmReturn } from "@/lib/guest/use-confirm-return";
import { useUploadQueue } from "@/lib/guest/use-upload-queue";
import {
  setStoredEmailAttached,
  useStoredName,
} from "@/lib/guest/use-stored-name";
import {
  readStoredSession,
  useStoredSession,
} from "@/lib/guest/use-stored-session";
import { createClient } from "@/lib/supabase/client";
import { cn, formatEventDate } from "@/lib/utils";

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

// Code split: the entry-modal tree (welcome/password/account steps)
// only matters pre-gate; React.lazy (NOT next/dynamic - the modal is a
// forwardRef and dynamic() doesn't forward refs) moves it out of first-load
// JS. Its auto-open already waits for hydration, so the async chunk just
// shifts that by a beat.
const EntryModalLazy = lazy(() =>
  import("@/components/guest/entry-modal").then((m) => ({
    default: m.EntryModal,
  })),
);

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
  needsName,
  hostAvatarUrl,
  hostSeed,
  isOwner,
  guestListSlot,
  canDeleteIds,
  isAuthed,
  isVerified = false,
  hostCard = null,
  initialTileSize,
  albumFull = false,
}: {
  event: GuestEvent;
  qrToken: string;
  joinUrl: string;
  /** The RSC's gallery load, NOT awaited server-side — LiveGallery resolves it
   *  via use() inside the Suspense boundary so the shell paints first. */
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
  /** The server-composed named Guests section (profiles-social.md) — non-null ONLY when the
   *  host enabled show_guest_list AND access is full (the page owns that gate). */
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
  /** Server-resolved from the `pr_tile_size` cookie (page.tsx) — threaded straight
   *  through to LiveGallery's one View menu and to the streaming skeleton, so both
   *  lay out one column count; this shell holds no tile-size state of its own. */
  initialTileSize?: TileSize;
  /**
   * The album cannot take another upload (the presign's own caps, read off the
   * upload gate by the page: `resolveViewerDecision`'s `albumFull`). The gate
   * FAILS OPEN on a full album, so there a guest's own last removal does not
   * close it, and the lightbox must not say it does.
   */
  albumFull?: boolean;
}) {
  const router = useRouter();
  // ONE resolution of the size for both boxes the album occupies: the skeleton
  // while it streams and the gallery once it lands.
  const tileSize = initialTileSize ?? DEFAULT_TILE_SIZE;
  /* ★ THE RETURN. This album claims the browser's uploads at mount (a Google or
     magic-link confirmation comes back here signed in) and hears every claim
     made on it, whichever door started it; `moment` is true once a confirm door
     opened here AND a claim moved this album's own uploads, and the post-upload
     slot then plays the follow moment with no upload needed this visit. Never in
     the demo, never for the host. (lib/guest/use-confirm-return.ts owns the
     rule.) */
  const moment = useConfirmReturn(qrToken, !isDemo && !isOwner);
  const [sessionToken, setSessionToken] = useStoredSession(qrToken);
  // The name this device typed at this event. Beside the session, never
  // instead of it: the token is the capability, this is the label.
  const [storedName] = useStoredName(qrToken);
  /* ★ THE ADDRESS TYPED AT THE DOOR, FOR THIS VISIT AND NO LONGER. It lives in
     React state on purpose: its ONE job is to prefill the offer card's door, so
     a guest who has just typed it under their name does not type it again three
     taps later. Writing it to localStorage would hand it to the next person on a
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
  const {
    items: queue,
    addFiles,
    addClip,
    retry,
    dismiss,
  } = useUploadQueue({
    qrToken,
    sessionToken,
    onSession: setSessionToken,
    onUploaded: (u) => handleUploadedRef.current(u),
    isDemo,
    isVerified,
    onVerificationRequired: (message, hadQueuedFiles) => {
      if (hadQueuedFiles && !uploadStepActiveRef.current) {
        pendingVerificationRef.current = message;
        return;
      }
      router.refresh();
    },
    /* ★ A TICKET THAT WAS NOT THIS VIEWER'S WENT DOWN, AND ONLY THE DOOR CAN MINT THEIR OWN. The
       queue has already put the ticket down (token, name, address flag, cookie) and kept the files
       waiting; the refresh re-resolves who is here from the server's side, so a sign-out in
       another tab is seen as one, and the door opens on the step that names them (the name, or
       the email step on a verified event). Nothing is failed, so there is no failure sheet to wait
       for, unlike the flip above. */
    onDoorNeeded: () => router.refresh(),
  });
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

  // WHAT THE ALBUM'S HEAD STILL OWES THIS DEVICE: everything in flight, AND
  // anything a hold-for-approval event finished but is keeping back, as a
  // waiting tile (a completed upload that vanished would read as a failure).
  // A held item stays here until the poll shows the host approved it, and its
  // object URL stays alive with it.
  const inFlightUploads = queue.filter(
    (it) => it.status !== "done" || it.mediaStatus === "pending",
  );
  const uploadingCount = queue.filter(
    (it) => it.status === "uploading" || it.status === "queued",
  ).length;
  // The row on landing, the DOCK once that row scrolls away: one sentinel
  // decides which, and the dock carries both of a guest's actions, not only Add.
  const { sentinelRef, inView: headerActionsInView } =
    useInViewSentinel<HTMLDivElement>();
  const canUpload = access === "full" && event.accepting_uploads;

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

  // The header's own name menu is a SIBLING island and cannot reach the modal's
  // handle; `lib/guest/name-door.ts` is the one channel between them (the same
  // module-singleton shape the stored session uses for the same reason).
  useEffect(
    () => onNameDoorRequest((mode) => entryRef.current?.openToName(mode)),
    [],
  );
  // At 0 items the PHOTOGRAPHIC-PROMISE empty state owns the primary Add
  // (its centered CTA), so the header drops its Add to avoid two primaries.
  const galleryEmpty = mediaCount === 0;
  /* ★ THE STORED REEL'S CARD AND OVERLAY DO NOT RENDER. The reel is live: the Highlight reel tile
     sits in its own slot above the album and opens the full-screen view (reel/live-reel.tsx), both
     reading the album's own live payload. The stored reel's two components stay on disk until the
     teardown that deletes them with the tables. */
  const revealBase = 0;
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
        const res = await fetch("/api/guests/gallery", {
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
  // ★ THE WELCOME COMES FIRST: whether this visitor still owes the door, as the door itself reports
  // it (EntryModal's `onPendingChange`). OWED until its first report, because the door is a lazy
  // chunk and a hydrating page cannot know yet: a `?reel` waits a beat for the owner rather than
  // opening under a welcome that is about to arrive for a guest.
  const [welcomePending, setWelcomePending] = useState(true);

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
  // client render exactly, same idiom as entry-modal.tsx's `hydrated` flag
  // and user-menu.tsx's `mounted` one. Not next/navigation's useSearchParams,
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
      className={cn(
        "w-full flex-1 pt-8",
        // The dock is fixed, so the page owes it room or it crops the last row
        // and the report line. Reserved for as long as the dock is MOUNTED
        // rather than while it is visible: a padding that appeared with the bar
        // would grow the page under a guest's thumb mid-scroll.
        access !== "none"
          ? "pb-[calc(6rem+env(safe-area-inset-bottom))]"
          : "pb-8",
      )}
      data-reveal-curtain={holdCurtain ? "" : undefined}
    >
      <Suspense fallback={null}>
        {/* The heal holds the door (see its own note): a sheet that appears and vanishes half a
            second later is worse than one that arrives a beat late. */}
        {!healing && (
          <EntryModalLazy
            ref={entryRef}
            qrToken={qrToken}
            eventName={event.name}
            access={access}
            gate={gate}
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
            queue={queue}
            onSend={addFiles}
            onRetry={retry}
            onDismissFailures={dismiss}
            onUploadStepActive={onUploadStepActive}
            // The header's own live number, so a door opened over the teaser
            // never says a different size than the line beside it.
            mediaTotal={mediaCount}
            // The welcome's byline. On a locked page `event` is the REDACTED
            // shellEvent (host_display_name null), so the host name hides
            // itself there - the privacy rule needs no extra guard.
            hostName={event.host_display_name}
            eventDate={event.event_date}
            hostAvatarUrl={hostAvatarUrl}
            hostSeed={hostSeed}
            onHoldingChange={setHoldCurtain}
            onPendingChange={setWelcomePending}
            sessionToken={sessionToken}
            storedName={storedName}
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
        )}
      </Suspense>
      {/* THE WORDS. One box, on the left line, holding everything above the
          album; the album is its own box below (see COLUMN / BLEED). */}
      <div className={COLUMN}>
        {/* No in-page demo banner: a Demo mark sits beside the wordmark in
            guest-header.tsx, pinned to the top, so it never scrolls away. A
            banner here would scroll off and need re-saying itself. */}
        {/* LEFT-EDITORIAL header: identity title, one byline line, the stats
          line, then the action block.
          PRIVACY RULE: at `none` (locked password event) only the NAME renders —
          no byline/stats/avatar (matches the OG metadata; the entry sheet owns
          the count tease). "Hosted by" shows only when the host set a real name;
          the avatar only if one exists (no initials fallback here). */}
        <header>
          <h1
            data-arrive
            style={{ "--arrive-i": 0 } as React.CSSProperties}
            className="font-heading text-page text-balance"
          >
            {event.name}
          </h1>
          {access !== "none" && (
            <>
              {(event.host_display_name?.trim() || event.event_date) && (
                <p
                  data-reveal
                  style={{ "--reveal-i": revealBase } as React.CSSProperties}
                  className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground"
                >
                  {event.host_display_name?.trim() && (
                    <span className="flex items-center gap-1.5">
                      <span className="text-faint">Hosted by</span>
                      {/* Seeded, photo or not: without a photo the byline
                          still draws the seeded initial rather than nothing. */}
                      <Avatar seed={hostSeed ?? undefined} size="sm">
                        <AvatarImage src={hostAvatarUrl ?? undefined} alt="" />
                        <AvatarFallback>
                          {initial(null, event.host_display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">
                        {event.host_display_name}
                      </span>
                    </span>
                  )}
                  {event.host_display_name?.trim() && event.event_date && (
                    <span aria-hidden className="text-faint">
                      ·
                    </span>
                  )}
                  {event.event_date && (
                    <span>{formatEventDate(event.event_date)}</span>
                  )}
                </p>
              )}
              <p
                data-reveal
                style={{ "--reveal-i": revealBase + 1 } as React.CSSProperties}
                className="mt-1 text-xs text-muted-foreground"
              >
                {formatCount(mediaCount)}{" "}
                {mediaCount === 1 ? "photo" : "photos"}
                {" & videos"}
                {guestCount > 0 && (
                  <>
                    {" "}
                    from {formatCount(guestCount)}{" "}
                    {guestCount === 1 ? "guest" : "guests"}
                  </>
                )}
              </p>
              {event.description && (
                <p
                  data-reveal
                  style={
                    { "--reveal-i": revealBase + 2 } as React.CSSProperties
                  }
                  className="mt-2 max-w-prose text-reading text-pretty text-muted-foreground"
                >
                  {event.description}
                </p>
              )}
            </>
          )}
        </header>

        {access === "none" && (
          // Password not yet unlocked: the real COUNT tease over the ghosted
          // RIVER — shape and motion, zero pixels of this event's own media.
          //
          // ★ ONE PICTURE FOR NOTHING, IN BOTH PLACES A GUEST MEETS IT: the
          // locked page and the empty album both draw the flow, at the empty
          // album's own depth (`GhostRiver` owns that fade, so the two cannot
          // drift apart). The locked page leaks only the name, the count, and
          // stand-in frames that are not this event's, because the river's pack
          // is the local guest-ghost WebPs, never the album behind the lock.
          //
          // Act 1 "the stage": the lock line + the flow settle in (data-arrive)
          // under the planted name, instead of popping, before the sheet arrives.
          <div className="mt-8 space-y-4">
            <div
              data-arrive
              style={{ "--arrive-i": 1 } as React.CSSProperties}
              className="flex items-center justify-center gap-2 text-muted-foreground"
            >
              <Lock className="size-4" aria-hidden />
              <p className="text-reading">
                {stats.approvedTotal > 0
                  ? `${formatCount(stats.approvedTotal)} ${stats.approvedTotal === 1 ? "photo" : "photos"} & videos inside`
                  : "This event is private"}
              </p>
            </div>
            <div data-arrive style={{ "--arrive-i": 2 } as React.CSSProperties}>
              <GhostRiver />
            </div>
          </div>
        )}

        {access !== "none" && (
          <>
            {/* The action block: a full-width primary Add (only when
              the viewer can actually upload right now) over the secondary row.
              data-reveal: rises in last on the unlock reveal (the masonry's own
              seeded stagger carries from here).

              ★ NO SAVE IN THIS ROW: it feels natural after an upload, where
              above an album it is a random button, a growth lever asking a
              stranger to keep an album they have not seen yet, one tap from the
              event's own name. The offer waits until a guest has actually put
              something in the album, where the after-upload card makes it
              (guest-upload.tsx -> ClaimHandlePrompt -> the save card), in the
              door's own voice. Invite takes the width: a 2-col grid with one
              button in it is a row with a hole in it.

              ★ THE DEMO FILLS THE SAME HOLE DIFFERENTLY, with its Start your
              own button: a real guest has nothing to put there, but a demo
              VISITOR does — the conversion object the empty slot always was, on
              the same row as Invite rather than replacing it (the demo's visitor
              is a prospective host, not a guest choosing whether to keep an
              album). */}
            <div
              className="mt-4"
              ref={sentinelRef}
              data-reveal
              style={{ "--reveal-i": revealBase + 3 } as React.CSSProperties}
            >
              {canUpload && !galleryEmpty && (
                <Button
                  type="button"
                  size="lg"
                  className="w-full"
                  onClick={openAdd}
                >
                  <ImageUp /> Add photos
                </Button>
              )}
              <div
                className={cn(
                  "mt-2 grid gap-2",
                  isDemo ? "grid-cols-2" : "grid-cols-1",
                )}
              >
                {isDemo && (
                  <Button size="sm" className="h-9 w-full" asChild>
                    <Link href="/">Start your own</Link>
                  </Button>
                )}
                <GuestShare
                  joinUrl={shareUrl}
                  qrStyle={event.qr_style}
                  eventName={event.name}
                  triggerClassName="h-9 w-full"
                />
              </div>
            </div>

            {/* Upload area — only at `full` access (a `teaser` viewer is still at the door, which
              owns every step in front of them). Uploads off => a quiet view-only line.

              ★ NO INLINE "Add your name to upload" PANEL: a confirmed account with no profile name
              is asked at the DOOR, as its name step in `profile` mode, like every other guest and
              before the album rather than in a card halfway down it. */}
            {access === "full" &&
              (event.accepting_uploads ? (
                <div className="mt-7">
                  <GuestUpload
                    ref={uploadRef}
                    event={event}
                    qrToken={qrToken}
                    sessionToken={sessionToken}
                    queue={queue}
                    onAddFiles={addFiles}
                    onRetry={retry}
                    onDismiss={dismiss}
                    // The door's own step is showing this run's failures; one run never gets two
                    // surfaces (see the one queue's note above).
                    suppressFailures={uploadStepActive}
                    onFailuresClosed={flushPendingVerification}
                    isDemo={isDemo}
                    host={hostCard}
                    // The address typed at the door a few minutes ago, so the
                    // offer card's door opens on it instead of asking twice.
                    hintEmail={attachedEmail}
                    moment={moment}
                    removedIds={removedIds}
                  />
                </div>
              ) : (
                !isDemo && (
                  <>
                    <p className="mt-7 text-center text-reading text-muted-foreground">
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
                          savePrompt={null}
                        />
                      </div>
                    )}
                  </>
                )
              ))}
          </>
        )}
      </div>

      {access !== "none" && (
        <>
          {/* THE ALBUM, and nothing else, leaves the column to run the window's
              width. It is a sibling of the words box, not a block inside it. */}
          {/* ★ ONE LIVE SOURCE ABOVE THE ALBUM AND THE REEL. The provider owns the gallery's live
              state (the refreshed list, the arrivals, this device's own ids, the doorbell and the
              poll), so the Highlight reel tile, the full-screen view and the album all read ONE
              list: an upload reaches the grid and the reel in the same breath. The gallery streams
              in (the presign-heavy payload): the skeleton holds its layout slot, and nothing above
              the album waits for it. key={access} makes an access flip (teaser -> full after
              sign-in via router.refresh(), a transition - old UI holds) a clean remount that
              re-seeds from the fresh promise. The fallback wears the SAME box as the gallery, and
              the skeleton the same column rule AT THE SAME TILE SIZE, so the swap is layout-stable
              at every window: a two-column placeholder under a six-column album, or an
              eight-column one under seven, would flash the wrong layout on every load. */}
          <Suspense
            fallback={
              <div className={BLEED}>
                <GallerySkeleton tileSize={tileSize} />
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
              pendingUploads={inFlightUploads}
              canDeleteIds={canDeleteIds}
              isAuthed={isAuthed}
              sessionToken={sessionToken}
              approvedTotal={stats.approvedTotal}
              onOwnRemoved={handleOwnRemoved}
              onGuestCountChange={setGuestCount}
            >
              <LiveReel
                eventId={event.id}
                eventName={event.name}
                joinUrl={joinUrl}
                displayAddress={displayAddress}
                qrStyle={event.qr_style}
                isDemo={isDemo}
                moderated={event.moderation_mode !== "live"}
                onAddYours={canUpload ? openAdd : undefined}
                addClipToAlbum={canUpload ? addClipToAlbum : null}
                queue={queue}
                welcomePending={welcomePending}
                isOwner={isOwner}
              >
                {/* THE HIGHLIGHT REEL TILE: its own slot directly above the demo's one slot and the
                    album (never a fourth arm of `pickAboveAlbumState`), on the words' column so it
                    reads as the page's showpiece rather than a banner the width of the window.
                    Absent below the minimum. */}
                <LiveReelTile className={cn(COLUMN, "mt-7 mb-4")} />
                {/* The demo's turn card or the phone pair: one card directly
                    above the album's first tile — the photograph a visitor just
                    added IS that tile (the album is newest first), so whatever is
                    said here is said right beside it. It keeps the ALBUM's own box
                    (BLEED), not the words' column, so it lines up with the
                    photographs under it; the album itself is one CSS multi-column
                    box and nothing can be put in the middle of one. */}
                {aboveAlbum && (
                  <div className={cn(BLEED, "mb-4")}>{aboveAlbum}</div>
                )}
                <div className={BLEED}>
                  <LiveGallery
                    galleryPromise={galleryPromise}
                    qrToken={qrToken}
                    access={access}
                    isDemo={isDemo}
                    onOpenGate={() => entryRef.current?.openToGate()}
                    onAddFirst={canUpload ? openAdd : undefined}
                    joinUrl={joinUrl}
                    initialTileSize={tileSize}
                    closesOnLastRemoval={closesOnLastRemoval}
                  />
                </div>
              </LiveReel>
            </GalleryLiveProvider>
          </Suspense>

          {/* The named Guests section (profiles-social.md, host-keyed) — after the album,
              before the report footer: context about who filled it, never
              competing with the media. Server-composed slot; null = key off.
              It is words, so it keeps the column. */}
          {guestListSlot && <div className={COLUMN}>{guestListSlot}</div>}

          {/* THE DOCK: the row sits on landing, and the dock takes its place the
              moment it leaves the screen, with the row's own two actions (and
              mounted-but-inert until then, so it travels in rather than
              appearing). Both actions, because an Add alone would leave Invite
              unreachable deep in an album. */}
          <GuestActionDock
            hidden={headerActionsInView}
            uploadingCount={uploadingCount}
            onAdd={canUpload && !galleryEmpty ? openAdd : undefined}
            invite={
              <GuestShare
                joinUrl={shareUrl}
                qrStyle={event.qr_style}
                eventName={event.name}
                triggerClassName="h-9 flex-1 sm:flex-none"
              />
            }
          />

          {/* Discreet anonymous report path (the report capability is the qr_token).
              The rule under the album runs the album's width, so it reads as the
              page's last line rather than a stray hairline under the words —
              the BLEED's gutter as a margin rather than its padding, because the
              hairline IS the alignment, and a padded box would run its border
              under the gutter to the window's edge. */}
          {!isDemo && (
            <footer className="mx-3 mt-8 flex justify-center border-t border-border/60 pt-5 sm:mx-5">
              <ReportDialog qrToken={qrToken} />
            </footer>
          )}
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
        </>
      )}
    </div>
  );
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
