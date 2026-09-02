/**
 * Cancel the subscription attached to an account that is being deleted.
 *
 * The ruling (Will, 2026-09-02): an active plan is AUTO-CANCELLED at the
 * request. Deletion is immediate and has no undo, so leaving the plan running
 * to the end of its period would bill a person who no longer has an account.
 * We cancel IMMEDIATELY (not `cancel_at_period_end`) for the same reason: there
 * is nothing left to keep entitled.
 *
 * ★ WE DO NOT WRITE THE PROFILE HERE. The Stripe webhook is the SOLE writer of
 * tier / storage_cap_bytes / stripe_subscription_id (billing-caps.md); this
 * cancellation makes Stripe deliver `customer.subscription.deleted`, and the
 * webhook downgrades the profile through its own idempotent path. The account
 * row is deleted by the sweep well after that, so the two never race for
 * anything that matters.
 *
 * ★ A FAILED CANCELLATION MUST BLOCK THE DELETION. The caller aborts on
 * `status: "failed"` and destroys nothing: "account gone, card still charged"
 * is a far worse outcome than "try again in a minute". Only a genuinely absent
 * subscription (`resource_missing`, i.e. it was already cancelled or the id is
 * stale) counts as success, because the end state is the one we wanted.
 *
 * Server-only: it signs with the secret key via the shared memoized client.
 */
import "server-only";

import { getStripe } from "@/lib/stripe/client";

export type SubscriptionCancelResult =
  /** The account never had a subscription id on file. */
  | { status: "none" }
  /** Cancelled now by this call. */
  | { status: "cancelled"; subscriptionId: string }
  /** Stripe says there is no such subscription: already gone, same end state. */
  | { status: "already_gone"; subscriptionId: string }
  /** Stripe refused or was unreachable. The caller must NOT proceed. */
  | { status: "failed"; subscriptionId: string; message: string };

/** True for the one Stripe failure that means "the end state is already correct". */
function isMissingResource(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  const statusCode = (error as { statusCode?: number } | null)?.statusCode;
  return code === "resource_missing" || statusCode === 404;
}

export async function cancelSubscriptionForDeletion(
  subscriptionId: string | null | undefined,
): Promise<SubscriptionCancelResult> {
  if (!subscriptionId) return { status: "none" };

  try {
    // Immediate cancellation. ★ Cancelling an ALREADY-canceled subscription
    // RAISES `resource_missing` rather than returning the object (verified
    // against Stripe TEST, 2026-09-02) - which is exactly why the branch below
    // has to treat that code as success. Without it, every retry of a partially
    // failed deletion would abort on a subscription that is already in the state
    // we wanted.
    await getStripe().subscriptions.cancel(subscriptionId);
    return { status: "cancelled", subscriptionId };
  } catch (error) {
    if (isMissingResource(error)) {
      return { status: "already_gone", subscriptionId };
    }
    return {
      status: "failed",
      subscriptionId,
      message:
        (error as { message?: string } | null)?.message ??
        "Stripe did not accept the cancellation.",
    };
  }
}
