import "server-only";

import { PLANS, type PlanId } from "@/lib/constants/tiers";
import {
  pickChangePlanConfiguration,
  type PortalConfigurationLike,
} from "@/lib/stripe/change-plan";
import { getStripe } from "@/lib/stripe/client";
import { priceIdForPlan } from "@/lib/stripe/plans";

/**
 * ★ DOES STRIPE'S CHANGE-PLAN CONFIGURATION LIST EVERY PRO PRICE WE SELL (credit-watch; the configuration is
 * billing-caps.md's, its setup PRICING.md's "Stripe setup"). A Pro switch opens Stripe's confirm page for exactly one
 * target price on the configuration tagged `partyreel_purpose=change_plan`, and Stripe refuses a price that
 * configuration does not list, so every Switch to it is a 500 the host meets first: TEST's listed six retired prices
 * on 2026-10-05 and every Switch failed until the Orchestrator re-listed them. So the operator's Accounts list asks,
 * on each view, with the app's own Stripe client: the configuration the route would pick (`pickChangePlanConfiguration`,
 * the route's own choice), its products read whole (only a retrieve expands them; the list omits them), against every
 * Pro price `tiers.ts` sells, by the ids the env maps them to (`priceIdForPlan`, the checkout's own).
 *
 * A price the configuration lists beyond those (a retired one) breaks nothing: the confirm flow names one target, and
 * the host never meets the configuration's switcher. Only a missing one does.
 *
 * ★ A CHECK THAT COULD NOT RUN SAYS SO (`unread`, never `whole`): a Stripe read that failed, or a Pro price whose env
 * value is unset (that plan's checkout breaks too), which the page says as No reading, with why.
 */

/** A Pro price we sell: its plan, its words, and the Stripe id the env maps it to. */
export type SoldPrice = { planId: PlanId; label: string; priceId: string };

export type PortalCheck =
  /** The tagged configuration lists every Pro price we sell. */
  | { state: "whole"; configurationId: string; sold: number }
  /** It lists some, and each one missing is a Switch Stripe refuses. */
  | {
      state: "missing";
      configurationId: string;
      sold: number;
      missing: SoldPrice[];
    }
  /** No active configuration carries the tag (or its subscription updates are off): change-plan fails closed, a 503. */
  | { state: "no_configuration" }
  /** The check could not run: a failed Stripe read, or a Pro price with no env value. */
  | { state: "unread"; message: string };

/** The products a configuration's subscription updates list, as a retrieve with the expand answers them. */
type ListedProducts =
  | readonly { readonly prices: readonly string[] }[]
  | null
  | undefined;

/** PURE: the prices we sell that the configuration's products do not list, in the order we sell them. */
export function missingPrices(
  sold: readonly SoldPrice[],
  products: ListedProducts,
): SoldPrice[] {
  const listed = new Set((products ?? []).flatMap((p) => p.prices));
  return sold.filter((price) => !listed.has(price.priceId));
}

/** Every Pro price `tiers.ts` sells, with its env id: a Pro plan's size at its cadence ("Pro 50 GB, $90/yr"). Throws when an id is unset. */
export function soldProPrices(
  priceFor: (planId: PlanId) => string = priceIdForPlan,
): SoldPrice[] {
  return PLANS.filter((plan) => plan.tier === "pro").map((plan) => ({
    planId: plan.id,
    label: `${plan.name}, ${plan.priceLabel}`,
    priceId: priceFor(plan.id),
  }));
}

/** Ask Stripe, now. Never throws: a check that could not run answers `unread`. */
export async function checkChangePlanConfiguration(): Promise<PortalCheck> {
  try {
    const sold = soldProPrices();
    const stripe = getStripe();
    const configurations: PortalConfigurationLike[] = [];
    // Auto-pagination, as the route lists them: a page boundary must never decide whether the tag is found.
    for await (const configuration of stripe.billingPortal.configurations.list({
      active: true,
      limit: 100,
    })) {
      configurations.push(configuration);
    }
    const id = pickChangePlanConfiguration(configurations);
    if (!id) return { state: "no_configuration" };
    const configuration = await stripe.billingPortal.configurations.retrieve(
      id,
      { expand: ["features.subscription_update.products"] },
    );
    const missing = missingPrices(
      sold,
      configuration.features.subscription_update.products,
    );
    return missing.length === 0
      ? { state: "whole", configurationId: id, sold: sold.length }
      : { state: "missing", configurationId: id, sold: sold.length, missing };
  } catch (error) {
    return {
      state: "unread",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
