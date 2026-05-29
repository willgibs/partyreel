/**
 * R2 object-key construction — the SINGLE source for key layout.
 *
 * GUARDRAIL: keys are server-internal. NEVER send a raw key or a raw R2 URL to a
 * client. All client media access goes through short-lived presigned URLs
 * (see lib/r2/presign.ts). Exposing keys leaks the bucket structure and enables
 * enumeration.
 *
 * The layout is effectively append-only: changing it orphans every object
 * already stored. Add new variants rather than restructuring existing ones.
 *
 *   Layout: events/<eventId>/<kind>/<mediaId>/<variant>.<ext>
 */

import type { MediaKind } from "@/lib/media/limits";

/** `original` = the uploaded file; `preview` = transcoded/thumbnailed derivative. */
export type MediaVariant = "original" | "preview";

export function mediaObjectKey(params: {
  eventId: string;
  mediaId: string;
  kind: MediaKind;
  variant: MediaVariant;
  /** File extension WITHOUT the leading dot, e.g. "jpg", "mp4". */
  ext: string;
}): string {
  const { eventId, mediaId, kind, variant, ext } = params;
  return `events/${eventId}/${kind}/${mediaId}/${variant}.${ext}`;
}
