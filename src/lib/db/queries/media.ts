/**
 * Media reads for the authenticated host gallery. RLS-scoped server client +
 * `getUser()` re-check (RLS is the boundary; the proxy is not). `media_host_all`
 * scopes rows to media in the host's own events, so we never filter by host here.
 *
 * 'removed' rows are excluded — those are deleted (their R2 objects purged in
 * Phase 3) and must not surface. Pending + approved + hidden all show to the host.
 */
import "server-only";

import type { Tables } from "@/lib/db/types";
import {
  RECENTLY_DELETED_WINDOW_DAYS,
  binCountdownDays,
} from "@/lib/lifecycle/recently-deleted";
import { getRequestAuth } from "@/lib/supabase/request-auth";

export type MediaRow = Tables<"media">;

export async function listEventMedia(eventId: string): Promise<MediaRow[]> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return [];

  const { data, error } = await supabase
    .from("media")
    .select("*")
    .eq("event_id", eventId)
    .neq("status", "removed")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/**
 * The event's soft-removed media still within the recovery window — the event-detail "Recently
 * deleted" section. Mirror of listEventMedia but `status='removed'` (the bin), newest-removed
 * first, windowed to RECENTLY_DELETED_WINDOW_DAYS (older are about to be hard-purged; the
 * standby-budget cron can also evict early). Carries `purge_at` for the countdown chip. RLS
 * (media_host_all) scopes to media in the host's own events.
 */
/** A soft-removed media row for the event-detail bin, with the days-until-purge countdown. */
export type RemovedMediaRow = MediaRow & { countdownDays: number };

export async function listRecentlyDeletedMedia(
  eventId: string,
): Promise<RemovedMediaRow[]> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return [];

  // One `now` for the window filter + the per-tile countdown — computed HERE (a query, not a
  // component) so the page stays render-pure (no Date.now() in RSC render; react-hooks/purity).
  const now = Date.now();
  const windowStart = new Date(
    now - RECENTLY_DELETED_WINDOW_DAYS * 86_400_000,
  ).toISOString();

  const { data, error } = await supabase
    .from("media")
    .select("*")
    .eq("event_id", eventId)
    .eq("status", "removed")
    .gte("removed_at", windowStart)
    .order("removed_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((m) => ({
    ...m,
    countdownDays: binCountdownDays(m.purge_at, now),
  }));
}
