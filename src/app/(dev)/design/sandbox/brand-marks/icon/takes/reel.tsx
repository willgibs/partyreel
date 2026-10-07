"use client";

import { useMemo } from "react";

import { emberAt, KEY, type Lab, mix, TILE_MIX, toHex, toLab } from "../light";
import { type ArtProps, type Take, wedges } from "../parts";

/**
 * THE REEL: the ring holds the name. The shutter's puck becomes a film reel's
 * face, a dark anodised flange with five windows cut round a hub, held in
 * front of one warm light. The light is seen only where the reel lets it
 * through: round its rim, which is the ring, and through its windows,
 * near-white at the lip of the window the key falls on, amber through its
 * neighbours, coral through the ones turned away. One lamp behind it, one
 * gradient, so the whole icon is lit one way.
 *
 * ★ ONE LIGHT, NEVER FIVE PAINTS: the windows are holes cut in the face, and
 * what shows through them is one disc of light behind the whole reel, its
 * gradient centred on a lamp hidden behind the metal at the key; so a window
 * shows a slice of the same light its neighbours do, and the ring is that
 * light's own edge. Each window lit with a colour of its own (the lane's
 * draft) read as a painter's palette, and so did the light let run its whole
 * ember across the windows (amber, coral, coral, red, red): it is eased now,
 * so the windows stay within amber and coral.
 *
 * ★ ROUND WINDOWS, NOT THE ALBUM'S TILES (the creative director asked for
 * both, drawn at every size): five rounded squares set round the hub read as
 * a flower's petals on the home screen and as tumbling dice at the master,
 * the key's tile a diamond and the rest tilted; five round holes are a reel at
 * a glance, from a tab to a poster and in one colour.
 */

const C = 512;
const rad = (deg: number) => (deg * Math.PI) / 180;
const f = (n: number) => n.toFixed(1);
const clamp = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => {
  const u = clamp(x);
  return u * u * (3 - 2 * u);
};

/** A point `r` from the centre at `deg` (0 at the crown, clockwise). */
function at(r: number, deg: number): [number, number] {
  return [C + r * Math.sin(rad(deg)), C - r * Math.cos(rad(deg))];
}

/** The key's direction, a unit vector toward the top-left. */
const UX = Math.sin(rad(KEY));
const UY = -Math.cos(rad(KEY));

/** A circle as a closed path, so a path can hold holes. */
function circle(cx: number, cy: number, r: number) {
  return `M${f(cx - r)},${f(cy)}a${f(r)},${f(r)} 0 1,0 ${f(2 * r)},0a${f(r)},${f(r)} 0 1,0 ${f(-2 * r)},0Z`;
}

/** A square of side `s` with corners rounded by `r`, centred on (cx, cy). */
function square(cx: number, cy: number, s: number, r: number) {
  const h = s / 2 - r;
  return `M${f(cx - h)},${f(cy - s / 2)}h${f(2 * h)}a${f(r)},${f(r)} 0 0,1 ${f(r)},${f(r)}v${f(2 * h)}a${f(r)},${f(r)} 0 0,1 ${f(-r)},${f(r)}h${f(-2 * h)}a${f(r)},${f(r)} 0 0,1 ${f(-r)},${f(-r)}v${f(-2 * h)}a${f(r)},${f(r)} 0 0,1 ${f(r)},${f(-r)}Z`;
}

/**
 * The five windows, the first on the key: their centres in the box, their
 * half-width, and whether each is a block of pixels (or a disc).
 */
type Windows = {
  centres: readonly (readonly [number, number])[];
  half: number;
  block: boolean;
};

/**
 * ★ THE TAB'S WINDOWS, HINTED TO ITS 16 PIXEL GRID (64 of the box to a pixel,
 * each window a block of two pixels by two, here by its top-left pixel): at a
 * true 16 device pixels five round windows fused into a spoked wheel, and
 * every way of drawing fewer failed (three read as a face or a bowling ball,
 * four as a button, the key's window alone as an eye, the windows as one lit
 * band as a wheel or a target). Set on the grid, each window lights its four
 * pixels whole: five lit points round a dark hub inside the ring, the reel
 * still. They sit as near a pentagon as the grid allows, mirrored about the
 * key's diagonal so the light falls on them as it does on the master's, with
 * a pixel of rim between them and the ring; their corners are rounded so a
 * sharp tab (the same drawing at 32 pixels) shows five round dots.
 */
const TAB: Windows = {
  centres: [
    [5, 5],
    [8, 4],
    [10, 7],
    [7, 10],
    [4, 8],
  ].map(([x, y]) => [(x + 1) * 64, (y + 1) * 64] as const),
  half: 64,
  block: true,
};
const TAB_CORNER = 32;

/**
 * ★ THE FAVICON'S 32, HINTED TOO (32 of the box to a pixel): five discs two
 * and a half pixels across the radius, each centred on a pixel's centre, so
 * every window falls on the grid alike and draws crisp; set freely, each
 * blurred its own way and the five ran together.
 */
const FAV: Windows = {
  centres: [
    [11, 11],
    [19, 10],
    [22, 17],
    [17, 22],
    [10, 19],
  ].map(([x, y]) => [(x + 0.5) * 32, (y + 0.5) * 32] as const),
  half: 80,
  block: false,
};

/** Five round windows, centred `dist` of the reel out and `win` of it across the radius. */
function discs(reel: number, dist: number, win: number): Windows {
  return {
    centres: Array.from({ length: 5 }, (_, i) => at(reel * dist, KEY + i * 72)),
    half: reel * win,
    block: false,
  };
}

/**
 * ONE CUT (the 1024 box): the light's radius (the band's outer edge) and the
 * reel's (its inner edge); the windows; the hub's boss and its drive
 * (fractions of the reel, 0 draws none); how deep each window's wall shows;
 * the spun sheen's wedges; the rim's engraved step (its highlight, 0 draws
 * none); the spill on the metal round the openings (the far windows', the
 * key's) and its blur; the fine bevels; the light's falloff (how long it
 * holds amber, where it reaches its deep end, where it starts to spend and
 * how much its far side keeps); the glow and the corona on the tile.
 */
type Cut = {
  light: number;
  reel: number;
  windows: Windows;
  hub: number;
  drive: number;
  wall: number;
  sheen: number;
  step: number;
  bloom: readonly [number, number];
  bloomBlur: number;
  fine: boolean;
  ease: number;
  deep: number;
  spend: number;
  floor: number;
  glow: number;
  glowBlur: number;
  corona: number;
  coronaBlur: number;
};

/**
 * THE CUTS, BY DRAWN SIZE, each the whole set. Where a size really lives
 * decides its cut, as the house's own ring does: a phone shows the 180 bitmap
 * at about 60 points, so everything under 200 wears the home screen's cut.
 */
function cut(size: number): Cut {
  // THE TAB (16): the windows hinted to the grid (`TAB`), round a heavy ring
  // (the house's own tab ring is this heavy), the far side kept lit so the
  // ring closes, never a crescent.
  if (size <= 20)
    return {
      light: 456,
      reel: 352,
      windows: TAB,
      hub: 0,
      drive: 0,
      wall: 0,
      sheen: 0,
      step: 0,
      bloom: [0, 0],
      bloomBlur: 0,
      fine: false,
      ease: 1.6,
      deep: 1,
      spend: 0.62,
      floor: 0.6,
      glow: 0,
      glowBlur: 0,
      corona: 0,
      coronaBlur: 0,
    };
  // THE FAVICON'S 32: five round windows resolve here, hinted to the grid
  // (`FAV`), round a ring a touch slimmer, a little glow at the key.
  if (size <= 40)
    return {
      light: 436,
      reel: 346,
      windows: FAV,
      hub: 0,
      drive: 0,
      wall: 0,
      sheen: 0,
      step: 0,
      bloom: [0, 0],
      bloomBlur: 0,
      fine: false,
      ease: 2,
      deep: 0.95,
      spend: 0.7,
      floor: 0.5,
      glow: 0.4,
      glowBlur: 30,
      corona: 0,
      coronaBlur: 0,
    };
  // THE HOME SCREEN (60, and the 180 bitmap a phone shows at about 60
  // points; the press kit's 150 and 184 wear it too): a band a third heavier
  // than the master's, the far side a visible ember, the walls deeper and the
  // spill kept; the fine bevels only where the drawing has the pixels for
  // them, and no sheen (its wedges show as rays at 180).
  if (size < 200)
    return {
      light: 334,
      reel: 290,
      windows: discs(290, 0.56, 0.26),
      hub: 0.21,
      drive: 0.13,
      wall: 11,
      sheen: 0,
      step: 0,
      bloom: [0.3, 0.45],
      bloomBlur: 14,
      fine: size >= 120,
      ease: 2.4,
      deep: 0.95,
      spend: 0.74,
      floor: 0.3,
      glow: 0.8,
      glowBlur: 34,
      corona: 0.3,
      coronaBlur: 50,
    };
  // THE MASTER (1024, and the phone sheet's 343): the spun sheen (its
  // wedges fine and blurred enough never to show as rays), the rim's step,
  // the far side spent to a deep ember.
  return {
    light: 318,
    reel: 284,
    windows: discs(284, 0.56, 0.26),
    hub: 0.21,
    drive: 0.12,
    wall: 8,
    sheen: 90,
    step: 0.22,
    bloom: [0.38, 0.55],
    bloomBlur: 15,
    fine: true,
    ease: 2.6,
    deep: 0.95,
    spend: 0.78,
    floor: 0.18,
    glow: 0.9,
    glowBlur: 33,
    corona: 0.4,
    coronaBlur: 56,
  };
}

/**
 * ★ THE LAMP, HIDDEN BEHIND THE METAL BETWEEN THE KEY'S WINDOW AND THE RIM
 * (this far across that bridge, from the window's lip toward the rim). Its
 * spread is the house ember on the disc behind the whole reel; its white-hot
 * core, a pool no wider than the key's window, is seen only through that
 * window: near-white at its lip, paling the window's near half to amber. The
 * core is the icon's one near-white and no one sees it whole. ★ The ring
 * never takes it: the core lies inside the reel's edge, so the band at the key
 * is the ember's amber, as the house's own ring is; drawn as one falloff with
 * the band, the core either whitened the ring at the key (the creative
 * director's LAMP 0.85 sat the lamp 14 from the band) or, kept off the band,
 * left the key's window one flat amber.
 */
const SEAT = 0.25;
const HOT = toLab(0.95, 0.07, 86);

/** The core's falloff, its opacity from the lamp (0) to its edge (1). */
const POOL = [
  { o: 0, a: 1 },
  { o: 0.2, a: 0.9 },
  { o: 0.45, a: 0.55 },
  { o: 0.7, a: 0.2 },
  { o: 1, a: 0 },
];

/**
 * ★ THE SPILL LEANS CORAL, this far along the ember from the light it spills,
 * as the house's glow does and as film's own halation does: the light's
 * amber thin over the face's graphite read as an olive haze, not as light.
 */
const LEAN = 0.45;

/**
 * The light behind the reel at `u` (0 at the lamp, 1 at the far rim): the
 * house ember, eased so it holds amber round the key (the ring amber for 60
 * degrees either side of it) before it turns coral and reaches its deep end at
 * `deep`, spending toward the tile from `spend` to `floor` at the far rim.
 * `warm` moves it along the ember (the spill's lean). As the house's ring
 * does, lightness falls with the spend and chroma only by its square root, so
 * the far side is a deep ember, never brown.
 */
function lightLab(u: number, k: Cut, warm = 0): Lab {
  const { ease, deep, spend, floor } = k;
  const lamp = emberAt(Math.min(1, Math.pow(clamp(u / deep), ease) + warm));
  const dim = 1 - (1 - floor) * smooth((u - spend) / (1 - spend));
  const dc = Math.sqrt(dim);
  const tile = TILE_MIX.room;
  return [
    tile[0] + (lamp[0] - tile[0]) * dim,
    tile[1] + (lamp[1] - tile[1]) * dc,
    tile[2] + (lamp[2] - tile[2]) * dc,
  ];
}

/** The core's opacity `d` from the lamp, for a pool `r` wide. */
function poolAt(d: number, r: number) {
  const x = d / r;
  for (let i = 1; i < POOL.length; i++) {
    const A = POOL[i - 1];
    const B = POOL[i];
    if (x <= B.o) return A.a + ((B.a - A.a) * (x - A.o)) / (B.o - A.o);
  }
  return 0;
}

/** The glow on the tile at `t`: leaning coral (amber thin over graphite turns olive), gathered at the key. */
function glowAt(t: number) {
  return {
    c: toHex(emberAt(Math.min(0.6, 0.25 + t))),
    a: Math.pow((Math.cos(Math.PI * t * t) + 1) / 2, 3.5),
  };
}

const HI = toHex(toLab(0.93, 0.05, 75));
const SHEEN = toHex(toLab(0.9, 0.02, 70));
const METAL: Lab = toLab(0.15, 0.004, 286);

/** The light's stops, close enough that no step shows between two. */
const OFFSETS = Array.from({ length: 25 }, (_, i) => i / 24);

function build(size: number) {
  const k = cut(size);
  const R = k.reel;
  const { centres, half, block } = k.windows;
  const outline = (cx: number, cy: number, grow = 0) =>
    block
      ? square(cx, cy, 2 * (half + grow), TAB_CORNER + grow)
      : circle(cx, cy, half + grow);
  // The lamp: on the key's line, across the bridge from the key window's lip.
  const edge = Math.hypot(centres[0][0] - C, centres[0][1] - C) + half;
  const rho = edge + SEAT * (R - edge);
  const lx = C + UX * rho;
  const ly = C + UY * rho;
  const reach = k.light + rho;
  // The core's pool: about the key window's own width.
  const pool = 1.9 * half;
  const light = (u: number, warm = 0) => lightLab(u, k, warm);
  const uAt = (x: number, y: number) => Math.hypot(x - lx, y - ly) / reach;
  /** What shows at a point inside the reel's edge: the ember, paled by the core. */
  const seen = (x: number, y: number) =>
    mix(light(uAt(x, y)), HOT, poolAt(Math.hypot(x - lx, y - ly), pool));
  const us = centres.map(([cx, cy]) => uAt(cx, cy));
  const uKey = us[0];
  const uFar = Math.max(...us);
  const windows = centres.map(([cx, cy], i) => {
    // ★ THE WALL IS ON THE KEY'S SIDE OF EACH WINDOW: seen a hair from the
    // bottom-right, a hole shows the wall under its top-left lip, in shadow,
    // its back edge catching the light that comes through. Drawn on the far
    // side instead, the same sliver is a coin's rim and the window a raised
    // disc. The back opening is the front one moved away from the key; the
    // wall is drawn under the face, oversized, so the face's own edge cuts
    // it and no hair of light leaks along a shared seam.
    const bx = cx - UX * k.wall;
    const by = cy - UY * k.wall;
    // The back edge's nearest point to the lamp: what the lip catches.
    const lip = seen(bx + UX * half, by + UY * half);
    const near = uFar > uKey ? (uFar - us[i]) / (uFar - uKey) : 1;
    return {
      hole: outline(cx, cy),
      rim: outline(cx, cy, 1.5),
      wall: outline(cx, cy, 4) + outline(bx, by),
      back: outline(bx, by),
      // The wall shades from the front opening, dark, to its back edge.
      w0: [cx + UX * (half + 4), cy + UY * (half + 4)] as const,
      w1: [bx + UX * half, by + UY * half] as const,
      lip: toHex(lip),
      shade: toHex(mix(METAL, lip, 0.45)),
      far: toHex(light(Math.min(1, us[i] + half / reach))),
      // ★ THE SPILL, GRADED BY THE LIGHT: most round the key's window, where
      // the light is hottest, least round the far ones.
      bloom: k.bloom[0] + (k.bloom[1] - k.bloom[0]) * near,
      near,
    };
  });
  // The spun finish of a turned face: a soft highlight streaked along the
  // key's line through the hub, brighter on the key's side.
  const sheen = k.sheen
    ? wedges(C, 0, R, k.sheen, (deg) => {
        const c = Math.cos(rad(deg - KEY));
        const near = Math.pow(Math.max(0, c), 4);
        const far = Math.pow(Math.max(0, -c), 4);
        return {
          fill: SHEEN,
          opacity: Math.round((0.075 * near + 0.035 * far) * 1000) / 1000,
        };
      })
    : [];
  const s = R * k.drive;
  return {
    k,
    R,
    lx,
    ly,
    reach,
    pool,
    windows,
    face: circle(C, C, R) + windows.map((w) => w.hole).join(""),
    band: circle(C, C, k.light) + circle(C, C, R),
    sheen,
    stops: OFFSETS.map((o) => ({ o, c: toHex(light(o)) })),
    spill: OFFSETS.map((o) => ({ o, c: toHex(light(o, LEAN)) })),
    pools: POOL.map((p) => ({ ...p, c: toHex(HOT) })),
    glows: Array.from({ length: 9 }, (_, i) => ({
      o: i / 8,
      ...glowAt(i / 8),
    })),
    // ★ A SQUARE DRIVE, THE 16 MM REEL'S OWN: a round bore with one keyway
    // slot read as a magnifying glass or a lock's keyhole at every size it
    // showed (round three); the square is the spindle's, and reads as
    // machined.
    drive: s ? square(C, C, s, s * 0.16) : "",
  };
}

function ReelArt({ size, uid }: ArtProps) {
  const g = useMemo(() => build(size), [size]);
  const { k, R } = g;
  const u = (s: string) => `${uid}${s}`;
  const hub = R * k.hub;
  const bloom = k.bloom[1] > 0;
  return (
    <>
      <defs>
        <radialGradient
          id={u("rl")}
          gradientUnits="userSpaceOnUse"
          cx={g.lx}
          cy={g.ly}
          r={g.reach}
        >
          {g.stops.map((s) => (
            <stop key={s.o} offset={s.o} stopColor={s.c} />
          ))}
        </radialGradient>
        <radialGradient
          id={u("rq")}
          gradientUnits="userSpaceOnUse"
          cx={g.lx}
          cy={g.ly}
          r={g.pool}
        >
          {g.pools.map((s) => (
            <stop key={s.o} offset={s.o} stopColor={s.c} stopOpacity={s.a} />
          ))}
        </radialGradient>
        <clipPath id={u("rd")}>
          <circle cx={C} cy={C} r={R} />
        </clipPath>
        {bloom ? (
          <radialGradient
            id={u("rn")}
            gradientUnits="userSpaceOnUse"
            cx={g.lx}
            cy={g.ly}
            r={g.reach}
          >
            {g.spill.map((s) => (
              <stop key={s.o} offset={s.o} stopColor={s.c} />
            ))}
          </radialGradient>
        ) : null}
        <radialGradient
          id={u("rg")}
          gradientUnits="userSpaceOnUse"
          cx={g.lx}
          cy={g.ly}
          r={g.reach}
        >
          {g.glows.map((s) => (
            <stop key={s.o} offset={s.o} stopColor={s.c} stopOpacity={s.a} />
          ))}
        </radialGradient>
        <radialGradient id={u("rf")} cx="0.34" cy="0.28" r="0.9">
          <stop offset="0" stopColor="#1e1e23" />
          <stop offset="0.8" stopColor="#0a0a0c" />
        </radialGradient>
        <radialGradient id={u("rh")} cx="0.34" cy="0.28" r="0.9">
          <stop offset="0" stopColor="#25252b" />
          <stop offset="1" stopColor="#0e0e11" />
        </radialGradient>
        {k.wall
          ? g.windows.map((w, i) => (
              <linearGradient
                key={i}
                id={u(`rw${i}`)}
                gradientUnits="userSpaceOnUse"
                x1={w.w0[0]}
                y1={w.w0[1]}
                x2={w.w1[0]}
                y2={w.w1[1]}
              >
                <stop offset="0" stopColor="#0b0b0d" />
                <stop offset="1" stopColor={w.shade} />
              </linearGradient>
            ))
          : null}
        {/* A raised edge: lit where it faces the key, shadowed where it turns away. */}
        <linearGradient id={u("rr")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={HI} stopOpacity="0.5" />
          <stop offset="0.3" stopColor={HI} stopOpacity="0.1" />
          <stop offset="0.5" stopColor={HI} stopOpacity="0" />
          <stop offset="0.8" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.4" />
        </linearGradient>
        {/* A cut edge, the other way round: its far lip catches the key. */}
        <linearGradient id={u("ri")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.5" />
          <stop offset="0.4" stopColor="#000" stopOpacity="0" />
          <stop offset="0.62" stopColor={HI} stopOpacity="0" />
          <stop offset="1" stopColor={HI} stopOpacity="0.55" />
        </linearGradient>
        {/* Each window's far lip, catching the light that comes through it. */}
        {k.fine
          ? g.windows.map((w, i) => (
              <linearGradient
                key={i}
                id={u(`rp${i}`)}
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0" stopColor="#000" stopOpacity="0.5" />
                <stop offset="0.4" stopColor="#000" stopOpacity="0" />
                <stop offset="0.62" stopColor={w.far} stopOpacity="0" />
                <stop
                  offset="1"
                  stopColor={w.far}
                  stopOpacity={0.45 + 0.3 * w.near}
                />
              </linearGradient>
            ))
          : null}
        {k.step ? (
          <linearGradient id={u("rt")} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#000" stopOpacity="0.45" />
            <stop offset="0.4" stopColor="#000" stopOpacity="0" />
            <stop offset="0.62" stopColor={HI} stopOpacity="0" />
            <stop offset="1" stopColor={HI} stopOpacity={k.step} />
          </linearGradient>
        ) : null}
        <clipPath id={u("rc")}>
          <path d={g.face} clipRule="evenodd" />
        </clipPath>
        {k.glow ? (
          <filter id={u("rb")} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={k.glowBlur} />
          </filter>
        ) : null}
        {k.corona ? (
          <filter id={u("rk")} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={k.coronaBlur} />
          </filter>
        ) : null}
        {k.sheen ? (
          <filter id={u("rs")} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={7} />
          </filter>
        ) : null}
        {bloom ? (
          <filter id={u("rm")} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={k.bloomBlur} />
          </filter>
        ) : null}
      </defs>
      {k.corona ? (
        <circle
          cx={C}
          cy={C}
          r={k.light * 1.06}
          fill={`url(#${u("rg")})`}
          filter={`url(#${u("rk")})`}
          opacity={k.corona}
        />
      ) : null}
      {k.glow ? (
        <circle
          cx={C}
          cy={C}
          r={k.light}
          fill={`url(#${u("rg")})`}
          filter={`url(#${u("rb")})`}
          opacity={k.glow}
        />
      ) : null}
      {/* The light behind the reel, one disc: its rim is the ring. */}
      <circle cx={C} cy={C} r={k.light} fill={`url(#${u("rl")})`} />
      {/* The lamp's core, inside the reel's edge: seen only through the key's window. */}
      <circle
        cx={g.lx}
        cy={g.ly}
        r={g.pool}
        fill={`url(#${u("rq")})`}
        clipPath={`url(#${u("rd")})`}
      />
      {k.wall
        ? g.windows.map((w, i) => (
            <g key={i}>
              <path
                d={w.wall}
                fill={`url(#${u(`rw${i}`)})`}
                fillRule="evenodd"
              />
              {/* The back edge, catching the light that comes through. */}
              <path
                d={w.back}
                fill="none"
                stroke={w.lip}
                strokeWidth={k.fine ? 2.5 : 3}
              />
            </g>
          ))
        : null}
      {/* The reel's face, its windows cut through. */}
      <path d={g.face} fill={`url(#${u("rf")})`} fillRule="evenodd" />
      {g.sheen.length || k.step || bloom ? (
        <g clipPath={`url(#${u("rc")})`}>
          {g.sheen.length ? (
            <g filter={`url(#${u("rs")})`}>
              {g.sheen.map((w, i) => (
                <path key={i} d={w.d} fill={w.fill} fillOpacity={w.opacity} />
              ))}
            </g>
          ) : null}
          {k.step ? (
            <circle
              cx={C}
              cy={C}
              r={R - 17}
              fill="none"
              stroke={`url(#${u("rt")})`}
              strokeWidth="2.5"
            />
          ) : null}
          {/* ★ The light spilling over the face's edges, as a lens sees light
              behind a cut-out: clipped to the face, so it warms the metal round
              each opening and wraps the rim, and never fogs the walls inside. */}
          {bloom ? (
            <g filter={`url(#${u("rm")})`}>
              <path
                d={g.band}
                fill={`url(#${u("rn")})`}
                fillRule="evenodd"
                opacity={k.bloom[1] * 0.8}
              />
              {g.windows.map((w, i) => (
                <path
                  key={i}
                  d={w.hole}
                  fill={`url(#${u("rn")})`}
                  opacity={w.bloom}
                />
              ))}
            </g>
          ) : null}
        </g>
      ) : null}
      {k.fine
        ? g.windows.map((w, i) => (
            <path
              key={i}
              d={w.rim}
              fill="none"
              stroke={`url(#${u(`rp${i}`)})`}
              strokeWidth="3"
            />
          ))
        : null}
      {k.fine ? (
        <circle
          cx={C}
          cy={C}
          r={R - 1.5}
          fill="none"
          stroke={`url(#${u("rr")})`}
          strokeWidth="3"
        />
      ) : null}
      {hub ? (
        <>
          <circle
            cx={C - UX * 5}
            cy={C - UY * 5}
            r={hub + 1}
            fill="#000"
            opacity="0.5"
          />
          <circle cx={C} cy={C} r={hub} fill={`url(#${u("rh")})`} />
          {k.fine ? (
            <>
              <circle
                cx={C}
                cy={C}
                r={hub - 1.5}
                fill="none"
                stroke={`url(#${u("rr")})`}
                strokeWidth="3"
              />
              <circle
                cx={C}
                cy={C}
                r={hub * 0.72}
                fill="none"
                stroke={`url(#${u("ri")})`}
                strokeWidth="2.5"
              />
            </>
          ) : null}
        </>
      ) : null}
      {g.drive ? <path d={g.drive} fill="#050506" /> : null}
      {g.drive && k.fine ? (
        <path
          d={g.drive}
          fill="none"
          stroke={`url(#${u("ri")})`}
          strokeWidth="3"
        />
      ) : null}
    </>
  );
}

/**
 * THE REEL IN ONE COLOUR: the ring, a gap apart, round the reel's face with
 * its windows and its drive knocked out. ★ The ring is a filled annulus, never
 * a stroke: the press kit fits every mark to its own furthest reach, which it
 * measures from the drawing's outline, and a stroke's outline is its centre
 * line, so its outer half was cut flat against the box. ★ The gap to the ring
 * is 60 of the box (the creative director's pass: at 40 it was a single pixel
 * at 26 px), and the ring, the gap, the rim and the spokes are of a weight,
 * each near two pixels at 26 px over footage.
 */
function ReelMono({ color }: { color: string }) {
  const d = useMemo(() => {
    const R = 320;
    const holes = Array.from({ length: 5 }, (_, i) => {
      const [cx, cy] = at(R * 0.56, KEY + i * 72);
      return circle(cx, cy, R * 0.24);
    }).join("");
    return (
      circle(C, C, 444) +
      circle(C, C, 380) +
      circle(C, C, R) +
      holes +
      square(C, C, R * 0.2, R * 0.04)
    );
  }, []);
  return <path d={d} fill={color} fillRule="evenodd" />;
}

export const REEL: Take = { Art: ReelArt, Mono: ReelMono };
