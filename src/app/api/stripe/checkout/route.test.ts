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

/** The ledger's unconsumed pass rows (`getLivePasses`), expired ones included. */
let livePasses: Record<string, unknown>[] = [];
vi.mock("@/lib/db/queries/event-passes", () => ({
  getLivePasses: async () => livePasses,
}));

/** What she keeps in her albums, and in Deleted: her plan's cap holds both (trash-in-storage). */
let albumBytes = 0;
let deletedBytes = 0;
vi.mock("@/lib/db/queries/storage", () => ({
  getHostStorageSummary: async () => ({
    activeBytes: albumBytes,
    deletedBytes,
    systemBytes: 0,
    storedBytes: albumBytes + deletedBytes,
  }),
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
  livePasses = [];
  user = { id: "host-1", email: "host@example.com" };
  profile = { stripe_customer_id: null, tier: "free", tier_expires_at: null };
  albumBytes = 1 * GIGABYTE;
  deletedBytes = 0;
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
    albumBytes = 140 * GIGABYTE;
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

  it("★ counts her Deleted in what she stores: Deleted is inside the cap she would buy", async () => {
    // 90 GB in her albums would fit Pro 100 GB; with 50 GB in Deleted she stores 140 GB.
    albumBytes = 90 * GIGABYTE;
    deletedBytes = 50 * GIGABYTE;
    const { status, json } = await checkout({ planId: "pro_100" });
    expect(status).toBe(409);
    expect(json).toMatchObject({
      code: "over_new_cap",
      storedBytes: 140 * GIGABYTE,
      gapBytes: 40 * GIGABYTE,
    });
    expect(createCustomer).not.toHaveBeenCalled();
  });

  it("meets a Free host in the over-cap grace the same way", async () => {
    albumBytes = 140 * GIGABYTE;
    expect((await checkout({ planId: "pro_100_yr" })).json.code).toBe(
      "over_new_cap",
    );
    expect((await checkout({ planId: "pro_500_yr" })).status).toBe(200);
  });
});

describe("what is never refused for storage", () => {
  it("sells an Event Pass however much the host stores (passes stack)", async () => {
    albumBytes = 3 * TERABYTE;
    const { status } = await checkout({ planId: "event_pass" });
    expect(status).toBe(200);
    expect(createSession.mock.calls[0][0].mode).toBe("payment");
  });

  it("sells a Pro plan that fits", async () => {
    albumBytes = 90 * GIGABYTE;
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

/**
 * THE RENEWAL'S REFUSAL IS TRUE OF THE ACCOUNT (build 19's red-team): /account/renew opens for anyone
 * signed in, and an account that never held a pass was told "Yours has ended". Both refusals keep
 * `not_eligible`, the code the renew page answers with See plans first, and neither reaches Stripe.
 */
describe("a renewal with no pass running", () => {
  it("★ tells an account with no pass that there is none to renew", async () => {
    const { status, json } = await checkout({
      planId: "event_pass",
      renewal: true,
    });
    expect(status).toBe(403);
    expect(json).toMatchObject({
      ok: false,
      code: "not_eligible",
      message:
        "This account has no Event Pass to renew. Start one from the pricing page.",
    });
    expect(json.message).not.toMatch(/ended/);
    expect(createCustomer).not.toHaveBeenCalled();
    expect(createSession).not.toHaveBeenCalled();
  });

  it("tells a holder whose pass has run out that it ended", async () => {
    livePasses = [
      {
        id: "pass-1",
        start_at: "2025-06-01T00:00:00.000Z",
        expires_at: "2026-06-01T00:00:00.000Z",
        price_cents: 2400,
        consumed_at: null,
      },
    ];
    const { status, json } = await checkout({
      planId: "event_pass",
      renewal: true,
    });
    expect(status).toBe(403);
    expect(json).toMatchObject({ ok: false, code: "not_eligible" });
    expect(json.message).toMatch(/Yours has ended/);
    expect(createSession).not.toHaveBeenCalled();
  });
});
