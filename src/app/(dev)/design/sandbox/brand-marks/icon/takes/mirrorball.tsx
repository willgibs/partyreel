"use client";

import { useMemo } from "react";

import { emberAt, KEY, toHex, toLab } from "../light";
import { EMBER_LIGHT } from "../lights/ember";
import { type ArtProps, EmberRing, ringAt, type Take } from "../parts";

/**
 * THE MIRROR BALL: the ring holds the party's own object. The shutter's puck
 * becomes a mirror ball, its facets dark until they catch the house ember, and
 * a ball reflects the ring round it as a ring of lit facets inside itself (a
 * facet 45 degrees off the view looks straight out sideways, at the ring), so
 * the ring holds a ring: amber where the key falls at the top-left, spent to
 * an ember red at the bottom-right, the one hot glint where the lamp itself
 * is caught.
 */

type Facet = { d: string; fill: string };

/** A seeded stream, so the same facets are dark at every render. */
function stream(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const norm = (v: [number, number, number]) => {
  const l = Math.hypot(...v);
  return v.map((x) => x / l) as [number, number, number];
};

/** The lamp, up and to the left of the viewer. */
const LAMP = norm([-0.55, 0.62, 0.56]);

function facets(R: number, bands: number): Facet[] {
  const rnd = stream(7);
  const tilt = (16 * Math.PI) / 180;
  const out: Facet[] = [];
  const dphi = Math.PI / bands;
  const project = (phi: number, th: number) => {
    const x = Math.cos(phi) * Math.sin(th);
    const y = Math.sin(phi);
    const z = Math.cos(phi) * Math.cos(th);
    const y2 = y * Math.cos(tilt) - z * Math.sin(tilt);
    const z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
    return [x, y2, z2] as const;
  };
  for (let i = 0; i < bands; i++) {
    const p0 = -Math.PI / 2 + i * dphi;
    const p1 = p0 + dphi;
    const mid = (p0 + p1) / 2;
    const m = Math.max(3, Math.round((2 * Math.PI * Math.cos(mid)) / dphi));
    const dth = (2 * Math.PI) / m;
    const off = (i % 2) * dth * 0.5;
    for (let j = 0; j < m; j++) {
      const t0 = off + j * dth;
      const t1 = t0 + dth;
      const c = project(mid, (t0 + t1) / 2);
      if (c[2] < 0.04) continue;
      const inset = 0.09;
      const a0 = p0 + dphi * inset;
      const a1 = p1 - dphi * inset;
      const b0 = t0 + dth * inset;
      const b1 = t1 - dth * inset;
      const pts = [
        project(a0, b0),
        project(a0, b1),
        project(a1, b1),
        project(a1, b0),
      ].map(([x, y]) => `${(512 + R * x).toFixed(1)},${(512 - R * y).toFixed(1)}`);
      const n = norm([c[0], c[1], c[2]]);
      // The view's reflection off this facet.
      const r: [number, number, number] = [
        2 * n[2] * n[0],
        2 * n[2] * n[1],
        2 * n[2] * n[2] - 1,
      ];
      // ★ THE RING, REFLECTED: a ray that leaves the facet sideways (r_z near
      // zero) meets the ring round the ball, at the ring's own angle.
      const deg = ((Math.atan2(r[0], r[1]) * 180) / Math.PI + 360) % 360;
      const ring = Math.exp(-Math.pow(r[2] / 0.2, 2));
      const lamp = Math.pow(Math.max(0, r[0] * LAMP[0] + r[1] * LAMP[1] + r[2] * LAMP[2]), 60);
      const base = 0.11 + rnd() * 0.07;
      const away = Math.min(180, Math.abs(((deg - KEY + 540) % 360) - 180));
      const key = Math.pow((Math.cos((away * Math.PI) / 180) + 1) / 2, 1.2);
      const lit = ring * (0.25 + 0.75 * key) * (0.7 + 0.3 * rnd());
      const ember = emberAt(away / 180);
      const l = base + (ember[0] - base) * lit;
      const fill = toHex(
        lamp > 0.02
          ? toLab(Math.min(0.97, l + lamp * 0.8), 0.06 * (1 - lamp), 75)
          : [l, ember[1] * lit, ember[2] * lit],
      );
      out.push({ d: `M${pts.join("L")}Z`, fill });
    }
  }
  return out;
}

function Ball({ size, uid }: ArtProps) {
  const { rD } = ringAt(size);
  const R = rD * 0.98;
  const bands = size <= 40 ? 0 : size < 120 ? 8 : size < 400 ? 14 : 18;
  const list = useMemo(() => (bands ? facets(R, bands) : []), [R, bands]);
  return (
    <>
      <defs>
        <radialGradient id={`${uid}mb`} cx="0.4" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#141417" />
          <stop offset="1" stopColor="#050506" />
        </radialGradient>
      </defs>
      <circle cx="512" cy="512" r={R} fill={`url(#${uid}mb)`} />
      {list.map((f, i) => (
        <path key={i} d={f.d} fill={f.fill} />
      ))}
      {bands === 0 ? (
        <circle cx={512 - R * 0.36} cy={512 - R * 0.4} r={R * 0.2} fill="#f7d9a8" />
      ) : null}
    </>
  );
}

function MirrorballArt({ size, uid }: ArtProps) {
  return (
    <>
      <EmberRing size={size} uid={uid} puck={false} light={EMBER_LIGHT} />
      <Ball size={size} uid={uid} />
    </>
  );
}

function MirrorballMono({ color }: { color: string }) {
  const { r0, r1, rD } = ringAt(1024);
  return (
    <>
      <circle cx="512" cy="512" r={(r0 + r1) / 2} fill="none" stroke={color} strokeWidth={Math.max(r1 - r0, 44)} />
      <circle cx="512" cy="512" r={rD * 0.98} fill={color} />
    </>
  );
}

export const MIRRORBALL: Take = { Art: MirrorballArt, Mono: MirrorballMono };
