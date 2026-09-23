/**
 * THE CHANGE-PLAN DOOR (the storage guard, billing-caps.md).
 *
 * Every refusal the brief names, forced: not signed in, not their subscription, not
 * single-item, a foreign price, over the cap; plus the ones the route adds (a plan
 * Partyreel set by hand, an unpaid or ending subscription, the plan you are on) and
 * the fail-closed configuration lookup. The happy path asserts the session the route
 * ASKS Stripe for: one item, quantity 1, the tagged configuration, a redirect after
 * completion. Nothing here writes a profile, and the last case proves it.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GIGABYTE, planById, type Plan } from "@/lib/constants/tiers";

vi.mock("server-only", () => ({}));

let user: { id: string } | null = { id: "host-1" };
let profile: Record<string, unknown> | null = null;
const profileUpdate = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user } }) },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: profile, error: null }),
        }),
      }),
      update: profileUpdate,
    }),
  }),
}));

let activeBytes = 0;
vi.mock("@/lib/db/queries/storage", () => ({
  getHostStorageSummary: async () => ({ activeBytes, standbyBytes: 0 }),
}));

const PRICES: Record<string, string> = {
  pro_100: "price_pro_100",
  pro_500: "price_pro_500",
  pro_2tb: "price_pro_2tb",
  pro_100_yr: "price_pro_100_yr",
  pro_500_yr: "price_pro_500_yr",
  pro_2tb_yr: "price_pro_2tb_yr",
};
vi.mock("@/lib/stripe/plans", () => ({
  priceIdForPlan: (id: string) => PRICES[id],
  planForPriceId: (priceId: string): Plan | null => {
    const id = Object.keys(PRICES).find((k) => PRICES[k] === priceId);
    return id ? planById(id as Parameters<typeof planById>[0]) : null;
  },
}));

const retrieve = vi.fn();
const createSession = vi.fn();
vi.mock("@/lib/stripe/client", () => ({
  getStripe: () => ({
    subscriptions: { retrieve },
    billingPortal: { sessions: { create: createSession } },
  }),
}));

class MissingConfig extends Error {}
const configurationId = vi.fn();
const forgetConfiguration = vi.fn();
vi.mock("@/lib/stripe/portal-config", () => ({
  ChangePlanConfigurationMissingError: MissingConfig,
  changePlanConfigurationId: () => configurationId(),
  forgetChangePlanConfiguration: () => forgetConfiguration(),
}));

vi.mock("@/lib/site-url", () => ({
  getSiteUrl: async () => "https://partyreel.com",
}));
const captureError = vi.fn();
vi.mock("@/lib/observability/sentry", () => ({
  captureError: (...args: unknown[]) => captureError(...args),
}));

const { POST } = await import("@/app/api/stripe/change-plan/route");

function post(body: unknown) {
  return POST(
    new Request("https://partyreel.com/api/stripe/change-plan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

async function answer(body: unknown) {
  const res = await post(body);
  return {
    status: res.status,
    json: (await res.json()) as Record<string, unknown>,
  };
}

function subscription(over: Record<string, unknown> = {}) {
  return {
    id: "sub_1",
    customer: "cus_1",
    status: "active",
    cancel_at_period_end: false,
    cancel_at: null,
    items: {
      data: [{ id: "si_1", price: { id: "price_pro_500" }, quantity: 1 }],
    },
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  user = { id: "host-1" };
  profile = {
    tier: "pro",
    stripe_customer_id: "cus_1",
    stripe_subscription_id: "sub_1",
  };
  activeBytes = 40 * GIGABYTE;
  retrieve.mockResolvedValue(subscription());
  configurationId.mockResolvedValue("bpc_tagged");
  createSession.mockResolvedValue({
    url: "https://billing.stripe.com/p/session/x",
  });
});

describe("who may ask", () => {
  it("refuses a caller who is not signed in", async () => {
    user = null;
    const { status, json } = await answer({ planId: "pro_100" });
    expect(status).toBe(401);
    expect(json.code).toBe("unauthorized");
    expect(retrieve).not.toHaveBeenCalled();
  });

  it("refuses a malformed body and any plan that is not one of the six Pro ids", async () => {
    expect((await answer("{not json")).status).toBe(400);
    for (const planId of ["event_pass", "free", "pro_1tb", undefined]) {
      const { status, json } = await answer({ planId });
      expect(status, String(planId)).toBe(400);
      expect(json.code).toBe("bad_request");
    }
  });

  it("refuses a host who is not on Pro", async () => {
    profile = {
      tier: "event_pass",
      stripe_customer_id: "cus_1",
      stripe_subscription_id: null,
    };
    const { status, json } = await answer({ planId: "pro_100" });
    expect(status).toBe(409);
    expect(json.code).toBe("not_subscribed");
  });

  it("refuses a Pro plan Partyreel set by hand (nothing in Stripe to change)", async () => {
    profile = {
      tier: "pro",
      stripe_customer_id: null,
      stripe_subscription_id: null,
    };
    expect((await answer({ planId: "pro_100" })).json.code).toBe(
      "no_subscription",
    );
    expect(retrieve).not.toHaveBeenCalled();
  });

  it("treats a subscription Stripe no longer has as no subscription", async () => {
    retrieve.mockRejectedValue(
      Object.assign(new Error("No such subscription"), {
        code: "resource_missing",
      }),
    );
    expect((await answer({ planId: "pro_100" })).json.code).toBe(
      "no_subscription",
    );
  });
});

describe("which subscriptions can change", () => {
  it("refuses a subscription that is not theirs, with a 403", async () => {
    retrieve.mockResolvedValue(subscription({ customer: "cus_someone_else" }));
    const { status, json } = await answer({ planId: "pro_100" });
    expect(status).toBe(403);
    expect(json.code).toBe("not_yours");
    expect(createSession).not.toHaveBeenCalled();
  });

  it("refuses a subscription with more than one item", async () => {
    retrieve.mockResolvedValue(
      subscription({
        items: {
          data: [
            { id: "si_1", price: { id: "price_pro_500" }, quantity: 1 },
            { id: "si_2", price: { id: "price_pro_100" }, quantity: 1 },
          ],
        },
      }),
    );
    expect((await answer({ planId: "pro_100" })).json.code).toBe("multi_item");
  });

  it("refuses a subscription on a price that is not ours", async () => {
    retrieve.mockResolvedValue(
      subscription({
        items: {
          data: [{ id: "si_1", price: { id: "price_foreign" }, quantity: 1 }],
        },
      }),
    );
    expect((await answer({ planId: "pro_100" })).json.code).toBe(
      "foreign_price",
    );
  });

  it("refuses an unpaid or an ending subscription", async () => {
    retrieve.mockResolvedValue(subscription({ status: "past_due" }));
    expect((await answer({ planId: "pro_100" })).json.code).toBe(
      "payment_issue",
    );
    retrieve.mockResolvedValue(subscription({ cancel_at_period_end: true }));
    expect((await answer({ planId: "pro_100" })).json.code).toBe("ending");
  });

  it("refuses the plan the host is already on", async () => {
    expect((await answer({ planId: "pro_500" })).json.code).toBe(
      "already_on_plan",
    );
  });

  it("lets the same price through when the old stepper left the quantity above 1", async () => {
    retrieve.mockResolvedValue(
      subscription({
        items: {
          data: [{ id: "si_1", price: { id: "price_pro_500" }, quantity: 3 }],
        },
      }),
    );
    expect((await answer({ planId: "pro_500" })).status).toBe(200);
  });
});

describe("the storage guard", () => {
  it("refuses a smaller plan than what the host stores, with the numbers, before Stripe", async () => {
    activeBytes = 140 * GIGABYTE;
    const { status, json } = await answer({ planId: "pro_100" });
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
    expect(typeof json.message).toBe("string");
    expect(createSession).not.toHaveBeenCalled();
  });

  it("lets a downgrade that fits through, and an upgrade always", async () => {
    activeBytes = 90 * GIGABYTE;
    expect((await answer({ planId: "pro_100" })).status).toBe(200);
    expect((await answer({ planId: "pro_2tb_yr" })).status).toBe(200);
  });
});

describe("the session it asks Stripe for", () => {
  it("confirms exactly one item at quantity 1, on the tagged configuration, then redirects", async () => {
    const { status, json } = await answer({
      planId: "pro_2tb",
      next: "/account",
    });
    expect(status).toBe(200);
    expect(json).toEqual({
      ok: true,
      url: "https://billing.stripe.com/p/session/x",
    });
    expect(createSession).toHaveBeenCalledTimes(1);
    const params = createSession.mock.calls[0][0];
    expect(params).toMatchObject({
      customer: "cus_1",
      configuration: "bpc_tagged",
      return_url: "https://partyreel.com/account",
      flow_data: {
        type: "subscription_update_confirm",
        subscription_update_confirm: {
          subscription: "sub_1",
          items: [{ id: "si_1", price: "price_pro_2tb", quantity: 1 }],
        },
        after_completion: {
          type: "redirect",
          redirect: { return_url: "https://partyreel.com/account" },
        },
      },
    });
  });

  it("never lets the body pick a return path off the allow-list", async () => {
    await answer({ planId: "pro_2tb", next: "https://evil.example/steal" });
    expect(createSession.mock.calls[0][0].return_url).toBe(
      "https://partyreel.com/dashboard",
    );
  });

  it("fails closed, loudly, when no configuration carries the tag", async () => {
    configurationId.mockRejectedValue(new MissingConfig("missing"));
    const { status, json } = await answer({ planId: "pro_2tb" });
    expect(status).toBe(503);
    expect(json.code).toBe("unavailable");
    expect(createSession).not.toHaveBeenCalled();
    expect(captureError).toHaveBeenCalledWith(
      "billing",
      expect.any(MissingConfig),
      expect.anything(),
    );
  });

  it("looks the configuration up again once when Stripe says the cached one is gone", async () => {
    configurationId
      .mockResolvedValueOnce("bpc_stale")
      .mockResolvedValueOnce("bpc_fresh");
    createSession
      .mockRejectedValueOnce(
        Object.assign(new Error("No such configuration"), {
          code: "resource_missing",
          param: "configuration",
        }),
      )
      .mockResolvedValueOnce({ url: "https://billing.stripe.com/p/session/y" });
    const { status } = await answer({ planId: "pro_2tb" });
    expect(status).toBe(200);
    expect(forgetConfiguration).toHaveBeenCalledTimes(1);
    expect(createSession.mock.calls[1][0].configuration).toBe("bpc_fresh");
  });

  it("writes nothing to the profile (the webhook applies the new cap)", async () => {
    await answer({ planId: "pro_2tb" });
    expect(profileUpdate).not.toHaveBeenCalled();
  });
});
