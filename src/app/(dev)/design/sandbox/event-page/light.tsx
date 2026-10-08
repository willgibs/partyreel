"use client";

import type { CSSProperties, ReactNode } from "react";

import { fitChroma, orbFor } from "@/lib/avatar/gradient";
import { cn } from "@/lib/utils";

import {
  INTENSITY,
  type Lamp,
  type Light,
  SAMPLED,
  type StillId,
} from "./fixtures";

/**
 * APERTURE'S LIGHT, AS THIS BOARD DRAWS IT: a light's colour from its source
 * (the photographs, then the event's seed, then the house ember), and the
 * forms the page wears it in: the head's glow (born where each whole design
 * says: the album's edge, the page's top, a corner), the Seam, the Ring's puck
 * on paper.
 *
 * ★ CARRIED FROM SIGNATURE'S `light.tsx`, NEVER IMPORTED (signature retires
 * into this board): the registers, the yellow lift, the olive guard, the
 * chroma floor and the three-ellipse pool are brand r2's numbers, kept, so the
 * light here is the light Will picked. The glow's field register is this
 * board's: a light a head's words stand in is dimmer than a Seam's core.
 *
 * ★ A LIGHT IS HANDED A SOURCE, NEVER A COLOUR, and nothing here animates by
 * itself: still until something happens.
 */

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/* ── colour ───────────────────────────────────────────────────────────── */

/** The registers: light born bright at its source (brand r2's), and the field a head's words stand in (this board's). */
const REGISTER = {
  /** The Ring and the Bloom. */
  room: { l: 0.72, lift: 0.09, c: 0.15, boost: 1 },
  /** The Seam's glow. */
  seam: { l: 0.82, lift: 0.07, c: 0.15, boost: 1.05 },
  /** The Seam's source line: the edge itself, lit. */
  line: { l: 0.92, lift: 0.02, c: 0.13, boost: 1 },
  /**
   * A head's field: light the words stand in, so dimmer at its core than a
   * Seam's; its yellows lifted further, since a warm light spent over the
   * room's black falls through brown long before it reaches nothing.
   */
  field: { l: 0.64, lift: 0.12, c: 0.135, boost: 1 },
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
export function lampColor(lamp: Lamp, register: Register = "room"): string {
  const r = REGISTER[register];
  const h = unOlive(lamp.h);
  const l = Math.min(0.95, r.l + r.lift * yellowness(h) + (lamp.dl ?? 0));
  const own = lamp.c === undefined ? r.c : lamp.c * r.boost;
  const c = Math.min(r.c, Math.max(CHROMA_FLOOR, own));
  const fit = fitChroma({ l, c, h });
  return `oklch(${r3(l)} ${r3(fit.c)} ${Math.round(h)})`;
}

/** A colour at a share of itself, the rest transparent, blended in oklab (never through a grey). */
export const alpha = (color: string, pct: number) =>
  `color-mix(in oklab, ${color} ${pct}%, transparent)`;

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
    `${c[last]} ${((at[last]! - 1) * 360).toFixed(1)}deg`,
    ...c.map((col, i) => `${col} ${(at[i]! * 360).toFixed(1)}deg`),
    `${c[0]} ${((at[0]! + 1) * 360).toFixed(1)}deg`,
  ];
  return `conic-gradient(in oklab from ${from}deg, ${stops.join(", ")})`;
}

/** The light as a band along an edge, blended in oklab, in the edge's own direction. */
export function bandOf(light: Light, register: Register, direction = "90deg") {
  const at = centres(light);
  const stops = light.map(
    (x, i) => `${lampColor(x, register)} ${(at[i]! * 100).toFixed(1)}%`,
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

/** A still's ONE light: its heaviest hue at its own intensity, read at three depths. */
export function keyLight(id: StillId): Light {
  const top = [...SAMPLED[id]].sort((a, b) => b.w - a.w)[0]!;
  return depths(top.h, chromaOf(id));
}

/** A still's heaviest hue, as one lamp (what a tile gives off at its own place). */
export function keyLamp(id: StillId): Lamp {
  const top = [...SAMPLED[id]].sort((a, b) => b.w - a.w)[0]!;
  return { h: top.h, w: 1, c: chromaOf(id) };
}

/**
 * AN ALBUM'S ONE LIGHT: the heaviest hue across its photographs, each lamp
 * weighted by its share and its photograph's intensity, read at three depths:
 * Aperture's Ring, lit by one key.
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

/**
 * AN ALBUM'S THREE LIGHTS, AS A HEAD WEARS THEM: every hue its photographs give
 * off, weighted by its share and its photograph's intensity (a laser show
 * outvotes a daylight arch, as it does in the room), near hues merged, the
 * three heaviest kept with their own weight. Where `albumLight` gives every
 * photograph an equal vote, this is what the eye takes in from the album.
 */
export function albumVotes(ids: readonly StillId[]): Light {
  const votes: { h: number; w: number; c: number }[] = [];
  for (const id of ids)
    for (const lamp of SAMPLED[id]) {
      const w = lamp.w * INTENSITY[id];
      const near = votes.find((v) => hueGap(v.h, lamp.h) < 24);
      if (near) {
        const d = ((lamp.h - near.h + 540) % 360) - 180;
        near.h = (near.h + d * (w / (near.w + w)) + 360) % 360;
        near.w += w;
        near.c = Math.max(near.c, chromaOf(id));
      } else votes.push({ h: lamp.h, w, c: chromaOf(id) });
    }
  const top = votes.sort((a, b) => b.w - a.w).slice(0, 3);
  const sum = top.reduce((n, v) => n + v.w, 0) || 1;
  return top.map((v) => ({ h: v.h, w: v.w / sum, c: v.c }));
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

/**
 * THE EVENT'S SEED AS LIGHT (Aperture's second source, before any
 * photograph): production's own seeded hue for the event (`orbFor`, the
 * avatar's generator), read at three depths. Never animated.
 */
export function seedLight(seed: string): Light {
  const orb = orbFor(seed, "wheel");
  return depths(orb.hue, 0.12);
}

/**
 * A PRIVATE ALBUM'S CARD LIGHT, FROM ITS LINK ALONE (the carried
 * `private-light`): the card is the same for whoever asks and the edge serves
 * an hour's copy, so it may read nothing but its own address; a light seeded
 * by the link's token needs no lookup, so a private album's card and a missing
 * one's are drawn alike, and neither says an album stands behind the link.
 */
export function linkLight(token: string): Light {
  return seedLight(`link:${token}`);
}

/** The house ember: Aperture's last source, amber to coral, where there is neither. */
export const HOUSE_EMBER: Light = [
  { h: 58, w: 0.4, dl: 0.04 },
  { h: 38, w: 0.35 },
  { h: 22, w: 0.25, dl: -0.06 },
];

/** A light's hue angles, the three heaviest, for an atom that takes hues (production's shutter). */
export function huesOf(light: Light): number[] {
  const hs = [...light]
    .sort((a, b) => b.w - a.w)
    .slice(0, 3)
    .map((x) => Math.round(unOlive(x.h)));
  while (hs.length < 3) hs.push(hs[hs.length - 1] ?? 34);
  return hs;
}

/* ── the head's glow ──────────────────────────────────────────────────── */

/**
 * WHERE A HEAD'S GLOW IS BORN, each whole design's own answer:
 *  - `rise`: at the album's edge, each photograph of its first row lighting
 *    the room above it in its own colour (the hub's Seam turned to rise);
 *  - `sky`: at the page's top, edge to edge, the album's light falling;
 *  - `corner`: one key light from the head's top-right corner, raking across.
 * A glow has no point of focus: a line or an edge for a source, never a lamp.
 */
export type GlowSource = "rise" | "sky" | "corner";

/** One pool of a glow: where its core is (percent of the field), how far it reaches, its colour. */
export type Pool = {
  readonly x: number;
  readonly y: number;
  /** Its reach across and up, percent of the field. */
  readonly rx: number;
  readonly ry: number;
  readonly color: string;
  /** Its core's strength, 0 to 100. */
  readonly core: number;
};

/**
 * A pool as a background layer: a hot core, a long soft fall, nothing at its
 * edge. The fall is eased (a light's own inverse square, softened), so no
 * ring of a stop ever shows where the slope changes.
 */
export const poolLayer = (p: Pool) =>
  `radial-gradient(ellipse ${p.rx}% ${p.ry}% at ${p.x}% ${p.y}%, ${alpha(p.color, p.core)} 0%, ${alpha(p.color, p.core * 0.72)} 12%, ${alpha(p.color, p.core * 0.44)} 28%, ${alpha(p.color, p.core * 0.22)} 46%, ${alpha(p.color, p.core * 0.09)} 66%, ${alpha(p.color, p.core * 0.025)} 84%, transparent 100%)`;

/** Where a field's pools are born along its box: an edge, or a corner. */
export type Origin = "top" | "bottom" | "top-right" | "top-left";

/**
 * A LIGHT'S POOLS FROM AN ORIGIN: three soft pools along an edge (its lamps
 * spread across, heaviest in the middle), or one key from a corner with its
 * other two depths in the falloff. `reach` is how far into the field it goes
 * (percent of the field's height); quieter is shorter, never paler.
 */
export function poolsFrom(
  light: Light,
  origin: Origin,
  { core = 56, reach = 92 }: { core?: number; reach?: number } = {},
): Pool[] {
  const lamps = light.slice(0, 3);
  if (origin === "top" || origin === "bottom") {
    const y = origin === "top" ? 0 : 100;
    const at = [18, 50, 82];
    // The heaviest lamp stands in the middle, the others either side.
    const order = [...lamps].sort((a, b) => b.w - a.w);
    const placed = [order[1] ?? order[0]!, order[0]!, order[2] ?? order[0]!];
    return placed.map((lamp, i) => ({
      x: at[i]!,
      y,
      rx: i === 1 ? 52 : 44,
      ry: reach,
      color: lampColor(lamp, "field"),
      core: i === 1 ? core : core * 0.82,
    }));
  }
  const x = origin === "top-right" ? 100 : 0;
  const inward = origin === "top-right" ? -1 : 1;
  // The heaviest lamp is the key; the others live in its falloff.
  const byWeight = [...lamps].sort((a, b) => b.w - a.w);
  const [key, second, third] = [
    byWeight[0]!,
    byWeight[1] ?? byWeight[0]!,
    byWeight[2] ?? byWeight[0]!,
  ];
  return [
    {
      x,
      y: 0,
      rx: 88,
      ry: reach * 1.45,
      color: lampColor(key, "field"),
      core,
    },
    {
      x: x + inward * 30,
      y: 0,
      rx: 52,
      ry: reach,
      color: lampColor(second, "field"),
      core: core * 0.5,
    },
    {
      x,
      y: 48,
      rx: 34,
      ry: reach * 0.7,
      color: lampColor(third, "field"),
      core: core * 0.36,
    },
  ];
}

/**
 * THE GLOW, A FIELD OF POOLS: drawn absolutely in a `relative` box (its box
 * is the field), under the words. The room's own ground shows round it; on
 * paper the caller stands it inside a piece of the room.
 */
export function GlowField({
  pools,
  className,
  style,
  grain = true,
}: {
  pools: readonly Pool[];
  className?: string;
  style?: CSSProperties;
  /** A breath of grain over the field, so a long dark fall never bands. */
  grain?: boolean;
}) {
  // ★ THE GRAIN LIVES ONLY WHERE THE LIGHT IS (sky's measure, 2026-10-07): an unmasked grain lifted the whole field box
  // and ended in a hard line at the room's foot, so it is masked by the pools' own fall, the same layers in black.
  const mask = pools
    .map((p) => poolLayer({ ...p, color: "#000", core: 100 }))
    .join(", ");
  return (
    <span
      aria-hidden
      data-ep-glow=""
      className={cn("ep-glow", className)}
      style={{ background: pools.map(poolLayer).join(", "), ...style }}
    >
      {grain && pools.length > 0 ? (
        <span
          className="ep-grain"
          style={{ WebkitMaskImage: mask, maskImage: mask }}
        />
      ) : null}
    </span>
  );
}

/* ── the Seam ─────────────────────────────────────────────────────────── */

export type Edge = "top" | "bottom" | "left" | "right";

/**
 * THE SEAM IN THE ROOM: light born where a photograph ends, a hot core at the
 * edge pooled in three soft ellipses and spent within its reach, with its
 * source line, the edge itself lit. Mount it in a `relative` box at the edge
 * it lights. ★ QUIETER IS SHORTER, NEVER PALER: `reach` is the real dial.
 */
export function Seam({
  light,
  edge = "top",
  reach = 120,
  strength = 1,
  line = true,
  className,
  style,
}: {
  light: Light;
  edge?: Edge;
  reach?: number;
  strength?: number;
  /** The source line, the edge itself lit. */
  line?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const across = edge === "left" || edge === "right" ? "180deg" : "90deg";
  const vars: Vars = {
    "--ep-reach": `${reach}px`,
    "--ep-band": bandOf(light, "seam", across),
    "--ep-line": bandOf(light, "line", across),
    "--ep-o": Math.min(1, strength * 0.95),
    ...style,
  };
  return (
    <span
      aria-hidden
      data-ep-seam={edge}
      data-edge={edge}
      className={cn("ep-seam", className)}
      style={vars}
    >
      <span className="ep-seam-light" />
      {line ? <span className="ep-seam-line" /> : null}
    </span>
  );
}

/* ── the Ring's piece of the room ─────────────────────────────────────── */

/**
 * THE PUCK: on paper the Ring keeps its own dark, a flat disc a little wider
 * than the light round the Add, so the ring glows at the room's strength
 * inside it. Flat, never a glossy ball; the atom inside wears `dark`.
 */
export function Puck({
  size,
  children,
}: {
  size: number;
  children: ReactNode;
}) {
  const out = 11;
  return (
    <span
      data-ep-puck=""
      className="ep-puck-holder dark"
      style={{ width: size, height: size }}
    >
      <span aria-hidden className="ep-puck" style={{ inset: -out }}>
        <span className="ep-puck-halo" />
      </span>
      {children}
    </span>
  );
}
