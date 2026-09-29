import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * ONE WEDDING, EVERY PERSON ITS DOOR MEETS (round two: the whole door family).
 *
 * Maya and Jay's wedding, hosted by Maya: round one's party, so a reader who
 * walked it knows the room. Round two draws every state of the door (the
 * welcome that opens, the wait while Maya decides, the one shut door, and the
 * line someone who was in reads on it), so the people widen with it:
 *
 *  - a NEWCOMER off the printed code, at the welcome and at a shut door (a
 *    stranger to the page: no account, nothing confirmed on this phone);
 *  - LENA, a newcomer who confirmed her email at a door Maya lets people
 *    through one by one: she waits, she may be turned away, and at an invite
 *    list her address may not be on it (a confirmed account, so her header
 *    wears her face);
 *  - PRIYA, who was in, back to find the album made private;
 *  - DOM HALE, who was in, and whom Maya blocked.
 *
 * ★ `cause` IS FOR THE FRAME'S TITLE AND NOTHING ELSE, as round one had it: no
 * drawing reads it. The shut door is a function of who is reading (her header,
 * whether this phone has an email to confirm, whether the server knows she was
 * in, and at an invite list whether her confirmed address is on it), never of
 * why she is out.
 *
 * ★ A SEPARATE FILE, NEVER AN IMPORT FROM ANOTHER BOARD (`identity-door`'s rule,
 * carried by every board since): a board's directory leaves whole at its ruling.
 *
 * ★ NOTHING HERE IS A REAL PERSON, and every photograph is one of the bootstrap
 * stills every board reuses (bible 9: no new asset, nothing to track).
 */

export const EVENT = {
  name: "Maya & Jay",
  /** `formatEventDate` reads it as the welcome's byline does. */
  date: "2026-09-12",
  /** The album's live count, as the welcome's promise row says it. */
  count: 214,
  /** Everyone who has added to it, as the album's stats line counts them. */
  guests: 31,
} as const;

/** The host, as the byline, the plate and the lines that name her need her. */
export const HOST = { name: "Maya", seed: "ld-maya" } as const;

export type ReaderId =
  | "newcomer"
  | "lena"
  | "lena-declined"
  | "lena-unlisted"
  | "priya"
  | "dom";

export type Reader = {
  id: ReaderId;
  /** Who the header says this device is (`guest-header.tsx`'s two states). */
  who: { kind: "stranger" } | { kind: "member"; name: string; seed: string };
  /**
   * A confirmed email on this device. The back-in line ("Already a guest?
   * Confirm your email") is for a phone that has none: a confirmed reader has
   * nothing left to prove, so it is not drawn for her.
   */
  confirmed: boolean;
  /** Past the door before: the server knows it from her cookie or her account. */
  wasIn: boolean;
  /**
   * At an invite list, a confirmed address the list does not hold: the one
   * reader the shut door's foot offers `unlisted=ask` to. It is a fact about
   * her address, never about why anyone else is out.
   */
  unlisted: boolean;
  /** Why she is out, or what she is doing. The frame's title reads it; no drawing does. */
  cause: string;
};

const LENA_WHO = { kind: "member", name: "Lena", seed: "ld-lena" } as const;

export const READERS: Record<ReaderId, Reader> = {
  newcomer: {
    id: "newcomer",
    who: { kind: "stranger" },
    confirmed: false,
    wasIn: false,
    unlisted: false,
    cause: "a newcomer off the printed code",
  },
  lena: {
    id: "lena",
    who: LENA_WHO,
    confirmed: true,
    wasIn: false,
    unlisted: false,
    cause: "Lena, waiting while Maya decides",
  },
  "lena-declined": {
    id: "lena-declined",
    who: LENA_WHO,
    confirmed: true,
    wasIn: false,
    unlisted: false,
    cause: "Lena, turned away",
  },
  "lena-unlisted": {
    id: "lena-unlisted",
    who: LENA_WHO,
    confirmed: true,
    wasIn: false,
    unlisted: true,
    cause: "Lena, her address not on the invite list",
  },
  priya: {
    id: "priya",
    who: { kind: "member", name: "Priya", seed: "ld-priya" },
    confirmed: true,
    wasIn: true,
    unlisted: false,
    cause: "Priya, who was in, the album made private",
  },
  dom: {
    id: "dom",
    who: { kind: "member", name: "Dom Hale", seed: "ld-dom" },
    confirmed: true,
    wasIn: true,
    unlisted: false,
    cause: "Dom, who was in, blocked",
  },
};

export type Still = { src: string; width: number; height: number };

const still = (id: Parameters<typeof marketingImage>[0]): Still => {
  const m = marketingImage(id);
  return { src: m.src, width: m.width, height: m.height };
};

/**
 * THE ALBUM BEHIND THE WELCOME, newest first: what a Public album's door
 * blurs, and the three its lamp samples (the door's lamp wears the album's
 * newest previews, `album-light.tsx`). Nothing here is drawn behind any other
 * state: a waiting or shut door shows nothing of the album.
 */
export const ALBUM: readonly Still[] = [
  still("wedding-golden"),
  still("wedding-toast"),
  still("reception-table"),
  still("wedding-petals"),
  still("wedding-rings"),
  still("reception-hall"),
  still("wedding-arch"),
  still("party-dj"),
];

/** The three newest, which the lamp samples. */
export const NEWEST: readonly string[] = ALBUM.slice(0, 3).map((p) => p.src);

/**
 * WHAT LENA CHOSE WHILE SHE WAITED (the `pick` wait): three of her own photos,
 * held on her phone until Maya lets her in. Stills standing in for her camera
 * roll; none is the album's.
 */
export const PICKS: readonly Still[] = [
  still("party-balloons"),
  still("festival-lights"),
  still("concert-confetti"),
];
