"use client";

import "./river.css";

import Image from "next/image";
import Link from "next/link";
import qrcode from "qrcode-generator";
import { type CSSProperties, useEffect, useMemo, useRef } from "react";

import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import { Caption } from "@/components/marketing/system/caption";
import { marketingImage } from "@/lib/constants/marketing-media";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

/**
 * THE RIVER, AS A FEATURE VISUAL (round one of the river-visual track,
 * 2026-09-15). Will killed the river as a home hero and banked it: "the river
 * animation could be streamlined to drop down in one flow rather than two, and
 * saved to our lab design bank to hopefully use another time as a feature
 * visual rather than hero. This would be a cool, smaller alternative
 * presentation of the images emanating from the QR code versus the 1 or 2."
 *
 * WHAT CHANGED FROM THE HERO, and why each change is a simplification rather
 * than a trim. The hero river was a composition: two arms braided around a
 * lockup, a clearing cut to the measured silhouette of an h1, a subhead, two
 * buttons and a count, a held beat so the type could land first, and two
 * hand-tuned geometries because 1440 and 375 are different compositions. None
 * of that survives contact with a section slot, and none of it was the idea.
 * The idea is ONE OBJECT POURING AN ALBUM. So:
 *
 *  1  ONE FLOW. The parity split (dir -1 / +1, the half-cadence arm phase, the
 *     two spread lanes) is gone. Every frame takes a lane on a single golden
 *     ratio sequence across the full width, so consecutive arrivals are never
 *     adjacent and the stream widens as one delta instead of parting into two
 *     banks. Will's word for the old shape was "two"; this is the one.
 *  2  NO CLEARING. There is no lockup inside the visual, so the profile table,
 *     the wall solver, the entering and releasing ramps and the ragged offsets
 *     all go. A placement puts its words BESIDE the visual, not inside it,
 *     which is what a feature visual is for. 210 lines of the hero's geometry
 *     left with them.
 *  3  NO HELD BEAT. The hold existed so a headline could land before the pour.
 *     With no headline the reveal tween is the whole entrance, so the clock is
 *     never clamped, never wrapped negative, and the round-three bug that lived
 *     inside that clamp cannot exist here.
 *  4  ONE GEOMETRY, DERIVED FROM THE BOX. The hero carried two hand-typed GEO
 *     tables. This derives every number from the width and the height it is
 *     given (riverGeo below), so a 560 column, a 400 card and a 240 thumbnail
 *     are the same visual at three sizes rather than three tunings, and a
 *     placement at any other width is already correct.
 *  5  THE FRAMES STRAIGHTEN. The hero kept a third of the birth tumble at
 *     landing so the bottom of the stream would not read as a grid. Here the
 *     bottom of the stream is the point: a frame leaves the object at an angle
 *     and lands square, to 12 percent of its birth angle, the way a photograph
 *     settles into an album.
 *  6  THE CLOCK IS SHARED. flight and launch are constants, not functions of
 *     the box, so three sizes mounted side by side pour in step and read as one
 *     visual at three scales. That is the whole argument of the bank row.
 *
 * WHAT IS KEPT, because it was the good part. A card's progress is still a
 * closed form of the clock, ((slot) * launch * reveal + t) mod cycle / flight:
 * no state, no timers, no per-card bookkeeping, and recycling falls out of the
 * modulo. Gravity is still 0.6p^2 + 0.4p, so a frame leaves the object slowly
 * and is three times quicker at the bottom. The fan still opens over the first
 * third of the DISTANCE fallen rather than the flight, which is what puts the
 * first frames inside the object's own width so the album visibly slides out of
 * it. The cadence still divides the flight exactly, so every frame is airborne
 * and gravity does the spacing. The loop is still cut by a frame's TOP EDGE and
 * never its centre, so nothing pops: a card recycles only once no part of it
 * can be seen. The rest state is still the loop's own expression with the
 * reveal finished, written as custom properties, so reduced motion, a crawler
 * and the server's HTML all get the settled stream and it cannot drift from the
 * running one. No scrim, no darkening layer, no lamp (bible 1).
 *
 * THE COMPONENT IS SELF-CONTAINED ON PURPOSE. It reads the media manifest
 * directly (bible 18) and imports nothing from the home-hero board, so the
 * paste on the board is the whole mount: this file moves to
 * src/components/marketing/system/ on the day Will places it, and nothing about
 * it has to be untangled from a lab first.
 */

/* ── The bank's three sizes ── */

/**
 * THE THREE SIZES the board shows, as widths in canvas px, with the width each
 * collapses to on a 375 canvas (the site's own 16px gutters leave 343). A
 * placement may pass any width; these are the three the bank argues.
 */
export const RIVER_SIZES = {
  column: { label: "Column", w: 560, phoneW: 343 },
  card: { label: "Card", w: 400, phoneW: 280 },
  thumb: { label: "Thumbnail", w: 240, phoneW: 160 },
} as const;

export type RiverSizeId = keyof typeof RIVER_SIZES;

/** The visual's default proportion. A placement may pass its own height. */
export const RIVER_RATIO = 1.32;

export function riverHeight(w: number) {
  return Math.round(w * RIVER_RATIO);
}

/** What sits at the top of the flow, where every frame is born. */
export type RiverOrigin = "code" | "plate" | "none";

/* ── The stream's constants ── */

/** One frame per manifest still, so no photograph is ever doubled in view. */
const CARDS = 12;
/** One card's whole life, in ms. A constant and not a function of the box: two
 *  sizes side by side have to pour in step. */
const FLIGHT = 7600;
/** The gap between two launches. CARDS * LAUNCH (the cycle) is deliberately a
 *  hair SHORTER than the flight, so every card in the pool is always airborne
 *  and the stream has no gaps; gravity then does the spacing for free. */
const LAUNCH = Math.round((FLIGHT * 0.965) / CARDS);
const CYCLE = CARDS * LAUNCH;
/** The reveal that fans the seeded offsets apart, once, at the pour. */
const REVEAL_MS = 1500;
/** How much of the DISTANCE fallen the fan opens over. Distance and not
 *  flight: the fall is gravity weighted, so a third of the flight is a tenth of
 *  the distance, and the album would be fully fanned before it had cleared the
 *  object it came out of. */
const OPEN = 0.34;

/**
 * THE FRAMES, in the manifest's own ids (bible 18 is the only source of
 * paths). Sequenced for contrast between neighbours, because consecutive
 * launches are the two frames a reader sees together at the top of the flow.
 * Will's kit replaces these by id; the crop table below goes with them.
 */
const FRAMES = [
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

/**
 * THE CROP, chosen off each photograph rather than left at the centre. Eleven
 * of the twelve manifest stand-ins are 3:2 landscapes and every box in this
 * stream is a square or a 4:5 portrait, so object-cover throws the sides away:
 * a centred crop of the toast loses the raised glass. Indexed the way FRAMES
 * is; it retires with the stand-ins.
 */
const CROP = [
  "45% 44%",
  "42% 42%",
  "44% 50%",
  "46% 42%",
  "44% 34%",
  "50% 40%",
  "58% 50%",
  "52% 44%",
  "42% 52%",
  "42% 52%",
  "50% 40%",
  "32% 46%",
] as const;

/* ── The geometry, derived from the box ── */

export type RiverGeo = {
  w: number;
  h: number;
  /** The object's field in px (the code including its quiet zone, or the plain
   *  plate's blank); 0 when there is no object. */
  qr: number;
  /** The white object's own box. */
  plateTop: number;
  plateW: number;
  plateH: number;
  /** Where the origin sits on the canvas, and therefore where every frame is
   *  born. Negative with no object: the flow enters from above the frame. */
  originY: number;
  /** A frame's DOM box: its LARGEST visible size, so scale never exceeds 1. */
  card: number;
  /** The scale a frame has as it emerges from the object. */
  sMin: number;
  /** The fall fraction at which scale reaches 1. */
  fullAt: number;
  /** Half the stream's width at full fan. */
  spread: number;
  /** The fall at progress 1, in px. It OVER travels the dissolve on purpose:
   *  a card may only recycle once none of it can be seen. */
  travel: number;
  /** The canvas y past which the bottom dissolve has taken the stream to zero.
   *  Derived from the mask's last stop, never typed by hand. */
  deadY: number;
  fadeX: string;
  fadeB0: string;
  fadeB1: string;
  /** Canvas relative, never a vw value: a lab stage may be zoomed. */
  sizes: string;
};

/** The plate's padding around the code, and the gap to its printed line. */
const PLATE_PAD = 10;
const PLATE_GAP = 8;

/** The object's share of the box when the box is big enough to give it. The
 *  plain plate is always this. The code is this or its scan floor, whichever
 *  is larger, which in a small box is the floor. */
const QR_SHARE = 0.2;

/** What the code encodes when a placement passes no demo URL. One constant,
 *  because the floor has to be measured off the value actually drawn. */
const QR_FALLBACK_VALUE = "https://partyreel.com";

/** FooterQr's quiet zone in modules PER SIDE, and the px a module needs to
 *  survive a phone camera reading it off a screen (footer-qr.tsx cites the
 *  same floor). QUIET_ZONE is private to that file, so it is mirrored here: it
 *  is the QR spec's minimum and does not move. */
const QUIET_ZONE_MODULES = 4;
const MODULE_FLOOR_PX = 3;

/**
 * ★ THE SCAN FLOOR, MEASURED OFF THE CODE and never typed.
 *
 * FooterQr draws its svg at `size` px over a viewBox of count + 2 * QUIET_ZONE
 * modules, so the px a module gets is size / SPAN, not size / count: the quiet
 * zone is INSIDE the box, and forgetting it overstates the code by a quarter.
 * The demo URL is 33 modules, so its span is 41 and it is scannable from 123 px
 * up; the fallback above is 25 modules, span 33, and starts at 99. Round one
 * typed 96 for both, which gave the demo code 2.34 px a module against the 3
 * the same note cited, so the number the board asked Will to rule on was one
 * the code could not support.
 *
 * Measured per value because the value decides it: a placement that passes no
 * demo URL encodes a much shorter string and its floor is genuinely lower.
 */
function qrSpanModules(value: string) {
  const code = qrcode(0, "M");
  code.addData(value);
  code.make();
  return code.getModuleCount() + QUIET_ZONE_MODULES * 2;
}

/**
 * THE CODE'S REAL NUMBERS in a box of this width: the edge it is drawn at, the
 * px each module gets, and the share of the box its plate takes. Exported
 * because the board prints them under every specimen rather than claiming
 * them. A scannable code has an absolute minimum size, so the smaller the box
 * the larger its share, and that is the whole of the second ask.
 */
export function riverQrReadout(w: number, value: string | null) {
  const span = qrSpanModules(value ?? QR_FALLBACK_VALUE);
  const edge = Math.max(
    Math.ceil(span * MODULE_FLOOR_PX),
    Math.round(w * QR_SHARE),
  );
  return { edge, perModule: edge / span, plateShare: (edge + PLATE_PAD * 2) / w };
}

/**
 * The bottom dissolve's two stops, as fractions of the height. It runs to the
 * BOTTOM EDGE and not short of it: a feature visual lives in a box somebody
 * else's layout gave it, and a stream that evaporates 30px above the edge
 * leaves a dead band inside that box. Ending at 1 means the album leaves
 * through the bottom of the slot, which is also the sentence.
 */
const FADE_B0 = 0.8;
const FADE_B1 = 1;

export function riverGeo(
  w: number,
  h: number,
  origin: RiverOrigin,
  qrUrl: string | null,
): RiverGeo {
  // The plain plate is the composition's share of the box, at any size. The
  // CODE cannot be: it has a floor in px, so in a small box it is larger than
  // the composition would choose. That difference is the honest picture of
  // what a scannable code costs a section visual, so it is drawn rather than
  // hidden, and the plate's field is derived the same way rather than left at
  // zero.
  const qr =
    origin === "none"
      ? 0
      : origin === "code"
        ? riverQrReadout(w, qrUrl).edge
        : Math.round(w * QR_SHARE);
  const plateW = origin === "none" ? 0 : qr + PLATE_PAD * 2;
  const plateTop = Math.round(h * 0.055);
  const plateH = plateW;
  // With an object, every frame is born at the code's centre and is occluded
  // until it clears the plate's bottom edge. With none, the origin sits above
  // the frame so the flow arrives already falling.
  const originY =
    origin === "none"
      ? -Math.round(h * 0.1)
      : plateTop + PLATE_PAD + Math.round(qr / 2);
  // A frame is 40 percent of the box. Measured against the alternatives in the
  // browser: at a third the twelve frames read as a scatter of small pictures
  // with holes between them, and at a half the flow is a solid wall. At 0.4
  // consecutive frames overlap both vertically and laterally, which is what
  // makes a braid read as one stream rather than a queue.
  const card = Math.round(w * 0.4);
  const deadY = h * FADE_B1;
  return {
    w,
    h,
    qr,
    plateTop,
    plateW,
    plateH,
    originY,
    card,
    // A frame is about a third of the plate's width as it emerges and full size
    // well before it lands, so it is never rasterized above 1:1 and it has
    // straightened by the time it is large.
    sMin: 0.3,
    fullAt: 0.6,
    // Half the stream's width at full fan. With frames at 0.4w this puts the
    // widest lane's outer edge at 80 percent of the box, so the album fills the
    // slot and dissolves at the sides rather than being cut by them.
    spread: Math.round(w * 0.2),
    // ★ OVER TRAVEL, deliberately. A card may only recycle once NO part of it
    // can be seen (topEdgeAt below), so the fall has to run past the dissolve's
    // last stop by more than half a frame. At 1.26 the cut lands at progress
    // 0.93 against a 0.965 ceiling, so under half a card of the pool is off
    // screen at any moment; shorten it and the recycle becomes the pop the
    // dead line test exists to prevent.
    travel: Math.round(h * 1.26) - originY,
    deadY,
    fadeX: "8%",
    fadeB0: `${Math.round(FADE_B0 * 100)}%`,
    fadeB1: `${Math.round(FADE_B1 * 100)}%`,
    sizes: `${Math.round(w * 0.4)}px`,
  };
}

/* ── The primitives the stream is written in ── */

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Gravity: 38% quadratic, 62% linear. The hero weighted it 60/40, which is
 * right for a 990px fall under a code at the top of a viewport and wrong in a
 * box: measured in the browser, 60/40 stacked six of the twelve frames into the
 * first 200px, where the plate hides them, and left the rest of the column
 * sparse. At 38/62 a frame still leaves the object slowly and is still twice as
 * quick at the bottom, and ten of the twelve are on screen instead of six.
 */
const fallAt = (p: number) => 0.38 * p * p + 0.62 * p;

/** The fan, over the first third of the DISTANCE fallen. */
const openAt = (fall: number) => smoothstep(0, OPEN, fall);

/** ease-in-out-quart, which IS --ease-in-out-strong's cubic-bezier
 *  (0.77, 0, 0.175, 1). Written out rather than solved so the reveal needs no
 *  bezier solver and stays engine deterministic. */
function revealEase(t: number) {
  const u = clamp01(t);
  if (u < 0.5) return 8 * u * u * u * u;
  const v = 1 - u;
  return 1 - 8 * v * v * v * v;
}

const mod = (a: number, n: number) => ((a % n) + n) % n;

/** A deterministic 0..1 per card. Integer ops only, on purpose: Math.sin is not
 *  bit identical across JS engines, and the server and the browser have to
 *  produce the SAME rest transform or hydration warns. */
function hash01(n: number) {
  let hv = Math.imul(n + 1, 2654435761) >>> 0;
  hv = (hv ^ (hv >>> 15)) >>> 0;
  hv = Math.imul(hv, 2246822519) >>> 0;
  hv = (hv ^ (hv >>> 13)) >>> 0;
  return hv / 4294967296;
}

type Card = {
  key: string;
  /** Launch order and seed, jittered so the flow is not a metronome. */
  slot: number;
  photo: number;
  /** Where across the flow this card runs, -1 to 1. */
  lane: number;
  /** Width factor: 1 is a square, 0.8 a 4:5 portrait. */
  wf: number;
  /** Per card size, 0.84 to 1 of the box's card. */
  sJit: number;
  /** Degrees of tumble at birth; it decays as the frame falls. */
  rz: number;
};

/** The tumble decays to 12 percent of its birth angle over the first three
 *  quarters of the fall: a frame leaves the object at an angle and lands
 *  square, which is the sentence Will's note asks for. */
const angleAt = (c: Card, p: number) =>
  c.rz * (1 - 0.88 * smoothstep(0, 0.75, p));

/**
 * ONE FLOW. The lane comes off the golden ratio sequence rather than a hash, so
 * the twelve lanes are evenly spread across the full width AND two consecutive
 * launches are always far apart: a hash clusters, and a clustered flow reads as
 * a queue down one side. This is the line that replaced the parity split.
 */
function buildCards(): Card[] {
  const phi = 0.618033988749895;
  return Array.from({ length: CARDS }, (_, g) => {
    const j = hash01(g + 101);
    const jj = hash01(g + 211);
    const j4 = hash01(g + 307);
    return {
      key: `rvr-${g}`,
      // Plus or minus a sixth of a cadence. The cycle is unchanged (the offsets
      // only move inside it), so the flow still has no gaps.
      slot: g + (hash01(g + 517) - 0.5) * 0.34,
      photo: g,
      lane: ((g * phi) % 1) * 2 - 1,
      wf: j < 0.45 ? 0.8 : 1,
      sJit: 0.84 + j4 * 0.16,
      // Wide, because the angle now decays to nearly nothing: it is spent at the
      // top of the flow, where a frame is small and reads as paper leaving a
      // slot, and it is gone by the time the frame is large.
      rz: (jj * 2 - 1) * 8.5,
    };
  });
}

/** Built once for the module, so a size switch never reshuffles which
 *  photograph is which. */
const CARD_POOL = buildCards();

const boxW = (c: Card, geo: RiverGeo) => geo.card * c.wf * c.sJit;
const boxH = (c: Card, geo: RiverGeo) => geo.card * c.sJit;

/**
 * The TOPMOST pixel a card can put on the page at this progress: its centre,
 * minus the half height of the TUMBLED box (a rotated frame reaches higher than
 * its layout box, so the flat half would cut it early).
 *
 * ★ This, and never the centre, is what the loop's dead line test asks for. A
 * card is laid out and scaled about its own centre, so a centre past deadY test
 * throws away the whole upper half of a frame at the moment it fires: in a 560
 * column that is 90px of a 190px photograph still standing where the mask is
 * fully opaque, gone in one frame, roughly every 0.6s.
 */
function topEdgeAt(c: Card, p: number, geo: RiverGeo) {
  const fall = fallAt(p);
  const s = geo.sMin + (1 - geo.sMin) * clamp01(fall / geo.fullAt);
  const rad = (angleAt(c, p) * Math.PI) / 180;
  const half =
    (boxH(c, geo) * s * Math.abs(Math.cos(rad)) +
      boxW(c, geo) * s * Math.abs(Math.sin(rad))) /
    2;
  return geo.originY + fall * geo.travel - half;
}

/** The whole composition for one card at one progress. One expression, and the
 *  same one the rest state is written from. */
function place(c: Card, p: number, geo: RiverGeo) {
  const fall = fallAt(p);
  const s = geo.sMin + (1 - geo.sMin) * clamp01(fall / geo.fullAt);
  const deg = angleAt(c, p);
  const x = c.lane * geo.spread * openAt(fall);
  const dy = fall * geo.travel;
  // Rounded so the server's string and the browser's agree exactly: the cosine
  // inside angleAt is not bit identical across engines and this string is
  // server rendered.
  return `translate3d(${x.toFixed(2)}px, ${dy.toFixed(2)}px, 0) rotate(${deg.toFixed(2)}deg) scale(${s.toFixed(4)})`;
}

/** Frames fade up while they are still behind the object, so one slides out of
 *  the plate rather than switching on beside it. The far end of the flow is
 *  dissolved by the sheet's mask, so there is no fade out curve here. */
const opacityAt = (p: number) => (p > 1 ? 0 : smoothstep(0, 0.1, p));

/* ── The object at the top of the flow ── */

/**
 * THE ORIGIN. Nothing about it moves: a QR that breathes is a QR nobody can
 * scan. It is one white CARD, which is what actually sits on a table at an
 * event, and the frames are born BEHIND it, so the album slides out from under
 * the object rather than appearing beside it.
 *
 * The plate's white and the line's ink are the same scanner contrast exception
 * footer-qr.tsx already documents, not a palette choice.
 */
function Origin({
  origin,
  url,
  line,
  geo,
}: {
  origin: RiverOrigin;
  url: string | null;
  line: string | null;
  geo: RiverGeo;
}) {
  if (origin === "none") return null;
  const plate = (
    <span className="rvr-plate" style={{ padding: PLATE_PAD }}>
      {origin === "code" ? (
        <FooterQr
          value={url ?? QR_FALLBACK_VALUE}
          size={geo.qr}
          className="p-0"
        />
      ) : (
        // THE PLAIN PLATE: the object without the pattern, at the share of
        // the box the composition would choose, which is what the code would
        // also be if a code could be any size. A placement whose subject is not
        // the code (curation, sharing, the guest album) still needs something
        // for the album to pour OUT of, and a drawn code that goes nowhere
        // would be a lie. It is SMALLER than the code in every box under about
        // 615 px (495 when there is no demo URL to encode), and that difference
        // is part of the second ask: taking the code out is also taking the
        // scan floor out.
        <span
          aria-hidden
          className="rvr-blank"
          style={{ width: geo.qr, height: geo.qr }}
        />
      )}
      {line ? (
        <Caption
          className="text-center text-black/70"
          // The line is held to the CODE's own width, not a little wider than
          // it: the plate is then exactly the field plus its padding at every
          // size, which is the number the board prints under each specimen.
          style={{ marginTop: PLATE_GAP, maxWidth: geo.qr }}
        >
          {line}
        </Caption>
      ) : null}
    </span>
  );
  if (origin !== "code" || !url) return plate;
  return (
    <Link
      href={url}
      aria-label="Scan with your phone, or tap to open the live demo"
      className="inline-flex transition-transform duration-150 active:scale-[0.99]"
    >
      {plate}
    </Link>
  );
}

/* ── The visual ── */

export type RiverVisualProps = {
  /** The box, in px. The visual owns its geometry; a placement passes the
   *  numbers its own layout gives it. */
  width: number;
  height?: number;
  /** What the album pours out of. */
  origin?: RiverOrigin;
  /** The live demo's guest URL; the code links to it when present. */
  qrUrl?: string | null;
  /** One line printed on the plate, or nothing. */
  line?: string | null;
  /** The ground this sits on. It changes the lift alphas and the plate's edge,
   *  nothing else: one token set (bible 2). */
  tone?: "cinema" | "paper";
  /** Production truth for a visual below the fold is lazy; a placement in the
   *  first screen passes true. */
  eager?: boolean;
  /** Remount key for the lab's Replay. */
  className?: string;
};

export function RiverVisual({
  width,
  height,
  origin = "code",
  qrUrl = null,
  line = null,
  tone = "cinema",
  eager = false,
  className,
}: RiverVisualProps) {
  const h = height ?? riverHeight(width);
  const geo = useMemo(
    () => riverGeo(width, h, origin, qrUrl),
    [width, h, origin, qrUrl],
  );
  const reduced = usePrefersReducedMotion();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  // The last opacity written per node, so the loop only touches the ones that
  // changed: at any moment most of the flow sits at a flat 1, and writing it
  // again is a style recalculation nobody asked for.
  const lastO = useRef<number[]>([]);

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
      // The lab's stage sets data-paused on a hidden tab; production swaps in
      // useAmbientPause, which also pauses off screen. Holding the CLOCK rather
      // than the loop is what matters: an unheld clock teleports the flow on
      // return. Read it off the closest ancestor so the visual owns no shell
      // knowledge and the same file works in both places.
      if (root.closest("[data-paused]")) return;
      elapsed += dt;

      // The pour: one tween of the seeded offsets from nothing to their steady
      // spacing. The clock term runs the whole time, so there is no handoff
      // between the entrance and the loop, only one expression.
      const reveal = revealEase(elapsed / REVEAL_MS);
      for (let i = 0; i < CARD_POOL.length; i++) {
        const el = nodes.current[i];
        if (!el) continue;
        const c = CARD_POOL[i];
        const at = mod(c.slot * LAUNCH * reveal + elapsed, CYCLE) / FLIGHT;
        // The cut is the card's TOP EDGE past the point the bottom dissolve has
        // already taken to zero, which is the first moment none of it can be
        // seen. `at > 1` guards a card on the ground between flights and is
        // unreachable by construction (CYCLE is shorter than FLIGHT); it stays
        // for whoever retunes LAUNCH past FLIGHT.
        if (at > 1 || topEdgeAt(c, at, geo) > geo.deadY) {
          if (lastO.current[i] !== 0) {
            el.style.opacity = "0";
            lastO.current[i] = 0;
          }
          continue;
        }
        el.style.transform = place(c, at, geo);
        const o = opacityAt(at);
        if (o !== lastO.current[i]) {
          el.style.opacity = String(o);
          lastO.current[i] = o;
        }
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [geo, reduced]);

  return (
    <div
      ref={rootRef}
      data-rvr-tone={tone}
      className={cn("rvr rvr-oneflow relative overflow-hidden", className)}
      style={{ width, height: h }}
    >
      {/* THE FLOW. Decorative: the album is the argument and a placement's words
          sit beside the visual, never inside it. Dissolved at both side edges
          and at the bottom so it is never guillotined by its own box: the album
          LEAVES the frame rather than stopping at it. */}
      <div
        aria-hidden
        className="rvr-stream absolute inset-0"
        style={
          {
            "--rvr-fade-x": geo.fadeX,
            "--rvr-fade-b0": geo.fadeB0,
            "--rvr-fade-b1": geo.fadeB1,
            "--rvr-origin": `${geo.originY}px`,
          } as CSSProperties
        }
      >
        <div className="rvr-flow">
          {CARD_POOL.map((c, i) => {
            // THE REST STATE, written as custom properties the sheet reads: the
            // flow standing at its steady spacing, which is what reduced motion,
            // a crawler and the server's own HTML get. It is the loop's own
            // expression with the reveal finished and the clock at zero, so the
            // rest state cannot drift from the running one.
            const seed = mod(c.slot * LAUNCH, CYCLE) / FLIGHT;
            const dead = topEdgeAt(c, seed, geo) > geo.deadY;
            return (
              <div
                key={c.key}
                ref={(el) => {
                  nodes.current[i] = el;
                }}
                className="rvr-card"
                style={
                  {
                    width: boxW(c, geo),
                    height: boxH(c, geo),
                    marginLeft: -boxW(c, geo) / 2,
                    marginTop: -boxH(c, geo) / 2,
                    "--rvr-rest": place(c, seed, geo),
                    "--rvr-rest-o": dead ? "0" : opacityAt(seed).toFixed(3),
                    "--rvr-pos": CROP[c.photo % CROP.length],
                  } as CSSProperties
                }
              >
                <Frame index={c.photo} sizes={geo.sizes} eager={eager} />
              </div>
            );
          })}
        </div>
      </div>

      {geo.plateW > 0 ? (
        <div
          className="absolute inset-x-0 z-10 flex justify-center"
          style={{ top: geo.plateTop }}
        >
          <Origin origin={origin} url={qrUrl} line={line} geo={geo} />
        </div>
      ) : null}
    </div>
  );
}

/** One photograph at FULL luminance (bible 1): no scrim, ever. */
function Frame({
  index,
  sizes,
  eager,
}: {
  index: number;
  sizes: string;
  eager: boolean;
}) {
  const img = marketingImage(FRAMES[index % FRAMES.length]);
  return (
    <div className="relative size-full overflow-hidden rounded-[var(--radius-tile)] bg-white/5 ring-1 ring-white/10 ring-inset">
      <Image
        src={img.src}
        alt=""
        fill
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        className="rvr-img object-cover"
      />
    </div>
  );
}

/* ── What the bank card reads ── */

/** Facts about one instance, derived rather than claimed: the board prints
 *  these beside the measured frame cost. */
export const RIVER_FACTS = {
  cards: CARDS,
  flight: FLIGHT,
  launch: LAUNCH,
  /** Promoted layers per instance: one per card (will-change: transform) plus
   *  the two mask elements. */
  layers: CARDS + 2,
  /** DOM nodes per instance, counted off the tree above: the root, the two mask
   *  wrappers, and per card a positioned div, a frame div and an img. */
  nodes: 3 + CARDS * 3,
} as const;
