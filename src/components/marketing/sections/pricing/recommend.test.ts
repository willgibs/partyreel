/**
 * The calculator's decision tree pins the REAL product walls (free = photos-only
 * + 2 GB; a pass = one event + 75 GB; hosting again = Pro; smallest Pro that
 * fits). If a wall moves in tiers.ts these expectations move with it by
 * derivation, but the SHAPE of each branch is pinned here.
 */
import { describe, expect, it } from "vitest";

import { GIGABYTE, TERABYTE } from "@/lib/constants/tiers";

import { recommendPlan, smallestProFor } from "./recommend";

describe("smallestProFor", () => {
  it("resolves the smallest fitting cap, with the largest as a ceiling", () => {
    expect(smallestProFor(10 * GIGABYTE).id).toBe("pro_100");
    expect(smallestProFor(100 * GIGABYTE).id).toBe("pro_100");
    expect(smallestProFor(101 * GIGABYTE).id).toBe("pro_500");
    expect(smallestProFor(1 * TERABYTE).id).toBe("pro_2tb");
    expect(smallestProFor(50 * TERABYTE).id).toBe("pro_2tb");
  });
});

describe("recommendPlan", () => {
  it("one small photos-only event → Free, with the pass as the honest alternative", () => {
    const rec = recommendPlan({
      bytes: 1 * GIGABYTE,
      video: false,
      hostingAgain: false,
    });
    expect(rec.planId).toBe("free");
    expect(rec.alternative).toContain("Event Pass");
  });

  it("video flips a small one-off event to the Event Pass (Free is photos-only)", () => {
    const rec = recommendPlan({
      bytes: 1 * GIGABYTE,
      video: true,
      hostingAgain: false,
    });
    expect(rec.planId).toBe("event_pass");
  });

  it("over the Free cap flips to the Event Pass even without video", () => {
    const rec = recommendPlan({
      bytes: 10 * GIGABYTE,
      video: false,
      hostingAgain: false,
    });
    expect(rec.planId).toBe("event_pass");
  });

  it("one event bigger than a pass → the smallest fitting Pro, with the 75 GB wall named", () => {
    const rec = recommendPlan({
      bytes: 200 * GIGABYTE,
      video: true,
      hostingAgain: false,
    });
    expect(rec.planId).toBe("pro_500");
    expect(rec.reason).toContain("75 GB");
  });

  it("hosting again → Pro at the smallest fitting size", () => {
    expect(
      recommendPlan({ bytes: 20 * GIGABYTE, video: true, hostingAgain: true })
        .planId,
    ).toBe("pro_100");
    expect(
      recommendPlan({ bytes: 900 * GIGABYTE, video: true, hostingAgain: true })
        .planId,
    ).toBe("pro_2tb");
  });

  it("hosting again with small photo-only needs still mentions stacked passes honestly", () => {
    const rec = recommendPlan({
      bytes: 5 * GIGABYTE,
      video: false,
      hostingAgain: true,
    });
    expect(rec.planId).toBe("pro_100");
    expect(rec.alternative).toContain("Two Event Passes");
  });
});
