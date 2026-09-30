import { describe, expect, it } from "vitest";

import {
  compactAxisWidth,
  formatCompactNumber,
  formatCount,
  formatKindCount,
  formatMediaCount,
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

describe("formatMediaCount", () => {
  it("reads a lone item as 'photo or video', never a lying 'photo'", () => {
    // The bug both red-teams caught: "1 photo & videos" always claimed videos too.
    expect(formatMediaCount(1)).toBe("1 photo or video");
  });

  it("reads several as 'photos & videos', grouped through formatCount", () => {
    expect(formatMediaCount(0)).toBe("0 photos & videos");
    expect(formatMediaCount(2)).toBe("2 photos & videos");
    expect(formatMediaCount(1249)).toBe("1,249 photos & videos");
  });
});

/**
 * A COUNT OF MEDIA WHOSE KINDS ARE KNOWN (crumbs-28): the host's toasts count a selection or a verdict that can
 * hold a video, so they name it by what it holds. The album's bulk Like said "Liked 1 photo" for a video; Review's
 * verdicts and the storage list each had a copy of this rule, and one home now answers all three.
 */
describe("formatKindCount", () => {
  const photo = { type: "photo" as const };
  const video = { type: "video" as const };

  it("names a selection of one kind by that kind", () => {
    expect(formatKindCount([photo], "item")).toBe("1 photo");
    expect(formatKindCount([photo, photo], "item")).toBe("2 photos");
    expect(formatKindCount([video], "item")).toBe("1 video");
    expect(formatKindCount([video, video, video], "upload")).toBe("3 videos");
  });

  it("names a mix with the surface's own word", () => {
    expect(formatKindCount([photo, video], "item")).toBe("2 items");
    expect(formatKindCount([photo, video, photo], "upload")).toBe("3 uploads");
  });

  it("groups a big count through formatCount", () => {
    expect(
      formatKindCount(
        Array.from({ length: 1500 }, () => photo),
        "item",
      ),
    ).toBe("1,500 photos");
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
