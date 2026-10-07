"use client";

import { useMemo } from "react";

import { emberAt, KEY, toHex, toLab } from "../light";
import type { ArtProps, Take } from "../parts";

/**
 * DRAWN BY A SPARKLER: the ring is the party's own light, drawn by hand as
 * one swing of a sparkler the way a long exposure catches it. The swing comes
 * in thin just inside the line at the lower left, goes once round, and comes
 * back up the left outside its own start, swelling as the hand slows into its
 * head at the top-left, where the key is. White-hot only at the very tip,
 * where the sparkler itself is; the sparks it throws fly off the last third of
 * the swing. The room's dark is the puck.
 */

type Pt = [number, number];

/** A seeded stream (mulberry32): the same sparks fly at every render. */
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

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const rad = (deg: number) => (deg * Math.PI) / 180;
const TAU = Math.PI * 2;
/** The box's centre: the swing is centred on it at every size. */
const C = 512;

/**
 * One spark: where it is thrown (a share of the swing, 0 the tail, 1 the
 * head), how far it leans forward of straight out (degrees), its length and
 * weight (shares of the cut's), how far it falls (a share of its length), and
 * how far past the trail's edge it is first seen (a share of the reach).
 */
type Spark = readonly [
  at: number,
  lean: number,
  len: number,
  weight: number,
  drop: number,
  gap?: number,
];

type Cut = {
  /** The swing: its radius round the centre and the hand's wobble (a share of r). */
  r: number;
  wob: number;
  /** Where the tail comes in (0 at the crown, clockwise) and how far round the swing goes (degrees). */
  start: number;
  turn: number;
  /** The tail lies this far inside the line (in body widths), level for `hold` degrees, on the line by `merge`. */
  inset: number;
  hold: number;
  merge: number;
  /** The head runs out to this far outside the line (in body widths) over its last `run` degrees. */
  drift: number;
  run: number;
  /**
   * The body's width, the hand's pressure (a share of w), the tail's thin
   * start (a share of w) and how far it thickens over (degrees), the head's
   * swell and over how many degrees, and how much heavier it runs at the key.
   */
  w: number;
  vary: number;
  thin: number;
  grow: number;
  swell: number;
  swellLen: number;
  lean: number;
  /** The light's hot core: its share of the body's width (0 for none) and its soft edge. */
  inner: number;
  innerSoft: number;
  /**
   * The head's heat: the share of the swing it warms over, its width at the
   * tip (a share of the head's), the round hot point's radius (a share of the
   * head's width, 0 for none), and whether the tip is white or a hot amber.
   */
  hot: number;
  coreW: number;
  tip: number;
  white: boolean;
  /** Samples along the centre line. */
  n: number;
  /** The glow: its width in body widths, its blur, its opacity at the key and far from it. */
  glow: number;
  glowBlur: number;
  glowOp: readonly [number, number];
  /** The body's soft edge (a blur, 0 for none) and the head's bloom on the tile (its radius, 0 for none, and opacity). */
  soft: number;
  bloom: number;
  bloomOp: number;
  /**
   * The sparks, their weight and reach in the 1024 box, their halo's blur,
   * how much light is left at a spark's tip (0 spent), and how far from the
   * centre one may fly.
   */
  sparks: readonly Spark[];
  sparkW: number;
  reach: number;
  sparkGlow: number;
  fade: number;
  safe: number;
  /** The fine sparks off the head's outer edge: how many, how long, how fine. */
  fur: number;
  furLen: number;
  furW: number;
};

// ★ THE SWING (the creative director's pass): an even, perfect circle read
// as a neon tube, so the loop is opened into one gesture. The tail comes in
// at 250 at four tenths of the body's width, a body's width inside the line;
// the head swells to 1.4 times it and comes back up the left outside the
// tail, running on past it to 330 at the top-left, and the hand wobbles by
// 3%. The head runs out gradually and level with the ring at its end: a head
// that left the ring like a stem read as a 6, and one that crossed the tail
// as an X read as a lasso's knot.
const MASTER: Cut = {
  r: 285,
  wob: 0.03,
  start: 250,
  turn: 440,
  inset: 1.1,
  hold: 10,
  merge: 80,
  drift: 1.1,
  run: 90,
  w: 48,
  vary: 0.1,
  thin: 0.4,
  grow: 110,
  swell: 1.4,
  swellLen: 60,
  // ★ HEAVIER WHERE THE HAND IS SLOW: a sparkler swung round slows at the top
  // of its arc and lays more light there, so the trail runs heavy at the key
  // and lighter through the bottom-right where it is fastest; an even band of
  // one weight read as a tube.
  lean: 0.14,
  inner: 0.4,
  innerSoft: 1.5,
  hot: 0.15,
  coreW: 0.5,
  tip: 0.5,
  white: true,
  n: 360,
  glow: 2.8,
  glowBlur: 22,
  glowOp: [0.26, 0.08],
  soft: 3,
  bloom: 150,
  bloomOp: 0.55,
  sparks: [
    [0.735, 22, 0.45, 0.7, 0.12, 0.05],
    [0.745, 54, 0.8, 0.85, 0.16, 0.02],
    [0.835, 10, 0.4, 0.65, 0.1, 0.07],
    [0.84, 38, 1, 1, 0.18, 0.02],
    [0.85, 66, 0.55, 0.75, 0.14, 0.04],
    [0.925, 26, 0.7, 0.9, 0.14, 0.03],
    [0.935, 58, 0.36, 0.6, 0.1, 0.06],
    [0.975, 16, 0.5, 0.8, 0.12, 0.04],
    [0.985, 46, 0.85, 0.95, 0.16, 0.02],
  ],
  sparkW: 5,
  reach: 210,
  sparkGlow: 4,
  fade: 0,
  safe: 405,
  fur: 25,
  furLen: 52,
  furW: 2.2,
};

function cut(size: number): Cut {
  // ★ THE TAB (16): the swing alone, its tail set deeper and heavier, so the
  // crossing holds in a tab's sixteen pixels at 1x as the head's step outside
  // the ring and the tail's notch inside it (set level with the line, the
  // crossing fused into today's ring). No spark, since a pixel off the ring
  // read as a speck of dirt; no white, since a white tip read as the key side
  // of a glossy ring. A wobble is under a pixel here and only blurs the edge.
  if (size <= 20)
    return {
      ...MASTER,
      r: 268,
      w: 118,
      wob: 0,
      vary: 0,
      thin: 0.65,
      grow: 90,
      inset: 1.35,
      drift: 1.0,
      lean: 0,
      n: 96,
      inner: 0,
      innerSoft: 0,
      tip: 0,
      white: false,
      glow: 0,
      soft: 0,
      bloom: 0,
      sparks: [],
      sparkGlow: 0,
      fur: 0,
    };
  // THE FAVICON'S 32: the tab's swing a touch slimmer, a little glow at the
  // key. A favicon is never masked round, so the head may run toward the
  // tile's corner.
  if (size <= 40)
    return {
      ...MASTER,
      r: 272,
      w: 100,
      wob: 0.01,
      vary: 0,
      thin: 0.6,
      inset: 1.3,
      drift: 1.05,
      lean: 0,
      n: 120,
      inner: 0,
      innerSoft: 0,
      tip: 0,
      white: false,
      glow: 1.4,
      glowBlur: 24,
      glowOp: [0.3, 0.05],
      soft: 0,
      bloom: 0,
      sparks: [],
      sparkGlow: 0,
      safe: 470,
      fur: 0,
    };
  // ★ THE HOME SCREEN (60, and the launcher's 75): r 285 and w 80, centred
  // (at r 240 and w 66 the outer edge stood near 275 against today's 333,
  // thin beside its neighbours and the wordmark). The head runs out less and
  // the tail sits deeper, so the swing keeps its crossing and its head stays
  // inside the launcher's safe circle (409); the spray, inside it too, is
  // short here, three sparks thrown from three points along the swing, the
  // shortest nearest the head, as a long exposure catches a spark thrown just
  // before the shutter closed (trimmed evenly by the safe circle, they read
  // as a comb).
  if (size < 120)
    return {
      ...MASTER,
      w: 80,
      vary: 0.05,
      lean: 0.06,
      inset: 1.4,
      merge: 110,
      drift: 0.65,
      swell: 1.35,
      n: 180,
      inner: 0,
      innerSoft: 0,
      glow: 1.8,
      glowBlur: 20,
      glowOp: [0.25, 0.06],
      soft: 0,
      sparks: [
        [0.71, 52, 0.55, 0.85, 0.16, 0.04],
        [0.8, 40, 1, 1, 0.22, 0.02],
        [0.9, 58, 0.17, 0.85, 0.12, 0.03],
      ],
      sparkW: 22,
      reach: 250,
      sparkGlow: 8,
      fade: 0.45,
      fur: 0,
    };
  // THE 180 is the phone's own file, shown at 60 points: the master's swing
  // held inside the safe circle like the home screen's, six sparks set by
  // hand, and no fur (at this size it read as dust).
  if (size < 300)
    return {
      ...MASTER,
      w: 74,
      vary: 0.06,
      lean: 0.1,
      inset: 1.25,
      merge: 95,
      drift: 0.78,
      swell: 1.35,
      n: 260,
      innerSoft: 3,
      glow: 2.0,
      glowBlur: 14,
      glowOp: [0.22, 0.06],
      soft: 1.5,
      sparks: [
        [0.77, 26, 0.9, 0.9, 0.14, 0.02],
        [0.78, 58, 0.45, 0.7, 0.12, 0.05],
        [0.86, 40, 1, 1, 0.16, 0.02],
        [0.87, 10, 0.4, 0.65, 0.1, 0.06],
        [0.945, 30, 0.75, 0.9, 0.14, 0.03],
        [0.955, 60, 0.36, 0.65, 0.1, 0.05],
      ],
      sparkW: 15,
      reach: 170,
      sparkGlow: 5,
      fade: 0.2,
      fur: 0,
    };
  return MASTER;
}

/** The angle (0 at the crown, clockwise) the swing has reached at u (0 the tail, 1 the head). */
const angleAt = (u: number, k: Cut) => k.start + k.turn * u;

/** How near the key an angle is: 1 on it, 0 opposite. */
const keyness = (deg: number) =>
  Math.pow((Math.cos(rad(deg - KEY)) + 1) / 2, 2);

/** The swing's distance from the centre at u: the hand's wobble, the tail inside the line, the head running out past it. */
function radius(u: number, k: Cut) {
  const s = k.turn * u;
  const t = s / 360;
  const hand =
    k.wob *
    k.r *
    (0.6 * Math.sin(TAU * t + 0.7) + 0.4 * Math.sin(TAU * 2.3 * t + 2.4));
  const tail = -k.inset * k.w * (1 - smooth(k.hold, k.merge, s));
  const head = k.drift * k.w * smooth(k.turn - k.run, k.turn, s);
  return k.r + hand + tail + head;
}

function centre(u: number, k: Cut): Pt {
  const g = rad(angleAt(u, k));
  const r = radius(u, k);
  return [C + r * Math.sin(g), C - r * Math.cos(g)];
}

type Frame = { p: Pt; t: Pt };

/** The centre line's point and its unit direction of travel at u. */
function frame(u: number, k: Cut): Frame {
  const p = centre(u, k);
  const a = centre(u - 1e-3, k);
  const b = centre(u + 1e-3, k);
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return { p, t: [(b[0] - a[0]) / l, (b[1] - a[1]) / l] };
}

/**
 * The body's width at u: the hand's pressure, the tail coming in from a fine
 * point, the head's swell, heavier at the key.
 */
function width(u: number, k: Cut) {
  const s = k.turn * u;
  const t = s / 360;
  const vary =
    1 +
    k.vary *
      (0.55 * Math.sin(TAU * 1.6 * t + 0.9) +
        0.45 * Math.sin(TAU * 3.7 * t + 2.0));
  const tail =
    (k.thin + (1 - k.thin) * smooth(0, k.grow, s)) *
    (0.45 + 0.55 * smooth(0, 12, s));
  const swell = 1 + (k.swell - 1) * smooth(k.turn - k.swellLen, k.turn - 8, s);
  const lean = 1 + k.lean * (2 * keyness(angleAt(u, k)) - 1);
  return k.w * vary * tail * swell * lean;
}

/** A round cap's points about a frame, from one side round the front (dir 1) or the back (dir -1) to the other. */
function cap({ p, t }: Frame, h: number, dir: 1 | -1, m = 10): Pt[] {
  const out: Pt[] = [];
  const nx = -t[1];
  const ny = t[0];
  for (let j = 1; j < m; j++) {
    const phi =
      dir === 1
        ? Math.PI / 2 - (Math.PI * j) / m
        : -Math.PI / 2 + (Math.PI * j) / m;
    const c = Math.cos(phi) * dir;
    const s = Math.sin(phi);
    out.push([p[0] + h * (c * t[0] + s * nx), p[1] + h * (c * t[1] + s * ny)]);
  }
  return out;
}

/**
 * ★ THE TRAIL IS ONE OUTLINE, NEVER A STRING OF STROKES: both edges offset
 * from the centre line by the width at each point and closed with round caps,
 * so the light runs seamless round the loop at any width (drawn as segments,
 * it beaded wherever two translucent strokes overlapped).
 */
function outline(k: Cut, wOf: (u: number) => number, u0 = 0, u1 = 1): Pt[] {
  const left: Pt[] = [];
  const right: Pt[] = [];
  const n = Math.max(8, Math.round(k.n * (u1 - u0)));
  for (let i = 0; i <= n; i++) {
    const u = u0 + ((u1 - u0) * i) / n;
    const { p, t } = frame(u, k);
    const h = wOf(u) / 2;
    left.push([p[0] - t[1] * h, p[1] + t[0] * h]);
    right.push([p[0] + t[1] * h, p[1] - t[0] * h]);
  }
  return [
    ...left,
    ...cap(frame(u1, k), wOf(u1) / 2, 1),
    ...right.reverse(),
    ...cap(frame(u0, k), wOf(u0) / 2, -1),
  ];
}

function area(q: Pt[]) {
  let a = 0;
  for (let i = 0; i < q.length; i++) {
    const [x1, y1] = q[i];
    const [x2, y2] = q[(i + 1) % q.length];
    a += x1 * y2 - x2 * y1;
  }
  return a;
}

/**
 * ★ EVERY SHAPE WOUND THE SAME WAY: the fur shares one path, and in the mono
 * the trail and its streak do, and under the nonzero rule two shapes wound
 * against each other cancel where they overlap.
 */
const wound = (q: Pt[]) => (area(q) < 0 ? [...q].reverse() : q);

const toD = (polys: Pt[][]) =>
  polys
    .map(
      (q) =>
        `M${q.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join("L")}Z`,
    )
    .join("");

type Spine = (s: number) => Frame;

/** A spark's flight: thrown along `d`, falling `drop` of its length by its end (a parabola). */
function flight(o: Pt, d: Pt, len: number, drop: number): Spine {
  const ctl: Pt = [o[0] + (d[0] * len) / 2, o[1] + (d[1] * len) / 2];
  const tip: Pt = [o[0] + d[0] * len, o[1] + d[1] * len + drop * len];
  return (s) => {
    const a = (1 - s) * (1 - s);
    const b = 2 * (1 - s) * s;
    const c = s * s;
    const tx = 2 * (1 - s) * (ctl[0] - o[0]) + 2 * s * (tip[0] - ctl[0]);
    const ty = 2 * (1 - s) * (ctl[1] - o[1]) + 2 * s * (tip[1] - ctl[1]);
    const tl = Math.hypot(tx, ty) || 1;
    return {
      p: [
        a * o[0] + b * ctl[0] + c * tip[0],
        a * o[1] + b * ctl[1] + c * tip[1],
      ],
      t: [tx / tl, ty / tl],
    };
  };
}

const STEPS = [0, 0.1, 0.22, 0.4, 0.55, 0.7, 0.85, 1] as const;
const FEW = [0, 0.25, 0.6, 1] as const;

/**
 * ★ A SPARK IS A STREAK, NEVER A THORN: even along most of its flight, eased
 * in where it leaves the trail and drawn out to a fine tip (wedges from a
 * broad base read as spikes, and four points as a kite).
 */
function needle(sp: Spine, w: number, steps: readonly number[]): Pt[] {
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (const s of steps) {
    const { p, t } = sp(s);
    const h =
      (w / 2) *
      (s < 0.22
        ? 0.45 + 0.55 * smooth(0, 0.22, s)
        : s < 0.5
          ? 1
          : Math.pow(Math.max(0, 1 - (s - 0.5) / 0.5), 1.1));
    left.push([p[0] - t[1] * h, p[1] + t[0] * h]);
    right.push([p[0] + t[1] * h, p[1] - t[0] * h]);
  }
  right.pop();
  return [...left, ...right.reverse()];
}

/**
 * Where a spark leaves the trail at u (a share of the way out to its outer
 * edge), the outward direction there, and the swing's direction of travel.
 */
function edge(u: number, k: Cut, share: number) {
  const { p, t } = frame(u, k);
  const ox = p[0] - C;
  const oy = p[1] - C;
  const ol = Math.hypot(ox, oy) || 1;
  const n: Pt = [ox / ol, oy / ol];
  const h = (width(u, k) / 2) * share;
  return { o: [p[0] + n[0] * h, p[1] + n[1] * h] as Pt, n, t };
}

/** A direction `lean` degrees forward of straight out. */
const toward = (lean: number, n: Pt, t: Pt): Pt => [
  Math.cos(rad(lean)) * n[0] + Math.sin(rad(lean)) * t[0],
  Math.cos(rad(lean)) * n[1] + Math.sin(rad(lean)) * t[1],
];

type Streak = { d: string; from: Pt; to: Pt };

/**
 * THE SPARKS: thrown off the last third of the swing, each leaving the
 * trail's outer edge outward and leaning forward with the swing, falling as it
 * flies, the longest three times the shortest, and shortened until its whole
 * flight stays inside the safe circle and off the ring. Each fades along its
 * flight on a gradient of its own.
 *
 * ★ OFF THE SWING, NEVER A FAN FROM ONE POINT (the creative director's
 * pass): a fan from the head read as a dandelion at 1024, a crown at 60, a
 * jewel's twinkle on the ring and a lit fuse in a launcher's mask; thrown
 * along the swing, the sparks say the light is moving. The dots and the forked
 * toes went with the fan.
 */
function sparks(k: Cut): Streak[] {
  return k.sparks.map(([at, lean, len, weight, drop, gap = 0]) => {
    const e = edge(at, k, 0.55);
    const d = toward(lean, e.n, e.t);
    const o: Pt = [
      e.o[0] + d[0] * gap * k.reach,
      e.o[1] + d[1] * gap * k.reach,
    ];
    let L = k.reach * len;
    for (let tries = 0; tries < 30; tries++) {
      const sp = flight(o, d, L, drop);
      let ok = true;
      for (let i = 1; i <= 12; i++) {
        const q = sp(i / 12).p;
        const rr = Math.hypot(q[0] - C, q[1] - C);
        if (rr > k.safe || (i > 3 && rr < k.r + k.w * 0.5)) ok = false;
      }
      if (ok) break;
      L *= 0.9;
    }
    const sp = flight(o, d, L, drop);
    return {
      d: toD([wound(needle(sp, k.sparkW * weight, STEPS))]),
      from: o,
      to: sp(1).p,
    };
  });
}

/**
 * THE FUR: fine sparks streaking off the head's outer edge, short and leaning
 * forward with the swing, crowding toward the tip, in the ember's own amber.
 *
 * ★ TWENTY-FIVE, AND ONLY ON THE HEAD (the creative director's pass):
 * seventy-two pale hairs along the whole trail read as dust; gathered where
 * the sparkler is, they read as its light fraying. On the outer edge only: one
 * inside lay across the tail where the head passes it.
 */
function fur(k: Cut): Pt[][] {
  const rnd = stream(53);
  const polys: Pt[][] = [];
  for (let i = 0; i < k.fur; i++) {
    const x = (i + 0.15 + 0.7 * rnd()) / k.fur;
    const u = 0.99 - 0.2 * Math.pow(1 - x, 1.6);
    const { o, n, t } = edge(u, k, 0.75);
    const d = toward(20 + 50 * rnd(), n, t);
    const len = k.furLen * (0.25 + 0.75 * Math.pow(rnd(), 1.3));
    polys.push(
      needle(flight(o, d, len, 0.12), k.furW * (0.6 + 0.6 * rnd()), FEW),
    );
  }
  return polys;
}

/**
 * ★ WHITE ONLY WHERE THE SPARKLER IS (the creative director's pass): the tip
 * is white-hot, warmed a touch toward amber so it belongs to the ember, and
 * the white runs back no further than the last part of the head; behind it the
 * heat cools through gold into the body. The body, its core, its glow and
 * everything the light falls on are the house ember, amber at the key spent
 * to coral away from it. At a tab's size the tip is a hot amber, never white:
 * white there read as the key side of a glossy ring.
 */
const HOT = toHex(toLab(0.985, 0.03, 88));
const PALE = toHex(toLab(0.95, 0.075, 84));
const AMBER = toHex(toLab(0.93, 0.13, 82));
const GOLD = toHex(toLab(0.9, 0.15, 80));

function SparklerArt({ size, uid }: ArtProps) {
  const art = useMemo(() => {
    const k = cut(size);
    const trail = outline(k, (u) => width(u, k));
    // The hot core flickers on three beats that never line up, so the light
    // never reads as a tube.
    const inner = k.inner
      ? outline(
          k,
          (u) => {
            const t = (k.turn * u) / 360;
            const beat =
              1 +
              0.22 * Math.sin(TAU * 2.7 * t + 1.1) +
              0.12 * Math.sin(TAU * 6.3 * t + 0.3) +
              0.07 * Math.sin(TAU * 13.1 * t + 2.0);
            return width(u, k) * k.inner * beat * smooth(0, 0.14, u);
          },
          0.012,
          1,
        )
      : null;
    // The head's heat: a core warming toward the tip over the last share of
    // the swing, its colour a ramp out from the tip (along a gentle arc, the
    // distance from its end is near enough the distance along it).
    const u0 = 1 - k.hot;
    const core = outline(
      k,
      (u) => width(u, k) * k.coreW * Math.pow(smooth(u0, 1, u), 0.6),
      u0,
      1,
    );
    const tip = centre(1, k);
    const from = centre(u0, k);
    // ★ THE GLOW FOLLOWS THE BODY BUT NEVER THE HEAD'S SWELL, so the head
    // carries no bigger haze than the trail's own (a halo round the swell
    // read as a comet's).
    const glow = k.glow
      ? outline(
          k,
          (u) => Math.min(width(u, k), k.w * 1.15) + k.w * (k.glow - 1),
        )
      : null;
    const sp = sparks(k);
    const f = k.fur ? fur(k) : [];
    // The key's axis, from the top-left to the bottom-right, for every gradient.
    const kx = Math.sin(rad(KEY));
    const ky = -Math.cos(rad(KEY));
    const reach = k.r + 70;
    return {
      k,
      trail: toD([trail]),
      inner: inner ? toD([inner]) : null,
      core: toD([core]),
      glow: glow ? toD([glow]) : null,
      sparks: sp,
      halo: sp.length ? sp.map((s) => s.d).join("") : null,
      fur: f.length ? toD(f.map(wound)) : null,
      tip,
      tipR: width(1, k) * k.tip,
      heat: Math.hypot(tip[0] - from[0], tip[1] - from[1]),
      axis: {
        x1: C + kx * reach,
        y1: C + ky * reach,
        x2: C - kx * reach,
        y2: C - ky * reach,
      },
    };
  }, [size]);
  const { k, axis, tip, tipR, heat } = art;
  return (
    <>
      <defs>
        <linearGradient
          id={`${uid}sb`}
          gradientUnits="userSpaceOnUse"
          {...axis}
        >
          <stop offset="0" stopColor={toHex(emberAt(0.08))} />
          <stop offset="0.4" stopColor={toHex(emberAt(0.3))} />
          <stop offset="0.7" stopColor={toHex(emberAt(0.5))} />
          <stop offset="1" stopColor={toHex(emberAt(0.7))} />
        </linearGradient>
        <linearGradient
          id={`${uid}si`}
          gradientUnits="userSpaceOnUse"
          {...axis}
        >
          <stop offset="0" stopColor={AMBER} />
          <stop offset="0.45" stopColor={toHex(emberAt(0.14))} />
          <stop offset="1" stopColor={toHex(emberAt(0.44))} />
        </linearGradient>
        <linearGradient
          id={`${uid}sg`}
          gradientUnits="userSpaceOnUse"
          {...axis}
        >
          <stop
            offset="0"
            stopColor={toHex(emberAt(0.42))}
            stopOpacity={k.glowOp[0]}
          />
          <stop
            offset="0.5"
            stopColor={toHex(emberAt(0.5))}
            stopOpacity={(k.glowOp[0] + k.glowOp[1]) / 2}
          />
          <stop
            offset="1"
            stopColor={toHex(emberAt(0.62))}
            stopOpacity={k.glowOp[1]}
          />
        </linearGradient>
        <radialGradient
          id={`${uid}sh`}
          gradientUnits="userSpaceOnUse"
          cx={tip[0]}
          cy={tip[1]}
          r={k.bloom || 1}
        >
          <stop
            offset="0"
            stopColor={toHex(emberAt(0.15))}
            stopOpacity={k.bloomOp}
          />
          <stop
            offset="0.4"
            stopColor={toHex(emberAt(0.35))}
            stopOpacity={k.bloomOp * 0.3}
          />
          <stop offset="1" stopColor={toHex(emberAt(0.5))} stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id={`${uid}sc`}
          gradientUnits="userSpaceOnUse"
          cx={tip[0]}
          cy={tip[1]}
          r={heat || 1}
        >
          <stop offset="0" stopColor={k.white ? HOT : AMBER} />
          <stop offset="0.1" stopColor={k.white ? HOT : AMBER} />
          <stop offset="0.3" stopColor={GOLD} stopOpacity="0.8" />
          <stop offset="0.7" stopColor={GOLD} stopOpacity="0.25" />
          <stop offset="1" stopColor={GOLD} stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id={`${uid}sw`}
          gradientUnits="userSpaceOnUse"
          cx={tip[0]}
          cy={tip[1]}
          r={tipR || 1}
        >
          <stop offset="0" stopColor={HOT} />
          <stop offset="0.4" stopColor={HOT} />
          <stop offset="1" stopColor={PALE} stopOpacity="0" />
        </radialGradient>
        {art.sparks.map((s, i) => (
          <linearGradient
            key={i}
            id={`${uid}sp${i}`}
            gradientUnits="userSpaceOnUse"
            x1={s.from[0]}
            y1={s.from[1]}
            x2={s.to[0]}
            y2={s.to[1]}
          >
            <stop offset="0" stopColor={PALE} />
            <stop offset="0.45" stopColor={toHex(emberAt(0.08))} />
            <stop
              offset="1"
              stopColor={toHex(emberAt(0.35))}
              stopOpacity={k.fade}
            />
          </linearGradient>
        ))}
        <filter id={`${uid}sf`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={k.glowBlur} />
        </filter>
        {k.soft ? (
          <filter id={`${uid}so`} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={k.soft} />
          </filter>
        ) : null}
        {k.innerSoft ? (
          <filter id={`${uid}sx`} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={k.innerSoft} />
          </filter>
        ) : null}
        {k.sparkGlow ? (
          <filter id={`${uid}sk`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={k.sparkGlow} />
          </filter>
        ) : null}
      </defs>
      {k.bloom ? (
        <circle cx={tip[0]} cy={tip[1]} r={k.bloom} fill={`url(#${uid}sh)`} />
      ) : null}
      {art.glow ? (
        <path d={art.glow} fill={`url(#${uid}sg)`} filter={`url(#${uid}sf)`} />
      ) : null}
      {art.halo && k.sparkGlow ? (
        <path
          d={art.halo}
          fill={toHex(emberAt(0.25))}
          stroke={toHex(emberAt(0.25))}
          strokeWidth={k.sparkGlow}
          strokeLinejoin="round"
          opacity="0.4"
          filter={`url(#${uid}sk)`}
        />
      ) : null}
      {art.sparks.map((s, i) => (
        <path key={i} d={s.d} fill={`url(#${uid}sp${i})`} />
      ))}
      <path
        d={art.trail}
        fill={`url(#${uid}sb)`}
        filter={k.soft ? `url(#${uid}so)` : undefined}
      />
      {art.inner ? (
        <path
          d={art.inner}
          fill={`url(#${uid}si)`}
          filter={k.innerSoft ? `url(#${uid}sx)` : undefined}
        />
      ) : null}
      {art.fur ? (
        <path d={art.fur} fill={toHex(emberAt(0.06))} fillOpacity="0.9" />
      ) : null}
      <path d={art.core} fill={`url(#${uid}sc)`} />
      {k.tip ? (
        <circle cx={tip[0]} cy={tip[1]} r={tipR} fill={`url(#${uid}sw)`} />
      ) : null}
    </>
  );
}

/**
 * The mono's loop: the master's swing, heavier, built from a finer entry, its
 * head kept closer to the ring so the crossing stays open at a watermark's
 * size without the head standing off it.
 */
const MONO: Cut = {
  ...MASTER,
  w: 96,
  wob: 0.02,
  vary: 0.04,
  thin: 0.32,
  grow: 140,
  inset: 1.15,
  drift: 0.55,
  swell: 1.15,
  lean: 0,
  n: 220,
  sparks: [],
};

/**
 * ★ THE MONO IS THE CENTRED LOOP AND ONE STREAK (the creative director's
 * pass): three blunt rays on a lopsided ring, set off-centre, read as a
 * cartoon shine. The streak is thrown off the swing's left side, forward and
 * outward, a gap clear of the trail so it holds as its own stroke at 26
 * pixels, and short, because the mark's box is cut at its furthest reach:
 * thrown long it shrank the loop to half the watermark, and set at the lower
 * left it read as a Q's tail, by the head as a leaf. Where it is thrown (a
 * share of the swing), its lean forward of straight out (degrees), its length
 * and fall (shares of r), its gap and its weight (shares of the body's width).
 */
const FLICK = {
  at: 0.86,
  lean: 58,
  len: 0.5,
  drop: 0.1,
  gap: 0.25,
  weight: 0.45,
};

/**
 * A streak in one colour: round where it leaves, even for most of its flight,
 * drawn out to a point at its end (tapered early, it read as a petal).
 */
function dash(sp: Spine, w: number): Pt[] {
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (const s of [0, 0.2, 0.4, 0.6, 0.72, 0.84, 0.93, 1]) {
    const { p, t } = sp(s);
    const h = (w / 2) * (s < 0.6 ? 1 : Math.pow(1 - (s - 0.6) / 0.4, 0.8));
    left.push([p[0] - t[1] * h, p[1] + t[0] * h]);
    right.push([p[0] + t[1] * h, p[1] - t[0] * h]);
  }
  right.pop();
  return [...cap(sp(0), w / 2, -1), ...left, ...right.reverse()];
}

function SparklerMono({ color }: { color: string }) {
  const d = useMemo(() => {
    const trail = outline(MONO, (u) => width(u, MONO));
    const e = edge(FLICK.at, MONO, 1);
    const dir = toward(FLICK.lean, e.n, e.t);
    const w = MONO.w * FLICK.weight;
    const off = FLICK.gap * MONO.w + w / 2;
    const from: Pt = [e.o[0] + dir[0] * off, e.o[1] + dir[1] * off];
    const streak = dash(flight(from, dir, FLICK.len * MONO.r, FLICK.drop), w);
    return toD([wound(trail), wound(streak)]);
  }, []);
  return <path d={d} fill={color} />;
}

export const SPARKLER: Take = { Art: SparklerArt, Mono: SparklerMono };
