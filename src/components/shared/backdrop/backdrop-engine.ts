/**
 * THE SWITCHING BACKDROP, AS ARITHMETIC (the backdrop-wiring lane, 2026-09-18).
 *
 * The production cut of the `cursor-backdrop` board's engine, trimmed to the
 * rules settled on ("full-image sections are chapter
 * transitions"): the `band` trigger ("I absolutely love the rail of
 * the foot, and tracking the Cursor's position justifies this delight"), the
 * `slide` entrance ("This feels much more natural and fluid"), and at a phone
 * the scroll rule as he clarified it ("pass through 4-5 images at steps as it
 * scrolls vertically, not requiring taps"). The board's `travel` and `cells`
 * triggers and its `wipe` and `cut` entrances lost and left with it; git holds
 * them at 87581cc7 under `src/app/(dev)/design/sandbox/cursor-backdrop/`.
 *
 * ★ PURE, AND THAT IS LOAD-BEARING (matching the river's approach). No React, no DOM,
 * no clock and no measuring: a position goes in, a stack of layers comes out.
 * That is what lets `backdrop-engine.test.ts` check the properties that are
 * impossible to see by eye (going back across a band returns the PREVIOUS
 * photograph rather than the next one; the phone's five steps start on the
 * pool's first and end on its last) instead of eyeballing them on a stage.
 *
 * ★ THE INPUT IS ONE NUMBER, `at`, AND THAT IS WHY ONE ENGINE SERVES BOTH
 * READERS. It is the position along whatever drives the section, 0 at the
 * start and 1 at the end: the pointer's x across the room for a reader with a
 * cursor, the section's own progress up the screen for a reader without one.
 * The board carried a whole `Pointer` (x, y and the card under it) because its
 * `cells` trigger needed one; with `cells` gone, so is every coordinate.
 *
 * ★ NOTHING HERE IS IN PIXELS, so nothing ever measures a box. The slide is a
 * PERCENTAGE of the layer, which is the full-bleed room's own width, so the
 * section resizes for free and the loop never reads layout (the river's rule,
 * arrived at the same way).
 *
 * ★ THE STACK IS THE MODEL, NOT A CROSSFADE PAIR. The reference (Codrops
 * "Image Trail Effects", demo six) never fades: it places the next photograph
 * on top and lets the one below stay exactly where it was. So the state is an
 * ordered stack, oldest first, and a layer that finishes arriving DROPS
 * everything under it, because a full-bleed opaque photograph at rest covers
 * them. Cycling falls out of that; there is no "current" and "previous" to
 * keep in sync.
 */

/** What drives the index: a reader's cursor, or the page scrolling past. */
export type SourceId = "pointer" | "scroll";

export type Config = {
  /** How many photographs the section holds. */
  readonly pool: number;
  readonly source: SourceId;
  /**
   * `scroll` only: how many photographs a reader passes on the way through.
   * Will's clarification is the whole reason this is not `pool`: "aren't the
   * full eight photographs that may feel too overwhelming cycling through so
   * many on a shorter mobile section."
   */
  readonly steps: number;
  /** One entrance, in ms. */
  readonly pace: number;
};

/** One photograph in flight (or at rest, at `t` 1). */
export type Layer = {
  /** The index into the pool. */
  readonly frame: number;
  /** 0 at the moment it is placed, 1 once it has settled. */
  readonly t: number;
  /** Which side it came from: -1 the left, 1 the right. */
  readonly dir: -1 | 1;
};

export type State = {
  /** Oldest first; the last entry is the one on top. Never empty. */
  readonly stack: readonly Layer[];
  /** The pool index the section is currently ON (the top layer's frame). */
  readonly index: number;
};

/**
 * ★ THE STACK IS CAPPED, AND THE CAP IS A REAL CASE. A fast sweep can start a
 * switch every frame, and an uncapped stack would hold a dozen photographs
 * mid-flight with the top one the only thing anyone can see. Six is comfortably
 * past what a 680 ms entrance can accumulate at a plausible pointer speed, and
 * dropping from the BOTTOM keeps the newest.
 */
const STACK_CAP = 6;

/**
 * THE SHIPPED RULE SET. `pool` and `steps` are the pool module's to state (it
 * owns the photographs); everything else is fixed here, in numbers.
 */
export const DEFAULTS: Omit<Config, "pool" | "steps"> = {
  source: "pointer",
  pace: 680,
};

/**
 * HOW FAR THE ENTERING PHOTOGRAPH STARTS OFF ITS MARK, as a fraction of the
 * room's own width. A tenth: far enough that the slide has a direction to read,
 * near enough that the sliver of the photograph underneath on the trailing edge
 * is a flicker rather than a gap.
 */
export const SLIDE_FRACTION = 0.1;

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Expo-out, the reference's easing and the right one here: more than half the
 * distance is gone in the first eighth of the entrance and nine tenths of it by
 * a third of the way in, so the settle is long without the arrival ever feeling
 * slow. It is why 680 ms reads as quick
 * even though the guidance's standard entrance is 300 (guidance.md, "animate by
 * FREQUENCY"): this is an ambient switch behind the copy, not a surface opening
 * in front of it, and the departure is deliberate.
 */
export const expoOut = (t: number) =>
  t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);

/** The CSS twin of `expoOut`, for the one place a transition is declared. */
export const EXPO_OUT_CSS = "cubic-bezier(0.16, 1, 0.3, 1)";

/** The section at rest: the pool's first photograph, nothing in flight. */
export function start(): State {
  return { stack: [{ frame: 0, t: 1, dir: 1 }], index: 0 };
}

/**
 * WHICH PHOTOGRAPH A BAND WANTS. The position across the section indexes the
 * pool, so the section is a thing you SCRUB: moving back returns the photograph
 * you just left, which is the one property a travel-counting rule cannot have.
 * Clamped rather than wrapped, so the two edges are the two ends of the pool
 * and not a seam you fall through.
 */
export function bandIndex(at: number, pool: number): number {
  const n = Math.max(1, pool);
  const i = Math.floor(clamp01(at) * n);
  return i > n - 1 ? n - 1 : i;
}

/**
 * WHICH PHOTOGRAPH A SCROLL STEP WANTS. The pass is cut into `steps` bands and
 * each band takes one photograph, SAMPLED EVENLY ACROSS THE POOL: the run
 * starts on the pool's first and ends on its last, so a reader on a phone meets
 * the same two photographs a reader with a cursor rests on, and the ones in
 * between are spread rather than truncated. With a pool of six and five steps
 * that is 0, 1, 3, 4, 5, and the order in the pool module is arranged so those
 * five alternate bright and dark (the phone is the reader who holds on each one
 * longest, so the alternation is worth more there than on the desktop run).
 */
export function stepIndex(at: number, pool: number, steps: number): number {
  const n = Math.max(1, steps);
  const k = Math.min(n - 1, Math.floor(clamp01(at) * n));
  if (n === 1) return 0;
  return Math.round((k * (Math.max(1, pool) - 1)) / (n - 1));
}

/** The photograph the current position asks for, whichever reader is driving. */
export function wantIndex(at: number, cfg: Config): number {
  return cfg.source === "scroll"
    ? stepIndex(at, cfg.pool, cfg.steps)
    : bandIndex(at, cfg.pool);
}

/**
 * ONE FRAME. Advance every layer, drop what is covered, then decide whether a
 * new photograph is placed.
 *
 * ★ THE ORDER MATTERS. Advancing first means a layer that lands on this frame
 * has already collapsed the stack under it before a new one is pushed, so the
 * stack holds only what is really in flight. Deciding first would leave the
 * settled layer under the new one for one extra frame, which is invisible and
 * would still make `stack.length` untestable.
 */
export function step(s: State, cfg: Config, at: number, dtMs: number): State {
  const dt = dtMs > 0 ? dtMs : 0;
  const pace = Math.max(1, cfg.pace);

  // 1. Advance, then drop everything below the topmost layer that has landed.
  let stack = s.stack.map((l) =>
    l.t >= 1 ? l : { ...l, t: clamp01(l.t + dt / pace) },
  );
  let floor = 0;
  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i].t >= 1) {
      floor = i;
      break;
    }
  }
  if (floor > 0) stack = stack.slice(floor);

  // 2. Where the reader is, and whether that is somewhere new.
  const want = wantIndex(at, cfg);
  if (want === s.index) return { stack, index: s.index };

  const pushed = [
    ...stack,
    { frame: want, t: 0, dir: (want > s.index ? 1 : -1) as -1 | 1 },
  ];
  return {
    stack:
      pushed.length > STACK_CAP
        ? pushed.slice(pushed.length - STACK_CAP)
        : pushed,
    index: want,
  };
}

/**
 * IS THERE ANYTHING LEFT TO DO? One settled photograph, and the reader is
 * already on it.
 *
 * ★ THIS IS WHAT LETS THE SECTION COST NOTHING WHEN NOBODY IS MOVING, and it is
 * the one thing the board did not have: its loop ran for as long as the section
 * was on screen because a scripted pointer was always moving. On the real page
 * the loop stops the frame it settles and an event starts it again, so a reader
 * who stops scrolling to read (exactly the case Will asked for: "it's nice
 * visitors can stop scrolling to read without any motion clash") is reading
 * beside a section that is running no frame callback at all.
 */
export function atRest(s: State, cfg: Config, at: number): boolean {
  return (
    s.stack.length === 1 && s.stack[0].t >= 1 && wantIndex(at, cfg) === s.index
  );
}

/** One layer, ready to be written onto a node. Nothing else is ever written. */
export type Painted = {
  readonly frame: number;
  readonly z: number;
  readonly transform: string;
};

/**
 * THE SLIDE, as the only property a compositor can move for free: a transform.
 * No opacity, no filter, no shadow, no width.
 *
 * ★ NOTHING FADES ON THE WAY IN, and that is the reference's real idea. A
 * crossfade of two photographs passes through a moment that is neither, which
 * on a full-bleed section reads as a dissolve on a slideshow. The photograph
 * arrives from the side the reader came from, a tenth of the room wide, and
 * settles; the one underneath never moves at all.
 */
export function paint(s: State): Painted[] {
  return s.stack.map((l, i) => {
    const x = l.dir * SLIDE_FRACTION * 100 * (1 - expoOut(l.t));
    return {
      frame: l.frame,
      z: i,
      transform: x === 0 ? "none" : `translate3d(${x.toFixed(3)}%, 0, 0)`,
    };
  });
}
