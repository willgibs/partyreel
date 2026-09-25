"use client";

import { useEffect, useState } from "react";

import { GALLERY_ITEMS } from "@/app/(dev)/design/sandbox/gallery-fixtures";
import type { GridMedia } from "@/components/app/media-grid";
import { MasonryColumns, type RowRhythm } from "@/components/shared/masonry";
import type { RowStep } from "@/lib/shared/album-rows";
import { ARRIVAL_GLOW_MS } from "@/lib/shared/arrival";

/**
 * THE LAB'S FIXTURE ALBUM, AT A PARTY'S SIZE AND SHAPES. Eighteen photographs
 * (`GALLERY_ITEMS`) is two rows at a desk, which cannot show that the rows
 * below an arrival hold still, so the same stills are dealt out to forty-eight
 * tiles at the shapes a party really produces: mostly phone portraits, a
 * landscape in four, a few 9:16 clips (two of them videos, for the play mark),
 * the odd square. A tile's declared shape is free to differ from its still's
 * (`MediaTile` crops), which is the fixtures' own rule.
 */
const SHAPES: readonly [number, number][] = [
  [3, 4],
  [3, 4],
  [4, 3],
  [3, 4],
  [9, 16],
  [4, 3],
  [1, 1],
  [3, 4],
  [16, 9],
  [3, 4],
  [2, 3],
  [4, 3],
  [3, 4],
  [3, 2],
];

function dealt(i: number, id: string, shape: number): GridMedia {
  const [w, h] = SHAPES[shape % SHAPES.length];
  return {
    ...GALLERY_ITEMS[i % GALLERY_ITEMS.length],
    id,
    width: w * 1000,
    height: h * 1000,
    likeCount: undefined,
  };
}

export const ALBUM: GridMedia[] = Array.from({ length: 48 }, (_, i) => ({
  ...dealt(i, `rows-${i}`, i),
  type: i === 7 || i === 29 ? "video" : "photo",
}));

/**
 * SIMULATED UPLOADS, ARRIVING LIVE: the first a beat and a half after the frame
 * opens, then one every 3.2s, now and then two at once (a guest's pick of two),
 * at the album's head as the real poll lands them, for as long as the frame is
 * open (the album grows the way a party's does; a reset would be a reflow of
 * its own).
 *
 * ★ THE GLOW IS HELD HERE, IN THE SAME UPDATE THAT LANDS THE PHOTOGRAPH, not
 * through `useArrivalMarks` (which marks in an effect, a commit later). An
 * entrance keyed on `data-arrived` has to see it on the tile's very first
 * frame, or the tile shows for a frame before its entrance starts. The hold is
 * the grammar's own number (`ARRIVAL_GLOW_MS`).
 */
export function useLiveAlbum({
  start = 1500,
  every = 3200,
}: { start?: number; every?: number } = {}) {
  const [state, setState] = useState<{
    items: GridMedia[];
    arrived: ReadonlySet<string>;
  }>({ items: ALBUM, arrived: new Set() });

  useEffect(() => {
    let k = 0;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const later = (fn: () => void, ms: number) => {
      const t = setTimeout(() => {
        timers.delete(t);
        fn();
      }, ms);
      timers.add(t);
    };
    const tick = () => {
      const batch = k % 5 === 3 ? 2 : 1;
      const fresh = Array.from({ length: batch }, (_, b) =>
        dealt(k * 5 + b * 7 + 3, `arrival-${k + b}`, k * 3 + b + 1),
      );
      k += batch;
      const ids = fresh.map((m) => m.id);
      setState((prev) => ({
        items: [...fresh, ...prev.items],
        arrived: new Set([...prev.arrived, ...ids]),
      }));
      later(() => {
        setState((prev) => {
          const arrived = new Set(prev.arrived);
          for (const id of ids) arrived.delete(id);
          return { ...prev, arrived };
        });
      }, ARRIVAL_GLOW_MS);
      later(tick, every);
    };
    later(tick, start);
    return () => {
      for (const t of timers) clearTimeout(t);
    };
  }, [start, every]);

  return state;
}

/**
 * THE REAL ALBUM: `MasonryColumns` with `layout="rows"`, the guest album's own
 * props (its entrance stagger, its arrival marks), never a copy of it.
 */
export function RowsAlbum({
  items,
  arrivedIds,
  step,
  rhythm,
  seed,
}: {
  items: GridMedia[];
  arrivedIds?: ReadonlySet<string>;
  step?: RowStep;
  rhythm?: RowRhythm;
  seed?: number;
}) {
  return (
    <div className="pointer-events-none" data-lab-specimen>
      <MasonryColumns
        items={items}
        layout="rows"
        stagger
        arrivedIds={arrivedIds}
        rowStep={step}
        rowRhythm={rhythm}
        rhythmSeed={seed}
        photoAddress={false}
      />
    </div>
  );
}
