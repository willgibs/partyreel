import { describe, expect, it } from "vitest";

import {
  AVG_PHOTO_BYTES,
  BILLING_TIERS,
  DEFAULT_STORAGE_CAP_BYTES,
  ESTIMATE_BASIS,
  ESTIMATE_BASIS_NOTE,
  GATED_EVENT_SETTINGS,
  GIGABYTE,
  INGRESS_CAP_MULTIPLIER,
  MAX_EVENTS,
  MAX_REEL_SECONDS,
  MEGABYTE,
  MONTHLY_INGRESS_BYTES,
  PLAN_IDS,
  PLANS,
  TERABYTE,
  VIDEO_BYTES_PER_MIN,
  clampReelSeconds,
  effectiveStorageCap,
  formatCapacity,
  friendlyCapacity,
  isSettingLocked,
  monthlyIngressCap,
  annualPlanFor,
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
  it("plansForTier('pro','year') returns the three annual siblings", () => {
    expect(plansForTier("pro", "year").map((p) => p.id)).toEqual([
      "pro_100_yr",
      "pro_500_yr",
      "pro_2tb_yr",
    ]);
  });
  // The annual ruling (Will, 2026-08-27): a year costs exactly TEN months
  // ("two months free"), and the pair can only move together. Parsed off the
  // display labels because the labels ARE the marketed numbers.
  it("every annual Pro price is exactly 10x its monthly sibling", () => {
    for (const monthly of plansForTier("pro")) {
      const yearly = annualPlanFor(monthly.id);
      expect(yearly, `${monthly.id} has an annual sibling`).not.toBeNull();
      const m = Number(monthly.priceLabel.match(/\$(\d+)/)?.[1]);
      const y = Number(yearly!.priceLabel.match(/\$(\d+)/)?.[1]);
      expect(y).toBe(m * 10);
      expect(yearly!.storageBytes).toBe(monthly.storageBytes);
      expect(yearly!.interval).toBe("year");
    }
  });
  it("annualPlanFor is null off the monthly Pro plans", () => {
    expect(annualPlanFor("free")).toBeNull();
    expect(annualPlanFor("event_pass")).toBeNull();
    expect(annualPlanFor("pro_100_yr")).toBeNull();
  });
});

// LITERAL PINS, not the parity guard. This block only re-states the TS constants, so it can
// never detect drift against the SQL — QA #25 found it masquerading as the tiers.ts ↔
// tier_limits() drift guard the docs point at. The REAL guard parses the committed migration:
// tier-limits-parity.test.ts. These pins still earn their keep for a different reason: marketed
// numbers are sticky (grandfathering), so changing one in lockstep across BOTH sides should still
// require deliberately editing a test that names the old value.
describe("tier limit literals (marketed-number pins)", () => {
  it("covers every billing tier", () => {
    for (const t of BILLING_TIERS) {
      expect(MAX_EVENTS[t]).toBeDefined();
      expect(MONTHLY_INGRESS_BYTES[t]).toBeDefined();
      expect(DEFAULT_STORAGE_CAP_BYTES[t]).toBeDefined();
      expect(MAX_REEL_SECONDS[t]).toBeGreaterThan(0);
    }
  });
  // The free/pro shift (Will, 2026-09-28) moved this pin from 2 GB and a flat 20 GB meter: Free
  // is 100 MB now, and its meter follows the paid rule (derived, 3x the cap).
  it("free: 1 event, derived ingress, 100 MB cap", () => {
    expect(MAX_EVENTS.free).toBe(1);
    expect(MONTHLY_INGRESS_BYTES.free).toBeNull(); // null = derived, like every paid tier
    expect(DEFAULT_STORAGE_CAP_BYTES.free).toBe(100 * MEGABYTE);
    expect(planById("free").storageBytes).toBe(100 * MEGABYTE);
  });
  it("pro: unlimited events + derived ingress + profile-governed cap", () => {
    expect(MAX_EVENTS.pro).toBeNull();
    expect(MONTHLY_INGRESS_BYTES.pro).toBeNull(); // null = derived, not unmetered (billing-caps.md)
    expect(DEFAULT_STORAGE_CAP_BYTES.pro).toBeNull();
  });
  it("event_pass: 1 event, derived ingress, 75 GB cap", () => {
    expect(MAX_EVENTS.event_pass).toBe(1);
    expect(MONTHLY_INGRESS_BYTES.event_pass).toBeNull(); // null = derived (billing-caps.md)
    expect(DEFAULT_STORAGE_CAP_BYTES.event_pass).toBe(75 * GIGABYTE);
  });
  // Free was 30 until the free/pro shift: a clip's length stopped being a paid line.
  it("clip length caps: 60s on every tier (billing-caps.md)", () => {
    expect(MAX_REEL_SECONDS.free).toBe(60);
    expect(MAX_REEL_SECONDS.pro).toBe(60);
    expect(MAX_REEL_SECONDS.event_pass).toBe(60);
  });
  it("the ingress multiplier is 3x the effective storage cap, every tier (billing-caps.md)", () => {
    expect(INGRESS_CAP_MULTIPLIER).toBe(3);
  });
});

describe("monthlyIngressCap (billing-caps.md ingress derivation)", () => {
  // Reshaped with the free/pro shift: Free's bound was a flat 20 GB whatever its cap; it follows
  // the paid rule now, so the 2 GB -> 100 MB cut tightened the churn bound with it.
  it("free: 3x its 100 MB default = 300 MB, the paid rule", () => {
    expect(monthlyIngressCap("free", null)).toBe(300 * MEGABYTE);
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

describe("clampReelSeconds (billing-caps.md length clamp)", () => {
  it("Auto (null/0/negative) fills up to the tier cap", () => {
    expect(clampReelSeconds("free", null)).toBe(60);
    expect(clampReelSeconds("free", 0)).toBe(60);
    expect(clampReelSeconds("free", -5)).toBe(60);
    expect(clampReelSeconds("pro", null)).toBe(60);
    expect(clampReelSeconds("event_pass", undefined)).toBe(60);
  });
  it("an explicit length under the cap passes through", () => {
    expect(clampReelSeconds("free", 15)).toBe(15);
    expect(clampReelSeconds("free", 30)).toBe(30);
    expect(clampReelSeconds("pro", 60)).toBe(60);
  });
  it("an explicit length over the cap clamps down (a crafted or stale stored length)", () => {
    expect(clampReelSeconds("free", 90)).toBe(60);
    expect(clampReelSeconds("pro", 600)).toBe(60);
  });
});

describe("effectiveStorageCap", () => {
  it("falls back to the tier default when no explicit cap", () => {
    expect(effectiveStorageCap("free", null)).toBe(100 * MEGABYTE);
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
  it("does NOT gate the door's safety switches (free on every tier)", () => {
    // Require verified emails (on by default) and Require an upload to view are safety, and
    // gating either would put safety behind a paywall, so neither belongs in
    // GATED_EVENT_SETTINGS.
    expect([...GATED_EVENT_SETTINGS]).not.toContain("require_verified_email");
    expect([...GATED_EVENT_SETTINGS]).not.toContain("require_upload_to_view");
  });
  // The free/pro shift (Will, 2026-09-28) emptied the list: the password and the custom link
  // are on every plan. These pinned the two locks on Free until then; they pin their absence now.
  it("locks nothing on any tier: the password and the custom link are on every plan", () => {
    for (const tier of BILLING_TIERS) {
      expect(isSettingLocked("password", tier)).toBe(false);
      expect(isSettingLocked("custom_slug", tier)).toBe(false);
    }
  });
  it("GATED_EVENT_SETTINGS is empty (video is the one lock, and it is not a setting)", () => {
    expect([...GATED_EVENT_SETTINGS]).toEqual([]);
  });
});

describe("videosAllowedForTier (Phase 2 video Pro-gate)", () => {
  it("blocks video on Free, allows it on paid tiers", () => {
    expect(videosAllowedForTier("free")).toBe(false);
    expect(videosAllowedForTier("pro")).toBe(true);
    expect(videosAllowedForTier("event_pass")).toBe(true);
  });
});

describe("the estimates (an iPhone at its defaults, host-storage r2)", () => {
  it("weigh a photo and a minute of video at Apple's own figures", () => {
    // A 24 MP HEIF between Apple's 12 MP and 48 MP brackets, and Record Video's 1080p at 30 fps
    // line. Binary megabytes, so each prints as Apple's number (tiers.ts carries the sources).
    expect(AVG_PHOTO_BYTES).toBe(3.5 * MEGABYTE);
    expect(VIDEO_BYTES_PER_MIN).toBe(65 * MEGABYTE);
  });
  it("puts Free at about thirty photos, the manifest's own sizing", () => {
    expect(friendlyCapacity(planById("free").storageBytes).photos).toBe(29);
  });
  it("says its basis, and its working where there is room", () => {
    expect(ESTIMATE_BASIS).toBe("at an iPhone's default camera settings");
    expect(ESTIMATE_BASIS_NOTE).toBe(
      "Estimates are at an iPhone's default camera settings: about 3.5 MB a photo (24 MP) and 65 MB a minute of video (1080p at 30 fps).",
    );
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

describe("formatCapacity", () => {
  it("renders photos only when video is off (the Free tier's photos-only truth)", () => {
    expect(
      formatCapacity(planById("free").storageBytes, {
        video: false,
        basis: false,
      }),
    ).toBe("29 photos");
  });
  it("switches from minutes to hours at 120 minutes, with en-US thousands separators", () => {
    expect(
      formatCapacity(planById("event_pass").storageBytes, { basis: false }),
    ).toBe("21,943 photos or 20 hours of video");
    expect(formatCapacity(GIGABYTE, { basis: false })).toBe(
      "293 photos or 16 minutes of video",
    );
  });
  it("carries its basis unless the surface says it already", () => {
    // The round's point: an estimate with no camera behind it is a random claim.
    expect(
      formatCapacity(planById("free").storageBytes, { video: false }),
    ).toBe("29 photos at an iPhone's default camera settings");
    expect(formatCapacity(planById("pro_100").storageBytes)).toBe(
      "29,257 photos or 26 hours of video at an iPhone's default camera settings",
    );
  });
});
