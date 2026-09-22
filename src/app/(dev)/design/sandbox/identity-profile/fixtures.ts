import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * ONE PERSON, PAST THE POINT THE OTHER IDENTITY BOARDS LEAVE HER.
 * `guest-capture`'s Priya types a name at Maya and Jay's wedding and is offered
 * a way to keep what she sent; `identity-claims`' Priya is mid-claim, sorting
 * two older events out of her inbox. THIS BOARD'S PRIYA IS PAST BOTH: a
 * verified account, three events already joined (Maya and Jay's among them, so
 * a reader who has met her twice already recognises the wedding), and
 * `docs/tracks/identity-profile.md`'s own line, verbatim: "none shown yet."
 *
 * ★ A SEPARATE FILE, NOT AN IMPORT (guest-capture's own rule, carried here): a
 * board's directory is deleted the moment its ruling lands (registry.ts), so
 * importing another board's fixtures would tie this one's life to a folder it
 * does not own. The facts below are small and repeated on purpose.
 *
 * ★ THE STILLS ARE THE SAME TWELVE MARKETING IMAGES EVERY BOARD REUSES
 * (bible 18: no new asset, nothing to track the rights of).
 */

export const PRIYA = {
  name: "Priya",
  slug: "priya",
  seed: "ip-priya",
} as const;

const STILL = (i: number) => MARKETING_IMAGES[i % MARKETING_IMAGES.length].src;

export type AttendedEvent = {
  id: string;
  name: string;
  date: string;
  host: string;
  cover: string;
  /** Off by default (`profile_shown_events` is opt-in, the guest identity
   *  round, 2026-09-22): this is the state every option opens on. */
  shown: boolean;
};

/** The three events joined, none shown: the board's own premise, never a
 *  question inside it. Maya and Jay's first, so a reader who met Priya on
 *  `guest-capture` or `identity-claims` recognises the world immediately. */
export const ATTENDED: readonly AttendedEvent[] = [
  {
    id: "maya-jay",
    name: "Maya & Jay",
    date: "14 Jun",
    host: "Maya",
    cover: STILL(2),
    shown: false,
  },
  {
    id: "tara-30th",
    name: "Tara's 30th",
    date: "2 Aug",
    host: "Tara",
    cover: STILL(5),
    shown: false,
  },
  {
    id: "block-party",
    name: "The Block Party",
    date: "16 Aug",
    host: "Dan",
    cover: STILL(8),
    shown: false,
  },
];

/** The event a fresh confirmation or a follow moment names (`prompt`'s
 *  `follow` option): the same wedding, the one this whole identity arc opened
 *  on. */
export const EVENT = ATTENDED[0];
