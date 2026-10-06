"use client";

import { type CSSProperties, type ReactNode, useId, useMemo } from "react";

import { fitChroma, hex } from "@/lib/avatar/gradient";
import {
  WORDMARK_ASPECT,
  WORDMARK_PATH,
  WORDMARK_VIEWBOX,
} from "@/lib/brand/wordmark";

import { DUSK, type Light } from "./system";
import type { Appearance } from "./take";

/**
 * AFTERGLOW'S MARKS, SHARED BY EVERY TAKE.
 *
 * ★ THE WORDMARK IS WILL'S v1, UNTOUCHED (round one's carried call, standing):
 * his path from the one home (`src/lib/brand/wordmark.ts`), never retyped. It
 * is the one mark that never glows: ink on paper, paper in the room.
 *
 * ★ THE ICON IS THE RING: the shutter, a dark disc in a ring of light, lit as
 * an object is by one warm key at the top-left: the house sky (`DUSK`), amber
 * where the light falls, coral and rose as the ring turns away, spent to
 * violet in its shadow. The machinery here draws it at any size with optics per
 * size; each take decides what the icon is on paper (`Take.light.AppIcon`).
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
  slant: { from: [307.3, 0], to: [299.0, 39.4], deg: 12 },
  cuts: [
    { from: [0, 50.79], to: [14.04, 47.33] },
    { from: [127.15, 7.42], to: [140.87, 4.03] },
    { from: [293.59, 3.39], to: [307.3, 0] },
  ],
  bar: { x0: 94.85, x1: 187.67, y: 14.22 },
} as const;

/* ── the light as solid wedges (an SVG has no conic gradient) ─────────────── */

export type Lab = [number, number, number];
export const toLab = (l: number, c: number, h: number): Lab => {
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

/** The tile each appearance mixes its shadow side toward. */
const TILE_MIX: Record<Appearance, Lab> = {
  room: toLab(0.16, 0.004, 286),
  paper: toLab(0.95, 0.003, 286),
  tinted: toLab(0.16, 0, 286),
};

/** Where the key light sits (CSS conic degrees): the top-left. */
export const KEY = 315;

/**
 * THE MARK'S ONE KEY LIGHT: the house sky at one angle round the ring, falling
 * from the key at the top-left to `floor` in the shadow at the bottom-right.
 * `mix` is the tile the shadow side falls toward.
 */
export function keyColour(
  deg: number,
  appearance: Appearance,
  floor: number,
  exponent = 1.7,
  mix?: Lab,
): string {
  const d = Math.abs(((((deg - KEY) % 360) + 540) % 360) - 180);
  const t = d / 180;
  let i = 0;
  while (i < DUSK.length - 2 && t > DUSK[i + 1].t) i++;
  const A = DUSK[i];
  const B = DUSK[i + 1];
  const u = Math.min(1, Math.max(0, (t - A.t) / (B.t - A.t)));
  const s = u * u * (3 - 2 * u);
  const l = A.l + (B.l - A.l) * s;
  let c = A.c + (B.c - A.c) * s;
  if (appearance === "tinted") c = 0;
  const lamp = toLab(l, c, hueLerp(A.h, B.h, s));
  const k =
    floor +
    (1 - floor) * Math.pow((Math.cos((d * Math.PI) / 180) + 1) / 2, exponent);
  const tile = mix ?? TILE_MIX[appearance];
  const mixed: Lab = [
    tile[0] + (lamp[0] - tile[0]) * k,
    tile[1] + (lamp[1] - tile[1]) * k,
    tile[2] + (lamp[2] - tile[2]) * k,
  ];
  return hex(fitChroma(fromLab(mixed)));
}

/**
 * The key light as LIGHT alone, for a glow or a corona: the lamp's own colour
 * with an alpha that falls with the key, so where the light is spent the layer
 * is transparent rather than a grey ring.
 */
export function keyGlow(
  deg: number,
  appearance: Appearance,
  exponent = 3,
): { fill: string; opacity: number } {
  const d = Math.abs(((((deg - KEY) % 360) + 540) % 360) - 180);
  const lit = keyColour(KEY, appearance, 1);
  const hue = keyColour(deg, appearance, 1);
  const k = Math.pow((Math.cos((d * Math.PI) / 180) + 1) / 2, exponent);
  return { fill: d < 90 ? hue : lit, opacity: Math.round(k * 1000) / 1000 };
}

/**
 * The colour of a ring given its own light (an event's) at one angle: its
 * lamps at the centres of their arcs, smoothly interpolated, dimmed toward the
 * tile away from the key.
 */
export function lightColour(
  deg: number,
  light: Light,
  appearance: Appearance,
  floor: number,
  from = 290,
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
  if (n === 1) {
    a = 0;
    b = 0;
    t = 0;
  } else if (am < centres[0]) {
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
  const lc = (h: number, dl = 0) => ({
    l: Math.min(0.9, 0.74 + dl),
    c: appearance === "tinted" ? 0 : 0.15,
    h,
  });
  const A = lc(light[a].h, light[a].dl);
  const B = lc(light[b].h, light[b].dl);
  const lamp = toLab(
    A.l + (B.l - A.l) * s,
    A.c + (B.c - A.c) * s,
    hueLerp(A.h, B.h, s),
  );
  const k =
    floor +
    (1 - floor) *
      Math.pow((Math.cos(((deg - 330) * Math.PI) / 180) + 1) / 2, 1.4);
  const tile = TILE_MIX[appearance];
  const mixed: Lab = [
    tile[0] + (lamp[0] - tile[0]) * k,
    tile[1] + (lamp[1] - tile[1]) * k,
    tile[2] + (lamp[2] - tile[2]) * k,
  ];
  return hex(fitChroma(fromLab(mixed)));
}

/** An annulus cut into `n` solid wedges, each its own colour. */
export function wedges(
  cx: number,
  r0: number,
  r1: number,
  n: number,
  colour: (deg: number) => string | { fill: string; opacity: number },
) {
  const out: { d: string; fill: string; opacity?: number }[] = [];
  const p = (r: number, g: number) =>
    `${(cx + r * Math.cos(g)).toFixed(1)},${(cx + r * Math.sin(g)).toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const a0 = (i * 360) / n;
    const a1 = ((i + 1) * 360) / n;
    // A hair of overlap, so no seam shows between two opaque wedges.
    const g0 = ((a0 - 90 - 0.35) * Math.PI) / 180;
    const g1 = ((a1 - 90 + 0.35) * Math.PI) / 180;
    const c = colour((a0 + a1) / 2);
    out.push({
      d: `M${p(r0, g0)}L${p(r1, g0)}A${r1} ${r1} 0 0 1 ${p(r1, g1)}L${p(r0, g1)}A${r0} ${r0} 0 0 0 ${p(r0, g0)}Z`,
      ...(typeof c === "string" ? { fill: c } : c),
    });
  }
  return out;
}

/** The iOS-style continuous corner: a superellipse (n = 5) in a 1024 box. */
export const SQUIRCLE = (() => {
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

export type Optics = {
  cut: "full" | "mid" | "small";
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
export function iconOptics(size: number): Optics {
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
      floor: 0.07,
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
      floor: 0.13,
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
    floor: 0.3,
    n: 90,
  };
}

/** A tile's two stops and a disc's two stops, per appearance (round one's). */
export const TILE: Record<Appearance, [string, string]> = {
  room: ["#1b1b20", "#0b0b0d"],
  paper: ["#fafafa", "#e9e9ec"],
  tinted: ["#1a1a1a", "#0a0a0a"],
};
export const DISC: Record<Appearance, [string, string]> = {
  room: ["#17171b", "#09090b"],
  paper: ["#26262b", "#101012"],
  tinted: ["#171717", "#090909"],
};

/**
 * THE RING ICON, the shared drawing every take's icon starts from: a tile
 * (squircle), the corona and the glow on the key's side, the sharp band, the
 * matte disc. A take passes `tile` and `disc` to restage it, `under` and
 * `over` to draw on it, `glow` false for a printed form, and `light` for an
 * event's own icon.
 */
export function RingIcon({
  size = 180,
  appearance = "room",
  light,
  optics,
  tile,
  disc,
  glow = true,
  ring,
  under,
  over,
  className,
  style,
  read,
}: {
  size?: number;
  appearance?: Appearance;
  /** An event's own light; absent, the house sky keyed from the top-left. */
  light?: Light;
  optics?: number;
  tile?: [string, string];
  disc?: [string, string];
  /** False draws no corona and no glow: the band alone, as a print. */
  glow?: boolean;
  /** A band colour by angle, replacing the key (a printed ink). */
  ring?: (deg: number) => string;
  /** Drawn on the tile under the ring (in the 1024 box). */
  under?: ReactNode;
  /** Drawn over everything (in the 1024 box). */
  over?: ReactNode;
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
      ring
        ? ring(deg)
        : light
          ? lightColour(deg, light, appearance, Math.max(0.42, o.floor))
          : keyColour(deg, appearance, o.floor);
    const soft = (deg: number) =>
      light
        ? lightColour(deg, light, appearance, Math.max(0.25, o.floor * 0.6))
        : keyGlow(deg, appearance);
    return {
      rD,
      corona:
        glow && o.coronaOp ? wedges(c, rD, r1 + o.band * S * 4, 48, soft) : [],
      glow: glow ? wedges(c, r0, r1 + o.band * S * 0.5, 64, soft) : [],
      ring: wedges(c, r0, r1, o.n, sharp),
    };
  }, [
    o.rDisc,
    o.gap,
    o.band,
    o.n,
    o.floor,
    o.coronaOp,
    light,
    appearance,
    glow,
    ring,
  ]);
  const [t0, t1] = tile ?? TILE[appearance];
  const [d0, d1] = disc ?? DISC[appearance];
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
          <stop offset="0" stopColor="#fff" stopOpacity="0.14" />
          <stop offset="0.3" stopColor="#fff" stopOpacity="0.03" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${id}c)`}>
        <rect width="1024" height="1024" fill={`url(#${id}t)`} />
        {under}
        {art.corona.length ? (
          <g filter={`url(#${id}k)`} opacity={o.coronaOp}>
            {art.corona.map((w, i) => (
              <path key={i} d={w.d} fill={w.fill} fillOpacity={w.opacity} />
            ))}
          </g>
        ) : null}
        {art.glow.length ? (
          <g filter={`url(#${id}g)`} opacity={o.glow}>
            {art.glow.map((w, i) => (
              <path key={i} d={w.d} fill={w.fill} fillOpacity={w.opacity} />
            ))}
          </g>
        ) : null}
        {art.ring.map((w, i) => (
          <path key={i} d={w.d} fill={w.fill} fillOpacity={w.opacity} />
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
        {over}
      </g>
    </svg>
  );
}

/**
 * THE RING AS A SYMBOL with no tile (a lockup, a page's foot): the same disc
 * and keyed light, its glow spilling into the margin the box keeps for it.
 * `size` is the ring's outer diameter; `ring` replaces the band's colour (a
 * printed ink) and `glow` false draws no glow at all.
 */
export function RingSymbol({
  size = 64,
  appearance = "room",
  glow = true,
  ring,
  className,
  style,
}: {
  size?: number;
  appearance?: Appearance;
  glow?: boolean;
  ring?: (deg: number) => string;
  className?: string;
  style?: CSSProperties;
}) {
  const raw = useId();
  const id = `agr${raw.replace(/[^a-zA-Z0-9]/g, "")}`;
  const small = size < 40;
  const art = useMemo(() => {
    const c = 512;
    const r1 = 320;
    const band = small ? 58 : 36;
    const gap = small ? 26 : 22;
    const r0 = r1 - band;
    const rD = r0 - gap;
    return {
      rD,
      glow: wedges(c, r0 - 10, r1 + 26, 64, (deg) => keyGlow(deg, appearance)),
      ring: wedges(c, r0, r1, small ? 90 : 200, (deg) =>
        ring ? ring(deg) : keyColour(deg, appearance, small ? 0.3 : 0.1),
      ),
    };
  }, [small, appearance, ring]);
  const box = size * 1.6;
  const [d0, d1] =
    appearance === "paper" ? DISC.paper : ["#232328", "#0d0d10"];
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
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="0.3" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {glow ? (
        <g
          filter={`url(#${id}g)`}
          opacity={appearance === "paper" ? 0.7 : 0.85}
        >
          {art.glow.map((w, i) => (
            <path key={i} d={w.d} fill={w.fill} fillOpacity={w.opacity} />
          ))}
        </g>
      ) : null}
      {art.ring.map((w, i) => (
        <path key={i} d={w.d} fill={w.fill} fillOpacity={w.opacity} />
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
