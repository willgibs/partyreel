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
import { createClient } from "@/lib/supabase/server";

export type MediaRow = Tables<"media">;

/**
 * HOTFIX (2026-07-08): SELECT on media is COLUMN-scoped at the shared DB (migration
 * 20260707150000 on launch-prep withholds legal_hold_at/legal_hold_reason from authenticated),
 * so a `select("*")` from the RLS client ERRORS at runtime. Enumerate the granted columns.
 * launch-prep carries the fuller version (single-sourced MEDIA_HOST_COLUMNS + a grant-parity
 * test); this back-merges away at the next milestone.
 */
const MEDIA_HOST_COLUMNS =
  "id, event_id, guest_id, type, original_key, preview_key, file_size_bytes, duration_seconds, width, height, status, created_at, updated_at, removed_at, purge_at, removed_by_uploader, reel_eligible, highlight_score, clip_start_seconds, clip_end_seconds";

export async function listEventMedia(eventId: string): Promise<MediaRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
