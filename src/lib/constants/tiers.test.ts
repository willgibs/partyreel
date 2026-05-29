import { describe, expect, it } from "vitest";

import { TIER_LIMITS, withinLimit } from "@/lib/constants/tiers";

describe("withinLimit", () => {
  it("treats a null limit as unlimited", () => {
    expect(withinLimit(999_999, null)).toBe(true);
  });

  it("is true below the cap", () => {
    expect(withinLimit(74, 75)).toBe(true);
  });

  it("is false exactly at the cap", () => {
    expect(withinLimit(75, 75)).toBe(false);
  });

  it("is false past the cap", () => {
    expect(withinLimit(76, 75)).toBe(false);
  });
});

describe("tier caps", () => {
  it("free allows a single event", () => {
    expect(TIER_LIMITS.free.maxEvents).toBe(1);
  });

  it("max has unlimited events", () => {
    expect(TIER_LIMITS.max.maxEvents).toBeNull();
  });
});
