/**
 * THE CLIP SOURCE — the live reel's view of an album that keeps changing (the live reel, 2026-09-22).
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
 * ★ ONE CALL DOES THE RIGHT THING. `setItems` splices what arrived and drops what left; `splice` and
 * `drop` stay public for a harness that simulates them. The FIRST payload is the seed, never an
 * arrival — the rule `reconcile-gallery-items.ts` keeps for the album's own glow.
 *
 * No DOM and no React: the decode seam is injected, so this module runs in the node test project. It
 * deliberately does NOT import the style registry — a provider mounting a source must not drag
 * fourteen styles into the album's first paint, so the player passes the style's asset needs in.
 */

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

import { isReelEligible, type LiveMediaItem } from "./items";
import { planTake, takeSeed } from "./take";
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
};

type Slot = {
  index: number;
  loopIndex: number;
  startIndex: number;
  ids: string[];
};

/** How many just-departed items stay readable, so a cutaway has something to transition away FROM. */
const DEPARTED_KEPT = 8;

export function createClipSource(opts: ClipSourceOptions): ClipSource {
  const eventId = opts.eventId;
  const cache = opts.cache ?? sharedBitmapCache;
  const load = opts.load ?? loadReelAssets;
  const size = Math.max(2, opts.windowSize ?? DEFAULT_WINDOW_SIZE);

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

  function eligibleItems(): LiveMediaItem[] {
    return [...items.values()].filter(isReelEligible);
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
  }

  function nextSlotAfter(prev: Slot): Slot | null {
    // Overlap by ONE: the next window opens on this one's LAST clip (window.ts's handover). A
    // one-clip window has nobody to share with, so it steps past itself.
    const nextStart = prev.startIndex + Math.max(1, prev.ids.length - 1);
    const carryId = prev.ids[prev.ids.length - 1] ?? null;

    if (nextStart >= loopIds.length - 1) {
      // The loop is spent: a fresh take, carrying the clip on screen so the plan swap still lands
      // mid-hold on a clip both plans hold.
      loopIndex += 1;
      newLoop(carryId);
      if (loopIds.length === 0) return null;
      return {
        index: prev.index + 1,
        loopIndex,
        startIndex: 0,
        ids: loopIds.slice(0, size),
      };
    }

    const arrivals = takePending();
    if (arrivals.length > 0) {
      // Right after the overlap clip: an arrival is on screen within a clip or two, and never in
      // the middle of the hold a viewer is already watching.
      loopIds.splice(nextStart + 1, 0, ...arrivals);
    }
    return {
      index: prev.index + 1,
      loopIndex,
      startIndex: nextStart,
      ids: loopIds.slice(nextStart, nextStart + size),
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
        startIndex: 0,
        ids: loopIds.slice(0, size),
      };
      slots.set(0, first);
      lastBuilt = first;
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
    }
    return cursor;
  }

  function takePending(): string[] {
    if (pending.length === 0) return [];
    const fresh = pending.filter((id) => items.has(id) && !loopIds.includes(id));
    pending = [];
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
        // hidden, or marked as a cut). A plain key diff would miss the second.
        if (!now || (isReelEligible(item) && !isReelEligible(now))) {
          dropped.push(id);
        }
      }

      items = after;
      if (dropped.length > 0) dropIds(dropped);
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
    itemFor: (id) => items.get(id),
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
      const built = buildWindow({
        index,
        loopIndex: slot.loopIndex,
        startIndex: slot.startIndex,
        ids: slot.ids,
        itemFor: (id) => items.get(id),
        seed: takeSeed(eventId, slot.loopIndex),
        look,
      });
      if (!built) return null;
      windows.set(key, built);
      return built;
    },

    pendingCount: () => pending.length,

    rewindowAt(from, clipId, look) {
      const at = from.ids.indexOf(clipId);
      if (at < 0) return null;
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
        // The on-screen clip's own offset: its plan does not change underneath it.
        startIndex: from.startIndex + at,
        ids,
        itemFor: (id) => items.get(id),
        seed: takeSeed(eventId, from.loopIndex),
        look,
      });
      if (!built) return null;

      // This IS the current window now: the chain continues from it, and everything that was
      // planned after it belonged to an order that no longer exists.
      const slot: Slot = {
        index: from.index,
        loopIndex: from.loopIndex,
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
      // topped up from the loop when the window has nothing after it, so the reel has somewhere to
      // cut TO.
      const ids = tail.filter((id) => id === clipId || items.has(id));
      if (ids.length < 2) {
        const after = loopIds.filter((id) => !ids.includes(id)).slice(0, size - 1);
        ids.push(...after);
      }
      if (ids.length === 0) return null;
      return buildCutaway({
        index: from.index,
        loopIndex: from.loopIndex,
        startIndex: from.startIndex + Math.max(0, at),
        ids,
        // The departing clip has already left `items`, so it is served from the last thing we knew
        // about it — otherwise there would be nothing to transition away from.
        itemFor: (id) => items.get(id) ?? departed.get(id),
        seed: takeSeed(eventId, from.loopIndex),
        look,
      });
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
          derived.set(`${key}|${missingIds[i]}`, asset);
        });
        if (!grains.has(key)) grains.set(key, built.grain);
      }

      let failures = 0;
      const clips = window.ids.map((id, i) => {
        const asset = derived.get(`${key}|${id}`) ?? null;
        if (!asset && window.props.clips[i]?.url) failures += 1;
        return asset;
      });
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
