"use server";

import { revalidatePath } from "next/cache";

import { type ActionResult } from "@/app/(app)/dashboard/actions";
import { requireAdminAction } from "@/lib/auth/admin-context";
import {
  cancelAccountDeletion,
  requestAccountDeletion,
} from "@/lib/db/mutations/account";
import { getAccountDetail } from "@/lib/db/queries/accounts";
import { captureError, captureWarning } from "@/lib/observability/sentry";
import { isUuidShape } from "@/lib/validation/uuid-shape";

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

/**
 * The operator's Cancel deletion: the private failsafe for an account whose deletion was asked for
 * by mistake (Will, 2026-10-03: never offered to the person, and the whole recovery is done here,
 * no SQL). `cancelAccountDeletion` does the work and refuses what it cannot honestly do: an account
 * not being deleted, one the purge already took, or a purge run under way.
 *
 * ★ requireAdminAction() FIRST (admin + AAL2), like the delete beside it. No typed confirmation:
 * the act is reversible (the account can be deleted again) and its record is anonymised, so there
 * is no address left to retype; the panel says what comes back and what does not instead.
 *
 * ★ AUDITED LIKE THE DELETE: there is no operator audit table (admin-observability.md), so the act
 * is its effect plus one Sentry line naming who and whom by id, a cancellation being the one
 * operator act that brings back data someone asked to have erased.
 */
export async function cancelAccountDeletionAsOperatorAction(
  userId: string,
): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;
  // An id that is not one names no account and is never read (the page's own rule).
  if (!isUuidShape(userId)) {
    return { ok: false, code: "unknown", message: "No such account." };
  }

  try {
    const result = await cancelAccountDeletion(userId);
    if (!result.ok) {
      if (result.code === "half") {
        captureError("admin", new Error("account deletion half-cancelled"), {
          action: "operator_cancel_deletion",
          user_id: userId,
        });
      }
      return { ok: false, code: "unknown", message: result.message };
    }
    captureWarning("admin", "operator_cancelled_account_deletion", {
      user_id: userId,
      operator_id: auth.ctx.userId,
    });
    revalidatePath("/admin/accounts/[id]", "page");
    revalidatePath("/admin/accounts");
    return { ok: true };
  } catch (error) {
    captureError("admin", error, {
      action: "operator_cancel_deletion",
      user_id: userId,
    });
    return {
      ok: false,
      code: "unknown",
      message: "The cancellation failed. Check Sentry before retrying.",
    };
  }
}
