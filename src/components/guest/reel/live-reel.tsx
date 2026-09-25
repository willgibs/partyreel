"use client";

/**
 * THE LIVE REEL ON THE ALBUM PAGE: the controller that decides whether this viewer's album has a
 * reel, opens and closes the full-screen view from the address (`?reel`, `?reel=screen`), and hosts
 * the three things that hang off it: the Highlight reel tile, the view itself (lazy), and the
 * one-time approval toast.
 *
 * The main reel is a faster-paced slideshow the album builds by itself: a clickable showpiece that
 * shuffles every current (not hidden) photo and video in the event into a reel anyone can watch
 * at any time, with nothing asked of the host. So nothing here is stored and nothing waits on the
 * host: the reel is the album's own live payload (gallery-live.tsx), composed on this device.
 *
 * ★ IT EXISTS FROM THE SECOND ITEM, AND BELOW IT THERE IS NOTHING (`liveReelAvailable`): no tile, no
 * view, no `?reel`. With the host's switch off, the platform lever off, or a door still standing
 * (access short of `full`) there is nothing either. One exception: the screen posture
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
  useState,
} from "react";
import type { ReactNode } from "react";
import { Clapperboard } from "lucide-react";
import { toast } from "sonner";

import "./live-reel.css";

import {
  useGalleryLive,
  type GalleryLive,
} from "@/components/guest/gallery-live";
import { PosterCard } from "@/components/reel/poster-card";
import { liveReelAvailable, type GalleryItem } from "@/lib/events/gallery-reel";
import { GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
import { setReelDefaults } from "@/lib/reel/defaults-action";
import { stillUrlFor } from "@/lib/reel/live/items";
import { playableSignature, tileStills } from "@/lib/guest/reel-tile";
import { useReelParam, type ReelMode } from "@/lib/guest/reel-url";
import type { QueueItem } from "@/lib/guest/use-upload-queue";
import { cn } from "@/lib/utils";

import {
  preloadReelCreator,
  REEL_CREATOR,
  type ReelCreator,
} from "./creator-seam";
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
  /**
   * Open the view with the creator already asked for (the tile's "Make your own clip to share"): the
   * view opens it the moment it can tell this browser makes clips, and otherwise explains, in its
   * own greyed button, why not.
   */
  openCreator: () => void;
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
  /** The event's name, which the clip's room leads with. */
  eventName: string;
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
  /** Put a finished clip into the album (the creator's seam), when this viewer may. */
  addClipToAlbum?: ((file: File, poster: Blob) => void) | null;
  /** This device's upload queue: the toast reads its held items. */
  queue: readonly QueueItem[];
  /**
   * ★ THE WELCOME COMES FIRST: this visitor still owes the door (the page's EntryModal says so,
   * and a page that has not heard from it yet assumes so). While it is owed an address's reel
   * waits, under nothing and over nothing, and opens the moment they are through.
   */
  welcomePending?: boolean;
  /** The event's owner is watching: the view shows the host's extras, and its Close goes back. */
  isOwner?: boolean;
  children: ReactNode;
};

export function LiveReel({
  eventId,
  eventName,
  joinUrl,
  displayAddress,
  qrStyle,
  isDemo,
  moderated,
  onAddYours,
  addClipToAlbum = null,
  queue,
  welcomePending = false,
  isOwner = false,
  children,
}: LiveReelProps) {
  const live = useGalleryLive();
  if (!live) {
    throw new Error("LiveReel must sit inside a GalleryLiveProvider");
  }
  const playable = isDemo ? live.items : live.serverItems;
  const available = liveReelAvailable(live.reel, playable);
  const { mode, open: openParam, close } = useReelParam();

  // The creator leads somewhere only with the host's plan in hand (the clip's facts are the server's),
  // and never in the demo, which has no creator (its visitor's photographs are simulated).
  const creator =
    !isDemo && REEL_CREATOR && live.reel?.clip ? REEL_CREATOR : null;

  // ★ THE WELCOME COMES FIRST. A visitor who still owes the door meets it first, with no reel under
  // it or over it; the moment they are through, the reel their link asked for opens. The owner
  // never owes it. The screen posture is no exception: whoever sets up a wall (a host signed in on
  // a venue computer, or a laptop sent the guest link) has been through the door on that device,
  // like any guest.
  //
  // ★ WHAT AN ADDRESS ASKING FOR THE REEL GETS, once the door is behind them. At full access the
  // answer is final: the view, the screen's idle state below the minimum, or (the reel off, or a
  // phone view below the minimum) the plain album, the parameter quietly dropped so a refresh does
  // not ask again. Below full access, or while the door is owed, it is left alone: a guest who
  // passes the door lands in the reel they were sent to (the address still asks).
  const reelOn = Boolean(
    live.reel && live.reel.showReel && live.reel.liveReelEnabled,
  );
  const screenIdle = mode === "screen" && reelOn && !available;
  const viewOpen =
    !welcomePending && mode !== null && (available || screenIdle);
  useEffect(() => {
    if (welcomePending || mode === null || live.access !== "full") return;
    if (available || screenIdle) return;
    close();
  }, [welcomePending, mode, live.access, available, screenIdle, close]);

  const open = useCallback(
    (next: ReelMode = "hand") => {
      preloadView();
      openParam(next);
    },
    [openParam],
  );
  // The tile's line asks for the creator itself: the view opens, and opens the creator on arrival.
  // The ask is spent the moment the view reads it, so a later open is the plain reel again.
  const [creatorAsked, setCreatorAsked] = useState(false);
  const openCreator = useCallback(() => {
    setCreatorAsked(true);
    open("hand");
  }, [open]);
  const spendCreatorAsk = useCallback(() => setCreatorAsked(false), []);
  // The view's own Close (and Escape, and Back): the owner goes back where they came from; the
  // quiet drop above never does, so an album under two keeps its visitor on the page.
  const closeView = useCallback(() => {
    setCreatorAsked(false);
    close({ returnBack: isOwner });
  }, [close, isOwner]);
  // The owner's "Set for everyone": the event-wide defaults' one write (it re-verifies the owner and
  // revalidates nothing, so the reel keeps playing). Never in the demo, whose visitor owns nothing.
  const setForEveryone = useCallback(
    async (look: { styleId: string; holdSec: number }) => {
      const result = await setReelDefaults({
        eventId,
        styleId: look.styleId,
        holdSec: look.holdSec,
      });
      return result.ok;
    },
    [eventId],
  );

  const controller = useMemo<ReelController>(
    () => ({ available, open, openCreator, playable, creator, eventId }),
    [available, open, openCreator, playable, creator, eventId],
  );

  const viewProps: ReelViewProps | null = viewOpen
    ? {
        mode: mode ?? "hand",
        idle: screenIdle,
        eventId,
        eventName,
        joinUrl,
        displayAddress,
        qrStyle,
        isDemo,
        playable,
        onAddYours,
        creator,
        addClipToAlbum,
        moderated,
        creatorAsked,
        onCreatorAskSpent: spendCreatorAsk,
        isOwner,
        onSetForEveryone: isOwner && !isDemo ? setForEveryone : undefined,
        onClose: closeView,
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
 * THE HIGHLIGHT REEL TILE: its own slot above the album, a slow crossfade of the reel's own stills
 * (`reel-front` r2, `signature=plain`), headed "Highlight reel". No style name, no moment count, no
 * chip: the album beneath it carries the count. A tap opens the view; absent below the minimum; it
 * stays after uploads close.
 *
 * ★ THE CORNER IS A GLYPH (`badge=glyph`): a 24px disc of the house glass mark holding a 12px
 * clapperboard, 10px in from the top-left, so the tile reads as footage without a word competing
 * with the heading.
 *
 * ★ "MAKE YOUR OWN CLIP TO SHARE" IS A LINE, NOT A PILL (Will's round-1 note on `verbs`; round 2
 * drew a pill by mistake and he turned it down): the violet line under the heading, only once a
 * creator is registered, so no build promises a clip it cannot make. It is its own control, and
 * opens the creator directly (a call, his to overrule), so the watch target is a layer of its own
 * across the whole card rather than a button around it (a button cannot hold a button).
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
    <div
      className={cn(
        "relative rounded-lg transition-transform duration-150 ease-emphasis",
        "has-[[data-reel-watch]:active]:scale-[0.99] motion-reduce:has-[[data-reel-watch]:active]:scale-100",
        className,
      )}
      data-reel-tile
    >
      <PosterCard
        eventName="Highlight reel"
        chip={
          <span
            data-reel-glyph
            className={cn(
              "flex size-6 items-center justify-center rounded-full text-white",
              GLASS_MARK,
            )}
          >
            <Clapperboard
              className={cn("size-3", GLASS_MARK_LIT)}
              aria-hidden
            />
          </span>
        }
        meta={
          controller.creator ? (
            <button
              type="button"
              onClick={controller.openCreator}
              onPointerEnter={preloadCreatorDoor}
              onFocus={preloadCreatorDoor}
              data-reel-make
              className={cn(
                // Above the watch layer, and a finger's height without growing the line itself.
                "pointer-events-auto relative z-[2] -mx-1 -my-2 rounded-sm px-1 py-2 text-left text-micro font-medium text-[oklch(0.8_0.14_300)] outline-none",
                "hover:underline hover:underline-offset-2 focus-visible:underline focus-visible:ring-2 focus-visible:ring-white/70",
              )}
            >
              Make your own clip to share
            </button>
          ) : undefined
        }
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
      <button
        type="button"
        onClick={() => controller.open("hand")}
        onPointerEnter={preloadView}
        onFocus={preloadView}
        aria-label="Watch the highlight reel"
        data-reel-watch
        className="absolute inset-0 z-[1] rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </div>
  );
}

/** The line's intent warms both halves of the door it opens: the view, and the creator inside it. */
function preloadCreatorDoor() {
  preloadView();
  preloadReelCreator();
}

/* ── the approval toast ──────────────────────────────────────────────────────── */

/**
 * THE APPROVAL TOAST: "The host added your uploads", with a "Watch reel" action for a guest deep in
 * the album who wants to see it now. It carries no number, because not every upload may have been
 * approved and a live count would need updating in place; it simply appears once, when at least
 * one of this guest's uploads will be in the reel on a moderated event.
 *
 * ★ ONCE PER VISIT, on a moderated event, the moment the first of this device's HELD uploads shows up
 * approved in the album (its media id reaches the live list) and would play (not a clip). Never
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
