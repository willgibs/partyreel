import type { ReactNode } from "react";

import { fitChroma, hex } from "@/lib/avatar/gradient";
import { EMBER } from "@/lib/brand/ring";

/**
 * THE RING'S LIGHT, AS COLOUR: the machinery every way of lighting the icon
 * shares (grown from brand r2's Aperture deck, `afterglow/marks.tsx`, which
 * retires with that board), and the contract one way of lighting it fills
 * (`Lighting`, one file each under `lights/`).
 *
 * An SVG has no conic gradient, so the ring is drawn as solid wedges and each
 * wedge asks its lighting for a colour at its angle: 0 at the crown, turning
 * clockwise, so the key light at the top-left is 315.
 */

export type Appearance = "room" | "tinted";

export type Lab = [number, number, number];

export const toLab = (l: number, c: number, h: number): Lab => {
  const r = (h * Math.PI) / 180;
  return [l, c * Math.cos(r), c * Math.sin(r)];
};

export const fromLab = ([l, a, b]: Lab) => {
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l, c: Math.hypot(a, b), h };
};

export const hueLerp = (a: number, b: number, t: number) => {
  const d = ((b - a + 540) % 360) - 180;
  return (a + d * t + 360) % 360;
};

export const mix = (a: Lab, b: Lab, k: number): Lab => [
  a[0] + (b[0] - a[0]) * k,
  a[1] + (b[1] - a[1]) * k,
  a[2] + (b[2] - a[2]) * k,
];

/** A lab colour as sRGB hex, its chroma fitted into the gamut first. */
export const toHex = (lab: Lab) => hex(fitChroma(fromLab(lab)));

/**
 * THE HOUSE EMBER, from its one home (`src/lib/brand/ring.ts`, globals.css's
 * `--ember-1..4`): one gradient in one direction from the one key light,
 * amber, then coral, then a deep ember; never lamps side by side.
 */
export { EMBER };

/** The ember at `t` (0 its lit end, 1 its deep end), as a lab colour; `chroma` 0 is the tinted grey. */
export function emberAt(t: number, chroma = 1): Lab {
  let i = 0;
  while (i < EMBER.length - 2 && t > EMBER[i + 1].t) i++;
  const A = EMBER[i];
  const B = EMBER[i + 1];
  const u = Math.min(1, Math.max(0, (t - A.t) / (B.t - A.t)));
  const s = u * u * (3 - 2 * u);
  return toLab(
    A.l + (B.l - A.l) * s,
    (A.c + (B.c - A.c) * s) * chroma,
    hueLerp(A.h, B.h, s),
  );
}

/** The tile each appearance's shadow side falls toward. */
export const TILE_MIX: Record<Appearance, Lab> = {
  room: toLab(0.16, 0.004, 286),
  tinted: toLab(0.16, 0, 286),
};

/** Where the key light sits: the top-left. */
export const KEY = 315;

/** How far an angle is from another, 0 to 180. */
export const apart = (deg: number, from: number) =>
  Math.abs(((((deg - from) % 360) + 540) % 360) - 180);

/** The optics one drawn size uses (fractions of the 1024 box). */
export type Optics = {
  rDisc: number;
  gap: number;
  band: number;
  glow: number;
  glowBlur: number;
  corona: number;
  coronaOp: number;
  bevel: boolean;
  floor: number;
  n: number;
};

/**
 * ONE WAY OF LIGHTING THE RING: the band's colour and the glow's at an angle,
 * and, if it wants them, its own optics at a size, its own tile and puck, and
 * something drawn on the puck's face (in the 1024 box).
 */
export type Lighting = {
  band: (deg: number, appearance: Appearance, floor: number) => string;
  glow: (
    deg: number,
    appearance: Appearance,
  ) => { fill: string; opacity: number };
  optics?: (size: number) => Partial<Optics>;
  tile?: Record<Appearance, readonly [string, string]>;
  disc?: Record<Appearance, readonly [string, string]>;
  face?: (size: number, appearance: Appearance) => ReactNode;
};
