import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * THREE PEOPLE AT THE DOOR, AND NOTHING ELSE MOVES.
 *
 * Every picture on this board is one of three arrivals, so what changes
 * between options is the DOOR and never who is standing at it:
 *
 *  - NEW      a host who just pressed "Start free" on the marketing site and
 *             has never had an account. The empty form is their whole world.
 *  - BACK     a host who has signed in before: a name, an address this device
 *             already knows, and an event they ran three weeks ago.
 *  - GUEST    someone at somebody else's wedding, on a phone, who is being
 *             asked for an account by the gate or by Save. The event is NOT
 *             theirs, which is the whole reason the guest surfaces exist.
 *
 * ★ THE ADDRESSES AND THE CODE ARE FICTION, AND NOTHING HERE AUTHENTICATES.
 * No preview on this board calls Supabase, sends an email or types a
 * credential: the fields are the shipped components rendered with values, and
 * the code screen is drawn at rest. Never point a fixture at a real address.
 */

/** A host who has never had an account. The form is empty on purpose. */
export const NEW_HOST = {
  /** What the shipped Input's placeholder already says. */
  placeholder: "you@email.com",
} as const;

/** A host this device has seen before, and the event they last ran. */
export const BACK = {
  name: "Nadia",
  email: "nadia.okonkwo@gmail.com",
  /** The address, masked the way a remembered door would show it. */
  masked: "n•••••@gmail.com",
  event: {
    name: "Nadia's 30th",
    /** Rendered through the product's own `formatEventDate`. */
    date: "2026-05-23",
    photos: 186,
    guests: 41,
    /** The event's own cover, for the door that remembers it. */
    cover: MARKETING_IMAGES[2].src,
  },
} as const;

/** Somebody else's event, where a guest meets the gate and the Save dialog. */
export const GUEST_EVENT = {
  name: "Ama & Tunde's Wedding",
  host: "Ama",
  date: "2026-06-14",
  photos: 214,
} as const;

/**
 * THE PRODUCT'S OWN PHOTOGRAPHS, for the door that puts them beside the form.
 *
 * ★ PLAIN `<img>`, NOT THE ALBUM. `GuestMasonry` drags `LikeButton` and the
 * lightbox in with it, and both resolve a session on mount, which inside a lab
 * frame is the AUTHOR's real session and a network call from a preview. The
 * album's own grammar is `app-vocabulary`'s question anyway; here the
 * photographs are the page's ground, so they are eight stills at declared
 * shapes and nothing else.
 *
 * Eight, not twelve: at 1440 the wall is half a 900px screen, and eight fills
 * it in three columns without a ninth tile half-cut at the fold.
 */
export const WALL: { src: string; ratio: string }[] = [
  { src: MARKETING_IMAGES[11].src, ratio: "2 / 3" },
  { src: MARKETING_IMAGES[0].src, ratio: "3 / 2" },
  { src: MARKETING_IMAGES[7].src, ratio: "1 / 1" },
  { src: MARKETING_IMAGES[3].src, ratio: "3 / 4" },
  { src: MARKETING_IMAGES[8].src, ratio: "3 / 2" },
  { src: MARKETING_IMAGES[5].src, ratio: "4 / 5" },
  { src: MARKETING_IMAGES[2].src, ratio: "3 / 2" },
  { src: MARKETING_IMAGES[9].src, ratio: "3 / 4" },
];

/** The four newest photographs of the guest's event, for the Save dialog's ground. */
export const GUEST_STRIP: string[] = [
  MARKETING_IMAGES[4].src,
  MARKETING_IMAGES[1].src,
  MARKETING_IMAGES[10].src,
  MARKETING_IMAGES[6].src,
];
