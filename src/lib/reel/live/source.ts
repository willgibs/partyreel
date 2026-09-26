/**
 * THE CLIP SOURCE — the live reel's view of an album that keeps changing.
 *
 * One object holds everything the rolling composer needs and nothing it does not: the LATEST gallery
 * items by id, the loop's take, the windows planned so far, the arrivals waiting to be spliced in,
 * and the bitmap retains that keep a playing window's stills out of the LRU's way. The player owns
 * the clock and the canvas; the source owns the material.
 *
 * ★ IT READS THE ALBUM'S OWN PAYLOAD. `setItems` takes the same item list the gallery renders (no
 * second RPC, no second presign), so an upload that reaches the album through the doorbell reaches
 * the reel in the same breath, a hidden item leaves both at once, and the 30-minute presign roll
 * refreshes the loop for free — a clip's url is read at the moment its window is built and never
 * held (uploads-and-r2.md).
 *
 * ★ ON THE PAGED ALBUM THE LINKS COME BY ID (`resolver`, src/lib/album/resolver.ts). The items are
 * then the manifest's (no urls; `drawable` says whether each has a still), the take is planned over
 * all of them, and a clip's links are read from the resolver at the same moment a url would have
 * been read off the payload: `itemFor` merges them in, fresh on every call. Every planned slot asks
 * for its window's links and about two windows past it (`ensure`, fire and forget), so they land
 * long before their turn, and a window whose stills are still coming waits for them, boundedly
 * (`LINK_WAIT_MS`), rather than playing a theme-colour hold where a photograph should be.
 *
 * ★ ONE CALL DOES THE RIGHT THING. `setItems` splices what arrived and drops what left; `splice` and
 * `drop` stay public for a harness that simulates them. The FIRST payload is the seed, never an
 * arrival — the rule `reconcile-album-items.ts`'s `newArrivalIds` keeps for the album's own glow.
 *
 * No DOM and no React: the decode seam is injected, so this module runs in the node test project. It
 * deliberately does NOT import the style registry — a provider mounting a source must not drag
 * fourteen styles into the album's first paint, so the player passes the style's asset needs in.
 */

import type { ClipResolver } from "@/lib/album/resolver";
import {
  sharedBitmapCache,
  type BitmapCache,
} from "@/lib/reel/engine/asset-cache";
import {
  loadReelAssets,
  type ClipAsset,
  type ReelAssets,
} from "@/lib/reel/engine/assets";
import type { CanvasImage } from "@/lib/reel/engine/canvas2d";

import { isReelEligible, stillUrlFor, type LiveMediaItem } from "./items";
import { motionSeed, planTake } from "./take";
import {
  buildCutaway,
  buildWindow,
  DEFAULT_WINDOW_SIZE,
  type ReelLook,
  type ReelWindow,
} from "./window";

/** What a style declares it needs built per clip (the registry's `assetNeeds`, passed in). */
export type AssetNeeds = {
  washes: boolean;
  grain?: boolean;
  haloFilter?: string | null;
};

export type PrepareOptions = {
  needs: AssetNeeds;
  /** The render frame the washes normalize their blur to (a thumb's backing size). */
  frame?: { width: number; height: number };
  signal?: AbortSignal;
};

export type ClipSourceStats = {
  loopIndex: number;
  /** The current loop's take length. */
  takeLength: number;
  eligible: number;
  /** Windows planned and still held (the player keeps one behind, the current, two ahead). */
  windows: number;
  /** Windows whose stills are pinned against eviction — the number that must stay flat. */
  retained: number;
  /** Distinct urls pinned, across those windows. */
  retainedUrls: number;
  /** Per-clip derived assets (wash + halo) resident — the other number that must stay flat. */
  derived: number;
  pending: number;
  revision: number;
};

export type ClipSource = {
  readonly eventId: string;
  /** Adopt a payload: splices what arrived, drops what left. The first call is the seed. */
  setItems(items: readonly LiveMediaItem[]): {
    added: string[];
    dropped: string[];
  };
  /** The device's own ids, for "yours first" (takes effect on the next loop). */
  setOwnIds(ids: ReadonlySet<string> | null): void;
  /** Queue arrivals to enter the loop right after the clip on screen. */
  splice(ids: readonly string[]): void;
  /** How many arrivals are waiting. Cheap: the player asks once a tick. */
  pendingCount(): number;
  /** Cut these ids from the take and from every window not yet on screen, immediately. */
  drop(ids: readonly string[]): void;
  itemFor(id: string): LiveMediaItem | undefined;
  /** Whether this id is still playable — the player's per-frame drop check. */
  isLive(id: string): boolean;
  eligibleCount(): number;
  /** Bumped whenever the planned windows changed under the player. */
  revision(): number;
  /** Which window is on screen; only windows past it may be rewritten by a splice or a drop. */
  setCurrentWindow(index: number): void;
  /** The window at a monotonic index, planned on demand against the latest items. */
  windowAt(index: number, look: ReelLook): ReelWindow | null;
  /**
   * ★ THE SPLICE, ON SCREEN. A window rebuilt to OPEN on the clip playing right now, with every
   * waiting arrival immediately behind it — so an upload is the next photograph a viewer sees
   * rather than the next window's. It replaces the window at `from.index`, and because it is
   * planned at that clip's own `indexOffset` with the loop's own seed, the clip's hold and motion
   * are identical to the ones already on screen: the player swaps at the frame it is on.
   */
  rewindowAt(
    from: ReelWindow,
    clipId: string,
    look: ReelLook,
  ): ReelWindow | null;
  /** The replacement for a window whose clip on screen has just left the payload. */
  cutawayFrom(
    from: ReelWindow,
    clipId: string,
    look: ReelLook,
  ): (ReelWindow & { resumeFrame: number }) | null;
  /** Retain the window's stills and build whatever the style derives from them. */
  prepare(window: ReelWindow, opts: PrepareOptions): Promise<ReelAssets>;
  /** Give a window's retains back (the player, one window behind). */
  release(index: number): void;
  dispose(): void;
  stats(): ClipSourceStats;
};

export type ClipSourceOptions = {
  eventId: string;
  items?: readonly LiveMediaItem[];
  ownIds?: ReadonlySet<string> | null;
  /** Clips per window (the harness's knob). */
  windowSize?: number;
  /** The take's pass size (the harness's knob). */
  pass?: number;
  /** The decode cache. Injected so the pins can drive a fake one. */
  cache?: BitmapCache;
  /** The asset loader seam (the pins hand in a synchronous fake). */
  load?: typeof loadReelAssets;
  /**
   * The paged album's links, by id. Absent, every url is read off the items themselves (a surface
   * that still hands in linked items, the demo, the harness), exactly as before the paged album.
   */
  resolver?: ClipResolver;
  /**
   * The ids whose stills FAILED in a prepare (a url that would not load: an expired or revoked
   * presign, a network drop), so the page's watchdog re-mints exactly those links and nothing else.
   * Called once per prepare that had any; a still with no url at all is not a failure.
   */
  onFailedIds?: (ids: string[]) => void;
};

/**
 * How long a window waits for its stills' links before it builds without them (a missing one then
 * holds a theme colour, as a url-less clip always has). Long enough for a links request on a poor
 * connection; short enough that a link that is never coming stalls nothing a viewer would notice,
 * since a window is asked for about two windows before its turn.
 */
export const LINK_WAIT_MS = 3000;

/** A monotonic clock for the waits (a wall clock set back an hour must not stall a window an hour). */
const clock = () =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

/**
 * One planned stretch of the chain.
 *
 * ★ TWO NUMBERS, NEVER ONE (the small-album seam). `pos` is where the slot starts in its loop's
 * ORDER (what `loopIds` is sliced by); `startIndex` is its first clip's session ORDINAL (what the
 * motion is seeded by, take.ts's `motionSeed`). As one index, re-zeroed at every loop boundary, the
 * clip a boundary carries would be re-planned from a new stream: its pan and zoom would jump (~5%)
 * mid-hold, at every handover for an album of six or fewer. The ordinal only ever grows, and the
 * position is found by the carried clip's id (a drop shifts `loopIds` under a stored position; an id
 * cannot be shifted).
 */
type Slot = {
  index: number;
  loopIndex: number;
  pos: number;
  startIndex: number;
  ids: string[];
  /** When its window was first asked for: the start of its bounded wait for stills. */
  askedAt?: number;
};

/** How many just-departed items stay readable, so a cutaway has something to transition away FROM. */
const DEPARTED_KEPT = 8;

export function createClipSource(opts: ClipSourceOptions): ClipSource {
  const eventId = opts.eventId;
  const cache = opts.cache ?? sharedBitmapCache;
  const load = opts.load ?? loadReelAssets;
  const resolver = opts.resolver ?? null;
  const size = Math.max(2, opts.windowSize ?? DEFAULT_WINDOW_SIZE);
  /** ONE motion stream for the whole session (take.ts's `motionSeed`): the order reshuffles per
   *  loop, the film never restarts. */
  const seed = motionSeed(eventId);

  let items = new Map<string, LiveMediaItem>();
  let ownIds: ReadonlySet<string> | null = opts.ownIds ?? null;
  let seeded = false;

  let loopIndex = 0;
  /** The loop's order: its take, with the previous loop's last clip carried at the head. */
  let loopIds: string[] = [];
  let pending: string[] = [];
  let current = 0;
  let rev = 0;

  const slots = new Map<number, Slot>();
  let lastBuilt: Slot | null = null;
  /** Planned windows, keyed (index, look, revision): a style switch re-plans, the bitmaps stay. */
  const windows = new Map<string, ReelWindow>();
  const retains = new Map<number, string[]>();
  /** Derived per-clip assets keyed `${lookKey}|${id}`, so a splice builds only what arrived. */
  const derived = new Map<string, ClipAsset | null>();
  const grains = new Map<string, CanvasImage | null>();
  /** The most recent departures, by id, for the cutaway's leaving frame. */
  const departed = new Map<string, LiveMediaItem>();
  /** When each waiting arrival was queued: the start of its bounded wait for a still. */
  const queuedAt = new Map<string, number>();

  function eligibleItems(): LiveMediaItem[] {
    return [...items.values()].filter(isReelEligible);
  }

  /**
   * The item with the resolver's links merged in, read NOW (a re-mint reaches the next build). A
   * photograph's still is its tile; a video's tile is its poster only when it has one (a posterless
   * video's tile is the raw file, which no image decoder can draw). An item the resolver holds
   * nothing for keeps whatever urls it carries: the demo's optimistic tiles, a harness.
   */
  function withLinks(item: LiveMediaItem): LiveMediaItem {
    const link = resolver?.get(item.id);
    if (!link) return item;
    const hasStill = item.drawable ?? Boolean(stillUrlFor(item));
    return {
      ...item,
      url: link.view,
      previewUrl:
        item.type === "video" ? (hasStill ? link.tile : null) : link.tile,
    };
  }

  function liveItem(id: string): LiveMediaItem | undefined {
    const item = items.get(id);
    return item ? withLinks(item) : undefined;
  }

  /** Playable, but its still's link has not landed yet. */
  function stillPending(id: string): boolean {
    const item = items.get(id);
    return Boolean(
      item && isReelEligible(item) && !stillUrlFor(withLinks(item)),
    );
  }

  /** Ask for links, fire and forget: a failure only means the bounded wait runs out. */
  function ensureLinks(ids: readonly string[]) {
    if (!resolver || ids.length === 0) return;
    const unique = [...new Set(ids)];
    try {
      void Promise.resolve(resolver.ensure(unique)).catch(() => {});
    } catch {
      // A resolver that throws is a resolver that did not answer: the same bounded wait covers it.
    }
  }

  /**
   * ★ ENSURE AHEAD: a planned window's ids and about two windows' worth of the order after it, so a
   * window's links are in hand a window or two before its turn, not requested at it.
   */
  function ensurePlanned(pos: number, also: readonly string[] = []) {
    if (!resolver) return;
    const from = Math.max(0, pos);
    ensureLinks([...also, ...loopIds.slice(from, from + size * 3)]);
  }

  /**
   * ★ A WINDOW WAITS FOR ITS STILLS, BOUNDEDLY. While any of its clips is playable but has no still
   * yet it is not built (the player asks again next tick), until `LINK_WAIT_MS` after it was first
   * asked for; then it builds anyway, and a still that never came holds a theme colour exactly as a
   * url-less clip always has. Never without a resolver: a linked payload has nothing to wait for.
   */
  function awaitingStills(slot: Slot): boolean {
    if (!resolver) return false;
    const now = clock();
    slot.askedAt ??= now;
    if (now - slot.askedAt >= LINK_WAIT_MS) return false;
    return slot.ids.some(stillPending);
  }

  /** The same wait for an arrival about to be spliced on screen, from the moment it was queued. */
  function arrivalsAwaitStills(): boolean {
    if (!resolver) return false;
    const now = clock();
    return pending.some(
      (id) =>
        now - (queuedAt.get(id) ?? now) < LINK_WAIT_MS &&
        !loopIds.includes(id) &&
        stillPending(id),
    );
  }

  function newLoop(carryId: string | null) {
    const take = planTake(eligibleItems(), {
      eventId,
      loopIndex,
      ownIds,
      pass: opts.pass,
    });
    loopIds =
      carryId && items.has(carryId)
        ? [carryId, ...take.filter((id) => id !== carryId)]
        : take;
    // A fresh take is built from the latest payload, so anything waiting is already in it.
    pending = [];
    queuedAt.clear();
  }

  function nextSlotAfter(prev: Slot): Slot | null {
    // Overlap by ONE: the next window opens on this one's LAST clip (window.ts's handover), at that
    // clip's own ORDINAL, so its hold and motion are the ones already on screen. A one-clip window
    // carries its one clip the same way (its handover is immediate: window.ts's `handoverOf`).
    const carryId = prev.ids[prev.ids.length - 1] ?? null;
    const startIndex = prev.startIndex + Math.max(0, prev.ids.length - 1);
    // By id, never by stored position: a drop shifts `loopIds` under any number we kept.
    const found = carryId ? loopIds.indexOf(carryId) : -1;
    const pos =
      found >= 0 ? found : prev.pos + Math.max(0, prev.ids.length - 1);

    if (pos >= loopIds.length - 1) {
      // The loop is spent: a fresh take, carrying the clip on screen at its own ordinal, so the plan
      // swap lands mid-hold on a clip both plans hold identically.
      loopIndex += 1;
      newLoop(carryId);
      if (loopIds.length === 0) return null;
      return {
        index: prev.index + 1,
        loopIndex,
        pos: 0,
        startIndex,
        ids: loopIds.slice(0, size),
      };
    }

    const arrivals = takePending();
    if (arrivals.length > 0) {
      // Right after the overlap clip: an arrival is on screen within a clip or two, and never in
      // the middle of the hold a viewer is already watching.
      loopIds.splice(pos + 1, 0, ...arrivals);
    }
    return {
      index: prev.index + 1,
      loopIndex,
      pos,
      startIndex,
      ids: loopIds.slice(pos, pos + size),
    };
  }

  /** Build forward to `index`. Never backward: a released slot is gone for good. */
  function slotAt(index: number): Slot | null {
    const hit = slots.get(index);
    if (hit) return hit;
    if (lastBuilt === null) {
      if (index !== 0) return null;
      if (loopIds.length === 0) newLoop(null);
      if (loopIds.length === 0) return null;
      const first: Slot = {
        index: 0,
        loopIndex,
        pos: 0,
        startIndex: 0,
        ids: loopIds.slice(0, size),
      };
      slots.set(0, first);
      lastBuilt = first;
      ensurePlanned(0);
      return first;
    }
    if (index <= lastBuilt.index) return null; // released; the player only ever walks forward
    let cursor = lastBuilt;
    while (cursor.index < index) {
      const next = nextSlotAfter(cursor);
      if (!next) return null;
      slots.set(next.index, next);
      cursor = next;
      lastBuilt = next;
      ensurePlanned(next.pos);
    }
    return cursor;
  }

  /**
   * ★ THE CHAIN FOLLOWS THE SLOTS IT ACTUALLY HAS. `slotAt` walks FORWARD from `lastBuilt`, so a
   * `lastBuilt` pointing at a slot that has been released is a DEADLOCK: every request at or below
   * its index answers null, nothing can ever be built again, and the player runs to the end of its
   * window and holds one photograph for ever. It is exactly what a prefetched window being thrown
   * away (a splice, a look change) does. So every deletion re-points the chain at the highest slot
   * that is still there.
   */
  function dropChainTo(index: number) {
    if (!lastBuilt || lastBuilt.index !== index) return;
    let highest: Slot | null = null;
    for (const slot of slots.values()) {
      if (!highest || slot.index > highest.index) highest = slot;
    }
    lastBuilt = highest;
  }

  function takePending(): string[] {
    if (pending.length === 0) return [];
    const fresh = pending.filter(
      (id) => items.has(id) && !loopIds.includes(id),
    );
    pending = [];
    queuedAt.clear();
    return fresh;
  }

  // No revision in the key on purpose: a splice or a drop deletes the windows AHEAD outright
  // (invalidateAhead), and the window on screen must keep its identity through both — re-planning
  // it is the one thing a live reel may never do.
  function windowKey(index: number, look: ReelLook) {
    return [
      index,
      look.styleId,
      look.surface,
      look.holdScale ?? 1,
      look.orientation ?? "portrait",
      look.watermark ? "w" : "-",
      look.includeVideos ? "v" : "p",
    ].join("~");
  }

  /** What changes a DERIVED asset (a wash, a halation halo): the style's needs and the frame. */
  function lookKey(
    window: ReelWindow,
    needs: AssetNeeds,
    frame?: { width: number; height: number },
  ) {
    return [
      window.props.styleId ?? "classic",
      window.props.orientation ?? "portrait",
      needs.washes ? "w" : "-",
      needs.grain ? "g" : "-",
      needs.haloFilter ?? "-",
      frame ? `${frame.width}x${frame.height}` : "full",
    ].join("~");
  }

  /**
   * A splice or a drop may rewrite only what is NOT on screen. If a window ahead has already rolled
   * into the next loop there is nothing to rewrite: that loop's take was built from the payload as
   * it is now, arrivals included.
   */
  function invalidateAhead() {
    const here = slots.get(current);
    if (here && lastBuilt && lastBuilt.loopIndex !== here.loopIndex) {
      rev += 1;
      return;
    }
    for (const [index] of slots) {
      if (index > current) slots.delete(index);
    }
    for (const key of [...windows.keys()]) {
      if (Number(key.split("~")[0]) > current) windows.delete(key);
    }
    if (here) lastBuilt = here;
    rev += 1;
  }

  /** The ids any RETAINED window still holds — what a derived asset must belong to to survive. */
  function retainedIds(): Set<string> {
    const live = new Set<string>();
    for (const index of retains.keys()) {
      for (const id of slots.get(index)?.ids ?? []) live.add(id);
    }
    return live;
  }

  function pruneDerived() {
    const live = retainedIds();
    for (const key of [...derived.keys()]) {
      const id = key.slice(key.lastIndexOf("|") + 1);
      if (!live.has(id)) derived.delete(key);
    }
  }

  /**
   * A departed clip, for the cutaway's leaving frame. ★ ON THE PAGED ALBUM ITS LINKS MAY ALREADY BE
   * GONE (the album forgets an id's links the moment a delta removes it, before the reel hears of
   * it), so its still falls back to the one the window on screen drew, which is decoded and pinned
   * right now. Without that the photograph a host just hid would blink to a blank frame instead of
   * leaving on the style's shortest transition.
   */
  function leavingItem(
    id: string,
    from: ReelWindow,
  ): LiveMediaItem | undefined {
    const gone = departed.get(id);
    if (!gone) return undefined;
    const linked = withLinks(gone);
    if (stillUrlFor(linked)) return linked;
    const drawn = from.props.clips[from.ids.indexOf(id)]?.url;
    return drawn ? { ...linked, previewUrl: drawn } : linked;
  }

  function remember(item: LiveMediaItem) {
    departed.set(item.id, item);
    while (departed.size > DEPARTED_KEPT) {
      const oldest = departed.keys().next().value;
      if (oldest === undefined) break;
      departed.delete(oldest);
    }
  }

  function dropIds(ids: readonly string[]) {
    const gone = new Set(ids);
    if (gone.size === 0) return;
    let touched = false;

    const keptLoop = loopIds.filter((id) => !gone.has(id));
    if (keptLoop.length !== loopIds.length) {
      loopIds = keptLoop;
      touched = true;
    }
    const keptPending = pending.filter((id) => !gone.has(id));
    if (keptPending.length !== pending.length) {
      pending = keptPending;
      for (const id of gone) queuedAt.delete(id);
      touched = true;
    }
    // ★ EVERY PLANNED WINDOW, the one on screen included: the id is cut from its clip list so the
    // next frame it would have drawn simply cannot reach it. What the player does about the clip
    // CURRENTLY on screen is the cutaway (window.ts) — this is the part that makes the drop total.
    for (const slot of slots.values()) {
      const kept = slot.ids.filter((id) => !gone.has(id));
      if (kept.length !== slot.ids.length) {
        slot.ids = kept;
        touched = true;
      }
    }
    for (const id of gone) {
      const item = items.get(id);
      if (item) remember(item);
      items.delete(id);
    }
    if (touched) invalidateAhead();
  }

  function spliceIds(ids: readonly string[]) {
    const fresh = ids.filter(
      (id) => items.has(id) && !pending.includes(id) && !loopIds.includes(id),
    );
    if (fresh.length === 0) return;
    pending = [...pending, ...fresh];
    const now = clock();
    for (const id of fresh) queuedAt.set(id, now);
    // An arrival is on screen within a clip or two: its links are asked for the moment it lands.
    ensureLinks(fresh);
    invalidateAhead();
  }

  const source: ClipSource = {
    eventId,

    setItems(next) {
      const before = items;
      const after = new Map<string, LiveMediaItem>();
      for (const item of next) after.set(item.id, item);

      const added: string[] = [];
      const dropped: string[] = [];
      for (const id of after.keys()) if (!before.has(id)) added.push(id);
      for (const [id, item] of before) {
        const now = after.get(id);
        // Two ways to leave: gone from the payload, or still there and no longer eligible (held,
        // hidden, or marked as a clip). A plain key diff would miss the second.
        if (!now || (isReelEligible(item) && !isReelEligible(now))) {
          dropped.push(id);
        }
      }

      items = after;
      if (dropped.length > 0) {
        // ★ THE LEAVER IS REMEMBERED AS IT WAS. An id gone from the payload is no longer in `items`
        // by the time it is dropped, so without this the cutaway had nothing to leave FROM: it
        // opened on the next clip mid-transition, instead of the one on screen leaving on the
        // style's shortest transition (a guest's payload loses a hidden photograph exactly so).
        for (const id of dropped) {
          const was = before.get(id);
          if (was) remember(was);
        }
        dropIds(dropped);
      }
      // The SEED payload is the first one with anything in it: everything is new and none of it
      // arrived. A source built before the gallery has answered starts empty, and that emptiness is
      // not a moment the reel should splice its way out of.
      if (!seeded && after.size > 0) seeded = true;
      else if (seeded && added.length > 0) {
        spliceIds(added.filter((id) => isReelEligible(after.get(id)!)));
      }
      return { added, dropped };
    },

    setOwnIds(ids) {
      ownIds = ids;
    },
    splice: spliceIds,
    drop: dropIds,
    itemFor: liveItem,
    isLive(id) {
      const item = items.get(id);
      return Boolean(item && isReelEligible(item));
    },
    eligibleCount: () => eligibleItems().length,
    revision: () => rev,

    setCurrentWindow(index) {
      current = index;
    },

    windowAt(index, look) {
      const key = windowKey(index, look);
      const hit = windows.get(key);
      if (hit) return hit;
      const slot = slotAt(index);
      if (!slot) return null;
      if (awaitingStills(slot)) return null;
      const built = buildWindow({
        index,
        loopIndex: slot.loopIndex,
        startIndex: slot.startIndex,
        ids: slot.ids,
        itemFor: liveItem,
        seed,
        look,
        // The album's only clip holds rather than handing over to an identical plan every tick.
        alone: slot.ids.length === 1 && eligibleItems().length <= 1,
      });
      if (!built) return null;
      windows.set(key, built);
      return built;
    },

    pendingCount: () => pending.length,

    rewindowAt(from, clipId, look) {
      const at = from.ids.indexOf(clipId);
      if (at < 0) return null;
      // ★ AN ARRIVAL IS SPLICED ON SCREEN WITH ITS STILL, not ahead of it: its links were asked for
      // the moment it landed, and a rewindow is the frame after, so it waits (boundedly, the queue
      // untouched; the player asks again next tick) rather than making the upload a blank hold.
      if (arrivalsAwaitStills()) return null;
      const arrivals = takePending();
      const posInLoop = loopIds.indexOf(clipId);
      if (posInLoop >= 0 && arrivals.length > 0) {
        loopIds.splice(posInLoop + 1, 0, ...arrivals);
      }
      const ids =
        posInLoop >= 0
          ? loopIds.slice(posInLoop, posInLoop + size)
          : [clipId, ...arrivals, ...from.ids.slice(at + 1)].slice(0, size);
      if (ids.length === 0) return null;

      const built = buildWindow({
        index: from.index,
        loopIndex: from.loopIndex,
        // The on-screen clip's own ordinal: its plan does not change underneath it.
        startIndex: from.startIndex + at,
        ids,
        itemFor: liveItem,
        seed,
        look,
      });
      if (!built) return null;
      if (posInLoop >= 0) ensurePlanned(posInLoop);
      else ensureLinks(built.ids);

      // This IS the current window now: the chain continues from it, and everything that was
      // planned after it belonged to an order that no longer exists.
      const slot: Slot = {
        index: from.index,
        loopIndex: from.loopIndex,
        pos: posInLoop >= 0 ? posInLoop : 0,
        startIndex: built.startIndex,
        ids: built.ids,
      };
      slots.set(from.index, slot);
      lastBuilt = slot;
      for (const [index] of slots) if (index > from.index) slots.delete(index);
      for (const key of [...windows.keys()]) {
        if (Number(key.split("~")[0]) >= from.index) windows.delete(key);
      }
      windows.set(windowKey(from.index, look), built);
      rev += 1;
      return built;
    },

    cutawayFrom(from, clipId, look) {
      const at = from.ids.indexOf(clipId);
      const tail = at >= 0 ? from.ids.slice(at) : [clipId, ...from.ids];
      // Everything from the departing clip onward, minus whatever else has left since. The tail is
      // topped up when the window has nothing after it, so the reel has somewhere to cut TO.
      const ids = tail.filter((id) => id === clipId || items.has(id));
      if (ids.length < 2) {
        // ★ FROM WHAT COMES NEXT, NEVER FROM THE LOOP'S HEAD. The departing clip has already left
        // `loopIds`, so "next" is whatever follows the last clip of this window still in the order
        // (the clip before the departing one, usually). Topping up from the head would replay the
        // loop's opening photographs and hand the next window a clip the cutaway never showed.
        const anchor = [...from.ids.slice(0, Math.max(0, at))]
          .reverse()
          .find((id) => loopIds.includes(id));
        const from0 = anchor ? loopIds.indexOf(anchor) + 1 : 0;
        const upcoming = [...loopIds.slice(from0), ...loopIds.slice(0, from0)];
        ids.push(
          ...upcoming.filter((id) => !ids.includes(id)).slice(0, size - 1),
        );
      }
      if (ids.length === 0) return null;
      const cut = buildCutaway({
        index: from.index,
        loopIndex: from.loopIndex,
        startIndex: from.startIndex + Math.max(0, at),
        ids,
        // The departing clip has already left `items`, so it is served from the last thing we knew
        // about it — otherwise there would be nothing to transition away from.
        itemFor: (id) => liveItem(id) ?? leavingItem(id, from),
        seed,
        look,
      });
      if (!cut) return null;

      // ★ THE CUTAWAY BECOMES THE CHAIN, as a rewindow does. The next window must open on the clip
      // this one hands over on (its last), or the handover lands on a different photograph mid-
      // hold. So the slot at this index becomes the cutaway's own order, and everything planned
      // after it (from the order before the drop) goes.
      const last = cut.ids[cut.ids.length - 1];
      const lastPos = last ? loopIds.indexOf(last) : -1;
      const slot: Slot = {
        index: from.index,
        loopIndex: from.loopIndex,
        pos: Math.max(0, lastPos - (cut.ids.length - 1)),
        startIndex: cut.startIndex,
        ids: cut.ids,
      };
      slots.set(from.index, slot);
      lastBuilt = slot;
      for (const [index] of slots) if (index > from.index) slots.delete(index);
      for (const key of [...windows.keys()]) {
        if (Number(key.split("~")[0]) >= from.index) windows.delete(key);
      }
      rev += 1;
      // What plays next is re-planned from here (the next window opens on the cut's last clip): its
      // links are asked for now, and never the leaver's.
      const staying = cut.ids.filter((id) => items.has(id));
      if (lastPos >= 0) ensurePlanned(lastPos, staying);
      else ensureLinks(staying);
      return cut;
    },

    async prepare(window, { needs, frame, signal }) {
      // Retains MERGE rather than replace: a cutaway and a splice rebuild the window at the SAME
      // index with a different clip list, and the stills the old list pinned are still on screen.
      // They all go back together at release(index).
      const held = retains.get(window.index) ?? [];
      const fresh: string[] = [];
      for (const clip of window.props.clips) {
        if (!clip.url) continue;
        if (held.includes(clip.url) || fresh.includes(clip.url)) continue;
        fresh.push(clip.url);
      }
      if (fresh.length > 0) {
        for (const url of fresh) cache.retain(url);
        retains.set(window.index, [...held, ...fresh]);
      }

      const key = lookKey(window, needs, frame);
      const missingIds: string[] = [];
      const missingClips = [];
      for (let i = 0; i < window.ids.length; i++) {
        const id = window.ids[i];
        if (derived.has(`${key}|${id}`) || missingIds.includes(id)) continue;
        missingIds.push(id);
        missingClips.push(window.props.clips[i]);
      }

      if (missingClips.length > 0 || !grains.has(key)) {
        const built = await load(missingClips, {
          ...needs,
          frame,
          // Through the SHARED cache, so a still the previous window already decoded costs nothing
          // and a still two windows hold is retained twice and closed once.
          decode: cache.decode,
          signal,
        });
        built.clips.forEach((asset, i) => {
          // ★ ON THE PAGED ALBUM A STILL THAT DID NOT LOAD IS NOT REMEMBERED. Its link can land late
          // or be re-minted (the watchdog `onFailedIds` feeds), so the next window holding the clip
          // tries again with whatever url it reads then; a remembered null would keep it blank for
          // as long as any window held it. A linked payload keeps the old rule: its url is its url.
          if (asset || !resolver) derived.set(`${key}|${missingIds[i]}`, asset);
        });
        if (!grains.has(key)) grains.set(key, built.grain);
      }

      let failures = 0;
      const failed: string[] = [];
      const clips = window.ids.map((id, i) => {
        const asset = derived.get(`${key}|${id}`) ?? null;
        if (!asset && window.props.clips[i]?.url) {
          failures += 1;
          if (!failed.includes(id)) failed.push(id);
        }
        return asset;
      });
      if (failed.length > 0 && opts.onFailedIds) {
        try {
          opts.onFailedIds(failed);
        } catch {
          // The page's watchdog is never allowed to take the reel down with it.
        }
      }
      return { clips, failures, grain: grains.get(key) ?? null };
    },

    release(index) {
      const urls = retains.get(index);
      if (!urls) return;
      for (const url of urls) cache.release(url);
      retains.delete(index);
      // The slot goes with the retain: `slotAt` only ever walks FORWARD (from `lastBuilt`), so a
      // released index is never asked for again and keeping it would grow all night.
      slots.delete(index);
      dropChainTo(index);
      for (const key of [...windows.keys()]) {
        if (Number(key.split("~")[0]) === index) windows.delete(key);
      }
      pruneDerived();
    },

    dispose() {
      for (const urls of retains.values()) {
        for (const url of urls) cache.release(url);
      }
      retains.clear();
      slots.clear();
      windows.clear();
      derived.clear();
      grains.clear();
      departed.clear();
      lastBuilt = null;
    },

    stats: () => ({
      loopIndex,
      takeLength: loopIds.length,
      eligible: eligibleItems().length,
      windows: slots.size,
      retained: retains.size,
      retainedUrls: new Set([...retains.values()].flat()).size,
      derived: derived.size,
      pending: pending.length,
      revision: rev,
    }),
  };

  if (opts.items) source.setItems(opts.items);
  return source;
}
