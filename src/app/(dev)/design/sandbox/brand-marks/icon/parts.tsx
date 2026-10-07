"use client";

import { type ComponentType, useMemo } from "react";

import type { Lighting, Optics } from "./light";
import { EMBER_LIGHT } from "./lights/ember";

/**
 * THE PARTS EVERY TAKE DRAWS WITH (split from `ring.tsx` so a take imports
 * them without importing the registry that imports it): the take's contract,
 * the home screen's corner, the ring's optics and geometry by drawn size, and
 * round one's key-lit ring itself, which a take that keeps the ring draws.
 */

/** What a take draws with: the drawn size whose cut it wears, and a prefix for its defs' ids. */
export type ArtProps = { size: number; uid: string };

/**
 * ONE TAKE ON THE RING: everything it draws over the tile, in the 1024 box, at
 * a drawn size's cut (`Art`), and its bare symbol in one colour with no tile
 * (`Mono`, 1024 box), which is the press kit's mono mark and a reel's
 * watermark over footage.
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

/** The room's tile, top to bottom, and the puck's two stops. */
export const TILE: readonly [string, string] = ["#1b1b20", "#0b0b0d"];
export const DISC: readonly [string, string] = ["#17171b", "#09090b"];

/** The ring's geometry at a drawn size, in the 1024 box: the puck's radius and the band's two edges. */
export function ringAt(size: number, light: Lighting = EMBER_LIGHT) {
  const o: Optics = { ...opticsFor(size), ...light.optics?.(size) };
  const rD = o.rDisc * 1024;
  const r0 = rD + o.gap * 1024;
  const r1 = r0 + o.band * 1024;
  return { o, rD, r0, r1 };
}

/**
 * THE KEY-LIT RING (round one's pick, the working version): the corona and the
 * glow on the key's side, the sharp band lit amber at the top-left and spent
 * to an ember red at the bottom-right, and, unless a take draws its own, the
 * matte puck with its bevel. A take that keeps the ring draws this.
 */
export function EmberRing({
  size,
  uid,
  puck = true,
  light = EMBER_LIGHT,
}: ArtProps & { puck?: boolean; light?: Lighting }) {
  const { o, rD, r0, r1 } = ringAt(size, light);
  const art = useMemo(() => {
    const c = 512;
    const glow = (deg: number) => light.glow(deg, "room");
    return {
      corona: o.coronaOp
        ? wedges(c, rD, r1 + o.band * 1024 * 4, 48, glow)
        : [],
      glow: o.glow ? wedges(c, r0, r1 + o.band * 1024 * 0.5, 64, glow) : [],
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
        (deg) => light.band(deg, "room", o.floor),
        Math.max(0.35, (1024 / size / r1) * (180 / Math.PI)),
      ),
    };
  }, [light, size, o.n, o.floor, o.coronaOp, o.glow, o.band, rD, r0, r1]);
  return (
    <>
      <defs>
        <radialGradient id={`${uid}d`} cx="0.42" cy="0.22" r="0.95">
          <stop offset="0" stopColor={DISC[0]} />
          <stop offset="0.7" stopColor={DISC[1]} />
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
      {puck ? (
        <>
          <circle cx="512" cy="512" r={rD} fill={`url(#${uid}d)`} />
          {o.bevel ? (
            <circle
              cx="512"
              cy="512"
              r={rD - 2}
              fill="none"
              stroke={`url(#${uid}v)`}
              strokeWidth="4"
            />
          ) : null}
        </>
      ) : null}
    </>
  );
}

/** Today's ring as a mark in one colour: the band alone, a touch heavier than the master's so it holds on footage. */
export function EmberMono({ color }: { color: string }) {
  const { r0, r1 } = ringAt(1024);
  return (
    <circle
      cx="512"
      cy="512"
      r={(r0 + r1) / 2}
      fill="none"
      stroke={color}
      strokeWidth={Math.max(r1 - r0, 44)}
    />
  );
}

