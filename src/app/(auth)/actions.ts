"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

// Sign-out runs server-side so the auth cookies are cleared on the response
// before we navigate. redirect() throws NEXT_REDIRECT, so it must be the last
// statement and outside any try/catch.
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
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
