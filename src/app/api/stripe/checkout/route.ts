import { NextResponse } from "next/server";

import { priceIdForPlan } from "@/lib/stripe/plans";
import { getStripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";
import { checkoutSchema } from "@/lib/validation/checkout";

// Creates a Stripe Checkout session (Pro subscription) for the signed-in host and
// returns the redirect URL. The WEBHOOK — not this route — provisions the tier, so
// this route never writes profiles.tier. We DO create + persist the Stripe customer
// here (one per host) so subscription webhooks map back to the profile.
export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, code: "unauthorized", message: "Sign in to upgrade." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "bad_request", message: "Invalid request body." },
      { status: 400 },
    );
  }
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "bad_request", message: "Unknown plan." },
      { status: 400 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  const stripe = getStripe();

  // Reuse the host's Stripe customer, else create one and persist it (service-role —
  // stripe_customer_id is not client-writable). Bind userId in metadata as a fallback link.
  let customerId = profile?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await createAdminClient()
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const siteUrl = await getSiteUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceIdForPlan(parsed.data.planId), quantity: 1 }],
    allow_promotion_codes: true,
    // client_reference_id is a belt-and-suspenders link the webhook can use to bind
    // the customer to the host (we also already persisted stripe_customer_id above).
    client_reference_id: user.id,
    success_url: `${siteUrl}/dashboard?upgraded=1`,
    cancel_url: `${siteUrl}/pricing`,
  });

  return NextResponse.json({ ok: true, url: session.url });
}
