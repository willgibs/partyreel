/**
 * THE WEBHOOK'S SUBSCRIPTION BRANCH, AS STRIPE DELIVERS IT (billing-caps.md).
 *
 * Two things the pure provisioning tests cannot see, because they are about what the ROUTE writes: a first payment
 * still in flight (`incomplete`) writes nothing at all, so a same-second `incomplete` delivered after the `active`
 * cannot put a paying host back on Free; and a subscription billed more than once for one cap raises a Sentry
 * warning while the profile is written exactly as a quantity of one would write it.
 */
import type Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { planById, type Plan } from "@/lib/constants/tiers";

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
  insertPassPurchase: vi.fn(),
  recomputePassEntitlement: (profileId: string) =>
    recomputePassEntitlement(profileId),
}));
vi.mock("@/lib/db/queries/event-passes", () => ({ getLivePasses: vi.fn() }));

const captureWarning = vi.fn();
const captureError = vi.fn();
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: (...args: unknown[]) => captureWarning(...args),
  captureError: (...args: unknown[]) => captureError(...args),
}));

/** Every `profiles` write the route makes, in order. */
let profileWrites: Record<string, unknown>[] = [];

type Chain = {
  update: (patch: Record<string, unknown>) => Chain;
  eq: () => Chain;
  is: () => Chain;
  filter: () => Chain;
  select: () => Chain;
  maybeSingle: () => Promise<{ data: { id: string }; error: null }>;
  then: (resolve: (value: unknown) => unknown) => Promise<unknown>;
};

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => {
      const chain: Chain = {
        update(patch) {
          profileWrites.push(patch);
          return chain;
        },
        eq: () => chain,
        is: () => chain,
        filter: () => chain,
        select: () => chain,
        maybeSingle: async () => ({ data: { id: "host-1" }, error: null }),
        // One matched row: the entitlement write applied.
        then: (resolve) =>
          Promise.resolve({ data: [{ id: "host-1" }], error: null }).then(
            resolve,
          ),
      };
      return chain;
    },
  }),
}));

const { POST } = await import("@/app/api/stripe/webhook/route");

function subscriptionEvent(
  type: string,
  opts: { status?: string; quantities?: number[] } = {},
): Stripe.Event {
  return {
    id: "evt_1",
    type,
    created: 1_790_000_000,
    data: {
      object: {
        id: "sub_1",
        customer: "cus_1",
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
  profileWrites = [];
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
    expect(profileWrites).toHaveLength(1);
    expect(profileWrites[0]).toMatchObject({
      tier: "pro",
      storage_cap_bytes: planById("pro_500").storageBytes,
      stripe_subscription_id: "sub_1",
    });
  });

  it("★ an incomplete subscription writes NOTHING: not a grant, not a downgrade, not even the recency stamp", async () => {
    const response = await deliver(
      subscriptionEvent("customer.subscription.created", {
        status: "incomplete",
      }),
    );
    expect(response.status).toBe(200);
    expect(profileWrites).toEqual([]);
    expect(recomputePassEntitlement).not.toHaveBeenCalled();
  });

  it("★ so the same-second race ends on the plan the host paid for", async () => {
    await deliver(subscriptionEvent("customer.subscription.updated"));
    await deliver(
      subscriptionEvent("customer.subscription.created", {
        status: "incomplete",
      }),
    );
    expect(profileWrites.map((write) => write.tier)).toEqual(["pro"]);
  });

  it("still downgrades a first payment that never came (incomplete_expired)", async () => {
    await deliver(
      subscriptionEvent("customer.subscription.updated", {
        status: "incomplete_expired",
      }),
    );
    expect(profileWrites[0]).toMatchObject({
      tier: "free",
      storage_cap_bytes: null,
    });
    // A downgrade re-derives any live pass from the ledger.
    expect(recomputePassEntitlement).toHaveBeenCalledWith("host-1");
  });
});

describe("the quantity warning", () => {
  it("★ warns on an item billed more than once, and writes exactly what a quantity of one writes", async () => {
    await deliver(
      subscriptionEvent("customer.subscription.updated", { quantities: [2] }),
    );
    await deliver(subscriptionEvent("customer.subscription.updated"));

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
    const [multiple, single] = profileWrites;
    expect(multiple).toEqual(single);
  });

  it("stays quiet at a quantity of one", async () => {
    await deliver(subscriptionEvent("customer.subscription.created"));
    expect(captureWarning).not.toHaveBeenCalled();
  });
});
