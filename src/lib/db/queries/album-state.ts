/**
 * THE PAGED ALBUM'S RAW READS: an event's versions, the one-snapshot changes read, and attribution
 * by id. Service role, because `album_state` and `album_changes` are deny-all (RLS on, no policy)
 * and attribution reads `guests` and other people's `profiles` (database-security.md).
 *
 * ★ NONE OF THESE DECIDES WHO MAY SEE AN ALBUM. A guest reaches them only through the readers that
 * carry their own gate (`album-guest.ts`: the album's visibility and the unlock cookie, after the
 * route's `resolveViewerDecision`); the host's routes call them directly, after `getUser()` and the
 * RLS-scoped ownership read (`getEvent`), which is the check.
 */
import "server-only";

import { inChunks } from "@/lib/db/read-all";
import { mustQuery } from "@/lib/db/must-query";
import {
  parseAlbumRead,
  type AlbumRead,
  type AlbumScope,
} from "@/lib/events/album-sync";
import {
  resolveUploaderIdentity,
  type UploaderIdentity,
  type UploaderRow,
} from "@/lib/media/uploader-identity";
import { createAdminClient } from "@/lib/supabase/admin";

/** One media row's uploader, as the attribution read embeds it (the address only on the host's path). */
type AttributionRow = {
  id: string;
  guest_id: string | null;
  guests:
    | (Omit<NonNullable<UploaderRow["guests"]>, "email"> & {
        email?: string | null;
      })
    | null;
};

/** An event's three versions. Zeros before its first bump (an event created after the migration). */
export type AlbumVersions = {
  version: number;
  albumMax: number;
  attrVersion: number;
};

/**
 * THE WHOLE COST OF A QUIET POLL: one indexed row. The validator is built from this; a matching
 * `If-None-Match` answers 304 with nothing else read.
 */
export async function readAlbumVersions(
  eventId: string,
): Promise<AlbumVersions> {
  const row = await mustQuery(
    createAdminClient()
      .from("album_state")
      .select("version, album_max, attr_version")
      .eq("event_id", eventId)
      .maybeSingle(),
    "album: versions",
  );
  return {
    version: row?.version ?? 0,
    albumMax: row?.album_max ?? 0,
    attrVersion: row?.attr_version ?? 0,
  };
}

/**
 * `album_changes_since`: the versions, the counts and the changes since `after`, ONE snapshot (a
 * STABLE SQL function answering one jsonb). `limit` 0 reads the versions and counts alone, which is
 * how a manifest takes its version before its first page.
 */
export async function readAlbumChanges(
  eventId: string,
  scope: AlbumScope,
  after: number,
  limit: number,
): Promise<AlbumRead> {
  const data = await mustQuery(
    createAdminClient().rpc("album_changes_since", {
      p_event_id: eventId,
      p_scope: scope,
      p_after: after,
      p_limit: limit,
    }),
    "album: changes since",
  );
  return parseAlbumRead(data);
}

/**
 * Who uploaded each of these items, by the one precedence rule (`resolveUploaderIdentity`), for
 * exactly the ids a window asked for: never the whole album's sweep the gallery pays today.
 *
 * ★ `withEmail: false` NEVER SELECTS THE ADDRESS. The guest's links need a name and two flags, so the
 * guest path does not even read `guests.email` (the resolver then answers a null address), and no
 * mapper downstream can leak what was never fetched. Only the host's path asks for it.
 */
export async function readAlbumAttribution(
  eventId: string,
  mediaIds: readonly string[],
  opts: { withEmail: boolean },
): Promise<Map<string, UploaderIdentity>> {
  const admin = createAdminClient();
  const guestColumns = opts.withEmail
    ? "user_id, email, display_name, verified_at, profiles!guests_user_id_fkey(display_name)"
    : "user_id, display_name, verified_at, profiles!guests_user_id_fkey(display_name)";

  const [host, rows] = await Promise.all([
    // The host's name attributes the host's own uploads. Pinned to its foreign key: a junction table
    // between events and profiles (profile_shown_events) makes a bare `profiles(...)` embed ambiguous.
    mustQuery(
      admin
        .from("events")
        .select("host_id, profiles!events_host_id_fkey(display_name)")
        .eq("id", eventId)
        .maybeSingle(),
      "album: attribution host",
    ),
    inChunks(
      "album: attribution",
      mediaIds,
      async (chunk) =>
        (await mustQuery(
          admin
            .from("media")
            .select(`id, guest_id, guests!media_guest_id_fkey(${guestColumns})`)
            .eq("event_id", eventId)
            .in("id", chunk)
            // The embeds' shape is UploaderRow's, less the address on the guest path; replace, never
            // merge, the inferred row.
            .overrideTypes<Array<AttributionRow>, { merge: false }>(),
          "album: attribution",
        )) ?? [],
    ),
  ]);

  const hostName =
    (host?.profiles as { display_name: string | null } | null)?.display_name ??
    null;
  const map = new Map<string, UploaderIdentity>();
  for (const row of rows) {
    const guest = row.guests
      ? { ...row.guests, email: row.guests.email ?? null }
      : null;
    map.set(
      row.id,
      resolveUploaderIdentity(
        { guest_id: row.guest_id, guests: guest },
        hostName,
      ),
    );
  }
  return map;
}
