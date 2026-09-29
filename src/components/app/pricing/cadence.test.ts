import { describe, expect, it } from "vitest";

import { planPriceNumber } from "@/components/marketing/pricing-jsonld";
import { annualPlanFor, plansForTier } from "@/lib/constants/tiers";

import { yearlyMonthsFree, yearlySavingTag } from "./cadence";

/**
 * THE TAG BESIDE YEARLY IS ARITHMETIC ON THE PRICES (host-storage r2: "we could include a
 * discount tag beside yearly"). What must hold is that it is computed, never typed, and never
 * promises more than the smallest saving across the sizes: a tag reading "2 months free" over a
 * size that saved one would be a false price claim in the one place a host decides.
 */
describe("the yearly saving", () => {
  it("is two months today, from ten months' price for twelve", () => {
    for (const monthly of plansForTier("pro", "month")) {
      const yearly = annualPlanFor(monthly.id)!;
      expect(planPriceNumber(yearly) / planPriceNumber(monthly)).toBe(10);
    }
    expect(yearlyMonthsFree()).toBe(2);
    expect(yearlySavingTag()).toBe("2 months free");
  });

  it("reads the smallest saving across the sizes, in whole months", () => {
    const months = plansForTier("pro", "month").map(
      (monthly) =>
        12 -
        planPriceNumber(annualPlanFor(monthly.id)!) / planPriceNumber(monthly),
    );
    expect(yearlyMonthsFree()).toBe(Math.floor(Math.min(...months)));
  });
});
