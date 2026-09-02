"use server";

import { revalidatePath } from "next/cache";

import {
  removeMyNewsletterSignup,
  requestAccountDeletion,
} from "@/lib/db/mutations/account";
import { setNotificationPrefs } from "@/lib/db/mutations/social";
import { verifyCurrentPassword } from "@/lib/db/queries/account";
import type { NotificationPrefs } from "@/lib/social/notification-prefs";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { containsProfanity } from "@/lib/validation/profanity";
import { displayNameSchema } from "@/lib/validation/profile";

// What the client account forms receive. The password WRITE is supabase.auth.updateUser() on
// the browser client (so the session-rotating call keeps its unconditional cookie write); the
// password action here only RE-CONFIRMS the current password. The display-name action does its
// own write (a plain RLS self-update of profiles.display_name).
export type ActionResult =
  | { ok: true }
  | {
      ok: false;
      code: "validation" | "incorrect_password" | "error";
      message: string;
    };

// Re-confirm the host's CURRENT password before a password change. Verified via the
// verify_current_password RPC, which only READS auth.users (the live session is never
// disrupted — that is why we re-confirm here rather than via Supabase's reauthentication
// nonce). The client gates this to "change" mode only; a passwordless account returns
// false from the RPC (handled as "incorrect" since it can't reach change mode anyway).
export async function verifyCurrentPasswordAction(
  currentPassword: string,
): Promise<ActionResult> {
  if (!currentPassword) {
    return {
      ok: false,
      code: "validation",
      message: "Enter your current password.",
    };
  }

  const ok = await verifyCurrentPassword(currentPassword);
  if (!ok) {
    return {
      ok: false,
      code: "incorrect_password",
      message: "Current password is incorrect.",
    };
  }

  return { ok: true };
}

// Set the user's public display name (uploader attribution + the "Hosted by" byline). REQUIRED
// now (Phase 1 identity foundation): there is no blank-clears-it path. This is the SINGLE write
// path for display_name, and it is authoritative: the authenticated UPDATE grant on
// profiles.display_name was revoked (Migration B), so the column is service-role-write-only and a
// direct client write can't bypass the length/reserved/profanity checks. We authorize via getUser,
// then write the caller's OWN row with the admin client (mirrors the avatar service-role write).
// Profanity is checked server-side only, so the obscenity matcher never ships to the browser.
export async function updateDisplayNameAction(
  name: string,
): Promise<ActionResult> {
  const parsed = displayNameSchema.safeParse(name);
  if (!parsed.success) {
    return {
      ok: false,
      code: "validation",
      message: parsed.error.issues[0]?.message ?? "Please check your name.",
    };
  }
  if (containsProfanity(parsed.data)) {
    return {
      ok: false,
      code: "validation",
      message: "Please choose a different name.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      code: "error",
      message: "Sign in to update your name.",
    };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ display_name: parsed.data })
    .eq("id", user.id);
  if (error) {
    return {
      ok: false,
      code: "error",
      message: "Couldn't save your name. Try again.",
    };
  }

  return { ok: true };
}

// ── Account deletion (the /account danger zone) ─────────────────────────────
//
// ★ THE RE-VERIFICATION IS ENFORCED HERE, IN THE ACTION, not in the dialog.
// A server action is a public endpoint: a client that simply skipped the
// password step and POSTed the delete would defeat the whole point of asking,
// because the attack re-verification exists to stop is a BORROWED SESSION. So
// the proof travels with the request and is checked server-side, every time.
//
// Both proofs are the ones the account already has (auth-accounts.md): the
// password through verify_current_password (a READ-only RPC, so the live
// session is never disrupted), or a fresh email code for the passwordless and
// Google-origin accounts. The address the code is sent to and verified against
// is read from the caller's OWN row, never taken from the request, so no
// swapped address can point this at another account.

export type DeletionProof =
  | { method: "password"; password: string }
  | { method: "code"; code: string };

export type DeleteAccountResult =
  | { ok: true }
  | {
      ok: false;
      code: "unauthorized" | "verification" | "subscription" | "error";
      message: string;
    };

/** The caller's own verified address, or null. Never trust one from the client. */
async function myEmail(): Promise<{ userId: string; email: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  return { userId: user.id, email: user.email };
}

/**
 * Send the six-digit confirmation code for a passwordless deletion. Supabase
 * Auth rate-limits the send per address and per IP, so this needs no limiter of
 * its own. `shouldCreateUser: false` keeps it from ever minting an account.
 */
export async function sendDeletionCodeAction(): Promise<ActionResult> {
  const me = await myEmail();
  if (!me) {
    return { ok: false, code: "error", message: "Sign in and try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: me.email,
    options: { shouldCreateUser: false },
  });
  if (error) {
    return {
      ok: false,
      code: "error",
      message: "Couldn't send the code. Try again in a minute.",
    };
  }
  return { ok: true };
}

/**
 * Delete the signed-in account: verify the proof, run the request, sign out.
 *
 * The sign-out is part of the action rather than the client's job, because the
 * account is anonymised and its auth user banned by the time this returns: a
 * session left standing would be a signed-in view of a wrecked account.
 */
export async function deleteMyAccountAction(
  proof: DeletionProof,
): Promise<DeleteAccountResult> {
  const me = await myEmail();
  if (!me) {
    return {
      ok: false,
      code: "unauthorized",
      message: "Sign in and try again.",
    };
  }

  const supabase = await createClient();
  if (proof.method === "password") {
    if (!proof.password) {
      return {
        ok: false,
        code: "verification",
        message: "Enter your password to confirm.",
      };
    }
    const verified = await verifyCurrentPassword(proof.password);
    if (!verified) {
      return {
        ok: false,
        code: "verification",
        message: "That password isn't right.",
      };
    }
  } else {
    const { error } = await supabase.auth.verifyOtp({
      email: me.email,
      token: proof.code,
      type: "email",
    });
    if (error) {
      return {
        ok: false,
        code: "verification",
        message: "That code didn't work. Check it and try again.",
      };
    }
  }

  const result = await requestAccountDeletion({
    userId: me.userId,
    actor: "self",
  });
  if (!result.ok) {
    return {
      ok: false,
      code: result.code === "subscription" ? "subscription" : "error",
      message: result.message,
    };
  }

  await supabase.auth.signOut();
  return { ok: true };
}

// ── Email preferences (the /account notification card) ──────────────────────

export type PrefsActionResult = { ok: true } | { ok: false; message: string };

/**
 * Save the tier-2 notification toggles. Tier 1 (sign-in codes, billing, storage
 * and deletion warnings) has no toggle by design: it is not a preference, and
 * notification-prefs.ts deliberately gives it no field to map.
 */
export async function updateNotificationPrefsAction(
  prefs: Partial<NotificationPrefs>,
): Promise<PrefsActionResult> {
  const result = await setNotificationPrefs(prefs);
  if (result.ok) {
    revalidatePath("/account");
    return { ok: true };
  }
  return {
    ok: false,
    message: result.message ?? "Couldn't save that. Please try again.",
  };
}

/**
 * The marketing switch. ON is the account's own consent flag; OFF is the
 * privacy policy's removal promise kept in one move: consent off AND the
 * address off the newsletter list. Turning it back on never re-adds a list row,
 * so a removal is a removal.
 */
export async function setMarketingEmailAction(
  optIn: boolean,
): Promise<PrefsActionResult> {
  const saved = await setNotificationPrefs({ marketingOptIn: optIn });
  if (!saved.ok) {
    return {
      ok: false,
      message: saved.message ?? "Couldn't save that. Please try again.",
    };
  }
  if (!optIn) {
    const removed = await removeMyNewsletterSignup();
    if (!removed.ok) return { ok: false, message: removed.message };
  }
  revalidatePath("/account");
  return { ok: true };
}
