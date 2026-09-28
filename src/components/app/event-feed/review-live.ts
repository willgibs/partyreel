"use client";

import { useMemo } from "react";

import {
  useHostAlbum,
  useHubEntries,
  type HubAlbum,
} from "@/components/app/event-feed/host-album";
import type { GridMedia } from "@/components/app/media-grid";
import { hubItem } from "@/lib/event/hub-album";
import {
  ENTRY_PENDING,
  entryId,
  type ManifestEntry,
} from "@/lib/events/album-wire";

import type { ReviewLive } from "./use-review-triage";

/**
 * THE REVIEW ROOM'S LIVE SIGNAL IS THE HUB'S (host-curation `arrivals=prompt`, the brief: "find the
 * live signal the hub already has rather than adding a poll"). The room mounts the hub's own album
 * store (`HostAlbumProvider`: the host's version poll, its doorbell, a question on the tab's return),
 * and this reads the queue off its manifest: every entry flagged waiting, newest first, and every
 * other entry decided. The host's version moves on every status change, which is exactly how a held
 * upload reaches the hub's Review card; the room hears it the same way and at the same cadence.
 *
 * Null outside a `HostAlbumProvider` (the Library's specimen of the room), where the room is still.
 */
export function useReviewLive(): ReviewLive | null {
  const album = useHostAlbum();
  const entries = useHubEntries(album);
  return useMemo(() => {
    if (!album || !entries) return null;
    const waiting: string[] = [];
    const decided = new Set<string>();
    for (const e of entries) {
      if (e[3] & ENTRY_PENDING) waiting.push(entryId(e));
      else decided.add(entryId(e));
    }
    return {
      waiting,
      decided,
      media: (ids) => reviewMedia(album, entries, ids),
      // Settles once the store has answered (a coalesced ask runs again after the one in the air,
      // so the answer is always to a question asked after the room's write landed).
      sync: () => album.sync(),
    };
  }, [album, entries]);
}

/** Microseconds since the epoch (the manifest's `t`) as the ISO time a grid item carries. */
function isoFromMicros(t: number): string | null {
  return t > 0 ? new Date(Math.floor(t / 1000)).toISOString() : null;
}

/**
 * The tiles of uploads the room has not shown: their links minted through the album's own link
 * store (the host's links route, three presigns each, the credit with the proved address), each
 * built into a grid item the way the hub builds its own (`hubItem`). An id with no entry or no link
 * (taken back meanwhile) is left out.
 */
async function reviewMedia(
  album: HubAlbum,
  entries: readonly ManifestEntry[],
  ids: readonly string[],
): Promise<GridMedia[]> {
  await album.store.links.ensure(ids);
  const byId = new Map(entries.map((e) => [entryId(e), e] as const));
  return ids.flatMap((id) => {
    const entry = byId.get(id);
    const link = album.linkOf(id);
    if (!entry || !link) return [];
    return [
      {
        ...hubItem(entry, link, album.likeCounts.get(id)),
        createdAt: isoFromMicros(entry[4]),
      },
    ];
  });
}
