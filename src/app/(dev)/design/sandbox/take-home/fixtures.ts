import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * MAYA AND JAY'S WEDDING, THE MORNING AFTER: the party the door boards and the
 * event heads stand at, so the album a guest takes photos home from is the
 * album behind that door, 214 photos and videos from 31 guests.
 *
 * ★ A SEPARATE FILE, NEVER AN IMPORT FROM ANOTHER BOARD: a board's folder
 * leaves whole when it retires. NOTHING HERE IS A REAL PERSON, and every
 * photograph is one of the bootstrap stills every board reuses (bible 9: no new
 * asset, nothing to track). Its copy is placeholder, judged for size and
 * wrapping only.
 */

export const EVENT = {
  name: "Maya & Jay",
  /** `formatEventDate` reads it as the cover does. */
  date: "2026-09-12",
  description:
    "Everything from the day, in one place. Add whatever you took, whenever you get to it.",
  /** The album's address, as a guest's zip is named after it (`download-filename.ts`'s slug). */
  slug: "maya-and-jay",
} as const;

/** The host, as the cover's byline and her hub draw her. */
export const HOST = { name: "Maya", seed: "th-maya" } as const;

/** The guest taking photos home: a name she typed at the door. */
export const GUEST = { name: "Priya" } as const;

/** The album's guests, as the cover's glyphs count them. */
export const GUESTS = 31;

export type Still = { src: string; w: number; h: number };

const still = (
  id: Parameters<typeof marketingImage>[0],
  w?: number,
  h?: number,
): Still => {
  const m = marketingImage(id);
  return { src: m.src, w: w ?? m.width, h: h ?? m.height };
};

/**
 * THE ALBUM, NEWEST FIRST. The stills are mostly 3:2, so the declared ratios
 * vary as a real party's do (a tile is `object-cover`), and the rows read as an
 * album rather than a contact sheet. Repeated to a real album's depth where a
 * frame scrolls.
 */
export const ALBUM: readonly Still[] = [
  still("wedding-toast"),
  still("wedding-golden", 4, 5),
  still("reception-table"),
  still("wedding-petals"),
  still("wedding-rings", 1, 1),
  still("reception-hall"),
  still("wedding-arch", 3, 4),
  still("party-dj"),
  still("festival-lights", 4, 3),
  still("concert-confetti"),
  still("party-balloons", 4, 5),
  still("festival-crowd"),
  still("wedding-golden"),
  still("wedding-toast", 3, 4),
  still("reception-hall", 1, 1),
  still("wedding-arch"),
  still("reception-table", 4, 5),
  still("wedding-rings"),
];

/** The album's photograph at a place in it, wrapping round the stills. */
export const photoAt = (i: number): Still => ALBUM[i % ALBUM.length]!;

/** The cover's opening stills (the reel's own take), as the head dissolves through them. */
export const COVER_STILLS = [0, 5, 1, 6].map((i, n) => ({
  id: `th-cover-${n}`,
  tile: photoAt(i).src,
}));

/**
 * THE PHOTOGRAPHS PRIYA PICKS, by their place in the album: the ones she is in
 * and the ones she loves, scattered the way a real pick is, never a run.
 */
export const PICKED: ReadonlySet<number> = new Set([
  0, 2, 3, 7, 9, 10, 13, 16, 17, 20, 22, 25,
]);

/** The nine she has gathered into her tray as she looked: the first nine of her picks. */
export const TRAY: readonly number[] = [...PICKED].slice(0, 9);

/** The photograph open in the viewer, and the one she has just gathered. */
export const VIEWED = 1;
