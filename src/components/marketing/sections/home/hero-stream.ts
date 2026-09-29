/**
 * THE HOME HERO'S STREAM: THE ALBUM LEAVING THE LINK CARD.
 *
 * One file of photographs each way along a single axis, pouring out from
 * behind the link card that stands still where the frames are born, and the
 * whole lockup in one block underneath. The band is the hero board's seventh
 * round (`stream=stack-above`, 2026-09-17); the object it pours from and the
 * tablet's geometry are `hero-card` r2 (2026-09-28). This module is every
 * number the composition is drawn from: the band's three tables, the object's,
 * and the solvers that place the type and the axis off them.
 *
 * ★ PURE, AND THAT IS LOAD-BEARING. No React, no stylesheet, no `env`: the
 * solvers below run at module load for all three geometries, the component
 * renders from the same tables, and `hero-stream.test.ts` reads them in the
 * node project. It is also why the hero's rest state can be computed during the
 * SERVER render and hydrate without a warning: every number here is plain
 * arithmetic that both sides agree on.
 *
 * ★ THE TYPE'S CLEAR LANE IS MEASURED, NOT CHOSEN. `build` walks every frame
 * over its whole flight and answers "how far from the axis does this stream
 * reach at the headline's own measure", and the block is placed outside that
 * answer plus a margin. So "no photograph is ever under a word" is the
 * condition the composition is drawn from rather than a hope about it, and
 * retuning a number re-solves it instead of breaking it. There is no darkening
 * layer anywhere over a photograph, which is the argument.
 *
 * ★ THE ENGINE IS A CLOSED FORM OF THE CLOCK. A frame's progress is
 * `((its launch time * reveal + elapsed) mod cycle) / flight`, so recycling
 * falls out of the modulo, the still is the loop frozen at a chosen elapsed,
 * and there is no per-card bookkeeping, no timer and no React state.
 *
 * ★ NOTHING IS DEALT. Every value a frame carries is a step in a short declared
 * cycle (the launch beat, the aspect table), which is what let the board answer
 * "the random stream feels worse than a more polished one".
 *
 * ★ EVERY HORIZONTAL IS A FRACTION OF THE HERO'S HALF-WIDTH, multiplied by
 * `--hhs-half` (50cqw) in the transform: the band stretches to whatever it is
 * given, and the scale, the opacity and the curl, which are all functions of
 * that same fraction, do not move at all. The only numbers in pixels are the
 * ones that should be (the frame's box, the object, the type's measures), and
 * they swap at the tablet's and the desk's breakpoints.
 */

/**
 * THE HERO'S THREE GEOMETRIES: a phone's column, a tablet's and a desk's
 * (Tailwind's `lg`). The tablet's exists because every tablet held upright is
 * 768 to 1023 wide, where the phone's geometry stretched its 343 measure across
 * 900 and left the lowest quarter of the screen empty; a third table composed
 * between the two ends centres the whole composition there instead.
 */
export type Geometry = "base" | "tablet" | "lg";

export const GEOMETRIES: readonly Geometry[] = ["base", "tablet", "lg"];

/** The ladder's two ends, which the album stream and the privacy field pace
 *  themselves against (neither carries a tablet table of its own). */
export type Bp = Exclude<Geometry, "tablet">;

/** Where the tablet's geometry starts and where the desk's does, in px:
 *  Tailwind's `md` and `lg`. The sheet's media queries say them too, and that is
 *  the one duplication here: a CSS media query cannot read a module. */
export const TABLET_MIN = 768;
export const LG_MIN = 1024;

/**
 * THE TABLET'S STEP: how far from the phone's number to the desk's a tablet's
 * stands. It is the step the type ladder already takes between two named widths
 * (every clamp runs 375 to 1440, and 900 is the upright tablet the geometry was
 * drawn at), so a tablet's lengths are composed with it rather than guessed, and
 * the sheet reads it as `--hhs-k` to size the object between its two drawings.
 */
export const TABLET_STEP = (900 - 375) / (1440 - 375);

/** A tablet's whole-pixel (or whole-millisecond) number, from the two ends. */
const between = (base: number, lg: number) =>
  Math.round(base + TABLET_STEP * (lg - base));

/**
 * The site header, in px. It is a STICKY 4rem bar, so it sits in the flow and
 * the hero's own `-mt` pulls the hero back up to the viewport's top: the
 * header's band is the hero's FIRST 64px, not a strip above them, and the hero
 * is one screen tall rather than one screen plus a header. Measured on the
 * rendered page rather than reasoned about, because reasoning about it got the
 * answer wrong by exactly one header. The object has to start below that band;
 * the photographs are deliberately allowed to run under it, since media behind
 * transparent chrome is the house look.
 */
export const HEADER = 64;

export type Geo = {
  /** The unit card box at transform scale 1, before its aspect. */
  card: number;
  /** The corridor's perspective. A curl reads only under a short one. */
  perspective: number;
  /** How much of each edge the band dissolves over. */
  fade: string;
  /**
   * ★ THE BLOCK'S BOX, BOTH NUMBERS MEASURED ON THE RENDERED BLOCK, never
   * reasoned about. The width is the widest PAINTED line, which is not the same
   * line in every geometry: at `lg` the headline sets it (706px of ink over two
   * lines at 1440, plus headroom), at `base` the sentence does (it fills its
   * 343 measure, 337 of ink, while the headline's widest is 297). It is the
   * column the band's reach is measured at, so re-measure it if the ruled copy
   * changes: copy is open, and this is the one number a rewrite can
   * invalidate. The height is the block's own, gaps included, and at `base` it
   * carries the action row WRAPPED, because two buttons do not fit on a 375
   * line and pretending otherwise costs 57px of fold. Its first line is the
   * "Try our demo event" eyebrow with its air (28px from the tablet up, 36 at
   * `base`).
   */
  blockW: number;
  blockH: number;
  /** The h1's own max-width, which is a typographic choice (it is tuned so the
   *  thesis breaks into good lines), and the sentence's measure. */
  h1Max: number;
  lowMax: number;
  /** The margin the type keeps from the stream's measured reach. */
  margin: number;
  /** Extra clearance on top of `margin`: a band wants air over it. */
  breath: number;
  /** Air between the header and the object's painted top, and under the block. */
  airTop: number;
  airFoot: number;
  /** The axis as a percentage of the hero's height, before the clamp. */
  axisPct: number;
  /**
   * THE DESIGN REFERENCE, halved: the viewport this geometry's table was drawn
   * and judged on (1440, 900 and 375, the boards' canvases). The clear line is
   * SOLVED here, so the composition that was picked is the composition that
   * ships at the size it was picked at.
   */
  halfRef: number;
  /**
   * ★ THE NARROWEST VIEWPORT THIS GEOMETRY SERVES, halved, and the reason both
   * numbers exist. Every horizontal here is a fraction of the half-width, so a
   * frame's PIXEL width covers a wider FRACTION of a narrow screen than of a
   * wide one: the same band crowds the block harder at 1024 than at 1440. The
   * loop's exit is taken here so a frame is never dropped while it is still on
   * screen, and `hero-stream.test.ts` re-checks the clear lane here, where the
   * designed air is at its thinnest. A check that fails here asks for another
   * geometry, never a thinner margin (the tablet's was that answer).
   */
  halfMin: number;
  /**
   * ★ HOW FAR ABOVE THE OBJECT'S FOOT THE AXIS RUNS, AT LEAST: the object's
   * floor (`Built.lift`). A frame born on the axis is hidden behind the object
   * until it is solid, which is where `opacityAt` reaches 1 (0.14 out, where a
   * frame stands about 35px tall on the phone's band and 67 on the desk's), so
   * the axis runs half that height above the object's foot, and a hair more.
   * `hero-stream.test.ts` holds it over the band's own half-height there.
   */
  inset: number;
};

/** A percentage's number, for the one field written as a CSS length. */
const pct = (v: string) => Number.parseFloat(v);

const GEO_BASE: Geo = {
  card: 155,
  perspective: 360,
  fade: "16%",
  blockW: 343,
  blockH: 361,
  h1Max: 343,
  lowMax: 343,
  margin: 28,
  breath: 12,
  airTop: 16,
  airFoot: 24,
  axisPct: 32,
  halfRef: 187.5, // the 375 canvas the board was judged on
  halfMin: 160, // a 320 px phone
  inset: 20,
};

const GEO_LG: Geo = {
  card: 300,
  perspective: 700,
  fade: "12%",
  blockW: 720,
  blockH: 384,
  h1Max: 920,
  lowMax: 576,
  margin: 26,
  breath: 56,
  airTop: 20,
  airFoot: 28,
  axisPct: 36,
  halfRef: 720, // the 1440 canvas the board was judged on
  halfMin: 512, // a 1024 px window, where `lg` starts
  inset: 34,
};

/**
 * ★ THE TABLET'S TABLE IS COMPOSED, and five fields are not, on purpose. Every
 * other length is `between` the two ends. `blockW` and `blockH` are measured
 * on the rendered block like the other two geometries' (from 768 the action
 * row sits on one line and the block wears the desk's air): the headline sets
 * the width here too, 498px of ink at 900 plus headroom (546 at 1023 is a
 * narrower share of that wider screen than 529 is of 768, where the lane is
 * re-checked), and the height is the tallest the range sets, 345 at 1023,
 * where the ladder's type is largest (334 at 900, 321 at 768). `halfRef` and
 * `halfMin` are defined BY the range the table serves (900 and 768), as the
 * two ends' are by theirs. And `axisPct` is SOLVED for the screen this range
 * mostly is, a tablet held upright: no reference is that tall for its width, so
 * the composed 34 percent left the composition in the top two thirds with a
 * quarter of the screen empty under it; at 38 the object's top and the block's
 * foot stand about the same distance from the header and the fold at 900 by
 * 1200. A short desk window at these widths clamps as the others do.
 */
const GEO_TABLET: Geo = {
  card: between(GEO_BASE.card, GEO_LG.card),
  perspective: between(GEO_BASE.perspective, GEO_LG.perspective),
  fade: `${between(pct(GEO_BASE.fade), pct(GEO_LG.fade))}%`,
  blockW: 529,
  blockH: 345,
  h1Max: between(GEO_BASE.h1Max, GEO_LG.h1Max),
  lowMax: between(GEO_BASE.lowMax, GEO_LG.lowMax),
  margin: between(GEO_BASE.margin, GEO_LG.margin),
  breath: between(GEO_BASE.breath, GEO_LG.breath),
  airTop: between(GEO_BASE.airTop, GEO_LG.airTop),
  airFoot: between(GEO_BASE.airFoot, GEO_LG.airFoot),
  axisPct: 38,
  halfRef: 450, // the 900 canvas the board was judged on
  halfMin: 384, // a 768 px tablet, where the tablet's geometry starts
  inset: 27,
};

export const GEO: Record<Geometry, Geo> = {
  base: GEO_BASE,
  tablet: GEO_TABLET,
  lg: GEO_LG,
};

/** The block's half-column, as a fraction of the hero's half-width at the
 *  geometry's own design reference: the column the stream's reach is measured
 *  at, derived so the block's width is the only place it is typed. */
export const colOf = (geo: Geo) => geo.blockW / (2 * geo.halfRef);

/** The shapes an album is made of: half 4:5 portrait (a phone held up), a
 *  quarter square, a quarter 4:3. Each pair has the same area, so neighbouring
 *  frames carry the same visual weight whatever shape they are. */
const ASPECTS = [
  [0.9, 1.11], // 4:5 portrait
  [1, 1], // square
  [1.15, 0.87], // 4:3 landscape
  [0.9, 1.11], // 4:5 again
] as const;

/**
 * THE STAND-IN FRAMES: the twelve manifest images, sequenced so neighbours vary
 * in palette and subject. Every id is resolved through the media manifest,
 * which is the only source of a path, and `hero-stream.test.ts`
 * holds each one to it. Will's 34-square set (ASSETS row 2) replaces them by
 * id and nothing else changes: the stream needs 18 for no photograph to be on
 * screen twice, and these twelve repeat until it lands.
 */
export const STREAM_FRAMES = [
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

/* ── The object: the link card ───────────────────────────────────────────── */

/**
 * THE OBJECT IS THE LINK CARD, THE GUESTS ON THEIR PHOTOGRAPHS (`hero-card`
 * r2, `card=guests`): a small white card, a digital invite, carrying the event
 * link's two faces (the code, and the custom address with its domain quiet so
 * the slug leads), the rest of the guests counted in at its end, and four
 * prints standing up out of its top edge, each wearing the face of the guest
 * who added it, the one a guest filmed wearing the album's play mark. So the
 * one object says what the product is: one link, everyone adds to it, photos
 * and videos, and the album the band pours out of it. The drawing is
 * `cinema-hero-card.tsx`; its numbers are here because the axis's floor and the
 * object's own floor are solved from its box.
 *
 * ★ TWO SIZES ARE DRAWN AND THE TABLET'S IS COMPOSED: `base` and `lg` are the
 * board's two drawings, and a tablet's card is every length `TABLET_STEP` of the
 * way between them, unrounded, which is exactly what the sheet's `--hhs-k` does
 * to the one card in the markup. One card rather than a copy per breakpoint,
 * so its photographs load once and eagerly, as the band's lit frames do.
 */
export type ObjectGeo = {
  /** The card's box and corner, the code's edge (quiet zone included) and the
   *  padding; the gap between its three parts is the padding plus two. */
  w: number;
  h: number;
  radius: number;
  code: number;
  pad: number;
  /** The address's two lines: the domain over the slug. */
  domain: number;
  slug: number;
  /** The count chip's edge, and the face pinned to each print. */
  count: number;
  face: number;
  /** A print: its box and the white border round its photograph. */
  print: { w: number; h: number; border: number };
  /** How far the prints stand over the card's top edge: the box is `rise + h`. */
  rise: number;
  /** The four prints: `x` from the card's centre, turned `r` degrees about
   *  their own foot, `y` down from the box's top. */
  fan: readonly { x: number; r: number; y: number }[];
};

const OBJECT_BASE: ObjectGeo = {
  w: 224,
  h: 60,
  radius: 13,
  code: 42,
  pad: 9,
  domain: 10,
  slug: 14,
  count: 22,
  face: 19,
  print: { w: 74, h: 92, border: 3 },
  rise: 70,
  fan: [
    { x: -65, r: -12, y: 12 },
    { x: -23, r: -4, y: 0 },
    { x: 21, r: 5, y: 3 },
    { x: 62, r: 13, y: 14 },
  ],
};

const OBJECT_LG: ObjectGeo = {
  w: 312,
  h: 80,
  radius: 16,
  code: 58,
  pad: 11,
  domain: 12,
  slug: 18,
  count: 30,
  face: 26,
  print: { w: 104, h: 130, border: 4 },
  rise: 98,
  fan: [
    { x: -92, r: -12, y: 16 },
    { x: -33, r: -4, y: 0 },
    { x: 29, r: 5, y: 4 },
    { x: 88, r: 13, y: 20 },
  ],
};

type Num = number | readonly Num[] | { readonly [k: string]: Num };

/** Every number of a table `TABLET_STEP` of the way from one drawing to the
 *  other: structural, so a table stays the one place its sizes are written. */
function compose<V extends Num>(base: V, lg: V): V {
  if (typeof base === "number")
    return (base + TABLET_STEP * ((lg as number) - base)) as V;
  if (Array.isArray(base))
    return base.map((b: Num, i) =>
      compose(b, (lg as readonly Num[])[i]),
    ) as unknown as V;
  const out: Record<string, Num> = {};
  for (const k of Object.keys(base))
    out[k] = compose(
      (base as Record<string, Num>)[k],
      (lg as Record<string, Num>)[k],
    );
  return out as unknown as V;
}

export const OBJECT: Record<Geometry, ObjectGeo> = {
  base: OBJECT_BASE,
  tablet: compose(OBJECT_BASE, OBJECT_LG),
  lg: OBJECT_LG,
};

/** The white ring round a pinned face, in px: it paints outside the face. */
export const FACE_RING = 2;

/** Where a pinned face's box starts, as a share of the face, up and left of
 *  its print's corner: over the corner like a name on a print passed round. */
export const FACE_OFFSET = 0.3;

/**
 * How far the object PAINTS above its box, in px. A print turned about its foot
 * lifts one top corner, and the face pinned over its top-left corner rides
 * higher still (the third print's, at every size). Solved rather than measured
 * once, so a retuned fan re-solves the axis's floor with it.
 */
export function overOf(o: ObjectGeo): number {
  let top = 0;
  const { w, h } = o.print;
  for (const f of o.fan) {
    const t = (f.r * Math.PI) / 180;
    // The pivot is the print's foot (`transform-origin: 50% 100%`).
    const foot = f.y + h;
    top = Math.min(
      top,
      foot - h * Math.cos(t) - (w / 2) * Math.abs(Math.sin(t)),
    );
    // The face's centre, from the pivot: its box starts FACE_OFFSET of itself
    // up and left of the print's corner, so its centre is a fifth in.
    const dx = -w / 2 + (0.5 - FACE_OFFSET) * o.face;
    const dy = -h + (0.5 - FACE_OFFSET) * o.face;
    const cy = foot + dx * Math.sin(t) + dy * Math.cos(t);
    top = Math.min(top, cy - o.face / 2 - FACE_RING);
  }
  return -top;
}

/** The object's box height: the prints' rise and the card under them. */
export const boxOf = (o: ObjectGeo) => o.rise + o.h;

/** The demo's short door, which the card's code encodes after the origin: the
 *  code only has to DRAW as a code at a card's size (the demo modal carries
 *  the one that scans), and this short value is 25 modules where the event
 *  link is 33, so it reads as a code rather than a grey square. A phone that
 *  does scan it lands on the demo (`app/demo/route.ts`). */
export const OBJECT_CODE_PATH = "/demo";

/** The quiet zone FooterQr bakes into its viewBox, in modules, both sides. */
export const QR_QUIET = 8;

/**
 * THE CARD'S ONE EVENT, a stand-in the host's custom link would name: the
 * address as a Pro or Event Pass host claims it (`/e/<slug>`), at a slug's
 * ordinary length, and the album's photographs and guests. ★ PLACEHOLDER: the
 * album's photographs and its guests' faces are ASSETS rows 33 and 34, which
 * replace these by id; the faces are the guest list's seeded avatars until then.
 */
export const OBJECT_EVENT = {
  domain: "partyreel.com/e/",
  slug: "mia-and-theo",
  /** How many are in: the four on the prints and the rest the chip counts. */
  guests: 34,
} as const;

/** The four prints, left to right: each photograph and the guest who added it.
 *  The toast is the one a guest filmed, so it wears the play mark. */
export const OBJECT_PRINTS = [
  { photo: "wedding-petals", seed: "demo-guest-ruby", initial: "R" },
  { photo: "wedding-rings", seed: "demo-guest-sam", initial: "S" },
  { photo: "reception-table", seed: "demo-guest-theo", initial: "T" },
  {
    photo: "wedding-toast",
    seed: "demo-guest-jules",
    initial: "J",
    video: true,
  },
] as const;

/* ── The band's table ────────────────────────────────────────────────────── */

/**
 * THE MELIUS SHAPE, the reference Will named on round six: one file a side on
 * ONE axis. No station, no roll, one depth, so the only variables are the two
 * that read as space, size and turn, and both are functions of the distance
 * crossed rather than of the clock.
 *
 * ★ THE SPACING IS THE FRAME'S OWN WIDTH, and that is what the exponential
 * travel buys. An even travel with a scale that opens outward puts big frames
 * on top of each other at the edge and tiny ones far apart at the object; a
 * travel whose velocity grows about as fast as the frame does keeps the gap
 * between neighbours a fixed fraction of their width the whole way out, which
 * is what a file of photographs looks like when nobody has bumped it.
 *
 * ★ THE CURL IS THE TURN GROWING WITH THE DISTANCE. The outer edge of a frame
 * comes forward harder the further out it stands, under a short perspective, so
 * the band reads as the inside of a cylinder with the object on its far wall
 * rather than as a row of flat cards.
 */

/** One launch per beat, per arm; the pair leaves together, which is the symmetry. */
const BEAT: Record<Geometry, number> = {
  base: 1350,
  tablet: between(1350, 1250),
  lg: 1250,
};

/** One frame's flight, birth to gone, in ms. */
export const FLIGHT = 9600;

/** How far a frame travels over a whole flight, in HALF-WIDTHS of the hero:
 *  the tablet's is composed to two places, the one dimensionless field. */
const SPAN: Record<Geometry, number> = {
  base: 2.6,
  tablet: Math.round((2.6 + TABLET_STEP * (2.08 - 2.6)) * 100) / 100,
  lg: 2.08,
};

/** e^KAPPA is the ratio of the velocity at the edge to the velocity at the code. */
const KAPPA = 2.3;

/** The curl, in degrees: a few at the object, hard at the edge. */
const TURN = { code: 6, edge: 44 } as const;

/** The transform scale a frame reaches at the edge. */
const GAIN = 0.92;

/** The unit card box, as a multiple of `Geo.card`. */
const CARD_SCALE = 0.85;

/** The branch-out: the launch times are multiplied by this, so at elapsed 0
 *  every frame is behind the object and REVEAL_MS later the band is deployed. */
export const REVEAL_MS = 1750;

/* ── The primitives ──────────────────────────────────────────────────────── */

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

const mod = (a: number, n: number) => ((a % n) + n) % n;

/** ease-in-out-quart, which IS --ease-in-out-strong's cubic-bezier
 *  (0.77, 0, 0.175, 1), written out so the reveal needs no bezier solver and
 *  stays deterministic on the server and in the browser alike. */
export function revealEase(t: number) {
  const u = clamp01(t);
  if (u < 0.5) return 8 * u * u * u * u;
  const v = 1 - u;
  return 1 - 8 * v * v * v * v;
}

/* ── One frame ───────────────────────────────────────────────────────────── */

export type Card = {
  key: string;
  /** -1 = the left arm, 1 = the right. */
  dir: 1 | -1;
  /** Position in its arm: the launch order, the aspect and the photograph. */
  slot: number;
  /** The index into STREAM_FRAMES. */
  photo: number;
  /** The unit box in px at transform scale 1. */
  w: number;
  h: number;
  /** The launch time inside the cycle, in ms. */
  at: number;
};

/** The distance crossed, as a fraction of the whole travel. */
const travelAt = (p: number) =>
  (Math.exp(KAPPA * clamp01(p)) - 1) / (Math.exp(KAPPA) - 1);

/**
 * ★ SCALE, OPACITY AND TURN ARE FUNCTIONS OF THE DISTANCE CROSSED, never of the
 * phase, and `out` is that distance: 0 at the axis's centre, 1 at the edge of
 * the hero, on past it as the frame leaves. Reading them off the distance is
 * also what makes them width-independent, so one table serves every viewport
 * the geometry covers.
 */

/** Growing from the centre outward from the first pixel: the whole band is
 *  the growth, so it starts at once. */
export const scaleAt = (out: number) =>
  0.18 + 0.82 * Math.pow(clamp01(out), 1.2);

/** Solid once its edge clears the object: emerging from BEHIND it, never
 *  switched on beside it. */
export const opacityAt = (out: number) => smoothstep(0.02, 0.14, out);

/** Where `opacityAt` reaches 1: the distance a frame is whole at. */
export const SOLID_OUT = 0.14;

const turnAt = (out: number, dir: 1 | -1) =>
  -dir * (TURN.code + (TURN.edge - TURN.code) * smoothstep(0.2, 1, out));

/**
 * Where a frame is at a phase: `x` and `out` in HALF-WIDTHS of the hero, the
 * transform scale, and the half-extents in px. The one description the loop,
 * the rest state, the DOM box, the clear lane and the tests all measure.
 */
export function placeAt(c: Card, p: number, g: Geometry) {
  const out = travelAt(p) * SPAN[g];
  const s = scaleAt(out) * GAIN;
  return { s, out, x: c.dir * out, hw: (c.w / 2) * s, hh: (c.h / 2) * s };
}

/**
 * One frame at one phase, as the loop and the rest state both need it. The two
 * have to agree exactly or the first frame after hydration is a jump, which is
 * why they are one function rather than two.
 *
 * ★ THE HORIZONTAL IS A CALC, not a pixel count. `--hhs-half` is half the
 * hero's own width (50cqw on the corridor), so this one string is correct at
 * every viewport and on resize, and the sheet can paint the rest state with no
 * script at all. The vertical is a flat zero: the band runs on one axis.
 */
export function frameAt(c: Card, p: number, g: Geometry, fit: number) {
  const q = placeAt(c, p, g);
  return {
    transform: `translate3d(calc(var(--hhs-half) * ${q.x.toFixed(4)}), 0px, 0) rotateY(${turnAt(q.out, c.dir).toFixed(2)}deg) scale(${(q.s / fit).toFixed(4)})`,
    opacity: opacityAt(q.out),
    // Near over far, as an integer so the browser is not handed a new stacking
    // order sixty times a second. Apparent size IS the depth on one axis, so
    // one number orders the whole band.
    z: 1 + Math.round(q.s * 40),
  };
}

/* ── The solvers, run once per geometry at module load ───────────────────── */

/** The sampling resolution: 480 over a flight is a 20 ms answer, finer than
 *  any fade the band carries. */
const SCAN = 480;

export type Built = {
  cards: Card[];
  /** Launch slots per arm. */
  pool: number;
  /** The cycle a slot relaunches on. */
  cycle: number;
  /** Per card, in order: the DOM box, the scale divisor, and the progress past
   *  which the loop stops writing to it. */
  box: { w: number; h: number; fit: number; exit: number }[];
  /**
   * THE BLOCK'S TOP, in px below the axis: the measured clear line the
   * headline, the sentence and the actions hang from.
   */
  low: number;
  /** The object's box height and how far it paints above that box, in px. */
  object: { box: number; over: number };
  /**
   * THE OBJECT'S FLOOR, in px: how far over the axis its centre may stand, so
   * the axis never runs less than `Geo.inset` above its foot. The object stands
   * in the middle of its air, between the header's foot and the block's top,
   * but on a tall screen that middle rides higher than the axis (the axis is a
   * third of the hero, the middle about half), and the band would be born in
   * the open under it; the sheet's `.hhs-object` takes the lower of the two.
   */
  lift: number;
  /** The axis's floor, in px from the hero's top edge, which IS the viewport's
   *  top: the lowest axis at which the object's painted top still clears the
   *  sticky header's band by `Geo.airTop`. */
  axisMin: number;
  /** The block's whole reach below the axis, `low` included: the clamp's tail. */
  below: number;
  /** What the hero cannot be shorter than, in px, for the object to clear the
   *  header and the block to clear the stream and the fold. */
  minH: number;
  /** The busiest instant's frame count, and the largest DOM box. */
  facts: { onScreen: number; largest: number };
};

/**
 * The largest transform scale a frame ever reaches WHILE A PERSON CAN SEE IT,
 * and the progress at which it has left the hero. The first sizes the DOM box
 * so no frame is ever rasterized above 1:1 on screen; the second lets the loop
 * stop writing to a frame that is gone, which keeps about half the pool off the
 * compositor.
 */
function fitOf(c: Card, g: Geometry) {
  const { halfMin } = GEO[g];
  let fit = 0.001;
  let exit = 1;
  for (let i = 0; i <= SCAN; i++) {
    const p = i / SCAN;
    const q = placeAt(c, p, g);
    // Past the edge of the narrowest viewport this geometry serves, which is
    // the last one the frame is still visible on (see Geo.halfMin): taken there
    // so the loop never stops writing to a frame a wider screen still shows.
    if (Math.abs(q.x) - q.hw / halfMin > 1) {
      exit = p;
      break;
    }
    if (opacityAt(q.out) > 0.004 && q.s > fit) fit = q.s;
  }
  // ★ A SAMPLED MAXIMUM IS NOT THE MAXIMUM. The scan lands on a grid and the
  // true peak falls between two samples, so the DOM box is given one percent of
  // headroom: the error at this resolution is under three tenths of a percent,
  // and the whole point of `fit` is that the on-screen size is never LARGER
  // than the box.
  return { fit: fit * 1.01, exit };
}

/**
 * How far from the axis the stream reaches over the block's column: every
 * frame, every sample, the tallest half-height of any frame whose horizontal
 * span covers that column. This is the measurement the block is placed from, so
 * "no photograph is ever under a word" is a condition the composition is drawn
 * from rather than a hope about it. Rotation is not modelled (a rotateY only
 * narrows a box), so the answer carries an eight percent allowance.
 *
 * `half` decides which viewport the question is asked at, because a frame's
 * pixel width is a wider FRACTION of a narrow screen: `Geo.halfRef` is the
 * design reference the answer is solved at, `Geo.halfMin` the worst case
 * `hero-stream.test.ts` re-checks.
 */
export function reachOf(cards: Card[], g: Geometry, col: number, half: number) {
  let out = 0;
  for (const c of cards) {
    for (let i = 0; i <= SCAN; i++) {
      const p = i / SCAN;
      const q = placeAt(c, p, g);
      if (opacityAt(q.out) <= 0.02) continue;
      const ax = Math.abs(q.x);
      const hw = q.hw / half;
      if (ax - hw <= col && col <= ax + hw && q.hh > out) out = q.hh;
    }
  }
  return out * 1.08;
}

/** The band's frames for a geometry: one file a side, launched on its beat. */
function cardsOf(g: Geometry): { cards: Card[]; pool: number; cycle: number } {
  const geo = GEO[g];
  // Every airborne frame needs its own node, plus one on the ground so a slot
  // never relaunches while its last flight is still running.
  const pool = Math.ceil(FLIGHT / BEAT[g]) + 1;
  const cycle = pool * BEAT[g];
  const half = Math.round(STREAM_FRAMES.length / 2);
  const cards: Card[] = Array.from({ length: pool * 2 }, (_, n) => {
    const right = n % 2 === 1;
    const slot = (n - (right ? 1 : 0)) / 2;
    const [aw, ah] = ASPECTS[(slot + (right ? 1 : 0)) % ASPECTS.length];
    return {
      key: `hhs-${n}`,
      dir: (right ? 1 : -1) as 1 | -1,
      slot,
      // The two arms read their photographs from windows half the set apart,
      // so a pair leaving together is never the same picture twice.
      photo: slot + (right ? half : 0),
      w: geo.card * CARD_SCALE * aw,
      h: geo.card * CARD_SCALE * ah,
      at: mod(slot * BEAT[g], cycle),
    };
  });
  return { cards, pool, cycle };
}

export function build(g: Geometry): Built {
  const geo = GEO[g];
  const { cards, pool, cycle } = cardsOf(g);

  const box = cards.map((c) => {
    const { fit, exit } = fitOf(c, g);
    return { w: Math.round(c.w * fit), h: Math.round(c.h * fit), fit, exit };
  });

  // ★ SOLVED AT THE LINE NEAREST THE STREAM, AT THAT LINE'S OWN MEASURE. The
  // block's top line is the headline, which is also its widest, so the column
  // is the headline's ink. (The object never binds it: it stands in the middle
  // of the air over the block, or on its floor well above it.)
  const low = Math.round(
    reachOf(cards, g, colOf(geo), geo.halfRef) + geo.margin + geo.breath,
  );
  const below = low + geo.blockH + geo.airFoot;

  const object = { box: boxOf(OBJECT[g]), over: overOf(OBJECT[g]) };
  const lift = object.box / 2 - geo.inset;
  // ★ THE AXIS'S FLOOR IS THE OBJECT'S. At the floor the object stands in the
  // middle of its air, so its painted top is (HEADER + axis + low) / 2, less
  // half its box and what it paints above it; this is that line held at
  // `airTop` under the header, solved for the axis.
  const axisMin = Math.ceil(
    HEADER + 2 * geo.airTop + object.box + 2 * object.over - low,
  );

  return {
    cards,
    pool,
    cycle,
    box,
    low,
    object,
    lift,
    axisMin,
    below,
    // The two ends of the clamp meet exactly here, which is the point: at this
    // height the object sits at its floor AND the block ends at the fold, so
    // anything taller has room to spare and anything shorter would have to
    // give one of them up.
    minH: axisMin + below,
    facts: countAt(cards, box, g, cycle),
  };
}

/**
 * What the composition costs, measured rather than asserted: how many frames
 * are on screen at once and the largest DOM box. Sampled across one whole
 * cycle, because a cadence has a busiest instant and a quietest one and an
 * average would hide both; the count reported is the busiest, which is the one
 * that costs.
 */
function countAt(cards: Card[], box: Built["box"], g: Geometry, cycle: number) {
  let onScreen = 0;
  for (let t = 0; t < cycle; t += 40) {
    let n = 0;
    for (let i = 0; i < cards.length; i++) {
      const p = mod(cards[i].at + t, cycle) / FLIGHT;
      if (p <= box[i].exit && opacityAt(placeAt(cards[i], p, g).out) > 0.02)
        n++;
    }
    if (n > onScreen) onScreen = n;
  }
  return { onScreen, largest: Math.max(...box.map((b) => b.w)) };
}

/** All three geometries, solved once for the module. Plain arithmetic on both
 *  sides, so the server and the browser agree and the rest state hydrates
 *  without a warning. */
export const BUILT: Record<Geometry, Built> = {
  base: build("base"),
  tablet: build("tablet"),
  lg: build("lg"),
};

/**
 * THE BLOCK'S BOX as the test measures it: the half-column as a FRACTION of the
 * hero's half-width (a frame's own x is one too), the top and the foot in px
 * below the axis. `half` is the viewport the question is asked at; passing
 * `Geo.halfMin` asks it where the band crowds the block hardest.
 */
export function blockBox(g: Geometry, half: number) {
  const geo = GEO[g];
  const { low } = BUILT[g];
  return {
    col: geo.blockW / (2 * half),
    top: low,
    bottom: low + geo.blockH,
  };
}

/**
 * The `sizes` every frame carries, derived from the largest DOM box each
 * geometry actually renders rather than typed by hand: retune the card and the
 * request retunes with it. Never a vw value, because the box is a fixed pixel
 * size in a given geometry and a vw would over-fetch on a wide screen.
 */
export const FRAME_SIZES = `(min-width: ${LG_MIN}px) ${BUILT.lg.facts.largest}px, (min-width: ${TABLET_MIN}px) ${BUILT.tablet.facts.largest}px, ${BUILT.base.facts.largest}px`;

/** The phase a frame stands at when nothing is running: the band deployed at
 *  its steady spacing, which is what reduced motion, a crawler, a cold paint
 *  and a reader with scripting off all get. */
export const restPhase = (c: Card) => Math.min(c.at / FLIGHT, 1);

/** The launch clock, as a closed form: the ONE expression the loop runs. */
export const phaseOf = (
  c: Card,
  elapsed: number,
  reveal: number,
  cycle: number,
) => mod(c.at * reveal + elapsed, cycle) / FLIGHT;
