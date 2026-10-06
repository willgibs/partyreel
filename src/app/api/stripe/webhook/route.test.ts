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
 *    written exactly as a quantity of one would write it;
 *  - ★ the pass-to-Pro credit replayed as Stripe replays it (a retry inside and past the idempotency key's day, a grant
 *    whose record was lost, a second delivery while the first holds the claim, a replay after a later pass, two
 *    Checkout tabs crediting one pass), against a model of the claim's SQL and of Stripe's own key window;
 *  - ★ and the two tabs when the first one's holder dies (credit-watch): the second meets its lease as busy, never a
 *    refusal for good, and grants once that lease lapses; the first's claim, overtaken, is settled at its next delivery
 *    (looked for on Stripe's side, then released, its lost grant on record beside it when there was one); a credited
 *    delivery's failure is the `pass_credit` signal's.
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

// The customer's subscriptions as Stripe lists them (the one read a downgrade makes), and every list asked. And the
// credit's side of Stripe AS STRIPE BEHAVES: a customer-balance grant under an idempotency key answers the first grant's
// transaction for 24 hours (the key's window) and makes a NEW one after it; a key reused inside the window with other
// parameters is refused; the customer's transactions list newest first with their metadata, from `created.gte` on.
const stripe = vi.hoisted(() => ({
  subscriptions: [] as unknown[],
  listed: [] as unknown[],
  fails: false,
  /** The clock (ms) the key window and the claim model's lease read; a test moves it. */
  now: 1_790_000_000_000,
  keys: new Map<string, { at: number; params: string; id: string }>(),
  transactions: [] as {
    id: string;
    customer: string;
    amount: number;
    created: number;
    metadata: Record<string, string>;
  }[],
  /** Every customer-balance grant asked: the customer, the params and the request options (its idempotency key). */
  balances: [] as unknown[][],
  /** Each step the credit path took, in order. */
  steps: [] as string[],
  /** The customer's balance transactions cannot be listed (an outage on Stripe's side). */
  listFails: false,
  /** Every grant put on record: the session and its transaction. */
  recorded: [] as [string, string][],
  /** Checkout sessions as Stripe retrieves them (an orphan's customer and time); any other is cus_1's at T0 + 11. */
  checkouts: {} as Record<string, { customer: string; created: number }>,
}));

const DAY_MS = 86_400_000;

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
    checkout: {
      sessions: {
        retrieve: async (id: string) => {
          stripe.steps.push("session");
          const held = stripe.checkouts[id];
          return {
            id,
            customer: held?.customer ?? "cus_1",
            created: held?.created ?? 1_790_000_011,
          };
        },
      },
    },
    customers: {
      createBalanceTransaction: async (
        customer: string,
        params: { amount: number; metadata?: Record<string, string> },
        options?: { idempotencyKey?: string },
      ) => {
        stripe.balances.push([customer, params, options]);
        stripe.steps.push("balance");
        const key = options?.idempotencyKey;
        const asked = JSON.stringify(params);
        const held = key ? stripe.keys.get(key) : undefined;
        if (held && stripe.now - held.at < DAY_MS) {
          if (held.params !== asked) {
            throw new Error(
              "Keys for idempotent requests can only be used with the same parameters they were first used with.",
            );
          }
          return { id: held.id };
        }
        const id = `cbtxn_${stripe.transactions.length + 1}`;
        stripe.transactions.unshift({
          id,
          customer,
          amount: params.amount,
          created: Math.floor(stripe.now / 1000),
          metadata: params.metadata ?? {},
        });
        if (key) stripe.keys.set(key, { at: stripe.now, params: asked, id });
        return { id };
      },
      listBalanceTransactions: (
        customer: string,
        params?: { created?: { gte?: number } },
      ) => {
        stripe.steps.push("list");
        if (stripe.listFails) throw new Error("Stripe is unreachable");
        const rows = stripe.transactions.filter(
          (t) =>
            t.customer === customer && t.created >= (params?.created?.gte ?? 0),
        );
        return (async function* () {
          yield* rows;
        })();
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

/**
 * THE CREDIT'S SQL, MODELLED (claim_pass_credit, record_pass_credit_grant, convert_pass_credit, 20261005181000;
 * release_pass_credit and the claim's lease rule, 20261005201000; each file's rolled-back check proves the real ones):
 * the route only calls them, in order, and this model is what lets a test replay deliveries across days. A claim is
 * keyed by the session and names its passes; a lease of 10 minutes while a delivery grants; a grant on record answers
 * granted forever; a pass is credited once ever, refused only by what is settled (a converted pass, another checkout's
 * unreleased grant), while another checkout's live lease is busy; a claim names the orphans it is taken past (other
 * checkouts' lapsed, ungranted, unreleased claims on its passes); a released claim is settled for good.
 */
const ledger = vi.hoisted(() => ({
  passes: new Map<string, { host: string; consumed: boolean }>(),
  claims: new Map<
    string,
    {
      host: string;
      credit: number;
      ids: string[];
      leaseUntil: number | null;
      txn: string | null;
      converted: number;
      released: boolean;
      /** When the claim was taken, unix seconds (an orphan's `claimed_at`). */
      createdAt: number;
    }
  >(),
  /** How many of the next calls of each step fail (a connection reset, a lock timeout). */
  failNext: { record: 0, convert: 0 },
  /** Sessions whose release fails (a lock timeout), each once. */
  releaseFails: new Set<string>(),
  /** The lease's end the next claim answers (ISO), when a case shortens it; otherwise ten minutes of real time. */
  claimedUntil: null as string | null,
}));
const LEASE_MS = 10 * 60_000;

vi.mock("@/lib/db/mutations/event-passes", () => ({
  insertPassPurchase: vi.fn(async () => {}),
  recomputePassEntitlement: (profileId: string) =>
    recomputePassEntitlement(profileId),
  claimPassCredit: async (input: {
    sessionId: string;
    hostId: string;
    creditCents: number;
    passIds: string[];
  }) => {
    stripe.steps.push("claim");
    if (!db.fake?.tables.profiles.some((p) => p.id === input.hostId)) {
      return { state: "no_host" };
    }
    const ids = [...new Set(input.passIds)].sort();
    const claim = ledger.claims.get(input.sessionId);
    if (claim) {
      if (
        claim.host !== input.hostId ||
        claim.credit !== input.creditCents ||
        claim.ids.join() !== ids.join()
      ) {
        throw new Error(
          "claim_pass_credit: This checkout's credit disagrees with its claim.",
        );
      }
      if (claim.released) return { state: "overlap", unsettled: false };
      if (claim.txn)
        return { state: "granted", balanceTransactionId: claim.txn };
      if (claim.leaseUntil !== null && claim.leaseUntil > stripe.now) {
        return {
          state: "busy",
          heldBy: "this_checkout",
          retryAfterSec: Math.ceil((claim.leaseUntil - stripe.now) / 1000),
        };
      }
    }
    const others = [...ledger.claims].filter(
      ([session, other]) =>
        session !== input.sessionId &&
        other.host === input.hostId &&
        other.ids.some((id) => ids.includes(id)),
    );
    const settled =
      ids.some((id) => ledger.passes.get(id)?.consumed) ||
      others.some(([, other]) => other.txn !== null && !other.released);
    if (settled) return { state: "overlap", unsettled: claim !== undefined };
    const leases = others
      .map(([, other]) => other.leaseUntil)
      .filter((until): until is number => until !== null && until > stripe.now);
    if (leases.length > 0) {
      return {
        state: "busy",
        heldBy: "another_checkout",
        retryAfterSec: Math.ceil((Math.max(...leases) - stripe.now) / 1000),
      };
    }
    const orphans = others
      .filter(
        ([, other]) =>
          other.txn === null &&
          !other.released &&
          (other.leaseUntil === null || other.leaseUntil <= stripe.now),
      )
      .sort(([, a], [, b]) => a.createdAt - b.createdAt)
      .map(([session, other]) => ({ session, claimedAt: other.createdAt }));
    // The lease's end on the route's own clock (it compares with Date.now()): ten minutes, unless a case shortens it.
    const claimedUntil =
      ledger.claimedUntil ?? new Date(Date.now() + LEASE_MS).toISOString();
    if (claim) {
      claim.leaseUntil = stripe.now + LEASE_MS;
      return { state: "claimed", resumed: true, orphans, claimedUntil };
    }
    ledger.claims.set(input.sessionId, {
      host: input.hostId,
      credit: input.creditCents,
      ids,
      leaseUntil: stripe.now + LEASE_MS,
      txn: null,
      converted: 0,
      released: false,
      createdAt: Math.floor(stripe.now / 1000),
    });
    return { state: "claimed", resumed: false, orphans, claimedUntil };
  },
  recordPassCreditGrant: async (
    sessionId: string,
    _hostId: string,
    txn: string,
  ) => {
    stripe.steps.push("record");
    if (ledger.failNext.record > 0) {
      ledger.failNext.record -= 1;
      throw new Error("record_pass_credit_grant: connection reset");
    }
    const claim = ledger.claims.get(sessionId);
    if (!claim) throw new Error("record_pass_credit_grant: no claim");
    if (claim.txn) return claim.txn;
    stripe.recorded.push([sessionId, txn]);
    claim.txn = txn;
    claim.leaseUntil = null;
    return txn;
  },
  convertPassCredit: async (sessionId: string) => {
    stripe.steps.push("convert");
    if (ledger.failNext.convert > 0) {
      ledger.failNext.convert -= 1;
      throw new Error(
        "convert_pass_credit: canceling statement due to lock timeout",
      );
    }
    const claim = ledger.claims.get(sessionId);
    if (!claim?.txn) throw new Error("convert_pass_credit: not granted yet");
    // pass_credits_released_unconverted: a released claim's conversion is a check violation, never a conversion.
    if (claim.released) {
      throw new Error(
        "convert_pass_credit: violates pass_credits_released_unconverted",
      );
    }
    let converted = 0;
    for (const id of claim.ids) {
      const pass = ledger.passes.get(id);
      if (pass && !pass.consumed) {
        pass.consumed = true;
        converted += 1;
      }
    }
    claim.converted += converted;
    return converted;
  },
  releasePassCredit: async (
    sessionId: string,
    _hostId: string,
    txn: string | null,
  ) => {
    stripe.steps.push("release");
    if (ledger.releaseFails.delete(sessionId)) {
      throw new Error(
        "release_pass_credit: canceling statement due to lock timeout",
      );
    }
    const claim = ledger.claims.get(sessionId);
    if (!claim) throw new Error("release_pass_credit: no claim");
    if (claim.released) return claim.txn ? "released_granted" : "released";
    if (claim.txn) throw new Error("release_pass_credit: granted: it converts");
    const overtaken =
      claim.ids.some((id) => ledger.passes.get(id)?.consumed) ||
      [...ledger.claims].some(
        ([session, other]) =>
          session !== sessionId &&
          other.host === claim.host &&
          other.txn !== null &&
          !other.released &&
          other.ids.some((id) => claim.ids.includes(id)),
      );
    if (!overtaken) throw new Error("release_pass_credit: it is still owed");
    claim.released = true;
    claim.leaseUntil = null;
    claim.txn = txn;
    return txn ? "released_granted" : "released";
  },
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
// A credited checkout's failing delivery is the `pass_credit` signal's (Sentry inside it, and a job_runs row).
const recordSignalFailure = vi.fn(async (_failure: unknown) => {});
vi.mock("@/lib/jobs/failure-log", () => ({
  recordSignalFailure: (failure: unknown) => recordSignalFailure(failure),
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

/** Two of her passes (live ones), and a third bought after going Pro: real ids, as a checkout names them. */
const PASS_A = "00000000-0000-4000-8000-00000000000a";
const PASS_B = "00000000-0000-4000-8000-00000000000b";
const PASS_LATER = "00000000-0000-4000-8000-00000000000c";

/** A Pro subscription checkout carrying a prorated pass credit over `passIds`, completed. */
function creditedProCheckoutEvent(
  created: number,
  opts: {
    sessionId?: string;
    passIds?: string[];
    metadata?: Record<string, string>;
  } = {},
): Stripe.Event {
  const passIds = opts.passIds ?? [PASS_A, PASS_B];
  return {
    id: "evt_credit",
    type: "checkout.session.completed",
    created,
    data: {
      object: {
        id: opts.sessionId ?? "cs_pro_credit_1",
        client_reference_id: "host-1",
        customer: "cus_1",
        created,
        mode: "subscription",
        metadata: opts.metadata ?? {
          plan_id: "pro_200",
          pass_credit_cents: "1850",
          credited_pass_count: String(passIds.length),
          credited_pass_ids: passIds.join(","),
        },
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
  recordSignalFailure.mockClear();
  recomputePassEntitlement.mockClear();
  stripe.subscriptions = [];
  stripe.listed = [];
  stripe.fails = false;
  // A minute after the checkouts below were made: no grant for a session predates it.
  stripe.now = (T0 + 60) * 1000;
  stripe.keys = new Map();
  stripe.transactions = [];
  stripe.balances = [];
  stripe.steps = [];
  stripe.listFails = false;
  stripe.recorded = [];
  stripe.checkouts = {};
  ledger.passes = new Map();
  ledger.claims = new Map();
  ledger.failNext = { record: 0, convert: 0 };
  ledger.releaseFails = new Set();
  ledger.claimedUntil = null;
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
 * ★ THE PASS-TO-PRO CREDIT, GRANTED ONCE EVER, CONVERTING ONLY WHAT IT CREDITED (billing-integrity). The route takes a
 * claim of our own keyed by the session before it grants, so a retry reads what already happened: the grant used to rest
 * on Stripe's idempotency key alone, which holds a day while a failing delivery retries for three. The grant carries the
 * session in its metadata, so a claim whose record was lost finds it on Stripe's side. And the conversion takes exactly
 * the passes the session names, where it took every unconsumed pass, a pass bought after going Pro included.
 * (Reshaped from billing-locks' "grants the balance once (its idempotency key), then converts in ONE call": its scar,
 * the balance before the conversion and the chain the SQL's to clear, stays; "once" now outlives the key's day.)
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
  function seedPasses(...ids: string[]) {
    for (const id of ids)
      ledger.passes.set(id, { host: "host-1", consumed: false });
  }
  const consumed = (id: string) => ledger.passes.get(id)?.consumed;

  it("★ claims, grants once with the session in its metadata, records it, then converts exactly the passes named", async () => {
    seed(passHolder());
    seedPasses(PASS_A, PASS_B, PASS_LATER);
    const response = await deliver(
      creditedProCheckoutEvent(T0 + 10, { passIds: [PASS_A, PASS_B] }),
    );
    expect(response.status).toBe(200);
    expect(stripe.balances).toEqual([
      [
        "cus_1",
        {
          amount: -1850,
          currency: "usd",
          description: "Event Pass credit (prorated)",
          metadata: { pass_credit_session: "cs_pro_credit_1" },
        },
        { idempotencyKey: "pass-credit-cs_pro_credit_1" },
      ],
    ]);
    // The claim before the grant, the grant before the conversion: a failure anywhere resumes behind what is recorded.
    expect(stripe.steps).toEqual(["claim", "balance", "record", "convert"]);
    expect([consumed(PASS_A), consumed(PASS_B), consumed(PASS_LATER)]).toEqual([
      true,
      true,
      false,
    ]);
    // ★ The chain fields are the conversion's to clear, inside its transaction: the route writes neither. The one profile
    // write left here is the customer binding, guarded on a customer not yet bound.
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
  });

  it("★ a conversion failing past the key's day never grants again: the claim remembers the grant", async () => {
    seed(passHolder());
    seedPasses(PASS_A, PASS_B);
    ledger.failNext.convert = 1;
    const first = await deliver(creditedProCheckoutEvent(T0 + 10));
    expect(first.status).toBe(500);
    // Captured once, as the credit's signal's failure (credit-watch: Sentry rides inside it, so never twice).
    expect(recordSignalFailure).toHaveBeenCalledTimes(1);
    expect(captureError).not.toHaveBeenCalled();

    // Inside the key's day, and then two days on (Stripe retries a failing delivery for three).
    stripe.now += 2 * 3600_000;
    expect((await deliver(creditedProCheckoutEvent(T0 + 10))).status).toBe(200);
    stripe.now += 2 * DAY_MS;
    expect((await deliver(creditedProCheckoutEvent(T0 + 10))).status).toBe(200);

    expect(stripe.balances).toHaveLength(1);
    expect(stripe.transactions).toHaveLength(1);
    expect([consumed(PASS_A), consumed(PASS_B)]).toEqual([true, true]);
  });

  it("★ a grant whose record was lost is found on Stripe's side by its session, never granted again", async () => {
    seed(passHolder());
    seedPasses(PASS_A, PASS_B);
    // Stripe granted; the record of it never landed (the delivery died between the two).
    ledger.failNext.record = 1;
    expect((await deliver(creditedProCheckoutEvent(T0 + 10))).status).toBe(500);
    expect(stripe.transactions).toHaveLength(1);

    // A day and a half on: the claim's lease has lapsed with no grant on record, and the key's day is over.
    stripe.now += 1.5 * DAY_MS;
    expect((await deliver(creditedProCheckoutEvent(T0 + 10))).status).toBe(200);
    expect(stripe.transactions).toHaveLength(1);
    expect(stripe.balances).toHaveLength(1);
    expect(stripe.steps.slice(-4)).toEqual([
      "claim",
      "list",
      "record",
      "convert",
    ]);
    expect(ledger.claims.get("cs_pro_credit_1")?.txn).toBe("cbtxn_1");
  });

  it("★ a second delivery while the first holds the claim is busy (non-2xx, so Stripe retries) and grants nothing", async () => {
    seed(passHolder());
    seedPasses(PASS_A, PASS_B);
    // The other TEST endpoint's delivery of the same event, mid-grant.
    ledger.claims.set("cs_pro_credit_1", {
      host: "host-1",
      credit: 1850,
      ids: [PASS_A, PASS_B].sort(),
      leaseUntil: stripe.now + 60_000,
      txn: null,
      converted: 0,
      released: false,
      createdAt: T0 + 10,
    });
    const response = await deliver(creditedProCheckoutEvent(T0 + 10));
    expect(response.status).toBe(409);
    expect(await response.text()).toBe(
      "Another delivery is honoring this checkout's pass credit; retry later.",
    );
    expect(stripe.balances).toEqual([]);
    expect(stripe.steps).toEqual(["claim"]);
    expect(captureError).not.toHaveBeenCalled();
    expect(recordSignalFailure).not.toHaveBeenCalled();
  });

  it("★ a replay after a later pass converts only what its checkout credited", async () => {
    seed(passHolder());
    seedPasses(PASS_A, PASS_B);
    expect((await deliver(creditedProCheckoutEvent(T0 + 10))).status).toBe(200);
    // A pass checkout opened before going Pro, paid a day after it.
    stripe.now += DAY_MS;
    seedPasses(PASS_LATER);
    expect((await deliver(creditedProCheckoutEvent(T0 + 10))).status).toBe(200);
    expect(consumed(PASS_LATER)).toBe(false);
    expect(stripe.balances).toHaveLength(1);
    expect(ledger.claims.get("cs_pro_credit_1")?.converted).toBe(2);
  });

  it("★ two Checkout tabs crediting the same passes credit them once: the second grants nothing, and the operator hears", async () => {
    seed(passHolder());
    seedPasses(PASS_A, PASS_B);
    expect((await deliver(creditedProCheckoutEvent(T0 + 10))).status).toBe(200);
    const second = await deliver(
      creditedProCheckoutEvent(T0 + 20, { sessionId: "cs_pro_credit_2" }),
    );
    expect(second.status).toBe(200);
    expect(stripe.balances).toHaveLength(1);
    expect(ledger.claims.has("cs_pro_credit_2")).toBe(false);
    expect(captureWarning).toHaveBeenCalledWith(
      "billing",
      "stripe_pass_credit_overlap",
      expect.objectContaining({ sessionId: "cs_pro_credit_2", passes: 2 }),
    );
  });

  it("★ a credit that names no pass is a 500 that grants nothing: never a guess at which passes it meant", async () => {
    seed(passHolder());
    seedPasses(PASS_A, PASS_B);
    const response = await deliver(
      creditedProCheckoutEvent(T0 + 10, {
        metadata: { plan_id: "pro_200", pass_credit_cents: "1850" },
      }),
    );
    expect(response.status).toBe(500);
    expect(recordSignalFailure).toHaveBeenCalledTimes(1);
    expect(captureError).not.toHaveBeenCalled();
    expect(stripe.balances).toEqual([]);
    expect([consumed(PASS_A), consumed(PASS_B)]).toEqual([false, false]);
  });

  it("an older checkout's one key of ids (no count) is held to the ids it wrote", async () => {
    seed(passHolder());
    seedPasses(PASS_A, PASS_B);
    const response = await deliver(
      creditedProCheckoutEvent(T0 + 10, {
        metadata: {
          plan_id: "pro_200",
          pass_credit_cents: "1850",
          credited_pass_ids: PASS_A,
        },
      }),
    );
    expect(response.status).toBe(200);
    expect([consumed(PASS_A), consumed(PASS_B)]).toEqual([true, false]);
  });

  it("a host with no profile has nothing credited, and the delivery is done", async () => {
    seed(profile({ id: "someone-else" }));
    seedPasses(PASS_A, PASS_B);
    const response = await deliver(creditedProCheckoutEvent(T0 + 10));
    expect(response.status).toBe(200);
    expect(stripe.balances).toEqual([]);
    expect(stripe.steps).toEqual(["claim"]);
  });

  it("a Pro checkout with no credit claims and converts nothing", async () => {
    seed(passHolder());
    const event = creditedProCheckoutEvent(T0 + 10);
    (event.data.object as { metadata: Record<string, string> }).metadata = {
      plan_id: "pro_200",
    };
    const response = await deliver(event);
    expect(response.status).toBe(200);
    expect(stripe.balances).toEqual([]);
    expect(stripe.steps).toEqual([]);
  });
});

describe("the pass-to-Pro credit when a holder dies (credit-watch)", () => {
  function passHolder(): FakeRow {
    return profile({
      tier: "event_pass",
      storage_cap_bytes: 50 * 1024 ** 3,
      event_slots: 2,
      tier_expires_at: at(T0 + 300 * 86_400),
    });
  }
  function seedPasses(...ids: string[]) {
    for (const id of ids)
      ledger.passes.set(id, { host: "host-1", consumed: false });
  }
  const consumed = (id: string) => ledger.passes.get(id)?.consumed;
  const TAB_1 = "cs_pro_credit_1";
  const TAB_2 = "cs_pro_credit_2";
  /** A claim another tab's delivery left: its lease until `leaseUntil` (ms), granted when `txn` names its grant. */
  function claimOf(
    session: string,
    over: {
      leaseUntil?: number | null;
      txn?: string | null;
      released?: boolean;
      createdAt?: number;
    } = {},
  ) {
    ledger.claims.set(session, {
      host: "host-1",
      credit: 1850,
      ids: [PASS_A, PASS_B].sort(),
      leaseUntil: over.leaseUntil ?? null,
      txn: over.txn ?? null,
      converted: 0,
      released: over.released ?? false,
      createdAt: over.createdAt ?? T0 + 11,
    });
  }

  it("★ a lease is never a refusal: the second tab meets the first tab's live lease as busy (a 409 Stripe retries), never overlap for good", async () => {
    seed(passHolder());
    seedPasses(PASS_A, PASS_B);
    // Tab 1's delivery took the claim a moment ago and is mid-grant (or died there).
    claimOf(TAB_1, { leaseUntil: stripe.now + 5 * 60_000 });
    const response = await deliver(
      creditedProCheckoutEvent(T0 + 20, { sessionId: TAB_2 }),
    );
    expect(response.status).toBe(409);
    expect(await response.text()).toBe(
      "Another checkout's pass credit holds these passes; retry later.",
    );
    // Not done, and nothing decided: no grant, no claim of tab 2's, no overlap told to the operator.
    expect(stripe.balances).toEqual([]);
    expect(ledger.claims.has(TAB_2)).toBe(false);
    expect(captureWarning).not.toHaveBeenCalledWith(
      "billing",
      "stripe_pass_credit_overlap",
      expect.anything(),
    );
    expect(recordSignalFailure).not.toHaveBeenCalled();
  });

  it("★ and once that holder has died and its lease lapsed (its retries run out), the second tab's retry claims and grants: one tab's credit lands", async () => {
    seed(passHolder());
    seedPasses(PASS_A, PASS_B);
    claimOf(TAB_1, { leaseUntil: stripe.now + 5 * 60_000 });
    expect(
      (await deliver(creditedProCheckoutEvent(T0 + 20, { sessionId: TAB_2 })))
        .status,
    ).toBe(409);
    // Stripe's next retry of tab 2 comes after tab 1's lease is over, with no grant on record.
    stripe.now += 15 * 60_000;
    const retry = await deliver(
      creditedProCheckoutEvent(T0 + 20, { sessionId: TAB_2 }),
    );
    expect(retry.status).toBe(200);
    expect(stripe.balances).toHaveLength(1);
    expect(stripe.balances[0]![2]).toEqual({
      idempotencyKey: `pass-credit-${TAB_2}`,
    });
    expect([consumed(PASS_A), consumed(PASS_B)]).toEqual([true, true]);
    expect(ledger.claims.get(TAB_2)?.txn).toBe("cbtxn_1");
  });

  it("the second tab's retry after the first tab granted is overlap: a 200 that grants nothing, and the operator hears", async () => {
    seed(passHolder());
    seedPasses(PASS_A, PASS_B);
    claimOf(TAB_1, { leaseUntil: stripe.now + 60_000 });
    expect(
      (await deliver(creditedProCheckoutEvent(T0 + 20, { sessionId: TAB_2 })))
        .status,
    ).toBe(409);
    // Tab 1's holder finished: its grant is on record, its passes converted.
    claimOf(TAB_1, { txn: "cbtxn_tab1" });
    ledger.passes.set(PASS_A, { host: "host-1", consumed: true });
    ledger.passes.set(PASS_B, { host: "host-1", consumed: true });
    stripe.now += 60 * 60_000;
    const retry = await deliver(
      creditedProCheckoutEvent(T0 + 20, { sessionId: TAB_2 }),
    );
    expect(retry.status).toBe(200);
    expect(stripe.balances).toEqual([]);
    // Tab 2 never claimed, so there is nothing of its own to settle: no look on Stripe's side.
    expect(stripe.steps.slice(-1)).toEqual(["claim"]);
    expect(captureWarning).toHaveBeenCalledWith(
      "billing",
      "stripe_pass_credit_overlap",
      expect.objectContaining({ sessionId: TAB_2 }),
    );
  });

  it("★ the first tab's claim, overtaken while its holder was dead, is settled at its next delivery: looked for on Stripe's side, found ungranted, released, never stuck", async () => {
    seed(passHolder());
    seedPasses(PASS_A, PASS_B);
    // Tab 1 claimed and died before Stripe; tab 2 then claimed, granted and converted.
    claimOf(TAB_1, { leaseUntil: stripe.now - 60_000 });
    claimOf(TAB_2, { txn: "cbtxn_tab2" });
    ledger.passes.set(PASS_A, { host: "host-1", consumed: true });
    ledger.passes.set(PASS_B, { host: "host-1", consumed: true });
    const response = await deliver(
      creditedProCheckoutEvent(T0 + 10, { sessionId: TAB_1 }),
    );
    expect(response.status).toBe(200);
    expect(stripe.steps).toEqual(["claim", "list", "release"]);
    expect(stripe.balances).toEqual([]);
    expect(ledger.claims.get(TAB_1)).toMatchObject({
      released: true,
      txn: null,
      leaseUntil: null,
    });
    expect(captureWarning).not.toHaveBeenCalledWith(
      "billing",
      "stripe_pass_credit_overlap_granted",
      expect.anything(),
    );
    // A replay of it now is a settled overlap: no second look, no release, nothing granted.
    stripe.steps = [];
    expect(
      (await deliver(creditedProCheckoutEvent(T0 + 10, { sessionId: TAB_1 })))
        .status,
    ).toBe(200);
    expect(stripe.steps).toEqual(["claim"]);
  });

  it("★ and when its dead holder had granted on Stripe's side (its record lost), that grant goes on record beside the release, and the operator hears of two grants for one set of passes", async () => {
    seed(passHolder());
    seedPasses(PASS_A, PASS_B);
    claimOf(TAB_1, { leaseUntil: stripe.now - 60_000 });
    // Tab 1's grant reached Stripe before its holder died (the session in its metadata), and was never recorded.
    stripe.transactions.unshift({
      id: "cbtxn_lost",
      customer: "cus_1",
      amount: -1850,
      created: T0 + 11,
      metadata: { pass_credit_session: TAB_1 },
    });
    claimOf(TAB_2, { txn: "cbtxn_tab2" });
    ledger.passes.set(PASS_A, { host: "host-1", consumed: true });
    ledger.passes.set(PASS_B, { host: "host-1", consumed: true });
    const response = await deliver(
      creditedProCheckoutEvent(T0 + 10, { sessionId: TAB_1 }),
    );
    expect(response.status).toBe(200);
    expect(stripe.balances).toEqual([]);
    expect(ledger.claims.get(TAB_1)).toMatchObject({
      released: true,
      txn: "cbtxn_lost",
    });
    expect(captureWarning).toHaveBeenCalledWith(
      "billing",
      "stripe_pass_credit_overlap_granted",
      expect.objectContaining({ sessionId: TAB_1, alsoGranted: "cbtxn_lost" }),
    );
    // Settled for good: its replay never converts (a released claim answers overlap before granted).
    expect(
      (await deliver(creditedProCheckoutEvent(T0 + 10, { sessionId: TAB_1 })))
        .status,
    ).toBe(200);
    expect(recordSignalFailure).not.toHaveBeenCalled();
  });

  it("★ the double grant the lease rule could open, closed: tab 1's holder granted on Stripe and died before its record; tab 2's retry, claiming past tab 1's lapsed lease, finds that grant first and grants nothing", async () => {
    seed(passHolder());
    seedPasses(PASS_A, PASS_B);
    // Tab 1 claimed at T0 + 11, Stripe granted it, and its record never landed (a transient failure, its lease now over).
    claimOf(TAB_1, { leaseUntil: stripe.now - 60_000, createdAt: T0 + 11 });
    stripe.transactions.unshift({
      id: "cbtxn_tab1_lost",
      customer: "cus_1",
      amount: -1850,
      created: T0 + 12,
      metadata: { pass_credit_session: TAB_1 },
    });
    const response = await deliver(
      creditedProCheckoutEvent(T0 + 20, { sessionId: TAB_2 }),
    );
    expect(response.status).toBe(200);
    // Nothing granted twice: no new balance for tab 2; tab 1's grant on record on tab 1's own claim, its passes converted.
    expect(stripe.balances).toEqual([]);
    expect(stripe.recorded).toEqual([[TAB_1, "cbtxn_tab1_lost"]]);
    expect(ledger.claims.get(TAB_1)).toMatchObject({
      txn: "cbtxn_tab1_lost",
      converted: 2,
      released: false,
    });
    expect([consumed(PASS_A), consumed(PASS_B)]).toEqual([true, true]);
    // Tab 2's own claim is released, never stuck.
    expect(ledger.claims.get(TAB_2)).toMatchObject({
      released: true,
      txn: null,
      leaseUntil: null,
    });
    // Tab 1's checkout read from Stripe (the customer it charged, its time), then one listing.
    expect(stripe.steps).toEqual([
      "claim",
      "session",
      "list",
      "record",
      "convert",
      "release",
    ]);
    expect(captureWarning).toHaveBeenCalledWith(
      "billing",
      "stripe_pass_credit_overlap",
      expect.objectContaining({ sessionId: TAB_2, creditedBy: [TAB_1] }),
    );
    // Tab 1's own retry now finds its grant on record and converts nothing more.
    stripe.steps = [];
    expect(
      (await deliver(creditedProCheckoutEvent(T0 + 10, { sessionId: TAB_1 })))
        .status,
    ).toBe(200);
    expect(stripe.steps).toEqual(["claim", "convert"]);
    expect(stripe.balances).toEqual([]);
  });

  it("★ with no lost grant anywhere, the second tab grants once and then settles the orphan it claimed past: released, never stuck", async () => {
    seed(passHolder());
    seedPasses(PASS_A, PASS_B);
    claimOf(TAB_1, { leaseUntil: stripe.now - 60_000 });
    const response = await deliver(
      creditedProCheckoutEvent(T0 + 20, { sessionId: TAB_2 }),
    );
    expect(response.status).toBe(200);
    expect(stripe.balances).toHaveLength(1);
    expect(stripe.steps).toEqual([
      "claim",
      "session",
      "list",
      "balance",
      "record",
      "convert",
      "release",
    ]);
    expect(ledger.claims.get(TAB_2)?.txn).toBe("cbtxn_1");
    expect(ledger.claims.get(TAB_1)).toMatchObject({
      released: true,
      txn: null,
    });
  });

  it("an orphan whose own lost grant turns up beside this checkout's grant is settled with it on record, said as granted twice", async () => {
    seed(passHolder());
    seedPasses(PASS_A, PASS_B);
    // Tab 2's own claim lapsed after its grant reached Stripe (record lost); tab 1's did the same, earlier.
    claimOf(TAB_1, { leaseUntil: stripe.now - 120_000, createdAt: T0 + 11 });
    claimOf(TAB_2, { leaseUntil: stripe.now - 60_000, createdAt: T0 + 21 });
    stripe.transactions.unshift(
      {
        id: "cbtxn_tab1_lost",
        customer: "cus_1",
        amount: -1850,
        created: T0 + 12,
        metadata: { pass_credit_session: TAB_1 },
      },
      {
        id: "cbtxn_tab2_lost",
        customer: "cus_1",
        amount: -1850,
        created: T0 + 22,
        metadata: { pass_credit_session: TAB_2 },
      },
    );
    const response = await deliver(
      creditedProCheckoutEvent(T0 + 20, { sessionId: TAB_2 }),
    );
    expect(response.status).toBe(200);
    expect(stripe.balances).toEqual([]);
    // This checkout's own grant stands; the orphan's goes on record beside its release.
    expect(ledger.claims.get(TAB_2)).toMatchObject({ txn: "cbtxn_tab2_lost" });
    expect(ledger.claims.get(TAB_1)).toMatchObject({
      released: true,
      txn: "cbtxn_tab1_lost",
    });
    expect(captureWarning).toHaveBeenCalledWith(
      "billing",
      "stripe_pass_credit_overlap_granted",
      expect.objectContaining({
        sessionId: TAB_1,
        alsoGranted: "cbtxn_tab1_lost",
        creditedBy: TAB_2,
      }),
    );
  });

  it("★ every orphan's lost grant is adopted, not only the first: each on record on its own claim and converted, this claim released", async () => {
    seed(passHolder());
    seedPasses(PASS_A, PASS_B, PASS_LATER);
    // Tab 1 named A, tab 3 named the later pass: each holder granted and died before its record. Tab 2 names A and it.
    ledger.claims.set(TAB_1, {
      host: "host-1",
      credit: 900,
      ids: [PASS_A],
      leaseUntil: stripe.now - 120_000,
      txn: null,
      converted: 0,
      released: false,
      createdAt: T0 + 11,
    });
    ledger.claims.set("cs_pro_credit_3", {
      host: "host-1",
      credit: 950,
      ids: [PASS_LATER],
      leaseUntil: stripe.now - 60_000,
      txn: null,
      converted: 0,
      released: false,
      createdAt: T0 + 31,
    });
    stripe.checkouts["cs_pro_credit_3"] = {
      customer: "cus_1",
      created: T0 + 30,
    };
    stripe.transactions.unshift(
      {
        id: "cbtxn_tab1_lost",
        customer: "cus_1",
        amount: -900,
        created: T0 + 12,
        metadata: { pass_credit_session: TAB_1 },
      },
      {
        id: "cbtxn_tab3_lost",
        customer: "cus_1",
        amount: -950,
        created: T0 + 32,
        metadata: { pass_credit_session: "cs_pro_credit_3" },
      },
    );
    const response = await deliver(
      creditedProCheckoutEvent(T0 + 20, {
        sessionId: TAB_2,
        passIds: [PASS_A, PASS_LATER],
      }),
    );
    expect(response.status).toBe(200);
    expect(stripe.balances).toEqual([]);
    expect(stripe.recorded).toEqual([
      [TAB_1, "cbtxn_tab1_lost"],
      ["cs_pro_credit_3", "cbtxn_tab3_lost"],
    ]);
    expect([consumed(PASS_A), consumed(PASS_LATER)]).toEqual([true, true]);
    expect(ledger.claims.get(TAB_2)?.released).toBe(true);
  });

  it("★ an orphan's grant on another customer (two first checkouts each made one) is found on that customer's own listing", async () => {
    seed(passHolder());
    seedPasses(PASS_A, PASS_B);
    claimOf(TAB_1, { leaseUntil: stripe.now - 60_000 });
    stripe.checkouts[TAB_1] = { customer: "cus_other", created: T0 + 9 };
    stripe.transactions.unshift({
      id: "cbtxn_tab1_lost",
      customer: "cus_other",
      amount: -1850,
      created: T0 + 12,
      metadata: { pass_credit_session: TAB_1 },
    });
    const response = await deliver(
      creditedProCheckoutEvent(T0 + 20, { sessionId: TAB_2 }),
    );
    expect(response.status).toBe(200);
    expect(stripe.balances).toEqual([]);
    expect(stripe.recorded).toEqual([[TAB_1, "cbtxn_tab1_lost"]]);
    expect(ledger.claims.get(TAB_2)?.released).toBe(true);
  });

  it("★ never grants past its lease: with too little of it left, nothing goes to Stripe and the delivery is a retry", async () => {
    seed(passHolder());
    seedPasses(PASS_A, PASS_B);
    // A caller that sat between its claim and its grant (a local build, a laptop that slept): a minute of lease left.
    ledger.claimedUntil = new Date(Date.now() + 60_000).toISOString();
    const response = await deliver(creditedProCheckoutEvent(T0 + 10));
    expect(response.status).toBe(500);
    expect(stripe.balances).toEqual([]);
    expect([consumed(PASS_A), consumed(PASS_B)]).toEqual([false, false]);
    expect(recordSignalFailure).toHaveBeenCalledTimes(1);
  });

  it("an orphan that cannot be settled is warned, never a failed delivery: the credit already landed", async () => {
    seed(passHolder());
    seedPasses(PASS_A, PASS_B);
    claimOf(TAB_1, { leaseUntil: stripe.now - 60_000 });
    ledger.releaseFails.add(TAB_1);
    const response = await deliver(
      creditedProCheckoutEvent(T0 + 20, { sessionId: TAB_2 }),
    );
    expect(response.status).toBe(200);
    expect(ledger.claims.get(TAB_2)?.txn).toBe("cbtxn_1");
    expect(ledger.claims.get(TAB_1)?.released).toBe(false);
    expect(captureWarning).toHaveBeenCalledWith(
      "billing",
      "stripe_pass_credit_orphan_unsettled",
      expect.objectContaining({ sessionId: TAB_1, creditedBy: TAB_2 }),
    );
    expect(recordSignalFailure).not.toHaveBeenCalled();
  });

  it("★ a Stripe-side look that fails is a 500 Stripe retries: never a release on a guess", async () => {
    seed(passHolder());
    seedPasses(PASS_A, PASS_B);
    claimOf(TAB_1, { leaseUntil: stripe.now - 60_000 });
    claimOf(TAB_2, { txn: "cbtxn_tab2" });
    ledger.passes.set(PASS_A, { host: "host-1", consumed: true });
    ledger.passes.set(PASS_B, { host: "host-1", consumed: true });
    stripe.listFails = true;
    const response = await deliver(
      creditedProCheckoutEvent(T0 + 10, { sessionId: TAB_1 }),
    );
    expect(response.status).toBe(500);
    expect(stripe.steps).toEqual(["claim", "list"]);
    expect(ledger.claims.get(TAB_1)?.released).toBe(false);
    expect(recordSignalFailure).toHaveBeenCalledTimes(1);
    // Stripe answers again: the retry settles it.
    stripe.listFails = false;
    expect(
      (await deliver(creditedProCheckoutEvent(T0 + 10, { sessionId: TAB_1 })))
        .status,
    ).toBe(200);
    expect(ledger.claims.get(TAB_1)?.released).toBe(true);
  });
});

describe("a credited delivery's failure (credit-watch)", () => {
  it("★ is the pass_credit signal's failure, Sentry inside it: never a second capture", async () => {
    seed(
      profile({
        tier: "event_pass",
        storage_cap_bytes: 25 * 1024 ** 3,
        event_slots: 1,
      }),
    );
    ledger.passes.set(PASS_A, { host: "host-1", consumed: false });
    ledger.failNext.record = 1;
    const response = await deliver(
      creditedProCheckoutEvent(T0 + 10, { passIds: [PASS_A] }),
    );
    expect(response.status).toBe(500);
    expect(recordSignalFailure).toHaveBeenCalledTimes(1);
    expect(recordSignalFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        job: "pass_credit",
        area: "billing",
        operation: "pass-to-Pro credit delivery",
        extra: { eventType: "checkout.session.completed" },
      }),
    );
    expect(captureError).not.toHaveBeenCalled();
  });

  it("a failure after the credit landed (the customer binding) is the delivery's, never the credit's signal", async () => {
    seed(
      profile({
        tier: "event_pass",
        storage_cap_bytes: 25 * 1024 ** 3,
        event_slots: 1,
        stripe_customer_id: null,
      }),
    );
    ledger.passes.set(PASS_A, { host: "host-1", consumed: false });
    // The binding's write refused, once the credit is converted.
    const fake = db.fake!;
    const realFrom = fake.from.bind(fake);
    fake.from = ((table: string) =>
      table === "profiles"
        ? {
            update: () => ({
              eq: () => ({
                is: async () => ({
                  data: null,
                  error: { message: "binding refused" },
                }),
              }),
            }),
          }
        : realFrom(table)) as typeof fake.from;
    const response = await deliver(
      creditedProCheckoutEvent(T0 + 10, { passIds: [PASS_A] }),
    );
    expect(response.status).toBe(500);
    expect(ledger.passes.get(PASS_A)?.consumed).toBe(true);
    expect(captureError).toHaveBeenCalledTimes(1);
    expect(recordSignalFailure).not.toHaveBeenCalled();
  });

  it("a subscription event's failure stays Sentry's alone", async () => {
    seed(profile({ id: "host-1", stripe_customer_id: "cus_other" }));
    const response = await deliver(
      subscriptionEvent("customer.subscription.updated"),
    );
    expect(response.status).toBe(500);
    expect(captureError).toHaveBeenCalledTimes(1);
    expect(recordSignalFailure).not.toHaveBeenCalled();
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
