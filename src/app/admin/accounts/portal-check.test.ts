/**
 * ★ DOES STRIPE'S CHANGE-PLAN CONFIGURATION LIST EVERY PRO PRICE WE SELL (credit-watch). TEST's listed six retired
 * prices on 2026-10-05, so every Switch was a 500 a host met first; this check is how the operator sees that gap on
 * /admin/accounts before anyone does. The configuration is the one the route would pick (tagged, active, its
 * subscription updates on), its products read whole by a retrieve with the expand (the list omits them), against all
 * six Pro prices `tiers.ts` sells by the ids the env maps; a retired price listed beside them breaks nothing; a check
 * that could not run says so, never "whole".
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PLANS } from "@/lib/constants/tiers";

const stripe = vi.hoisted(() => ({
  configurations: [] as unknown[],
  products: null as { prices: string[] }[] | null,
  retrieved: [] as { id: string; params: unknown }[],
  listFails: false,
  unsetPrice: null as string | null,
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/stripe/client", () => ({
  getStripe: () => ({
    billingPortal: {
      configurations: {
        list: () => {
          if (stripe.listFails) throw new Error("Stripe is unreachable");
          return (async function* () {
            yield* stripe.configurations;
          })();
        },
        retrieve: async (id: string, params: unknown) => {
          stripe.retrieved.push({ id, params });
          return {
            id,
            features: { subscription_update: { products: stripe.products } },
          };
        },
      },
    },
  }),
}));
// The env's price ids: `price_<plan>` for each plan, one left unset when a case asks.
vi.mock("@/lib/stripe/plans", () => ({
  priceIdForPlan: (planId: string) => {
    if (planId === stripe.unsetPrice) {
      throw new Error(`No Stripe Price ID configured for plan "${planId}".`);
    }
    return `price_${planId}`;
  },
}));

const { checkChangePlanConfiguration, missingPrices, soldProPrices } =
  await import("./portal-check");

const PRO_IDS = PLANS.filter((p) => p.tier === "pro").map((p) => p.id);
const SOLD = PRO_IDS.map((id) => `price_${id}`);

function tagged(id: string, over: Record<string, unknown> = {}) {
  return {
    id,
    active: true,
    metadata: { partyreel_purpose: "change_plan" },
    features: { subscription_update: { enabled: true } },
    ...over,
  };
}

beforeEach(() => {
  stripe.configurations = [];
  stripe.products = null;
  stripe.retrieved = [];
  stripe.listFails = false;
  stripe.unsetPrice = null;
});

describe("the prices we sell", () => {
  it("are every Pro plan's, six of them, each named by its size and its price", () => {
    const sold = soldProPrices((id) => `price_${id}`);
    expect(sold).toHaveLength(6);
    expect(sold.map((p) => p.priceId)).toEqual(SOLD);
    expect(sold[0]).toEqual({
      planId: "pro_50",
      label: "Pro 50 GB, $9/mo",
      priceId: "price_pro_50",
    });
    expect(sold.map((p) => p.label)).toContain("Pro 1 TB, $990/yr");
  });

  it("the missing are the sold the products do not list, in the order we sell them; a retired one listed breaks nothing", () => {
    const sold = soldProPrices((id) => `price_${id}`);
    expect(
      missingPrices(sold, [
        { prices: ["price_pro_50", "price_retired_1"] },
        { prices: ["price_pro_200", "price_pro_200_yr"] },
      ]).map((p) => p.planId),
    ).toEqual(["pro_1tb", "pro_50_yr", "pro_1tb_yr"]);
    expect(
      missingPrices(sold, [{ prices: [...SOLD, "price_retired"] }]),
    ).toEqual([]);
    expect(missingPrices(sold, null)).toHaveLength(6);
  });
});

describe("the check", () => {
  it("★ whole when the configuration the route would pick lists all six, its products read by a retrieve with the expand", async () => {
    stripe.configurations = [
      {
        id: "bpc_default",
        active: true,
        metadata: {},
        features: { subscription_update: { enabled: false } },
      },
      tagged("bpc_tagged"),
    ];
    stripe.products = [
      { prices: ["price_pro_50", "price_pro_50_yr"] },
      { prices: ["price_pro_200", "price_pro_200_yr"] },
      { prices: ["price_pro_1tb", "price_pro_1tb_yr", "price_retired"] },
    ];
    await expect(checkChangePlanConfiguration()).resolves.toEqual({
      state: "whole",
      configurationId: "bpc_tagged",
      sold: 6,
    });
    expect(stripe.retrieved).toEqual([
      {
        id: "bpc_tagged",
        params: { expand: ["features.subscription_update.products"] },
      },
    ]);
  });

  it("★ names each price missing (TEST's six retired prices: every Switch a 500)", async () => {
    stripe.configurations = [tagged("bpc_tagged")];
    stripe.products = [
      { prices: ["price_old_1", "price_old_2", "price_old_3"] },
      { prices: ["price_old_4", "price_old_5", "price_old_6"] },
    ];
    const check = await checkChangePlanConfiguration();
    expect(check).toMatchObject({
      state: "missing",
      configurationId: "bpc_tagged",
      sold: 6,
    });
    expect(
      check.state === "missing" && check.missing.map((p) => p.priceId),
    ).toEqual(SOLD);
  });

  it("says none tagged when no active configuration carries the tag with its updates on (change-plan's 503)", async () => {
    stripe.configurations = [
      tagged("bpc_off", {
        features: { subscription_update: { enabled: false } },
      }),
      tagged("bpc_inactive", { active: false }),
      {
        id: "bpc_other",
        active: true,
        metadata: { partyreel_purpose: "other" },
        features: { subscription_update: { enabled: true } },
      },
    ];
    await expect(checkChangePlanConfiguration()).resolves.toEqual({
      state: "no_configuration",
    });
    expect(stripe.retrieved).toEqual([]);
  });

  it("★ a check that could not run says so, never whole: Stripe unreachable, or a price with no env value", async () => {
    stripe.listFails = true;
    await expect(checkChangePlanConfiguration()).resolves.toEqual({
      state: "unread",
      message: "Stripe is unreachable",
    });
    stripe.listFails = false;
    stripe.configurations = [tagged("bpc_tagged")];
    stripe.products = [{ prices: SOLD }];
    stripe.unsetPrice = "pro_200_yr";
    const check = await checkChangePlanConfiguration();
    expect(check.state).toBe("unread");
    expect(check.state === "unread" && check.message).toMatch(/pro_200_yr/);
  });
});
