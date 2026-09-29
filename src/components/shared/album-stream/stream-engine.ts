import {
  BUILT as HOME_BUILT,
  type Bp,
  FLIGHT as HOME_FLIGHT,
  GEO as HOME_GEO,
  placeAt as homePlaceAt,
  STREAM_FRAMES,
} from "@/components/marketing/sections/home/hero-stream";

/**
 * THE ALBUM STREAM: photographs falling into the live album, each one pushed
 * into it as an upload (the album-wiring lane, 2026-09-19; the push,
 * album-motion r1, 2026-09-29).
 *
 * Will's `motion=stream` on the album page's hero ("Small photographs appear
 * beside the words and glide down into the album's top edge"), and his pick of
 * how they reach it, `fall=push`, with his note: "I'd like to keep the stream
 * coming in from both sides to stay symmetrical and feel balanced. New items
 * can still push in from the left, using that as the entry point source. Both
 * streams are simply drawn in & dissolved, then their item is pushed in as an
 * upload." So a photograph falls beside the words on either side, is drawn in
 * (born larger than it lands, converging on the album) and dissolves at the
 * album's top edge, and as it goes the album takes it the way a real upload
 * arrives: its row opens from the left edge (`arrival=push`, `arrival.css`).
 * This module decides every frame and the moment each one is handed over;
 * `album-stream.tsx` draws them and announces the handovers, and the stage
 * (`live-album-stage.tsx`) opens its row.
 *
 * ── WHAT CHANGED ON THE WAY OUT OF THE LAB ───────────────────────────────────
 *
 * ★ THE CANVAS IS GONE. The first board solved two fixed canvases, 1440 and
 * 375, in canvas pixels; a real viewport is any width. The home hero answered
 * that by storing the horizontal as a fraction of the hero's HALF-WIDTH, and
 * this goes one step further, because this composition has to clear a lockup
 * whose column is a FIXED 768 px at every width it is drawn at. So a
 * horizontal is an AFFINE function of the half-width, `x = a + b * half` px
 * from the hero's centre line:
 *
 *   a frame born beside the words   a = (1 - f) * LOCK, b = f     f across the side band
 *   a frame landing in the album    a = g * ALBUM_HALF, b = 0     g across the album
 *
 * The first slides with the window and always keeps the same share of the room
 * BETWEEN the lockup and the screen's edge; the second is pinned to the album's
 * own column, which does not move once the window is wide enough to hold it.
 * One string of CSS `calc()` carries both (`frameAt`), so the composition is
 * correct at 1280 and at 1920 with no second table and no measurement.
 *
 * ★ THE VERTICAL IS ANCHORED ON THE ALBUM'S TOP EDGE, not on the section's top.
 * Every `y` here is px measured DOWN from the edge the photographs fall into
 * (negative above it), and the layer places that origin at a fixed distance
 * from the hero's FOOT (`STAGE.h + STAGE.floor`), which is a constant the hero
 * and this module share. So the lockup may wrap to another line and the stream
 * does not move relative to the one thing it is aimed at. No layout is read at
 * any point: not on the server, not on resize, not in a frame.
 *
 * ★ PURE, AND THAT IS LOAD-BEARING (hero-stream.ts's rule, kept). No React, no
 * stylesheet, no `env`: the composition solves at module load, the server and
 * the browser compute the same still, and the node tests read the same tables
 * the component draws. It is also what lets the hero's rest state render on the
 * SERVER, which is Will's `no-script=settled`.
 *
 * ★ THE PACE IS READ OFF THE HOME HERO, NEVER TYPED (his round-three note: the
 * calm caps made all four compositions "too boring"). `HOME` below is measured
 * from the shipped stream by import, so a retune of the home hero re-paces this
 * one with it, and nothing here is a cap.
 */

export type { Bp };

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
 * photographs dissolve on the edge the album is actually drawn at.
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
 * which needs no side room at all.
 *
 * ★ THE STREAM, THE STAGE AND THE HERO'S FLOOR SWAP TOGETHER, here: the layer
 * anchors on `STAGE`, so a stream showing one composition over a stage drawn at
 * the other aims at an edge that is not there. `album-stream.css`,
 * `live-album.css` and the hero's `xl:` padding say 1280 too (a media query
 * cannot read a module); until album-motion's wiring the two sheets said 1024,
 * so from 1024 to 1279 the side band drew frames over the words' column, which
 * this module had never been tested at.
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
  /** Position in the launch table: the file's order, and the arrivals'. */
  slot: number;
  /** Which side of the words it falls on: 0 the lanes as declared (right of
   *  the centre line), 1 their mirror on the left. */
  side: 0 | 1;
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
   *  same length, so each frame's dissolve ends at its own arrival. */
  arrive: number;
  /** The age, ms, at which the album takes its photograph: its row opens. */
  handover: number;
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

/** An arm's path reflected through the hero's centre line: the lanes as
 *  declared are the right arm, their mirror the left. A mirror is `x -> -x`,
 *  and x is affine, so both halves of the pair negate. */
function mirror(path: Path): Path {
  return {
    length: path.length,
    at: (d) => {
      const q = path.at(d);
      return { a: -q.a, b: -q.b, y: q.y, u: q.u };
    },
  };
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
  /** Slots in the cycle: a launch's place in the arrival order needs it. */
  slots: number;
  /** ms between one arrival and the next: the album's own clock. */
  beat: number;
  /** When arrival 0 reaches the album, ms of elapsed (before the rest state, so
   *  negative): arrival `n` is handed over at `firstHandover + n * beat`. */
  firstHandover: number;
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
  /** The numbers in words, for a handoff's measurement. */
  caption: string;
};

/** The age a card stands at when nothing runs: the loop at elapsed 0. */
export const restAge = (c: Card) => c.at;

/** THE ONE EXPRESSION THE LOOP RUNS: a card's age at an elapsed time. */
export const ageOf = (c: Card, elapsed: number, cycle: number) =>
  mod(c.at + elapsed, cycle);

/**
 * WHICH ARRIVAL A CARD'S CURRENT FLIGHT IS, counted in the order the
 * photographs reach the album. Card `k` launches `k` beats before card 0 does
 * (less its lane's head start, always under a beat: `build`), so across the
 * whole stream the launches, and therefore the arrivals, run in the order
 * `m * slots - k` for its `m`th pass; offset so the oldest flight at rest is
 * arrival 0. `stream-engine.test.ts` walks the clock and holds every arrival to
 * this number and to its beat.
 */
export function launchOf(field: Solved, c: Card, elapsed: number): number {
  const m = Math.floor((c.at + elapsed) / field.cycle);
  return m * field.slots - c.slot + (field.slots - 1);
}

/** The arrival the album takes next at `elapsed`: the first whose handover is
 *  still ahead (one landing exactly now has already been announced). */
export function nextArrival(field: Solved, elapsed: number): number {
  return Math.floor((elapsed - field.firstHandover) / field.beat) + 1;
}

/**
 * THE PHOTOGRAPH AN ARRIVAL WEARS, `ahead` arrivals from now, given what the
 * album will take next (`upcoming`, the album's own answer: its tail first).
 *
 * ★ THE ALBUM DECIDES, BECAUSE IT HOLDS EACH STILL ONCE. The stage's album is
 * the twelve stills and nothing else, and it takes each arrival from its own
 * tail, under the dissolve, pushing it in at the head (`live-album-stage.tsx`).
 * So the next photograph to fall is always the one at the album's tail, the one
 * after it the one above that, and so on: no still is ever in the album twice,
 * and a frame's photograph is the one its row will open for. Without an album
 * (a Library specimen), the tail is the one an album taking every arrival since
 * the rest state would have: the twelve walked backwards from the last.
 */
export function arrivalPhoto(
  field: Solved,
  n: number,
  elapsed: number,
  upcoming?: ((ahead: number) => number) | null,
): number {
  const ahead = n - nextArrival(field, elapsed);
  if (upcoming) return upcoming(ahead);
  const first = nextArrival(field, 0);
  return mod(STREAM_FRAMES.length - 1 - (n - first), STREAM_FRAMES.length);
}

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
  clock: { slots: number; beat: number; firstHandover: number },
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
    beat: clock.beat,
    launch,
    fastest: Math.round(fastest),
  };
  const home = HOME[bp];
  return {
    ...field,
    ...clock,
    box,
    facts,
    caption: `${facts.lit} lit at the busiest instant (the home hero: ${home.lit}) · one photograph every ${facts.beat} ms, the two sides in turn (home: a pair every ${home.beat}) · leaving at ${facts.launch} px a second, never faster than ${facts.fastest} · drawn in and dissolving at the album's edge as its row opens`,
  };
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

/* ── The push ────────────────────────────────────────────────────────────── */

/**
 * THE PUSH, AS PICKED: every axis of the fall, and the moment of the handover.
 *
 * ★ THE FALL IS THE ONE HE CALLED "DRAWN IN & DISSOLVED" (the board's
 * `gather`, the words his note borrows): each frame is born LARGER than it
 * lands and shrinks the whole way, so it reads as receding INTO the album
 * rather than coming toward the reader; the landings are pulled toward the
 * album's middle (`into`), so both sides visibly close on it; and it gives
 * itself up at the edge, dissolving over the last fifth of its path. Nothing
 * about it claims to be the arrival: the album's own push is.
 *
 * ★ THE CLOCK IS THE PUSH'S, ONE PHOTOGRAPH AT A TIME. The board's push handed
 * the album one photograph every one and a half of the home hero's beats (1875
 * ms at a desk), so each arrival's glow (2 s, `ARRIVAL_GLOW_MS`, all but out
 * by 94 per cent of its run) goes out as the next row opens. His note adds the
 * second side and keeps that album: the two sides take the beat in turn (a
 * single frame each beat, alternating), so each side launches every other beat
 * and the album still takes one photograph at a time. Pairs leaving together,
 * as the shipped glide's did, would push two at once, a batch rather than a
 * party.
 *
 *   beats     the album's clock, as a multiple of the home hero's beat
 *   unit      the frame, px at scale 1 (a phone's is 0.6 of it)
 *   s0, s1    the scale at birth and at the path's end: drawn in
 *   bend      how late the tuck is (see `bend`)
 *   sink      px past the album's top edge the path ends: into the edge
 *   into      how much of each lane's declared landing to take; below 1
 *             pulls every landing toward the album's middle
 *   dissolve  the share of the path where the frame begins to give itself up
 *   handover  the share of the path at which the album takes it: the
 *             dissolve half through (opacity one half), so the row opens as
 *             the frame goes, and the two read as one hand-over
 */
const RECIPE = {
  beats: { lg: 1.5, base: 1.5 } as Record<Bp, number>,
  unit: 116,
  s0: 1.08,
  s1: 0.74,
  bend: 0.94,
  sink: 30,
  into: 0.62,
  dissolve: 0.8,
  handover: 0.9,
} as const;

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
 * ★ WHY THERE ARE LANES AT ALL, AND ONLY TWO. Scattering six start points
 * across the band put two frames on almost exactly the same pixel, because
 * every frame walks the SAME travel curve: two born at nearly the same x with
 * different heights always meet, whatever order they leave in. A lane fixes
 * the x, so frames on one lane are a FILE, spaced by the curve itself the way
 * the home hero's are, and frames on different lanes never share a column.
 * `stream-engine.test.ts` measures that rather than trusting it.
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

/** How long the home hero's curve takes to cover `px` at this breakpoint, ms. */
function timeTo(px: number, bp: Bp): number {
  let ms = 0;
  while (homeTravel(ms, bp) < px && ms < 60000) ms += 25;
  return ms;
}

function build(bp: Bp): Solved {
  const r = RECIPE;
  const beat = Math.round(HOME[bp].beat * r.beats[bp]);
  // A phone's frames are smaller in absolute px but LARGER against their room:
  // the strip is 343 px wide against 1440, so the same share would be specks.
  const unit = bp === "lg" ? r.unit : r.unit * 0.6;
  const half = HOME[bp].half;

  // Each lane is one whole path: born beside the words (or under them), bending
  // once, ending inside the album's top edge. Its timings are the home hero's
  // curve walked along it: the pace is the reference's, never a duration here.
  const lanes = (bp === "lg" ? LANES_LG : LANES_BASE)
    .map((lane) => {
      const p = { ...bornAt(bp, lane.f), y: lane.y };
      const q = { ...intoAt(bp, lane.into * r.into), y: r.sink };
      const path = pathOf(bend(p, q, r.bend), half);
      return {
        path,
        arrive: timeTo(path.length, bp),
        handover: timeTo(path.length * r.handover, bp),
      };
    })
    // ★ THE LANE THAT HANDS OVER LAST LEADS THE FILE, so card 0 takes no head
    // start (below) and every card's clock stays inside its cycle, which is
    // what `launchOf`'s count of the arrivals rests on.
    .sort((a, b) => b.handover - a.handover);

  const flight = Math.max(...lanes.map((l) => l.arrive));
  const latest = lanes[0].handover;

  // ★ THE CYCLE HOLDS A WHOLE NUMBER OF PASSES THROUGH THE LANES, or the file
  // breaks at the wrap. A single alternates sides with each slot, so each side
  // only advances every other slot and a full pass is twice the lane count;
  // a slot count that is not a multiple of it puts the cycle's last frame one
  // beat behind its own lane's first, and the two land on top of each other
  // once every cycle. Rounding up costs one sleeping node and fixes it.
  const period = lanes.length * 2;
  const slots = Math.ceil((Math.ceil(flight / beat) + 1) / period) * period;
  const cycle = slots * beat;

  const place = (c: Card, age: number): Place => {
    const q = c.path.at(homeTravel(Math.min(age, c.arrive), bp));
    return { a: q.a, b: q.b, y: q.y, s: r.s0 + (r.s1 - r.s0) * q.u };
  };
  const opacity = (c: Card, age: number) => {
    if (age >= c.arrive) return 0;
    const born = smoothstep(0, 280, age);
    // It gives itself up over the last stretch of its own path.
    const u = c.path.at(homeTravel(age, bp)).u;
    return born * (1 - smoothstep(r.dissolve, 1, u));
  };

  /** The file at a given rest phase: every slot's side, lane and clock. */
  const cardsAt = (phase: number): Card[] =>
    Array.from({ length: slots }, (_, k) => {
      // One frame a beat, the sides in turn; each side walks the lanes on its
      // OWN sequence (taking `k` there would put every frame in one lane), the
      // right arm a lane out of step with the left, so the two are symmetric
      // without being a reflection.
      const side = (k % 2) as 0 | 1;
      const seq = (k - side) / 2;
      const lane = lanes[(seq + side) % lanes.length];
      const [aw, ah] = ASPECTS[(k + side) % ASPECTS.length];
      return {
        key: `als-${bp}-${k}`,
        slot: k,
        side,
        w: unit * aw,
        h: unit * ah,
        // ★ THE ARRIVALS KEEP THE BEAT, NOT THE LAUNCHES. The lanes reach the
        // album some hundreds of ms apart, so launching on the beat would open
        // the rows on a limp; the quicker lane leaves that much later instead
        // (its head start, always under a beat), and every row opens exactly
        // one beat after the last.
        at: k * beat - (latest - lane.handover) + phase,
        roll: ROLLS[(k * 2 + side) % ROLLS.length],
        path: side ? mirror(lane.path) : lane.path,
        arrive: lane.arrive,
        handover: lane.handover,
      };
    });

  // ★ THE REST STATE IS A WHOLE FRAME, CHOSEN RATHER THAN LANDED ON. It is what
  // the server paints, what a reader who asked for less motion keeps, and the
  // loop's first frame, so the clock's phase is the one where no frame is
  // caught being born or dissolving, the two sides hold as many each as the
  // count allows (an odd count leans by one), and as many as that allows are
  // lit, in that order (`stream-engine.test.ts` holds all three): a
  // symmetrical hero stands still balanced before it stands still full. Of the
  // phases that score best, the middle of the longest run, so no frame rests a
  // step from its fade.
  const STEP = 5;
  const scores = Array.from({ length: Math.ceil(beat / STEP) }, (_, i) => {
    let partial = 0;
    const whole = [0, 0];
    for (const c of cardsAt(i * STEP)) {
      const o = opacity(c, c.at);
      if (o >= 0.999) whole[c.side]++;
      else if (o > 0.004) partial++;
    }
    return (
      -partial * 1000 -
      Math.abs(whole[0] - whole[1]) * 100 +
      (whole[0] + whole[1]) * 10
    );
  });
  const top = Math.max(...scores);
  let run = { from: 0, length: 0 };
  for (let i = 0; i < scores.length; ) {
    let j = i;
    while (j < scores.length && scores[j] === top) j++;
    if (j - i > run.length) run = { from: i, length: j - i };
    i = j > i ? j : i + 1;
  }
  const phase = (run.from + Math.floor(run.length / 2)) * STEP;
  const cards = cardsAt(phase);

  // Arrival `n` is handed over at `(n - (slots - 1)) * beat + latest - phase`
  // of elapsed (`launchOf`'s count, each lane's head start taken off).
  const firstHandover = (1 - slots) * beat + latest - phase;

  return solve(
    { bp, cards, cycle, flight, place, opacity },
    { slots, beat, firstHandover },
  );
}

/** Both breakpoints, solved once at module load. */
export const STREAM: Record<Bp, Solved> = {
  base: build("base"),
  lg: build("lg"),
};

/**
 * The `sizes` every frame carries, derived from the largest DOM box the
 * composition actually renders rather than typed: retune a unit and the request
 * retunes with it. Never a `vw`, because the box is a pixel size at a given
 * breakpoint.
 */
export function framesSizes(): string {
  const big = (bp: Bp) => Math.max(...STREAM[bp].box.map((b) => b.w));
  return `(min-width: ${STREAM_LG_MIN}px) ${big("lg")}px, ${big("base")}px`;
}
