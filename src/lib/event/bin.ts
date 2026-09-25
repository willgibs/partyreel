/**
 * THE PAGED BIN: the hub's Deleted filter as a manifest of removed items, with links minted per
 * window, the album's own shape on a smaller scale.
 *
 * WHY. Opening Deleted used to read the whole 30-day bin and presign every item in it before one tile
 * drew: after a bulk delete of a thousand photographs, a thousand presigns for a drawer a host opens
 * to recover one. Now the filter reads the bin's list (ids, shapes and countdowns, no links) and the
 * windowed rows ask for links only for what they mount (`/api/events/<id>/bin/media`), minted the
 * album's way, so one link store dates and re-mints them.
 *
 * Pure and isomorphic: the routes build these shapes and the bin's island reads them.
 */
import type { GridMedia } from "@/components/app/media-grid";
import {
  ENTRY_PREVIEW,
  ENTRY_VIDEO,
  type AlbumLinksBody,
} from "@/lib/events/album-wire";

/**
 * One bin item: `[id, w, h, flags, days]`, plus the duration for a video that has one. `flags` is the
 * album's (`ENTRY_VIDEO`, `ENTRY_PREVIEW`); `days` is the whole days until the item purges, computed on
 * the server so every render agrees (`binCountdownDays`). Newest-removed first.
 */
export type BinEntry =
  | readonly [id: string, w: number, h: number, flags: number, days: number]
  | readonly [
      id: string,
      w: number,
      h: number,
      flags: number,
      days: number,
      dur: number,
    ];

/** The bin's list. */
export type BinManifestBody = { ok: true; entries: BinEntry[] };

/**
 * A window's bin links: the album's links answer, with no attribution and no attachment (nothing is
 * saved from the bin, so the viewer shows no Save): each tuple is `[id, tile, view | null, "", null]`.
 */
export type BinLinksBody = AlbumLinksBody<null>;

/** At most this many ids a bin links ask: the album's cap. */
export { ALBUM_MEDIA_MAX_IDS as BIN_MEDIA_MAX_IDS } from "@/lib/events/album-wire";

/** What building a bin entry reads off a removed row. */
export type BinSource = {
  id: string;
  type: "photo" | "video";
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  preview_key: string | null;
  countdownDays: number;
};

export function toBinEntry(row: BinSource): BinEntry {
  const flags =
    (row.type === "video" ? ENTRY_VIDEO : 0) |
    (row.preview_key !== null ? ENTRY_PREVIEW : 0);
  const w = row.width && row.width > 0 ? Math.round(row.width) : 0;
  const h = row.height && row.height > 0 ? Math.round(row.height) : 0;
  const days = Math.max(0, Math.round(row.countdownDays));
  if (row.type === "video" && typeof row.duration_seconds === "number")
    return [
      row.id,
      w,
      h,
      flags,
      days,
      Math.round(row.duration_seconds * 1000) / 1000,
    ];
  return [row.id, w, h, flags, days];
}

/** A bin tile, as the bin's grid draws it: the album's item plus its countdown. */
export type BinMedia = GridMedia & { countdownDays: number };

/** One bin entry and its link (if it has landed) as the grid's item. */
export function binItem(
  e: BinEntry,
  link: { tile: string; view: string } | undefined,
): BinMedia {
  const hasPreview = (e[3] & ENTRY_PREVIEW) !== 0;
  return {
    id: e[0],
    type: e[3] & ENTRY_VIDEO ? "video" : "photo",
    url: link ? link.view : "",
    previewUrl: link && hasPreview ? link.tile : null,
    status: "removed",
    countdownDays: e[4],
    width: e[1] > 0 ? e[1] : null,
    height: e[2] > 0 ? e[2] : null,
    durationSeconds: e.length === 6 ? e[5] : null,
  };
}
