"use client";

// the concept's own sheet; it leaves with the board when the ruling lands.
import "./river.css";

import Link from "next/link";
import {
  type CSSProperties,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";

import { Toggle } from "@/components/dev/board";
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
  LADDER,
  type Mode,
  Photo,
  copyFor,
} from "./shared";

/**
 * THE RIVER (concept 4 of the home-hero board; round three's variation 4, on
 * the axis THE ORIGIN AT THE TOP AND THE PAGE AS THE ALBUM. This is the
 * track's round two, 2026-09-14.)
 *
 * The argument. The source put the code at the exact centre and made the album
 * a horizontal corridor around it: the still centre of a moving album. That
 * answers "where does the type live" beautifully, but it also makes the hero a
 * self-contained object, a diagram of the product sitting in the middle of a
 * page. The river asks the next question instead: if the scan is where
 * everything starts, the code belongs where a page starts. So the code moves
 * to the TOP, into the slot an eyebrow would occupy, and the album pours DOWN
 * out of it: frames are born behind the plate, fall, grow, straighten, part
 * around the words, and dissolve through the hero's bottom and side edges into
 * the rest of the page. The page is not a page with an album in it. The page
 * IS the album the scan started, and the hero is only its first screen.
 *
 * Phone-first, which is the real reason for the axis. A vertical stream is
 * what a 375 screen is shaped for: the source's corridor has to compress two
 * horizontal rows into one strip there, while a river only gets narrower. So
 * the phone is a composition of its own rather than a squeezed desktop: ONE
 * braided lane of frames that start LARGE, on a cadence of its own, dissolving
 * just above the headline. That last part is the phone's real constraint said
 * out loud: a full-measure h1 at 375 leaves no corridor beside it, so the
 * album cannot run past the words there however the parting is tuned. The
 * parting still runs (the guarantee is one expression on both canvases), but
 * on the phone the stream has dissolved before it would be flung aside, and
 * the read is the album pouring out of the code and dissolving into the words.
 *
 * WHAT ROUND TWO CHANGED, and why each one.
 *
 *  1. THE PLATE CARRIES ITS OWN LINE. Round one put the Caption ABOVE the code
 *     and flagged it, because a line floating 80 px UNDER the plate is exactly
 *     where every frame is born, so frames had to escape sideways before they
 *     had fallen a card's height and appeared BESIDE the code rather than out
 *     of it. That is true of a FLOATING line. It is not true of a PRINTED one:
 *     put the line inside the white object and the code becomes the card that
 *     actually sits on a table at an event, a QR with one line under it. The
 *     stream is born behind that card and emerges from its bottom edge, so the
 *     label is under the code and nothing has to move out of the way. Both are
 *     on the stage under one toggle (the chip at the top left) so the ruling is
 *     made with both in view.
 *  2. A HELD FIRST BEAT. The pour used to start at elapsed 0 and only looked
 *     like a beat because the frames took time to grow. Now the stream's clock
 *     is held for HOLD_MS while the code and the words stand alone, and then
 *     the album pours. Cause, then effect, in time as well as in space (the
 *     scan concept's lesson, which spends a constant rather than machinery).
 *  3. THE COUNT SETTLES. It used to climb forever, one per launch, which is a
 *     slot machine and not an album. It now starts below its figure, ticks up
 *     with the arrivals and STOPS, because an album fills and then is full.
 *     Still a stand-in, still flagged, and the rest state renders the settled
 *     figure rather than the starting one.
 *  4. FRAMES STRAIGHTEN AS THEY LAND. A card's tumble decays with its fall, so
 *     a frame leaves the code at an angle and is nearly square by the time it
 *     is large: it reads as a photograph landing in an album rather than paper
 *     in a wind tunnel. It costs one term, and the parting clears against the
 *     LIVE angle, so the guarantee below still holds.
 *  5. THE STAND-INS ARE CROPPED WITH INTENT. Eleven of the twelve manifest
 *     frames are 3:2 landscapes and every box here is a square or a 4:5
 *     portrait, so a centred crop threw away the subject of half of them. Each
 *     frame now carries its own object-position, chosen off the photograph.
 *  6. THE OVERLAP CUE IS THE LIGHT BOARD'S. Cards used to carry a one-off
 *     shadow; they now carry the light spec's LIFT, the named cue for two
 *     photographs overlapping, at its cinema alphas and its geometry.
 *
 * The mechanism, one expression. A card's progress is a closed form of the
 * clock, ((slot + phase) * launch * reveal + t) mod cycle / flight, where t is
 * the clock after the hold. That is the source's lesson kept exactly: no
 * state, no timers, no per-card bookkeeping, and the recycling falls out of
 * the modulo. Everything else is that one number:
 *
 *   fall   0.6p^2 + 0.4p        gravity, so a frame leaves the code slowly
 *                               and is three times quicker at the bottom;
 *   scale  sMin to 1 over the   a frame is about the plate's width when it
 *          distance fallen      emerges and its full size by the bottom edge,
 *                               so its box is never rasterized above 1:1;
 *   angle  rz decaying to a     it tumbles out of the code and lands square;
 *          third
 *   x      drift * open(p)      its own lane, fanning out of the code, PLUS
 *          + the parting        the parting: while a card's box could overlap
 *                               the lockup, its projected inner edge is held
 *                               on the corridor's wall. The clearing is
 *                               therefore a geometric guarantee rather than a
 *                               hope, and it stays a constant-width corridor
 *                               even as the frames grow, because the wall
 *                               holds the INNER EDGE while the centre moves
 *                               outward.
 *
 * That last line is what makes the river a river: the album visibly opens
 * around the headline and closes under it, and nothing is ever dimmed to make
 * room for a word. No scrim, no darkening layer, no lamp. The white card and
 * the photographs are the only light in the room.
 */

/* ── The stream's constants ── */

const CARDS = 16;
/** Cards per arm. CARDS / 2 by the parity split (the source's). */
const POOL = CARDS / 2;
/** The reveal that fans the seeded offsets apart, once, at the pour. */
const REVEAL_MS = 1900;
/**
 * THE HELD BEAT. The stream's clock does not start until here, so the first
 * thing on screen is the code and the words with nothing falling. Cause, then
 * effect. Long enough to read the plate, short enough that nobody waits: round
 * one's pour had an accidental half second of this and it was the thing every
 * reading of the board noticed first, so round two makes it a number.
 */
const HOLD_MS = 620;
/** The right arm launches half a cadence after the left, so the two arms
 *  alternate instead of falling as mirrored pairs. */
const ARM_PHASE = 0.5;
/** The stand-in album count: it starts here, ticks once per arrival and stops
 *  at COUNT_TO. Never a real figure; see the departures. */
const COUNT_FROM = 241;
const COUNT_TO = 248;
/** Slack between the lockup and the nearest frame edge, in canvas px. */
const SAFE = 14;
/** ★ Ink overshoot. A line box at leading 1.02 is SHORTER than the face's own
 *  ascent plus descent, so the h1's glyphs stand about 9 px above the element's
 *  layout box (measured on Urbanist at text-8xl). The clearing is grown by this
 *  at both ends, or a frame can graze the top of the headline while the layout
 *  boxes still say there is room. */
const INK = 14;

/** The line under, or above, the code. Present tense, one breath, about
 *  something arriving (docs/specs/brand-voice.md). */
const CODE_LINE = "Scan it. The album is live.";

/* ── Where the line sits: the ruling, as a toggle ───────────────────────────
   A module-level store rather than component state, for one reason: Replay
   REMOUNTS the stage (the board keys it on runId), so component state would
   throw the choice away every time Will replayed the pour, and the desktop and
   the phone stage would disagree. The store outlives both. */

type CaptionPlace = "above" | "under";
const CAPTION_DEFAULT: CaptionPlace = "under";
let captionPlace: CaptionPlace = CAPTION_DEFAULT;
const captionListeners = new Set<() => void>();

function setCaptionPlace(v: CaptionPlace) {
  captionPlace = v;
  for (const l of captionListeners) l();
}

function subscribeCaption(l: () => void) {
  captionListeners.add(l);
  return () => {
    captionListeners.delete(l);
  };
}

function useCaptionPlace(): CaptionPlace {
  return useSyncExternalStore(
    subscribeCaption,
    () => captionPlace,
    () => CAPTION_DEFAULT,
  );
}

/* ── Geometry ── */

type Geo = {
  /** The QR's edge in px, quiet zone included. */
  qr: number;
  /** Where the QR's CENTRE sits on the canvas, and therefore where every frame
   *  is born. Identical under both line placements, so the toggle moves one
   *  line and nothing else: that is what makes the two comparable. */
  originY: number;
  /** The lockup's clearing: half the corridor, and the band it spans. */
  clearHalf: number;
  bandTop: number;
  bandBot: number;
  /** How far (in px of fall) the parting ramps in above the band and out below. */
  enter: number;
  release: number;
  /** The card's DOM box: its LARGEST visible size, so scale never exceeds 1. */
  card: number;
  /** The scale a frame has as it emerges from behind the code. */
  sMin: number;
  /** How far an arm fans out on its own, before any parting. */
  drift: number;
  /** The fall at progress 1, in px. */
  travel: number;
  /** The fall fraction at which scale reaches 1. */
  fullAt: number;
  /** One card's life, and the gap between two launches in the same arm. */
  flight: number;
  launch: number;
  /** Canvas-relative, never a vw value: the stage is zoomed. */
  sizes: string;
  /** The type's measures, tuned so the ruled thesis breaks into good lines. */
  h1Max: number;
  subMax: number;
  /** The lockup's internal rhythm. */
  gapSub: number;
  gapCta: number;
  gapCount: number;
  /** How much of each SIDE edge the stream dissolves over. */
  fadeX: string;
  /** Where the bottom dissolve begins and where it is complete, as a fraction
   *  of the canvas height. The desktop takes the album out through the bottom
   *  of the hero (84 to 100); the phone dissolves it just above the headline
   *  (34 to 48), because a full-measure h1 at 375 leaves no corridor beside it
   *  and the parting would otherwise read as cards flung out of the way. */
  fadeB0: string;
  fadeB1: string;
  /** The canvas y past which the bottom dissolve has taken the stream to zero.
   *  Derived from fadeB1, not typed by hand: the loop stops writing a card's
   *  transform below it, because nothing there can be seen. On the phone that
   *  is most of the flight, which is the performance pass's one real cut. */
  deadY: number;
};

const GEO: Record<Mode, Geo> = {
  desktop: {
    qr: 124,
    // High enough that the code reads as an eyebrow and low enough that the
    // floating line still has room above it: the "above" placement is what
    // sets this floor, and both placements pin the QR's centre to it.
    originY: 140,
    clearHalf: 400,
    bandTop: 428,
    bandBot: 836,
    // 130 rather than round one's 170: the parting used to start seven pixels
    // below the birth point, which emptied the band directly under the code
    // before a frame had been read there. Shortening the ramp buys back that
    // band and the push is still gradual, because gravity is slow up there.
    enter: 130,
    release: 320,
    card: 340,
    sMin: 0.32,
    drift: 330,
    travel: 990,
    fullAt: 0.8,
    flight: 9800,
    launch: 1500,
    sizes: "360px",
    h1Max: 740,
    subMax: 560,
    gapSub: 34,
    gapCta: 34,
    gapCount: 18,
    fadeX: "7%",
    fadeB0: "84%",
    fadeB1: "100%",
    deadY: CANVAS.desktop.h,
  },
  // THE PHONE IS ITS OWN COMPOSITION, not the desktop squeezed. Everything it
  // has is spent on ONE THING: the band between the code and the headline, a
  // quarter of the screen, is where this concept has to be won at 375. So it
  // runs on its own clock, its own size and its own fan, all worked backwards
  // from "how many readable frames cross that band, and how big are they".
  //
  //   the band     the card's bottom (178) to the headline (376)
  //   a frame      emerges at about 0.41 of its flight and leaves at 0.74,
  //                so it is on show for 2.8 s of its 8.4
  //   the cadence  575 ms between arrivals across the two arms, which puts
  //                four or five frames in the band at any moment
  //   the size     133 px wide as it clears the card, 176 px by the headline,
  //                which is the whole reason the flight is short: a frame is
  //                never a thumbnail here
  //
  // Round one's phone got none of this: two arms at a drift of 84 against
  // cards of 152 sat inside each other's boxes, a 1800 ms cadence put one or
  // two frames on screen, and a 560 px travel spent most of the clock below
  // the fold. The numbers below are the same expression, solved for the band.
  phone: {
    qr: 96,
    // The floor the "above" placement sets: a floating line, its gap and the
    // plate's own padding all have to fit above this with a margin left over,
    // and at 375 that margin is the whole difference between an eyebrow and a
    // line jammed against the top edge.
    originY: 104,
    clearHalf: 158,
    bandTop: 376,
    bandBot: 742,
    // Short, because the parting has to happen LATE here: the album's readable
    // life IS the band, and a long ramp empties it before a frame is read.
    enter: 60,
    release: 200,
    card: 186,
    // High, and the phone's most consequential number: a frame is 102 px as it
    // sits inside the card, 139 as it clears its bottom edge and 186 by the
    // time it dissolves. The desktop can afford a speck at the code because it
    // has 990 px of fall to grow in; the phone has 200, so it starts big.
    sMin: 0.55,
    // A narrow fan, so the two arms read as one braided lane rather than two
    // columns: at 375 there is no room for two of anything.
    drift: 78,
    travel: 470,
    fullAt: 0.4,
    flight: 8400,
    launch: 1250,
    sizes: "200px",
    h1Max: 316,
    subMax: 330,
    gapSub: 22,
    gapCta: 22,
    gapCount: 14,
    fadeX: "10%",
    fadeB0: "34%",
    fadeB1: "48%",
    deadY: CANVAS.phone.h * 0.48,
  },
};

/** The code object's own box, per placement. The QR's CENTRE is pinned to
 *  geo.originY in both, so the toggle moves the line and nothing else.
 *
 *  above: a floating Caption, then FooterQr's own plate (inline-flex, p-2).
 *  under: one white CARD holding the code and the line, which is the object an
 *         event actually puts on a table. */
const PLATE_PAD = 10;
const PLATE_GAP = 8;
const LINE_H = 16;
const CAPTION_GAP = 12;
/** FooterQr's own plate padding (`p-2`), between the plate's edge and the
 *  code's first module. Hard-coded on purpose: the concept has to place the
 *  QR's CENTRE to the pixel, and reading it off the DOM is exactly what the
 *  stage's zoom makes unreliable (geometry comes from CANVAS, never a rect). */
const QR_PAD = 8;

function codeBlockTop(geo: Geo, place: CaptionPlace) {
  return place === "under"
    ? geo.originY - (PLATE_PAD + geo.qr / 2)
    : geo.originY - (LINE_H + CAPTION_GAP + QR_PAD + geo.qr / 2);
}

/* ── The primitives the stream is written in ── */

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** Gravity: 60% quadratic, 40% linear. A frame leaves the code slowly enough
 *  to read as emerging and is about three times quicker at the bottom edge,
 *  which is what makes the stream read as falling rather than scrolling. */
const fallAt = (p: number) => 0.6 * p * p + 0.4 * p;

/** The arm's own fan: the delta's mouth, open by a fifth of the flight. Most
 *  of the stream's width is this, not the parting, which is what keeps the
 *  lateral motion reading as a stream spreading rather than as cards thrown
 *  aside when the words arrive. */
const openAt = (p: number) => smoothstep(0, 0.2, p);

/** Nothing pushes a frame sideways while it is still inside the code. Without
 *  this the parting is already ramping at progress 0 and frames appear BESIDE
 *  the code instead of sliding out from behind it, which is the whole read. */
const birthAt = (p: number) => smoothstep(0, 0.09, p);

/** 1 exactly while a card's box could overlap [top, bot], ramping in above it
 *  and out below. `half` is the card's own half-height, so the guarantee is
 *  about the BOX and not about the centre. */
function bump(
  y: number,
  half: number,
  top: number,
  bot: number,
  enter: number,
  release: number,
) {
  const t = top - half;
  const b = bot + half;
  return smoothstep(t - enter, t, y) * (1 - smoothstep(b, b + release, y));
}

/** ease-in-out-quart, which IS --ease-in-out-strong's cubic-bezier
 *  (0.77, 0, 0.175, 1). Written out rather than solved so the reveal needs no
 *  bezier solver and stays engine-deterministic (the source's note). */
function revealEase(t: number) {
  const u = clamp01(t);
  if (u < 0.5) return 8 * u * u * u * u;
  const v = 1 - u;
  return 1 - 8 * v * v * v * v;
}

const mod = (a: number, n: number) => ((a % n) + n) % n;

/** A deterministic 0..1 per card. Integer ops only, on purpose: Math.sin is
 *  not bit-identical across JS engines, and the server and the browser have to
 *  produce the SAME rest transform or hydration warns (the source's note; the
 *  cosine inside `place` is covered by rounding the string instead). */
function hash01(n: number) {
  let h = Math.imul(n + 1, 2654435761) >>> 0;
  h = (h ^ (h >>> 15)) >>> 0;
  h = Math.imul(h, 2246822519) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  return h / 4294967296;
}

/**
 * THE CROP, chosen off each photograph rather than left at the centre.
 *
 * Eleven of the twelve manifest stand-ins are 3:2 landscapes and every box in
 * this stream is a square or a 4:5 portrait, so object-cover throws the sides
 * away: a centred crop of the toast loses the raised glass, a centred crop of
 * the arch loses the florals. These were read off the frames by eye, indexed
 * the way FRAMES is, and they go the moment the real kit lands (ASSETS rows 2
 * and 12 are squares and portraits framed for this size, so nothing there has
 * to be rescued by a crop).
 */
const CROP = [
  "45% 44%", // wedding-golden: the couple and the bouquet, left of centre
  "42% 42%", // party-dj: the DJ and the ball, not the empty side of the booth
  "44% 50%", // reception-table: the florals, not the far end of the table
  "46% 42%", // festival-lights: the rig, not the crowd's heads
  "44% 34%", // wedding-petals: the one portrait source, faces high in frame
  "50% 40%", // concert-confetti: where the confetti is densest
  "58% 50%", // wedding-toast: the raised glass, which is what the frame is of
  "52% 44%", // festival-crowd: the stage glow above the silhouettes
  "42% 52%", // wedding-rings: the ring and the watch, not the empty right
  "42% 52%", // reception-hall: the centrepiece, not the chair backs
  "50% 40%", // party-balloons: the balloons, not the ribbons
  "32% 46%", // wedding-arch: the florals at the left of the arch
] as const;

type Card = {
  key: string;
  /** -1 = the left arm, 1 = the right arm. */
  dir: 1 | -1;
  /** Position in its own arm: the launch order and the seed. */
  slot: number;
  /** The right arm's half-cadence offset. */
  phase: number;
  photo: number;
  /** Where in its arm's width this card runs: 0.35 inner to 1 outer. */
  lane: number;
  /** Width factor: 1 is a square, 0.8 a 4:5 portrait. Heights are equal before
   *  the size jitter, so the stream's rhythm stays even while the shapes vary. */
  wf: number;
  /** Per-card size, 0.82 to 1 of the canvas's card. */
  sJit: number;
  /** Extra px this card holds off the corridor's wall, so the clearing's edge
   *  is ragged like a bank and not a ruled line. */
  wall: number;
  /** Degrees of tumble at birth; it decays as the frame falls. */
  rz: number;
};

/** The tumble decays to a third over the first half of the fall: a frame
 *  leaves the code at an angle and lands nearly square, the way a photograph
 *  settles into an album. Keeping a third rather than going to zero is what
 *  stops the stream reading as a ruled grid at the bottom of the hero. */
const angleAt = (c: Card, p: number) =>
  c.rz * (1 - 0.66 * smoothstep(0, 0.5, p));

/**
 * The two arms. The photo offset is half the manifest's length, the source's
 * trick, so the arms never carry the same frame at the same moment. With the
 * 12 landscape stand-ins four frames are doubled; with the kit's 24 squares
 * every card in the stream is unique.
 */
function buildCards(): Card[] {
  const half = Math.round(FRAMES.length / 2);
  return Array.from({ length: CARDS }, (_, g) => {
    const right = g % 2 === 1;
    const slot = (g - (right ? 1 : 0)) / 2;
    const j = hash01(g);
    const jj = hash01(g + 101);
    const jjj = hash01(g + 211);
    const j4 = hash01(g + 307);
    return {
      key: `hhv-${g}`,
      dir: (right ? 1 : -1) as 1 | -1,
      slot,
      phase: right ? ARM_PHASE : 0,
      photo: slot + (right ? half : 0),
      lane: 0.35 + j * 0.65,
      wf: jj < 0.45 ? 0.8 : 1,
      sJit: 0.82 + j4 * 0.18,
      wall: hash01(g + 421) * 46,
      // Wider than round one's 3.6 degrees, because the angle now DECAYS: it
      // is spent at the top of the stream, where a frame is small and reads as
      // paper leaving a slot, and it is nearly gone by the time it is large.
      rz: (jjj * 2 - 1) * 7.5,
    };
  });
}

/** Mode-independent, so the arms are built once for the module and a canvas
 *  switch never reshuffles which photograph is which. */
const CARD_POOL = buildCards();

/** A card's DOM box on this canvas: its LARGEST visible size, which is what
 *  the sheet lays out and what `place` scales down from. */
const boxW = (c: Card, geo: Geo) => geo.card * c.wf * c.sJit;
const boxH = (c: Card, geo: Geo) => geo.card * c.sJit;

/**
 * The whole composition for one card at one progress. The parting is the only
 * clever part: the push is the |x| at which this card's PROJECTED inner edge
 * touches the clearing's wall, so holding it there while the bump is 1 keeps
 * the corridor a constant width however large the frame has grown, and no
 * frame can ever be under a word.
 */
function place(c: Card, p: number, geo: Geo) {
  const fall = fallAt(p);
  const y = geo.originY + fall * geo.travel;
  const s = geo.sMin + (1 - geo.sMin) * clamp01(fall / geo.fullAt);
  const w = boxW(c, geo) * s;
  const h = boxH(c, geo) * s;
  const deg = angleAt(c, p);
  const rad = (deg * Math.PI) / 180;
  // The tumble widens the projected box; clear the corridor against THAT and
  // not against the unrotated width, or a corner clips the measure. It reads
  // the LIVE angle, so the decay above cannot open a gap in the guarantee.
  const halfW = (w * Math.cos(rad) + h * Math.abs(Math.sin(rad))) / 2;

  const base = geo.drift * c.lane * openAt(p);
  // ONE clearing, the lockup's. The code needs none: a frame is born BEHIND it
  // and is occluded until it clears the plate's own bottom edge, which is why
  // the line can be printed under the code without the stream having to bow
  // around it (round one's fourth departure, now dissolved rather than argued).
  const band =
    bump(
      y,
      h / 2,
      geo.bandTop - INK,
      geo.bandBot + INK,
      geo.enter,
      geo.release,
    ) * Math.max(0, geo.clearHalf + halfW + SAFE + c.wall - base);

  const x = c.dir * (base + birthAt(p) * band);
  const dy = y - geo.originY;
  // Rounded so the server's string and the browser's agree exactly: Math.cos
  // is not bit-identical across engines and this string is server-rendered.
  return `translate3d(${x.toFixed(2)}px, ${dy.toFixed(2)}px, 0) rotate(${deg.toFixed(2)}deg) scale(${s.toFixed(4)})`;
}

/** Frames fade up while they are still behind the code, so one slides out of
 *  the plate rather than switching on beside it. The far end of the stream is
 *  dissolved by the sheet's mask, so there is no fade-out curve here. */
const opacityAt = (p: number) => (p > 1 ? 0 : smoothstep(0, 0.12, p));

/** Deterministic thousands grouping. toLocaleString is locale-dependent and
 *  the server's locale is not the reader's, so the count would hydrate
 *  differently; this is the same string everywhere. */
function grouped(n: number) {
  const s = String(n);
  return s.length > 3 ? `${s.slice(0, s.length - 3)},${s.slice(-3)}` : s;
}

/* ── The code object ── */

/**
 * THE CODE, in the slot an eyebrow occupies, above the frames so they are born
 * behind it and slide out from under it. Nothing about it moves: a QR that
 * breathes is a QR nobody can scan.
 *
 * `under` is the printed card: one white object holding the code and its line,
 * which is what actually sits on a table at an event. The line is ink on the
 * plate, which is the SAME scanner-contrast exception the plate itself is
 * (documented in footer-qr.tsx): the token set has no "ink on a white plate in
 * a dark room" pair, and inventing one for a lab concept would be a worse
 * answer than using the exception that already exists.
 *
 * `above` is round one's: a Caption in the room's own white, over a bare plate.
 */
function CodeObject({
  url,
  size,
  place: where,
}: {
  url: string | null;
  size: number;
  place: CaptionPlace;
}) {
  if (where === "above") {
    return (
      <>
        <Caption className="mb-3 text-white/65">{CODE_LINE}</Caption>
        <DemoQr url={url} size={size} />
      </>
    );
  }
  const card = (
    <span className="hhv-plate" style={{ padding: PLATE_PAD }}>
      <FooterQr
        value={url ?? "https://partyreel.com"}
        size={size}
        className="p-0"
      />
      <Caption
        className="text-center text-black/70"
        style={{ marginTop: PLATE_GAP }}
      >
        {CODE_LINE}
      </Caption>
    </span>
  );
  if (!url) return card;
  return (
    <Link
      href={url}
      aria-label="Scan with your phone, or tap to open the live demo"
      className="inline-flex transition-transform duration-150 active:scale-[0.99]"
    >
      {card}
    </Link>
  );
}

function River({ mode, copy, qrUrl }: ConceptProps) {
  const geo = GEO[mode];
  const where = useCaptionPlace();
  const text = copyFor(river, copy);
  const reduced = usePrefersReducedMotion();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  const countRef = useRef<HTMLSpanElement | null>(null);
  const shown = useRef(COUNT_FROM);
  // The contract's progress[]: filled every frame, never React state.
  const progress = useRef<number[]>([]);
  // The last opacity written per node, so the loop only touches the ones that
  // changed: at any moment most of the stream sits at a flat 1, and writing it
  // again is a style recalculation nobody asked for (the performance pass).
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
      // The stage sets data-paused on a hidden tab. Holding the CLOCK rather
      // than the loop is what matters: rAF does not fire in a background tab
      // either way, and an un-held clock teleports the stream on return. Read
      // it off the closest ancestor so the concept owns no shell knowledge.
      if (root.closest("[data-paused]")) return;
      elapsed += dt;

      // THE HELD BEAT: the stream's clock, not the page's. While t is negative
      // every progress lands above 1 and the loop writes nothing at all, so
      // the code and the words stand alone for the first beat.
      const t = elapsed - HOLD_MS;

      // The pour: one tween of the seeded offsets from nothing to their steady
      // spacing. The clock term runs the whole time, so there is no handoff
      // between the entrance and the loop, only one expression.
      const reveal = revealEase(t / REVEAL_MS);
      const cycle = POOL * geo.launch;
      const p = progress.current;
      for (let i = 0; i < CARD_POOL.length; i++) {
        const c = CARD_POOL[i];
        p[i] =
          mod((c.slot + c.phase) * geo.launch * reveal + t, cycle) / geo.flight;
      }
      for (let i = 0; i < CARD_POOL.length; i++) {
        const el = nodes.current[i];
        if (!el) continue;
        const at = p[i];
        // Two ways a card is not worth a write: it is on the ground between
        // flights, or it has fallen past the point the bottom dissolve has
        // already taken to zero. The second is the performance pass's real
        // cut: on the phone the mask is complete at 48% of the canvas, so
        // roughly a third of the airborne cards are writing transforms nobody
        // can see. Cheap to skip, and exact, because the dissolve's end and
        // the fall are both numbers this file already owns.
        if (at > 1 || fallAt(at) * geo.travel + geo.originY > geo.deadY) {
          if (lastO.current[i] !== 0) {
            el.style.opacity = "0";
            lastO.current[i] = 0;
          }
          continue;
        }
        el.style.transform = place(CARD_POOL[i], at, geo);
        const o = opacityAt(at);
        if (o !== lastO.current[i]) {
          el.style.opacity = String(o);
          lastO.current[i] = o;
        }
      }

      // One photo per arrival, in step with the frames being born: the same
      // clock, read a second way. It STOPS at COUNT_TO, because an album fills
      // and then is full, and a number that climbs forever is a slot machine.
      const n = Math.min(
        COUNT_TO,
        COUNT_FROM + Math.floor(Math.max(0, t) / geo.launch),
      );
      const node = countRef.current;
      if (n !== shown.current && node) {
        shown.current = n;
        node.textContent = grouped(n);
        // Restart the nudge: remove, force the reflow, re-add. Seven times in
        // the concept's whole life, so the forced layout is free.
        node.classList.remove("hhv-tick");
        void node.offsetWidth;
        node.classList.add("hhv-tick");
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [geo, reduced]);

  return (
    <div
      ref={rootRef}
      className="relative size-full overflow-hidden bg-background"
    >
      {/* THE STREAM. Full bleed and decorative: the album is the argument, but
          it is the code at the top and the type in the corridor that carry the
          sentence. Dissolved at both side edges and at the bottom so it is
          never guillotined by the stage: the album LEAVES the hero rather than
          stopping at it, which is the whole page-as-the-album claim. */}
      <div
        aria-hidden
        className="hhv-stream absolute inset-0"
        style={
          {
            "--hhv-fade-x": geo.fadeX,
            "--hhv-fade-b0": geo.fadeB0,
            "--hhv-fade-b1": geo.fadeB1,
            "--hhv-origin": `${geo.originY}px`,
          } as CSSProperties
        }
      >
        <div className="hhv-flow">
          {CARD_POOL.map((c, i) => {
            // The REST state, written as custom properties the sheet reads: the
            // stream standing at its steady-state spacing, which is what reduced
            // motion, a crawler and the server's own HTML get.
            const seed = Math.min(
              ((c.slot + c.phase) * geo.launch) / geo.flight,
              1,
            );
            return (
              <div
                key={c.key}
                ref={(el) => {
                  nodes.current[i] = el;
                }}
                className="hhv-card"
                style={
                  {
                    width: boxW(c, geo),
                    height: boxH(c, geo),
                    marginLeft: -boxW(c, geo) / 2,
                    marginTop: -boxH(c, geo) / 2,
                    "--hhv-rest": place(c, seed, geo),
                    "--hhv-rest-o": opacityAt(seed).toFixed(3),
                    "--hhv-pos": CROP[c.photo % CROP.length],
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

      <div
        className="absolute inset-x-0 z-10 flex flex-col items-center"
        style={{ top: codeBlockTop(geo, where) }}
      >
        <CodeObject url={qrUrl} size={geo.qr} place={where} />
      </div>

      {/* THE LOCKUP, in the corridor the stream parts around. At paint, at full
          opacity, gated by nothing (bible 13), and never over a photograph:
          the frames hold their inner edges on this block's walls, so there is
          no scrim here and there never needs to be one. */}
      <div
        className="absolute inset-x-0 z-10 text-center"
        style={{ top: geo.bandTop }}
      >
        <h1
          className={`mx-auto font-heading ${LADDER.xl[mode]} leading-[1.02] text-balance text-white`}
          style={{ maxWidth: geo.h1Max }}
        >
          {text.h1}
        </h1>
        <p
          className="mx-auto text-[15px] leading-relaxed text-pretty text-white/80"
          style={{ maxWidth: geo.subMax, marginTop: geo.gapSub }}
        >
          {text.subhead}
        </p>
        <div
          className="flex flex-wrap items-center justify-center gap-3"
          style={{ marginTop: geo.gapCta }}
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
        {/* THE COUNT: the evidence for the line above it. "See a real album" is
            a claim, and a number visibly still arriving is the proof; it is the
            only element here that says the album is filling RIGHT NOW. Two
            spans rather than one, for the same reason the cards carry a rest
            transform: the SETTLED figure is the state at rest (reduced motion,
            a crawler, the server's HTML) and the ticking one belongs inside the
            no-preference block with the nudge it needs. */}
        <Caption className="text-white/45" style={{ marginTop: geo.gapCount }}>
          <span className="hhv-n-live tabular-nums" ref={countRef}>
            {grouped(COUNT_FROM)}
          </span>
          <span className="hhv-n-rest tabular-nums">{grouped(COUNT_TO)}</span>{" "}
          photos in the demo album so far.
        </Caption>
      </div>

      {/* LAB ONLY. Where the line sits is a ruling Will makes with both built,
          and the board's own toggles live in board.tsx, which this track does
          not own (the shell ask is in the Handoff). This chip is not part of
          the composition and leaves with the ruling. */}
      <div className="hhv-lab">
        <Toggle
          ariaLabel="Lab: where the line sits"
          options={[
            { id: "under" as CaptionPlace, label: "Line on the card" },
            { id: "above" as CaptionPlace, label: "Line above" },
          ]}
          value={where}
          onChange={setCaptionPlace}
        />
      </div>
    </div>
  );
}

export const river: Concept = {
  id: "river",
  n: 4,
  name: "The river",
  rationale:
    "The origin at the top and the page as the album: the code takes the slot an eyebrow would, and the album pours down out of it, born behind the plate, growing and straightening as it falls, parting around the headline and dissolving through the hero's bottom and side edges into the rest of the page. Round two holds the first beat so the code stands alone before the pour, prints the line on the plate so the code becomes the card an event puts on a table (both placements are on the stage under one toggle), settles the count instead of letting it climb, and rebuilds the phone as one braided lane of large frames rather than a squeezed desktop.",
  eyebrow:
    'The code itself at the top of the page, where an eyebrow sits, carrying one line: "Scan it. The album is live." The chip at the top left of the stage puts that line ON the white card with the code, which is the object an event actually puts on a table, or floating above a bare plate. That is the ruling this board most wants.',
  proposed: {
    h1: "One code, and the whole event lands here.",
    subhead:
      "Every phone in the room finds it and uploads at full size, with nothing to install.",
    secondary: "See a real album",
  },
  departures: [
    "THE AXIS, and the one real argument with the source: the code leaves the exact centre. The source's case was the still centre of a moving album, and it is a good one; this trades it for causality read top to bottom. A code in the middle of a composition is an object the page is arranged around, and a stranger reads it as a thing to scan for more information. A code at the TOP, in the eyebrow's slot, with the album falling out of it, is a beginning: everything below it is what the scan produced, which is the sentence the hero was asked to say. The stillness survives the move, and nothing about the plate animates. The lockup is centred rather than left-aligned for the same reason, which is precedent and not law: left-aligning costs the symmetry of the two arms, not the mechanism.",
    "THE LINE, on the chip at the top left, and the thing this board most needs ruled: on the card, or above the plate. Round one argued the line could not sit under a floating plate, because a line 80 px below the point every frame is born at makes frames escape sideways before they have fallen a card's height, so they appear BESIDE the code rather than out of it. That is true of a FLOATING line and false of a PRINTED one: put it inside the white object and the code becomes the card an event actually puts on a table, the stream is born behind that card, and the label is under the code with nothing having to move. Both are built, the card is the default because it is the better object, and one word overrules it.",
    'THE COUNT under the CTAs is a STAND-IN figure (241, ticking to 248, then held). It earns its place as the evidence for the line above it, because "See a real album" is a claim and a number still arriving is the proof, and the voice guide allows a count only where the product actually produced the number (docs/specs/brand-voice.md). So it is wired or it goes: before this is anywhere near production it reads the demo event\'s real media count. Flagged on the board rather than in a footnote, because a number nobody can stand behind is a claim and not a placeholder.',
    "BIBLE 13, decorative layer only: the stream's pre-pour state (every frame collapsed at the code) and the ticking count both sit inside the reduced-motion block, so with JavaScript off and motion allowed the stream rests at the code and the count shows its starting figure. Putting either in an effect instead would paint the album deployed and then snap it back. The h1, the code, the line, the subhead, the CTAs and the count's settled figure are plain markup and never gated, and a reader who asked for less motion gets the stream fully deployed and the settled number.",
    "NOT A DEPARTURE, recorded here because the board has no other row for it. What round two took from the first wave: the light spec's LIFT, the named cue for two photographs overlapping, now carries the cards at its cinema alphas and its geometry, in place of a one-off shadow (docs/specs/light.md); the voice guide's hero shape and its rule on absences rewrote the proposed h1 and subhead, which now name one absence rather than two (docs/specs/brand-voice.md); the media kit's shot list and its \"readable at 120 px\" test are what the asks below are written against (docs/specs/media-kit.md). The type-scale board's finding that this hero invented leading-[1.02] locally is real and stands: the h1 keeps it until a ladder is ruled, then takes the ruled leading for its step. This concept has no CSS-paste candidate, so it offers no \"Apply to the site\" block: its ruling lands as a hero component in the wiring round, not as tokens.",
  ],
  assets: [
    "24 event photographs as 512 x 512 squares, one grade, 6 to 35 KB webp each, framed tight enough to read at 110 px · ASSETS row 2, already requested and unchanged: the two arms carry disjoint halves, so with 24 every frame in the stream is unique, where the 12 landscape stand-ins double four of them · replaces the 12 landscape stand-ins in FRAMES (shared.tsx) and retires the per-frame crop table in river.tsx.",
    "12 event photographs as 4:5 portraits, 720 x 900, one grade, 15 to 60 KB webp each, from the same shoot as the squares · ASSETS row 12, already requested and unchanged; the portrait third of row 3 or row 7 would serve instead and may be cheaper to unpark · replaces the portrait cards (wf 0.8) in CARD_POOL, which are cropped out of landscapes today.",
    "Nothing else is a picture. The one ask left is the shell's: the demo event's live media count, as a number the hero can render (a demoCount prop beside qrUrl, from a build-time count on the demo event or the RPC the guest page already uses) · replaces COUNT_TO, the 248 stand-in, and COUNT_FROM becomes that count minus the arrivals shown.",
    "One idea for the wiring round rather than an ask: if this hero ships, the frames in the stream should BE the demo event's own media (ASSETS row 5, the curated folder). The count is then literally the album the stream renders, the line under the CTAs becomes true rather than plausible, and the hero stops illustrating the product and starts being it.",
  ],
  render: (p) => <River {...p} />,
};
