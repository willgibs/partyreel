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

/**
 * Does an R2 media key belong to `eventId`'s namespace? The single validator for the QA-review
 * Pattern A: any client-supplied key stored on the media path (original_key, preview_key) MUST be
 * bound to the event, or a host can register a victim's key and destroy the victim's object on
 * permanent-delete (both purge paths enumerate these keys into deleteR2Objects). The authoritative
 * gate is the SQL prefix check inside create_media(_as_host) (a client can't reach PostgREST); this
 * TS twin is defense-in-depth at the server complete seam and gives an early, typed refusal.
 * Mirrors the SQL `like 'events/' || event_id || '/%'` exactly (prefix + a following segment).
 */
export function isValidMediaKey(key: string, eventId: string): boolean {
  return key.startsWith(`events/${eventId}/`);
}

/**
 * The SEGREGATED evidence-preservation prefix (trust-safety-forensics.md). The /admin preserve action copies a
 * reported upload's ORIGINAL object + a JSON forensics snapshot here, server-side; these keys are
 * NEVER presigned to a host/guest surface (admin export only).
 *
 * ★ DELIBERATELY outside `events/` — that placement is load-bearing for every delete path:
 *   - the orphan sweep lists ONLY the `events/` prefix, so preservation objects are never even
 *     scanned (and parseMediaIdFromKey returns null for them — "not ours → never delete");
 *   - event-deletion purges R2 by ENUMERATED media keys (original_key/preview_key), which never
 *     include these;
 *   - the backup Worker replicates them like any object (extra durability, fine), and its prune's
 *     dual-gate (primary object absent AND media row gone) can only reclaim the backup copy after
 *     an explicit hold-release deletes the primary — a held item deletes neither, so preserved
 *     evidence is never prunable while the hold stands.
 * Deleting from this prefix is a MANUAL, audited admin act on the ADR's 1-year clock — no sweep
 * touches it.
 */
export const PRESERVATION_PREFIX = "preservation/";

/** The preserved copy of the original object: preservation/<eventId>/<mediaId>/original.<ext>. */
export function preservedOriginalKey(params: {
  eventId: string;
  mediaId: string;
  /** File extension WITHOUT the leading dot (round-tripped from the original key). */
  ext: string;
}): string {
  const { eventId, mediaId, ext } = params;
  return `${PRESERVATION_PREFIX}${eventId}/${mediaId}/original.${ext}`;
}

/** The JSON evidence snapshot (media row + forensic row + event context) beside the copy. */
export function preservedForensicsKey(params: {
  eventId: string;
  mediaId: string;
}): string {
  const { eventId, mediaId } = params;
  return `${PRESERVATION_PREFIX}${eventId}/${mediaId}/forensics.json`;
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

/**
 * Pull the eventId out of a media object key (events/<eventId>/…). Used by the forensic-capture
 * seam, which has the create_media-validated key in hand (the RPC already proved it belongs to the
 * session's event) but not the event id itself. Returns null for anything non-media-shaped.
 */
export function parseEventIdFromKey(key: string): string | null {
  const segments = key.split("/");
  if (segments.length !== 5 || segments[0] !== "events") return null;
  return UUID_RE.test(segments[1]) ? segments[1] : null;
}

/**
 * Pull the <kind> segment out of a media object key. Used by the complete seam's key/kind
 * consistency check (QA #6): the key was MINTED at presign from that request's content-type, so
 * its kind segment is the issuance record of what presign classified. Same structural guards as
 * the parsers above; null for anything that isn't exactly our layout with a real kind.
 */
export function parseKindFromKey(key: string): MediaKind | null {
  const segments = key.split("/");
  if (segments.length !== 5 || segments[0] !== "events") return null;
  const kind = segments[2];
  return kind === "photo" || kind === "video" ? kind : null;
}

/**
 * Pull the <variant> out of a media object key's last segment (`<variant>.<ext>`). The complete
 * seam uses it to pin `key` to `original` and `preview_key` to `preview` (QA #6): without the pin,
 * swapping the two would meter the ~2 MB preview as file_size_bytes while the full-size original
 * sat uncounted. Null for a non-media shape or an unknown variant (refuse, never repair).
 */
export function parseVariantFromKey(key: string): MediaVariant | null {
  const segments = key.split("/");
  if (segments.length !== 5 || segments[0] !== "events") return null;
  const lastSegment = segments[4];
  const dot = lastSegment.indexOf(".");
  if (dot < 1) return null; // no dot, or a dotfile with no name
  const variant = lastSegment.slice(0, dot);
  return variant === "original" || variant === "preview" ? variant : null;
}
