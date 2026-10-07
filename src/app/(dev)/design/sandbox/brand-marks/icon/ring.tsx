"use client";

import { type CSSProperties, type ReactNode, useId, useMemo } from "react";

import type { Appearance, Lighting, Optics } from "./light";
import { EMBER_LIGHT } from "./lights/ember";
import { SHUTTER_LIGHT } from "./lights/shutter";
import { WHOLE_LIGHT } from "./lights/whole";

/**
 * THE RING, DRAWN: the icon's machinery, grown from brand r2's Aperture deck
 * (its `afterglow/marks.tsx`, which retires with that board), every number
 * kept unless this board says otherwise.
 *
 * The icon is the shutter: a matte dark puck inside a ring of light on the
 * room's dark tile (a home screen's continuous corner), its light the house
 * ember. The ring is drawn as solid wedges, each asking the option's lighting
 * (`lights/<id>.tsx`) for its colour at its angle, with a hair of overlap so
 * no seam shows; the corona and the glow are the same wedges blurred.
 */

export type IconId = "ember" | "whole" | "shutter";
export type { Appearance };

export const LIGHTS: Record<IconId, Lighting> = {
  ember: EMBER_LIGHT,
  whole: WHOLE_LIGHT,
  shutter: SHUTTER_LIGHT,
};

/**
 * An annulus cut into `n` solid wedges, each its own colour, each reaching
 * `overlap` degrees past its neighbours so no seam shows between two.
 */
function wedges(
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

/** The continuous corner a home screen draws: a superellipse (n = 5) in a 1024 box. */
export const SQUIRCLE = (() => {
  const r = 512;
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

/**
 * THE ICON'S OPTICS BY DRAWN SIZE: whole at 120 and up, then simplified (a
 * wider band, less glow, more light kept on the far side), and the favicon's
 * own cut at 32 and under, so a small icon is a ring, never a crescent.
 */
export function opticsFor(size: number): Optics {
  // THE FAVICON'S CUT (16 and 32 pixels): the band a pixel and more at 16, the
  // gap a whole pixel, the far side lit at nearly half, no corona; the one
  // size where a dim side would read as a bite out of the ring.
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

/** The tile's two stops and the puck's two stops, per appearance. */
const TILE: Record<Appearance, readonly [string, string]> = {
  room: ["#1b1b20", "#0b0b0d"],
  tinted: ["#1a1a1a", "#0a0a0a"],
};
const DISC: Record<Appearance, readonly [string, string]> = {
  room: ["#17171b", "#09090b"],
  tinted: ["#171717", "#090909"],
};

/**
 * THE RING ICON: the tile, the corona and the glow, the sharp band, the matte
 * puck and whatever the lighting draws on its face. `optics` draws one size
 * at another size's cut (a favicon shown enlarged).
 */
export function RingIcon({
  id,
  size = 180,
  appearance = "room",
  optics,
  className,
  style,
  read,
  label = "Partyreel's icon",
}: {
  id: IconId;
  size?: number;
  appearance?: Appearance;
  optics?: number;
  className?: string;
  style?: CSSProperties;
  read?: string;
  label?: string;
}) {
  const raw = useId();
  const uid = `bm${raw.replace(/[^a-zA-Z0-9]/g, "")}`;
  const light = LIGHTS[id];
  const at = optics ?? size;
  const o: Optics = { ...opticsFor(at), ...light.optics?.(at) };
  const art = useMemo(() => {
    const S = 1024;
    const c = S / 2;
    const rD = o.rDisc * S;
    const r0 = rD + o.gap * S;
    const r1 = r0 + o.band * S;
    const glow = (deg: number) => light.glow(deg, appearance);
    return {
      rD,
      corona: o.coronaOp ? wedges(c, rD, r1 + o.band * S * 4, 48, glow) : [],
      glow: o.glow ? wedges(c, r0, r1 + o.band * S * 0.5, 64, glow) : [],
      // ★ THE BAND'S SEAMS OVERLAP BY A PIXEL AT THE DRAWN SIZE: a fixed 0.35
      // degrees is a hundredth of a pixel at 16 to 32 px, so the tile showed
      // through every seam as faint spokes and grain in a tab. The band is
      // opaque, so an overlap costs nothing; the glow's wedges are translucent
      // and blurred, and keep the hair.
      ring: wedges(
        c,
        r0,
        r1,
        o.n,
        (deg) => light.band(deg, appearance, o.floor),
        Math.max(0.35, (1024 / size / r1) * (180 / Math.PI)),
      ),
    };
  }, [
    light,
    appearance,
    size,
    o.rDisc,
    o.gap,
    o.band,
    o.n,
    o.floor,
    o.coronaOp,
    o.glow,
  ]);
  const [t0, t1] = (light.tile ?? TILE)[appearance];
  const [d0, d1] = (light.disc ?? DISC)[appearance];
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 1024 1024"
      width={size}
      height={size}
      className={className}
      style={{ display: "block", flexShrink: 0, ...style }}
      data-bm-read={read}
      data-bm-says={read ? `${size}×${size}` : undefined}
    >
      <defs>
        <clipPath id={`${uid}c`}>
          <path d={SQUIRCLE} />
        </clipPath>
        <linearGradient id={`${uid}t`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={t0} />
          <stop offset="1" stopColor={t1} />
        </linearGradient>
        <radialGradient id={`${uid}d`} cx="0.42" cy="0.22" r="0.95">
          <stop offset="0" stopColor={d0} />
          <stop offset="0.7" stopColor={d1} />
        </radialGradient>
        <filter id={`${uid}g`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={o.glowBlur * 1024} />
        </filter>
        <filter id={`${uid}k`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={o.corona * 1024} />
        </filter>
        <linearGradient id={`${uid}v`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.14" />
          <stop offset="0.3" stopColor="#fff" stopOpacity="0.03" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${uid}c)`}>
        <rect width="1024" height="1024" fill={`url(#${uid}t)`} />
        {art.corona.length ? (
          <g filter={`url(#${uid}k)`} opacity={o.coronaOp}>
            {art.corona.map((w, i) => (
              <path key={i} d={w.d} fill={w.fill} fillOpacity={w.opacity} />
            ))}
          </g>
        ) : null}
        {art.glow.length ? (
          <g filter={`url(#${uid}g)`} opacity={o.glow}>
            {art.glow.map((w, i) => (
              <path key={i} d={w.d} fill={w.fill} fillOpacity={w.opacity} />
            ))}
          </g>
        ) : null}
        {art.ring.map((w, i) => (
          <path key={i} d={w.d} fill={w.fill} fillOpacity={w.opacity} />
        ))}
        <circle cx="512" cy="512" r={art.rD} fill={`url(#${uid}d)`} />
        {o.bevel ? (
          <circle
            cx="512"
            cy="512"
            r={art.rD - 2}
            fill="none"
            stroke={`url(#${uid}v)`}
            strokeWidth="4"
          />
        ) : null}
        {light.face?.(at, appearance)}
      </g>
    </svg>
  );
}

/** A piece of the room on paper: the icon keeps its dark tile, on a print's lift. */
export function OnPaper({
  size,
  children,
}: {
  size: number;
  children: ReactNode;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        filter: `drop-shadow(0 ${Math.max(1, size * 0.012)}px ${Math.max(2, size * 0.03)}px rgb(0 0 0 / 0.22))`,
      }}
    >
      {children}
    </span>
  );
}
