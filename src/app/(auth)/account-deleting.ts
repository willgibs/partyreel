/**
 * A SIGN-IN THAT MEETS A DELETION'S BAN (lp/account-exit): how each door recognises it, and the
 * words every door says. Pure, so the code screen, the callback route and `/login` share it.
 *
 * WHY: a deleted account's address is refused until the nightly purge deletes its sign-in
 * (`requestAccountDeletion` bans the auth user; only deletion ever bans one), and the refusal used
 * to reach a generic error: a person who deleted her account to start fresh met a dead end and no
 * reason (Will, 2026-10-03: "we may lose a user who doesn't know to wait a little"). So the door
 * says why and when, from `purge-time.ts`, and nothing more: a forensic hold keeps an account
 * banned past every window and is never told, so the one way out it adds is a contact line for an
 * address still refused after the time it named (Will, 2026-10-03).
 *
 * WHERE GoTrue REFUSES A BANNED USER (its source, v2.197; `user_banned` is the code, "User is
 * banned" the message, pinned in the doors' tests):
 *   - the email code's verify (`POST /verify`): 403, checked BEFORE the code, so ANY six digits
 *     answer it. The code screen names the address; anyone who can send it a code learns its
 *     account is being deleted, which GoTrue's own public endpoint already tells anyone, silently.
 *   - a tapped magic link (`GET /verify`) and Google (`/callback`): a redirect to our callback
 *     with `error=access_denied&error_code=user_banned` in the query. A URL anyone can write, so
 *     `/login`'s words for it are CONDITIONAL ("If you deleted your account..."): a forged link
 *     can paint nothing alarming about an account that is fine.
 *   - a password (`grant_type=password`): 400, also before the password is checked. That door's
 *     refusal stays generic by rule (auth-accounts.md), and its first way out, a code, lands here.
 *   - never at the send: `signInWithOtp` mails a banned user a code like anyone else.
 */

/** The `/login?error=` value the callback sends a banned sign-in to. */
export const ACCOUNT_DELETING = "account_deleting";

type AuthErrorLike = { code?: string | null; message?: string | null };

/**
 * GoTrue's refusal of a banned user, read by its code. The message is read only when no code came
 * (an older GoTrue, or a proxy that kept the body and lost the field), never to overrule one.
 */
export function isUserBanned(error: AuthErrorLike | null | undefined): boolean {
  if (!error) return false;
  if (error.code) return error.code === "user_banned";
  return /\buser is banned\b/i.test(error.message ?? "");
}

/** The same refusal as GoTrue's redirect states it in our callback's query. */
export function isBannedRedirect(params: URLSearchParams): boolean {
  return isUserBanned({
    code: params.get("error_code"),
    message: params.get("error_description"),
  });
}

/**
 * What a door says. With the address (the code screen, where GoTrue answered this very browser)
 * it says so of that address; without one (`/login`, reached by a URL) it says it of an account
 * the reader deleted, if she did. `time` is `purgeTimeLabel`'s, in her own zone.
 */
export function accountDeletingLine(
  time: string,
  email?: string | null,
): string {
  return email
    ? `The old account for ${email} is still being erased. You can start fresh with this email after ${time}.`
    : `If you deleted your account, it’s still being erased. You can start fresh with the same email after ${time}.`;
}
