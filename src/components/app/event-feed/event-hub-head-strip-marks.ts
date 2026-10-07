/**
 * THE HUB'S FACTS STRIP, AS DATA (`event-header` r3, Will's `facts=strip`, 2026-10-04: "It makes the feature card feel
 * more alive while reducing the crowded UI"; his round-two condition: nothing spanning the card may lean on a timeline).
 *
 * One mark a photograph along the cover's foot, laid in the album's own order (its first photograph at the left, its
 * newest at the right), each mark as tall as how many photographs landed within ten minutes of it. So a morning whose
 * photographs all land before lunch, a weekend over three days, an album with no date and a trickle of one photograph a
 * week all fill the same line, and none has a gap: the strip has no start, no end and no hour on it.
 *
 * ★ WHAT IS A PHOTOGRAPH HERE IS WHAT THE HUB'S ALBUM HOLDS (`isHubEntry`: approved and hidden, never what waits in
 * Review), so the strip's marks are the album's own count, read off her manifest (`t` is `created_at` in microseconds:
 * `album-wire.ts`). Her manifest is her scope, so a photograph waiting for the develop has its mark too.
 *
 * ★ THE STRIP DRAWS THE ALBUM'S OWN SCALE. Heights are read against the busiest stretch of this album, so a quiet
 * trickle and a wedding both use the whole line: the strip says how this album breathes, never how it compares.
 *
 * ★ LIT IS "PHOTOS LANDING NOW": the newest within a quarter of an hour, on the reader's clock. It holds its light and
 * never pulses (a host keeps the hub open all night; a pulse for hours would pull her eye off the album).
 *
 * The board this was picked on (event-header r3) has left, so the maths lives here alone. Pure and isomorphic.
 */
import { isHubEntry } from "@/lib/event/hub-album";
import type { ManifestEntry } from "@/lib/events/album-wire";

/** How near in time a photograph counts as landing "with" another, in minutes. */
export const LANDED_WITH_MINUTES = 10;

/** The newest within this many minutes is landing now: its marks and the end dot are lit. */
export const LIT_WITHIN_MINUTES = 15;

/**
 * THE STRIP AT EACH WIDTH IT IS DRAWN AT: marks a photograph up to as many as fit (`most`), and never fewer than a
 * quiet line's worth (`least`), so a very small album gathers at the newest end rather than standing three marks a
 * room apart. A hand and a desk are the board's own two (19 to 52, 54 to 160); the middle is the same line at a
 * tablet's width, where 160 marks would touch and 52 would stand a comb's width apart. Each tier is picked by the
 * strip's own width in CSS (a container query), so the server's paint is right at every width with nothing measured.
 */
export type StripTier = {
  id: "hand" | "mid" | "desk";
  least: number;
  most: number;
  /** The line's height in px: the tallest a mark stands. */
  height: number;
};

export const STRIP_TIERS: readonly StripTier[] = [
  { id: "hand", least: 19, most: 52, height: 22 },
  { id: "mid", least: 36, most: 104, height: 26 },
  { id: "desk", least: 54, most: 160, height: 30 },
];

/** One slot of the strip. A waiting slot is a quiet point the album has not filled yet. */
export type StripMark = {
  /** 0 to 1 against the album's busiest stretch; 0 for a waiting slot. */
  h: number;
  waiting: boolean;
  /** Within a quarter of an hour of the album's newest photograph: lit while photographs are landing. */
  fresh: boolean;
};

const MICROS_PER_MINUTE = 60_000_000;
const MS_PER_MINUTE = 60_000;

/**
 * THE ALBUM'S ARRIVALS, OLDEST FIRST, in minutes since the epoch: the hub's entries (the store keeps them newest first,
 * so this reads them from the end), each mark's own `created_at`.
 */
export function arrivalsOf(entries: readonly ManifestEntry[]): number[] {
  const out: number[] = [];
  let ordered = true;
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i];
    if (!isHubEntry(e)) continue;
    const minute = e[4] / MICROS_PER_MINUTE;
    if (out.length > 0 && minute < out[out.length - 1]) ordered = false;
    out.push(minute);
  }
  // The store's order is the album's; a list handed in some other order is read in time, never in its own.
  return ordered ? out : out.sort((a, b) => a - b);
}

/**
 * EVERY PHOTOGRAPH'S HEIGHT: how many photographs landed within ten minutes of it, itself included. A run of a dozen
 * from one press of Add stands tall, a lone photograph stands short, and the busiest stretch of a party stands tallest.
 * Two pointers over the sorted arrivals, so a whole album is one pass.
 */
export function landedWith(arrivals: readonly number[]): number[] {
  const out: number[] = [];
  let lo = 0;
  let hi = 0;
  for (let i = 0; i < arrivals.length; i++) {
    const t = arrivals[i];
    while (arrivals[lo] < t - LANDED_WITH_MINUTES) lo++;
    while (hi < arrivals.length && arrivals[hi] <= t + LANDED_WITH_MINUTES)
      hi++;
    out.push(hi - lo);
  }
  return out;
}

/** How many marks a tier draws for `photos` photographs. */
export function slotsFor(photos: number, tier: StripTier): number {
  return Math.min(tier.most, Math.max(tier.least, photos));
}

/**
 * THE STRIP'S MARKS: `slots` of them across the foot. An album with more photographs than slots folds a run of
 * neighbours into each (the mark as tall as the run's average), so the whole album always spans the line; one with
 * fewer takes a slot each at the newest end, and the slots before its first photograph wait as the quiet line it will
 * fill. Each mark is then softened against its two neighbours, so the line reads as the album's breath rather than a
 * barcode of single photographs.
 *
 * `heights` is `landedWith(arrivals)`, handed in so the three tiers of one album read it once.
 */
export function stripMarks(
  arrivals: readonly number[],
  slots: number,
  heights: readonly number[] = landedWith(arrivals),
): StripMark[] {
  const n = arrivals.length;
  if (n === 0) {
    return Array.from({ length: slots }, () => ({
      h: 0,
      waiting: true,
      fresh: false,
    }));
  }
  const newest = arrivals[n - 1];
  const fresh = (i: number) => arrivals[i] > newest - LIT_WITHIN_MINUTES;
  const pad = Math.max(0, slots - n);
  const raw = Array.from({ length: slots }, (_, s) => {
    if (s < pad) return null;
    if (n <= slots) {
      const i = s - pad;
      return { h: heights[i], fresh: fresh(i) };
    }
    const from = Math.floor((s / slots) * n);
    const to = Math.max(from + 1, Math.floor(((s + 1) / slots) * n));
    let sum = 0;
    for (let i = from; i < to; i++) sum += heights[i];
    return { h: sum / (to - from), fresh: fresh(to - 1) };
  });
  const soft = raw.map((m, s) => {
    if (!m) return 0;
    const l = raw[s - 1]?.h ?? m.h;
    const r = raw[s + 1]?.h ?? m.h;
    return 0.25 * l + 0.5 * m.h + 0.25 * r;
  });
  const peak = Math.max(...soft);
  return raw.map((m, s) =>
    m
      ? { h: soft[s] / peak, waiting: false, fresh: m.fresh }
      : { h: 0, waiting: true, fresh: false },
  );
}

/**
 * AN ALBUM WHOSE SHAPE IS NOT KNOWN: a head with a count and no arrivals to read (the Library's specimen, a store that
 * has not answered). Every slot stands at one quiet height, so the line says "photographs are here" and never invents
 * a shape. The hub itself always has its manifest, so this is never what a host sees.
 */
export function flatMarks(slots: number): StripMark[] {
  return Array.from({ length: slots }, () => ({
    h: 0.35,
    waiting: false,
    fresh: false,
  }));
}

/** The newest arrival's minute, or null for an empty album. Arrivals are sorted, so it is the last. */
export function newestOf(arrivals: readonly number[]): number | null {
  return arrivals.length > 0 ? arrivals[arrivals.length - 1] : null;
}

/** Whether a photograph that landed at `newest` (minutes since the epoch) is landing now, at `nowMs`. */
export function isLandingNow(newest: number | null, nowMs: number): boolean {
  if (newest === null) return false;
  return nowMs / MS_PER_MINUTE - newest < LIT_WITHIN_MINUTES;
}

/** How long until a photograph that landed at `newest` stops being "now", in ms (0 once it has). */
export function msUntilQuiet(newest: number, nowMs: number): number {
  const quietAt = (newest + LIT_WITHIN_MINUTES) * MS_PER_MINUTE;
  return Math.max(0, quietAt - nowMs);
}
