/**
 * THE POLL'S TWO ROUTES AGREE HERE (`lib/album/edge-version.ts` has the why): which album's version may be
 * shared at the CDN, the key it is shared under, and the one recipe for the full-access validator, so the
 * cached version and the sync's ETag are the same string by construction, never by two copies kept in step.
 */
import "server-only";

import { createHash } from "node:crypto";

import type { GuestEvent } from "@/lib/db/queries/guest-events";
import { developFactsOf } from "@/lib/disposable/facts";
import { guestAlbumEtag } from "@/lib/events/album-validator";
import { resolveGalleryDecision } from "@/lib/events/gallery-access";
import type { GalleryReel } from "@/lib/events/gallery-reel";

/** Anyone holding the link and nothing else: no account, no ticket, no password, nothing uploaded. */
const ANYONE = {
  isOwner: false,
  isAuthed: false,
  isUnlocked: false,
  hasContributed: false,
  canContribute: true,
} as const;

/**
 * WHETHER EVERYONE HOLDING THE LINK SEES THIS ALBUM WHOLE: the one case whose "has anything changed?" is
 * nobody's in particular, so the one case the CDN may share. The door open (the anonymous read answers a
 * gated album as private and a password album as password, so neither passes), and the gallery's own
 * decision for a stranger with nothing (`resolveGalleryDecision`, the one reading of the gates) `full`:
 * never an email asked first, and never an upload asked first, even where that gate fails open (closed
 * uploads or a full album let everyone in, but a reopen or a deletion closes it again, so those stay the
 * album's own to answer, per viewer).
 */
export function albumIsOpenToAnyone(
  event: Pick<
    GuestEvent,
    "visibility" | "require_verified_email" | "require_upload_to_view"
  >,
): boolean {
  return (
    event.visibility === "open" &&
    resolveGalleryDecision(event, ANYONE).access === "full"
  );
}

/**
 * The album's key at the CDN: a digest of its capability, never the capability (the URL is the cache key,
 * and a URL ends up in logs). Domain-separated, so it is no other digest of the token anywhere.
 */
export function albumEdgeKey(qrToken: string): string {
  return createHash("sha256")
    .update(`partyreel:album-edge:${qrToken}`)
    .digest("base64url")
    .slice(0, 22);
}

/** The full-access validator: the sync's 304 check, its 200's ETag and the CDN's version, one recipe. */
export function fullAlbumEtag(
  event: GuestEvent,
  reel: GalleryReel | null,
  read: { albumMax: number; attrVersion: number },
): string {
  return guestAlbumEtag({
    eventId: event.id,
    access: "full",
    gate: null,
    albumMax: read.albumMax,
    attrVersion: read.attrVersion,
    reel,
    developsAt: developFactsOf(event).developsAt,
    accepting: event.accepting_uploads,
  });
}
