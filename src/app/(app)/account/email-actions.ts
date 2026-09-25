"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { after } from "next/server";

import { isRateLimited, retryAfterSeconds } from "@/lib/auth/door-failure";
import { syncBillingEmail } from "@/lib/stripe/customer-email";
import { createClient } from "@/lib/supabase/server";

import {
  EMAIL_CODE_LENGTH,
  isChangeSide,
  newEmailSchema,
  type ChangeSide,
} from "./email-change";

/**
 * THE EMAIL CHANGE'S TWO SERVER FUNCTIONS (lp/identity-email): ask for the change, then confirm it
 * one code at a time. The state they drive, and why a change takes two codes, is email-change.ts.
 *
 * ★ BOTH RE-CHECK `getUser()`, NEVER `getSession()` (CLAUDE.md): a Server Function is a public
 * endpoint, and the session cookie proves nothing on its own.
 *
 * ★ NEITHER TAKES AN ADDRESS TO CHECK A CODE AGAINST. A code is verified against the address that
 * received it, and both of those are read off the caller's own auth user: `email` for the current
 * side and `new_email` for the new one. The request names only a side.
 */

export type EmailChangeRefusal = {
  ok: false;
  code:
    | "unauthorized"
    | "validation"
    | "same"
    | "rate_limited"
    | "wrong_code"
    | "no_change"
    | "error";
  message: string;
  /** `rate_limited` only: the seconds GoTrue named, when it named them. */
  seconds?: number;
};

export type RequestEmailChangeResult =
  | { ok: true; pending: string }
  | EmailChangeRefusal;

export type ConfirmEmailChangeResult =
  | { ok: true; state: "half"; confirmed: ChangeSide }
  | { ok: true; state: "done"; email: string }
  | EmailChangeRefusal;

function refuse(
  code: EmailChangeRefusal["code"],
  message: string,
): EmailChangeRefusal {
  return { ok: false, code, message };
}

function rateLimited(message: string | undefined): EmailChangeRefusal {
  const seconds = retryAfterSeconds(message) ?? undefined;
  return {
    ok: false,
    code: "rate_limited",
    message: seconds
      ? `Too many tries for now. Try again in ${seconds} seconds.`
      : "Too many tries for now. Try again in a minute.",
    ...(seconds ? { seconds } : {}),
  };
}

/**
 * Where a tapped link lands: `/auth/callback` on THE HOST THIS REQUEST CAME IN ON, never the
 * canonical site URL. The link's code exchange needs the PKCE verifier `updateUser` just set as a
 * cookie, and that cookie belongs to this host (the alias, localhost) even when the site URL names
 * the apex. GoTrue refuses a redirect off its allow-list, so the Host header cannot send it
 * anywhere else; the callback route trusts the same header.
 */
async function emailChangeCallback(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");
  return `${proto}://${host}/auth/callback?next=/account&flow=email_change`;
}

/**
 * Ask Supabase Auth to move the account to a new address. It mails a code (and a link) to the
 * current address and to the new one; nothing moves until both are entered.
 *
 * ★ AN ADDRESS THAT ALREADY HAS AN ACCOUNT IS ANSWERED LIKE A SENT ONE (`email_exists`): a different
 * sentence would make this action an oracle for which addresses hold Partyreel accounts. The card's
 * own help line covers the case without naming it ("the new address may already have its own
 * account"). Supabase Auth's email limits bound the sends; an abuse-limiter kind of its own is a
 * question in lp/identity-email's manifest.
 */
export async function requestEmailChangeAction(
  input: string,
): Promise<RequestEmailChangeResult> {
  const parsed = newEmailSchema.safeParse(input);
  if (!parsed.success) {
    return refuse(
      "validation",
      parsed.error.issues[0]?.message ?? "Enter a valid email address.",
    );
  }
  const address = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return refuse("unauthorized", "Sign in and try again.");
  if (address === user.email.trim().toLowerCase()) {
    return refuse("same", "That's already your email.");
  }

  const { error } = await supabase.auth.updateUser(
    { email: address },
    { emailRedirectTo: await emailChangeCallback() },
  );
  if (error && error.code !== "email_exists") {
    if (isRateLimited(error)) return rateLimited(error.message);
    if (
      error.code === "email_address_invalid" ||
      error.code === "validation_failed"
    ) {
      return refuse("validation", "That email address doesn't look right.");
    }
    return refuse(
      "error",
      "We couldn't send the codes. Try again in a minute.",
    );
  }
  return { ok: true, pending: address };
}

/**
 * Check one of the two codes. The first answers `half`; the second completes the change, which the
 * database copies to the profile and the verified guest rows in the same commit, and then the Stripe
 * customer's copy follows, best-effort and after the response.
 */
export async function confirmEmailChangeAction(
  side: ChangeSide,
  code: string,
): Promise<ConfirmEmailChangeResult> {
  if (!isChangeSide(side))
    return refuse("validation", "Something went wrong. Try again.");
  const token = typeof code === "string" ? code.trim() : "";
  if (!new RegExp(`^\\d{${EMAIL_CODE_LENGTH}}$`).test(token)) {
    return refuse("validation", `Enter the ${EMAIL_CODE_LENGTH}-digit code.`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return refuse("unauthorized", "Sign in and try again.");
  const pending = user.new_email?.trim();
  if (!pending) {
    return refuse(
      "no_change",
      "This change isn't waiting anymore. Send new codes to start it again.",
    );
  }

  const { data, error } = await supabase.auth.verifyOtp({
    type: "email_change",
    email: side === "current" ? user.email : pending,
    token,
  });
  if (error) {
    if (isRateLimited(error)) return rateLimited(error.message);
    // GoTrue answers a wrong code and an expired one with the same `otp_expired`, so the words
    // carry both ways out.
    return refuse(
      "wrong_code",
      "That code didn't work. Check the newest email to this address, or send new codes.",
    );
  }
  if (!data.session) return { ok: true, state: "half", confirmed: side };

  const email = data.user?.email ?? pending;
  const userId = user.id;
  after(() => syncBillingEmail(userId, email));
  revalidatePath("/account");
  return { ok: true, state: "done", email };
}
