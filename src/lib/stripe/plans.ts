/**
 * Maps Partyreel paid plans ↔ their Stripe Price IDs (env-referenced, so test/live
 * differ without a deploy). `server-only`: it reads serverEnv, and the webhook uses
 * it to derive a host's storage cap from the subscription / checkout price.
 *
 * The price IDs live in env (set by the human per PRICING.md). Pure plan SHAPE
 * (storageBytes, tier) stays in lib/constants/tiers.ts — single source of truth.
 */
import "server-only";

import { planById, type Plan, type PlanId } from "@/lib/constants/tiers";
import { serverEnv } from "@/lib/env";

// Paid plan id → the env value holding its Stripe Price ID. Explicit (not a dynamic
// serverEnv index) so it stays type-safe.
const PRICE_ENV: Record<
  "pro_100" | "pro_500" | "pro_2tb" | "event_pass",
  string | undefined
> = {
  pro_100: serverEnv.STRIPE_PRICE_PRO_100,
  pro_500: serverEnv.STRIPE_PRICE_PRO_500,
  pro_2tb: serverEnv.STRIPE_PRICE_PRO_2TB,
  event_pass: serverEnv.STRIPE_PRICE_EVENT_PASS,
};

/** The Stripe Price ID for a paid plan; throws if its env var isn't set. */
export function priceIdForPlan(planId: PlanId): string {
  const priceId = PRICE_ENV[planId as keyof typeof PRICE_ENV];
  if (!priceId) {
    throw new Error(
      `No Stripe Price ID configured for plan "${planId}". Set its env var (see PRICING.md).`,
    );
  }
  return priceId;
}

/** Reverse lookup: a Stripe Price ID → the Plan (so the webhook derives tier + cap). */
export function planForPriceId(priceId: string): Plan | null {
  for (const id of Object.keys(PRICE_ENV) as PlanId[]) {
    if (PRICE_ENV[id as keyof typeof PRICE_ENV] === priceId) {
      return planById(id);
    }
  }
  return null;
}
