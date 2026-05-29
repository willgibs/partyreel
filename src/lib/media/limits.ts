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
