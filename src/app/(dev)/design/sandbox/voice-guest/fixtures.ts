import type { GridMedia } from "@/components/app/media-grid";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * ONE WEDDING, THE DESK'S OWN (Maya and Jay's, hosted by Maya, 14 June, 48
 * photographs from 14 guests), and the guest the identity boards already
 * follow: Priya, who typed her name at the door. `identity-door` meets her
 * before her name, `guest-capture` once her first photographs land; this
 * board reads her the words she meets along that same walk.
 *
 * ★ A SEPARATE FILE, NOT AN IMPORT, ON PURPOSE (`guest-capture/fixtures.ts`'s
 * own rule, carried here). A board's directory is deleted the moment its
 * ruling lands (registry.ts), so importing another board's fixtures would tie
 * this board's life to a folder it does not own. The facts are small and
 * repeated deliberately, so a reader who has just answered the identity
 * boards recognises the page at once.
 *
 * ★ TWO SWITCHES FLIP PER DECISION, NEVER THE WORLD. Maya's wedding is
 * names-mode and open everywhere; `ask` imagines the same wedding with a
 * password set, and `waiting` with uploads held for review, exactly as
 * `identity-door.gate` imagines it with verified emails on. The host and the
 * party stay one world rather than inventing a second.
 *
 * ★ TOM IS THE ONE OTHER GUEST WHO SPEAKS. He is signed in (a confirmed
 * account), so an upload of his is already the save: the event joins his
 * account the moment one lands. He appears only where a line differs for
 * him (`landed`), beside Priya, never instead of her.
 *
 * ★ THE STILLS ARE THE TWELVE MARKETING IMAGES EVERY BOARD REUSES (bible 9:
 * no new asset, nothing to track the rights of).
 */

export const EVENT = {
  name: "Maya & Jay",
  host: "Maya",
  date: "14 June",
  approvedTotal: 48,
  contributorCount: 14,
} as const;

/** The host, as the byline and the reel's face need her: a seeded identity. */
export const HOST = {
  displayName: EVENT.host,
  seed: "vg-maya",
} as const;

/** The guest the whole board follows: a typed name, no confirmed email. */
export const PRIYA = {
  name: "Priya",
  seed: "vg-priya",
} as const;

/** A signed-in member at the same party: his upload is his save. */
export const TOM = {
  name: "Tom",
  seed: "vg-tom",
} as const;

/** One pick, the same number wherever the board counts it: she sent six. */
export const PICK = 6;

/** The failed run: eight sent on the venue Wi-Fi, two did not go. */
export const RUN = { sent: 8, failed: 2 } as const;

const STILL = (i: number) => MARKETING_IMAGES[i % MARKETING_IMAGES.length];

/**
 * A strip of `n` approved photographs in the album's own order, newest first,
 * on the shipped tile (`MediaTile`). Shapes alternate so the two columns fall
 * the way a real album does rather than as a grid.
 */
export function strip(n: number, offset = 0): GridMedia[] {
  return Array.from({ length: n }, (_, i) => {
    const still = STILL(i + offset);
    return {
      id: `vg-${offset}-${i}`,
      type: "photo",
      url: still.src,
      downloadUrl: still.src,
      status: "approved",
      width: 4,
      height: i % 3 === 0 ? 3 : 5,
    } satisfies GridMedia;
  });
}

/** The photograph a stack or a held tile shows: a still of its own shape. */
export type PendingStill = { src: string; width: number; height: number };

/*
 * ★ THE ALBUM IS STILLS 0 TO 8 AND NOTHING ELSE; HERS ARE 10 AND 11. A
 * photograph of hers (the one landing, the two held, the two that failed) is
 * never also one of the album's, or a phone would show the same picture
 * twice, once as hers and once as somebody's. Each scene draws only one of
 * those sets, so they may share the two stills between them.
 */

/** Her last photograph of the six, the one the stack is carrying as it lands. */
export const LAST_OF_PICK: PendingStill = {
  src: STILL(11).src,
  width: 4,
  height: 5,
};

/** Her two photographs Maya is holding, when the wedding reviews uploads. */
export const HELD: readonly PendingStill[] = [
  { src: STILL(10).src, width: 4, height: 5 },
  { src: STILL(11).src, width: 4, height: 3 },
];

/** The two files that did not go, as the failure sheet lists them. */
export const FAILED_FILES = [
  { name: "IMG_4821.jpg", src: STILL(10).src },
  { name: "IMG_4826.jpg", src: STILL(11).src },
] as const;

/** The still the reel's tile rests on (the board is not about the tile). */
export const REEL_STILL = STILL(0).src;
