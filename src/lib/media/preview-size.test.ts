import { describe, expect, it } from "vitest";

import {
  MAX_PHONE_BYTES,
  PHONE_FORMAT,
  PHONE_MAX_EDGE,
  PHONE_QUALITY,
  PREVIEW_MAX_EDGE,
  phoneCopyFits,
  phoneTargetSize,
  previewTargetSize,
  shouldSkipPhoneCopy,
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

describe("the phone-size copy (take-home r1, `save=light`)", () => {
  it("is 2048 px on its long side, a JPEG, at most 4 MB", () => {
    expect(PHONE_MAX_EDGE).toBe(2048);
    expect(PHONE_FORMAT).toBe("image/jpeg");
    expect(MAX_PHONE_BYTES).toBe(4 * 1024 * 1024);
    expect(PHONE_QUALITY).toBeGreaterThan(0.5);
    expect(PHONE_QUALITY).toBeLessThan(1);
  });

  it("brings a 12 MP photograph's long side to 2048, either way up, and never upscales", () => {
    expect(phoneTargetSize(4032, 3024)).toEqual({ width: 2048, height: 1536 });
    expect(phoneTargetSize(3024, 4032)).toEqual({ width: 1536, height: 2048 });
    expect(phoneTargetSize(1600, 1200)).toEqual({ width: 1600, height: 1200 });
  });

  it("is skipped for a photograph already phone size (its original serves), and for degenerate dims", () => {
    expect(shouldSkipPhoneCopy(2048, 1536)).toBe(true);
    expect(shouldSkipPhoneCopy(1920, 1080)).toBe(true);
    expect(shouldSkipPhoneCopy(2049, 1536)).toBe(false);
    expect(shouldSkipPhoneCopy(4032, 3024)).toBe(false);
    expect(shouldSkipPhoneCopy(0, 3024)).toBe(true);
    expect(shouldSkipPhoneCopy(NaN, 3024)).toBe(true);
  });

  it("fits only under BOTH caps: 4 MB, and half its original's bytes (it is never metered)", () => {
    const MB = 1024 * 1024;
    // A real iPhone photograph: 2.9 MB, its copy about a fifth.
    expect(phoneCopyFits(Math.round(0.55 * MB), Math.round(2.9 * MB))).toBe(
      true,
    );
    // Exactly half fits; a byte more does not.
    expect(phoneCopyFits(1000, 2000)).toBe(true);
    expect(phoneCopyFits(1001, 2000)).toBe(false);
    // Exactly 4 MB fits beside a big original; a byte more does not.
    expect(phoneCopyFits(4 * MB, 40 * MB)).toBe(true);
    expect(phoneCopyFits(4 * MB + 1, 40 * MB)).toBe(false);
    // A tiny original never carries an unmetered copy bigger than half of it.
    expect(phoneCopyFits(2 * MB, 1 * MB)).toBe(false);
  });

  it("refuses what no real copy is: empty, negative, fractional, not a number", () => {
    expect(phoneCopyFits(0, 1000)).toBe(false);
    expect(phoneCopyFits(-1, 1000)).toBe(false);
    expect(phoneCopyFits(10.5, 1000)).toBe(false);
    expect(phoneCopyFits(NaN, 1000)).toBe(false);
    expect(phoneCopyFits(100, NaN)).toBe(false);
  });
});
