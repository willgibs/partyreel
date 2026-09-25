import {
  BUILT as HOME_BUILT,
  type Bp,
  FLIGHT as HOME_FLIGHT,
  GEO as HOME_GEO,
  LG_MIN,
  placeAt as homePlaceAt,
} from "@/components/marketing/sections/home/hero-stream";

/**
 * THE ALBUM STREAM: photographs falling into the live album (the album-wiring
 * lane, 2026-09-19).
 *
 * Will's `motion=stream` on the album page's hero: "Small photographs appear
 * beside the words and glide down into the album's top edge." And on what it
 * still owes: "I love the images falling into the album. I was just curious to
 * see maybe two to three variations of this concept to get an idea of what the
 * best version is." So the composition is PARAMETERISED here rather than drawn
 * once: `glide` is the shipped version, `gather` and `cascade` are the two
 * the `album-motion` board draws beside it on the wired hero, and switching is a
 * one-word change to `SHIPPED` below.
 *
 * ── WHAT CHANGED ON THE WAY OUT OF THE LAB ───────────────────────────────────
 *
 * ★ THE CANVAS IS GONE. The board (`sandbox/album-page/margins.ts`) solved two
 * fixed canvases, 1440 and 375, and stored every position in canvas pixels; a
 * real viewport is any width. The home hero hit this first and answered it by
 * storing the horizontal as a fraction of the hero's HALF-WIDTH (hero-stream.ts
 * "what changed on the way out of the lab"), and this goes one step further,
 * because this composition has to clear a lockup whose column is a FIXED 768 px
 * at every width it is drawn at. So a horizontal is an AFFINE function of the
 * half-width, `x = a + b * half` px from the hero's centre line:
 *
 *   a frame born beside the words   a = (1 - f) * LOCK, b = f     f across the side band
 *   a frame landing in the album    a = g * ALBUM_HALF, b = 0     g across the album
 *
 * The first slides with the window and always keeps the same share of the room
 * BETWEEN the lockup and the screen's edge; the second is pinned to the album's
 * own column, which does not move once the window is wide enough to hold it.
 * One string of CSS `calc()` carries both (`frameAt`), so the composition is
 * correct at 1024 and at 1920 with no second table and no measurement.
 *
 * ★ THE VERTICAL IS ANCHORED ON THE ALBUM'S TOP EDGE, not on the section's top.
 * Every `y` here is px measured DOWN from the edge the photographs fall into
 * (negative above it), and the layer places that origin at a fixed distance
 * from the hero's FOOT (`STAGE.h + STAGE.floor`), which is a constant the hero
 * and this module share. So the lockup may wrap to three lines at 1100 px and
 * the stream does not move relative to the one thing it is aimed at. No layout
 * is read at any point: not on the server, not on resize, not in a frame.
 *
 * ★ PURE, AND THAT IS LOAD-BEARING (hero-stream.ts's rule, kept). No React, no
 * stylesheet, no `env`: every variant solves at module load, the server and the
 * browser compute the same still, and the node tests read the same tables the
 * component draws. It is also what lets the hero's rest state render on the
 * SERVER, which is Will's `no-script=settled`.
 *
 * ★ THE PACE IS READ OFF THE HOME HERO, NEVER TYPED (his round-three note: the
 * calm caps made all four compositions "too boring"). `HOME` below is measured
 * from the shipped stream by import, so a retune of the home hero re-paces this
 * one with it, and nothing here is a cap.
 */

export type { Bp };
export { LG_MIN };

/* ── The reference: the home hero, measured rather than retyped ──────────── */

/**
 * How far a home-hero frame has travelled `ms` after it left the code, in px at
 * that breakpoint's design reference (1440 and 375). It is the SHIPPED curve,
 * imported read-only. Past its own flight the home curve stops, so the tail
 * carries on at its final speed.
 */
export function homeTravel(ms: number, bp: Bp): number {
  const card = HOME_BUILT[bp].cards[0];
  const px = (p: number) => homePlaceAt(card, p, bp).out * HOME_GEO[bp].halfRef;
  if (ms <= 0) return 0;
  if (ms <= HOME_FLIGHT) return px(ms / HOME_FLIGHT);
  const step = 1 / 480;
  const v = (px(1) - px(1 - step)) / (HOME_FLIGHT * step);
  return px(1) + v * (ms - HOME_FLIGHT);
}

/** The speed on that curve `ms` after launch, px a second. */
export function homeSpeed(ms: number, bp: Bp): number {
  const d = 8;
  return ((homeTravel(ms + d, bp) - homeTravel(ms, bp)) / d) * 1000;
}

/**
 * THE REFERENCE PACE: a pair every 1250 ms at 1440 (1350 at a phone), a frame
 * leaving at about 40 px a second and gathering to about 212 by the edge of the
 * screen, with about ten frames lit at once. Every number is read off the
 * shipped engine; `stream-engine.test.ts` holds it to that.
 */
export const HOME = (() => {
  const of = (bp: Bp) => ({
    beat: Math.round(HOME_BUILT[bp].cycle / HOME_BUILT[bp].pool),
    flight: HOME_FLIGHT,
    launch: homeSpeed(0, bp),
    lit: HOME_BUILT[bp].facts.onScreen,
    half: HOME_GEO[bp].halfRef,
  });
  return { base: of("base"), lg: of("lg") } as const;
})();

/* ── The primitives ──────────────────────────────────────────────────────── */

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export const mod = (a: number, n: number) => ((a % n) + n) % n;

/** The shapes an album is made of: half 4:5 (a phone held up), a quarter
 *  square, a quarter 4:3, each pair the same area so neighbours weigh the same.
 *  The home hero's own table, so the two compositions share one family. */
export const ASPECTS = [
  [0.9, 1.11],
  [1, 1],
  [1.15, 0.87],
  [0.9, 1.11],
] as const;

/** A few degrees of tilt, walked in order: photographs laid down, never dealt. */
export const ROLLS = [-3, 2, -1.5, 3.5, -2.5, 1.5, -3.5, 2.5] as const;

/* ── The hero's own geometry, shared with the section that draws it ──────── */

/**
 * THE ALBUM'S STAGE, and the only place its numbers are written. The hero reads
 * them for its own box (`live-album-stage.tsx`, `arrivals-hero.tsx`) and this
 * module reads them for the stream's anchor, so the two cannot drift: the
 * photographs land on the edge the album is actually drawn at.
 *
 * `h` is what the album shows before its foot dissolves, `fade` how much of
 * that dissolves (Will's note on the width: "If this width makes the dashboard
 * visual too tall, we can fade out the bottom"), and `floor` the air under it
 * to the end of the section.
 */
export const STAGE: Record<Bp, { h: number; fade: number; floor: number }> = {
  base: { h: 430, fade: 170, floor: 110 },
  lg: { h: 600, fade: 240, floor: 150 },
};

/** The gap between the lockup's foot and the album's top edge. At `base` it is
 *  the strip the stream lives in (a phone's words fill the column, so there is
 *  no room BESIDE them), which is why it is so much larger than `lg`'s air. */
export const GAP: Record<Bp, number> = { base: 200, lg: 64 };

/** Half the lockup's own column (`PageHero`'s `max-w-3xl`), in px. It does not
 *  scale: the words hold one measure at every width they are drawn at, so the
 *  empty side is the half-width MINUS this, and that is the band the stream is
 *  born in. */
export const LOCK = 384;

/**
 * ★ WHERE THE TWO COMPOSITIONS SWAP, AND WHY IT IS NOT THE HOME HERO'S 1024.
 * The side-band composition needs room BESIDE a 768 px lockup, and at 1024 that
 * room is 128 px a side, narrower than one frame: every photograph would have
 * to cross the words to exist. At 1280 the band is 256 px, which holds a frame
 * with air either side, so that is where the page changes its mind and
 * everything below it takes the `base` composition (the strip UNDER the words),
 * which needs no side room at all. `album-stream.css` says 1280 too, and that
 * is the one duplication here: a media query cannot read a module.
 */
export const STREAM_LG_MIN = 1280;

/**
 * THE NARROWEST VIEWPORT EACH COMPOSITION SERVES, halved. Every horizontal here
 * is partly a FRACTION of the half-width, so a frame covers a wider share of a
 * narrow screen than of a wide one and the band crowds the words hardest at the
 * bottom of the range. The clear lane is therefore asked HERE, not at the design
 * reference (`stream-engine.test.ts`), which is the home hero's own discipline.
 * If that check ever fails, the answer is a higher swap, never a thinner margin.
 */
export const HALF_MIN: Record<Bp, number> = {
  base: 160, // a 320 px phone
  lg: STREAM_LG_MIN / 2,
};

/** Half the album's column (`max-w-4xl`, the site's 896 step) at `lg`. At
 *  `base` the album is the container's own width, so the landing is a fraction
 *  of the half-width instead and this is unused. */
const ALBUM_HALF = 448;

/* ── One frame ───────────────────────────────────────────────────────────── */

export type Card = {
  key: string;
  /** Position in the launch table; also the stand-in photograph's index. */
  slot: number;
  photo: number;
  /** The unit box in px at transform scale 1, before `fit`. */
  w: number;
  h: number;
  /** How far into its flight the card is at elapsed 0, in ms: the clock. */
  at: number;
  /** rotateZ in degrees, constant for the card's whole life. */
  roll: number;
  /** The path it walks, in (a, b, y) space, with its running length. */
  path: Path;
  /** How long THIS path takes on the reference curve, ms. The paths are not the
   *  same length, so a frame that lands waits from its own arrival rather than
   *  from the slowest one's. */
  arrive: number;
};

/**
 * A card at an age. The horizontal is affine in the hero's half-width
 * (`x = a + b * half`, px from the centre line); the vertical is px from the
 * album's top edge, down.
 */
export type Place = { a: number; b: number; y: number; s: number };

/** The horizontal in px at a given half-width: the one place the two combine. */
export const xAt = (p: Place, half: number) => p.a + p.b * half;

type Pt = { a: number; b: number; y: number };

type Path = {
  length: number;
  at: (d: number) => Pt & { u: number };
};

/** A polyline with its running length, walked by DISTANCE at the design
 *  reference. The mapping to a real viewport is affine, so a distance measured
 *  once is the same share of the path at every width. */
function pathOf(points: Pt[], half: number): Path {
  const px = (p: Pt) => p.a + p.b * half;
  const acc = [0];
  for (let i = 1; i < points.length; i++)
    acc.push(
      acc[i - 1] +
        Math.hypot(
          px(points[i]) - px(points[i - 1]),
          points[i].y - points[i - 1].y,
        ),
    );
  const length = acc[acc.length - 1];
  return {
    length,
    at: (d: number) => {
      const dd = Math.min(Math.max(d, 0), length);
      let i = 1;
      while (i < acc.length - 1 && acc[i] < dd) i++;
      const seg = acc[i] - acc[i - 1] || 1;
      const t = (dd - acc[i - 1]) / seg;
      const lerp = (k: "a" | "b" | "y") =>
        points[i - 1][k] + (points[i][k] - points[i - 1][k]) * t;
      return {
        a: lerp("a"),
        b: lerp("b"),
        y: lerp("y"),
        u: length > 0 ? dd / length : 0,
      };
    },
  };
}

/**
 * THE FALL: a cubic from `p` to `q` whose two control points BOTH sit on `p`'s
 * own vertical, `at` of the way down.
 *
 * ★ BOTH CONTROLS ON ONE VERTICAL IS THE WHOLE TRICK, and it is why this is a
 * cubic rather than the quadratic the board drew. With `c1.x = c2.x = p.x` the
 * horizontal collapses to `p.x + (q.x - p.x) * t³` while the vertical stays
 * nearly linear: a frame is still 91 percent of the way out at the moment it is
 * 80 percent of the way DOWN, so it falls BESIDE the words and only tucks in
 * once it is past their foot. A quadratic moves its horizontal as `t²`, a
 * quarter of the way in by the time it is half way down, and that is what
 * crossed the lockup's column at 1280 in the first draft.
 *
 * `at` is therefore purely HOW LATE THE TUCK IS: 1 falls the whole way and
 * turns at the album, 0 is a straight diagonal.
 */
function bend(p: Pt, q: Pt, at: number, n = 48): Pt[] {
  const cy = p.y + (q.y - p.y) * at;
  const c = { a: p.a, b: p.b, y: cy };
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const u = 1 - t;
    const mix = (k: "a" | "b" | "y") =>
      u * u * u * p[k] +
      3 * u * u * t * c[k] +
      3 * u * t * t * c[k] +
      t * t * t * q[k];
    return { a: mix("a"), b: mix("b"), y: mix("y") };
  });
}

/* ── A composition ───────────────────────────────────────────────────────── */

export type Field = {
  bp: Bp;
  cards: Card[];
  /** ms between one launch of a slot and the next. */
  cycle: number;
  /** ms a card is airborne; past it the card is gone. */
  flight: number;
  place: (c: Card, age: number) => Place;
  opacity: (c: Card, age: number) => number;
};

export type Solved = Field & {
  /** Per card: the DOM box, the scale it divides by, the age past which the
   *  loop stops writing to it. */
  box: { w: number; h: number; fit: number; exit: number }[];
  facts: {
    /** The most cards lit at one instant over a whole cycle. */
    lit: number;
    /** DOM nodes the composition hands the compositor. */
    nodes: number;
    /** ms between one arrival and the next. */
    beat: number;
    /** px a second a frame leaves at, at the design reference. */
    launch: number;
    /** The fastest a lit card moves, px a second, at the design reference. */
    fastest: number;
  };
  /** The numbers in words, for a board's caption and a handoff's measurement. */
  caption: string;
};

/** The age a card stands at when nothing runs: the loop at elapsed 0. */
export const restAge = (c: Card) => c.at;

/** THE ONE EXPRESSION THE LOOP RUNS: a card's age at an elapsed time. */
export const ageOf = (c: Card, elapsed: number, cycle: number) =>
  mod(c.at + elapsed, cycle);

/** The sampling resolution the solver walks a flight at. */
const SCAN = 480;

/**
 * The box, the exit and the facts, MEASURED off `place` and `opacity` rather
 * than claimed. ★ A SAMPLED MAXIMUM IS NOT THE MAXIMUM: the true peak falls
 * between two samples, so the DOM box carries one per cent of headroom, and a
 * card only ever scales DOWN from it (which is the whole jitter fix: no
 * photograph is re-rasterised above its own raster).
 */
function solve(
  field: Field,
  beat: number,
  caption: (f: Solved["facts"]) => string,
): Solved {
  const { cards, flight, cycle, bp } = field;
  const half = HOME[bp].half;

  const box = cards.map((c) => {
    let fit = 0.001;
    let exit = flight;
    let lit = false;
    for (let i = 0; i <= SCAN; i++) {
      const age = (i / SCAN) * flight;
      const o = field.opacity(c, age);
      if (o > 0.004) {
        lit = true;
        const s = field.place(c, age).s;
        if (s > fit) fit = s;
      } else if (lit) {
        exit = age;
        break;
      }
    }
    fit *= 1.01;
    return { w: Math.round(c.w * fit), h: Math.round(c.h * fit), fit, exit };
  });

  let lit = 0;
  const step = Math.max(10, Math.round(cycle / 600));
  for (let t = 0; t < cycle; t += step) {
    let n = 0;
    for (const c of cards) {
      const age = ageOf(c, t, cycle);
      if (age <= flight && field.opacity(c, age) > 0.02) n++;
    }
    if (n > lit) lit = n;
  }

  let fastest = 0;
  const dt = flight / SCAN;
  for (const c of cards) {
    for (let i = 0; i < SCAN; i++) {
      const age = i * dt;
      if (field.opacity(c, age) <= 0.02) continue;
      const p = field.place(c, age);
      const q = field.place(c, age + dt);
      const v =
        (Math.hypot(xAt(q, half) - xAt(p, half), q.y - p.y) / dt) * 1000;
      if (v > fastest) fastest = v;
    }
  }
  // ★ THE LAUNCH SPEED IS THE REFERENCE'S, BY CONSTRUCTION, not a sample. A
  // path here is walked BY DISTANCE along the home hero's own travel curve, so
  // the speed along it at an age IS the home hero's speed at that age; sampling
  // it would only re-measure the curve, and the first sample is invisible
  // anyway (a frame fades in over its first 280 ms), so it would read 0.
  const launch = Math.round(homeSpeed(0, bp));

  const facts = {
    lit,
    nodes: cards.length,
    beat,
    launch,
    fastest: Math.round(fastest),
  };
  return { ...field, box, facts, caption: caption(facts) };
}

/**
 * One card at one age, as the three things the DOM wants. The loop and the rest
 * state both read this, so the first frame after hydration cannot jump.
 *
 * ★ THE HORIZONTAL IS A CALC, not a pixel count: `--als-half` is half the
 * hero's own width (50cqw on the layer), so this one string is correct at every
 * viewport and on resize, and the sheet paints the rest state with no script at
 * all. The vertical is px, because it is anchored on an object whose distance
 * from the hero's foot is a constant.
 */
export function frameAt(
  field: Field,
  c: Card,
  age: number,
  fit: number,
  box: { w: number; h: number },
) {
  const q = field.place(c, age);
  // The node is anchored LEFT at the hero's centre line and BOTTOM at the
  // album's top edge (album-stream.css says why the foot and not the top), so
  // each offset carries half the box to put the frame's CENTRE on the place.
  const x = `calc(${(q.a - box.w / 2).toFixed(2)}px + var(--als-half) * ${q.b.toFixed(4)})`;
  const y = `${(q.y + box.h / 2).toFixed(2)}px`;
  return {
    transform: `translate3d(${x}, ${y}, 0) rotate(${c.roll.toFixed(2)}deg) scale(${(q.s / fit).toFixed(4)})`,
    opacity: field.opacity(c, age),
    // Near over far, as an integer so the browser is not handed a new stacking
    // order sixty times a second: apparent size IS the depth here.
    z: 2 + Math.round(q.s * 40),
  };
}

/* ── The three variations ────────────────────────────────────────────────── */

/**
 * THE FOUR, AND WHAT MAKES EACH ONE A DIFFERENT ANSWER rather than a knob.
 * Will asked for "two to three variations of this concept", with no direction
 * on what improvement means, so each varies on SEVERAL axes at once and is a
 * real contender: the arc of the fall, the size at birth against the size at
 * the landing, how often a photograph arrives and whether it comes alone, and
 * what happens at the moment it meets the album.
 *
 * ★ BLOOM IS THE FOURTH, DRAWN FOR THE FADE RULE RATHER THAN RESCORING THE
 * FIRST THREE (the refresh). The product has since settled on its own
 * arrival grammar everywhere a photograph lands: it grows into its column
 * under a glow that fades. Cascade already tells that shape truest among the
 * first three, but none of them carries an actual glow, only scale and
 * opacity; `bloom` is born smaller and grows larger than any of the others,
 * settles the longest before it fades (a slower beat, so the hold reads as a
 * moment rather than a blip), and its arrival is lit from within
 * (`album-stream.css`'s `.als-layer[data-variant="bloom"]` glow, which piggy-
 * backs on the frame's own opacity so it fades in step with the photograph
 * rather than needing a second animated value).
 */
export const VARIANTS = ["glide", "gather", "cascade", "bloom"] as const;
export type Variant = (typeof VARIANTS)[number];

/** The shipped version, until a future round picks another. */
export const SHIPPED: Variant = "glide";

type Recipe = {
  /** Frames leaving together each beat: a pair, or a single alternating side. */
  readonly pair: boolean;
  /**
   * The beat, as a multiple of the home hero's own, per breakpoint. ★ A PHONE
   * NEEDS A LONGER ONE and that is geometry, not taste: the fall there is about
   * 200 px against 500, so frames launched at the home hero's clock would be
   * half a frame apart the whole way down and read as a stack rather than a
   * stream. The reference is still the home hero's; what changes is how many of
   * its beats the composition lets pass.
   */
  readonly beats: Record<Bp, number>;
  /** The unit box, px at scale 1. */
  readonly unit: number;
  /** The transform scale at birth and at the end of the path. */
  readonly s0: number;
  readonly s1: number;
  /**
   * Where the path turns, 0 to 1 of the drop: 1 falls the whole way and turns
   * in at the last moment, 0 turns in at once and falls straight after.
   */
  readonly bend: number;
  /** How far past the album's top edge the path ends, px. */
  readonly sink: number;
  /** How much of each lane's declared landing to take: 1 is the lane's own,
   *  lower pulls every path toward the album's middle. */
  readonly into: number;
  /**
   * The moment it meets the album.
   *   behind   it slides under the frame's top edge and is gone, no fade
   *   dissolve it gives itself up to the edge, fading over the last stretch
   *   settle   it comes to rest ON the edge, holds a beat and fades there
   */
  readonly exit: "behind" | "dissolve" | "settle";
};

const RECIPES: Record<Variant, Recipe> = {
  /**
   * GLIDE, the shipped version: a pair appears in the empty space either
   * side of the words every beat of the home hero's clock and glides down into
   * the album's top edge on the home hero's own curve, leaving at its launch
   * speed and gathering pace as it goes. Each frame FALLS FIRST and turns in
   * last, so it never leans toward the words on the way down, and it slides
   * under the album's edge with no fade: the album takes it in.
   */
  glide: {
    pair: true,
    beats: { lg: 1, base: 2 },
    unit: 104,
    s0: 0.86,
    s1: 1,
    bend: 0.9,
    sink: 72,
    into: 1,
    exit: "behind",
  },
  /**
   * GATHER, the album drawing them IN. Each frame is born LARGER than it lands
   * and shrinks the whole way, so it reads as receding INTO the album rather
   * than coming toward the reader, and the two arms converge much further in
   * (`into` pulls every landing toward the middle), so the pair visibly closes
   * on one place. It does not slide under the edge: it gives itself up to it,
   * dissolving over the last stretch of its path.
   */
  gather: {
    pair: true,
    beats: { lg: 1, base: 2 },
    unit: 116,
    s0: 1.08,
    s1: 0.74,
    bend: 0.94,
    sink: 30,
    into: 0.62,
    exit: "dissolve",
  },
  /**
   * CASCADE, one photograph at a time: singles alternating sides at half the
   * beat, so as many arrive but never two at once and the eye follows one event
   * through. Smallest at birth and largest at the landing, on a near-straight
   * drop with a late tuck, and it LANDS: it comes to rest ON the album's top
   * edge, holds there a couple of beats and fades where it sits.
   */
  cascade: {
    pair: false,
    beats: { lg: 0.5, base: 1 },
    unit: 108,
    s0: 0.62,
    s1: 1.1,
    bend: 0.97,
    sink: -16,
    into: 0.98,
    exit: "settle",
  },
  /**
   * BLOOM, arriving rather than travelling. One photograph at a time, on a
   * slower beat than any of the other three so each gets room to be noticed:
   * born smaller and grown larger by the time it lands than any of them,
   * turning in latest of all, and it comes to rest on the album's edge for the
   * longest hold before it gives itself up. The glow is not this table's: it
   * is a CSS box-shadow scoped to this variant that rides the frame's own
   * opacity, so it lights up as the photograph fades in and dims with it.
   */
  bloom: {
    pair: false,
    beats: { lg: 1.5, base: 3 },
    unit: 100,
    s0: 0.5,
    s1: 1.15,
    bend: 0.98,
    sink: -10,
    into: 1,
    exit: "settle",
  },
};

/**
 * THE LANES. A lane is one whole path: where a frame is born (`f`, a share of
 * the empty band from the lockup's edge at 0 to the screen's edge at 1, and `y`
 * px above the album's top edge) and where it enters the album (`into`, a share
 * of the album's half-width). Every lane is drawn on ONE side; the other arm is
 * its mirror, which is the symmetry the home hero has too.
 *
 * ★ THE BAND IS WHAT IS LEFT OVER, NOT A COLUMN. At 1440 it is 336 px wide and
 * at 1280 it is 256, so a SHARE of it holds the composition together at both:
 * the frames crowd in as the window narrows instead of sliding over the words.
 *
 * ★ WHY THERE ARE LANES AT ALL, AND ONLY THREE. Scattering six start points
 * across the band put two frames on almost exactly the same pixel, because
 * every frame walks the SAME travel curve: two born at nearly the same x with
 * different heights always meet, whatever order they leave in. A lane fixes
 * the x, so frames on one lane are a FILE, spaced by the curve itself the way
 * the home hero's are, and frames on different lanes never share a column. The
 * band holds three at 1280 and no more: a fourth would be narrower than a
 * frame. `stream-engine.test.ts` measures both facts rather than trusting them.
 */
type Lane = { f: number; y: number; into: number };

const LANES_LG: readonly Lane[] = [
  { f: 0.33, y: -505, into: 0.95 },
  { f: 0.82, y: -300, into: 0.72 },
];

/**
 * A PHONE HAS NO SIDE. The words fill the column, so the stream lives in the
 * strip between the actions and the album (`GAP.base`): a frame appears just
 * under the lockup's foot and drops into the album's top edge. `f` here is a
 * share of the hero's own half-width, since there is no lockup to clear.
 */
const LANES_BASE: readonly Lane[] = [
  { f: 0.68, y: -152, into: 0.66 },
  { f: 0.26, y: -126, into: 0.22 },
];

/** A birth point in (a, b) space for a breakpoint's own band. */
function bornAt(bp: Bp, f: number): { a: number; b: number } {
  // A phone's `f` is already a share of the half-width; `lg`'s is a share of
  // what is left after the lockup, which is the affine form this engine exists
  // for (the header above).
  return bp === "lg" ? { a: (1 - f) * LOCK, b: f } : { a: 0, b: f };
}

/** A landing point in (a, b) space: pinned to the album's own column at `lg`,
 *  a share of the half-width at `base` where the album IS the column. */
function intoAt(bp: Bp, g: number): { a: number; b: number } {
  return bp === "lg" ? { a: g * ALBUM_HALF, b: 0 } : { a: 0, b: g };
}

function build(bp: Bp, variant: Variant): Solved {
  const r = RECIPES[variant];
  const lanes = bp === "lg" ? LANES_LG : LANES_BASE;
  const beat = Math.round(HOME[bp].beat * r.beats[bp]);
  // A phone's frames are smaller in absolute px but LARGER against their room:
  // the strip is 343 px wide against 1440, so the same share would be specks.
  const unit = bp === "lg" ? r.unit : r.unit * 0.6;
  const half = HOME[bp].half;

  // Each lane is one whole path: born beside the words (or under them), bending
  // once, ending inside the album's top edge.
  const paths = lanes.map((lane) => {
    const p = { ...bornAt(bp, lane.f), y: lane.y };
    const q = { ...intoAt(bp, lane.into * r.into), y: r.sink };
    return pathOf(bend(p, q, r.bend), half);
  });

  // The flight is however long the LONGEST path takes on the home hero's own
  // travel curve: the pace is the reference's, never a duration chosen here.
  // `arrive` is the same question per path, which is what a landing frame needs
  // so its hold starts when IT gets there rather than when the slowest does.
  const timeTo = (px: number) => {
    let ms = 0;
    while (homeTravel(ms, bp) < px && ms < 60000) ms += 25;
    return ms;
  };
  const arrive = paths.map((p) => timeTo(p.length));
  const flight = Math.max(...arrive);
  // A landing frame does its waiting after it arrives, so the hold is part of
  // the life rather than part of the travel.
  const hold = r.exit === "settle" ? beat * 2 : 0;
  const life = flight + hold;
  // ★ THE CYCLE HOLDS A WHOLE NUMBER OF PASSES THROUGH THE LANES, or the file
  // breaks at the wrap. Slots are dealt to lanes in order, so a slot count that
  // is not a multiple of the lane count puts the cycle's last frame one beat
  // behind its own lane's first instead of a full pass, and the two land on top
  // of each other once every cycle. Rounding the count up costs one extra
  // sleeping node and fixes it by construction.
  // A pair takes one slot per beat, so a full pass through the lanes is one
  // lane count; singles alternate sides, so each side only advances every other
  // slot and a full pass is twice that.
  const lanesN = paths.length;
  const period = r.pair ? lanesN : lanesN * 2;
  const slots = Math.ceil((Math.ceil(life / beat) + 1) / period) * period;

  const cards: Card[] = [];
  const arms = r.pair ? ([0, 1] as const) : ([0] as const);
  for (let k = 0; k < slots; k++) {
    for (const arm of arms) {
      // A single alternates sides on its own beat; a pair takes both at once.
      const side = r.pair ? arm : k % 2;
      // The two arms are offset in the lane order, so a pair never leaves on
      // the same lane: the composition is symmetric without being a reflection.
      // A single's side alternates with the slot, so its lane advances on the
      // side's OWN sequence; taking `k` there would put every frame in one lane.
      const seq = r.pair ? k : (k - side) / 2;
      const row = (seq + side) % lanesN;
      const [aw, ah] = ASPECTS[(k + side) % ASPECTS.length];
      const path = paths[row];
      cards.push({
        key: `als-${variant}-${k}-${arm}`,
        slot: k,
        photo: (k * 2 + side * 5) % 12,
        w: unit * aw,
        h: unit * ah,
        at: k * beat,
        roll: ROLLS[(k * 2 + side) % ROLLS.length],
        // The right arm is the left one mirrored through the centre line.
        path: side ? mirror(path) : path,
        arrive: arrive[row],
      });
    }
  }

  const field: Field = {
    bp,
    cards,
    cycle: slots * beat,
    flight: life,
    place: (c, age) => {
      const q = c.path.at(homeTravel(Math.min(age, c.arrive), bp));
      return { a: q.a, b: q.b, y: q.y, s: r.s0 + (r.s1 - r.s0) * q.u };
    },
    opacity: (c, age) => {
      const born = smoothstep(0, 280, age);
      if (r.exit === "behind")
        // No fade at all: the frame is simply behind the album now.
        return age >= c.arrive ? 0 : born;
      if (r.exit === "dissolve") {
        // It gives itself up over the last fifth of its own path.
        const u = c.path.at(homeTravel(age, bp)).u;
        return born * (1 - smoothstep(0.8, 1, u));
      }
      // It lands, holds on the edge, and fades where it sits.
      return (
        born * (1 - smoothstep(c.arrive + hold * 0.45, c.arrive + hold, age))
      );
    },
  };

  return solve(field, beat, (f) => {
    const home = HOME[bp];
    const how =
      r.exit === "behind"
        ? "sliding under the album's edge"
        : r.exit === "dissolve"
          ? "dissolving into the album's edge"
          : "landing on the album's edge and fading there";
    const many = r.pair ? "a pair" : "one photograph";
    return `${f.lit} lit at the busiest instant (the home hero: ${home.lit}) · ${many} every ${f.beat} ms (home: ${home.beat}) · leaving at ${f.launch} px a second, never faster than ${f.fastest} · ${how}`;
  });
}

/** The left arm's path, reflected through the hero's centre line. A mirror is
 *  `x -> -x`, and x is affine, so both halves of the pair negate. */
function mirror(path: Path): Path {
  return {
    length: path.length,
    at: (d) => {
      const q = path.at(d);
      return { a: -q.a, b: -q.b, y: q.y, u: q.u };
    },
  };
}

/** Every variant at both breakpoints, solved once at module load. */
export const STREAMS: Record<Variant, Record<Bp, Solved>> = Object.fromEntries(
  VARIANTS.map((v) => [v, { base: build("base", v), lg: build("lg", v) }]),
) as Record<Variant, Record<Bp, Solved>>;

/**
 * The `sizes` every frame carries, derived from the largest DOM box the
 * composition actually renders rather than typed: retune a unit and the request
 * retunes with it. Never a `vw`, because the box is a pixel size at a given
 * breakpoint.
 */
export function framesSizes(variant: Variant): string {
  const big = (bp: Bp) => Math.max(...STREAMS[variant][bp].box.map((b) => b.w));
  return `(min-width: ${LG_MIN}px) ${big("lg")}px, ${big("base")}px`;
}
