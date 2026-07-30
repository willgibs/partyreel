import { describe, expect, it } from "vitest";
import type Stripe from "stripe";

import { PLANS, planById, type Plan } from "@/lib/constants/tiers";
import {
  deliveryCreatedAt,
  eventPassSession,
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
  const termMs = term * 86_400_000;

  it("provisions Event Pass (75 GB) + a full term for a first purchase", () => {
    const created = 1_700_000_000;
    const patch = resolveEventPassCheckout(
      checkoutEvent({
        planId: "event_pass",
        userId: "u1",
        customer: "cus_x",
        created,
      }),
      eventPass,
      null,
    );
    expect(patch).toEqual({
      userId: "u1",
      customerId: "cus_x",
      storageCapBytes: eventPass.storageBytes,
      tierExpiresAt: new Date(created * 1000 + termMs).toISOString(),
    });
  });

  // QA #35 / ADR-0023 ruling 1. The old arithmetic was `session.created + term`, so a host who
  // renewed a month early silently threw away the eleven months they had already paid for.
  it("EXTENDS from the current expiry when the pass is still live", () => {
    const created = 1_700_000_000;
    const current = new Date(
      created * 1000 + 300 * 86_400_000, // 300 days left on the pass
    ).toISOString();
    const patch = resolveEventPassCheckout(
      checkoutEvent({ planId: "event_pass", created }),
      eventPass,
      current,
    );
    expect(patch?.tierExpiresAt).toBe(
      new Date(Date.parse(current) + termMs).toISOString(),
    );
    // and it is strictly better than the reset it replaced
    expect(Date.parse(patch!.tierExpiresAt)).toBeGreaterThan(
      created * 1000 + termMs,
    );
  });

  it("starts a fresh term from a lapsed or absent expiry (never backdates)", () => {
    const created = 1_700_000_000;
    const lapsed = new Date(created * 1000 - 86_400_000).toISOString();
    const fresh = new Date(created * 1000 + termMs).toISOString();
    expect(
      resolveEventPassCheckout(
        checkoutEvent({ planId: "event_pass", created }),
        eventPass,
        lapsed,
      )?.tierExpiresAt,
    ).toBe(fresh);
    // A malformed stored value degrades the same way rather than throwing: never fail a paid
    // purchase over a timestamp we wrote badly.
    expect(
      resolveEventPassCheckout(
        checkoutEvent({ planId: "event_pass", created }),
        eventPass,
        "not-a-date",
      )?.tierExpiresAt,
    ).toBe(fresh);
  });

  it("is a pure function of its inputs (no clock, so a retry cannot drift)", () => {
    const e = checkoutEvent({ planId: "event_pass", created: 1_711_111_111 });
    expect(resolveEventPassCheckout(e, eventPass, null)?.tierExpiresAt).toBe(
      resolveEventPassCheckout(e, eventPass, null)?.tierExpiresAt,
    );
    // NOTE: purity is NOT replay-safety here. This patch accumulates, so re-feeding it the expiry
    // it just produced legitimately extends again. Replay-safety lives in the webhook's ordering
    // guard, which only applies a delivery strictly newer than the last one on that profile.
    const first = resolveEventPassCheckout(e, eventPass, null)!.tierExpiresAt;
    expect(
      resolveEventPassCheckout(e, eventPass, first)!.tierExpiresAt,
    ).not.toBe(first);
  });

  it("ignores non-Event-Pass checkouts (Pro subscription) and missing user", () => {
    expect(
      resolveEventPassCheckout(
        checkoutEvent({ planId: "pro_500" }),
        eventPass,
        null,
      ),
    ).toBeNull();
    expect(
      resolveEventPassCheckout(checkoutEvent({}), eventPass, null),
    ).toBeNull();
    expect(
      resolveEventPassCheckout(
        checkoutEvent({ planId: "event_pass", userId: null }),
        eventPass,
        null,
      ),
    ).toBeNull();
  });

  it("ignores unrelated event types", () => {
    const sub = {
      type: "customer.subscription.created",
      data: { object: {} },
    } as unknown as Stripe.Event;
    expect(resolveEventPassCheckout(sub, eventPass, null)).toBeNull();
  });
});

describe("eventPassSession", () => {
  it("recognizes the pass checkout without needing the current expiry", () => {
    expect(
      eventPassSession(
        checkoutEvent({
          planId: "event_pass",
          userId: "u9",
          customer: "cus_9",
        }),
      ),
    ).toEqual({ userId: "u9", customerId: "cus_9" });
  });

  it("returns null for everything else (so the route falls through to customer binding)", () => {
    expect(eventPassSession(checkoutEvent({ planId: "pro_500" }))).toBeNull();
    expect(
      eventPassSession(subEvent("customer.subscription.created", {})),
    ).toBeNull();
  });
});

describe("deliveryCreatedAt", () => {
  // The value the QA #5 ordering guard persists and compares. Second-resolution unix seconds in,
  // an ISO timestamptz literal out.
  it("converts Stripe's unix seconds to an ISO timestamp", () => {
    const e = subEvent("customer.subscription.updated", {});
    (e as { created: number }).created = 1_700_000_000;
    expect(deliveryCreatedAt(e)).toBe("2023-11-14T22:13:20.000Z");
  });
});
