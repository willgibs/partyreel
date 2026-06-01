import type Stripe from "stripe";
import { describe, expect, it } from "vitest";

import { computeMrrCents } from "@/lib/stripe/mrr";

// Build a minimal subscription with just the fields computeMrrCents reads (price + quantity).
function sub(
  items: {
    unit_amount: number | null;
    interval?: "day" | "week" | "month" | "year";
    quantity?: number;
  }[],
): Stripe.Subscription {
  return {
    items: {
      data: items.map((i) => ({
        quantity: i.quantity,
        price: {
          unit_amount: i.unit_amount,
          recurring: i.interval ? { interval: i.interval } : null,
        },
      })),
    },
  } as unknown as Stripe.Subscription;
}

describe("computeMrrCents", () => {
  it("sums monthly prices x quantity across subscriptions", () => {
    expect(
      computeMrrCents([
        sub([{ unit_amount: 900, interval: "month" }]),
        sub([{ unit_amount: 1900, interval: "month", quantity: 2 }]),
      ]),
    ).toBe(900 + 3800);
  });

  it("normalizes a yearly price to monthly (/12)", () => {
    expect(
      computeMrrCents([sub([{ unit_amount: 12000, interval: "year" }])]),
    ).toBe(1000);
  });

  it("normalizes a weekly price to monthly (x52/12)", () => {
    expect(
      computeMrrCents([sub([{ unit_amount: 100, interval: "week" }])]),
    ).toBe(Math.round((100 * 52) / 12));
  });

  it("skips one-time items (no recurring) and null unit_amount", () => {
    expect(
      computeMrrCents([
        sub([{ unit_amount: 2400 }]), // Event Pass: one-time, no interval
        sub([{ unit_amount: null, interval: "month" }]), // metered
      ]),
    ).toBe(0);
  });

  it("is zero on an empty list", () => {
    expect(computeMrrCents([])).toBe(0);
  });
});
