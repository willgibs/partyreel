"use server";

import { revalidatePath } from "next/cache";

import { type ActionResult } from "@/app/(app)/dashboard/actions";
import { requireAdminAction } from "@/lib/auth/admin-context";
import { requestAccountDeletion } from "@/lib/db/mutations/account";
import { getAccountDetail } from "@/lib/db/queries/accounts";
import { captureError } from "@/lib/observability/sentry";

/**
 * The operator trigger behind /admin/accounts/[id]. Same request path as the
 * self-serve card, run on someone's behalf: for the person who writes in from
 * an address they can no longer sign in with, or when a takedown ends in
 * closing the account.
 *
 * ★ TWO GUARDS, BOTH SERVER-SIDE. requireAdminAction() is admin + AAL2 (MFA is
 * the perimeter for any admin write), and the operator must retype the target's
 * email, which is compared against the row we are about to delete rather than
 * against anything the client sent. Deleting the wrong account is unrecoverable,
 * so "are you on the row you think you are on" gets its own check.
 */
export async function deleteAccountAsOperatorAction(
  userId: string,
  confirmation: string,
): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;

  if (userId === auth.ctx.userId) {
    // An operator deleting their own admin account from the portal would lock
    // the portal. The self-serve card on /account is the honest route for that.
    return {
      ok: false,
      code: "unknown",
      message: "Use your own account settings to close your account.",
    };
  }

  const account = await getAccountDetail(userId);
  if (!account) {
    return { ok: false, code: "unknown", message: "No such account." };
  }

  const target = (account.profile.email ?? account.profile.id).trim();
  if (confirmation.trim().toLowerCase() !== target.toLowerCase()) {
    return {
      ok: false,
      code: "unknown",
      message: "That does not match this account. Nothing was deleted.",
    };
  }

  try {
    const result = await requestAccountDeletion({ userId, actor: "operator" });
    if (!result.ok) {
      return { ok: false, code: "unknown", message: result.message };
    }
    revalidatePath("/admin/accounts/[id]", "page");
    revalidatePath("/admin/accounts");
    return { ok: true };
  } catch (error) {
    captureError("admin", error, {
      action: "operator_account_deletion",
      user_id: userId,
    });
    return {
      ok: false,
      code: "unknown",
      message: "The deletion failed. Check Sentry before retrying.",
    };
  }
}
