import { describe, expect, it } from "vitest";
import type Stripe from "stripe";

import { planById, type Plan } from "@/lib/constants/tiers";

import {
  CHANGE_PLAN_PURPOSE,
  assessSubscription,
  changePlanSessionParams,
  pickChangePlanConfiguration,
  type PortalConfigurationLike,
} from "./change-plan";

/**
 * The change-plan path's refusals and its session SHAPE, pinned where they are
 * decided (the pure half), so the route test only has to prove the route asks.
 * The shape is the whole safety argument: one item, quantity 1, the tagged
 * configuration, and a redirect after completion, so a host reaches Stripe's
 * confirm page for exactly the price the storage check approved and never the
 * configuration's home page with its switcher.
 */

function config(
  over: Partial<PortalConfigurationLike> & { tag?: string | null } = {},
): PortalConfigurationLike {
  const { tag = CHANGE_PLAN_PURPOSE, ...rest } = over;
  return {
    id: "bpc_tagged",
    active: true,
    metadata: tag === null ? {} : { partyreel_purpose: tag },
    features: { subscription_update: { enabled: true } },
    ...rest,
  };
}

describe("finding the change-plan configuration", () => {
  it("takes the configuration carrying the tag", () => {
    expect(
      pickChangePlanConfiguration([
        config({ id: "bpc_default", tag: null }),
        config({ id: "bpc_tagged" }),
      ]),
    ).toBe("bpc_tagged");
  });

  it("answers null (the caller fails closed) when nothing carries it", () => {
    expect(pickChangePlanConfiguration([])).toBe(null);
    expect(
      pickChangePlanConfiguration([config({ id: "bpc_default", tag: null })]),
    ).toBe(null);
    expect(
      pickChangePlanConfiguration([config({ tag: "something_else" })]),
    ).toBe(null);
  });

  it("never takes an inactive one, or one that cannot run a confirm flow", () => {
    expect(pickChangePlanConfiguration([config({ active: false })])).toBe(null);
    expect(
      pickChangePlanConfiguration([
        config({ features: { subscription_update: { enabled: false } } }),
      ]),
    ).toBe(null);
  });

  it("takes the newest of two tagged ones (Stripe lists newest first)", () => {
    expect(
      pickChangePlanConfiguration([
        config({ id: "bpc_newer" }),
        config({ id: "bpc_older" }),
      ]),
    ).toBe("bpc_newer");
  });
});

// A subscription with only the fields the assessment reads.
function sub(
  over: {
    customer?: string;
    status?: string;
    cancelAtPeriodEnd?: boolean;
    cancelAt?: number | null;
    items?: { id: string; price: string; quantity?: number }[];
  } = {},
): Stripe.Subscription {
  return {
    id: "sub_1",
    customer: over.customer ?? "cus_1",
    status: over.status ?? "active",
    cancel_at_period_end: over.cancelAtPeriodEnd ?? false,
    cancel_at: over.cancelAt ?? null,
    items: {
      data: (
        over.items ?? [{ id: "si_1", price: "price_pro_100", quantity: 1 }]
      ).map((i) => ({
        id: i.id,
        price: { id: i.price },
        quantity: i.quantity,
      })),
    },
  } as unknown as Stripe.Subscription;
}

const resolve = (priceId: string): Plan | null =>
  ({
    price_pro_100: planById("pro_100"),
    price_pro_500_yr: planById("pro_500_yr"),
    price_pass: planById("event_pass"),
  })[priceId] ?? null;

describe("which subscriptions can take a change", () => {
  it("accepts an active, single-item subscription on one of our Pro prices", () => {
    expect(assessSubscription(sub(), "cus_1", resolve)).toEqual({
      ok: true,
      subscriptionId: "sub_1",
      itemId: "si_1",
      currentPlan: planById("pro_100"),
      currentPriceId: "price_pro_100",
      quantity: 1,
    });
  });

  it("refuses a subscription that belongs to another customer, first", () => {
    // Even a past-due, multi-item stranger's subscription answers not_yours:
    // nothing about it may be revealed or acted on.
    expect(
      assessSubscription(
        sub({ customer: "cus_other", status: "past_due" }),
        "cus_1",
        resolve,
      ),
    ).toEqual({ ok: false, code: "not_yours" });
  });

  it("sends an unpaid subscription to fix its card first", () => {
    for (const status of ["past_due", "unpaid"]) {
      expect(assessSubscription(sub({ status }), "cus_1", resolve)).toEqual({
        ok: false,
        code: "payment_issue",
      });
    }
  });

  it("refuses a subscription that is not live", () => {
    for (const status of [
      "canceled",
      "incomplete",
      "incomplete_expired",
      "paused",
    ]) {
      expect(assessSubscription(sub({ status }), "cus_1", resolve)).toEqual({
        ok: false,
        code: "not_active",
      });
    }
  });

  it("refuses a subscription already set to end", () => {
    expect(
      assessSubscription(sub({ cancelAtPeriodEnd: true }), "cus_1", resolve),
    ).toEqual({ ok: false, code: "ending" });
    expect(
      assessSubscription(sub({ cancelAt: 1_800_000_000 }), "cus_1", resolve),
    ).toEqual({ ok: false, code: "ending" });
  });

  it("refuses a subscription with more than one item", () => {
    expect(
      assessSubscription(
        sub({
          items: [
            { id: "si_1", price: "price_pro_100" },
            { id: "si_2", price: "price_pro_500_yr" },
          ],
        }),
        "cus_1",
        resolve,
      ),
    ).toEqual({ ok: false, code: "multi_item" });
  });

  it("refuses a price that is not one of our Pro prices", () => {
    for (const price of ["price_unknown", "price_pass"]) {
      expect(
        assessSubscription(
          sub({ items: [{ id: "si_1", price }] }),
          "cus_1",
          resolve,
        ),
      ).toEqual({ ok: false, code: "foreign_price" });
    }
  });

  it("reports the quantity, so the old stepper's 3x can be healed to 1", () => {
    const assessed = assessSubscription(
      sub({ items: [{ id: "si_1", price: "price_pro_100", quantity: 3 }] }),
      "cus_1",
      resolve,
    );
    expect(assessed.ok && assessed.quantity).toBe(3);
  });
});

describe("the portal session", () => {
  const params = changePlanSessionParams({
    customerId: "cus_1",
    configurationId: "bpc_tagged",
    subscriptionId: "sub_1",
    itemId: "si_1",
    priceId: "price_pro_500",
    returnUrl: "https://partyreel.com/account",
  });

  it("confirms exactly one item, at quantity 1, at the approved price", () => {
    expect(params.flow_data?.type).toBe("subscription_update_confirm");
    expect(params.flow_data?.subscription_update_confirm).toEqual({
      subscription: "sub_1",
      items: [{ id: "si_1", price: "price_pro_500", quantity: 1 }],
    });
  });

  it("rides the tagged configuration, never the default one", () => {
    expect(params.configuration).toBe("bpc_tagged");
    expect(params.customer).toBe("cus_1");
  });

  it("redirects after completion, so the portal home is never reached", () => {
    expect(params.flow_data?.after_completion).toEqual({
      type: "redirect",
      redirect: { return_url: "https://partyreel.com/account" },
    });
    expect(params.return_url).toBe("https://partyreel.com/account");
  });
});
