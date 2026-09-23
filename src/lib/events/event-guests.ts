/**
 * WHO IS A GUEST OF THIS EVENT, AS PEOPLE (guest by upload, Will 2026-09-22).
 *
 * His words: "the only way to be attached to an event as a guest should be via upload. Password
 * entry, veryify account, but no upload? Not listed as a guest. Delete all of your uploads? Removed
 * as a guest. Uploaded 1 photo? You're a guest." So a guest is somebody with an APPROVED upload at
 * the event, because what other people read (the guest list, the Guests room, every guest count)
 * shows only what the album shows. A `guests` row is the device's upload ticket minted at the door
 * and never counts on its own.
 *
 * This is the ONE place that turns the rows into people, so the hub's Guests card, the hub's header
 * and the album's "N photos & videos from M guests" can never disagree:
 *   - a CONFIRMED guest (a proved row: `verified_at`, never a bare `user_id`, because an
 *     unconfirmed sign-up carries a uid and still a typed name) counts ONCE PER PERSON, however many
 *     devices or visits minted rows for them;
 *   - a NAMED UNCONFIRMED guest counts once PER ROW: without an account there is nothing to
 *     de-duplicate by, and two people who both typed "Sam" are two people;
 *   - a NAMELESS row (minted before the door asked for a name) has nothing to show and never counts;
 *   - the HOST never counts, whether their upload rode the host routes (no guest row at all) or a
 *     row of their own (an anonymous upload they later claimed).
 *
 * Pure and node-safe: `getEventGuests` (lib/db/queries/social.ts) reads the two event-keyed sets and
 * hands them here.
 */

export type EventGuests = {
  /** Confirmed guests, once per person (their account ids), in no particular order. */
  verifiedUserIds: string[];
  /** Named, unconfirmed guests, once per guest row (the row id and the name they typed). */
  unverifiedRows: { id: string; displayName: string }[];
};

export type GuestRowFacts = {
  id: string;
  user_id: string | null;
  display_name: string | null;
  verified_at: string | null;
};

/** The one count: every guest person this event has, as the album says it. */
export function guestCount(guests: EventGuests): number {
  return guests.verifiedUserIds.length + guests.unverifiedRows.length;
}

export function resolveEventGuests(input: {
  /** The event's host, who is never their own guest. Null only for a hostless row. */
  hostId: string | null;
  /** Guest-row ids that carry at least one APPROVED upload at this event. */
  approvedGuestIds: ReadonlySet<string>;
  /** Every guest row of the event. */
  rows: readonly GuestRowFacts[];
}): EventGuests {
  const verified = new Set<string>();
  const unverifiedRows: EventGuests["unverifiedRows"] = [];
  for (const row of input.rows) {
    if (!input.approvedGuestIds.has(row.id)) continue;
    if (input.hostId !== null && row.user_id === input.hostId) continue;
    if (row.verified_at !== null) {
      // A proved row always carries its account (every writer of verified_at writes user_id with
      // it); the guard only keeps a malformed row from counting as a person nobody can name.
      if (row.user_id !== null) verified.add(row.user_id);
      continue;
    }
    const name = row.display_name?.trim();
    if (name) unverifiedRows.push({ id: row.id, displayName: name });
  }
  return { verifiedUserIds: [...verified], unverifiedRows };
}
