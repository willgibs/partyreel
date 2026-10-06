/**
 * ★ WHEN THE PLAN CARD SAYS HER CREDITED PRO IS ON ITS WAY (billing-orphans): only between the conversion of her passes
 * into Pro credit and the subscription event that writes her plan, within Stripe's retry window, and never once a Pro
 * plan landed after it.
 */
import { describe, expect, it } from "vitest";

import {
  PRO_PENDING_WINDOW_MS,
  proPendingSince,
} from "@/lib/billing/pro-pending";

const NOW = Date.parse("2026-10-06T12:00:00.000Z");
const MIN = 60_000;
const at = (ms: number) => new Date(ms).toISOString();
const converted = (
  agoMs: number,
  over: Partial<{
    converted_count: number | null;
    released_at: string | null;
  }> = {},
) => ({
  converted_at: at(NOW - agoMs),
  converted_count: 2,
  released_at: null,
  ...over,
});

describe("her Pro on its way", () => {
  it("★ is pending from the conversion until a subscription event writes her plan, on a pass's label or Free's", () => {
    for (const tier of ["event_pass", "free"]) {
      expect(
        proPendingSince({
          tier,
          stripeEventCreatedAt: null,
          conversion: converted(MIN),
          nowMs: NOW,
        }),
      ).toBe(at(NOW - MIN));
      // An older subscription event (a Pro she had before) does not end it.
      expect(
        proPendingSince({
          tier,
          stripeEventCreatedAt: at(NOW - 30 * 24 * 60 * MIN),
          conversion: converted(5 * MIN),
          nowMs: NOW,
        }),
      ).toBe(at(NOW - 5 * MIN));
    }
  });

  it("★ ends when Pro lands, or once a later subscription event wrote her plan (a Pro that landed and ended since)", () => {
    expect(
      proPendingSince({
        tier: "pro",
        stripeEventCreatedAt: null,
        conversion: converted(MIN),
        nowMs: NOW,
      }),
    ).toBeNull();
    expect(
      proPendingSince({
        tier: "free",
        stripeEventCreatedAt: at(NOW - 30_000),
        conversion: converted(MIN),
        nowMs: NOW,
      }),
    ).toBeNull();
  });

  it("is never a released claim, a conversion of none, or one past Stripe's three days of retries", () => {
    const base = { tier: "event_pass", stripeEventCreatedAt: null, nowMs: NOW };
    expect(proPendingSince({ ...base, conversion: null })).toBeNull();
    expect(
      proPendingSince({
        ...base,
        conversion: converted(MIN, { released_at: at(NOW) }),
      }),
    ).toBeNull();
    expect(
      proPendingSince({
        ...base,
        conversion: converted(MIN, { converted_count: 0 }),
      }),
    ).toBeNull();
    expect(
      proPendingSince({
        ...base,
        conversion: converted(MIN, { converted_count: null }),
      }),
    ).toBeNull();
    expect(
      proPendingSince({
        ...base,
        conversion: converted(PRO_PENDING_WINDOW_MS + MIN),
      }),
    ).toBeNull();
    expect(
      proPendingSince({
        ...base,
        conversion: converted(PRO_PENDING_WINDOW_MS - MIN),
      }),
    ).not.toBeNull();
    expect(PRO_PENDING_WINDOW_MS).toBe(3 * 24 * 60 * MIN);
  });
});
