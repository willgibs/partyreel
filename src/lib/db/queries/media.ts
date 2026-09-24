/**
 * Media reads for the authenticated host gallery. RLS-scoped server client +
 * `getUser()` re-check (RLS is the boundary; the proxy is not). `media_host_all`
 * scopes rows to media in the host's own events, so we never filter by host here.
 *
 * 'removed' rows are excluded — those are deleted (their R2 objects purged in
 * Phase 3) and must not surface. Pending + approved + hidden all show to the host.
 *
 * ★ EVERY LIST HERE IS READ WHOLE, EVERY COUNT IS COUNTED (the 1,000-row round, 2026-09-23;
 * the rules are `read-all.ts`'s header). PostgREST ends any one read at 1,000 rows without a
 * word, so a list pages on a keyset through `readAllPages` and a number is a head count, never
 * a list's length. Each read has a `read*` twin that takes the client, which is what the
 * RLS-scoped `list*` / `count*` call after the auth check, and what a test or an operator
 * script hands a fake or the admin client.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { mustCount, mustQuery } from "@/lib/db/must-query";
import { readAllPages } from "@/lib/db/read-all";
import type { Database, Tables } from "@/lib/db/types";
import {
  RECENTLY_DELETED_WINDOW_DAYS,
  binCountdownDays,
} from "@/lib/lifecycle/recently-deleted";
import { getRequestAuth } from "@/lib/supabase/request-auth";

type Client = SupabaseClient<Database>;

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

/** A keyset cursor: the last row's raw timestamp string and its id (the tiebreak). */
type Cursor = { at: string; id: string } | null;

/**
 * The composite keyset for a newest-first list ordered `(<column> desc, id desc)`: the rows
 * strictly after the cursor. The cursor is the RAW timestamp string PostgREST returned, never a
 * `Date` (microseconds decide ties, and a `Date` keeps milliseconds), and both values are
 * double-quoted because PostgREST reserves `.` and `:` inside a filter value (its URL grammar,
 * "Reserved characters"), and a timestamp carries both.
 */
function newestFirstAfter(
  column: string,
  after: { at: string; id: string },
): string {
  return `${column}.lt."${after.at}",and(${column}.eq."${after.at}",id.lt."${after.id}")`;
}

/**
 * Which part of an event's media a host read lists:
 *  - `live`: every status but removed (the export's Download all, whose modal splits shown from
 *    hidden and held),
 *  - `album`: approved + hidden (the hub's grid and the Studio's items; pending lives in Review),
 *  - `pending`: the Review room's queue alone.
 */
export type AlbumSlice = "live" | "album" | "pending";

/**
 * The host's album, READ WHOLE, newest first: the read behind the event page's grid and its
 * viewer, the Review room's queue and the host's Download all. `status <> 'removed'` is what keeps
 * a guest's own withdrawal off every one of them, so a pending upload the guest deletes leaves
 * Review on the next render, and a stale Review tap cannot bring it back (the moderation writes
 * refuse a removed row).
 *
 * It pages on `(created_at desc, id desc)`, which `media_event_created_id_idx` serves as an index
 * walk, so an album of any size comes back complete and in one stable order (two uploads sharing
 * a timestamp can never straddle a page boundary and be read twice or skipped). A failed page
 * throws a `QueryFailedError`, never a shorter album.
 */
export async function readEventMedia(
  supabase: Client,
  eventId: string,
  slice: AlbumSlice = "live",
): Promise<MediaRow[]> {
  const { rows } = await readAllPages(
    `media: the ${slice} album`,
    (after: Cursor, limit) => {
      let q = supabase
        .from("media")
        .select(MEDIA_HOST_COLUMNS)
        .eq("event_id", eventId)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(limit);
      if (slice === "pending") q = q.eq("status", "pending");
      else if (slice === "album") q = q.in("status", ["approved", "hidden"]);
      else q = q.neq("status", "removed");
      if (after) q = q.or(newestFirstAfter("created_at", after));
      return q;
    },
    (m) => ({ at: m.created_at, id: m.id }),
  );
  return rows;
}

/** `readEventMedia` on the request's RLS-scoped client, after the `getUser()` re-check. */
export async function listEventMedia(
  eventId: string,
  slice: AlbumSlice = "live",
): Promise<MediaRow[]> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return [];
  return readEventMedia(supabase, eventId, slice);
}

/** The hub's two numbers: the album (approved + hidden) and the Review queue (pending). */
export type AlbumCounts = { album: number; pending: number };

/**
 * The album's two counts, COUNTED: two head counts on `media_event_id_status_idx`, never the
 * length of a list (a list read stops at 1,000, so its length would too). The album count is
 * approved + hidden, the photographs guests can see plus the ones the host has tucked away;
 * removed (the bin) and pending (Review) are never in it. A failed count throws: a count that
 * failed must never read as a confident zero.
 */
export async function readAlbumCounts(
  supabase: Client,
  eventId: string,
): Promise<AlbumCounts> {
  const [album, pending] = await Promise.all([
    mustCount(
      supabase
        .from("media")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .in("status", ["approved", "hidden"]),
      "media: album count",
    ),
    mustCount(
      supabase
        .from("media")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("status", "pending"),
      "media: pending count",
    ),
  ]);
  return { album, pending };
}

/** `readAlbumCounts` on the request's RLS-scoped client, after the `getUser()` re-check. */
export async function countEventMedia(eventId: string): Promise<AlbumCounts> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return { album: 0, pending: 0 };
  return readAlbumCounts(supabase, eventId);
}

/**
 * The newest `updated_at` among the event's non-removed media, or null when it has none: the live
 * poll's change signal beside the two counts. `media_set_updated_at` (the init schema's BEFORE
 * UPDATE trigger) stamps `now()` on EVERY write to a row, so a hide or an unhide from a second tab,
 * which moves neither count, still moves this; an arrival or a removal moves a count as well. One
 * row, whatever the album's size.
 */
export async function readNewestAlbumUpdate(
  supabase: Client,
  eventId: string,
): Promise<string | null> {
  const row = await mustQuery(
    supabase
      .from("media")
      .select("updated_at")
      .eq("event_id", eventId)
      .neq("status", "removed")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    "media: newest update",
  );
  return row?.updated_at ?? null;
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
 *
 * Read WHOLE on `(removed_at desc, id desc)`: a bulk Delete stamps one `removed_at` on its whole
 * selection, so the id tiebreak is what walks a thousand rows that share one timestamp.
 */
/** A soft-removed media row for the event-detail bin, with the days-until-purge countdown. */
export type RemovedMediaRow = MediaRow & { countdownDays: number };

export async function readRecentlyDeletedMedia(
  supabase: Client,
  eventId: string,
  now: number,
): Promise<RemovedMediaRow[]> {
  const windowStart = new Date(
    now - RECENTLY_DELETED_WINDOW_DAYS * 86_400_000,
  ).toISOString();

  const { rows } = await readAllPages(
    "media: the Recently deleted bin",
    (after: Cursor, limit) => {
      let q = supabase
        .from("media")
        .select(MEDIA_HOST_COLUMNS)
        .eq("event_id", eventId)
        .eq("status", "removed")
        .eq("removed_by_uploader", false)
        .gte("removed_at", windowStart)
        .order("removed_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(limit);
      if (after) q = q.or(newestFirstAfter("removed_at", after));
      return q;
    },
    // Never null in this read: the window filter above keeps no row without a `removed_at`.
    (m) => ({ at: m.removed_at ?? "", id: m.id }),
  );
  return rows.map((m) => ({
    ...m,
    countdownDays: binCountdownDays(m.purge_at, now),
  }));
}

export async function listRecentlyDeletedMedia(
  eventId: string,
): Promise<RemovedMediaRow[]> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return [];

  // One `now` for the window filter + the per-tile countdown — computed HERE (a query, not a
  // component) so the page stays render-pure (no Date.now() in RSC render; react-hooks/purity).
  return readRecentlyDeletedMedia(supabase, eventId, Date.now());
}
