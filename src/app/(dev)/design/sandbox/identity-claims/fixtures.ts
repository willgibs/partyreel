import type { ClaimableEventRow } from "@/lib/db/queries/claims";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * ONE GUEST, TWO OLD EVENTS UNDER HER ADDRESS (the guest identity round,
 * 2026-09-22; "guest identity: name only, unconfirmed email,
 * verified account", the plan-review feedback on the claim ticket).
 *
 * Priya (`guest-capture`'s own guest, `media-viewer`'s own board already
 * marked her unproven on its `who.face` tile) confirmed her email this
 * morning at Maya and Jay's wedding. That address turns out to have two
 * older rows waiting: Tom's leaving do, which really was hers, and a beach
 * bonfire she never went to, where somebody else typed her email. The claim
 * ticket cannot tell the two apart ("the host can't see the
 * attributed email of an unconfirmed account"), so nothing below marks the
 * impostor's row differently: the ticket shows two ordinary rows, and this
 * board's five decisions are all about the shape SHE decides them inside.
 *
 * ★ A SEPARATE FILE, NOT AN IMPORT, ON PURPOSE (`guest-capture/fixtures.ts`'s
 * own note, carried here): a board's directory is deleted the moment its
 * ruling lands, so importing another board's fixtures would tie this one's
 * life to a folder it does not own. Priya's name and seed are retyped, not
 * imported, so her avatar wears the same colour a reader has already seen.
 *
 * ★ THE SAME TWELVE MARKETING STILLS EVERY BOARD REUSES (bible 9: no new
 * asset, nothing to track the rights of).
 */

export const PRIYA = {
  name: "Priya",
  seed: "gc-priya",
} as const;

/** The wedding she confirmed from this morning, retyped from `guest-capture/fixtures.ts`. */
export const CURRENT_EVENT = {
  name: "Maya & Jay",
  host: "Maya",
  hostSlug: "maya",
  seed: "gc-maya",
  date: "14 June",
} as const;

const STILL = (i: number) => MARKETING_IMAGES[i % MARKETING_IMAGES.length].src;

/** The event that really was hers: a name-only upload, months before she ever confirmed anything. */
export const HERS: ClaimableEventRow = {
  eventId: "toms-leaving",
  eventName: "Tom's Leaving Do",
  eventDate: "2026-05-03",
  names: ["Priya"],
  uploadCount: 4,
  lastUploadAt: "2026-05-03T21:40:00.000Z",
};

/** The event she never attended: someone else typed her address at the door. */
export const IMPOSTOR: ClaimableEventRow = {
  eventId: "beach-bonfire",
  eventName: "Beach Bonfire",
  eventDate: "2026-07-19",
  names: ["Priya"],
  uploadCount: 2,
  lastUploadAt: "2026-07-19T23:10:00.000Z",
};

/** The ticket's whole contents, in the RPC's own order (most recently active first). */
export const CLAIMABLE_ROWS: ClaimableEventRow[] = [HERS, IMPOSTOR];

/** Total photographs waiting across both events, for a sentence that counts them. */
export const TOTAL_WAITING = HERS.uploadCount + IMPOSTOR.uploadCount;

/** Small thumbnail strips for the `pass` and `confirm` asks: a believable few of each event's own stills. */
export const HERS_PHOTOS = Array.from({ length: HERS.uploadCount }, (_, i) =>
  STILL(i + 4),
);
export const IMPOSTOR_PHOTOS = Array.from(
  { length: IMPOSTOR.uploadCount },
  (_, i) => STILL(i + 9),
);

/** The one event already on Priya's dashboard: the wedding, a live guest event
 *  the moment her confirmed upload counted her (tonight's ruling: a person is
 *  a guest through an upload alone, never a save). */
export const CURRENT_EVENT_COVER = MARKETING_IMAGES[3].src;

/** A newly-claimed cover for the `after=strip` option: Tom's leaving do, once it is hers. */
export const CLAIMED_COVER = STILL(4);
