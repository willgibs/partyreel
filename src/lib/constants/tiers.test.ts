import { describe, expect, it } from "vitest";

import {
  BILLING_TIERS,
  DEFAULT_STORAGE_CAP_BYTES,
  GATED_EVENT_SETTINGS,
  GIGABYTE,
  INGRESS_CAP_MULTIPLIER,
  MAX_EVENTS,
  MAX_REEL_SECONDS,
  MONTHLY_INGRESS_BYTES,
  PLAN_IDS,
  PLANS,
  TERABYTE,
  clampReelSeconds,
  effectiveStorageCap,
  friendlyCapacity,
  isSettingLocked,
  monthlyIngressCap,
  planById,
  plansForTier,
  toBillingTier,
  videosAllowedForTier,
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
      expect(MAX_REEL_SECONDS[t]).toBeGreaterThan(0);
    }
  });
  it("free: 1 event, 20 GB static ingress, 2 GB cap", () => {
    expect(MAX_EVENTS.free).toBe(1);
    expect(MONTHLY_INGRESS_BYTES.free).toBe(20 * GIGABYTE);
    expect(DEFAULT_STORAGE_CAP_BYTES.free).toBe(2 * GIGABYTE);
  });
  it("pro: unlimited events + derived ingress + profile-governed cap", () => {
    expect(MAX_EVENTS.pro).toBeNull();
    expect(MONTHLY_INGRESS_BYTES.pro).toBeNull(); // null = derived, not unmetered (ADR-0021)
    expect(DEFAULT_STORAGE_CAP_BYTES.pro).toBeNull();
  });
  it("event_pass: 1 event, derived ingress, 75 GB cap", () => {
    expect(MAX_EVENTS.event_pass).toBe(1);
    expect(MONTHLY_INGRESS_BYTES.event_pass).toBeNull(); // null = derived (ADR-0021)
    expect(DEFAULT_STORAGE_CAP_BYTES.event_pass).toBe(75 * GIGABYTE);
  });
  it("reel length caps: Free 30s, Pro + Event Pass 60s (ADR-0021)", () => {
    expect(MAX_REEL_SECONDS.free).toBe(30);
    expect(MAX_REEL_SECONDS.pro).toBe(60);
    expect(MAX_REEL_SECONDS.event_pass).toBe(60);
  });
  it("paid ingress multiplier is 3x the effective storage cap (ADR-0021)", () => {
    expect(INGRESS_CAP_MULTIPLIER).toBe(3);
  });
});

describe("monthlyIngressCap (ADR-0021 ingress derivation)", () => {
  it("free: the static 20 GB, regardless of any cap on the profile", () => {
    expect(monthlyIngressCap("free", null)).toBe(20 * GIGABYTE);
    expect(monthlyIngressCap("free", 100 * GIGABYTE)).toBe(20 * GIGABYTE);
  });
  it("pro: 3x the purchased cap (each Pro size scales its own bound)", () => {
    expect(monthlyIngressCap("pro", 100 * GIGABYTE)).toBe(300 * GIGABYTE);
    expect(monthlyIngressCap("pro", 500 * GIGABYTE)).toBe(1500 * GIGABYTE);
    expect(monthlyIngressCap("pro", 2 * TERABYTE)).toBe(6 * TERABYTE);
  });
  it("event_pass: 3x the 75 GB default = 225 GB", () => {
    expect(monthlyIngressCap("event_pass", null)).toBe(225 * GIGABYTE);
  });
  it("pro with no cap on record fails OPEN (unmetered), never blocks", () => {
    expect(monthlyIngressCap("pro", null)).toBeNull();
  });
});

describe("clampReelSeconds (ADR-0021 length clamp)", () => {
  it("Auto (null/0/negative) fills up to the tier cap", () => {
    expect(clampReelSeconds("free", null)).toBe(30);
    expect(clampReelSeconds("free", 0)).toBe(30);
    expect(clampReelSeconds("free", -5)).toBe(30);
    expect(clampReelSeconds("pro", null)).toBe(60);
    expect(clampReelSeconds("event_pass", undefined)).toBe(60);
  });
  it("an explicit length under the cap passes through", () => {
    expect(clampReelSeconds("free", 15)).toBe(15);
    expect(clampReelSeconds("free", 30)).toBe(30);
    expect(clampReelSeconds("pro", 60)).toBe(60);
  });
  it("an explicit length over the cap clamps down (downgraded host's stored 60)", () => {
    expect(clampReelSeconds("free", 60)).toBe(30);
    expect(clampReelSeconds("pro", 600)).toBe(60);
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
  it("does NOT gate allow_anonymous_uploads (free + default-on, opt-in anon)", () => {
    // Require-accounts is no longer a Pro feature, so it isn't in GATED_EVENT_SETTINGS.
    expect([...GATED_EVENT_SETTINGS]).not.toContain("allow_anonymous_uploads");
  });
  it("locks password on Free, unlocks on paid tiers", () => {
    expect(isSettingLocked("password", "free")).toBe(true);
    expect(isSettingLocked("password", "pro")).toBe(false);
    expect(isSettingLocked("password", "event_pass")).toBe(false);
  });
  it("locks custom_slug on Free, unlocks on paid tiers", () => {
    expect(isSettingLocked("custom_slug", "free")).toBe(true);
    expect(isSettingLocked("custom_slug", "pro")).toBe(false);
    expect(isSettingLocked("custom_slug", "event_pass")).toBe(false);
  });
  it("GATED_EVENT_SETTINGS lists the tier-gated keys", () => {
    expect([...GATED_EVENT_SETTINGS]).toEqual(["password", "custom_slug"]);
  });
});

describe("videosAllowedForTier (Phase 2 video Pro-gate)", () => {
  it("blocks video on Free, allows it on paid tiers", () => {
    expect(videosAllowedForTier("free")).toBe(false);
    expect(videosAllowedForTier("pro")).toBe(true);
    expect(videosAllowedForTier("event_pass")).toBe(true);
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
