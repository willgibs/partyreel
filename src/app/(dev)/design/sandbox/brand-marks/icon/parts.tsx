"use client";

import type { ComponentType } from "react";

import type { Lighting, Optics } from "./light";
import { EMBER_LIGHT } from "./lights/ember";

/**
 * THE PARTS EVERY TAKE DRAWS WITH (split from `ring.tsx` so a take imports
 * them without importing the registry that imports it): the take's contract,
 * and the key-lit ring's wedges, optics and geometry by drawn size as round
 * one's board drew them, which a take that keeps the ring draws its own from.
 * The ring that ships is production's (`src/lib/brand/ring.ts`); `today.tsx`
 * draws it as itself.
 */

/** What a take draws with: the drawn size whose cut it wears, and a prefix for its defs' ids. */
export type ArtProps = { size: number; uid: string };

/**
 * ONE TAKE ON THE RING: everything it draws over the tile, in the 1024 box, at
 * a drawn size's cut (`Art`), and its bare symbol in one colour with no tile
 * (`Mono`, 1024 box), which is the press kit's mono mark and a reel's
 * watermark over footage. ★ A MONO IS FILLS ONLY: its box is measured
 * (`MonoMark`), and an SVG's measure leaves a stroke's outer half out, which
 * cut a stroked ring's edge.
 */
export type Take = {
  Art: ComponentType<ArtProps>;
  Mono: ComponentType<{ color: string }>;
  /** Its own tile's two stops, top to bottom, where the room's will not do. */
  tile?: readonly [string, string];
};

/**
 * An annulus cut into `n` solid wedges, each its own colour, each reaching
 * `overlap` degrees past its neighbours so no seam shows between two.
 */
export function wedges(
  c: number,
  r0: number,
  r1: number,
  n: number,
  colour: (deg: number) => string | { fill: string; opacity: number },
  overlap = 0.35,
) {
  const out: { d: string; fill: string; opacity?: number }[] = [];
  const p = (r: number, g: number) =>
    `${(c + r * Math.cos(g)).toFixed(1)},${(c + r * Math.sin(g)).toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const a0 = (i * 360) / n;
    const a1 = ((i + 1) * 360) / n;
    const g0 = ((a0 - 90 - overlap) * Math.PI) / 180;
    const g1 = ((a1 - 90 + overlap) * Math.PI) / 180;
    const col = colour((a0 + a1) / 2);
    out.push({
      d: `M${p(r0, g0)}L${p(r1, g0)}A${r1} ${r1} 0 0 1 ${p(r1, g1)}L${p(r0, g1)}A${r0} ${r0} 0 0 0 ${p(r0, g0)}Z`,
      ...(typeof col === "string" ? { fill: col } : col),
    });
  }
  return out;
}

/**
 * THE ICON'S OPTICS BY DRAWN SIZE, the defaults a lighting's own cut
 * (`Lighting.optics`) overrides: whole at 120 and up, then simplified (a
 * wider band, less glow, more light kept on the far side), and the favicon's
 * own cut at 32 and under, so a small icon is a ring, never a crescent.
 */
export function opticsFor(size: number): Optics {
  if (size <= 32)
    return {
      rDisc: 0.17,
      gap: 0.055,
      band: 0.13,
      glow: 0.55,
      glowBlur: 0.035,
      corona: 0,
      coronaOp: 0,
      bevel: false,
      floor: 0.45,
      n: 64,
    };
  if (size >= 120)
    return {
      rDisc: 0.255,
      gap: 0.021,
      band: 0.034,
      glow: 0.85,
      glowBlur: 0.04,
      corona: 0.075,
      coronaOp: 0.6,
      bevel: true,
      floor: 0.07,
      n: 240,
    };
  return {
    rDisc: 0.255,
    gap: 0.024,
    band: 0.046,
    glow: 0.85,
    glowBlur: 0.045,
    corona: 0.08,
    coronaOp: 0.5,
    bevel: false,
    floor: 0.13,
    n: 120,
  };
}

/** The ring's geometry at a drawn size, in the 1024 box: the puck's radius and the band's two edges. */
export function ringAt(size: number, light: Lighting = EMBER_LIGHT) {
  const o: Optics = { ...opticsFor(size), ...light.optics?.(size) };
  const rD = o.rDisc * 1024;
  const r0 = rD + o.gap * 1024;
  const r1 = r0 + o.band * 1024;
  return { o, rD, r0, r1 };
}
