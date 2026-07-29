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

/**
 * Every media column EXCEPT legal_hold_at / legal_hold_reason. SELECT on media is COLUMN-scoped at
 * the DB (migration 20260707150000): a legal hold must be invisible to the owning host (ADR-0020
 * discretion — the host may BE the investigated uploader), so the authenticated grant excludes the
 * hold columns and a `select("*")` from the RLS client ERRORS at runtime. Single source for the
 * host-side media reads; a Vitest parity test pins this list to the migration's grant. Adding a
 * media column? Grant it in a migration AND add it here.
 */
export const MEDIA_HOST_COLUMNS =
  "id, event_id, guest_id, type, original_key, preview_key, file_size_bytes, duration_seconds, width, height, status, created_at, updated_at, removed_at, purge_at, removed_by_uploader, reel_eligible, highlight_score, clip_start_seconds, clip_end_seconds";

// Strips every column the authenticated grant WITHHOLDS, keeping this type equal to what the
// queries above can actually return. `removed_by_system` (QA #2) joins the hold columns here: a
// column-scoped SELECT grant does NOT extend to columns added later, so `authenticated` cannot
// read it — and shouldn't (it records OUR sweep's action, not the host's). Verified live:
// has_column_privilege('authenticated','public.media','removed_by_system','SELECT') = false.
export type MediaRow = Omit<
  Tables<"media">,
  "legal_hold_at" | "legal_hold_reason" | "removed_by_system"
>;

export async function listEventMedia(eventId: string): Promise<MediaRow[]> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return [];

  const { data, error } = await supabase
    .from("media")
    .select(MEDIA_HOST_COLUMNS)
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
    .select(MEDIA_HOST_COLUMNS)
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
