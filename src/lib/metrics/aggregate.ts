import { toBillingTier, type Tier } from "@/lib/constants/tiers";

/**
 * Pure (IO-free, unit-tested) reducers for the admin platform metrics dashboard (P6a). They take rows
 * the service-role query already fetched and roll them up — no DB, no env, no Stripe — so the numbers
 * are testable in isolation. (P6b extends these with per-day trend arrays for the charts.)
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 30;

export type ProfileMetricRow = {
  tier: string;
  created_at: string;
  last_active_at: string;
  storage_used_bytes: number;
  stripe_subscription_id: string | null;
  is_admin: boolean;
};

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

/** Roll a profiles fetch into account KPIs. Excludes the operator (`is_admin`) so it never skews. */
export function summarizeProfiles(
  rows: ProfileMetricRow[],
  now: Date = new Date(),
): AccountMetrics {
  const cutoff = now.getTime() - WINDOW_DAYS * DAY_MS;
  const tierMix: Record<Tier, number> = { free: 0, pro: 0, event_pass: 0 };
  let total = 0;
  let newLast30 = 0;
  let activeLast30 = 0;
  let paidSubscribers = 0;
  let totalStorageBytes = 0;

  for (const r of rows) {
    if (r.is_admin) continue; // the operator is not a customer
    total += 1;
    totalStorageBytes += r.storage_used_bytes;
    if (new Date(r.created_at).getTime() >= cutoff) newLast30 += 1;
    if (new Date(r.last_active_at).getTime() >= cutoff) activeLast30 += 1;
    if (r.stripe_subscription_id) paidSubscribers += 1;
    tierMix[toBillingTier(r.tier)] += 1;
  }

  return {
    total,
    newLast30,
    activeLast30,
    paidSubscribers,
    tierMix,
    eventPassHolders: tierMix.event_pass,
    totalStorageBytes,
  };
}

export type LinkStatRow = {
  kind: "qr_scan" | "album_view";
  /** YYYY-MM-DD (the link_stats per-day bucket; only the trend builder reads it). */
  day: string;
  count: number;
};
export type EngagementMetrics = { qrScans: number; albumViews: number };

/** Sum the per-event-per-day link_stats counters into platform engagement totals. */
export function summarizeLinkStats(rows: LinkStatRow[]): EngagementMetrics {
  let qrScans = 0;
  let albumViews = 0;
  for (const r of rows) {
    if (r.kind === "qr_scan") qrScans += r.count;
    else if (r.kind === "album_view") albumViews += r.count;
  }
  return { qrScans, albumViews };
}

// ---- Per-day trends (P6b charts) -------------------------------------------------------------
// All day math is UTC, matching link_stats.day (DB current_date, UTC) and how we bucket
// created_at — so a signup and a scan on the same calendar day line up on the axis.

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

/** Daily signup counts over the window (zero-filled, excludes the operator). */
export function buildSignupTrend(
  rows: ProfileMetricRow[],
  now: Date = new Date(),
  days = WINDOW_DAYS,
): DayCount[] {
  const buckets = dayBuckets(now, days);
  const counts = new Map<string, number>(buckets.map((d) => [d, 0]));
  for (const r of rows) {
    if (r.is_admin) continue;
    const key = dayKey(new Date(r.created_at));
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return buckets.map((day) => ({ day, count: counts.get(day) ?? 0 }));
}

/** Daily QR-scan + album-view counts over the window (zero-filled). */
export function buildEngagementTrend(
  rows: LinkStatRow[],
  now: Date = new Date(),
  days = WINDOW_DAYS,
): EngagementDay[] {
  const buckets = dayBuckets(now, days);
  const map = new Map<string, { qrScans: number; albumViews: number }>(
    buckets.map((d) => [d, { qrScans: 0, albumViews: 0 }]),
  );
  for (const r of rows) {
    const slot = map.get(r.day);
    if (!slot) continue;
    if (r.kind === "qr_scan") slot.qrScans += r.count;
    else if (r.kind === "album_view") slot.albumViews += r.count;
  }
  return buckets.map((day) => {
    const v = map.get(day) ?? { qrScans: 0, albumViews: 0 };
    return { day, qrScans: v.qrScans, albumViews: v.albumViews };
  });
}

export type SourceCount = { source: string; count: number };

/** Tally newsletter signups by source (null/empty → "direct"), most-common first. */
export function countBySource(
  rows: { source: string | null }[],
): SourceCount[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const key = r.source?.trim() || "direct";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
}
