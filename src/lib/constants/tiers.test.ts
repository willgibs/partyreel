import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AVG_PHOTO_BYTES,
  BIG_PARTY,
  BIG_PARTY_BYTES,
  BIG_PARTY_NOTE,
  BILLING_TIERS,
  DEFAULT_STORAGE_CAP_BYTES,
  ESTIMATE_BASIS,
  ESTIMATE_BASIS_NOTE,
  EVENT_PASS_RENEWAL_PRICE_LABEL,
  GATED_EVENT_SETTINGS,
  GIGABYTE,
  MAX_EVENTS,
  MAX_REEL_SECONDS,
  MEGABYTE,
  PLAN_IDS,
  PLANS,
  TERABYTE,
  UPLOADS_BYTES,
  UPLOADS_WINDOW,
  VIDEO_BYTES_PER_MIN,
  clampReelSeconds,
  effectiveStorageCap,
  formatCapacity,
  formatLimit,
  friendlyCapacity,
  isSettingLocked,
  annualPlanFor,
  partiesHeld,
  planById,
  plansForTier,
  toBillingTier,
  uploadAllowance,
  uploadsLabel,
  uploadsPhrase,
  videosAllowedForTier,
  withinLimit,
  withinStorage,
} from "@/lib/constants/tiers";
import { runAsGermanNumberRuntime } from "@/lib/test-utils/german-runtime";

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
    expect(planById("pro_50").termDays).toBeUndefined();
  });
  it("plansForTier returns the three Pro storage options, smallest first", () => {
    expect(plansForTier("pro").map((p) => p.id)).toEqual([
      "pro_50",
      "pro_200",
      "pro_1tb",
    ]);
  });
  it("plansForTier('pro','year') returns the three annual siblings", () => {
    expect(plansForTier("pro", "year").map((p) => p.id)).toEqual([
      "pro_50_yr",
      "pro_200_yr",
      "pro_1tb_yr",
    ]);
  });
  // A plan id and its env key name its SIZE (pricing-wiring: "pro_100" holding 50 GB would lie to every
  // reader of a log, a test or the Stripe metadata), so an id can be read for the room it sells.
  it("names every Pro plan and its price env key by its size", () => {
    for (const plan of [...plansForTier("pro"), ...plansForTier("pro", "year")]) {
      const size = plan.name.replace("Pro ", "").replace(" ", "").toLowerCase();
      expect(plan.id.replace("_yr", "")).toBe(`pro_${size.replace("gb", "")}`);
      expect(plan.stripePriceEnvKey).toBe(
        `STRIPE_PRICE_${plan.id.toUpperCase()}`,
      );
    }
  });
  it("labels every Pro size and the pass by its use, the yearly sibling as its month", () => {
    for (const monthly of plansForTier("pro")) {
      expect(monthly.use, monthly.id).toBeTruthy();
      expect(annualPlanFor(monthly.id)?.use).toBe(monthly.use);
    }
    expect(planById("event_pass").use).toBeTruthy();
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
    expect(annualPlanFor("pro_50_yr")).toBeNull();
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
      expect(UPLOADS_BYTES[t]).toBeDefined();
      expect(UPLOADS_WINDOW[t]).toBeDefined();
      expect(DEFAULT_STORAGE_CAP_BYTES[t]).toBeDefined();
      expect(MAX_REEL_SECONDS[t]).toBeGreaterThan(0);
    }
  });
  // The free/pro shift (Will, 2026-09-28) moved this pin from 2 GB: Free is 100 MB. Ladder A
  // (Will, 2026-10-03) publishes its uploads, 300 MB a month (the number the multiplier made).
  it("free: 1 event, 100 MB, 300 MB of uploads a month", () => {
    expect(MAX_EVENTS.free).toBe(1);
    expect(DEFAULT_STORAGE_CAP_BYTES.free).toBe(100 * MEGABYTE);
    expect(planById("free").storageBytes).toBe(100 * MEGABYTE);
    expect(UPLOADS_BYTES.free).toBe(300 * MEGABYTE);
    expect(UPLOADS_WINDOW.free).toBe("month");
  });
  it("pro: unlimited events, its room and its uploads its size's, never a tier default", () => {
    expect(MAX_EVENTS.pro).toBeNull();
    expect(DEFAULT_STORAGE_CAP_BYTES.pro).toBeNull();
    expect(UPLOADS_BYTES.pro).toBeNull(); // null = its size's (uploadAllowance), not unmetered
    expect(UPLOADS_WINDOW.pro).toBe("month");
  });
  // Ladder A moved the pass from 75 GB at $24 (renewal $15) to 25 GB at $29 (renewal $19), its
  // uploads counted over its own year.
  it("event_pass: 1 event, 25 GB, 50 GB of uploads over its year, $29 once, $19 to renew", () => {
    expect(MAX_EVENTS.event_pass).toBe(1);
    expect(DEFAULT_STORAGE_CAP_BYTES.event_pass).toBe(25 * GIGABYTE);
    expect(UPLOADS_BYTES.event_pass).toBe(50 * GIGABYTE);
    expect(UPLOADS_WINDOW.event_pass).toBe("year");
    expect(planById("event_pass").priceLabel).toBe("$29 one-time");
    expect(EVENT_PASS_RENEWAL_PRICE_LABEL).toBe("$19");
  });
  // Ladder A's Pro steps (Will, "send it on pricing tier A with $99"): 50 GB / 200 GB / 1 TB at $9 /
  // $29 / $99 a month, with 100 / 200 / 500 GB of uploads a month. The retired steps were 100 GB /
  // 500 GB / 2 TB at $9 / $19 / $39, uploads unpublished at 3x the room.
  it("pro: Ladder A's three sizes, their prices and their uploads", () => {
    expect(
      plansForTier("pro").map((p) => [
        p.name,
        p.storageBytes,
        p.uploadsBytes,
        p.priceLabel,
      ]),
    ).toEqual([
      ["Pro 50 GB", 50 * GIGABYTE, 100 * GIGABYTE, "$9/mo"],
      ["Pro 200 GB", 200 * GIGABYTE, 200 * GIGABYTE, "$29/mo"],
      ["Pro 1 TB", TERABYTE, 500 * GIGABYTE, "$99/mo"],
    ]);
    expect(plansForTier("pro", "year").map((p) => p.priceLabel)).toEqual([
      "$90/yr",
      "$290/yr",
      "$990/yr",
    ]);
  });
  // Free was 30 until the free/pro shift: a clip's length stopped being a paid line.
  it("clip length caps: 60s on every tier (billing-caps.md)", () => {
    expect(MAX_REEL_SECONDS.free).toBe(60);
    expect(MAX_REEL_SECONDS.pro).toBe(60);
    expect(MAX_REEL_SECONDS.event_pass).toBe(60);
  });
  // The uploads rise down the ladder while their share of the room falls (Ladder A's shape: a big
  // plan is an archive that never turns over in a month, and its worst month sizes its price).
  it("the Pro uploads rise down the ladder while their share of the room falls", () => {
    const sizes = plansForTier("pro");
    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i].uploadsBytes).toBeGreaterThan(sizes[i - 1].uploadsBytes);
      expect(sizes[i].uploadsBytes / sizes[i].storageBytes).toBeLessThan(
        sizes[i - 1].uploadsBytes / sizes[i - 1].storageBytes,
      );
    }
  });
});

/**
 * ★ THE UPLOADS ALLOWANCE IS EACH PLAN'S OWN NUMBER (Ladder A; reshaped from monthlyIngressCap, whose scar this keeps:
 * a Pro profile with no cap on record fails OPEN, never blocking a paying host on missing data). The SQL twin is
 * upload_allowance(), held to these by tier-limits-parity.test.ts.
 */
describe("uploadAllowance", () => {
  it("free: its own 300 MB, whatever its cap reads", () => {
    expect(uploadAllowance("free", null)).toBe(300 * MEGABYTE);
    expect(uploadAllowance("free", 100 * MEGABYTE)).toBe(300 * MEGABYTE);
  });
  it("pro: each size its own number", () => {
    expect(uploadAllowance("pro", 50 * GIGABYTE)).toBe(100 * GIGABYTE);
    expect(uploadAllowance("pro", 200 * GIGABYTE)).toBe(200 * GIGABYTE);
    expect(uploadAllowance("pro", TERABYTE)).toBe(500 * GIGABYTE);
  });
  it("pro: a retired size takes the smallest Ladder A size that holds it, the largest's past them all", () => {
    expect(uploadAllowance("pro", 100 * GIGABYTE)).toBe(200 * GIGABYTE);
    expect(uploadAllowance("pro", 500 * GIGABYTE)).toBe(500 * GIGABYTE);
    expect(uploadAllowance("pro", 2 * TERABYTE)).toBe(500 * GIGABYTE);
  });
  it("pro with no cap on record fails OPEN (unmetered), never blocks", () => {
    expect(uploadAllowance("pro", null)).toBeNull();
  });
  it("event_pass: one pass's 50 GB for each pass its room holds, never fewer than one", () => {
    expect(uploadAllowance("event_pass", null)).toBe(50 * GIGABYTE);
    expect(uploadAllowance("event_pass", 25 * GIGABYTE)).toBe(50 * GIGABYTE);
    expect(uploadAllowance("event_pass", 50 * GIGABYTE)).toBe(100 * GIGABYTE);
    expect(uploadAllowance("event_pass", 10 * GIGABYTE)).toBe(50 * GIGABYTE);
  });
});

describe("uploadsLabel (the pricing table's Uploads row)", () => {
  it("says each plan's number and its window", () => {
    expect(uploadsLabel(planById("free"))).toBe("300 MB a month");
    expect(uploadsLabel(planById("event_pass"))).toBe("50 GB over its year");
    expect(plansForTier("pro").map(uploadsLabel)).toEqual([
      "100 GB a month",
      "200 GB a month",
      "500 GB a month",
    ]);
    expect(uploadsLabel(planById("pro_1tb_yr"))).toBe("500 GB a month");
  });
});

describe("uploadsPhrase (a plan card's own line)", () => {
  it("says the same number and window as the table's cell, with what it counts", () => {
    expect(uploadsPhrase(planById("free"))).toBe("300 MB of uploads a month");
    expect(uploadsPhrase(planById("event_pass"))).toBe(
      "50 GB of uploads over its year",
    );
    expect(plansForTier("pro").map(uploadsPhrase)).toEqual([
      "100 GB of uploads a month",
      "200 GB of uploads a month",
      "500 GB of uploads a month",
    ]);
  });

  it("★ never drifts from the cell: every plan's phrase is its label with the noun placed", () => {
    for (const plan of PLANS) {
      const [bytes, ...window] = uploadsLabel(plan).split(" ");
      const [unit, ...rest] = window;
      expect(uploadsPhrase(plan)).toBe(
        `${bytes} ${unit} of uploads ${rest.join(" ")}`,
      );
    }
  });
});

describe("the big party (the unit a pricing card leads with)", () => {
  it("is 200 guests' 2,000 photos and 100 half-minute clips: about 10 GB of originals", () => {
    expect(BIG_PARTY.guests).toBe(200);
    expect(BIG_PARTY_BYTES / GIGABYTE).toBeCloseTo(10.01, 2);
    expect(BIG_PARTY_NOTE).toBe(
      "A 200-guest party is counted at about 2,000 photos and 100 clips of 30 seconds.",
    );
  });
  it("counts each room the friendly way: the pass twice over, Pro 5, 20 and 100", () => {
    expect(partiesHeld(planById("event_pass").storageBytes)).toBe(2);
    expect(plansForTier("pro").map((p) => partiesHeld(p.storageBytes))).toEqual(
      [5, 20, 100],
    );
    expect(partiesHeld(planById("free").storageBytes)).toBe(0);
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
    expect(effectiveStorageCap("event_pass", null)).toBe(25 * GIGABYTE);
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
    ).toBe("7,314 photos or 7 hours of video");
    expect(formatCapacity(GIGABYTE, { basis: false })).toBe(
      "293 photos or 16 minutes of video",
    );
  });
  it("carries its basis unless the surface says it already", () => {
    // The round's point: an estimate with no camera behind it is a random claim.
    expect(
      formatCapacity(planById("free").storageBytes, { video: false }),
    ).toBe("29 photos at an iPhone's default camera settings");
    expect(formatCapacity(planById("pro_50").storageBytes)).toBe(
      "14,629 photos or 13 hours of video at an iPhone's default camera settings",
    );
  });
});

/**
 * ★ A CAP READS THE SAME IN EVERY RUNTIME (crumbs-36, from crumbs-33). `formatLimit` printed its number with a bare
 * `toLocaleString()`: the server's locale while rendering, a visitor's own on hydration. Both formatters here say a
 * count through `formatCount`, so a browser set to German reads the digits the server drew. The numbers themselves
 * are tiers.ts's and the SQL's (`tier-limits-parity.test.ts`); only how one prints is pinned here.
 */
describe("a limit or an estimate in another runtime's locale", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("★ formatLimit groups a cap in en-US whatever the runtime's locale", () => {
    runAsGermanNumberRuntime();
    expect(formatLimit(12_345)).toBe("12,345");
    expect(formatLimit(7)).toBe("7");
  });

  it("says the unlimited word for a null cap, in either runtime", () => {
    expect(formatLimit(null)).toBe("Unlimited");
    expect(formatLimit(null, "No limit")).toBe("No limit");
    runAsGermanNumberRuntime();
    expect(formatLimit(null)).toBe("Unlimited");
  });

  it("★ formatCapacity groups its photos and hours in en-US whatever the runtime's locale", () => {
    runAsGermanNumberRuntime();
    expect(
      formatCapacity(planById("event_pass").storageBytes, { basis: false }),
    ).toBe("7,314 photos or 7 hours of video");
    expect(
      formatCapacity(planById("pro_1tb").storageBytes, { basis: false }),
    ).toBe("299,593 photos or 269 hours of video");
  });
});
