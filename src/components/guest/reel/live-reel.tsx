"use client";

/**
 * THE LIVE REEL ON THE ALBUM PAGE (reel-guest-wiring, 2026-09-24): the controller that decides
 * whether this viewer's album has a reel, opens and closes the full-screen view from the address
 * (`?reel`, `?reel=screen`), and hosts the three things that hang off it: the Highlight reel tile,
 * the view itself (lazy), and the one-time approval toast.
 *
 * Will's concept, verbatim: "The main reel is a dynamically created, faster-paced slideshow
 * (designed as somewhat of a clickable showpiece in the album) that randomizes all the
 * current/existing (not hidden) media in the event gallery for an immediately watchable reel
 * anytime ... Does not require any host action for main reel." So nothing here is stored and
 * nothing waits on the host: the reel is the album's own live payload (gallery-live.tsx),
 * composed on this device.
 *
 * ★ IT EXISTS FROM THE SECOND ITEM, AND BELOW IT THERE IS NOTHING (`liveReelAvailable`): no tile, no
 * view, no `?reel`. With the host's switch off, the platform lever off, or a door still standing
 * (access short of `full`) there is nothing either. One exception, by ruling: the screen posture
 * below the minimum shows its idle state (the code and the address alone), because the host set a
 * screen up before anyone arrived, and a blank wall is the one place a code does its job best.
 *
 * ★ WHICH LIST PLAYS. The reel reads the SERVER's approved list, so a photograph enters the loop the
 * moment the album confirms it (a completion refreshes at once), and never as the full-size blob of
 * an optimistic tile. The demo is the exception: its uploads are simulated and never reach a server,
 * so there the optimistic tiles play too, or a visitor's own photograph could never join the reel.
 */
import {
  createContext,
  lazy,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import "./live-reel.css";

import { useGalleryLive, type GalleryLive } from "@/components/guest/gallery-live";
import { PosterCard } from "@/components/reel/poster-card";
import {
  liveReelAvailable,
  type GalleryItem,
} from "@/lib/events/gallery-reel";
import { stillUrlFor } from "@/lib/reel/live/items";
import { playableSignature, tileStills } from "@/lib/guest/reel-tile";
import { useReelParam, type ReelMode } from "@/lib/guest/reel-url";
import type { QueueItem } from "@/lib/guest/use-upload-queue";
import { cn } from "@/lib/utils";

import { REEL_CREATOR, type ReelCreator } from "./creator-seam";
import type { ReelViewProps } from "./live-reel-view";

// The view reaches the whole canvas engine; nobody who never opens it downloads it (the
// EntryModalLazy precedent). The tile and this controller carry no engine at all. ONE import promise
// serves the warm-up and the lazy boundary alike, so a tap after a hover never asks twice.
let viewChunk: Promise<typeof import("./live-reel-view")> | null = null;
const loadView = () => (viewChunk ??= import("./live-reel-view"));
const LiveReelViewLazy = lazy(() =>
  loadView().then((m) => ({ default: m.LiveReelView })),
);

/** Warm the view's chunk on intent (a pointer over the tile), so the first tap opens at once. */
function preloadView() {
  void loadView();
}

type ReelController = {
  /** The reel exists for this viewer right now. */
  available: boolean;
  /** Open the view (`hand`) or the screen posture (`screen`). */
  open: (mode?: ReelMode) => void;
  /** The list the reel plays (see the header). */
  playable: readonly GalleryItem[];
  /** A creator is registered AND the host's plan was read, so "Make your own" leads somewhere. */
  creator: ReelCreator | null;
  eventId: string;
};

const ReelControllerContext = createContext<ReelController | null>(null);

export function useReelController(): ReelController | null {
  return useContext(ReelControllerContext);
}

export type LiveReelProps = {
  eventId: string;
  /** The canonical join link the code encodes. */
  joinUrl: string;
  /** The address a person can read off the screen (the custom slug's, when the event has one). */
  displayAddress: string;
  /** The event's QR preset (the code plate draws the host's own design). */
  qrStyle: string;
  isDemo: boolean;
  /** Held uploads are this device's to watch for (the approval toast). */
  moderated: boolean;
  /** The page's Add, when this viewer may add right now (the view's "Add yours"). */
  onAddYours?: () => void;
  /** Put a finished cut into the album (the creator's seam), when this viewer may. */
  addCutToAlbum?: ((file: File, poster: Blob) => void) | null;
  /** This device's upload queue: the toast reads its held items. */
  queue: readonly QueueItem[];
  children: ReactNode;
};

export function LiveReel({
  eventId,
  joinUrl,
  displayAddress,
  qrStyle,
  isDemo,
  moderated,
  onAddYours,
  addCutToAlbum = null,
  queue,
  children,
}: LiveReelProps) {
  const live = useGalleryLive();
  if (!live) {
    throw new Error("LiveReel must sit inside a GalleryLiveProvider");
  }
  const playable = isDemo ? live.items : live.serverItems;
  const available = liveReelAvailable(live.reel, playable);
  const { mode, open: openParam, close } = useReelParam();

  // The creator leads somewhere only with the host's plan in hand (the cut's facts are the server's),
  // and never in the demo, which has no creator (its visitor's photographs are simulated).
  const creator =
    !isDemo && REEL_CREATOR && live.reel?.cut ? REEL_CREATOR : null;

  // ★ WHAT AN ADDRESS ASKING FOR THE REEL GETS. At full access the answer is final: the view, the
  // screen's idle state below the minimum, or (the reel off, or a phone view below the minimum) the
  // plain album, the parameter quietly dropped so a refresh does not ask again. Below full access
  // it is left alone: the door comes first, and a guest who passes it lands in the reel they were
  // sent to (the refresh remounts this provider, and the address still asks).
  const reelOn = Boolean(
    live.reel && live.reel.showReel && live.reel.liveReelEnabled,
  );
  const screenIdle = mode === "screen" && reelOn && !available;
  const viewOpen = mode !== null && (available || screenIdle);
  useEffect(() => {
    if (mode === null || live.access !== "full") return;
    if (available || screenIdle) return;
    close();
  }, [mode, live.access, available, screenIdle, close]);

  const open = useCallback(
    (next: ReelMode = "hand") => {
      preloadView();
      openParam(next);
    },
    [openParam],
  );

  const controller = useMemo<ReelController>(
    () => ({ available, open, playable, creator, eventId }),
    [available, open, playable, creator, eventId],
  );

  const viewProps: ReelViewProps | null = viewOpen
    ? {
        mode: mode ?? "hand",
        idle: screenIdle,
        eventId,
        joinUrl,
        displayAddress,
        qrStyle,
        isDemo,
        playable,
        onAddYours,
        creator,
        addCutToAlbum,
        onClose: close,
      }
    : null;

  return (
    <ReelControllerContext value={controller}>
      {children}
      {viewProps && (
        <Suspense fallback={null}>
          <LiveReelViewLazy {...viewProps} />
        </Suspense>
      )}
      {moderated && !isDemo && (
        <ApprovalToast
          live={live}
          queue={queue}
          available={available}
          viewOpen={viewOpen}
          onWatch={() => open("hand")}
        />
      )}
    </ReelControllerContext>
  );
}

/* ── the tile ────────────────────────────────────────────────────────────────── */

const NO_ITEMS: readonly GalleryItem[] = [];

/** One still's slot in the six-slot cycle, in seconds (see live-reel.css). */
const TILE_HOLD_SEC = 3.2;

/**
 * THE HIGHLIGHT REEL TILE (Will's `tile=crossfade` and `verbs=watch-make`, as amended): its own
 * slot above the album, a slow crossfade of the reel's own stills, headed "Highlight reel". The
 * description "Make your own clip to share" appears only once a creator is registered, so no build
 * promises a clip it cannot make. No style name, no moment count, no corner badge (his `verbs`
 * note), and no chip until reel-front's second round names what replaces it. The album beneath it
 * carries the count. A tap opens the view. Absent below the minimum (`states=nothing`), and it
 * stays after uploads close (`closed=plays`).
 */
export function LiveReelTile({ className }: { className?: string }) {
  const controller = useReelController();
  const live = useGalleryLive();
  const playable = controller?.playable ?? NO_ITEMS;
  const eventId = controller?.eventId ?? "";
  const ownIds = live?.ownIds ?? null;

  // WHICH stills are recomputed only when the album's playable membership changes; their URLS are
  // read from the latest items every render, so the half-hourly presign roll reaches the tile too.
  const signature = playableSignature(playable);
  const picked = useMemo(
    () => tileStills(playable, { eventId, ownIds }).map((s) => s.id),
    // `signature` stands for `playable`'s membership on purpose (see above); `ownIds` joins so a
    // guest's own first photograph can lead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [signature, eventId, ownIds],
  );
  const byId = useMemo(
    () => new Map(playable.map((item) => [item.id, item])),
    [playable],
  );

  if (!controller?.available || !live) return null;
  const urls = picked
    .map((id) => {
      const item = byId.get(id);
      return item ? stillUrlFor(item) : "";
    })
    .filter(Boolean);
  if (urls.length === 0) return null;
  const total = TILE_HOLD_SEC * urls.length;

  return (
    <div className={className} data-reel-tile>
      <button
        type="button"
        onClick={() => controller.open("hand")}
        onPointerEnter={preloadView}
        onFocus={preloadView}
        aria-label="Watch the highlight reel"
        className={cn(
          "group block w-full rounded-lg text-left outline-none",
          "transition-transform duration-150 ease-emphasis active:scale-[0.99] motion-reduce:active:scale-100",
          "focus-visible:ring-3 focus-visible:ring-ring/50",
        )}
      >
        <PosterCard
          eventName="Highlight reel"
          meta={controller.creator ? "Make your own clip to share" : undefined}
          media={
            <div className="relative aspect-[2/1] w-full overflow-hidden bg-muted sm:aspect-[21/9]">
              {urls.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element -- a presigned preview (next/image would cache a url that expires)
                <img
                  key={`${i}-${src.slice(-24)}`}
                  src={src}
                  alt=""
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                  data-rest={i === 0 ? "" : undefined}
                  onError={live.reportPossibleExpiry}
                  className="lr-still"
                  style={
                    {
                      "--lr-hold": TILE_HOLD_SEC,
                      "--lr-delay": i * TILE_HOLD_SEC - total,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
          }
        />
      </button>
    </div>
  );
}

/* ── the approval toast ──────────────────────────────────────────────────────── */

/**
 * WILL'S `yours=toast`, verbatim: "should likely be a more clear 'The host added your uploads' with
 * a 'Watch reel' action if guests are deeper in the album but want to check it out immediately. The
 * more generic 'The host added your uploads' intentionally avoids numbers in case all weren't, and
 * to avoid having to update a live number in the toast so it simply appears once when at least 1+
 * guest media will be in the reel with moderation enabled."
 *
 * ★ ONCE PER VISIT, on a moderated event, the moment the first of this device's HELD uploads shows up
 * approved in the album (its media id reaches the live list) and would play (not a cut). Never
 * while no reel is showing: "Watch reel" must lead somewhere. And not while the view is already
 * open, where the arrival chip says the same thing on the picture itself; the moment is spent either
 * way. The queue lives in memory, so this can only fire within the visit that made the upload (the
 * server's half, telling a guest on their next visit, is a ROADMAP line).
 */
function ApprovalToast({
  live,
  queue,
  available,
  viewOpen,
  onWatch,
}: {
  live: GalleryLive;
  queue: readonly QueueItem[];
  available: boolean;
  viewOpen: boolean;
  onWatch: () => void;
}) {
  const spentRef = useRef(false);
  // Every held completion this visit made (a queue item can leave the queue; its id must not).
  const watchingRef = useRef(new Set<string>());

  useEffect(() => {
    if (spentRef.current) return;
    const watching = watchingRef.current;
    for (const item of queue) {
      if (
        item.status === "done" &&
        item.mediaStatus === "pending" &&
        item.mediaId
      ) {
        watching.add(item.mediaId);
      }
    }
    if (watching.size === 0) return;
    const approved = live.serverItems.find(
      (item) => watching.has(item.id) && item.reelEligible !== false,
    );
    if (!approved) return;
    spentRef.current = true;
    if (!available || viewOpen) return;
    toast("The host added your uploads", {
      action: { label: "Watch reel", onClick: onWatch },
    });
  }, [queue, live.serverItems, available, viewOpen, onWatch]);

  return null;
}
