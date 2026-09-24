// @contract-for: src/lib/format/count.ts
import { describe, expect, it } from "vitest";

import {
  compactAxisWidth,
  formatCompactNumber,
  formatCount,
  formatSignedCount,
} from "./count";

/**
 * ONE COUNT FORMAT (the 1,000-row round's follow-on, 2026-09-24). What is
 * pinned: `en-US` grouping regardless of runtime locale, a signed delta that
 * never doubles a minus sign, and a compact tick that stays short at any
 * magnitude a real platform metric can reach.
 */

describe("formatCount", () => {
  it("groups with commas, explicitly en-US", () => {
    expect(formatCount(1249)).toBe("1,249");
    expect(formatCount(1_209_876)).toBe("1,209,876");
  });

  it("leaves a small count unchanged", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatCount(47)).toBe("47");
  });
});

describe("formatSignedCount", () => {
  it("signs a positive delta and groups it", () => {
    expect(formatSignedCount(1247)).toBe("+1,247");
  });

  it("signs a negative delta with one minus, never two", () => {
    expect(formatSignedCount(-15)).toBe("-15");
  });

  it("reads zero as a bare zero, no sign", () => {
    expect(formatSignedCount(0)).toBe("0");
  });
});

describe("formatCompactNumber", () => {
  it("leaves numbers under 1,000 unchanged", () => {
    expect(formatCompactNumber(0)).toBe("0");
    expect(formatCompactNumber(999)).toBe("999");
  });

  it("compacts thousands and millions the way a chart tick should", () => {
    // The album drill-in's own bug report: 1,400 and 1,050 drawn as "400" and
    // "050" by a 28px axis; the fix reads "1.4K" and "1.1K".
    expect(formatCompactNumber(1400)).toBe("1.4K");
    expect(formatCompactNumber(1050)).toBe("1.1K");
    expect(formatCompactNumber(12_000)).toBe("12K");
    expect(formatCompactNumber(1_200_000)).toBe("1.2M");
  });
});

describe("compactAxisWidth", () => {
  it("never shrinks below the chart's original fixed width", () => {
    expect(compactAxisWidth([0, 5, 12])).toBeGreaterThanOrEqual(28);
  });

  it("widens for a longer compact label", () => {
    const narrow = compactAxisWidth([5, 12]);
    const wide = compactAxisWidth([5, 12, 1_200_000]);
    expect(wide).toBeGreaterThan(narrow);
  });

  it("is stable for an empty series", () => {
    expect(compactAxisWidth([])).toBe(28);
  });
});
