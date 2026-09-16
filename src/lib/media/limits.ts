/**
 * Universal media limits — these apply to EVERY tier (free → max). Size is the ONLY
 * per-file gate (no duration cap); per-tier *counts* live in lib/constants/tiers.ts.
 *
 * The 10 GB ceiling is why uploads go browser → R2 directly (single PUT under 100 MB,
 * else multipart); a multi-GB body can never pass through a Vercel function. See uploads-and-r2.md.
 */

/**
 * Universal per-upload ceiling — EVERY tier, BOTH photos and videos. Size is the only
 * gate. A host can set a STRICTER per-event cap (events.max_upload_bytes); the storage
 * cap bounds the account total. 10 GiB uploads as ~640 × 16 MB multipart parts (< R2's
 * 10,000-part max). MIRRORED by the SQL `c_max_upload_bytes` (10::bigint * 1024 * 1024
 * * 1024) in create_media / create_media_as_host / get_upload_context — change both together.
 */
export const MAX_UPLOAD_BYTES = 10 * 1024 ** 3; // 10 GB

/**
 * Smallest per-event host cap the UI offers AND the DB CHECK floor
 * (events_max_upload_bytes_range). Above a single large photo, so a host can't set a cap
 * that silently rejects every guest upload (use accepting_uploads=false to freeze instead).
 */
export const MIN_UPLOAD_CAP_BYTES = 25 * 1024 ** 2; // 25 MB

/**
 * Host-facing presets for the per-event upload cap (events.max_upload_bytes). `bytes: null`
 * = "No limit" (the universal MAX_UPLOAD_BYTES applies). Every non-null value sits within
 * [MIN_UPLOAD_CAP_BYTES, MAX_UPLOAD_BYTES] so it satisfies the DB CHECK and the zod bounds.
 */
export const UPLOAD_CAP_PRESETS: { label: string; bytes: number | null }[] = [
  { label: "No limit", bytes: null },
  { label: "5 GB", bytes: 5 * 1024 ** 3 },
  { label: "2 GB", bytes: 2 * 1024 ** 3 },
  { label: "1 GB", bytes: 1 * 1024 ** 3 },
  { label: "500 MB", bytes: 500 * 1024 ** 2 },
  { label: "250 MB", bytes: 250 * 1024 ** 2 },
  { label: "100 MB", bytes: 100 * 1024 ** 2 },
  { label: "25 MB", bytes: 25 * 1024 ** 2 },
];

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
 * single-PUTs and a 3 s clip doesn't pay multipart overhead. Well above S3's
 * 5 MB minimum part size.
 */
export const MULTIPART_THRESHOLD_BYTES = 100 * 1024 ** 2; // 100 MB
/** Part size for multipart uploads. 10 GB / 16 MB = 640 parts, well under S3's 10k cap. */
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
