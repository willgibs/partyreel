/**
 * Gallery ETag fingerprint (Phase 3). Hashes everything that determines a
 * gallery poll response EXCEPT the volatile presigned URLs, plus the presign
 * signing-bucket id, so a conditional request can be answered 304 (skipping
 * the ~120 presigns + the full payload) exactly when the viewer would receive
 * an identical gallery.
 *
 * SECURITY INVARIANT: the ETag must never validate across access levels. The
 * access level and teaser total are part of the hash, and the item-id list is
 * structurally different per level, so a teaser viewer's ETag can never 304 a
 * full payload (red-teamed in the route's verification).
 *
 * The bucket id makes the ETag roll when the presign bucket rolls (~30 min),
 * capping any 304 streak so clients re-pull fresh URLs before old ones expire.
 *
 * DELIBERATELY OUTSIDE the hash: width/height/durationSeconds (Phase 4 masonry
 * data). They are write-once at create_media (mutations only ever flip status
 * fields), so they're a pure function of the already-hashed id - hashing them
 * would add bytes without adding sensitivity. A field that can CHANGE for an
 * existing id must go INSIDE the hash (and bump g1 -> g2).
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
  isAnonymous: boolean;
};

export function galleryEtag(input: {
  access: string;
  teaserTotal: number | null;
  bucketId: string;
  items: GalleryFingerprintItem[];
}): string {
  // Canonical array form (not objects) so key order can never wobble the hash.
  const canonical = JSON.stringify([
    input.access,
    input.teaserTotal,
    input.bucketId,
    input.items.map((i) => [
      i.id,
      i.type,
      i.uploaderName,
      i.isHost,
      i.isVerified,
      i.isAnonymous,
    ]),
  ]);
  const hash = createHash("sha256")
    .update(canonical)
    .digest("base64url")
    .slice(0, 27);
  // Strong, quoted, version-prefixed: a shape change bumps the version so stale clients can never
  // false-match. g1 -> g2 at the identity reshape (2026-09-21), when isVerified joined the item
  // tuple: a client holding a g1 ETag must re-pull rather than 304 past a mark appearing.
  return `"g2-${hash}"`;
}
