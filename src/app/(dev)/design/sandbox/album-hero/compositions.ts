import { CANVAS, type Mode } from "@/components/lab";

/**
 * THE ALBUM HERO'S FOUR COMPOSITIONS (round three, 2026-09-17): one engine,
 * four calm pictures.
 *
 * Will scrolled round two ahead of his sitting and said six things. Three of
 * them are what this file is: "let's make the next round of album hero visuals
 * feel a bit more calm, these are all moving too fast and feel distracting from
 * the actual page content"; "many frames are also jittery/buggy"; and a
 * reference, cosmos.so, "photographs scattered in a ring around a centred
 * lockup, tilted a little, fainter toward the edges" that he would "love to see
 * a version of". The other three are the lockup and the album below, which live
 * in `hero.tsx` and `album.tsx`.
 *
 * ★ FOUR COMPOSITIONS, ONE ENGINE, AND THE ENGINE IS A CLOSED FORM OF THE
 * CLOCK. A card's phase is `((its launch time + elapsed) mod cycle) / flight`,
 * so recycling falls out of a modulo, the still is the loop frozen at a chosen
 * phase, and there is no per-card bookkeeping, no timer and no React state. The
 * compositions differ in exactly two functions, `place` and `opacity`, plus the
 * short table each one walks. Everything else, the DOM box, the clearance, the
 * facts and the tests, reads one description.
 *
 * ★ THE CALM RULE IS MEASURED, NEVER ASSERTED, and `compositions.test.ts` is
 * what pins it: nothing on screen moves faster than 40 px a second at 1440,
 * at most sixteen photographs are lit at once, and no lit frame ever touches
 * the lockup's box. Round two failed all three (fifty-two frames, nineteen to
 * twenty-seven lit, a frame crossing the canvas in nine seconds), and the way
 * a later round stops those coming back is arithmetic rather than taste.
 *
 * ★ THE JITTER WAS A RE-RASTERISATION, and `fitOf` is the fix. A frame whose
 * DOM box is 200 px and whose transform scales it to 400 is redrawn at twice
 * its raster every frame it grows, which is the stutter Will saw. Every card's
 * box is therefore sized to the LARGEST moment anybody can see it at, and the
 * transform only ever scales DOWN from there. No filter, no blur, one transform
 * and one opacity a frame, and the z-index written only when its bucket
 * changes.
 *
 * ★ THE QUIET ZONE IS WHERE THE COMPOSITION IS DRAWN FROM. The lockup is ONE
 * block (round two split it around a vent and Will called the hole "a
 * ridiculous looking center gap"), so the keep-out is one box: `BLOCK`, its ink
 * measured off the rendered lockup. A station is pushed out to the smallest
 * radius that clears that box, a flying frame is dark until it has, and a shelf
 * band takes its height from it. So the picture re-solves itself when the
 * headline step changes rather than breaking, and the media stays at 100
 * percent with no scrim anywhere on the hero (bible 1).
 *
 * ★ PURE, AND THAT IS LOAD-BEARING. No React and no stylesheet here, so every
 * composition is solved at module load for both canvases and both headline
 * steps, the numbers on the board's cards are read off the same tables the hero
 * renders from, and the server and the browser compute the same still.
 */

/** The two steps of the site ladder this hero can sit on (bible 5). */
export type Step = "lg" | "xl";
export const STEPS: readonly Step[] = ["lg", "xl"];

export const COMP_IDS = ["orbit", "field", "shelf", "arrival"] as const;
export type CompId = (typeof COMP_IDS)[number];

/* ── The lockup's box, and the room left around it ───────────────────────── */

/**
 * THE LOCKUP AS ONE KEEP-OUT BOX, in canvas units, measured to its INK off the
 * rendered block rather than guessed: the eyebrow, the headline, the sentence
 * and the actions row on PageHero's own `gap-6` with the actions' `mt-2`, which
 * is the grammar /features/album ships. Width is the widest line's ink (the
 * headline on both canvases), height is the block's own.
 *
 * Re-measure it if the page's copy changes: copy is open (bible 21) and this is
 * the one number a rewrite invalidates. `hero.tsx` writes the real block into
 * the same centred position, so a disagreement shows up as air rather than as
 * an overlap, and `compositions.test.ts` holds every frame outside it.
 */
export const BLOCK: Record<Mode, Record<Step, { w: number; h: number }>> = {
  desktop: {
    lg: { w: 732, h: 346 },
    xl: { w: 976, h: 392 },
  },
  phone: {
    lg: { w: 343, h: 352 },
    xl: { w: 343, h: 432 },
  },
};

/** The air between the lockup's ink and the nearest photograph. Generous on
 *  purpose: a frame that merely misses a word still reads as crowding it, and
 *  the whole ask this round is calm. */
const MARGIN: Record<Mode, number> = { desktop: 56, phone: 24 };

/** The shapes an album is made of, as h/w. Half of what guests shoot is a
 *  phone held up, so half the table is 4:5; nothing is dealt (round six's
 *  finding on the home hero: a dealt stream reads worse than a composed one),
 *  every card's shape is a step in this cycle. */
const ASPECTS = [1.25, 1, 0.75, 1.25] as const;

/** The tilt table, in degrees. A few degrees is the Cosmos reference's whole
 *  hand: enough that the ring reads as photographs laid down rather than as a
 *  grid, never enough to read as a mess. */
const ROLLS = [-4.5, 3, -2, 5, -3.5, 2.5, -5, 4] as const;

/* ── The primitives ──────────────────────────────────────────────────────── */

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export const mod = (a: number, n: number) => ((a % n) + n) % n;

const rad = (deg: number) => (deg * Math.PI) / 180;

const easeOutCubic = (t: number) => {
  const u = 1 - clamp01(t);
  return 1 - u * u * u;
};

/**
 * A card's rotated half-extents. A roll widens the box it really occupies, and
 * the clearance below is an axis-aligned test, so the rotation is folded into
 * the extents rather than ignored.
 */
function extents(w: number, h: number, roll: number) {
  const c = Math.abs(Math.cos(rad(roll)));
  const s = Math.abs(Math.sin(rad(roll)));
  return { hw: (w * c + h * s) / 2, hh: (w * s + h * c) / 2 };
}

/**
 * ★ THE SMALLEST RADIUS ALONG A RAY AT WHICH A CARD IS CLEAR OF THE LOCKUP.
 * Two axis-aligned boxes miss each other the moment ONE axis separates them, so
 * the answer is the nearer of the two crossings rather than the further: a
 * station beside the block clears on x, a station above it clears on y, and
 * neither is pushed out to the diagonal for nothing. Infinity when the ray runs
 * exactly along an axis the box is unbounded on, which the caller reads as "this
 * direction has no room".
 */
function clearRadius(
  angle: number,
  bw: number,
  bh: number,
  hw: number,
  hh: number,
) {
  const cx = Math.abs(Math.cos(angle));
  const cy = Math.abs(Math.sin(angle));
  const rx = cx < 1e-6 ? Infinity : (bw + hw) / cx;
  const ry = cy < 1e-6 ? Infinity : (bh + hh) / cy;
  return Math.min(rx, ry);
}

/** The radius past which the card's box is entirely off the canvas along its
 *  ray: a station beyond this is a photograph nobody can see, and the pool
 *  refuses it rather than paying a DOM node for it. */
function edgeRadius(
  angle: number,
  halfW: number,
  halfH: number,
  hw: number,
  hh: number,
) {
  const cx = Math.abs(Math.cos(angle));
  const cy = Math.abs(Math.sin(angle));
  const rx = cx < 1e-6 ? Infinity : (halfW + hw) / cx;
  const ry = cy < 1e-6 ? Infinity : (halfH + hh) / cy;
  return Math.min(rx, ry);
}

/* ── One card, one composition ───────────────────────────────────────────── */

export type Card = {
  key: string;
  /** Launch order inside the cycle; also the table index and the photograph. */
  slot: number;
  photo: number;
  /** The unit box at transform scale 1, before `fit`. */
  w: number;
  h: number;
  /** The launch time inside the cycle, in ms. */
  at: number;
  /** rotateZ, in degrees. Constant: a frame that turns while it moves is the
   *  second motion the calm rule spends its whole budget refusing. */
  roll: number;
  /** The scale a held or passing card is drawn at; the depth axis, such as it
   *  is now. One number, so near-over-far ordering is one comparison. */
  depth: number;
  /** Polar compositions: the station's angle from the horizontal, positive
   *  downward, and its radius in canvas px. */
  angle: number;
  radius: number;
  /** The shelf: which band (-1 top, 1 foot), and the band's y. */
  band: 1 | -1;
  y: number;
  /** How far the card travels: the shelf's whole wrap, or the field's crossing
   *  from the lockup's rim to the canvas edge. */
  span: number;
  /** How far a held card drifts, in degrees along its arc (polar) or px. */
  drift: number;
};

export type Place = { x: number; y: number; s: number };

export type Comp = {
  id: CompId;
  /** How a card is placed: around the lockup, out through it, or along a band. */
  kind: "polar" | "radial" | "shelf";
  /** One card's whole life, birth to gone. */
  flight: Record<Mode, number>;
  /** The beat between one card's birth and the next. */
  beat: Record<Mode, number>;
  /** The unit card box width at transform scale 1, before depth and aspect. */
  card: Record<Mode, number>;
  /** How the layer dissolves at the canvas edge. */
  mask: "radial" | "band" | "none";
  /** The stations, or the band layout, as a table walked in order. */
  slots: (mode: Mode) => number;
  place: (c: Card, p: number, mode: Mode) => Place;
  opacity: (c: Card, p: number, mode: Mode) => number;
  /** Everything about a card the clock does not change, before the lockup is
   *  taken into account; `build` pushes a station out and drops a dead one. */
  shape: (
    slot: number,
    mode: Mode,
  ) => {
    angle: number;
    /** A station's radius as a multiple of the smallest one that clears the
     *  lockup along its own ray: 1 stands on the rim, 1.5 stands half a block
     *  further out. Written this way so the ring re-solves itself at the louder
     *  headline step rather than being drawn against one of them. */
    push: number;
    depth: number;
    band: 1 | -1;
    roll: number;
    drift: number;
  };
};

/* ── 1. THE ORBIT: the Cosmos ring, standing still and turning slowly ────── */

/**
 * WILL'S REFERENCE, AS HE DESCRIBED IT. The photographs stand in a ring around
 * the lockup, each tilted a few degrees, fainter toward the edges; every few
 * seconds one fades out and another fades in at an empty place, so the ring
 * turns without any card ever moving across the canvas.
 *
 * ★ A STATION IS AN ANGLE, A RADIUS AND A DEPTH, and the only motion a standing
 * card has is a drift of a couple of degrees down its own arc. At the outer
 * radius that is about 25 px over half a minute, which is under one pixel a
 * second: the ring is alive and nothing in it is travelling.
 *
 * ★ THE TURN IS THE CADENCE, NOT A ROTATION. There are as many nodes as
 * stations and the flight is shorter than the cycle, so at any instant one or
 * two stations stand empty and the next birth fills one. That is the whole of
 * "an album filling" without a single frame crossing the type.
 */
const ORBIT_STATIONS = {
  desktop: [
    { angle: -96, push: 1, depth: 1 },
    { angle: 84, push: 1, depth: 0.97 },
    { angle: -14, push: 1.04, depth: 0.93 },
    { angle: 166, push: 1.04, depth: 0.9 },
    { angle: -136, push: 1.12, depth: 0.87 },
    { angle: 44, push: 1.12, depth: 0.89 },
    { angle: -56, push: 1.24, depth: 0.82 },
    { angle: 124, push: 1.24, depth: 0.84 },
    { angle: -172, push: 1.02, depth: 0.95 },
    { angle: 8, push: 1.02, depth: 0.92 },
    { angle: -114, push: 1.34, depth: 0.79 },
    { angle: 66, push: 1.34, depth: 0.81 },
    { angle: -34, push: 1.3, depth: 0.8 },
    { angle: 146, push: 1.3, depth: 0.83 },
  ],
  // At 375 the lockup is 343 of a 375 canvas, so there is no beside: the ring
  // is six stations above and below it, never a squeezed desktop.
  phone: [
    { angle: -104, push: 1, depth: 1 },
    { angle: 76, push: 1, depth: 0.94 },
    { angle: -68, push: 1.18, depth: 0.84 },
    { angle: 112, push: 1.18, depth: 0.86 },
    { angle: -124, push: 1.02, depth: 0.8 },
    { angle: 56, push: 1.02, depth: 0.82 },
    { angle: -90, push: 1.4, depth: 0.74 },
    { angle: 90, push: 1.4, depth: 0.76 },
  ],
} as const;

/** The fade in and out, as fractions of the flight, and the hold between them. */
const ORBIT_IN = [0.0, 0.055] as const;
const ORBIT_OUT = [0.93, 1] as const;
/** How faint the outermost station stands against the innermost: the
 *  reference's depth cue, and the one that costs no light (bible 1). */
const ORBIT_DIM = 0.5;

const orbit: Comp = {
  id: "orbit",
  kind: "polar",
  flight: { desktop: 33000, phone: 19000 },
  beat: { desktop: 2600, phone: 2600 },
  card: { desktop: 196, phone: 112 },
  mask: "radial",
  slots: (mode) => ORBIT_STATIONS[mode].length,
  shape: (slot, mode) => {
    const st = ORBIT_STATIONS[mode][slot % ORBIT_STATIONS[mode].length];
    return {
      angle: rad(st.angle),
      push: st.push,
      depth: st.depth,
      band: 1,
      roll: ROLLS[slot % ROLLS.length],
      // Down its own arc, away from the horizontal, so the ring reads as
      // turning one way rather than breathing.
      drift: 2.2,
    };
  },
  place: (c, p) => {
    const a = c.angle + rad(c.drift) * clamp01(p);
    return {
      x: Math.cos(a) * c.radius,
      y: Math.sin(a) * c.radius,
      s: c.depth,
    };
  },
  opacity: (c, p, mode) => {
    // Fainter toward the edges, measured off the station's own radius against
    // the canvas's half diagonal rather than painted on by a mask alone.
    const half = Math.hypot(CANVAS[mode].w, CANVAS[mode].h) / 2;
    const dim = 1 - ORBIT_DIM * smoothstep(0.34, 0.92, c.radius / half);
    return (
      dim *
      smoothstep(ORBIT_IN[0], ORBIT_IN[1], p) *
      (1 - smoothstep(ORBIT_OUT[0], ORBIT_OUT[1], p))
    );
  },
};

/* ── 2. THE FIELD, CALMED: round two's emanation at a third of everything ── */

/**
 * ROUND TWO'S PICTURE, KEPT, AND SLOWED UNTIL IT IS CALM. Will killed the speed
 * and the count rather than the idea, so this is the same argument (an album
 * that is alive is one things are arriving into, from every direction, never
 * finishing) at a third of the pace and a third of the frames.
 *
 * ★ THE ORIGIN IS BEHIND THE LOCKUP'S CENTRE and there is no vent. Round two
 * cut a hole in the type so the birth had somewhere to happen; the hole was the
 * defect. Here a frame is born at the exact centre, BEHIND the words, and it is
 * dark until it has cleared them, which is what the first seventh of its flight
 * is for.
 *
 * ★ AND THE OTHER SIX SEVENTHS ARE ALL SPENT WHERE SOMEBODY CAN SEE IT, which
 * is the fix for the first draft of this round. Round two flew every card the
 * same distance down every ray, so a card on a vertical ray was off the top of
 * the canvas while a card on a horizontal one was still crossing: two thirds of
 * the pool was either behind the words or past the edge at any instant, and the
 * field read as five photographs at the corners. Each ray now runs from the
 * radius at which the card clears the lockup to the radius at which it leaves
 * the canvas, both solved per card, so the pool and the picture are the same
 * number and the one dial left is how long the crossing takes.
 *
 * ★ WHICH MAKES THE SPEED THE WHOLE RULE. A card crosses its own band in about
 * fourteen seconds, which is under 25 px a second at 1440: a frame takes a slow
 * breath to cross, and nothing in the picture is ever the thing your eye is
 * chasing.
 */

/**
 * ★ THE RAYS ARE A TABLE, NOT A FAN GENERATOR, and the phone's is not the
 * desktop's squeezed. At 1440 the lockup is half the canvas wide and every
 * direction has somewhere to go, so the seventeen rays are an even compass
 * walked in steps of eight: consecutive births are most of a turn apart and the
 * field fills evenly with no two neighbours leaving together. At 375 the lockup
 * is 343 of a 375 canvas, so a horizontal ray clears the words only after it
 * has left the screen: the phone's rays are two vertical cones, up and down,
 * and nothing is launched sideways at all. Degrees from the horizontal,
 * positive downward.
 */
const FIELD_RAYS: Record<Mode, readonly number[]> = {
  desktop: Array.from(
    { length: 15 },
    (_, i) => -90 + ((i * 7) % 15) * (360 / 15),
  ),
  phone: [-90, 90, -62, 118, -117, 63, -76, 104, -103, 77, -69, 111],
};

/** Three depths, walked in a short cycle: the near frames read over the far
 *  ones and the field has an axis without a perspective divide in it. */
const FIELD_DEPTHS = [1, 0.74, 0.88, 0.66, 0.94, 0.8] as const;

/** The share of the flight spent behind the lockup, crossing the keep-out at
 *  no size. It is the birth, and it is the only part of a card's life nobody
 *  sees; every other frame of it is on the canvas. */
const FIELD_HIDDEN = 0.14;
/** The size at the rim against the size at the edge: growth is what reads as
 *  depth, and a shallow curve is what keeps it from reading as a rush. */
const FIELD_GROW = [0.58, 1] as const;
/** The fade up off the lockup's rim, and the dissolve at the canvas edge. */
const FIELD_IN = 0.09;
const FIELD_GONE = 0.86;

const field: Comp = {
  id: "field",
  kind: "radial",
  flight: { desktop: 16800, phone: 15000 },
  beat: { desktop: 1200, phone: 1250 },
  card: { desktop: 236, phone: 132 },
  mask: "none",
  slots: (mode) => FIELD_RAYS[mode].length,
  shape: (slot, mode) => ({
    angle: rad(FIELD_RAYS[mode][slot % FIELD_RAYS[mode].length]),
    push: 1,
    depth: FIELD_DEPTHS[slot % FIELD_DEPTHS.length],
    band: 1,
    roll: ROLLS[slot % ROLLS.length],
    drift: 0,
  }),
  place: (c, p) => {
    // Two segments and one expression: out to the lockup's rim behind the
    // words, then the slow crossing to the canvas edge. `radius` is the rim
    // and `span` the crossing, both solved per ray in `build`.
    const out = clamp01((p - FIELD_HIDDEN) / (1 - FIELD_HIDDEN));
    const r =
      p < FIELD_HIDDEN
        ? c.radius * (p / FIELD_HIDDEN)
        : c.radius + c.span * out;
    const grow =
      p < FIELD_HIDDEN
        ? 0.12 + (FIELD_GROW[0] - 0.12) * (p / FIELD_HIDDEN)
        : FIELD_GROW[0] + (FIELD_GROW[1] - FIELD_GROW[0]) * out;
    return {
      x: Math.cos(c.angle) * r,
      y: Math.sin(c.angle) * r,
      s: c.depth * grow,
    };
  },
  opacity: (_c, p) =>
    smoothstep(FIELD_HIDDEN, FIELD_HIDDEN + FIELD_IN, p) *
    (1 - smoothstep(FIELD_GONE, 1, p)),
};

/* ── 3. THE SHELF: two bands, a contact sheet the party is feeding ───────── */

/**
 * THE CALMEST CONTINUOUS MOTION ON THE BOARD, and the only composition with no
 * births in it at all. One band of photographs along the top edge and one along
 * the foot, drifting sideways in opposite directions at about 33 px a second,
 * with the lockup in the clear middle: the album as a contact sheet somebody is
 * pulling past, which is what a reader's eye does to a grid anyway.
 *
 * ★ THE BAND IS SEAMLESS BECAUSE THE FLIGHT IS THE CYCLE. A card leaves the far
 * edge at the exact instant its slot is due again at the near one, so the wrap
 * happens entirely off canvas and there is no gap to time.
 */
const SHELF_PER_BAND = { desktop: 6, phone: 3 } as const;
/** The gap between neighbours in a band, in canvas px at scale 1. */
const SHELF_GAP = { desktop: 58, phone: 34 } as const;
/** How far the band's outer edge hangs past the canvas edge. */
const SHELF_BLEED = { desktop: 30, phone: 16 } as const;
/** How far from the band's ends a card fades, as a fraction of the span. Wide
 *  enough that a frame is invisible until it is most of the way on: a card that
 *  reaches full opacity with its edge still crossing the frame pops. */
const SHELF_FADE = 0.14;

const shelf: Comp = {
  id: "shelf",
  kind: "shelf",
  // The flight IS the cycle here; `built` checks it.
  flight: { desktop: 54900, phone: 20790 },
  beat: { desktop: 9150, phone: 6930 },
  card: { desktop: 196, phone: 124 },
  mask: "band",
  slots: (mode) => SHELF_PER_BAND[mode] * 2,
  shape: (slot, mode) => ({
    angle: 0,
    push: 1,
    // Even slots ride the top band, odd ones the foot, so the two fill
    // together and neither is ever a beat ahead of the other.
    band: slot % 2 === 0 ? -1 : 1,
    depth: mode === "phone" ? 0.94 : 1,
    // Square to the page: a contact sheet is not tilted, and this is the one
    // composition whose whole claim is order.
    roll: 0,
    drift: 0,
  }),
  place: (c, p) => ({
    // Top band left to right, foot band right to left. The card starts one
    // full card off the near edge and ends one full card off the far one.
    x: -c.band * (p - 0.5) * c.span,
    y: c.y,
    s: c.depth,
  }),
  opacity: (_c, p) =>
    smoothstep(0, SHELF_FADE, p) * (1 - smoothstep(1 - SHELF_FADE, 1, p)),
};

/* ── 4. THE ARRIVAL: a still scatter, one photograph landing at a time ───── */

/**
 * THE TRUEST TO THE PRODUCT AND THE CALMEST OF THE FOUR. Nothing on the canvas
 * moves. Every few seconds one photograph lands at an empty place with a soft
 * settle and the oldest one fades, which is exactly what a guest uploading does
 * to a real album, drawn as a hero.
 *
 * ★ THE SETTLE IS THE ONLY MOTION, AND IT IS SHORT. A landing card comes in a
 * few per cent large and eases down to its station over about six tenths of a
 * second. It is the one thing on this board allowed past the 40 px a second
 * rule, because it is a beat rather than a drift, and it is over before the eye
 * finishes finding it.
 *
 * ★ THERE ARE MORE STATIONS THAN OCCUPANTS, on purpose. Four of the fourteen
 * stand empty at any instant at 1440, so a landing reads as a place being
 * filled rather than as a card replacing itself.
 */
const ARRIVAL_STATIONS = {
  desktop: [
    { angle: -104, push: 1, depth: 1 },
    { angle: 70, push: 1, depth: 0.95 },
    { angle: -160, push: 1.04, depth: 0.88 },
    { angle: 16, push: 1.04, depth: 0.9 },
    { angle: -44, push: 1.2, depth: 0.76 },
    { angle: 136, push: 1.2, depth: 0.78 },
    { angle: -126, push: 1.34, depth: 0.66 },
    { angle: 52, push: 1.34, depth: 0.68 },
    { angle: -20, push: 1.02, depth: 0.92 },
    { angle: 164, push: 1.02, depth: 0.86 },
    { angle: -72, push: 1.46, depth: 0.58 },
    { angle: 110, push: 1.46, depth: 0.6 },
    { angle: -148, push: 1.4, depth: 0.62 },
    { angle: 34, push: 1.4, depth: 0.64 },
  ],
  phone: [
    { angle: -100, push: 1, depth: 1 },
    { angle: 80, push: 1, depth: 0.92 },
    { angle: -66, push: 1.16, depth: 0.76 },
    { angle: 114, push: 1.16, depth: 0.8 },
    { angle: -120, push: 1.02, depth: 0.86 },
    { angle: 60, push: 1.02, depth: 0.7 },
    { angle: -92, push: 1.38, depth: 0.62 },
    { angle: 88, push: 1.38, depth: 0.66 },
  ],
} as const;

/** The tilt, near zero: see the note on `roll` below. */
const ARRIVAL_ROLLS = [-1.6, 1.1, -0.6, 2, -1.2, 0.5, -2, 1.4] as const;
/** The settle: the share of the flight it takes, and how much large it starts.
 *  0.6 s of a 30 s flight at 1440. */
const ARRIVAL_SETTLE = { desktop: 0.02, phone: 0.029 } as const;
const ARRIVAL_LIFT = 0.055;
const ARRIVAL_IN = [0, 0.014] as const;
const ARRIVAL_OUT = [0.94, 1] as const;

const arrival: Comp = {
  id: "arrival",
  kind: "polar",
  flight: { desktop: 30000, phone: 20000 },
  beat: { desktop: 3000, phone: 3000 },
  card: { desktop: 204, phone: 118 },
  // No mask: a landed photograph is HERE, at full strength, and a scatter that
  // runs off the frame reads as one that carries on past it. The ring fades
  // outward because that is the reference's depth cue; this one does not,
  // because its cue is that every place is equally occupied.
  mask: "none",
  slots: (mode) => ARRIVAL_STATIONS[mode].length,
  shape: (slot, mode) => {
    const st = ARRIVAL_STATIONS[mode][slot % ARRIVAL_STATIONS[mode].length];
    return {
      angle: rad(st.angle),
      push: st.push,
      depth: st.depth,
      band: 1,
      // ★ ALMOST SQUARE TO THE PAGE, which is what separates this card from the
      // ring at a glance. A photograph the album has just taken delivery of is
      // laid down rather than dealt: the tilt here is a degree or two, where
      // the orbit's is the reference's five.
      roll: ARRIVAL_ROLLS[slot % ARRIVAL_ROLLS.length],
      drift: 0,
    };
  },
  place: (c, p, mode) => {
    // The settle, and nothing else for the rest of the flight.
    const t = easeOutCubic(clamp01(p / ARRIVAL_SETTLE[mode]));
    return {
      x: Math.cos(c.angle) * c.radius,
      y: Math.sin(c.angle) * c.radius,
      s: c.depth * (1 + ARRIVAL_LIFT * (1 - t)),
    };
  },
  opacity: (_c, p) =>
    smoothstep(ARRIVAL_IN[0], ARRIVAL_IN[1], p) *
    (1 - smoothstep(ARRIVAL_OUT[0], ARRIVAL_OUT[1], p)),
};

export const COMPOSITIONS: Record<CompId, Comp> = {
  orbit,
  field,
  shelf,
  arrival,
};

/* ── The solvers, run once per composition, canvas and step at module load ── */

/** The sampling resolution. 480 over a flight is a 60 ms answer on the longest
 *  of them, finer than any fade a composition carries. */
const SCAN = 480;

export type Built = {
  cards: Card[];
  cycle: number;
  flight: number;
  /** Per card, in order: the DOM box, the scale divisor and the phase past
   *  which the loop stops writing to it. */
  box: { w: number; h: number; fit: number; exit: number }[];
  /** What the board's cards report, measured rather than claimed. */
  facts: {
    /** The most photographs lit at one instant, over a whole cycle. */
    onScreen: number;
    /** DOM nodes handed to the compositor. */
    nodes: number;
    /** The fastest anything on the canvas moves, px a second, the settle apart. */
    speed: number;
    /** Distinct photographs the composition asks for. */
    photos: number;
  };
};

/**
 * THE LARGEST TRANSFORM SCALE A CARD EVER REACHES WHILE ANYBODY CAN SEE IT, and
 * the phase at which it has finished. The first sizes the DOM box so a frame is
 * never rasterised above 1:1 and only ever scales DOWN, which is Will's
 * "jittery/buggy"; the second lets the loop stop writing to a card that is gone.
 *
 * ★ A SAMPLED MAXIMUM IS NOT THE MAXIMUM: the true peak falls between two
 * samples, so the box carries one per cent of headroom. The whole point of
 * `fit` is that the drawn size is never LARGER than the box it is drawn in.
 */
function fitOf(c: Card, comp: Comp, mode: Mode) {
  let fit = 0.001;
  let exit = 1;
  let lit = false;
  for (let i = 0; i <= SCAN; i++) {
    const p = i / SCAN;
    const o = comp.opacity(c, p, mode);
    if (o > 0.004) {
      lit = true;
      const q = comp.place(c, p, mode);
      if (q.s > fit) fit = q.s;
    } else if (lit) {
      exit = p;
      break;
    }
  }
  return { fit: fit * 1.01, exit };
}

/** The fastest anything moves, in px a second, sampled over the flight. The
 *  settle is excluded by its own phase window: it is a beat, not a drift, and
 *  the calm rule says so. */
function speedOf(c: Card, comp: Comp, mode: Mode, flight: number) {
  const skip = comp.id === "arrival" ? ARRIVAL_SETTLE[mode] : 0;
  let fastest = 0;
  const dp = 1 / SCAN;
  for (let i = 0; i < SCAN; i++) {
    const p = i / SCAN;
    if (p < skip) continue;
    if (comp.opacity(c, p, mode) <= 0.02) continue;
    const a = comp.place(c, p, mode);
    const b = comp.place(c, p + dp, mode);
    const px = Math.hypot(b.x - a.x, b.y - a.y);
    const v = px / ((dp * flight) / 1000);
    if (v > fastest) fastest = v;
  }
  return fastest;
}

export function build(comp: Comp, mode: Mode, step: Step): Built {
  const canvas = CANVAS[mode];
  const halfW = canvas.w / 2;
  const halfH = canvas.h / 2;
  const block = BLOCK[mode][step];
  const margin = MARGIN[mode];
  const bw = block.w / 2 + margin;
  const bh = block.h / 2 + margin;

  const n = comp.slots(mode);
  const beat = comp.beat[mode];
  const flight = comp.flight[mode];
  // ★ THE CYCLE IS THE LAUNCH TABLE'S, NOT THE POOL'S. Every composition but
  // the shelf launches one card a beat, so its cycle is the whole pool; the
  // shelf launches one into EACH band on the same beat, so its cycle is one
  // band's and a card's phase still runs 0 to 1 exactly once.
  const launches = comp.kind === "shelf" ? n / 2 : n;
  const cycle = launches * beat;
  const unit = comp.card[mode];
  // The wrap has to happen entirely off canvas, so the travel is the canvas
  // plus a whole card plus the band's gap.
  const span = canvas.w + unit + SHELF_GAP[mode];

  const cards: Card[] = [];
  for (let slot = 0; slot < n; slot++) {
    const sh = comp.shape(slot, mode);
    const aspect = ASPECTS[slot % ASPECTS.length];
    // ★ THE UNIT BOX CARRIES NO DEPTH. Depth is a transform scale and nothing
    // else, so a card's box is its own shape and `fit` sizes it exactly once:
    // folding depth into the box as well squares it, and a station at 0.6 draws
    // at 0.36 of the unit while every table says 0.6.
    const w = unit;
    const h = w * aspect;
    const e = extents(w * sh.depth, h * sh.depth, sh.roll);

    // ★ THE COMPOSITION IS DRAWN FROM THE QUIET ZONE rather than hoping to miss
    // it. A station is pushed out to the smallest radius that clears the
    // lockup's box along its own ray; a band takes its height from the same
    // box; a ray with no room left on the canvas is not launched at all, which
    // is what keeps the louder headline step honest instead of crowded.
    let radius = 0;
    let y = 0;
    let travel = span;
    if (comp.kind === "radial") {
      // ★ EVERY RAY RUNS FROM ITS OWN RIM TO ITS OWN EDGE. The rim is the
      // radius at which this card's box has cleared the lockup, the edge the
      // radius at which it has left the canvas, and the flight between them is
      // the whole of what a reader sees. A ray with no band at all (the
      // horizontal ones at 375, where the lockup is 343 of a 375 canvas) is
      // not launched.
      radius = clearRadius(sh.angle, bw, bh, e.hw, e.hh);
      const edge = edgeRadius(sh.angle, halfW, halfH, e.hw, e.hh);
      if (!(edge > radius)) continue;
      travel = edge - radius;
    } else if (comp.kind === "polar") {
      // ★ THE STATION IS DRAWN OFF THE LOCKUP, never against a canvas. `push`
      // is a multiple of the smallest radius that clears the block along this
      // ray, so the ring hugs the words at 1 and stands a block further out at
      // 1.5, and the louder headline step pushes the whole ring outward rather
      // than laying a photograph over a headline.
      radius = clearRadius(sh.angle, bw, bh, e.hw, e.hh) * sh.push;
      if (radius > edgeRadius(sh.angle, halfW, halfH, e.hw, e.hh)) continue;
    } else if (comp.kind === "shelf") {
      // The band hangs off the canvas edge, its OUTER edge flush and its inner
      // edge ragged, which is what a contact sheet sliding past looks like. It
      // is pushed inward only when a card is too tall to hang there and clear
      // the lockup, and a band with no room at all is not drawn.
      const outer = halfH + SHELF_BLEED[mode] - e.hh;
      const nearest = bh + e.hh;
      y = sh.band * Math.max(outer, nearest);
      if (Math.abs(y) - e.hh > halfH) continue;
    }

    // The shelf's spacing is the band's own pitch: a slot's place in its band
    // is what spaces it, so the two bands stay evenly filled at any phase.
    // The foot band runs half a beat behind the top one, so the two never
    // arrive in lockstep and the picture reads as a sheet rather than a grid.
    const bandSlot = comp.kind === "shelf" ? Math.floor(slot / 2) : slot;
    const lag = comp.kind === "shelf" && slot % 2 === 1 ? beat / 2 : 0;
    cards.push({
      key: `abh-${comp.id}-${slot}`,
      slot,
      photo: slot,
      w,
      h,
      at: mod(bandSlot * beat + lag, cycle),
      roll: sh.roll,
      depth: sh.depth,
      angle: sh.angle,
      radius,
      band: sh.band,
      y,
      span: travel,
      drift: sh.drift,
    });
  }

  const box = cards.map((c) => {
    const { fit, exit } = fitOf(c, comp, mode);
    return { w: Math.round(c.w * fit), h: Math.round(c.h * fit), fit, exit };
  });

  // The busiest instant over a whole cycle, because a cadence has a busiest one
  // and a quietest one and an average would hide both. The busiest is the one
  // that costs, and it is the number the calm rule is written against.
  let onScreen = 0;
  for (let t = 0; t < cycle; t += 50) {
    let lit = 0;
    for (const c of cards) {
      const p = mod(c.at + t, cycle) / flight;
      if (p <= 1 && comp.opacity(c, p, mode) > 0.02) lit++;
    }
    if (lit > onScreen) onScreen = lit;
  }

  let speed = 0;
  for (const c of cards) {
    const v = speedOf(c, comp, mode, flight);
    if (v > speed) speed = v;
  }

  return {
    cards,
    cycle,
    flight,
    box,
    facts: {
      onScreen,
      nodes: cards.length,
      speed: Math.round(speed),
      photos: cards.length,
    },
  };
}

/** Every composition, both canvases, both headline steps, solved once for the
 *  module. Plain arithmetic on both sides, so the server and the browser agree
 *  and the still hydrates without a warning. */
export const BUILT: Record<CompId, Record<Mode, Record<Step, Built>>> =
  Object.fromEntries(
    COMP_IDS.map((id) => [
      id,
      {
        desktop: {
          lg: build(COMPOSITIONS[id], "desktop", "lg"),
          xl: build(COMPOSITIONS[id], "desktop", "xl"),
        },
        phone: {
          lg: build(COMPOSITIONS[id], "phone", "lg"),
          xl: build(COMPOSITIONS[id], "phone", "xl"),
        },
      },
    ]),
  ) as Record<CompId, Record<Mode, Record<Step, Built>>>;

/** The phase a card stands at when nothing is running: the composition at its
 *  steady spacing, which is what reduced motion, a crawler, a cold paint and a
 *  reader with scripting off all get. */
export const restPhase = (c: Card, flight: number) =>
  Math.min(c.at / flight, 1);

/** The launch clock, as a closed form: the ONE expression the loop runs. */
export const phaseOf = (
  c: Card,
  elapsed: number,
  cycle: number,
  flight: number,
) => mod(c.at + elapsed, cycle) / flight;

/** One card at one phase, as the three strings the DOM wants. The loop and the
 *  still both read this, so they cannot drift into two projections of one card. */
export function frameAt(
  c: Card,
  p: number,
  comp: Comp,
  mode: Mode,
  fit: number,
) {
  const q = comp.place(c, p, mode);
  return {
    transform: `translate3d(${q.x.toFixed(2)}px, ${q.y.toFixed(2)}px, 0) rotate(${c.roll.toFixed(2)}deg) scale(${(q.s / fit).toFixed(4)})`,
    opacity: comp.opacity(c, p, mode).toFixed(3),
    // Near over far, as an integer so the browser is not handed a new stacking
    // order sixty times a second. Apparent size IS the depth here, so one
    // number orders the whole picture.
    z: 1 + Math.round(q.s * 60),
  };
}

/** The calm rule, as numbers, so the board's own test and a later round read
 *  the same three limits rather than a paragraph about them. */
export const CALM = {
  /** px a second at 1440, the arrival's settle excepted. */
  speed: 40,
  /** photographs lit at one instant. */
  lit: 16,
} as const;
