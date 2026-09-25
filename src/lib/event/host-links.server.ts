/**
 * THE HOST'S LINKS ANSWER, ONE BUILDER: the host's links route (`/api/album/host/<id>/media`) and the
 * hub page's first window both call it, so the page embeds exactly what the route would answer.
 *
 * ★ IT RUNS AFTER ITS CALLER'S OWN CHECK: the session re-verified with `getUser()` and the event read
 * through RLS (`getEvent`), which is the ownership check. The rows are read on the caller's RLS client;
 * attribution and the like counts are the service role's, keyed on that event alone.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { readHostAlbumMedia } from "@/lib/db/queries/album-host";
import { readMediaLikeCounts } from "@/lib/db/queries/likes";
import type { Database } from "@/lib/db/types";
import { toHostAlbumLinks } from "@/lib/events/album-host-links";
import type { HostAlbumLinksBody } from "@/lib/events/album-wire";
import { presignDownload } from "@/lib/r2/presign";
import { presignBucketId } from "@/lib/r2/presign-bucket";

/**
 * The host's links answer for these ids: the three presigns each (stable, so the image cache holds
 * across re-mints), the uploader's credit with the PROVED address (the host's mapper, the only one
 * that carries an address), and each item's like count. The bucket is read BEFORE minting, so a roll
 * mid-request only makes a link live longer than the client assumes (album-wire.ts). An id that is
 * unknown, in the bin or another event's comes back `missing`, with no count.
 */
export async function readHostLinksBody(
  supabase: SupabaseClient<Database>,
  event: { id: string; name: string },
  ids: readonly string[],
): Promise<HostAlbumLinksBody> {
  const b = Number(presignBucketId(Date.now()));
  const now = Date.now();
  if (ids.length === 0)
    return {
      ok: true,
      access: "full",
      gate: null,
      b,
      now,
      links: [],
      missing: [],
      likes: {},
    };
  const [{ rows, identities }, likes] = await Promise.all([
    readHostAlbumMedia(supabase, event.id, ids),
    readMediaLikeCounts(event.id, ids),
  ]);
  const links = await toHostAlbumLinks(rows, {
    eventName: event.name,
    presign: (key, downloadFilename) =>
      presignDownload({ key, stable: true, downloadFilename }),
    identities,
  });
  const found = new Set(rows.map((r) => r.id));
  return {
    ok: true,
    access: "full",
    gate: null,
    b,
    now,
    links,
    missing: ids.filter((id) => !found.has(id)),
    likes: Object.fromEntries([...likes].filter(([id]) => found.has(id))),
  };
}
