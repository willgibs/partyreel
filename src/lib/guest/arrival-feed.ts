/**
 * THE REEL'S ARRIVAL FEED, AS ARITHMETIC (reel-guest-wiring, 2026-09-24).
 *
 * Will's `arrival=chip`, with his note: "By placing in the top left, it can be further refined into a
 * subtle feed with temporary stacking (limited depth) if high-frequency uploading leads to 2+
 * notifications at once before they disappear (feed could be not just names, but even 'X +12' or
 * something better). It also doesn't become a centerpiece of the reel."
 *
 * So a fresh upload names its uploader in a small chip for ONE HOLD (the viewer's own hold setting,
 * so the chip lives exactly as long as a photograph does). A chip per person: a second photograph
 * from the same person while their chip is up refreshes it and counts ("Theo +2"), rather than
 * stacking the same name twice. Different people stack, newest on top, at most `depth` deep; past
 * that the oldest fold into one last line that only counts ("+12 more"), so a burst of forty is
 * three quiet lines, never a wall of names.
 *
 * Pure: time is a number the caller passes, so every rule is pinnable without a clock.
 */

import { formatCount } from "@/lib/format/count";

/** One person's chip. `extra` counts the photographs past their first while it has been up. */
export type ArrivalEntry = {
  /** The grouping key: the uploader's name, or the id for a photograph that names nobody. */
  key: string;
  /** Who, as the reel says it; null names nobody ("New photo"). */
  name: string | null;
  extra: number;
  /** The last arrival's time: newest first, and what keeps the chip up. */
  at: number;
  until: number;
};

export type ArrivalRow =
  | { kind: "person"; key: string; name: string | null; extra: number }
  | { kind: "more"; key: "more"; count: number };

export const ARRIVAL_FEED_DEPTH = 3;

/**
 * Take arrivals into the feed. `holdMs` is one hold; the feed is also pruned of anything expired by
 * `now`, so callers never keep a separate sweep.
 */
export function pushArrivals(
  feed: readonly ArrivalEntry[],
  arrivals: readonly { id: string; name: string | null }[],
  now: number,
  holdMs: number,
): ArrivalEntry[] {
  const next = new Map<string, ArrivalEntry>();
  for (const entry of feed) {
    if (entry.until > now) next.set(entry.key, entry);
  }
  for (const arrival of arrivals) {
    const key = arrival.name ? `name:${arrival.name}` : `id:${arrival.id}`;
    const held = next.get(key);
    if (held) {
      next.delete(key); // re-inserted below, so it moves to the newest place
      next.set(key, {
        ...held,
        extra: held.extra + 1,
        at: now,
        until: now + holdMs,
      });
    } else {
      next.set(key, {
        key,
        name: arrival.name,
        extra: 0,
        at: now,
        until: now + holdMs,
      });
    }
  }
  return [...next.values()];
}

/** Drop what has run its hold. */
export function pruneArrivals(
  feed: readonly ArrivalEntry[],
  now: number,
): ArrivalEntry[] {
  return feed.filter((entry) => entry.until > now);
}

/** When the feed next changes by itself (the earliest expiry), or null when it is empty. */
export function nextArrivalExpiry(feed: readonly ArrivalEntry[]): number | null {
  let soonest: number | null = null;
  for (const entry of feed) {
    if (soonest === null || entry.until < soonest) soonest = entry.until;
  }
  return soonest;
}

/**
 * What the feed draws: newest first, at most `depth` lines, the overflow folded into one last line
 * that counts every photograph in the people it hides.
 */
export function arrivalRows(
  feed: readonly ArrivalEntry[],
  depth = ARRIVAL_FEED_DEPTH,
): ArrivalRow[] {
  const newest = [...feed].sort((a, b) => b.at - a.at);
  const asRow = (entry: ArrivalEntry): ArrivalRow => ({
    kind: "person",
    key: entry.key,
    name: entry.name,
    extra: entry.extra,
  });
  if (newest.length <= depth) return newest.map(asRow);
  const shown = newest.slice(0, Math.max(1, depth - 1)).map(asRow);
  const hidden = newest.slice(Math.max(1, depth - 1));
  const count = hidden.reduce((sum, entry) => sum + 1 + entry.extra, 0);
  return [...shown, { kind: "more", key: "more", count }];
}

/** A person's line as the chip reads it: "Theo", "Theo +2", or "New photo". */
export function arrivalLabel(row: ArrivalRow): string {
  if (row.kind === "more") return `+${formatCount(row.count)} more`;
  const who = row.name ?? "New photo";
  return row.extra > 0 ? `${who} +${formatCount(row.extra)}` : who;
}
