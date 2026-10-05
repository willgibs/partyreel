"use client";

import type { CSSProperties } from "react";

import { formatCount } from "@/lib/format/count";

import type { Case } from "./fixtures";

/**
 * THE COVER'S FACT, SETTLED: the strip (his round-three pick, `facts=strip`,
 * wired by `hub-strip-wiring`), drawn here as the cover's foot under every
 * door option: the album laid photo by photo along the foot, its first
 * photograph at the left and its newest at the right, each mark as tall as
 * how many photographs landed with it, so a morning, a weekend, an undated
 * album and a trickle all fill the same line and none has a gap.
 *
 * ★ WHITE ON THE COVER, BOTH THEMES: it stands on the photograph, so it wears
 * the photograph's ink, never the page's tokens.
 *
 * ★ LIT IS "PHOTOS LANDING NOW" (the newest within a quarter of an hour), and
 * it holds its light: a host keeps the hub open all night, and a pulse that
 * beat for hours would pull her eye off the album. What moves is the album
 * itself: a new mark landing at the newest end.
 */

/* ── the strip, photo by photo ─────────────────────────────────────────────── */

/** How near in time a photograph counts as landing "with" another, in minutes. */
const WITH = 10;

/**
 * EVERY PHOTOGRAPH'S HEIGHT: how many photographs landed within ten minutes of
 * it, itself included. A run of a dozen from one press of Add stands tall, a
 * lone photograph on a quiet Tuesday stands short, and the busiest stretch of
 * a party stands tallest, on any album's own scale.
 */
function landedWith(arrivals: readonly number[]): number[] {
  const out: number[] = [];
  let lo = 0;
  let hi = 0;
  for (let i = 0; i < arrivals.length; i++) {
    const t = arrivals[i];
    while (arrivals[lo] < t - WITH) lo++;
    while (hi < arrivals.length && arrivals[hi] <= t + WITH) hi++;
    out.push(hi - lo);
  }
  return out;
}

/**
 * THE STRIP'S MARKS: `slots` of them across the foot. An album with more
 * photographs than slots folds a run of neighbours into each (the mark as tall
 * as the run's average), so the whole album always spans the card; one with
 * fewer takes a slot each at the newest end, and the slots before its first
 * photograph wait as the quiet line it will fill. Each mark is then softened
 * against its two neighbours, so the line reads as the album's breath rather
 * than a barcode of single photographs.
 */
export function stripMarks(
  arrivals: readonly number[],
  slots: number,
): { h: number; waiting: boolean; fresh: boolean }[] {
  const n = arrivals.length;
  if (n === 0)
    return Array.from({ length: slots }, () => ({
      h: 0,
      waiting: true,
      fresh: false,
    }));
  const heights = landedWith(arrivals);
  const newest = arrivals[n - 1];
  const fresh = (i: number) => arrivals[i] > newest - 15;
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

/** The count at the newest end: the album's number, or what an empty one waits for. */
function EndCount({ c }: { c: Case }) {
  if (c.photos === 0)
    return (
      <span className="shrink-0 pb-px text-xs text-white/70">
        No photos yet
      </span>
    );
  return (
    <span className="flex shrink-0 items-center gap-1.5 pb-px">
      <span className="eh-end" data-lit={c.live ? "" : undefined} aria-hidden />
      <span className="font-heading text-base leading-none tabular-nums">
        {formatCount(c.photos)}
      </span>
    </span>
  );
}

/**
 * HOW MANY MARKS THE STRIP DRAWS: one a photograph, spread across the whole
 * foot, up to as many as fit (160 at a desk, 52 in a hand) and then a run of
 * neighbours a mark; and never fewer than a quiet line's worth (54, 19), so a
 * very small album gathers at the newest end rather than standing three marks
 * a room apart. Only that small album shows the quiet points it will fill: an
 * album of any size spans the card, never a bar filling towards a number.
 */
function slotsFor(photos: number, narrow: boolean): number {
  const most = narrow ? 52 : 160;
  const least = narrow ? 19 : 54;
  return Math.min(most, Math.max(least, photos));
}

export function FactsStrip({ c, narrow }: { c: Case; narrow: boolean }) {
  const height = narrow ? 22 : 30;
  const slots = slotsFor(c.photos, narrow);
  const marks = stripMarks(c.arrivals, slots);
  const filled = marks.filter((m) => !m.waiting).length;
  return (
    <div
      data-eh-facts="strip"
      data-eh-read={
        c.photos === 0
          ? `${slots} waiting slots, no photos yet`
          : `${filled} of ${slots} marks filled, ${formatCount(c.photos)} photos${c.live ? ", the newest lit" : ""}`
      }
      className="flex items-end gap-3 text-white"
      style={{ height }}
    >
      <span
        aria-hidden
        className="eh-strip relative flex h-full flex-1 items-end justify-between"
      >
        {marks.map((m, i) => (
          <span
            key={i}
            className="eh-strip-mark"
            data-waiting={m.waiting ? "" : undefined}
            data-new={c.live && m.fresh ? "" : undefined}
            style={
              m.waiting
                ? undefined
                : ({
                    height: `${3 + (height - 3) * m.h}px`,
                    opacity: 0.55 + 0.45 * m.h,
                  } as CSSProperties)
            }
          />
        ))}
      </span>
      <EndCount c={c} />
      <span className="sr-only">
        {c.photos === 0
          ? "No photos yet"
          : `${formatCount(c.photos)} photos${c.live ? ", landing now" : ""}`}
      </span>
    </div>
  );
}
