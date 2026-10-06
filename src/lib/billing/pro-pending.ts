/**
 * ★ HER CREDITED PRO, ON ITS WAY (billing-orphans; the credit is billing-caps.md's). PURE: no DB, no env.
 *
 * A pass holder who moves to Pro with her passes as credit is converted (her passes consumed as Pro credit, her chain
 * cleared) a moment before her subscription event writes her plan: seconds when Stripe sends the two together, longer
 * when the subscription's delivery fails and Stripe retries it (for up to three days). Between them her profile still
 * says Event Pass with no pass behind it (the recompute leaves it alone for the hour, then reads Free), so the account
 * page's Plan card read a lapsed pass. This decides when the card says instead that her Pro is on its way.
 *
 * Pending is: she is not on Pro, a checkout of hers converted passes into Pro credit (`pass_credits.converted_count`
 * above 0, never released) within Stripe's retry window, and no subscription event has written her profile since
 * (`stripe_event_created_at`, the webhook's recency stamp, older than the conversion or never set). A Pro that landed
 * and ended since leaves a newer stamp, so the line never outlives the plan it announced.
 */

/** Stripe retries a failing delivery for three days: past that her plan is the operator's to finish. */
export const PRO_PENDING_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

/** The newest conversion of her passes into Pro credit, as `pass_credits` holds it. */
export type CreditConversion = {
  converted_at: string;
  converted_count: number | null;
  released_at: string | null;
};

/** When her credited Pro began landing (the conversion's instant), or null when nothing is on its way. */
export function proPendingSince(input: {
  tier: string;
  /** `profiles.stripe_event_created_at`: the last subscription event that wrote her plan. */
  stripeEventCreatedAt: string | null;
  conversion: CreditConversion | null;
  nowMs: number;
}): string | null {
  const { tier, stripeEventCreatedAt, conversion, nowMs } = input;
  if (tier === "pro" || !conversion) return null;
  if (
    conversion.released_at !== null ||
    (conversion.converted_count ?? 0) < 1
  ) {
    return null;
  }
  const convertedMs = Date.parse(conversion.converted_at);
  if (
    !Number.isFinite(convertedMs) ||
    convertedMs < nowMs - PRO_PENDING_WINDOW_MS
  ) {
    return null;
  }
  if (stripeEventCreatedAt !== null) {
    const stampMs = Date.parse(stripeEventCreatedAt);
    // A subscription event wrote her plan after the conversion: it landed (and, being not Pro now, ended since).
    if (Number.isFinite(stampMs) && stampMs >= convertedMs) return null;
  }
  return conversion.converted_at;
}
