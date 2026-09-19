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
 * ★ THE ORDER IS OFFSET, NOT CYCLED. Twelve stills over 34 tiles repeat
 * whatever the order, and a plain cycle lines its repeats up: the tops of two
 * columns land twelve apart and the same photograph sits twice in one row. A
 * stride of 5 against 12 (coprime, so it still visits all twelve) walks the
 * repeats out of each other's rows at both 2 and 6 columns.
 */
const ORDER = Array.from({ length: ROLL.length }, (_, i) => (i * 5) % 12);

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
 * THE PHOTOGRAPH THAT LANDS WHILE A GUEST IS LOOKING. One more upload, from
 * another phone, prepended to the album (the doorbell's arrivals are
 * newest-first). A 3:4 portrait on a still the album's first screen does not
 * already hold, so it reads as new rather than as a repeat re-entering.
 */
export const ARRIVAL: GridMedia = {
  id: "gs-arrival",
  type: "photo",
  url: MARKETING_IMAGES[7].src,
  downloadUrl: MARKETING_IMAGES[7].src,
  status: "approved",
  width: 1200,
  height: 1600,
};

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
