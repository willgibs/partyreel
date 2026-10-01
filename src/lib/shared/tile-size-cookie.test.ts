/**
 * THE ONE SIZE COOKIE: three steps, one index shared by host and guest. What is
 * held is that an index reads as itself, that a pick written while the albums
 * were masonry columns (a pixel width) survives as the step it meant, and that
 * nothing else changes the step a device lands on.
 */
import { describe, expect, it } from "vitest";

import { DEFAULT_ROW_STEP } from "./album-rows";
import { resolveRowStep } from "./tile-size-cookie";

describe("the step a cookie names", () => {
  it("reads an index as itself", () => {
    expect(resolveRowStep("0")).toBe(0);
    expect(resolveRowStep("1")).toBe(1);
    expect(resolveRowStep("2")).toBe(2);
  });

  it("maps the legacy widths across by what they meant", () => {
    expect(resolveRowStep("300")).toBe(0); // loose: the largest photographs
    expect(resolveRowStep("240")).toBe(1); // the former default: the middle
    expect(resolveRowStep("180")).toBe(2); // tight: the densest
  });

  it("falls back to the middle for nothing and for garbage", () => {
    for (const raw of [
      undefined,
      null,
      "",
      " ",
      "3",
      "-1",
      "1.5",
      "big",
      "220",
      "NaN",
      "Infinity",
      "constructor",
    ])
      expect(resolveRowStep(raw)).toBe(DEFAULT_ROW_STEP);
  });
});
