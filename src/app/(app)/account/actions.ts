"use server";

import { verifyCurrentPassword } from "@/lib/db/queries/account";
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
