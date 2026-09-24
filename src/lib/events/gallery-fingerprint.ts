/**
 * Gallery ETag fingerprint (Phase 3). Hashes everything that determines a
 * gallery poll response EXCEPT the volatile presigned URLs, plus the presign
 * signing-bucket id, so a conditional request can be answered 304 (skipping
 * every presign, up to three an item, + the full payload) exactly when the
 * viewer would receive an identical gallery.
 *
 * SECURITY INVARIANT: the ETag must never validate across access levels, nor
 * across the GATE behind one level. The access level, the gate and the teaser
 * total are part of the hash, and the item-id list is structurally different
 * per level, so a teaser viewer's ETag can never 304 a full payload
 * (red-teamed in the route's verification) and a guest whose gate moved from
 * `account` to `upload` can never 304 onto the step they already passed.
 *
 * THE ALBUM'S SIZE IS IN THE HASH (the 1,000-row round): the payload carries
 * `approvedTotal`, the header's live count, and the teaser's nine photos can
 * stay the same while the album grows (a video, or a photograph removed from
 * deeper in the album), so the count has to move the validator by itself.
 *
 * The bucket id makes the ETag roll when the presign bucket rolls (~30 min),
 * capping any 304 streak so clients re-pull fresh URLs before old ones expire.
 *
 * DELIBERATELY OUTSIDE the hash: width/height/durationSeconds (Phase 4 masonry
 * data) and `reelEligible` (the live reel, `media.reel_eligible`: false only for
 * a cut added to the album). All four are write-once at create_media (mutations
 * only ever flip status fields, and no client role can update reel_eligible),
 * so they're a pure function of the already-hashed id - hashing them would add
 * bytes without adding sensitivity. A field that can CHANGE for an existing id
 * must go INSIDE the hash (and bump the version).
 *
 * THE LIVE REEL'S FACTS ARE IN THE HASH (reel-guest-wiring, 2026-09-24): the
 * payload carries the host's switch and mood, the platform lever and what the
 * host's plan lets the cut creator do (`gallery-reel.ts`), and every one of
 * them can change with no media row moving. Outside the hash, a host turning
 * the reel off would 304 past every open album until the presign bucket rolled.
 *
 * Pure module (node:crypto only) so the hash rules are Vitest-pinnable.
 */
import { createHash } from "node:crypto";

export type GalleryFingerprintItem = {
  id: string;
  type: string;
  uploaderName: string | null;
  isHost: boolean;
  /** Inside the hash: a guest can prove an email later, so this CAN change for an existing id. */
  isVerified: boolean;
};

export function galleryEtag(input: {
  access: string;
  /** Which door stands in front of this viewer, or null at full access. */
  gate: string | null;
  teaserTotal: number | null;
  /** The album's head count (photos and videos) the payload carries; null at `none`. */
  approvedTotal: number | null;
  /** The live reel's facts the payload carries (`gallery-reel.ts`); null below full access. */
  reel?: {
    showReel: boolean;
    liveReelEnabled: boolean;
    styleId: string | null;
    cut: { videoAllowed: boolean; watermark: boolean; maxSeconds: number } | null;
  } | null;
  bucketId: string;
  items: GalleryFingerprintItem[];
}): string {
  // Canonical array form (not objects) so key order can never wobble the hash.
  const canonical = JSON.stringify([
    input.access,
    input.gate,
    input.teaserTotal,
    input.approvedTotal,
    input.reel
      ? [
          input.reel.showReel,
          input.reel.liveReelEnabled,
          input.reel.styleId,
          input.reel.cut
            ? [
                input.reel.cut.videoAllowed,
                input.reel.cut.watermark,
                input.reel.cut.maxSeconds,
              ]
            : null,
        ]
      : null,
    input.bucketId,
    input.items.map((i) => [
      i.id,
      i.type,
      i.uploaderName,
      i.isHost,
      i.isVerified,
    ]),
  ]);
  const hash = createHash("sha256")
    .update(canonical)
    .digest("base64url")
    .slice(0, 27);
  // Strong, quoted, version-prefixed: a shape change bumps the version so stale clients can never
  // false-match. The item tuple is (id, type, name, host, verified): any change to what it carries,
  // or to the payload fields beside it, bumps this, so a client holding an older validator re-pulls
  // rather than 304s past a change it cannot see. g6: the payload carries the live reel's facts
  // (`reel`), and a g5 validator knows nothing of them.
  return `"g6-${hash}"`;
}
