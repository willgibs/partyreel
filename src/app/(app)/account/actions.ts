"use server";

import { verifyCurrentPassword } from "@/lib/db/queries/account";
import { createClient } from "@/lib/supabase/server";
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

// Set or CLEAR the host's display name (the name shown to guests under "Hosted by"). A plain
// RLS self-update via the regular client: display_name is in the profiles update-grant allowlist
// and scoped by profiles_update_own, so the host owns this field (unlike avatar_updated_at /
// tier / storage_*, which are service-role only). An empty value (after trim) clears it to NULL,
// the "no name set" state the guest byline hides on (Phase 3).
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
  const value = parsed.data.length > 0 ? parsed.data : null;

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

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: value })
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
