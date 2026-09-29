import { planPriceNumber } from "@/components/marketing/pricing-jsonld";
import { annualPlanFor, plansForTier } from "@/lib/constants/tiers";

/**
 * WHAT YEARLY SAVES, COMPUTED, NEVER TYPED (host-storage r2, his note: "users know there's always
 * savings for annual, we could include a discount tag beside yearly"). Twelve monthly payments
 * against the one yearly price, per Pro size, from the labels `tiers.ts` carries (`planPriceNumber`
 * is the one parse of a label, the structured data's own). The tag says the SMALLEST saving across
 * the sizes, in whole months, so it can never promise a size more than it saves; today every size
 * is exactly ten months' price (a Vitest pin holds the x10), so it reads "2 months free", the
 * words /pricing's own toggle already uses.
 */
export function yearlyMonthsFree(): number {
  const months = plansForTier("pro", "month").map((monthly) => {
    const yearly = annualPlanFor(monthly.id);
    if (!yearly) return 0;
    return 12 - planPriceNumber(yearly) / planPriceNumber(monthly);
  });
  // The epsilon keeps float noise on an exact ten months from flooring 2 to 1.
  return Math.max(0, Math.floor(Math.min(...months) + 1e-9));
}

/** The tag beside Yearly, or null when yearly saves nothing whole (then no tag at all). */
export function yearlySavingTag(): string | null {
  const months = yearlyMonthsFree();
  if (months < 1) return null;
  return `${months} month${months === 1 ? "" : "s"} free`;
}
