/**
 * Pure media validators — no I/O, no DB. Safe to run on the client (pre-upload
 * UX: reject before wasting a multipart upload) AND on the server in the presign
 * route (a fast-fail; the create_media RPC is the real trust boundary — clients lie).
 *
 * Size is the ONLY gate (no duration cap). The per-upload ceiling defaults to the
 * universal MAX_UPLOAD_BYTES; callers may pass a stricter `maxBytes`.
 */

import {
  ACCEPTED_PHOTO_MIME,
  ACCEPTED_VIDEO_MIME,
  MAX_UPLOAD_BYTES,
  type MediaKind,
} from "./limits";

export type ValidationResult = { ok: true } | { ok: false; reason: string };

/** Map a MIME type to our media kind, or null if unsupported. */
export function classifyMime(mime: string): MediaKind | null {
  if ((ACCEPTED_PHOTO_MIME as readonly string[]).includes(mime)) return "photo";
  if ((ACCEPTED_VIDEO_MIME as readonly string[]).includes(mime)) return "video";
  return null;
}

export function validateUpload(input: {
  mime: string;
  sizeBytes: number;
  /** Effective per-upload ceiling in bytes; defaults to the universal MAX_UPLOAD_BYTES. */
  maxBytes?: number;
}): ValidationResult {
  const kind = classifyMime(input.mime);
  if (!kind) {
    return { ok: false, reason: `Unsupported file type: ${input.mime}` };
  }

  const max = input.maxBytes ?? MAX_UPLOAD_BYTES;
  if (input.sizeBytes > max) {
    return {
      ok: false,
      reason:
        max < MAX_UPLOAD_BYTES
          ? "This file is larger than this event allows."
          : "This file is larger than the 10 GB maximum.",
    };
  }
  return { ok: true };
}
