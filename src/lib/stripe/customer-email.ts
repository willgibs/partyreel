/**
 * The Stripe customer's copy of the account's address, kept in step after an email change.
 *
 * The customer's email is otherwise written exactly once, when the checkout route creates the
 * customer (`src/app/api/stripe/checkout/route.ts`), and Stripe mails receipts and the Billing
 * Portal's sign-in link there. So once an account changes its address (the two-code change on
 * /account, or a link finished through `/auth/callback?flow=email_change`), this points the
 * customer at the new one.
 *
 * ★ BEST-EFFORT, AND IT NEVER THROWS. The change is already committed in Supabase Auth when this
 * runs, and nothing about it depends on Stripe: a failure is captured (so it is loud) and answered
 * as `failed`, never raised into the flow that called it. A missed sync leaves an old receipt
 * address, which the host can also correct in the Billing Portal.
 *
 * ★ IT WRITES ONLY THE EMAIL. Tier, caps and every other entitlement stay the webhook's
 * (billing-caps.md); a customer update never touches a subscription.
 *
 * Server-only: the Stripe secret key and the service-role client.
 */
import "server-only";

import { captureError } from "@/lib/observability/sentry";
import { getStripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";

export type BillingEmailSync =
  /** The account has no Stripe customer, so there is nothing to keep in step. */
  | { status: "none" }
  | { status: "updated"; customerId: string }
  /** Captured, never thrown: the change itself stands either way. */
  | { status: "failed"; customerId: string | null };

export async function syncBillingEmail(
  userId: string,
  email: string,
): Promise<BillingEmailSync> {
  let customerId: string | null = null;
  try {
    const { data, error } = await createAdminClient()
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    customerId = data?.stripe_customer_id ?? null;
    if (!customerId) return { status: "none" };

    await getStripe().customers.update(customerId, { email });
    return { status: "updated", customerId };
  } catch (error) {
    captureError("billing", error, {
      step: "sync_billing_email",
      user_id: userId,
      customer_id: customerId,
    });
    return { status: "failed", customerId };
  }
}
