/**
 * THE CHECKOUT DOOR'S STORAGE GUARD (billing-caps.md). A Pro checkout replaces the
 * cap, so it is refused with the numbers when the host stores more than the plan
 * holds, BEFORE a Stripe customer is created; an Event Pass is never refused; a
 * Free host in the over-cap grace meets the same line; and a Pro session closes in
 * about half an hour instead of Stripe's day, so the check it passed stays true.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GIGABYTE, TERABYTE, planById } from "@/lib/constants/tiers";

vi.mock("server-only", () => ({}));

let user: { id: string; email: string } | null = {
  id: "host-1",
  email: "host@example.com",
};
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

const adminUpdate = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      update: (patch: unknown) => ({
        eq: async () => {
          adminUpdate(patch);
          return { error: null };
        },
      }),
    }),
  }),
}));

vi.mock("@/lib/db/queries/event-passes", () => ({
  getLivePasses: async () => [],
}));

let activeBytes = 0;
vi.mock("@/lib/db/queries/storage", () => ({
  getHostStorageSummary: async () => ({ activeBytes, standbyBytes: 0 }),
}));

vi.mock("@/lib/stripe/plans", () => ({
  priceIdForPlan: (id: string) => `price_${id}`,
  eventPassRenewalPriceId: () => "price_event_pass_renewal",
}));

const createCustomer = vi.fn();
const createSession = vi.fn();
vi.mock("@/lib/stripe/client", () => ({
  getStripe: () => ({
    customers: { create: createCustomer },
    checkout: { sessions: { create: createSession } },
  }),
}));

vi.mock("@/lib/site-url", () => ({
  getSiteUrl: async () => "https://partyreel.com",
}));

const { POST } = await import("@/app/api/stripe/checkout/route");

async function checkout(body: Record<string, unknown>) {
  const res = await POST(
    new Request("https://partyreel.com/api/stripe/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
  return {
    status: res.status,
    json: (await res.json()) as Record<string, unknown>,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  user = { id: "host-1", email: "host@example.com" };
  profile = { stripe_customer_id: null, tier: "free", tier_expires_at: null };
  activeBytes = 1 * GIGABYTE;
  createCustomer.mockResolvedValue({ id: "cus_new" });
  createSession.mockResolvedValue({ url: "https://checkout.stripe.com/c/x" });
});

describe("a Pro checkout over the cap", () => {
  it("is refused with the numbers before any Stripe customer exists", async () => {
    // Stacked passes holding 140 GB, trying Pro 100 GB.
    profile = {
      stripe_customer_id: null,
      tier: "event_pass",
      tier_expires_at: new Date(Date.now() + 86_400_000).toISOString(),
    };
    activeBytes = 140 * GIGABYTE;
    const { status, json } = await checkout({ planId: "pro_100" });
    expect(status).toBe(409);
    expect(json).toMatchObject({
      ok: false,
      code: "over_new_cap",
      planId: "pro_100",
      storedBytes: 140 * GIGABYTE,
      capBytes: planById("pro_100").storageBytes,
      gapBytes: 40 * GIGABYTE,
      fits: ["pro_500", "pro_2tb"],
    });
    expect(createCustomer).not.toHaveBeenCalled();
    expect(adminUpdate).not.toHaveBeenCalled();
    expect(createSession).not.toHaveBeenCalled();
  });

  it("meets a Free host in the over-cap grace the same way", async () => {
    activeBytes = 140 * GIGABYTE;
    expect((await checkout({ planId: "pro_100_yr" })).json.code).toBe(
      "over_new_cap",
    );
    expect((await checkout({ planId: "pro_500_yr" })).status).toBe(200);
  });
});

describe("what is never refused for storage", () => {
  it("sells an Event Pass however much the host stores (passes stack)", async () => {
    activeBytes = 3 * TERABYTE;
    const { status } = await checkout({ planId: "event_pass" });
    expect(status).toBe(200);
    expect(createSession.mock.calls[0][0].mode).toBe("payment");
  });

  it("sells a Pro plan that fits", async () => {
    activeBytes = 90 * GIGABYTE;
    const { status, json } = await checkout({ planId: "pro_100" });
    expect(status).toBe(200);
    expect(json.url).toBe("https://checkout.stripe.com/c/x");
  });
});

describe("the session's window", () => {
  it("closes a Pro session in about half an hour, never Stripe's default day", async () => {
    const before = Math.floor(Date.now() / 1000);
    await checkout({ planId: "pro_500" });
    const expiresAt = createSession.mock.calls[0][0].expires_at as number;
    // At least Stripe's 30-minute floor from any clock that could create it, and
    // nowhere near 24 hours.
    expect(expiresAt - before).toBeGreaterThanOrEqual(30 * 60);
    expect(expiresAt - before).toBeLessThanOrEqual(35 * 60);
  });

  it("leaves a pass session on Stripe's default", async () => {
    await checkout({ planId: "event_pass" });
    expect(createSession.mock.calls[0][0].expires_at).toBeUndefined();
  });
});

describe("an active Pro host", () => {
  it("is refused a second subscription with the code the button acts on", async () => {
    profile = {
      stripe_customer_id: "cus_1",
      tier: "pro",
      tier_expires_at: null,
    };
    for (const planId of ["pro_2tb", "event_pass"]) {
      const { status, json } = await checkout({ planId });
      expect(status).toBe(409);
      expect(json.code).toBe("already_subscribed");
    }
    expect(createSession).not.toHaveBeenCalled();
  });
});
