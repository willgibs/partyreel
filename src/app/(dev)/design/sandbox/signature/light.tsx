"use client";

import type { CSSProperties, ReactNode } from "react";

import { fitChroma } from "@/lib/avatar/gradient";
import { cn } from "@/lib/utils";

import {
  INTENSITY,
  type Lamp,
  type Light,
  SAMPLED,
  type StillId,
} from "./fixtures";

/**
 * APERTURE'S LIGHT, AS THIS BOARD PLACES IT: the light's colour from its
 * sources, the Seam (where production's own is not the one drawn: the door's,
 * the camera's) and the Ring's puck on paper, drawn beside production's
 * surfaces. The hub's Seam and the guest cover's are production's own
 * (`hub.tsx`, `cover-light.tsx`); the Blooms are drawn where they stand
 * (`camera.tsx`, `create.tsx`).
 *
 * ★ RETYPED FROM BRAND R2'S DECK, NEVER IMPORTED (`brand/afterglow/system.tsx`
 * and `brand/aperture/light.tsx`): a board's folder is deleted the day it
 * retires, and the brand board will retire before this one is wired. The
 * registers, the yellow lift, the olive guard and the three-ellipse pool are
 * its numbers, kept, so the light here is the light Will picked.
 *
 * ★ A LIGHT IS HANDED A SOURCE, NEVER A COLOUR (the sourcing order: the
 * photographs, then the event's seed, then the house ember), and draws in a
 * register, so a Seam's glow is brighter than a Ring's and a source line is
 * the edge itself, lit.
 *
 * ★ STILL UNTIL SOMETHING HAPPENS: nothing here animates by itself. A form
 * takes its strength as a number (`strength`, `--sg-lift`), so a held beat is
 * a light at that instant (`signature.css`).
 */

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/* ── colour ───────────────────────────────────────────────────────────── */

/** The room's registers: light born bright at its source (brand r2's, kept). */
const REGISTER = {
  /** The Ring and the Bloom. */
  room: { l: 0.72, lift: 0.09, c: 0.15, boost: 1 },
  /** The Seam's glow. */
  seam: { l: 0.82, lift: 0.07, c: 0.15, boost: 1.05 },
  /** The Seam's source line: the edge itself, lit. */
  line: { l: 0.92, lift: 0.02, c: 0.13, boost: 1 },
} as const;
export type Register = keyof typeof REGISTER;

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

/** One lamp's colour in a register, fitted into the display's gamut. */
export function lampColor(lamp: Lamp, register: Register): string {
  const r = REGISTER[register];
  const h = unOlive(lamp.h);
  const l = Math.min(0.95, r.l + r.lift * yellowness(h) + (lamp.dl ?? 0));
  const own = lamp.c === undefined ? r.c : lamp.c * r.boost;
  const c = Math.min(r.c, Math.max(CHROMA_FLOOR, own));
  const fit = fitChroma({ l, c, h });
  return `oklch(${r3(l)} ${r3(fit.c)} ${Math.round(h)})`;
}

/** Each lamp's centre along its light, 0 to 1, by its share. */
function centres(light: Light): number[] {
  const total = light.reduce((s, x) => s + x.w, 0) || 1;
  let acc = 0;
  return light.map((x) => {
    const share = x.w / total;
    const c = acc + share / 2;
    acc += share;
    return c;
  });
}

/** The light round a ring, each lamp at its arc's centre, from the top-left where the one key light sits. */
export function conicOf(light: Light, register: Register = "room", from = 300) {
  const at = centres(light);
  const c = light.map((x) => lampColor(x, register));
  const last = light.length - 1;
  const stops = [
    `${c[last]} ${((at[last] - 1) * 360).toFixed(1)}deg`,
    ...c.map((col, i) => `${col} ${(at[i] * 360).toFixed(1)}deg`),
    `${c[0]} ${((at[0] + 1) * 360).toFixed(1)}deg`,
  ];
  return `conic-gradient(in oklab from ${from}deg, ${stops.join(", ")})`;
}

/** The light as a band along an edge, blended in oklab, in the edge's own direction. */
export function bandOf(light: Light, register: Register, direction = "90deg") {
  const at = centres(light);
  const stops = light.map(
    (x, i) => `${lampColor(x, register)} ${(at[i] * 100).toFixed(1)}%`,
  );
  return `linear-gradient(in oklab ${direction}, ${stops.join(", ")})`;
}

/* ── the sources ──────────────────────────────────────────────────────── */

/** A photograph's light chroma: its own intensity, lifted, inside the room's range. */
const chromaOf = (id: StillId) =>
  Math.min(0.15, Math.max(0.07, INTENSITY[id] * 1.15));

/** One hue read at three depths, the hashvatar's way to be rich. */
function depths(h: number, c?: number): Light {
  return [
    { h, w: 0.34, dl: 0.07, c },
    { h, w: 0.4, c },
    { h: (h + 348) % 360, w: 0.26, dl: -0.07, c },
  ];
}

/** A one-hued light becomes its hue at three depths. */
const withDepth = (light: Light): Light =>
  light.length === 1 ? depths(light[0]!.h, light[0]!.c) : light;

/**
 * A still's ONE light: its heaviest hue, weighted by its intensity, read at
 * three depths (the hashvatar's way to be rich). Where a surface takes a
 * photograph's light as a single light rather than its spread of hues.
 */
export function keyLight(id: StillId): Light {
  const top = [...SAMPLED[id]].sort((a, b) => b.w - a.w)[0]!;
  return depths(top.h, chromaOf(id));
}

/**
 * AN ALBUM'S ONE LIGHT: the heaviest hue across its photographs, each lamp
 * weighted by its share and its photograph's intensity (a laser show outvotes a
 * daylight arch), read at three depths: Aperture's Ring, lit by one key.
 */
export function albumKeyLight(ids: readonly StillId[]): Light {
  const votes: { h: number; w: number }[] = [];
  for (const id of ids)
    for (const lamp of SAMPLED[id]) {
      const w = lamp.w * INTENSITY[id];
      const near = votes.find((v) => hueGap(v.h, lamp.h) < 24);
      if (near) {
        const d = ((lamp.h - near.h + 540) % 360) - 180;
        near.h = (near.h + d * (w / (near.w + w)) + 360) % 360;
        near.w += w;
      } else votes.push({ h: lamp.h, w });
    }
  const best = votes.sort((a, b) => b.w - a.w)[0]!;
  return depths(best.h, Math.max(...ids.map(chromaOf)));
}

/** The light of several photographs at once: each an equal vote, near hues merged, three kept. */
export function albumLight(ids: readonly StillId[]): Light {
  const merged: { h: number; w: number }[] = [];
  for (const id of ids)
    for (const lamp of SAMPLED[id]) {
      const near = merged.find((m) => hueGap(m.h, lamp.h) < 20);
      if (near) {
        const w = near.w + lamp.w;
        const d = ((lamp.h - near.h + 540) % 360) - 180;
        near.h = (near.h + d * (lamp.w / w) + 360) % 360;
        near.w = w;
      } else merged.push({ h: lamp.h, w: lamp.w });
    }
  const c = Math.max(...ids.map(chromaOf));
  const top = merged.sort((a, b) => b.w - a.w).slice(0, 3);
  return withDepth(top.sort((a, b) => a.h - b.h).map((x) => ({ ...x, c })));
}

/** A light's hue angles, the three heaviest, for an atom that takes hues (production's shutter). */
export function huesOf(light: Light): number[] {
  const hs = [...light]
    .sort((a, b) => b.w - a.w)
    .slice(0, 3)
    .map((x) => Math.round(unOlive(x.h)));
  while (hs.length < 3) hs.push(hs[hs.length - 1] ?? 34);
  return hs;
}

/* ── the Seam ─────────────────────────────────────────────────────────── */

export type Edge = "top" | "bottom" | "left" | "right";

/**
 * THE SEAM IN THE ROOM: light born where a photograph ends, a hot core at the
 * edge pooled in three soft ellipses and spent within its reach, with its
 * source line, the edge itself lit. Mount it in a `relative` box at the edge
 * it lights; its box is its reach, so words start past it.
 *
 * ★ QUIETER IS SHORTER, NEVER PALER (brand r2's kit: "a seam drawn faint reads
 * as smoke"): `strength` scales the glow a little, `reach` is the real dial.
 */
export function Seam({
  light,
  edge = "top",
  reach = 120,
  strength = 1,
  className,
  style,
}: {
  light: Light;
  edge?: Edge;
  reach?: number;
  strength?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const across = edge === "left" || edge === "right" ? "180deg" : "90deg";
  const vars: Vars = {
    "--sg-reach": `${reach}px`,
    "--sg-band": bandOf(light, "seam", across),
    "--sg-line": bandOf(light, "line", across),
    "--sg-o": Math.min(1, strength * 0.95),
    ...style,
  };
  return (
    <span
      aria-hidden
      data-sg-seam={edge}
      data-edge={edge}
      className={cn("sg-seam", className)}
      style={vars}
    >
      <span className="sg-seam-light" />
      <span className="sg-seam-line" />
    </span>
  );
}

/* ── the Ring's piece of the room ─────────────────────────────────────── */

/**
 * THE PUCK: on paper the Ring keeps its own dark, a flat disc a little wider
 * than the light round the Add, so the ring glows at the room's strength
 * inside it (brand r2's "the ring carries the dark it needs to glow"). Flat,
 * never a glossy ball. The atom inside wears `dark`, so its face and light
 * are the room's, as a piece of the room is.
 */
export function Puck({
  size,
  children,
}: {
  /** The atom's face, px (the shutter's 64). */
  size: number;
  children: ReactNode;
}) {
  // The ring's band stands 5 px out from the face; the puck is the ring and 6 px more (the creative director's pass:
  // any wider and a flat black disc reads as a tyre, the heaviest thing on the page).
  const out = 11;
  return (
    <span
      data-sg-puck=""
      className="sg-puck-holder dark"
      style={{ width: size, height: size }}
    >
      <span aria-hidden className="sg-puck" style={{ inset: -out }}>
        {/* The envelope's halo, inside the puck's own dark: on paper the light never leaves it. */}
        <span className="sg-puck-halo" />
      </span>
      {children}
    </span>
  );
}
