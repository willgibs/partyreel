import { describe, expect, it } from "vitest";

import { PLANS } from "@/lib/constants/tiers";

import {
  PRO_PLAN_IDS,
  changePlanSchema,
  checkoutSchema,
  isProPlanId,
} from "@/lib/validation/checkout";

/**
 * The two billing doors read one list of Pro ids, and that list is tiers.ts'.
 * A size added to the plans but not here would be sold on /pricing and refused
 * as "Unknown plan" at both routes; one listed here but not in the plans would
 * reach `planById` and throw.
 */
describe("the Pro plan ids", () => {
  it("are exactly the Pro rows of tiers.ts", () => {
    const fromPlans = PLANS.filter((p) => p.tier === "pro").map((p) => p.id);
    expect([...PRO_PLAN_IDS].sort()).toEqual([...fromPlans].sort());
  });

  it("recognise a Pro id and nothing else", () => {
    expect(isProPlanId("pro_500_yr")).toBe(true);
    expect(isProPlanId("event_pass")).toBe(false);
    expect(isProPlanId("free")).toBe(false);
    expect(isProPlanId(undefined)).toBe(false);
  });
});

describe("the checkout body", () => {
  it("takes every Pro id and the Event Pass", () => {
    for (const planId of [...PRO_PLAN_IDS, "event_pass"]) {
      expect(checkoutSchema.safeParse({ planId }).success, planId).toBe(true);
    }
    expect(checkoutSchema.safeParse({ planId: "free" }).success).toBe(false);
  });
});

describe("the change-plan body", () => {
  it("takes the six Pro ids and refuses the pass, Free and junk", () => {
    for (const planId of PRO_PLAN_IDS) {
      expect(changePlanSchema.safeParse({ planId }).success, planId).toBe(true);
    }
    for (const planId of ["event_pass", "free", "pro_1tb", "", 7, null]) {
      expect(changePlanSchema.safeParse({ planId }).success).toBe(false);
    }
  });
});
