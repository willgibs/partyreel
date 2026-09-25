/**
 * Notification center read (Phase 6 cut #4) — gathers the raw signals for the bell. All reads
 * are RLS-scoped to the signed-in host (the request-cached `getUser()` client the layout already
 * validated): `media_host_all` filters pending media to the host's events, `profiles_select_own`
 * → their row, `announcements_read` → published rows. The pure `buildNotifications` turns this
 * into the badge + panel.
 *
 * Runs in the `(app)` layout on every host page load (always-current, no cron). To add a
 * signal later (e.g. co-host invites — see ROADMAP), add a read here + a field on the result.
 */
import "server-only";

import { getEventCardStats, listEvents } from "@/lib/db/queries/events";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";
import type {
  NotificationSignals,
  PendingEvent,
} from "@/lib/notifications/build";
import { getRequestAuth } from "@/lib/supabase/request-auth";

const ANNOUNCEMENT_LIMIT = 10;

export type NotificationData = Omit<NotificationSignals, "now">;

/**
 * ★ THE BELL COUNTS THE QUEUE THE CARDS COUNT (`review=agree`): pending media outside the bin, on
 * the host's LIVE events. The old head count read every pending row the host could see, a
 * soft-deleted event's queue included, so the bell disagreed with every card on the page. The
 * cheap head count runs on every host page; only when it finds a queue does the bell read which
 * events hold it, through the cards' own `event_card_stats` over `listEvents` (request-cached, so
 * the dashboard pays for it once), and then the rows and the badge both come from that one read.
 */
async function readPendingByEvent(): Promise<PendingEvent[]> {
  const events = await listEvents();
  const stats = await getEventCardStats(events.map((e) => e.id));
  return events
    .map((e) => ({
      eventId: e.id,
      eventName: e.name,
      pending: stats.get(e.id)?.pending ?? 0,
    }))
    .filter((queue) => queue.pending > 0);
}

export async function getNotificationData(): Promise<NotificationData> {
  const { supabase, user } = await getRequestAuth();

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
      .select("id, events!media_event_id_fkey!inner(host_id, deleted_at)", {
        count: "exact",
        head: true,
      })
      .eq("events.host_id", user?.id ?? "")
      .is("events.deleted_at", null)
      .eq("status", "pending")
      .is("removed_at", null),
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

  const pendingCount = pending.count ?? 0;
  // The bell rides every host page's layout, so it must never take one down: a failed breakdown
  // falls back to the single row over the head count (the builder's no-`pendingByEvent` path),
  // and the cards and Review, which read the same function on their own pages, say it loudly.
  const pendingByEvent =
    pendingCount > 0 && user
      ? await readPendingByEvent().catch(() => undefined)
      : [];

  return {
    pendingCount,
    pendingByEvent,
    storageGraceUntil: profile?.storage_grace_until ?? null,
    tier: profile?.tier ?? "free",
    tierExpiresAt: profile?.tier_expires_at ?? null,
    recoverySoonestPurgeAt,
    announcements: announcementsRes.data ?? [],
    announcementsSeenAt: profile?.announcements_seen_at ?? null,
  };
}
