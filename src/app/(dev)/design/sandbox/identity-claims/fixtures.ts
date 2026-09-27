import type { ClaimableEventRow } from "@/lib/db/queries/claims";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * ONE GUEST, FOUR OLDER EVENTS UNDER HER ADDRESS (round two, 2026-09-27).
 *
 * Priya (`guest-capture`'s own guest) confirmed her email this morning at Maya
 * and Jay's wedding. Four older rows wait under that address, Will's own
 * example count ("I have 4 claimable events"): three really were hers (typed
 * at a names-mode door, never confirmed) and one, a beach bonfire, is someone
 * else typing her email. ★ THE TICKET CANNOT TELL THEM APART (the host never
 * sees an unconfirmed address), so nothing is drawn differently for the
 * impostor's row: `hers` exists only so a scripted walk can decide each card
 * the way Priya's memory would.
 *
 * ★ THE ROWS ARE IN THE RPC'S OWN ORDER, most recently active first
 * (`list_guest_rows_by_email` orders by the last live upload, descending), and
 * the dates are chosen so that order is also the order they happened. Round one
 * listed a May row above a July one, which the RPC never would.
 *
 * ★ ANA'S 30TH IS A PASSWORD EVENT, on purpose: the RPC withholds its date
 * (QA #40's rule, `20260924020000_row_cap_host.sql`), so its card is drawn with
 * no date and no photographs, the same rule carried to the preview.
 *
 * ★ A SEPARATE FILE, NOT AN IMPORT (`guest-capture/fixtures.ts`'s own note): a
 * board's directory is deleted whole at its ruling, so Priya's name and seed
 * are retyped, never imported, and she wears the colour a reader already knows.
 * The stills are the twelve marketing photographs every board reuses (bible 9:
 * no new asset, nothing to track the rights of).
 */

export const PRIYA = {
  name: "Priya",
  seed: "gc-priya",
} as const;

const STILL = (i: number) => MARKETING_IMAGES[i % MARKETING_IMAGES.length].src;

/** The wedding she confirmed at this morning: already a Guest card on her
 *  dashboard, since an upload alone makes a person a guest of an event. */
export const CURRENT_EVENT = {
  id: "maya-jay",
  name: "Maya & Jay",
  host: "Maya",
  hostSlug: "maya",
  seed: "gc-maya",
  date: "2026-09-26",
  cover: STILL(10),
} as const;

/** An event's host as the album and the moment card know one: a public page
 *  (a slug and a name), or none, and then nothing offers to follow them. */
export type WaitingHost = {
  name: string;
  seed: string;
  /** Null: the host has no public page, so there is nobody to follow. */
  slug: string | null;
};

export type WaitingEvent = ClaimableEventRow & {
  /** Only Priya's memory knows this; the ticket draws every row alike. */
  hers: boolean;
  /** A password event: its date and its photographs stay behind the door. */
  gated: boolean;
  host: WaitingHost;
  /** Small stills of the photos waiting under her address (none when gated). */
  photos: string[];
  /** The cover its Guest card wears once claimed (null: not an open album). */
  cover: string | null;
  /** The date its Guest card shows once she is a guest there: the dashboard
   *  reads the event itself, where the ticket's RPC withholds a gated date. */
  cardDate: string;
};

const TOMS: WaitingEvent = {
  eventId: "toms-leaving",
  eventName: "Tom's Leaving Do",
  eventDate: "2026-08-29",
  names: ["Priya"],
  uploadCount: 4,
  lastUploadAt: "2026-08-29T22:40:00.000Z",
  hers: true,
  gated: false,
  host: { name: "Tom", seed: "ic-tom", slug: "tom" },
  photos: [STILL(6), STILL(2), STILL(1), STILL(3)],
  cover: STILL(6),
  cardDate: "2026-08-29",
};

const BONFIRE: WaitingEvent = {
  eventId: "beach-bonfire",
  eventName: "Beach Bonfire",
  eventDate: "2026-07-19",
  names: ["Priya"],
  uploadCount: 2,
  lastUploadAt: "2026-07-19T23:10:00.000Z",
  hers: false,
  gated: false,
  host: { name: "Leo", seed: "ic-leo", slug: "leo" },
  photos: [STILL(8), STILL(9)],
  cover: STILL(8),
  cardDate: "2026-07-19",
};

const ANAS: WaitingEvent = {
  eventId: "anas-30th",
  eventName: "Ana's 30th",
  // QA #40: the RPC returns null for a password event's date.
  eventDate: null,
  names: ["Priya"],
  uploadCount: 3,
  lastUploadAt: "2026-06-13T21:05:00.000Z",
  hers: true,
  gated: true,
  host: { name: "Ana", seed: "ic-ana", slug: "ana" },
  photos: [],
  // A Guest card shows a cover for an OPEN album only (guest-events.ts).
  cover: null,
  cardDate: "2026-06-13",
};

const QUIZ: WaitingEvent = {
  eventId: "quiz-night",
  eventName: "Quiz Night",
  eventDate: "2026-05-02",
  names: ["Priya"],
  uploadCount: 2,
  lastUploadAt: "2026-05-02T20:30:00.000Z",
  hers: true,
  gated: false,
  // A host with no public page: the moment card's own rule draws no Follow.
  host: { name: "Sam", seed: "ic-sam", slug: null },
  photos: [STILL(7), STILL(5)],
  cover: STILL(7),
  cardDate: "2026-05-02",
};

/** The ticket's whole contents, in the RPC's own order. */
export const WAITING: readonly WaitingEvent[] = [TOMS, BONFIRE, ANAS, QUIZ];

/** Photographs waiting across every event, for a sentence that counts them. */
export const TOTAL_WAITING = WAITING.reduce((n, e) => n + e.uploadCount, 0);
