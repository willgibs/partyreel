import { describe, expect, it } from "vitest";

import {
  countBySource,
  summarizeLinkStats,
  summarizeProfiles,
  type ProfileMetricRow,
} from "@/lib/metrics/aggregate";

const NOW = new Date("2026-06-01T00:00:00.000Z");
const RECENT = "2026-05-20T00:00:00.000Z"; // within 30 days of NOW
const OLD = "2026-01-01T00:00:00.000Z"; // outside the window

function profile(p: Partial<ProfileMetricRow>): ProfileMetricRow {
  return {
    tier: "free",
    created_at: OLD,
    last_active_at: OLD,
    storage_used_bytes: 0,
    stripe_subscription_id: null,
    is_admin: false,
    ...p,
  };
}

describe("summarizeProfiles", () => {
  it("excludes the operator (is_admin) from every tally", () => {
    const m = summarizeProfiles(
      [
        profile({
          is_admin: true,
          tier: "pro",
          stripe_subscription_id: "sub_1",
          storage_used_bytes: 999,
        }),
        profile({ tier: "free" }),
      ],
      NOW,
    );
    expect(m.total).toBe(1);
    expect(m.paidSubscribers).toBe(0);
    expect(m.totalStorageBytes).toBe(0);
    expect(m.tierMix.pro).toBe(0);
  });

  it("counts new + active within the 30-day window", () => {
    const m = summarizeProfiles(
      [
        profile({ created_at: RECENT, last_active_at: RECENT }),
        profile({ created_at: OLD, last_active_at: OLD }),
        profile({ created_at: OLD, last_active_at: RECENT }),
      ],
      NOW,
    );
    expect(m.total).toBe(3);
    expect(m.newLast30).toBe(1);
    expect(m.activeLast30).toBe(2);
  });

  it("builds tier mix (coercing retired 'max' to pro) + paid subs + storage sum", () => {
    const m = summarizeProfiles(
      [
        profile({ tier: "free" }),
        profile({
          tier: "pro",
          stripe_subscription_id: "sub_1",
          storage_used_bytes: 100,
        }),
        profile({
          tier: "max", // retired enum value → coerced to pro
          stripe_subscription_id: "sub_2",
          storage_used_bytes: 200,
        }),
        profile({ tier: "event_pass", storage_used_bytes: 50 }),
      ],
      NOW,
    );
    expect(m.tierMix).toEqual({ free: 1, pro: 2, event_pass: 1 });
    expect(m.eventPassHolders).toBe(1);
    expect(m.paidSubscribers).toBe(2);
    expect(m.totalStorageBytes).toBe(350);
  });
});

describe("summarizeLinkStats", () => {
  it("sums counts by kind", () => {
    expect(
      summarizeLinkStats([
        { kind: "qr_scan", count: 3 },
        { kind: "album_view", count: 5 },
        { kind: "qr_scan", count: 2 },
      ]),
    ).toEqual({ qrScans: 5, albumViews: 5 });
  });

  it("is zero on empty", () => {
    expect(summarizeLinkStats([])).toEqual({ qrScans: 0, albumViews: 0 });
  });
});

describe("countBySource", () => {
  it("tallies + sorts desc, mapping null/blank to 'direct'", () => {
    expect(
      countBySource([
        { source: "event_page" },
        { source: null },
        { source: "event_page" },
        { source: "  " },
        { source: "landing" },
      ]),
    ).toEqual([
      { source: "event_page", count: 2 },
      { source: "direct", count: 2 },
      { source: "landing", count: 1 },
    ]);
  });
});
