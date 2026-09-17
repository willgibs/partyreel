/**
 * THE HOME HERO'S STREAM (the hero's wiring round, 2026-09-17).
 *
 * The album leaving the code, as one file of photographs each way along a
 * single axis, with the real demo QR standing still where the frames are born
 * and the whole lockup in one block underneath. Will picked it on the hero
 * board's seventh round (`stream=stack-above`) and dropped the caption that
 * used to sit under the code; the board retired with the pick and this module
 * is what survived it, cut to the one composition that ships. The three that
 * lost (the split band, the Cosmos orbit and the stack with the code below)
 * left with their tables, their polar placement and their lockup switch: git
 * holds them at `a6afec3b` under `src/app/(dev)/design/sandbox/home-hero/`.
 *
 * ★ PURE, AND THAT IS LOAD-BEARING. No React, no stylesheet, no `env`: the
 * solvers below run at module load for both breakpoints, the component renders
 * from the same tables, and `hero-stream.test.ts` reads them in the node
 * project. It is also why the hero's rest state can be computed during the
 * SERVER render and hydrate without a warning: every number here is plain
 * arithmetic that both sides agree on.
 *
 * ★ THE TYPE'S CLEAR LANE IS MEASURED, NOT CHOSEN. `build` walks every frame
 * over its whole flight and answers "how far from the axis does this stream
 * reach at the headline's own measure", and the block is placed outside that
 * answer plus a margin. So "no photograph is ever under a word" is the
 * condition the composition is drawn from rather than a hope about it, and
 * retuning a number re-solves it instead of breaking it. There is no darkening
 * layer anywhere over a photograph, which is the argument (bible 1).
 *
 * ★ THE ENGINE IS A CLOSED FORM OF THE CLOCK. A frame's progress is
 * `((its launch time * reveal + elapsed) mod cycle) / flight`, so recycling
 * falls out of the modulo, the still is the loop frozen at a chosen elapsed,
 * and there is no per-card bookkeeping, no timer and no React state.
 *
 * ★ NOTHING IS DEALT. Every value a frame carries is a step in a short declared
 * cycle (the launch beat, the aspect table), which is what let the board answer
 * "the random stream feels worse than a more polished one".
 *
 * ★ WHAT CHANGED ON THE WAY OUT OF THE LAB, and why. The board solved two fixed
 * CANVASES (1440 and 375) and stored every horizontal in canvas pixels. A real
 * viewport is any width, so the horizontal is stored here as a fraction of the
 * hero's HALF-WIDTH and multiplied by `--hhs-half` (50cqw) in the transform:
 * the band stretches to whatever it is given and the scale, the opacity and the
 * curl, which are all functions of that same fraction, do not move at all. The
 * only numbers still in pixels are the ones that should be (the card box, the
 * code, the type's measures), and they swap at the `lg` breakpoint.
 */

/** The two geometries the hero carries: the base column and Tailwind's `lg`. */
export type Bp = "base" | "lg";

export const BPS: readonly Bp[] = ["base", "lg"];

/** Where the geometry swaps, in px. The sheet's media query says it too, and
 *  that is the one duplication here: a CSS media query cannot read a module. */
export const LG_MIN = 1024;

/** The site header is a transparent 4rem overlay sitting ON the hero, so the
 *  code has to start below it (the band is deliberately allowed to run under
 *  it: media behind transparent chrome is the house look). */
const HEADER = 64;

/** The white plate's padding around the code, per side: FooterQr's own `p-2`,
 *  which is part of the object the type has to clear. */
const PLATE_PAD = 8;

export type Geo = {
  /** The QR's edge in px, quiet zone included; 112 still scans from a phone. */
  qr: number;
  /** The unit card box at transform scale 1, before its aspect. */
  card: number;
  /** The corridor's perspective. A curl reads only under a short one. */
  perspective: number;
  /** How much of each edge the band dissolves over. */
  fade: string;
  /**
   * ★ THE BLOCK'S BOX, and its width is the widest line's INK rather than any
   * element's box: the headline's two rendered lines at this breakpoint, plus
   * headroom. It is the column the stream's reach is measured at, so re-measure
   * it if the ruled line changes: copy is open (bible 21), and this is the one
   * number a rewrite can invalidate. The height is measured on the rendered
   * block (headline, sentence, actions and their gaps).
   */
  blockW: number;
  blockH: number;
  /** The h1's own max-width, which is a typographic choice (it is tuned so the
   *  ruled thesis breaks into good lines), and the sentence's measure. */
  h1Max: number;
  lowMax: number;
  /** The margin the type keeps from the stream's measured reach. */
  margin: number;
  /** Extra clearance on top of `margin`: a band wants air over it. */
  breath: number;
  /** Air between the header and the code's plate, and under the block. */
  airTop: number;
  airFoot: number;
  /** The code's centre as a percentage of the hero's height, before the clamp. */
  axisPct: number;
  /**
   * THE DESIGN REFERENCE, halved: the viewport this breakpoint's table was
   * drawn and judged on (1440 and 375, the board's two canvases). The clear
   * line is SOLVED here, so the composition Will picked is the composition that
   * ships at the size he picked it.
   */
  halfRef: number;
  /**
   * ★ THE NARROWEST VIEWPORT THIS BREAKPOINT SERVES, halved, and the reason
   * both numbers exist. Every horizontal here is a fraction of the half-width,
   * so a frame's PIXEL width covers a wider FRACTION of a narrow screen than of
   * a wide one: the same band crowds the block harder at 1024 than at 1440.
   * The loop's exit is taken here so a frame is never dropped while it is still
   * on screen, and `hero-stream.test.ts` re-checks the clear lane here, where
   * the designed air is at its thinnest. If that check ever fails, the answer
   * is a third breakpoint, never a thinner margin.
   */
  halfMin: number;
};

export const GEO: Record<Bp, Geo> = {
  base: {
    qr: 112,
    card: 155,
    perspective: 360,
    fade: "16%",
    blockW: 343,
    blockH: 296,
    h1Max: 343,
    lowMax: 343,
    margin: 28,
    breath: 12,
    airTop: 16,
    airFoot: 24,
    axisPct: 32,
    halfRef: 187.5, // the 375 canvas the board was judged on
    halfMin: 160, // a 320 px phone
  },
  lg: {
    qr: 144,
    card: 300,
    perspective: 700,
    fade: "12%",
    blockW: 720,
    blockH: 322,
    h1Max: 920,
    lowMax: 576,
    margin: 26,
    breath: 56,
    airTop: 20,
    airFoot: 28,
    axisPct: 36,
    halfRef: 720, // the 1440 canvas the board was judged on
    halfMin: 512, // a 1024 px window, where `lg` starts
  },
};

/** The block's half-column, as a fraction of the hero's half-width at the
 *  breakpoint's own design reference: the column the stream's reach is
 *  measured at, derived so the block's width is the only place it is typed. */
export const colOf = (geo: Geo) => geo.blockW / (2 * geo.halfRef);

/** The shapes an album is made of: half 4:5 portrait (a phone held up), a
 *  quarter square, a quarter 4:3. Each pair has the same area, so neighbouring
 *  frames carry the same visual weight whatever shape they are. */
const ASPECTS = [
  [0.9, 1.11], // 4:5 portrait
  [1, 1], // square
  [1.15, 0.87], // 4:3 landscape
  [0.9, 1.11], // 4:5 again
] as const;

/**
 * THE STAND-IN FRAMES: the twelve manifest images, sequenced so neighbours vary
 * in palette and subject. Every id is resolved through the media manifest,
 * which is the only source of a path (bible 18), and `hero-stream.test.ts`
 * holds each one to it. Will's 34-square set (ASSETS row 2) replaces them by
 * id and nothing else changes: the stream needs 18 for no photograph to be on
 * screen twice, and these twelve repeat until it lands.
 */
export const STREAM_FRAMES = [
  "wedding-golden",
  "party-dj",
  "reception-table",
  "festival-lights",
  "wedding-petals",
  "concert-confetti",
  "wedding-toast",
  "festival-crowd",
  "wedding-rings",
  "reception-hall",
  "party-balloons",
  "wedding-arch",
] as const;

/* ── The band's table ────────────────────────────────────────────────────── */

/**
 * THE MELIUS SHAPE, the reference Will named on round six: one file a side on
 * ONE axis. No station, no roll, one depth, so the only variables are the two
 * that read as space, size and turn, and both are functions of the distance
 * crossed rather than of the clock.
 *
 * ★ THE SPACING IS THE FRAME'S OWN WIDTH, and that is what the exponential
 * travel buys. An even travel with a scale that opens outward puts big frames
 * on top of each other at the edge and tiny ones far apart at the code; a
 * travel whose velocity grows about as fast as the frame does keeps the gap
 * between neighbours a fixed fraction of their width the whole way out, which
 * is what a file of photographs looks like when nobody has bumped it.
 *
 * ★ THE CURL IS THE TURN GROWING WITH THE DISTANCE. The outer edge of a frame
 * comes forward harder the further out it stands, under a short perspective, so
 * the band reads as the inside of a cylinder with the code on its far wall
 * rather than as a row of flat cards.
 */

/** One launch per beat, per arm; the pair leaves together, which is the symmetry. */
const BEAT: Record<Bp, number> = { base: 1350, lg: 1250 };

/** One frame's flight, birth to gone, in ms. */
export const FLIGHT = 9600;

/** How far a frame travels over a whole flight, in HALF-WIDTHS of the hero. */
const SPAN: Record<Bp, number> = { base: 2.6, lg: 2.08 };

/** e^KAPPA is the ratio of the velocity at the edge to the velocity at the code. */
const KAPPA = 2.3;

/** The curl, in degrees: a few at the code, hard at the edge. */
const TURN = { code: 6, edge: 44 } as const;

/** The transform scale a frame reaches at the edge. */
const GAIN = 0.92;

/** The unit card box, as a multiple of `Geo.card`. */
const CARD_SCALE = 0.85;

/** The branch-out: the launch times are multiplied by this, so at elapsed 0
 *  every frame is inside the QR and REVEAL_MS later the band is deployed. */
export const REVEAL_MS = 1750;

/* ── The primitives ──────────────────────────────────────────────────────── */

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

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

/* ── One frame ───────────────────────────────────────────────────────────── */

export type Card = {
  key: string;
  /** -1 = the left arm, 1 = the right. */
  dir: 1 | -1;
  /** Position in its arm: the launch order, the aspect and the photograph. */
  slot: number;
  /** The index into STREAM_FRAMES. */
  photo: number;
  /** The unit box in px at transform scale 1. */
  w: number;
  h: number;
  /** The launch time inside the cycle, in ms. */
  at: number;
};

/** The distance crossed, as a fraction of the whole travel. */
const travelAt = (p: number) =>
  (Math.exp(KAPPA * clamp01(p)) - 1) / (Math.exp(KAPPA) - 1);

/**
 * ★ SCALE, OPACITY AND TURN ARE FUNCTIONS OF THE DISTANCE CROSSED, never of the
 * phase, and `out` is that distance: 0 at the code, 1 at the edge of the hero,
 * on past it as the frame leaves. Reading them off the distance is also what
 * makes them width-independent, so one table serves every viewport the
 * breakpoint covers.
 */

/** Growing from the code outward from the first pixel: the whole band is the
 *  growth, so it starts at once. */
const scaleAt = (out: number) => 0.18 + 0.82 * Math.pow(clamp01(out), 1.2);

/** Solid once its edge clears the plate: emerging from BEHIND the object,
 *  never switched on beside it. */
export const opacityAt = (out: number) => smoothstep(0.02, 0.14, out);

const turnAt = (out: number, dir: 1 | -1) =>
  -dir * (TURN.code + (TURN.edge - TURN.code) * smoothstep(0.2, 1, out));

/**
 * Where a frame is at a phase: `x` and `out` in HALF-WIDTHS of the hero, the
 * transform scale, and the half-extents in px. The one description the loop,
 * the rest state, the DOM box, the clear lane and the tests all measure.
 */
export function placeAt(c: Card, p: number, bp: Bp) {
  const out = travelAt(p) * SPAN[bp];
  const s = scaleAt(out) * GAIN;
  return { s, out, x: c.dir * out, hw: (c.w / 2) * s, hh: (c.h / 2) * s };
}

/**
 * One frame at one phase, as the loop and the rest state both need it. The two
 * have to agree exactly or the first frame after hydration is a jump, which is
 * why they are one function rather than two.
 *
 * ★ THE HORIZONTAL IS A CALC, not a pixel count. `--hhs-half` is half the
 * hero's own width (50cqw on the corridor), so this one string is correct at
 * every viewport and on resize, and the sheet can paint the rest state with no
 * script at all. The vertical is a flat zero: the band runs on one axis.
 */
export function frameAt(c: Card, p: number, bp: Bp, fit: number) {
  const q = placeAt(c, p, bp);
  return {
    transform: `translate3d(calc(var(--hhs-half) * ${q.x.toFixed(4)}), 0px, 0) rotateY(${turnAt(q.out, c.dir).toFixed(2)}deg) scale(${(q.s / fit).toFixed(4)})`,
    opacity: opacityAt(q.out),
    // Near over far, as an integer so the browser is not handed a new stacking
    // order sixty times a second. Apparent size IS the depth on one axis, so
    // one number orders the whole band.
    z: 1 + Math.round(q.s * 40),
  };
}

/* ── The solvers, run once per breakpoint at module load ─────────────────── */

/** The sampling resolution: 480 over a flight is a 20 ms answer, finer than
 *  any fade the band carries. */
const SCAN = 480;

export type Built = {
  cards: Card[];
  /** Launch slots per arm. */
  pool: number;
  /** The cycle a slot relaunches on. */
  cycle: number;
  /** Per card, in order: the DOM box, the scale divisor, and the progress past
   *  which the loop stops writing to it. */
  box: { w: number; h: number; fit: number; exit: number }[];
  /**
   * THE BLOCK'S TOP, in px below the axis: the measured clear line the
   * headline, the sentence and the actions hang from.
   */
  low: number;
  /**
   * The axis's floor, in px from the hero's TOP EDGE, which is not the top of
   * the screen: the hero is pulled up under the site header by one header's
   * height, so the header's own band ends two header heights into the box and
   * the code has to start below that.
   */
  axisMin: number;
  /** The block's whole reach below the axis, `low` included: the clamp's tail. */
  below: number;
  /** What the hero cannot be shorter than, in px, for the code to clear the
   *  header and the block to clear the stream and the fold. */
  minH: number;
  /** The busiest instant's frame count, and the largest DOM box. */
  facts: { onScreen: number; largest: number };
};

/**
 * The largest transform scale a frame ever reaches WHILE A PERSON CAN SEE IT,
 * and the progress at which it has left the hero. The first sizes the DOM box
 * so no frame is ever rasterized above 1:1 on screen; the second lets the loop
 * stop writing to a frame that is gone, which keeps about half the pool off the
 * compositor.
 */
function fitOf(c: Card, bp: Bp) {
  const { halfMin } = GEO[bp];
  let fit = 0.001;
  let exit = 1;
  for (let i = 0; i <= SCAN; i++) {
    const p = i / SCAN;
    const q = placeAt(c, p, bp);
    // Past the edge of the narrowest viewport this breakpoint serves, which is
    // the last one the frame is still visible on (see Geo.halfMin): taken there
    // so the loop never stops writing to a frame a wider screen still shows.
    if (Math.abs(q.x) - q.hw / halfMin > 1) {
      exit = p;
      break;
    }
    if (opacityAt(q.out) > 0.004 && q.s > fit) fit = q.s;
  }
  // ★ A SAMPLED MAXIMUM IS NOT THE MAXIMUM. The scan lands on a grid and the
  // true peak falls between two samples, so the DOM box is given one percent of
  // headroom: the error at this resolution is under three tenths of a percent,
  // and the whole point of `fit` is that the on-screen size is never LARGER
  // than the box.
  return { fit: fit * 1.01, exit };
}

/**
 * How far from the axis the stream reaches over the block's column: every
 * frame, every sample, the tallest half-height of any frame whose horizontal
 * span covers that column. This is the measurement the block is placed from, so
 * "no photograph is ever under a word" is a condition the composition is drawn
 * from rather than a hope about it. Rotation is not modelled (a rotateY only
 * narrows a box), so the answer carries an eight percent allowance.
 *
 * `half` decides which viewport the question is asked at, because a frame's
 * pixel width is a wider FRACTION of a narrow screen: `Geo.halfRef` is the
 * design reference the answer is solved at, `Geo.halfMin` the worst case
 * `hero-stream.test.ts` re-checks.
 */
export function reachOf(cards: Card[], bp: Bp, col: number, half: number) {
  let out = 0;
  for (const c of cards) {
    for (let i = 0; i <= SCAN; i++) {
      const p = i / SCAN;
      const q = placeAt(c, p, bp);
      if (opacityAt(q.out) <= 0.02) continue;
      const ax = Math.abs(q.x);
      const hw = q.hw / half;
      if (ax - hw <= col && col <= ax + hw && q.hh > out) out = q.hh;
    }
  }
  return out * 1.08;
}

export function build(bp: Bp): Built {
  const geo = GEO[bp];
  // Every airborne frame needs its own node, plus one on the ground so a slot
  // never relaunches while its last flight is still running.
  const pool = Math.ceil(FLIGHT / BEAT[bp]) + 1;
  const cycle = pool * BEAT[bp];
  const half = Math.round(STREAM_FRAMES.length / 2);
  const cards: Card[] = Array.from({ length: pool * 2 }, (_, g) => {
    const right = g % 2 === 1;
    const slot = (g - (right ? 1 : 0)) / 2;
    const [aw, ah] = ASPECTS[(slot + (right ? 1 : 0)) % ASPECTS.length];
    return {
      key: `hhs-${g}`,
      dir: (right ? 1 : -1) as 1 | -1,
      slot,
      // The two arms read their photographs from windows half the set apart,
      // so a pair leaving together is never the same picture twice.
      photo: slot + (right ? half : 0),
      w: geo.card * CARD_SCALE * aw,
      h: geo.card * CARD_SCALE * ah,
      at: mod(slot * BEAT[bp], cycle),
    };
  });

  const box = cards.map((c) => {
    const { fit, exit } = fitOf(c, bp);
    return { w: Math.round(c.w * fit), h: Math.round(c.h * fit), fit, exit };
  });

  // The plate is the other thing the type has to clear, and near the centre it
  // is the taller of the two: the stream there is entirely behind it.
  const plate = geo.qr / 2 + PLATE_PAD + geo.margin;
  // ★ SOLVED AT THE LINE NEAREST THE STREAM, AT THAT LINE'S OWN MEASURE. The
  // block's top line is the headline, which is also its widest, so the column
  // is the headline's ink.
  const low = Math.max(
    Math.round(
      reachOf(cards, bp, colOf(geo), geo.halfRef) + geo.margin + geo.breath,
    ),
    plate,
  );
  const below = low + geo.blockH + geo.airFoot;
  const axisMin = 2 * HEADER + geo.airTop + geo.qr / 2 + PLATE_PAD;

  return {
    cards,
    pool,
    cycle,
    box,
    low,
    axisMin,
    below,
    // The two ends of the clamp meet exactly here, which is the point: at this
    // height the code sits at its floor AND the block ends at the fold, so
    // anything taller has room to spare and anything shorter would have to
    // give one of them up.
    minH: axisMin + below,
    facts: countAt(cards, box, bp),
  };
}

/**
 * What the composition costs, measured rather than asserted: how many frames
 * are on screen at once and the largest DOM box. Sampled across one whole
 * cycle, because a cadence has a busiest instant and a quietest one and an
 * average would hide both; the count reported is the busiest, which is the one
 * that costs.
 */
function countAt(cards: Card[], box: Built["box"], bp: Bp) {
  const pool = Math.ceil(FLIGHT / BEAT[bp]) + 1;
  const cycle = pool * BEAT[bp];
  let onScreen = 0;
  for (let t = 0; t < cycle; t += 40) {
    let n = 0;
    for (let i = 0; i < cards.length; i++) {
      const p = mod(cards[i].at + t, cycle) / FLIGHT;
      if (p <= box[i].exit && opacityAt(placeAt(cards[i], p, bp).out) > 0.02)
        n++;
    }
    if (n > onScreen) onScreen = n;
  }
  return { onScreen, largest: Math.max(...box.map((b) => b.w)) };
}

/** Both breakpoints, solved once for the module. Plain arithmetic on both
 *  sides, so the server and the browser agree and the rest state hydrates
 *  without a warning. */
export const BUILT: Record<Bp, Built> = {
  base: build("base"),
  lg: build("lg"),
};

/**
 * THE BLOCK'S BOX as the test measures it: the half-column as a FRACTION of the
 * hero's half-width (a frame's own x is one too), the top and the foot in px
 * below the code. `half` is the viewport the question is asked at; passing
 * `Geo.halfMin` asks it where the band crowds the block hardest.
 */
export function blockBox(bp: Bp, half: number) {
  const geo = GEO[bp];
  const { low } = BUILT[bp];
  return {
    col: geo.blockW / (2 * half),
    top: low,
    bottom: low + geo.blockH,
  };
}

/**
 * The `sizes` every frame carries, derived from the largest DOM box each
 * breakpoint actually renders rather than typed by hand: retune the card and
 * the request retunes with it. Never a vw value, because the box is a fixed
 * pixel size at a given breakpoint and a vw would over-fetch on a wide screen.
 */
export const FRAME_SIZES = `(min-width: ${LG_MIN}px) ${BUILT.lg.facts.largest}px, ${BUILT.base.facts.largest}px`;

/** The phase a frame stands at when nothing is running: the band deployed at
 *  its steady spacing, which is what reduced motion, a crawler, a cold paint
 *  and a reader with scripting off all get. */
export const restPhase = (c: Card) => Math.min(c.at / FLIGHT, 1);

/** The launch clock, as a closed form: the ONE expression the loop runs. */
export const phaseOf = (
  c: Card,
  elapsed: number,
  reveal: number,
  cycle: number,
) => mod(c.at * reveal + elapsed, cycle) / FLIGHT;
