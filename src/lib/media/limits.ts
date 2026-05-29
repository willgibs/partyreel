/**
 * Universal media limits — these apply to EVERY tier (free → max). They are the
 * hard per-file ceilings; per-tier *counts* live in lib/constants/tiers.ts.
 *
 * The 2 GB video ceiling is why uploads go browser → R2 directly via multipart
 * (a 2 GB body can never pass through a Vercel function). See ADR-0003.
 */

export const MAX_VIDEO_DURATION_SECONDS = 300; // 5 minutes
export const MAX_VIDEO_BYTES = 2 * 1024 ** 3; // 2 GB
export const MAX_PHOTO_BYTES = 50 * 1024 ** 2; // 50 MB (room for HEIC / large JPEG)

/** Mirrors the Postgres `media_type` enum. */
export type MediaKind = "photo" | "video";

export const ACCEPTED_PHOTO_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic", // iPhone default
  "image/heif",
  "image/avif",
] as const;

export const ACCEPTED_VIDEO_MIME = [
  "video/mp4",
  "video/quicktime", // .mov (iPhone)
  "video/webm",
] as const;

export const ACCEPTED_MIME = [
  ...ACCEPTED_PHOTO_MIME,
  ...ACCEPTED_VIDEO_MIME,
] as const;

/**
 * Files at/above this size upload via multipart; smaller files use a single
 * presigned PUT. Size-based (not photo-vs-video) so a 40 MB HEIC burst still
 * single-PUTs and a 3 s clip doesn't pay multipart overhead. Well above the
 * 50 MB photo ceiling and S3's 5 MB minimum part size.
 */
export const MULTIPART_THRESHOLD_BYTES = 100 * 1024 ** 2; // 100 MB
/** Part size for multipart uploads. 2 GB / 16 MB = 128 parts, well under S3's 10k cap. */
export const MULTIPART_PART_SIZE_BYTES = 16 * 1024 ** 2; // 16 MB

/**
 * Canonical file extension (no leading dot) for each accepted MIME. The R2 key
 * extension is derived SERVER-SIDE from the validated content-type via this map,
 * never from the client-supplied filename (which is untrusted / spoofable).
 */
export const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

/** Extension for an accepted MIME, or null if the MIME isn't one we accept. */
export function extForMime(mime: string): string | null {
  return MIME_TO_EXT[mime] ?? null;
}
