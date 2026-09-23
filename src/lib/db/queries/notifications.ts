/**
 * Notification center read (Phase 6 cut #4) — gathers the raw signals for the bell. All reads
 * are RLS-scoped to the signed-in host (the regular server client): `media_host_all` filters
 * pending media to the host's events, `profiles_select_own` → their row, `announcements_read`
 * → published rows. The pure `buildNotifications` turns this into the badge + panel.
 *
 * Runs in the `(app)` layout on every host page load (always-current, no cron). To add a
 * signal later (e.g. co-host invites — see ROADMAP), add a read here + a field on the result.
 */
import "server-only";

import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";
import type { NotificationSignals } from "@/lib/notifications/build";
import { createClient } from "@/lib/supabase/server";

const ANNOUNCEMENT_LIMIT = 10;

export type NotificationData = Omit<NotificationSignals, "now">;

export async function getNotificationData(): Promise<NotificationData> {
  const supabase = await createClient();

  // Match the bin's recoverable window (listRecentlyDeleted*): only items still SHOWN in the bin
  // count toward the nudge, so the alert never points at an aged-out item the bin won't display
  // (a cron-lag boundary item with purge_at already past). Keeps the soonest purge in the future.
  const windowStart = new Date(
    Date.now() - RECENTLY_DELETED_WINDOW_DAYS * 86_400_000,
  ).toISOString();

  const [
    pending,
    profileRes,
    announcementsRes,
    soonestMediaRes,
    soonestEventRes,
  ] = await Promise.all([
    supabase
      .from("media")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("profiles")
      .select(
        "tier, tier_expires_at, storage_grace_until, announcements_seen_at",
      )
      .single(),
    supabase
      .from("announcements")
      .select("id, title, body, href, published_at")
      .order("published_at", { ascending: false })
      .limit(ANNOUNCEMENT_LIMIT),
    // Soonest upcoming hard-purge, for the bell's "about to be cleared" nudge (the threshold is
    // applied in buildNotifications). Two cheap reads: purge_at is indexed on media; events are few.
    supabase
      .from("media")
      .select("purge_at")
      .eq("status", "removed")
      // A guest's own withdrawal is not the host's to clear or restore (delete-final): it never
      // drives the host's "about to be cleared" nudge.
      .eq("removed_by_uploader", false)
      .not("purge_at", "is", null)
      .gte("removed_at", windowStart)
      .order("purge_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("events")
      .select("purge_at")
      .not("deleted_at", "is", null)
      .not("purge_at", "is", null)
      .gte("deleted_at", windowStart)
      .order("purge_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const profile = profileRes.data;
  // Earlier of the two soonest purge dates (media vs events), or null if the bin is empty.
  const purgeDates = [
    soonestMediaRes.data?.purge_at,
    soonestEventRes.data?.purge_at,
  ].filter((d): d is string => Boolean(d));
  const recoverySoonestPurgeAt =
    purgeDates.length > 0 ? purgeDates.reduce((a, b) => (a < b ? a : b)) : null;

  return {
    pendingCount: pending.count ?? 0,
    storageGraceUntil: profile?.storage_grace_until ?? null,
    tier: profile?.tier ?? "free",
    tierExpiresAt: profile?.tier_expires_at ?? null,
    recoverySoonestPurgeAt,
    announcements: announcementsRes.data ?? [],
    announcementsSeenAt: profile?.announcements_seen_at ?? null,
  };
}
