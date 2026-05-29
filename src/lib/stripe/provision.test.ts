import { describe, expect, it } from "vitest";
import type Stripe from "stripe";

import { PLANS, planById, type Plan } from "@/lib/constants/tiers";
import {
  resolveEventPassCheckout,
  resolveSubscriptionUpdate,
} from "@/lib/stripe/provision";

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

// checkout.session.completed fixture — resolveEventPassCheckout reads metadata.plan_id,
// client_reference_id, customer, and created.
function checkoutEvent(opts: {
  planId?: string;
  userId?: string | null;
  customer?: string;
  created?: number;
}): Stripe.Event {
  return {
    type: "checkout.session.completed",
    data: {
      object: {
        client_reference_id: opts.userId === undefined ? "user_1" : opts.userId,
        customer: opts.customer ?? "cus_1",
        created: opts.created ?? 1_700_000_000,
        metadata: opts.planId ? { plan_id: opts.planId } : {},
      },
    },
  } as unknown as Stripe.Event;
}

describe("resolveEventPassCheckout", () => {
  const eventPass = planById("event_pass");
  const term = eventPass.termDays ?? 365;

  it("provisions Event Pass (75 GB) + a term-derived expiry on a one-time purchase", () => {
    const created = 1_700_000_000;
    const patch = resolveEventPassCheckout(
      checkoutEvent({
        planId: "event_pass",
        userId: "u1",
        customer: "cus_x",
        created,
      }),
      eventPass,
    );
    expect(patch).toEqual({
      userId: "u1",
      customerId: "cus_x",
      storageCapBytes: eventPass.storageBytes,
      tierExpiresAt: new Date((created + term * 86_400) * 1000).toISOString(),
    });
  });

  it("is idempotent — same session.created → same expiry (no term extension)", () => {
    const e = checkoutEvent({ planId: "event_pass", created: 1_711_111_111 });
    expect(resolveEventPassCheckout(e, eventPass)?.tierExpiresAt).toBe(
      resolveEventPassCheckout(e, eventPass)?.tierExpiresAt,
    );
  });

  it("ignores non-Event-Pass checkouts (Pro subscription) and missing user", () => {
    expect(
      resolveEventPassCheckout(checkoutEvent({ planId: "pro_500" }), eventPass),
    ).toBeNull();
    expect(resolveEventPassCheckout(checkoutEvent({}), eventPass)).toBeNull();
    expect(
      resolveEventPassCheckout(
        checkoutEvent({ planId: "event_pass", userId: null }),
        eventPass,
      ),
    ).toBeNull();
  });

  it("ignores unrelated event types", () => {
    const sub = {
      type: "customer.subscription.created",
      data: { object: {} },
    } as unknown as Stripe.Event;
    expect(resolveEventPassCheckout(sub, eventPass)).toBeNull();
  });
});
