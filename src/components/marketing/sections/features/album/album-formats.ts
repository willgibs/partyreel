import {
  ACCEPTED_PHOTO_MIME,
  ACCEPTED_VIDEO_MIME,
  MIME_TO_EXT,
} from "@/lib/media/limits";

/**
 * Human names for the accepted MIME types (photos read as JPEG, not JPG), a
 * PURE module so the FAQ data and its test can import it without dragging a
 * React component into vitest. Anything without a friendly override falls
 * back to the canonical extension from MIME_TO_EXT uppercased, so a NEW type
 * in limits.ts shows up here automatically instead of silently missing.
 */
const FRIENDLY_FORMAT: Record<string, string> = {
  "image/jpeg": "JPEG",
  "image/webp": "WebP",
  "video/webm": "WebM",
};

export function formatName(mime: string): string {
  return FRIENDLY_FORMAT[mime] ?? (MIME_TO_EXT[mime] ?? mime).toUpperCase();
}

export const PHOTO_FORMATS = ACCEPTED_PHOTO_MIME.map(formatName);
export const VIDEO_FORMATS = ACCEPTED_VIDEO_MIME.map(formatName);
