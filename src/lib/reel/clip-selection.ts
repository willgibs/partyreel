/**
 * A CLIP'S SELECTION: WHICH MOMENTS, IN WHAT ORDER, AND WHAT THE ENGINE IS HANDED.
 *
 * A clip is the viewer's own: made on their device from the album, never stored on a server. So
 * everything here is a LOCAL selection over the album payload the page already holds (no second
 * RPC, no second presign), and the one piece of the server's say is `ClipFacts`
 * (`src/lib/events/gallery-reel.ts`): the length cap and the free mark come from there, never from
 * the client.
 *
 * ★ THE POOL IS THE REEL'S, SO A CLIP IS NEVER CUT FROM CLIPS. A moment may join a clip exactly
 * when it may join the live reel (`isReelEligible`: approved, not a clip someone added to the album,
 * something drawable). A hidden photograph is never in a clip; the host meets hers in the pool as
 * "Hidden · Show" (the creator's own tiles), and Show makes it an ordinary moment first.
 *
 * ★ THE SELECTION MAY RUN PAST THE LENGTH, AND SAYS SO. The engine plays a prefix: the moments
 * whose clip finishes inside the length, never stretching or squeezing a style's own pacing. So the
 * selection is the viewer's list, `fittingCount` is how many of it play, and every surface that
 * shows the list shows where it is cut rather than silently dropping the tail.
 *
 * ★ THE FIT IS ON THE STYLE'S OWN DURATION, NOT `buildReelProps`'s CAP. That cap plans on the mood
 * timeline, and a treatment keeps its own clock: capped at 30 s that way, Layered parallax runs
 * 36.6 s (past a free event's cap) and Scattered prints, capped at 60 s, stops at 17.3 s. A clip's
 * Length is a promise about the file, so the prefix is found by asking the style itself
 * (`engineStyleDuration`) how long each candidate runs.
 *
 * Pure: no DOM, no React. The engine's planners are pure too, so a test drives the real cap.
 */
import type { GalleryItem } from "@/lib/events/gallery-reel";
import { buildReelProps } from "@/lib/reel/build-reel-props";
import { FPS, type Orientation } from "@/lib/reel/engine/constants";
import { engineStyleDuration } from "@/lib/reel/engine/registry";
import type { ReelProps } from "@/lib/reel/engine/reel-types";
import { isReelEligible } from "@/lib/reel/live/items";
import { planTake, seedFor } from "@/lib/reel/live/take";

/* ── the pool ───────────────────────────────────────────────────────────────── */

/** The moments a clip may be cut from: the album's reel-eligible items, in the album's order. */
export function clipPool(items: readonly GalleryItem[]): GalleryItem[] {
  return items.filter(isReelEligible);
}

/**
 * The viewer's own moments. A guest's are the ids this device knows it uploaded (the album's
 * `ownIds`); the owner's are the host's own uploads (`isHost`), which a guest session never lists.
 */
export function ownMomentIds(
  pool: readonly GalleryItem[],
  who: { isOwner: boolean; ownIds: ReadonlySet<string> | null },
): string[] {
  return pool
    .filter((item) =>
      who.isOwner ? item.isHost === true : Boolean(who.ownIds?.has(item.id)),
    )
    .map((item) => item.id);
}

/* ── the settings ───────────────────────────────────────────────────────────── */

/** The tray's Length: Auto is the clip's own length up to the plan's cap. */
export type ClipLength = "auto" | 15 | 30 | 60;
export const CLIP_LENGTHS: readonly ClipLength[] = ["auto", 15, 30, 60];

/** The seconds the engine caps at: Auto is the plan's cap, a fixed length never passes it. */
export function lengthSecondsFor(
  length: ClipLength,
  maxSeconds: number,
): number {
  return length === "auto" ? maxSeconds : Math.min(length, maxSeconds);
}

/** Whether this plan offers a length at all (a free plan's 30 s cap locks 60). */
export function lengthOffered(length: ClipLength, maxSeconds: number): boolean {
  return length === "auto" || length <= maxSeconds;
}

export const CLIP_ORIENTATIONS: readonly Orientation[] = [
  "portrait",
  "landscape",
];

export type ClipSettings = {
  styleId: string;
  orientation: Orientation;
  length: ClipLength;
};

/** What the engine needs besides the ids: the album by id, the settings and the server's facts. */
export type ClipContext = ClipSettings & {
  byId: Map<string, GalleryItem>;
  /** The plan's cap in seconds (`ClipFacts.maxSeconds`). */
  maxSeconds: number;
  /** The free plan's mark (`ClipFacts.watermark`), stamped by the engine's dispatch layer. */
  watermark: boolean;
  seed: number;
};

/**
 * One seed per event: the motion a clip plans (each moment's hold, its pan, the transition into the
 * next) stays put while its maker edits, so a toggled moment changes the clip and nothing else.
 */
export function clipSeed(eventId: string): number {
  return seedFor(eventId, "clip");
}

/**
 * The engine's props for a selection, through the one builder the player and the encoder share,
 * then fitted to the length on the style's own clock (see the header). The player, the look
 * thumbs, the encoder and the poster all draw from this, so what a maker watches is the file.
 */
export function clipProps(ids: readonly string[], ctx: ClipContext): ReelProps {
  const whole = buildReelProps({
    orderedIds: [...ids],
    byId: ctx.byId,
    styleId: ctx.styleId,
    seed: ctx.seed,
    orientation: ctx.orientation,
    // The opening shot is the order's first: the tray's Opening moves a moment to the front
    // (`openWith`) rather than hoisting it at render time, so the strip always shows what plays.
    coverMediaId: null,
    lengthSeconds: null,
    watermark: ctx.watermark,
  });
  return fitToLength(whole, lengthSecondsFor(ctx.length, ctx.maxSeconds));
}

/**
 * The longest prefix whose clip runs inside `seconds` (always at least one moment). A plan seeds by
 * index, so a prefix plans exactly as the whole list's head does; the search doubles, then halves,
 * so a selection of the whole album costs a handful of plans, never one per moment. Only prefixes
 * it has measured are ever kept, so the answer runs inside the length even for a style whose clock
 * were not monotonic.
 */
function fitToLength(whole: ReelProps, seconds: number): ReelProps {
  const n = whole.clips.length;
  if (n <= 1) return whole;
  const limit = seconds * FPS;
  const runs = (k: number) =>
    engineStyleDuration(whole.styleId, {
      ...whole,
      clips: whole.clips.slice(0, k),
    });
  if (runs(n) <= limit) return whole;
  let fits = 1;
  let over = 2;
  while (over < n && runs(over) <= limit) {
    fits = over;
    over = Math.min(n, over * 2);
  }
  if (over >= n) over = n;
  while (over - fits > 1) {
    const mid = (fits + over) >> 1;
    if (runs(mid) <= limit) fits = mid;
    else over = mid;
  }
  return { ...whole, clips: whole.clips.slice(0, fits) };
}

/**
 * How many of a selection play: the prefix the length keeps. Every id in a selection is an
 * approved moment, so the engine's clip count IS a count of the selection's head.
 */
export function fittingCount(ids: readonly string[], ctx: ClipContext): number {
  if (ids.length === 0) return 0;
  return clipProps(ids, ctx).clips.length;
}

/** The clip's running time in seconds, the style's own intro and outro included. */
export function clipSeconds(props: ReelProps): number {
  if (props.clips.length === 0) return 0;
  return engineStyleDuration(props.styleId, props) / FPS;
}

/* ── the fills ──────────────────────────────────────────────────────────────── */

/** Where a clip starts from. The reel's picks are the default: the maker starts where the reel is. */
export type ClipFill = "reel" | "mine" | "all";
export const CLIP_FILLS: readonly ClipFill[] = ["reel", "mine", "all"];

export const CLIP_FILL_LABEL: Record<ClipFill, string> = {
  reel: "The reel's picks",
  mine: "Only mine",
  all: "Everything",
};

/**
 * A fill's moments, in order.
 *  - `reel`: the take the reel itself opens on (`planTake`, loop 0, the viewer's own first, as the
 *    tile shows it), CAPPED to the length, so the clip a maker starts from plays whole. `take`
 *    reaches further takes: Make another starts from the next one, a fresh handful of the night.
 *  - `mine`: the viewer's own, in the album's order.
 *  - `all`: the whole pool, in the album's order; the length plays its head and the strip says so.
 */
export function fillIds(
  fill: ClipFill,
  input: {
    pool: readonly GalleryItem[];
    eventId: string;
    isOwner: boolean;
    ownIds: ReadonlySet<string> | null;
    ctx: ClipContext;
    /** Which of the reel's takes (0 is the one it opens on). */
    take?: number;
  },
): string[] {
  if (fill === "mine") return ownMomentIds(input.pool, input);
  if (fill === "all") return input.pool.map((item) => item.id);
  const take = planTake(input.pool, {
    eventId: input.eventId,
    loopIndex: Math.max(0, Math.floor(input.take ?? 0)),
    ownIds: input.isOwner ? null : input.ownIds,
  });
  return take.slice(0, fittingCount(take, input.ctx));
}

/* ── the edits ──────────────────────────────────────────────────────────────── */

/** A tap in the pool: a moment in the clip leaves it, one out of it joins at the end. */
export function toggleMoment(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

/** The tray's Opening: this moment opens the clip (moved to the front, the rest in order). */
export function openWith(ids: readonly string[], id: string): string[] {
  if (!ids.includes(id) || ids[0] === id) return [...ids];
  return [id, ...ids.filter((x) => x !== id)];
}

/**
 * Keep a selection honest against the album as it moves: a moment the host hid or removed, or
 * one that was never in the pool, drops out; the order of the rest is kept.
 */
export function keepInPool(
  ids: readonly string[],
  pool: readonly GalleryItem[],
): readonly string[] {
  const inPool = new Set(pool.map((item) => item.id));
  const kept = ids.filter((id) => inPool.has(id));
  // The same list back when nothing left, so a poll that changed nothing re-renders nothing.
  return kept.length === ids.length ? ids : kept;
}

/* ── the export's minute ────────────────────────────────────────────────────── */

/**
 * "3 of 8 moments left" while the clip is drawn: the encoder reports frames, the maker reads
 * moments, so the progress is spread evenly across the moments that play. Never below zero, never
 * above the total.
 */
export function momentsLeft(progress: number, total: number): number {
  if (total <= 0) return 0;
  const p = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  return Math.max(0, Math.min(total, total - Math.floor(p * total)));
}
