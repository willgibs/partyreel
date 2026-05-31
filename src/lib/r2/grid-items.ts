/**
 * Turn media rows (R2 KEYS) into render-ready GridMedia (presigned URLs) for the
 * galleries. SERVER-ONLY — raw keys never reach the browser (ADR-0003). Two
 * presigns per item from the same key: an INLINE url (grid/lightbox render) and an
 * `attachment` download url (the lightbox Save). Single source so the public album,
 * the guest event page, and the gallery poll route all presign identically.
 */
import "server-only";

import type { GridMedia } from "@/components/app/media-grid";
import { buildDownloadFilename } from "@/lib/media/download-filename";
import type { MediaKind } from "@/lib/media/limits";
import { presignDownload } from "@/lib/r2/presign";

type MediaRow = { id: string; type: MediaKind; original_key: string };

export async function toGridItems(
  media: MediaRow[],
  eventName: string,
): Promise<GridMedia[]> {
  return Promise.all(
    media.map(async (m) => {
      const [url, downloadUrl] = await Promise.all([
        presignDownload({ key: m.original_key }),
        presignDownload({
          key: m.original_key,
          downloadFilename: buildDownloadFilename({
            eventName,
            key: m.original_key,
            type: m.type,
          }),
        }),
      ]);
      return { id: m.id, type: m.type, url, downloadUrl };
    }),
  );
}
