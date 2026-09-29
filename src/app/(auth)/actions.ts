"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { expireGuestSessionCookies } from "@/lib/guest/session-cookie-family";
import { createClient } from "@/lib/supabase/server";

// Sign-out runs server-side so the auth cookies are cleared on the response
// before we navigate. redirect() throws NEXT_REDIRECT, so it must be the last
// statement and outside any try/catch.
//
// ★ AND EVERY GUEST TICKET THE BROWSER CARRIES GOES DOWN WITH THE ACCOUNT (the
// upload-owner lane, 2026-09-23). A confirmed guest's ticket outlived their
// sign-out and credited the next person's photograph to them; the upload routes
// now refuse that (lib/guest/session-owner.ts, the guarantee), and this is the
// courtesy beside it: the server-readable half of every ticket (`pr_guest_*`,
// HttpOnly, so only a response can expire it) is expired here, and the account
// menu's form clears the localStorage half on submit (`forgetGuestTickets`), so
// the next person on a shared phone starts clean. (The family module, not
// `session-cookie.ts`: the account menu, a client component, imports this file,
// and every component test that mounts it loads this module for real, where
// `server-only` does not resolve.)
//
// ★ THE SCOPE IS ALWAYS NAMED, because auth-js's bare `signOut()` is GLOBAL:
// it revokes the refresh token of every session the account holds, on every
// device. That is how an operator signing out of the main site lost her admin
// portal's session and had to pass Google and her second factor again (build
// 20's red-team). No getUser() first, deliberately: a sign-out reads and writes
// no data, GoTrue's /logout authenticates the token itself, and a visitor with
// no session simply lands on /login.
async function endSession(scope: "local" | "global") {
  expireGuestSessionCookies(await cookies());
  const supabase = await createClient();
  return supabase.auth.signOut({ scope });
}

/**
 * SIGN OUT: THIS DEVICE ONLY. People keep one account open on a desk and a
 * phone for different jobs (the dashboard on one, the camera on the other), so
 * leaving one must not reach into the other. `local` deletes this session and
 * its refresh token; every other session stands until it signs out itself or
 * Sign out everywhere (`/account`) ends them all. The account menu, the admin
 * bar and every other form that posts here share it.
 */
export async function signOutAction() {
  await endSession("local");
  redirect("/login");
}

export type SignOutEverywhereResult = { ok: false; message: string };

/**
 * SIGN OUT EVERYWHERE: every session the account holds, this one included,
 * for a lost phone or a shared computer left signed in. It lives in /account's
 * security corner, never the menu, because it is rare and it reaches devices
 * the person is not holding.
 *
 * ★ A REFUSAL IS ANSWERED, NOT SWALLOWED. The device sign-out leaves for /login
 * whatever GoTrue says; this one cannot, because the person pressing it is
 * usually worried about a device they cannot see, and a failed call leaves
 * every session standing, so "it worked" would be a lie. auth-js already counts
 * a 401, 403 or 404 as done (the session was gone), so an error here is a real
 * failure: the network, or the auth server.
 *
 * What no scope reaches: an access token already issued stays valid by its
 * signature until its own expiry. Every gate here re-checks with `getUser()`,
 * which refuses a revoked session at once, so only someone holding the raw
 * token and calling the database directly could use what is left of it.
 */
export async function signOutEverywhereAction(): Promise<SignOutEverywhereResult> {
  const { error } = await endSession("global");
  if (error) {
    return {
      ok: false,
      message:
        "Couldn't sign out everywhere. Check your connection and try again.",
    };
  }
  redirect("/login");
}

/**
 * How old an account has to be, at the moment it signs in, before we are willing
 * to call it one the host "already had". A fresh signup's `profiles` row is
 * written by the `handle_new_user` trigger inside the same request that issues
 * the session, so the gap is milliseconds; three minutes is slack for a retried
 * verify and a host who left the code screen open, and it is far under any real
 * return visit.
 */
const ALREADY_HAD_AFTER_MS = 3 * 60 * 1000;

export type ExistingAccount = {
  /** True when this address already had an account before this sign-in. */
  existing: boolean;
  /** The verified address, read from the session — never from the client. */
  email: string;
};

/**
 * "You already had an account, so we signed you into it."
 *
 * ★ RULED (Will, 2026-09-20, `app-door` r1 `existing=tell`): "With the
 * streamlined magic link email login, it may feel easy to confuse 'create
 * account' and 'login' screens. This makes that mistake seamless, but still
 * flags it just in case."
 *
 * ★ AND IT IS DECIDED HERE, ON THE SERVER, AFTER THE CODE — never before, and
 * never from the phone. Two landmines meet in this function:
 *
 *  1. ENUMERATION. "This address already has an account" is only sayable once
 *     an OTP has PROVEN the address belongs to whoever is asking. Said any
 *     earlier it is a free oracle for testing which addresses have Partyreel
 *     accounts (auth-accounts.md). So the caller runs this only after
 *     `verifyOtp` (or a callback exchange) has succeeded, and this function
 *     answers about the CALLER'S OWN row and nothing else.
 *  2. THE CLOCK. "Is this account older than this sign-in?" compared against a
 *     browser clock is a fact a visitor can set. Both timestamps here are the
 *     server's: `created_at` off the row, and `Date.now()` in this process.
 *
 * The three facts, any one of which means "already had": a `welcomed_at` (the
 * host finished onboarding at least once), a `password_set_at` (they chose a
 * password on some earlier visit), or a row older than the slack above.
 *
 * Fails CLOSED toward silence: no user, no row or a failed read all answer
 * `existing: false`, because a wrong "you already had an account" on a genuinely
 * new host is a confusing lie, while a missing line is only the shipped
 * behaviour (`existing=silent`) for one visit.
 */
export async function checkExistingAccount(): Promise<ExistingAccount> {
  const supabase = await createClient();
  // getUser(), never getSession(): this runs right after a verify and decides
  // what the product says about an identity (auth-accounts.md).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { existing: false, email: "" };

  const email = user.email ?? "";
  // DELIBERATE swallow: this read only decides whether ONE dismissible line
  // appears. A failed read must land the host in their account silently (the
  // shipped behaviour), never block the door on a profile query.
  // eslint-disable-next-line partyreel/no-swallowed-db-error
  const { data } = await supabase
    .from("profiles")
    .select("created_at, welcomed_at, password_set_at")
    .eq("id", user.id)
    .maybeSingle();
  if (!data) return { existing: false, email };

  const createdAt = Date.parse(data.created_at);
  const older =
    Number.isFinite(createdAt) && Date.now() - createdAt > ALREADY_HAD_AFTER_MS;

  return {
    existing: Boolean(data.welcomed_at ?? data.password_set_at) || older,
    email,
  };
}
