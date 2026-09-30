import { CANVAS, type Mode } from "@/components/lab";

/**
 * THE PRIVACY HERO, ROUND FOUR: THE VEIL AS DRAWN AND THREE REAL VARIATIONS
 * OF IT, PURE DATA (2026-09-29).
 *
 * Round three (docs/reviews/privacy-hero.json) answered `concept=veil`: "This
 * feels super bespoke to 'privacy', where it's only revealing what it wants
 * to. Really cool concept. Would love to keep this original plus 3 variations
 * to nail it." The sealed cards left ("Don't like the sealed cards at all");
 * the sweep and the aperture are banked for other surfaces: their last code
 * is round three's `concepts.ts`, `concepts-layer.tsx` and `concepts.css` in
 * this folder at `cdc979a6` (`git show cdc979a6:<path>`), which ROADMAP's
 * line on the two runners-up points at.
 *
 * ★ A VEIL IS FOUR ANSWERS, AND EACH OPTION GIVES ALL FOUR: what the clearing
 * is, how it moves and whether it rests, what sits under the veil, and what
 * the veil is made of. `drift` is round three's answer to all four, kept as it
 * stands; `lens`, `beam` and `glimpse` each move three or four of them at
 * once, because an option that moved one would be a tuning of the original
 * rather than a contender for the pick (docs/PROGRAM.md).
 *
 *            the clearing         how it moves             under it        the veil
 *   drift    a 230px window       drifts, never rests      one photograph  blur, in a disc
 *   lens     a clear round pane   glides, rests on things  one photograph  the lightbox's ground
 *   beam     a tall soft band     one slow pass, then on   three in turn   the dark, and grain
 *   glimpse  soft round spots     opens in place, closes   one photograph  blur, full-bleed
 *
 * ★ THE PHOTOGRAPH IS THE KNOB'S (`knobs.ts`), THE SAME UNDER ALL FOUR, so the
 * veil is what differs. The lens's rests and the glimpses' spots were placed
 * on the default still (a toast under string lights: the window light, the
 * strings of bulbs, the flowers, the glasses on the table) and are clear of
 * the words by geometry, whatever still is under them.
 *
 * ★ THE WORDS ARE CLEAR OF EVERY PLACE A VARIATION SETTLES, BY CONSTRUCTION:
 * every lens rest and every glimpse is a circle `veils.test.ts` holds clear of
 * the lockup's ink box and inside the canvas at both widths, so a retune that
 * settles a clearing under a word turns a test red. What only passes behind
 * the words (a lens between rests, the beam) passes under the scrim, and the
 * words' contrast over each whole loop is measured on the rendered frames, not
 * assumed (the manifest's Handoff names the numbers).
 *
 * Pure: no React, no stylesheet, so `veils.test.ts` (a node test) imports it,
 * and the keyframes the picture runs are written from these numbers.
 */

export type VeilId = "drift" | "lens" | "beam" | "glimpse";
export const VEILS: readonly VeilId[] = ["drift", "lens", "beam", "glimpse"];

/* ── Rectangles and circles, and whether they miss ──────────────────────── */

export type Rect = { x0: number; y0: number; x1: number; y1: number };
export type Spot = { x: number; y: number };

export const rectAround = (
  cx: number,
  cy: number,
  w: number,
  h: number,
): Rect => ({ x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2 });

/** How far a point is from a box (0 inside it). */
export const distanceToRect = (p: Spot, r: Rect): number => {
  const dx = Math.max(r.x0 - p.x, 0, p.x - r.x1);
  const dy = Math.max(r.y0 - p.y, 0, p.y - r.y1);
  return Math.hypot(dx, dy);
};

/** A circle of diameter `d` misses a box when its centre is further than its
 *  radius from it. */
export const circleClear = (c: Spot, d: number, r: Rect): boolean =>
  distanceToRect(c, r) >= d / 2;

/** A circle sits inside the canvas, whole, and below the header. */
export const circleInside = (c: Spot, d: number, mode: Mode): boolean =>
  c.x - d / 2 >= 0 &&
  c.y - d / 2 >= HEADER_PX &&
  c.x + d / 2 <= CANVAS[mode].w &&
  c.y + d / 2 <= CANVAS[mode].h;

/**
 * THE LOCKUP'S INK BOX, carried from rounds two and three (measured to the
 * ink on the rendered `PageHero` at scale `lg` with the privacy page's own
 * words) and read again this round off the frames: the copy, the scale and
 * the component are unchanged. Re-measure if the copy changes (bible 10: copy
 * is open).
 */
export const LOCKUP: Record<Mode, { w: number; h: number; cy: number }> = {
  desktop: { w: 706, h: 346, cy: 497 },
  phone: { w: 300, h: 359, cy: 412 },
};

export const lockupRect = (mode: Mode): Rect => {
  const l = LOCKUP[mode];
  return rectAround(CANVAS[mode].w / 2, l.cy, l.w, l.h);
};

/** The site header's height over the hero (`--mkt-header-h`, 4rem): nothing
 *  settles under the nav either. */
export const HEADER_PX = 64;

/** How far anything a variation settles on stays from the words' ink box,
 *  at least, px: never touching, so a rest never reads as a frame round a
 *  word. */
export const CLEARANCE_PX = 8;

/**
 * THE VARIATIONS' SCRIM, sized off the lockup: an ellipse this many times the
 * lockup's half-width and half-height, centred on it (`.pvh-scrim`), with a
 * fall under the header. Wider at a phone, where the subhead runs nearly
 * edge to edge and a clearing can only get from above the words to below
 * them by passing behind them.
 */
export const SCRIM: Record<Mode, { rx: number; ry: number; topFall: number }> =
  {
    desktop: { rx: 1.5, ry: 1.6, topFall: 0.16 },
    phone: { rx: 1.9, ry: 1.45, topFall: 0.14 },
  };

export const scrimShape = (mode: Mode) => {
  const l = LOCKUP[mode];
  return {
    rx: Math.round((l.w / 2) * SCRIM[mode].rx),
    ry: Math.round((l.h / 2) * SCRIM[mode].ry),
    cy: l.cy,
    topFall: SCRIM[mode].topFall,
    // The eyebrow is the lockup's first line (its top plus half a label):
    // the smallest words, at the ellipse's thin end, so they get a pool of
    // their own.
    eyebrowY: Math.round(l.cy - l.h / 2 + 10),
  };
};

/* ── The drift: round three's veil, as it stands ────────────────────────── */

/**
 * ROUND THREE'S NUMBERS, UNCHANGED (its `VEIL`, renamed for what it does):
 * one photograph in an 860px disc on the words (480 at a phone), blurred and
 * at 55 percent, with a window of full clarity drifting over it.
 *
 * ★ THE WINDOW DRAWS AS A SQUARE, AND IT STAYS ONE. Its mask is an unsized
 * `radial-gradient(circle, ...)` in a `230px 230px` tile, and an unsized
 * circle reaches to the tile's CORNERS, so at each side's middle the mask is
 * still about two-thirds opaque and the tile's edge cuts it off square
 * (measured on the rendered frame: a square of clarity with softened
 * corners). Round three's words called it a clearing; what he saw and picked
 * was that square, so the original stays byte for byte, and its option says
 * "window". It also drifts behind the words, which round three allowed and
 * the variations do not (the Handoff measures what that costs the subhead).
 */
export const DRIFT = {
  /** The disc's diameter, px. */
  washPx: { desktop: 860, phone: 480 } as Record<Mode, number>,
  blurPx: { desktop: 44, phone: 26 } as Record<Mode, number>,
  /** The blurred base's own opacity. */
  baseOpacity: 0.55,
  /** The window's side, px. */
  windowPx: { desktop: 230, phone: 140 } as Record<Mode, number>,
  /** One full drift through its four waypoints and back, ms. */
  cycleMs: 9000,
};

/** The disc sits on the lockup's own centre, as it always has. */
export const driftCentre = (mode: Mode): Spot => ({
  x: CANVAS[mode].w / 2,
  y: LOCKUP[mode].cy,
});

/* ── The lens: a clear pane in the lightbox's ground ────────────────────── */

/**
 * ONE CLEAR ROUND PANE IN A VEILED PHOTOGRAPH, settling on one thing at a
 * time. The veil is the product's own: `glass-behind`, the ground the
 * lightbox lays over the album behind an open photograph (the album blurred
 * at half brightness), so on this page the whole party sits where the album
 * sits when one photograph is lifted out of it, and the lens is that one
 * photograph's worth of clarity. Its rim is Crystal's double edge, the edge
 * every glass surface in the app wears.
 *
 * ★ IT RESTS ON THINGS, NEVER ON A FACE: the window light and the strings of
 * bulbs above the words, the flowers and the glasses on the table below
 * them. That is the theme in the choosing: the photograph shows the party,
 * and keeps its people.
 *
 * ★ A GLIDE MAY PASS BEHIND THE WORDS; A REST NEVER SITS THERE. The rests are
 * held clear of the lockup by `veils.test.ts`; a glide that crosses it
 * crosses under the scrim, whose plateau keeps the muted lines on near-black.
 */
export const LENS = {
  /** The pane's diameter, px. */
  lensPx: { desktop: 240, phone: 124 } as Record<Mode, number>,
  /** How long it settles on each rest, ms. */
  restMs: 2400,
  /** Its glide speed, px a second: across the top at 1440 or up the side at
   *  375, a glide takes about two seconds either way. */
  pxPerS: { desktop: 420, phone: 190 } as Record<Mode, number>,
  /** No glide is shorter than this, ms. */
  minGlideMs: 1100,
  /** In the order it visits them. */
  rests: {
    desktop: [
      { x: 290, y: 200 },
      { x: 1150, y: 200 },
      { x: 810, y: 800 },
      { x: 400, y: 800 },
    ],
    // At a phone the words run nearly edge to edge, so the rests sit at
    // the screen's edges and the two climbs between them pass beside the
    // eyebrow (its box is 128 to 247) rather than behind it.
    phone: [
      { x: 70, y: 146 },
      { x: 305, y: 146 },
      { x: 305, y: 684 },
      { x: 70, y: 684 },
    ],
  } as Record<Mode, readonly Spot[]>,
};

export type Stop = {
  /** The share of the cycle this stop is reached at, 0 to 1. */
  at: number;
  x: number;
  y: number;
  /** True where a glide leaves this stop (its segment eases); false for a
   *  hold. */
  leaves: boolean;
};

/**
 * THE LENS'S TIMELINE, A PURE FUNCTION OF ITS RESTS. It rests `restMs` on
 * each, then glides to the next at one speed, so a long glide takes longer
 * rather than rushing (an even pace is what reads as calm), with a floor so a
 * short hop still eases. The loop closes on the first rest.
 */
export function lensStops(
  rests: readonly Spot[],
  restMs: number,
  pxPerS: number,
  minGlideMs: number,
): { stops: Stop[]; cycleMs: number; glidesMs: number[] } {
  const glidesMs = rests.map((a, i) => {
    const b = rests[(i + 1) % rests.length];
    const ms = (Math.hypot(b.x - a.x, b.y - a.y) / pxPerS) * 1000;
    return Math.round(Math.max(minGlideMs, ms) / 10) * 10;
  });
  const cycleMs = rests.length * restMs + glidesMs.reduce((s, g) => s + g, 0);
  const stops: Stop[] = [];
  let t = 0;
  rests.forEach((r, i) => {
    stops.push({ at: t / cycleMs, x: r.x, y: r.y, leaves: false });
    t += restMs;
    stops.push({ at: t / cycleMs, x: r.x, y: r.y, leaves: true });
    t += glidesMs[i];
  });
  stops.push({ at: 1, x: rests[0].x, y: rests[0].y, leaves: false });
  return { stops, cycleMs, glidesMs };
}

export const lensPath = (mode: Mode) =>
  lensStops(LENS.rests[mode], LENS.restMs, LENS.pxPerS[mode], LENS.minGlideMs);

/* ── The beam: a tall soft band of clarity, one photograph after another ── */

/**
 * THE NIGHT'S PHOTOGRAPHS, ONE AT A TIME, EACH SEEN ONLY WHERE THE BEAM IS.
 * The veil is the dark itself (the photograph at a fifth of its brightness,
 * softened past recognising anyone, under grain), and one tall soft-edged
 * band of full clarity crosses it slowly from edge to edge; off the far edge
 * it waits a beat while the photograph under the veil changes, then crosses
 * the next. Never the whole of any photograph, and never the same one twice
 * running.
 *
 * ★ THE CROSSING EASES IN AND OUT, SO THE BEAM SPENDS ITS TIME AT THE EDGES,
 * where the photograph shows, and crosses the words at its quickest, under the
 * scrim. The photograph changes only in the beat: under a clear beam a change
 * would be a cut, where under the dark it is a dissolve nobody sees happen.
 *
 * ★ IT SHOWS WHATEVER IT CROSSES, faces included: unlike the lens it does not
 * choose, which is its cost on a page about who sees whom.
 */
export const BEAM = {
  /** The succession after the knob's photograph, in order. */
  then: ["festival-crowd", "wedding-toast", "wedding-golden"] as const,
  /** How many photographs take a turn. */
  count: 3,
  /** The beam's width, px, soft edges included. */
  widthPx: { desktop: 380, phone: 168 } as Record<Mode, number>,
  /** The share of the beam's width that is fully clear, the rest its edges. */
  core: 0.42,
  /** Where the beam fades in under the header and out at the hero's foot, as
   *  shares of its height: the nav never reads over a clear photograph (its
   *  links fell to 2:1 over the string lights before this). */
  fade: { top: 0.2, foot: 0.9 },
  /** One crossing, edge to edge, ms. */
  passMs: 9000,
  /** Off the far edge, while the photograph changes, ms. */
  beatMs: 1400,
  /** The veil: the photograph's brightness under it, and its softening. */
  veil: { brightness: 0.2, saturate: 0.8, blurPx: 14 },
  /** The grain over the dark, and how strongly it lays over it. */
  grain: { tilePx: 180, opacity: 0.34 },
};

/** The photographs that take turns, the knob's first. */
export const beamPhotos = (lead: string): string[] =>
  [lead, ...BEAM.then.filter((id) => id !== lead)].slice(0, BEAM.count);

/** One photograph's turn: its crossing and its beat. */
export const beamSlotMs = () => BEAM.passMs + BEAM.beatMs;
/** The whole succession, every photograph once. */
export const beamCycleMs = () => BEAM.count * beamSlotMs();

/* ── The glimpses: soft spots opening in place, one after another ──────── */

/**
 * NOTHING TRAVELS. The veil is the original's own (the photograph blurred and
 * at 55 percent), laid full-bleed, and soft round spots of clarity open in
 * place on one thing at a time, hold, and close again as the next opens
 * across the words: a moment surfaces and sinks, the calmest a veil can move
 * and still never be still.
 *
 * ★ EVERY SPOT IS CLEAR OF THE WORDS, so no clarity ever sits behind a word,
 * not even in passing. The order alternates sides, so two spots are open at
 * once only across the words from each other.
 */
export const GLIMPSE = {
  blurPx: DRIFT.blurPx,
  baseOpacity: DRIFT.baseOpacity,
  /** Each spot's diameter and place, in the order they open. */
  spots: {
    desktop: [
      { x: 290, y: 196, d: 260 },
      { x: 818, y: 806, d: 230 },
      { x: 196, y: 588, d: 220 },
      { x: 1150, y: 196, d: 240 },
      { x: 400, y: 806, d: 230 },
    ],
    phone: [
      { x: 96, y: 148, d: 140 },
      { x: 272, y: 684, d: 136 },
      { x: 280, y: 148, d: 132 },
      { x: 98, y: 686, d: 136 },
    ],
  } as Record<Mode, readonly (Spot & { d: number })[]>,
  /** The share of a spot's radius that is fully clear; its edge feathers
   *  out over the rest. */
  core: 0.62,
  /** One spot opening, ms. */
  openMs: 1200,
  /** Open and still, ms. */
  holdMs: 1800,
  /** Closing again, ms. */
  closeMs: 1500,
  /** From one spot opening to the next, ms. */
  stepMs: 2400,
};

export const glimpseCycleMs = (mode: Mode) =>
  GLIMPSE.spots[mode].length * GLIMPSE.stepMs;

/* ── The keyframes, written from the numbers above ──────────────────────── */

/** The house's in-out curve for a glide (the same S a settle uses). */
export const GLIDE_EASE = "cubic-bezier(0.45, 0, 0.2, 1)";

const pct = (v: number) => `${(v * 100).toFixed(3)}%`;

/**
 * THE LENS'S TWO KEYFRAME SETS: the pane moves to each rest, and the
 * photograph inside it moves the opposite way by exactly as much, so what the
 * pane shows is always the part of the photograph behind it. Both are
 * transforms, so the compositor runs them with no paint, and both share one
 * clock and one curve, so they cannot drift apart mid-glide.
 */
export function lensKeyframes(mode: Mode, name: string): string {
  const { stops } = lensPath(mode);
  const r = LENS.lensPx[mode] / 2;
  const block = (sign: 1 | -1) =>
    stops
      .map(
        (s) =>
          `${pct(s.at)}{transform:translate(${sign * (s.x - r)}px,${sign * (s.y - r)}px);animation-timing-function:${s.leaves ? GLIDE_EASE : "linear"}}`,
      )
      .join("");
  return `@keyframes ${name}{${block(1)}}@keyframes ${name}-view{${block(-1)}}`;
}

/**
 * THE BEAM'S TWO CLOCKS. The beam crosses once per photograph (`slot`): from
 * wholly off the left edge to wholly off the right, easing in and out, then
 * waits off the edge for the beat and jumps back unseen. The photographs take
 * turns on the longer clock (`cycle`): each is fully in for its crossing and
 * dissolves into the next only during the beat, while no beam is over it.
 */
export function beamKeyframes(mode: Mode, name: string): string {
  const w = BEAM.widthPx[mode];
  const cw = CANVAS[mode].w;
  const pass = BEAM.passMs / beamSlotMs();
  const at = (x: number) => `transform:translateX(${x}px)`;
  const band = (sign: 1 | -1) =>
    `0%{${at(sign * -w)};animation-timing-function:${GLIDE_EASE}}` +
    `${pct(pass)}{${at(sign * cw)};animation-timing-function:linear}` +
    `100%{${at(sign * cw)}}`;
  const inFor = BEAM.passMs / beamCycleMs();
  const out = beamSlotMs() / beamCycleMs();
  const back = 1 - BEAM.beatMs / beamCycleMs();
  return (
    `@keyframes ${name}{${band(1)}}@keyframes ${name}-view{${band(-1)}}` +
    // A photograph's own turn, read from the moment it is fully in: in for
    // its crossing, out over the beat, dark through the others' turns, and
    // back in over the beat before its own comes round again.
    `@keyframes ${name}-shot{0%{opacity:1}${pct(inFor)}{opacity:1}${pct(out)}{opacity:0}${pct(back)}{opacity:0}100%{opacity:1}}`
  );
}

/** A photograph's delay into the shared cycle: the i-th is fully in at the
 *  start of the i-th crossing. */
export const beamShotDelayMs = (i: number) =>
  -((beamCycleMs() - i * beamSlotMs()) % beamCycleMs());

/** The spot's bloom: it opens from this share of its size. */
export const GLIMPSE_FROM = 0.88;

/**
 * ONE GLIMPSE'S LIFE, as a share of the whole cycle: open, hold, close, then
 * shut until its turn comes round. Every spot runs these keyframes, offset by
 * its turn (`animation-delay`), which is what makes a sequence out of one
 * rule; the photograph inside counter-scales, so a spot blooms without the
 * picture in it swelling.
 */
export function glimpseKeyframes(mode: Mode, name: string): string {
  const cycle = glimpseCycleMs(mode);
  const o = GLIMPSE.openMs / cycle;
  const h = (GLIMPSE.openMs + GLIMPSE.holdMs) / cycle;
  const c = (GLIMPSE.openMs + GLIMPSE.holdMs + GLIMPSE.closeMs) / cycle;
  const bloom = "cubic-bezier(0.22, 1, 0.36, 1)";
  const sink = "cubic-bezier(0.64, 0, 0.78, 0)";
  return (
    `@keyframes ${name}{` +
    `0%{opacity:0;transform:scale(${GLIMPSE_FROM});animation-timing-function:${bloom}}` +
    `${pct(o)}{opacity:1;transform:scale(1);animation-timing-function:linear}` +
    `${pct(h)}{opacity:1;transform:scale(1);animation-timing-function:${sink}}` +
    `${pct(c)}{opacity:0;transform:scale(1)}` +
    `100%{opacity:0;transform:scale(1)}}` +
    `@keyframes ${name}-view{` +
    `0%{transform:scale(${(1 / GLIMPSE_FROM).toFixed(4)});animation-timing-function:${bloom}}` +
    `${pct(o)}{transform:scale(1)}` +
    `100%{transform:scale(1)}}`
  );
}
