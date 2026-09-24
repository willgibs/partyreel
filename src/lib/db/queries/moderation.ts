/**
 * Operator-internal media reads for the admin Albums browser (P5 — proactive moderation).
 * SERVICE-ROLE admin client: this is the ONLY cross-host media reader (RLS scopes media to the
 * owning host's events). The /admin/albums pages gate on requireAdmin() first. READ-ONLY here;
 * the soft-remove/restore writes live in the albums actions (also service-role, AAL2-gated).
 */
import "server-only";

import { mustCount } from "@/lib/db/must-query";
import { readAllPages } from "@/lib/db/read-all";
import { Constants, type Tables } from "@/lib/db/types";
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
      "id, type, status, created_at, original_key, events!media_event_id_fkey!inner(id, name, host_id, deleted_at)",
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
    eventId: r.events.id,
    eventName: r.events.name,
    hostId: r.events.host_id,
    hostLabel: hosts.get(r.events.host_id) ?? null,
  }));
}

export type AlbumDetail = {
  event: Tables<"events">;
  hostLabel: string | null;
  /** ALL the event's media (every status, newest-first) — includes removed so it can be restored. */
  media: ModerationMediaItem[];
  counts: Record<MediaStatus, number>;
};

/** Every status a media row can hold, from the generated enum, so a new one is counted the day it lands. */
const MEDIA_STATUSES: readonly MediaStatus[] = Constants.public.Enums.media_status;

/**
 * One album (event) with its host + full media list + per-status counts, for the drill-in.
 *
 * ★ THE ALBUM WHOLE, THE COUNTS COUNTED (the 1,000-row round, 2026-09-23). The list pages on its own
 * display order, (created_at desc, id desc), the cursor the last row's raw timestamp string, so a
 * 1,500-item album shows all 1,500 and none twice; the "N approved, N pending" line is four HEAD
 * counts, never the length of a list PostgREST could have cut at 1,000.
 */
export async function getAlbumForModeration(
  eventId: string,
): Promise<AlbumDetail | null> {
  const admin = createAdminClient();

  const { data: event, error } = await admin
    .from("events")
    .select("*")
    .eq("id", eventId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!event) return null;

  const [{ rows }, statusCounts, hostLabels] = await Promise.all([
    readAllPages(
      "admin album: media",
      (after: { at: string; id: string } | null, limit) => {
        let q = admin
          .from("media")
          .select("id, type, status, created_at, original_key")
          .eq("event_id", eventId)
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .limit(limit);
        if (after) {
          q = q.or(
            `created_at.lt.${after.at},and(created_at.eq.${after.at},id.lt.${after.id})`,
          );
        }
        return q;
      },
      (row) => ({ at: row.created_at, id: row.id }),
    ),
    Promise.all(
      MEDIA_STATUSES.map((status) =>
        mustCount(
          admin
            .from("media")
            .select("id", { count: "exact", head: true })
            .eq("event_id", eventId)
            .eq("status", status),
          `admin album: ${status} count`,
        ),
      ),
    ),
    fetchHostLabels(admin, [event.host_id]),
  ]);

  const hostLabel = hostLabels.get(event.host_id) ?? null;
  const counts = Object.fromEntries(
    MEDIA_STATUSES.map((status, i) => [status, statusCounts[i]]),
  ) as Record<MediaStatus, number>;

  const media: ModerationMediaItem[] = rows.map((m) => ({
    id: m.id,
    type: m.type,
    status: m.status,
    createdAt: m.created_at,
    originalKey: m.original_key,
    eventId: event.id,
    eventName: event.name,
    hostId: event.host_id,
    hostLabel,
  }));

  return { event, hostLabel, media, counts };
}
