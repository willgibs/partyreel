"use client";

/**
 * THE LIVE REEL ON THE ALBUM PAGE: the controller that decides whether this viewer's album has a
 * reel, opens and closes the full-screen view from the address (`?reel`, `?reel=screen`), and hosts
 * what hangs off it: the view itself (lazy), the once-a-visit approval toast, and what the album's
 * head needs from it (`event-experience-head.tsx`'s bridge: the cover's photographs and the reel's
 * door, for the cover's round and the shutter's twin).
 *
 * The main reel is a faster-paced slideshow the album builds by itself: a clickable showpiece that
 * shuffles every current (not hidden) photo and video in the event into a reel anyone can watch
 * at any time, with nothing asked of the host. So nothing here is stored and nothing waits on the
 * host: the reel is the album's own live payload (gallery-live.tsx), composed on this device.
 *
 * ★ THE REEL LIVES IN THE HEAD (`event-header` r1's carried call `reel`, taken): the tile that sat
 * above the album went, and the cover IS the reel's face, its own stills dissolving under the event's
 * name with a round that plays it. So this controller no longer draws anything above the album; it
 * publishes the cover's stills and the reel's door to the head, which stands outside the album's
 * live source (the shell paints first and outlives the album's own failure).
 *
 * ★ IT EXISTS FROM THE SECOND ITEM, AND BELOW IT THERE IS NOTHING (`liveReelAvailable`): no round,
 * no view, no `?reel`. With the host's switch off, the platform lever off, or a door still standing
 * (access short of `full`) there is nothing either. One exception: the screen posture
 * below the minimum shows its idle state (the code and the address alone), because the host set a
 * screen up before anyone arrived, and a blank wall is the one place a code does its job best.
 *
 * ★ WHICH LIST PLAYS. The reel reads the SERVER's approved list, the manifest, so a photograph enters
 * the loop the moment the album confirms it (a completion syncs at once), and never as the full-size
 * blob of an optimistic tile. The demo is the exception: its uploads are simulated and never reach a
 * server, so there the optimistic tiles play too, or a visitor's own photograph could never join.
 *
 * ★ ON THE PAGED ALBUM IT PLANS FROM THE MANIFEST AND READS LINKS BY ID. The list the reel plays is
 * the manifest's items with no urls (`reelItems`: whether each has a still is its flags' word,
 * `drawable`), so the minimum, the take and the cover's stills are counted over the whole album; a
 * clip's links are minted a window or two ahead of its turn through the provider's resolver.
 */
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import "./live-reel.css";

import {
  COVER_SLOTS,
  type HeadBridge,
  type HeadStill,
  pickCoverIds,
} from "@/components/guest/event-experience-head";
import {
  useGalleryLive,
  type GalleryLive,
} from "@/components/guest/gallery-live";
import type { ApprovalNews } from "@/components/guest/upload-tracker";
import type { ClipResolver } from "@/lib/album/resolver";
import { liveReelAvailable } from "@/lib/events/gallery-reel";
import { setReelDefaults } from "@/lib/reel/defaults-action";
import { keepStills } from "@/lib/guest/reel-tile";
import {
  isReelEligible,
  stillUrlFor,
  type LiveMediaItem,
} from "@/lib/reel/live/items";
import {
  reelOfAddress,
  useReelParam,
  type ReelMode,
} from "@/lib/guest/reel-url";
import type { QueueItem } from "@/lib/guest/use-upload-queue";

import { REEL_CREATOR } from "./creator-seam";
import type { ReelViewProps } from "./live-reel-view";

// The view reaches the whole canvas engine; nobody who never opens it downloads it (the
// EntryModalLazy precedent). The head's round and this controller carry no engine at all. ONE import
// promise serves the warm-up and the lazy boundary alike, so a tap after a hover never asks twice.
let viewChunk: Promise<typeof import("./live-reel-view")> | null = null;
const loadView = () => (viewChunk ??= import("./live-reel-view"));
const LiveReelViewLazy = lazy(() =>
  loadView().then((m) => ({ default: m.LiveReelView })),
);

/** Warm the view's chunk on intent (a pointer over the reel's round), so the first tap opens at once. */
function preloadView() {
  void loadView();
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
   * The server's news (crumbs-38): her uploads a decision let into the album since she was last told,
   * answered by her tracker's own-rows read (`upload-tracker.tsx`). The toast watches them as it
   * watches this visit's held uploads, so a return is told too, once.
   */
  approvalNews?: ApprovalNews;
  /**
   * ★ THE WELCOME COMES FIRST: this visitor still owes the door (the page's EntryModal says so,
   * and a page that has not heard from it yet assumes so). While it is owed an address's reel
   * waits, under nothing and over nothing, and opens the moment they are through.
   */
  welcomePending?: boolean;
  /** The event's owner is watching: the view shows the host's extras, and its Close goes back. */
  isOwner?: boolean;
  /**
   * The album's head, above the live source: this controller tells it the cover's photographs and
   * the reel's door (`event-experience-head.tsx`). Absent where no head listens.
   */
  headBridge?: HeadBridge | null;
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
  approvalNews,
  welcomePending = false,
  isOwner = false,
  headBridge = null,
  children,
}: LiveReelProps) {
  const live = useGalleryLive();
  if (!live) {
    throw new Error("LiveReel must sit inside a GalleryLiveProvider");
  }
  const playable = live.reelItems;
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
  // The view's own Close (and Escape, and Back): the owner goes back where they came from; the
  // quiet drop above never does, so an album under two keeps its visitor on the page.
  const closeView = useCallback(() => {
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

  // ★ WHAT THE HEAD READS (the head note): the cover's photographs as the album moves, and the reel's
  // door. `viewAsked` is the address's own word (`?reel` stands), which drops the moment the reel is
  // closed or turns out not to play, so the page's curtain for an owner arriving from her hub
  // stands exactly as long as the view is on its way or open.
  //
  // ★ AND THE WORD IS READ WHEN IT IS TOLD, NEVER COPIED FROM THIS RENDER (crumbs-52, red-team 43's second
  // MEDIUM). An album that mounts in the commit of a soft navigation renders against the page it is leaving
  // (`reel-url.ts`'s header: Next writes the new address in that commit), so this render's `mode` said "no
  // `?reel`" while the address, by the time this effect ran, already did; told as it was, the page took it for
  // "the address stopped asking" and let its curtain go in the same task, and the album painted bare for the
  // 0.3 to 1 s before the view. `mode` is here only to run the effect again when the address moves.
  const stills = useCoverStills(live, playable, eventId, available);
  const viewAsked = mode !== null;
  useEffect(() => {
    if (!headBridge) return;
    headBridge.set({
      stills,
      reportExpiry: live.reportPossibleExpiry,
      reel: {
        available,
        open: () => open("hand"),
        preload: preloadView,
        viewAsked: reelOfAddress() !== null,
      },
    });
  }, [
    headBridge,
    stills,
    live.reportPossibleExpiry,
    available,
    open,
    viewAsked,
  ]);
  // And it goes with the album: a remount (an access flip) or a page left takes its word with it.
  useEffect(() => () => headBridge?.set(null), [headBridge]);

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
        isOwner,
        onSetForEveryone: isOwner && !isDemo ? setForEveryone : undefined,
        onClose: closeView,
      }
    : null;

  return (
    <>
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
          news={approvalNews}
          welcomePending={welcomePending}
          available={available}
          viewOpen={viewOpen}
          onWatch={() => open("hand")}
        />
      )}
    </>
  );
}

/* ── the cover's photographs ────────────────────────────────────────────────────────────────── */

const NO_STILLS: readonly HeadStill[] = [];
const NO_STILLS_IDS: readonly string[] = [];

/** The cover's standing deal: the ids it dissolves through, kept only while the reel plays (`useCoverStills`). */
type Deal = { on: boolean; ids: readonly string[] };
const NO_DEAL: Deal = { on: false, ids: NO_STILLS_IDS };

/**
 * An item as a still is drawn: its own urls where it carries them (the demo's optimistic tiles), else
 * the links the resolver holds (a still is a photograph's `tile`, or a video's preview, which is its
 * `tile` too; a video with no preview is never drawable, so never asked).
 */
function linkedStill(
  item: LiveMediaItem,
  clips: ClipResolver | null,
): LiveMediaItem {
  if (item.url || item.previewUrl) return item;
  const link = clips?.get(item.id);
  return link ? { ...item, url: link.view, previewUrl: link.tile } : item;
}

/**
 * THE COVER'S PHOTOGRAPHS, LIVE: the cover rule's picks (`pickCoverIds`: the reel's own opening while
 * the album has a reel, her own first once she has added one, else the album's newest), each with
 * its preview's link once it is in hand. WHICH photographs is recomputed only when the album's
 * membership changes; their LINKS are read by id every render, so a link that lands, or is re-minted,
 * reaches the cover too. A teaser has no manifest, so its own nine's newest stand in.
 *
 * The picks' links are asked for once per set of picks: a reel switched off never minted them with the
 * page's seed, and the cover draws previews only.
 *
 * ★ WHILE THE REEL PLAYS, THE COVER KEEPS THE STILLS IT IS PLAYING (compute-reads, `keepStills`). The take's first
 * pass is a seeded shuffle of the whole album, so one arrival changed nearly all six picks: the cover swapped its
 * pictures under the viewer on every batch and asked for the links of the new ones, a links call behind every delta.
 * The first deal is the take's, and after it a still stays until the album loses it (then the take's next takes the
 * place) or her own newest upload leads; a reload deals afresh. The newest-six rule below the reel's minimum keeps
 * nothing: each arrival IS its new newest, whose link rode the delta.
 */
function useCoverStills(
  live: GalleryLive,
  playable: readonly LiveMediaItem[],
  eventId: string,
  reelOn: boolean,
): readonly HeadStill[] {
  const ownIds = live.ownIds;
  // What a cold deal would pick now.
  const fresh = useMemo(
    () => pickCoverIds(playable, { eventId, ownIds, reelOn }),
    [playable, eventId, ownIds, reelOn],
  );
  const byId = useMemo(
    () => new Map(playable.map((item) => [item.id, item])),
    [playable],
  );
  // The deal that stands, kept in state beside the render that made it (React's own pattern for a value that depends on
  // the render before: a conditional set while rendering, which re-renders before anything is drawn or any effect runs).
  const [deal, setDeal] = useState<Deal>(NO_DEAL);
  const picked = useMemo(() => {
    if (!reelOn) return fresh;
    const lead =
      fresh[0] !== undefined && ownIds.has(fresh[0]) ? fresh[0] : null;
    return keepStills({
      playing: deal.on ? deal.ids : NO_STILLS_IDS,
      fresh,
      lead,
      stands: (id) => {
        const item = byId.get(id);
        return item !== undefined && isReelEligible(item);
      },
    });
  }, [reelOn, deal, fresh, byId, ownIds]);
  const next: Deal = reelOn
    ? deal.on && deal.ids === picked
      ? deal
      : { on: true, ids: picked }
    : NO_DEAL;
  if (next !== deal) setDeal(next);
  const ensureLinks = live.ensureLinks;
  useEffect(() => {
    ensureLinks(picked);
  }, [ensureLinks, picked]);
  const drawn: HeadStill[] = [];
  if (live.access === "teaser") {
    for (const item of live.serverItems) {
      const tile = item.previewUrl ?? (item.type === "photo" ? item.url : null);
      if (tile) drawn.push({ id: item.id, tile });
      if (drawn.length === COVER_SLOTS) break;
    }
  } else {
    for (const id of picked) {
      const item = byId.get(id);
      const tile = item ? stillUrlFor(linkedStill(item, live.clips)) : "";
      if (tile) drawn.push({ id, tile });
    }
  }
  // One array per set of drawn stills, so the head is told only when a picture changes.
  const key = drawn.map((s) => `${s.id} ${s.tile}`).join("\n");
  return useMemo(
    () =>
      key
        ? key.split("\n").map((line) => {
            const at = line.indexOf(" ");
            return { id: line.slice(0, at), tile: line.slice(at + 1) };
          })
        : NO_STILLS,
    [key],
  );
}

/* ── the approval toast ──────────────────────────────────────────────────────── */

/**
 * THE APPROVAL TOAST: "One of yours is in the album", with a "Watch reel" action for a guest deep in
 * the album who wants to see it now. It carries no number and claims only the one (crumbs-6, told
 * true beside `told=line`): it fires on the FIRST of this guest's held uploads to be approved, and
 * a plural "your uploads" would be a live lie the moment another of the same pick is left out; it
 * simply appears once, when at least one of this guest's uploads will be in the reel on a
 * moderated event.
 *
 * ★ ONCE PER VISIT, on a moderated event, the moment the first of her HELD uploads shows up approved
 * in the album (its media id reaches the live list) and would play (not a clip). Never while no reel
 * is showing: "Watch reel" must lead somewhere. And not while the view is already open, where the
 * arrival chip says the same thing on the picture itself; the moment is spent either way.
 *
 * ★ TWO SOURCES, ONE MOMENT (crumbs-38, the server's half): this device's queue, which lives in
 * memory, sees what this visit sent; the SERVER's news (`news`, her tracker's own-rows read) sees what
 * a decision let in since she was last told, so an upload approved after the visit that made it is
 * told on her next visit, on a reload, or on her account's other device, and the read that answers it
 * marks it told. Whichever arrives first spends the visit's one toast, and never over the door: while
 * her welcome is still owed the moment waits, unspent, and plays once she is through.
 */
const NO_NEWS: readonly string[] = [];
const noNews = () => NO_NEWS;
const noSubscription = () => () => {};

function ApprovalToast({
  live,
  queue,
  news,
  welcomePending,
  available,
  viewOpen,
  onWatch,
}: {
  live: GalleryLive;
  queue: readonly QueueItem[];
  news?: ApprovalNews;
  welcomePending: boolean;
  available: boolean;
  viewOpen: boolean;
  onWatch: () => void;
}) {
  const spentRef = useRef(false);
  // Every held completion this visit made (a queue item can leave the queue; its id must not), and
  // every id the server's news named.
  const watchingRef = useRef(new Set<string>());
  const told = useSyncExternalStore(
    news?.subscribe ?? noSubscription,
    news?.get ?? noNews,
    noNews,
  );

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
    for (const id of told) watching.add(id);
    if (watching.size === 0) return;
    // Never over the door: the moment waits, unspent, until she is through it.
    if (welcomePending) return;
    const approved = live.serverItems.find(
      (item) => watching.has(item.id) && item.reelEligible !== false,
    );
    if (!approved) return;
    spentRef.current = true;
    if (!available || viewOpen) return;
    // crumbs-6, told true beside `told=line`: this fires on the FIRST of her held uploads the
    // host approves, before the rest of the same pick are decided — "The host added your
    // uploads" (plural, all of them) can be a live lie when another is left out. "One of yours"
    // claims only what just happened, true no matter what the rest become.
    toast("One of yours is in the album", {
      action: { label: "Watch reel", onClick: onWatch },
    });
  }, [
    queue,
    told,
    welcomePending,
    live.serverItems,
    available,
    viewOpen,
    onWatch,
  ]);

  return null;
}
