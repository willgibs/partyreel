/**
 * The calculator's decision tree pins the REAL product walls (free = photos-only
 * + its cap, 100 MB since the free/pro shift; a pass = one event + 25 GB (Ladder A);
 * hosting again = Pro; smallest Pro that fits). If a wall moves in tiers.ts
 * these expectations move with it by derivation, but the SHAPE of each branch
 * is pinned here.
 */
import { describe, expect, it } from "vitest";

import { GIGABYTE, planById, TERABYTE } from "@/lib/constants/tiers";

import { recommendPlan, smallestProFor } from "./recommend";

describe("smallestProFor", () => {
  it("resolves the smallest fitting cap, with the largest as a ceiling", () => {
    expect(smallestProFor(10 * GIGABYTE).id).toBe("pro_50");
    expect(smallestProFor(50 * GIGABYTE).id).toBe("pro_50");
    expect(smallestProFor(51 * GIGABYTE).id).toBe("pro_200");
    expect(smallestProFor(1 * TERABYTE).id).toBe("pro_1tb");
    expect(smallestProFor(50 * TERABYTE).id).toBe("pro_1tb");
  });
});

describe("recommendPlan", () => {
  it("one small photos-only event → Free, with the pass as the honest alternative", () => {
    const rec = recommendPlan({
      bytes: planById("free").storageBytes,
      video: false,
      hostingAgain: false,
    });
    expect(rec.planId).toBe("free");
    expect(rec.alternative).toContain("Event Pass");
  });

  it("a gigabyte of photos is past Free now: the pass, not Free (the shift's 100 MB)", () => {
    const rec = recommendPlan({
      bytes: 1 * GIGABYTE,
      video: false,
      hostingAgain: false,
    });
    expect(rec.planId).toBe("event_pass");
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

  it("one event bigger than a pass → the smallest fitting Pro, with the pass's wall named", () => {
    const rec = recommendPlan({
      bytes: 100 * GIGABYTE,
      video: true,
      hostingAgain: false,
    });
    expect(rec.planId).toBe("pro_200");
    expect(rec.reason).toContain("25 GB");
  });

  it("hosting again → Pro at the smallest fitting size", () => {
    expect(
      recommendPlan({ bytes: 20 * GIGABYTE, video: true, hostingAgain: true })
        .planId,
    ).toBe("pro_50");
    expect(
      recommendPlan({ bytes: 900 * GIGABYTE, video: true, hostingAgain: true })
        .planId,
    ).toBe("pro_1tb");
  });

  it("hosting again with small photo-only needs still mentions stacked passes honestly", () => {
    const rec = recommendPlan({
      bytes: 5 * GIGABYTE,
      video: false,
      hostingAgain: true,
    });
    expect(rec.planId).toBe("pro_50");
    expect(rec.alternative).toContain("Two Event Passes");
  });
});
