"use client";

// the concept's own sheet; it leaves with the board when the ruling lands.
import "./scan.css";

import Link from "next/link";
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { FooterQr } from "@/components/marketing/chrome/footer-qr";
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
 * THE SCAN (concept 2 of the home-hero board; the axis is THE CAUSE MADE
 * LITERAL). Round four, 2026-09-15.
 *
 * WILL RULED THE PHONE IN. "I'm loving 1 and 2. Let's continue iterating on 1
 * in its current emanating direction and 2 with its phone scan addition."
 * Three rounds carried the phone as an open question with the room as the safe
 * answer; that question is closed, so this round stops hedging and spends
 * itself on the thing that was only ever a proposal: a guest's phone, in the
 * frame, actually scanning.
 *
 * WHAT ROUND FOUR CHANGED, and why.
 *
 * A. THE PHONE IS THE COMPOSITION, not an option on top of one. It is the
 *    default at both canvases, both canvases are laid out around it (the 1440
 *    corridor lifts 18 px so the near field has a quadrant of its own; the 375
 *    canvas puts the words at the top, the plate in the middle and the near
 *    field across the bottom), and the room reading survives only as a
 *    FOOTNOTE toggle in the corner, because it still teaches one thing: what
 *    this hero looks like on the day the cutout has not been shot.
 *
 * B. THE SCAN BECAME A GESTURE. Through round three the phone was already up,
 *    already aimed and already locked at the first frame, which is a diagram
 *    of a scan rather than a scan. It now RISES into the frame over 620 ms
 *    from below the edge, rolling the last few degrees into its aim, and only
 *    then do the brackets begin to close. And it never stops being held: a
 *    7.3 s drift of about a pixel and a quarter of a degree, on the one period
 *    in the composition that is not a multiple of the album's, so the hand and
 *    the album never march together. A phone that is perfectly still is a
 *    phone on a stand.
 *
 * C. THE CAPTURE NOW LANDS ON THE CODE. This was the real fault, and three
 *    rounds missed it: in the phone reading the capture fired on the SCREEN
 *    and nothing whatever happened at the plate, so the one sentence the
 *    concept exists to say ("the scan releases the album") had no visible
 *    verb. The bloom left the room reading and became the plate's own answer
 *    in both: the camera fires, the code answers, the album leaves. Three
 *    objects, one beat, in causal order.
 *
 * D. THE REPEAT READS AS A SCAN AGAIN, not as a light that blinks. Round three
 *    made the capture repeat once per turn of the album but left the brackets
 *    locked and motionless through it, so every recapture was a flash with no
 *    cause. The brackets now tick inward on each one, the way a scanner
 *    confirms a read, so the whole chain replays: brackets, flash, bloom,
 *    album. It is four small elements moving about two pixels.
 *
 * E. THE DEVICE IS BUILT FOR THE PHOTOGRAPH THAT WILL REPLACE IT. The drawn
 *    phone used to be one box with the screen inside it, which is the one
 *    shape a cutout cannot drop into. It is three flat layers now, in paint
 *    order: the body, the live viewfinder, the bezel's rim and notch. The
 *    hand-and-phone cutout (ASSETS row 8, now a standing ask) replaces the
 *    first and the last, and the viewfinder underneath is untouched and still
 *    live. The swap is one element, not a rebuild.
 *
 * F. THE CAPTION NAMES THE ACT, AND THEN ITS RESULT. "Every guest scans the
 *    same code" opened on the same word as the proposed headline and described
 *    a mechanism. "Guests scan once. The album fills itself." names the actor,
 *    the effort (once) and the payoff the corridor is already drawing. Its
 *    LENGTH is a measured constraint rather than a taste: at 375 this is the
 *    one block of type the corridor can reach, and the keep-out sweep buys
 *    about five pixels of clearance for every thirty pixels of ink it loses
 *    (the first draft ran 273 px wide and the footnote reading intersected).
 *
 * The argument, unchanged since round one. The source is right and Will ruled
 * it: the code holds the centre and the album branches out of it, so a
 * stranger thinks "if I scan this, I get all of these". But that stranger
 * still has to INFER the scan, because the only actor in the frame is a QR.
 * This variation puts the act itself in the picture, and the hero becomes one
 * sentence in time: a camera finds the code, the code releases the album, the
 * album never stops.
 *
 * What is inherited from the source, deliberately and without change: the
 * corridor's physics (24 cards, two pools by index parity, one launch a side
 * every 900 ms, 9.6 s flights, position and scale on separate curves, the
 * recycling falling out of one modulo, one requestAnimationFrame loop writing
 * to 24 nodes and never to React state), the edge mask, the type above and
 * below the band, and the centred lockup. Rising tides says elevate what
 * points at the axis: the corridor already points at it, so it is kept exactly
 * and every round of this variation is spent on the cause.
 */

/* The corridor's constants (the source's numbers, kept exactly) */

const CARDS = 24;
/** Cards per side. CARDS / 2 by the parity split. */
const POOL = CARDS / 2;
const FLIGHT_MS = 9600;
const LAUNCH_MS = 900;
/** One card's full round trip: the flight plus its slack on the ground. */
const CYCLE_MS = POOL * LAUNCH_MS;
/** The seeded gap between neighbours, in progress units: 900 / 9600. */
const SEED_STEP = LAUNCH_MS / FLIGHT_MS;
const REVEAL_MS = 1750;
/** The scale curve reaches 1 only at progress 1, far off screen, so the DOM box
 *  is sized for the largest VISIBLE moment and the curve is multiplied up to
 *  match: 24 composited layers stay at ~292px instead of ~820px. */
const SCALE_GAIN = 2.81;

/** Which reading of the cause is on the stage. Will ruled the phone in, so the
 *  room is a footnote rather than a candidate; it is kept because it is the
 *  only reading that needs no photograph, which is worth being able to see on
 *  the day the cutout has not been shot. */
type Cause = "phone" | "room";

/**
 * THE BEAT, per reading, in milliseconds from the stage's first frame. It is
 * held here rather than in the sheet because the corridor's clock is JS while
 * the lock, the flash and the bloom are CSS, and the two have to agree to the
 * frame: the sheet reads `lock` and `cap` off custom properties this file
 * writes onto the concept's root, so there is ONE set of numbers.
 *
 * The phone reading spends its first 300 ms on the gesture (the device rising
 * into frame over RISE_MS), and only then does the camera begin to acquire:
 * the sweep runs 300 to 1020, the capture fires at 1020, the plate answers,
 * and the album is released 40 ms later on the capture's own peak. The room
 * reading has no hand to raise, so it keeps round three's numbers exactly,
 * which is also what makes the footnote a fair comparison.
 */
const LOCK_MS = 720;
const RISE_MS = 620;
const BEAT: Record<Cause, { lock: number; cap: number }> = {
  phone: { lock: 300, cap: 300 + LOCK_MS },
  room: { lock: 0, cap: LOCK_MS },
};
/** The capture's own peak is 48 ms into its pulse (scan.css); the album leaves
 *  the plate there, so cause and effect share a frame rather than a cut. */
const releaseFor = (cause: Cause) => BEAT[cause].cap + 40;

/* The live album's count. A stand-in number, flagged on the board: the wiring
   round reads the demo event's real totals or the line goes. It starts at its
   opening value IN THE SERVER'S HTML and climbs one per launch to its settled
   value, so nothing rewinds when the loop takes over, and then holds, because
   an album fills and then is full. */
const PHOTOS_SETTLED = 312;
const PHOTOS_START = 282;
const GUESTS = 48;

function countText(launches: number) {
  const n = Math.min(PHOTOS_START + launches, PHOTOS_SETTLED);
  return `${n} photos from ${GUESTS} guests`;
}

/** The chosen reading, held OUTSIDE the component on purpose. The board keys
 *  the stage on the canvas, the copy and the run, so Replay and every canvas
 *  change remount this concept from scratch: component state would silently
 *  drop the reading and put the phone back, and a reviewer who flipped to the
 *  footnote and then looked at 375 would be shown the composition he did not
 *  ask for. Module scope survives the remount and is safe here because the
 *  board renders one canvas at a time. It leaves with the toggle. (The river
 *  reached the same answer for its own chip; a `controls` slot on Concept
 *  would retire both.) */
let causeChoice: Cause = "phone";

/** The phone in the near field: its box, its angle, the viewfinder inside it,
 *  and the gesture that brings it into frame. x and y are the CENTRE of the
 *  device, offset from the canvas centre, so the crop against a frame edge is
 *  a number rather than a guess. */
type Device = {
  w: number;
  x: number;
  y: number;
  /** Clockwise: a phone held up at the lower left aims its top up and right. */
  rz: number;
  /** Tipped away from the viewer, so the screen still faces us. */
  ry: number;
  /** The detected code's edge ON THE SCREEN, quiet zone included. Small on
   *  purpose: a code across a room is small in a viewfinder. */
  qr: number;
  /** Where the code sits down the screen, 0 to 1. A code is wherever it is in
   *  the frame, so biasing it up is what lets the phone be cropped hard by the
   *  bottom edge and still show what it has found. */
  qrY: number;
  /** THE GESTURE: how far below its held position the device starts, and how
   *  many extra degrees of roll it carries there. A hand comes up and turns
   *  into its aim in one movement. */
  lift: number;
  liftRz: number;
};

/** A scanner's four corner brackets: the arm, the gap from the code, the
 *  stroke, and how far outward they start before the lock. The viewfinder's
 *  set and the room's set are the same object at two scales. */
type Lock = { arm: number; pad: number; stroke: number; throw: number };

/** Where the caption and the count sit, relative to the corridor's axis. On a
 *  canvas whose near field is busy they move ABOVE the code instead of below
 *  it; the corridor's clear lane is symmetric in y, so either side works. */
type Lane = { at: number; anchor: "top" | "bottom"; max: number };

/** The composition, per cause: the whole lockup hangs off these. */
type Layout = {
  /** The corridor's axis, signed, from the canvas centre. Negative is up. */
  axis: number;
  lane: Lane;
  /** True when the sentence and the actions ride with the headline ABOVE the
   *  band, which is what frees a phone canvas's bottom third for the device. */
  stacked: boolean;
  /** The stacked block's inset from the top of the canvas. */
  topInset: number;
};

type Geo = {
  /** The QR's edge in px, quiet zone included. */
  qr: number;
  /** The card's DOM box; the scale curve is normalized against it. */
  card: number;
  /** How far a frame travels from the centre at progress 1. */
  travel: number;
  perspective: number;
  /** Half the corridor's reserved band: where the type starts, from the axis. */
  offset: number;
  captionClass: string;
  countClass: string;
  /** Canvas-relative, never a vw value: the stage is zoomed under Fit. */
  sizes: string;
  /** The corridor's half-angle in degrees, before the per-card jitter. */
  rotate: number;
  /** The vertical scatter at full scale, so the rows are a row and not a rail. */
  yDrift: number;
  /** The h1's measure, tuned so the line breaks where it should. */
  h1Max: number;
  /** How much of each edge the band dissolves over. */
  fade: string;
  device: Device;
  /** The brackets on the phone's screen, and the ones on the room's plate. */
  viewLock: Lock;
  roomLock: Lock;
  /** The capture bloom's diameter, in plate widths. The gradient reaches
   *  transparent at the box's own edge (scan.css), so this IS the visible
   *  disc rather than a box with a transparent margin. */
  bloom: number;
  layout: Record<Cause, Layout>;
};

const GEO: Record<Mode, Geo> = {
  desktop: {
    qr: 144,
    card: 330,
    travel: 1.65 * CANVAS.desktop.w,
    perspective: 900,
    offset: 196,
    captionClass: "text-[15px]",
    countClass: "text-[13px]",
    sizes: "360px",
    rotate: 9.5,
    yDrift: 44,
    h1Max: 1100,
    fade: "12%",
    device: {
      // ROUND FOUR: bigger, and still cropped by two edges (the left and the
      // bottom). A phone entering at the lower left is ANOTHER guest's hand,
      // which is the right person at 1440: the reader here is the host, and
      // what a host should be shown is a room where this is already happening.
      // The 375 canvas is deliberately the opposite; see below.
      w: 296,
      x: -600,
      y: 352,
      rz: 11,
      ry: -14,
      qr: 50,
      qrY: 0.3,
      lift: 250,
      liftRz: 7,
    },
    viewLock: { arm: 14, pad: 5, stroke: 1.7, throw: 16 },
    roomLock: { arm: 34, pad: 14, stroke: 2.5, throw: 34 },
    bloom: 2.3,
    layout: {
      // The corridor lifts 18 px in the ruled reading so the near field owns a
      // quadrant rather than borrowing one. Eighteen pixels is nothing to look
      // at and everything to compose with: it is the difference between the
      // device crowding the actions and clearing them.
      phone: {
        axis: -18,
        lane: { at: 118, anchor: "top", max: 340 },
        stacked: false,
        topInset: 0,
      },
      room: {
        axis: 0,
        lane: { at: 118, anchor: "top", max: 340 },
        stacked: false,
        topInset: 0,
      },
    },
  },
  phone: {
    qr: 108,
    card: 150,
    travel: 1.65 * CANVAS.phone.w,
    perspective: 360,
    offset: 168,
    captionClass: "text-[13px]",
    countClass: "text-[12px]",
    sizes: "170px",
    rotate: 8.5,
    yDrift: 12,
    h1Max: 343,
    fade: "16%",
    device: {
      // THE PHONE CANVAS'S OWN COMPOSITION, and it is first person where the
      // 1440 one is third. A reader at 375 is holding the object being drawn,
      // so the device rises almost centred out of the bottom edge and aims
      // straight up the middle: it reads as HIS phone, and the screen's code
      // and the room's code then stand on one vertical axis about 155 px
      // apart, which is the fastest read of "the same object at two scales"
      // the concept has.
      w: 252,
      x: 4,
      y: 450,
      rz: 6,
      ry: -8,
      qr: 44,
      qrY: 0.13,
      lift: 190,
      liftRz: 6,
    },
    viewLock: { arm: 12, pad: 4, stroke: 1.5, throw: 14 },
    roomLock: { arm: 24, pad: 10, stroke: 2, throw: 24 },
    bloom: 2.3,
    layout: {
      phone: {
        // The words take the top of the screen in one block, which is what
        // frees the bottom third for the near field, and the supporting pair
        // moves ABOVE the plate, the only clear lane left once the device is in
        // the frame. Round four raised the axis to 96 and the block to 22: the
        // device grew, and every pixel it grew by had to come from somewhere
        // that was not the type.
        axis: 96,
        lane: { at: -92, anchor: "bottom", max: 320 },
        stacked: true,
        topInset: 22,
      },
      room: {
        // No near field to make room for, so the classic vertical rhythm:
        // headline, the band with the code, the pair, the sentence, the
        // actions. Round four moved the lane from 96 to 108 and narrowed the
        // measure to 300: the new caption is 273 px of ink at 13 px rather
        // than 207, which is wide enough at 375 to reach the corridor, and
        // the sweep caught it (two intersections, 1 px of clearance). Twelve
        // pixels further from the axis clears it by 20 and still leaves 20 px
        // above the sentence at 168.
        axis: -6,
        lane: { at: 108, anchor: "top", max: 300 },
        stacked: false,
        topInset: 0,
      },
    },
  },
};

/* The shader primitives the fountain is written in (the source's, kept) */

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

type Card = {
  key: string;
  /** -1 = the left arm, 1 = the right arm. */
  dir: 1 | -1;
  /** Position in its own pool: the launch order and the seed. */
  slot: number;
  photo: number;
  yOff: number;
  sJit: number;
  ry: number;
  rz: number;
};

/** The two pools. The photo offset is half the manifest's length rather than a
 *  straight cycle of the global index, so each arm walks the WHOLE set and the
 *  two arms never carry the same frame at the same moment. */
function buildCards(): Card[] {
  const half = Math.round(FRAMES.length / 2);
  return Array.from({ length: CARDS }, (_, g) => {
    const right = g % 2 === 1;
    const slot = (g - (right ? 1 : 0)) / 2;
    const j = hash01(g);
    const jj = hash01(g + 101);
    const jjj = hash01(g + 211);
    return {
      key: `hhc-${g}`,
      dir: (right ? 1 : -1) as 1 | -1,
      slot,
      photo: slot + (right ? half : 0),
      // Scatter and roll keep the corridor from reading as a conveyor. Both are
      // multiplied by the live scale, so every frame still converges exactly on
      // the plate: the source is a point, not a smear.
      yOff: (j * 2 - 1) * 1,
      sJit: 0.94 + jj * 0.12,
      rz: (jj * 2 - 1) * 1.1,
      ry: (right ? -1 : 1) * (1 + (jjj * 2 - 1) * 0.19),
    };
  });
}

/** Mode-independent, so the pools are built once for the module. */
const CARD_POOLS = buildCards();

function transformFor(c: Card, p: number, geo: Geo) {
  const s = scaleAt(p) * SCALE_GAIN * c.sJit;
  const x = c.dir * travelAt(p) * geo.travel;
  const y = c.yOff * geo.yDrift * s;
  const ry = c.ry * geo.rotate;
  return `translate3d(${x}px, ${y}px, 0) rotateY(${ry}deg) rotateZ(${c.rz}deg) scale(${s})`;
}

/** Frames fade up AT the plate instead of appearing beside it, and the ramp
 *  runs long enough that a frame is still arriving as it clears the code:
 *  emerging, never switched on. */
const opacityAt = (p: number) => (p > 1 ? 0 : smoothstep(0, 0.24, p));

/** The four corner brackets a scanner draws around a code it has found. One
 *  component for both readings: on the phone's screen they are 14 px arms
 *  around a 50 px code, in the room they are 34 px arms around the real plate.
 *  data-hh-loop is board.css's pause hook; the lock is a one-shot that wants it
 *  anyway, because the concept holds its own clock on the same attribute and
 *  the beat and the corridor have to stay in step across a tab switch. */
function Brackets() {
  return (
    <>
      {["hhc-tl", "hhc-tr", "hhc-bl", "hhc-br"].map((c) => (
        <span key={c} data-hh-loop className={`hhc-bracket ${c}`} />
      ))}
    </>
  );
}

/** The bracket set's own custom properties, so the sheet reads one shape. */
function lockVars(lock: Lock): CSSProperties {
  return {
    "--hhc-arm": `${lock.arm}px`,
    "--hhc-pad": `${lock.pad}px`,
    "--hhc-stroke": `${lock.stroke}px`,
    "--hhc-throw": `${lock.throw}px`,
  } as CSSProperties;
}

/** The camera view on the phone's screen: the same code the room is holding,
 *  small because it is across the room, with the brackets closing on it. It is
 *  FooterQr rather than DemoQr because the plate in the room already carries
 *  the link and the accessible name; a second link to the same place would be
 *  a second tab stop for a picture of a picture. The whole device is
 *  aria-hidden for the same reason. */
function Viewfinder({
  url,
  d,
  lock,
}: {
  url: string | null;
  d: Device;
  lock: Lock;
}) {
  return (
    <div className="hhc-lockbox flex" style={lockVars(lock)}>
      <FooterQr value={url ?? "https://partyreel.com"} size={d.qr} />
      <Brackets />
    </div>
  );
}

/**
 * A guest's phone in the near field, camera open on the code across the room,
 * cropped by the frame's own edges the way your own hands are cropped by your
 * own field of view. Decorative in full: what it is looking at is the real
 * plate, a few hundred pixels away.
 *
 * THREE FLAT LAYERS, in paint order, and the split is the point (round four).
 * The hand-and-phone cutout on ASSETS row 8 is a PNG with the screen area
 * transparent, so the only structure it can drop into is one where the screen
 * is a sibling UNDER the body rather than a child inside it:
 *
 *   .hhc-back    the body. The cutout replaces this.
 *   .hhc-screen  the live viewfinder. Untouched by the swap, and it stays
 *                live: the code on it is the real demo code, rendered.
 *   .hhc-bezel   the rim, with .hhc-pill the notch. The cutout carries its
 *                own, so both are deleted with the swap.
 *
 * Until then the drawn device is the stand-in, and it is drawn to be honest
 * about what it is: no chrome on the screen but the notch, because the product
 * needs no app, and a bezel radius that is a real phone's corner rather than a
 * UI token, because a phone corner is not a surface.
 */
function HeldPhone({
  url,
  d,
  lock,
}: {
  url: string | null;
  d: Device;
  lock: Lock;
}) {
  return (
    <div
      aria-hidden
      className="hhc-device z-20"
      style={
        {
          left: `calc(50% + ${d.x}px)`,
          top: `calc(50% + ${d.y}px)`,
          width: d.w,
          translate: "-50% -50%",
          "--hhc-w": `${d.w}px`,
          "--hhc-rz": `${d.rz}deg`,
          "--hhc-ry": `${d.ry}deg`,
          "--hhc-lift": `${d.lift}px`,
          "--hhc-lift-rz": `${d.liftRz}deg`,
          "--hhc-rise-ms": `${RISE_MS}ms`,
        } as CSSProperties
      }
    >
      {/* THE GESTURE: the hand coming up into frame. The perspective lives on
          this element rather than on the device, so the phone stays the direct
          child of a perspective parent and keeps its 3D through the wrapper. */}
      <div data-hh-loop className="hhc-rise">
        <div
          data-hh-loop
          className="hhc-phone w-full"
          style={{ aspectRatio: "0.472" }}
        >
          <div className="hhc-back" />
          <div
            className="hhc-screen"
            style={{ "--hhc-vy": `${d.qrY * 100}%` } as CSSProperties}
          >
            <div className="hhc-viewpos" style={{ top: `${d.qrY * 100}%` }}>
              <Viewfinder url={url} d={d} lock={lock} />
            </div>
            <div data-hh-loop className="hhc-flash" />
          </div>
          <div className="hhc-bezel" />
          <div className="hhc-pill" />
        </div>
      </div>
    </div>
  );
}

/** The lab's footnote, in the corner of the canvas. It is not a candidate
 *  switch any more: Will ruled the phone in, so this shows the one thing the
 *  ruled-out reading still teaches, which is what the hero looks like before
 *  the cutout exists. Chrome, never composition, and it leaves with the board.
 *  (The board's shell is shared and registered, so a concept with a control of
 *  its own has nowhere but the canvas to put it; the Handoff asks again for a
 *  `controls` slot on Concept.) */
function RoomToggle({
  on,
  onChange,
  small,
}: {
  on: boolean;
  onChange: (on: boolean) => void;
  small: boolean;
}) {
  return (
    <div className={`hhc-lab ${small ? "hhc-lab-sm" : ""}`}>
      <span className="hhc-lab-label">Footnote</span>
      <button
        type="button"
        aria-pressed={on}
        onClick={() => onChange(!on)}
        className="hhc-lab-btn"
      >
        Without the phone
      </button>
    </div>
  );
}

function Scan({ mode, copy, qrUrl }: ConceptProps) {
  const geo = GEO[mode];
  const [cause, setCauseState] = useState<Cause>(causeChoice);
  const setCause = useCallback((c: Cause) => {
    causeChoice = c;
    setCauseState(c);
  }, []);
  const layout = geo.layout[cause];
  const axis = layout.axis;
  const beat = BEAT[cause];
  const release = releaseFor(cause);
  const text = copyFor(scan, copy);
  const reduced = usePrefersReducedMotion();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  const countRef = useRef<HTMLSpanElement | null>(null);
  // The contract's progress[]: filled every frame, never React state.
  const progress = useRef<number[]>([]);

  /** Point at the code and the camera re-acquires it: the lock replays, the
   *  album does not. Restarting the CSS animations rather than running new
   *  ones is what keeps this free under reduced motion, where the cascade
   *  carries no animation to restart and this is a no-op by construction. */
  const relock = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const marks = root.querySelectorAll<HTMLElement>(
      ".hhc-bracket, .hhc-flash, .hhc-bloom",
    );
    for (const el of marks) el.style.animation = "none";
    // One forced reflow for the whole set, not one per node.
    void root.offsetWidth;
    for (const el of marks) el.style.animation = "";
  }, []);

  useEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    if (!root) return;

    let raf = 0;
    let last = 0;
    let since = 0;
    let shown = -1;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last === 0 ? 0 : Math.min(now - last, 50);
      last = now;
      // The stage sets data-paused on a hidden tab. Holding the CLOCK rather
      // than the loop is what matters: rAF does not fire in a background tab
      // either way, and an un-held clock teleports the corridor on return.
      // Read off the closest ancestor so the concept owns no shell knowledge.
      if (root.closest("[data-paused]")) return;
      since += dt;

      // THE CAUSE. Nothing moves in the corridor until the capture: at elapsed
      // 0 every card is at progress 0, which is scale 0 and opacity 0, so the
      // room is genuinely empty while the phone is coming up and the brackets
      // are closing on the code.
      const elapsed = since > release ? since - release : 0;

      // The live album. One tick per launch, both arms, so the number rising is
      // the same event as a pair of frames being born, and it LIFTS as it
      // changes so the eye catches the link. Written straight to the node:
      // this is the only text in the hero that changes and it must not cost a
      // render. Settled, it holds.
      const launches = Math.floor(elapsed / LAUNCH_MS) * 2;
      if (launches !== shown) {
        const first = shown < 0;
        shown = launches;
        const el = countRef.current;
        if (el) {
          el.textContent = countText(launches);
          if (!first && el.animate) {
            el.animate(
              [
                { translate: "0 2px", opacity: 0.5 },
                { translate: "0 0", opacity: 1 },
              ],
              { duration: 220, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
            );
          }
        }
      }

      // The branch-out: one tween of the seeded offsets from nothing to their
      // steady spacing. The clock term runs the whole time, so there is no
      // handoff between the entrance and the loop, only one expression.
      const reveal = revealEase(elapsed / REVEAL_MS);
      const p = progress.current;
      for (let i = 0; i < CARD_POOLS.length; i++) {
        p[i] =
          mod(CARD_POOLS[i].slot * LAUNCH_MS * reveal + elapsed, CYCLE_MS) /
          FLIGHT_MS;
      }
      for (let i = 0; i < CARD_POOLS.length; i++) {
        const el = nodes.current[i];
        if (!el) continue;
        const at = p[i];
        if (at > 1) {
          // On the ground between flights, and far off screen besides.
          el.style.opacity = "0";
          continue;
        }
        el.style.transform = transformFor(CARD_POOLS[i], at, geo);
        el.style.opacity = String(opacityAt(at));
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // `cause` is a dependency on purpose: flipping the footnote replays the
    // whole beat, so the two are compared from the same first frame.
  }, [geo, reduced, cause, release]);

  const lane = (
    <div
      className={`absolute inset-x-0 z-10 text-center ${GUTTER[mode].x}`}
      style={
        layout.lane.anchor === "top"
          ? { top: `calc(50% + ${axis + layout.lane.at}px)` }
          : { bottom: `calc(50% - ${axis + layout.lane.at}px)` }
      }
    >
      {/* THE ACT, and it is the loud line of the pair: the permanent, true line
          leads and the stand-in count supports it, so the composition survives
          the count being cut at wiring. Round four rewrote it to name the
          result and not only the mechanism, and kept it short because at 375
          this is the one line of type the corridor can reach. */}
      <Caption
        className={`mx-auto text-white/85 ${geo.captionClass}`}
        style={{ maxWidth: layout.lane.max }}
      >
        Guests scan once. The album fills itself.
      </Caption>
      {/* The consequence, counted, and quiet. One face in the product since the
          kill-mono sweep, so a figure that changes takes tabular-nums and
          nothing else: the digits hold their column while the number climbs. */}
      <Caption
        className={`mx-auto mt-1.5 text-white/55 tabular-nums ${geo.countClass}`}
        style={{ maxWidth: layout.lane.max }}
      >
        <span ref={countRef}>{countText(0)}</span>
      </Caption>
    </div>
  );

  const headline = (
    <h1
      className={`mx-auto font-heading leading-[1.02] text-balance text-white ${LADDER.xl[mode]}`}
      style={{ maxWidth: geo.h1Max }}
    >
      {text.h1}
    </h1>
  );

  const sentence: ReactNode = (
    <>
      <p className="mx-auto max-w-xl text-[15px] leading-relaxed text-pretty text-white/80">
        {text.subhead}
      </p>
      <div
        className={`flex flex-wrap items-center justify-center gap-3 ${layout.stacked ? "mt-5" : "mt-7"}`}
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
    </>
  );

  return (
    <div
      ref={rootRef}
      /* overflow-CLIP, not overflow-hidden, and the difference is a bug round
         three found by walking the board: an `overflow: hidden` box is still a
         SCROLL container, and this one's content is 3780 px wide (the corridor
         throws every frame 1.65 canvases each way). Clicking the toggle gave
         its button focus, Chrome scrolled the container to "reveal" it, and the
         whole composition jumped 600 px sideways with the headline cut off.
         `overflow: clip` clips the same pixels and creates no scroll container
         at all, so nothing in the hero can ever be scrolled by a focus, a click
         or an anchor. The other concepts on this board still carry the hidden
         version; only one with a control inside the canvas can be made to show
         it, which is why it is filed in the Handoff rather than fixed here. */
      className="relative size-full overflow-clip bg-background"
      style={
        {
          // THE ONE SET OF BEAT NUMBERS. The sheet reads these and the rAF loop
          // reads BEAT, so the beat changes in one place and both follow.
          "--hhc-lock-delay": `${beat.lock}ms`,
          "--hhc-cap-delay": `${beat.cap}ms`,
          "--hhc-period": `${CYCLE_MS}ms`,
          "--hhc-lock-ms": `${LOCK_MS}ms`,
        } as CSSProperties
      }
    >
      {/* THE CORRIDOR, inherited from the source unchanged. Full bleed and
          decorative: the album is the consequence, but it is the type above
          and below that carries the sentence. */}
      <div
        aria-hidden
        className="hhc-band absolute inset-0"
        style={{ "--hhc-fade": geo.fade } as CSSProperties}
      >
        <div
          className="hhc-corridor"
          style={
            {
              "--hhc-persp": `${geo.perspective}px`,
              "--hhc-axis": `${axis}px`,
            } as CSSProperties
          }
        >
          {CARD_POOLS.map((c, i) => {
            // The REST state, written as custom properties the sheet reads:
            // the corridor standing at its steady-state spacing, which is what
            // reduced motion, a crawler and the server's own HTML get.
            const seed = c.slot * SEED_STEP;
            const at = Math.min(seed, 1);
            return (
              <div
                key={c.key}
                ref={(el) => {
                  nodes.current[i] = el;
                }}
                className="hhc-card"
                style={
                  {
                    width: geo.card,
                    height: geo.card,
                    marginLeft: -geo.card / 2,
                    marginTop: -geo.card / 2,
                    "--hhc-rest": transformFor(c, at, geo),
                    "--hhc-rest-o": opacityAt(seed),
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

      {/* THE CAUSE: a guest's phone in the near field, its camera open on the
          code across the room. The ruled reading, and the default. */}
      {cause === "phone" && (
        <HeldPhone url={qrUrl} d={geo.device} lock={geo.viewLock} />
      )}

      {/* THE OBJECT, at the exact centre of the corridor, above the frames so
          they are born behind it. Nothing about it moves: the stillness is the
          point, and a QR that breathes is a QR nobody can scan. Real, live and
          tappable; its own accessible name covers it. Pointing at it replays
          the lock, which is the one interaction that proves the screen and the
          plate are the same object.

          THE PLATE ANSWERS THE CAMERA, in both readings, and round four is
          where that started being true: the bloom used to belong to the room
          reading alone, so in the ruled reading the capture fired on the screen
          and the code itself did nothing at all. Now the camera fires, the code
          answers, and the album leaves it 40 ms later. The brackets stay the
          room reading's alone, because in the ruled one the viewfinder is where
          a scanner draws them. */}
      <div
        className="absolute left-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
        style={{ top: `calc(50% + ${axis}px)` }}
        onPointerEnter={relock}
        onFocus={relock}
      >
        <div
          className="hhc-roomlock"
          style={cause === "room" ? lockVars(geo.roomLock) : undefined}
        >
          <span
            aria-hidden
            data-hh-loop
            className="hhc-bloom"
            style={
              { "--hhc-bloom": `${geo.qr * geo.bloom}px` } as CSSProperties
            }
          />
          <DemoQr url={qrUrl} size={geo.qr} />
          {cause === "room" && <Brackets />}
        </div>
      </div>

      {/* THE ACT, named, and its consequence, counted. Both live in a lane the
          corridor leaves clear by its physics: a frame is a speck while it is
          near the plate and only grows once it is far out horizontally, so the
          column directly above or below the code is empty without a scrim. */}
      {lane}

      {layout.stacked ? (
        /* THE PHONE CANVAS'S COMPOSITION: the words take the top of the screen
           in one block, which is what frees the bottom third for the near
           field. The h1 is still at paint, at full opacity, gated by nothing
           (bible 13). */
        <div
          className={`absolute inset-x-0 z-10 text-center ${GUTTER[mode].x}`}
          style={{ top: layout.topInset }}
        >
          {headline}
          <div className="mt-4">{sentence}</div>
        </div>
      ) : (
        <>
          {/* THE HEADLINE, anchored off the corridor's axis rather than laid
              out in flow, so the code holds the exact middle whether the line
              runs to one row or two. */}
          <div
            className={`absolute inset-x-0 z-10 text-center ${GUTTER[mode].x}`}
            style={{ bottom: `calc(50% + ${geo.offset - axis}px)` }}
          >
            {headline}
          </div>

          {/* THE SENTENCE AND THE ACTIONS, below the corridor. No scrim
              anywhere on this concept and no darkening layer over a frame: the
              band's geometry is what keeps the type off the photographs. */}
          <div
            className={`absolute inset-x-0 z-10 text-center ${GUTTER[mode].x}`}
            style={{ top: `calc(50% + ${axis + geo.offset}px)` }}
          >
            {sentence}
          </div>
        </>
      )}

      <RoomToggle
        on={cause === "room"}
        onChange={(on) => setCause(on ? "room" : "phone")}
        small={mode === "phone"}
      />
    </div>
  );
}

export const scan: Concept = {
  id: "scan",
  n: 2,
  name: "The scan",
  rationale:
    "The source's corridor with the cause put in the frame, and since Will ruled the phone in it is the phone that does it: a guest's hand rises into the near field, the camera finds the code across the room, the capture fires on the screen, the code blooms in answer, and only then does the album branch out of the plate. Three objects, one beat, in causal order. The camera re-acquires once per turn of the album, so the sentence is restated rather than asserted once, and the hero reads as the next guest scanning. The two canvases are two compositions rather than one compressed: at 1440 the hand enters from the left, another guest at work in a room the host is being shown; at 375, where the reader is holding the object being drawn, it rises almost centred out of the bottom edge and the two codes stand on one vertical axis. The toggle in the corner is a footnote and not a candidate: it shows what this hero looks like before the cutout on ASSETS row 8 is shot.",
  eyebrow:
    "Settled: no eyebrow line. The code is the eyebrow and the caption under it names the act; a word above the headline would be a fifth block of type in a composition that already carries a headline, a caption, a count, a sentence and two actions.",
  proposed: {
    h1: "Every camera in the room, one album.",
    subhead:
      "Guests point a camera at the code, and their photos and videos land in your album, with no app and no account.",
    secondary: "See what it made",
  },
  departures: [
    "KEEP THE COUNT, OR CUT IT. 282 photos from 48 guests, climbing to 312, is a STAND-IN and must not ship as invented data: the wiring round reads the demo event's real total, or the line goes. It is the quiet half of the pair, so the composition holds either way. This is the one ruling left on the concept.",
    "THE CENTRED LOCKUP, inherited from the source: precedent and not law, because the code owns the axis. Overrule it and this hero goes left with the source.",
    "RULED AND FLAGGED, not a question: the phone. Will ruled it in on 2026-09-15, and three things still hold it to a camera rather than to software, because a phone that reads as an app would break the whole pitch. The screen carries no chrome but the notch, no title bar and no buttons; the device is cropped by two frame edges so it reads as a held object in the room rather than a mockup on a slide; and what it is looking at is visibly the same code standing a few hundred pixels away. Its bezel radius is a drawn object's proportion, a literal rather than a surface token, because a phone corner is not a UI surface.",
    "THE LIGHT. The hero is cinema and unlit by the standing ruling, and this concept has two emissive things: the phone's screen, which lights itself and its own bezel and nothing else, and one white capture bloom behind the plate, spent in 400 ms and repeated once per turn of the album. Both brighten, neither darkens: there is no scrim anywhere on this concept and every photograph is at 100 percent.",
    "Bible 13, decorative layers only: the corridor's pre-release state, the phone's off-frame start and the brackets' thrown-wide state live inside the reduced-motion block, so nothing paints settled and then snaps back. Every word, the code, the caption and the count are plain markup and never gated, and reduced motion gets the whole composition deployed, held and locked.",
  ],
  assets: [
    "A hand-and-phone cutout, ASSETS row 8, now a STANDING ask rather than a conditional one, because the phone is ruled in and the drawn device is the stand-in. PNG with alpha, 1200 px on the long edge, the SCREEN AREA fully transparent so the viewfinder composes underneath and stays live and real; shot from just behind the holder's shoulder, the phone held up and angled away to the right, in low warm event light so the body is nearly a silhouette with one highlight along the edge; two variants, a one-handed grip and a two-handed one. The device is built in three flat layers for exactly this swap, so the cutout replaces the body and the rim and nothing else moves.",
    "Not a new ask: the corridor runs on the 12 landscape stand-ins and wants the 24 squares already requested (ASSETS row 2, asked by hero-source), 512 x 512, one grade, framed tight enough to read at 120 px. Nothing here needs row 3's phone-up photographs, because the near field is a cutout rather than a whole photograph.",
  ],
  render: (p) => <Scan {...p} />,
};
