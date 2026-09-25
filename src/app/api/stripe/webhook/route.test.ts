/**
 * THE WEBHOOK'S SUBSCRIPTION BRANCH, AS STRIPE DELIVERS IT (billing-caps.md), against the in-memory
 * PostgREST, so every case asserts the profile row the table ends up holding, never just the patch
 * the route sent (the guards ride the WHERE clause, and only a table can say what they matched).
 *
 * What the pure provisioning tests cannot see, because it is about what the ROUTE writes:
 *  - a first payment still in flight (`incomplete`) writes nothing at all, so a same-second
 *    `incomplete` delivered after the `active` cannot put a paying host back on Free;
 *  - ★ a downgrade lands only on a profile following the subscription it ends (or none), so the
 *    second subscription of two Checkout tabs can die without taking the live one's plan with it;
 *  - a subscription billed more than once for one cap raises a Sentry warning while the profile is
 *    written exactly as a quantity of one would write it.
 *
 * (Reshaped from a hand-rolled builder stub that matched one row whatever the filters said: it
 * could not have shown the subscription guard declining anything.)
 */
import type Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { planById, type Plan } from "@/lib/constants/tiers";
import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/env", () => ({
  assertStripeEnv: () => ({ STRIPE_WEBHOOK_SECRET: "whsec_test" }),
}));

// The signature check is Stripe's; here the body IS the event.
vi.mock("@/lib/stripe/client", () => ({
  getStripe: () => ({
    webhooks: { constructEvent: (body: string) => JSON.parse(body) },
  }),
}));

vi.mock("@/lib/stripe/plans", () => ({
  planForPriceId: (priceId: string): Plan | null =>
    priceId === "price_pro_500" ? planById("pro_500") : null,
}));

const recomputePassEntitlement = vi.fn(async (_profileId: string) => {});
vi.mock("@/lib/db/mutations/event-passes", () => ({
  consumeLivePassesForProCredit: vi.fn(),
  insertPassPurchase: vi.fn(async () => {}),
  recomputePassEntitlement: (profileId: string) =>
    recomputePassEntitlement(profileId),
}));
vi.mock("@/lib/db/queries/event-passes", () => ({
  getLivePasses: vi.fn(async () => []),
}));

const captureWarning = vi.fn();
const captureError = vi.fn();
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: (...args: unknown[]) => captureWarning(...args),
  captureError: (...args: unknown[]) => captureError(...args),
}));

// ONE table for the whole test: every createAdminClient() call answers from it.
const db = vi.hoisted(() => ({ fake: null as FakePostgrest | null }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(db.fake as FakePostgrest),
}));

const { POST } = await import("@/app/api/stripe/webhook/route");

const PRO_500 = planById("pro_500").storageBytes;
/** Stripe's `created`, unix seconds. Every delivery below is at or after it. */
const T0 = 1_790_000_000;
const at = (seconds: number) => new Date(seconds * 1000).toISOString();

/** The profile row the webhook writes, as the table holds it. */
function profile(overrides: FakeRow = {}): FakeRow {
  return {
    id: "host-1",
    stripe_customer_id: "cus_1",
    stripe_subscription_id: null,
    stripe_event_created_at: at(0),
    tier: "free",
    storage_cap_bytes: null,
    event_slots: null,
    tier_expires_at: null,
    ...overrides,
  };
}

/** A Pro host entitled by `subscriptionId`, as its grant at T0 left them. */
function proOn(subscriptionId: string): FakeRow {
  return profile({
    stripe_subscription_id: subscriptionId,
    stripe_event_created_at: at(T0),
    tier: "pro",
    storage_cap_bytes: PRO_500,
  });
}

function seed(...rows: FakeRow[]) {
  db.fake = createFakePostgrest({ tables: { profiles: rows } });
}

function row(id = "host-1"): FakeRow {
  const found = db.fake?.tables.profiles.find((p) => p.id === id);
  if (!found) throw new Error(`no profile ${id}`);
  return found;
}

function profilePatches() {
  return (db.fake?.requests ?? []).filter(
    (r) => r.name === "profiles" && r.method === "PATCH",
  );
}

function subscriptionEvent(
  type: string,
  opts: {
    id?: string;
    status?: string;
    quantities?: number[];
    created?: number;
    customer?: string;
  } = {},
): Stripe.Event {
  return {
    id: "evt_1",
    type,
    created: opts.created ?? T0,
    data: {
      object: {
        id: opts.id ?? "sub_1",
        customer: opts.customer ?? "cus_1",
        status: opts.status ?? "active",
        items: {
          data: (opts.quantities ?? [1]).map((quantity) => ({
            price: { id: "price_pro_500" },
            quantity,
          })),
        },
      },
    },
  } as unknown as Stripe.Event;
}

/** A one-time Event Pass checkout, completed. */
function passCheckoutEvent(created: number): Stripe.Event {
  return {
    id: "evt_pass",
    type: "checkout.session.completed",
    created,
    data: {
      object: {
        id: "cs_pass_1",
        client_reference_id: "host-1",
        customer: "cus_1",
        created,
        mode: "payment",
        amount_total: 2400,
        metadata: { plan_id: "event_pass" },
      },
    },
  } as unknown as Stripe.Event;
}

function deliver(event: Stripe.Event) {
  return POST(
    new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "t=1,v1=test" },
      body: JSON.stringify(event),
    }),
  );
}

beforeEach(() => {
  seed(profile());
  captureWarning.mockClear();
  captureError.mockClear();
  recomputePassEntitlement.mockClear();
});

describe("the subscription branch", () => {
  it("grants the plan on an active subscription", async () => {
    const response = await deliver(
      subscriptionEvent("customer.subscription.updated"),
    );
    expect(response.status).toBe(200);
    expect(profilePatches()).toHaveLength(1);
    expect(row()).toMatchObject({
      tier: "pro",
      storage_cap_bytes: PRO_500,
      stripe_subscription_id: "sub_1",
      stripe_event_created_at: at(T0),
    });
  });

  it("★ an incomplete subscription writes NOTHING: not a grant, not a downgrade, not even the recency stamp", async () => {
    const before = { ...row() };
    const response = await deliver(
      subscriptionEvent("customer.subscription.created", {
        status: "incomplete",
      }),
    );
    expect(response.status).toBe(200);
    expect(profilePatches()).toEqual([]);
    expect(row()).toEqual(before);
    expect(recomputePassEntitlement).not.toHaveBeenCalled();
  });

  it("★ so the same-second race ends on the plan the host paid for", async () => {
    await deliver(subscriptionEvent("customer.subscription.updated"));
    await deliver(
      subscriptionEvent("customer.subscription.created", {
        status: "incomplete",
      }),
    );
    expect(profilePatches()).toHaveLength(1);
    expect(row().tier).toBe("pro");
  });

  it("still downgrades a first payment that never came (incomplete_expired)", async () => {
    await deliver(
      subscriptionEvent("customer.subscription.updated", {
        status: "incomplete_expired",
      }),
    );
    expect(row()).toMatchObject({
      tier: "free",
      storage_cap_bytes: null,
      stripe_subscription_id: null,
    });
    // A downgrade re-derives any live pass from the ledger.
    expect(recomputePassEntitlement).toHaveBeenCalledWith("host-1");
  });

  it("answers 500 when no profile holds the customer, so Stripe retries (QA #4)", async () => {
    const response = await deliver(
      subscriptionEvent("customer.subscription.deleted", {
        customer: "cus_nobody",
      }),
    );
    expect(response.status).toBe(500);
    expect(captureError).toHaveBeenCalledTimes(1);
  });
});

/**
 * ★ TWO SUBSCRIPTIONS, ONE CUSTOMER (two Checkout tabs, or a stale session paid after the first).
 * Every event for either names the same customer; the profile follows the one its last grant
 * wrote. The abandoned tab's `incomplete_expired` lands a day later, the duplicate's cancellation
 * whenever the operator settles it, and neither may take the live subscription's plan with it.
 */
describe("two subscriptions, one customer", () => {
  it("★ the stale subscription dies and the live one keeps Pro", async () => {
    seed(proOn("sub_live"));
    const before = { ...row() };

    const response = await deliver(
      subscriptionEvent("customer.subscription.updated", {
        id: "sub_stale",
        status: "incomplete_expired",
        created: T0 + 86_400,
      }),
    );

    expect(response.status).toBe(200);
    // The guard declined it in the WHERE clause: the write matched nothing, stamp included.
    expect(profilePatches()).toHaveLength(1);
    expect(profilePatches()[0].returned).toBe(0);
    expect(row()).toEqual(before);
    expect(recomputePassEntitlement).not.toHaveBeenCalled();
    expect(captureError).not.toHaveBeenCalled();
  });

  it("★ nor does the duplicate's cancellation, whatever status it carries", async () => {
    seed(proOn("sub_live"));
    const before = { ...row() };

    for (const status of ["canceled", "active", "incomplete"]) {
      const response = await deliver(
        subscriptionEvent("customer.subscription.deleted", {
          id: "sub_stale",
          status,
          created: T0 + 60,
        }),
      );
      expect(response.status, status).toBe(200);
    }
    expect(row()).toEqual(before);
    expect(recomputePassEntitlement).not.toHaveBeenCalled();
  });

  it("★ the live one dies and the host goes Free", async () => {
    seed(proOn("sub_live"));

    const response = await deliver(
      subscriptionEvent("customer.subscription.deleted", {
        id: "sub_live",
        status: "canceled",
        created: T0 + 60,
      }),
    );

    expect(response.status).toBe(200);
    expect(row()).toMatchObject({
      tier: "free",
      storage_cap_bytes: null,
      stripe_subscription_id: null,
      stripe_event_created_at: at(T0 + 60),
    });
    expect(recomputePassEntitlement).toHaveBeenCalledWith("host-1");
  });

  it("★ the whole race in delivery order: both tabs open, one pays, the other expires, then the live one is cancelled", async () => {
    // Both subscriptions are created `incomplete`: nothing is written for either.
    await deliver(
      subscriptionEvent("customer.subscription.created", {
        id: "sub_stale",
        status: "incomplete",
      }),
    );
    await deliver(
      subscriptionEvent("customer.subscription.created", {
        id: "sub_live",
        status: "incomplete",
      }),
    );
    expect(row().tier).toBe("free");

    // The live tab pays.
    await deliver(
      subscriptionEvent("customer.subscription.updated", {
        id: "sub_live",
        created: T0 + 5,
      }),
    );
    expect(row()).toMatchObject({
      tier: "pro",
      stripe_subscription_id: "sub_live",
    });

    // The abandoned tab expires a day later: the host stays on the plan they pay for.
    await deliver(
      subscriptionEvent("customer.subscription.updated", {
        id: "sub_stale",
        status: "incomplete_expired",
        created: T0 + 86_400,
      }),
    );
    expect(row()).toMatchObject({
      tier: "pro",
      storage_cap_bytes: PRO_500,
      stripe_subscription_id: "sub_live",
      stripe_event_created_at: at(T0 + 5),
    });

    // Cancelling the live one is what ends the plan.
    await deliver(
      subscriptionEvent("customer.subscription.deleted", {
        id: "sub_live",
        status: "canceled",
        created: T0 + 90_000,
      }),
    );
    expect(row()).toMatchObject({
      tier: "free",
      stripe_subscription_id: null,
    });
  });

  it("the other order: the stale tab's expiry lands while the profile holds none, and the live grant after it still wins", async () => {
    // Holding none, a downgrade applies (the brief's "or the profile holds none"): it re-derives
    // a Free profile as Free, and runs the pass recompute.
    await deliver(
      subscriptionEvent("customer.subscription.updated", {
        id: "sub_stale",
        status: "incomplete_expired",
        created: T0 + 10,
      }),
    );
    expect(row()).toMatchObject({
      tier: "free",
      stripe_subscription_id: null,
    });
    expect(recomputePassEntitlement).toHaveBeenCalledTimes(1);

    await deliver(
      subscriptionEvent("customer.subscription.updated", {
        id: "sub_live",
        created: T0 + 20,
      }),
    );
    expect(row()).toMatchObject({
      tier: "pro",
      stripe_subscription_id: "sub_live",
    });
  });

  it("recency still decides first: an out-of-order downgrade of the live subscription is a 200 that writes nothing", async () => {
    seed(proOn("sub_live"));
    const before = { ...row() };

    const response = await deliver(
      subscriptionEvent("customer.subscription.updated", {
        id: "sub_live",
        status: "canceled",
        created: T0 - 60,
      }),
    );

    expect(response.status).toBe(200);
    expect(row()).toEqual(before);
    expect(recomputePassEntitlement).not.toHaveBeenCalled();
  });

  it("★ a stale Event Pass checkout paid after going Pro never clears the live subscription's pointer", async () => {
    seed(proOn("sub_live"));

    const response = await deliver(passCheckoutEvent(T0 + 30));
    expect(response.status).toBe(200);
    expect(row()).toMatchObject({
      tier: "pro",
      stripe_subscription_id: "sub_live",
    });

    // So the other tab's expiry still finds the profile following another subscription.
    await deliver(
      subscriptionEvent("customer.subscription.updated", {
        id: "sub_stale",
        status: "incomplete_expired",
        created: T0 + 86_400,
      }),
    );
    expect(row()).toMatchObject({
      tier: "pro",
      stripe_subscription_id: "sub_live",
    });
  });

  it("the pass checkout still clears a stale pointer on a profile that is not Pro (the belt)", async () => {
    seed(profile({ stripe_subscription_id: "sub_dead", tier: "event_pass" }));

    await deliver(passCheckoutEvent(T0 + 30));

    expect(row()).toMatchObject({
      stripe_customer_id: "cus_1",
      stripe_subscription_id: null,
    });
    expect(recomputePassEntitlement).toHaveBeenCalledWith("host-1");
  });
});

describe("the quantity warning", () => {
  it("★ warns on an item billed more than once, and writes exactly what a quantity of one writes", async () => {
    await deliver(
      subscriptionEvent("customer.subscription.updated", { quantities: [2] }),
    );
    const multiple = { ...row() };

    seed(profile());
    await deliver(subscriptionEvent("customer.subscription.updated"));
    const single = { ...row() };

    expect(captureWarning).toHaveBeenCalledTimes(1);
    expect(captureWarning).toHaveBeenCalledWith(
      "billing",
      "stripe_subscription_quantity_above_1",
      expect.objectContaining({
        subscriptionId: "sub_1",
        customerId: "cus_1",
        quantity: 2,
      }),
    );
    expect(multiple).toEqual(single);
    expect(multiple.storage_cap_bytes).toBe(PRO_500);
  });

  it("stays quiet at a quantity of one", async () => {
    await deliver(subscriptionEvent("customer.subscription.created"));
    expect(captureWarning).not.toHaveBeenCalled();
  });
});
