import { describe, expect, it } from "vitest";

import { parseCssMs } from "@/lib/shared/read-css-ms";

describe("parseCssMs", () => {
  it("parses millisecond values", () => {
    expect(parseCssMs("180ms", 0)).toBe(180);
    expect(parseCssMs("2500ms", 0)).toBe(2500);
  });
  it("parses second values the minifier produces (the beat regression)", () => {
    // Lightning CSS rewrites `2500ms` → `2.5s` and `500ms` → `.5s`; parseInt would have returned 2.
    expect(parseCssMs("2.5s", 0)).toBe(2500);
    expect(parseCssMs(".5s", 0)).toBe(500);
    expect(parseCssMs("0.31s", 0)).toBe(310);
    expect(parseCssMs("1s", 0)).toBe(1000);
  });
  it("treats a bare number as milliseconds", () => {
    expect(parseCssMs("500", 0)).toBe(500);
  });
  it("trims, lowercases, and ignores surrounding whitespace", () => {
    expect(parseCssMs("  2.5S  ", 0)).toBe(2500);
  });
  it("falls back on empty or non-numeric input", () => {
    expect(parseCssMs("", 999)).toBe(999);
    expect(parseCssMs("   ", 999)).toBe(999);
    expect(parseCssMs("auto", 999)).toBe(999);
  });
});
