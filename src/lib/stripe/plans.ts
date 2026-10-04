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
// serverEnv index) so it stays type-safe. Each key names its plan's size, so a key never names a
// price it does not hold (a size that changes takes new keys, and the old ones retire with it).
const PRICE_ENV: Record<
  | "pro_50"
  | "pro_200"
  | "pro_1tb"
  | "pro_50_yr"
  | "pro_200_yr"
  | "pro_1tb_yr"
  | "event_pass",
  string | undefined
> = {
  pro_50: serverEnv.STRIPE_PRICE_PRO_50,
  pro_200: serverEnv.STRIPE_PRICE_PRO_200,
  pro_1tb: serverEnv.STRIPE_PRICE_PRO_1TB,
  pro_50_yr: serverEnv.STRIPE_PRICE_PRO_50_YR,
  pro_200_yr: serverEnv.STRIPE_PRICE_PRO_200_YR,
  pro_1tb_yr: serverEnv.STRIPE_PRICE_PRO_1TB_YR,
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

/**
 * The cheaper one-time Event Pass renewal price (FF-C). A separate Stripe price for the
 * SAME `event_pass` plan, so it's not a PlanId — accessed explicitly. Throws if unset.
 */
export function eventPassRenewalPriceId(): string {
  const id = serverEnv.STRIPE_PRICE_EVENT_PASS_RENEWAL;
  if (!id) {
    throw new Error(
      "STRIPE_PRICE_EVENT_PASS_RENEWAL is not set (see PRICING.md 'Stripe setup').",
    );
  }
  return id;
}

/** Reverse lookup: a Stripe Price ID → the Plan (so the webhook derives tier + cap). */
export function planForPriceId(priceId: string): Plan | null {
  // The renewal price maps to the same event_pass plan (one pass's room, a year's term).
  if (priceId === serverEnv.STRIPE_PRICE_EVENT_PASS_RENEWAL) {
    return planById("event_pass");
  }
  for (const id of Object.keys(PRICE_ENV) as PlanId[]) {
    if (PRICE_ENV[id as keyof typeof PRICE_ENV] === priceId) {
      return planById(id);
    }
  }
  return null;
}
