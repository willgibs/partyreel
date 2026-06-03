/**
 * Friendly download filename for a saved media item — e.g. an event "Sarah & Tom's
 * Wedding 🎉" + an original.jpg key → `sarah-toms-wedding-ab12cd34.jpg`.
 *
 * Intentionally slugged to ASCII `[a-z0-9-]` + a short id + a clean extension:
 * the result is fed straight into a Content-Disposition `filename="…"` (see
 * lib/r2/presign.ts), and an ASCII-only value needs no RFC-5987 `filename*`
 * encoding and can never inject a quote/space/control char into the header. The
 * short id (first 8 hex of the mediaId) keeps multiple saves from the same event
 * from colliding on one name.
 */
import type { MediaKind } from "@/lib/media/limits";
import { parseExtFromKey, parseMediaIdFromKey } from "@/lib/r2/keys";
import { slugify } from "@/lib/slug";

const FALLBACK_EXT: Record<MediaKind, string> = { photo: "jpg", video: "mp4" };

export function buildDownloadFilename(params: {
  eventName: string;
  key: string;
  type: MediaKind;
}): string {
  const { eventName, key, type } = params;
  const slug = slugify(eventName) || "partyreel"; // all-emoji name → safe fallback
  const ext = parseExtFromKey(key) ?? FALLBACK_EXT[type];
  const id = parseMediaIdFromKey(key)?.slice(0, 8);
  return id ? `${slug}-${id}.${ext}` : `${slug}.${ext}`;
}
