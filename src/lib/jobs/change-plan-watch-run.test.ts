/**
 * ★ THE CHANGE-PLAN CONFIGURATION, WATCHED IN THE SPEND WATCH'S RUN (billing-orphans). Stripe is stubbed at the reader
 * (`getStripe`'s portal configurations, the env's price ids), so the real check runs end to end: the route's own pick,
 * the retrieve with the expand, against every Pro price `tiers.ts` sells. A TEST configuration with a price missing
 * holds the run at attention, mails the ops inbox once a day and names the price; one with none missing says nothing; a
 * check that could not run fails the run and mails nobody. No write reaches Stripe: the stub has none.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PLANS, planById } from "@/lib/constants/tiers";

const stripe = vi.hoisted(() => ({
  configurations: [] as unknown[],
  products: null as { prices: string[] }[] | null,
  listFails: false,
}));
const sendOnce = vi.fn();
const captureWarning = vi.fn();
const captureError = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ env: {}, serverEnv: {} }));
vi.mock("@/lib/auth/admin-host", () => ({ ADMIN_HOST: "admin.partyreel.com" }));
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
        retrieve: async (id: string) => ({
          id,
          features: { subscription_update: { products: stripe.products } },
        }),
      },
    },
  }),
}));
vi.mock("@/lib/stripe/plans", () => ({
  priceIdForPlan: (planId: string) => `price_${planId}`,
}));
vi.mock("@/lib/email/send", () => ({
  sendOnce: (...a: unknown[]) => sendOnce(...a),
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: (...a: unknown[]) => captureWarning(...a),
  captureError: (...a: unknown[]) => captureError(...a),
}));

const { runChangePlanWatch } = await import("@/lib/jobs/change-plan-watch-run");

const NOW = new Date("2026-10-06T05:00:00.000Z");
const PRO = PLANS.filter((p) => p.tier === "pro");
const CONFIG = "bpc_test_change_plan";

/** The tagged TEST configuration, listing every Pro price we sell but the ones named. */
function configurationLacking(...lacking: string[]) {
  stripe.configurations = [
    {
      id: CONFIG,
      active: true,
      metadata: { partyreel_purpose: "change_plan" },
      features: { subscription_update: { enabled: true } },
    },
  ];
  stripe.products = [
    {
      prices: PRO.map((p) => `price_${p.id}`).filter(
        (price) => !lacking.includes(price),
      ),
    },
    // A retired price listed beside them breaks nothing.
    { prices: ["price_retired"] },
  ];
}

beforeEach(() => {
  vi.clearAllMocks();
  stripe.configurations = [];
  stripe.products = null;
  stripe.listFails = false;
  sendOnce.mockResolvedValue(true);
});

describe("a configuration that lists every Pro price", () => {
  it("is quiet: no bell, no mail, no note, the record kept", async () => {
    configurationLacking();
    const outcome = await runChangePlanWatch({ now: NOW });
    expect(outcome).toEqual({
      stored: { state: "whole", configuration_id: CONFIG, sold: PRO.length },
      attention: false,
      failed: false,
      note: null,
    });
    expect(sendOnce).not.toHaveBeenCalled();
    expect(captureWarning).not.toHaveBeenCalled();
  });
});

describe("a configuration with a price missing", () => {
  it("★ holds the run at attention, names the price sold that it lacks, and mails the ops inbox once a day", async () => {
    const lacking = PRO[PRO.length - 1]!;
    configurationLacking(`price_${lacking.id}`);
    const outcome = await runChangePlanWatch({ now: NOW });
    const label = `${lacking.name}, ${lacking.priceLabel}`;
    expect(outcome.attention).toBe(true);
    expect(outcome.failed).toBe(false);
    expect(outcome.stored).toEqual({
      state: "missing",
      configuration_id: CONFIG,
      sold: PRO.length,
      missing: [
        { plan_id: lacking.id, label, price_id: `price_${lacking.id}` },
      ],
    });
    expect(outcome.note).toBe(
      `Change plan in Stripe: the tagged configuration (${CONFIG}) lacks ${label} (price_${lacking.id}), so Stripe refuses a switch to it.`,
    );
    expect(sendOnce).toHaveBeenCalledTimes(1);
    const mail = sendOnce.mock.calls[0]![0] as {
      kind: string;
      dedupeKey: string;
      subject: string;
      text: string;
    };
    expect(mail.kind).toBe("spend_watch");
    expect(mail.dedupeKey).toBe(`change_plan:price_${lacking.id}:2026-10-06`);
    expect(mail.subject).toBe(
      `[Partyreel] Change plan in Stripe: 1 of ${PRO.length} Pro prices missing`,
    );
    expect(mail.text).toContain(label);
    expect(mail.text).toContain(`price_${lacking.id}`);
    expect(mail.text).toContain(CONFIG);
    expect(captureWarning).toHaveBeenCalledWith(
      "billing",
      "stripe_change_plan_configuration_incomplete",
      expect.objectContaining({
        configurationId: CONFIG,
        missing: [`price_${lacking.id}`],
      }),
    );
  });

  it("names every one missing, in the order tiers.ts sells them", async () => {
    configurationLacking(`price_${PRO[2]!.id}`, `price_${PRO[0]!.id}`);
    const outcome = await runChangePlanWatch({ now: NOW });
    expect(
      outcome.stored.state === "missing" &&
        outcome.stored.missing.map((p) => p.plan_id),
    ).toEqual([PRO[0]!.id, PRO[2]!.id]);
    expect(outcome.note).toContain("so Stripe refuses a switch to each.");
    expect(planById(PRO[0]!.id).tier).toBe("pro");
  });

  it("a mail that cannot be sent fails the run, to be tried again next run, and still rings", async () => {
    configurationLacking(`price_${PRO[0]!.id}`);
    sendOnce.mockRejectedValue(new Error("Resend is down"));
    const outcome = await runChangePlanWatch({ now: NOW });
    expect(outcome.attention).toBe(true);
    expect(outcome.failed).toBe(true);
    expect(outcome.note).toMatch(/Its mail could not be sent/);
    expect(captureError).toHaveBeenCalled();
  });
});

describe("no configuration tagged", () => {
  it("★ rings and mails: every Pro switch is refused", async () => {
    stripe.configurations = [
      { id: "bpc_default", active: true, metadata: {}, features: {} },
    ];
    const outcome = await runChangePlanWatch({ now: NOW });
    expect(outcome.stored).toEqual({ state: "no_configuration" });
    expect(outcome.attention).toBe(true);
    expect(outcome.note).toMatch(/no active configuration carries/);
    expect(sendOnce).toHaveBeenCalledWith(
      expect.objectContaining({
        dedupeKey: "change_plan:no_configuration:2026-10-06",
      }),
    );
  });
});

describe("a check that could not run", () => {
  it("★ fails the run with Stripe's words, mails nobody and never reads as whole", async () => {
    stripe.listFails = true;
    const outcome = await runChangePlanWatch({ now: NOW });
    expect(outcome.stored).toEqual({
      state: "unread",
      message: "Stripe is unreachable",
    });
    expect(outcome.failed).toBe(true);
    expect(outcome.attention).toBe(false);
    expect(outcome.note).toBe(
      "Change plan in Stripe: no reading (Stripe is unreachable).",
    );
    expect(sendOnce).not.toHaveBeenCalled();
  });
});
