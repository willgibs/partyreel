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

import type { NotificationSignals } from "@/lib/notifications/build";
import { createClient } from "@/lib/supabase/server";

const ANNOUNCEMENT_LIMIT = 10;

export type NotificationData = Omit<NotificationSignals, "now">;

export async function getNotificationData(): Promise<NotificationData> {
  const supabase = await createClient();

  const [pending, profileRes, announcementsRes] = await Promise.all([
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
  ]);

  const profile = profileRes.data;
  return {
    pendingCount: pending.count ?? 0,
    storageGraceUntil: profile?.storage_grace_until ?? null,
    tier: profile?.tier ?? "free",
    tierExpiresAt: profile?.tier_expires_at ?? null,
    announcements: announcementsRes.data ?? [],
    announcementsSeenAt: profile?.announcements_seen_at ?? null,
  };
}
