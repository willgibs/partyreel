import "server-only";

import { type GridMedia } from "@/components/app/media-grid";
import { type MediaRow } from "@/lib/db/queries/media";
import { buildDownloadFilename } from "@/lib/media/download-filename";
import { type UploaderIdentity } from "@/lib/media/uploader-identity";
import { presignDownload } from "@/lib/r2/presign";

/**
 * The HOST gallery item mapper: media rows → presigned GridMedia.
 *
 * One mapper for every host page that shows the album or its queue (the hub,
 * Review). Two pages building "the same" item shape by hand is precisely how a
 * field goes missing on one of them: the quick-add signals (createdAt /
 * uploaderKey) and the preview URL are all easy to forget, and a missing
 * previewUrl silently costs full-res tiles while a missing createdAt silently
 * turns quick-add's recency term into a tie-break.
 *
 * This is the HOST path on purpose (lib/r2/grid-items.ts is the guest one): it is
 * the ONE surface that carries the uploader's email, and it carries host-only like
 * counts. Neither may ever reach a guest page.
 */

/**
 * A host album item: the grid's shape plus `media.reel_eligible` (false only for a
 * clip someone added to the album), so the hub's Reel card counts exactly what the
 * live reel would play (`hubReel`, `lib/event/reel-progress.ts`).
 */
export type HostGalleryItem = GridMedia & { reelEligible: boolean };

export async function toHostGalleryItems({
  media,
  eventName,
  uploaderIdentities,
  likeCounts,
}: {
  media: MediaRow[];
  /** Names the downloaded file (the `attachment` presign). */
  eventName: string;
  uploaderIdentities: Map<string, UploaderIdentity>;
  /** Host-only like counts (get_event_like_counts is gated to this host). */
  likeCounts: Map<string, number>;
}): Promise<HostGalleryItem[]> {
  return Promise.all(
    media.map(async (m) => {
      // Up to three presigned URLs per item: an INLINE url the grid/lightbox render
      // and a forced-download (`attachment`) url the lightbox's Save uses, both
      // from the original's key, and the tile's small preview when it has one.
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
        // The tile-only small preview (client-generated at upload).
        m.preview_key
          ? presignDownload({ key: m.preview_key, stable: true })
          : Promise.resolve(null),
      ]);
      // Uploader attribution (Phase 2). The HOST gallery is the ONE surface that
      // includes email (for identifying a guest); guest surfaces never carry it.
      const who = uploaderIdentities.get(m.id);
      return {
        id: m.id,
        type: m.type,
        url,
        downloadUrl,
        previewUrl,
        status: m.status,
        uploaderName: who?.displayName ?? null,
        isHost: who?.isHost ?? false,
        // The host sees the mark too (`host-lens=badge`): an unproven name reads as one.
        isVerified: who?.isVerified ?? false,
        uploaderEmail: who?.email ?? null,
        likeCount: likeCounts.get(m.id) ?? 0,
        // Quick-add signals (R3), never rendered: recency + per-uploader coverage.
        // A null guest_id means the HOST uploaded it (the same rule the contributor
        // count relies on), so it keys to the literal "host" bucket; anything
        // unattributable falls to the shared anonymous bucket. A guest_id is an
        // opaque id, NOT an email, so this is safe to hand the client.
        createdAt: m.created_at,
        uploaderKey: m.guest_id ?? (who?.isHost ? "host" : null),
        // Natural geometry for the masonry (S3·3a). Null on pre-measure rows →
        // the grid falls back to 1:1 (no CLS). Rides OUTSIDE any ETag.
        width: m.width,
        height: m.height,
        durationSeconds: m.duration_seconds,
        // Write-once at create_media*, so it rides outside any ETag like the geometry.
        reelEligible: m.reel_eligible,
      };
    }),
  );
}
