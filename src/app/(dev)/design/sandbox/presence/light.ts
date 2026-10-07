import { fitChroma, orbFor } from "@/lib/avatar/gradient";

import { INTENSITY, type Lamp, SAMPLED, type StillId } from "./fixtures";

/**
 * APERTURE'S LIGHT, AS THIS BOARD NEEDS IT: a photograph's one key light (the
 * ring a face may wear while its photographs land) and a seed's light at
 * three depths (the atmosphere of a party with no photograph yet).
 *
 * ★ RETYPED FROM BRAND R2'S DECK, NEVER IMPORTED (`brand/afterglow/system.tsx`
 * and `brand/aperture/light.tsx`): a board's folder is deleted the day it
 * retires. The register, the yellow lift, the olive guard and the chroma floor
 * are its numbers, kept, so the light here is the light Will picked.
 *
 * ★ A LIGHT IS HANDED A SOURCE, NEVER A COLOUR (the sourcing order: the
 * photographs, then the event's seed, then the house ember).
 */

/** The room's register for a Ring and a Bloom: light born bright at its source. */
const ROOM = { l: 0.72, lift: 0.09, c: 0.15, boost: 1 } as const;

const hueGap = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
};

/** How far a hue sits toward yellow (yellows need more lightness to read as light, never brown). */
const yellowness = (h: number) =>
  Math.max(0, Math.cos(((hueGap(h, 95) / 70) * Math.PI) / 2));

/** Light never goes olive: the band the eye reads as olive once dimmed is pulled to gold or green. */
const unOlive = (h: number) => (h > 92 && h < 128 ? (h < 110 ? 80 : 138) : h);

/** A light is drawn at no less than this chroma, so soft daylight still gives off light. */
const CHROMA_FLOOR = 0.13;

const r3 = (n: number) => Math.round(n * 1000) / 1000;

/** One lamp's colour in the room's register, fitted into the display's gamut. */
export function lampColor(lamp: Lamp): string {
  const h = unOlive(lamp.h);
  const l = Math.min(0.95, ROOM.l + ROOM.lift * yellowness(h) + (lamp.dl ?? 0));
  const own = lamp.c === undefined ? ROOM.c : lamp.c * ROOM.boost;
  const c = Math.min(ROOM.c, Math.max(CHROMA_FLOOR, own));
  const fit = fitChroma({ l, c, h });
  return `oklch(${r3(l)} ${r3(fit.c)} ${Math.round(h)})`;
}

/** A colour at a share of itself, the rest transparent, blended in oklab (never through a grey). */
export const alpha = (color: string, pct: number) =>
  `color-mix(in oklab, ${color} ${pct}%, transparent)`;

/** A photograph's light chroma: its own intensity, lifted, inside the room's range. */
const chromaOf = (id: StillId) =>
  Math.min(0.15, Math.max(0.07, INTENSITY[id] * 1.15));

/** A still's ONE key light: its heaviest hue at its own intensity, in the room's register. */
export function keyOf(id: StillId): string {
  const top = [...SAMPLED[id]].sort((a, b) => b.w - a.w)[0]!;
  return lampColor({ h: top.h, w: 1, c: chromaOf(id) });
}

/**
 * A still's key light as a RING'S PAINT: its hue at three depths round the
 * ring, brightest at the top-left where the product's one light sits (the
 * Add's Ring, brand r2's), so a ring reads as light falling on it, never as a
 * painted outline.
 */
export function ringPaint(id: StillId): string {
  const top = [...SAMPLED[id]].sort((a, b) => b.w - a.w)[0]!;
  const c = chromaOf(id);
  const lit = lampColor({ h: top.h, w: 1, dl: 0.09, c });
  const body = lampColor({ h: top.h, w: 1, c });
  const deep = lampColor({ h: (top.h + 348) % 360, w: 1, dl: -0.08, c });
  return `conic-gradient(in oklab from 300deg, ${lit}, ${body} 22%, ${deep} 50%, ${body} 78%, ${lit})`;
}

/** White light as a ring's paint: whole at the top-left, a little spent round the far side. */
export const WHITE_RING =
  "conic-gradient(in oklab from 300deg, #fff, rgb(255 255 255 / 0.82) 25%, rgb(255 255 255 / 0.6) 50%, rgb(255 255 255 / 0.82) 75%, #fff)";

/**
 * A SEED'S LIGHT, AT THREE DEPTHS (the hashvatar's way to be rich: one hue
 * read lit, as itself and a little cooler in its shadow), each in the room's
 * register; and where its light sits, read off the same orb `Avatar` paints,
 * so a party's colour and the face that shares its seed agree.
 */
export function seedLight(seed: string): {
  lit: string;
  body: string;
  deep: string;
  hue: number;
  at: { x: number; y: number };
} {
  const o = orbFor(seed);
  return {
    lit: lampColor({ h: o.hue, w: 1, dl: 0.07 }),
    body: lampColor({ h: o.hue, w: 1 }),
    deep: lampColor({ h: (o.hue + 348) % 360, w: 1, dl: -0.07 }),
    hue: o.hue,
    at: o.light,
  };
}
