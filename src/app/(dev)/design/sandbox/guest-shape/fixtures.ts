import type { GridMedia } from "@/components/app/media-grid";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * ONE WEDDING, IN THE FOUR STATES A GUEST CAN MEET IT.
 *
 * Every picture on this board is the same event, so what moves between options
 * is the SHAPE and never the content: Maya and Jay's wedding, hosted by Maya,
 * 14 June, 34 photographs from 23 guests. The four fixtures are the four states
 * the server can resolve for a scanned code (guest-flow.md, "State follows
 * `visibility`"), and each one is a real access level rather than a mood:
 *
 *  - `open`     — `access: "full"`. The album, all 34 of it.
 *  - `password` — `access: "none"`. The event NAME and the COUNT are all the
 *                 page may carry; the host name, the date and every media URL
 *                 are blanked server-side before the flight payload is built.
 *  - `account`  — `access: "teaser"`. The newest nine photographs and a total,
 *                 with the rest withheld on the server, never blurred here.
 *  - `empty`    — `access: "full"`, nothing uploaded yet.
 *
 * ★ THE PHOTOGRAPHS ARE THE TWELVE MARKETING STILLS, RE-SHAPED. They are the
 * only stills the repo holds (the real set is the Higgsfield month's) and
 * eleven of the twelve are 3:2 landscapes, which a party album is not: a
 * guest's phone shoots 3:4 portraits most of the time, then the odd landscape,
 * a 9:16 screen-height shot, a square. Each still is DECLARED at one of those
 * shapes and `MediaTile`'s object-cover crops it, exactly as the real album
 * crops a real upload. Without this the masonry reads as a brick wall of
 * landscapes and every option looks shorter than it is.
 *
 * ★ THIRTY-FOUR, BECAUSE THE WIDEST FRAME IS SIX COLUMNS. CSS columns flow
 * column-major and balance their heights, so a laptop's first screen is the top
 * of all six; 34 keeps every column taller than a 900px window, which is what
 * makes "how much album is on one screen" a real question rather than an
 * artefact of a short fixture.
 */

/** The shapes a phone's camera roll actually holds, as width to height. */
const SHAPES = {
  P: [3, 4],
  T: [9, 16],
  L: [4, 3],
  S: [1, 1],
  F: [4, 5],
  W: [16, 9],
} as const;

/**
 * 17 portraits at 3:4, 3 tall at 9:16, 7 landscapes, 3 squares, 2 at 4:5 and 2
 * wide at 16:9: about two thirds of the roll stands up, as a phone shoots it.
 */
const ROLL = "PLPTPSPLFPPWPTLPPFLPTPSLPPWPLTPFPL";

/**
 * ★ THE ORDER IS SEARCHED, NOT CHOSEN. Twelve stills over 34 tiles repeat
 * about three times each whatever the order, and where the repeats LAND is the
 * only part an author controls: a stride of five put the same bouquet in three
 * column-tops at once, and three hand-shuffled runs put the same balloons at
 * the top of both phone columns, because CSS columns balance by HEIGHT and the
 * second column starts wherever the halfway mark falls, not at item 17.
 *
 * So this order was searched against a model of that balancing at both of the
 * board's layouts (two columns of 166px in an 812px screen, six of 230px in a
 * 900px one), scoring every pair of equal stills by how close their boxes land
 * on the first screen. It is the first order out of 40,000 where no two copies
 * of one photograph sit side by side or within a tile's height of each other
 * at either width. The real album (the Higgsfield month's) needs none of this.
 */
const ORDER = [
  1, 9, 3, 8, 11, 4, 5, 2, 0, 6, 7, 10, 3, 4, 1, 9, 10, 2, 6, 5, 7, 11, 0, 8,
  11, 6, 3, 8, 2, 10, 4, 9, 1, 5,
] as const;

export const ALBUM: GridMedia[] = [...ROLL].map((letter, i) => {
  const img = MARKETING_IMAGES[ORDER[i] % MARKETING_IMAGES.length];
  const [w, h] = SHAPES[letter as keyof typeof SHAPES];
  return {
    id: `gs-${i}`,
    type: "photo",
    url: img.src,
    downloadUrl: img.src,
    status: "approved",
    width: w * 400,
    height: h * 400,
  } satisfies GridMedia;
});

/** What a signed-out viewer of an account-required event is served: the newest
 *  nine, with the other 25 never leaving the server (TEASER_LIMIT). */
export const TEASER: GridMedia[] = ALBUM.slice(0, 9);

/**
 * THE BIG ALBUM, FOR "THEIRS" ALONE. Round one's 34 is a small wedding; where a
 * guest finds their own photographs is only a real question once the album is
 * one they cannot hold in their head. Same twelve stills, `ROLL` run twice, a
 * plain deterministic interleave rather than `ORDER`'s searched one — this
 * fixture's job is SCALE, not the adjacent-repeat polish the small album earns
 * for its own screenshots.
 */
export const ALBUM_BIG: GridMedia[] = [...ROLL, ...ROLL].map((letter, i) => {
  const img = MARKETING_IMAGES[(i * 7 + 3) % MARKETING_IMAGES.length];
  const [w, h] = SHAPES[letter as keyof typeof SHAPES];
  return {
    id: `gs-big-${i}`,
    type: "photo",
    url: img.src,
    downloadUrl: img.src,
    status: "approved",
    width: w * 400,
    height: h * 400,
  } satisfies GridMedia;
});

/**
 * TEN OF THE 68 ARE THIS GUEST'S OWN, spread from near the top to well past
 * the fold at every screen this board judges, which is the whole shape of the
 * problem: "yours" is never all in one place.
 */
export const MINE_IDS: ReadonlySet<string> = new Set(
  [2, 9, 16, 23, 30, 37, 44, 51, 58, 65].map((i) => `gs-big-${i}`),
);

/** The event, as every guest surface names it. */
export const EVENT = {
  name: "Maya & Jay's Wedding",
  host: "Maya",
  /** Rendered through the product's own `formatEventDate`. */
  date: "2026-06-14",
  photos: ALBUM.length,
  guests: 23,
  description: "Everything from the ceremony, the lawn and the long night after.",
} as const;

/** The four states a scanned code can resolve to. */
export type FixtureId = "open" | "password" | "account" | "empty";

export const FIXTURES: Record<
  FixtureId,
  {
    /** The server-resolved gallery access this fixture stands for. */
    access: "full" | "teaser" | "none";
    /** What the album holds at this level. */
    items: GridMedia[];
    /** The count the page may show. */
    count: number;
    /** A locked page carries the name and the count and nothing else. */
    redacted: boolean;
    /** The gate the entry surface is on, if any. */
    gate: "password" | "account" | null;
  }
> = {
  open: {
    access: "full",
    items: ALBUM,
    count: EVENT.photos,
    redacted: false,
    gate: null,
  },
  password: {
    access: "none",
    items: [],
    count: EVENT.photos,
    redacted: true,
    gate: "password",
  },
  account: {
    access: "teaser",
    items: TEASER,
    count: EVENT.photos,
    redacted: false,
    gate: "account",
  },
  empty: { access: "full", items: [], count: 0, redacted: false, gate: null },
};
