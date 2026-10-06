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
 *  - `album_max`: every change a guest can see moves it (into or out of what she sees, approved and
 *    unsealed, or into or out of what waits, held or sealed: its count is hers), and nothing else does,
 *    so a hide of a hidden row or a moved develop time's rewrite leaves every guest's 304 standing;
 *  - `attr_version`: a rename or a confirmation changes the names the client holds;
 *  - the LIVE REEL's facts: they ride the payload and none of them moves a media row.
 *  - the album's DEVELOP TIME (`developsAt`, 20261002200000): it rides the payload (`waiting`) and lives on the event
 *    row, so a host's new develop time reaches an open page on its next poll. Only when there is one: an album without
 *    a develop time keeps its validator byte for byte, so nothing rolls at the deploy. (What waits needs no slot here:
 *    every change to it, a held row or a sealed one, moves `album_max`.)
 *  - whether the album TAKES UPLOADS (`accepting`, guest-requests): it rides the payload and lives on the event row,
 *    and no media row moves when the host closes or reopens uploads, so without it a quiet album's poll answered 304
 *    through either and an open camera never heard the album reopen. Only while closed: an open album keeps its
 *    validator byte for byte (nothing rolls at the deploy, and a seed built without the switch still matches it).
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
  /** The album's develop time (ISO), or null/absent for none, which leaves the validator as it was. */
  developsAt?: string | null;
  /** Whether the album takes uploads (`events.accepting_uploads`): only `false` moves the validator, and absent is open. */
  accepting?: boolean;
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
    ...(input.developsAt ? [["develops", input.developsAt]] : []),
    ...(input.accepting === false ? [["closed"]] : []),
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
