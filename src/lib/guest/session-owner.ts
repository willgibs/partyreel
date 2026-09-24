/**
 * WHOSE TICKET IS THIS? (the upload-owner lane, 2026-09-23.)
 *
 * A guest session token names ONE `guests` row, and a browser keeps it in localStorage
 * (`pr_session_<qr_token>`) so a returning guest is the same guest. On a shared phone that is
 * whoever joined last. The alias red-team of 2026-09-23 found what that costs once the row belongs
 * to an ACCOUNT: a confirmed guest signed out, somebody else signed in on the same browser, added a
 * photograph, and it landed on the first person's row, credited to them, confirmed address and all;
 * a signed-out visitor on that browser could do the same, past Require verified emails, because
 * `create_media` checks the ROW's `verified_at`. Will's safety model rests on a confirmed address
 * meaning the person, and a host blocking a guest would have blocked the wrong one.
 *
 * ★ THE RULE, IN ONE LINE: a row that carries a `user_id` writes only for that signed-in account.
 * A name-only row (no `user_id`, no `verified_at`) stays the device's ticket, exactly as before: a
 * typed name is not an identity anybody proved, so whoever holds the device holds it, which is the
 * whole shared-phone bargain the names mode already makes.
 *
 * ★ AND A CONFIRMED ROW WHOSE ACCOUNT IS GONE WRITES FOR NOBODY. Deleting an account nulls
 * `guests.user_id` (the FK is `on delete set null`, so the photographs stay in other hosts' albums)
 * but leaves `verified_at`, and `create_media` reads the ROW's `verified_at`: a device still holding
 * such a ticket would otherwise upload as a confirmed person who no longer exists, the same hole by
 * another road. No account can match it, so every write through it is refused.
 *
 * The server half (`session-owner.server.ts`) reads the row and the caller and refuses with
 * `SESSION_OTHER_ACCOUNT`; the client half (`use-upload-queue.ts`, the name step, the add-email
 * dialog) reads the code BY NAME, puts the device's ticket down and joins again as whoever is
 * actually holding the phone. This module is the part both halves share, so it imports nothing:
 * a browser bundle must be able to carry the code's name without carrying the service-role client.
 */

/**
 * The refusal's code. Its own name, never a substring any existing mapping already matches
 * (`mapCheckViolation` reads "verified email", "not accepting", "limit"...; `classifyRefusal` and the
 * queue read codes by exact name), so nothing downstream can mistake it for another refusal.
 */
export const SESSION_OTHER_ACCOUNT = "session_other_account";

/**
 * The sentence, for the rare surface that shows it at all: every client that knows the code
 * recovers without a word (the ticket goes down and the viewer joins as themselves). It names
 * nobody, because the one thing this refusal must never do is tell the next person on a phone who
 * the last one was. No em-dash (the copy policy).
 */
export const SESSION_OTHER_ACCOUNT_MESSAGE =
  "Someone else added photos from this device. Try again to add yours.";

/** What the rule needs to know about the row a ticket names (read on the server, never returned). */
export type SessionRowOwner = {
  /** The row's account, or null for a name-only row (or a confirmed one whose account was deleted). */
  userId: string | null;
  /** The row proved a confirmed email (`guests.verified_at` is set). */
  verified: boolean;
};

/**
 * May a request by `viewerId` (the `getUser()` id, or null when signed out) write through this guest
 * row? A name-only row is anyone's who holds its token; an account's row is that account's alone; a
 * confirmed row with no account left is nobody's. Pure, so the one rule is unit-tested once and read
 * the same way by every route that asks it.
 */
export function sessionBelongsTo(
  row: SessionRowOwner,
  viewerId: string | null,
): boolean {
  if (row.userId !== null) return row.userId === viewerId;
  return !row.verified;
}
