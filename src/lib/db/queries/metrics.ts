/**
 * Operator-internal platform metrics for the admin dashboard (P6a). SERVICE-ROLE admin client — these
 * are cross-host aggregate reads (RLS scopes every table to its owner). The /admin/metrics page gates on
 * requireAdmin() first. READ-ONLY. Everything is computed from EXISTING tables (no migration): cheap
 * `head:true` counts + a few small column fetches rolled up by the pure reducers in lib/metrics, plus a
 * best-effort live Stripe revenue read. Revenue may be null (Stripe down/slow); the page degrades.
 *
 * ★ THE DATABASE HALF AND THE STRIPE HALF ARE TWO FUNCTIONS (admin-wiring, 2026-09-20). The portal's
 * home opens on four figures and a fortnight's trend (`home=kpi`), which are all rows in Postgres, and
 * putting a live Stripe call in front of them would make the first paint of the operator's landing page
 * wait on a third party that is allowed to be slow and allowed to fail. So `getPlatformDbMetrics()` is
 * the half both surfaces read and `getPlatformMetrics()` is that half plus revenue, which is what
 * /admin/metrics still wants. One query file, no second source for a number.
 */
import "server-only";

import {
  buildEngagementTrend,
  buildSignupTrend,
  countBySource,
  summarizeLinkStats,
  summarizeProfiles,
  type AccountMetrics,
  type DayCount,
  type EngagementDay,
  type EngagementMetrics,
  type ProfileMetricRow,
  type SourceCount,
} from "@/lib/metrics/aggregate";
import { getPlatformRevenue, type PlatformRevenue } from "@/lib/stripe/revenue";
import { createAdminClient } from "@/lib/supabase/admin";

const WINDOW_DAYS = 30;
/** The home's window (`home=kpi`): the figures' delta and the sparkline share one span. */
const FORTNIGHT_DAYS = 14;

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
  /**
   * The profile rows themselves, so a caller can roll them up its own way. The home reduces them
   * into four figures over a fortnight; /admin/metrics takes the thirty-day summary beside them.
   * One fetch, two reductions, never two fetches.
   */
  profileRows: ProfileMetricRow[];
  /** KPIs + the daily signup trend (zero-filled over the window) for the chart. */
  accounts: AccountMetrics & { signupTrend: DayCount[] };
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

/** Await a PostgREST head-count query → its count (a failed count is a real error worth surfacing). */
async function headCount(
  query: PromiseLike<{
    count: number | null;
    error: { message: string } | null;
  }>,
): Promise<number> {
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

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
    profilesRes,
    linkStatsRes,
    sourcesRes,
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
    admin
      .from("profiles")
      .select(
        "tier, created_at, last_active_at, storage_used_bytes, stripe_subscription_id, is_admin",
      ),
    admin.from("link_stats").select("kind, day, count"),
    admin.from("newsletter_signups").select("source"),
    headCount(
      admin
        .from("events")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null),
    ),
    // "Active" media = non-removed AND in a non-deleted event (the events!inner + deleted_at filter),
    // so the count stays consistent with the active-events count above (and the P5/accounts definition).
    headCount(activeMedia()),
    headCount(activeMedia().eq("type", "photo")),
    headCount(activeMedia().eq("type", "video")),
    // The home's Uploads delta: this fortnight against the one before it.
    headCount(activeMedia().gte("created_at", fortnight)),
    headCount(
      activeMedia().gte("created_at", twoFortnights).lt("created_at", fortnight),
    ),
    headCount(
      admin
        .from("newsletter_signups")
        .select("*", { count: "exact", head: true }),
    ),
    headCount(
      admin
        .from("newsletter_signups")
        .select("*", { count: "exact", head: true })
        .gte("created_at", since),
    ),
    headCount(
      admin
        .from("sent_emails")
        .select("*", { count: "exact", head: true })
        .gte("sent_at", since),
    ),
  ]);

  if (profilesRes.error) throw profilesRes.error;
  if (linkStatsRes.error) throw linkStatsRes.error;
  if (sourcesRes.error) throw sourcesRes.error;

  const profileRows = profilesRes.data ?? [];
  const linkRows = linkStatsRes.data ?? [];

  return {
    profileRows,
    accounts: {
      ...summarizeProfiles(profileRows),
      signupTrend: buildSignupTrend(profileRows),
    },
    content: { events, media, photos, videos },
    uploads: {
      total: media,
      recent: uploadsRecent,
      previous: uploadsPrevious,
    },
    engagement: {
      ...summarizeLinkStats(linkRows),
      trend: buildEngagementTrend(linkRows),
    },
    growth: {
      newsletterTotal,
      newsletterLast30,
      bySource: countBySource(sourcesRes.data ?? []),
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
