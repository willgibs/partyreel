import { z } from "zod";

import { toBillingTier, type Tier } from "@/lib/constants/tiers";

/**
 * Pure (IO-free, unit-tested) reducers for the admin platform metrics (P6a, P6b): they turn the
 * figures the database already computed into what /admin and /admin/metrics draw — no DB, no env,
 * no Stripe — so the numbers are testable in isolation.
 *
 * ★ THE FIGURES ARRIVE AS ONE SNAPSHOT, NEVER AS ROWS (the 1,000-row round, 2026-09-23).
 * `admin_metrics_snapshot()` (`20260924020000_row_cap_host.sql`) counts every account, every
 * link_stats day and every newsletter source in SQL and answers one jsonb. These reducers used to
 * take the rows themselves (every profile, every link_stats row, every newsletter row), each read
 * cut at 1,000 with no order, so every figure went quietly wrong at the 1,001st account. What stays
 * here is the part with a home in TypeScript: the tier mapping (`toBillingTier`, so "max" reads as
 * Pro), the newsletter source rule (trimmed, blank or null reads "direct"), and the zero-filled day
 * buckets the charts draw.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

const count = z.number().int().nonnegative();
const amount = z.number().nonnegative();

const snapshotSchema = z.object({
  /** The database's `now()`: the day buckets are built on this clock, the one the figures used. */
  as_of: z.string().min(1),
  window_days: z.number().int().positive(),
  fortnight_days: z.number().int().positive(),
  accounts: z.object({
    total: count,
    new_in_window: count,
    active_in_window: count,
    new_in_fortnight: count,
    new_in_prior_fortnight: count,
    active_in_fortnight: count,
    active_in_prior_fortnight: count,
    paid: count,
    storage_used_bytes: amount,
    /** The RAW `profiles.tier` values; `summarizeAccounts` folds them. */
    by_tier: z.record(z.string(), count),
    /** `YYYY-MM-DD` (UTC) for each window day that had a signup. */
    signups_by_day: z.record(z.string(), count),
  }),
  engagement: z.object({
    qr_scans: amount,
    album_views: amount,
    by_day: z.record(
      z.string(),
      z.object({ qr_scans: amount, album_views: amount }),
    ),
  }),
  newsletter: z.object({
    /** RAW sources (nullable); `countBySource` applies the rule and merges. */
    by_source: z.array(z.object({ source: z.string().nullable(), count })),
  }),
});

/** `admin_metrics_snapshot()`'s answer. Every account figure already leaves out the operator. */
export type MetricsSnapshot = z.infer<typeof snapshotSchema>;

/** The snapshot, checked: a shape these reducers cannot read throws rather than drawing zeros. */
export function parseMetricsSnapshot(json: unknown): MetricsSnapshot {
  const parsed = snapshotSchema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(
      `admin_metrics_snapshot answered a shape the metrics cannot read: ${issue?.path.join(".") ?? ""} ${issue?.message ?? "unknown"}`,
    );
  }
  return parsed.data;
}

export type AccountMetrics = {
  /** Non-admin accounts. */
  total: number;
  newLast30: number;
  activeLast30: number;
  /** Accounts with a live Stripe subscription (Pro). */
  paidSubscribers: number;
  tierMix: Record<Tier, number>;
  eventPassHolders: number;
  /** Sum of the raw storage counter across non-admin accounts. */
  totalStorageBytes: number;
};

/** The snapshot's accounts as the metrics page's KPIs, the raw tiers folded onto the billing tiers. */
export function summarizeAccounts(
  accounts: MetricsSnapshot["accounts"],
): AccountMetrics {
  const tierMix: Record<Tier, number> = { free: 0, pro: 0, event_pass: 0 };
  for (const [tier, n] of Object.entries(accounts.by_tier)) {
    tierMix[toBillingTier(tier)] += n;
  }
  return {
    total: accounts.total,
    newLast30: accounts.new_in_window,
    activeLast30: accounts.active_in_window,
    paidSubscribers: accounts.paid,
    tierMix,
    eventPassHolders: tierMix.event_pass,
    totalStorageBytes: accounts.storage_used_bytes,
  };
}

export type EngagementMetrics = { qrScans: number; albumViews: number };

/** Lifetime QR scans and album views across every event. */
export function summarizeEngagement(
  engagement: MetricsSnapshot["engagement"],
): EngagementMetrics {
  return { qrScans: engagement.qr_scans, albumViews: engagement.album_views };
}

// ---- Per-day trends (P6b charts) -------------------------------------------------------------
// All day math is UTC, matching link_stats.day (DB current_date, UTC) and the snapshot's
// signups_by_day keys — so a signup and a scan on the same calendar day line up on the axis.

export type DayCount = { day: string; count: number };
export type EngagementDay = {
  day: string;
  qrScans: number;
  albumViews: number;
};

/** UTC YYYY-MM-DD key for a Date. */
function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** The last `days` UTC day-keys ending today (oldest → newest) — the zero-fill scaffold. */
function dayBuckets(now: Date, days: number): string[] {
  const base = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--)
    out.push(dayKey(new Date(base - i * DAY_MS)));
  return out;
}

/**
 * Daily signups over the last `days` UTC days ending on `now`'s, zero-filled. `days` may be shorter
 * than the snapshot's window (the home draws fourteen of its thirty), never longer: a day outside
 * the window was never counted, so it would draw a zero that is not true.
 */
export function buildSignupTrend(
  signupsByDay: Record<string, number>,
  now: Date,
  days: number,
): DayCount[] {
  return dayBuckets(now, days).map((day) => ({
    day,
    count: signupsByDay[day] ?? 0,
  }));
}

/** Daily QR scans and album views over the last `days` UTC days ending on `now`'s, zero-filled. */
export function buildEngagementTrend(
  byDay: MetricsSnapshot["engagement"]["by_day"],
  now: Date,
  days: number,
): EngagementDay[] {
  return dayBuckets(now, days).map((day) => ({
    day,
    qrScans: byDay[day]?.qr_scans ?? 0,
    albumViews: byDay[day]?.album_views ?? 0,
  }));
}

export type SourceCount = { source: string; count: number };

/**
 * Newsletter signups by source, most-common first. The snapshot counts each RAW source and the rule
 * is applied here: trimmed, and a blank or a null reads "direct", so several raw sources can merge
 * into one line.
 */
export function countBySource(
  rows: readonly { source: string | null; count: number }[],
): SourceCount[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const key = r.source?.trim() || "direct";
    map.set(key, (map.get(key) ?? 0) + r.count);
  }
  return [...map.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
}
