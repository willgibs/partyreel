import {
  type Chip,
  GUESTS,
  MAYA,
  NOOR,
  PRIYA,
} from "@/app/(dev)/design/sandbox/profile-page/fixtures";

/**
 * ONE CAST, BORROWED WHOLE.
 *
 * The twenty-four names are `profile-page`'s own (imported, never retyped), because
 * the question this board asks is what a guest list FEELS like and the list itself
 * was already settled on that board. Re-declaring the people would let two boards
 * drift into two different weddings, and a colour decision judged on a different
 * crowd than the list decision was judged on is a decision judged on nothing.
 *
 * ★ FIVE PHOTOGRAPHS, NOT EIGHT. `profile-page` gives every third guest a picture,
 * which is the right ratio for a question about how a list WRAPS. This board's whole
 * subject is the people who have no picture, so the ratio is the one the manifest
 * asks for: five faces and nineteen seeded, which is closer to a real wedding two
 * days after the event and makes the seeded majority the thing on screen.
 *
 * ★ NOT ONE ROW HERE IS REAL, and not one of these seeds is private. A seed is a
 * public account id or a public display name; never an email, never a token
 * (docs/systems/profiles-social.md). Nothing on this board reads or writes a row.
 */

/** Who carries a photograph: five of the twenty-four, spread through the list so
 *  no single screenful is all faces or all orbs.
 *
 *  ★ EVERY ONE OF THE FIVE IS A DIFFERENT STILL, and the indices are chosen for
 *  that: `profile-page` gives a picture to every third guest, so these five are
 *  five of those, keeping their own file. The first pass borrowed one guest's
 *  picture for all five, and a guest list where four faces are the same photograph
 *  reads as a rendering bug rather than as a wedding. */
const WITH_PHOTO = new Set([0, 6, 12, 15, 21]);

export const CAST: Chip[] = GUESTS.map((g, i) => ({
  ...g,
  avatarUrl: WITH_PHOTO.has(i) ? g.avatarUrl : null,
}));

/** The first twelve: the size at which the shipped list draws chips rather than
 *  condensing to a faces row (`GUEST_LIST_FACES_THRESHOLD`). */
export const CAST_SMALL = CAST.slice(0, 12);

/**
 * What a seed is drawn FROM. The `seed` decision, and the reason it is a real
 * question rather than an implementation note: the account id is stable through a
 * rename, and the display name lets a person tune their own colour by editing one
 * field, at the cost of changing them everywhere at once.
 */
export type SeedSource = "account" | "name" | "handle";

export function seedOf(person: Chip, source: SeedSource): string {
  if (source === "name") return person.displayName ?? person.id;
  // A handle is public and stable, and most people have none: those fall back to
  // the account id, which is the honest picture of what that option ships.
  if (source === "handle") return person.slug ?? person.id;
  return person.id;
}

/* ── The people the single-avatar surfaces are drawn on ──────────────────── */

/** The signed-in host every dashboard and account picture is drawn for: Maya, with
 *  her photograph dropped, because a host with no photograph is the case. */
export const HOST = {
  id: MAYA.id,
  name: MAYA.name,
  email: "maya@example.com",
  slug: MAYA.slug,
  photo: MAYA.avatar,
} as const;

/** The person a profile page is drawn for. Noor joined and has uploaded nothing,
 *  which is exactly the account Will described: new, and generic today. */
export const NEWCOMER = {
  id: NOOR.id,
  name: NOOR.name,
  slug: NOOR.slug,
  joined: NOOR.joined,
} as const;

/** The guest an event-page account menu is drawn for. */
export const VISITOR = {
  id: PRIYA.id,
  name: PRIYA.name,
  email: "priya@example.com",
} as const;

/* ── What a frame can say about itself, measured rather than claimed ─────── */

/** The album the guest list sits under, and what it says about itself. */
export const EVENT = {
  name: "Maya & Jay's Wedding",
  dateLabel: "14 June 2026",
  guests: CAST.length,
} as const;
