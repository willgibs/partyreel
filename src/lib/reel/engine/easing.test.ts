import { describe, expect, it } from "vitest";

import { cubicBezier, EASE, interp } from "./easing";

// PARITY PINS: the expected values were sampled from the REAL remotion implementation
// (remotion Easing.bezier + interpolate, v4 line) on 2026-07-03. If these ever fail, the canvas
// engine's easing has drifted from what the Remotion composition renders; fix the port, do not
// re-record the pins from the port itself.

const BEZIER_REF: [number, number][] = [
  [0, 0],
  [0.05, 0.281056],
  [0.1, 0.494391],
  [0.2, 0.752126],
  [0.3, 0.877174],
  [0.45, 0.958422],
  [0.5, 0.971779],
  [0.6, 0.987965],
  [0.75, 0.997677],
  [0.9, 0.999878],
  [1, 1],
];

const FREEZE_GO_REF: [number, number][] = [
  [0, 0],
  [0.3, 0],
  [0.45, 0],
  [0.5, 0.460542],
  [0.6, 0.851294],
  [0.7, 0.95983],
  [0.8, 0.991491],
  [0.9, 0.999187],
  [1, 1],
];

describe("cubicBezier (the remotion/React-Native solver port)", () => {
  it("matches remotion's Easing.bezier(0.16, 1, 0.3, 1) at sampled inputs", () => {
    for (const [x, expected] of BEZIER_REF) {
      expect(EASE(x)).toBeCloseTo(expected, 5);
    }
  });

  it("is exact at the endpoints and clamps outside [0, 1]", () => {
    expect(EASE(0)).toBe(0);
    expect(EASE(1)).toBe(1);
    expect(EASE(-0.5)).toBe(0);
    expect(EASE(1.5)).toBe(1);
  });

  it("degenerates to linear when control points are on the diagonal", () => {
    const linear = cubicBezier(0.25, 0.25, 0.75, 0.75);
    expect(linear(0.37)).toBeCloseTo(0.37, 10);
  });
});

describe("interp (the clamped-interpolate subset)", () => {
  it("matches remotion's freezeGo ramp: interpolate(p, [0.45, 1], [0, 1], EASE) clamped", () => {
    for (const [p, expected] of FREEZE_GO_REF) {
      expect(interp(p, [0.45, 1], [0, 1], EASE)).toBeCloseTo(expected, 5);
    }
  });

  it("clamps both ends and maps output ranges", () => {
    expect(interp(-5, [0, 10], [2, 4])).toBe(2);
    expect(interp(15, [0, 10], [2, 4])).toBe(4);
    expect(interp(5, [0, 10], [2, 4])).toBeCloseTo(3);
  });

  it("handles a zero-width input range without dividing by zero", () => {
    expect(interp(0, [0, 0], [1, 3])).toBe(3);
    expect(interp(-1, [0, 0], [1, 3])).toBe(1);
  });
});
