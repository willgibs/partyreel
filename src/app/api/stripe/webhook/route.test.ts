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
 *  - ★ and when the one it follows ends while another still bills, the profile follows that one, read
 *    from Stripe once, instead of landing Free (crumbs-41); a grant that re-points a profile away from
 *    a subscription it still follows warns the operator, who settles the double billing;
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

// The customer's subscriptions as Stripe lists them (the one read a downgrade makes), and every list asked.
const stripe = vi.hoisted(() => ({
  subscriptions: [] as unknown[],
  listed: [] as unknown[],
  fails: false,
  /** Every customer-balance grant asked: the customer, the params and the request options (its idempotency key). */
  balances: [] as unknown[][],
  /** Each step the credit path took, in order: the balance grant, then the conversion. */
  steps: [] as string[],
}));

// The signature check is Stripe's; here the body IS the event.
vi.mock("@/lib/stripe/client", () => ({
  getStripe: () => ({
    webhooks: { constructEvent: (body: string) => JSON.parse(body) },
    subscriptions: {
      list: async (params: unknown) => {
        stripe.listed.push(params);
        if (stripe.fails) throw new Error("Stripe is unreachable");
        return { data: stripe.subscriptions, has_more: false };
      },
    },
    customers: {
      createBalanceTransaction: async (...args: unknown[]) => {
        stripe.balances.push(args);
        stripe.steps.push("balance");
        return { id: "cbtxn_1" };
      },
    },
  }),
}));

const PRICES: Record<string, Plan> = {
  price_pro_50: planById("pro_50"),
  price_pro_200: planById("pro_200"),
  price_pro_1tb: planById("pro_1tb"),
};
vi.mock("@/lib/stripe/plans", () => ({
  planForPriceId: (priceId: string): Plan | null => PRICES[priceId] ?? null,
}));

const recomputePassEntitlement = vi.fn(async (_profileId: string) => {});
// The credit's conversion (`consume_passes_for_pro_credit`, one SQL transaction): the route only calls it.
const consumeLivePassesForProCredit = vi.fn(async (_profileId: string) => {
  stripe.steps.push("consume");
  return 2;
});
vi.mock("@/lib/db/mutations/event-passes", () => ({
  consumeLivePassesForProCredit: (profileId: string) =>
    consumeLivePassesForProCredit(profileId),
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

const PRO_200 = planById("pro_200").storageBytes;
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
    storage_cap_bytes: PRO_200,
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
            price: { id: "price_pro_200" },
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

/** A Pro subscription checkout carrying a prorated pass credit, completed. */
function creditedProCheckoutEvent(created: number): Stripe.Event {
  return {
    id: "evt_credit",
    type: "checkout.session.completed",
    created,
    data: {
      object: {
        id: "cs_pro_credit_1",
        client_reference_id: "host-1",
        customer: "cus_1",
        created,
        mode: "subscription",
        metadata: { plan_id: "pro_200", pass_credit_cents: "1850" },
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
  consumeLivePassesForProCredit.mockClear();
  stripe.subscriptions = [];
  stripe.listed = [];
  stripe.fails = false;
  stripe.balances = [];
  stripe.steps = [];
});

/** A subscription as Stripe lists it: its status, its one item's price, and when it began. */
function listed(
  id: string,
  opts: { status?: string; price?: string; created?: number } = {},
) {
  return {
    id,
    customer: "cus_1",
    status: opts.status ?? "active",
    created: opts.created ?? T0,
    items: {
      data: [{ price: { id: opts.price ?? "price_pro_200" }, quantity: 1 }],
    },
  };
}

describe("the subscription branch", () => {
  it("grants the plan on an active subscription", async () => {
    const response = await deliver(
      subscriptionEvent("customer.subscription.updated"),
    );
    expect(response.status).toBe(200);
    expect(profilePatches()).toHaveLength(1);
    expect(row()).toMatchObject({
      tier: "pro",
      storage_cap_bytes: PRO_200,
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
      storage_cap_bytes: PRO_200,
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

/**
 * ★ WHEN THE ONE IT FOLLOWS ENDS, ANOTHER MAY STILL BILL (crumbs-41, from `hardening`). A host who paid in both tabs
 * holds two live subscriptions and the profile follows the last grant's; cancelling that one put her on Free while
 * the other billed. Now a downgrade that would apply reads the customer's subscriptions from Stripe, once, and the
 * profile follows the live one that stores the most. A grant that re-points a profile away from one it still follows
 * warns the operator, who settles the double billing in Stripe.
 */
describe("the followed subscription ends while another still bills", () => {
  it("★ the profile follows the live one, never Free, and asks Stripe exactly once", async () => {
    seed(proOn("sub_a"));
    stripe.subscriptions = [
      listed("sub_a", { status: "canceled" }),
      listed("sub_b", { price: "price_pro_1tb" }),
    ];

    const response = await deliver(
      subscriptionEvent("customer.subscription.deleted", {
        id: "sub_a",
        status: "canceled",
        created: T0 + 60,
      }),
    );

    expect(response.status).toBe(200);
    expect(stripe.listed).toEqual([{ customer: "cus_1", limit: 100 }]);
    expect(row()).toMatchObject({
      tier: "pro",
      storage_cap_bytes: planById("pro_1tb").storageBytes,
      stripe_subscription_id: "sub_b",
      stripe_event_created_at: at(T0 + 60),
    });
    // Nothing to re-derive from the ledger: she is still Pro.
    expect(recomputePassEntitlement).not.toHaveBeenCalled();
    expect(captureWarning).not.toHaveBeenCalled();
  });

  it("★ with nothing else live (an expired tab, a cancelled one, an unknown price), Free, as before", async () => {
    seed(proOn("sub_a"));
    stripe.subscriptions = [
      listed("sub_old", { status: "incomplete_expired" }),
      listed("sub_paused", { status: "paused" }),
      listed("sub_legacy", { price: "price_not_ours" }),
    ];

    await deliver(
      subscriptionEvent("customer.subscription.deleted", {
        id: "sub_a",
        status: "canceled",
        created: T0 + 60,
      }),
    );

    expect(row()).toMatchObject({
      tier: "free",
      storage_cap_bytes: null,
      stripe_subscription_id: null,
    });
    expect(recomputePassEntitlement).toHaveBeenCalledWith("host-1");
  });

  it("★ follows the one that stores the most, the newest on a tie, and warns that the rest still bill", async () => {
    seed(proOn("sub_a"));
    stripe.subscriptions = [
      listed("sub_small", { price: "price_pro_50", created: T0 + 9 }),
      listed("sub_big_old", { price: "price_pro_1tb", created: T0 + 1 }),
      listed("sub_big_new", { price: "price_pro_1tb", created: T0 + 5 }),
      listed("sub_due", { status: "past_due", price: "price_pro_200" }),
    ];

    await deliver(
      subscriptionEvent("customer.subscription.updated", {
        id: "sub_a",
        status: "unpaid",
        created: T0 + 60,
      }),
    );

    expect(row()).toMatchObject({
      tier: "pro",
      storage_cap_bytes: planById("pro_1tb").storageBytes,
      stripe_subscription_id: "sub_big_new",
    });
    expect(captureWarning).toHaveBeenCalledWith(
      "billing",
      "stripe_customer_live_subscriptions_above_1",
      expect.objectContaining({
        customerId: "cus_1",
        following: "sub_big_new",
        alsoBilling: ["sub_big_old", "sub_due", "sub_small"],
      }),
    );
  });

  it("★ a downgrade of a subscription the profile does not follow asks Stripe nothing and writes nothing", async () => {
    seed(proOn("sub_live"));
    const before = { ...row() };

    await deliver(
      subscriptionEvent("customer.subscription.deleted", {
        id: "sub_stale",
        status: "canceled",
        created: T0 + 60,
      }),
    );

    expect(stripe.listed).toEqual([]);
    expect(row()).toEqual(before);
  });

  it("★ a Stripe read that fails is a 500, so Stripe retries: never a Free guess about a paying host", async () => {
    seed(proOn("sub_a"));
    const before = { ...row() };
    stripe.fails = true;

    const response = await deliver(
      subscriptionEvent("customer.subscription.deleted", {
        id: "sub_a",
        status: "canceled",
        created: T0 + 60,
      }),
    );

    expect(response.status).toBe(500);
    expect(captureError).toHaveBeenCalledTimes(1);
    expect(row()).toEqual(before);
    expect(recomputePassEntitlement).not.toHaveBeenCalled();
  });

  it("the stale tab's expiry on a profile following none already finds the live one", async () => {
    // Holding none, the downgrade would apply: the live subscription's grant has not arrived, but Stripe lists it.
    stripe.subscriptions = [listed("sub_live")];

    await deliver(
      subscriptionEvent("customer.subscription.updated", {
        id: "sub_stale",
        status: "incomplete_expired",
        created: T0 + 10,
      }),
    );

    expect(row()).toMatchObject({
      tier: "pro",
      stripe_subscription_id: "sub_live",
    });
    // Its own grant, when it lands, writes the same.
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
    expect(captureWarning).not.toHaveBeenCalled();
  });

  it("a replay of the ended one's downgrade, once the profile follows its successor, is declined and asks nothing", async () => {
    seed(proOn("sub_a"));
    stripe.subscriptions = [listed("sub_b")];
    const ended = subscriptionEvent("customer.subscription.deleted", {
      id: "sub_a",
      status: "canceled",
      created: T0 + 60,
    });
    await deliver(ended);
    stripe.listed = [];
    const after = { ...row() };

    const response = await deliver(ended);

    expect(response.status).toBe(200);
    expect(stripe.listed).toEqual([]);
    expect(row()).toEqual(after);
  });
});

describe("a grant that re-points a profile", () => {
  it("★ away from a subscription it still follows warns the operator: both tabs now bill", async () => {
    seed(proOn("sub_a"));

    await deliver(
      subscriptionEvent("customer.subscription.updated", {
        id: "sub_b",
        created: T0 + 30,
      }),
    );

    expect(row()).toMatchObject({
      tier: "pro",
      stripe_subscription_id: "sub_b",
    });
    expect(captureWarning).toHaveBeenCalledWith(
      "billing",
      "stripe_grant_repointed_subscription",
      expect.objectContaining({
        customerId: "cus_1",
        from: "sub_a",
        to: "sub_b",
      }),
    );
  });

  it("warns nothing for a grant of the one it follows, of one while it follows none, or one the guard declined", async () => {
    seed(proOn("sub_a"));
    await deliver(
      subscriptionEvent("customer.subscription.updated", {
        id: "sub_a",
        created: T0 + 30,
      }),
    );
    seed(profile());
    await deliver(subscriptionEvent("customer.subscription.created"));
    // An out-of-order grant of another subscription: declined by recency, so nothing re-pointed.
    seed(proOn("sub_a"));
    await deliver(
      subscriptionEvent("customer.subscription.updated", {
        id: "sub_b",
        created: T0 - 60,
      }),
    );
    expect(row().stripe_subscription_id).toBe("sub_a");
    expect(captureWarning).not.toHaveBeenCalled();
  });
});

/**
 * ★ THE PASS-TO-PRO CREDIT (billing-locks): the route grants the balance, keyed so a retry never grants twice, then
 * makes ONE call that converts her passes and clears her chain fields in one SQL transaction taking her profiles row
 * first (`consume_passes_for_pro_credit`). It wrote the passes, then patched the profile itself, two requests in the
 * reverse of an upload's lock order, with a host left between them.
 */
describe("the pass-to-Pro credit", () => {
  function passHolder(): FakeRow {
    return profile({
      tier: "event_pass",
      storage_cap_bytes: 50 * 1024 ** 3,
      event_slots: 2,
      tier_expires_at: at(T0 + 300 * 86_400),
    });
  }

  it("★ grants the balance once (its idempotency key), then converts in ONE call, and never patches the chain itself", async () => {
    seed(passHolder());
    const response = await deliver(creditedProCheckoutEvent(T0 + 10));
    expect(response.status).toBe(200);
    expect(stripe.balances).toEqual([
      [
        "cus_1",
        {
          amount: -1850,
          currency: "usd",
          description: "Event Pass credit (prorated)",
        },
        { idempotencyKey: "pass-credit-cs_pro_credit_1" },
      ],
    ]);
    expect(consumeLivePassesForProCredit).toHaveBeenCalledTimes(1);
    expect(consumeLivePassesForProCredit).toHaveBeenCalledWith("host-1");
    // The balance first, so a failed conversion retries behind a grant that cannot repeat.
    expect(stripe.steps).toEqual(["balance", "consume"]);
    // ★ The chain fields are the conversion's to clear, inside its transaction: the route writes neither, and touches
    // no pass row. (It patched tier_expires_at and event_slots itself, a request after the passes'.)
    // The one profile write left here is the customer binding, guarded on a customer not yet bound.
    const patches = profilePatches();
    expect(patches).toHaveLength(1);
    expect(patches[0]!.filters).toContainEqual({
      column: "stripe_customer_id",
      op: "is",
      value: null,
    });
    expect(
      (db.fake?.requests ?? []).filter((r) => r.name === "event_passes"),
    ).toEqual([]);
    expect(row()).toMatchObject({
      tier: "event_pass",
      event_slots: 2,
      tier_expires_at: at(T0 + 300 * 86_400),
    });
  });

  it("★ a conversion that fails is a 500, so Stripe retries the delivery (never a silent 200)", async () => {
    seed(passHolder());
    consumeLivePassesForProCredit.mockRejectedValueOnce(
      new Error(
        "consume_passes_for_pro_credit: canceling statement due to lock timeout",
      ),
    );
    const response = await deliver(creditedProCheckoutEvent(T0 + 10));
    expect(response.status).toBe(500);
    expect(captureError).toHaveBeenCalledTimes(1);
    expect(stripe.balances).toHaveLength(1);
  });

  it("a replay converts nothing more and still answers 200", async () => {
    seed(passHolder());
    consumeLivePassesForProCredit.mockResolvedValueOnce(0);
    const response = await deliver(creditedProCheckoutEvent(T0 + 10));
    expect(response.status).toBe(200);
    expect(captureError).not.toHaveBeenCalled();
  });

  it("a Pro checkout with no credit converts nothing", async () => {
    seed(passHolder());
    const event = creditedProCheckoutEvent(T0 + 10);
    (event.data.object as { metadata: Record<string, string> }).metadata = {
      plan_id: "pro_200",
    };
    const response = await deliver(event);
    expect(response.status).toBe(200);
    expect(stripe.balances).toEqual([]);
    expect(consumeLivePassesForProCredit).not.toHaveBeenCalled();
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
    expect(multiple.storage_cap_bytes).toBe(PRO_200);
  });

  it("stays quiet at a quantity of one", async () => {
    await deliver(subscriptionEvent("customer.subscription.created"));
    expect(captureWarning).not.toHaveBeenCalled();
  });
});
