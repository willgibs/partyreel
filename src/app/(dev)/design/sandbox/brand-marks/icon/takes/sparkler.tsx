"use client";

import { useMemo } from "react";

import { emberAt, toHex, toLab } from "../light";
import { type ArtProps, type Take } from "../parts";

/**
 * DRAWN BY A SPARKLER: the ring is made of the party's own light, a sparkler
 * swung once round and a little past its start the way a long exposure
 * catches it: white-hot at its core, amber in its body, a coral glow round it,
 * swelling toward its head at the top-left where the lamp is and the sparks
 * fly. The room's dark is the puck.
 */

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

const R = 300;
const START = 296;
const TURN = 384;

/** A point on the trail at t (0 its tail, 1 its head), in the 1024 box. */
function at(t: number): [number, number] {
  const deg = START + TURN * t;
  const r =
    R *
    (1 +
      0.022 * Math.sin(2 * Math.PI * 1.15 * t + 0.6) +
      0.012 * Math.sin(2 * Math.PI * 2.7 * t + 2.2));
  const g = ((deg - 90) * Math.PI) / 180;
  return [512 + r * Math.cos(g), 512 + r * Math.sin(g)];
}

type Seg = { x1: number; y1: number; x2: number; y2: number; w: number; t: number };

function trail(n: number, w0: number, w1: number): Seg[] {
  const out: Seg[] = [];
  for (let i = 0; i < n; i++) {
    const t0 = i / n;
    const t1 = (i + 1) / n;
    const [x1, y1] = at(t0);
    const [x2, y2] = at(t1);
    const s = t1 * t1 * (3 - 2 * t1);
    out.push({ x1, y1, x2, y2, w: w0 + (w1 - w0) * s, t: t1 });
  }
  return out;
}

type Spark = { d: string; o: number };

function sparks(count: number, reach: number): Spark[] {
  const rnd = stream(11);
  const out: Spark[] = [];
  for (let i = 0; i < count; i++) {
    const t = 1 - Math.pow(rnd(), 1.8) * 0.35;
    const [x, y] = at(t);
    const [xa, ya] = at(Math.max(0, t - 0.01));
    const tx = x - xa;
    const ty = y - ya;
    const tl = Math.hypot(tx, ty) || 1;
    // Outward from the circle's centre, turned at random.
    const ox = x - 512;
    const oy = y - 512;
    const ol = Math.hypot(ox, oy) || 1;
    const turn = (rnd() - 0.5) * 2.4;
    const dx = (ox / ol) * Math.cos(turn) - (oy / ol) * Math.sin(turn) * 0.9 + (tx / tl) * 0.25;
    const dy = (oy / ol) * Math.cos(turn) + (ox / ol) * Math.sin(turn) * 0.9 + (ty / tl) * 0.25;
    const dl = Math.hypot(dx, dy) || 1;
    const len = reach * (0.35 + 0.65 * rnd()) * (0.4 + 0.6 * ((t - 0.65) / 0.35));
    const w = 3 + rnd() * 4;
    const ex = x + (dx / dl) * len;
    const ey = y + (dy / dl) * len;
    const nx = -dy / dl;
    const ny = dx / dl;
    out.push({
      d: `M${(x + nx * w).toFixed(1)},${(y + ny * w).toFixed(1)}L${ex.toFixed(1)},${ey.toFixed(1)}L${(x - nx * w).toFixed(1)},${(y - ny * w).toFixed(1)}Z`,
      o: 0.55 + 0.45 * rnd(),
    });
  }
  return out;
}

const CORE = toHex(toLab(0.97, 0.04, 85));
const BODY = (t: number) => toHex(emberAt(0.08 + 0.3 * (1 - t)));
const GLOW = (t: number) => toHex(emberAt(0.4 + 0.25 * (1 - t)));

function SparklerArt({ size, uid }: ArtProps) {
  const small = size <= 40;
  const art = useMemo(
    () => ({
      segs: trail(small ? 48 : 220, small ? 64 : 16, small ? 96 : 40),
      sparks: small ? [] : sparks(size < 120 ? 7 : 26, size < 120 ? 120 : 150),
    }),
    [small, size],
  );
  return (
    <>
      <defs>
        <filter id={`${uid}sg`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={small ? 10 : 22} />
        </filter>
      </defs>
      <g filter={`url(#${uid}sg)`} opacity={small ? 0.5 : 0.85}>
        {art.segs.map((s, i) => (
          <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={GLOW(s.t)} strokeWidth={s.w * 2.4} strokeLinecap="round" strokeOpacity={0.35 + 0.5 * s.t} />
        ))}
      </g>
      {art.segs.map((s, i) => (
        <line key={`b${i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={BODY(s.t)} strokeWidth={s.w} strokeLinecap="round" strokeOpacity={0.55 + 0.45 * s.t} />
      ))}
      {art.segs.map((s, i) => (
        <line key={`c${i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={CORE} strokeWidth={s.w * 0.38} strokeLinecap="round" strokeOpacity={0.35 + 0.65 * s.t} />
      ))}
      {art.sparks.map((s, i) => (
        <path key={`s${i}`} d={s.d} fill={CORE} fillOpacity={s.o} />
      ))}
    </>
  );
}

function SparklerMono({ color }: { color: string }) {
  const segs = useMemo(() => trail(160, 30, 56), []);
  const sp = useMemo(() => sparks(14, 140), []);
  return (
    <>
      {segs.map((s, i) => (
        <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={color} strokeWidth={s.w} strokeLinecap="round" />
      ))}
      {sp.map((s, i) => (
        <path key={`s${i}`} d={s.d} fill={color} />
      ))}
    </>
  );
}

export const SPARKLER: Take = { Art: SparklerArt, Mono: SparklerMono };
