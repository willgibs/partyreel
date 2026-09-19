// @contract-for: src/components/shared/backdrop/backdrop-engine.ts
// @contract-for: src/components/shared/backdrop/room-frames.ts

import { describe, expect, it } from "vitest";

import {
  atRest,
  bandIndex,
  type Config,
  DEFAULTS,
  expoOut,
  paint,
  SLIDE_FRACTION,
  start,
  type State,
  step,
  stepIndex,
  wantIndex,
} from "./backdrop-engine";
import { ROOM_FRAMES, SCROLL_STEPS } from "./room-frames";

/**
 * THE SWITCHING BACKDROP'S ARITHMETIC, pinned. The engine is pure by design (no
 * React, no DOM, no measuring) precisely so the properties below can be CHECKED
 * rather than eyeballed on a stage: half of them are invisible by eye on a
 * moving section (a switch landing exactly on a band edge, a stack that keeps
 * growing under a fast sweep, a phone quietly seeing four photographs instead
 * of five).
 *
 * Function, never look: nothing here pins a duration, a curve weight, an alpha,
 * a size or which photograph is which. Retune the pace, the slide distance, the
 * easing or the pool and every test still passes; break the scrub-back, the
 * stack collapse, the phone's sampling or the rest state and they do not.
 */

const POINTER: Config = {
  ...DEFAULTS,
  pool: ROOM_FRAMES.length,
  steps: SCROLL_STEPS,
};
const SCROLL: Config = { ...POINTER, source: "scroll" };

/** One frame at 60fps, the step every walk below advances by. */
const TICK = 1000 / 60;

/** Run the engine along a path of positions, one frame each. */
function walk(cfg: Config, path: readonly number[], from = start()): State[] {
  const out: State[] = [];
  let s = from;
  for (const at of path) {
    s = step(s, cfg, at, TICK);
    out.push(s);
  }
  return out;
}

/** Hold still until nothing is in flight. */
function settle(s: State, cfg: Config, at: number): State {
  let out = s;
  for (let i = 0; i < 200 && !atRest(out, cfg, at); i++)
    out = step(out, cfg, at, TICK);
  return out;
}

describe("the rest state", () => {
  it("stands on the pool's first photograph with nothing in flight", () => {
    const s = start();
    expect(s.index).toBe(0);
    expect(s.stack).toHaveLength(1);
    expect(s.stack[0].frame).toBe(0);
    expect(s.stack[0].t).toBe(1);
    // ★ And it is genuinely at rest, so the component never starts a loop for
    // a reader who has not moved. This is the whole no-JavaScript / crawler /
    // reduced-motion picture (bible 13, bible 14).
    expect(atRest(s, POINTER, 0)).toBe(true);
    expect(atRest(s, SCROLL, 0)).toBe(true);
  });
});

describe("the band: the section is a thing you scrub", () => {
  it("walks the whole pool across the room, first to last", () => {
    const seen = new Set<number>();
    for (let i = 0; i <= 100; i++) seen.add(bandIndex(i / 100, POINTER.pool));
    expect(seen.size).toBe(POINTER.pool);
    expect(bandIndex(0, POINTER.pool)).toBe(0);
    expect(bandIndex(1, POINTER.pool)).toBe(POINTER.pool - 1);
  });

  it("clamps at both edges rather than wrapping, so neither is a seam", () => {
    expect(bandIndex(-3, POINTER.pool)).toBe(0);
    expect(bandIndex(4, POINTER.pool)).toBe(POINTER.pool - 1);
  });

  it("never lands off the pool, at any position, for any pool size", () => {
    for (const pool of [1, 2, 5, 6, 9]) {
      for (let i = -20; i <= 120; i++) {
        const at = i / 100;
        expect(bandIndex(at, pool)).toBeGreaterThanOrEqual(0);
        expect(bandIndex(at, pool)).toBeLessThanOrEqual(pool - 1);
      }
    }
  });

  it("GOES BACK: crossing a band the other way returns the photograph just left", () => {
    // The property no travel-counting rule can have, and the reason Will's
    // `band` pick earns the rail: the section answers where you ARE.
    const out = walk(POINTER, [0.05, 0.3, 0.55, 0.3, 0.05]);
    const frames = out.map((s) => s.index);
    expect(frames).toEqual([
      bandIndex(0.05, POINTER.pool),
      bandIndex(0.3, POINTER.pool),
      bandIndex(0.55, POINTER.pool),
      bandIndex(0.3, POINTER.pool),
      bandIndex(0.05, POINTER.pool),
    ]);
    // Which is to say it came home, rather than cycling on to something new.
    expect(frames.at(-1)).toBe(frames[0]);
  });

  it("switches only when the band changes, never on movement inside one", () => {
    const band = 1 / POINTER.pool;
    const inside = [0.1, 0.2, 0.3, 0.4].map((k) => band * k);
    let s = start();
    for (const at of inside) s = step(s, POINTER, at, TICK);
    expect(s.stack).toHaveLength(1);
    expect(s.index).toBe(0);
  });
});

describe("the phone: four or five at steps, never the whole pool", () => {
  it("passes exactly the ruled number of photographs across the section", () => {
    const seen = new Set<number>();
    for (let i = 0; i <= 200; i++)
      seen.add(stepIndex(i / 200, POINTER.pool, SCROLL_STEPS));
    // Will: "pass through 4-5 images at steps as it scrolls vertically... but
    // aren't the full eight photographs that may feel too overwhelming."
    expect(seen.size).toBe(SCROLL_STEPS);
    expect(seen.size).toBeLessThan(ROOM_FRAMES.length);
  });

  it("starts on the pool's first and ends on its last", () => {
    // So the photograph a phone reader arrives on is the rest state, and the
    // one they leave on is the same one a cursor rests on at the far edge: the
    // frame chosen to sit nearest the chapter the section hands over to.
    expect(stepIndex(0, POINTER.pool, SCROLL_STEPS)).toBe(0);
    expect(stepIndex(1, POINTER.pool, SCROLL_STEPS)).toBe(
      ROOM_FRAMES.length - 1,
    );
  });

  it("samples the pool evenly, and never repeats a photograph on the way", () => {
    const run: number[] = [];
    for (let k = 0; k < SCROLL_STEPS; k++)
      run.push(stepIndex((k + 0.5) / SCROLL_STEPS, POINTER.pool, SCROLL_STEPS));
    expect(new Set(run).size).toBe(run.length);
    // Monotonic: a reader scrolling one way never doubles back.
    expect([...run].sort((a, b) => a - b)).toEqual(run);
  });

  it("holds the same photograph for the whole of its own step", () => {
    // ★ THE STILLNESS IS THE POINT. Will asked for this over the slow cycle:
    // "it's nice visitors can stop scrolling to read without any motion clash."
    // A step is a BAND of scroll, so a thumb that drifts inside one changes
    // nothing at all.
    for (let k = 0; k < SCROLL_STEPS; k++) {
      const lo = (k + 0.05) / SCROLL_STEPS;
      const hi = (k + 0.95) / SCROLL_STEPS;
      expect(stepIndex(lo, POINTER.pool, SCROLL_STEPS)).toBe(
        stepIndex(hi, POINTER.pool, SCROLL_STEPS),
      );
    }
  });

  it("degrades sanely at the edges of its own arithmetic", () => {
    expect(stepIndex(0.5, 6, 1)).toBe(0);
    expect(stepIndex(0.99, 1, 5)).toBe(0);
    expect(stepIndex(-5, 6, 5)).toBe(0);
    expect(stepIndex(5, 6, 5)).toBe(5);
  });

  it("is the source, not the width, that picks the rule", () => {
    // One engine, two readers: the component asks a capability query and hands
    // the answer in. Nothing here knows what a breakpoint is.
    expect(wantIndex(0.5, POINTER)).toBe(bandIndex(0.5, POINTER.pool));
    expect(wantIndex(0.5, SCROLL)).toBe(
      stepIndex(0.5, SCROLL.pool, SCROLL.steps),
    );
  });
});

describe("the stack: a photograph at rest covers what is under it", () => {
  it("places the new photograph on top and keeps the old one where it was", () => {
    const [s] = walk(POINTER, [0.5]);
    expect(s.stack).toHaveLength(2);
    expect(s.stack[0].frame).toBe(0);
    expect(s.stack[0].t).toBe(1);
    expect(s.stack.at(-1)!.frame).toBe(s.index);
    expect(s.stack.at(-1)!.t).toBe(0);
  });

  it("collapses to one the moment the top layer lands", () => {
    const at = 0.5;
    const s = settle(walk(POINTER, [at]).at(-1)!, POINTER, at);
    expect(s.stack).toHaveLength(1);
    expect(s.stack[0].frame).toBe(bandIndex(at, POINTER.pool));
  });

  it("CAPS a fast sweep instead of holding a dozen photographs in flight", () => {
    // A sweep that changes band on nearly every frame: the uncapped stack would
    // grow without bound with the top layer the only one anybody can see.
    const path = Array.from({ length: 120 }, (_, i) => (i % 40) / 40);
    for (const s of walk(POINTER, path))
      expect(s.stack.length).toBeLessThanOrEqual(6);
  });

  it("keeps the NEWEST when it drops, never the oldest", () => {
    const path = Array.from({ length: 60 }, (_, i) => (i % 40) / 40);
    const s = walk(POINTER, path).at(-1)!;
    expect(s.stack.at(-1)!.frame).toBe(s.index);
  });

  it("never empties, whatever it is handed", () => {
    for (const s of walk(POINTER, [0, 1, 0, 1, 0.5, -2, 3]))
      expect(s.stack.length).toBeGreaterThan(0);
  });
});

describe("the clock: it stops, and that is the feature", () => {
  it("is not at rest while a photograph is still arriving", () => {
    const at = 0.5;
    const s = walk(POINTER, [at]).at(-1)!;
    expect(atRest(s, POINTER, at)).toBe(false);
  });

  it("is not at rest when the reader is somewhere the section has not caught up to", () => {
    const s = start();
    expect(atRest(s, POINTER, 0.9)).toBe(false);
  });

  it("comes to rest and stays there while the reader holds still", () => {
    const at = 0.72;
    const s = settle(walk(POINTER, [at]).at(-1)!, POINTER, at);
    expect(atRest(s, POINTER, at)).toBe(true);
    // A hundred more frames change nothing: no work is left to do.
    const after = walk(
      POINTER,
      Array.from({ length: 100 }, () => at),
      s,
    ).at(-1)!;
    expect(after).toEqual(s);
  });

  it("advances by TIME, not by frames, so a slow device lands in the same place", () => {
    const at = 0.5;
    const one = walk(POINTER, [at]).at(-1)!;
    const slow = step(step(one, POINTER, at, 100), POINTER, at, 100);
    const fast = Array.from({ length: 10 }).reduce<State>(
      (s) => step(s, POINTER, at, 20),
      one,
    );
    expect(slow.stack.at(-1)!.t).toBeCloseTo(fast.stack.at(-1)!.t, 6);
  });

  it("treats a missing or negative delta as no time at all", () => {
    const s = walk(POINTER, [0.5]).at(-1)!;
    expect(step(s, POINTER, 0.5, -50).stack.at(-1)!.t).toBe(s.stack.at(-1)!.t);
    expect(step(s, POINTER, 0.5, 0).stack.at(-1)!.t).toBe(s.stack.at(-1)!.t);
  });
});

describe("the slide: it arrives from the side you came from, and nothing fades", () => {
  it("writes a transform and NOTHING else", () => {
    // ★ A crossfade of two photographs passes through a moment that is neither,
    // which on a full-bleed section reads as a dissolve on a slideshow. The
    // shape of the entrance is the whole effect, so opacity may never appear.
    const painted = paint(walk(POINTER, [0.5]).at(-1)!);
    for (const p of painted) {
      expect(Object.keys(p).sort()).toEqual(["frame", "transform", "z"]);
      expect(p.transform).not.toMatch(/NaN|undefined/);
    }
  });

  it("starts off its mark by the slide distance and settles on nothing", () => {
    const born = paint(walk(POINTER, [0.5]).at(-1)!).at(-1)!;
    const offset = Number(born.transform.match(/(-?[\d.]+)%/)![1]);
    expect(Math.abs(offset)).toBeCloseTo(SLIDE_FRACTION * 100, 3);
    const at = 0.5;
    const settled = paint(settle(walk(POINTER, [at]).at(-1)!, POINTER, at)).at(
      -1,
    )!;
    expect(settled.transform).toBe("none");
  });

  it("comes from the LEFT going back and the RIGHT going on", () => {
    const sign = (at: number, from: State) => {
      const born = paint(walk(POINTER, [at], from).at(-1)!).at(-1)!;
      return Math.sign(Number(born.transform.match(/(-?[\d.]+)%/)![1]));
    };
    const mid = settle(walk(POINTER, [0.5]).at(-1)!, POINTER, 0.5);
    expect(sign(0.95, mid)).toBe(1);
    expect(sign(0.05, mid)).toBe(-1);
  });

  it("stacks the newest on top", () => {
    const painted = paint(walk(POINTER, [0.4, 0.8]).at(-1)!);
    const zs = painted.map((p) => p.z);
    expect([...zs].sort((a, b) => a - b)).toEqual(zs);
    expect(painted.at(-1)!.frame).toBe(walk(POINTER, [0.4, 0.8]).at(-1)!.index);
  });

  it("eases out: most of the distance is gone early, so the gap never shows", () => {
    expect(expoOut(0)).toBe(0);
    expect(expoOut(1)).toBe(1);
    expect(expoOut(1 / 8)).toBeGreaterThan(0.55);
    expect(expoOut(1 / 3)).toBeGreaterThan(0.89);
    // Monotonic the whole way, so nothing ever steps backwards mid-entrance.
    let last = -1;
    for (let t = 0; t <= 1; t += 0.01) {
      const e = expoOut(t);
      expect(e).toBeGreaterThanOrEqual(last);
      last = e;
    }
  });
});

describe("the pool", () => {
  it("holds no photograph twice, so no switch is a switch to the same picture", () => {
    expect(new Set(ROOM_FRAMES).size).toBe(ROOM_FRAMES.length);
  });

  it("is small enough that a full-bleed decode stays inside the measured budget", () => {
    // The board measured eight full-bleed stand-ins at 17.4 MB decoded and Will
    // ruled on that section; six at the same served width is the ceiling this
    // lane keeps. Nothing here pins WHICH photographs, only how many.
    expect(ROOM_FRAMES.length).toBeGreaterThanOrEqual(5);
    expect(ROOM_FRAMES.length).toBeLessThanOrEqual(6);
  });

  it("leaves a phone fewer photographs than a cursor, which is the ruling", () => {
    expect(SCROLL_STEPS).toBeLessThan(ROOM_FRAMES.length);
    expect(SCROLL_STEPS).toBeGreaterThanOrEqual(4);
  });
});
