import { describe, expect, it } from "vitest";

import {
  bandIndex,
  type Config,
  DEFAULTS,
  cellIndex,
  expoOut,
  integrate,
  paint,
  PATH_PERIOD,
  pointerAt,
  start,
  type State,
  step,
  stillAt,
  TICK,
} from "./backdrop-engine";

/**
 * THE SWITCHING BACKDROP'S RULES, in the node project.
 *
 * Every one of these is a thing that is either invisible by eye or only visible
 * once, in a frame nobody was watching: a switch landing exactly ON the travel
 * threshold, the band returning the PREVIOUS photograph when the pointer comes
 * back, the stack collapsing when a layer lands. The board's own captures prove
 * the picture; this proves the arithmetic under it.
 *
 * ★ THE LAST TWO ARE WHAT MAKE THE BOARD REVIEWABLE. `pnpm lab:demo` presses
 * every option with reduced motion emulated and fails a stage that does not
 * change, so the stills the trigger options draw have to differ from each other
 * by construction, and so do the stills the entrance options draw. Both are
 * asserted here rather than hoped for at the review.
 */

const BOX = { w: 1440, h: 720 };
const cfg = (over: Partial<Config> = {}): Config => ({
  ...DEFAULTS,
  box: BOX,
  ...over,
});

/** Walk a pointer through the engine, returning the state after every frame. */
function walk(
  c: Config,
  points: { x: number; y: number; cell?: number }[],
  dt = TICK,
): State {
  let s = start();
  points.forEach((p, i) => {
    s = step(s, c, { x: p.x, y: p.y, cell: p.cell ?? -1 }, i === 0 ? 0 : dt);
  });
  return s;
}

describe("the entrance easing", () => {
  it("runs 0 to 1, monotonically, and is front-loaded", () => {
    expect(expoOut(0)).toBe(0);
    expect(expoOut(1)).toBe(1);
    expect(expoOut(-3)).toBe(0);
    expect(expoOut(4)).toBe(1);
    let last = -1;
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const v = expoOut(t);
      expect(v).toBeGreaterThanOrEqual(last);
      last = v;
    }
    // The reason it is the reference's easing: most of the travel is gone
    // before the eye has resolved the photograph underneath.
    expect(expoOut(0.125)).toBeGreaterThan(0.55);
  });
});

describe("the band rule", () => {
  it("indexes the pool across the section and clamps at both ends", () => {
    const c = cfg({ pool: 8 });
    expect(bandIndex(-400, c)).toBe(0);
    expect(bandIndex(0, c)).toBe(0);
    expect(bandIndex(BOX.w / 2, c)).toBe(4);
    expect(bandIndex(BOX.w - 1, c)).toBe(7);
    // The right edge is the pool's last photograph, never a ninth.
    expect(bandIndex(BOX.w, c)).toBe(7);
    expect(bandIndex(BOX.w + 900, c)).toBe(7);
  });

  it("brings the PREVIOUS photograph back when the pointer comes back", () => {
    const c = cfg({ trigger: "band", pool: 8, pace: 1 });
    // Out to the middle, then back one band.
    const out = walk(c, [
      { x: 10, y: 360 },
      { x: 560, y: 360 },
      { x: 740, y: 360 },
    ]);
    expect(out.index).toBe(bandIndex(740, c));
    const back = step(out, c, { x: 560, y: 360, cell: -1 }, TICK);
    expect(back.index).toBe(bandIndex(560, c));
    expect(back.index).toBeLessThan(out.index);
    // And it came from the left, because that is where the pointer went.
    expect(back.stack[back.stack.length - 1].dir).toBe(-1);
  });

  it("does not switch while the pointer stays inside one band", () => {
    const c = cfg({ trigger: "band", pool: 8 });
    const band = BOX.w / 8;
    const s = walk(c, [
      { x: band * 3 + 5, y: 360 },
      { x: band * 3 + 40, y: 360 },
      { x: band * 3 + 90, y: 360 },
    ]);
    expect(s.index).toBe(3);
    expect(s.stack.filter((l) => l.t < 1)).toHaveLength(1);
  });
});

describe("the travel rule", () => {
  it("switches exactly when the travel threshold is reached, never before", () => {
    const c = cfg({ trigger: "travel", travel: 180, pool: 8 });
    let s = start();
    s = step(s, c, { x: 0, y: 360, cell: -1 }, 0);
    s = step(s, c, { x: 179, y: 360, cell: -1 }, TICK);
    expect(s.index).toBe(0);
    expect(s.since).toBeCloseTo(179, 6);
    s = step(s, c, { x: 180, y: 360, cell: -1 }, TICK);
    expect(s.index).toBe(1);
    expect(s.since).toBe(0);
  });

  it("measures the path, not the axis: a diagonal counts its hypotenuse", () => {
    const c = cfg({ trigger: "travel", travel: 100, pool: 8 });
    let s = start();
    s = step(s, c, { x: 0, y: 0, cell: -1 }, 0);
    // 60 across and 80 down is 100 travelled, so it fires on one move.
    s = step(s, c, { x: 60, y: 80, cell: -1 }, TICK);
    expect(s.index).toBe(1);
  });

  it("never fires on the pointer's arrival", () => {
    const c = cfg({ trigger: "travel", travel: 100, pool: 8 });
    // A first sample out at the far corner: with no previous pointer there is
    // no travel, so entering the section is not movement through it.
    const s = step(start(), c, { x: 1400, y: 700, cell: -1 }, 0);
    expect(s.index).toBe(0);
    expect(s.since).toBe(0);
  });

  it("takes the direction from the pointer, and wraps the pool", () => {
    const c = cfg({ trigger: "travel", travel: 100, pool: 3 });
    let s = start();
    s = step(s, c, { x: 900, y: 0, cell: -1 }, 0);
    for (let i = 0; i < 3; i++)
      s = step(s, c, { x: 900 - 120 * (i + 1), y: 0, cell: -1 }, TICK);
    // Three switches from index 0 through a pool of three lands back on 0.
    expect(s.index).toBe(0);
    expect(s.stack[s.stack.length - 1].dir).toBe(-1);
  });
});

describe("the cells rule", () => {
  it("spreads the cards through the pool", () => {
    const c = cfg({ trigger: "cells", pool: 8, cells: 3 });
    expect(cellIndex(-1, c)).toBe(-1);
    expect(cellIndex(0, c)).toBe(0);
    expect(cellIndex(1, c)).toBe(2);
    expect(cellIndex(2, c)).toBe(4);
  });

  it("rests on the last card when the pointer leaves the cards", () => {
    const c = cfg({ trigger: "cells", pool: 8, cells: 3 });
    const on = walk(c, [
      { x: 200, y: 360, cell: 0 },
      { x: 700, y: 360, cell: 1 },
    ]);
    expect(on.index).toBe(2);
    const off = step(on, c, { x: 1400, y: 40, cell: -1 }, TICK);
    expect(off.index).toBe(2);
  });
});

describe("the stack", () => {
  it("drops every layer a landed photograph covers", () => {
    const c = cfg({ trigger: "band", pool: 8, pace: 200 });
    // Two switches in quick succession, then long enough for both to land.
    let s = walk(c, [
      { x: 10, y: 360 },
      { x: 400, y: 360 },
      { x: 700, y: 360 },
    ]);
    expect(s.stack.length).toBeGreaterThan(1);
    s = step(s, c, { x: 700, y: 360, cell: -1 }, 400);
    expect(s.stack).toHaveLength(1);
    expect(s.stack[0].t).toBe(1);
    expect(s.stack[0].frame).toBe(s.index);
  });

  it("never grows past its cap, however fast the pointer sweeps", () => {
    const c = cfg({ trigger: "band", pool: 8, pace: 4000 });
    let s = start();
    s = step(s, c, { x: 0, y: 360, cell: -1 }, 0);
    for (let i = 1; i <= 40; i++)
      s = step(s, c, { x: (i * BOX.w) / 40, y: 360, cell: -1 }, TICK);
    expect(s.stack.length).toBeLessThanOrEqual(6);
  });

  it("stands still when nothing moves and no time passes", () => {
    const c = cfg({ trigger: "band", pool: 8 });
    const s = walk(c, [
      { x: 500, y: 360 },
      { x: 500, y: 360 },
    ]);
    const held = step(s, c, { x: 500, y: 360, cell: -1 }, 0);
    expect(held.stack).toEqual(s.stack);
    expect(held.index).toBe(s.index);
  });
});

describe("what is painted", () => {
  const settled = (c: Config) => {
    let s = walk(c, [
      { x: 10, y: 360 },
      { x: 700, y: 360 },
    ]);
    s = step(s, c, { x: 700, y: 360, cell: -1 }, 4000);
    return s;
  };

  it("leaves a settled photograph at rest exactly (bible 13)", () => {
    for (const entrance of ["slide", "wipe", "cut"] as const) {
      const c = cfg({ entrance, pace: 200 });
      const [only] = paint(settled(c), c);
      expect(only.transform, entrance).toBe("none");
      expect(only.clip, entrance).toBeNull();
      expect(only.opacity, entrance).toBe(1);
    }
  });

  it("never fades a layer, whatever the entrance", () => {
    for (const entrance of ["slide", "wipe", "cut"] as const) {
      const c = cfg({ entrance, pace: 2000 });
      const s = walk(c, [
        { x: 10, y: 360 },
        { x: 700, y: 360 },
      ]);
      for (const l of paint(s, c)) expect(l.opacity, entrance).toBe(1);
    }
  });

  it("slides the new photograph in from the side the pointer came from", () => {
    const c = cfg({ entrance: "slide", pace: 2000, trigger: "band" });
    const right = walk(c, [
      { x: 10, y: 360 },
      { x: 700, y: 360 },
    ]);
    const top = paint(right, c).at(-1)!;
    // A tenth of the section, from the right, before the easing has run.
    const px = Number(top.transform.match(/translate3d\((-?[\d.]+)px/)![1]);
    expect(px).toBeGreaterThan(0);
    expect(px).toBeLessThanOrEqual(BOX.w * 0.1);

    const left = step(right, c, { x: 300, y: 360, cell: -1 }, 16);
    const back = paint(left, c).at(-1)!;
    expect(
      Number(back.transform.match(/translate3d\((-?[\d.]+)px/)![1]),
    ).toBeLessThan(0);
  });

  it("opens a wipe from the travel edge and never moves the photograph off it", () => {
    const c = cfg({ entrance: "wipe", pace: 2000, trigger: "band" });
    const right = walk(c, [
      { x: 10, y: 360 },
      { x: 700, y: 360 },
    ]);
    const top = paint(right, c).at(-1)!;
    // Travelling right: the left inset shrinks, so the band grows from the right.
    expect(top.clip).toMatch(/^inset\(0 0 0 [\d.]+%\)$/);
    expect(top.transform).toMatch(/^scale\(/);
  });

  it("stacks the layers bottom to top in arrival order", () => {
    const c = cfg({ trigger: "band", pace: 4000 });
    const s = walk(c, [
      { x: 10, y: 360 },
      { x: 400, y: 360 },
      { x: 800, y: 360 },
    ]);
    const zs = paint(s, c).map((l) => l.z);
    expect(zs).toEqual(zs.map((_, i) => i));
  });
});

describe("the scripted pointer", () => {
  const opts = { cells: 3, axis: "x" as const };

  it("stays inside the section and repeats exactly", () => {
    for (let t = 0; t <= PATH_PERIOD; t += 37) {
      const p = pointerAt(t, BOX, opts);
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(BOX.w);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(BOX.h);
      expect(p.cell).toBeGreaterThanOrEqual(-1);
      expect(p.cell).toBeLessThan(opts.cells);
    }
    expect(pointerAt(1234, BOX, opts)).toEqual(pointerAt(1234, BOX, opts));
  });

  it("sweeps the whole pool and comes back within one lap", () => {
    const c = cfg({ trigger: "band", pool: 8 });
    const seen = new Set<number>();
    let s = start();
    for (let t = 0; t <= PATH_PERIOD; t += TICK) {
      s = step(s, c, pointerAt(t, BOX, opts), t === 0 ? 0 : TICK);
      seen.add(s.index);
    }
    expect(seen.size).toBe(8);
    // Deterministic: the same lap twice is the same state.
    expect(integrate(c, PATH_PERIOD, opts).index).toBe(s.index);
  });

  it("crosses every card, and leaves them", () => {
    const seen = new Set<number>();
    for (let t = 0; t <= PATH_PERIOD; t += TICK)
      seen.add(pointerAt(t, BOX, opts).cell);
    expect([...seen].sort((a, b) => a - b)).toEqual([-1, 0, 1, 2]);
  });
});

describe("the still a capture holds", () => {
  const opts = { cells: 3, axis: "x" as const };

  it("settles: one photograph, nothing in flight, nothing to animate", () => {
    for (const trigger of ["band", "travel", "cells"] as const) {
      const { state } = stillAt(cfg({ trigger }), opts);
      expect(state.stack, trigger).toHaveLength(1);
      expect(state.stack[0].t, trigger).toBe(1);
    }
  });

  /**
   * ★ THE PROPERTY `lab:demo` DEPENDS ON. It presses each option with reduced
   * motion emulated and fails a stage that does not visibly change, so three
   * triggers that happened to rest on the same photograph would fail the board
   * for a reason that has nothing to do with the design. Here it is a fact
   * about the rules rather than a coincidence about the path.
   */
  it("rests the three triggers on three different photographs", () => {
    const frames = (["band", "travel", "cells"] as const).map(
      (trigger) => stillAt(cfg({ trigger }), opts).state.index,
    );
    expect(new Set(frames).size).toBe(3);
  });

  /**
   * The phone has no cursor, so its three answers are three PATHS rather than
   * three triggers, and the same property has to hold: pressed under reduced
   * motion, the three tiles must be three pictures.
   */
  it("rests the three phone paths on three different photographs", () => {
    const frames = (["scroll", "cycle", "rest"] as const).map(
      (path) =>
        stillAt(cfg({ trigger: "band" }), { ...opts, path }).state.index,
    );
    expect(new Set(frames).size).toBe(3);
    // One still photograph is the engine given nothing: a pointer that never
    // moves never switches, so `rest` is the pool's first and not a special case.
    expect(frames[2]).toBe(0);
  });

  it("holds an entrance open, so the three entrances are three pictures", () => {
    const shapes = (["slide", "wipe", "cut"] as const).map((entrance) => {
      const c = cfg({ entrance });
      const { state } = stillAt(c, { ...opts, entranceAt: 0.42 });
      expect(state.stack.length, entrance).toBeGreaterThan(1);
      const top = paint(state, c).at(-1)!;
      return `${top.transform}|${top.clip}`;
    });
    expect(new Set(shapes).size).toBe(3);
  });
});
