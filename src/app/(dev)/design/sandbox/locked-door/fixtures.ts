import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * ONE WEDDING AND THE THREE PEOPLE ITS LOCKED DOOR STOPS.
 *
 * Maya and Jay's wedding, hosted by Maya: the party `voice-guest` and
 * `event-safety` draw, so a reader who walked those boards knows the room. The
 * door stops three people for three reasons, and the whole board turns on the
 * screen never telling the reasons apart:
 *
 *  - a NEWCOMER off the printed code, who arrives after Maya closed the album
 *    to newcomers (a stranger to the page: no account, nothing confirmed);
 *  - PRIYA, who was in and added photos, back a week later to find Maya has
 *    made the album private (a confirmed account, so her header wears her face);
 *  - DOM HALE, who was in and kept sending a nightclub to a wedding, and whom
 *    Maya blocked (also confirmed: the block keys on his account).
 *
 * ★ `cause` IS FOR THE FRAME'S TITLE AND NOTHING ELSE. No drawing on this board
 * reads it, which is the design's one rule made structural: the screen is a
 * function of who is reading (her header, whether she has an email to confirm,
 * whether the server knows she was in), never of why she is out.
 *
 * ★ A SEPARATE FILE, NEVER AN IMPORT FROM ANOTHER BOARD (`identity-door`'s rule,
 * carried by every board since): `event-safety` retires in `safety-wiring` this
 * round, and a board's directory leaves whole with it.
 *
 * ★ NOTHING HERE IS A REAL PERSON, and the one photograph is a bootstrap still
 * every board reuses (bible 9: no new asset, nothing to track).
 */

export const EVENT = { name: "Maya & Jay" } as const;

/** The host, as the byline and the line that names her need her. */
export const HOST = { name: "Maya", seed: "ld-maya" } as const;

export type ReaderId = "newcomer" | "priya" | "dom";

export type Reader = {
  id: ReaderId;
  /** Who the header says this device is (`guest-header.tsx`'s two states here). */
  who: { kind: "stranger" } | { kind: "member"; name: string; seed: string };
  /**
   * A confirmed email on this device. The back-in line ("Already a guest?
   * Confirm your email") is for a phone that has none: a confirmed reader has
   * nothing left to prove, so it is not drawn for her.
   */
  confirmed: boolean;
  /** Past the door before: the server knows it from her cookie or her account. */
  wasIn: boolean;
  /** Why she is out. The frame's title reads it; no drawing does. */
  cause: "closed" | "private" | "blocked";
  /** The frame's title: who is at the door and why. */
  title: string;
};

export const READERS: Record<ReaderId, Reader> = {
  newcomer: {
    id: "newcomer",
    who: { kind: "stranger" },
    confirmed: false,
    wasIn: false,
    cause: "closed",
    title: "A newcomer, the album closed to newcomers",
  },
  priya: {
    id: "priya",
    who: { kind: "member", name: "Priya", seed: "ld-priya" },
    confirmed: true,
    wasIn: true,
    cause: "private",
    title: "Priya, who was in, the album made private",
  },
  dom: {
    id: "dom",
    who: { kind: "member", name: "Dom Hale", seed: "ld-dom" },
    confirmed: true,
    wasIn: true,
    cause: "blocked",
    title: "Dom, who was in, blocked",
  },
};

/**
 * THE TRIO'S ORDER: the two who were in side by side, since their words must
 * match whatever the line, then the newcomer, the reference theirs may differ
 * from. It also puts a frame that changes with the line first, which is the one
 * `lab:demo` compares (the largest frame, the first of three equals).
 */
export const READER_ORDER: readonly ReaderId[] = ["priya", "dom", "newcomer"];

/**
 * THE ALBUM'S COVER, for the one option that shows it: its newest approved
 * photograph (`event_covers`, what the host's dashboard card wears), here the
 * wedding's golden-hour still.
 */
export const COVER = (() => {
  const m = marketingImage("wedding-golden");
  return { src: m.src, width: m.width, height: m.height };
})();
