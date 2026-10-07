"use client";

import { useMemo } from "react";

import {
  apart,
  emberAt,
  KEY,
  type Lab,
  type Lighting,
  mix,
  toHex,
  toLab,
} from "../light";
import { EMBER_LIGHT } from "../lights/ember";
import { type ArtProps, ringAt, type Take, wedges } from "../parts";

/**
 * THE MIRROR BALL: the ring holds the party's own object. The shutter's puck
 * becomes a mirror ball inside today's key-lit ember ring: a sphere of
 * near-black mirrors in fine grout, each reflecting the dark room, except
 * where it catches the ring. The ring is lit where the key falls and spent
 * toward the bottom-right, so the ball holds its lit side alone: one crescent
 * of lit facets on the key's side, the hottest where the key itself falls,
 * amber to coral as the ring turns from it, and at most two dim reds on the
 * far side, where the ring is spent. The party's object, caught in the
 * brand's one light.
 *
 * ★ ONE CRESCENT, NEVER A RING OF DOTS: the ball once held the whole ring,
 * a dashed circle of lit facets fading as it went round, which a home screen
 * read as a loading spinner; gathered within 75 degrees of the key, the light
 * is one group with one direction, as the ring's own is.
 *
 * ★ NO LIGHT THROWN ON THE TILE: a mirror ball throws spots round a room, and
 * a trial drew a few on the tile; faint enough to stay calm they vanished into
 * the ring's corona, bright enough to show they were dust round the mark,
 * scattering the one clear group the icon is.
 */

type V3 = [number, number, number];
type Pt = [number, number];
type Paint = { d: string; fill: string };
/** A lit facet: its outline and its colour graded along the key's axis, top-left to bottom-right. */
type Glass = { d: string; from: string; to: string };

const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const clamp = (x: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const f1 = (n: number) => n.toFixed(1);
const f2 = (n: number) => n.toFixed(2);
const poly = (pts: Pt[]) =>
  `M${pts.map(([x, y]) => `${f1(x)},${f1(y)}`).join("L")}Z`;
/** A circle as a path, so a mark in one colour can cut holes in it. */
const ring = (r: number) =>
  `M${f1(512 - r)},512a${f1(r)},${f1(r)} 0 1,0 ${f1(2 * r)},0a${f1(r)},${f1(r)} 0 1,0 ${f1(-2 * r)},0Z`;

/** A seeded stream, so the same facets catch the light at every render. */
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
/** Roughly a unit normal deviate, from three draws. */
const gauss = (rnd: () => number) => (rnd() + rnd() + rnd() - 1.5) * 2;

/**
 * THE RING'S LIGHT: today's key-lit ember (`lights/ember.tsx`), its light and
 * its cuts, unchanged from 60 up.
 *
 * ★ AT A FAVICON'S SIZES THE BALL GROWS: a puck a sixth wider, a gap a third
 * tighter and a band a touch slimmer than the ember's favicon cut, since the
 * ball's few pixels are the take's whole idea there and a wide gap spent them
 * on the tile.
 */
const LIGHT: Lighting = {
  ...EMBER_LIGHT,
  optics: (size) => ({
    ...EMBER_LIGHT.optics?.(size),
    ...(size <= 40 ? { rDisc: 0.25, gap: 0.035, band: 0.105 } : null),
  }),
};

/** A colour along the house ember, its lightness nudged by `dl`. */
function lab(t: number, dl = 0): Lab {
  const e = emberAt(clamp(t));
  return [e[0] + dl, e[1], e[2]];
}
const ember = (t: number, dl = 0) => toHex(lab(t, dl));
/** A white-hot core: the lamp's own light, a breath warm. */
const WHITE = toLab(0.985, 0.02, 80);

/** A colour of the dark room at a lightness, a cool graphite. */
const room = (l: number) => toHex(toLab(l, 0.006, 286));

/**
 * ONE MIRROR OF THE BALL: its outline on the page (1024 box), its centre on
 * the ball as seen (x right, y up, z toward the viewer), the way its mirror
 * faces, and its own small difference from its neighbours (-1 to 1).
 */
type Facet = { pts: Pt[]; c: V3; n: V3; wob: number };

/**
 * THE BALL AS A SPHERE OF FACETS: courses of near-square mirrors from pole to
 * pole, the ball's axis leaning back a little so the viewer looks up at it,
 * as at a ball hanging over a dance floor.
 *
 * ★ NEVER A GLOBE: each course starts at its own seeded offset, so no seam
 * runs on into the next course and no meridian ever forms; the courses read
 * as a mirror ball's tiles, never a map's graticule. Seen from below, they
 * arch over the ball's middle, which a hanging ball shows and a globe on a
 * desk never does.
 */
function facets(
  R: number,
  rows: number,
  o: { tilt: number; grout: number; jitter: number; seed: number },
): Facet[] {
  const rnd = stream(o.seed);
  const tau = rad(o.tilt);
  const dl = Math.PI / rows;
  const g = (dl * o.grout) / 2;
  const s = dl * o.jitter;
  const view = (lat: number, lon: number): V3 => {
    const x = Math.cos(lat) * Math.sin(lon);
    const y = Math.sin(lat);
    const z = Math.cos(lat) * Math.cos(lon);
    return [
      x,
      y * Math.cos(tau) + z * Math.sin(tau),
      -y * Math.sin(tau) + z * Math.cos(tau),
    ];
  };
  const at = (v: V3): Pt => [512 + R * v[0], 512 - R * v[1]];
  const out: Facet[] = [];
  for (let i = 0; i < rows; i++) {
    const a0 = -Math.PI / 2 + i * dl;
    const a1 = a0 + dl;
    const am = (a0 + a1) / 2;
    const m = Math.max(3, Math.round((2 * Math.PI * Math.cos(am)) / dl));
    const dm = (2 * Math.PI) / m;
    const phase = rnd() * dm;
    for (let j = 0; j < m; j++) {
      const b0 = phase + j * dm;
      const b1 = b0 + dm;
      const c = view(am, (b0 + b1) / 2);
      // Every facet draws from the stream, seen or not, so a seed is a ball.
      const jx = gauss(rnd);
      const jy = gauss(rnd);
      const wob = rnd() * 2 - 1;
      if (c[2] < 0.02) continue;
      // The grout is one width all round the ball, so it narrows with the
      // facets toward the limb, as a real ball's does.
      const gb = Math.min(dm * 0.3, g / Math.max(0.2, Math.cos(am)));
      const corners: Pt[] = [
        [a0 + g, b0 + gb],
        [a0 + g, b1 - gb],
        [a1 - g, b1 - gb],
        [a1 - g, b0 + gb],
      ];
      // ★ EACH MIRROR SITS A HAIR OFF TRUE, as a real ball's are glued: a
      // touch of life in which facets catch, never enough to scatter them.
      const t1 = norm(
        Math.hypot(c[0], c[2]) > 1e-3 ? [-c[2], 0, c[0]] : [1, 0, 0],
      );
      const t2: V3 = [
        c[1] * t1[2] - c[2] * t1[1],
        c[2] * t1[0] - c[0] * t1[2],
        c[0] * t1[1] - c[1] * t1[0],
      ];
      const n = norm([
        c[0] + s * (jx * t1[0] + jy * t2[0]),
        c[1] + s * (jx * t1[1] + jy * t2[1]),
        c[2] + s * (jx * t1[2] + jy * t2[2]),
      ]);
      out.push({ pts: corners.map(([la, lo]) => at(view(la, lo))), c, n, wob });
    }
  }
  return out;
}

type Crescent = {
  /** At most this many facets catch the ring's lit side (the hottest kept). */
  lit: number;
  /** How many catch its spent far side, dimly (at most two). */
  reds: number;
  /** The reflection's elevation where the ring sits (degrees): it sets the crescent's radius on the ball. */
  e0: number;
  /** The crescent's half-width at the key, in degrees of reflection. */
  width: number;
  /** How the width falls toward the tips: 0 a band, higher a sharper crescent. */
  shape: number;
  /** How far round from the key the crescent reaches (degrees). */
  reach: number;
};

/** Where a facet's mirror sends the eye: the view turned about its normal. */
const reflect = (n: V3): V3 => [
  2 * n[2] * n[0],
  2 * n[2] * n[1],
  2 * n[2] * n[2] - 1,
];

/**
 * WHERE THE BALL HOLDS THE RING: a flat mirror sends the eye one way. A facet
 * that sends it out sideways, at the ring's own height, sees the ring there;
 * the ring is lit where the key falls and spent past it, so the facets that
 * catch it are those looking toward the key, the closer the hotter: a
 * crescent widest at the key, where the ring and its glow are brightest,
 * narrowing to a point short of 75 degrees round. Returns the lit facets,
 * hottest first with their heat (1 the glint), and the far side's dim
 * catches.
 */
function crescent(all: Facet[], o: Crescent) {
  const scored = all.map((f) => {
    const r = reflect(f.n);
    const e = deg(Math.asin(clamp(r[2], -1, 1)));
    const d = apart((deg(Math.atan2(r[0], r[1])) + 360) % 360, KEY);
    const taper = d < o.reach ? Math.cos(((d / o.reach) * Math.PI) / 2) : 0;
    const w = o.width * Math.pow(taper, o.shape);
    const x = w > 0 ? Math.abs(e - o.e0) / w : 9;
    return { f, d, x, heat: x < 1 ? (1 - x * x) * Math.sqrt(taper) : 0 };
  });
  const lit = scored
    .filter((s) => s.heat > 0)
    .sort((a, b) => b.heat - a.heat)
    .slice(0, o.lit);
  const top = lit[0]?.heat ?? 1;
  const taken = new Set(lit.map((s) => s.f));
  // The far side's catches: facets that face the ring squarely where it is
  // spent, the bottom-right, never beside the crescent.
  const far = scored
    .filter((s) => s.d > 130 && !taken.has(s.f))
    .map((s) => ({
      f: s.f,
      x: Math.abs(deg(Math.asin(clamp(reflect(s.f.n)[2], -1, 1))) - o.e0),
    }))
    .filter((s) => s.x < o.width * 0.5)
    .sort((a, b) => a.x - b.x);
  // ★ TWO REDS NEVER PAIR: side by side they drew a colon, a mark of their
  // own; kept apart they are two catches of the same spent light.
  const reds: typeof far = [];
  for (const s of far) {
    if (reds.length >= o.reds) break;
    const apartEnough = reds.every(
      (r) => Math.hypot(r.f.c[0] - s.f.c[0], r.f.c[1] - s.f.c[1]) > 0.3,
    );
    if (apartEnough) reds.push(s);
  }
  return {
    lit: lit.map((s) => ({ f: s.f, heat: s.heat / top })),
    reds: reds.map((s) => s.f),
    taken: new Set([...taken, ...reds.map((s) => s.f)]),
  };
}

/**
 * ONE LIT FACET'S GLASS: its place along the ember set by its heat (amber at
 * the key, coral as the ring turns away, a deeper coral at the crescent's
 * tips), graded along the key's axis, hotter at its top-left edge and spent
 * toward its bottom-right, as the ring's own band is; the few hottest beside
 * the glint run toward white at their top-left edge.
 *
 * ★ NEVER BROWN, NEVER AN LED: a facet half lit was dark amber, which is
 * brown paint, so the dimmest catch is a full coral; and a flat fill read as
 * a lit pixel of a display, so each one is graded, and each differs from its
 * neighbours by about a tenth, as mirrors glued by hand do.
 */
function glass(
  heat: number,
  wob: number,
  cut: { ramp: number; tip: number },
): { from: string; to: string } {
  const h = clamp(Math.pow(heat, cut.ramp) + 0.06 * wob);
  const t = cut.tip * Math.pow(1 - h, 0.8);
  // Each mirror its own: a facet a hair hotter is a hair lighter too.
  const own = 0.035 * wob;
  // The hottest few, beside the glint, run toward white at their key edge.
  const hot = Math.max(0, (h - 0.6) / 0.4) * 0.6;
  return {
    from: toHex(mix(lab(t - 0.15, 0.05 + own), WHITE, hot)),
    to: ember(t + 0.17, own - 0.08),
  };
}

/**
 * THE GLINT: the facet that faces the key best, the hottest on the crescent,
 * white-hot at its top-left edge and amber across it, with no halo.
 *
 * ★ ON THE CRESCENT, NEVER INSIDE IT: a white facet set apart in the dark of
 * the ball, with a halo round it, read as an eye's catchlight; as the
 * crescent's hottest facet it is where the ring's light peaks.
 */
const GLINT = { from: "#fffaf0", to: ember(0.02, 0.03) };
/** At the home screen's 60 a white square still caught the eye alone, so there the glint is the ember's palest amber. */
const GLINT_SMALL = { from: ember(0, 0.09), to: ember(0.03, 0.02) };

/**
 * The far side's dim catches: the ring's spent ember, a deep red, never
 * brown, graded the other way, since the light it holds comes from the
 * ring's bottom-right.
 */
const RED = {
  from: toHex(toLab(0.22, 0.075, 25)),
  to: toHex(toLab(0.29, 0.095, 27)),
};

/** The dark room in a facet: a touch lighter up and toward the key, darker toward the limb. */
function dark(f: Facet, base: number) {
  const n = f.n;
  const r = reflect(n);
  const toKey = (-r[0] + r[1]) / Math.SQRT2;
  return (
    (base + 0.03 * r[1] + 0.025 * toKey + 0.02 * f.wob) * (0.6 + 0.4 * n[2])
  );
}

/** Facets that share a colour (quantised past what an eye can split) share one path. */
function group(items: { d: string; l: number }[]): Paint[] {
  const m = new Map<string, string[]>();
  for (const it of items) {
    const fill = room(Math.round(it.l / 0.006) * 0.006);
    const list = m.get(fill);
    if (list) list.push(it.d);
    else m.set(fill, [it.d]);
  }
  return [...m].map(([fill, ds]) => ({ fill, d: ds.join("") }));
}

type Cut = Crescent & {
  /** Courses from pole to pole. */
  rows: number;
  /** The grout, as a fraction of a course. */
  grout: number;
  /** Each mirror's tilt off true, as a fraction of a course. */
  jitter: number;
  /** The dark room's lightness in a facet. */
  base: number;
  seed: number;
  /** How fast the light falls from the glint to the tips: steeper the more facets share it. */
  ramp: number;
  /** Where along the ember the faintest catch sits (0 amber, 1 the deep ember). */
  tip: number;
  /** Each dark facet graded along the key's axis too (the master only: one element a facet). */
  sheen: boolean;
};

/**
 * THE CUTS FROM 60 UP: eleven courses at the home screen's 60 (fewer, larger
 * facets: five catch the ring), sixteen at 180 and the press kit's sizes
 * (eight), twenty-eight at the master (some twenty, and two dim reds); the
 * light falls faster from the glint the more facets share it.
 *
 * ★ THE REDS ONLY AT THE MASTER: below it a lone red facet on the dark ball
 * read as a recording light, a second mark beside the crescent.
 *
 * ★ EACH CUT'S SEED WAS CHOSEN BY MEASURE, among hundreds: the crescent
 * centred on the key's diagonal, the glint on it, no facet of it parted
 * from the rest by more than a course, every catch within 75 degrees.
 */
function cutAt(size: number): Cut {
  if (size < 120)
    return {
      rows: 11,
      grout: 0.16,
      jitter: 0.06,
      base: 0.2,
      seed: 397,
      lit: 5,
      reds: 0,
      e0: 10,
      width: 30,
      shape: 1.2,
      reach: 72,
      ramp: 0.9,
      tip: 0.5,
      sheen: false,
    };
  if (size < 400)
    return {
      rows: 16,
      grout: 0.13,
      jitter: 0.06,
      base: 0.17,
      seed: 366,
      lit: 8,
      reds: 0,
      e0: 10,
      width: 30,
      shape: 1.2,
      reach: 70,
      ramp: 1.4,
      tip: 0.66,
      sheen: false,
    };
  return {
    rows: 28,
    grout: 0.11,
    jitter: 0.15,
    base: 0.17,
    seed: 362,
    lit: 22,
    reds: 2,
    e0: 10,
    width: 26,
    shape: 1.2,
    reach: 68,
    ramp: 2.2,
    tip: 0.84,
    sheen: true,
  };
}

type BallArt = {
  dark: Paint[];
  sheen: { d: string; o: number }[];
  lit: Glass[];
  bloom: { d: string; blur: number };
};

function build(size: number, R: number): BallArt {
  const cut = cutAt(size);
  const all = facets(R, cut.rows, {
    tilt: 12,
    grout: cut.grout,
    jitter: cut.jitter,
    seed: cut.seed,
  });
  const caught = crescent(all, cut);
  const darks = all.filter((f) => !caught.taken.has(f));
  const lit: Glass[] = [
    ...caught.reds.map((f) => ({ d: poly(f.pts), ...RED })),
    ...caught.lit
      .slice()
      .reverse()
      .map(({ f, heat }, i, list) => ({
        d: poly(f.pts),
        ...(i === list.length - 1
          ? size < 120
            ? GLINT_SMALL
            : GLINT
          : glass(heat, f.wob, cut)),
      })),
  ];
  const facet = (R * Math.PI) / cut.rows;
  return {
    dark: group(darks.map((f) => ({ d: poly(f.pts), l: dark(f, cut.base) }))),
    sheen: cut.sheen
      ? darks.map((f) => ({ d: poly(f.pts), o: 0.75 + 0.25 * f.wob }))
      : [],
    lit,
    // ★ THE CRESCENT GLOWS AS ONE, THE GLINT HAS NO HALO: a soft coral bloom
    // of the whole crescent, half a facet wide, lies under its facets, so
    // the light reads as light and the glint stays one facet of it.
    bloom: {
      d: caught.lit.map(({ f }) => poly(f.pts)).join(""),
      blur: facet * 0.55,
    },
  };
}

/**
 * THE FAVICON CUTS, DRAWN PIXEL BY PIXEL (32 and under): a sphere's facets
 * cannot be projected into a few pixels, so each cut is a graded ball (the
 * dark of the room, lit toward the key) with its crescent drawn on its own
 * size's pixel grid over the ball's square, one character a pixel: `.` the
 * ball, `1` to `6` the ring caught, from a light amber to a coral.
 *
 * ★ NO TEXTURE, NO WHITE: courses of dark facets read as a keypad at 32 and
 * as grit at 16, and a white pixel inside a dark ball read as an eye, so the
 * ball is smooth and its light is the crescent alone, in the ember.
 */
const PIXEL: Record<string, string> = {
  "1": ember(0, 0.04),
  "2": ember(0.06),
  "3": ember(0.18),
  "4": ember(0.32),
  "5": ember(0.45),
  "6": ember(0.58),
};

/**
 * The favicon's 32, a sixteen-pixel ball: four facets of two by two pixels in
 * a crescent round the key, each graded along the key's axis (its top-left
 * pixel the hottest), so they read as lit tiles, never as a display's dots.
 * ★ THE CRESCENT TURNS WITH THE RING: from the crown it steps along, then
 * down and across, then down, the hottest facet the one nearest the key; four
 * facets set on one diagonal read as a slash.
 */
const FAV32 = [
  "................",
  "........45......",
  ".....23.56......",
  ".....34.........",
  "..12............",
  "..23............",
  "................",
  ".45.............",
  ".56.............",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
];

/** The tab's 16, an eight-pixel ball: three pixels of the crescent, amber at the key to coral. */
const FAV16 = [
  "........",
  "..2.....",
  ".3......",
  ".5......",
  "........",
  "........",
  "........",
  "........",
];

/** A pixel map as one path per colour, its runs merged, on the size's own grid. */
function pixels(R: number, size: number, map: string[]): Paint[] {
  const px = 1024 / size;
  const x0 = 512 - R;
  const y0 = 512 - R;
  const m = new Map<string, string[]>();
  map.forEach((row, j) => {
    let i = 0;
    while (i < row.length) {
      const ch = row[i];
      let k = i;
      while (k < row.length && row[k] === ch) k++;
      const fill = PIXEL[ch];
      if (fill) {
        const w = (k - i) * px;
        const d = `M${f1(x0 + i * px)},${f1(y0 + j * px)}h${f1(w)}v${f1(px)}h${f1(-w)}Z`;
        const list = m.get(fill);
        if (list) list.push(d);
        else m.set(fill, [d]);
      }
      i = k;
    }
  });
  return [...m].map(([fill, ds]) => ({ fill, d: ds.join("") }));
}

/**
 * THE RING: today's key-lit ember, unchanged in what it shows, drawn in far
 * fewer elements.
 *
 * ★ THE BAND IS ONE GRADIENT: every colour of the band is a function of one
 * angle, the angle from the key, and the band's light falls with that
 * angle's cosine, which is where a point of the band sits along the key's
 * axis; so one circle stroked with a linear gradient from the top-left to the
 * bottom-right, its stops taken from the ember every 15 degrees (30 at a
 * favicon), draws today's band with no step between wedges for a home screen
 * to show (a band of 60 wedges stepped visibly at 3x). The glow and the
 * corona stay wedges, fewer of them: across a wide annulus a linear gradient
 * varies with the radius too, and under their blur 20 wedges draw what 64 did.
 */
function Ring({ size, uid }: ArtProps) {
  const { o, rD, r0, r1 } = ringAt(size, LIGHT);
  const art = useMemo(() => {
    const glow = (at: number) => LIGHT.glow(at, "room");
    const nGlow = size <= 40 ? 12 : size < 120 ? 20 : size < 400 ? 24 : 48;
    const nCorona = size < 120 ? 12 : size < 400 ? 16 : 32;
    const band = o.band * 1024;
    const stops: { at: number; fill: string }[] = [];
    for (let d = 0; d <= 180; d += size <= 40 ? 30 : 15)
      stops.push({
        at: (1 - Math.cos(rad(d))) / 2,
        fill: LIGHT.band(KEY + d, "room", o.floor),
      });
    return {
      corona: o.coronaOp ? wedges(512, rD, r1 + band * 4, nCorona, glow) : [],
      glow: o.glow ? wedges(512, r0, r1 + band * 0.5, nGlow, glow) : [],
      stops,
    };
  }, [size, o.floor, o.coronaOp, o.glow, o.band, rD, r0, r1]);
  const k = rad(KEY);
  const rm = (r0 + r1) / 2;
  return (
    <>
      <defs>
        <linearGradient
          id={`${uid}rb`}
          gradientUnits="userSpaceOnUse"
          x1={512 + rm * Math.sin(k)}
          y1={512 - rm * Math.cos(k)}
          x2={512 - rm * Math.sin(k)}
          y2={512 + rm * Math.cos(k)}
        >
          {art.stops.map((s) => (
            <stop key={s.at} offset={s.at} stopColor={s.fill} />
          ))}
        </linearGradient>
        {art.glow.length ? (
          <filter id={`${uid}rg`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation={o.glowBlur * 1024} />
          </filter>
        ) : null}
        {art.corona.length ? (
          <filter id={`${uid}rk`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation={o.corona * 1024} />
          </filter>
        ) : null}
      </defs>
      {art.corona.length ? (
        <g filter={`url(#${uid}rk)`} opacity={o.coronaOp}>
          {art.corona.map((w, i) => (
            <path key={i} d={w.d} fill={w.fill} fillOpacity={w.opacity} />
          ))}
        </g>
      ) : null}
      {art.glow.length ? (
        <g filter={`url(#${uid}rg)`} opacity={o.glow}>
          {art.glow.map((w, i) => (
            <path key={i} d={w.d} fill={w.fill} fillOpacity={w.opacity} />
          ))}
        </g>
      ) : null}
      <circle
        cx="512"
        cy="512"
        r={rm}
        fill="none"
        stroke={`url(#${uid}rb)`}
        strokeWidth={r1 - r0}
      />
    </>
  );
}

/**
 * THE BALL: its grout (the dark under every facet, lit a little from the
 * top-left like the puck it replaces), the dark facets, the crescent's bloom
 * under the lit facets so their edges stay crisp, and the lit facets; at a
 * favicon's sizes, a smooth graded ball and its pixel crescent.
 */
function Ball({ size, uid }: ArtProps) {
  const R = ringAt(size, LIGHT).rD;
  const fav = size <= 40;
  const art = useMemo(() => (fav ? null : build(size, R)), [fav, size, R]);
  const px = useMemo(
    () => (fav ? pixels(R, size, size <= 20 ? FAV16 : FAV32) : []),
    [fav, size, R],
  );
  return (
    <>
      <defs>
        {fav ? (
          // A favicon's ball is lit a step brighter at the key, so its
          // volume shows in a few pixels.
          <radialGradient id={`${uid}mg`} cx="0.34" cy="0.3" r="0.85">
            <stop offset="0" stopColor="#2c2c33" />
            <stop offset="0.55" stopColor="#151518" />
            <stop offset="1" stopColor="#070708" />
          </radialGradient>
        ) : (
          <radialGradient id={`${uid}mg`} cx="0.36" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#111114" />
            <stop offset="1" stopColor="#030304" />
          </radialGradient>
        )}
        {art ? (
          <>
            <clipPath id={`${uid}mc`}>
              <circle cx="512" cy="512" r={R} />
            </clipPath>
            <filter
              id={`${uid}mb`}
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feGaussianBlur stdDeviation={art.bloom.blur} />
            </filter>
          </>
        ) : null}
        {art?.sheen.length ? (
          <linearGradient id={`${uid}ms`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.07" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="1" stopColor="#000000" stopOpacity="0.18" />
          </linearGradient>
        ) : null}
        {art?.lit.map((g, i) => (
          <linearGradient
            key={i}
            id={`${uid}m${i}`}
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop offset="0" stopColor={g.from} />
            <stop offset="1" stopColor={g.to} />
          </linearGradient>
        ))}
      </defs>
      <circle cx="512" cy="512" r={R} fill={`url(#${uid}mg)`} />
      {fav ? (
        px.map((p, i) => <path key={i} d={p.d} fill={p.fill} />)
      ) : art ? (
        <g clipPath={`url(#${uid}mc)`}>
          {art.dark.map((p, i) => (
            <path key={`d${i}`} d={p.d} fill={p.fill} />
          ))}
          {art.sheen.map((p, i) => (
            <path
              key={`s${i}`}
              d={p.d}
              fill={`url(#${uid}ms)`}
              opacity={f2(p.o)}
            />
          ))}
          <path
            d={art.bloom.d}
            fill={ember(0.34)}
            opacity={0.75}
            filter={`url(#${uid}mb)`}
          />
          {art.lit.map((g, i) => (
            <path key={`l${i}`} d={g.d} fill={`url(#${uid}m${i})`} />
          ))}
        </g>
      ) : null}
    </>
  );
}

function MirrorballArt({ size, uid }: ArtProps) {
  return (
    <>
      <Ring size={size} uid={uid} />
      <Ball size={size} uid={uid} />
    </>
  );
}

/**
 * A convex polygon pulled in by `d` on every edge (the grout knocked out at
 * one width wherever the facet sits), or nothing if the facet is too thin to
 * keep a face.
 */
function inset(pts: Pt[], d: number): Pt[] | null {
  const n = pts.length;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % n];
    area += x0 * y1 - x1 * y0;
  }
  const sgn = area > 0 ? 1 : -1;
  const lines = pts.map(([x0, y0], i) => {
    const [x1, y1] = pts[(i + 1) % n];
    const len = Math.hypot(x1 - x0, y1 - y0) || 1;
    // The inward normal, by the polygon's winding.
    const nx = (-(y1 - y0) / len) * sgn;
    const ny = ((x1 - x0) / len) * sgn;
    return { x: x0 + nx * d, y: y0 + ny * d, dx: x1 - x0, dy: y1 - y0 };
  });
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = lines[(i + n - 1) % n];
    const b = lines[i];
    const den = a.dx * b.dy - a.dy * b.dx;
    if (Math.abs(den) < 1e-9) return null;
    const t = ((b.x - a.x) * b.dy - (b.y - a.y) * b.dx) / den;
    out.push([a.x + a.dx * t, a.y + a.dy * t]);
  }
  let back = 0;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = out[i];
    const [x1, y1] = out[(i + 1) % n];
    back += x0 * y1 - x1 * y0;
  }
  return back * sgn > 0 ? out : null;
}

/**
 * THE MARK IN ONE COLOUR: the ring, and inside it the ball as one solid
 * disc with its lit crescent's facets knocked out, the ground showing through
 * where the light is caught.
 *
 * ★ NOT A GLOBE, NOT A MOON, NOT A RECORD BUTTON: a field of tiles read as a
 * globe at a watermark's size, a plain disc in a ring is a record button and
 * one crescent cut whole is a moon; so the disc is solid but for the five
 * facets that catch the light, each its own tile with solid grout between,
 * in perspective on the sphere. A ball of seven courses, the fewest whose
 * five tiles still turn round the key (six left them a cluster), each knocked
 * out to three pixels at a watermark's 26; seen a little more from below
 * than the icon's ball, so the crescent arcs from the crown down the left.
 */
const MONO = {
  /** The ring's outer and inner edges and the ball's radius (1024 box). */
  ro: 384,
  ri: 330,
  rb: 292,
  rows: 7,
  tilt: 18,
  e0: 16,
  seed: 58,
  lit: 5,
  width: 60,
  /** The grout left solid round each hole, a side. */
  grout: 15,
};

function monoPath() {
  const all = facets(MONO.rb, MONO.rows, {
    tilt: MONO.tilt,
    grout: 0,
    jitter: 0,
    seed: MONO.seed,
  });
  const { lit } = crescent(all, {
    lit: MONO.lit,
    reds: 0,
    e0: MONO.e0,
    width: MONO.width,
    shape: 1.2,
    reach: 72,
  });
  const holes = lit
    .map(({ f }) => inset(f.pts, MONO.grout))
    .filter((p): p is Pt[] => p !== null)
    .map(poly);
  return [ring(MONO.ro), ring(MONO.ri), ring(MONO.rb), ...holes].join("");
}

/** The ring and the ball are one path, so the mark is measured by the ring's outer edge. */
function MirrorballMono({ color }: { color: string }) {
  const d = useMemo(() => monoPath(), []);
  return <path d={d} fill={color} fillRule="evenodd" />;
}

export const MIRRORBALL: Take = { Art: MirrorballArt, Mono: MirrorballMono };
