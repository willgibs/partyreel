/**
 * Operator-internal platform metrics for the admin dashboard (P6a). SERVICE-ROLE admin client — these
 * are cross-host aggregate reads (RLS scopes every table to its owner). The /admin/metrics page gates on
 * requireAdmin() first. READ-ONLY. Everything is computed from EXISTING tables (no migration): cheap
 * `head:true` counts + a few small column fetches rolled up by the pure reducers in lib/metrics, plus a
 * best-effort live Stripe revenue read. Revenue may be null (Stripe down/slow); the page degrades.
 */
import "server-only";

import {
  countBySource,
  summarizeLinkStats,
  summarizeProfiles,
  type AccountMetrics,
  type EngagementMetrics,
  type SourceCount,
} from "@/lib/metrics/aggregate";
import { getPlatformRevenue, type PlatformRevenue } from "@/lib/stripe/revenue";
import { createAdminClient } from "@/lib/supabase/admin";

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

export type PlatformMetrics = {
  accounts: AccountMetrics;
  content: ContentMetrics;
  engagement: EngagementMetrics;
  growth: GrowthMetrics;
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

export async function getPlatformMetrics(): Promise<PlatformMetrics> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString();

  const [
    profilesRes,
    linkStatsRes,
    sourcesRes,
    events,
    media,
    photos,
    videos,
    newsletterTotal,
    newsletterLast30,
    emailsLast30,
    revenue,
  ] = await Promise.all([
    admin
      .from("profiles")
      .select(
        "tier, created_at, last_active_at, storage_used_bytes, stripe_subscription_id, is_admin",
      ),
    admin.from("link_stats").select("kind, count"),
    admin.from("newsletter_signups").select("source"),
    headCount(
      admin
        .from("events")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null),
    ),
    // "Active" media = non-removed AND in a non-deleted event (the events!inner + deleted_at filter),
    // so the count stays consistent with the active-events count above (and the P5/accounts definition).
    headCount(
      admin
        .from("media")
        .select("*, events!inner(deleted_at)", { count: "exact", head: true })
        .is("events.deleted_at", null)
        .neq("status", "removed"),
    ),
    headCount(
      admin
        .from("media")
        .select("*, events!inner(deleted_at)", { count: "exact", head: true })
        .is("events.deleted_at", null)
        .neq("status", "removed")
        .eq("type", "photo"),
    ),
    headCount(
      admin
        .from("media")
        .select("*, events!inner(deleted_at)", { count: "exact", head: true })
        .is("events.deleted_at", null)
        .neq("status", "removed")
        .eq("type", "video"),
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
    getPlatformRevenue(),
  ]);

  if (profilesRes.error) throw profilesRes.error;
  if (linkStatsRes.error) throw linkStatsRes.error;
  if (sourcesRes.error) throw sourcesRes.error;

  return {
    accounts: summarizeProfiles(profilesRes.data ?? []),
    content: { events, media, photos, videos },
    engagement: summarizeLinkStats(linkStatsRes.data ?? []),
    growth: {
      newsletterTotal,
      newsletterLast30,
      bySource: countBySource(sourcesRes.data ?? []),
      emailsLast30,
    },
    revenue,
  };
}
