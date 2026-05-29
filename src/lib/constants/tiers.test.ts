import { describe, expect, it } from "vitest";

import {
  BILLING_TIERS,
  DEFAULT_STORAGE_CAP_BYTES,
  GIGABYTE,
  MAX_EVENTS,
  MONTHLY_INGRESS_BYTES,
  PLAN_IDS,
  PLANS,
  TERABYTE,
  effectiveStorageCap,
  friendlyCapacity,
  isSettingLocked,
  planById,
  plansForTier,
  toBillingTier,
  withinLimit,
  withinStorage,
} from "@/lib/constants/tiers";

describe("withinLimit (event-count wall)", () => {
  it("treats a null limit as unlimited", () => {
    expect(withinLimit(999_999, null)).toBe(true);
  });
  it("is true below the cap, false at/over it", () => {
    expect(withinLimit(0, 1)).toBe(true);
    expect(withinLimit(1, 1)).toBe(false);
    expect(withinLimit(2, 1)).toBe(false);
  });
});

describe("withinStorage", () => {
  it("null cap = unlimited", () => {
    expect(withinStorage(5 * TERABYTE, null)).toBe(true);
  });
  it("true at/under the cap, false over it", () => {
    expect(withinStorage(2 * GIGABYTE, 2 * GIGABYTE)).toBe(true);
    expect(withinStorage(2 * GIGABYTE + 1, 2 * GIGABYTE)).toBe(false);
  });
});

describe("PLANS integrity", () => {
  it("has exactly one plan per declared id", () => {
    expect(PLANS.map((p) => p.id).sort()).toEqual([...PLAN_IDS].sort());
  });
  it("paid plans carry a Stripe Price env key; Free does not", () => {
    for (const p of PLANS) {
      if (p.billing === "free") expect(p.stripePriceEnvKey).toBeUndefined();
      else expect(p.stripePriceEnvKey).toBeTruthy();
    }
  });
  it("only the Event Pass has a fixed term", () => {
    expect(planById("event_pass").termDays).toBe(365);
    expect(planById("pro_100").termDays).toBeUndefined();
  });
  it("plansForTier returns the three Pro storage options", () => {
    expect(plansForTier("pro").map((p) => p.id)).toEqual([
      "pro_100",
      "pro_500",
      "pro_2tb",
    ]);
  });
});

// These numbers MUST mirror public.tier_limits() (DB enforcement). If you change a
// value here, change the SQL fn too (migration) — that is the hand-kept lockstep.
describe("tier limits ↔ tier_limits() parity", () => {
  it("covers every billing tier", () => {
    for (const t of BILLING_TIERS) {
      expect(MAX_EVENTS[t]).toBeDefined();
      expect(MONTHLY_INGRESS_BYTES[t]).toBeDefined();
      expect(DEFAULT_STORAGE_CAP_BYTES[t]).toBeDefined();
    }
  });
  it("free: 1 event, 20 GB ingress, 2 GB cap", () => {
    expect(MAX_EVENTS.free).toBe(1);
    expect(MONTHLY_INGRESS_BYTES.free).toBe(20 * GIGABYTE);
    expect(DEFAULT_STORAGE_CAP_BYTES.free).toBe(2 * GIGABYTE);
  });
  it("pro: unlimited events + unmetered + profile-governed cap", () => {
    expect(MAX_EVENTS.pro).toBeNull();
    expect(MONTHLY_INGRESS_BYTES.pro).toBeNull();
    expect(DEFAULT_STORAGE_CAP_BYTES.pro).toBeNull();
  });
  it("event_pass: 1 event, unmetered, 75 GB cap", () => {
    expect(MAX_EVENTS.event_pass).toBe(1);
    expect(MONTHLY_INGRESS_BYTES.event_pass).toBeNull();
    expect(DEFAULT_STORAGE_CAP_BYTES.event_pass).toBe(75 * GIGABYTE);
  });
});

describe("effectiveStorageCap", () => {
  it("falls back to the tier default when no explicit cap", () => {
    expect(effectiveStorageCap("free", null)).toBe(2 * GIGABYTE);
    expect(effectiveStorageCap("event_pass", null)).toBe(75 * GIGABYTE);
  });
  it("an explicit cap wins (the Pro storage selector)", () => {
    expect(effectiveStorageCap("pro", 500 * GIGABYTE)).toBe(500 * GIGABYTE);
    expect(effectiveStorageCap("pro", null)).toBeNull();
  });
});

describe("toBillingTier (DB tier_type → billing Tier)", () => {
  it("folds the retired max into pro", () => {
    expect(toBillingTier("max")).toBe("pro");
  });
  it("passes through known tiers, defaults unknown to free", () => {
    expect(toBillingTier("pro")).toBe("pro");
    expect(toBillingTier("event_pass")).toBe("event_pass");
    expect(toBillingTier("free")).toBe("free");
    expect(toBillingTier("bogus")).toBe("free");
  });
});

describe("isSettingLocked (tier-gated event settings)", () => {
  it("locks require_email on Free, unlocks on paid tiers", () => {
    expect(isSettingLocked("require_email", "free")).toBe(true);
    expect(isSettingLocked("require_email", "pro")).toBe(false);
    expect(isSettingLocked("require_email", "event_pass")).toBe(false);
  });
});

describe("friendlyCapacity", () => {
  it("translates a byte cap into approximate photo/video counts", () => {
    const twoGb = friendlyCapacity(2 * GIGABYTE);
    expect(twoGb.photos).toBeGreaterThan(0);
    expect(twoGb.videoMinutes).toBeGreaterThan(0);
    // Bigger cap => strictly more capacity.
    expect(friendlyCapacity(100 * GIGABYTE).photos).toBeGreaterThan(
      twoGb.photos,
    );
  });
});
