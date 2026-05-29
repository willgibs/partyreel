/**
 * Pure media validators — no I/O, no DB. Safe to run on the client (pre-upload
 * UX: reject before wasting a multipart upload) AND on the server inside the
 * `create_media` RPC path (the real trust boundary — clients can lie).
 *
 * Duration is best-effort: the browser measures it from the <video> element, so
 * server-side it may be absent. Size is always enforced; duration only when known.
 */

import {
  ACCEPTED_PHOTO_MIME,
  ACCEPTED_VIDEO_MIME,
  MAX_PHOTO_BYTES,
  MAX_VIDEO_BYTES,
  MAX_VIDEO_DURATION_SECONDS,
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
  /** Seconds; omit/null when unknown (e.g. server-side). */
  durationSeconds?: number | null;
}): ValidationResult {
  const kind = classifyMime(input.mime);
  if (!kind) {
    return { ok: false, reason: `Unsupported file type: ${input.mime}` };
  }

  if (kind === "photo") {
    if (input.sizeBytes > MAX_PHOTO_BYTES) {
      return { ok: false, reason: "Photo exceeds the 50 MB limit." };
    }
    return { ok: true };
  }

  if (input.sizeBytes > MAX_VIDEO_BYTES) {
    return { ok: false, reason: "Video exceeds the 2 GB limit." };
  }
  if (
    input.durationSeconds != null &&
    input.durationSeconds > MAX_VIDEO_DURATION_SECONDS
  ) {
    return { ok: false, reason: "Video is longer than 5 minutes." };
  }
  return { ok: true };
}
