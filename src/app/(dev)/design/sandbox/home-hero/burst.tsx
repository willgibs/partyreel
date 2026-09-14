"use client";

// the concept's own sheet; it leaves with the board when the ruling lands.
// It declares NO keyframes, deliberately: the field is one requestAnimationFrame
// loop writing inline transforms, so there is nothing to collide with production
// (src/app/keyframe-uniqueness.test.ts).
import "./burst.css";

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
  GUTTER,
  LADDER,
  type Mode,
  Photo,
  copyFor,
} from "./shared";

/**
 * THE BURST (concept 3 of the home-hero board, round three).
 *
 * The axis: THE ORIGIN IN EVERY DIRECTION. The source proved the causality
 * with two perspective rows running left and right. The burst keeps the exact
 * same sentence and takes it onto the two axes the corridor could not use: all
 * the way around the compass, and forward, out of the screen. Frames are born
 * inside the code and fly outward AND toward the viewer, so a near frame grows
 * until it wipes past the edge of the canvas while a far one stays small and
 * slides out quietly. Nothing on screen has any other origin, which is the
 * whole argument: whatever you are looking at came out of that code.
 *
 * WHY A BURST RATHER THAN A WIDER CORRIDOR. A corridor has an orientation, so
 * it has to be recomposed for a phone (round two compressed it to a strip). A
 * radial does not: the same composition holds at 1440 and at 375, because the
 * direction field is stretched by the canvas itself (ax and ay below), so a
 * wide canvas throws frames sideways and a tall one throws them up and down.
 * One composition, two shapes, no second design.
 *
 * THE QUIET ZONE, and why there is no scrim. The type lives in a keep-out
 * around the code that no frame ever enters: headline above, the code, the
 * caption, the sentence and the actions below. The keep-out is not one
 * rectangle around the whole lockup but one box per BLOCK of it (KEEP, measured
 * off the rendered stage), which is what lets a frame fly out at the code's own
 * height, 140 px from the plate, instead of waiting for the headline's width:
 * the burst has to visibly start AT the object, and a single rectangle put a
 * 700 px void around it. Each card is then given, once, the progress after
 * which its own box is permanently clear of every block (scanClear), and it is
 * drawn from there. So "no photograph is ever under a word" is not a hope about
 * the layout; it is the condition the field is drawn from, in every direction
 * and at every moment of the loop. Media stays at 100%: no darkening layer, no
 * scrim, no lamp (bible 1 and the standing unlit ruling).
 *
 * THE MECHANISM. 26 cards on the desktop canvas, 28 on the phone, each with a
 * fixed direction, a fixed depth gain and a launch slot. A card's progress is a
 * closed form of the clock, `((slot * launch + elapsed) mod cycle) / flight`,
 * so recycling falls out of a modulo and there is no per-card bookkeeping, no
 * state and no timers (the source's lesson, kept). ONE rAF loop writes
 * transform, opacity and z-index to the nodes.
 *
 * The projection is done by hand rather than with a CSS `perspective` parent,
 * for three reasons: the screen position, the apparent size and the paint
 * order all have to be readable as NUMBERS (the keep-out test needs the box's
 * real screen size, and the near-over-far paint order needs an integer), the
 * raster stays bounded because the card's DOM box is sized for its largest
 * visible moment, and the transform string stays a pure function of the clock,
 * which is what lets the loop be frozen at a chosen elapsed for a still (see
 * docs/systems/testing-verification.md: a driven tab suspends rAF).
 *
 * Position and size ride SEPARATE curves, which is what makes a frame leave
 * small and slow and arrive large and quick: travel is the square root of
 * progress in world units, size holds near nothing for the first fifth, and
 * the perspective term `persp / (persp - z)` multiplies BOTH, so the
 * acceleration everyone reads as speed is the depth rather than an easing
 * curve pretending to be depth.
 *
 * THE FIRST BEAT. The seeded launch offsets are multiplied by one reveal tween
 * (0 to 1 over 2 s on the house strong in-out curve), exactly as the source's
 * branch-out. At elapsed 0 every card shares the same progress, so the album is
 * inside the code; as the tween opens, the cards fan apart into their steady
 * spacing. Measured on the stage: nothing at 200 ms, three frames beside the
 * code at 400, and seventeen at a thousand, which is the crest of the wave,
 * settling to a steady ten to fourteen. One eruption, then the rain, with no
 * handoff between the entrance and the loop, because they are one expression.
 */

/* ── The field's constants ── */

/** The golden angle, so any PREFIX of the card list is evenly spread around the
 *  compass: the phone renders fewer cards and still covers every direction. */
const GOLDEN = 2.399963229728653;

/** One card's full life, in ms. Shared by both canvases. */
const FLIGHT_MS = 8400;
/** The branch-out, on ease-in-out-quart (see revealEase). */
const REVEAL_MS = 2000;

/** One block of the lockup, in canvas coordinates from the code (y points down),
 *  plus the margin frames keep from it. Measured off the rendered stage rather
 *  than guessed: the numbers in KEEP are the union of the two copy modes' real
 *  boxes, so the quiet zone is the shape of the type and not a guess about it. */
type KeepPart = { x: number; y: number; hw: number; hh: number; r: number };

const KEEP: Record<Mode, KeepPart[]> = {
  desktop: [
    { x: 0, y: -171, hw: 265, hh: 85, r: 34 }, // the headline, two lines
    { x: 0, y: 0, hw: 70, hh: 70, r: 34 }, // the code
    { x: 0, y: 92, hw: 158, hh: 12, r: 28 }, // the caption
    { x: 0, y: 152, hw: 226, hh: 38, r: 30 }, // the sentence, two or three lines
    { x: 0, y: 223, hw: 166, hh: 39, r: 30 }, // the actions, one row
  ],
  phone: [
    { x: 0, y: -103, hw: 134, hh: 44, r: 22 },
    { x: 0, y: 0, hw: 50, hh: 50, r: 24 },
    { x: 0, y: 68, hw: 106, hh: 11, r: 18 },
    { x: 0, y: 124, hw: 162, hh: 36, r: 20 },
    { x: 0, y: 194, hw: 146, hh: 25, r: 20 },
  ],
};

type Geo = {
  /** How many cards the canvas throws. cards * launch is the round trip, so a
   *  few are always on the ground: that slack is what the round-robin needs. */
  cards: number;
  /** ms between launches. flight / launch is how many are in the air at once. */
  launch: number;
  /** The card's DOM box width in px; the height is the box times its aspect.
   *  Sized for the LARGEST VISIBLE moment so nothing rasterizes far above 1:1. */
  card: number;
  /** The travel ellipse's semi-axes at progress 1 before the perspective term:
   *  canvas-shaped, which is what makes the same field read at 1440 and 375. */
  ax: number;
  ay: number;
  /** The projection distance, in the same units as z. */
  persp: number;
  /** Depth at birth (behind the plate, so a frame starts receded) and the range
   *  of per-card depth gains: a low-gain card slides out flat, a high-gain one
   *  rushes the camera and is huge as it goes. */
  z0: number;
  zMin: number;
  zMax: number;
  /** Normalizes the size curve so the largest apparent scale lands near 1.15. */
  scaleNorm: number;
  /** The type's keep-out: one box per block of the lockup, measured off the
   *  rendered stage (the taller of the two copy modes), each with the margin
   *  the frames have to keep from it. A union rather than one rectangle around
   *  the whole lockup, which is what lets a frame fly out at the code's own
   *  height, 140 px from the plate, instead of waiting for the headline's
   *  width. See KEEP below. */
  keep: KeepPart[];
  /** How much of a flight a frame fades up over, in progress units. */
  fade: number;
  /** The QR's edge in px, quiet zone included. 96 scans from a laptop screen. */
  qr: number;
  /** The gap from the code's edge to the headline, and to the caption. */
  gapTop: number;
  gapBottom: number;
  h1Max: number;
  subMax: number;
  /** The per-card 3D tilt in degrees: the field reads as one expanding shell
   *  rather than a wall of billboards. */
  tilt: number;
  /** Canvas-relative, never a vw value: the stage is zoomed. */
  sizes: string;
};

const GEO: Record<Mode, Geo> = {
  desktop: {
    cards: 26,
    launch: 380,
    card: 365,
    ax: 660,
    ay: 455,
    persp: 1200,
    z0: -160,
    zMin: 300,
    zMax: 640,
    scaleNorm: 0.65,
    keep: KEEP.desktop,
    fade: 0.05,
    qr: 140,
    gapTop: 26,
    gapBottom: 14,
    h1Max: 640,
    subMax: 470,
    tilt: 15,
    sizes: "440px",
  },
  phone: {
    cards: 28,
    launch: 300,
    card: 225,
    ax: 270,
    ay: 470,
    persp: 560,
    z0: -70,
    zMin: 150,
    zMax: 300,
    scaleNorm: 0.87,
    keep: KEEP.phone,
    fade: 0.05,
    qr: 100,
    gapTop: 16,
    gapBottom: 10,
    h1Max: 330,
    subMax: 330,
    tilt: 13,
    sizes: "280px",
  },
};

/* ── The shader primitives the field is written in ── */

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

const mod = (a: number, n: number) => ((a % n) + n) % n;

/** World travel: front-loaded, because the keep-out is wide and a frame has to
 *  reach its edge early enough to be SEEN. The acceleration everyone reads as
 *  speed comes from the perspective term, not from here. */
const travelAt = (p: number) => Math.sqrt(p);

/** A fast ramp to an eighth over the first 15%, then the rest from 20% on: the
 *  frame is a speck while it is still inside the code, then it opens. Lagging
 *  the size behind the position is also what keeps the keep-out test monotonic,
 *  so a frame fades up once and never flickers back. */
const sizeAt = (p: number) =>
  0.125 * smoothstep(0, 0.15, p) + 0.875 * smoothstep(0.2, 1, p);

/** ease-in-out-quart, which IS --ease-in-out-strong's cubic-bezier
 *  (0.77, 0, 0.175, 1). Written out rather than solved so the reveal needs no
 *  bezier solver and stays engine-deterministic. */
function revealEase(t: number) {
  const u = clamp01(t);
  if (u < 0.5) return 8 * u * u * u * u;
  const v = 1 - u;
  return 1 - 8 * v * v * v * v;
}

/** A deterministic 0..1 per card. Integer ops only, on purpose: Math.sin is not
 *  bit-identical across JS engines, and the server and the browser have to
 *  produce the SAME rest-state transform or hydration warns. (The angles below
 *  do call Math.cos/sin, which carries the same theoretical risk, so every
 *  number that reaches a transform string is rounded to two decimals: an
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
function scanClear(c: Omit<Card, "pClear">, geo: Geo) {
  for (let n = SCAN; n >= 1; n--) {
    const p = n / SCAN;
    const z = geo.z0 + (c.zGain - geo.z0) * p;
    const proj = geo.persp / (geo.persp - z);
    const s = sizeAt(p) * proj * c.sJit * geo.scaleNorm;
    const reach = c.mag * travelAt(p) * proj;
    const clear = clearAlong(
      geo.keep,
      c.ux,
      c.uy,
      c.aw0 * s * geo.card,
      c.ah0 * s * geo.card,
    );
    if (reach < clear) return Math.min(p + 1 / SCAN, 1);
  }
  return 0;
}

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
  zGain: number;
  sJit: number;
  rz: number;
  ry: number;
  rx: number;
};

/**
 * The pool. Directions walk the golden angle so consecutive LAUNCHES land on
 * opposite sides of the code (the field never reads as a sweeping fan), and the
 * direction is stretched by the canvas so one description composes a wide
 * screen and a tall one. Depth gain and travel length are anti-correlated: a
 * card that rushes the camera does not also need to cross the canvas, so every
 * card leaves the frame at about the same moment however deep it flew.
 */
function buildCards(geo: Geo): Card[] {
  return Array.from({ length: geo.cards }, (_, i) => {
    const j = hash01(i);
    const jj = hash01(i + 101);
    const jjj = hash01(i + 211);
    const jjjj = hash01(i + 307);

    const theta = i * GOLDEN + (j * 2 - 1) * 0.11;
    const zNorm = jj;
    const zGain = geo.zMin + zNorm * (geo.zMax - geo.zMin);
    const reach = (1.25 - 0.4 * zNorm) * (0.94 + jjj * 0.12);

    const vx = geo.ax * Math.cos(theta) * reach;
    const vy = geo.ay * Math.sin(theta) * reach;
    const mag = Math.hypot(vx, vy);

    // A third of the field is 4:5, because a third of what guests shoot is.
    const aspect = i % 3 === 2 ? 1.25 : 1;
    const rz = (jjjj * 2 - 1) * 5;
    const a = (rz * Math.PI) / 180;
    const ca = Math.abs(Math.cos(a));
    const sa = Math.abs(Math.sin(a));
    const card = {
      key: `hhb-${i}`,
      slot: i,
      photo: i,
      vx,
      vy,
      mag,
      ux: vx / mag,
      uy: vy / mag,
      aw0: 0.5 * (ca + aspect * sa),
      ah0: 0.5 * (sa + aspect * ca),
      aspect,
      zGain,
      sJit: 0.88 + jjj * 0.24,
      rz,
      // The tilt is oriented by the flight: every card's inner edge recedes, so
      // the field reads as the surface of one expanding shell rather than a
      // scatter of billboards. Mild on purpose: a photograph is the subject.
      ry: (-vx / mag) * geo.tilt * (0.7 + jj * 0.6),
      rx: (vy / mag) * geo.tilt * (0.7 + j * 0.6),
    };
    return { ...card, pClear: scanClear(card, geo) };
  });
}

/** Built once per canvas: the pools are mode-dependent (a phone throws fewer
 *  frames, and throws them up and down rather than sideways) and never change. */
const POOLS: Record<Mode, Card[]> = {
  desktop: buildCards(GEO.desktop),
  phone: buildCards(GEO.phone),
};

type Frame = { transform: string; opacity: string; z: string };

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
  const z = geo.z0 + (c.zGain - geo.z0) * p;
  const proj = geo.persp / (geo.persp - z);

  const t = travelAt(p) * proj;
  const x = c.vx * t;
  const y = c.vy * t;
  const s = sizeAt(p) * proj * c.sJit * geo.scaleNorm;

  // THE QUIET ZONE: the card is drawn only from the progress at which it is
  // permanently clear of every word (scanClear), so no photograph is ever under
  // one, in any direction, at any moment of the loop.
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

  return {
    transform: `translate3d(${r2(x)}px, ${r2(y)}px, 0) rotate(${r2(c.rz)}deg) perspective(760px) rotateY(${r2(c.ry)}deg) rotateX(${r2(c.rx)}deg) scale(${r2(s)})`,
    opacity: String(r2(o)),
    // Near frames paint over far ones, which is the whole reason the depth axis
    // reads at all. Quantized so the stacking order is re-sorted rarely.
    z: String(Math.round(proj * 40)),
  };
}

function Burst({ mode, copy, qrUrl }: ConceptProps) {
  const geo = GEO[mode];
  const cards = POOLS[mode];
  const text = copyFor(burst, copy);
  const reduced = usePrefersReducedMotion();

  const halfW = CANVAS[mode].w / 2;
  const halfH = CANVAS[mode].h / 2;
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

      // The shockwave: one tween of the seeded launch offsets from nothing to
      // their steady spacing. At elapsed 0 every card shares a progress, so the
      // album leaves the code in one beat; the clock term runs the whole time,
      // so there is no handoff between the entrance and the loop.
      const reveal = revealEase(elapsed / REVEAL_MS);
      for (let i = 0; i < cards.length; i++) {
        const el = nodes.current[i];
        if (!el) continue;
        const c = cards[i];
        const p =
          mod(c.slot * geo.launch * reveal + elapsed, cycle) / FLIGHT_MS;
        if (p > 1) {
          // On the ground between flights, and far off screen besides.
          el.style.opacity = "0";
          continue;
        }
        const f = frameAt(c, p, geo, halfW, halfH);
        el.style.transform = f.transform;
        el.style.opacity = f.opacity;
        el.style.zIndex = f.z;
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cards, cycle, geo, halfH, halfW, reduced]);

  const phone = mode === "phone";
  // The caption IS the eyebrow, so it says the one thing a label would: the
  // object is real. Shorter on the phone, where a reader is already holding the
  // thing they would scan with, and where every px of its width is a px the
  // burst cannot use (it sits in KEEP.phone).
  const caption = qrUrl
    ? phone
      ? "This code is live. Tap to open it."
      : "This code is live. Scan it, or tap to open the album."
    : "One code per event, scanned all night.";

  return (
    <div
      ref={rootRef}
      className="relative size-full overflow-hidden bg-background"
    >
      {/* THE FIELD. Full bleed and decorative: the album is the argument, but
          the type in the quiet zone is what carries the sentence. */}
      <div aria-hidden className="hhb-field">
        {cards.map((c, i) => {
          // The REST state, written as custom properties the sheet reads: the
          // field standing at its steady-state spacing, which is what reduced
          // motion, a crawler and the server's own HTML all get.
          const at = Math.min((c.slot * geo.launch) / FLIGHT_MS, 1);
          const rest = frameAt(c, at, geo, halfW, halfH);
          const w = geo.card;
          const h = geo.card * c.aspect;
          return (
            <div
              key={c.key}
              ref={(el) => {
                nodes.current[i] = el;
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
          every frame is launched from, and above the field so they are born
          behind it. Nothing about it moves: the stillness is the point, and a
          QR that breathes is a QR nobody can scan. Real, live and tappable;
          its own accessible name covers it. */}
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
          className={`mx-auto font-heading leading-[1.03] text-balance text-white ${LADDER.lg[mode]}`}
          style={{ maxWidth: geo.h1Max }}
        >
          {text.h1}
        </h1>
      </div>

      {/* THE CAPTION, THE SENTENCE AND THE ACTIONS, below the code and inside
          the same quiet zone. No scrim anywhere on this concept and no
          darkening layer over a frame: the keep-out is what holds the type off
          the photographs, which is the argument. */}
      <div
        className={`absolute inset-x-0 z-10 text-center ${GUTTER[mode].x}`}
        style={{ top: `calc(50% + ${geo.qr / 2 + geo.gapBottom}px)` }}
      >
        <Caption className={`text-white/55 ${phone ? "" : "text-[13px]"}`}>
          {caption}
        </Caption>
        <p
          className={`mx-auto leading-relaxed text-pretty text-white/80 ${phone ? "mt-3.5 text-[14px]" : "mt-4 text-[15px]"}`}
          style={{ maxWidth: geo.subMax }}
        >
          {text.subhead}
        </p>
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
      </div>
    </div>
  );
}

export const burst: Concept = {
  id: "burst",
  n: 3,
  name: "The burst",
  rationale:
    "Every frame on screen is born inside the code. The album radiates out of it around the whole compass and forward out of the screen, so near frames grow until they wipe past the edge while far ones stay small and slide out, and the causality reads at a glance. The type holds a quiet zone around the code that no frame ever enters, so nothing is dimmed and no word sits over a photograph. A radial has no orientation, so the phone gets the same composition rather than a compressed strip.",
  eyebrow:
    "The code itself, at the centre of the burst. Its caption is the only label, so the eyebrow is the object.",
  proposed: {
    h1: "One code. Every angle.",
    subhead:
      "Guests scan it, and every photo and video they shoot lands in your album. No app, no account, nothing to hand out but the code.",
    secondary: "Open the live album",
  },
  departures: [
    "Bible 13, decorative layer only: the frames' pre-burst state sits inside the reduced-motion block, so with JavaScript off and motion allowed the field rests around the code instead of leaving it. Putting it in an effect instead would paint the album deployed and then snap it back to the code. The h1, the code, the caption, the sentence and the actions are plain markup, never gated, and reduced motion gets the field fully deployed.",
    "Bible 10, flagged because the hero is unlit by the standing ruling: the frames carry a soft drop shadow. Rule 10 allows exactly this (stacked or overlapping media cards need separating) and the burst overlaps constantly, near frame over far, so without it the depth axis collapses into a flat scatter. It is a shadow, never a lamp: no light source is added and no photograph is darkened.",
    "Precedent, not law: the lockup is centred rather than left-aligned, because the code owns the axis. The first thing to overrule if the home hero should stay left.",
    "Not a departure, but the visible difference from the source and worth a ruling: the headline sits on the ladder's lg step (text-7xl on desktop, text-4xl on the phone) rather than xl, because the quiet zone has to stay small enough for the burst to own the canvas around it. Both are cinema steps of the one site ladder (bible 5).",
    "There is no scrim, no darkening layer and no lamp anywhere in this concept. Media at 100%.",
  ],
  assets: [
    "24 event photographs as 512 x 512 squares · one grade, 6 to 35 KB webp each, across weddings, birthdays, corporate and festivals, framed tight enough to read at 90 px (a face, two hands, a glass, a sparkler, a first dance), never a wide room shot · replaces the 12 landscape stand-ins the field cycles (FRAMES in shared.tsx). Already asked for as docs/ASSETS.md row 2; the same 24 serve this concept, and with 24 no frame is ever on screen twice.",
    "8 of those same 24 also as 4:5 portrait crops · 512 x 640, the same photograph recropped, same grade · replaces the square box on the third of the field that already lays out 4:5. Guests shoot vertical, so a field of nothing but squares reads as a deck of cards rather than as an album; this is the cheapest fix and it needs no new photography.",
    "Nothing else · the QR is the real demo event's, live from NEXT_PUBLIC_DEMO_QR_TOKEN · no plate art, no lamp and no video in this concept.",
  ],
  render: (p) => <Burst {...p} />,
};
