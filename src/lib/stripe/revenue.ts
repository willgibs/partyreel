/**
 * Best-effort LIVE platform revenue for the admin metrics dashboard (P6a). Stripe is the source of
 * truth for revenue (deriving it from the synced profiles.tier is lossy — tier doesn't record which
 * Pro plan), so we read it straight from Stripe: MRR from active subscriptions + the account balance.
 *
 * BEST-EFFORT: any failure returns null (the page renders a graceful "unavailable" card) and is logged
 * as a warning — revenue must never break the dashboard. The MRR math is the PURE `computeMrrCents`,
 * unit-tested with fixtures in mrr.test.ts; revenue.test.ts runs this read against a stubbed Stripe
 * client. server-only keeps the secret key out of any bundle.
 *
 * ★ EVERY ACTIVE SUBSCRIPTION (the 1,000-row round, 2026-09-23). The list is walked with `for await`,
 * which follows Stripe's pages to the last one, where `autoPagingToArray({ limit: 1000 })` stopped at
 * the thousandth subscription and reported the MRR of the first thousand as the whole.
 */
import "server-only";

import type Stripe from "stripe";

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
    // Every active subscription, a hundred a page (Stripe's largest), to the last page.
    const subscriptions: Stripe.Subscription[] = [];
    for await (const subscription of stripe.subscriptions.list({
      status: "active",
      expand: ["data.items.data.price"],
      limit: 100,
    })) {
      subscriptions.push(subscription);
    }
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
