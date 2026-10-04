"use client";

import { type CSSProperties, useId, useMemo } from "react";

import { fitChroma, hex } from "@/lib/avatar/gradient";
import {
  WORDMARK_ASPECT,
  WORDMARK_PATH,
  WORDMARK_VIEWBOX,
} from "@/lib/brand/wordmark";

import { ICON_LIGHT, LAMPS, type Light, REGISTER } from "./system";

/**
 * AFTERGLOW'S MARKS.
 *
 * ★ THE WORDMARK IS WILL'S v1, UNTOUCHED: his path from the one home
 * (`src/lib/brand/wordmark.ts`), never retyped. It is the one mark that never
 * glows: ink on paper, paper in the room. What it already has is the system's
 * own: the letters run joined (r, t and y share one bar at the x-height, the
 * second r runs into e), and its cuts (the P's foot, the tops of t and l) lean
 * on one 14° angle against a 12° slant.
 *
 * ★ THE ICON IS THE RING: the shutter, a dark disc in a ring of light. The
 * object a guest presses to add a photograph is the brand on a home screen.
 * Its light is the house five, weighted by how Partyreel's own photographs
 * light (`ICON_LIGHT`), lit from the top-left like every surface in the
 * product: warm where the light falls, cooling into its shadow side. Drawn as
 * pure shapes and gradients, with optics per size: the 29 px cut drops the
 * corona and the bevel and thickens the band so it still reads as a ring.
 */

/* ── the wordmark ─────────────────────────────────────────────────────────── */

export function Wordmark({
  height = 22,
  color = "currentColor",
  className,
  style,
  read,
}: {
  /** The drawing's full height, the P's top to the y's tail (px). */
  height?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
  /** Mark it for the deck's caption to read its drawn size. */
  read?: string;
}) {
  return (
    <svg
      role="img"
      aria-label="Partyreel"
      viewBox={WORDMARK_VIEWBOX}
      width={Math.round(height * WORDMARK_ASPECT * 10) / 10}
      height={height}
      fill={color}
      className={className}
      style={{ display: "block", flexShrink: 0, ...style }}
      data-bd-read={read}
    >
      <path d={WORDMARK_PATH} />
    </svg>
  );
}

/** The wordmark's own construction, in its 308 by 64 units (read off the path). */
export const WORDMARK_GEOMETRY = {
  baseline: 50.79,
  xHeight: 14.22,
  capTop: 2.03,
  descender: 64,
  /** The l's stem: its slant, read off the path (12°). */
  slant: { from: [307.3, 0], to: [299.0, 39.4], deg: 12 },
  /** The three cuts on one angle (14°): the P's foot, the t's top, the l's top. */
  cuts: [
    { from: [0, 50.79], to: [14.04, 47.33] },
    { from: [127.15, 7.42], to: [140.87, 4.03] },
    { from: [293.59, 3.39], to: [307.3, 0] },
  ],
  /** The one bar r, t and y share at the x-height. */
  bar: { x0: 94.85, x1: 187.67, y: 14.22 },
} as const;

/* ── the light, as solid wedges (an SVG has no conic gradient) ────────────── */

type Lab = [number, number, number];
const toLab = (l: number, c: number, h: number): Lab => {
  const r = (h * Math.PI) / 180;
  return [l, c * Math.cos(r), c * Math.sin(r)];
};
const fromLab = ([l, a, b]: Lab) => {
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l, c: Math.hypot(a, b), h };
};
const hueLerp = (a: number, b: number, t: number) => {
  const d = ((b - a + 540) % 360) - 180;
  return (a + d * t + 360) % 360;
};

type Appearance = "room" | "paper" | "tinted";

/** A lamp's colour for the icon: the house five at their hand-tuned registers. */
function lampLch(h: number, appearance: Appearance) {
  const house = LAMPS.find((x) => Math.abs(x.h - h) < 0.5);
  let l = house?.l ?? REGISTER.room.l;
  let c = house?.c ?? REGISTER.room.c;
  if (appearance === "paper") {
    l = Math.min(0.9, l + 0.06);
    c = c * 0.92;
  }
  if (appearance === "tinted") c = 0;
  return { l, c, h };
}

/** The tile each appearance mixes its shadow side toward. */
const TILE_MIX: Record<Appearance, Lab> = {
  room: toLab(0.16, 0.004, 286),
  paper: toLab(0.95, 0.003, 286),
  tinted: toLab(0.16, 0, 286),
};

/**
 * The colour of the ring at one angle (CSS conic degrees: 0 at the top,
 * clockwise): its lamps at the centres of their arcs, smoothly interpolated,
 * then dimmed toward the tile away from the light at the top-left.
 */
function ringColour(
  deg: number,
  light: Light,
  from: number,
  appearance: Appearance,
  floor: number,
): string {
  const total = light.reduce((s, x) => s + x.w, 0);
  const centres: number[] = [];
  let acc = 0;
  for (const x of light) {
    const a = (x.w / total) * 360;
    centres.push(acc + a / 2);
    acc += a;
  }
  const n = light.length;
  const am = (((deg - from) % 360) + 360) % 360;
  let i = n - 1;
  for (let k = 0; k < n; k++) if (am >= centres[k]) i = k;
  let a: number;
  let b: number;
  let t: number;
  if (am < centres[0]) {
    a = n - 1;
    b = 0;
    t = (am + 360 - centres[n - 1]) / (centres[0] + 360 - centres[n - 1]);
  } else if (i === n - 1) {
    a = n - 1;
    b = 0;
    t = (am - centres[n - 1]) / (centres[0] + 360 - centres[n - 1]);
  } else {
    a = i;
    b = i + 1;
    t = (am - centres[i]) / (centres[i + 1] - centres[i]);
  }
  const s = t * t * (3 - 2 * t);
  const A = lampLch(light[a].h, appearance);
  const B = lampLch(light[b].h, appearance);
  const lamp = toLab(
    A.l + (B.l - A.l) * s,
    A.c + (B.c - A.c) * s,
    hueLerp(A.h, B.h, s),
  );
  // Lit from the top-left (330°), falling to `floor` on the far side.
  const k =
    floor +
    (1 - floor) * Math.pow((Math.cos(((deg - 330) * Math.PI) / 180) + 1) / 2, 1.4);
  const tile = TILE_MIX[appearance];
  const mixed: Lab = [
    tile[0] + (lamp[0] - tile[0]) * k,
    tile[1] + (lamp[1] - tile[1]) * k,
    tile[2] + (lamp[2] - tile[2]) * k,
  ];
  return hex(fitChroma(fromLab(mixed)));
}

/** An annulus cut into `n` solid wedges, each its own colour. */
function wedges(
  cx: number,
  r0: number,
  r1: number,
  n: number,
  colour: (deg: number) => string,
) {
  const out: { d: string; fill: string }[] = [];
  const p = (r: number, g: number) =>
    `${(cx + r * Math.cos(g)).toFixed(1)},${(cx + r * Math.sin(g)).toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const a0 = (i * 360) / n;
    const a1 = ((i + 1) * 360) / n;
    // A hair of overlap, so no seam shows between two opaque wedges.
    const g0 = ((a0 - 90 - 0.35) * Math.PI) / 180;
    const g1 = ((a1 - 90 + 0.35) * Math.PI) / 180;
    out.push({
      d: `M${p(r0, g0)}L${p(r1, g0)}A${r1} ${r1} 0 0 1 ${p(r1, g1)}L${p(r0, g1)}A${r0} ${r0} 0 0 0 ${p(r0, g0)}Z`,
      fill: colour((a0 + a1) / 2),
    });
  }
  return out;
}

/* ── the icon ─────────────────────────────────────────────────────────────── */

/** The iOS-style continuous corner: a superellipse (n = 5) in a 1024 box. */
const SQUIRCLE = (() => {
  const S = 1024;
  const r = S / 2;
  const pts: string[] = [];
  for (let i = 0; i < 360; i += 1.5) {
    const t = (i * Math.PI) / 180;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const x = r + r * Math.sign(c) * Math.pow(Math.abs(c), 2 / 5);
    const y = r + r * Math.sign(s) * Math.pow(Math.abs(s), 2 / 5);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M${pts.join("L")}Z`;
})();

type Optics = {
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

/** The icon's optics by drawn size: full at 120 and up, then simplified. */
export function iconOptics(size: number): Optics & { cut: string } {
  if (size >= 120)
    return {
      cut: "full",
      rDisc: 0.255,
      gap: 0.021,
      band: 0.034,
      glow: 0.85,
      glowBlur: 0.04,
      corona: 0.075,
      coronaOp: 0.6,
      bevel: true,
      floor: 0.42,
      n: 240,
    };
  if (size >= 48)
    return {
      cut: "mid",
      rDisc: 0.255,
      gap: 0.024,
      band: 0.046,
      glow: 0.85,
      glowBlur: 0.045,
      corona: 0.08,
      coronaOp: 0.5,
      bevel: false,
      floor: 0.5,
      n: 120,
    };
  return {
    cut: "small",
    rDisc: 0.24,
    gap: 0.032,
    band: 0.068,
    glow: 0.75,
    glowBlur: 0.05,
    corona: 0,
    coronaOp: 0,
    bevel: false,
    floor: 0.6,
    n: 90,
  };
}

const TILE: Record<Appearance, [string, string]> = {
  room: ["#1b1b20", "#0b0b0d"],
  paper: ["#fafafa", "#e9e9ec"],
  tinted: ["#1a1a1a", "#0a0a0a"],
};
const DISC: Record<Appearance, [string, string]> = {
  room: ["#1f1f24", "#060607"],
  paper: ["#2e2e33", "#0c0c0e"],
  tinted: ["#1e1e1e", "#060606"],
};

/** Where the ring's first lamp starts, so amber sits under the light. */
const ICON_FROM = 290;

/**
 * THE APP ICON, at any size, in three appearances: `room` (the icon),
 * `tinted` (the system's monochrome cut, light as luminance only) and `paper`
 * (for a light print). `optics` overrides the size's own cut, for a slide that
 * shows a small cut enlarged.
 */
export function AppIcon({
  size = 180,
  appearance = "room",
  light = ICON_LIGHT,
  optics,
  className,
  style,
  read,
}: {
  size?: number;
  appearance?: Appearance;
  light?: Light;
  optics?: number;
  className?: string;
  style?: CSSProperties;
  read?: string;
}) {
  const raw = useId();
  const id = `ag${raw.replace(/[^a-zA-Z0-9]/g, "")}`;
  const o = iconOptics(optics ?? size);
  const art = useMemo(() => {
    const S = 1024;
    const c = S / 2;
    const rD = o.rDisc * S;
    const r0 = rD + o.gap * S;
    const r1 = r0 + o.band * S;
    const sharp = (deg: number) =>
      ringColour(deg, light, ICON_FROM, appearance, o.floor);
    const soft = (deg: number) =>
      ringColour(deg, light, ICON_FROM, appearance, o.floor * 0.6);
    return {
      rD,
      corona: o.coronaOp
        ? wedges(c, rD, r1 + o.band * S * 4, 48, soft)
        : [],
      glow: wedges(c, r0, r1 + o.band * S * 0.5, 64, soft),
      ring: wedges(c, r0, r1, o.n, sharp),
    };
  }, [o.rDisc, o.gap, o.band, o.n, o.floor, o.coronaOp, light, appearance]);
  const [t0, t1] = TILE[appearance];
  const [d0, d1] = DISC[appearance];
  return (
    <svg
      role="img"
      aria-label="Partyreel"
      viewBox="0 0 1024 1024"
      width={size}
      height={size}
      className={className}
      style={{ display: "block", flexShrink: 0, ...style }}
      data-bd-read={read}
    >
      <defs>
        <clipPath id={`${id}c`}>
          <path d={SQUIRCLE} />
        </clipPath>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={t0} />
          <stop offset="1" stopColor={t1} />
        </linearGradient>
        <radialGradient id={`${id}d`} cx="0.42" cy="0.22" r="0.95">
          <stop offset="0" stopColor={d0} />
          <stop offset="0.7" stopColor={d1} />
        </radialGradient>
        <filter id={`${id}g`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={o.glowBlur * 1024} />
        </filter>
        <filter id={`${id}k`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={o.corona * 1024} />
        </filter>
        <linearGradient id={`${id}v`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.4" />
          <stop offset="0.3" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${id}c)`}>
        <rect width="1024" height="1024" fill={`url(#${id}t)`} />
        {art.corona.length ? (
          <g filter={`url(#${id}k)`} opacity={o.coronaOp}>
            {art.corona.map((w, i) => (
              <path key={i} d={w.d} fill={w.fill} />
            ))}
          </g>
        ) : null}
        <g filter={`url(#${id}g)`} opacity={o.glow}>
          {art.glow.map((w, i) => (
            <path key={i} d={w.d} fill={w.fill} />
          ))}
        </g>
        {art.ring.map((w, i) => (
          <path key={i} d={w.d} fill={w.fill} />
        ))}
        <circle cx="512" cy="512" r={art.rD} fill={`url(#${id}d)`} />
        {o.bevel ? (
          <circle
            cx="512"
            cy="512"
            r={art.rD - 2}
            fill="none"
            stroke={`url(#${id}v)`}
            strokeWidth="4"
          />
        ) : null}
      </g>
    </svg>
  );
}

/* ── the symbol: the Ring with no tile ────────────────────────────────────── */

/**
 * THE RING AS A SYMBOL, standing on a page's own ground (the lockup, a page's
 * foot): the same disc and light with no tile. `size` is the ring's outer
 * diameter; the glow spills past it into the margin the box keeps for it.
 */
export function RingMark({
  size = 64,
  ground = "room",
  light = ICON_LIGHT,
  className,
  style,
}: {
  size?: number;
  ground?: "room" | "paper";
  light?: Light;
  className?: string;
  style?: CSSProperties;
}) {
  const raw = useId();
  const id = `agr${raw.replace(/[^a-zA-Z0-9]/g, "")}`;
  const appearance: Appearance = ground === "paper" ? "paper" : "room";
  const small = size < 40;
  const art = useMemo(() => {
    const c = 512;
    const r1 = 320;
    const band = small ? 58 : 36;
    const gap = small ? 26 : 22;
    const r0 = r1 - band;
    const rD = r0 - gap;
    const sharp = (deg: number) =>
      ringColour(deg, light, ICON_FROM, appearance, small ? 0.6 : 0.42);
    const soft = (deg: number) =>
      ringColour(deg, light, ICON_FROM, appearance, 0.3);
    return {
      rD,
      glow: wedges(c, r0 - 10, r1 + 26, 64, soft),
      ring: wedges(c, r0, r1, small ? 90 : 200, sharp),
    };
  }, [small, light, appearance]);
  const box = size * 1.6;
  // On a page's own ground the disc must read as a face, not a hole: a step
  // lighter than the room, lit along its top edge (a hole in a ring of light
  // is a letter O at small sizes).
  const [d0, d1] = ground === "paper" ? DISC.paper : ["#2c2c32", "#0f0f12"];
  return (
    <svg
      aria-hidden
      viewBox="0 0 1024 1024"
      width={box}
      height={box}
      className={className}
      style={{
        display: "block",
        flexShrink: 0,
        margin: -size * 0.3,
        overflow: "visible",
        ...style,
      }}
    >
      <defs>
        <radialGradient id={`${id}d`} cx="0.42" cy="0.22" r="0.95">
          <stop offset="0" stopColor={d0} />
          <stop offset="0.7" stopColor={d1} />
        </radialGradient>
        <filter id={`${id}g`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={small ? 34 : 44} />
        </filter>
        <linearGradient id={`${id}v`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="0.3" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g
        filter={`url(#${id}g)`}
        opacity={ground === "paper" ? 0.7 : 0.85}
      >
        {art.glow.map((w, i) => (
          <path key={i} d={w.d} fill={w.fill} />
        ))}
      </g>
      {art.ring.map((w, i) => (
        <path key={i} d={w.d} fill={w.fill} />
      ))}
      <circle cx="512" cy="512" r={art.rD} fill={`url(#${id}d)`} />
      <circle
        cx="512"
        cy="512"
        r={art.rD - 4}
        fill="none"
        stroke={`url(#${id}v)`}
        strokeWidth={small ? 14 : 8}
      />
    </svg>
  );
}

/* ── the lockup ───────────────────────────────────────────────────────────── */

/**
 * THE LOCKUP: the Ring and the wordmark on one line, the symbol's centre on
 * the wordmark's x-height band, a gap of a third of the wordmark's height.
 * The wordmark takes the ground's ink; the light stays the symbol's.
 */
export function Lockup({
  height = 40,
  ground = "room",
  className,
  style,
  read,
}: {
  /** The wordmark's height (px); the symbol and the gap follow it. */
  height?: number;
  ground?: "room" | "paper";
  className?: string;
  style?: CSSProperties;
  read?: string;
}) {
  const ring = Math.round(height * 0.98);
  return (
    <span
      className={className}
      data-bd-read={read}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: Math.round(height * 0.36),
        ...style,
      }}
    >
      <RingMark size={ring} ground={ground} />
      <Wordmark
        height={height}
        color={ground === "paper" ? "#141416" : "#f4f4f5"}
      />
    </span>
  );
}
