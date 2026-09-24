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
 * the DB (migration 20260707150000): a legal hold must be invisible to the owning host (trust-safety-forensics.md
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
// `removed_by_admin` + `status_before_removed` (QA #8/#24, migration 20260729180000) join them for
// the same reason: an operator takedown carries the trust-safety-forensics.md discretion posture (the host may BE
// the reported party), and the prior-status stamp is machinery, not host-facing state. Types.ts
// will list all three after the post-apply regen — that is exactly when this Omit earns its keep.
export type MediaRow = Omit<
  Tables<"media">,
  | "legal_hold_at"
  | "legal_hold_reason"
  | "removed_by_system"
  | "removed_by_admin"
  | "status_before_removed"
>;

/**
 * The host's LIVE album: the read behind the event page's grid and its viewer, the Review room's
 * queue (its pending subset) and the host's Download all. `status <> 'removed'` is what keeps a
 * guest's own withdrawal off every one of them, so a pending upload the guest deletes leaves Review
 * on the next render, and a stale Review tap cannot bring it back (the moderation writes refuse a
 * removed row).
 */
export async function listEventMedia(eventId: string): Promise<MediaRow[]> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return [];

  // row-cap-todo: C1 the host's live album is cut at 1,000: the oldest drop from the grid, Review and
  // Download all
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
 *
 * ★ `removed_by_uploader = false` is a PRODUCT rule, not an optimisation: a guest deleting their
 * own upload from someone else's event is final, for the host too (Will, 2026-09-23: "I want it
 * gone everywhere"), which is why `restore_media` carries `and m.removed_by_uploader = false` and
 * refuses those rows. The bin had no such filter, so it listed items with a Restore button the RPC
 * would always refuse, and showed the host a guest's change of mind. media_host_all does NOT filter
 * it either (checked against the live policy, 2026-09-02), so this query is the only place the rule
 * can hold for the list. The rows still auto-purge on the same clock, and they count in neither of
 * the storage meter's numbers: `host_storage_summary`'s Deleted figure is only what this bin can
 * restore (20260923160000). media.test.ts pins both reads here against a withdrawn row.
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

  // row-cap-todo: H1 the Recently deleted bin is cut at 1,000 rows
  const { data, error } = await supabase
    .from("media")
    .select(MEDIA_HOST_COLUMNS)
    .eq("event_id", eventId)
    .eq("status", "removed")
    .eq("removed_by_uploader", false)
    .gte("removed_at", windowStart)
    .order("removed_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((m) => ({
    ...m,
    countdownDays: binCountdownDays(m.purge_at, now),
  }));
}
