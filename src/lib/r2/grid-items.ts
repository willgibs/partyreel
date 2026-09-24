/**
 * Turn media rows (R2 KEYS) into render-ready GridMedia (presigned URLs) for the
 * galleries. SERVER-ONLY — raw keys never reach the browser (uploads-and-r2.md). Up to
 * three presigns per item: an INLINE url (grid/lightbox render) and an `attachment`
 * download url (the lightbox Save) from the original key, plus the small tile preview
 * from `preview_key` when the row has one (`toModerationFeedItems` mints the first two
 * alone). Single source so the public album, the guest event page, and the gallery poll
 * route all presign identically.
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

type MediaRow = {
  id: string;
  type: MediaKind;
  original_key: string;
  /** The small WebP preview variant (client-generated at upload); null on pre-feature rows or skips. */
  preview_key?: string | null;
  /** Write-once at create_media; null on pre-measure-era rows (grid: 1:1 fallback). */
  width?: number | null;
  height?: number | null;
  duration_seconds?: number | null;
};

export async function toGridItems(
  media: MediaRow[],
  eventName: string,
  // Optional uploader attribution (Phase 2), keyed by media id. GUEST callers pass this to show the
  // name; they pass the WHOLE map but we copy ONLY name/isHost/isVerified here, NEVER email -- so a
  // guest GridMedia can never carry an email (the host gallery builds its items separately, with
  // email).
  identities?: Map<string, UploaderIdentity>,
): Promise<GridMedia[]> {
  return Promise.all(
    media.map(async (m) => {
      const [url, downloadUrl, previewUrl] = await Promise.all([
        presignDownload({ key: m.original_key, stable: true }),
        presignDownload({
          key: m.original_key,
          stable: true,
          downloadFilename: buildDownloadFilename({
            eventName,
            key: m.original_key,
            type: m.type,
          }),
        }),
        // The tile-only small preview (stable-presigned like the original). Null on pre-feature rows.
        m.preview_key
          ? presignDownload({ key: m.preview_key, stable: true })
          : Promise.resolve(null),
      ]);
      const who = identities?.get(m.id);
      return {
        id: m.id,
        type: m.type,
        url,
        downloadUrl,
        previewUrl,
        // Every row that reaches here is APPROVED by construction: the guest/album gallery queries
        // select approved media only (a pending or hidden item never gets presigned for a guest).
        // Stamping it is not decoration - `buildReelProps` filters on `status === "approved"`, so
        // leaving it undefined makes the reel drop EVERY guest item and render an empty timeline.
        // The filter itself is load-bearing on the host side (their items carry a real status), so
        // the fix belongs here, in the surface that knows its rows are approved.
        status: "approved" as const,
        uploaderName: who?.displayName ?? null,
        isHost: who?.isHost ?? false,
        // Unverified is the SAFE default: a surface that passes no identities renders no
        // attribution at all (uploaderName is null), so `false` can never draw a false claim,
        // while `true` would be one waiting to happen.
        isVerified: who?.isVerified ?? false,
        // Masonry geometry + video badge data (Phase 4). Immutable per id, so
        // they ride OUTSIDE the gallery ETag fingerprint (gallery-fingerprint.ts).
        width: m.width ?? null,
        height: m.height ?? null,
        durationSeconds: m.duration_seconds ?? null,
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
        presignDownload({ key: m.originalKey, stable: true }),
        presignDownload({
          key: m.originalKey,
          stable: true,
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

// One row of the personal "Uploads"/"Likes" feed -- the user's own/liked media across MANY events.
// width/height/durationSeconds (Phase 5 S2a) feed the masonry tile aspect ratio; null on
// pre-measure-era rows (the masonry falls back to a 1:1 tile, like the guest gallery).
export type MyUploadRow = {
  id: string;
  type: MediaKind;
  originalKey: string;
  previewKey: string | null;
  eventName: string;
  eventDateLabel: string | null;
  eventQrToken: string;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
};

// The personal cross-event Uploads variant: like the moderation feed, items span events, so each
// presigns its save-filename against its OWN event name; the event context (name/date/token) rides
// along for the lightbox caption. NO uploader attribution (it's all the viewer's own media).
export async function toMyUploadsItems(
  rows: MyUploadRow[],
): Promise<GridMedia[]> {
  return Promise.all(
    rows.map(async (m) => {
      const [url, downloadUrl, previewUrl] = await Promise.all([
        presignDownload({ key: m.originalKey, stable: true }),
        presignDownload({
          key: m.originalKey,
          stable: true,
          downloadFilename: buildDownloadFilename({
            eventName: m.eventName,
            key: m.originalKey,
            type: m.type,
          }),
        }),
        m.previewKey
          ? presignDownload({ key: m.previewKey, stable: true })
          : Promise.resolve(null),
      ]);
      return {
        id: m.id,
        type: m.type,
        url,
        downloadUrl,
        previewUrl,
        eventName: m.eventName,
        eventDateLabel: m.eventDateLabel,
        eventQrToken: m.eventQrToken,
        // Masonry geometry (Phase 5 S2a): null on pre-measure rows -> 1:1 tile.
        width: m.width,
        height: m.height,
        durationSeconds: m.durationSeconds,
      };
    }),
  );
}
