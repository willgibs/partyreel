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
 * THE SCAN (concept 2 of the home-hero board; round three variation 2, on the
 * axis THE CAUSE MADE LITERAL; round three of the variation, 2026-09-14).
 *
 * WHAT ROUND THREE CHANGED, and why. Round three's brief was the last mile:
 * walk the board cold, the way Will will, and fix every place a stranger
 * stumbles. Walking it found five.
 *
 * A. THE SWITCH BROKE THE HERO. Clicking it scrolled the whole composition
 *    600 px sideways with the headline cut off, because `overflow: hidden` is
 *    still a SCROLL container and the corridor makes this one 3780 px wide;
 *    focusing a button inside it made the browser "reveal" it. `overflow-clip`
 *    clips the same pixels and creates no scroll container at all. The other
 *    three concepts on the board carry the same `overflow-hidden` root and the
 *    river carries a chip of its own, so this is filed for them too.
 * B. THE BOARD OPENED ON THE READING THIS CONCEPT ARGUES AGAINST. The default
 *    is now the room, which is the recommendation; the phone is the second
 *    look. The switch also stopped speaking in the sheet's words ("Brackets
 *    only") and now names what is doing the scanning: the room, or a phone.
 * C. THE PAIR UNDER THE CODE WAS WEIGHTED BACKWARDS. The caption names the
 *    act, which is this variation's entire axis, and it was the faintest type
 *    in the frame; the count, the only fabricated thing on the concept and the
 *    line most likely to be cut at wiring, was the loud one. They are swapped,
 *    so the permanent true line leads and the composition survives the count
 *    going.
 * D. THE CAUSE WAS SPOKEN ONCE AND THEN NEVER AGAIN. The capture now repeats
 *    on the album's own cycle (10800 ms, one full turn of the corridor), so
 *    the sentence "a scan releases the album" is restated rather than
 *    asserted: it reads as the next guest scanning. The brackets still lock
 *    once and stay, because a camera acquires a code once.
 * E. THE PROPOSED HEADLINE READ LIKE ITS NEIGHBOUR'S. "One code. Every photo."
 *    sat one word away from the burst's "One code. Every angle.", and three of
 *    the four concepts on the board opened with "One code". This one is the
 *    variation that puts the ACT in the frame and draws the code at scanning
 *    size, so its line no longer has to say "code" at all: "Every camera in
 *    the room, one album." (the voice guide's two-beat hero shape, in
 *    `docs/specs/brand-voice.md`). Measured, and the reason the line is not
 *    shorter still: a headline that fits on ONE line at the xl step is about
 *    1060 px of ink sitting 112 px above the corridor's axis, where the
 *    album's large frames reach it. The keep-out test found three
 *    intersections with the h1's own ink there and none at all once the line
 *    wraps to two, so this composition wants a headline of two lines at 1440.
 *    That is true of any hero inheriting the source's band, its own short
 *    proposal included.
 *
 * Measured and kept as it was: the corridor's physics, the clear lane, the
 * 375 compositions, the beat's order, and the centred lockup.
 *
 * The argument. The source is right and Will ruled it: the code holds the
 * centre and the album branches out of it, so a stranger thinks "if I scan
 * this, I get all of these". But that stranger still has to INFER the scan,
 * because the only actor in the frame is a QR. This variation puts the act
 * itself in the picture, and the hero becomes one sentence in time: a camera
 * finds the code, the code releases the album, the album never stops.
 *
 * WHAT ROUND TWO CHANGED, and why.
 *
 * 1. THE CAUSE IS NOW A RULING, not a guess. Will named the phone as the first
 *    thing he might overrule, and the cutout that would make a drawn device
 *    real (ASSETS row 8) has not been shot. So the concept carries BOTH
 *    readings and a switch in the corner of the stage flips between them:
 *      - PHONE: a guest's phone in the near field, cropped by the frame's own
 *        edges, its camera open on the code across the room;
 *      - BRACKETS ONLY: no device at all. The scanner's four corner brackets
 *        close on the REAL plate in the room and the capture blooms there.
 *        The room is the viewfinder, there is nothing to mistake for an app,
 *        and it needs no asset that does not exist.
 *    Everything else about the concept is identical between them, so the
 *    ruling is one word and nothing else moves with it.
 *
 * 2. THE VIEWFINDER TELLS THE TRUTH. Round one put an 84 px code on the
 *    phone's screen, which made two white squares of nearly equal weight and
 *    sent the eye ping-ponging between them. A code across a room is SMALL in
 *    your viewfinder. It is now 46 px inside a 260 px device with the brackets
 *    tight around it, so the screen reads as a camera looking at something far
 *    away and the room's plate is unambiguously the object. The device itself
 *    is bigger and cropped by two edges (the left and the bottom) rather than
 *    floating whole, because a held phone is a near-field object that runs out
 *    of the frame, not a mockup on a slide.
 *
 * 3. THE PHONE CANVAS IS A COMPOSITION, not a compression. At 375 the device
 *    reading reorders the hero: the words take the top of the screen, the
 *    corridor and the code sit under them, and the bottom third belongs to the
 *    phone, rising into frame almost centred and aiming straight up at the
 *    plate. The two codes then sit on ONE vertical axis about 160 px apart,
 *    which is the fastest read of "the same object at two scales" the concept
 *    has. The brackets reading has no near field to make room for, so it keeps
 *    the classic vertical rhythm. Each canvas gets the composition it wants.
 *
 * 4. THE SUPPORTING PAIR READS AS THE ALBUM FILLING. The act is named in a
 *    caption and the album is counted under it; the count now carries the
 *    weight (the consequence is the payoff, the label is only a label) and it
 *    LIFTS by two pixels on every launch, so the number moving is visibly the
 *    same event as a pair of frames leaving the code. It starts at its opening
 *    value in the server's own HTML, so nothing rewinds on the first beat.
 *
 * 5. THE BEAT IS IN THE RIGHT ORDER. Round one fired the flash 60 ms BEFORE
 *    the brackets landed. The sequence is now strictly causal: the brackets
 *    sweep and snap at 720 ms, the capture fires at 730, and the corridor's own
 *    clock starts at 780, on the flash's peak. Before that the room is
 *    genuinely empty: every frame is inside the code at scale 0.
 *
 * 6. POINT AT THE CODE AND THE CAMERA RE-ACQUIRES IT. Hovering or focusing the
 *    plate replays the lock, and only the lock: the album keeps running. In
 *    the phone reading that is the one interaction that proves the screen and
 *    the plate are the same object, because they answer each other.
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

/** THE CAUSE, in time. The album's clock starts on the capture, not at mount,
 *  so the album is released BY the scan rather than beside it. Kept in step
 *  with scan.css: the brackets sweep over 720 ms and the flash fires at 730,
 *  so the release lands on the flash's peak. Change the three together. */
const RELEASE_MS = 780;

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

/** Which reading of the cause is on the stage. The board's shell is shared and
 *  registered, so a concept with a ruling to offer carries the switch itself;
 *  it is lab chrome, not composition, and it leaves with the board. */
type Cause = "phone" | "brackets";

/** The chosen reading, held OUTSIDE the component on purpose. The board keys
 *  the stage on the canvas, the copy and the run, so Replay and every canvas
 *  change remount this concept from scratch: component state would silently
 *  drop the reading and put the room back, and a reviewer who flipped to the
 *  phone and then looked at 375 would be shown the composition he did not ask
 *  for. Module scope survives the remount and is safe here because the board
 *  renders one canvas at a time. It leaves with the switch. The initial value
 *  is the reading this concept recommends. (The river reached the same answer
 *  for its own chip; a `controls` slot on Concept would retire both.) */
let causeChoice: Cause = "brackets";

/** The phone in the near field: its box, its angle, and the viewfinder inside
 *  it. x and y are the CENTRE of the device, offset from the canvas centre, so
 *  the crop against a frame edge is a number rather than a guess. */
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
  /** Canvas-relative, never a vw value: the stage is zoomed. */
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
      // Bigger and cropped by TWO edges since round one (the left and the
      // bottom), because a phone in your own hands is a near-field object that
      // runs out of the frame, not a device floating whole on a slide.
      w: 260,
      x: -614,
      y: 318,
      rz: 12,
      ry: -14,
      qr: 46,
      qrY: 0.3,
    },
    viewLock: { arm: 13, pad: 5, stroke: 1.6, throw: 15 },
    roomLock: { arm: 34, pad: 14, stroke: 2.5, throw: 34 },
    bloom: 2.3,
    layout: {
      // The centred lockup leaves both lower quadrants empty on a 1440 canvas,
      // so the device needs no layout of its own: it lives in the one the
      // corridor already vacated.
      phone: {
        axis: 0,
        lane: { at: 118, anchor: "top", max: 300 },
        stacked: false,
        topInset: 0,
      },
      brackets: {
        axis: 0,
        lane: { at: 118, anchor: "top", max: 300 },
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
      // THE PHONE CANVAS'S OWN COMPOSITION. Round one hid a 112 px device in
      // the bottom-left corner, where it read as a toy and sat BELOW the
      // actions. Here the device owns the bottom third, rises into frame
      // almost centred and aims straight up: the screen's code and the room's
      // code end up on one vertical axis about 160 px apart, which is the
      // fastest possible read of "the same object at two scales".
      w: 232,
      x: 6,
      y: 456,
      rz: 7,
      ry: -8,
      qr: 40,
      qrY: 0.14,
    },
    viewLock: { arm: 11, pad: 4, stroke: 1.4, throw: 13 },
    roomLock: { arm: 24, pad: 10, stroke: 2, throw: 24 },
    bloom: 2.3,
    layout: {
      phone: {
        // The words move to the top of the screen so the bottom third can be
        // the near field, and the supporting pair moves ABOVE the plate, which
        // is the only clear lane left once the device is in the frame.
        axis: 118,
        lane: { at: -92, anchor: "bottom", max: 220 },
        stacked: true,
        topInset: 34,
      },
      brackets: {
        // No near field to make room for, so the classic vertical rhythm:
        // headline, the band with the code, the pair, the sentence, the
        // actions. Round three retuned three numbers here, because walking
        // the 375 canvas found the pair crushed: at a 200 measure the caption
        // wrapped and left "code" alone on a second line, and the pair then
        // reached far enough down that its box touched the subhead's, so the
        // two lines read as attached to the sentence rather than to the code
        // they describe. The measure is now 220 (the caption's ink is 207 at
        // 13 px, so one line with slack for a metric shift), the lane sits at
        // 96 and the sentence at 168: 34 px under the brackets, 28 px clear
        // of the sentence, and 11 px of measured clearance from the nearest
        // frame the corridor throws.
        axis: -6,
        lane: { at: 96, anchor: "top", max: 220 },
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
 *  component for both readings: on the phone's screen they are 13 px arms
 *  around a 46 px code, in the room they are 34 px arms around the real plate.
 *  data-hh-loop is board.css's pause hook; these are one-shots that want it
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

/** A guest's phone in the near field, camera open on the code across the room,
 *  cropped by the frame's own edges the way your own hands are cropped by your
 *  own field of view. Decorative in full: what it is looking at is the real
 *  plate, a few hundred pixels away. */
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
        } as CSSProperties
      }
    >
      <div className="hhc-phone w-full" style={{ aspectRatio: "0.472" }}>
        <div
          className="hhc-screen"
          style={{ "--hhc-vy": `${d.qrY * 100}%` } as CSSProperties}
        >
          <div className="hhc-viewpos" style={{ top: `${d.qrY * 100}%` }}>
            <Viewfinder url={url} d={d} lock={lock} />
          </div>
          <div className="hhc-pill" />
          <div data-hh-loop className="hhc-flash" />
        </div>
      </div>
    </div>
  );
}

/** The lab's own switch, in the corner of the canvas. The board's shell is
 *  shared and registered, so the concept that has a ruling to offer carries
 *  the control; it is deliberately chrome rather than composition, and it
 *  leaves with the board when the ruling lands. */
function CauseSwitch({
  value,
  onChange,
  small,
}: {
  value: Cause;
  onChange: (c: Cause) => void;
  small: boolean;
}) {
  // The recommended reading first, and named for what is doing the scanning
  // rather than for the mechanism that draws it ("Brackets only" was the
  // sheet's word, not a reader's).
  const options: [Cause, string][] = [
    ["brackets", "The room"],
    ["phone", "A phone"],
  ];
  return (
    <div
      className={`hhc-lab ${small ? "hhc-lab-sm" : ""}`}
      role="group"
      aria-label="The cause, on the stage"
    >
      <span className="hhc-lab-label">Cause</span>
      {options.map(([id, label]) => (
        <button
          key={id}
          type="button"
          aria-pressed={value === id}
          onClick={() => onChange(id)}
          className="hhc-lab-btn"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Scan({ mode, copy, qrUrl }: ConceptProps) {
  const geo = GEO[mode];
  // Round three: the DEFAULT is the reading this concept recommends, so the
  // board opens on the candidate it argues for and the switch is the second
  // look rather than the first (it opened on the phone through round two,
  // against the concept's own recommendation).
  const [cause, setCauseState] = useState<Cause>(causeChoice);
  const setCause = useCallback((c: Cause) => {
    causeChoice = c;
    setCauseState(c);
  }, []);
  const layout = geo.layout[cause];
  const axis = layout.axis;
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
      // room is genuinely empty while the brackets are closing on the code.
      const elapsed = since > RELEASE_MS ? since - RELEASE_MS : 0;

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
    // `cause` is a dependency on purpose: switching the reading replays the
    // whole beat, so the two are compared from the same first frame.
  }, [geo, reduced, cause]);

  const lane = (
    <div
      className={`absolute inset-x-0 z-10 text-center ${GUTTER[mode].x}`}
      style={
        layout.lane.anchor === "top"
          ? { top: `calc(50% + ${axis + layout.lane.at}px)` }
          : { bottom: `calc(50% - ${axis + layout.lane.at}px)` }
      }
    >
      {/* THE ACT, and it is the loud line of the pair. Round two had this the
          other way round, the label quiet and the count heavy, and walking the
          board cold showed the cost: the one sentence that carries this
          variation's whole axis was the faintest type in the frame, and the
          line shouting under it was the only fabricated thing on the concept.
          Now the permanent, true line leads and the stand-in supports it, so
          the composition survives the count being cut at wiring. */}
      <Caption
        className={`mx-auto text-white/85 ${geo.captionClass}`}
        style={{ maxWidth: layout.lane.max }}
      >
        Every guest scans the same code
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
         throws every frame 1.65 canvases each way). Clicking the switch gave
         its button focus, Chrome scrolled the container to "reveal" it under
         the stage's zoom, and the whole composition jumped 600 px sideways with
         the headline cut off. `overflow: clip` clips the same pixels and
         creates no scroll container at all, so nothing in the hero can ever be
         scrolled by a focus, a click or an anchor. Every concept on this board
         carries the hidden version; only the two with a control in the canvas
         can be made to show it. */
      className="relative size-full overflow-clip bg-background"
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

      {/* THE CAUSE, reading one: a guest's phone in the near field, its camera
          open on the code across the room. The screen carries no chrome but
          the notch, because the product needs no app. */}
      {cause === "phone" && (
        <HeldPhone url={qrUrl} d={geo.device} lock={geo.viewLock} />
      )}

      {/* THE OBJECT, at the exact centre of the corridor, above the frames so
          they are born behind it. Nothing about it moves: the stillness is the
          point, and a QR that breathes is a QR nobody can scan. Real, live and
          tappable; its own accessible name covers it. Pointing at it replays
          the lock, which is the one interaction that proves the screen and the
          plate are the same object. */}
      <div
        className="absolute left-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
        style={{ top: `calc(50% + ${axis}px)` }}
        onPointerEnter={relock}
        onFocus={relock}
      >
        {cause === "brackets" ? (
          // THE CAUSE, reading two: no device at all. The brackets close on the
          // real plate and the capture blooms there, so the ROOM is the
          // viewfinder. Nothing in the frame can be mistaken for an app, and
          // nothing here waits on an asset that does not exist yet.
          <div className="hhc-roomlock" style={lockVars(geo.roomLock)}>
            <span
              aria-hidden
              data-hh-loop
              className="hhc-bloom"
              style={
                { "--hhc-bloom": `${geo.qr * geo.bloom}px` } as CSSProperties
              }
            />
            <DemoQr url={qrUrl} size={geo.qr} />
            <Brackets />
          </div>
        ) : (
          <DemoQr url={qrUrl} size={geo.qr} />
        )}
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

      <CauseSwitch value={cause} onChange={setCause} small={mode === "phone"} />
    </div>
  );
}

export const scan: Concept = {
  id: "scan",
  n: 2,
  name: "The scan",
  rationale:
    "The source's corridor with the cause put in the frame: a scanner's brackets close on the real code, the capture fires, and only then does the album branch out of the plate. The capture then repeats once per turn of the album, so the cause is restated rather than asserted once and the hero reads as the next guest scanning. The stage opens on the reading this concept recommends, the room itself as the viewfinder with no device anywhere in the frame; the switch at the top right is lab chrome and flips to the other one, a guest's phone in the near field with its camera on the same code, and it changes nothing else. The ruling is one word: the room, or a phone.",
  eyebrow:
    "Settled: no eyebrow line. The code is the eyebrow and the caption under it names the act; a word above the headline would be a fifth block of type in a composition that already carries a headline, a caption, a count, a sentence and two actions.",
  proposed: {
    h1: "Every camera in the room, one album.",
    subhead:
      "Guests point a camera at the code, and their photos and videos land in your album, with no app and no account.",
    secondary: "See the album it made",
  },
  departures: [
    "THE ROOM, OR A PHONE. Will named a phone in the hero as the first thing he may overrule, because a phone can read as an app. The recommendation is the room, until the cutout on ASSETS row 8 is shot. Either reading also puts light in a hero that is cinema and unlit by the standing ruling, and it is the only light in the frame: in the phone reading the screen, lighting itself and its own bezel and nothing else; in the room reading one white capture bloom behind the plate, spent in 400 ms and repeated once per turn of the album. Both brighten, neither darkens: there is no scrim anywhere on this concept and every photograph is at 100 percent.",
    "KEEP THE COUNT, OR CUT IT. 282 photos from 48 guests, climbing to 312, is a STAND-IN and must not ship as invented data: the wiring round reads the demo event's real total, or the line goes. Round three made it the quiet half of the pair, so the composition holds either way.",
    "THE CENTRED LOCKUP, inherited from the source: precedent and not law, because the code owns the axis. Overrule it and this hero goes left with the source.",
    "Bible 13, decorative layers only: the corridor's pre-release state and the brackets' thrown-wide state live inside the reduced-motion block, so nothing paints settled and then snaps back. Every word, the code, the caption and the count are plain markup and never gated, and reduced motion gets the whole composition deployed and locked.",
  ],
  assets: [
    "ONLY IF A PHONE IS RULED IN: a hand-and-phone cutout to replace the drawn device, already on the log as ASSETS row 8. PNG with alpha, 1200 px on the long edge, the SCREEN AREA fully transparent so the viewfinder composes underneath and stays live; shot from behind the holder's shoulder, the phone held up and angled away to the right, in low warm event light so the body is nearly a silhouette with one highlight along the edge; two grips, one-handed and two-handed. Rule the room and the row can be withdrawn.",
    "Not a new ask: the corridor runs on the 12 landscape stand-ins and wants the 24 squares already requested (ASSETS row 2, asked by hero-source), 512 x 512, one grade, framed tight enough to read at 120 px. Nothing here needs row 3's phone-up photographs, because the device is drawn rather than photographed.",
  ],
  render: (p) => <Scan {...p} />,
};
