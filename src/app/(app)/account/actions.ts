"use server";

import { verifyCurrentPassword } from "@/lib/db/queries/account";

// What the client security form receives. The actual password WRITE is
// supabase.auth.updateUser() on the browser client (so the session-rotating call keeps
// its unconditional cookie write); this action only RE-CONFIRMS the current password
// before a change, so there is no "set"/"update" action here.
export type ActionResult =
  | { ok: true }
  | {
      ok: false;
      code: "validation" | "incorrect_password";
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
