/**
 * THE HOST'S PAGED ALBUM READS: the manifest pages and the rows behind a window's links, on the
 * request's RLS-scoped client (media_host_all scopes every row to the host's own events), after the
 * route's `getUser()` and ownership check. The host's album is everything but the bin: approved,
 * hidden and held, each entry carrying its status in its flags, so the hub's grid and Review read
 * one manifest.
 *
 * The versions and the changes read the deny-all change log through `album-state.ts`; attribution,
 * which reads `guests` and other people's profiles, is the service role's too, and on this path
 * only it carries the uploader's proved email (resolveUploaderIdentity's rule).
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  albumCursorOf,
  olderThan,
  type AlbumCursor as RowCursor,
} from "@/lib/db/queries/guest-events";
import type { AlbumKeyRow } from "@/lib/db/queries/album-guest";
import { readAlbumAttribution } from "@/lib/db/queries/album-state";
import { inChunks, readAllPages } from "@/lib/db/read-all";
import { mustQuery } from "@/lib/db/must-query";
import type { Database } from "@/lib/db/types";
import type { ManifestPage } from "@/lib/events/album-sync";
import {
  microsToTimestamp,
  timestampToMicros,
  toManifestEntry,
  type AlbumCursor,
} from "@/lib/events/album-wire";
import type { UploaderIdentity } from "@/lib/media/uploader-identity";

type Client = SupabaseClient<Database>;

/** Up to `budget` of the host's album (every status but removed) after `after`, and the next cursor. */
export async function readHostManifestPage(
  supabase: Client,
  eventId: string,
  after: AlbumCursor | null,
  budget: number,
): Promise<ManifestPage> {
  const page = await readAllPages(
    "album: host manifest",
    (cursor: RowCursor | null, limit) => {
      let q = supabase
        .from("media")
        .select(
          "id, type, width, height, duration_seconds, preview_key, reel_eligible, created_at, status",
        )
        .eq("event_id", eventId)
        .in("status", ["pending", "approved", "hidden"])
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(limit);
      if (cursor) q = q.or(olderThan(cursor));
      return q;
    },
    albumCursorOf,
    {
      budget,
      after: after ? { at: microsToTimestamp(after[0]), id: after[1] } : null,
    },
  );
  return {
    entries: page.rows.map((m) =>
      toManifestEntry(
        {
          id: m.id,
          type: m.type,
          width: m.width,
          height: m.height,
          duration_seconds: m.duration_seconds,
          has_preview: m.preview_key !== null,
          reel_eligible: m.reel_eligible,
          created_at: m.created_at,
          status: m.status,
        },
        "host",
      ),
    ),
    next:
      page.more && page.after
        ? [timestampToMicros(page.after.at), page.after.id]
        : null,
  };
}

/**
 * The rows behind a host window's links: each asked id in this event that is not in the bin, with
 * its keys, and who uploaded it WITH the proved address. Absent ids are the route's `missing`.
 */
export async function readHostAlbumMedia(
  supabase: Client,
  eventId: string,
  ids: readonly string[],
): Promise<{
  rows: AlbumKeyRow[];
  identities: Map<string, UploaderIdentity>;
}> {
  const [rows, identities] = await Promise.all([
    inChunks(
      "album: host links",
      ids,
      async (chunk) =>
        (await mustQuery(
          supabase
            .from("media")
            .select("id, type, original_key, preview_key")
            .eq("event_id", eventId)
            .neq("status", "removed")
            .in("id", chunk),
          "album: host links",
        )) ?? [],
    ),
    readAlbumAttribution(eventId, ids, { withEmail: true }),
  ]);
  return { rows, identities };
}
