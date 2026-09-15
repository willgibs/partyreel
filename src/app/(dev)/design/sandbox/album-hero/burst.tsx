"use client";

// The album hero field's own sheet; it leaves with the board when the ruling
// lands. It declares NO keyframes, deliberately: the field is one
// requestAnimationFrame loop writing inline transforms, so there is nothing to
// collide with production (src/app/keyframe-uniqueness.test.ts).
//
// THE FILENAME IS THE SEED'S, ON PURPOSE. This is no longer the home hero's
// burst, it is the album page's field, and `field.tsx` would say so; but the
// live hero-source track declares this exact path as a read in its manifest, so
// renaming it turns that track's lane guard red. Asked for in the Handoff: the
// Orchestrator may rename the pair to field.tsx once hero-source closes.
import "./burst.css";

import Link from "next/link";
import { type CSSProperties, useEffect, useRef } from "react";

import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { Button } from "@/components/ui/button";
import { featurePage } from "@/lib/constants/feature-pages";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

import { CANVAS, GUTTER, LADDER, type Mode, Photo } from "../home-hero/shared";

/**
 * THE ALBUM PAGE'S HERO FIELD (the album-hero track, round one, 2026-09-15).
 *
 * Will's ruling: the burst was killed as the home hero, and "the background
 * (images emanating) would be beautiful for the /features/album hero for the
 * live album. Use that for the hero animation looped to add the 'live' feel of
 * an album full of images... It doesn't need the QR code for the new version."
 *
 * So the field arrives here whole and loses its centre. Three rounds of the
 * hero-burst track built it, and docs/tracks/hero-burst.md carries that history
 * with its measurements; this header states what the file IS now and which
 * mechanics may not be reverted.
 *
 * -- THE ARGUMENT --
 *
 * An album that is alive is an album things are arriving into, constantly, from
 * every direction. Every frame is born at a point at the centre of the canvas
 * and radiates around the whole compass AND forward, out of the screen, for
 * ever: a near frame grows until it wipes past the edge while a far one stays
 * small and slides out, so the field reads as depth rather than as a scatter.
 * Nothing announces itself and nothing resolves, because a live album does not
 * resolve either. That is the whole of the "live" feeling the page opens on;
 * the album below the hero is the product, and it is deliberately calm.
 *
 * -- WHAT CHANGED WHEN THE CODE LEFT --
 *
 * 1. THE ORIGIN IS NOTHING. The QR plate used to paint ABOVE the field, so a
 *    frame born behind it was hidden until it slid out: the plate was the
 *    birth's cover. With no object there the birth has to be a POINT, or every
 *    launch pops into being at eighty-seven pixels. `s0` (the birth plateau)
 *    drops from 0.24 of the card box to 0.035 and the fade ramp widens, so a
 *    newborn frame is about 13 px at 1440 and 8 px at 375 and grows out of
 *    nothing. The album emanates rather than emerges.
 * 2. THE VENT REPLACES THE PLATE. `geo.vent` is what `geo.qr` was: the width
 *    of the empty middle the lockup holds clear, so there is somewhere for the
 *    album to come from and the eye has a source to read. It is smaller than
 *    the code was (116 against 140 at 1440), which buys a tighter lockup and a
 *    wider corridor at the same time.
 * 3. THE COPY IS THE PAGE'S. The lockup renders /features/album's real eyebrow,
 *    h1, subhead and actions (feature-pages.ts), because this hero is that
 *    page's and not a home hero's proposal.
 * 4. THE HEADLINE STEP MOVED TO THE DOCK. The one choice that changes the
 *    composition rather than the styling (lg or xl) is a page-wide switch, so
 *    it lives in BoardDock (Will, 2026-09-15: a page-wide control has to be
 *    reachable from anywhere on the board) and arrives here as a prop.
 *
 * -- WHAT DID NOT CHANGE, and must not --
 *
 * THE QUIET ZONE. The type lives in a keep-out no frame ever enters: one box
 * per BLOCK of the lockup, measured off the rendered stage to its INK, never
 * one rectangle around all of it. Each card is given, once, the progress after
 * which its own box is permanently clear of every block (scanClear), and it is
 * drawn from there. "No photograph is ever under a word" is the condition the
 * field is drawn from rather than a hope about the layout, which is what lets
 * the media stay at 100 percent with no scrim anywhere on the hero (bible 1).
 *
 * THE PROJECTION IS DONE BY HAND rather than with a CSS `perspective` parent,
 * because the screen position, the apparent size and the paint order all have
 * to be readable as NUMBERS (the keep-out test needs the box's real screen
 * size, the near-over-far paint order needs an integer) and because the
 * transform string stays a pure function of the clock, which is what lets the
 * loop be frozen at a chosen elapsed for a still (docs/systems/testing-
 * verification.md: a driven tab suspends rAF). No state, no timers, no per-card
 * bookkeeping: a card's progress is a closed form of the clock and the
 * recycling falls out of a modulo.
 *
 * THE POOL IS BUILT BY ACCEPTANCE. A direction whose flight is never watchable
 * on this canvas, against this lockup, is not launched at all (buildCards), and
 * the field re-solves itself whenever the lockup changes shape. At 375, where
 * the lockup is nearly as wide as the canvas, that drops more than half the
 * compass, which is the difference between a field and a confetti of gated
 * frames nobody ever sees.
 *
 * THE REST STATE IS COMPOSED, NOT PAUSED (restFrame): reduced motion, a
 * crawler, the server's own HTML and a cold paint all get the whole album
 * standing still around the vent, every photograph whole, none over a word.
 */

/* ── The field's constants ── */

/** The golden angle, so any PREFIX of the candidate list is evenly spread
 *  around the compass: a canvas that rejects a direction still gets an even fan
 *  out of what is left. */
const GOLDEN = 2.399963229728653;

/** One card's full life, in ms. Shared by both canvases. Longer than the
 *  burst's 8400 because this hero is not an entrance that resolves: it is the
 *  page's weather, and a frame that crosses the canvas more slowly reads as an
 *  album arriving rather than as a launch. `cards / launch` decides how many
 *  are in the air at once, and `cards * launch` has to stay comfortably above
 *  this or the round-robin runs out of frames to recycle. */
const FLIGHT_MS = 9600;
/** The empty canvas, before the first frame is born. Shorter than the burst's
 *  260, which was the beat the code held alone: there is no object to hold. */
const HOLD_MS = 160;
/** The branch-out, on ease-in-out-quart (see revealEase). */
const REVEAL_MS = 2200;

/** The two steps of the site ladder this hero can sit on (bible 5). The board
 *  shows both under a toggle IN THE DOCK, because the trade is real: `xl` is
 *  the louder promise and `lg` leaves the field more canvas, and the quiet zone
 *  (and therefore the field itself) is re-solved for whichever is showing. */
export type Step = "lg" | "xl";

/** One block of the lockup, in canvas coordinates from the origin (y points
 *  down), plus the margin frames keep from it. Measured off the RENDERED stage
 *  rather than guessed: each is the real INK extent (a Range over the text, not
 *  the block box, which is full bleed). One box per BLOCK and never one
 *  rectangle around the lockup: the corridor between the headline's box and the
 *  sentence's is what a frame leaving the vent has to fit through, and at 375 it
 *  is the only lane a frame can be born in at all.
 *  THE VENT HAS NO BOX HERE: the running field wants frames born on the origin
 *  at no size, which is what emanating from a point means. (The settled
 *  composition is the one exception: restFrame holds the still off the vent,
 *  because a still has no next moment to grow into.) */
type KeepPart = { x: number; y: number; hw: number; hh: number; r: number };

const KEEP: Record<Mode, Record<Step, KeepPart[]>> = {
  desktop: {
    lg: [
      { x: 0, y: -277, hw: 61, hh: 7, r: 22 }, // the eyebrow
      { x: 0, y: -170, hw: 366, hh: 79, r: 26 }, // the h1, two lines at 72
      { x: 0, y: 110, hw: 187, hh: 25, r: 26 }, // the sentence, two lines at 18
      { x: 0, y: 192, hw: 157, hh: 22, r: 28 }, // the actions, one row
    ],
    xl: [
      { x: 0, y: -321, hw: 61, hh: 7, r: 22 },
      { x: 0, y: -192, hw: 488, hh: 105, r: 26 }, // the h1, two lines at 96
      { x: 0, y: 110, hw: 187, hh: 25, r: 26 },
      { x: 0, y: 192, hw: 157, hh: 22, r: 28 },
    ],
  },
  phone: {
    lg: [
      { x: 0, y: -215, hw: 61, hh: 7, r: 16 },
      { x: 0, y: -123, hw: 133, hh: 60, r: 20 }, // the h1, three lines at 36
      { x: 0, y: 100, hw: 123, hh: 39, r: 20 }, // the sentence, four lines at 18
      { x: 0, y: 196, hw: 157, hh: 22, r: 20 }, // the actions, 314 of a 373 canvas
    ],
    xl: [
      { x: 0, y: -297, hw: 61, hh: 7, r: 16 },
      { x: 0, y: -164, hw: 127, hh: 102, r: 20 }, // the h1, four lines at 48
      { x: 0, y: 100, hw: 123, hh: 39, r: 20 },
      { x: 0, y: 196, hw: 157, hh: 22, r: 20 },
    ],
  },
};

type Geo = {
  /** How many cards the canvas throws. cards * launch is the round trip, so a
   *  few are always on the ground: that slack is what the round-robin needs.
   *  This is also the one dial that makes the album read FULL rather than
   *  sparse, which is what Will asked the hero for: with the page's own lockup
   *  in the middle the quiet zone is large, so the field has to be dense enough
   *  that the ring around it never thins out. */
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
  /** THE BIRTH: how big a frame is the instant it exists, and the knees of the
   *  size curve after it. With no plate to hide a birth behind, this is what
   *  makes the album emanate from a point instead of popping into being: about
   *  13 px at 1440 and 8 px at 375. */
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
  /** THE VENT: the diameter of the empty middle the lockup holds clear, which
   *  is where the album comes from. It is what the code's plate used to be, and
   *  it is smaller, because a vent only has to read as a source while a plate
   *  had to be scannable. The still keeps frames off it too (restSpan), so the
   *  settled composition has the same open middle the running one does. */
  vent: number;
  /** The gap from the vent's rim to the headline, and to the eyebrow below it. */
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
    cards: 52,
    launch: 210,
    card: 365,
    ax: 660,
    ay: 455,
    persp: 1200,
    z0: -160,
    zBack: 480,
    zRun: 900,
    zLo: 0.25,
    scaleNorm: 0.95,
    s0: 0.035,
    s0e: 0.05,
    s1a: 0.03,
    sk: 1.5,
    reachA: 1.85,
    reachB: 0.8,
    crossHold: 0.3,
    warp: 0.3,
    laneSign: 1,
    fade: 0.07,
    vent: 116,
    gapTop: 40,
    gapBottom: 24,
    subMax: 576,
    tilt: 15,
    sizes: "440px",
  },
  phone: {
    cards: 44,
    launch: 240,
    card: 225,
    ax: 270,
    ay: 470,
    persp: 560,
    z0: -70,
    zBack: 260,
    zRun: 300,
    zLo: 0.3,
    scaleNorm: 0.9,
    s0: 0.035,
    s0e: 0.05,
    s1a: 0.03,
    sk: 1.5,
    reachA: 1.6,
    reachB: 0.55,
    crossHold: 0.4,
    warp: 0.2,
    laneSign: -1,
    fade: 0.07,
    vent: 84,
    gapTop: 24,
    gapBottom: 16,
    subMax: 343,
    tilt: 13,
    sizes: "250px",
  },
};

/** The headline's measure and leading per step. `lg` IS THE SHIPPED HERO,
 *  measured off /features/album rather than chosen: PageHero centres its lockup
 *  at max-w-3xl (768) and the lg ramp lands on text-7xl at 1440 with
 *  leading-[1.0], which puts this h1 on two lines at 732 px of ink. `xl` is the
 *  louder step, and its measure is opened to 1040 so the line stays two rows:
 *  at 768 the same words run to three at 96 px, which is a wall rather than a
 *  promise. Both are cinema steps of the one site ladder (bible 5); LADDER
 *  resolves the classes. */
const HEAD: Record<Mode, Record<Step, { max: number; lead: string }>> = {
  desktop: {
    lg: { max: 768, lead: "leading-[1.0]" },
    xl: { max: 1040, lead: "leading-[0.98]" },
  },
  phone: {
    lg: { max: 343, lead: "leading-[1.06]" },
    xl: { max: 343, lead: "leading-[1.02]" },
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
 *  than as an album. It is a third of the POOL and never of the candidate list,
 *  which is the round-three correction: the balance pass below DROPS
 *  candidates, so an index-based share silently collapses with them (the share
 *  it actually shipped ran from 32 percent on the desktop canvas down to 9
 *  percent on the phone at the xl step, on the very canvas whose argument is
 *  that guests shoot vertical). The taller box goes to every third SLOT whose
 *  own direction was accepted flying one, and to the next slot that was
 *  wherever one was not, so the COUNT is a third of the pool at every canvas
 *  and every headline step and no card is handed a box its direction never
 *  earned. */
const PORTRAIT = 1.25;
const PORTRAIT_EVERY = 3;
/** The field's MEAN card, which is the shape a DIRECTION is weighed at: whether
 *  a ray is worth launching at all, and how much album it puts on the canvas,
 *  should not depend on which cards happened to draw a 4:5 box. It is a weight,
 *  never a box any card flies: the two real shapes are tested on their own (see
 *  fly). */
const MEAN_ASPECT = 1 + (PORTRAIT - 1) / PORTRAIT_EVERY;

/** A card's rotated half-extents, per unit of apparent scale, as a fraction of
 *  its box width. A function of the aspect, so it is redone when the slot hands
 *  the card its real shape. Note that it GROWS WITH THE ASPECT on both axes at
 *  every rotation, which is the fact the shape map leans on: a taller box is
 *  never the easier flight. */
function extents(rz: number, aspect: number) {
  const a = (rz * Math.PI) / 180;
  const ca = Math.abs(Math.cos(a));
  const sa = Math.abs(Math.sin(a));
  return { aw0: 0.5 * (ca + aspect * sa), ah0: 0.5 * (sa + aspect * ca) };
}

/** A candidate before it has a shape: everything the golden fan decides, which
 *  is the RAY and nothing about the box on it. */
type Ray = Omit<Seed, "aspect" | "aw0" | "ah0">;

/**
 * ONE RAY, FLOWN AT ONE SHAPE: the acceptance test of rule 4 (the flight
 * reaches full opacity, and lives longer than a beat) and the VISIBLE MASS it
 * puts on the canvas, both on the box it is given.
 *
 * The shape is an argument because it changes the answer. A 4:5 box is bigger
 * than a square one on BOTH half-extents at every rotation (extents, above), so
 * it is clear of the type later and touches the rim sooner, and a direction can
 * be a whole photograph at one shape and a flicker at the other. The pass that
 * moved the shape from the candidate index onto the slot left this walk flying
 * the MEAN and re-ran only the clearance on the real box, so the acceptance
 * test stopped being a test of anything a card actually flies: measured on the
 * geometry then, 1 of 34 cards at the desktop xl step and 6 and 7 of 32 on the
 * phone were failing it, every one of them a 4:5, the worst peaking at 0.10
 * opacity for two instants, which is a launch slot producing nothing visible
 * once every cycle. Flying the tall box as well as the mean one is what lets
 * the shape map below hand out only boxes their directions earned.
 */
function fly(
  ray: Ray,
  aspect: number,
  geo: Geo,
  keep: KeepPart[],
  halfW: number,
  halfH: number,
) {
  const seed: Seed = { ...ray, aspect, ...extents(ray.rz, aspect) };
  const probe: Card = {
    ...seed,
    slot: 0,
    photo: 0,
    pClear: scanClear(seed, geo, keep),
  };
  let peak = 0;
  let live = 0;
  let mass = 0;
  for (let n = 0; n <= WALK; n++) {
    const p = n / WALK;
    const o = Number(frameAt(probe, p, geo, halfW, halfH).opacity);
    if (o > peak) peak = o;
    if (o > 0.2) live += FLIGHT_MS / WALK;
    // The apparent area ON THE CANVAS, weighted by how visible it is: the same
    // projection the transform uses, CLIPPED to the canvas, so this is the
    // photograph a reader actually gets from this direction and not the
    // distance it travelled. The clip is the point. A frame that is twice the
    // canvas wide as it wipes past the rim puts no more album on screen than
    // one that fills it, and the half of the compass whose flights are gated
    // longest is exactly the half whose frames are biggest when they finally
    // appear, so counting unclipped area hands that half a bonus for the part
    // of itself nobody sees, which is the tilt the balance pass exists to end.
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
  return { mass, ok: peak >= 0.75 && live >= 900 };
}

/**
 * The pool, built by ACCEPTANCE rather than by count, in three passes.
 *
 * PASS ONE, viability. Candidate directions walk the golden angle (so
 * consecutive launches land on opposite sides of the code and the field never
 * reads as a sweeping fan), bent toward the axis the canvas has room on. Each
 * is flown at the field's MEAN shape, and a direction whose flight never
 * reaches full opacity, or lives less than a beat, is one this canvas and this
 * lockup have no room for. That flight also integrates the candidate's VISIBLE
 * MASS, the apparent area it puts on the canvas over its life, which is what
 * pass two balances. A survivor is then flown a second time at 4:5, which
 * decides nothing about membership and only whether pass three may hand this
 * direction the taller box.
 *
 * PASS TWO, balance (round three). Viable candidates are taken in golden order
 * until the pool is full, but one whose half of the canvas already holds more
 * than BALANCE of the mass is passed over and only taken if the pool would
 * otherwise come up short. The selected cards are then put back into golden
 * order before they are given slots, so the launch cadence still alternates
 * sides and only the membership changed.
 *
 * PASS THREE, the shape. Every third slot wants the 4:5 box and takes it if its
 * own direction was accepted with one; where it was not, the box passes to the
 * next slot whose direction was, so the mix stays a third of the pool without
 * ever launching a flight that fails rule 4 at the box it is actually flying. A
 * square card needs no third walk: its box is smaller than the mean one on both
 * axes, so the acceptance it already passed covers the shape it ends up with.
 */
type Candidate = {
  ray: Ray;
  /** Was this direction accepted flying the taller box (see fly): the one
   *  question pass three asks. */
  tall: boolean;
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

    const ray: Ray = {
      key: `alb-${i}`,
      vx,
      vy,
      mag,
      ux: vx / mag,
      uy: vy / mag,
      zBirth,
      zGain,
      sJit: 0.88 + jjj * 0.24,
      rz: (jjjj * 2 - 1) * 5,
      // The tilt is oriented by the flight: every card's inner edge recedes, so
      // the field reads as the surface of one expanding shell rather than a
      // scatter of billboards. Mild on purpose: a photograph is the subject.
      ry: (-vx / mag) * geo.tilt * (0.7 + jj * 0.6),
      rx: (vy / mag) * geo.tilt * (0.7 + j * 0.6),
    };

    // THE DIRECTION, weighed at the shape the field averages out to, so nothing
    // about which rays are viable or how heavy they are depends on the shape
    // lottery further down.
    const mean = fly(ray, MEAN_ASPECT, geo, keep, halfW, halfH);
    if (!mean.ok) continue;
    viable.push({
      ray,
      // The same ray at 4:5, which is a strictly harder flight and therefore its
      // own question. It gates the box, never the launch.
      tall: fly(ray, PORTRAIT, geo, keep, halfW, halfH).ok,
      mass: mean.mass,
      down: vy > 0,
      right: vx > 0,
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
  taken.sort((a, b) => Number(a.ray.key.slice(4)) - Number(b.ray.key.slice(4)));
  // THE SHAPE, and then the clearance, in that order. The mix asks for every
  // third SLOT, and a slot whose direction was not accepted flying a 4:5 hands
  // the box on to the next slot whose direction was, so the COUNT is the third
  // this concept claims and every card flies a shape it was tested at. On the
  // phone that also puts the taller frames where the taller room is, because
  // the directions that can carry one are the vertical lane's.
  const portrait = new Set<number>();
  let owed = 0;
  for (let n = 0; n < taken.length; n++) {
    if (n % PORTRAIT_EVERY === 2) owed++;
    if (owed > 0 && taken[n].tall) {
      portrait.add(n);
      owed--;
    }
  }
  // A box still owed at the end of the pool goes back to a carrier the forward
  // walk stepped over, so the count is the whole third even on a canvas where
  // the last slots cannot take one.
  for (let n = 0; n < taken.length && owed > 0; n++) {
    if (taken[n].tall && !portrait.has(n)) {
      portrait.add(n);
      owed--;
    }
  }
  // The clearance scan is run here, on the real box, and never on the mean the
  // weighing used: a taller box is clear of the type later than a square one,
  // and the quiet zone is the one thing on this concept that may not be
  // approximate.
  return taken.map((c, n) => {
    const aspect = portrait.has(n) ? PORTRAIT : 1;
    const seed: Seed = { ...c.ray, aspect, ...extents(c.ray.rz, aspect) };
    return { ...seed, slot: n, photo: n, pClear: scanClear(seed, geo, keep) };
  });
}

/**
 * THE REST STATE, COMPOSED. It is what a reduced-motion reader, a crawler, a
 * cold paint and a reader with JavaScript off all get, so it is a composition
 * in its own right and not a pause button: the whole album standing still
 * around the vent, every photograph whole, none of them over a word.
 *
 * It is SOLVED, never sampled. Freezing the running field is a freeze frame:
 * half the album caught mid-dissolve at the rim with a hole in the middle, and
 * walking each card back until its opacity clears 0.92 does not fix it, because
 * opacity only starts to fall once the leading edge is ALREADY past the rim. On
 * the phone at the xl step there is no progress at which most cards are both
 * clear of the type and inside the canvas at all: the lockup is nearly as wide
 * as the canvas. So the still is solved on the two dials the flight ties
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
const R2B = 0.569840291;

/** The smallest progress the settled size is drawn from: the far end of the
 *  field's range, a frame well clear of the vent but still small. */
const REST_LO = 0.16;
/** The still's rim margin; see restSpan for why it is not slop. */
const RIM_GUARD = 6;
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
  // THE VENT IS A KEEP-OUT IN THE STILL AND NOWHERE ELSE. The running field
  // wants frames born AT the vent, at no size, because emanating from a point
  // is the whole argument; a still has no next moment to grow into, so a frame
  // parked on the origin is a speck the reader is asked to read as a
  // photograph. Holding the still's frames off the vent gives the settled
  // composition the same open middle the running one has, which is what makes
  // reduced motion a composition rather than a pause. Clear of the square on
  // EITHER axis is clear of it, hence the min.
  const vent = Math.min(
    ax === 0 ? Infinity : (geo.vent / 2 + aw) / ax,
    ay === 0 ? Infinity : (geo.vent / 2 + ah) / ay,
  );
  const lo = Math.max(clearAlong(keep, c.ux, c.uy, aw, ah), vent);
  // How far the centre may go before a corner touches the rim, per axis.
  // RIM_GUARD is not slop: `extents` models the card's 2D rotation only, and
  // the per-card 3D tilt goes through a perspective(760px), which can push the
  // NEAR edge of the projected box a couple of pixels wider than the rotated
  // half-extent says. Measured on the settled field at 1440: one card of 52
  // hung 3 px past the left rim. Six closes it with room, and it costs the
  // composition nothing, because the placement already backs off the far bound.
  const ex = ax === 0 ? Infinity : (halfW - aw - RIM_GUARD) / ax;
  const ey = ay === 0 ? Infinity : (halfH - ah - RIM_GUARD) / ay;
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

/**
 * THE ALBUM PAGE'S HERO. The field behind, the page's own lockup in the quiet
 * zone, and nothing at the centre but the vent the album comes out of.
 *
 * `step` arrives from the board's dock rather than from a control on the stage
 * (Will, 2026-09-15: a page-wide switch has to be reachable from anywhere on
 * the board), and it is a real change of composition: the pool is re-solved
 * against the lockup the step draws, so toggling it restarts the field.
 */
export function AlbumHeroField({ mode, step }: { mode: Mode; step: Step }) {
  const geo = GEO[mode];
  const cards = poolFor(mode, step);
  const head = HEAD[mode][step];
  const page = featurePage("album");
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
      // off the closest ancestor so the field owns no shell knowledge; in
      // production this is useAmbientPause, which also pauses off-screen.
      if (root.closest("[data-paused]")) return;
      elapsed += dt;

      // BEAT ONE: the empty canvas. Nothing is written, so the sheet's first
      // frame (every card at the origin, at no size) is what is on screen.
      const clock = elapsed - HOLD_MS;
      if (clock <= 0) return;

      // BEATS TWO AND THREE: one tween of the seeded launch offsets from
      // nothing to their steady spacing. At clock 0 every card shares a
      // progress, so the album leaves the vent together and the ones with the
      // corridor get out first; the clock term runs the whole time, so there is
      // no handoff between the entrance and the loop, only one expression. And
      // there is no end to it: the album keeps arriving for as long as the page
      // is open, which is the "live" the hero is here to say.
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
    // pool, so the loop restarts and the album blooms again from the vent. That
    // is the honest thing to show, because the field really is a different
    // field once the quiet zone changes shape.
  }, [cards, cycle, geo, halfH, halfW, reduced]);


  return (
    <div
      ref={rootRef}
      /* overflow-CLIP, not overflow-hidden: the same pixels are clipped, but no
         scroll container is created. An overflow-HIDDEN box is still scrollable
         programmatically and by focus, and this one has far more content than
         box, so focusing an action inside it could let the browser "reveal" the
         button by scrolling the whole composition sideways. */
      className="relative size-full overflow-clip bg-background"
    >
      {/* THE FIELD. Full bleed and decorative: the album is the argument, but
          the type in the quiet zone is what carries the sentence. */}
      <div aria-hidden className="alb-field">
        {cards.map((c, i) => {
          // The REST state, written as custom properties the sheet reads: the
          // album settled around the vent, which is what reduced motion, a
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
              className="alb-card"
              style={
                {
                  width: w,
                  height: h,
                  marginLeft: -w / 2,
                  marginTop: -h / 2,
                  zIndex: Number(rest.z),
                  "--alb-rest": rest.transform,
                  "--alb-rest-o": rest.opacity,
                  // THE CROP, per card. Twelve stand-in photographs have to
                  // fill fifty-two frames, so the same picture is on screen
                  // three or four times at once and the eye pairs them
                  // immediately. Moving each frame's object-position is an
                  // honest answer rather than a trick (a crop is a crop, and
                  // the guest media these stand in for is cropped to the tile
                  // exactly this way): the same photograph shows a different
                  // part of itself in each frame, so the field reads as an
                  // album rather than as a deck with repeats. It costs nothing
                  // once Will's 24 squares land, and it stays, because 24
                  // photographs still have to fill 52 frames.
                  "--alb-pos": `${35 + Math.round(hash01(i + 401) * 30)}% ${35 + Math.round(hash01(i + 503) * 30)}%`,
                } as CSSProperties
              }
            >
              {/* EAGER, every frame. A hero's frames all sit inside the first
                  screen, so a lazy image there is fetched immediately anyway,
                  at a lower priority; and on the BOARD this stage is thousands
                  of pixels down a lab page, where nothing intersects the
                  viewport and a lazy field is a scatter of grey boxes filling
                  in one by one (measured on the dev server before the fix: 9 of
                  34 after 60 s). The album has to be photographs from the first
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

      {/* THE LOCKUP, ABOVE THE VENT: the page's eyebrow and its h1, anchored off
          the centre rather than laid out in flow, so the vent holds the exact
          middle whether the line runs to two rows or three. At paint, at full
          opacity, gated by nothing (bible 13). */}
      <div
        className={`absolute inset-x-0 z-10 text-center ${GUTTER[mode].x}`}
        style={{ bottom: `calc(50% + ${geo.vent / 2 + geo.gapTop}px)` }}
      >
        {/* The shipped lockup's own parts, at the shipped lockup's own gap
            (PageHero stacks at gap-6), so what is being judged is this page's
            hero and not a board's idea of one. */}
        <Eyebrow data-alb-block="eyebrow">{page.navLabel}</Eyebrow>
        <h1
          data-alb-block="h1"
          className={`mx-auto mt-6 font-heading text-balance ${LADDER[step][mode]} ${head.lead}`}
          style={{ maxWidth: head.max }}
        >
          {page.h1}
        </h1>
      </div>

      {/* THE LOCKUP, BELOW THE VENT: the page's sentence and its actions, in the
          same quiet zone, on both canvases. No scrim anywhere and no darkening
          layer over a frame: the keep-out is what holds the type off the
          photographs, which is the argument (bible 1). */}
      <div
        data-alb-block="under"
        className={`absolute inset-x-0 z-10 text-center ${GUTTER[mode].x}`}
        style={{ top: `calc(50% + ${geo.vent / 2 + geo.gapBottom}px)` }}
      >
        <p
          data-alb-block="sub"
          className="mx-auto text-lg text-balance text-muted-foreground"
          style={{ maxWidth: geo.subMax }}
        >
          {page.heroSub}
        </p>
        {/* mt-8 is PageHero's gap-6 plus the mt-2 a control row takes, which is
            the offset every feature hero ships. The buttons are the shipped
            hero's, verbatim, with no cinema-only tinting: the cinema ground
            already resolves the outline variant correctly, and a board that
            re-tints them stops telling the truth about the page. */}
        <div
          data-alb-block="actions"
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Button asChild size="lg" className="h-11 px-6 text-base">
            <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-11 px-6 text-base">
            <Link href="/how-it-works">See how it works</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
