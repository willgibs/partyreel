import type { GridMedia } from "@/components/app/media-grid";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * ONE OPEN WEDDING, THE SAME ONE (Maya and Jay's, hosted by Maya, 14 June),
 * and the one guest this board is about: Priya, who typed her name at the
 * door and skipped the optional email under it. `media-viewer`'s board opened
 * on her seventeenth photograph and marked her Unverified on its `who.face`
 * tile; this board is what happens on HER side of that mark, the instant she
 * is offered a way to keep what she sent.
 *
 * ★ A NAMES-MODE WEDDING. Maya turned Require verified emails off, so a guest
 * types a name at the door and uploads under it, marked Unverified until an
 * email is confirmed. That is why most of the Guests list below wears the mark
 * and links nowhere: a name nobody proved has no page, and only a name with a
 * page (a handle) can be followed.
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

/**
 * ONE ENTRY IN THE ALBUM'S GUESTS LIST, in the shape `guest-list.tsx` draws:
 * a confirmed account is a profile card (its own colour, a link only when it
 * claimed a handle), a typed name is an Unverified entry (the plain disc, the
 * mark, no link, no Follow).
 */
export type GuestEntry = {
  name: string;
  kind: "confirmed" | "unverified";
  /** A handle: the only kind of name a Follow can be offered on. */
  slug: string | null;
  /** The seeded colour a confirmed account wears; null is the plain disc. */
  seed: string | null;
  /** The viewer's own entry: listed, never offered a Follow of herself. */
  self?: boolean;
};

/**
 * The Guests list the instant Priya confirms, in the order the album reads
 * it: the confirmed accounts first, then every typed name after them (the
 * shipped list appends the Unverified to the profile cards). The mix a
 * names-mode party has: two with a page to follow, Priya herself (confirmed a
 * moment ago, no handle yet), and five who typed a name and nothing else.
 */
export const GUESTS: readonly GuestEntry[] = [
  { name: "Tom", kind: "confirmed", slug: "tom", seed: "gc-tom" },
  { name: "Leah", kind: "confirmed", slug: "leah", seed: "gc-leah" },
  {
    name: PRIYA.name,
    kind: "confirmed",
    slug: null,
    seed: PRIYA.seed,
    self: true,
  },
  { name: "Sam", kind: "unverified", slug: null, seed: null },
  { name: "Dan", kind: "unverified", slug: null, seed: null },
  { name: "Aunt Bev", kind: "unverified", slug: null, seed: null },
  { name: "Nina", kind: "unverified", slug: null, seed: null },
  { name: "Ife", kind: "unverified", slug: null, seed: null },
];

/** Everyone but Priya: who the rest of the album's photographs are by. */
const OTHERS = GUESTS.filter((g) => !g.self);

/** A round-robin over the twelve stock stills, wide enough that no two of
 *  Priya's own tiles repeat inside one preview's short strip. */
const STILL = (i: number) => MARKETING_IMAGES[i % MARKETING_IMAGES.length].src;

/** Builds a strip of `n` approved photographs, the FIRST `mine` of them
 *  Priya's own (freshly sent, newest first, exactly as the album sorts). */
function strip(n: number, mine: number): GridMedia[] {
  return Array.from({ length: n }, (_, i) => {
    const isMine = i < mine;
    const by = OTHERS[i % OTHERS.length];
    return {
      id: isMine ? `priya-${i}` : `other-${i}`,
      type: "photo",
      url: STILL(i + 2),
      downloadUrl: STILL(i + 2),
      status: "approved",
      width: 4,
      height: i % 3 === 0 ? 3 : 5,
      uploaderName: isMine ? PRIYA.name : by.name,
      isVerified: isMine ? false : by.kind === "confirmed",
    } satisfies GridMedia;
  });
}

/** The album as Priya's session leaves it, at three points the `moment`
 *  decision asks about: her first send, her tenth, and whatever is on
 *  screen the instant she taps the album's own Yours filter. */
export const AFTER_FIRST = strip(6, 1);
export const AFTER_TENTH = strip(16, 10);
const YOURS_ALBUM = strip(12, 6);
export const YOURS_ONLY = YOURS_ALBUM.filter(
  (m) => m.uploaderName === PRIYA.name,
);
/** The whole album behind the Yours filter: the reel is the event's, so its
 *  tile counts every item, never only the ones the filter is showing her. */
export const YOURS_ALBUM_COUNT = YOURS_ALBUM.length;

/** The album's ordinary ground for the decisions that are not about the
 *  count: a believable handful, four of them hers. */
export const ALBUM = strip(9, 4);

/** The tile the `shape` decision's caption rides under: her newest send. */
export const MINE = ALBUM[0];

/** The frame the reel's tile rests on: the engine's first frame is whatever
 *  the take opens with, and a still stands in for it here (the board is not
 *  about the tile, `reel-front` is). */
export const REEL_STILL = MARKETING_IMAGES[0].src;

/* ── the tracker: his own idea, on a MODERATED event ─────────────────────── */

/**
 * EVERY OTHER SCENE ON THIS BOARD IS MAYA'S OPEN WEDDING (Review off), so
 * nothing ever waits. His tracker idea is for a MODERATED one, which this
 * board has none of, so its four rows are Priya's own batch at a second,
 * moderated event: two sent seconds apart, one held, one approved, one
 * refused — the whole range his words name ("track either their upload
 * batch's progress or approval status").
 */
export type TrackerStatus = "uploading" | "held" | "approved" | "refused";

export type TrackerItem = {
  id: string;
  url: string;
  status: TrackerStatus;
};

export const TRACKER_ITEMS: readonly TrackerItem[] = (
  ["uploading", "held", "approved", "refused"] as const
).map((status, i) => ({
  id: `tracker-${status}`,
  url: STILL(i + 6),
  status,
}));

/**
 * THE WORDS EACH STATUS WEARS, BORROWED RATHER THAN INVENTED TWICE: `held`
 * is voice-guest.waiting's own recommended line, `refused` is host-curation's
 * `told=line` label, so a reader who meets either board again meets the same
 * words. `uploading` and `approved` belong to no other ask.
 */
export const TRACKER_WORDS: Record<TrackerStatus, string> = {
  uploading: "Sending…",
  held: "The host sees it first",
  approved: "In the album",
  refused: "Not in the album",
};
