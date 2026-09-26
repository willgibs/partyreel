import { describe, expect, it } from "vitest";

import {
  buildEngagementTrend,
  buildSignupTrend,
  countBySource,
  parseMetricsSnapshot,
  summarizeAccounts,
  summarizeEngagement,
  type MetricsSnapshot,
} from "@/lib/metrics/aggregate";

/**
 * THE METRICS REDUCERS, OVER THE SNAPSHOT (the 1,000-row round, 2026-09-23). The database counts
 * every figure (`admin_metrics_snapshot()`, pinned in `db/queries/metrics.test.ts`); what is pinned
 * here is the part with a TypeScript home: the snapshot's shape is refused when it drifts, the raw
 * tiers fold onto the billing tiers ("max" reads as Pro), the newsletter source rule, and the
 * zero-filled UTC day buckets the charts draw.
 */

const NOW = new Date("2026-06-01T00:00:00.000Z");

function snapshot(over: Partial<MetricsSnapshot> = {}): MetricsSnapshot {
  return {
    as_of: "2026-06-01T00:00:00.000000+00:00",
    window_days: 30,
    fortnight_days: 14,
    accounts: {
      total: 0,
      new_in_window: 0,
      active_in_window: 0,
      new_in_fortnight: 0,
      new_in_prior_fortnight: 0,
      active_in_fortnight: 0,
      active_in_prior_fortnight: 0,
      paid: 0,
      storage_used_bytes: 0,
      by_tier: {},
      signups_by_day: {},
    },
    engagement: { qr_scans: 0, album_views: 0, by_day: {} },
    newsletter: { by_source: [] },
    ...over,
  };
}

describe("parseMetricsSnapshot", () => {
  it("reads the function's own shape", () => {
    const parsed = parseMetricsSnapshot(snapshot());
    expect(parsed.window_days).toBe(30);
    expect(parsed.accounts.by_tier).toEqual({});
  });

  it("refuses a drifted shape rather than drawing zeros", () => {
    const { accounts: _accounts, ...missing } = snapshot();
    expect(() => parseMetricsSnapshot(missing)).toThrow(
      /admin_metrics_snapshot/,
    );
    expect(() => parseMetricsSnapshot(null)).toThrow(/admin_metrics_snapshot/);
    expect(() =>
      parseMetricsSnapshot({
        ...snapshot(),
        accounts: { ...snapshot().accounts, total: "12" },
      }),
    ).toThrow(/accounts\.total/);
  });
});

describe("summarizeAccounts", () => {
  it("takes the counted figures as they come, past 1,000", () => {
    const m = summarizeAccounts({
      ...snapshot().accounts,
      total: 2500,
      new_in_window: 1300,
      active_in_window: 1800,
      paid: 400,
      storage_used_bytes: 5_000_000_000_000,
    });
    expect(m).toMatchObject({
      total: 2500,
      newLast30: 1300,
      activeLast30: 1800,
      paidSubscribers: 400,
      totalStorageBytes: 5_000_000_000_000,
    });
  });

  it("folds the raw tiers onto the billing tiers, the retired 'max' reading as Pro", () => {
    const m = summarizeAccounts({
      ...snapshot().accounts,
      by_tier: { free: 1800, pro: 300, max: 100, event_pass: 250 },
    });
    expect(m.tierMix).toEqual({ free: 1800, pro: 400, event_pass: 250 });
    expect(m.eventPassHolders).toBe(250);
  });

  it("an empty platform is zeros, every tier present", () => {
    expect(summarizeAccounts(snapshot().accounts).tierMix).toEqual({
      free: 0,
      pro: 0,
      event_pass: 0,
    });
  });
});

describe("summarizeEngagement", () => {
  it("folds scans and the frozen legacy album-view count into one figure", () => {
    // Album views retired as its own writer (`37707d80`, "one link per
    // event"): every visit is a qr_scan now, so the honest reading is both
    // counts together, matching the host's own event page.
    expect(
      summarizeEngagement({ qr_scans: 12_000, album_views: 30_500, by_day: {} }),
    ).toEqual({ linkVisits: 42_500 });
  });
});

describe("countBySource", () => {
  it("merges raw sources by the rule, sorting desc, null and blank reading 'direct'", () => {
    expect(
      countBySource([
        { source: "event_page", count: 1200 },
        { source: null, count: 700 },
        { source: "  ", count: 600 },
        { source: " event_page ", count: 5 },
        { source: "landing", count: 40 },
      ]),
    ).toEqual([
      { source: "direct", count: 1300 },
      { source: "event_page", count: 1205 },
      { source: "landing", count: 40 },
    ]);
  });

  it("is empty for no signups", () => {
    expect(countBySource([])).toEqual([]);
  });
});

describe("buildSignupTrend", () => {
  it("zero-fills the window and places each counted day on its UTC day", () => {
    const trend = buildSignupTrend(
      { "2026-06-01": 2, "2026-05-31": 1, "2026-05-03": 4 },
      NOW,
      30,
    );
    expect(trend).toHaveLength(30);
    expect(trend[0]).toEqual({ day: "2026-05-03", count: 4 }); // oldest bucket
    expect(trend[29]).toEqual({ day: "2026-06-01", count: 2 }); // newest
    expect(trend[28]).toEqual({ day: "2026-05-31", count: 1 });
    expect(trend.reduce((s, d) => s + d.count, 0)).toBe(7);
  });

  it("draws a shorter span from the same counts (the home's fortnight)", () => {
    const trend = buildSignupTrend(
      { "2026-06-01": 2, "2026-05-03": 4 },
      NOW,
      14,
    );
    expect(trend).toHaveLength(14);
    expect(trend[0].day).toBe("2026-05-19");
    // A day before the span is not drawn, rather than drawn as a false zero.
    expect(trend.reduce((s, d) => s + d.count, 0)).toBe(2);
  });
});

describe("buildEngagementTrend", () => {
  it("zero-fills one link-visits figure per day, scans plus the frozen album-view count", () => {
    const trend = buildEngagementTrend(
      {
        "2026-06-01": { qr_scans: 16, album_views: 4 },
        "2026-05-31": { qr_scans: 2, album_views: 0 },
      },
      NOW,
      30,
    );
    expect(trend).toHaveLength(30);
    expect(trend[29]).toEqual({ day: "2026-06-01", linkVisits: 20 });
    expect(trend[28]).toEqual({ day: "2026-05-31", linkVisits: 2 });
    expect(trend[0]).toEqual({ day: "2026-05-03", linkVisits: 0 });
  });

  it("no traffic → an all-zero series of the requested length", () => {
    const trend = buildEngagementTrend({}, NOW, 7);
    expect(trend).toHaveLength(7);
    expect(trend.every((d) => d.linkVisits === 0)).toBe(true);
  });
});
