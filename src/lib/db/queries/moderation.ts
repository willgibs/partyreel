/**
 * Operator-internal media reads for the admin Albums browser (P5 — proactive moderation).
 * SERVICE-ROLE admin client: this is the ONLY cross-host media reader (RLS scopes media to the
 * owning host's events). The /admin/albums pages gate on requireAdmin() first. READ-ONLY here;
 * the soft-remove/restore writes live in the albums actions (also service-role, AAL2-gated).
 */
import "server-only";

import { mustCount, mustQuery } from "@/lib/db/must-query";
import { Constants, type Tables } from "@/lib/db/types";
import {
  ALBUM_DRILL_IN_PAGE,
  type AlbumCursor,
} from "@/lib/moderation/album-pages";
import {
  type AlbumFilter,
  type ModerationMediaItem,
} from "@/lib/moderation/operator-actions";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

const FEED_LIMIT = 60;

type MediaStatus = Tables<"media">["status"];
type MediaKind = Tables<"media">["type"];

// Shape of the media→event embed select (PostgREST returns the to-one `events` as an object).
type FeedRow = {
  id: string;
  type: MediaKind;
  status: MediaStatus;
  created_at: string;
  original_key: string;
  preview_key: string | null;
  events: {
    id: string;
    name: string;
    host_id: string;
    deleted_at: string | null;
  };
};

// Batch-fetch host display labels by id (the accounts.ts enrichment convention — avoids a deep
// nested media→event→profile embed). Label = trimmed display name, else email, else null.
async function fetchHostLabels(
  admin: AdminClient,
  ids: string[],
): Promise<Map<string, string | null>> {
  if (ids.length === 0) return new Map();
  // row-cap: host labels for one feed page (FEED_LIMIT, 60) or one album: at most 60 ids
  const { data, error } = await admin
    .from("profiles")
    .select("id, email, display_name")
    .in("id", ids);
  if (error) throw error;
  return new Map(
    (data ?? []).map((p) => [p.id, p.display_name?.trim() || p.email || null]),
  );
}

/**
 * The proactive-moderation feed: newest media across ALL non-deleted events, capped. `filter`
 * "all" = active (excludes removed); any other value narrows to that exact status ("removed"
 * surfaces recently-removed items so the operator can restore them).
 */
export async function listRecentMedia(
  filter: AlbumFilter = "all",
): Promise<ModerationMediaItem[]> {
  const admin = createAdminClient();

  let query = admin
    .from("media")
    .select(
      "id, type, status, created_at, original_key, preview_key, events!media_event_id_fkey!inner(id, name, host_id, deleted_at)",
    )
    .is("events.deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(FEED_LIMIT);

  query =
    filter === "all"
      ? query.neq("status", "removed")
      : query.eq("status", filter);

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as unknown as FeedRow[];
  const hosts = await fetchHostLabels(admin, [
    ...new Set(rows.map((r) => r.events.host_id)),
  ]);

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    status: r.status,
    createdAt: r.created_at,
    originalKey: r.original_key,
    previewKey: r.preview_key,
    eventId: r.events.id,
    eventName: r.events.name,
    hostId: r.events.host_id,
    hostLabel: hosts.get(r.events.host_id) ?? null,
  }));
}

export type AlbumDetail = {
  event: Tables<"events">;
  hostLabel: string | null;
  /**
   * ONE PAGE of the event's media (every status, or the one asked, newest first, at most
   * `ALBUM_DRILL_IN_PAGE`): removed included, so it can be restored.
   */
  media: ModerationMediaItem[];
  /** The whole album's per-status counts, whatever the page narrows to. */
  counts: Record<MediaStatus, number>;
  /** How many of the album's items (of the status asked, when one is) come before this page (0 on the newest page). */
  position: number;
  /** Where the next, older page starts, or null when this page ends on the album's oldest item. */
  next: AlbumCursor | null;
};

/** Every status a media row can hold, from the generated enum, so a new one is counted the day it lands. */
const MEDIA_STATUSES: readonly MediaStatus[] =
  Constants.public.Enums.media_status;

/**
 * One album (event) with its host, ONE PAGE of its media and its per-status counts, for the drill-in.
 *
 * ★ A PAGE AT A TIME, THE COUNTS COUNTED (crumbs-37, after the 1,000-row round). The drill-in read the whole
 * album and the page presigned every item, so past a few thousand items one look was thousands of links. It
 * reads one page on its own display order, (created_at desc, id desc), after the cursor an Older link carries
 * (the last item's RAW timestamp string, so a tie on the microsecond never skips or repeats one), and asks one
 * more row than it shows to know whether an older page exists; the "N approved, N pending" line stays four
 * HEAD counts, and where this page sits among them is one more (the items up to the cursor's own).
 *
 * The cursor arrives as two strings, never an object, so the page and its title share one read through
 * React's `cache()` (which compares arguments by value only for primitives).
 *
 * ★ ONE STATUS, WHEN ASKED (crumbs-41): `status` narrows the page and where it sits to that status, paging the
 * same keyset (`media_event_id_status_idx` finds a rare status in a big album; the common one walks
 * `media_event_created_id_idx`), while the four counts stay the whole album's.
 */
export async function getAlbumForModeration(
  eventId: string,
  beforeAt: string | null = null,
  beforeId: string | null = null,
  status: MediaStatus | null = null,
): Promise<AlbumDetail | null> {
  const admin = createAdminClient();
  const before: AlbumCursor | null =
    beforeAt && beforeId ? { at: beforeAt, id: beforeId } : null;

  const { data: event, error } = await admin
    .from("events")
    .select("*")
    .eq("id", eventId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!event) return null;

  /** The cursor's keyset in the display order: strictly older than the item it names. */
  const older = (c: AlbumCursor) =>
    `created_at.lt.${c.at},and(created_at.eq.${c.at},id.lt.${c.id})`;
  /** The items on the pages before this one: newer than the cursor, and the item it names (their last). */
  const throughCursor = (c: AlbumCursor) =>
    `created_at.gt.${c.at},and(created_at.eq.${c.at},id.gte.${c.id})`;

  const pageQuery = () => {
    let q = admin
      .from("media")
      .select("id, type, status, created_at, original_key, preview_key")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(ALBUM_DRILL_IN_PAGE + 1);
    if (status) q = q.eq("status", status);
    if (before) q = q.or(older(before));
    return q;
  };

  /** Where this page sits: the items before it, of the status asked when one is. */
  const positionQuery = (c: AlbumCursor) => {
    let q = admin
      .from("media")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .or(throughCursor(c));
    if (status) q = q.eq("status", status);
    return q;
  };

  const [rows, statusCounts, hostLabels, position] = await Promise.all([
    mustQuery(pageQuery(), "admin album: media page"),
    Promise.all(
      MEDIA_STATUSES.map((counted) =>
        mustCount(
          admin
            .from("media")
            .select("id", { count: "exact", head: true })
            .eq("event_id", eventId)
            .eq("status", counted),
          `admin album: ${counted} count`,
        ),
      ),
    ),
    fetchHostLabels(admin, [event.host_id]),
    before
      ? mustCount(positionQuery(before), "admin album: items before the page")
      : Promise.resolve(0),
  ]);

  const hostLabel = hostLabels.get(event.host_id) ?? null;
  const counts = Object.fromEntries(
    MEDIA_STATUSES.map((counted, i) => [counted, statusCounts[i]]),
  ) as Record<MediaStatus, number>;

  const page = (rows ?? []).slice(0, ALBUM_DRILL_IN_PAGE);
  const last = page.at(-1);
  const next =
    (rows ?? []).length > ALBUM_DRILL_IN_PAGE && last
      ? { at: last.created_at, id: last.id }
      : null;

  const media: ModerationMediaItem[] = page.map((m) => ({
    id: m.id,
    type: m.type,
    status: m.status,
    createdAt: m.created_at,
    originalKey: m.original_key,
    previewKey: m.preview_key,
    eventId: event.id,
    eventName: event.name,
    hostId: event.host_id,
    hostLabel,
  }));

  return { event, hostLabel, media, counts, position, next };
}
