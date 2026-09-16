import { CANVAS, type Mode } from "@/components/lab";

import { FRAMES } from "./shared";
import { STREAM_IDS, type StreamId } from "./stream-ids";

/**
 * THE FOUR COMPOSITIONS (round seven, 2026-09-16): one engine, four lockups.
 *
 * Will answered round six in chat and it is the ledger's `stream=none`: "I think
 * I liked the more symmetrical approach more than the variants we're using to
 * scatter the photos as they stream out, similar to our original reference
 * example." Two references came with it and one more ask. Melius: the album as
 * one symmetric band through the middle, a speck at the centre and growing
 * outward, the outer frames turned so the band curls toward the reader like the
 * inside of a cylinder. Cosmos: the photographs in a ring around a centred
 * lockup, each tilted a little, "where in our version we could place the QR
 * code above the H1 and center the image rotation around the QR code rather
 * than the H1 content." And "a variant where [we] don't split the H1 and other
 * hero content with the QR, but rather have it above/below."
 *
 * So round six's four scatterings (mirror, phrase, settle, ribbon; git holds
 * them at bf1ee166) left, and the four here are ONE stream shape drawn twice:
 *
 *   band         the Melius band, split as today: headline above, copy below
 *   orbit        the Cosmos ring around the code, the block hung under the code
 *   stack-above  the band with the code above the whole block
 *   stack-below  the band with the code below the whole block
 *
 * ★ A COMPOSITION IS A STREAM PLUS A LOCKUP. Round six's engine placed every
 * frame off two arms and solved the type's clear lane above and below one axis
 * at the canvas centre. What round seven generalised is exactly three things:
 * a turn that can grow with the distance (the band's curl), a POLAR placement
 * for a stream whose stations are an angle and a radius from the code (the
 * orbit), and a LOCKUP with its own axis, so the code can sit above or below
 * the block rather than between the headline and the rest. `placeAt` is still
 * the one description everything reads: the loop, the rest state, the DOM box,
 * the clear lane, the facts and the tests.
 *
 * ★ NOTHING IS DEALT, still. Every value a card carries is a step in a short
 * declared cycle (a station table, a roll table, an aspect table), which is
 * what let round six answer "the random stream feels worse than a more
 * polished one", and it holds here: `streams.test.ts` refuses a hash.
 *
 * ★ THE ENGINE IS A CLOSED FORM OF THE CLOCK. A card's progress is
 * `((its launch time * reveal + elapsed) mod cycle) / flight`, so recycling
 * falls out of the modulo, a still is the loop frozen at a chosen elapsed, and
 * there is no per-card bookkeeping, no timer and no React state.
 *
 * ★ PURE, AND THAT IS LOAD-BEARING. No React and no stylesheet here, so the
 * solvers below run at module load for both canvases and the numbers on the
 * board's cards are read off the same tables the hero renders from.
 */

/* ── The frame the four compositions share ───────────────────────────────── */

/**
 * WHERE THE CODE SITS AND WHERE THE TYPE GOES. `split` is round six's lockup:
 * the code at the exact centre, the headline above the stream, the caption,
 * the sentence and the actions below it. The three others keep the headline,
 * the sentence and the actions together as ONE block, which is Will's ask, and
 * put the code above it (`stack-above`, `orbit`) or below it (`stack-below`).
 */
export type Lockup = "split" | "stack-above" | "stack-below" | "orbit";

export const LOCKUPS: readonly Lockup[] = [
  "split",
  "stack-above",
  "stack-below",
  "orbit",
];

export type Geo = {
  /** The QR's edge in px, quiet zone included; 112 still scans from a phone. */
  qr: number;
  /** The unit card box before lane and aspect, at transform scale 1. */
  card: number;
  perspective: number;
  /** Half the canvas: the funnel's normaliser. */
  halfW: number;
  /** The corridor's half-angle in degrees, before the per-lane turn. */
  rotate: number;
  /** Canvas-relative, never a vw value: a zoomed stage picks the wrong one. */
  sizes: string;
  /** How much of each edge the band dissolves over. */
  fade: string;
  /** The h1's max-width: a typographic choice, tuned so the ruled thesis breaks
   *  into good lines. It is NOT what the stream is measured against. */
  h1Max: number;
  /**
   * ★ THE COLUMN THE STREAM'S REACH IS MEASURED AT, and it is the headline's
   * INK rather than its box. Measured on the rendered lines (1440: 696 and 541;
   * 375: 213, 170 and 225), plus headroom. Re-measure it if the ruled line
   * changes: copy is open (bible 21), and this is the one number a rewrite can
   * invalidate.
   */
  h1Ink: number;
  /** The h1's leading, written AFTER the ladder class (a size utility carries
   *  a line-height of its own, and tailwind-merge drops the earlier one). */
  h1Lead: string;
  /** The caption's measure: the line of the lower block nearest the stream in
   *  the split lockup, and the line nearest the code in the stacks. */
  capMax: number;
  /** The sentence's measure. */
  lowMax: number;
  /** The margin the type keeps from the stream's measured reach. */
  margin: number;
  /**
   * THE CEILING IS THE SITE HEADER. The cinema header is a 4rem overlay sitting
   * transparently on the hero, so the headline's cap has to start below 64 px of
   * canvas. In the split lockup at 1440 the headline is two lines of the xl step
   * (196 px of line box), so the block's top clears about 70 px only while its
   * offset stays under this. A stream whose measured reach pushes past it has
   * not been composed yet: retune the stream, never this number.
   */
  headMax: number;
  /**
   * THE UNSPLIT BLOCK'S BOX, for the three lockups that keep the headline, the
   * sentence and the actions together: its width is the widest line's ink (the
   * headline at 1440, the sentence at 375) and its height is measured on the
   * rendered block (caption, headline, sentence, actions and their gaps). The
   * orbit's stations are drawn outside it and `streams.test.ts` holds every
   * frame of every unsplit stream out of it at every phase.
   */
  blockW: number;
  blockH: number;
  /** The axis (the code's centre) as a fraction of the canvas height, per
   *  lockup. The split stays at the middle; a stack raises or lowers the code
   *  so the block fits under or over the band; the orbit's pivot sits high
   *  enough for the block to hang beneath it. */
  axis: Record<Lockup, number>;
  /** The gap between the code's foot and the block hung under it (orbit). */
  gap: number;
};

export const GEO: Record<Mode, Geo> = {
  desktop: {
    qr: 144,
    card: 300,
    perspective: 1100,
    halfW: CANVAS.desktop.w / 2,
    rotate: 8.5,
    sizes: "440px",
    fade: "12%",
    h1Max: 920,
    h1Ink: 720,
    h1Lead: "leading-[0.95]",
    capMax: 360,
    lowMax: 576,
    margin: 26,
    headMax: 210,
    blockW: 720,
    blockH: 354,
    axis: { split: 0.5, "stack-above": 0.36, "stack-below": 0.66, orbit: 0.36 },
    gap: 28,
  },
  phone: {
    qr: 112,
    card: 155,
    perspective: 420,
    halfW: CANVAS.phone.w / 2,
    rotate: 7.5,
    sizes: "240px",
    fade: "16%",
    h1Max: 343,
    h1Ink: 250,
    h1Lead: "leading-[1.0]",
    capMax: 343,
    lowMax: 343,
    margin: 28,
    headMax: 196,
    blockW: 343,
    blockH: 330,
    axis: { split: 0.5, "stack-above": 0.32, "stack-below": 0.76, orbit: 0.3 },
    gap: 20,
  },
};

/** The three depths, as one multiplier each on size, turn and vertical reach. */
export const LANES = [0.66, 0.88, 1.16] as const;

/** The shapes an album is made of: half 4:5 portrait (a phone held up), a
 *  quarter square, a quarter 4:3. Each pair has the same area, so a lane's
 *  frames carry the same visual weight whatever shape they are. */
export const ASPECTS = [
  [0.9, 1.11], // 4:5 portrait
  [1, 1], // square
  [1.15, 0.87], // 4:3 landscape
  [0.9, 1.11], // 4:5 again
] as const;

/* ── The primitives the streams are written in ───────────────────────────── */

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

const easeOutCubic = (t: number) => {
  const u = 1 - clamp01(t);
  return 1 - u * u * u;
};

const mod = (a: number, n: number) => ((a % n) + n) % n;

const rad = (deg: number) => (deg * Math.PI) / 180;

/** ease-in-out-quart, which IS --ease-in-out-strong's cubic-bezier
 *  (0.77, 0, 0.175, 1), written out so the reveal needs no bezier solver and
 *  stays deterministic on the server and in the browser alike. */
export function revealEase(t: number) {
  const u = clamp01(t);
  if (u < 0.5) return 8 * u * u * u * u;
  const v = 1 - u;
  return 1 - 8 * v * v * v * v;
}

/** The branch-out: the launch times are multiplied by this, so at elapsed 0
 *  every frame is inside the QR and REVEAL_MS later the stream is deployed. */
export const REVEAL_MS = 1750;

/* ── One card, and one stream ────────────────────────────────────────────── */

export type Card = {
  key: string;
  /** -1 = the left arm, 1 = the right. */
  dir: 1 | -1;
  /** Position in its arm: the launch order, the table index and the photograph. */
  slot: number;
  lane: number;
  depth: number;
  photo: number;
  /** The unit box at transform scale 1. */
  w: number;
  h: number;
  /** The launch time inside the cycle, in ms. */
  at: number;
  /** The travel multiplier: depth for a flying stream, the station's own for a
   *  stream that lands. */
  reach: number;
  /** The vertical station, in units of the stream's `rise`; a polar stream
   *  stores its station's angle in degrees here, so the board and the tests
   *  read one field. */
  station: number;
  /** rotateZ in degrees, unless the stream rolls by phase. */
  roll: number;
  /** rotateY in degrees, unless the stream turns by phase. */
  turn: number;
  /** A polar stream only: the station's angle from the horizontal, in radians,
   *  positive downward, for the right arm (the left arm is its mirror). */
  angle: number;
  /** A polar stream only: how far back along the arc the approach starts, in
   *  radians. A station below the block is reached by sweeping AROUND it. */
  sweep: number;
};

export type Stream = {
  id: StreamId;
  lockup: Lockup;
  /** One card's flight, birth to gone. */
  flight: number;
  /** Launch slots per arm. */
  pool: Record<Mode, number>;
  /** The cycle a slot relaunches on; never shorter than the flight. */
  cycle: Record<Mode, number>;
  /** How far the right arm runs behind the left. */
  armLag: Record<Mode, number>;
  /** How far a frame travels at travelAt 1, in canvas px. */
  travel: Record<Mode, number>;
  /** The transform scale a frame reaches at scaleAt 1. */
  gain: number;
  /** The unit card box, as a multiple of `Geo.card`. */
  cardScale: number;
  /** The vertical unit: one station step, in canvas px at full scale. */
  rise: Record<Mode, number>;
  /** The funnel: the vertical is multiplied by `base + gain * |x| / halfW`.
   *  [1, 0] is off. */
  spread: readonly [base: number, gain: number];
  /** The perspective the corridor is drawn under, when the geometry's own is
   *  wrong for the shape: a curl reads only under a short one. */
  perspective?: Record<Mode, number>;
  /** How the band dissolves at the canvas edge: a horizontal fade for a band,
   *  a radial one for a ring. */
  mask: "band" | "radial";
  /** Extra clearance between the type and the stream's measured reach, on top
   *  of `Geo.margin`: a band wants air over it that a scatter did not. */
  breath?: Record<Mode, number>;
  /** ★ A POLAR STREAM places a card by angle and radius from the code rather
   *  than along an arm: `x = dir * cos(angle) * r`, `y = sin(angle) * r`. */
  polar?: boolean;
  /** The launch time of slot `s` inside the cycle. */
  at: (s: number, mode: Mode) => number;
  /** Everything about one card that the clock does not change. */
  shape: (
    s: number,
    right: boolean,
    mode: Mode,
  ) => Omit<Card, "key" | "dir" | "slot" | "photo" | "at" | "w" | "h">;
  travelAt: (p: number) => number;
  /**
   * ★ SCALE AND OPACITY ARE FUNCTIONS OF THE DISTANCE CROSSED, not only of the
   * phase, and `out` is that distance: 0 at the code, 1 at the canvas edge. A
   * far frame crosses the canvas slowly and a near one quickly, so a scale
   * curve read off the PHASE gives the far frame more time to grow and the
   * depth inverts; read off the distance, every lane shares one growth curve.
   * A stream that lands rather than passes reads the phase (its fade happens
   * while it is standing still), so both are offered.
   */
  scaleAt: (p: number, out: number) => number;
  opacityAt: (p: number, out: number) => number;
  /** The vertical, as a multiple of `rise`; the default is the card's station. */
  riseAt?: (p: number, c: Card) => number;
  /** A stream whose vertical is an arc rather than a scatter sets this: the
   *  scale term that converges every frame on the code would crush the arc. */
  riseFlat?: boolean;
  /** rotateZ at a phase; the default is the card's own roll. */
  rollAt?: (p: number, c: Card) => number;
  /** rotateY at a phase and a distance; the default is the card's own turn.
   *  The band's curl lives here: a few degrees at the code, hard at the edge. */
  turnAt?: (p: number, out: number, c: Card) => number;
  /** A polar stream only: the angle a held card drifts through, in radians. */
  driftAt?: (p: number, c: Card) => number;
};

/** The turn every arm-stream shares: the two arms lean towards each other and
 *  a near lane leans harder, which is what a wide lens does to a room. */
const turnOf = (depth: number, right: boolean, mode: Mode) =>
  (right ? -1 : 1) * GEO[mode].rotate * (0.62 + 0.55 * depth);

/* ── 1. BAND: one file each way, growing and curling with the distance ───── */

/**
 * THE MELIUS SHAPE, the reference Will named. One file a side on ONE axis: no
 * station, no roll, one depth, so the only variables are the two that read as
 * space, size and turn, and both are functions of the distance crossed.
 *
 * ★ THE SPACING IS THE FRAME'S OWN WIDTH, and that is what the exponential
 * travel buys. An even travel with a scale that opens outward puts big frames
 * on top of each other at the edge and tiny ones far apart at the code; a
 * travel whose velocity grows about as fast as the frame does keeps the gap
 * between neighbours a fixed fraction of their width the whole way out, which
 * is what a file of photographs looks like when nobody has bumped it.
 *
 * ★ THE CURL IS THE TURN GROWING WITH THE DISTANCE. Round six turned every
 * frame a fixed few degrees toward the code. Here the outer edge of a frame
 * comes forward harder the further out it stands, under a shorter perspective
 * than the scatters used, so the band reads as the inside of a cylinder with
 * the code on its far wall rather than as a row of flat cards.
 *
 * The same stream wears three lockups (the band, and the two stacks); one
 * table, so a tuning here moves all three together, which is what makes them a
 * fair comparison of where the code sits rather than of three streams.
 */
const BAND_BEAT = { desktop: 1250, phone: 1350 } as const;
const BAND_FLIGHT = 9600;
/** e^κ is the ratio of the velocity at the edge to the velocity at the code. */
const BAND_KAPPA = 2.3;
const BAND_TURN = { code: 6, edge: 44 } as const;

function bandStream(id: StreamId, lockup: Lockup): Stream {
  return {
    id,
    lockup,
    flight: BAND_FLIGHT,
    pool: poolOf(BAND_FLIGHT, BAND_BEAT),
    cycle: cycleOf(BAND_FLIGHT, BAND_BEAT),
    // Zero: the pair leaves together, which is the symmetry.
    armLag: { desktop: 0, phone: 0 },
    travel: { desktop: 1.04 * CANVAS.desktop.w, phone: 1.3 * CANVAS.phone.w },
    gain: 0.92,
    cardScale: 0.85,
    rise: { desktop: 0, phone: 0 },
    spread: [1, 0],
    perspective: { desktop: 700, phone: 360 },
    mask: "band",
    breath: { desktop: 56, phone: 12 },
    at: (s, mode) => s * BAND_BEAT[mode],
    shape: (_s, right, mode) => ({
      lane: 1,
      depth: 1,
      reach: 1,
      station: 0,
      roll: 0,
      turn: turnOf(1, right, mode),
      angle: 0,
      sweep: 0,
    }),
    travelAt: (p) =>
      (Math.exp(BAND_KAPPA * clamp01(p)) - 1) / (Math.exp(BAND_KAPPA) - 1),
    // Growing from the code outward from the first pixel, unlike the scatters'
    // back-loaded curve: the whole band is the growth, so it starts at once.
    scaleAt: (_p, out) => 0.18 + 0.82 * Math.pow(clamp01(out), 1.2),
    // Solid once its edge clears the plate. Emerging from behind the object,
    // never switched on beside it.
    opacityAt: (_p, out) => smoothstep(0.02, 0.14, out),
    turnAt: (_p, out, c) =>
      -c.dir *
      (BAND_TURN.code +
        (BAND_TURN.edge - BAND_TURN.code) * smoothstep(0.2, 1, out)),
  };
}

/* ── 2. ORBIT: a ring around the code, the block hung beneath it ─────────── */

/**
 * THE COSMOS SHAPE, with Will's two changes: the code is what sits above the
 * headline, and the ring is centred on the code rather than on the type.
 *
 * ★ A STATION IS AN ANGLE AND A RADIUS FROM THE CODE, eight a side, mirrored,
 * walked in order, so the births march around the code and the ring visibly
 * turns without any card ever leaving its arc.
 * A card is born behind the plate, flies out along its ray, lands, holds long
 * enough to read while drifting a couple of degrees down its arc, and fades.
 * The settle's approach, growth and fade curves are reused as they were.
 *
 * ★ A STATION BELOW THE HEADLINE IS REACHED BY SWEEPING AROUND THE BLOCK. A
 * straight ray from the code to a bottom corner crosses the headline, so those
 * stations start their approach back up the arc (`sweep`) and come round the
 * block's side; `streams.test.ts` holds every lit frame outside the block's
 * box at every phase, which is the condition the table was tuned against.
 *
 * At 375 the block is nearly the whole canvas wide, so the ring is three
 * stations a side above and beside the code, never a squeezed desktop.
 */
const ORBIT_STATIONS = {
  desktop: [
    { angle: -55, r: 250, lane: 1, sweep: 20 },
    { angle: -32, r: 400, lane: 2, sweep: 25 },
    { angle: -10, r: 540, lane: 0, sweep: 10 },
    { angle: 8, r: 620, lane: 1, sweep: 30 },
    { angle: -72, r: 380, lane: 0, sweep: 15 },
    { angle: 30, r: 690, lane: 2, sweep: 70 },
    { angle: -20, r: 700, lane: 1, sweep: 12 },
    { angle: 40, r: 700, lane: 0, sweep: 80 },
  ],
  phone: [
    { angle: -72, r: 170, lane: 0, sweep: 15 },
    { angle: -38, r: 220, lane: 1, sweep: 20 },
    { angle: 4, r: 172, lane: 0, sweep: 10 },
  ],
} as const;
const ORBIT_BEAT = { desktop: 1000, phone: 2700 } as const;
/** Long, because the hold is the treatment: a card stands for seven seconds
 *  and the ring is mostly standing at any instant, like the reference. The
 *  pool this costs at 1440 is 17 a side, which is exactly the 34 of ASSETS
 *  row 2; the phone's beat is long so three stations a side are never double
 *  booked. */
const ORBIT_FLIGHT = 16000;
/** The approach ends here and the hold begins; the fade takes it out. */
const ORBIT_ARRIVE = 0.24;
const ORBIT_GO = [0.65, 0.72] as const;
/** The fade-in, placed where the growth is: see opacityAt. */
const ORBIT_SHOW = [0.16, 0.22] as const;
/** The tilt, a short table, mirrored on the left arm. */
const ORBIT_ROLL = [-11, 7, -5, 12, -8, 4] as const;
/** How far a held card drifts down its arc, in degrees. */
const ORBIT_DRIFT = 2.5;

const orbit: Stream = {
  id: "orbit",
  lockup: "orbit",
  flight: ORBIT_FLIGHT,
  pool: poolOf(ORBIT_FLIGHT, ORBIT_BEAT),
  cycle: cycleOf(ORBIT_FLIGHT, ORBIT_BEAT),
  armLag: { desktop: ORBIT_BEAT.desktop / 2, phone: ORBIT_BEAT.phone / 2 },
  // The radius unit: a station's `reach` is its radius over this.
  travel: { desktop: 800, phone: 240 },
  gain: 1,
  // Smaller than the band's: the reference's cards are many and modest, and a
  // ring of big frames reads as a wall with a hole in it.
  cardScale: 0.62,
  rise: { desktop: 0, phone: 0 },
  spread: [1, 0],
  mask: "radial",
  polar: true,
  at: (s, mode) => s * ORBIT_BEAT[mode],
  shape: (s, right, mode) => {
    const stations = ORBIT_STATIONS[mode];
    const st = stations[s % stations.length];
    const depth = LANES[st.lane];
    return {
      lane: st.lane,
      depth,
      reach: st.r / orbit.travel[mode],
      station: st.angle,
      roll: ORBIT_ROLL[s % ORBIT_ROLL.length] * (right ? -1 : 1),
      // Flat, like the reference: the tilt is the only turn a ring card has.
      turn: 0,
      angle: rad(st.angle),
      sweep: rad(st.sweep),
    };
  },
  // Ease-in-out over the approach, then a flat hold: the frame leaves slowly,
  // crosses quickly and comes to a real stop with no velocity left in it.
  travelAt: (p) => smoothstep(0, 1, clamp01(p / ORBIT_ARRIVE)),
  // The growth is all in the last third of the approach: a frame is small the
  // whole way round, so nothing big ever passes near the type, and the size
  // arrives with the frame. A photograph being placed, not one sliding past.
  scaleAt: (p: number) => {
    const t = clamp01(p / ORBIT_ARRIVE);
    return (
      0.08 * smoothstep(0, 0.3, t) + 0.92 * easeOutCubic(smoothstep(0.6, 1, t))
    );
  },
  // ★ THE FADE-IN RIDES THE GROWTH, not the birth. The settle faded a card in
  // at the code, where the plate hid it; a ring card sweeps out beside the
  // plate, and a speck crossing the canvas at eight percent of its size read
  // as debris. So a card is invisible until it is most of the way out and
  // growing, and it arrives at its station as a photograph being placed.
  opacityAt: (p) =>
    smoothstep(ORBIT_SHOW[0], ORBIT_SHOW[1], p) *
    (1 - smoothstep(ORBIT_GO[0], ORBIT_GO[1], p)),
  driftAt: (p) => rad(ORBIT_DRIFT) * smoothstep(ORBIT_ARRIVE, 1, p),
};

export const STREAMS: Record<StreamId, Stream> = {
  band: bandStream("band", "split"),
  orbit,
  "stack-above": bandStream("stack-above", "stack-above"),
  "stack-below": bandStream("stack-below", "stack-below"),
};

/** Re-exported so a client module keeps one import; the list itself lives in
 *  `stream-ids.ts`, which a SERVER route can read (see the note there). */
export { STREAM_IDS, type StreamId };

function poolOf(flight: number, beat: Record<Mode, number>) {
  // Every airborne card needs its own node, plus one on the ground so a slot
  // never relaunches while its last flight is still running.
  return {
    desktop: Math.ceil(flight / beat.desktop) + 1,
    phone: Math.ceil(flight / beat.phone) + 1,
  };
}

function cycleOf(flight: number, beat: Record<Mode, number>) {
  const pool = poolOf(flight, beat);
  return {
    desktop: pool.desktop * beat.desktop,
    phone: pool.phone * beat.phone,
  };
}

/* ── The solvers, run once per stream per canvas at module load ──────────── */

/** Screen-space position and half-extents at a phase, in canvas units from the
 *  code. The one description everything else here measures. */
export function placeAt(c: Card, p: number, st: Stream, mode: Mode) {
  if (st.polar) {
    const a = st.travelAt(p);
    const r = a * st.travel[mode] * c.reach;
    const out = r / GEO[mode].halfW;
    const s = st.scaleAt(p, out) * st.gain;
    // Back up the arc by the sweep at birth, on the station at arrival, then
    // the drift: one angle, three terms, no branch.
    const angle =
      c.angle - c.sweep * (1 - a) + (st.driftAt ? st.driftAt(p, c) : 0);
    return {
      s,
      x: c.dir * Math.cos(angle) * r,
      out,
      y: Math.sin(angle) * r,
      hw: (c.w / 2) * s,
      hh: (c.h / 2) * s,
    };
  }
  const x = c.dir * st.travelAt(p) * st.travel[mode] * c.reach;
  const out = Math.abs(x) / GEO[mode].halfW;
  const s = st.scaleAt(p, out) * st.gain;
  const open = st.spread[0] + st.spread[1] * clamp01(out);
  const lift = st.riseAt ? st.riseAt(p, c) : c.station;
  const converge = st.riseFlat ? 1 : s / st.gain;
  return {
    s,
    x,
    out,
    y: lift * st.rise[mode] * converge * open * c.depth,
    hw: (c.w / 2) * s,
    hh: (c.h / 2) * s,
  };
}

/** One card at one phase, as the loop and the rest state both need it. The two
 *  have to agree exactly or the first frame after hydration is a jump. */
export function frameAt(
  c: Card,
  p: number,
  st: Stream,
  mode: Mode,
  fit: number,
) {
  const q = placeAt(c, p, st, mode);
  const roll = st.rollAt ? st.rollAt(p, c) : c.roll;
  const turn = st.turnAt ? st.turnAt(p, q.out, c) : c.turn;
  const scale = (q.s / fit).toFixed(4);
  return {
    transform: `translate3d(${q.x.toFixed(2)}px, ${q.y.toFixed(2)}px, 0) rotateY(${turn.toFixed(2)}deg) rotateZ(${roll.toFixed(2)}deg) scale(${scale})`,
    opacity: st.opacityAt(p, q.out),
    // Near over far, as an integer so the browser is not handed a new stacking
    // order sixty times a second. Apparent size IS the depth, so one number
    // orders the whole stream.
    z: 1 + Math.round(q.s * c.depth * 40),
  };
}

/** The sampling resolution of the two solvers: 480 over a flight is a 20 ms
 *  answer, finer than any fade a stream carries. */
const SCAN = 480;

export type Built = {
  cards: Card[];
  pool: number;
  cycle: number;
  flight: number;
  /** Per card, in order: the DOM box, the scale divisor, and the progress past
   *  which the loop stops writing to it. */
  box: { w: number; h: number; fit: number; exit: number }[];
  /**
   * The type's anchors, as canvas units from the axis, measured off the stream
   * rather than chosen. `split`: the headline's baseline above (`head`) and the
   * lower block's top below (`low`). `stack-above` and `orbit`: the block's top
   * below the code (`low`). `stack-below`: the block's foot above the code
   * (`head`). The unused one is the plate's own clearance.
   */
  lock: { head: number; low: number };
  /** What the board reports: the frames on screen and the photograph they own. */
  facts: {
    onScreen: number;
    smallest: number;
    largest: number;
    layers: number;
  };
};

/**
 * The largest transform scale a card ever reaches WHILE A PERSON CAN SEE IT, and
 * the progress at which it has either left the canvas or finished fading. The
 * first sizes the DOM box so no frame is ever rasterized above 1:1 on screen;
 * the second lets the loop stop writing to a card that is gone, which keeps
 * about half the pool off the compositor.
 */
function fitOf(c: Card, st: Stream, mode: Mode, canvasW: number) {
  let fit = 0.001;
  let exit = 1;
  let lit = false;
  for (let i = 0; i <= SCAN; i++) {
    const p = i / SCAN;
    const q = placeAt(c, p, st, mode);
    const o = st.opacityAt(p, q.out);
    if (o > 0.004) lit = true;
    else if (lit) {
      exit = p;
      break;
    }
    if (Math.abs(q.x) - q.hw > canvasW / 2) {
      exit = p;
      break;
    }
    if (o > 0.004 && q.s > fit) fit = q.s;
  }
  // ★ A SAMPLED MAXIMUM IS NOT THE MAXIMUM. The scan lands on a grid and the
  // true peak falls between two samples, so the DOM box is given one percent of
  // headroom: the error at this resolution is measured at under three tenths of
  // a percent, and the whole point of `fit` is that the on-screen size is never
  // LARGER than the box.
  return { fit: fit * 1.01, exit };
}

/**
 * How far from the axis the stream reaches at `xAbs` canvas units from the
 * centre: every card, every sample, the furthest top or bottom edge of any
 * frame whose horizontal span covers that column. This is the measurement the
 * lockup is placed from, so "no photograph is ever under a word" is a condition
 * the composition is drawn from rather than a hope about it, and it re-solves
 * itself when a table changes. Rotation is not modelled (a rotateY narrows a
 * box and a one degree roll adds about two percent of its height), so the
 * answer carries an eight percent allowance.
 */
function reachOf(cards: Card[], st: Stream, mode: Mode, xAbs: number) {
  let out = 0;
  for (const c of cards) {
    for (let i = 0; i <= SCAN; i++) {
      const p = i / SCAN;
      const q = placeAt(c, p, st, mode);
      if (st.opacityAt(p, q.out) <= 0.02) continue;
      const ax = Math.abs(q.x);
      if (ax - q.hw <= xAbs && xAbs <= ax + q.hw) {
        const edge = Math.abs(q.y) + q.hh;
        if (edge > out) out = edge;
      }
    }
  }
  return out * 1.08;
}

export function build(st: Stream, mode: Mode): Built {
  const geo = GEO[mode];
  const pool = st.pool[mode];
  const cycle = st.cycle[mode];
  const half = Math.round(FRAMES.length / 2);
  const cards: Card[] = Array.from({ length: pool * 2 }, (_, g) => {
    const right = g % 2 === 1;
    const slot = (g - (right ? 1 : 0)) / 2;
    const sh = st.shape(slot, right, mode);
    const [aw, ah] = ASPECTS[(slot + (right ? 1 : 0)) % ASPECTS.length];
    return {
      key: `hhs-${g}`,
      dir: (right ? 1 : -1) as 1 | -1,
      slot,
      photo: slot + (right ? half : 0),
      w: geo.card * st.cardScale * sh.depth * aw,
      h: geo.card * st.cardScale * sh.depth * ah,
      // The right arm runs behind the left by the stream's own lag; the modulo
      // is what makes a negative or an over-long offset land on the same beat.
      at: mod(st.at(slot, mode) + (right ? st.armLag[mode] : 0), cycle),
      ...sh,
    };
  });

  const box = cards.map((c) => {
    const { fit, exit } = fitOf(c, st, mode, CANVAS[mode].w);
    return { w: Math.round(c.w * fit), h: Math.round(c.h * fit), fit, exit };
  });

  // The plate is the other thing the type has to clear, and near the centre it
  // is the taller of the two: the stream there is entirely behind it.
  const plate = geo.qr / 2 + geo.margin;
  const breath = st.breath?.[mode] ?? 0;
  const clear = (halfCol: number) =>
    Math.max(
      Math.round(reachOf(cards, st, mode, halfCol) + geo.margin + breath),
      plate,
    );

  // ★ EACH LOCKUP IS SOLVED AT THE LINE NEAREST THE STREAM, at that line's own
  // measure. The split: the headline's ink above, the caption below. A stack
  // with the code above: the block's top line is the caption but the headline
  // is one gap under it and far wider, so the headline's ink is the column.
  // A stack with the code below: the caption is the foot line, at its measure.
  // The orbit: the block hangs one gap under the plate, and its stations are
  // drawn outside the block's box rather than measured against it.
  let lock: Built["lock"];
  switch (st.lockup) {
    case "split":
      lock = { head: clear(geo.h1Ink / 2), low: clear(geo.capMax / 2) };
      break;
    case "stack-above":
      lock = { head: plate, low: clear(geo.h1Ink / 2) };
      break;
    case "stack-below":
      lock = { head: clear(geo.capMax / 2), low: plate };
      break;
    case "orbit":
      lock = { head: plate, low: geo.qr / 2 + geo.gap };
      break;
  }

  return {
    cards,
    pool,
    cycle,
    flight: st.flight,
    box,
    lock,
    facts: countAt(cards, box, st, mode),
  };
}

/**
 * THE UNSPLIT BLOCK'S BOX in canvas units from the code, for the three lockups
 * that keep the type together: what `streams.test.ts` holds every frame out of,
 * and what the orbit's stations were drawn against. `null` for the split.
 */
export function blockBox(st: Stream, built: Built, mode: Mode) {
  const geo = GEO[mode];
  const halfW = geo.blockW / 2;
  switch (st.lockup) {
    case "split":
      return null;
    case "stack-below":
      return {
        halfW,
        top: -built.lock.head - geo.blockH,
        bottom: -built.lock.head,
      };
    default:
      return { halfW, top: built.lock.low, bottom: built.lock.low + geo.blockH };
  }
}

/**
 * What the board's cards report, measured rather than asserted: how many frames
 * are on screen at once, the smallest and largest DOM box, and the layers the
 * compositor is handed. Sampled across one whole cycle, because a cadence has a
 * busiest instant and a quietest one and an average would hide both; the count
 * reported is the busiest, which is the one that costs.
 */
function countAt(
  cards: Card[],
  box: Built["box"],
  st: Stream,
  mode: Mode,
): Built["facts"] {
  const cycle = st.cycle[mode];
  let onScreen = 0;
  for (let t = 0; t < cycle; t += 40) {
    let n = 0;
    for (let i = 0; i < cards.length; i++) {
      const p = mod(cards[i].at + t, cycle) / st.flight;
      if (
        p <= box[i].exit &&
        st.opacityAt(p, placeAt(cards[i], p, st, mode).out) > 0.02
      )
        n++;
    }
    if (n > onScreen) onScreen = n;
  }
  const widths = box.map((b) => b.w);
  return {
    onScreen,
    smallest: Math.min(...widths),
    largest: Math.max(...widths),
    layers: cards.length,
  };
}

/** Both canvases of all four streams, solved once for the module. Plain
 *  arithmetic on both sides, so the server and the browser agree and the rest
 *  state hydrates without a warning. */
export const BUILT: Record<StreamId, Record<Mode, Built>> = Object.fromEntries(
  STREAM_IDS.map((id) => [
    id,
    {
      desktop: build(STREAMS[id], "desktop"),
      phone: build(STREAMS[id], "phone"),
    },
  ]),
) as Record<StreamId, Record<Mode, Built>>;

/** The phase a card stands at when nothing is running: the stream deployed at
 *  its steady spacing, which is what reduced motion, a crawler, a cold paint
 *  and a reader with scripting off all get. */
export const restPhase = (c: Card, st: Stream) => Math.min(c.at / st.flight, 1);

/** The launch clock, as a closed form: the ONE expression the loop runs. */
export const phaseOf = (
  c: Card,
  elapsed: number,
  reveal: number,
  cycle: number,
  flight: number,
) => mod(c.at * reveal + elapsed, cycle) / flight;
