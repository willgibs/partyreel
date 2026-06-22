import { describe, expect, it } from "vitest";

import { moveItem, pointToIndex } from "./use-sortable-grid";

// A 3-col grid of 100x125 tiles with a 4px gap (tile pitch = 104 x 129).
const GRID = { cols: 3, tileW: 100, tileH: 125, gap: 4, count: 7 };

describe("pointToIndex", () => {
  it("maps a tile center to its index", () => {
    // tile 0 center
    expect(pointToIndex({ ...GRID, x: 50, y: 62 })).toBe(0);
    // tile 2 (top-right) center: col 2 → x ≈ 2*104 + 50
    expect(pointToIndex({ ...GRID, x: 2 * 104 + 50, y: 62 })).toBe(2);
    // tile 4 (row 1, col 1): x ≈ 104 + 50, y ≈ 129 + 62
    expect(pointToIndex({ ...GRID, x: 104 + 50, y: 129 + 62 })).toBe(4);
  });

  it("clamps the column to the last column (no overflow past the right edge)", () => {
    expect(pointToIndex({ ...GRID, x: 9999, y: 62 })).toBe(2);
  });

  it("clamps a point past the last (partial) row to count-1", () => {
    // 7 items in 3 cols → 3 rows; row 2 has only index 6. A drop in row 2, col 2 must clamp to 6.
    expect(pointToIndex({ ...GRID, x: 2 * 104 + 50, y: 2 * 129 + 62 })).toBe(6);
    // Way below the grid clamps too.
    expect(pointToIndex({ ...GRID, x: 50, y: 99999 })).toBe(6);
  });

  it("clamps negative / above-left coordinates to 0", () => {
    expect(pointToIndex({ ...GRID, x: -50, y: -50 })).toBe(0);
  });
});

describe("moveItem", () => {
  const base = ["a", "b", "c", "d"];

  it("moves forward (0 → 2)", () => {
    expect(moveItem(base, 0, 2)).toEqual(["b", "c", "a", "d"]);
  });

  it("moves backward (3 → 0)", () => {
    expect(moveItem(base, 3, 0)).toEqual(["d", "a", "b", "c"]);
  });

  it("returns the SAME array reference on a no-op (from === to)", () => {
    expect(moveItem(base, 1, 1)).toBe(base);
  });

  it("returns the same array for out-of-range indices", () => {
    expect(moveItem(base, 0, 9)).toBe(base);
    expect(moveItem(base, -1, 2)).toBe(base);
  });

  it("does not mutate the input", () => {
    const copy = [...base];
    moveItem(base, 0, 3);
    expect(base).toEqual(copy);
  });
});
