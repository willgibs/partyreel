"use client";

// the concept's own sheet; it leaves with the board when the ruling lands.
import "./river.css";

import Link from "next/link";
import { type CSSProperties, useEffect, useRef } from "react";

import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import { Caption } from "@/components/marketing/system/caption";
import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

import {
  CANVAS,
  type Concept,
  type ConceptProps,
  type CopyMode,
  FRAMES,
  LADDER,
  type Mode,
  Photo,
  copyFor,
} from "./shared";

/**
 * THE RIVER (concept 4 of the home-hero board; round three's variation 4, on
 * the axis THE ORIGIN AT THE TOP AND THE PAGE AS THE ALBUM. This is the
 * track's round three, 2026-09-14.)
 *
 * The argument. The source put the code at the exact centre and made the album
 * a horizontal corridor around it: the still centre of a moving album. That
 * answers "where does the type live" beautifully, but it also makes the hero a
 * self-contained object, a diagram of the product sitting in the middle of a
 * page. The river asks the next question instead: if the scan is where
 * everything starts, the code belongs where a page starts. So the code moves
 * to the TOP, into the slot an eyebrow would occupy, and the album pours DOWN
 * out of it: frames are born behind the card, fall, grow, straighten, open
 * around the words, close again under them, and dissolve through the hero's
 * bottom and side edges into the rest of the page. The page is not a page with
 * an album in it. The page IS the album the scan started, and the hero is only
 * its first screen.
 *
 * WHAT ROUND THREE CHANGED, and why. Round two was walked cold at both
 * canvases the way Will will walk it, and the desktop failed its own sentence.
 * Three things were wrong and all three had one root: the stream's lateral law
 * was written against the CLOCK, while everything a reader sees is written
 * against the FALL.
 *
 *  1. THE POUR NOW STARTS AT THE CODE. The arm's fan used to open over the
 *     first fifth of the FLIGHT, and because the fall is gravity-weighted a
 *     fifth of the flight is a tenth of the distance: the album was fully
 *     fanned 96 px below the card, so nothing ever came out from behind it and
 *     the top of the hero read as a code alone with photographs beside it. The
 *     fan now opens over the first third of the DISTANCE, so the first three
 *     or four frames are still inside the card's own width and the album
 *     visibly slides out of the object it was born in.
 *  2. THE CLEARING TAKES THE LOCKUP'S OWN SILHOUETTE. It used to be one
 *     rectangle 800 px wide across the whole block, which is the width of the
 *     headline's first line applied to the count as well: every card was
 *     pinned to the same wall for two thirds of its fall, so the lanes
 *     collapsed into two ruled columns at the canvas edges and the concept's
 *     own claim, the album opens around the headline and closes under it, was
 *     never actually on screen. The clearing is now the type's measured ink,
 *     row by row: 350 at the headline's first line, 295 at its second, 254 at
 *     the subhead, 160 at the buttons, 110 at the count. The banks open around
 *     the headline and visibly close again as the type narrows.
 *  3. THE STREAM NO LONGER HAS GAPS. The cadence divided the album into eight
 *     launches per arm against a nine-and-a-half-launch flight, so a fifth of
 *     the cards were on the ground at any moment and the hero's top band
 *     carried three frames. The cadence now divides the flight exactly, so
 *     every frame is airborne and gravity does the spacing: dense at the code,
 *     open at the bottom, which is the shape of a river and not of a queue.
 *
 * And one thing was cut. Round two built the caption line two ways, printed on
 * the card and floating above a bare plate, and put a chip on the stage so
 * both could be ruled with both in view. Walked cold, the floating line loses
 * plainly: the plate is a naked square with no object around it, the line
 * belongs to nothing, and the chip is the only thing on the canvas that is not
 * the composition, which a stranger reads as product UI. So the card is the
 * only build now and the chip is gone. It is still a one-word ruling (see the
 * departures); it is just no longer a control Will has to discover.
 *
 * Phone-first, which is the real reason for the axis. A vertical stream is
 * what a 375 screen is shaped for: the source's corridor has to compress two
 * horizontal rows into one strip there, while a river only gets narrower. The
 * phone is its own composition: ONE braided lane of large frames pouring out
 * of the card and dissolving into the headline, because a full-measure h1 at
 * 375 leaves no corridor beside it. The clearing still runs underneath (one
 * expression on both canvases) but the album has dissolved 22 px above the
 * headline's ink, so on the phone it is a guarantee nobody ever sees fire,
 * which is the honest description of it.
 *
 * The mechanism, one expression. A card's progress is a closed form of the
 * clock, ((slot + phase) * launch * reveal + t) mod cycle / flight, where t is
 * the clock after the hold. That is the source's lesson kept exactly: no
 * state, no timers, no per-card bookkeeping, and the recycling falls out of
 * the modulo. Everything else is that one number:
 *
 *   fall   0.6p^2 + 0.4p        gravity, so a frame leaves the code slowly
 *                               and is three times quicker at the bottom;
 *   scale  sMin to 1 over the   a frame is about the card's width when it
 *          distance fallen      emerges and its full size by the bottom edge,
 *                               so its box is never rasterized above 1:1;
 *   angle  rz decaying to a     it tumbles out of the code and lands square;
 *          third
 *   x      spread * open(fall)  its own lane, fanning out of the code over the
 *          + the clearing       first third of the DISTANCE, plus the
 *                               clearing: while a card's box could overlap the
 *                               lockup, its projected inner edge is held on
 *                               the type's own silhouette at the heights the
 *                               card actually spans. The clearing is therefore
 *                               a geometric guarantee rather than a hope, and
 *                               it is the SHAPE OF THE WORDS, so the album
 *                               opens where the headline is wide and closes
 *                               where the buttons are narrow.
 *
 * That last line is what makes the river a river. No scrim, no darkening
 * layer, no lamp. The white card and the photographs are the only light in the
 * room.
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
 * effect. Long enough to read the card, short enough that nobody waits.
 */
const HOLD_MS = 620;
/** The right arm launches half a cadence after the left, so the two arms
 *  alternate instead of falling as mirrored pairs. */
const ARM_PHASE = 0.5;
/** The stand-in album count: it starts here, ticks once per arrival and stops
 *  at COUNT_TO. Never a real figure; see the departures. */
const COUNT_FROM = 241;
const COUNT_TO = 248;
/** Slack between the type's ink and the nearest frame edge, in canvas px. */
const SAFE = 14;
/**
 * How much of the DISTANCE fallen the arm's fan opens over, and how much of it
 * passes before the clearing may push a frame sideways at all.
 *
 * ★ Both were fractions of the FLIGHT in round two, and that was the round's
 * central defect. The fall is gravity-weighted, so a fifth of the flight is a
 * tenth of the distance: a fan that "opens over the first fifth" was fully
 * open 96 px below the code, which is why nothing ever appeared to come out of
 * it. Anything a reader perceives as a SHAPE belongs to the distance.
 */
const OPEN = 0.34;
const BIRTH = 0.06;

/** The line under the code. Present tense, one breath, about something
 *  arriving (docs/specs/brand-voice.md). */
const CODE_LINE = "Scan it. The album is live.";

/* ── Geometry ── */

/**
 * ONE KNOT OF THE LOCKUP'S SILHOUETTE: at canvas height `y`, the album keeps
 * its inner edge `w` from the page's axis. The profile between two knots is a
 * smoothstep, which is MONOTONE, so the largest half-width over a card's
 * vertical extent is always at one of its two ends or at a knot inside it.
 * That is what makes the clearing an exact guarantee and not a sample of one.
 */
type Knot = { y: number; w: number };

type Geo = {
  /** The QR's edge in px, quiet zone included. */
  qr: number;
  /** Where the QR's CENTRE sits on the canvas, and therefore where every frame
   *  is born. */
  originY: number;
  /** The lockup's silhouette, per copy mode: the clearing the album opens
   *  around. Measured off the rendered INK of the type at this canvas, not off
   *  its layout boxes, because a line box at leading 1.02 is shorter than the
   *  face's own ascent plus descent and the glyphs stand about 9 px proud of
   *  it at text-8xl. The measuring probe is quoted in the track's manifest. */
  lock: Record<CopyMode, Knot[]>;
  /** How far (in px of fall) the clearing ramps in above the block and out
   *  below it. */
  enter: number;
  release: number;
  /** The card's DOM box: its LARGEST visible size, so scale never exceeds 1. */
  card: number;
  /** The scale a frame has as it emerges from behind the code. */
  sMin: number;
  /** An arm's inner and outer lane at full fan, before any clearing. */
  spreadIn: number;
  spreadOut: number;
  /** The extra px a card holds off the clearing's wall, at most. A ruled line
   *  of photographs is the thing this prevents. */
  ragged: number;
  /** The fall at progress 1, in px. */
  travel: number;
  /** The fall fraction at which scale reaches 1. */
  fullAt: number;
  /** One card's life, and the gap between two launches in the same arm.
   *  ★ POOL * launch (the cycle) is deliberately a hair SHORTER than the
   *  flight, so every card in the pool is always airborne and the stream has
   *  no gaps; gravity then does the spacing for free. */
  flight: number;
  launch: number;
  /** Canvas-relative, never a vw value: the stage is zoomed. */
  sizes: string;
  /** The type's measures, tuned so both copies break into the SAME shape at a
   *  canvas (two headline lines and a two-line subhead on the desktop), which
   *  is what lets one measured silhouette serve both. */
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
   *  of the hero (88 to 100); the phone dissolves it just above the headline
   *  (32 to 46), because a full-measure h1 at 375 leaves no corridor beside it
   *  and the clearing would otherwise read as cards flung out of the way. */
  fadeB0: string;
  fadeB1: string;
  /** The canvas y past which the bottom dissolve has taken the stream to zero.
   *  Derived from fadeB1, not typed by hand: the loop stops writing a card's
   *  transform below it, because nothing there can be seen. */
  deadY: number;
};

/**
 * THE DESKTOP SILHOUETTE, measured off the rendered ink of both copies at the
 * 1440 canvas (the probe is in the manifest; every number here came off the
 * page rather than out of a designer's head):
 *
 *   ruled     line 1  420..535  half 348   line 2  518..633  half 270
 *             subhead 662..704  half 272 and 169
 *             buttons 742..786  half 145   count   804..820  half 106
 *   proposed  the same block shape, narrower lines, once the h1 was cut to
 *             hold two lines at the xl step and the subhead's measure to 500.
 *
 * Each row is held FLAT across its own band so a frame cannot cut a corner,
 * and the interpolation between rows is the opening and the closing. Both
 * copies land on one table because they are now the same shape; if the copy
 * changes so that a line count changes, re-measure, because this table is the
 * only thing in the concept that is not derived.
 */
const LOCK_DESKTOP_ROWS: Knot[] = [
  { y: 418, w: 350 }, // the headline's first line, the widest thing on the page
  { y: 540, w: 350 }, //   ink 421.8..537, half 348 ruled / 297 proposed
  { y: 556, w: 295 }, // its second line
  { y: 640, w: 295 }, //   ink 519.7..634.9, half 270 ruled / 291 proposed
  { y: 656, w: 254 }, // the subhead
  { y: 710, w: 254 }, //   ink 662.4..704.8, half 249 ruled / 244 proposed
  { y: 740, w: 160 }, // the two buttons
  { y: 792, w: 160 }, //   box 745.1..789.1, half 150 ruled / 156 proposed
  { y: 802, w: 110 }, // the count
  { y: 826, w: 110 }, //   ink 807.1..823, half 106 in both
];

/** THE PHONE'S CLEARING is one flat band, deliberately: the album has
 *  dissolved at 46% of the canvas, 22 px above the headline's ink, so
 *  no frame is ever visible inside the block and a measured silhouette there
 *  would be precision nobody can see. It is kept as the guarantee, at the
 *  widest row of either copy, so the mechanism is one expression on both
 *  canvases and a retuned dissolve cannot open a hole in it. */
const LOCK_PHONE_ROWS: Knot[] = [
  { y: 370, w: 168 },
  { y: 720, w: 168 },
];

const GEO: Record<Mode, Geo> = {
  desktop: {
    qr: 124,
    // High enough that the code reads as an eyebrow, low enough that the card
    // and its line clear the header's line above it.
    originY: 140,
    lock: { ruled: LOCK_DESKTOP_ROWS, proposed: LOCK_DESKTOP_ROWS },
    // 150 px of fall. Longer and the clearing starts pushing while a frame is
    // still inside the card, which is the round-two failure in a second
    // costume; shorter and the opening is a fling. At 150 a frame is still
    // within the card's own width at y 223 and clear of the headline by 343.
    enter: 150,
    release: 160,
    card: 340,
    sMin: 0.32,
    spreadIn: 116,
    spreadOut: 330,
    ragged: 90,
    travel: 990,
    fullAt: 0.8,
    flight: 9800,
    // 9800 / 8 = 1225, so 1200 puts the cycle just inside the flight and every
    // card is always in the air.
    launch: 1200,
    sizes: "360px",
    h1Max: 740,
    // 500 rather than round two's 560: at 560 the proposed subhead set as ONE
    // 82-character line, which is a bad measure AND a different block shape
    // from the ruled copy's two lines, and the silhouette above is one table.
    subMax: 500,
    gapSub: 34,
    gapCta: 34,
    gapCount: 18,
    fadeX: "7%",
    fadeB0: "88%",
    fadeB1: "100%",
    deadY: CANVAS.desktop.h,
  },
  // THE PHONE IS ITS OWN COMPOSITION, not the desktop squeezed. Everything it
  // has is spent on ONE THING: the band between the code and the headline, a
  // quarter of the screen, is where this concept has to be won at 375.
  //
  //   the band     the card's bottom (178) to the headline (372)
  //   the cadence  515 ms between arrivals across the two arms, which puts
  //                five or six frames in the band at any moment
  //   the size     133 px wide as it clears the card, 176 px by the headline,
  //                which is the whole reason the flight is short: a frame is
  //                never a thumbnail here
  phone: {
    qr: 96,
    originY: 104,
    lock: { ruled: LOCK_PHONE_ROWS, proposed: LOCK_PHONE_ROWS },
    // Four pixels, which on this canvas means the clearing never fires at all:
    // the dissolve is complete at y 350 and the headline's ink starts at 372,
    // so a frame's visible box can never reach the type, with 22 px to spare.
    // It is kept as the guarantee rather than deleted, because it re-arms by
    // itself if the dissolve is ever retuned to end below the words.
    enter: 4,
    release: 160,
    card: 186,
    // High, and the phone's most consequential number: a frame is 102 px as it
    // sits inside the card, 139 as it clears its bottom edge and 186 by the
    // time it dissolves. The desktop can afford a speck at the code because it
    // has 990 px of fall to grow in; the phone has 200, so it starts big.
    sMin: 0.55,
    // A narrow braid, so the two arms read as one lane rather than two
    // columns: at 375 there is no room for two of anything.
    spreadIn: 26,
    spreadOut: 88,
    ragged: 34,
    travel: 470,
    fullAt: 0.4,
    flight: 8400,
    // 8400 / 8 = 1050, so 1030 keeps every card in the air here too.
    launch: 1030,
    sizes: "200px",
    // 336 of the 343 the site's own 16 px gutters leave: at 316 the ruled
    // thesis broke "The whole / event, in / one album." and text-balance can
    // only even out what the measure allows.
    h1Max: 336,
    subMax: 330,
    gapSub: 22,
    gapCta: 22,
    gapCount: 14,
    fadeX: "10%",
    fadeB0: "32%",
    fadeB1: "46%",
    deadY: CANVAS.phone.h * 0.46,
  },
};

/** The code object's own box: one white CARD holding the code and its line,
 *  which is the object an event actually puts on a table. The QR's CENTRE sits
 *  at geo.originY, which is where every frame is born. */
const PLATE_PAD = 10;
const PLATE_GAP = 8;

function codeBlockTop(geo: Geo) {
  return geo.originY - (PLATE_PAD + geo.qr / 2);
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

/** The arm's own fan, over the first third of the DISTANCE fallen. Most of the
 *  stream's width is this, not the clearing, which is what keeps the lateral
 *  motion reading as a delta spreading rather than as cards thrown aside when
 *  the words arrive. */
const openAt = (fall: number) => smoothstep(0, OPEN, fall);

/** Nothing pushes a frame sideways while it is still inside the code. Without
 *  this the clearing is already ramping at the birth point and frames appear
 *  BESIDE the code instead of sliding out from behind it, which is the whole
 *  read. */
const birthAt = (fall: number) => smoothstep(0, BIRTH, fall);

/** The lockup's half-width at one canvas height. Constant-extended past both
 *  ends, so the ramps below own the entering and the leaving. */
function profileAt(lock: Knot[], y: number) {
  if (y <= lock[0].y) return lock[0].w;
  const last = lock[lock.length - 1];
  if (y >= last.y) return last.w;
  for (let i = 1; i < lock.length; i++) {
    const a = lock[i - 1];
    const b = lock[i];
    if (y <= b.y) {
      const t = (y - a.y) / (b.y - a.y);
      return a.w + (b.w - a.w) * (t * t * (3 - 2 * t));
    }
  }
  return last.w;
}

/** The widest the lockup gets anywhere over a card's own vertical extent. The
 *  profile is monotone between knots, so checking the two ends and any knot
 *  between them is EXACT: this is the guarantee, not an approximation of it. */
function wallOver(lock: Knot[], top: number, bot: number) {
  let m = Math.max(profileAt(lock, top), profileAt(lock, bot));
  for (const k of lock) if (k.y > top && k.y < bot && k.w > m) m = k.w;
  return m;
}

/**
 * 1 exactly while a card's VISIBLE box [boxTop, boxBot] overlaps the lockup's
 * band [top, bot], ramping in `enter` px of fall above it and out `release` px
 * below. Written against the box's two edges rather than its centre and half,
 * because the box that matters is the CLIPPED one: everything below the bottom
 * dissolve's last stop has already been taken to zero, so it cannot be over a
 * word and must not be pushed as if it were.
 *
 * ★ That clipping is what fixes the phone. The album there dissolves 22 px
 * ABOVE the headline's ink, so no visible part of any frame can ever
 * reach the type, and the clearing correctly never fires: round two pushed
 * frames off the side of a 375 canvas at 83 percent opacity because the gate
 * was reading the card's whole box, most of which was already invisible. The
 * guarantee is not weakened by this, it is stated properly, and it re-arms by
 * itself the moment the dissolve is retuned to end below the type.
 */
function gate(
  boxTop: number,
  boxBot: number,
  top: number,
  bot: number,
  enter: number,
  release: number,
) {
  if (boxBot <= boxTop) return 0;
  return (
    smoothstep(top - enter, top, boxBot) *
    (1 - smoothstep(bot, bot + release, boxTop))
  );
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
  /** Position in its own arm: the launch order and the seed, jittered by up to
   *  a sixth of a cadence so the stream is not a metronome. */
  slot: number;
  /** The right arm's half-cadence offset. */
  phase: number;
  photo: number;
  /** Where between the arm's inner and outer lane this card runs, 0 to 1. */
  lane: number;
  /** Width factor: 1 is a square, 0.8 a 4:5 portrait. Heights are equal before
   *  the size jitter, so the stream's rhythm stays even while the shapes vary. */
  wf: number;
  /** Per-card size, 0.82 to 1 of the canvas's card. */
  sJit: number;
  /** 0..1 of geo.ragged: the extra this card holds off the clearing's wall, so
   *  the bank is ragged and not a ruled line. */
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
      // ± a sixth of a cadence. The cycle is unchanged (the offsets only move
      // inside it), so the stream still has no gaps, but the two arms stop
      // arriving on a perfect alternation, which was the one thing about the
      // steady state that read as machinery rather than as an album.
      slot: slot + (hash01(g + 517) - 0.5) * 0.34,
      phase: right ? ARM_PHASE : 0,
      photo: slot + (right ? half : 0),
      lane: j,
      wf: jj < 0.45 ? 0.8 : 1,
      sJit: 0.82 + j4 * 0.18,
      wall: hash01(g + 421),
      // Wide, because the angle now DECAYS: it is spent at the top of the
      // stream, where a frame is small and reads as paper leaving a slot, and
      // it is nearly gone by the time it is large.
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
 * The TOPMOST pixel a card can put on the page at this progress: its centre,
 * minus the half-height of the TUMBLED box (a rotated frame reaches higher
 * than its layout box, so the flat half would cut it early).
 *
 * ★ This, and never the centre, is what the loop's dead-line test asks for. A
 * card is laid out and scaled about its own centre, so a centre-past-deadY
 * test throws away the whole upper half of a frame at the moment it fires:
 * on the desktop that is 150 to 165 px of a 340 px photograph still standing
 * where the mask is fully opaque, gone in one frame, roughly every 0.6 s. The
 * cut is only free when NOTHING of the card is above the dissolve's last stop.
 */
function topEdgeAt(c: Card, p: number, geo: Geo) {
  const fall = fallAt(p);
  const s = geo.sMin + (1 - geo.sMin) * clamp01(fall / geo.fullAt);
  const rad = (angleAt(c, p) * Math.PI) / 180;
  const half =
    (boxH(c, geo) * s * Math.abs(Math.cos(rad)) +
      boxW(c, geo) * s * Math.abs(Math.sin(rad))) /
    2;
  return geo.originY + fall * geo.travel - half;
}

/**
 * The whole composition for one card at one progress. The clearing is the only
 * clever part: the push is the |x| at which this card's PROJECTED inner edge
 * touches the lockup's silhouette at the heights the card actually spans, so
 * holding it there keeps the corridor the SHAPE OF THE WORDS however large the
 * frame has grown, and no frame can ever be under a word.
 */
function place(c: Card, p: number, geo: Geo, lock: Knot[]) {
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
  const halfH = h / 2;

  const base =
    (geo.spreadIn + c.lane * (geo.spreadOut - geo.spreadIn)) * openAt(fall);
  // ONE clearing, the lockup's. The code needs none: a frame is born BEHIND it
  // and is occluded until it clears the card's own bottom edge, which is why
  // the line can be printed under the code without the stream having to bow
  // around it.
  // The card's VISIBLE box: nothing below the bottom dissolve's last stop is
  // on the page at all, so the clearing is asked about that box and not about
  // the one the layout gives.
  const boxTop = y - halfH;
  const boxBot = Math.min(y + halfH, geo.deadY);
  const need =
    wallOver(lock, boxTop, boxBot) + halfW + SAFE + c.wall * geo.ragged;
  const band =
    gate(
      boxTop,
      boxBot,
      lock[0].y,
      lock[lock.length - 1].y,
      geo.enter,
      geo.release,
    ) * Math.max(0, need - base);

  const x = c.dir * (base + birthAt(fall) * band);
  const dy = y - geo.originY;
  // Rounded so the server's string and the browser's agree exactly: Math.cos
  // is not bit-identical across engines and this string is server-rendered.
  return `translate3d(${x.toFixed(2)}px, ${dy.toFixed(2)}px, 0) rotate(${deg.toFixed(2)}deg) scale(${s.toFixed(4)})`;
}

/** Frames fade up while they are still behind the code, so one slides out of
 *  the card rather than switching on beside it. The far end of the stream is
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
 * It is one white CARD holding the code and its line, which is what actually
 * sits on a table at an event. The line is ink on the card, which is the SAME
 * scanner-contrast exception the plate itself is (documented in
 * footer-qr.tsx): the token set has no "ink on a white plate in a dark room"
 * pair, and inventing one for a lab concept would be a worse answer than using
 * the exception that already exists.
 */
function CodeCard({ url, size }: { url: string | null; size: number }) {
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

/** The outline button, which goes where the code goes. Round two left it
 *  inert, and on a board an inert button reads as a control that does nothing:
 *  a stranger presses this one FIRST, because it is the one that says show me. */
function SecondaryCta({ url, label }: { url: string | null; label: string }) {
  const cls =
    "h-11 border-white/35 bg-white/5 px-5 text-base text-white hover:border-white/50 hover:bg-white/15 hover:text-white";
  if (!url)
    return (
      <Button size="lg" variant="outline" className={cls}>
        {label}
      </Button>
    );
  return (
    <Button asChild size="lg" variant="outline" className={cls}>
      <Link href={url}>{label}</Link>
    </Button>
  );
}

function River({ mode, copy, qrUrl }: ConceptProps) {
  const geo = GEO[mode];
  const lock = geo.lock[copy];
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
        const c = CARD_POOL[i];
        const at = p[i];
        // Two ways a card is not worth a write: it is on the ground between
        // flights, or its TOP EDGE has fallen past the point the bottom
        // dissolve has already taken to zero, which is the first moment none
        // of it can be seen. The second is the performance pass's real cut: on
        // the phone the mask is complete at 46% of the canvas, so a quarter of
        // the airborne cards would be writing transforms nobody can see. Cheap
        // to skip, and exact, because the dissolve's end and the fall are both
        // numbers this file already owns.
        //
        // ★ The test is the EDGE, not the centre. Round two wrote it against
        // the centre and it read as frames popping out of existence near the
        // bottom of the stream: at the cut a desktop card's top edge was at y
        // 763..779, where the mask is still at alpha 1, so 150 to 165 px of a
        // 340 px photograph vanished in one frame, about every 0.6 s. Asking
        // topEdgeAt costs 1.7 more card writes per frame on the desktop and
        // 2.3 on the phone (0.0044 ms each, measured), and it is the price of
        // the sentence the comment above was already making.
        if (at > 1 || topEdgeAt(c, at, geo) > geo.deadY) {
          if (lastO.current[i] !== 0) {
            el.style.opacity = "0";
            lastO.current[i] = 0;
          }
          continue;
        }
        el.style.transform = place(c, at, geo, lock);
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
  }, [geo, lock, reduced]);

  return (
    <div
      ref={rootRef}
      className="relative size-full overflow-hidden bg-background"
    >
      {/* THE STREAM. Full bleed and decorative: the album is the argument, but
          it is the code at the top and the type in the clearing that carry the
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
        {/* hhv-delta: round three's stream, the one that opens over the
            DISTANCE fallen and takes the lockup's silhouette. */}
        <div className="hhv-flow hhv-delta">
          {CARD_POOL.map((c, i) => {
            // The REST state, written as custom properties the sheet reads: the
            // stream standing at its steady-state spacing, which is what reduced
            // motion, a crawler and the server's own HTML get. It is the loop's
            // own expression with the reveal finished and the clock at zero, so
            // the rest state cannot drift from the running one; the modulo is
            // what the loop uses and what keeps a card whose slot jitter went
            // negative at the bottom of the fall rather than above the code.
            const seed =
              mod((c.slot + c.phase) * geo.launch, POOL * geo.launch) /
              geo.flight;
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
                    "--hhv-rest": place(c, seed, geo, lock),
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
        style={{ top: codeBlockTop(geo) }}
      >
        <CodeCard url={qrUrl} size={geo.qr} />
      </div>

      {/* THE LOCKUP, in the clearing the stream opens around. At paint, at full
          opacity, gated by nothing (bible 13), and never over a photograph:
          the frames hold their inner edges on this block's own silhouette, so
          there is no scrim here and there never needs to be one. The block's
          top is the silhouette's first knot plus the ink overshoot, so the two
          can never drift apart. */}
      <div
        className="absolute inset-x-0 z-10 text-center"
        style={{ top: lock[0].y + 11 }}
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
          <SecondaryCta url={qrUrl} label={text.secondary} />
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
    </div>
  );
}

export const river: Concept = {
  id: "river",
  n: 4,
  name: "The river",
  rationale:
    "The origin at the top and the page as the album: the code takes the slot an eyebrow would, and the album pours down out of it, born behind the card, growing and straightening as it falls, opening around the headline, closing again under the buttons and dissolving through the hero's bottom and side edges into the rest of the page. Round three rebuilt the lateral law against the DISTANCE fallen rather than the clock, which is what finally puts the first frames inside the code's own width, and gave the clearing the lockup's measured silhouette instead of one rectangle, so the album is the shape of the words. The caption line is built one way only now, printed on the card, and the lab chip that carried the alternative is gone.",
  eyebrow:
    'The code itself at the top of the page, where an eyebrow sits: one white card holding the QR and one line, "Scan it. The album is live." That is the object an event puts on a table, and the album is born behind it and slides out from under it.',
  proposed: {
    h1: "One code, and the album fills.",
    subhead:
      "Every phone in the room finds it and uploads at full size, with nothing to install.",
    secondary: "See a real album",
  },
  departures: [
    "THE AXIS, and the one real argument with the source: the code leaves the exact centre. The source's case was the still centre of a moving album, and it is a good one; this trades it for causality read top to bottom. A code in the middle of a composition is an object the page is arranged around, and a stranger reads it as a thing to scan for more information. A code at the TOP, in the eyebrow's slot, with the album falling out of it, is a beginning: everything below it is what the scan produced, which is the sentence the hero was asked to say. The stillness survives the move, and nothing about the card animates. The lockup is centred rather than left-aligned for the same reason, which is precedent and not law: left-aligning costs the symmetry of the two arms, not the mechanism.",
    "THE LINE UNDER THE CODE is printed on the card, and that is now the only build. Round two put both on the stage under a chip, a printed line and a line floating above a bare plate; walked cold the floating one loses plainly, so the chip is gone rather than left for Will to find, because it was also the one thing on the canvas that was not the composition. Say \"above\" and it comes back in a line: the mechanism does not care, it is the object that changes, and round one's argument against a line under a FLOATING plate (every frame has to escape sideways before it has fallen a card's height) is exactly what putting the line inside the white object dissolves.",
    'THE COUNT under the buttons is a STAND-IN figure (241, ticking to 248, then held). It earns its place as the evidence for the line above it, because "See a real album" is a claim and a number still arriving is the proof, and the voice guide allows a count only where the product actually produced the number (docs/specs/brand-voice.md). So it is wired or it goes: before this is anywhere near production it reads the demo event\'s real media count. Flagged on the board rather than in a footnote, because a number nobody can stand behind is a claim and not a placeholder. It is the only invented number on this board; every other number in the concept was measured off the page. And it is not the only count on the page: the decomposition band two sections below already ships "Built from 214 photos. Shot by 23 guests.", which the voice board raised as a finding this round, and the guide allows one source and one pair of numbers on a page, not two. So the ruling is really keep it and read it from the same demo event the band reads, or drop it here and let the band carry the proof alone.',
    "BIBLE 13, decorative layer only: the stream's pre-pour state (every frame collapsed at the code) and the ticking count both sit inside the reduced-motion block, so with JavaScript off and motion allowed the stream rests at the code and the count shows its starting figure. Putting either in an effect instead would paint the album deployed and then snap it back. The h1, the code, the line, the subhead, the buttons and the count's settled figure are plain markup and never gated, and a reader who asked for less motion gets the stream fully deployed and the settled number. What this board took from the first wave, recorded here because there is no other row for it: the light spec's LIFT carries the cards' overlap at its cinema alphas (docs/specs/light.md), the voice guide's hero shape and its two-beat sentence wrote the proposed copy (docs/specs/brand-voice.md), and the media kit's \"readable at 120 px\" test is what the asks are written against (docs/specs/media-kit.md). This concept has no CSS-paste candidate and so offers no \"Apply to the site\" block: its ruling lands as a hero component in the wiring round, not as tokens.",
  ],
  assets: [
    "24 event photographs as 512 x 512 squares, one grade, 6 to 35 KB webp each, framed tight enough to read at 110 px, which is the size a frame is as it leaves the code · ASSETS row 2, already requested and unchanged, and it is the SAME row the media kit's call sheet asks for (1:1 crops of that board's 36-frame shoot, codes W1 to T6, not a second setup), so this is one ask across two boards and Will answers it once: the two arms carry disjoint halves, so with 24 every frame in the stream is unique, where the 12 landscape stand-ins double four of them · replaces the 12 landscape stand-ins in FRAMES (shared.tsx) and retires the per-frame crop table in river.tsx.",
    "12 event photographs as 4:5 portraits, 720 x 900, one grade, 15 to 60 KB webp each, from the same shoot as the squares · ASSETS row 12, already requested and unchanged, and again the media kit's call sheet asks for this row as 4:5 recrops of the same masters, so it costs no extra shooting; the portrait third of row 3 or row 7 would serve instead and may be cheaper to unpark · replaces the portrait cards (wf 0.8) in CARD_POOL, which are cropped out of landscapes today.",
    "Nothing else is a picture. The one ask left is the shell's: the demo event's live media count, as a number the hero can render (a demoCount prop beside qrUrl, from a build-time count on the demo event or the RPC the guest page already uses) · replaces COUNT_TO, the 248 stand-in, and COUNT_FROM becomes that count minus the arrivals shown. Better still, and the recommendation: if this hero ships, the frames in the stream should BE the demo event's own media (ASSETS row 5, the curated folder), so the count is literally the album the stream renders and the hero stops illustrating the product and starts being it.",
  ],
  render: (p) => <River {...p} />,
};
