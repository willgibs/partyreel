"use server";

import { revalidatePath } from "next/cache";

import { type ActionResult } from "@/app/(app)/dashboard/actions";
import {
  creditOfSession,
  honorPassCredit,
} from "@/app/api/stripe/webhook/pass-credit";
import { requireAdminAction } from "@/lib/auth/admin-context";
import {
  cancelAccountDeletion,
  requestAccountDeletion,
} from "@/lib/db/mutations/account";
import { getAccountDetail } from "@/lib/db/queries/accounts";
import { readPassCredit } from "@/lib/db/queries/pass-credits";
import { captureError, captureWarning } from "@/lib/observability/sentry";
import { getStripe } from "@/lib/stripe/client";
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

/** A Checkout Session id as Stripe mints them (`cs_test_…`, `cs_live_…`): a lookup key and a path segment, nothing else. */
const CHECKOUT_SESSION_ID = /^cs_[A-Za-z0-9_]{1,255}$/;

/**
 * ★ THE OPERATOR'S RETRY OF A STUCK PASS-TO-PRO CREDIT (credit-watch): the webhook's own credit path (`honorPassCredit`)
 * run once more for one credited checkout, so a credit stuck past its hour (a claim never granted, a grant never
 * converted, a claim that lost its passes and was never settled) is fixed from /admin, never by SQL or a hunt through
 * Stripe's event log for a delivery to resend.
 *
 * It is the same path, not a second one: the checkout session is retrieved from Stripe and read exactly as the webhook
 * reads its delivery (`creditOfSession`), and the claim decides as it decides for a delivery. So it grants at most once
 * ever (a grant on record is never repeated, and a claim whose lease lapsed looks on Stripe's side before granting),
 * converts exactly the passes the checkout named, answers busy while a delivery holds the claim, and settles a claim
 * another checkout's credit overtook instead of granting. Whichever runs first, the webhook's retry or this, the other
 * finds the work done.
 *
 * ★ requireAdminAction() FIRST (admin + AAL2), then the claim must be this account's (read by its checkout, never
 * trusting the browser's pairing), and the session Stripe holds must carry this account's credit. No typed
 * confirmation: nothing is destroyed, and the act does what the host paid for. AUDITED like the account acts beside it
 * (there is no operator audit table: its effect plus one Sentry line naming who, whom and what came of it).
 */
export async function retryPassCreditAsOperatorAction(
  userId: string,
  sessionId: string,
): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;
  if (!isUuidShape(userId) || !CHECKOUT_SESSION_ID.test(sessionId)) {
    return { ok: false, code: "unknown", message: "No such credit." };
  }

  try {
    const claim = await readPassCredit(sessionId);
    if (!claim || claim.profile_id !== userId) {
      return {
        ok: false,
        code: "unknown",
        message: "This account holds no credit for that checkout.",
      };
    }
    const credit = creditOfSession(
      await getStripe().checkout.sessions.retrieve(sessionId),
    );
    if (credit === null || credit === "names_no_pass") {
      return {
        ok: false,
        code: "unknown",
        message:
          credit === null
            ? "Stripe shows no pass credit on this checkout, so nothing was run."
            : "This checkout's credit names no pass it can be held to, so nothing was run. Check Sentry.",
      };
    }
    if (credit.userId !== userId) {
      return {
        ok: false,
        code: "unknown",
        message:
          "Stripe shows this checkout as another account's, so nothing was run.",
      };
    }

    const outcome = await honorPassCredit(credit);
    captureWarning("admin", "operator_retried_pass_credit", {
      user_id: userId,
      session_id: sessionId,
      outcome,
      operator_id: auth.ctx.userId,
    });
    revalidatePath("/admin/accounts/[id]", "page");
    revalidatePath("/admin/accounts");
    switch (outcome) {
      case "converted":
      case "overlap":
        // Granted once and converted, or settled because another checkout credited its passes: its line says which.
        return { ok: true };
      case "busy_this_checkout":
        return {
          ok: false,
          code: "unknown",
          message:
            "A delivery of this checkout holds its claim right now. Try again in a few minutes.",
        };
      case "busy_another_checkout":
        return {
          ok: false,
          code: "unknown",
          message:
            "Another checkout's credit holds these passes right now. Try again in a few minutes.",
        };
      case "no_host":
        return {
          ok: false,
          code: "unknown",
          message:
            "No profile holds this account any more, so nothing was run.",
        };
    }
  } catch (error) {
    captureError("admin", error, {
      action: "operator_retry_pass_credit",
      user_id: userId,
      session_id: sessionId,
    });
    return {
      ok: false,
      code: "unknown",
      message: "The retry failed. Check Sentry before retrying.",
    };
  }
}
