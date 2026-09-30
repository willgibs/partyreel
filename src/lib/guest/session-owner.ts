/**
 * WHOSE TICKET IS THIS?
 *
 * A guest session token names ONE `guests` row, and a browser keeps it in localStorage
 * (`pr_session_<qr_token>`) so a returning guest is the same guest. On a shared phone that is
 * whoever joined last, and here is what that costs once the row belongs to an ACCOUNT: a confirmed
 * guest signs out, somebody else signs in on the same browser and adds a photograph, and without
 * this rule it would land on the first person's row, credited to them, confirmed address and all;
 * a signed-out visitor on that browser could do the same, past Require verified emails, because
 * `create_media` checks the ROW's `verified_at`. The safety model rests on a confirmed address
 * meaning the person, and a host blocking a guest would block the wrong one.
 *
 * ★ THE RULE, IN ONE LINE: a row that carries a `user_id` writes only for that signed-in account.
 * A name-only row (no `user_id`, no `verified_at`) is the device's ticket while nobody is signed in:
 * a typed name is not an identity anybody proved, so whoever holds the device holds it, which is the
 * whole shared-phone bargain the names mode already makes.
 *
 * ★ AND A SIGNED-IN ACCOUNT WRITES ONLY THROUGH A ROW OF ITS OWN (crumbs-26, build 27's red-team). Since
 * `shared-claims` a sign-in rightly leaves other people's tickets on the phone (the claim asks about one
 * typed under another name, and one typed under another address waits for its owner), and the upload
 * then went up on whichever the phone held for that album: a signed-in account's photo was filed under
 * the visitor's typed name, with no Delete of hers, and the phone asked her whether her own photo was
 * hers. So a name-only row is never a signed-in account's to write through until the claim makes it
 * hers (`whose_ticket`: her own name or address, the rule the sign-in's claim reads); the server check
 * asks the claim at that moment, and a ticket it leaves is somebody else's, put down like an account's.
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
 * row? A name-only row is the token holder's while nobody is signed in, and never a signed-in
 * account's (only the claim makes it hers, which turns it into her row); an account's row is that
 * account's alone; a confirmed row with no account left is nobody's. Pure, so the one rule is
 * unit-tested once and read the same way by every route that asks it.
 */
export function sessionBelongsTo(
  row: SessionRowOwner,
  viewerId: string | null,
): boolean {
  if (row.userId !== null) return row.userId === viewerId;
  return !row.verified && viewerId === null;
}
