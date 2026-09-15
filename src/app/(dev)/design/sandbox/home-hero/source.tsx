"use client";

// the concept's own sheet; keyframes here would carry the hhs- prefix (it
// declares none: the corridor is one rAF loop writing inline transforms).
import "./source.css";

import Link from "next/link";
import { type CSSProperties, useEffect, useRef } from "react";

import { Caption } from "@/components/marketing/system/caption";
import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

import {
  CANVAS,
  type Concept,
  type ConceptProps,
  DemoQr,
  FRAMES,
  GUTTER,
  LADDER,
  type Mode,
  Photo,
  copyFor,
} from "./shared";

/**
 * THE SOURCE (concept 1 of the home-hero board). ROUND FOUR, 2026-09-15.
 *
 * Will ruled this direction twice: round two as "definitely my favorite
 * direction", and round four as "let's continue iterating on 1 in its current
 * emanating direction". So the silhouette is fixed and everything inside it was
 * judged again from the ground up (bible 22).
 *
 * The argument, unchanged. Every other hero we have drawn puts photographs
 * behind words and then dims the photographs so the words survive. This one
 * refuses the trade by changing the shape of the composition: the album is a
 * horizontal CORRIDOR through the middle of the frame, the type lives above it
 * and below it, and at the corridor's exact centre the real demo QR stands
 * still at scanning size. The frames are born behind it and fly outward for
 * ever. The QR is the eyebrow, the object and the argument at once.
 *
 * ── WHAT ROUND FOUR CHANGED, and why ──
 *
 * 1. THE CORRIDOR WAS A PLANE. Every frame rode one scale curve, one travel
 *    curve and one size, so twenty-four photographs left the code on a single
 *    sheet of glass and the only depth in the picture was a 9.5 degree turn.
 *    It is a VOLUME now, in two ways. Three lanes (LANES below), each a depth,
 *    each scaling size, travel, vertical drift and turn together: a far frame is
 *    two thirds the size, crosses the canvas two thirds as fast and stays on
 *    screen longer, while a near frame is large, quick and gone. And the arms
 *    open as they go (the funnel, Geo.spread): the drift is multiplied by how far
 *    out the frame already is, so the two arms converge to a point at the code
 *    and have opened to nearly twice the drift by the canvas edge. The corridor
 *    is a cone with the object at its apex, which is what "emanating" looks like
 *    drawn rather than asserted, and it carries the album into the two top
 *    corners the centred lockup leaves empty. Paint order follows apparent size,
 *    so near frames pass over far ones; the z-index is written only when its
 *    integer changes, which is a few times a second per card rather than sixty.
 *
 * 2. EVERY FRAME WAS A SQUARE. Guests shoot on phones, so an album is mostly
 *    portrait with landscape and square through it. The corridor is now half
 *    4:5 portrait, a quarter square and a quarter 4:3 landscape, cropped from
 *    the same source frames, and it reads as an album instead of a contact
 *    sheet. This costs no new asset: a 512 square centre-crops to both.
 *
 * 3. THE PHOTOGRAPHS WERE TOO SMALL AND TOO FEW. Round three ran five frames a
 *    side, and Will's own note on the board asked whether the corridor was
 *    dense enough. Round four runs EIGHT a side. ONE definition of density is
 *    used everywhere in this file so that two rounds can be compared at all:
 *    the on-canvas width of every visible frame, summed, over the canvas width,
 *    sampled every 80 ms for ten seconds off the running board. Round four at
 *    1440: 14 to 18 frames on screen (median 16) in DOM boxes of 239 to 370 px,
 *    which is 1.08 to 1.28 canvas widths of photograph (median 1.12). Round
 *    three's model under exactly that definition: 10 frames and 0.9 canvas
 *    widths. The phone runs six a side in boxes of 117 to 187 px and overlaps
 *    to about 1.5 canvas widths, because 375 is too narrow for a stream that
 *    does not. The cadence is per canvas (Geo.launch) because density is a
 *    composition decision and 375 is its own composition.
 *
 * 4. THE DOM BOX WAS GUESSED. One hand-tuned gain kept the cards from being
 *    rasterized above 1:1 on screen. Each card now measures its own largest
 *    on-canvas moment at module load (fitOf) and is sized to exactly that, so
 *    no frame is ever upscaled while a person can see it, whatever its lane or
 *    its aspect. The same scan gives the progress a card is finally past the
 *    edge, and the loop stops writing to it there, which keeps about half the
 *    airborne cards off the compositor.
 *
 * 5. THE TYPE'S CLEAR LANE WAS A NUMBER SOMEONE CHOSE. The offsets are measured
 *    now: reachOf walks every card over its whole flight and answers "how far
 *    from the axis does the corridor reach at this distance from the centre",
 *    and the headline and the lower block are placed outside that answer plus a
 *    margin. So "no photograph is ever under a word" is the condition the
 *    composition is drawn from rather than a hope about it, and it re-solves
 *    itself if the cadence, the lanes or the aspects change. The measurement
 *    also settled an open question from round three: at this geometry the
 *    corridor clears a ONE-line headline too, so the two-line headline at 1440
 *    is a compositional choice (a single 96 px line runs nearly the full canvas
 *    and reads as a banner), not a collision. Measured on the rendered boxes at
 *    1440, rotation and perspective included: the corridor reaches 143 units
 *    from the axis at the headline's own measure and the headline sits at 192,
 *    it reaches 80 at the caption's and the caption sits at 117, and at the
 *    centre column it reaches 54, which is entirely behind the 144 px plate.
 *    The other measured ceiling is the site header: see Geo.margin.
 *
 * 6. A READER WITH JAVASCRIPT OFF GOT AN EMPTY BAND. The pre-burst frame has to
 *    live in CSS or the corridor paints deployed and snaps back to the code, and
 *    it has to live inside the reduced-motion block or a reader who asked for
 *    less motion gets the snap instead. That left one gap: motion allowed,
 *    scripting off. A <noscript> companion rule closes it (NOSCRIPT_RULE below),
 *    so the departure round three flagged is fixed rather than inherited.
 *
 * 7. NOTHING NAMED WHAT THE PICTURE WAS. A stranger saw a code and a lot of
 *    photographs and had to infer the link. One caption in the clear lane under
 *    the code says where the frames came from, which is the only thing the
 *    picture cannot say for itself.
 *
 * ── THE MECHANISM ──
 *
 * Ported from Melius's three.js fountain to DOM transforms, and kept. Two pools
 * split by index parity; each launches one card every `geo.launch` ms and a
 * flight lasts FLIGHT_MS. Position and scale ride SEPARATE curves, which is the whole
 * trick: position accelerates outward while scale holds tiny for the first fifth
 * and then opens. A frame leaves the code slowly and small and is large and
 * quick by the time it dissolves at the edge.
 *
 * No state, no timers, no per-card bookkeeping: a card's progress is a closed
 * form of the clock, `((slot * launch + elapsed) mod cycle) / FLIGHT`, so the
 * recycling falls out of the modulo and the transform string is a pure function
 * of elapsed time (which is what lets the loop be frozen at a chosen elapsed for
 * a still; docs/systems/testing-verification.md). ONE rAF loop fills a
 * progress[] ref and writes to the nodes; nothing here touches React state.
 *
 * The branch-out is the same expression with one extra factor: the seeded
 * offsets are multiplied by a reveal that tweens 0 to 1 over REVEAL_MS on the
 * house strong in-out curve. At elapsed 0 every seed is zero, so the album is
 * inside the QR; REVEAL_MS later it has opened into the steady corridor and the
 * clock alone carries it from there. One beat, no stagger machinery.
 *
 * ── WHAT THE INFLOW CAN TAKE (track hero-inflow, the mirror of this one) ──
 *
 * The direction is ONE constant. FLOW below is +1 here; set it to -1 and the
 * whole corridor runs the other way with nothing else changed: phaseOf maps the
 * clock to 1 - p, so a frame enters large at the edge, shrinks as it travels
 * inward, and the ramp that fades a frame UP at the code fades it DOWN there
 * instead, because opacity is a function of the phase and an inward phase ends
 * at zero. The cadence, the lanes, the aspects, the measured clear lane, the
 * rest state and the noscript rule are all direction-agnostic and can be lifted
 * whole. The two things an inflow should reconsider rather than inherit: the
 * reveal (a branch-out is an outward idea; an inflow's first beat probably wants
 * the corridor already arriving) and the paint order (near-over-far still holds,
 * but an inflow's nearest frames are the ones at the edges, so the corridor
 * converges on the plate rather than opening out of it).
 */

/* ── The clock ───────────────────────────────────────────────────────────── */

/** One card's flight, birth to edge. Shared by both canvases: the physics is one
 *  description, and only the cadence and the sizes are read per canvas. */
const FLIGHT_MS = 9600;
const REVEAL_MS = 1750;

/**
 * The direction of the whole corridor. +1 is the source: frames are born at the
 * code and fly out. -1 is the mirror the hero-inflow track builds, the same
 * corridor running inward. Nothing else in this file knows which it is.
 */
const FLOW: 1 | -1 = 1;

/* ── Depth ───────────────────────────────────────────────────────────────── */

/**
 * The three lanes of the corridor, as depth multipliers. One number per lane
 * scales the frame, its travel, its vertical drift and its turn together, which
 * is what makes a far frame small AND slow AND close to the axis rather than
 * just small. Assigned by slot so each arm walks far, middle, near for ever, and
 * the two arms are offset by two lanes, so a launch never puts the same depth
 * out on both sides at once and the corridor is never a mirror of itself.
 */
const LANES = [0.66, 0.88, 1.16] as const;

/**
 * The aspects an album is actually made of, as multipliers on the card box.
 * Half 4:5 portrait (a phone held up), a quarter square, a quarter 4:3. Each
 * pair has the same area, so a lane's frames carry the same visual weight
 * whatever shape they are. Centre-cropped from the same source frames, so this
 * asks Will for nothing the corridor was not already asking for.
 */
const ASPECTS = [
  [0.9, 1.11], // 4:5 portrait
  [1, 1], // square
  [1.15, 0.87], // 4:3 landscape
  [0.9, 1.11], // 4:5 again: half the corridor is portrait, like a real album
] as const;

/* ── Geometry, per canvas ────────────────────────────────────────────────── */

type Geo = {
  /** The QR's edge in px, quiet zone included. */
  qr: number;
  /** The unit card box at transform scale 1, before lane and aspect. */
  card: number;
  /** How far a frame travels from the centre at progress 1. */
  travel: number;
  /** The scale curve's gain: the transform scale a card reaches at progress 1. */
  gain: number;
  perspective: number;
  /** The vertical scatter at full scale, so an arm is a corridor and not a rail. */
  yDrift: number;
  /**
   * THE FUNNEL. The scatter is multiplied by this ramp, read off how far out the
   * frame already is: `base + gain * min(1, |x| / halfW)`. At the code the two
   * arms converge on a point, and by the canvas edge they have opened to nearly
   * twice the drift, so the corridor is a cone with the object at its apex
   * rather than a rail with a wobble. It also puts the album into the two top
   * corners, which the centred lockup leaves empty, WITHOUT touching the type:
   * the headline's ink stops at h1Max / 2, and the ramp is still shallow there.
   */
  spread: [base: number, gain: number];
  /** Half the canvas, the funnel's normaliser. */
  halfW: number;
  /** The corridor's half-angle in degrees, before the per-lane and per-card turn. */
  rotate: number;
  /** Canvas-relative, never a vw value: a zoom-fitted stage picks the wrong one. */
  sizes: string;
  /** How much of each edge the band dissolves over. */
  fade: string;
  /** The h1's measure, tuned so the ruled thesis breaks into two good lines. */
  h1Max: number;
  /** The h1's leading, AFTER the ladder class (a size utility carries a
   *  line-height of its own). Tight at 1440 because the block is anchored on its
   *  baseline and every px of line box is a px the site header eats. */
  h1Lead: string;
  /** The caption's measure. It is the TOP of the lower block, so it is the line
   *  the block's anchor is solved against; everything under it is further from
   *  the corridor and clears by more. */
  capMax: number;
  /** The sentence's measure. */
  lowMax: number;
  /**
   * The margin the type keeps from the corridor's measured reach, and it is what
   * the composition is tuned on. THE CEILING IS THE SITE HEADER: the cinema
   * header is a 4rem overlay sitting transparently on top of the hero, so the
   * headline's cap has to start below 64 px of canvas. At 1440 the headline is
   * two lines of the xl step (196 px of line box, and MEASURED rather than
   * assumed, only 9 px of that is leading above the cap), so the block's top has
   * to clear about 70 px and the headline's offset is capped near 195. Every size in this canvas is chosen against
   * that ceiling: it is the one number the corridor cannot simply grow past.
   */
  margin: number;
  /**
   * The cadence: one frame a side every `launch` ms, and it is a per-canvas
   * number because density is a composition decision and the two canvases are
   * different compositions. 620 at 1440 puts 8 frames a side on screen and
   * about 1.1 canvas widths of photograph with them (measured; the definition
   * and the comparison with round three are in note 3 of the file header),
   * which is a corridor you read as an album pouring out. The same cadence at
   * 375 would crowd a canvas a quarter as wide, so the phone runs at 780 and
   * still overlaps to about 1.5 canvas widths.
   *
   * THE COST OF THE STAND-INS, stated so it is not mistaken for a design fault:
   * the two arms are offset by half the frame set, so with 24 frames the two
   * arms' visible windows are disjoint and no photograph is ever on screen
   * twice. With the 12 landscape stand-ins the windows overlap by four, so four
   * photographs are on screen twice at any moment, on opposite arms, at very
   * different sizes, and three of the four in different crops (the aspect
   * assignment is offset by one arm). Will's 24 squares close it exactly.
   */
  launch: number;
};

const GEO: Record<Mode, Geo> = {
  desktop: {
    qr: 144,
    card: 300,
    travel: 1.72 * CANVAS.desktop.w,
    gain: 2.6,
    perspective: 1100,
    yDrift: 54,
    spread: [0.45, 1.15],
    halfW: CANVAS.desktop.w / 2,
    rotate: 8.5,
    sizes: "440px",
    fade: "12%",
    h1Max: 920,
    h1Lead: "leading-[0.95]",
    capMax: 360,
    lowMax: 576,
    margin: 26,
    launch: 620,
  },
  phone: {
    qr: 112,
    card: 155,
    travel: 2.05 * CANVAS.phone.w,
    gain: 2.6,
    perspective: 420,
    yDrift: 24,
    spread: [0.45, 1.15],
    halfW: CANVAS.phone.w / 2,
    rotate: 7.5,
    sizes: "240px",
    fade: "16%",
    h1Max: 343,
    h1Lead: "leading-[1.0]",
    capMax: 343,
    lowMax: 343,
    margin: 28,
    launch: 780,
  },
};

/* ── The shader primitives the corridor is written in ────────────────────── */

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** Half eased-in-quad, half linear, both over a smoothstep of progress: slow
 *  out of the source, quick at the edges. */
function travelAt(p: number) {
  const s = smoothstep(0, 1, p);
  return 0.5 * (s * s) + 0.5 * s;
}

/** A fast ramp to an eighth over the first 15%, then the rest from 20% on: the
 *  frame is a speck while it is still inside the code, then it opens. */
function scaleAt(p: number) {
  return 0.125 * smoothstep(0, 0.15, p) + 0.875 * smoothstep(0.2, 1, p);
}

/**
 * The frame fades up while it is still behind the plate and is solid before its
 * edge clears it. Measured: every lane clears the plate between progress 0.17
 * and 0.22, so a ramp that ends at 0.16 always finishes first. Emerging from
 * behind the object, never switched on beside it.
 */
const opacityAt = (p: number) => smoothstep(0, 0.16, p);

/** ease-in-out-quart, which IS --ease-in-out-strong's cubic-bezier
 *  (0.77, 0, 0.175, 1). Written out rather than solved so the reveal needs no
 *  bezier solver and stays engine-deterministic. */
function revealEase(t: number) {
  const u = clamp01(t);
  if (u < 0.5) return 8 * u * u * u * u;
  const v = 1 - u;
  return 1 - 8 * v * v * v * v;
}

const mod = (a: number, n: number) => ((a % n) + n) % n;

/** The clock's raw progress mapped to the phase the corridor is drawn at. The
 *  ONE place FLOW acts: see the inflow note at the top of the file. */
const phaseOf = (raw: number) => (FLOW === 1 ? raw : 1 - raw);

/** A deterministic 0..1 per card. Integer ops only, on purpose: Math.sin is not
 *  bit-identical across JS engines, and the server and the browser have to
 *  produce the SAME transform string or hydration warns. */
function hash01(n: number) {
  let h = Math.imul(n + 1, 2654435761) >>> 0;
  h = (h ^ (h >>> 15)) >>> 0;
  h = Math.imul(h, 2246822519) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  return h / 4294967296;
}

/* ── The cards ───────────────────────────────────────────────────────────── */

type Card = {
  key: string;
  /** -1 = the left arm, 1 = the right arm. */
  dir: 1 | -1;
  /** Position in its own pool: the launch order, the seed and the photograph. */
  slot: number;
  /** Which lane of the corridor, as an index into LANES. */
  lane: number;
  /** The lane's depth multiplier, hoisted. */
  depth: number;
  photo: number;
  /** The unit box at transform scale 1, before the per-card fit. */
  w: number;
  h: number;
  /** The vertical offset at transform scale 1, lane included. */
  yOff: number;
  sJit: number;
  ry: number;
  rz: number;
};

/**
 * The two pools. The photograph offset is half the manifest's length, so the two
 * arms never carry the same frame at the same moment: the left arm's visible
 * window is FRAMES.length / 2 consecutive pictures and the right arm's is the
 * other half, exactly. That identity is what the cadence above is derived from.
 */
function buildCards(mode: Mode, pool: number): Card[] {
  const geo = GEO[mode];
  const half = Math.round(FRAMES.length / 2);
  return Array.from({ length: pool * 2 }, (_, g) => {
    const right = g % 2 === 1;
    const slot = (g - (right ? 1 : 0)) / 2;
    const j = hash01(g);
    const jj = hash01(g + 101);
    const jjj = hash01(g + 211);
    // The arms are offset by one lane so the corridor is never a mirror of
    // itself, which a room full of phones never is either.
    const lane = (slot + (right ? 2 : 0)) % LANES.length;
    const depth = LANES[lane];
    const [aw, ah] = ASPECTS[(slot + (right ? 1 : 0)) % ASPECTS.length];
    return {
      key: `hhs-${g}`,
      dir: (right ? 1 : -1) as 1 | -1,
      slot,
      lane,
      depth,
      photo: slot + (right ? half : 0),
      w: geo.card * depth * aw,
      h: geo.card * depth * ah,
      // Scatter and roll keep the corridor from reading as a conveyor. Both are
      // multiplied by the live scale, so every frame still converges exactly on
      // the QR: the source is a point, not a smear.
      yOff: (j * 2 - 1) * geo.yDrift * depth,
      sJit: 0.94 + jj * 0.12,
      rz: (jj * 2 - 1) * 1.1,
      // The inner edge of a frame, the one pointing at the QR, is the one that
      // recedes: the left arm turns one way and the right the other, so the two
      // arms read as a corridor whose vanishing point is the object. A near lane
      // turns harder than a far one, which is what a wide lens does to a room.
      ry:
        (right ? -1 : 1) *
        geo.rotate *
        (0.62 + 0.55 * depth) *
        (1 + (jjj * 2 - 1) * 0.16),
    };
  });
}

/** Screen-space position and half-extents at a phase, in canvas units from the
 *  centre. The one description everything else in this file measures. */
function placeAt(c: Card, p: number, geo: Geo) {
  const s = scaleAt(p) * geo.gain * c.sJit;
  const x = c.dir * travelAt(p) * geo.travel * c.depth;
  const open = geo.spread[0] + geo.spread[1] * clamp01(Math.abs(x) / geo.halfW);
  return {
    s,
    x,
    y: c.yOff * s * open,
    hw: (c.w / 2) * s,
    hh: (c.h / 2) * s,
  };
}

/** The sampling resolution of the two module-load solvers. 480 over a 9.6 s
 *  flight is a 20 ms answer, finer than any fade the corridor carries. */
const SCAN = 480;

/**
 * The largest transform scale a card ever reaches WHILE A PERSON CAN SEE IT, and
 * the progress at which it is finally past the canvas edge. The first sizes the
 * DOM box so no frame is ever rasterized above 1:1 on screen; the second lets
 * the loop stop writing to a card that has left.
 */
function fitOf(c: Card, geo: Geo, canvasW: number) {
  let fit = 0.001;
  let exit = 1;
  for (let i = 0; i <= SCAN; i++) {
    const p = i / SCAN;
    const q = placeAt(c, p, geo);
    if (Math.abs(q.x) - q.hw > canvasW / 2) {
      exit = p;
      break;
    }
    if (q.s > fit) fit = q.s;
  }
  return { fit, exit };
}

/**
 * How far from the corridor's axis the album reaches at `xAbs` canvas units from
 * the centre: the whole flight of every card, every sample, taking the furthest
 * top or bottom edge of any frame whose horizontal span covers that column. This
 * is the measurement the lockup is placed from, so "no photograph is ever under
 * a word" is a condition rather than a hope. Rotation is not modelled (a rotateY
 * narrows a box, and a 1.1 degree roll adds about 2 percent of its height), so
 * the answer carries an 8 percent allowance. Measured against the real rendered
 * boxes at 1440, the true inflation is 2.9 percent, so the allowance covers it
 * twice over.
 */
function reachOf(cards: Card[], geo: Geo, xAbs: number) {
  let out = 0;
  for (const c of cards) {
    for (let i = 0; i <= SCAN; i++) {
      const p = i / SCAN;
      const q = placeAt(c, p, geo);
      const ax = Math.abs(q.x);
      if (ax - q.hw <= xAbs && xAbs <= ax + q.hw) {
        const edge = Math.abs(q.y) + q.hh;
        if (edge > out) out = edge;
      }
    }
  }
  return out * 1.08;
}

type Built = {
  cards: Card[];
  /** Cards per side, and the clock the loop runs on for this canvas. */
  pool: number;
  cycle: number;
  seedStep: number;
  /** Per card, in the same order: the DOM box, the scale divisor and the exit. */
  box: { w: number; h: number; fit: number; exit: number }[];
  /** The headline's baseline and the lower block's top, as canvas units from the
   *  axis. Measured off the corridor rather than chosen. */
  lock: { head: number; low: number };
};

function build(mode: Mode): Built {
  const geo = GEO[mode];
  // Slots per side: every airborne card needs its own node, plus one on the
  // ground so a slot never relaunches while its last flight is still running.
  const pool = Math.ceil(FLIGHT_MS / geo.launch) + 1;
  const cards = buildCards(mode, pool);
  const box = cards.map((c) => {
    const { fit, exit } = fitOf(c, geo, CANVAS[mode].w);
    return { w: Math.round(c.w * fit), h: Math.round(c.h * fit), fit, exit };
  });
  // The plate is the other thing the type has to clear, and near the centre it
  // is the taller of the two (the corridor there is entirely behind it).
  const plate = geo.qr / 2 + geo.margin;
  const head = Math.max(
    Math.round(reachOf(cards, geo, geo.h1Max / 2) + geo.margin),
    plate,
  );
  // The lower block is anchored on its TOP line, the caption, because that is
  // the one nearest the corridor; the sentence and the actions below it are
  // further from the axis than the corridor ever reaches at their own widths
  // (measured at 1440: the sentence sits 161 units out against a reach of 109
  // at its measure, and the actions further still).
  const low = Math.max(
    Math.round(reachOf(cards, geo, geo.capMax / 2) + geo.margin),
    plate,
  );
  return {
    cards,
    pool,
    cycle: pool * geo.launch,
    seedStep: geo.launch / FLIGHT_MS,
    box,
    lock: { head, low },
  };
}

/** Both canvases solved once for the module. Every number above is float
 *  arithmetic with no trig, so the server and the browser agree exactly. */
const BUILT: Record<Mode, Built> = {
  desktop: build("desktop"),
  phone: build("phone"),
};

function transformFor(c: Card, p: number, geo: Geo, fit: number) {
  const q = placeAt(c, p, geo);
  const s = q.s / fit;
  return `translate3d(${q.x.toFixed(2)}px, ${q.y.toFixed(2)}px, 0) rotateY(${c.ry.toFixed(2)}deg) rotateZ(${c.rz.toFixed(2)}deg) scale(${s.toFixed(4)})`;
}

/** Near over far, as an integer so the browser is not handed a new stacking
 *  order sixty times a second. Apparent size IS the depth here, so one number
 *  orders the whole corridor. */
const zOf = (p: number, c: Card, geo: Geo) =>
  1 + Math.round(scaleAt(p) * geo.gain * c.depth * 40);

/**
 * The gap the reduced-motion split leaves, closed. The sheet paints the
 * branch-out's first frame (every card collapsed at the code) inside
 * `prefers-reduced-motion: no-preference`, because an effect would run after the
 * server's paint and the corridor would flash deployed. That is right for every
 * reader except one: motion allowed, scripting off, nothing to run the loop. A
 * <noscript> block is parsed only in exactly that case, so this rule lands only
 * there, later in the document than the sheet, and restores the rest state the
 * cards already carry as custom properties. No JavaScript, no flash, and one
 * fewer departure on the board.
 */
const NOSCRIPT_RULE = `<style>@media (prefers-reduced-motion: no-preference){.hhs-card{transform:var(--hhs-rest);opacity:var(--hhs-rest-o)}}</style>`;

function Source({ mode, copy, qrUrl }: ConceptProps) {
  const geo = GEO[mode];
  const { cards, box, lock, cycle, seedStep } = BUILT[mode];
  const text = copyFor(source, copy);
  const reduced = usePrefersReducedMotion();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  // The contract's progress[]: filled every frame, never React state.
  const progress = useRef<number[]>([]);
  // The z-index each node is carrying, so it is written on change only.
  const zNow = useRef<number[]>([]);

  useEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    if (!root) return;

    let raf = 0;
    let last = 0;
    let elapsed = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last === 0 ? 0 : Math.min(now - last, 50);
      last = now;
      // The stage sets data-paused on a hidden tab. Holding the CLOCK rather
      // than the loop is what matters: rAF does not fire in a background tab
      // either way, and an un-held clock teleports the corridor on return.
      // Read off the closest ancestor so the concept owns no shell knowledge.
      if (root.closest("[data-paused]")) return;
      elapsed += dt;

      // The branch-out: one tween of the seeded offsets from nothing to their
      // steady spacing. The clock term runs the whole time, so there is no
      // handoff between the entrance and the loop, only one expression.
      const reveal = revealEase(elapsed / REVEAL_MS);
      const p = progress.current;
      for (let i = 0; i < cards.length; i++) {
        p[i] =
          mod(cards[i].slot * geo.launch * reveal + elapsed, cycle) / FLIGHT_MS;
      }
      for (let i = 0; i < cards.length; i++) {
        const el = nodes.current[i];
        if (!el) continue;
        const raw = p[i];
        // On the ground between flights, or past the canvas edge and no longer
        // worth a composited layer.
        if (raw > box[i].exit) {
          if (el.style.opacity !== "0") el.style.opacity = "0";
          continue;
        }
        const at = phaseOf(raw);
        el.style.transform = transformFor(cards[i], at, geo, box[i].fit);
        el.style.opacity = String(opacityAt(at));
        const z = zOf(at, cards[i], geo);
        if (zNow.current[i] !== z) {
          zNow.current[i] = z;
          el.style.zIndex = String(z);
        }
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cards, box, cycle, geo, reduced]);

  return (
    <div
      ref={rootRef}
      data-hhs-corridor={`${cards.length}x${LANES.length}`}
      /* overflow-CLIP, not overflow-hidden: an `overflow: hidden` box is still a
         SCROLL container, and this one's content is several canvases wide, so a
         focus or an anchor inside it can shove the whole composition sideways.
         `overflow: clip` clips the same pixels and creates no scroll container
         (the scan found this on its own switch at round three and flagged it for
         every concept on the board). */
      className="relative size-full overflow-clip bg-background"
    >
      {/* THE CORRIDOR. Full bleed and decorative: the album is the argument,
          but it is the type above and below that carries the sentence. */}
      <div
        aria-hidden
        className="hhs-band absolute inset-0"
        style={{ "--hhs-fade": geo.fade } as CSSProperties}
      >
        <div
          className="hhs-corridor"
          style={{ "--hhs-persp": `${geo.perspective}px` } as CSSProperties}
        >
          {cards.map((c, i) => {
            // The REST state, written as custom properties the sheet reads: the
            // corridor standing at its steady-state spacing, which is what
            // reduced motion, a crawler, a cold paint and a reader with
            // scripting off all get.
            const seed = Math.min(c.slot * seedStep, 1);
            const at = phaseOf(seed);
            return (
              <div
                key={c.key}
                ref={(el) => {
                  nodes.current[i] = el;
                }}
                className="hhs-card"
                data-hhs-lane={c.lane}
                style={
                  {
                    width: box[i].w,
                    height: box[i].h,
                    marginLeft: -box[i].w / 2,
                    marginTop: -box[i].h / 2,
                    zIndex: zOf(at, c, geo),
                    "--hhs-rest": transformFor(c, at, geo, box[i].fit),
                    "--hhs-rest-o": opacityAt(at),
                  } as CSSProperties
                }
              >
                <Photo
                  index={c.photo}
                  sizes={geo.sizes}
                  className="size-full rounded-[var(--radius-tile)] ring-1 ring-white/10 ring-inset"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* THE OBJECT, at the exact centre of the viewport and of the corridor,
          above the frames so they are born behind it. Nothing about it moves:
          the stillness is the point, and a QR that breathes is a QR nobody can
          scan. Real, live and tappable; its own accessible name covers it. */}
      <div className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <DemoQr url={qrUrl} size={geo.qr} />
      </div>

      {/* THE HEADLINE, anchored off the centre rather than laid out in flow, so
          the QR holds the exact middle whether the line runs to one row or two,
          and so extra lines grow UPWARD, away from the corridor. At paint, at
          full opacity, gated by nothing (bible 13). */}
      <div
        className={`absolute inset-x-0 z-20 text-center ${GUTTER[mode].x}`}
        style={{ bottom: `calc(50% + ${lock.head}px)` }}
      >
        <h1
          className={`mx-auto font-heading text-balance text-white ${LADDER.xl[mode]} ${geo.h1Lead}`}
          style={{ maxWidth: geo.h1Max }}
        >
          {text.h1}
        </h1>
      </div>

      {/* THE PROVENANCE, THE SENTENCE AND THE ACTIONS, below the corridor, in one
          block anchored at the measured clear line. No scrim anywhere on this
          concept and no darkening layer over a frame: the band's geometry is
          what keeps the type off the photographs, which is the argument. */}
      <div
        className={`absolute inset-x-0 z-20 text-center ${GUTTER[mode].x}`}
        style={{ top: `calc(50% + ${lock.low}px)` }}
      >
        {/* The one thing the picture cannot say for itself: where the frames came
            from. It sits in the column the corridor leaves clear by its own
            physics, because a frame is a speck while it is near the plate and
            only opens once it is far out. */}
        <Caption
          className="mx-auto text-white/60"
          style={{ maxWidth: geo.capMax }}
        >
          Every photo here came from a guest who scanned it
        </Caption>
        <p
          className={`mx-auto text-[15px] leading-relaxed text-pretty text-white/80 ${mode === "phone" ? "mt-4" : "mt-5"}`}
          style={{ maxWidth: geo.lowMax }}
        >
          {text.subhead}
        </p>
        <div
          className={`flex flex-wrap items-center justify-center gap-3 ${mode === "phone" ? "mt-5" : "mt-7"}`}
        >
          <Button asChild size="lg" className="h-11 px-6 text-base">
            <Link href={text.primary.href}>{text.primary.label}</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-11 border-white/35 bg-white/5 px-5 text-base text-white hover:border-white/50 hover:bg-white/15 hover:text-white"
          >
            {text.secondary}
          </Button>
        </div>
      </div>

      {/* The one reader the reduced-motion split cannot reach: motion allowed,
          scripting off. See NOSCRIPT_RULE. */}
      <noscript dangerouslySetInnerHTML={{ __html: NOSCRIPT_RULE }} />
    </div>
  );
}

export const source: Concept = {
  id: "source",
  n: 1,
  name: "The source",
  rationale:
    "The scan is where everything starts, so the hero makes that literal: the real demo QR holds the exact centre, still and scannable, and the album branches out of it and never stops. Round four made the corridor a volume rather than a plane (three depth lanes, near frames passing over far ones), filled it with the shapes an album is really made of, and measured the lane the type sits in off the running corridor instead of choosing it, so no photograph is ever under a word by construction.",
  eyebrow:
    "The QR itself, at the centre, with no label. The eyebrow is the object; the caption under it names where the photographs came from, which is the only thing the picture cannot say for itself.",
  proposed: {
    h1: "The whole event comes back to you.",
    subhead:
      "Guests scan the code. Every photo and video they take lands in your album, with no app and no account.",
    secondary: "See a real album",
  },
  departures: [
    "THE CENTRED LOCKUP, and it is the only one left. Precedent rather than law: every other marketing hero goes left, and this one is centred because the code owns the axis and the corridor is symmetrical about it. Overrule it and the composition changes shape, because the type would then have to live beside the corridor rather than above and below it. Everything else here is inside the bible: media at 100 percent with no scrim and no darkening layer anywhere, the h1 in the markup at full opacity, every animation inside the reduced-motion block with the deployed corridor as the rest state, and cinema and unlit with no lamp. Round three's second departure, a reader with scripting off and motion allowed getting an empty band, is fixed rather than flagged: a noscript companion rule restores the deployed corridor for exactly that reader.",
  ],
  assets: [
    "24 event photographs as 512 x 512 squares, one grade, 6 to 35 KB webp each, across weddings, birthdays, corporate and festivals. They replace the 12 landscape stand-ins the corridor cycles (FRAMES in shared.tsx); the left arm takes the first 12 and the right arm the last 12. They do not change the corridor: the cadence, the pool and the sizes are constants of the composition, so the 24 buy exactly one thing, that no photograph is ever on screen twice. With the 12 stand-ins the two arms' windows overlap by four, so four pictures are doubled at every moment, on opposite arms, at very different sizes and three of the four in different crops.",
    "Framed tight enough to read at 120 px AND to survive a centre crop to 4:5 and to 4:3: a face, two hands, a glass, a sparkler, a first dance. Half the corridor is portrait now, because that is what guests shoot. Frames are read between 117 and 370 px here, so a wide room shot is grey mush and a subject near an edge loses its head to the crop.",
    "Nothing else. The QR is the real demo event's, live from NEXT_PUBLIC_DEMO_QR_TOKEN, and there is no plate art, no lamp and no video in this concept.",
  ],
  render: (p) => <Source {...p} />,
};
