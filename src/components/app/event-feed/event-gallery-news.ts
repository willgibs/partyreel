"use client";

/**
 * WHAT ARRIVED IN THE HUB'S ALBUM BY ITSELF (album-order: the arrivals pill's word for the hub, `AlbumNews`).
 *
 * Append-only: an id in the album's list (approved or hidden; held ones live in Review) that was not in it the answer
 * before, once ever, never the seed. The grid's own glow reads the same diff (`host-media-grid.tsx`'s
 * `useAlbumArrivals`, `newIds`), so a guest's upload, an approval from Review, a restore and the party a shut laptop
 * missed are all news, and a Sort, a hide or a link landing never is. Decided in the render the arrival first appears
 * in, as the grid's is, off the hub's own store (`useHubEntries`), so the album's header (`EventGallery`) can hand it to
 * the rows it frames without reaching into the grid.
 */
import { useState } from "react";

import {
  useHubEntries,
  type HubAlbum,
} from "@/components/app/event-feed/host-album";
import { isHubEntry } from "@/lib/event/hub-album";
import type { ManifestEntry } from "@/lib/events/album-wire";
import { newIds } from "@/lib/shared/arrival";

const NO_ARRIVALS: readonly string[] = [];

export function useHubArrivals(album: HubAlbum | null): readonly string[] {
  const entries = useHubEntries(album);
  const [seen, setSeen] = useState(() => ({
    entries,
    ids: hubIdsOf(entries),
    arrived: NO_ARRIVALS,
  }));
  if (seen.entries !== entries) {
    const ids = hubIdsOf(entries);
    const known = new Set(seen.arrived);
    const fresh = [...newIds(seen.ids, ids)].filter((id) => !known.has(id));
    setSeen({
      entries,
      ids,
      arrived: fresh.length > 0 ? [...seen.arrived, ...fresh] : seen.arrived,
    });
  }
  return seen.arrived;
}

/** The ids in the hub's album (approved and hidden). */
function hubIdsOf(entries: readonly ManifestEntry[] | null): Set<string> {
  const ids = new Set<string>();
  for (const e of entries ?? []) if (isHubEntry(e)) ids.add(e[0]);
  return ids;
}
