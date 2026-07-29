import { NextResponse } from "next/server";

import { planById } from "@/lib/constants/tiers";
import { eventPassRenewalPriceId, priceIdForPlan } from "@/lib/stripe/plans";
import { getStripe } from "@/lib/stripe/client";
import {
  formatEntitlementExpiry,
  resolveEntitlement,
} from "@/lib/stripe/entitlement";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";
import { checkoutSchema } from "@/lib/validation/checkout";

// Creates a Stripe Checkout session (Pro subscription) for the signed-in host and
// returns the redirect URL. The WEBHOOK — not this route — provisions the tier, so
// this route never writes profiles.tier. We DO create + persist the Stripe customer
// here (one per host) so subscription webhooks map back to the profile.
export const runtime = "nodejs";

/** A refusal the CheckoutButton surfaces verbatim as the toast description. */
function refuse(code: string, message: string, status = 409) {
  return NextResponse.json({ ok: false, code, message }, { status });
}

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
    .select("stripe_customer_id, tier, tier_expires_at")
    .eq("id", user.id)
    .maybeSingle();

  const { planId, renewal } = parsed.data;

  // Shape check: the cheaper renewal price exists only for the Event Pass.
  if (renewal && planId !== "event_pass") {
    return NextResponse.json(
      {
        ok: false,
        code: "bad_request",
        message: "Renewal is Event Pass only.",
      },
      { status: 400 },
    );
  }

  // ── ADR-0023 ruling 1: ONE PLAN AT A TIME (QA #3) ────────────────────────────────────────────
  // Refuse a session whenever the caller already holds a live entitlement. Derived server-side
  // from `profiles` (the webhook is its sole writer), never from the request body.
  //
  // THE FAILURES THIS PREVENTS:
  //   • a second Pro subscription stacked on the first (billed twice, one cap);
  //   • an Event Pass bought while Pro is active, whose provisioning writes storage_cap_bytes =
  //     75 GB over the host's 2 TB while Stripe keeps charging for Pro. The nightly over-capacity
  //     sweep then starts REMOVING media that is legitimately inside the cap they pay for.
  // Stacking models (cap = max, or cap = sum) were considered and rejected in ADR-0023: both make
  // provisioning resolve two live entitlements on every webhook, and both are genuinely ambiguous
  // at the lapse boundary. The portal owns upgrades, downgrades and cancellation.
  const entitlement = resolveEntitlement(profile, new Date());

  if (entitlement.held === "pro") {
    return refuse(
      "already_subscribed",
      "You're already on Pro. Open the billing portal from your dashboard to change your storage size or cancel.",
    );
  }

  if (entitlement.held === "event_pass") {
    const until = formatEntitlementExpiry(entitlement.expiresAt);
    // The ONE sanctioned purchase for a live pass: renewing it. Provisioning extends from the
    // current expiry (see resolveEventPassCheckout), so this never costs the host their remaining
    // time. Everything else is refused.
    if (!(renewal && planId === "event_pass")) {
      return refuse(
        "already_entitled",
        planId === "event_pass"
          ? `Your Event Pass is active until ${until}. Use Renew Event Pass to add another year onto that date instead of buying a second one.`
          : `Your Event Pass is active until ${until}. Partyreel runs one plan at a time, so Pro can start once the pass ends. Get in touch through the contact page if you need to switch sooner.`,
      );
    }
  } else if (renewal) {
    // ── QA #35, the price gate ───────────────────────────────────────────────────────────────
    // The old gate (`tier === "event_pass" || tier_expires_at != null`) was dead and leaked in one
    // direction only: its first arm is subsumed by its second, and `tier_expires_at` is never
    // cleared, so ANY host who ever held a pass could buy the discounted renewal price forever
    // while a genuine current holder was the one case it was written for. Renewal now means what
    // it says: extending a pass that has not expired yet. A lapsed holder buys a fresh pass at the
    // standard price, which is also the only reading under which "extend from the current expiry"
    // has a current expiry to extend from.
    return refuse(
      "not_eligible",
      "Renewal applies to an Event Pass that is still active. Yours has ended, so start a new Event Pass from the pricing page.",
      403,
    );
  }

  const priceId = renewal ? eventPassRenewalPriceId() : priceIdForPlan(planId);

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

  // Pro = recurring subscription; Event Pass = one-time payment. The webhook reads
  // metadata.plan_id to recognize an Event Pass purchase (no subscription fires).
  const plan = planById(planId);
  const siteUrl = await getSiteUrl();
  const session = await stripe.checkout.sessions.create({
    mode: plan.billing === "one_time" ? "payment" : "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    metadata: { plan_id: planId },
    // client_reference_id is a belt-and-suspenders link the webhook can use to bind
    // the customer to the host (we also already persisted stripe_customer_id above).
    client_reference_id: user.id,
    success_url: `${siteUrl}/dashboard?upgraded=1`,
    cancel_url: `${siteUrl}/pricing`,
  });

  return NextResponse.json({ ok: true, url: session.url });
}
