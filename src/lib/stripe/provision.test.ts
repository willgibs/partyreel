import { describe, expect, it } from "vitest";
import type Stripe from "stripe";

import { PLANS, planById, type Plan } from "@/lib/constants/tiers";
import {
  deliveryCreatedAt,
  eventPassSession,
  proCreditSession,
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

// checkout.session.completed fixture — the ADR-0025 recognizers read metadata,
// client_reference_id, customer, id, created, mode, and amount_total.
function checkoutEvent(opts: {
  planId?: string;
  userId?: string | null;
  customer?: string;
  created?: number;
  sessionId?: string;
  renewal?: boolean;
  amountTotal?: number | null;
  mode?: string;
  passCreditCents?: string;
}): Stripe.Event {
  const metadata: Record<string, string> = {};
  if (opts.planId) metadata.plan_id = opts.planId;
  if (opts.renewal) metadata.renewal = "1";
  if (opts.passCreditCents) metadata.pass_credit_cents = opts.passCreditCents;
  return {
    type: "checkout.session.completed",
    data: {
      object: {
        id: opts.sessionId ?? "cs_1",
        client_reference_id: opts.userId === undefined ? "user_1" : opts.userId,
        customer: opts.customer ?? "cus_1",
        created: opts.created ?? 1_700_000_000,
        mode: opts.mode ?? "payment",
        amount_total: opts.amountTotal === undefined ? 2400 : opts.amountTotal,
        metadata,
      },
    },
  } as unknown as Stripe.Event;
}

describe("eventPassSession (the ADR-0025 ledger recognizer)", () => {
  it("pulls out everything the ledger insert needs", () => {
    expect(
      eventPassSession(
        checkoutEvent({
          planId: "event_pass",
          userId: "u9",
          customer: "cus_9",
          sessionId: "cs_pass_1",
          created: 1_700_000_000,
          amountTotal: 2400,
        }),
      ),
    ).toEqual({
      userId: "u9",
      customerId: "cus_9",
      sessionId: "cs_pass_1",
      createdMs: 1_700_000_000_000,
      renewal: false,
      amountTotalCents: 2400,
    });
  });

  it("carries the renewal flag (the window chains instead of stacking)", () => {
    const ref = eventPassSession(
      checkoutEvent({ planId: "event_pass", renewal: true, amountTotal: 1500 }),
    );
    expect(ref?.renewal).toBe(true);
    expect(ref?.amountTotalCents).toBe(1500);
  });

  it("degrades a missing amount_total to null (the ledger stores 0, never over-credits)", () => {
    const ref = eventPassSession(
      checkoutEvent({ planId: "event_pass", amountTotal: null }),
    );
    expect(ref?.amountTotalCents).toBeNull();
  });

  it("returns null for non-pass sessions and missing ids", () => {
    expect(eventPassSession(checkoutEvent({ planId: "pro_500" }))).toBeNull();
    expect(eventPassSession(checkoutEvent({}))).toBeNull();
    expect(
      eventPassSession(checkoutEvent({ planId: "event_pass", userId: null })),
    ).toBeNull();
    expect(
      eventPassSession(subEvent("customer.subscription.created", {})),
    ).toBeNull();
  });
});

describe("proCreditSession (the prorated Pass → Pro credit)", () => {
  it("recognizes a subscription checkout stamped with a credit", () => {
    expect(
      proCreditSession(
        checkoutEvent({
          planId: "pro_100",
          mode: "subscription",
          userId: "u3",
          customer: "cus_3",
          sessionId: "cs_pro_1",
          passCreditCents: "1200",
        }),
      ),
    ).toEqual({
      userId: "u3",
      customerId: "cus_3",
      sessionId: "cs_pro_1",
      creditCents: 1200,
    });
  });

  it("returns null without the stamp, off subscription mode, or for junk values", () => {
    expect(
      proCreditSession(checkoutEvent({ planId: "pro_100", mode: "subscription" })),
    ).toBeNull();
    expect(
      proCreditSession(
        checkoutEvent({
          planId: "event_pass",
          mode: "payment",
          passCreditCents: "1200",
        }),
      ),
    ).toBeNull();
    expect(
      proCreditSession(
        checkoutEvent({
          planId: "pro_100",
          mode: "subscription",
          passCreditCents: "0",
        }),
      ),
    ).toBeNull();
    expect(
      proCreditSession(
        checkoutEvent({
          planId: "pro_100",
          mode: "subscription",
          passCreditCents: "junk",
        }),
      ),
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
