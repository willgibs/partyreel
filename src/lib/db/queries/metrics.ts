/**
 * Operator-internal platform metrics for the admin dashboard (P6a). SERVICE-ROLE admin client — these
 * are cross-host aggregate reads (RLS scopes every table to its owner). The /admin pages gate on
 * requireAdmin() first. READ-ONLY. Every figure is counted in the database: `head:true` counts for the
 * content, and ONE jsonb, `admin_metrics_snapshot()`, for everything that used to be rolled up from
 * whole-table reads, plus a best-effort live Stripe revenue read. Revenue may be null (Stripe
 * down/slow); the page degrades.
 *
 * ★ NO FIGURE IS DERIVED FROM A LIST (the 1,000-row round, 2026-09-23). The accounts, engagement and
 * newsletter figures came from three unordered whole-table reads (every profile, every link_stats row,
 * every newsletter source), each cut at PostgREST's 1,000 rows, so every one of them went quietly
 * wrong at the 1,001st account or stats row. The snapshot counts them in SQL
 * (`20260924020000_row_cap_host.sql`) and `lib/metrics/aggregate.ts` folds what has a TypeScript
 * home (the tier mapping, the source rule, the zero-filled day buckets).
 *
 * ★ THE DATABASE HALF AND THE STRIPE HALF ARE TWO FUNCTIONS (admin-wiring, 2026-09-20). The portal's
 * home opens on four figures and a fortnight's trend (`home=kpi`), which are all rows in Postgres, and
 * putting a live Stripe call in front of them would make the first paint of the operator's landing page
 * wait on a third party that is allowed to be slow and allowed to fail. So `getPlatformDbMetrics()` is
 * the half both surfaces read and `getPlatformMetrics()` is that half plus revenue, which is what
 * /admin/metrics still wants. One query file, no second source for a number.
 */
import "server-only";

import { FORTNIGHT_DAYS, type FortnightAccounts } from "@/lib/admin/kpi";
import { mustCount, QueryFailedError } from "@/lib/db/must-query";
import {
  buildEngagementTrend,
  buildSignupTrend,
  countBySource,
  parseMetricsSnapshot,
  summarizeAccounts,
  summarizeEngagement,
  type AccountMetrics,
  type DayCount,
  type EngagementDay,
  type EngagementMetrics,
  type SourceCount,
} from "@/lib/metrics/aggregate";
import { getPlatformRevenue, type PlatformRevenue } from "@/lib/stripe/revenue";
import { createAdminClient } from "@/lib/supabase/admin";

/** The metrics page's window: new and active accounts, the signup and engagement charts. */
const WINDOW_DAYS = 30;

export type ContentMetrics = {
  events: number;
  media: number;
  photos: number;
  videos: number;
};

export type GrowthMetrics = {
  newsletterTotal: number;
  newsletterLast30: number;
  bySource: SourceCount[];
  emailsLast30: number;
};

/** Active media, whole and per fortnight, for the home's Uploads figure and its delta. */
export type UploadCounts = {
  total: number;
  recent: number;
  previous: number;
};

/** Everything the portal's own database can answer, with no third party in front of it. */
export type PlatformDbMetrics = {
  /** The database clock the figures were counted on. */
  asOf: string;
  /** The metrics page's KPIs + the daily signup trend over its thirty days (zero-filled). */
  accounts: AccountMetrics & { signupTrend: DayCount[] };
  /** The home's four figures' accounts over a fortnight + the fortnight's signup line. */
  fortnight: FortnightAccounts & { signupTrend: DayCount[] };
  content: ContentMetrics;
  uploads: UploadCounts;
  /** Totals + the daily scans/views trend for the chart. */
  engagement: EngagementMetrics & { trend: EngagementDay[] };
  growth: GrowthMetrics;
};

export type PlatformMetrics = PlatformDbMetrics & {
  /** null = the live Stripe read failed (best-effort); the dashboard shows "unavailable". */
  revenue: PlatformRevenue | null;
};

export async function getPlatformDbMetrics(): Promise<PlatformDbMetrics> {
  const admin = createAdminClient();
  const now = Date.now();
  const since = new Date(now - WINDOW_DAYS * 86_400_000).toISOString();
  const fortnight = new Date(now - FORTNIGHT_DAYS * 86_400_000).toISOString();
  const twoFortnights = new Date(
    now - 2 * FORTNIGHT_DAYS * 86_400_000,
  ).toISOString();

  /** The active-media filter, spelled once: not removed, in a live event. */
  const activeMedia = () =>
    admin
      .from("media")
      .select("*, events!media_event_id_fkey!inner(deleted_at)", {
        count: "exact",
        head: true,
      })
      .is("events.deleted_at", null)
      .neq("status", "removed");

  const [
    snapshotRes,
    events,
    media,
    photos,
    videos,
    uploadsRecent,
    uploadsPrevious,
    newsletterTotal,
    newsletterLast30,
    emailsLast30,
  ] = await Promise.all([
    admin.rpc("admin_metrics_snapshot", {
      p_window_days: WINDOW_DAYS,
      p_fortnight_days: FORTNIGHT_DAYS,
    }),
    mustCount(
      admin
        .from("events")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null),
      "admin metrics: events",
    ),
    // "Active" media = non-removed AND in a non-deleted event (the events!inner + deleted_at filter),
    // so the count stays consistent with the active-events count above (and the P5/accounts definition).
    mustCount(activeMedia(), "admin metrics: media"),
    mustCount(activeMedia().eq("type", "photo"), "admin metrics: photos"),
    mustCount(activeMedia().eq("type", "video"), "admin metrics: videos"),
    // The home's Uploads delta: this fortnight against the one before it.
    mustCount(
      activeMedia().gte("created_at", fortnight),
      "admin metrics: uploads this fortnight",
    ),
    mustCount(
      activeMedia().gte("created_at", twoFortnights).lt("created_at", fortnight),
      "admin metrics: uploads the fortnight before",
    ),
    mustCount(
      admin
        .from("newsletter_signups")
        .select("*", { count: "exact", head: true }),
      "admin metrics: newsletter signups",
    ),
    mustCount(
      admin
        .from("newsletter_signups")
        .select("*", { count: "exact", head: true })
        .gte("created_at", since),
      "admin metrics: newsletter signups (30d)",
    ),
    mustCount(
      admin
        .from("sent_emails")
        .select("*", { count: "exact", head: true })
        .gte("sent_at", since),
      "admin metrics: emails sent (30d)",
    ),
  ]);

  if (snapshotRes.error) {
    throw new QueryFailedError("admin metrics: snapshot", snapshotRes.error);
  }
  const snapshot = parseMetricsSnapshot(snapshotRes.data);
  const asOf = new Date(snapshot.as_of);

  return {
    asOf: snapshot.as_of,
    accounts: {
      ...summarizeAccounts(snapshot.accounts),
      signupTrend: buildSignupTrend(
        snapshot.accounts.signups_by_day,
        asOf,
        snapshot.window_days,
      ),
    },
    fortnight: {
      total: snapshot.accounts.total,
      newAccounts: snapshot.accounts.new_in_fortnight,
      newAccountsBefore: snapshot.accounts.new_in_prior_fortnight,
      active: snapshot.accounts.active_in_fortnight,
      activeBefore: snapshot.accounts.active_in_prior_fortnight,
      paid: snapshot.accounts.paid,
      // The same buckets as the thirty-day chart, asked for the fortnight, so the line under the
      // home's first figure covers the span its delta does.
      signupTrend: buildSignupTrend(
        snapshot.accounts.signups_by_day,
        asOf,
        snapshot.fortnight_days,
      ),
    },
    content: { events, media, photos, videos },
    uploads: {
      total: media,
      recent: uploadsRecent,
      previous: uploadsPrevious,
    },
    engagement: {
      ...summarizeEngagement(snapshot.engagement),
      trend: buildEngagementTrend(
        snapshot.engagement.by_day,
        asOf,
        snapshot.window_days,
      ),
    },
    growth: {
      newsletterTotal,
      newsletterLast30,
      bySource: countBySource(snapshot.newsletter.by_source),
      emailsLast30,
    },
  };
}

/** The database half plus the live Stripe read: what /admin/metrics draws. */
export async function getPlatformMetrics(): Promise<PlatformMetrics> {
  const [db, revenue] = await Promise.all([
    getPlatformDbMetrics(),
    getPlatformRevenue(),
  ]);
  return { ...db, revenue };
}
