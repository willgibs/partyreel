import { CANVAS, type Mode } from "@/components/lab";

import { FRAMES } from "./shared";
import { STREAM_IDS, type StreamId } from "./stream-ids";

/**
 * THE FOUR STREAMS (round six, 2026-09-16): one engine, four compositions.
 *
 * Will ruled the direction and then ruled the stream: "The album coming out of
 * the code definitely looks best. However, I think we can improve this visual a
 * lot. The random stream feels worse than a more polished one." This file is
 * that note answered.
 *
 * ★ NOTHING IN THE COMPOSITION IS RANDOM ANY MORE, and that is the whole round.
 * Round five gave every card four seeded values off an integer hash: its
 * vertical offset inside a band, a six percent size jitter, a roll and a turn
 * wobble. Four dice per frame, sixteen frames on screen, so the picture never
 * resolved into a shape and the eye read confetti. Every one of those values is
 * now a STEP IN A DECLARED CYCLE: a station table for the vertical, a lane
 * table for depth, an aspect table for shape, a roll table for the turn. The
 * hash is gone from the file. A reader can watch one frame and know where the
 * next will be, which is what "composed" means and what "polished" was asking
 * for.
 *
 * ★ AND THE FOUR ARE FOUR READINGS OF THE SAME SENTENCE, not four tunings:
 *
 *   mirror  order      one pair a beat, the two arms exact mirrors about the code
 *   phrase  rhythm     three frames then a rest, the arms answering each other
 *   settle  arrangement the album travels out and LANDS in five held places
 *   ribbon  line       one fanned file a side, each frame a step behind the last
 *
 * ★ THE ENGINE IS STILL A CLOSED FORM OF THE CLOCK. A card's progress is
 * `((its launch time * reveal + elapsed) mod cycle) / flight`, so recycling
 * falls out of the modulo, a still is the loop frozen at a chosen elapsed, and
 * there is no per-card bookkeeping, no timer and no React state. What round six
 * generalised is the launch time: round five's was `slot * beat`, which cannot
 * say "three, then a rest", so a stream now declares `at(slot)` and its own
 * `cycle`. Everything else, the measured clear lane included, reads through
 * `placeAt` and did not have to know.
 *
 * ★ PURE, AND THAT IS LOAD-BEARING. No React and no stylesheet here, so the
 * solvers below can run at module load for both canvases and the numbers on the
 * board's cards are read off the same tables the hero renders from.
 */

/* ── The frame the four compositions share ───────────────────────────────── */

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
   * INK rather than its box. Round five measured at `h1Max / 2` and paid 112 px
   * for it: the ruled thesis sets two lines of 696 and 541 inside a 920 box, so
   * the measurement asked the stream to stay clear of a column no letter ever
   * reaches, and the headline was pushed that much closer to the site header for
   * nothing. Measured on the rendered lines (1440: 696 and 541; 375: 213, 170
   * and 225), plus headroom. Re-measure it if the ruled line changes: copy is
   * open (bible 21), and this is the one number a rewrite can invalidate.
   */
  h1Ink: number;
  /** The h1's leading, written AFTER the ladder class (a size utility carries
   *  a line-height of its own, and tailwind-merge drops the earlier one). */
  h1Lead: string;
  /** The caption's measure. It is the TOP of the lower block, so it is the line
   *  the block's anchor is solved against. */
  capMax: number;
  /** The sentence's measure. */
  lowMax: number;
  /** The margin the type keeps from the stream's measured reach. */
  margin: number;
  /**
   * THE CEILING IS THE SITE HEADER. The cinema header is a 4rem overlay sitting
   * transparently on the hero, so the headline's cap has to start below 64 px of
   * canvas. At 1440 the headline is two lines of the xl step (196 px of line
   * box, of which a measured 9 px is leading above the cap), so the block's top
   * clears about 70 px only while its offset stays under this. A stream whose
   * measured reach pushes past it has not been composed yet: retune the stream,
   * never this number.
   */
  headMax: number;
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
  /** The vertical station, in units of the stream's `rise`. */
  station: number;
  /** rotateZ in degrees, unless the stream rolls by phase. */
  roll: number;
  /** rotateY in degrees: the inner edge, the one pointing at the code, recedes. */
  turn: number;
};

export type Stream = {
  id: StreamId;
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
  /** The unit card box, as a multiple of `Geo.card`. A stream whose frames come
   *  to rest wants smaller ones than a stream whose frames only pass. */
  cardScale: number;
  /** The vertical unit: one station step, in canvas px at full scale. */
  rise: Record<Mode, number>;
  /** The funnel: the vertical is multiplied by `base + gain * |x| / halfW`, so
   *  the arms can converge on a point at the code and open out. [1, 0] is off. */
  spread: readonly [base: number, gain: number];
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
   * phase, and `out` is that distance: 0 at the code, 1 at the canvas edge. It
   * is the fix for the one thing an evenly spaced stream gets wrong on its own.
   * A far frame crosses the canvas slowly and a near one quickly, so a scale
   * curve read off the PHASE gives the far frame more time to grow and it
   * arrives at the edge nearly as large as the near one: the depth inverts and
   * the volume collapses. Read off the distance instead, every lane shares one
   * growth curve, and the depth is carried by the box, which is where it
   * belongs. A stream that lands rather than passes reads the phase (its fade
   * happens while it is standing still), so both are offered.
   */
  scaleAt: (p: number, out: number) => number;
  opacityAt: (p: number, out: number) => number;
  /** The vertical, as a multiple of `rise`; the default is the card's station. */
  riseAt?: (p: number, c: Card) => number;
  /**
   * By default the vertical is multiplied by the frame's own scale, so every
   * frame converges exactly on the code: the source is a point, not a smear. A
   * stream whose vertical is an ARC rather than a scatter sets this, because the
   * scale term crushes the arc into a flat line (the ribbon's whole shape lives
   * in the first third of its flight, where the scale is still small). Such a
   * stream owes the convergence itself: its `riseAt` must return 0 at phase 0.
   */
  riseFlat?: boolean;
  /** rotateZ at a phase; the default is the card's own roll. */
  rollAt?: (p: number, c: Card) => number;
};

/** The turn every stream shares: the two arms lean towards each other and a
 *  near lane leans harder, which is what a wide lens does to a room. */
const turnOf = (depth: number, right: boolean, mode: Mode) =>
  (right ? -1 : 1) * GEO[mode].rotate * (0.62 + 0.55 * depth);

/* ── 1. MIRROR: one pair a beat, the arms exact mirrors ──────────────────── */

/** Five stations, walked in order for ever. The two arms take the SAME station
 *  on the same beat, so the picture is symmetric about the code at every
 *  instant and the code is visibly the axis of the composition rather than a
 *  thing the photographs happen to pass. */
const MIRROR_STATIONS = [0.95, -0.45, 0.55, -1, 0.15] as const;
const MIRROR_LANES = [0, 2, 1] as const;
const MIRROR_ROLL = [-0.9, 0, 0.9] as const;
const MIRROR_BEAT = { desktop: 760, phone: 900 } as const;
const MIRROR_FLIGHT = 9600;

const mirror: Stream = {
  id: "mirror",
  flight: MIRROR_FLIGHT,
  pool: poolOf(MIRROR_FLIGHT, MIRROR_BEAT),
  cycle: cycleOf(MIRROR_FLIGHT, MIRROR_BEAT),
  // Zero: the pair leaves together, which is the whole treatment.
  armLag: { desktop: 0, phone: 0 },
  // Just past the canvas on the far lane, so nearly the whole flight is on
  // screen: a flight whose last two thirds happen past the edge is a pool three
  // times the size it needs to be.
  travel: { desktop: 1.02 * CANVAS.desktop.w, phone: 1.3 * CANVAS.phone.w },
  gain: 0.92,
  cardScale: 1,
  // The phone's vertical is a third of the desktop's, and it is not a squeeze:
  // the headline's ink is two thirds of a 375 canvas, so every frame at the edge
  // stands over its columns and the band has to stay inside what the type leaves.
  rise: { desktop: 108, phone: 30 },
  // The funnel, and it is what buys the vertical: the two arms converge on a
  // point at the code and have opened to nearly twice the station by the canvas
  // edge, so the stations can be tall without a frame ever standing over the
  // headline's own columns.
  spread: [0.26, 1.5],
  at: (s, mode) => s * MIRROR_BEAT[mode],
  shape: (s, right, mode) => {
    const lane = MIRROR_LANES[s % MIRROR_LANES.length];
    const depth = LANES[lane];
    return {
      lane,
      depth,
      reach: depth,
      station: MIRROR_STATIONS[s % MIRROR_STATIONS.length],
      roll: MIRROR_ROLL[s % MIRROR_ROLL.length] * (right ? -1 : 1),
      turn: turnOf(depth, right, mode),
    };
  },
  // ★ EVEN SPACING IS THE POLISH, and it is the one curve change round six made
  // to a flight round five was happy with. An accelerating travel front-loads
  // the flight: five frames sit in a tight overlapping clump a hundred pixels
  // from the plate and then shoot away, so the picture is clutter at the code
  // and a hole in the mid-field. Nearly even travel with the SCALE still opening
  // gives a procession instead, a hundred pixels wide at the code and three
  // hundred at the edge, and the eye reads a spacing rather than a scatter.
  travelAt: (p) => 0.28 * smoothstep(0, 1, p) + 0.72 * p,
  // The scale is what still opens, and it opens with the DISTANCE: one growth
  // curve for every lane, from a tenth behind the plate to full at the edge.
  // ★ AND IT IS BACK-LOADED, which is the other half of keeping the type's lane
  // clear. A frame is small across the whole middle of the canvas and only
  // opens in the outer third, so nothing large ever stands over the headline's
  // own columns; the measured clear lane then lands where it did in round five
  // while the spacing is the new, even one.
  scaleAt: (_p, out) => 0.2 + 0.8 * smoothstep(0.32, 1, out),
  // Solid before its edge clears the plate, which at this geometry is about a
  // tenth of the way out. Emerging from behind the object, never switched on
  // beside it.
  opacityAt: (_p, out) => smoothstep(0.02, 0.15, out),
};

/* ── 2. PHRASE: three frames, then a rest ────────────────────────────────── */

/**
 * The phrase: three launches close together, then the rest of the bar empty.
 *
 * ★ THE FLIGHT IS SHORT ON PURPOSE, and it is the number that makes this
 * treatment legible at all. A phrase is only a phrase if the stream empties
 * between two of them: at round five's 9.6 second flight there are six bars in
 * the air at once, the groups overlap into a solid band, and the cadence is
 * information nobody can see. At six seconds there are three, so the picture is
 * three clumps of three at three distances with clear dark between them, which
 * is the rhythm drawn rather than asserted.
 */
const PHRASE_IN = [0, 170, 340] as const;
const PHRASE_BAR = { desktop: 2000, phone: 2500 } as const;
const PHRASE_FLIGHT = 6000;
/** Within a phrase the lane steps far, middle, near, so a phrase OPENS towards
 *  the reader rather than arriving as three frames at one depth. */
const PHRASE_LANES = [0, 1, 2] as const;
const PHRASE_FAN = [-0.8, 0.1, 0.95] as const;
const PHRASE_ROLL = [-1, 0.2, 1] as const;

const phraseBars = (mode: Mode) =>
  Math.ceil(PHRASE_FLIGHT / PHRASE_BAR[mode]) + 1;

const phrase: Stream = {
  id: "phrase",
  flight: PHRASE_FLIGHT,
  pool: {
    desktop: phraseBars("desktop") * PHRASE_IN.length,
    phone: phraseBars("phone") * PHRASE_IN.length,
  },
  cycle: {
    desktop: phraseBars("desktop") * PHRASE_BAR.desktop,
    phone: phraseBars("phone") * PHRASE_BAR.phone,
  },
  // Half a bar: the arms answer each other rather than speaking together.
  armLag: { desktop: PHRASE_BAR.desktop / 2, phone: PHRASE_BAR.phone / 2 },
  travel: { desktop: 1.02 * CANVAS.desktop.w, phone: 1.3 * CANVAS.phone.w },
  gain: 0.92,
  cardScale: 1,
  rise: { desktop: 112, phone: 32 },
  spread: [0.26, 1.5],
  at: (s, mode) =>
    Math.floor(s / PHRASE_IN.length) * PHRASE_BAR[mode] +
    PHRASE_IN[s % PHRASE_IN.length],
  shape: (s, right, mode) => {
    const k = s % PHRASE_IN.length;
    const bar = Math.floor(s / PHRASE_IN.length);
    const lane = PHRASE_LANES[k];
    const depth = LANES[lane];
    // Every other phrase fans the other way, so two bars are one longer shape.
    const flip = bar % 2 === 0 ? 1 : -1;
    return {
      lane,
      depth,
      reach: depth,
      station: PHRASE_FAN[k] * flip,
      roll: PHRASE_ROLL[k] * (right ? -1 : 1),
      turn: turnOf(depth, right, mode),
    };
  },
  // Even, like the mirrored pair and for the same reason; a phrase whose three
  // frames tear apart in the first half second is three frames, not a phrase.
  travelAt: (p) => 0.28 * smoothstep(0, 1, p) + 0.72 * p,
  scaleAt: (_p, out) => 0.2 + 0.8 * smoothstep(0.32, 1, out),
  opacityAt: (_p, out) => smoothstep(0.02, 0.15, out),
};

/* ── 3. SETTLE: the album travels out and lands ──────────────────────────── */

/**
 * THE ARRANGEMENT. Four places a side at 1440 and three at 375, each a travel
 * multiplier, a vertical
 * station and a depth, walked in order. A frame accelerates out of the code,
 * decelerates into its place, HOLDS there long enough to be read, and is gone as
 * the next one arrives.
 *
 * ★ THE PLACES ARE A CONE, NOT A SCATTER, and they have to be: the type is
 * placed outside the stream's measured reach, so a big frame held high over the
 * headline's own columns pushes the headline into the site header. The two near
 * places, which are the big ones, live past the headline's measure; what stands
 * over the middle is on the far lane and close to the axis.
 *
 * ★ AND A PLACE IS NEVER DOUBLE-BOOKED. A frame owns its place from the end of
 * its approach to the end of its fade, and the place comes round again after
 * `places * beat`. `streams.test.ts` fails the module if a beat is ever tuned
 * under that, because two photographs in one place is the one fault this
 * treatment cannot survive.
 */
const SETTLE_PLACES = {
  desktop: [
    { reach: 0.58, station: -0.34, lane: 0 },
    { reach: 0.95, station: 0.32, lane: 1 },
    { reach: 1.4, station: -0.76, lane: 0 },
    { reach: 1.58, station: 0.54, lane: 2 },
  ],
  // Three a side at 375 rather than four: a held place needs room for a frame a
  // third of the canvas wide, and a narrow canvas is its own composition rather
  // than a squeezed one.
  phone: [
    { reach: 0.66, station: -0.35, lane: 0 },
    { reach: 1.15, station: 0.62, lane: 1 },
    { reach: 1.55, station: -0.8, lane: 0 },
  ],
} as const;
const SETTLE_BEAT = { desktop: 1040, phone: 1400 } as const;
const SETTLE_FLIGHT = 9600;
/** The approach ends here and the hold begins; the fade takes it out. */
const SETTLE_ARRIVE = 0.4;
const SETTLE_GO = [0.68, 0.78] as const;
const SETTLE_ROLL = [-0.7, 0.45, -0.25, 0.8, 0] as const;

const settle: Stream = {
  id: "settle",
  flight: SETTLE_FLIGHT,
  pool: poolOf(SETTLE_FLIGHT, SETTLE_BEAT),
  cycle: cycleOf(SETTLE_FLIGHT, SETTLE_BEAT),
  armLag: { desktop: SETTLE_BEAT.desktop / 2, phone: SETTLE_BEAT.phone / 2 },
  travel: { desktop: 420, phone: 118 },
  gain: 1,
  // Smaller than the streams whose frames only pass: a held frame is on screen
  // for three seconds at its full size, so it is the one the composition has to
  // make room for rather than the one it can afford to make huge.
  cardScale: 0.85,
  rise: { desktop: 150, phone: 62 },
  // Off: the places ARE the composition, so a funnel on top of them would bend
  // the arrangement the eye is being asked to read.
  spread: [1, 0],
  at: (s, mode) => s * SETTLE_BEAT[mode],
  shape: (s, right, mode) => {
    const places = SETTLE_PLACES[mode];
    const place = places[s % places.length];
    const depth = LANES[place.lane];
    return {
      lane: place.lane,
      depth,
      reach: place.reach,
      station: place.station,
      roll: SETTLE_ROLL[s % SETTLE_ROLL.length] * (right ? -1 : 1),
      turn: turnOf(depth, right, mode),
    };
  },
  // Ease-in-out over the approach, then a flat hold: the frame leaves slowly,
  // crosses quickly and comes to a real stop with no velocity left in it.
  travelAt: (p) => smoothstep(0, 1, clamp01(p / SETTLE_ARRIVE)),
  // ★ THE GROWTH IS ALL IN THE LAST THIRD OF THE APPROACH, and that is not a
  // taste: a frame is small the whole way across, so nothing big ever passes
  // over the headline's columns, and the size arrives with the frame. What it
  // looks like is a photograph being PLACED rather than one sliding past.
  scaleAt: (p: number) => {
    const t = clamp01(p / SETTLE_ARRIVE);
    return (
      0.08 * smoothstep(0, 0.3, t) + 0.92 * easeOutCubic(smoothstep(0.6, 1, t))
    );
  },
  // Up behind the plate, held, then out. Nothing shrinks at the code and
  // nothing is switched off beside it.
  opacityAt: (p) =>
    smoothstep(0, 0.13, p) * (1 - smoothstep(SETTLE_GO[0], SETTLE_GO[1], p)),
};

/* ── 4. RIBBON: one fanned file a side ───────────────────────────────────── */

/**
 * No vertical station at all: one file a side, riding one arc, each frame a
 * fixed step and a fixed fraction of a degree behind the one ahead of it. The
 * roll is a function of the PHASE rather than of the card, which is what makes
 * it a fanned deck: at any instant the file shows a smooth rotation gradient
 * from the code to the edge, and a frame inherits the angle of the one it
 * replaces. Every frame is on one depth, so the file never breaks rank.
 */
const RIBBON_BEAT = { desktop: 620, phone: 760 } as const;
const RIBBON_FLIGHT = 7600;
const RIBBON_FAN = 15;

const ribbon: Stream = {
  id: "ribbon",
  flight: RIBBON_FLIGHT,
  pool: poolOf(RIBBON_FLIGHT, RIBBON_BEAT),
  cycle: cycleOf(RIBBON_FLIGHT, RIBBON_BEAT),
  armLag: { desktop: RIBBON_BEAT.desktop / 2, phone: RIBBON_BEAT.phone / 2 },
  travel: { desktop: 1.05 * CANVAS.desktop.w, phone: 1.3 * CANVAS.phone.w },
  gain: 0.92,
  cardScale: 1,
  rise: { desktop: 100, phone: 48 },
  spread: [1, 0],
  at: (s, mode) => s * RIBBON_BEAT[mode],
  shape: (s, right, mode) => {
    // One depth for the whole file. The lane index is still reported so the
    // board can say so, and the aspects keep cycling: a file of one shape is a
    // filmstrip, and an album is not.
    const depth = 1;
    return {
      lane: 1,
      depth,
      reach: depth,
      station: 1,
      roll: 0,
      turn: turnOf(depth, right, mode) * 0.7,
    };
  },
  // Nearly even spacing: the file is read as one object, and an accelerating
  // file tears itself into three clumps.
  travelAt: (p) => 0.34 * smoothstep(0, 1, p) + 0.66 * p,
  scaleAt: (_p, out) => 0.2 + 0.8 * smoothstep(0.32, 1, out),
  opacityAt: (_p, out) => smoothstep(0.02, 0.15, out),
  // ★ THE ARC IS OVER BY THE CANVAS EDGE, and that number is the whole reason
  // the shape reads. A file crosses 1440 in the first third of its flight, so an
  // arc spread over the whole flight is a flat line with the interesting part
  // happening off screen. This one completes in 0.34, which is exactly where the
  // outermost frame leaves. Zero at phase 0, so the file still converges on the
  // code: see `riseFlat`.
  riseFlat: true,
  riseAt: (p, c) => -c.station * smoothstep(0, 0.34, p),
  // The fan: the angle is a function of how far along the file a frame is.
  rollAt: (p, c) => c.dir * RIBBON_FAN * (smoothstep(0, 1, p) - 0.42),
};

export const STREAMS: Record<StreamId, Stream> = {
  mirror,
  phrase,
  settle,
  ribbon,
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
 *  centre. The one description everything else here measures. */
export function placeAt(c: Card, p: number, st: Stream, mode: Mode) {
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
  const scale = (q.s / fit).toFixed(4);
  return {
    transform: `translate3d(${q.x.toFixed(2)}px, ${q.y.toFixed(2)}px, 0) rotateY(${c.turn.toFixed(2)}deg) rotateZ(${roll.toFixed(2)}deg) scale(${scale})`,
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
  /** The headline's baseline and the lower block's top, as canvas units from
   *  the axis. Measured off the stream rather than chosen. */
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
  // LARGER than the box. One percent of slack is a frame drawn at 0.99, which is
  // invisible; a tenth of a percent of overshoot is a frame being upscaled.
  return { fit: fit * 1.01, exit };
}

/**
 * How far from the axis the stream reaches at `xAbs` canvas units from the
 * centre: every card, every sample, the furthest top or bottom edge of any
 * frame whose horizontal span covers that column. This is the measurement the
 * lockup is placed from, so "no photograph is ever under a word" is a condition
 * the composition is drawn from rather than a hope about it, and it re-solves
 * itself when a station table changes. Rotation is not modelled (a rotateY
 * narrows a box and a one degree roll adds about two percent of its height), so
 * the answer carries an eight percent allowance; the true inflation measured on
 * the rendered boxes at 1440 is 2.9 percent.
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
  const head = Math.max(
    Math.round(reachOf(cards, st, mode, geo.h1Ink / 2) + geo.margin),
    plate,
  );
  // The lower block is anchored on its TOP line, the caption, because that is
  // the one nearest the stream; everything under it is further from the axis
  // than the stream ever reaches at its own width.
  const low = Math.max(
    Math.round(reachOf(cards, st, mode, geo.capMax / 2) + geo.margin),
    plate,
  );

  return {
    cards,
    pool,
    cycle,
    flight: st.flight,
    box,
    lock: { head, low },
    facts: countAt(cards, box, st, mode),
  };
}

/**
 * What the board's cards report, measured rather than asserted: how many frames
 * are on screen at once, the smallest and largest DOM box, and the layers the
 * compositor is handed. Sampled across one whole cycle, because a phrased
 * cadence has a busiest instant and a quietest one and an average would hide
 * both; the count reported is the busiest, which is the one that costs.
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

/** Both canvases of all four streams, solved once for the module. Float
 *  arithmetic with no trig, so the server and the browser agree exactly and
 *  the rest state hydrates without a warning. */
export const BUILT: Record<StreamId, Record<Mode, Built>> = {
  mirror: { desktop: build(mirror, "desktop"), phone: build(mirror, "phone") },
  phrase: { desktop: build(phrase, "desktop"), phone: build(phrase, "phone") },
  settle: { desktop: build(settle, "desktop"), phone: build(settle, "phone") },
  ribbon: { desktop: build(ribbon, "desktop"), phone: build(ribbon, "phone") },
};

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
