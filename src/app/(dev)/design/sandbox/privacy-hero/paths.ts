import { CANVAS, type Mode } from "@/components/lab/stage";

import {
  factsOf,
  lifeMs,
  type Path,
  poolFor,
  type Pt,
  spiralPath,
  type TrailSpec,
  wanderPath,
} from "../image-trail/trail-engine";
import { HOME } from "./field";

/**
 * THE PRIVACY HERO, ROUND TWO: THE FIELD AS TWO DRAWING POINTS (2026-09-18).
 *
 * Round one emitted particles from a turning nozzle and Will answered none: "I
 * just started my review with the new privacy and trust hero. None feel right. I
 * think the density needs to increase as well as the speed. Also, when I said
 * 'decaying trail,' I meant of the trailing images, not an actual separate trail
 * effect."
 *
 * ★ SO THE MECHANISM IS REPLACED, NOT RETUNED, and the correction is what
 * replaced it. A decaying trail OF THE TRAILING IMAGES is not something you add
 * behind a field of flying frames; it is what a trail IS. Round two is the image
 * trail engine (`../image-trail/trail-engine.ts`) with a PATH where the cursor
 * would be: two points sweep out from the lockup's rim, each drops a photograph
 * every time it has travelled far enough, and every photograph it leaves behind
 * fades and shrinks where it lies. The two arms still read as spiralling out of
 * two opposite sides, which is the picture he loved on round three, and the
 * trail behind each one is now the thing he asked for rather than a wake drawn
 * beside it. Round one's `spirals.ts` left with the mechanism; git holds it.
 *
 * ★ PACE IS THE BEAT, AND THE GAP IS THE SPEED. In this engine a birth is a
 * function of TRAVEL, so the two questions come apart cleanly: the gap is how
 * far the point goes between photographs, and the pace is how often that
 * happens. The source's speed is derived from the two rather than typed, which
 * is why picking a tighter gap does not quietly speed the hero up.
 *
 * ★ EVERY NUMBER THE BOARD STATES IS MEASURED. `paths.test.ts` reads the beat
 * and the count off `factsOf` walking the real paths, so a retune turns a test
 * red instead of leaving a tile that says one thing and draws another.
 *
 * Pure: no React, no stylesheet. `field.ts` stays exactly where it was, because
 * `album-page` reads it.
 */

export { CANVAS, type Mode };

/* ── The pace: how often a photograph arrives ────────────────────────────── */

export const PACES = ["over", "rush"] as const;
export type Pace = (typeof PACES)[number];

/**
 * THE REFERENCE, measured off the shipped home hero rather than retyped: it
 * launches a pair every `HOME.<mode>.beat` ms, which is 1,250 at 1440. Both
 * options here are OVER it, because that is the note ("a bit faster pace") and
 * because round one recommended the home hero's own tempo and came back none.
 * A notch is a third up, two notches is a third up again, one step each on the
 * same log scale round one used.
 */
export const TEMPO: Record<Pace, number> = { over: 4 / 3, rush: 16 / 9 };

/** ms between one photograph and the next, per arm, at each pace. */
export const beatOf = (pace: Pace, mode: Mode) =>
  Math.round(HOME[mode].beat / (TEMPO[pace] * 2));

/* ── The gap: how close they sit ─────────────────────────────────────────── */

export const GAPS = ["overlap", "tight", "stack"] as const;
export type Gap = (typeof GAPS)[number];

/**
 * Centre to centre between neighbours along one arm, in photograph widths. It
 * STARTS at round one's tightest (0.75, the option he saw as "overlapping") and
 * goes tighter from there, which is the note: "tighter with images effectively
 * overlapping".
 */
export const SPACING: Record<Gap, number> = {
  overlap: 0.75,
  tight: 0.55,
  stack: 0.4,
};

/* ── The trail: how the photographs behind the leader go ─────────────────── */

export const TRAILS = ["quick", "linger", "long"] as const;
export type Trail = (typeof TRAILS)[number];

/**
 * THE DECAY OF THE TRAILING PHOTOGRAPHS, and nothing else: no wake, no echo, no
 * smear. Longer than the cursor trail's own clocks on purpose, because a hero
 * nobody is drawing on needs the arc to still be there when an eye reaches it.
 */
export const TRAIL: Record<
  Trail,
  Pick<TrailSpec, "holdMs" | "fadeMs" | "shrinkMs" | "endScale">
> = {
  quick: { holdMs: 220, fadeMs: 980, shrinkMs: 900, endScale: 0.22 },
  linger: { holdMs: 340, fadeMs: 1660, shrinkMs: 1500, endScale: 0.28 },
  long: { holdMs: 400, fadeMs: 2600, shrinkMs: 2400, endScale: 0.36 },
};

/* ── The path: what shape the two points draw ────────────────────────────── */

export const PATHS = ["spiral", "wander"] as const;
export type PathId = (typeof PATHS)[number];

/** How the phone draws it. */
export const ARMS = ["same", "strips"] as const;
export type Arms = (typeof ARMS)[number];

/**
 * THE LOCKUP AS ONE KEEP-OUT CIRCLE, measured to the ink on the rendered
 * `PageHero` (scale `lg`, `text-title`) with the privacy page's own words, the
 * same box round one solved against. `r0` is the radius a photograph is first
 * dropped at, so nothing is ever born on top of a word; it is the block's half
 * diagonal plus air. Re-measure if the copy changes (bible 21: copy is open).
 */
export const BLOCK: Record<Mode, { w: number; h: number }> = {
  desktop: { w: 706, h: 346 },
  phone: { w: 300, h: 359 },
};

/** The lockup's centre, px from the canvas top: the middle of the screen under
 *  the site header, which the hero runs beneath. */
export const CENTRE_Y: Record<Mode, number> = { desktop: 497, phone: 412 };

export const centreOf = (mode: Mode): Pt => ({
  x: CANVAS[mode].w / 2,
  y: CENTRE_Y[mode],
});

type Geo = {
  /** The card's width at scale 1. */
  unit: number;
  /** Where the first photograph is dropped, and where the sweep restarts. */
  r0: number;
  rMax: number;
  /**
   * The vertical squash of the arm's circle. A screen is wider than it is tall,
   * so a true circle leaves the frame at the sides long before it fills the top
   * and the bottom; under 1 the arm is an ellipse that fits the screen it is on,
   * which at a phone means over 1 instead.
   */
  grow: number;
  /**
   * ★ HOW MUCH OF THE SOURCE'S SPEED GOES INTO THE TURN, as a share of the
   * whole, and the number this file exists to get right. A spiral's real speed
   * is not the rate it climbs at: at a radius of 700 px a lazy 34 degrees a
   * second is already 415 px a second sideways, which is why the first cut of
   * this board measured a beat five times faster than the one it claimed. So the
   * TOTAL speed is the controlled quantity and the turn is derived from it: the
   * sweep gets this share, the climb gets what is left, and the option's words
   * are true of the picture.
   */
  sweep: number;
};

/**
 * ★ HOW MUCH OF A PHOTOGRAPH MAY REACH THE LOCKUP, as a share of its own half
 * width, and the one deliberate compromise in this file. Solving `r0` so that no
 * part of any card ever touches the block's ink pushes the arms out past 690 px
 * at 1440, and at that radius they no longer read as winding OUT OF the words,
 * which is the whole picture. Half a card's half width is where the two meet: a
 * photograph's outer corner may graze the block's corner, nothing is ever born
 * over a line of type, and the arms still start at the words. `paths.test.ts`
 * holds every option to exactly this rule, so it is a number rather than a hope.
 */
export const GRAZE = 0.5;

/**
 * ★ `rMax` IS A SCREEN, NOT A NUMBER, and the first cut of it emptied the hero.
 * An arm that climbs to 1,150 px spends half of every sweep past the edge of a
 * 1440 canvas, so when it restarts at the rim the whole of its lit trail is off
 * screen and the hero is bare for two seconds at a time (caught in the capture:
 * one photograph, in a corner). Held inside the frame, the photographs that are
 * dying are the ones leaving the edge, which is what a comet looks like. The
 * `sweep` share is raised to match, so the arm still turns far enough to read as
 * a spiral over its shorter climb.
 */
const GEO: Record<Mode, Geo> = {
  desktop: { unit: 200, r0: 570, rMax: 860, grow: 0.62, sweep: 0.93 },
  phone: { unit: 104, r0: 260, rMax: 350, grow: 1.24, sweep: 0.88 },
};

/**
 * The box a birth must stay outside of: the lockup's ink plus the part of a
 * photograph that may not reach it. A point outside EITHER axis is clear, which
 * is how two rectangles miss.
 */
export function keepOut(mode: Mode) {
  const b = BLOCK[mode];
  const unit = GEO[mode].unit;
  return {
    x: b.w / 2 + (unit / 2) * GRAZE,
    // The card is 3:4, so its half height is its half width times four thirds.
    y: b.h / 2 + ((unit * 4) / 3 / 2) * GRAZE,
  };
}

/** The mean radius an arm turns at, which is where its sweep is measured. */
const meanR = (geo: Geo) => (geo.r0 + geo.rMax) / 2;

export type HeroSpec = {
  mode: Mode;
  pace: Pace;
  gap: Gap;
  trail: Trail;
  path: PathId;
  /** Only read at a phone. */
  arms: Arms;
};

/** The trail spec the two arms share. */
export function specOf(s: HeroSpec): TrailSpec {
  const geo = GEO[s.mode];
  const base: TrailSpec = {
    density: Math.round(geo.unit * SPACING[s.gap]),
    size: geo.unit,
    // A path-drawn photograph has a shorter way to travel than a cursor-drawn
    // one, so the slide is shorter too: it should be settled by the time the
    // next one lands on top of it.
    slideMs: 520,
    ...TRAIL[s.trail],
    entrance: "slide",
    lag: 0.14,
    pool: 8,
    // ★ NEVER ON A PATH. The keeper exists so a cursor trail is not an empty
    // screen when a hand stops; a path never stops, and a held photograph on a
    // hero nobody is touching would simply be a photograph that will not go.
    keeper: false,
    // The arms are solved to stay off the lockup, so this almost never fires;
    // it is here because a card's SLIDE starts at the lagged point, which can
    // be inside the words while the arm itself is not, and because a retune of
    // `r0` should cost legibility nothing.
    shy: {
      cx: centreOf(s.mode).x,
      cy: CENTRE_Y[s.mode],
      hx: BLOCK[s.mode].w / 2,
      hy: BLOCK[s.mode].h / 2,
      floor: 0.22,
      cover: 0.34,
    },
  };
  const speed = sourceSpeed(s);
  return { ...base, pool: poolFor(base, speed * 1.6) };
}

/**
 * THE SOURCE'S SPEED, DERIVED: the gap divided by the beat. This is the line
 * that keeps the two questions apart, so answering the gap tighter does not
 * quietly change the pace and vice versa.
 */
export function sourceSpeed(s: HeroSpec): number {
  const geo = GEO[s.mode];
  return (geo.unit * SPACING[s.gap]) / (beatOf(s.pace, s.mode) / 1000);
}

/** The two arms, 180 degrees apart, as the engine's sources. */
export function pathsOf(s: HeroSpec): Path[] {
  const geo = GEO[s.mode];
  const centre = centreOf(s.mode);
  const speed = sourceSpeed(s);

  if (s.mode === "phone" && s.arms === "strips") {
    /**
     * ★ AT A PHONE THE ARMS BECOME THE STRIPS THEMSELVES. Round one measured
     * the reason and it still holds: at 375 a turning arm spends half of every
     * sweep pointing into the words' own width, where nothing can be seen, and
     * both strips go dark. These two paths sweep ACROSS the column inside the
     * bands above and below the lockup, so a photograph is always landing in
     * the part of the screen a phone can show one in.
     */
    const half = BLOCK.phone.h / 2;
    const band = (top: boolean): Path => {
      const mid = top
        ? Math.max(90, centre.y - half - 96)
        : Math.min(CANVAS.phone.h - 90, centre.y + half + 96);
      // The sweep's own amplitude and frequency set how far it travels per
      // radian, so the rate is divided by it: the band crosses the column at
      // the same px a second every other option is drawn at.
      const ax = CANVAS.phone.w * 0.46;
      // ★ AND A PATH THAT DOUBLES BACK BIRTHS FEWER. The birth rule measures the
      // straight line from the last photograph, not the distance walked, so a
      // sweep that turns around covers less ground than its speed suggests.
      // Measured on this figure, it needs about 0.42 of the naive divisor to
      // drop photographs at the same beat the arms do.
      const per = Math.hypot(ax * 2.1, 46 * 3.4) * 0.42;
      return (t) => {
        const u = (t / 1000) * (speed / per);
        return {
          x: CANVAS.phone.w * 0.5 + ax * Math.sin(u * 2.1),
          y: mid + 46 * Math.sin(u * 3.4 + (top ? 0 : 1.7)),
        };
      };
    };
    return [band(true), band(false)];
  }

  if (s.path === "wander") {
    /**
     * THE WANDER: two points drifting around the words on a deterministic
     * random walk that never repeats inside a visit. It is the manifest's own
     * candidate beside the spirals, and it is the one composition here with no
     * figure in it: what a reader sees is photographs arriving somewhere near
     * the words rather than an arm sweeping.
     *
     * ★ HELD OUT OF THE WORDS BY THE SAME RIM THE ARMS START AT. A free walk
     * crosses the lockup, which the spirals cannot: measured, it reached 377 px
     * from the centre where 403 is the floor. So its point is pushed back out to
     * the rim whenever it would cross inside, which reads as the drift SKIRTING
     * the words rather than as a clamp, and makes the keep-out a property of
     * both figures rather than of one.
     */
    const outside = (p: Pt): Pt => {
      const dx = p.x - centre.x;
      const dy = (p.y - centre.y) / geo.grow;
      const r = Math.hypot(dx, dy);
      if (r >= geo.r0 || r === 0) return p;
      const k = geo.r0 / r;
      return { x: centre.x + dx * k, y: centre.y + dy * k * geo.grow };
    };
    return [0, Math.PI].map((phase) => {
      const walk = wanderPath({
        centre,
        rx: meanR(geo) / 1.3,
        ry: (meanR(geo) / 1.3) * geo.grow,
        // ★ MEASURED, NOT DERIVED, and it has to be. The wander's parameter is
        // an angular rate, and two things pull its real beat away from the
        // pace: it doubles back (a birth is measured in a straight line from
        // the last photograph, so a figure that turns around covers less
        // ground), and the rim below pushes it outward (which covers more).
        // This factor is what lands it on the spiral's own beat with both in
        // play; `paths.test.ts` holds the two within a tenth of each other, so
        // the figure question can never quietly become a second pace question.
        speed: (speed * 0.78) / (meanR(geo) / 1.3),
        phase,
      });
      return (t: number) => outside(walk(t));
    });
  }

  // The turn and the climb are the two components of ONE speed, so the FIGURE
  // an arm draws is the same at every pace and only how fast it is drawn
  // changes. That is round one's rule ("tempo scales together"), kept, with the
  // arithmetic that makes it true.
  const turn = ((geo.sweep * speed) / meanR(geo)) * (180 / Math.PI);
  const climb = Math.sqrt(1 - geo.sweep * geo.sweep) * speed;
  // Half a sweep, so the two arms never restart at the same instant; the second
  // arm's start angle is pulled back by exactly what that offset adds to it, so
  // the pair is still opposite.
  const half = (((geo.rMax - geo.r0) / climb) * 1000) / 2;
  return [
    { phase: 0, t0: 0 },
    { phase: 180 - (turn * half) / 1000, t0: half },
  ].map(({ phase, t0 }) =>
    spiralPath({
      centre,
      r0: geo.r0,
      grow: geo.grow,
      turn,
      phase,
      speed: climb,
      rMax: geo.rMax,
      t0,
    }),
  );
}

/**
 * The moment the still is frozen at, past two whole lives, so the resting
 * composition is two arms in mid-sweep with their tails already going, never a
 * hero still filling from nothing.
 */
export const stillAt = (s: HeroSpec) => Math.round(lifeMs(specOf(s)) * 2.6);

/** What a composition costs, measured on the paths it will be drawn with, and
 *  the home hero's own numbers beside it. */
export function facts(s: HeroSpec) {
  const spec = specOf(s);
  const f = factsOf(spec, pathsOf(s), 16_000, CANVAS[s.mode]);
  return {
    ...f,
    /** ms between two photographs ON ONE ARM, which is the unit the home
     *  hero's own beat is in (a pair every 1,250 ms at 1440). */
    armBeat: f.beat * 2,
    life: lifeMs(spec),
    speed: Math.round(sourceSpeed(s)),
    gap: spec.density,
    size: spec.size,
    home: HOME[s.mode],
  };
}
