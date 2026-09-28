import type { GridMedia } from "@/components/app/media-grid";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * ONE WEDDING, THE DESK'S OWN (Maya and Jay's, hosted by Maya, 14 June, 48
 * photographs from 14 guests), and the guest the identity boards already
 * follow: Priya, who typed her name at the door and has not confirmed an
 * email. Round two reads her three more moments on that same walk.
 *
 * ★ A SEPARATE FILE, NOT AN IMPORT, ON PURPOSE (`guest-capture/fixtures.ts`'s
 * own rule, carried here). A board's directory is deleted the moment its
 * ruling lands (registry.ts), so importing another board's fixtures would tie
 * this board's life to a folder it does not own.
 *
 * ★ ONE SWITCH FLIPS PER DECISION, NEVER THE WORLD. `held` and `status`
 * imagine the wedding with "Review uploads before they appear" on; `keep`
 * meets it as it ships, open, where her six have just joined the album. The
 * host and the party stay one world rather than inventing a second.
 *
 * ★ THE STILLS ARE THE TWELVE MARKETING IMAGES EVERY BOARD REUSES (bible 9:
 * no new asset, nothing to track the rights of), at their own ratios, so the
 * rows lay out the way the real album lays them.
 */

export const EVENT = {
  name: "Maya & Jay",
  host: "Maya",
  date: "14 June",
  approvedTotal: 48,
  contributorCount: 14,
} as const;

/** The host, as the byline needs her: a seeded identity. */
export const HOST = {
  displayName: EVENT.host,
  seed: "vg-maya",
} as const;

/** The guest the whole board follows: a typed name, no confirmed email. */
export const PRIYA = {
  name: "Priya",
  seed: "vg-priya",
} as const;

/** `keep`'s pick: she sent six, and all six joined the album. */
export const PICK = 6;

/** A photograph as the board draws it: its source and its own shape. */
export type Still = { src: string; width: number; height: number };

const still = (i: number): Still => {
  const m = MARKETING_IMAGES[i % MARKETING_IMAGES.length];
  return { src: m.src, width: m.width, height: m.height };
};

const media = (id: string, s: Still): GridMedia => ({
  id,
  type: "photo",
  url: s.src,
  downloadUrl: s.src,
  status: "approved",
  width: s.width,
  height: s.height,
});

/*
 * ★ THE ALBUM IS STILLS 0 TO 8; WHAT IS HERS AND NOT IN IT IS 9, 10 AND 11. A
 * photograph of hers that is not in the album (one waiting, one left out) is
 * never also one of the album's, or a phone would show the same picture twice,
 * once as hers and once as somebody's.
 */

/** The album as the rows lay it, newest first: nine of the wedding's 48. */
export const ALBUM: GridMedia[] = Array.from({ length: 9 }, (_, i) =>
  media(`vg-album-${i}`, still(i)),
);

/**
 * `held`'s pick: the two she sends to the held wedding. Maya lets the first in
 * (the arch) and leaves the second out (the petals).
 */
export const HELD_IN = still(10);
export const HELD_OUT = still(11);

/** The one Maya lets in, as the album holds it once she has. */
export const LET_IN: GridMedia = media("vg-let-in", HELD_IN);

/** Where one of her uploads stands (the tracker's own statuses, less "sending"). */
export type UploadStatus = "waiting" | "approved" | "refused";

export type HerUpload = { key: string; still: Still; status: UploadStatus };

/**
 * `held`'s list once Maya has decided: the pick, newest first (the petals went
 * second, so they lead).
 */
export const HELD_DECIDED: readonly HerUpload[] = [
  { key: "hd-out", still: HELD_OUT, status: "refused" },
  { key: "hd-in", still: HELD_IN, status: "approved" },
];

/**
 * `status`'s list, later that evening, newest first: one more sent since
 * (still with Maya), then `held`'s pick as Maya decided it, then one from
 * earlier that is in the album.
 */
export const HER_UPLOADS: readonly HerUpload[] = [
  { key: "hu-new", still: still(9), status: "waiting" },
  { key: "hu-out", still: HELD_OUT, status: "refused" },
  { key: "hu-in", still: HELD_IN, status: "approved" },
  { key: "hu-early", still: still(7), status: "approved" },
];

/** The still the reel's tile rests on (the board is not about the tile). */
export const REEL_STILL = still(0).src;
