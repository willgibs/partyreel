"use client";

import { useEffect, useState } from "react";

import type { HeadStill } from "@/components/guest/event-experience-head";
import { srgbToOklch } from "@/lib/shared/sampled-palette";

import { keyOfStill } from "./light";

/**
 * THE EDGE'S OWN COLOURS, READ OFF THE COVER AS IT IS CROPPED (Afterglow's
 * `EDGE`: "the dominant hue of each sixth of one edge, the same sampler run on
 * that strip alone"). Round five's Seam stood one merged lamp in for the edge;
 * this reads, for every still the cover dissolves through, the last rows the
 * eye actually sees at the cover's foot (the photograph is `object-fit:
 * cover`, centred, so a laptop's edge is not a phone's), split in six and
 * each sixth's heaviest hue taken, chroma-weighted, the way production's
 * sampler weighs (`sampled-palette.ts`).
 *
 * ★ A SIXTH WITH NO COLOUR OF ITS OWN (a white cloth, a black suit) borrows
 * its neighbour's, then its still's key: a hue read off a grey is noise.
 * ★ THE STILLS ARE THE APP'S OWN FILES (same origin), so the canvas is never
 * tainted; one read per still and size, kept for the page's life.
 */

const SEGMENTS = 6;
/** The share of the visible height read as the edge: its last rows. */
const STRIP = 0.04;
/** A sixth whose mean chroma is under this has no colour of its own. */
const GREY = 0.014;

const cache = new Map<string, Promise<readonly number[] | null>>();

function loaded(src: string, doc: Document): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = doc.createElement("img");
    img.decoding = "async";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

/** The heaviest hue of a run of pixels, chroma-weighted in 15° buckets, or null for a grey. */
function dominant(
  px: Uint8ClampedArray,
  from: number,
  to: number,
  stride: number,
  rows: number,
  width: number,
) {
  const buckets = new Array<{ w: number; x: number; y: number }>(24)
    .fill({ w: 0, x: 0, y: 0 })
    .map(() => ({ w: 0, x: 0, y: 0 }));
  let total = 0;
  let n = 0;
  for (let y = 0; y < rows; y++)
    for (let x = from; x < to; x++) {
      const i = (y * width + x) * stride;
      const { c, h } = srgbToOklch(px[i], px[i + 1], px[i + 2]);
      n++;
      total += c;
      if (c < 0.01) continue;
      const b = buckets[Math.floor(h / 15) % 24];
      b.w += c;
      b.x += c * Math.cos((h * Math.PI) / 180);
      b.y += c * Math.sin((h * Math.PI) / 180);
    }
  if (n === 0 || total / n < GREY) return null;
  const best = buckets.reduce((a, b) => (b.w > a.w ? b : a));
  return ((Math.atan2(best.y, best.x) * 180) / Math.PI + 360) % 360;
}

async function read(
  still: HeadStill,
  w: number,
  h: number,
  doc: Document,
): Promise<readonly number[] | null> {
  const img = await loaded(still.tile, doc);
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  if (!nw || !nh) return null;
  // object-fit: cover, centred: the visible part of the picture, in its own pixels.
  const s = Math.max(w / nw, h / nh);
  const vw = w / s;
  const vh = h / s;
  const x0 = (nw - vw) / 2;
  const bottom = (nh + vh) / 2;
  const strip = Math.max(2, vh * STRIP);
  const cw = 120;
  const ch = 6;
  const canvas = doc.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, x0, bottom - strip, vw, strip, 0, 0, cw, ch);
  const px = ctx.getImageData(0, 0, cw, ch).data;
  const seg = cw / SEGMENTS;
  const raw = Array.from({ length: SEGMENTS }, (_, i) =>
    dominant(px, Math.round(i * seg), Math.round((i + 1) * seg), 4, ch, cw),
  );
  const key = keyOfStill(still.id);
  return threeAtMost(fill(raw, key));
}

/** A grey sixth borrows its nearest coloured neighbour's hue, then the still's key. */
function fill(raw: readonly (number | null)[], key: number | null) {
  const filled = raw.map((hue, i) => {
    if (hue !== null) return hue;
    for (let d = 1; d < SEGMENTS; d++) {
      const near = raw[i - d] ?? raw[i + d];
      if (near !== null && near !== undefined) return near;
    }
    return key;
  });
  return filled.every((x) => x !== null) ? (filled as number[]) : null;
}

const gap = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
};

/**
 * ★ AT MOST THREE HUES TO A LIGHT (brand r2's polish, every take: "a fourth
 * hue from one photograph is the rainbow creeping back in"): the six sixths
 * are gathered into families within 40°, the three largest kept, and every
 * sixth takes its nearest family's hue, so neighbours never blend through a
 * grey and the light stays the photograph's, in place.
 */
function threeAtMost(hues: readonly number[] | null): readonly number[] | null {
  if (!hues) return null;
  const families: { h: number; n: number }[] = [];
  for (const h of hues) {
    const near = families.find((f) => gap(f.h, h) < 40);
    if (near) {
      const d = ((h - near.h + 540) % 360) - 180;
      near.h = (near.h + d / (near.n + 1) + 360) % 360;
      near.n += 1;
    } else families.push({ h, n: 1 });
  }
  const kept = families.sort((a, b) => b.n - a.n).slice(0, 3);
  return hues.map(
    (h) => kept.reduce((a, b) => (gap(b.h, h) < gap(a.h, h) ? b : a)).h,
  );
}

/**
 * Every still's edge, at the cover's size: a still's id to its six hues (or
 * null, unread or grey through). The cover's box is read off the frame's own
 * head (`data-eh-head`) and read again as it resizes.
 */
export function useEdges(
  stills: readonly HeadStill[],
  anchor: React.RefObject<HTMLElement | null>,
): Record<string, readonly number[] | null> {
  const [edges, setEdges] = useState<Record<string, readonly number[] | null>>(
    {},
  );
  const ids = stills.map((s) => s.id).join(",");
  useEffect(() => {
    const doc = anchor.current?.ownerDocument;
    const win = doc?.defaultView;
    const head = doc?.querySelector<HTMLElement>("[data-eh-head]");
    if (!doc || !win || !head) return;
    let gone = false;
    const run = () => {
      const r = head.getBoundingClientRect();
      const w = Math.round(r.width);
      const h = Math.round(r.height);
      if (!w || !h) return;
      Promise.all(
        stills.map(async (s) => {
          const key = `${s.id}:${w}x${h}`;
          if (!cache.has(key))
            cache.set(
              key,
              read(s, w, h, doc).catch(() => null),
            );
          return [s.id, await cache.get(key)!] as const;
        }),
      ).then((all) => {
        if (!gone) setEdges(Object.fromEntries(all));
      });
    };
    run();
    const ro = new win.ResizeObserver(run);
    ro.observe(head);
    return () => {
      gone = true;
      ro.disconnect();
    };
    // `ids` stands for the stills: a new array of the same stills is the same read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, anchor]);
  return edges;
}
