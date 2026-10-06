import { css, fitChroma, hex } from "@/lib/avatar/gradient";

import type { Case } from "./fixtures";

/**
 * THE COVER'S LIGHT, AS AFTERGLOW DEFINES IT (brand r1, Will's desk-4 pick;
 * brand r2's kit): light is born bright at its source and spent fast, drawn
 * only as a Ring, a Seam or a Bloom, one to a screen. The hub's one light is
 * the Seam born where the cover's photograph ends, and this file says what
 * colour it is: THE EDGE'S OWN COLOURS, SEGMENT BY SEGMENT (`edge.ts` reads
 * them off the cover's own crop), in the room's registers.
 *
 * ★ ROUND SIX'S CORRECTION (the Orchestrator's trace, 2026-10-06): round five's
 * Seam was one merged lamp drawn as a stripe (a pixel of core, two of gold, a
 * 12px fall at 22%), about a tenth of the brand's reach at a quarter of its
 * strength, under the cards. Afterglow's is the edge's colours pooled in three
 * soft ellipses with a hot source line, reaching 72 to 120px at full strength,
 * past every control. So these are the brand's values, quoted, never retuned
 * (a board never imports another board's folder): `afterglow/system.tsx`'s
 * `REGISTER`, `unOlive`, `yellowness` and floor, its six stills' intensity,
 * Ink's press (`ink/light.tsx`) and Cast's paper band (`cast/light.tsx`).
 */

const hueGap = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
};
const mixHue = (a: number, b: number, t: number) => {
  const d = ((b - a + 540) % 360) - 180;
  return (a + d * t + 360) % 360;
};

/** A still's sampled hues and their shares (brand r1's `SAMPLED`, the cover's six). */
const SAMPLED: Record<string, readonly { h: number; w: number }[]> = {
  "wedding-toast": [{ h: 67.4, w: 1 }],
  "reception-hall": [
    { h: 247.6, w: 0.5 },
    { h: 56.2, w: 0.44 },
    { h: 109.7, w: 0.06 },
  ],
  "wedding-golden": [{ h: 53.4, w: 1 }],
  "wedding-arch": [
    { h: 130.1, w: 0.8 },
    { h: 68, w: 0.2 },
  ],
  "wedding-petals": [
    { h: 49.9, w: 0.4 },
    { h: 95.8, w: 0.35 },
    { h: 263.7, w: 0.25 },
  ],
  "reception-table": [
    { h: 67.3, w: 0.63 },
    { h: 216.3, w: 0.23 },
    { h: 112.6, w: 0.14 },
  ],
};

/** A still's intensity: the 95th-percentile chroma of its midtones (brand r1's `INTENSITY`). */
const INTENSITY: Record<string, number> = {
  "wedding-toast": 0.098,
  "reception-hall": 0.082,
  "wedding-golden": 0.063,
  "wedding-arch": 0.051,
  "wedding-petals": 0.064,
  "reception-table": 0.12,
};

/** A photograph's light chroma: its own intensity, lifted, inside the room's range (`chromaOf`). */
export const chromaOf = (id: string) =>
  Math.min(0.15, Math.max(0.07, (INTENSITY[id] ?? 0.1) * 1.15));

/** A still's own strongest hue (its key), the fallback for an edge segment with no colour of its own. */
export const keyOfStill = (id: string): number | null => {
  const lamps = SAMPLED[id];
  if (!lamps) return null;
  return [...lamps].sort((a, b) => b.w - a.w)[0].h;
};

/**
 * THE COVER'S KEY (Afterglow's `keyOf`): every still's hues voted by its share
 * and its intensity, near hues merged. Ink prints in it; nothing in the room
 * reads it. Null before the first photograph.
 */
export function keyOfCover(c: Case): { h: number; c: number } | null {
  const ids = c.stills.map((s) => s.id).filter((id) => SAMPLED[id]);
  if (ids.length === 0) return null;
  const votes: { h: number; w: number }[] = [];
  for (const id of ids)
    for (const lamp of SAMPLED[id]) {
      const w = lamp.w * (INTENSITY[id] ?? 0.1);
      const near = votes.find((v) => hueGap(v.h, lamp.h) < 24);
      if (near) {
        near.h = mixHue(near.h, lamp.h, w / (near.w + w));
        near.w += w;
      } else votes.push({ h: lamp.h, w });
    }
  const best = votes.sort((a, b) => b.w - a.w)[0];
  return { h: best.h, c: Math.max(...ids.map(chromaOf)) };
}

/* ── the room's registers (Afterglow's, quoted) ─────────────────────────── */

const REGISTER = {
  /** The Seam's glow, in the room. */
  roomSeam: { l: 0.82, lift: 0.07, c: 0.15, boost: 1.05 },
  /** The Seam's source line, in the room: the edge itself, lit. */
  roomLine: { l: 0.92, lift: 0.02, c: 0.13, boost: 1 },
} as const;

/** How far a hue sits toward yellow, 0 to 1 (yellows need more lightness). */
const yellowness = (h: number) =>
  Math.max(0, Math.cos(((hueGap(h, 95) / 70) * Math.PI) / 2));

/** ★ Light never goes olive: the band the eye reads as mud once dimmed goes to the clean light it nearly was. */
const unOlive = (h: number) => (h > 92 && h < 128 ? (h < 110 ? 80 : 138) : h);

/** A light is drawn at no less than this chroma, so soft daylight still gives off light. */
const CHROMA_FLOOR = 0.13;

function lampTone(h: number, c: number, register: keyof typeof REGISTER) {
  const r = REGISTER[register];
  const hue = unOlive(h);
  const l = Math.min(0.95, r.l + r.lift * yellowness(hue));
  return css(
    fitChroma({
      l,
      c: Math.min(r.c, Math.max(CHROMA_FLOOR, c * r.boost)),
      h: hue,
    }),
  );
}

/**
 * THE EDGE AS A BAND, LEFT TO RIGHT (Afterglow's `bandOf`): each segment's hue
 * at the centre of its share of the width, blended in oklab, never through a
 * grey. Six segments, so the light under the bride is the bride's.
 */
export function edgeBand(
  hues: readonly number[],
  c: number,
  register: keyof typeof REGISTER,
): string {
  const n = hues.length;
  const stops = hues.map(
    (h, i) =>
      `${lampTone(h, c, register)} ${(((i + 0.5) / n) * 100).toFixed(1)}%`,
  );
  return `linear-gradient(in oklab 90deg, ${stops.join(", ")})`;
}

/* ── paper: Ink's press and Cast's band (each take's own, quoted) ─────────── */

/** Production's paper ground, the stock an ink must hold 4.6:1 on. */
const STOCK = { l: 0.972, c: 0.002, h: 286 };

const luminance = (lch: { l: number; c: number; h: number }) => {
  const n = parseInt(hex(fitChroma(lch)).slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const x = v / 255;
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
};
const contrast = (
  a: { l: number; c: number; h: number },
  b: { l: number; c: number; h: number },
) => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

/** Ink's press: the lightness a hue prints at before it is deepened to hold on the stock. */
const PRESS: readonly (readonly [number, number])[] = [
  [0, 0.52],
  [30, 0.54],
  [50, 0.56],
  [75, 0.56],
  [100, 0.53],
  [140, 0.51],
  [180, 0.505],
  [220, 0.495],
  [260, 0.48],
  [290, 0.48],
  [330, 0.5],
  [360, 0.52],
];
const pressL = (h: number) => {
  for (let i = 1; i < PRESS.length; i++) {
    const [h1, l1] = PRESS[i];
    const [h0, l0] = PRESS[i - 1];
    if (h <= h1) return l0 + ((h - h0) / (h1 - h0)) * (l1 - l0);
  }
  return 0.52;
};
/** ★ A yellow prints as its amber (Ink's `printHue`): deepened, a yellow goes olive and an amber brown. */
const printHue = (h: number) => {
  const u = unOlive(h);
  return u > 25 && u < 100 ? u - 18 * yellowness(u) ** 2 : u;
};

/**
 * INK'S INK: the cover's key printed deep and saturated, deepened until it
 * holds 4.6:1 on the stock, so the credits set in it read as type.
 */
export function inkOfCover(c: Case): string {
  // Before the first photograph, the house's ink: the ember's key printed (Ink's `HOUSE_INK`).
  const key = keyOfCover(c) ?? { h: 42, c: 0.15 };
  const h = printHue(key.h);
  const chroma = Math.min(0.165, Math.max(0.12, 0.125 + (key.c - 0.1) * 0.6));
  let l = pressL(h);
  let ink = fitChroma({ l, c: chroma, h });
  while (contrast(ink, STOCK) < 4.6 && l > 0.3) {
    l -= 0.004;
    ink = fitChroma({ l, c: chroma, h });
  }
  return css(ink);
}

/**
 * CAST'S PAPER BAND: the edge's own colours as a coloured shadow, darker than
 * the page and fuller than a glow (its `PAPER_DENSE`: a cream edge lands gold,
 * never lemon), multiplied onto the paper. One tone per segment, in place.
 */
export function castBand(hues: readonly number[], c: number): string {
  const n = hues.length;
  const stops = hues.map((h, i) => {
    const hue = printHue(h);
    const tone = css(
      fitChroma({
        l: 0.6 + 0.08 * yellowness(hue),
        c: Math.min(0.17, Math.max(0.12, c * 1.4)),
        h: hue,
      }),
    );
    return `${tone} ${(((i + 0.5) / n) * 100).toFixed(1)}%`;
  });
  return `linear-gradient(in oklab 90deg, ${stops.join(", ")})`;
}
