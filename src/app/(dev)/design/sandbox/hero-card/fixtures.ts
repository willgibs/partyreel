import { SITE_URL } from "@/lib/constants/site";

import { EVENT } from "../gallery-fixtures";

/**
 * THE CARD'S ONE EVENT: the lab's shared stand-in wedding (`gallery-fixtures`),
 * so the album a card shows is the album every other board already believes.
 *
 * ★ PLACEHOLDER, JUDGED FOR SIZE AND WRAPPING ONLY. The address is a custom
 * link as a Pro or Event Pass host would claim it (`/e/<slug>`, host-app.md's
 * "The custom event link"), at a slug's ordinary length, so a card that sets
 * it wraps the way a real one will.
 */
export const CARD_EVENT = {
  name: EVENT.name,
  /** The custom link's two halves, set apart on a card: the host typed the
   *  second, which is what a guest reads aloud or types. */
  domain: "partyreel.com/e/",
  slug: "mia-and-theo",
} as const;

/**
 * What a card's code encodes: the QR door's short value (`opens=short`), 25
 * modules against the event link's 33. The code no longer has to scan here
 * (Will: "The QR does not need to be scannable in this visual"; the demo
 * modal carries the scannable one), so a short value is chosen for how the
 * code DRAWS: fewer modules read as a code rather than a grey square at a
 * card's small sizes, and a phone that does scan it still lands on the demo.
 */
export const CARD_VALUE = `${SITE_URL}/demo`;

/**
 * The link as it unfurls in a group chat, in the product's own words: an open
 * event's pasted link is titled exactly this (`generateMetadata` in
 * `(guest)/e/[token]/page.tsx`), so `chat` quotes the real unfurl rather than
 * writing a marketing line.
 */
export const CHAT_TITLE = {
  lead: "Add photos to",
  name: EVENT.name,
} as const;

/**
 * The album a card shows, in the order it lays them out. Stand-ins from the
 * twelve bootstrap stills, which the band shows too; a pick names the
 * photographs made for the card (ASSETS row 33), and they replace these by id.
 * Eight, because `spread` fans the whole of a small album; every other card
 * shows the first four.
 */
export const CARD_STILLS = [
  "wedding-toast",
  "wedding-petals",
  "wedding-rings",
  "reception-table",
  "wedding-golden",
  "wedding-arch",
  "reception-hall",
  "party-dj",
] as const;

/** The one the album holds as a video: a toast is what a guest films. */
export const CARD_VIDEO = "wedding-toast";

/** Three of the album's guests, seeded as the guest list seeds a face. */
export const CARD_FACES = [
  { seed: "demo-guest-ruby", initial: "R" },
  { seed: "demo-guest-sam", initial: "S" },
  { seed: "demo-guest-theo", initial: "T" },
] as const;

/** The guests who added the prints `guests` pins them to, one each: the
 *  three faces the other cards show, and one more. */
export const CARD_GUESTS = [
  ...CARD_FACES,
  { seed: "demo-guest-jules", initial: "J" },
] as const;

/** How many are in: the shared event's own guest count. */
export const CARD_GUEST_COUNT = EVENT.guests;
