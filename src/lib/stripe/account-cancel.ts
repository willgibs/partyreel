/**
 * Cancel every subscription of an account that is being deleted.
 *
 * The ruling (Will, 2026-09-02): an active plan is AUTO-CANCELLED at the
 * request. Deletion is immediate and has no undo, so leaving the plan running
 * to the end of its period would bill a person who no longer has an account.
 * We cancel IMMEDIATELY (not `cancel_at_period_end`) for the same reason: there
 * is nothing left to keep entitled.
 *
 * ★ EVERY SUBSCRIPTION OF THE CUSTOMER, NOT ONLY THE ONE THE PROFILE FOLLOWS
 * (crumbs-41, from `hardening`). A host who paid in both Checkout tabs holds two
 * live subscriptions and the profile follows only the last grant's, so cancelling
 * the followed one left the other billing a deleted account. So the customer's
 * subscriptions are listed (Stripe's default list: every one not cancelled) and
 * each that has not ended is cancelled: active, trialing, past_due, unpaid,
 * paused, and incomplete too, whose first invoice can still be paid for 23 hours.
 * The followed id is cancelled as well, so a profile whose customer id is missing
 * (never bound) still loses the plan it follows.
 *
 * ★ WE DO NOT WRITE THE PROFILE HERE. The Stripe webhook is the SOLE writer of
 * tier / storage_cap_bytes / stripe_subscription_id (billing-caps.md); each
 * cancellation makes Stripe deliver `customer.subscription.deleted`, and the
 * webhook downgrades the profile through its own idempotent path. The account
 * row is deleted by the sweep well after that, so the two never race for
 * anything that matters.
 *
 * ★ A FAILED CANCELLATION MUST BLOCK THE DELETION. The caller aborts on
 * `status: "failed"` and destroys nothing: "account gone, card still charged"
 * is a far worse outcome than "try again in a minute". A failed list is a
 * failure too, since an unread subscription may be the one still billing. Only a
 * genuinely absent subscription (`resource_missing`, i.e. it was already
 * cancelled or the id is stale) counts as success, because the end state is the
 * one we wanted; a retry after a partial run lists only what is still live.
 *
 * Server-only: it signs with the secret key via the shared memoized client.
 */
import "server-only";

import type Stripe from "stripe";

import { getStripe } from "@/lib/stripe/client";

export type SubscriptionCancelResult =
  /** Nothing to cancel: no customer, no followed subscription, or none of them still live. */
  | { status: "none" }
  /** Every live subscription is cancelled now, or was already gone (the same end state). */
  | { status: "cancelled"; subscriptionIds: string[] }
  /** Stripe refused or was unreachable. The caller must NOT proceed. */
  | { status: "failed"; subscriptionId: string; message: string };

/** The statuses that bill no more: nothing to cancel. Stripe's default list already leaves `canceled` out. */
const ENDED: ReadonlySet<Stripe.Subscription.Status> = new Set([
  "canceled",
  "incomplete_expired",
]);

/** At most this many pages of a customer's subscriptions: a handful is the whole of any real customer. */
const MAX_PAGES = 10;

/** True for the one Stripe failure that means "the end state is already correct". */
function isMissingResource(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  const statusCode = (error as { statusCode?: number } | null)?.statusCode;
  return code === "resource_missing" || statusCode === 404;
}

function messageOf(error: unknown, fallback: string): string {
  return (error as { message?: string } | null)?.message ?? fallback;
}

/** Every subscription of the customer that has not ended, read whole. */
async function liveSubscriptionIds(customerId: string): Promise<string[]> {
  const ids: string[] = [];
  let startingAfter: string | undefined;
  for (let n = 0; n < MAX_PAGES; n++) {
    // The SDK throws on a failed call (no `{ data, error }` to swallow): the caller's catch turns it into `failed`.
    const page = await getStripe().subscriptions.list({
      customer: customerId,
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    for (const sub of page.data) if (!ENDED.has(sub.status)) ids.push(sub.id);
    if (!page.has_more || page.data.length === 0) return ids;
    startingAfter = page.data.at(-1)!.id;
  }
  // More pages than any customer holds: a list that cannot be read whole is a failure, never a partial cancel.
  throw new Error(
    `customer ${customerId} holds more than ${MAX_PAGES * 100} subscriptions`,
  );
}

export async function cancelSubscriptionsForDeletion({
  customerId,
  subscriptionId,
}: {
  customerId: string | null | undefined;
  subscriptionId: string | null | undefined;
}): Promise<SubscriptionCancelResult> {
  const ids = new Set<string>();
  if (customerId) {
    try {
      for (const id of await liveSubscriptionIds(customerId)) ids.add(id);
    } catch (error) {
      // A customer Stripe no longer has holds nothing that bills.
      if (!isMissingResource(error)) {
        return {
          status: "failed",
          subscriptionId: subscriptionId ?? customerId,
          message: messageOf(error, "Stripe did not list the subscriptions."),
        };
      }
    }
  }
  if (subscriptionId) ids.add(subscriptionId);
  if (ids.size === 0) return { status: "none" };

  const cancelled: string[] = [];
  for (const id of ids) {
    try {
      // Immediate cancellation. ★ Cancelling an ALREADY-canceled subscription
      // RAISES `resource_missing` rather than returning the object (verified
      // against Stripe TEST, 2026-09-02) - which is exactly why the branch below
      // has to treat that code as success. Without it, every retry of a partially
      // failed deletion would abort on a subscription that is already in the state
      // we wanted.
      await getStripe().subscriptions.cancel(id);
      cancelled.push(id);
    } catch (error) {
      if (isMissingResource(error)) {
        cancelled.push(id);
        continue;
      }
      return {
        status: "failed",
        subscriptionId: id,
        message: messageOf(error, "Stripe did not accept the cancellation."),
      };
    }
  }
  return { status: "cancelled", subscriptionIds: cancelled };
}
