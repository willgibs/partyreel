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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Pull the file extension (no dot, lowercased) out of an R2 key — e.g.
 * `events/…/original.jpg` → `jpg`. Used only to NAME a download (the
 * Content-Disposition filename); the byte content is whatever R2 stored. Returns
 * null when there's no clean alphanumeric extension (callers fall back by media
 * kind). The ext was itself derived server-side from the validated content-type
 * at upload (MIME_TO_EXT), never from client input — so this is a safe round-trip.
 */
export function parseExtFromKey(key: string): string | null {
  const lastSegment = key.split("/").pop() ?? "";
  const dot = lastSegment.lastIndexOf(".");
  if (dot < 1) return null; // no dot, or a dotfile with no name
  const ext = lastSegment.slice(dot + 1).toLowerCase();
  return /^[a-z0-9]+$/.test(ext) ? ext : null;
}

/**
 * Inverse of mediaObjectKey: pull the mediaId out of an R2 key. Used by the
 * Phase-3 purge cron's ORPHAN SWEEP — it lists bucket objects and needs the
 * mediaId to ask "does a media row still exist for this?". Kept in the same file
 * as mediaObjectKey so the layout has ONE source of truth.
 *
 * Returns null for anything that doesn't match our exact layout
 * (events/<eventId>/<kind>/<mediaId>/<variant>.<ext>, mediaId a UUID). The sweep
 * treats null as "not ours / unrecognized → leave it alone" rather than deleting
 * — never delete a key we can't positively identify.
 */
export function parseMediaIdFromKey(key: string): string | null {
  const segments = key.split("/");
  if (segments.length !== 5) return null;
  if (segments[0] !== "events") return null;
  const mediaId = segments[3];
  return UUID_RE.test(mediaId) ? mediaId : null;
}
