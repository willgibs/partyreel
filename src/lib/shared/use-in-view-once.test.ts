import { describe, expect, it } from "vitest";

import { armingThreshold } from "./use-in-view-once";

/**
 * THE ARMING GEOMETRY.
 *
 * `threshold` is a fraction of the ELEMENT, and that is the whole defect this
 * pins: on anything taller than the screen it asks for more pixels than the
 * screen can hold, the observer never trips, and a one-shot wired to it never
 * fires. Nothing throws, nothing logs, nothing renders wrong -- the beat simply
 * does not happen, which is exactly the class of failure this repo pins as
 * source text elsewhere. Here the geometry is a pure function, so it can be
 * pinned as arithmetic instead.
 */
describe("armingThreshold", () => {
  it("is a no-op without a viewport fraction", () => {
    // The additive contract: every existing caller passes no fraction and must
    // observe at exactly the number it asked for.
    expect(armingThreshold(0.35, undefined, 400, 800)).toBe(0.35);
    expect(armingThreshold(0, undefined, 4000, 800)).toBe(0);
    expect(armingThreshold(0.2, undefined, 0, 0)).toBe(0.2);
  });

  it("rescues an element taller than the screen", () => {
    // THE BUG, as numbers. A 3000px lamp in an 800px viewport tops out at
    // ratio 0.267, so a 0.35 threshold is unreachable and the lamp never arms.
    const elementHeight = 3000;
    const viewportHeight = 800;
    expect(viewportHeight / elementHeight).toBeLessThan(0.35);
    // 35% of the SCREEN is 280px, which is 0.0933 of the element.
    expect(
      armingThreshold(0.35, 0.35, elementHeight, viewportHeight),
    ).toBeCloseTo(280 / 3000, 6);
  });

  it("never arms LATER than the threshold alone would", () => {
    // The fraction is a rescue, not a second gate. A short element cannot cover
    // 35% of the screen at all, and clamping to 1 would demand full visibility;
    // taking the minimum makes that case a no-op instead.
    for (const h of [40, 200, 279, 280, 800, 2400, 12000]) {
      expect(armingThreshold(0.35, 0.35, h, 800)).toBeLessThanOrEqual(0.35);
    }
    expect(armingThreshold(0.35, 0.35, 100, 800)).toBe(0.35);
    expect(armingThreshold(0.35, 0.35, 800, 800)).toBe(0.35);
  });

  it("stays inside the range IntersectionObserver accepts", () => {
    // A threshold outside 0..1 throws a RangeError at construction, which would
    // take the whole hook down rather than degrade.
    for (const [h, v] of [
      [1, 10000],
      [10000, 1],
      [800, 800],
    ]) {
      const t = armingThreshold(0.35, 0.9, h, v);
      expect(t).toBeGreaterThanOrEqual(0);
      expect(t).toBeLessThanOrEqual(1);
    }
  });

  it("falls back rather than guessing from an unlaid-out element", () => {
    // getBoundingClientRect().height is 0 before layout and in a zero-size
    // frame. Dividing by it yields Infinity, so the fraction is skipped.
    expect(armingThreshold(0.35, 0.35, 0, 800)).toBe(0.35);
    expect(armingThreshold(0.35, 0.35, 400, 0)).toBe(0.35);
    expect(armingThreshold(0.35, 0.35, Number.NaN, 800)).toBe(0.35);
  });
});
