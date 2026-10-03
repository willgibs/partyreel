/**
 * THE SERVER'S HALF OF A SAVE (take-home r1): the links a phone's share sheets are filled from, minted when she
 * saves and never before (a window of the album mints no phone link: a Save is rare beside a look, so its links
 * cost only the Saves that happen), and the album's own pictures for the host's two sets.
 *
 * Every row here was authorized by the calling route (a guest's visible album, a host's own event); this only
 * presigns. Each link is a plain presigned GET (never the gallery's stable one, so no `<img>`'s cached answer can
 * poison its CORS read, uploads-and-r2.md) with the download's own name signed in, so the same link is the bytes a
 * share sheet takes and a plain download where no sheet can take a file.
 */
import "server-only";

import {
  copyOf,
  type ExportMediaRow,
  type ExportSize,
} from "@/lib/export/build-manifest";
import { SAVE_MAX_ITEMS, type SaveItem } from "@/lib/export/take-home";
import { buildDownloadFilename } from "@/lib/media/download-filename";
import { presignDownload } from "@/lib/r2/presign";

/**
 * A Save's files, oldest first (the export's own order), each at its size: phone size takes a photograph's copy
 * where it has one and its original where not, and a clip as taken. At most `SAVE_MAX_ITEMS`; `more` says the set
 * ran past it, and the engine then saves none of it (all or none: `TOO_MANY_FOR_PHOTOS`).
 */
export async function saveItemsFor(params: {
  rows: readonly ExportMediaRow[];
  eventName: string;
  size: ExportSize;
}): Promise<{ items: SaveItem[]; more: boolean }> {
  const ordered = [...params.rows].sort(
    (a, b) =>
      Date.parse(a.created_at) - Date.parse(b.created_at) ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
  const these = ordered.slice(0, SAVE_MAX_ITEMS);
  const items = await Promise.all(
    these.map(async (row): Promise<SaveItem> => {
      const { key, bytes } = copyOf(row, params.size);
      const name = buildDownloadFilename({
        eventName: params.eventName,
        key,
        type: row.type,
      });
      return {
        id: row.id,
        type: row.type,
        url: await presignDownload({ key, downloadFilename: name }),
        name,
        bytes,
      };
    }),
  );
  return { items, more: ordered.length > these.length };
}

/** The set's own picture: its newest photographs, at most this many (the panel's mosaic). */
export const PICTURE_COUNT = 6;

/**
 * THE ALBUM PICTURES ITS TWO SETS (bible 6, the media is the colour): the newest shown photographs' tiles (the
 * small preview, else the original), presigned the gallery's stable way, since these are tiles like any other.
 */
export async function setPictures(
  rows: readonly {
    type: "photo" | "video";
    status: string;
    created_at: string;
    original_key: string;
    preview_key: string | null;
  }[],
): Promise<string[]> {
  const newest = rows
    .filter((r) => r.type === "photo" && r.status === "approved")
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, PICTURE_COUNT);
  return Promise.all(
    newest.map((r) =>
      presignDownload({ key: r.preview_key ?? r.original_key, stable: true }),
    ),
  );
}
