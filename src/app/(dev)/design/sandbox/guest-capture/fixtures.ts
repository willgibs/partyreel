import type { GridMedia } from "@/components/app/media-grid";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * ONE OPEN WEDDING, THE SAME ONE (Maya and Jay's, hosted by Maya, 14 June),
 * and the one guest this board is about: Priya, who typed her name at the
 * door and has not confirmed an email. `media-viewer`'s board opened on her
 * seventeenth photograph and marked her unproven on its `who.face` tile; this
 * board is what happens on HER side of that mark, the instant she is offered
 * a way to keep what she sent.
 *
 * ★ A SEPARATE FILE, NOT AN IMPORT, ON PURPOSE. `media-viewer` and this board
 * stand on the same desk at once and a board's directory is deleted the
 * moment its ruling lands (registry.ts), so importing its fixtures would tie
 * this board's life to a folder it does not own. The facts below are small
 * and repeated deliberately: the same wedding, the same guest, so a reader
 * who has just answered `media-viewer` recognises Priya immediately.
 *
 * ★ THE STILLS ARE THE SAME TWELVE MARKETING IMAGES EVERY BOARD REUSES
 * (bible 18: no new asset, nothing to track the rights of).
 */

export const EVENT = {
  name: "Maya & Jay",
  host: "Maya",
  hostSlug: "maya",
  token: "maya-jay",
  date: "14 June",
} as const;

/** The host, as the follow surfaces need her: a public card. */
export const HOST = {
  id: "host-maya",
  slug: EVENT.hostSlug,
  displayName: EVENT.host,
  avatarUrl: null,
  seed: "gc-maya",
} as const;

/** The guest this whole board is about. */
export const PRIYA = {
  name: "Priya",
  seed: "gc-priya",
} as const;

/** Seven more names already in the Guests section, the mix a real party has:
 *  mostly proven, two not (Nina beside Priya, as `media-viewer` already has
 *  it), one with a handle to follow from, most without one yet. */
export const OTHER_GUESTS: readonly {
  name: string;
  verified: boolean;
  slug: string | null;
  seed: string;
}[] = [
  { name: "Tom", verified: true, slug: "tom", seed: "gc-tom" },
  { name: "Sam", verified: true, slug: null, seed: "gc-sam" },
  { name: "Dan", verified: true, slug: null, seed: "gc-dan" },
  { name: "Aunt Bev", verified: true, slug: null, seed: "gc-bev" },
  { name: "Nina", verified: false, slug: null, seed: "gc-nina" },
  { name: "Leah", verified: true, slug: "leah", seed: "gc-leah" },
  { name: "Ife", verified: true, slug: null, seed: "gc-ife" },
];

/** A round-robin over the twelve stock stills, wide enough that no two of
 *  Priya's own tiles repeat inside one preview's short strip. */
const STILL = (i: number) => MARKETING_IMAGES[i % MARKETING_IMAGES.length].src;

/** Builds a strip of `n` approved photographs, the LAST `mine` of them
 *  Priya's own (freshly sent, newest first, exactly as the album sorts). */
function strip(n: number, mine: number): GridMedia[] {
  return Array.from({ length: n }, (_, i) => {
    const isMine = i < mine;
    return {
      id: isMine ? `priya-${i}` : `other-${i}`,
      type: "photo",
      url: STILL(i + 2),
      downloadUrl: STILL(i + 2),
      status: "approved",
      width: 4,
      height: i % 3 === 0 ? 3 : 5,
      uploaderName: isMine
        ? PRIYA.name
        : OTHER_GUESTS[i % OTHER_GUESTS.length].name,
      isVerified: isMine
        ? false
        : OTHER_GUESTS[i % OTHER_GUESTS.length].verified,
    } satisfies GridMedia;
  });
}

/** The album as Priya's session leaves it, at three points the `moment`
 *  decision asks about: her first send, her tenth, and whatever is on
 *  screen the instant she taps the album's own Yours filter. */
export const AFTER_FIRST = strip(6, 1);
export const AFTER_TENTH = strip(16, 10);
export const YOURS_ONLY = strip(6, 6).filter(
  (m) => m.uploaderName === PRIYA.name,
);

/** The album's ordinary ground for the three decisions that are not about
 *  the count: a believable handful, four of them hers. */
export const ALBUM = strip(9, 4);

/** The tile the `shape` decision points at: her newest send. */
export const MINE = ALBUM[0];
