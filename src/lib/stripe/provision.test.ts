import { describe, expect, it } from "vitest";
import type Stripe from "stripe";

import { PLANS, planById, type Plan } from "@/lib/constants/tiers";
import {
  deliveryCreatedAt,
  eventPassSession,
  proCreditSession,
  resolveSubscriptionUpdate,
  subscriptionQuantityWarning,
} from "@/lib/stripe/provision";

// Minimal fixture builders — resolveSubscriptionUpdate only reads a few fields.
function subEvent(
  type: string,
  sub: {
    id?: string;
    customer?: string;
    status?: string;
    priceId?: string | null;
    /** Per item; omitted = the one item at quantity 1. */
    quantities?: (number | undefined)[];
  },
): Stripe.Event {
  const priceId = sub.priceId ?? "price_pro_500";
  const items =
    sub.priceId === null
      ? []
      : (sub.quantities ?? [1]).map((quantity) => ({
          price: { id: priceId },
          quantity,
        }));
  return {
    type,
    data: {
      object: {
        id: sub.id ?? "sub_123",
        customer: sub.customer ?? "cus_123",
        status: sub.status ?? "active",
        items: { data: items },
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
      // A grant names no subscription to end: it applies whatever the profile followed.
      endsSubscriptionId: null,
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
      // The downgrade names the subscription it ends (the two-subscription ★).
      endsSubscriptionId: "sub_123",
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

/**
 * ★ A PAYING HOST NEVER LANDS ON FREE BECAUSE THEIR FIRST PAYMENT WAS STILL IN FLIGHT.
 * Checkout's subscription is created `incomplete` and turns `active` a moment later;
 * the recency guard admits same-second deliveries in either order, so an `incomplete`
 * that downgraded could land after the `active` that granted. Every status, both
 * lifecycle events, and the deletion that ends it all.
 */
describe("resolveSubscriptionUpdate: every status", () => {
  const PRO_500 = planById("pro_500").storageBytes;
  const grant = {
    tier: "pro",
    storageCapBytes: PRO_500,
    subscriptionId: "sub_123",
    endsSubscriptionId: null,
  };
  const downgrade = {
    tier: "free",
    storageCapBytes: null,
    subscriptionId: null,
    endsSubscriptionId: "sub_123",
  };

  const cases: [
    status: string,
    expected: typeof grant | typeof downgrade | null,
  ][] = [
    ["active", grant],
    ["trialing", grant],
    // Dunning keeps access; the terminal states below take it away.
    ["past_due", grant],
    // ★ The first payment is in flight: neither a grant nor a revocation.
    ["incomplete", null],
    ["incomplete_expired", downgrade],
    ["canceled", downgrade],
    ["unpaid", downgrade],
    ["paused", downgrade],
  ];

  for (const type of [
    "customer.subscription.created",
    "customer.subscription.updated",
  ]) {
    for (const [status, expected] of cases) {
      it(`${type.split(".").pop()} + ${status} → ${expected ? expected.tier : "no change"}`, () => {
        const patch = resolveSubscriptionUpdate(
          subEvent(type, { status, priceId: "price_pro_500" }),
          resolve,
        );
        expect(patch).toEqual(
          expected ? { customerId: "cus_123", ...expected } : null,
        );
      });
    }
  }

  it("a deletion downgrades whatever status it carries, incomplete included", () => {
    for (const [status] of cases) {
      expect(
        resolveSubscriptionUpdate(
          subEvent("customer.subscription.deleted", {
            status,
            priceId: "price_pro_500",
          }),
          resolve,
        ),
        status,
      ).toEqual({ customerId: "cus_123", ...downgrade });
    }
  });

  it("★ the race it closes: `active` then a same-second `incomplete` leaves the host on the plan they paid for", () => {
    const granted = resolveSubscriptionUpdate(
      subEvent("customer.subscription.updated", { status: "active" }),
      resolve,
    );
    const late = resolveSubscriptionUpdate(
      subEvent("customer.subscription.created", { status: "incomplete" }),
      resolve,
    );
    expect(granted?.tier).toBe("pro");
    // The late delivery writes nothing, so nothing overwrites the grant.
    expect(late).toBeNull();
  });
});

/**
 * ★ A DOWNGRADE ENDS ONE SUBSCRIPTION, NOT THE CUSTOMER'S PLAN. Two Checkout tabs (or a stale
 * session paid after the first) give one customer two subscriptions, and every event for either
 * names the same customer. So each downgrade names the subscription it ends, and the webhook lands
 * it only on a profile following that one (its route test drives the race against the table).
 */
describe("resolveSubscriptionUpdate: two subscriptions, one customer", () => {
  it("the abandoned tab's expiry names the stale subscription, not the live one", () => {
    const granted = resolveSubscriptionUpdate(
      subEvent("customer.subscription.updated", { id: "sub_live" }),
      resolve,
    );
    const expired = resolveSubscriptionUpdate(
      subEvent("customer.subscription.updated", {
        id: "sub_stale",
        status: "incomplete_expired",
      }),
      resolve,
    );
    expect(granted).toMatchObject({
      tier: "pro",
      subscriptionId: "sub_live",
      endsSubscriptionId: null,
    });
    expect(expired).toMatchObject({
      customerId: granted?.customerId,
      tier: "free",
      endsSubscriptionId: "sub_stale",
    });
  });

  it("each subscription's deletion names itself", () => {
    for (const id of ["sub_stale", "sub_live"]) {
      expect(
        resolveSubscriptionUpdate(
          subEvent("customer.subscription.deleted", { id, status: "canceled" }),
          resolve,
        )?.endsSubscriptionId,
      ).toBe(id);
    }
  });
});

describe("subscriptionQuantityWarning (the old portal stepper's multiples)", () => {
  it("names the subscription, its customer and the quantity when an item is billed more than once", () => {
    expect(
      subscriptionQuantityWarning(
        subEvent("customer.subscription.updated", {
          id: "sub_x",
          customer: "cus_x",
          quantities: [2],
        }),
      ),
    ).toEqual({ subscriptionId: "sub_x", customerId: "cus_x", quantity: 2 });
  });

  it("fires on a created subscription too, and reports the largest item's quantity", () => {
    expect(
      subscriptionQuantityWarning(
        subEvent("customer.subscription.created", { quantities: [1, 3] }),
      ),
    ).toEqual({
      subscriptionId: "sub_123",
      customerId: "cus_123",
      quantity: 3,
    });
  });

  it("is quiet at quantity 1, for a metered item with no quantity, and for an empty subscription", () => {
    expect(
      subscriptionQuantityWarning(
        subEvent("customer.subscription.updated", { quantities: [1] }),
      ),
    ).toBeNull();
    expect(
      subscriptionQuantityWarning(
        subEvent("customer.subscription.updated", { quantities: [undefined] }),
      ),
    ).toBeNull();
    expect(
      subscriptionQuantityWarning(
        subEvent("customer.subscription.updated", { priceId: null }),
      ),
    ).toBeNull();
  });

  it("is quiet on a deletion and on anything that is not a subscription", () => {
    expect(
      subscriptionQuantityWarning(
        subEvent("customer.subscription.deleted", { quantities: [2] }),
      ),
    ).toBeNull();
    expect(
      subscriptionQuantityWarning(
        subEvent("invoice.paid", { quantities: [2] }),
      ),
    ).toBeNull();
  });

  it("★ leaves the entitlement exactly as one plan's cap: provisioning never multiplies", () => {
    const patch = resolveSubscriptionUpdate(
      subEvent("customer.subscription.updated", { quantities: [3] }),
      resolve,
    );
    expect(patch?.storageCapBytes).toBe(planById("pro_500").storageBytes);
  });
});

describe("Pro plans ↔ Stripe wiring", () => {
  it("every Pro plan carries a Stripe Price env key", () => {
    for (const p of PLANS.filter((x) => x.tier === "pro")) {
      expect(p.stripePriceEnvKey).toBeTruthy();
    }
  });
});

// checkout.session.completed fixture — the billing-caps.md recognizers read metadata,
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

describe("eventPassSession (the billing-caps.md ledger recognizer)", () => {
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
      proCreditSession(
        checkoutEvent({ planId: "pro_100", mode: "subscription" }),
      ),
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
