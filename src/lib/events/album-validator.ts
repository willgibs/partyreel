/**
 * THE PAGED ALBUM'S VALIDATORS: what a poll's `If-None-Match` is checked against.
 *
 * ★ A QUIET POLL COSTS ONE ROW. The validator is built from the event's `album_state` row (its
 * versions, read in one indexed lookup) and the decision the route already made, never from the
 * album itself, so a 304 no longer pays for the read it skips (today's gallery ETag hashes the
 * whole album, so it must read it first: gallery-fingerprint.ts).
 *
 * WHAT IS IN THE GUEST'S, AND WHY:
 *  - the EVENT id: a validator never crosses albums (two fresh albums share every version number);
 *  - the ACCESS level and the GATE behind it: a validator never validates across either, the same
 *    security invariant the gallery ETag keeps (a teaser viewer's validator can never 304 a full
 *    album, and a guest whose gate moved from `account` to `upload` never 304s onto the step they
 *    passed);
 *  - `album_max`: every change a guest can see (into or out of `approved`) moves it, and nothing
 *    else does, so a hide in Review or a held upload leaves every guest's 304 standing;
 *  - `attr_version`: a rename or a confirmation changes the names the client holds;
 *  - the LIVE REEL's facts: they ride the payload and none of them moves a media row.
 *
 * ★ NEVER THE PRESIGN BUCKET, AT FULL ACCESS. Links no longer ride the poll: a client re-mints its
 * own by id when they age (`ALBUM_LINK_REMINT_MS`), so the validator no longer has to roll every
 * half hour to hand back fresh ones, and an album left open all evening stays on 304. THE TEASER IS
 * THE EXCEPTION: its nine photographs travel inline with their links and no link route serves a
 * teaser viewer, so its validator carries the bucket and rolls with it, exactly as today's does.
 *
 * The host's validator is the event, its host-scope `version` and `attr_version`: every status
 * change moves `version`, so a held upload reaches the one person who can approve it.
 *
 * Strong, quoted, prefixed with the wire version, so a contract change can never false-match an
 * older client's validator. Pure (node:crypto only), so the rules are Vitest-pinnable.
 */
import { createHash } from "node:crypto";

import { ALBUM_WIRE_VERSION } from "@/lib/events/album-wire";

/** The live reel's facts as the payload carries them (`GalleryReel`), in a fixed order. */
type ReelFacts = {
  showReel: boolean;
  liveReelEnabled: boolean;
  styleId: string | null;
  holdSec?: number | null;
  clip: {
    videoAllowed: boolean;
    watermark: boolean;
    maxSeconds: number;
  } | null;
} | null;

function digest(parts: unknown[]): string {
  const hash = createHash("sha256")
    .update(JSON.stringify(parts))
    .digest("base64url")
    .slice(0, 27);
  return `"${ALBUM_WIRE_VERSION}-${hash}"`;
}

function reelParts(reel: ReelFacts): unknown[] | null {
  return reel
    ? [
        reel.showReel,
        reel.liveReelEnabled,
        reel.styleId,
        reel.holdSec ?? null,
        reel.clip
          ? [reel.clip.videoAllowed, reel.clip.watermark, reel.clip.maxSeconds]
          : null,
      ]
    : null;
}

/** A guest's validator at `full` or `teaser` (a locked album answers with none at all). */
export function guestAlbumEtag(input: {
  eventId: string;
  access: "full" | "teaser";
  gate: string | null;
  albumMax: number;
  attrVersion: number;
  reel: ReelFacts;
  /** The teaser only: its links travel inline, so its validator rolls with the presign bucket. */
  bucketId?: string | null;
}): string {
  return digest([
    "guest",
    input.eventId,
    input.access,
    input.gate,
    input.albumMax,
    input.attrVersion,
    reelParts(input.reel),
    input.access === "teaser" ? (input.bucketId ?? null) : null,
  ]);
}

/** The host's validator: their event's host-scope version and attribution. */
export function hostAlbumEtag(input: {
  eventId: string;
  version: number;
  attrVersion: number;
}): string {
  return digest(["host", input.eventId, input.version, input.attrVersion]);
}
