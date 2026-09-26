/**
 * THE CHANGE-PLAN PATH'S PURE HALF (no SDK calls, no env, no DB), so every refusal
 * and the exact portal-session shape are fixture-tested the way `provision.ts` is.
 * `/api/stripe/change-plan` is a thin gate over these; `/api/stripe/plan-facts`
 * reads the same assessment to tell the sheet whether a switch can open at all.
 *
 * WHY A PATH OF ITS OWN (the storage guard, billing-caps.md): a Pro size or cadence
 * change used to go through the general billing portal, whose plan switcher cannot
 * know what a host stores, so it could shrink a host below what they hold; its
 * quantity stepper (no maximum) could also bill two or three times for one cap. Now
 * the app checks the storage first, then opens Stripe's CONFIRM page for exactly one
 * price at quantity 1, on a portal configuration tagged for this one job, and
 * Stripe keeps what it is good at: the proration preview, payment and 3DS.
 */
import type Stripe from "stripe";

import type { Plan } from "@/lib/constants/tiers";

/**
 * The metadata VALUE (under `partyreel_purpose`) that marks the change-plan portal
 * configuration. No env value names it: the route lists the account's active
 * configurations and takes the one carrying this tag, so TEST and LIVE each find
 * their own and the cutover is "re-create it with the same tag" (PRICING.md).
 */
export const CHANGE_PLAN_PURPOSE = "change_plan";

/** The slice of a portal configuration the pick reads (the SDK type satisfies it). */
export type PortalConfigurationLike = {
  id: string;
  active: boolean;
  metadata: Record<string, string> | null;
  features: { subscription_update: { enabled: boolean } };
};

/**
 * The tagged configuration, or null (the caller fails CLOSED on null: opening the
 * general configuration instead would hand the host its switcher, which is the
 * exact door this path exists to close). A tagged configuration with
 * `subscription_update` off cannot run a confirm flow, so it does not count.
 * Stripe lists newest first, so two tagged ones resolve to the newer.
 */
export function pickChangePlanConfiguration(
  configurations: readonly PortalConfigurationLike[],
): string | null {
  const tagged = configurations.find(
    (c) =>
      c.active &&
      c.metadata?.partyreel_purpose === CHANGE_PLAN_PURPOSE &&
      c.features.subscription_update.enabled,
  );
  return tagged?.id ?? null;
}

/** Why a subscription cannot take a change here. Each maps to one sentence below. */
export type ChangeRefusalCode =
  | "not_yours"
  | "payment_issue"
  | "not_active"
  | "ending"
  | "multi_item"
  | "foreign_price";

/** Every refusal the change-plan route answers besides the storage one. */
export type ChangePlanRefusalCode =
  | ChangeRefusalCode
  | "not_subscribed"
  | "no_subscription"
  | "already_on_plan";

/**
 * One sentence per refusal, in ONE home: the route sends it and the plan sheet
 * prints the same words beside a Pro list whose switch cannot open, so a host is
 * never told two different things about one subscription. None promises a reply
 * (copy stays open); the contact page is named as a place, not a service level.
 */
export const CHANGE_REFUSAL_MESSAGES: Record<ChangePlanRefusalCode, string> = {
  not_subscribed: "You're not on Pro. Choose a plan to start one.",
  no_subscription:
    "This Pro plan was set up by Partyreel, so it changes through us. Send us a note from the contact page.",
  not_yours: "That subscription isn't on your account.",
  payment_issue:
    "Your last payment didn't go through. Update your card in the billing portal, then change your plan.",
  not_active:
    "Your Pro subscription isn't active, so there's nothing to change. Choose a plan to start one.",
  ending:
    "Your Pro is set to end with this billing period. Renew it in the billing portal, then change your plan.",
  multi_item:
    "This subscription can't be changed here. Send us a note from the contact page.",
  foreign_price:
    "This subscription isn't on a current Pro price, so it changes through us. Send us a note from the contact page.",
  already_on_plan: "That's the plan you're on already.",
};

export type SubscriptionAssessment =
  | {
      ok: true;
      subscriptionId: string;
      itemId: string;
      currentPlan: Plan;
      currentPriceId: string;
      quantity: number;
    }
  | { ok: false; code: ChangeRefusalCode };

/**
 * Can THIS subscription take a one-price change, for THIS customer? Checked in the
 * order a wrong answer would cost most: someone else's subscription first (never
 * reveal or touch it), then its standing, then its shape. `resolvePlan` is
 * `planForPriceId` in production (env-bound, so injected rather than imported).
 */
export function assessSubscription(
  sub: Stripe.Subscription,
  customerId: string,
  resolvePlan: (priceId: string) => Plan | null,
): SubscriptionAssessment {
  const subCustomer =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  if (subCustomer !== customerId) return { ok: false, code: "not_yours" };

  // past_due keeps Pro through dunning (provision.ts), but a price change on an
  // unpaid subscription stacks a new invoice on a card that just failed: the card
  // is fixed first, in the general portal.
  if (sub.status === "past_due" || sub.status === "unpaid") {
    return { ok: false, code: "payment_issue" };
  }
  if (sub.status !== "active" && sub.status !== "trialing") {
    return { ok: false, code: "not_active" };
  }
  // A cancellation already scheduled: renewing is the general portal's move, and a
  // resize here would quietly keep the end date the host may have forgotten.
  if (sub.cancel_at_period_end || sub.cancel_at) {
    return { ok: false, code: "ending" };
  }
  // Stripe's confirm flow updates exactly one item, and a subscription with more
  // than one is not updatable through it at all.
  if (sub.items.data.length !== 1) return { ok: false, code: "multi_item" };

  const item = sub.items.data[0];
  const plan = resolvePlan(item.price.id);
  if (!plan || plan.tier !== "pro") return { ok: false, code: "foreign_price" };

  return {
    ok: true,
    subscriptionId: sub.id,
    itemId: item.id,
    currentPlan: plan,
    currentPriceId: item.price.id,
    quantity: item.quantity ?? 1,
  };
}

/**
 * THE SESSION, exactly. One item, the target price, quantity 1 (which also heals a
 * subscription the old stepper left at 2 or 3), on the tagged configuration, and a
 * REDIRECT after completion, so the host never lands on that configuration's home
 * page and its switcher. The top-level `return_url` is the way back Stripe shows
 * before confirming; the redirect is where a confirmed change lands. Both are the
 * same allow-listed app path.
 */
export function changePlanSessionParams(input: {
  customerId: string;
  configurationId: string;
  subscriptionId: string;
  itemId: string;
  priceId: string;
  returnUrl: string;
}): Stripe.BillingPortal.SessionCreateParams {
  return {
    customer: input.customerId,
    configuration: input.configurationId,
    return_url: input.returnUrl,
    flow_data: {
      type: "subscription_update_confirm",
      subscription_update_confirm: {
        subscription: input.subscriptionId,
        items: [{ id: input.itemId, price: input.priceId, quantity: 1 }],
      },
      after_completion: {
        type: "redirect",
        redirect: { return_url: input.returnUrl },
      },
    },
  };
}
