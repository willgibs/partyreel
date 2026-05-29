import { describe, expect, it } from "vitest";
import type Stripe from "stripe";

import { PLANS, planById, type Plan } from "@/lib/constants/tiers";
import { resolveSubscriptionUpdate } from "@/lib/stripe/provision";

// Minimal fixture builders — resolveSubscriptionUpdate only reads a few fields.
function subEvent(
  type: string,
  sub: {
    id?: string;
    customer?: string;
    status?: string;
    priceId?: string | null;
  },
): Stripe.Event {
  return {
    type,
    data: {
      object: {
        id: sub.id ?? "sub_123",
        customer: sub.customer ?? "cus_123",
        status: sub.status ?? "active",
        items: {
          data:
            sub.priceId === null
              ? []
              : [{ price: { id: sub.priceId ?? "price_pro_500" } }],
        },
      },
    },
  } as unknown as Stripe.Event;
}

// Stub resolver: only "price_pro_500" is known (→ the Pro 500 GB plan).
const resolve = (priceId: string): Plan | null =>
  priceId === "price_pro_500" ? planById("pro_500") : null;

describe("resolveSubscriptionUpdate", () => {
  it("provisions Pro + the plan's cap on an active subscription", () => {
    const patch = resolveSubscriptionUpdate(
      subEvent("customer.subscription.created", {
        priceId: "price_pro_500",
        customer: "cus_abc",
        id: "sub_abc",
      }),
      resolve,
    );
    expect(patch).toEqual({
      customerId: "cus_abc",
      tier: "pro",
      storageCapBytes: planById("pro_500").storageBytes,
      subscriptionId: "sub_abc",
    });
  });

  it("re-derives the cap on a plan switch (updated)", () => {
    const patch = resolveSubscriptionUpdate(
      subEvent("customer.subscription.updated", { priceId: "price_pro_500" }),
      resolve,
    );
    expect(patch?.tier).toBe("pro");
    expect(patch?.storageCapBytes).toBe(planById("pro_500").storageBytes);
  });

  it("downgrades to Free on deletion (cap null → Free default)", () => {
    const patch = resolveSubscriptionUpdate(
      subEvent("customer.subscription.deleted", {
        priceId: "price_pro_500",
        customer: "cus_xyz",
      }),
      resolve,
    );
    expect(patch).toEqual({
      customerId: "cus_xyz",
      tier: "free",
      storageCapBytes: null,
      subscriptionId: null,
    });
  });

  it("downgrades when the subscription is no longer active", () => {
    const patch = resolveSubscriptionUpdate(
      subEvent("customer.subscription.updated", {
        status: "canceled",
        priceId: "price_pro_500",
      }),
      resolve,
    );
    expect(patch?.tier).toBe("free");
    expect(patch?.storageCapBytes).toBeNull();
  });

  it("ignores unrelated events", () => {
    expect(
      resolveSubscriptionUpdate(subEvent("invoice.paid", {}), resolve),
    ).toBeNull();
  });

  it("leaves entitlements untouched for an unknown price", () => {
    const patch = resolveSubscriptionUpdate(
      subEvent("customer.subscription.updated", { priceId: "price_mystery" }),
      resolve,
    );
    expect(patch).toBeNull();
  });
});

describe("Pro plans ↔ Stripe wiring", () => {
  it("every Pro plan carries a Stripe Price env key", () => {
    for (const p of PLANS.filter((x) => x.tier === "pro")) {
      expect(p.stripePriceEnvKey).toBeTruthy();
    }
  });
});
