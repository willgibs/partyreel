/**
 * MRR COUNTS EVERY ACTIVE SUBSCRIPTION (the 1,000-row round, Will 2026-09-23: "Let's ensure we will
 * not face any of those issues here").
 *
 * The read used `autoPagingToArray({ limit: 1000 })`, which stopped at the thousandth subscription and
 * reported the first thousand's MRR as the whole. It walks the list with `for await` now, which follows
 * Stripe's pages to the last one. Against a stubbed Stripe client whose list pages 100 at a time, with
 * 2,500 active subscriptions: every one counts; and the read stays best-effort (a failure is null).
 */
import type Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/observability/sentry", () => ({ captureWarning: () => {} }));

let subscriptions: Stripe.Subscription[] = [];
let pagesRead = 0;
let listArgs: unknown = null;
let failList = false;

/** Stripe's list: an async iterable that fetches a hundred at a time, as the SDK's auto-pager does. */
function list(args: unknown): AsyncIterable<Stripe.Subscription> {
  listArgs = args;
  return {
    async *[Symbol.asyncIterator]() {
      if (failList) throw new Error("stripe is down");
      for (let start = 0; start < subscriptions.length; start += 100) {
        pagesRead += 1;
        yield* subscriptions.slice(start, start + 100);
      }
    },
  };
}

vi.mock("@/lib/stripe/client", () => ({
  getStripe: () => ({
    subscriptions: { list },
    balance: {
      retrieve: async () => ({
        available: [{ amount: 12_345, currency: "usd" }],
        pending: [{ amount: 678, currency: "usd" }],
      }),
    },
  }),
}));

const { getPlatformRevenue } = await import("@/lib/stripe/revenue");

function monthly(cents: number): Stripe.Subscription {
  return {
    currency: "usd",
    items: {
      data: [
        {
          quantity: 1,
          price: { unit_amount: cents, recurring: { interval: "month" } },
        },
      ],
    },
  } as unknown as Stripe.Subscription;
}

describe("getPlatformRevenue", () => {
  it("★ counts all 2,500 active subscriptions, past the old 1,000 cap", async () => {
    subscriptions = Array.from({ length: 2500 }, () => monthly(900));
    pagesRead = 0;

    const revenue = await getPlatformRevenue();

    expect(revenue).toEqual({
      mrrCents: 2500 * 900,
      activeSubscriptions: 2500,
      availableCents: 12_345,
      pendingCents: 678,
      currency: "usd",
    });
    expect(pagesRead).toBe(25);
    expect(listArgs).toMatchObject({ status: "active", limit: 100 });
  });

  it("stays best-effort: a failed read is null, never a broken page", async () => {
    failList = true;
    await expect(getPlatformRevenue()).resolves.toBeNull();
    failList = false;
  });
});
