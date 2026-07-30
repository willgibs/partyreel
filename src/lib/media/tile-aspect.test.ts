import { describe, expect, it } from "vitest";

import {
  MAX_SANE_RATIO,
  MAX_TILE_RATIO,
  MIN_SANE_RATIO,
  MIN_TILE_RATIO,
  tileAspect,
} from "./tile-aspect";

describe("tileAspect", () => {
  it("returns the natural ratio when both dims are present (no clamp)", () => {
    expect(tileAspect({ width: 4000, height: 3000 })).toBe("4000 / 3000");
    expect(tileAspect({ width: 1080, height: 1920 })).toBe("1080 / 1920");
  });

  it("falls back to 1:1 when either dim is missing or zero (pre-measure rows)", () => {
    expect(tileAspect({ width: null, height: null })).toBe("1 / 1");
    expect(tileAspect({ width: 1000, height: null })).toBe("1 / 1");
    expect(tileAspect({ width: 0, height: 800 })).toBe("1 / 1");
    expect(tileAspect({})).toBe("1 / 1");
  });

  it("clamps an extreme-wide ratio down to the landscape bound", () => {
    // 3000x1000 = 3.0 -> clamped to MAX_TILE_RATIO.
    expect(tileAspect({ width: 3000, height: 1000 }, true)).toBe(
      `${MAX_TILE_RATIO}`,
    );
  });

  it("clamps an extreme-tall ratio up to the portrait bound", () => {
    // 1000x3000 = 0.333 -> clamped to MIN_TILE_RATIO.
    expect(tileAspect({ width: 1000, height: 3000 }, true)).toBe(
      `${MIN_TILE_RATIO}`,
    );
  });

  it("leaves an in-band ratio unchanged under clamp", () => {
    // 4:3 = 1.333..., inside [0.66, 1.5].
    expect(tileAspect({ width: 4000, height: 3000 }, true)).toBe(
      `${4000 / 3000}`,
    );
  });

  it("still falls back to 1:1 under clamp when dims are missing", () => {
    expect(tileAspect({ width: null, height: 100 }, true)).toBe("1 / 1");
  });
});

// QA #29: width/height are CLIENT-declared and were unbounded, so one upload
// could render a tile kilometres tall and wreck the album for every viewer.
describe("tileAspect: the sanity band (applies even without clamp)", () => {
  it("bounds an absurdly tall declaration", () => {
    expect(tileAspect({ width: 1, height: 100_000_000 })).toBe(
      `${MIN_SANE_RATIO}`,
    );
  });

  it("bounds an absurdly wide declaration", () => {
    expect(tileAspect({ width: 100_000_000, height: 1 })).toBe(
      `${MAX_SANE_RATIO}`,
    );
  });

  it("leaves REAL media untouched (the natural-ratio masonry look is the point)", () => {
    // 9:16 phone portrait, 16:9 landscape, 4:3, and a genuine 3:1 panorama.
    expect(tileAspect({ width: 1080, height: 1920 })).toBe("1080 / 1920");
    expect(tileAspect({ width: 1920, height: 1080 })).toBe("1920 / 1080");
    expect(tileAspect({ width: 4032, height: 3024 })).toBe("4032 / 3024");
    expect(tileAspect({ width: 9000, height: 3000 })).toBe("9000 / 3000");
  });

  it("passes the band edges through as natural ratios", () => {
    expect(tileAspect({ width: 6000, height: 1000 })).toBe("6000 / 1000");
    expect(tileAspect({ width: 1000, height: 6000 })).toBe("1000 / 6000");
  });

  it("treats a corrupt (negative / non-finite) ratio as dimension-less", () => {
    expect(tileAspect({ width: -100, height: 200 })).toBe("1 / 1");
    expect(tileAspect({ width: 100, height: -200 })).toBe("1 / 1");
    expect(tileAspect({ width: Number.POSITIVE_INFINITY, height: 100 })).toBe(
      "1 / 1",
    );
    expect(tileAspect({ width: Number.NaN, height: 100 })).toBe("1 / 1");
  });
});
