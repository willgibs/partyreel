import type Stripe from "stripe";

import { planById } from "@/lib/constants/tiers";
import { getStripe } from "@/lib/stripe/client";
import { planForPriceId } from "@/lib/stripe/plans";
import {
  resolveEventPassCheckout,
  resolveSubscriptionUpdate,
} from "@/lib/stripe/provision";
import { assertStripeEnv } from "@/lib/env";
import { captureError, captureWarning } from "@/lib/observability/sentry";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe webhook = the SINGLE source of truth for a host's tier. CRITICAL: read the
// RAW body (req.text(), NOT req.json()) before constructEvent — JSON-parsing mutates
// the bytes and the signature check fails. All writes go through the service-role
// admin client (bypasses RLS); the client can never set tier/storage_cap_bytes.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header.", { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      assertStripeEnv().STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    // Bad signature (or unconfigured secret) → reject. Never trust an unverified body.
    // A spike here signals a misconfigured secret; capture as a warning (no body/PII).
    captureWarning("webhook", "stripe signature verification failed");
    return new Response("Signature verification failed.", { status: 400 });
  }

  const admin = createAdminClient();

  if (event.type === "checkout.session.completed") {
    // One-time Event Pass purchase → provision tier + cap + expiry here (no
    // subscription event fires for a one-time payment).
    const pass = resolveEventPassCheckout(event, planById("event_pass"));
    if (pass) {
      const { error } = await admin
        .from("profiles")
        .update({
          tier: "event_pass",
          storage_cap_bytes: pass.storageCapBytes,
          tier_expires_at: pass.tierExpiresAt,
          stripe_customer_id: pass.customerId,
          stripe_subscription_id: null,
        })
        .eq("id", pass.userId);
      if (error) {
        captureError(
          "billing",
          new Error(`event-pass provisioning: ${error.message}`),
          { eventType: event.type },
        );
        return new Response(`Provisioning failed: ${error.message}`, {
          status: 500,
        });
      }
      return Response.json({ received: true });
    }

    // Otherwise (Pro subscription checkout) just bind the Stripe customer to the host;
    // the tier is provisioned from the customer.subscription.* events below.
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;
    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : (session.customer?.id ?? null);
    if (userId && customerId) {
      await admin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId)
        .is("stripe_customer_id", null);
    }
    return Response.json({ received: true });
  }

  // Subscription lifecycle → derive tier + storage cap and write it (idempotent).
  const patch = resolveSubscriptionUpdate(event, planForPriceId);
  if (patch) {
    const { error } = await admin
      .from("profiles")
      .update({
        tier: patch.tier,
        storage_cap_bytes: patch.storageCapBytes,
        stripe_subscription_id: patch.subscriptionId,
      })
      .eq("stripe_customer_id", patch.customerId);
    if (error) {
      // Let Stripe retry on a transient DB error.
      captureError(
        "billing",
        new Error(`subscription provisioning: ${error.message}`),
        { eventType: event.type },
      );
      return new Response(`Provisioning failed: ${error.message}`, {
        status: 500,
      });
    }
  }

  return Response.json({ received: true });
}
