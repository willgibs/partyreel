/**
 * PURE MRR math, split out of revenue.ts (which is server-only — imports getStripe) so it's
 * unit-testable in Vitest with fixtures, the same reason provision.ts is separate from plans.ts.
 * Type-only Stripe import (erased at build), so this file pulls no runtime SDK / server-only code.
 */
import type Stripe from "stripe";

// Normalize a recurring price to a MONTHLY factor. Stripe intervals: day | week | month | year.
const INTERVAL_TO_MONTHS: Record<"day" | "week" | "month" | "year", number> = {
  day: 365 / 12,
  week: 52 / 12,
  month: 1,
  year: 1 / 12,
};

/**
 * Sum active subscriptions' monthly-normalized amounts (cents, rounded). Skips items without a
 * recurring price (one-time / metered, e.g. Event Pass) and multiplies by quantity. Total, not a delta.
 */
export function computeMrrCents(subscriptions: Stripe.Subscription[]): number {
  let cents = 0;
  for (const sub of subscriptions) {
    for (const item of sub.items.data) {
      const price = item.price;
      const recurring = price?.recurring;
      if (!recurring || price.unit_amount == null) continue;
      cents +=
        price.unit_amount *
        (item.quantity ?? 1) *
        INTERVAL_TO_MONTHS[recurring.interval];
    }
  }
  return Math.round(cents);
}
