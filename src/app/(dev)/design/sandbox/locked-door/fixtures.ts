import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * ONE WEDDING AND THE THREE PEOPLE AT ITS DOOR (round three: the open door and
 * the door at rest).
 *
 * Maya and Jay's wedding, hosted by Maya, the party rounds one and two drew,
 * so a reader who walked them knows the room: a Public album she may walk
 * straight into, Lena waiting while Maya lets newcomers in one by one, and a
 * newcomer off the printed code at the shut door.
 *
 * ★ A SEPARATE FILE, NEVER AN IMPORT FROM ANOTHER BOARD (`identity-door`'s
 * rule, carried by every board since): a board's folder leaves whole when it
 * retires.
 *
 * ★ NOTHING HERE IS A REAL PERSON, and every photograph is one of the
 * bootstrap stills every board reuses (bible 9: no new asset to track).
 */

export const EVENT = {
  name: "Maya & Jay",
  /** `formatEventDate` reads it as the welcome's byline does. */
  date: "2026-09-12",
  /** The album's live count, as the welcome's promise and the head say it. */
  count: 214,
  /** Everyone who has added to it, as the album's stats line counts them. */
  guests: 31,
} as const;

/** The host, as the byline and the lines that name her need her. */
export const HOST = { name: "Maya", seed: "ld-maya" } as const;

/** The guest at the held door. */
export const LENA = { name: "Lena", seed: "ld-lena" } as const;

export type Still = {
  id: string;
  src: string;
  width: number;
  height: number;
};

const still = (id: Parameters<typeof marketingImage>[0]): Still => {
  const m = marketingImage(id);
  return { id, src: m.src, width: m.width, height: m.height };
};

/**
 * THE ALBUM, NEWEST FIRST: what the door shows through its opening (its
 * newest, the newest four where production draws four), what the album's
 * first screen holds once she is through, and the three its light is sampled
 * from (the door's lamp wears the album's newest previews, `album-light.tsx`).
 *
 * ★ THE NEWEST IS A PORTRAIT, as most party photographs are (a phone held
 * upright), and the one the door's opening, itself upright, is kindest to; the
 * Newest knob is not drawn here because the door's job is the same whatever
 * the photograph, and `one`'s costs line says what a dark one does.
 */
export const ALBUM: readonly Still[] = [
  still("wedding-petals"),
  still("wedding-toast"),
  still("wedding-golden"),
  still("reception-table"),
  still("wedding-rings"),
  still("reception-hall"),
  still("wedding-arch"),
  still("party-dj"),
  still("festival-crowd"),
];

/** The three newest, which the album's light is sampled from. */
export const NEWEST: readonly string[] = ALBUM.slice(0, 3).map((p) => p.src);

/**
 * WHAT LENA CHOSE WHILE SHE WAITED (production's `wait=pick`): three of her
 * own photographs, held in the tab until Maya lets her in, then sent. Stills
 * standing in for her camera roll; none is the album's.
 */
export const PICKS: readonly Still[] = [
  still("party-balloons"),
  still("festival-lights"),
  still("concert-confetti"),
];
