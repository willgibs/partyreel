import { describe, expect, it } from "vitest";

import { MAX_TILE_RATIO, MIN_TILE_RATIO, tileAspect } from "./tile-aspect";

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
