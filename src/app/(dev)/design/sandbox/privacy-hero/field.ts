import { CANVAS, type Mode } from "@/components/lab";
import {
  BUILT as HOME_BUILT,
  FLIGHT as HOME_FLIGHT,
  GEO as HOME_GEO,
  placeAt as homePlaceAt,
} from "@/components/marketing/sections/home/hero-stream";

/**
 * THE FIELD ENGINE, ONE COPY (the heroes lane, 2026-09-18), lifted from the
 * album hero's round three (`album-hero/compositions.ts`) and cut to what two
 * boards share: the privacy hero's spirals and the album page's margins. Both
 * import it from here, and neither keeps a second copy; `album-hero` stands
 * untouched until its own wiring.
 *
 * ★ WHAT CAME ACROSS: THE CLOCK IS A CLOSED FORM. A card's age is
 * `(its launch offset + elapsed) mod cycle`, so recycling falls out of the
 * modulo, the still is the loop at elapsed 0, and there is no timer, no
 * per-card bookkeeping and no React state. A composition is two functions of
 * a card's age, `place` and `opacity`, and everything else here (the DOM box,
 * the rest state, the facts) reads those two and nothing else.
 *
 * ★ WHAT DID NOT: THE CALM CAPS. Round three pinned 40 px a second and sixteen
 * lit frames on every composition with a test, so all four were calm by
 * construction and Will found them "too boring" (2026-09-18). Nothing here is
 * a limit. The pace is read off the home hero (`HOME` below) and every option
 * on both boards is graded AGAINST it ("the home hero's pace", "a notch under
 * it"), which is how a relative note is answered (docs/PROGRAM.md).
 *
 * ★ THE JITTER FIX CAME ACROSS TOO. A card's DOM box is sized to the largest
 * moment anybody sees it at, and the transform only scales DOWN from there, so
 * no photograph is re-rasterised above its own raster (`fit` in `solve`).
 *
 * Pure, and that is load-bearing: no React, no stylesheet, so every
 * composition solves at module load, the server and the browser compute the
 * same still, and the node tests read the same tables the board draws.
 */

export { CANVAS, type Mode };

/* ── The reference: the home hero, measured rather than retyped ─────────── */

/** The home hero's breakpoint that each lab canvas is judged at. */
const BP = { desktop: "lg", phone: "base" } as const;

/**
 * How far a home-hero frame has travelled `ms` after it left the code, in px
 * at that breakpoint's design reference (1440 and 375). It is the SHIPPED
 * curve (`hero-stream.ts`, imported read-only), so a retune of the home hero
 * re-paces both boards with it. Past its own flight the home curve stops, so
 * the tail carries on at its final speed.
 */
export function homeTravel(ms: number, mode: Mode): number {
  const bp = BP[mode];
  const card = HOME_BUILT[bp].cards[0];
  const px = (p: number) =>
    homePlaceAt(card, p, bp).out * HOME_GEO[bp].halfRef;
  if (ms <= 0) return 0;
  if (ms <= HOME_FLIGHT) return px(ms / HOME_FLIGHT);
  const step = 1 / 480;
  const v = (px(1) - px(1 - step)) / (HOME_FLIGHT * step);
  return px(1) + v * (ms - HOME_FLIGHT);
}

/** The speed on that curve `ms` after launch, px a second. */
export function homeSpeed(ms: number, mode: Mode): number {
  const d = 8;
  return ((homeTravel(ms + d, mode) - homeTravel(ms, mode)) / d) * 1000;
}

/** When the home curve reaches `px` from its birth, in ms. */
export function homeTimeTo(px: number, mode: Mode): number {
  let lo = 0;
  let hi = HOME_FLIGHT * 4;
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2;
    if (homeTravel(mid, mode) < px) lo = mid;
    else hi = mid;
  }
  return hi;
}

/**
 * THE REFERENCE PACE, as the numbers every option on both boards is graded
 * against: a pair every 1250 ms at 1440 (1350 at a phone), a frame leaving the
 * code at about 40 px a second and reaching about 212 by the edge of the
 * screen, seven seconds later, with about ten frames lit at once. All of it is
 * measured off the shipped engine, never typed.
 */
export const HOME = (() => {
  const of = (mode: Mode) => {
    const bp = BP[mode];
    const half = HOME_GEO[bp].halfRef;
    return {
      beat: Math.round(HOME_BUILT[bp].cycle / HOME_BUILT[bp].pool),
      flight: HOME_FLIGHT,
      launch: homeSpeed(0, mode),
      edge: homeSpeed(homeTimeTo(half, mode), mode),
      edgeMs: homeTimeTo(half, mode),
      lit: HOME_BUILT[bp].facts.onScreen,
      half,
    };
  };
  return { desktop: of("desktop"), phone: of("phone") } as const;
})();

/* ── The primitives ──────────────────────────────────────────────────────── */

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export const mod = (a: number, n: number) => ((a % n) + n) % n;

export const rad = (deg: number) => (deg * Math.PI) / 180;

/**
 * A card's rotated half-extents. A roll widens the box it really occupies and
 * every clearance here is an axis-aligned test, so the rotation is folded into
 * the extents rather than ignored.
 */
export function extents(w: number, h: number, roll: number) {
  const c = Math.abs(Math.cos(rad(roll)));
  const s = Math.abs(Math.sin(rad(roll)));
  return { hw: (w * c + h * s) / 2, hh: (w * s + h * c) / 2 };
}

/**
 * ★ THE SMALLEST RADIUS ALONG A RAY AT WHICH A BOX IS CLEAR OF ANOTHER. Two
 * axis-aligned boxes miss the moment ONE axis separates them, so the answer is
 * the nearer crossing: a card beside the block clears on x, above it on y.
 * Infinity along an axis the box never leaves.
 */
export function clearRadius(
  angle: number,
  bw: number,
  bh: number,
  hw: number,
  hh: number,
) {
  const cx = Math.abs(Math.cos(angle));
  const cy = Math.abs(Math.sin(angle));
  const rx = cx < 1e-6 ? Infinity : (bw + hw) / cx;
  const ry = cy < 1e-6 ? Infinity : (bh + hh) / cy;
  return Math.min(rx, ry);
}

/** The shapes an album is made of: half 4:5 (a phone held up), a quarter
 *  square, a quarter 4:3, each pair the same area so neighbours weigh the same.
 *  The home hero's own table, so the three heroes share one family of frames. */
export const ASPECTS = [
  [0.9, 1.11],
  [1, 1],
  [1.15, 0.87],
  [0.9, 1.11],
] as const;

/** A few degrees of tilt, walked in order: photographs laid down, never dealt. */
export const ROLLS = [-3, 2, -1.5, 3.5, -2.5, 1.5, -3.5, 2.5] as const;

/* ── A composition ───────────────────────────────────────────────────────── */

export type Card = {
  key: string;
  /** Position in the launch table; also the stand-in photograph's index. */
  slot: number;
  photo: number;
  /** The unit box, px at transform scale 1, before `fit`. */
  w: number;
  h: number;
  /** How far into its flight the card is at elapsed 0, in ms: the clock. */
  at: number;
  /** rotateZ in degrees, constant for the card's whole life. */
  roll: number;
};

/** A card at an age: its centre in canvas px from the top left, its scale. */
export type Place = { x: number; y: number; s: number };

export type Field<C extends Card = Card> = {
  mode: Mode;
  cards: C[];
  /** ms between one launch of a slot and the next. */
  cycle: number;
  /** ms a card is airborne; past it the card is on the ground, unlit. */
  flight: number;
  place: (c: C, age: number) => Place;
  opacity: (c: C, age: number) => number;
  /** What each card leaves behind it, if anything. */
  trail?: TrailSpec<C>;
};

export type Solved<C extends Card = Card> = Field<C> & {
  /** Per card: the DOM box, the scale it divides by, the age past which the
   *  loop stops writing to it. */
  box: { w: number; h: number; fit: number; exit: number }[];
  facts: {
    /** The most cards lit at one instant over a whole cycle. */
    lit: number;
    /** DOM nodes the composition hands the compositor (trails not counted). */
    nodes: number;
    /** The fastest a lit card moves, px a second. */
    fastest: number;
  };
};

/** The age a card stands at when nothing runs: the loop at elapsed 0. */
export const restAge = (c: Card) => c.at;

/** THE ONE EXPRESSION THE LOOP RUNS: a card's age at an elapsed time. */
export const ageOf = (c: Card, elapsed: number, cycle: number) =>
  mod(c.at + elapsed, cycle);

/** The sampling resolution the solvers walk a flight at. */
const SCAN = 480;

/**
 * The box, the exit and the facts, measured off `place` and `opacity` rather
 * than claimed. ★ A SAMPLED MAXIMUM IS NOT THE MAXIMUM: the true peak falls
 * between two samples, so the DOM box carries one per cent of headroom.
 */
export function solve<C extends Card>(field: Field<C>): Solved<C> {
  const { cards, flight, cycle } = field;
  const box = cards.map((c) => {
    let fit = 0.001;
    let exit = flight;
    let lit = false;
    for (let i = 0; i <= SCAN; i++) {
      const age = (i / SCAN) * flight;
      const o = field.opacity(c, age);
      if (o > 0.004) {
        lit = true;
        const s = field.place(c, age).s;
        if (s > fit) fit = s;
      } else if (lit) {
        exit = age;
        break;
      }
    }
    fit *= 1.01;
    return { w: Math.round(c.w * fit), h: Math.round(c.h * fit), fit, exit };
  });

  let lit = 0;
  const step = Math.max(10, Math.round(cycle / 600));
  for (let t = 0; t < cycle; t += step) {
    let n = 0;
    for (const c of cards) {
      const age = ageOf(c, t, cycle);
      if (age <= flight && field.opacity(c, age) > 0.02) n++;
    }
    if (n > lit) lit = n;
  }

  let fastest = 0;
  const dt = flight / SCAN;
  for (const c of cards) {
    for (let i = 0; i < SCAN; i++) {
      const age = i * dt;
      if (field.opacity(c, age) <= 0.02) continue;
      const a = field.place(c, age);
      const b = field.place(c, age + dt);
      const v = (Math.hypot(b.x - a.x, b.y - a.y) / dt) * 1000;
      if (v > fastest) fastest = v;
    }
  }

  return {
    ...field,
    box,
    facts: { lit, nodes: cards.length, fastest: Math.round(fastest) },
  };
}

/**
 * One card at one age, as the three things the DOM wants. The loop and the rest
 * state both read this, so the first frame after hydration cannot jump.
 */
export function frameAt<C extends Card>(
  field: Field<C>,
  c: C,
  age: number,
  fit: number,
  box: { w: number; h: number },
) {
  const q = field.place(c, age);
  return {
    transform: `translate3d(${(q.x - box.w / 2).toFixed(2)}px, ${(q.y - box.h / 2).toFixed(2)}px, 0) rotate(${c.roll.toFixed(2)}deg) scale(${(q.s / fit).toFixed(4)})`,
    opacity: field.opacity(c, age),
    // Near over far, as an integer so the browser is not handed a new stacking
    // order sixty times a second: apparent size IS the depth here.
    z: 2 + Math.round(q.s * 40),
  };
}

/* ── The trail: what a card leaves behind it ─────────────────────────────── */

/**
 * WILL'S DECAYING TRAIL, AS A FUNCTION OF THE CLOCK, never of history. A trail
 * that accumulates frames (a canvas faded a little every frame) is the
 * long-exposure look, but it has no rest state, it drifts with the frame rate
 * and 8-bit alpha never quite reaches zero, so it leaves a haze. Here a trail
 * node is a pure function of the card and its age, like the card itself, so
 * the rest state, the loop and a reader with scripting off all agree, and a
 * paused hero is a still photograph of a moving one.
 *
 * A composition that leaves a trail says what KIND of node it draws (a soft
 * `smear` of the card's own photograph, or a crisp `ghost` of it), how many a
 * card owns, and where each one is at an age; the layer does the rest.
 */
export type TrailSpec<C extends Card = Card> = {
  kind: "smear" | "ghost";
  /** Nodes per card. */
  count: number;
  /** The k-th node (0-based) of a card at an age: the DOM's two strings. */
  at: (
    c: C,
    age: number,
    k: number,
    fit: number,
    box: { w: number; h: number },
  ) => { transform: string; opacity: number };
};
