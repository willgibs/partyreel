import { describe, expect, it } from "vitest";

import {
  buildEngagementTrend,
  buildSignupTrend,
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
        { kind: "qr_scan", day: "2026-05-30", count: 3 },
        { kind: "album_view", day: "2026-05-30", count: 5 },
        { kind: "qr_scan", day: "2026-05-31", count: 2 },
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

describe("buildSignupTrend", () => {
  it("zero-fills the 30-day window and counts signups on their UTC day (excl. is_admin)", () => {
    const trend = buildSignupTrend(
      [
        profile({ created_at: "2026-06-01T10:00:00.000Z" }),
        profile({ created_at: "2026-06-01T23:30:00.000Z" }),
        profile({ created_at: "2026-05-31T12:00:00.000Z" }),
        profile({ is_admin: true, created_at: "2026-06-01T08:00:00.000Z" }),
        profile({ created_at: "2026-01-01T00:00:00.000Z" }), // outside the window
      ],
      NOW,
      30,
    );
    expect(trend).toHaveLength(30);
    expect(trend[0].day).toBe("2026-05-03"); // oldest bucket
    expect(trend[29]).toEqual({ day: "2026-06-01", count: 2 }); // newest
    expect(trend[28]).toEqual({ day: "2026-05-31", count: 1 });
    expect(trend.reduce((s, d) => s + d.count, 0)).toBe(3); // in-window, non-admin
  });
});

describe("buildEngagementTrend", () => {
  it("zero-fills + sums scans/views per day, dropping out-of-window days", () => {
    const trend = buildEngagementTrend(
      [
        { kind: "qr_scan", day: "2026-06-01", count: 10 },
        { kind: "qr_scan", day: "2026-06-01", count: 6 },
        { kind: "album_view", day: "2026-06-01", count: 4 },
        { kind: "qr_scan", day: "2026-05-31", count: 2 },
        { kind: "album_view", day: "2020-01-01", count: 99 }, // outside the window
      ],
      NOW,
      30,
    );
    expect(trend).toHaveLength(30);
    expect(trend[29]).toEqual({
      day: "2026-06-01",
      qrScans: 16,
      albumViews: 4,
    });
    expect(trend[28]).toEqual({ day: "2026-05-31", qrScans: 2, albumViews: 0 });
    expect(trend[0]).toEqual({ day: "2026-05-03", qrScans: 0, albumViews: 0 });
  });

  it("empty input → an all-zero series of the requested length", () => {
    const trend = buildEngagementTrend([], NOW, 7);
    expect(trend).toHaveLength(7);
    expect(trend.every((d) => d.qrScans === 0 && d.albumViews === 0)).toBe(
      true,
    );
  });
});
