"use client";

import { useEffect, useState } from "react";

import type { AlbumFixture } from "./album-fill-fixtures";

/**
 * THE FILLING ALBUM'S CLOCK: one integer drives everything.
 *
 * `tick` runs at HALF-BEAT resolution. On an odd tick the next fixture mounts
 * at the head of its column as an "uploading" tile (the product's own in-flight
 * treatment, a thin progress strip at the tile's foot); on the following even
 * tick it LANDS: same key, so the strip-to-check swap is a prop change on one
 * mounted node and the photograph never remounts (the re-key rule the guest
 * gallery follows so a tile never flickers). The green check holds for
 * roughly 2.5 seconds, as it does in the app, then unmounts.
 *
 * Everything the grid needs is DERIVED from the tick by a pure function, which
 * is what makes reduced motion a derivation rather than an effect (t jumps to
 * the end: the full album, no strip, no checks) and what the unit test pins.
 *
 * ★ `layoutKey` is the MOUNTED COUNT, never the tick. useFlip re-runs its
 * layout effect whenever this changes; if it re-ran while a previous slide was
 * mid-flight it would measure the TRANSFORMED rect, compute a bogus delta and
 * snap the column past its target. So the key changes only on commits that
 * mount a tile (the uploading half-tick), and the beat stays comfortably above
 * `--tune-reorder-ms` (500ms): 800ms here, never below 700.
 *
 * The clock is a chained setTimeout, not an interval: pausing (off-screen,
 * hidden tab, reduced motion, via useAmbientPause) clears the pending half-beat
 * and resuming re-arms one from the current tick, so a background tab never
 * bursts to catch up. State is only ever set inside the timer callback.
 */

export type AlbumTile = {
  /** The instance key: `seed:<id>` or `<id>#<arrival index>`; never reused. */
  key: string;
  fixture: AlbumFixture;
  status: "seed" | "uploading" | "landed";
  /** Inside the green-check window. */
  check: boolean;
};

export type AlbumFillView = {
  /** Per column, NEWEST FIRST. */
  columns: AlbumTile[][];
  photos: number;
  guests: number;
  /** useFlip's orderKey: the mounted tile count. */
  layoutKey: string;
  done: boolean;
};

export type AlbumFillOptions = {
  fixtures: readonly AlbumFixture[];
  seedCount: number;
  /** One landing per beat, in ms. Keep >= 700 (see the header). */
  beatMs?: number;
  /** Show the next arrival as an uploading tile for the half-beat before it lands. */
  upload?: boolean;
  checkMs?: number;
  /** Keep landing forever, cycling the arrivals (the "everywhere" pair). */
  loop?: boolean;
  /** Bound the DOM under a loop: tiles past this per column unmount. */
  maxPerColumn?: number;
};

const DEFAULTS = {
  beatMs: 800,
  upload: true,
  checkMs: 2500,
  loop: false,
  maxPerColumn: Number.POSITIVE_INFINITY,
} as const;

/** The end tick for a non-looping run: every arrival landed and its check cleared. */
export function endTick(opts: AlbumFillOptions): number {
  const { beatMs, checkMs, loop } = { ...DEFAULTS, ...opts };
  if (loop) return Number.POSITIVE_INFINITY;
  const arrivals = opts.fixtures.length - opts.seedCount;
  const checkBeats = Math.ceil(checkMs / beatMs);
  return 2 * arrivals + 2 * checkBeats;
}

/** Pure: the whole view from one tick. Exported for the test. */
export function deriveAlbumFill(
  tick: number,
  opts: AlbumFillOptions,
): AlbumFillView {
  const { beatMs, upload, checkMs, loop, maxPerColumn } = {
    ...DEFAULTS,
    ...opts,
  };
  const seeds = opts.fixtures.slice(0, opts.seedCount);
  const arrivals = opts.fixtures.slice(opts.seedCount);
  const total = loop ? Number.POSITIVE_INFINITY : arrivals.length;
  const checkBeats = Math.ceil(checkMs / beatMs);
  const end = endTick(opts);
  const t = Math.min(tick, end);

  // `progressed` keeps counting past the last landing so the final checks
  // still clear on the clock; `landed` is what is actually on screen.
  const progressed = Math.floor(t / 2);
  const landed = Math.min(progressed, total);
  const pending = upload && t % 2 === 1 && landed < total ? landed : null;

  const arrival = (i: number) => arrivals[loop ? i % arrivals.length : i];
  const tileFor = (i: number, status: AlbumTile["status"]): AlbumTile => ({
    key: `${arrival(i).id}#${i}`,
    fixture: arrival(i),
    status,
    check: status === "landed" && i >= progressed - checkBeats,
  });

  const columns: AlbumTile[][] = [[], [], []];
  if (pending !== null) {
    columns[arrival(pending).col].push(tileFor(pending, "uploading"));
  }
  for (let i = landed - 1; i >= 0; i--) {
    columns[arrival(i).col].push(tileFor(i, "landed"));
  }
  for (let s = seeds.length - 1; s >= 0; s--) {
    columns[seeds[s].col].push({
      key: `seed:${seeds[s].id}`,
      fixture: seeds[s],
      status: "seed",
      check: false,
    });
  }
  const bounded = columns.map((c) => c.slice(0, maxPerColumn));

  const names = new Set<string>();
  seeds.forEach((f) => names.add(f.by));
  for (let i = 0; i < landed; i++) names.add(arrival(i).by);
  names.delete("Anonymous");

  return {
    columns: bounded,
    photos: seeds.length + landed,
    guests: names.size,
    layoutKey: String(seeds.length + landed + (pending !== null ? 1 : 0)),
    done: !loop && t >= end,
  };
}

export function useAlbumFill(
  opts: AlbumFillOptions & { paused: boolean; reduced: boolean },
): AlbumFillView {
  const { paused, reduced, ...fill } = opts;
  const [tick, setTick] = useState(0);
  const beatMs = fill.beatMs ?? DEFAULTS.beatMs;
  const end = endTick(fill);
  // Reduced motion is a DERIVATION to the end state, never a state reset.
  const t = reduced ? end : tick;
  const done = t >= end;

  useEffect(() => {
    if (paused || reduced || done) return;
    const id = setTimeout(() => setTick((n) => n + 1), beatMs / 2);
    return () => clearTimeout(id);
  }, [paused, reduced, done, t, beatMs]);

  return deriveAlbumFill(t, fill);
}
