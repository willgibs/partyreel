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
import type { UploaderIdentity } from "@/lib/media/uploader-identity";
import type {
  ModerationGridItem,
  ModerationMediaItem,
} from "@/lib/moderation/operator-actions";
import { presignDownload } from "@/lib/r2/presign";

type MediaRow = { id: string; type: MediaKind; original_key: string };

export async function toGridItems(
  media: MediaRow[],
  eventName: string,
  // Optional uploader attribution (Phase 2), keyed by media id. GUEST callers pass this to show the
  // name; they pass the WHOLE map but we copy ONLY name/isHost/isAnonymous here, NEVER email -- so a
  // guest GridMedia can never carry an email (the host gallery builds its items separately, with email).
  identities?: Map<string, UploaderIdentity>,
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
      const who = identities?.get(m.id);
      return {
        id: m.id,
        type: m.type,
        url,
        downloadUrl,
        uploaderName: who?.displayName ?? null,
        isHost: who?.isHost ?? false,
        isAnonymous: who?.isAnonymous ?? false,
      };
    }),
  );
}

// The operator Albums variant: items span multiple events (the feed), so each presigns the
// save-filename against its OWN event name, and the status + album context ride along (the
// moderation grid needs status to pick Remove vs Restore, and the caption to link to the album).
// Same presign primitives as toGridItems — just per-item event name.
export async function toModerationFeedItems(
  items: ModerationMediaItem[],
): Promise<ModerationGridItem[]> {
  return Promise.all(
    items.map(async (m) => {
      const [url, downloadUrl] = await Promise.all([
        presignDownload({ key: m.originalKey }),
        presignDownload({
          key: m.originalKey,
          downloadFilename: buildDownloadFilename({
            eventName: m.eventName,
            key: m.originalKey,
            type: m.type,
          }),
        }),
      ]);
      return {
        id: m.id,
        type: m.type,
        url,
        downloadUrl,
        status: m.status,
        eventId: m.eventId,
        eventName: m.eventName,
        hostLabel: m.hostLabel,
      };
    }),
  );
}
