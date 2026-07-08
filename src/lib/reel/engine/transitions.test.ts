import { describe, expect, it } from "vitest";

import { flipScale, slideOffsets, wipeEnterPolygon } from "./transitions";

// Pins sampled from the @remotion/transitions presentation sources (dist/presentations/*.js): the
// switch arms of SlidePresentation, makePolygonIn, and Flip's rotation interpolation. Fractions of
// the frame (the DOM versions are percent strings); the epsilon is 0.01% = 0.0001.

describe("slideOffsets", () => {
  it("from-left: the entering slide comes from -100% while the exiting is pushed right", () => {
    expect(slideOffsets("from-left", 0).enter).toEqual({ x: -1, y: 0 });
    const mid = slideOffsets("from-left", 0.5);
    expect(mid.enter.x).toBeCloseTo(-0.5, 12);
    expect(mid.exit.x).toBeCloseTo(0.5 - 0.0001, 12); // the epsilon overlap (no seam line)
    expect(slideOffsets("from-left", 1)).toEqual({
      enter: { x: 0, y: 0 },
      exit: { x: 1, y: 0 }, // epsilon dropped at progress 1, like the source
    });
  });

  it("from-right mirrors with the epsilon on the ENTERING side", () => {
    const mid = slideOffsets("from-right", 0.5);
    expect(mid.enter.x).toBeCloseTo(0.5 + 0.0001, 12);
    expect(mid.exit.x).toBeCloseTo(-0.5, 12);
  });

  it("vertical dirs move y only", () => {
    const top = slideOffsets("from-top", 0.25);
    expect(top.enter).toEqual({ x: 0, y: -0.75 });
    expect(top.exit.y).toBeCloseTo(0.25 - 0.0001, 12);
    const bottom = slideOffsets("from-bottom", 0.25);
    expect(bottom.enter.y).toBeCloseTo(0.75 + 0.0001, 12);
    expect(bottom.exit).toEqual({ x: 0, y: -0.25 });
  });

  it("the entering and exiting slides tile the frame (epsilon overlap at the seam)", () => {
    // p starts above the epsilon: below it the DOM version itself leaves a sub-0.01% hairline at
    // the trailing edge (the epsilon shifts the exiting slide toward the seam), faithfully ported.
    for (const p of [0.2, 0.5, 0.8, 1]) {
      const { enter, exit } = slideOffsets("from-left", p);
      // exit occupies [exit.x, exit.x + 1], enter [enter.x, enter.x + 1]; together they cover [0, 1].
      expect(enter.x + 1).toBeGreaterThanOrEqual(exit.x - 1e-9);
      expect(enter.x).toBeLessThanOrEqual(0 + 1e-9);
      expect(exit.x + 1).toBeGreaterThanOrEqual(1 - 1e-9);
    }
  });
});

describe("wipeEnterPolygon", () => {
  it("from-left reveals a growing left rect (makePolygonIn verbatim)", () => {
    expect(wipeEnterPolygon("from-left", 0.3)).toEqual([
      [0, 0],
      [0.3, 0],
      [0.3, 1],
      [0, 1],
    ]);
  });

  it("from-right reveals from the right edge", () => {
    expect(wipeEnterPolygon("from-right", 0.3)).toEqual([
      [1, 0],
      [1, 1],
      [0.7, 1],
      [0.7, 0],
    ]);
  });

  it("covers the full frame at progress 1", () => {
    expect(wipeEnterPolygon("from-top", 1)).toEqual([
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ]);
  });
});

describe("flipScale", () => {
  it("culls the entering layer in the first half and the exiting in the second", () => {
    expect(flipScale("from-left", 0.25, "enter").visible).toBe(false);
    expect(flipScale("from-left", 0.25, "exit").visible).toBe(true);
    expect(flipScale("from-left", 0.75, "enter").visible).toBe(true);
    expect(flipScale("from-left", 0.75, "exit").visible).toBe(false);
  });

  it("rotates about y for horizontal dirs and x for vertical (the rotateProperty switch)", () => {
    expect(flipScale("from-left", 0.5, "enter").axis).toBe("x");
    expect(flipScale("from-top", 0.5, "enter").axis).toBe("y");
  });

  it("pins cos(rotation) at the quarter points (from-left: entering -180 -> 0)", () => {
    // p=0.75 => rotation -45deg => cos = sqrt(2)/2
    expect(flipScale("from-left", 0.75, "enter").scale).toBeCloseTo(
      Math.SQRT1_2,
      12,
    );
    // exiting at p=0.25 => rotation +45deg (endRotation +180 for from-left)
    expect(flipScale("from-left", 0.25, "exit").scale).toBeCloseTo(
      Math.SQRT1_2,
      12,
    );
    // from-right flips the start sign: entering rotates 180 -> 0
    expect(flipScale("from-right", 0.75, "enter").scale).toBeCloseTo(
      Math.SQRT1_2,
      12,
    );
  });

  it("both layers vanish at the 90deg midpoint", () => {
    expect(flipScale("from-left", 0.5, "enter").scale).toBeCloseTo(0, 12);
    expect(flipScale("from-left", 0.5, "enter").visible).toBe(false);
    expect(flipScale("from-left", 0.5, "exit").visible).toBe(false);
  });
});
