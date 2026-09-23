/**
 * THE PLAN SHEET'S READ. It answers only the caller's own facts, marks a Pro host's
 * price from their subscription, names why a switch cannot open, and degrades (never
 * fails) when Stripe cannot be read, since the change-plan route re-checks anyway.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GIGABYTE, planById, type Plan } from "@/lib/constants/tiers";
import { parsePlanFacts } from "@/lib/billing/plan-facts";

vi.mock("server-only", () => ({}));

let user: { id: string } | null = { id: "host-1" };
let profile: Record<string, unknown> | null = null;
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user } }) },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: profile, error: null }),
        }),
      }),
    }),
  }),
}));

let storage = { activeBytes: 0, standbyBytes: 0 };
vi.mock("@/lib/db/queries/storage", () => ({
  getHostStorageSummary: async () => storage,
}));

vi.mock("@/lib/stripe/plans", () => ({
  planForPriceId: (priceId: string): Plan | null =>
    priceId === "price_pro_500_yr" ? planById("pro_500_yr") : null,
}));

const retrieve = vi.fn();
vi.mock("@/lib/stripe/client", () => ({
  getStripe: () => ({ subscriptions: { retrieve } }),
}));

const captureWarning = vi.fn();
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: (...args: unknown[]) => captureWarning(...args),
}));

const { GET } = await import("@/app/api/stripe/plan-facts/route");

async function facts() {
  const res = await GET();
  const json = await res.json();
  return { status: res.status, res, json, facts: parsePlanFacts(json) };
}

function subscription(over: Record<string, unknown> = {}) {
  return {
    id: "sub_1",
    customer: "cus_1",
    status: "active",
    cancel_at_period_end: false,
    cancel_at: null,
    items: {
      data: [{ id: "si_1", price: { id: "price_pro_500_yr" }, quantity: 1 }],
    },
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  user = { id: "host-1" };
  profile = {
    tier: "free",
    storage_cap_bytes: null,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    tier_expires_at: null,
  };
  storage = { activeBytes: 1 * GIGABYTE, standbyBytes: 2 * GIGABYTE };
  retrieve.mockResolvedValue(subscription());
});

describe("who it answers", () => {
  it("refuses a caller who is not signed in", async () => {
    user = null;
    const { status } = await facts();
    expect(status).toBe(401);
  });

  it("is never cached", async () => {
    const { res } = await facts();
    expect(res.headers.get("Cache-Control")).toContain("no-store");
  });
});

describe("what it answers", () => {
  it("gives a Free host their bytes and Free's cap, and never touches Stripe", async () => {
    const { facts: f } = await facts();
    expect(f).toEqual({
      tier: "free",
      hasBilling: false,
      passExpiry: null,
      activeBytes: 1 * GIGABYTE,
      standbyBytes: 2 * GIGABYTE,
      capBytes: planById("free").storageBytes,
      currentPlanId: null,
      changeBlocked: null,
    });
    expect(retrieve).not.toHaveBeenCalled();
  });

  it("gives a pass holder the stacked cap and the expiry", async () => {
    profile = {
      tier: "event_pass",
      storage_cap_bytes: 225 * GIGABYTE,
      stripe_customer_id: "cus_1",
      stripe_subscription_id: null,
      tier_expires_at: "2027-03-01T12:00:00Z",
    };
    const { facts: f } = await facts();
    expect(f?.capBytes).toBe(225 * GIGABYTE);
    expect(f?.passExpiry).toMatch(/2027/);
    expect(f?.hasBilling).toBe(true);
  });

  it("marks a Pro host's own price from the subscription", async () => {
    profile = {
      tier: "pro",
      storage_cap_bytes: 500 * GIGABYTE,
      stripe_customer_id: "cus_1",
      stripe_subscription_id: "sub_1",
      tier_expires_at: null,
    };
    const { facts: f } = await facts();
    expect(f?.currentPlanId).toBe("pro_500_yr");
    expect(f?.changeBlocked).toBe(null);
  });

  it("still marks the price when the switch is blocked, and says why", async () => {
    profile = {
      tier: "pro",
      storage_cap_bytes: 500 * GIGABYTE,
      stripe_customer_id: "cus_1",
      stripe_subscription_id: "sub_1",
      tier_expires_at: null,
    };
    retrieve.mockResolvedValue(subscription({ cancel_at_period_end: true }));
    const { facts: f } = await facts();
    expect(f?.currentPlanId).toBe("pro_500_yr");
    expect(f?.changeBlocked).toBe("ending");
  });

  it("names a Pro plan set by hand as having nothing in Stripe to change", async () => {
    profile = {
      tier: "pro",
      storage_cap_bytes: 100 * GIGABYTE,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      tier_expires_at: null,
    };
    const { facts: f } = await facts();
    expect(f?.changeBlocked).toBe("no_subscription");
    expect(retrieve).not.toHaveBeenCalled();
  });

  it("degrades, loudly, when Stripe cannot be read", async () => {
    profile = {
      tier: "pro",
      storage_cap_bytes: 500 * GIGABYTE,
      stripe_customer_id: "cus_1",
      stripe_subscription_id: "sub_1",
      tier_expires_at: null,
    };
    retrieve.mockRejectedValue(
      Object.assign(new Error("down"), { code: "api_error" }),
    );
    const { status, facts: f } = await facts();
    expect(status).toBe(200);
    expect(f?.currentPlanId).toBe(null);
    expect(f?.changeBlocked).toBe(null);
    expect(captureWarning).toHaveBeenCalledTimes(1);
  });
});

describe("the parser the sheet reads through", () => {
  it("refuses anything malformed, so the sheet keeps its door's facts", () => {
    expect(parsePlanFacts(null)).toBe(null);
    expect(parsePlanFacts({ ok: true })).toBe(null);
    expect(parsePlanFacts({ facts: { tier: "gold", hasBilling: true } })).toBe(
      null,
    );
    expect(
      parsePlanFacts({
        facts: {
          tier: "free",
          hasBilling: false,
          activeBytes: -1,
          standbyBytes: 0,
          capBytes: null,
        },
      }),
    ).toBe(null);
  });

  it("drops an unknown plan id or refusal code rather than trusting it", () => {
    const f = parsePlanFacts({
      facts: {
        tier: "pro",
        hasBilling: true,
        activeBytes: 0,
        standbyBytes: 0,
        capBytes: 100,
        currentPlanId: "pro_9tb",
        changeBlocked: "whatever",
      },
    });
    expect(f?.currentPlanId).toBe(null);
    expect(f?.changeBlocked).toBe(null);
  });
});
