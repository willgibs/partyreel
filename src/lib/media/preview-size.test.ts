import { describe, expect, it } from "vitest";

import {
  PREVIEW_MAX_EDGE,
  previewTargetSize,
  shouldSkipPreview,
} from "./preview-size";

describe("previewTargetSize", () => {
  it("clamps the LONGEST edge to maxEdge, preserving aspect", () => {
    expect(previewTargetSize(4000, 3000)).toEqual({ width: 640, height: 480 });
    expect(previewTargetSize(3000, 4000)).toEqual({ width: 480, height: 640 });
    expect(previewTargetSize(1000, 1000)).toEqual({ width: 640, height: 640 });
  });

  it("NEVER upscales an already-small original (scale clamped to <= 1)", () => {
    expect(previewTargetSize(500, 400)).toEqual({ width: 500, height: 400 });
    expect(previewTargetSize(100, 640)).toEqual({ width: 100, height: 640 });
  });

  it("rounds + floors each dimension to >= 1 (a sliver stays visible)", () => {
    // 5000x50 → scale 640/5000 = 0.128 → 640 x 6.4 → 640 x 6
    expect(previewTargetSize(5000, 50)).toEqual({ width: 640, height: 6 });
  });

  it("falls back to 1x1 for degenerate dims", () => {
    expect(previewTargetSize(0, 800)).toEqual({ width: 1, height: 1 });
    expect(previewTargetSize(NaN, 800)).toEqual({ width: 1, height: 1 });
  });

  it("respects a custom maxEdge", () => {
    expect(previewTargetSize(2000, 1000, 400)).toEqual({
      width: 400,
      height: 200,
    });
  });
});

describe("shouldSkipPreview", () => {
  it("skips when the longest edge is already <= maxEdge", () => {
    expect(shouldSkipPreview(640, 480)).toBe(true); // longest == max
    expect(shouldSkipPreview(400, 300)).toBe(true);
  });

  it("does NOT skip when the longest edge exceeds maxEdge", () => {
    expect(shouldSkipPreview(641, 480)).toBe(false);
    expect(shouldSkipPreview(5000, 50)).toBe(false); // longest 5000 > 640, short edge tiny
  });

  it("skips degenerate dims (can't decide → no junk preview)", () => {
    expect(shouldSkipPreview(0, 800)).toBe(true);
    expect(shouldSkipPreview(NaN, 800)).toBe(true);
    expect(shouldSkipPreview(-10, 700)).toBe(true);
  });

  it("uses PREVIEW_MAX_EDGE by default", () => {
    expect(shouldSkipPreview(PREVIEW_MAX_EDGE, 100)).toBe(true);
    expect(shouldSkipPreview(PREVIEW_MAX_EDGE + 1, 100)).toBe(false);
  });
});
