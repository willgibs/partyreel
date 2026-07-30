import { describe, expect, it } from "vitest";

import { resolveEntitlement } from "@/lib/stripe/entitlement";

// ADR-0023 ruling 1 (one plan at a time) lives or dies on this function: the checkout route is a
// thin gate over it, so every way it could answer "none" for a host who actually holds a plan is a
// way back into QA #3 (a second Pro subscription, or an Event Pass collapsing a 2 TB cap to 75 GB
// while Stripe keeps billing Pro, feeding the over-capacity sweep customer media to delete).
const NOW = new Date("2026-07-29T12:00:00.000Z");
const FUTURE = "2027-01-01T00:00:00.000Z";
const PAST = "2026-01-01T00:00:00.000Z";

describe("resolveEntitlement", () => {
  it("reports no plan for a Free host, a missing profile, and a missing tier", () => {
    expect(
      resolveEntitlement({ tier: "free", tier_expires_at: null }, NOW),
    ).toEqual({ held: "none", expiresAt: null });
    expect(resolveEntitlement(null, NOW).held).toBe("none");
    expect(resolveEntitlement(undefined, NOW).held).toBe("none");
    expect(
      resolveEntitlement({ tier: null, tier_expires_at: null }, NOW).held,
    ).toBe("none");
  });

  it("holds Pro for an active subscriber, and for the retired `max` tier value", () => {
    expect(
      resolveEntitlement({ tier: "pro", tier_expires_at: null }, NOW),
    ).toEqual({
      held: "pro",
      expiresAt: null,
    });
    // tier_type still carries a retired `max`; toBillingTier folds it into pro. A `max` host who
    // could still buy would be the exact stacking bug, so this is not cosmetic.
    expect(
      resolveEntitlement({ tier: "max", tier_expires_at: null }, NOW).held,
    ).toBe("pro");
  });

  it("holds an Event Pass only while it is UNEXPIRED, and carries its expiry", () => {
    expect(
      resolveEntitlement({ tier: "event_pass", tier_expires_at: FUTURE }, NOW),
    ).toEqual({ held: "event_pass", expiresAt: FUTURE });
    // Lapsed but not yet swept: sweepExpiredPasses runs nightly, so the label outlives the pass by
    // up to a day. The timestamp wins, and the host can buy again immediately.
    expect(
      resolveEntitlement({ tier: "event_pass", tier_expires_at: PAST }, NOW)
        .held,
    ).toBe("none");
  });

  it("treats the exact expiry instant as ended (no dead zone at the boundary)", () => {
    expect(
      resolveEntitlement(
        { tier: "event_pass", tier_expires_at: NOW.toISOString() },
        NOW,
      ).held,
    ).toBe("none");
  });

  it("fails toward letting the customer buy on unusable data", () => {
    // A malformed or absent expiry must never lock a host out of purchasing. The webhook is the
    // only writer of these columns, so bad data here is our bug, and the host should not pay for it.
    expect(
      resolveEntitlement(
        { tier: "event_pass", tier_expires_at: "not-a-date" },
        NOW,
      ).held,
    ).toBe("none");
    expect(
      resolveEntitlement({ tier: "event_pass", tier_expires_at: null }, NOW)
        .held,
    ).toBe("none");
    // An unknown tier string coerces to free rather than throwing.
    expect(
      resolveEntitlement({ tier: "enterprise", tier_expires_at: null }, NOW)
        .held,
    ).toBe("none");
  });
});
