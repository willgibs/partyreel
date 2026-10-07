import { css, fitChroma } from "@/lib/avatar/gradient";
import { pickSpillHues, srgbToOklch } from "@/lib/shared/sampled-palette";

/**
 * THE SEAM'S COLOURS (event-header r6, the Seam made Afterglow's): the edge's own colours, read off the cover's photograph
 * as it is cropped, sixth by sixth, and the light drawn in them. Pure, so every rule here is read in a node test; the
 * reading itself (the decode, the canvas) is `event-hub-head-light.tsx`'s.
 *
 * ★ THE EDGE IS THE ONE THE EYE SEES (Afterglow's `EDGE`: "the dominant hue of each sixth of one edge, the same sampler run
 * on that strip alone"): the cover draws each photograph `object-fit: cover`, centred, so a laptop's foot is not a phone's,
 * and the edge is read off the visible crop at the cover's own size, every time that size changes.
 * ★ A SIXTH WITH NO COLOUR OF ITS OWN (a white cloth, a black suit) borrows its nearest coloured neighbour's hue, then its
 * photograph's own strongest: a hue read off a grey is noise.
 * ★ AT MOST THREE HUES TO A LIGHT (brand r2's polish: "a fourth hue from one photograph is the rainbow creeping back in").
 * ★ NEVER LOUDER THAN ITS PHOTOGRAPH: a light keeps its photograph's own intensity, lifted a seventh, inside the room's
 * range, so a soft daylight wedding glows softly and a laser show at full.
 */

/** A photograph read small: its pixels (RGBA), left to right and top to bottom. */
export type Thumb = { w: number; h: number; px: Uint8ClampedArray };

/** How many hues an edge is read as, left to right. */
export const SEGMENTS = 6;

/** The share of the visible height read as the edge: its last rows. */
const STRIP = 0.04;

/** A sixth whose mean chroma is under this has no colour of its own. */
const GREY = 0.014;

/**
 * THE PART OF A PICTURE `object-fit: cover` SHOWS IN A BOX, centred, in the picture's own pixels: scaled up until it fills
 * the box, its overflow cut equally from both sides.
 */
export function visibleCrop(
  w: number,
  h: number,
  boxW: number,
  boxH: number,
): { x0: number; y0: number; vw: number; vh: number } {
  const s = Math.max(boxW / w, boxH / h);
  const vw = Math.min(w, boxW / s);
  const vh = Math.min(h, boxH / s);
  return { x0: (w - vw) / 2, y0: (h - vh) / 2, vw, vh };
}

/** The heaviest hue of a run of pixels, chroma-weighted in 15° buckets, or null for a grey. */
function dominant(
  px: Uint8ClampedArray,
  width: number,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
): number | null {
  const buckets = Array.from({ length: 24 }, () => ({ w: 0, x: 0, y: 0 }));
  let total = 0;
  let n = 0;
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * 4;
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

/** A grey sixth borrows its nearest coloured neighbour's hue (the left one first), then the photograph's own key. */
export function fillGreys(
  raw: readonly (number | null)[],
  key: number | null,
): number[] | null {
  const filled = raw.map((hue, i) => {
    if (hue !== null) return hue;
    for (let d = 1; d < raw.length; d++) {
      const near = raw[i - d] ?? raw[i + d];
      if (near !== null && near !== undefined) return near;
    }
    return key;
  });
  return filled.every((x): x is number => x !== null) ? filled : null;
}

const gap = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
};

/**
 * AT MOST THREE HUES TO A LIGHT: the sixths gathered into families within 40°, the three largest kept, and every sixth
 * taking its nearest family's hue, so neighbours never blend through a grey and the light stays the photograph's, in place.
 */
export function threeAtMost(hues: readonly number[]): number[] {
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

/** A photograph's own strongest hue (its key): the sampler's heaviest, or null for a photograph with no colour at all. */
export function keyOf(thumb: Thumb): number | null {
  const [top] = pickSpillHues(thumb.px, 1);
  return top ? top.hue : null;
}

/**
 * THE EDGE'S SIX HUES, left to right, at a box's size (the cover's), or null where the photograph has no colour to give.
 * Read off the visible crop's last rows, each sixth's heaviest hue.
 */
export function edgeHues(
  thumb: Thumb,
  boxW: number,
  boxH: number,
): number[] | null {
  if (!thumb.w || !thumb.h || !boxW || !boxH) return null;
  const { x0, y0, vw, vh } = visibleCrop(thumb.w, thumb.h, boxW, boxH);
  const bottom = Math.min(thumb.h, Math.round(y0 + vh));
  const rows = Math.max(1, Math.round(vh * STRIP));
  const top = Math.max(0, bottom - rows);
  const seg = vw / SEGMENTS;
  const raw = Array.from({ length: SEGMENTS }, (_, i) => {
    const from = Math.round(x0 + i * seg);
    const to = Math.max(from + 1, Math.round(x0 + (i + 1) * seg));
    return dominant(
      thumb.px,
      thumb.w,
      from,
      Math.min(to, thumb.w),
      top,
      bottom,
    );
  });
  const filled = fillGreys(raw, keyOf(thumb));
  return filled ? threeAtMost(filled) : null;
}

/**
 * A PHOTOGRAPH'S INTENSITY: the 95th-percentile chroma of its midtones (Afterglow's `INTENSITY`, read the sampler's way,
 * over a 32px read, its near-black and near-white pixels left out since their hue is noise).
 */
export function intensityOf(px: Uint8ClampedArray): number {
  const chroma: number[] = [];
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 128) continue;
    const { l, c } = srgbToOklch(px[i], px[i + 1], px[i + 2]);
    if (l < 0.18 || l > 0.95) continue;
    chroma.push(c);
  }
  if (chroma.length === 0) return 0;
  chroma.sort((a, b) => a - b);
  return chroma[Math.min(chroma.length - 1, Math.floor(chroma.length * 0.95))];
}

/** A photograph's light chroma: its own intensity, lifted a seventh, inside the room's range (Afterglow's `chromaOf`). */
export const chromaOf = (intensity: number) =>
  Math.min(0.15, Math.max(0.07, intensity * 1.15));

/** What one photograph gives the light: its edge's hues at the cover's size, and how strong its light is. */
export type EdgeLight = { hues: readonly number[]; c: number };

/**
 * THE HOUSE'S DUSK (Afterglow's `HOUSE`, the house ember lit as one glow, amber to coral): the light where the cover has no
 * photograph to give one (the week before, or a cover none of whose photographs could be read).
 */
export const HOUSE_LIGHT: EdgeLight = {
  hues: [80, 66, 52, 43, 34, 24],
  c: 0.15,
};

/* ── the room's registers (Afterglow's, quoted, never retuned here) ───────────────────────────────────────────────── */

const REGISTER = {
  /** The Seam's glow, in the room. */
  glow: { l: 0.82, lift: 0.07, c: 0.15, boost: 1.05 },
  /** The Seam's source line: the edge itself, lit. */
  line: { l: 0.92, lift: 0.02, c: 0.13, boost: 1 },
} as const;

/** How far a hue sits toward yellow, 0 to 1 (yellows need more lightness to read as the same light). */
const yellowness = (h: number) =>
  Math.max(0, Math.cos(((gap(h, 95) / 70) * Math.PI) / 2));

/** ★ Light never goes olive: the band the eye reads as mud once dimmed goes to the clean light it nearly was. */
export const unOlive = (h: number) =>
  h > 92 && h < 128 ? (h < 110 ? 80 : 138) : h;

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
 * THE EDGE AS A BAND, LEFT TO RIGHT (Afterglow's `bandOf`): each sixth's hue at the centre of its share of the width,
 * blended in oklab, never through a grey, so the light under the bride is the bride's.
 */
export function edgeBand(light: EdgeLight, register: keyof typeof REGISTER) {
  const n = light.hues.length;
  const stops = light.hues.map(
    (h, i) =>
      `${lampTone(h, light.c, register)} ${(((i + 0.5) / n) * 100).toFixed(1)}%`,
  );
  return `linear-gradient(in oklab 90deg, ${stops.join(", ")})`;
}
