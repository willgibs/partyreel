/**
 * Best-effort LIVE platform revenue for the admin metrics dashboard (P6a). Stripe is the source of
 * truth for revenue (deriving it from the synced profiles.tier is lossy — tier doesn't record which
 * Pro plan), so we read it straight from Stripe: MRR from active subscriptions + the account balance.
 *
 * BEST-EFFORT: any failure returns null (the page renders a graceful "unavailable" card) and is logged
 * as a warning — revenue must never break the dashboard. The MRR math is the PURE `computeMrrCents`, so
 * it's unit-tested with fixtures (mirrors provision.ts; do NOT import this server-only file in Vitest —
 * import the pure fn's logic via fixtures instead). server-only keeps the secret key out of any bundle.
 */
import "server-only";

import { captureWarning } from "@/lib/observability/sentry";
import { getStripe } from "@/lib/stripe/client";
import { computeMrrCents } from "@/lib/stripe/mrr";

export type PlatformRevenue = {
  mrrCents: number;
  activeSubscriptions: number;
  availableCents: number;
  pendingCents: number;
  currency: string;
};

function sumByCurrency(
  entries: { amount: number; currency: string }[],
  currency: string,
): number {
  return entries
    .filter((e) => e.currency === currency)
    .reduce((sum, e) => sum + e.amount, 0);
}

/** Fetch live MRR + balance from Stripe. Returns null on any failure (logged, non-fatal). */
export async function getPlatformRevenue(): Promise<PlatformRevenue | null> {
  try {
    const stripe = getStripe();
    // One aggregate read of all active subscriptions (auto-paginated; bounded for safety).
    const subscriptions = await stripe.subscriptions
      .list({ status: "active", expand: ["data.items.data.price"], limit: 100 })
      .autoPagingToArray({ limit: 1000 });
    const balance = await stripe.balance.retrieve();

    const currency =
      balance.available[0]?.currency ?? subscriptions[0]?.currency ?? "usd";

    return {
      mrrCents: computeMrrCents(subscriptions),
      activeSubscriptions: subscriptions.length,
      availableCents: sumByCurrency(balance.available, currency),
      pendingCents: sumByCurrency(balance.pending, currency),
      currency,
    };
  } catch (err) {
    captureWarning("admin", "platform revenue fetch failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
