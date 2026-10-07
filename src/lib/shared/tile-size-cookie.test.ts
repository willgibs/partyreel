/**
 * THE ONE SIZE COOKIE: three steps, one index shared by host and guest. What is
 * held is that an index reads as itself and that nothing else changes the step a
 * device lands on, a pixel width the masonry columns once wrote included.
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

  it("reads a width the masonry columns wrote as the default step, like any other number", () => {
    // Reshaped on purpose (crumbs-91, the ROADMAP's Code hygiene line): this mapped the columns' pixel widths across
    // by what they meant (300 loose to 0, 240 the old default to 1, 180 tight to 2), so a device that picked a size
    // before the rows kept its pick. That reason expired: nothing has written a width since the rows, and only test
    // devices held one. A width is now one more number that is no index.
    for (const raw of ["300", "240", "180"])
      expect(resolveRowStep(raw)).toBe(DEFAULT_ROW_STEP);
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
