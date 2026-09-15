"use client";

// the concept's own sheet; it leaves with the board when the ruling lands.
// It declares NO keyframes, deliberately: the field is one requestAnimationFrame
// loop writing inline transforms, so there is nothing to collide with production
// (src/app/keyframe-uniqueness.test.ts).
import "./burst.css";

import Link from "next/link";
import { type CSSProperties, useEffect, useRef, useState } from "react";

import { Caption } from "@/components/marketing/system/caption";
import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

import {
  CANVAS,
  type Concept,
  type ConceptProps,
  DemoQr,
  GUTTER,
  LADDER,
  type Mode,
  Photo,
  copyFor,
} from "./shared";

/**
 * THE BURST (concept 3 of the home-hero board; ROUND TWO of the concept,
 * 2026-09-14).
 *
 * The axis: THE ORIGIN IN EVERY DIRECTION. The source proved the causality with
 * two perspective rows running left and right. The burst keeps the same
 * sentence and takes it onto the two axes a corridor cannot use: all the way
 * around the compass, and forward, out of the screen.
 *
 * ── WHAT ROUND TWO CHANGED, and why ──
 *
 * 1. THE CODE IS THE EMITTER, not a hole in the field. Round one gave the QR
 *    its own keep-out box, so no frame came within 110 px of the plate and
 *    every photograph faded up in open space: the one thing the concept exists
 *    to show, a frame leaving the code, was the one thing it never showed. The
 *    plate paints ABOVE the field (it always did), so a frame born behind it is
 *    hidden by it for free. The code's box is gone; the type's stays. Six of the
 *    34 desktop cards have a corridor wide enough to be born there, spread
 *    across the cycle, so a photograph slides out from under the plate every
 *    1.2 to 2.6 seconds, for ever.
 *
 * 2. THE CURVES WERE BACKWARDS. Round one ran travel on sqrt(p), fast out of
 *    the gate, and size on a smoothstep that is flat at both ends, so a frame
 *    raced to the edge while it was still small and did its growing off screen:
 *    the field read as confetti at the rim. Both now ride an ease-out in WORLD
 *    units (travel 1-(1-p)^3, size 1-(1-p)^1.4 after a birth plateau) and the
 *    perspective term supplies the acceleration. A frame's screen position is
 *    then near linear in p while its apparent size keeps opening, which is what
 *    an object moving toward you actually does, and the big moments happen ON
 *    the canvas: the median frame now peaks at 368 px of a 1440 canvas.
 *
 * 3. THE LANE WITH ROOM IS THE DEEP ONE. Birth depth, depth gain and travel are
 *    a function of the DIRECTION now, not of a hash: the axis a canvas has room
 *    on (horizontal at 1440, vertical at 375) carries the near-camera flights
 *    that grow and wipe past the edge, and the cramped axis carries the far
 *    field, born further back so it stays small, slow and long on screen. One
 *    description, two canvases, no second design.
 *
 * 4. A DIRECTION THE CANVAS HAS NO ROOM FOR IS NOT LAUNCHED. Round one launched
 *    every golden-angle candidate, which is safe only for the one geometry it
 *    was tuned against. The pool is now built by walking candidates and keeping
 *    the first N whose flight is watchable at all (it reaches full opacity and
 *    lives longer than a beat). Measured: at 1440 that drops none at the lg
 *    step and three at xl, and at 375, where the lockup is nearly as wide as
 *    the canvas, it drops 35 and 43 respectively, which is more than half the
 *    compass. Those are the frames that would otherwise be DOM, composited
 *    layers and image requests for something gated until it is already off the
 *    edge. It also means the field re-solves itself when the lockup changes,
 *    which is what makes the headline toggle below honest rather than
 *    decorative.
 *
 * 5. THE FIRST BEAT IS THREE BEATS. A 260 ms hold (the code alone), then the
 *    slip (the frames with the corridor sliding out from behind the plate),
 *    then the eruption as the reveal tween opens the launch offsets. Measured
 *    off the running stage after a Replay: nothing until 420 ms; seven frames
 *    from 500 to 1000, growing 33 px to 97 px and clear of the plate by 750;
 *    11, 18, 25, 26 from 1090 to 1340, the widest going 141 px to 406 px;
 *    settling to 11 to 15, the widest between 300 and 445.
 *
 * ── WHAT ROUND THREE CHANGED, and why ──
 *
 * Round three walked the board the way a stranger would, found six things, and
 * fixed each one. They are listed here because the next agent will read this
 * file before the manifest.
 *
 * 1. THE FIELD WAS GREY BOXES FOR THE FIRST MINUTE. Round two loaded only the
 *    frames of the first beats and left the other 31 lazy. This stage is
 *    fifteen thousand pixels down a lab page, so nothing intersected the
 *    viewport and nothing loaded: 9 of 34 images after 60 seconds, and a reader
 *    scrolling to it met a scatter of empty rectangles. Every frame is eager
 *    now (see the Photo below), which costs a hero nothing, because a hero's
 *    frames are all inside the first screen and a lazy image there is fetched
 *    immediately anyway.
 * 2. THE ROOT WAS A SCROLL CONTAINER. `overflow-hidden` clips and still
 *    scrolls; focusing the step toggle inside it could shove the whole
 *    composition sideways. `overflow-clip` clips the same pixels and creates no
 *    scroll container. The scan found this on its own switch and flagged all
 *    four concepts.
 * 3. THE PHONE LEANED UPWARD, 60 percent of the album above the code, because
 *    the lockup sits below it and a downward ray was gated for 240 canvas units
 *    against an upward one's 170. Two changes answer it: `crossHold` holds a
 *    ray back in proportion to the type it has to cross, so it clears later and
 *    larger instead of arriving small, and the pool is now selected to be even
 *    in VISIBLE MASS rather than in directions launched (BALANCE, and see D
 *    below for what that mass had to start counting before it worked). Measured
 *    on the live field, the phone runs 56 / 44 above and below the code against
 *    the 61 / 39 this pass started from, and carries 13.8 frames on screen to
 *    the desktop canvas's 14.2: the same composition at both canvases, close
 *    enough now to argue about rather than to concede.
 * 4. THE REST STATE WAS A FREEZE FRAME. What reduced motion, a crawler and the
 *    cold paint got was the running field stopped mid-flight, so half of it was
 *    dissolving at the rim. It is solved now rather than sampled (restFrame):
 *    every photograph whole, none behind the plate, the quiet zone holding.
 * 5. THE COPY HAD BECOME THE RIVER'S. Round two proposed "One code, and the
 *    album fills." with a subhead the river now carries verbatim. Two concepts
 *    arguing the same sentence makes the board harder to rule, so both lines
 *    were rewritten to what only this concept can say.
 * 6. THE ONE CONTROL ON THE STAGE SAID "h1" at 0.45 opacity. It says Headline,
 *    it is legible without hunting, and it is sized for the canvas it sits on.
 *
 * ── AND WHAT THE REVIEW OF THAT ROUND CAUGHT, in the same round ──
 *
 * Three of the six above were written down as done before they were true. The
 * fixes are in the code they name; this is the ledger, because a claim that
 * outran its code once will be read sceptically the next time.
 *
 * A. THE 4:5 SHARE HAD COLLAPSED WITH THE POOL. The shape was handed out by
 *    CANDIDATE index while item 3's balance pass was newly DROPPING candidates,
 *    so the third of the field this file claims was 4:5 shipped as 32 percent
 *    on the desktop canvas and 9 percent on the phone at the xl step, which is
 *    the canvas whose whole argument is that guests shoot vertical. It is
 *    assigned by SLOT now (PORTRAIT_EVERY), so it is a third of whatever pool
 *    the balance pass returns: 32, 32, 31, 31 percent at the four
 *    configurations. The clearance scan is run after the shape is known, so a
 *    taller box is still held off the type for exactly as long as it needs.
 * B. THE SETTLED FIELD WAS NOT WHOLE. Item 4 walked the progress back until the
 *    card's OPACITY cleared 0.92, which is not the same test as "inside the
 *    canvas": the opacity term only begins to fall once the leading edge is
 *    already past the rim. A third of the settled album was cut by more than a
 *    quarter of its own width, and on the phone at xl there is no progress at
 *    which most cards are both clear of the type and inside the canvas at all.
 *    The still is solved from both bounds now instead of sampled off the
 *    flight; see restFrame for the whole argument. Measured on the geometry at
 *    all four configurations: 0 cards cut, 0 over any word, 0 behind the plate.
 * C. THE COPY ASK NAMED HALF ITS TRADE. Item 5 moved off the river's sentence
 *    by moving off the code, which is the wrong half to give up: the standing
 *    ruling on this board is that the code as the basis of the feature is the
 *    distinct thing and a generic album is the weak one. The h1 keeps the code
 *    and says what only this concept shows, and the ask carries the whole
 *    trade rather than one reason for it. The keep-out boxes were re-measured
 *    off the rendered stage against it, which turned up a hole that predates
 *    this line: the proposed subhead is shorter than the ruled one, so on the
 *    phone the actions row sits 23 px higher under the copy toggle than the
 *    boxes covered, and a frame could fly through the buttons in that mode.
 *    Every box is the union of BOTH copy modes' real ink now, which is what the
 *    comment on KEEP always said it was.
 * D. THE BALANCE MASS COUNTED WHAT IS OFF SCREEN. The integral item 3 added to
 *    even the field weighed each direction by apparent area and never clipped
 *    it to the canvas, so a flight that is twice the canvas wide as it wipes
 *    past the rim scored twice a flight that fills it. The half of the compass
 *    gated longest is exactly the half whose frames are biggest when they
 *    finally appear, so the metric handed that half a bonus for the part of
 *    itself nobody sees, and the pass meant to end the tilt was paying for it.
 *    Clipped, the same pass gives 48 / 52 and 46 / 54 above and below at 1440,
 *    and takes the phone from 61 / 39 to 56 / 44.
 *
 * ── WHAT DID NOT CHANGE ──
 *
 * The projection is still done by hand rather than with a CSS `perspective`
 * parent, because the screen position, the apparent size and the paint order
 * all have to be readable as NUMBERS (the keep-out test needs the box's real
 * screen size, the near-over-far paint order needs an integer) and because the
 * transform string stays a pure function of the clock, which is what lets the
 * loop be frozen at a chosen elapsed for a still (docs/systems/testing-
 * verification.md: a driven tab suspends rAF). No state, no timers, no per-card
 * bookkeeping: a card's progress is a closed form of the clock and the
 * recycling falls out of a modulo. Media at 100 percent: no scrim, no darkening
 * layer and no lamp anywhere in this concept (bible 1, and the standing ruling
 * that the hero is cinema and unlit).
 *
 * ── THE QUIET ZONE ──
 *
 * The type lives in a keep-out that no frame ever enters: one box per BLOCK of
 * the lockup, measured off the rendered stage, never one rectangle around all
 * of it. Each card is given, once, the progress after which its own box is
 * permanently clear of every block (scanClear), and it is drawn from there. So
 * "no photograph is ever under a word" is not a hope about the layout; it is
 * the condition the field is drawn from, in every direction and at every moment
 * of the loop. The corridor between the headline's box and the caption's is
 * what a frame leaving the plate has to fit through, and round two took it from
 * 105 px to 164 px by moving the headline 18 px further off the code, the
 * caption 12 px down, and measuring both blocks to their INK rather than to
 * their line boxes. That corridor is the whole reason a frame can be a
 * photograph rather than a speck as it appears; it is also, at 375, the only
 * lane a frame can be born in at all.
 */

/* ── The field's constants ── */

/** The golden angle, so any PREFIX of the candidate list is evenly spread
 *  around the compass: a canvas that rejects a direction still gets an even fan
 *  out of what is left. */
const GOLDEN = 2.399963229728653;

/** One card's full life, in ms. Shared by both canvases. */
const FLIGHT_MS = 8400;
/** The code alone, before anything leaves it. */
const HOLD_MS = 260;
/** The branch-out, on ease-in-out-quart (see revealEase). */
const REVEAL_MS = 2200;

/** The two steps of the site ladder this hero can sit on (bible 5). The board
 *  shows both under a toggle ON the stage, because the trade is real: `xl` is
 *  the louder promise and `lg` leaves the burst more canvas, and the quiet zone
 *  (and therefore the field) is re-solved for whichever is showing. */
type Step = "lg" | "xl";

/** Survives the stage's remount on Replay, so a ruling in progress is not reset
 *  by the board's own button. Client-only by construction: the server and the
 *  first client render both read "lg". */
let lastStep: Step = "lg";

/** One block of the lockup, in canvas coordinates from the code (y points
 *  down), plus the margin frames keep from it. Measured off the rendered stage
 *  rather than guessed: each is the union of the two copy modes' real INK
 *  extents (a Range over the text, not the block box, which is full bleed),
 *  re-measured at round three against the copy this concept now proposes.
 *  THE UNION IS THE POINT and is easy to get wrong: one pool serves both copy
 *  modes, so a block has to cover the taller of the two AND the position the
 *  shorter one puts the blocks below it in. The proposed subhead is two lines
 *  on the phone where the ruled one is three, which lifts the actions row 23
 *  px; the box covers both.
 *  THE CODE HAS NO BOX: the plate paints above the field, so a frame born
 *  behind it is hidden by it, and taking the box away is what lets the album
 *  visibly leave the object. (The settled composition is the one exception:
 *  restFrame keeps the still off the plate, because a still has no next moment
 *  to slide out into.) */
type KeepPart = { x: number; y: number; hw: number; hh: number; r: number };

const KEEP: Record<Mode, Record<Step, KeepPart[]>> = {
  desktop: {
    lg: [
      { x: 0, y: -189, hw: 262, hh: 81, r: 26 }, // the headline, two lines at 72
      { x: 0, y: 105, hw: 155, hh: 8, r: 24 }, // the caption
      { x: 0, y: 156, hw: 232, hh: 22, r: 28 }, // the sentence, two lines
      { x: 0, y: 226, hw: 164, hh: 23, r: 28 }, // the actions, one row
    ],
    xl: [
      { x: 0, y: -210, hw: 349, hh: 107, r: 26 }, // the headline, two lines at 96
      { x: 0, y: 105, hw: 155, hh: 8, r: 24 },
      { x: 0, y: 156, hw: 232, hh: 22, r: 28 },
      { x: 0, y: 226, hw: 164, hh: 23, r: 28 },
    ],
  },
  phone: {
    lg: [
      { x: 0, y: -114, hw: 131, hh: 42, r: 20 }, // the headline, two lines at 36
      { x: 0, y: 76, hw: 90, hh: 8, r: 18 }, // the caption
      { x: 0, y: 132, hw: 162, hh: 32, r: 20 }, // the sentence, two or three lines
      { x: 0, y: 191, hw: 142, hh: 32, r: 20 }, // the actions, one row, two heights
    ],
    xl: [
      { x: 0, y: -150, hw: 152, hh: 78, r: 20 }, // the headline, two or three at 48
      { x: 0, y: 76, hw: 90, hh: 8, r: 18 },
      { x: 0, y: 132, hw: 162, hh: 32, r: 20 },
      { x: 0, y: 191, hw: 142, hh: 32, r: 20 },
    ],
  },
};

type Geo = {
  /** How many cards the canvas throws. cards * launch is the round trip, so a
   *  few are always on the ground: that slack is what the round-robin needs. */
  cards: number;
  /** ms between launches. flight / launch is how many are in the air at once. */
  launch: number;
  /** The card's DOM box width in px; the height is the box times its aspect.
   *  Sized for the LARGEST VISIBLE moment so nothing rasterizes far above 1:1
   *  (measured: the widest frame on the desktop canvas peaks at 434 px). */
  card: number;
  /** The travel ellipse's semi-axes at progress 1 before the perspective term:
   *  canvas-shaped, which is what makes the same field read at 1440 and 375. */
  ax: number;
  ay: number;
  /** The projection distance, in the same units as z. */
  persp: number;
  /** Depth at birth on the roomy axis, and how much further back the cramped
   *  axis is born (a far frame is small and slow for free). */
  z0: number;
  zBack: number;
  /** How far a frame travels toward the camera over its flight, and the share
   *  of that a fully cramped lane gets. */
  zRun: number;
  zLo: number;
  /** Normalizes the size curve against the card's DOM box. */
  scaleNorm: number;
  /** The birth plateau: how big a frame is while it is still in the corridor
   *  beside the code, and the knees of the size curve after it. */
  s0: number;
  s0e: number;
  s1a: number;
  sk: number;
  /** Travel length by lane: the cramped axis reaches further, so it is past the
   *  lockup while it is still small. */
  reachA: number;
  reachB: number;
  /** How much a direction is HELD BACK for having to cross the lockup. The
   *  gated part of a flight is the part nobody sees, so a ray that has to clear
   *  240 canvas units of type before it may appear was spending a third of its
   *  life invisible and arriving small. Held back, it clears later, at a larger
   *  size, and spends what is left on the canvas instead of past the edge.
   *  Measured over 10 s of the running field: the album covers 0.24 of the 375
   *  canvas at 0 and 0.36 at 0.4, and 0.35 of the 1440 canvas against 0.45. */
  crossHold: number;
  /** Bends the golden-angle fan toward the HORIZONTAL, which is where both
   *  canvases have a corridor beside the code for a frame to be born in (the
   *  lockup is a column, so it is the width that leaves a gap). Positive bends
   *  toward horizontal; it is not the same question as which lane is deep. */
  warp: number;
  /** +1 when the roomy axis is horizontal (the 1440 canvas), -1 when it is
   *  vertical (the 375 canvas). Decides which lane is deep. */
  laneSign: 1 | -1;
  /** How much of a flight a frame fades up over, in progress units. */
  fade: number;
  /** The QR's edge in px, quiet zone included. 96 scans from a laptop screen. */
  qr: number;
  /** The gap from the code's edge to the headline, and to the caption. Round
   *  two spent 30 px here to widen the corridor a frame leaves through. */
  gapTop: number;
  gapBottom: number;
  subMax: number;
  /** The per-card 3D tilt in degrees: the field reads as one expanding shell
   *  rather than a wall of billboards. */
  tilt: number;
  /** Canvas-relative, never a vw value: the stage is zoomed. */
  sizes: string;
};

const GEO: Record<Mode, Geo> = {
  desktop: {
    cards: 34,
    launch: 290,
    card: 365,
    ax: 660,
    ay: 455,
    persp: 1200,
    z0: -160,
    zBack: 480,
    zRun: 900,
    zLo: 0.25,
    scaleNorm: 0.95,
    s0: 0.24,
    s0e: 0.05,
    s1a: 0.1,
    sk: 1.4,
    reachA: 1.85,
    reachB: 0.8,
    crossHold: 0.3,
    warp: 0.3,
    laneSign: 1,
    fade: 0.085,
    qr: 140,
    gapTop: 44,
    gapBottom: 26,
    subMax: 470,
    tilt: 15,
    sizes: "440px",
  },
  phone: {
    cards: 32,
    launch: 300,
    card: 225,
    ax: 270,
    ay: 470,
    persp: 560,
    z0: -70,
    zBack: 260,
    zRun: 300,
    zLo: 0.3,
    scaleNorm: 0.9,
    s0: 0.24,
    s0e: 0.05,
    s1a: 0.1,
    sk: 1.4,
    reachA: 1.6,
    reachB: 0.55,
    crossHold: 0.4,
    warp: 0.2,
    laneSign: -1,
    fade: 0.085,
    qr: 100,
    gapTop: 26,
    gapBottom: 18,
    subMax: 330,
    tilt: 13,
    sizes: "250px",
  },
};

/** The headline's measure and leading per step, so the ladder change is a real
 *  change of shape and not only of size. Both are cinema steps of the one site
 *  ladder; LADDER resolves the classes (bible 5). */
const HEAD: Record<Mode, Record<Step, { max: number; lead: string }>> = {
  desktop: {
    lg: { max: 640, lead: "leading-[1.03]" },
    xl: { max: 860, lead: "leading-[1.0]" },
  },
  phone: {
    lg: { max: 330, lead: "leading-[1.06]" },
    xl: { max: 340, lead: "leading-[1.02]" },
  },
};

/* ── The shader primitives the field is written in ── */

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

const mod = (a: number, n: number) => ((a % n) + n) % n;

/**
 * WORLD travel, ease-out cubic. It reads front-loaded written down and is not
 * what the eye sees: every screen number is this times the perspective term,
 * which runs the other way, and the product is near linear in p for a deep
 * flight. An object moving at you does exactly this, and it is why the
 * acceleration everyone calls speed here is depth rather than an easing curve
 * imitating one.
 */
const travelAt = (p: number) => 1 - (1 - p) * (1 - p) * (1 - p);

/**
 * Size: a short ramp to the birth plateau, then ease-out to full. The plateau
 * is the number the corridor beside the code dictates (a frame taller than the
 * gap between the headline's box and the caption's cannot leave the plate at
 * all), and everything after it is growth the canvas can actually show.
 */
function sizeAt(p: number, g: Geo) {
  const u = clamp01((p - g.s1a) / (1 - g.s1a));
  return (
    g.s0 * smoothstep(0, g.s0e, p) + (1 - g.s0) * (1 - Math.pow(1 - u, g.sk))
  );
}

/** ease-in-out-quart, which IS --ease-in-out-strong's cubic-bezier
 *  (0.77, 0, 0.175, 1). Written out rather than solved so the reveal needs no
 *  bezier solver and stays engine-deterministic. */
function revealEase(t: number) {
  const u = clamp01(t);
  if (u < 0.5) return 8 * u * u * u * u;
  const v = 1 - u;
  return 1 - 8 * v * v * v * v;
}

/** A deterministic 0..1 per candidate. Integer ops only, on purpose: Math.sin
 *  is not bit-identical across JS engines, and the server and the browser have
 *  to produce the SAME rest-state transform or hydration warns. (The angles
 *  below do call Math.cos/sin, which carries the same theoretical risk, so
 *  every number that reaches a transform string is rounded to two decimals: an
 *  engine's last-bit disagreement cannot survive that.) */
function hash01(n: number) {
  let h = Math.imul(n + 1, 2654435761) >>> 0;
  h = (h ^ (h >>> 15)) >>> 0;
  h = Math.imul(h, 2246822519) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  return h / 4294967296;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * How far along a card's ray its box is still touching the type: a slab test
 * per block, taking the furthest exit. Each block is grown by its margin AND by
 * the card's own half-extents, so the answer is "the distance past which none of
 * this frame is over any word", not "the distance past which its centre is".
 * Returns 0 when the ray misses the lockup entirely.
 */
function clearAlong(
  parts: KeepPart[],
  ux: number,
  uy: number,
  aw: number,
  ah: number,
) {
  let out = 0;
  for (const k of parts) {
    const bx = k.hw + k.r + aw;
    const by = k.hh + k.r + ah;
    // A ray exactly on an axis makes one slab infinite; the epsilon keeps the
    // arithmetic finite and the comparison identical.
    const sx = Math.abs(ux) < 1e-6 ? 1e-6 : ux;
    const sy = Math.abs(uy) < 1e-6 ? 1e-6 : uy;
    const x1 = (k.x - bx) / sx;
    const x2 = (k.x + bx) / sx;
    const y1 = (k.y - by) / sy;
    const y2 = (k.y + by) / sy;
    const enter = Math.max(Math.min(x1, x2), Math.min(y1, y2));
    const exit = Math.min(Math.max(x1, x2), Math.max(y1, y2));
    if (exit > enter && exit > out) out = exit;
  }
  return out;
}

/** How many samples the clearance scan takes. 256 over an 8.4 s flight is a
 *  33 ms resolution on the moment a frame is allowed to appear, which is finer
 *  than the fade that follows it. */
const SCAN = 256;
/** The acceptance walk's resolution: coarser, because it only has to answer
 *  "was this flight ever worth watching". */
const WALK = 160;

type Card = {
  key: string;
  /** Launch order, and the seed the rest state is drawn at. */
  slot: number;
  photo: number;
  /** The travel vector at progress 1, before the perspective term. */
  vx: number;
  vy: number;
  /** hypot(vx, vy) and the unit direction: the ray the clearance scan walks. */
  mag: number;
  ux: number;
  uy: number;
  /** The rotated card's half-extents per unit of apparent scale, as a fraction
   *  of the box's width: what the clearance scan grows the type's blocks by. */
  aw0: number;
  ah0: number;
  /** The progress this card is allowed to appear at (see scanClear). */
  pClear: number;
  /** 1 for a square frame, 1.25 for the 4:5 portraits (guest phone media). */
  aspect: number;
  /** Where the frame is born in depth, and where it ends up. */
  zBirth: number;
  zGain: number;
  sJit: number;
  rz: number;
  ry: number;
  rx: number;
};

/** Everything a card is except the two numbers that depend on the pool it ends
 *  up in and the scan that needs the rest of it. */
type Seed = Omit<Card, "pClear" | "slot" | "photo">;

/**
 * THE ONE NUMBER THAT MAKES THE QUIET ZONE WORK: the progress after which this
 * card is clear of the type FOR THE REST OF ITS FLIGHT. Scanned backwards, so
 * the answer is the LAST moment it was overlapping, not the first moment it was
 * not.
 *
 * Why it is scanned once at build rather than tested every frame. The lockup is
 * a concave union (the code is a narrow waist between a wide headline and a
 * wide sentence), so a frame can slip into the pocket beside the code, be
 * legitimately clear, and then grow into the headline as it rises. Testing live
 * would fade it up and then back down: a flicker, and a frame that briefly
 * covers a word on the way. One backwards scan turns the whole question into a
 * threshold on progress, which is monotonic by construction, needs no state,
 * and keeps the loop a pure function of the clock.
 */
function scanClear(c: Seed, geo: Geo, keep: KeepPart[]) {
  for (let n = SCAN; n >= 1; n--) {
    const p = n / SCAN;
    const z = c.zBirth + (c.zGain - c.zBirth) * p;
    const proj = geo.persp / (geo.persp - z);
    const s = sizeAt(p, geo) * proj * c.sJit * geo.scaleNorm;
    const reach = c.mag * travelAt(p) * proj;
    const clear = clearAlong(
      keep,
      c.ux,
      c.uy,
      c.aw0 * s * geo.card,
      c.ah0 * s * geo.card,
    );
    if (reach < clear) return Math.min(p + 1 / SCAN, 1);
  }
  return 0;
}

type Frame = { transform: string; opacity: string; z: string };

/** The three strings the DOM wants, from a card already placed. The ONE place
 *  a transform is formatted, so the running loop and the settled composition
 *  below cannot drift into two different projections of the same card. */
function frameOf(
  c: Card,
  x: number,
  y: number,
  s: number,
  proj: number,
  o: number,
): Frame {
  return {
    transform: `translate3d(${r2(x)}px, ${r2(y)}px, 0) rotate(${r2(c.rz)}deg) perspective(760px) rotateY(${r2(c.ry)}deg) rotateX(${r2(c.rx)}deg) scale(${r2(s)})`,
    opacity: String(r2(o)),
    // Near frames paint over far ones, which is the whole reason the depth axis
    // reads at all. Quantized so the stacking order is re-sorted rarely.
    z: String(Math.round(proj * 40)),
  };
}

/**
 * One card at one progress, as the three strings the DOM wants. The whole
 * concept is in here; everything else is plumbing.
 */
function frameAt(
  c: Card,
  p: number,
  geo: Geo,
  halfW: number,
  halfH: number,
): Frame {
  const z = c.zBirth + (c.zGain - c.zBirth) * p;
  const proj = geo.persp / (geo.persp - z);

  const t = travelAt(p) * proj;
  const x = c.vx * t;
  const y = c.vy * t;
  const s = sizeAt(p, geo) * proj * c.sJit * geo.scaleNorm;

  // THE QUIET ZONE: the card is drawn only from the progress at which it is
  // permanently clear of every word (scanClear), so no photograph is ever under
  // one, in any direction, at any moment of the loop. For a card leaving along
  // the corridor beside the code that progress is zero, and the plate itself
  // hides it until it is out.
  //
  // Past the edges it dissolves rather than being guillotined by the stage's
  // overflow. Measured on the frame's LEADING EDGE rather than its centre, so
  // the dissolve starts the moment any corner of it touches the canvas and
  // finishes when it is most of the way out: a big frame and a small one leave
  // the same way, and nothing is ever cut. The last term is the backstop for a
  // card that rushed the camera and is still huge at the end of its flight.
  const lead = Math.max(
    (Math.abs(x) + c.aw0 * s * geo.card) / halfW,
    (Math.abs(y) + c.ah0 * s * geo.card) / halfH,
  );
  const o =
    smoothstep(c.pClear, c.pClear + geo.fade, p) *
    (1 - smoothstep(1, 1.7, lead)) *
    (1 - smoothstep(0.9, 1, p));

  return frameOf(c, x, y, s, proj, o);
}

/** The share of the field's visible MASS either half of the canvas may hold
 *  before a candidate for that half is passed over. Round three's answer to the
 *  phone reading top-heavy: the lockup sits below the code, so a downward
 *  flight is gated for 240 canvas units against an upward one's 170, and the
 *  gated part of a flight is the part nobody sees. Counting directions launched
 *  says the compass is even; counting the photograph actually on screen says it
 *  is not, and the second one is what a reader sees. */
const BALANCE = 0.56;
/** How many cards are placed before the balance rule starts refusing: with two
 *  or three on screen there is no distribution to be even about. */
const BALANCE_AFTER = 8;

/** THE SHAPE MIX. A third of the field is 4:5, because a third of what guests
 *  shoot is: a field of nothing but squares reads as a deck of cards rather
 *  than as an album. It is assigned by the card's SLOT and never by its
 *  candidate index, which is the round-three correction: the balance pass below
 *  DROPS candidates, so an index-based share silently collapses with them (the
 *  share it actually shipped ran from 32 percent on the desktop canvas down to
 *  9 percent on the phone at the xl step, on the very canvas whose argument is
 *  that guests shoot vertical). By slot it is a third of whatever the pool
 *  turns out to be, at every canvas and every headline step. */
const PORTRAIT = 1.25;
const PORTRAIT_EVERY = 3;
/** The shape the viability walk and the mass integral are flown at, so neither
 *  answer depends on which candidates happened to draw the portrait slot: the
 *  walk is weighing a DIRECTION, and the direction is all it should weigh. */
const MEAN_ASPECT = 1 + (PORTRAIT - 1) / PORTRAIT_EVERY;

/** A card's rotated half-extents, per unit of apparent scale, as a fraction of
 *  its box width. A function of the aspect, so it is redone when the slot hands
 *  the card its real shape. */
function extents(rz: number, aspect: number) {
  const a = (rz * Math.PI) / 180;
  const ca = Math.abs(Math.cos(a));
  const sa = Math.abs(Math.sin(a));
  return { aw0: 0.5 * (ca + aspect * sa), ah0: 0.5 * (sa + aspect * ca) };
}

/**
 * The pool, built by ACCEPTANCE rather than by count, in two passes.
 *
 * PASS ONE, viability. Candidate directions walk the golden angle (so
 * consecutive launches land on opposite sides of the code and the field never
 * reads as a sweeping fan), bent toward the axis the canvas has room on. Each
 * candidate is flown once: a direction whose flight never reaches full opacity,
 * or lives less than a beat, is one this canvas and this lockup have no room
 * for. The same flight also integrates the candidate's VISIBLE MASS, the
 * apparent area it puts on the canvas over its life, which is what pass two
 * balances.
 *
 * PASS TWO, balance (round three). Viable candidates are taken in golden order
 * until the pool is full, but one whose half of the canvas already holds more
 * than BALANCE of the mass is passed over and only taken if the pool would
 * otherwise come up short. The selected cards are then put back into golden
 * order before they are given slots, so the launch cadence still alternates
 * sides and only the membership changed.
 */
type Candidate = {
  seed: Seed;
  pClear: number;
  mass: number;
  down: boolean;
  right: boolean;
};

function buildCards(geo: Geo, keep: KeepPart[], halfW: number, halfH: number) {
  const viable: Candidate[] = [];
  for (let i = 0; viable.length < geo.cards * 2 && i < geo.cards * 6; i++) {
    const j = hash01(i);
    const jj = hash01(i + 101);
    const jjj = hash01(i + 211);
    const jjjj = hash01(i + 307);

    const raw = i * GOLDEN + (j * 2 - 1) * 0.11;
    const theta = raw - geo.warp * Math.sin(2 * raw);
    const ct = Math.cos(theta);
    const st = Math.sin(theta);

    // THE LANE. 1 = this card is flying along the axis the canvas has room on,
    // 0 = along the cramped one. Everything about its depth follows: a roomy
    // lane is born close and flies at the camera (it has canvas to grow
    // across), a cramped lane is born far back and stays there, which is what
    // makes it small, slow and long on screen instead of a blur at the edge.
    const lane = geo.laneSign > 0 ? Math.abs(ct) : Math.abs(st);
    const zBirth = geo.z0 - geo.zBack * (1 - lane);
    const zGain =
      zBirth + geo.zRun * (geo.zLo + (1 - geo.zLo) * lane) * (0.85 + jj * 0.3);
    // How far along this ray the lockup itself reaches, before the card's own
    // size is added: the bare geometry of what this direction has to cross.
    const dx0 = geo.ax * ct;
    const dy0 = geo.ay * st;
    const m0 = Math.hypot(dx0, dy0);
    const crossing =
      clearAlong(keep, dx0 / m0, dy0 / m0, 0, 0) / Math.hypot(halfW, halfH);
    const reach =
      (geo.reachA - geo.reachB * lane) *
      (1 - geo.crossHold * crossing) *
      (0.94 + jjj * 0.12);

    const vx = geo.ax * ct * reach;
    const vy = geo.ay * st * reach;
    const mag = Math.hypot(vx, vy);

    const rz = (jjjj * 2 - 1) * 5;
    // Flown at the field's MEAN shape. The real 4:5 is handed out by slot after
    // the pool is picked (see the map at the foot of this function), so nothing
    // about which directions are viable or how heavy they are depends on the
    // shape lottery.
    const mean = extents(rz, MEAN_ASPECT);
    const seed: Seed = {
      key: `hhb-${i}`,
      vx,
      vy,
      mag,
      ux: vx / mag,
      uy: vy / mag,
      aw0: mean.aw0,
      ah0: mean.ah0,
      aspect: MEAN_ASPECT,
      zBirth,
      zGain,
      sJit: 0.88 + jjj * 0.24,
      rz,
      // The tilt is oriented by the flight: every card's inner edge recedes, so
      // the field reads as the surface of one expanding shell rather than a
      // scatter of billboards. Mild on purpose: a photograph is the subject.
      ry: (-vx / mag) * geo.tilt * (0.7 + jj * 0.6),
      rx: (vy / mag) * geo.tilt * (0.7 + j * 0.6),
    };
    const pClear = scanClear(seed, geo, keep);
    const probe: Card = { ...seed, slot: 0, photo: 0, pClear };

    // The acceptance walk, which also weighs the flight.
    let peak = 0;
    let live = 0;
    let mass = 0;
    for (let n = 0; n <= WALK; n++) {
      const p = n / WALK;
      const o = Number(frameAt(probe, p, geo, halfW, halfH).opacity);
      if (o > peak) peak = o;
      if (o > 0.2) live += FLIGHT_MS / WALK;
      // The apparent area ON THE CANVAS, weighted by how visible it is: the
      // same projection the transform uses, CLIPPED to the canvas, so this is
      // the photograph a reader actually gets from this direction and not the
      // distance it travelled. The clip is the point. A frame that is twice the
      // canvas wide as it wipes past the rim puts no more album on screen than
      // one that fills it, and the half of the compass whose flights are gated
      // longest is exactly the half whose frames are biggest when they finally
      // appear, so counting unclipped area hands that half a bonus for the part
      // of itself nobody sees, which is the tilt this whole pass exists to end.
      const z = seed.zBirth + (seed.zGain - seed.zBirth) * p;
      const proj = geo.persp / (geo.persp - z);
      const sc = sizeAt(p, geo) * proj * seed.sJit * geo.scaleNorm;
      const t = travelAt(p) * proj;
      const px = seed.vx * t;
      const py = seed.vy * t;
      const aw = seed.aw0 * sc * geo.card;
      const ah = seed.ah0 * sc * geo.card;
      const vw = Math.min(halfW, px + aw) - Math.max(-halfW, px - aw);
      const vh = Math.min(halfH, py + ah) - Math.max(-halfH, py - ah);
      if (vw > 0 && vh > 0) mass += o * vw * vh;
    }
    if (peak < 0.75 || live < 900) continue;
    viable.push({
      seed,
      pClear,
      mass,
      down: seed.vy > 0,
      right: seed.vx > 0,
    });
  }

  const taken: Candidate[] = [];
  const passed: Candidate[] = [];
  // Mass already placed in each half of the canvas: up, down, left, right.
  const held = { up: 0, down: 0, left: 0, right: 0 };
  type Half = keyof typeof held;
  const sides = (c: Candidate): [Half, Half][] => [
    c.down ? ["down", "up"] : ["up", "down"],
    c.right ? ["right", "left"] : ["left", "right"],
  ];
  for (const c of viable) {
    if (taken.length >= geo.cards) break;
    const tilted = sides(c).some(
      ([mine, other]) =>
        (held[mine] + c.mass) / (held[mine] + held[other] + c.mass) > BALANCE,
    );
    if (taken.length >= BALANCE_AFTER && tilted) {
      passed.push(c);
      continue;
    }
    taken.push(c);
    for (const [mine] of sides(c)) held[mine] += c.mass;
  }
  // Short of a full pool, the passed-over directions come back: an even field
  // is worth less than a full one.
  for (const c of passed) {
    if (taken.length >= geo.cards) break;
    taken.push(c);
  }
  // Back into golden order, so the launch cadence alternates sides as before.
  taken.sort((a, b) => Number(a.seed.key.slice(4)) - Number(b.seed.key.slice(4)));
  // THE SHAPE, and then the clearance, in that order. Every third SLOT is 4:5,
  // so the mix is a third of the pool that was actually selected. A taller box
  // is clear of the type later than a square one, so the clearance scan is run
  // here, after the shape is known, and never on the mean the walk used: the
  // quiet zone is the one thing on this concept that may not be approximate.
  return taken.map((c, n) => {
    const aspect = n % PORTRAIT_EVERY === 2 ? PORTRAIT : 1;
    const seed: Seed = { ...c.seed, aspect, ...extents(c.seed.rz, aspect) };
    return { ...seed, slot: n, photo: n, pClear: scanClear(seed, geo, keep) };
  });
}

/**
 * THE REST STATE, COMPOSED. It is what a reduced-motion reader, a crawler, a
 * cold paint and a reader with JavaScript off all get, so it is a composition
 * in its own right and not a pause button: the whole album standing still
 * around the code, every photograph whole, none of them over a word.
 *
 * Round two took it from the running field, each card at the progress its own
 * launch offset put it at, which is a FREEZE FRAME: half the album caught
 * mid-dissolve at the rim with a hole in the middle. Round three walked that
 * progress back until the card's OPACITY cleared 0.92, which sounds like the
 * same thing and is not: opacity only starts to fall once the leading edge is
 * ALREADY past the rim, so 0.92 still means a tenth of a half-canvas outside
 * it, and a third of the settled field was cut by more than a quarter of its
 * own width. Worse, on the phone at the xl step there is no progress at which
 * most cards are both clear of the type and inside the canvas at all: the
 * lockup is nearly as wide as the canvas, so by the moment a frame has grown
 * past the last word it is already leaving. Sampling the flight cannot
 * compose this still, however carefully it is sampled.
 *
 * So the still is solved instead of sampled, on the two dials the flight ties
 * together and a still has no reason to:
 *
 *   SIZE comes from the flight's own curves at a progress of the card's own, so
 *   the settled field keeps the range of near and far frames the loop has, and
 *   the paint order stays the depth order.
 *
 *   DISTANCE is then free, and is solved from that size: the near edge no
 *   closer than clearAlong says is clear of every block of the lockup, the far
 *   edge no further than the rim. Both bounds are exact, not scanned, so "no
 *   photograph is ever under a word" and "every photograph is whole" are
 *   properties of the composition rather than hopes about it.
 *
 * The window closes as the size grows (a bigger box has to clear more type and
 * has less rim to reach), so one forward walk finds the largest size this card,
 * this canvas and this lockup can hold; the card then draws its size and its
 * distance from the R2 sequence, the golden sequence's own generalisation to
 * the plane, so the pairs fill the size-by-distance square evenly and cards
 * next to each other in the golden fan settle at different depths AND different
 * radii. A spiral is what a single sequence would give.
 */

/** The R2 sequence's two additive constants (the plastic number's powers), the
 *  standard low-discrepancy pair: frac(i * R2A), frac(i * R2B) fills the unit
 *  square evenly at every prefix length, the way frac(i * PHI) fills a line. */
const R2A = 0.7548776662;
const R2B = 0.5698402910;

/** The smallest progress the settled size is drawn from: the far end of the
 *  field's range, a frame well clear of the plate but still small. */
const REST_LO = 0.16;
/** Resolution of the walk that closes the window: 128 steps over a range never
 *  wider than 1, so the largest holdable size is found to under a percent. */
const REST_SCAN = 128;

/** The placement window for one card at one settled size: where along its ray
 *  the frame is clear of every word (lo), how much room is left between there
 *  and the rim (span, negative when this size cannot be placed at all), and the
 *  size and projection themselves. */
function restSpan(
  c: Card,
  p: number,
  geo: Geo,
  keep: KeepPart[],
  halfW: number,
  halfH: number,
) {
  const z = c.zBirth + (c.zGain - c.zBirth) * p;
  const proj = geo.persp / (geo.persp - z);
  const s = sizeAt(p, geo) * proj * c.sJit * geo.scaleNorm;
  const aw = c.aw0 * s * geo.card;
  const ah = c.ah0 * s * geo.card;
  // A ray exactly on an axis never reaches the other one's edge, hence the
  // guards below: an infinity is the honest answer, not a divide by zero.
  const ax = Math.abs(c.ux) < 1e-6 ? 0 : Math.abs(c.ux);
  const ay = Math.abs(c.uy) < 1e-6 ? 0 : Math.abs(c.uy);
  // THE PLATE IS A KEEP-OUT IN THE STILL AND NOWHERE ELSE. The running field
  // wants frames born behind the code, because being hidden by the object they
  // came out of is what the slip is; a still has no next moment to slide out
  // into, so a frame parked behind the plate is simply a photograph the reader
  // never gets. Clear of the square on EITHER axis is clear of it, hence the
  // min. (The code carries no keep-out anywhere else in this file.)
  const plate = Math.min(
    ax === 0 ? Infinity : (geo.qr / 2 + aw) / ax,
    ay === 0 ? Infinity : (geo.qr / 2 + ah) / ay,
  );
  const lo = Math.max(clearAlong(keep, c.ux, c.uy, aw, ah), plate);
  // How far the centre may go before a corner touches the rim, per axis.
  const ex = ax === 0 ? Infinity : (halfW - aw) / ax;
  const ey = ay === 0 ? Infinity : (halfH - ah) / ay;
  return { lo, span: Math.min(ex, ey) - lo, s, proj };
}

function restFrame(
  c: Card,
  i: number,
  geo: Geo,
  keep: KeepPart[],
  halfW: number,
  halfH: number,
) {
  let pFit = REST_LO;
  for (let n = 1; n <= REST_SCAN; n++) {
    const p = REST_LO + ((1 - REST_LO) * n) / REST_SCAN;
    if (restSpan(c, p, geo, keep, halfW, halfH).span < 0) break;
    pFit = p;
  }
  const p = REST_LO + (pFit - REST_LO) * mod(i * R2A, 1);
  const { lo, span, s, proj } = restSpan(c, p, geo, keep, halfW, halfH);
  // Never hard against either bound: a card pinned to the rim reads as cropped
  // even when it is not, and one pinned to the type reads as a near miss.
  const r = lo + Math.max(span, 0) * (0.12 + 0.82 * mod(i * R2B, 1));
  return frameOf(c, c.ux * r, c.uy * r, s, proj, 1);
}

/** Built on demand per canvas AND per headline step, because the step changes
 *  the quiet zone and the quiet zone is what the field is solved against. */
const POOLS = new Map<string, Card[]>();
function poolFor(mode: Mode, step: Step) {
  const key = `${mode}:${step}`;
  const hit = POOLS.get(key);
  if (hit) return hit;
  const built = buildCards(
    GEO[mode],
    KEEP[mode][step],
    CANVAS[mode].w / 2,
    CANVAS[mode].h / 2,
  );
  POOLS.set(key, built);
  return built;
}

function Burst({ mode, copy, qrUrl }: ConceptProps) {
  const geo = GEO[mode];
  const [step, setStep] = useState<Step>(() => lastStep);
  const cards = poolFor(mode, step);
  const head = HEAD[mode][step];
  const text = copyFor(burst, copy);
  const reduced = usePrefersReducedMotion();

  const halfW = CANVAS[mode].w / 2;
  const halfH = CANVAS[mode].h / 2;
  // The settled composition is solved against the same lockup the field is, so
  // the still holds the quiet zone for the step that is showing.
  const keep = KEEP[mode][step];
  const cycle = geo.cards * geo.launch;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const nodes = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    if (!root) return;

    let raf = 0;
    let last = 0;
    let elapsed = 0;
    // The last strings written per node. A frame that would write what is
    // already there writes nothing: over a cycle that drops about a fifth of
    // the style writes (the cards on the ground, and every z-index that did not
    // change bucket), and the z-index write is the expensive one, because it
    // re-sorts a stacking context.
    const wasZ: string[] = [];
    const wasOff: boolean[] = [];

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last === 0 ? 0 : Math.min(now - last, 50);
      last = now;
      // The stage sets data-paused on a hidden tab. Holding the CLOCK rather
      // than the loop is what matters: rAF does not fire in a background tab
      // either way, and an un-held clock teleports the field on return. Read it
      // off the closest ancestor so the concept owns no shell knowledge.
      if (root.closest("[data-paused]")) return;
      elapsed += dt;

      // BEAT ONE: the code alone. Nothing is written, so the sheet's pre-burst
      // frame (every card inside the code, at no size) is what is on screen.
      const clock = elapsed - HOLD_MS;
      if (clock <= 0) return;

      // BEATS TWO AND THREE: one tween of the seeded launch offsets from
      // nothing to their steady spacing. At clock 0 every card shares a
      // progress, so the album leaves the code together and the ones with the
      // corridor get out first; the clock term runs the whole time, so there is
      // no handoff between the entrance and the loop, only one expression.
      const reveal = revealEase(clock / REVEAL_MS);
      for (let i = 0; i < cards.length; i++) {
        const el = nodes.current[i];
        if (!el) continue;
        const c = cards[i];
        const p = mod(c.slot * geo.launch * reveal + clock, cycle) / FLIGHT_MS;
        if (p > 1) {
          // On the ground between flights, and far off screen besides.
          if (!wasOff[i]) {
            el.style.opacity = "0";
            wasOff[i] = true;
          }
          continue;
        }
        const f = frameAt(c, p, geo, halfW, halfH);
        if (f.opacity === "0") {
          if (!wasOff[i]) {
            el.style.opacity = "0";
            wasOff[i] = true;
          }
          continue;
        }
        wasOff[i] = false;
        el.style.transform = f.transform;
        el.style.opacity = f.opacity;
        if (wasZ[i] !== f.z) {
          el.style.zIndex = f.z;
          wasZ[i] = f.z;
        }
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // `cards` is in here on purpose: toggling the headline step re-solves the
    // pool, so the loop restarts and the burst plays again from the code. That
    // is the honest thing to show, because the field really is a different
    // field once the quiet zone changes shape.
  }, [cards, cycle, geo, halfH, halfW, reduced]);

  const phone = mode === "phone";
  // The caption IS the eyebrow, so it says the one thing a label would: the
  // object is real, and it is the same object every guest scans. Shorter on the
  // phone, where a reader is already holding the thing they would scan with and
  // where every px of its width is a px the burst cannot use.
  const caption = qrUrl
    ? phone
      ? "This code is live. Tap to open it."
      : "This code is live. Scan it, or tap to open the album."
    : "One code per event, scanned all night.";

  const sentence = (
    <p
      className={`mx-auto leading-relaxed text-pretty text-white/80 ${phone ? "mt-3.5 text-[14px]" : "mt-4 text-[15px]"}`}
      style={{ maxWidth: geo.subMax }}
    >
      {text.subhead}
    </p>
  );
  const actions = (
    <div
      className={`flex flex-wrap items-center justify-center gap-3 ${phone ? "mt-4" : "mt-6"}`}
    >
      <Button
        asChild
        size="lg"
        className={phone ? "h-10 px-5 text-sm" : "h-11 px-6 text-base"}
      >
        <Link href={text.primary.href}>{text.primary.label}</Link>
      </Button>
      <Button
        size="lg"
        variant="outline"
        className={`border-white/35 bg-white/5 text-white hover:border-white/50 hover:bg-white/15 hover:text-white ${phone ? "h-10 px-4 text-sm" : "h-11 px-5 text-base"}`}
      >
        {text.secondary}
      </Button>
    </div>
  );

  return (
    <div
      ref={rootRef}
      /* overflow-CLIP, not overflow-hidden: the same pixels are clipped, but no
         scroll container is created. An overflow-HIDDEN box is still scrollable
         programmatically and by focus, and this one has 1933 px of content in a
         1437 px box, so focusing the step toggle inside it could let the browser
         "reveal" the button by scrolling the whole composition sideways under
         the stage's zoom (measured here: scrollLeft took 496 px and scrollTop
         321 px on demand; with clip both are no-ops). Found by the scan on its
         own switch, where a click really did jump the hero, and flagged for all
         four concepts (docs/tracks/hero-scan.md, round three, finding 1). */
      className="relative size-full overflow-clip bg-background"
    >
      {/* THE FIELD. Full bleed and decorative: the album is the argument, but
          the type in the quiet zone is what carries the sentence. */}
      <div aria-hidden className="hhb-field">
        {cards.map((c, i) => {
          // The REST state, written as custom properties the sheet reads: the
          // album settled around the code, which is what reduced motion, a
          // crawler and the server's own HTML all get (see restFrame).
          const rest = restFrame(c, i, geo, keep, halfW, halfH);
          const w = geo.card;
          const h = geo.card * c.aspect;
          return (
            <div
              key={c.key}
              // The React 19 cleanup form rather than the null call, because
              // the pool CHANGES INSIDE ONE MOUNT when the headline step is
              // toggled: the keys are candidate indices, so a position can be
              // deleted and recreated in the same commit, and a stale null
              // would freeze that card at its CSS state for ever.
              ref={(el) => {
                nodes.current[i] = el;
                return () => {
                  nodes.current[i] = null;
                };
              }}
              className="hhb-card"
              style={
                {
                  width: w,
                  height: h,
                  marginLeft: -w / 2,
                  marginTop: -h / 2,
                  zIndex: Number(rest.z),
                  "--hhb-rest": rest.transform,
                  "--hhb-rest-o": rest.opacity,
                } as CSSProperties
              }
            >
              {/* EAGER, every frame, which round three had to correct. Round
                  two loaded only the frames of the first beats and left the
                  rest lazy, reasoning that a hero should not open thirty image
                  requests at once. On a hero it buys nothing: every card sits
                  at the centre of the first screen at paint, so a lazy image
                  there is fetched immediately anyway, at a lower priority. On
                  the BOARD it cost the concept its argument, because this stage
                  is fifteen thousand pixels down a lab page: nothing intersects
                  the viewport, so 31 of the 34 frames had not loaded at all,
                  and the field a reader scrolled to was a scatter of grey boxes
                  filling in one by one (measured on the dev server: 9 of 34
                  after 60 s). The album has to be photographs from the first
                  frame, here and in production. */}
              <Photo
                index={c.photo}
                sizes={geo.sizes}
                className="size-full rounded-[var(--radius-tile)] ring-1 ring-white/10 ring-inset"
              />
            </div>
          );
        })}
      </div>

      {/* THE OBJECT, at the exact centre of the canvas, which is the origin
          every frame is launched from, and ABOVE the field, which is what lets
          a frame be born behind it and slide out from under it. Nothing about
          it moves: the stillness is the point, and a QR that breathes is a QR
          nobody can scan. Real, live and tappable; its own accessible name
          covers it. */}
      <div className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <DemoQr url={qrUrl} size={geo.qr} />
      </div>

      {/* THE HEADLINE, anchored off the centre rather than laid out in flow, so
          the code holds the exact middle whether the line runs to two rows or
          three. At paint, at full opacity, gated by nothing (bible 13). */}
      <div
        className={`absolute inset-x-0 z-10 text-center ${GUTTER[mode].x}`}
        style={{ bottom: `calc(50% + ${geo.qr / 2 + geo.gapTop}px)` }}
      >
        <h1
          data-hhb-block="h1"
          className={`mx-auto font-heading text-balance text-white ${LADDER[step][mode]} ${head.lead}`}
          style={{ maxWidth: head.max }}
        >
          {text.h1}
        </h1>
      </div>

      {/* THE CAPTION, THE SENTENCE AND THE ACTIONS, below the code and inside
          the same quiet zone, on both canvases. Round two tried pinning the
          sentence and the actions to the foot of the phone to open a band under
          the code, and it cost more than it bought: a paragraph at the foot is
          the last thing before the edge, so every downward lane was gated until
          it was already off the canvas and the whole field collected at the top
          (measured on the stage: 8 of 10 frames above the code). One lockup, two
          canvases. No scrim anywhere on this concept and no darkening layer over
          a frame: the keep-out is what holds the type off the photographs, which
          is the argument. */}
      <div
        data-hhb-block="under"
        className={`absolute inset-x-0 z-10 text-center ${GUTTER[mode].x}`}
        style={{ top: `calc(50% + ${geo.qr / 2 + geo.gapBottom}px)` }}
      >
        <Caption className={`text-white/55 ${phone ? "" : "text-[13px]"}`}>
          {caption}
        </Caption>
        {sentence}
        {actions}
      </div>

      {/* THE BOARD'S OWN CONTROL, not part of the hero. The headline trade is
          the one choice on this concept that changes the composition rather
          than the styling, so it is a toggle on the stage and Will rules it
          with both in view; the field re-solves for whichever step is showing,
          because the quiet zone changes shape and the field is drawn from it.
          It leaves with the board. Round three named it in words rather than in
          the sheet's ("h1" meant nothing to anyone who had not read the file)
          and stopped hiding it at 0.45 opacity: the one control on the stage
          has to be findable without hunting for it. */}
      <div
        className={`hhb-lab${phone ? " hhb-lab-sm" : ""}`}
        data-hhb-block="lab"
      >
        <span className="hhb-lab-label">Headline</span>
        {(["lg", "xl"] as Step[]).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={step === s}
            aria-label={`Headline on the ladder's ${s} step`}
            onClick={() => {
              lastStep = s;
              setStep(s);
            }}
            className="hhb-lab-btn"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

export const burst: Concept = {
  id: "burst",
  n: 3,
  name: "The burst",
  rationale:
    "Every frame on screen is born inside the code and slides out from under it. The album radiates around the whole compass and forward out of the screen, so a near frame grows until it wipes past the edge while a far one stays small and slides out, and the causality reads at a glance. The type holds a quiet zone that no frame ever enters, so nothing is dimmed and no word sits over a photograph. A radial has no orientation, so the phone is the same composition rather than a compressed strip: the canvas decides which lanes are deep, a direction it has no room for is never launched, and the field is balanced by the photograph a reader actually sees rather than by the directions thrown. Measured on the running loop, sampling the photograph actually on the canvas, the album covers 0.29 of the 1440 canvas and 0.23 of the 375 one, and the settled field 0.51 and 0.36.",
  eyebrow:
    "The code itself, at the centre of the burst. Its caption is the only label, so the eyebrow is the object.",
  proposed: {
    h1: "It all comes out of this code.",
    subhead:
      "Every guest shoots from a different spot, and all of it reaches you at full size. No app, no account.",
    secondary: "Open the live album",
  },
  departures: [
    "Rule on, the headline step, and it is the one choice that changes the composition: lg or xl. The toggle is on the stage, bottom right, and the field re-solves for whichever is showing. lg (text-7xl at 1440, text-4xl at 375) leaves the burst the canvas and keeps a corridor wide enough for a frame to leave the code through; xl (text-8xl, text-5xl) is the louder promise and costs the field about 80 px of quiet zone in every direction. Both are cinema steps of the one site ladder (bible 5).",
    "Rule on, the copy: proposed or ruled. Proposed is 'It all comes out of this code.' over 'Every guest shoots from a different spot, and all of it reaches you at full size. No app, no account.' The whole trade, because it is the easiest one on this board to rule in the wrong word: round two proposed 'One code, and the album fills.' and the river now opens 'One code, and' with my subhead verbatim, so the pair had to move; round three's first answer moved off the code entirely to 'Your album, from every angle.', which gave up the wrong half, because the standing ruling on this board is that the code as the basis of the feature is the distinct thing and a generic album is the weak one. The collision was in the sentence, not in the code. This line keeps the code in the headline, says what only this concept shows (every frame on screen came out of that object), and collides with nothing the other three propose. If you would rather have round two's phrasing back, say so and it returns with the subhead still rewritten. The ruled thesis stays the default under the board's copy toggle (bible 21).",
    "Rule on, the lockup: centred or left. Precedent, not law. The code owns the axis here, so the type is centred on it. The first thing to overrule if the home hero should stay left.",
    "Departure, bible 10 (the hero is unlit by the standing ruling): the frames carry a drop shadow, the light spec's LIFT family (docs/specs/light.md) at four times the offsets, because LIFT separates two cards a pixel apart and these are separated by a depth axis measured in hundreds of units. It is a shadow, never a lamp: no light source is added, no photograph is darkened, and there is no scrim anywhere on this concept.",
    "Departure, bible 13, decorative layer only: the frames' pre-burst state sits inside the reduced-motion block, so with JavaScript off and motion allowed the field rests around the code instead of leaving it. The h1, the code, the caption, the sentence and the actions are plain markup, never gated, and reduced motion gets the whole album settled around the code.",
  ],
  assets: [
    "24 event photographs as 512 x 512 squares · one grade, 6 to 35 KB webp each, across weddings, birthdays, corporate and festivals, framed tight enough to read at 90 px (a face, two hands, a glass, a sparkler, a first dance), never a wide room shot · replaces the 12 landscape stand-ins the field cycles (FRAMES in shared.tsx). Already asked for as docs/ASSETS.md row 2; the same 24 serve this concept.",
    "10 more of the same, as 4:5 portraits · 512 x 640, same grade, and they may be recrops of the 24 rather than new photography · replaces the square box on every third SLOT of the field, which is the third of it that lays out 4:5 at every canvas and every headline step (measured: 32, 32, 31, 31 percent of the four pools), and takes the desktop pool to 34 so no frame is on screen twice. Guests shoot vertical, so a field of nothing but squares reads as a deck of cards rather than as an album.",
    "Nothing else · the QR is the real demo event's, live from NEXT_PUBLIC_DEMO_QR_TOKEN · no plate art, no lamp and no video in this concept.",
  ],
  render: (p) => <Burst {...p} />,
};
