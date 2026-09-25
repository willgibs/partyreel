import { NextResponse } from "next/server";

import {
  safeReturnPath,
  withWelcomeMarker,
} from "@/components/app/pricing/return-path";
import { activeNowPasses, passProCreditCents } from "@/lib/billing/passes";
import { checkPlanChange, replacesCap } from "@/lib/billing/storage-guard";
import { planById } from "@/lib/constants/tiers";
import { mustQuery } from "@/lib/db/must-query";
import { getLivePasses } from "@/lib/db/queries/event-passes";
import { getHostStorageSummary } from "@/lib/db/queries/storage";
import { eventPassRenewalPriceId, priceIdForPlan } from "@/lib/stripe/plans";
import { getStripe } from "@/lib/stripe/client";
import { resolveEntitlement } from "@/lib/stripe/entitlement";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";
import { checkoutSchema } from "@/lib/validation/checkout";

// Creates a Stripe Checkout session (Pro subscription) for the signed-in host and
// returns the redirect URL. The WEBHOOK — not this route — provisions the tier, so
// this route never writes profiles.tier. We DO create + persist the Stripe customer
// here (one per host) so subscription webhooks map back to the profile.
export const runtime = "nodejs";

/**
 * How long a Pro Checkout session stays payable. Stripe's default is 24 hours, and
 * the storage check below runs when the session is CREATED: a day-old tab could
 * still be paid after the host uploaded far past the plan it approved. Thirty
 * minutes is Stripe's floor, and Stripe measures it from ITS creation instant,
 * which lands after this server's clock by the request's flight time, so exactly
 * 30:00 from here can be refused as too short. The extra minute is that margin.
 */
const PRO_CHECKOUT_WINDOW_SECONDS = 31 * 60;

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

  // mustQuery: a swallowed failure here read as "no profile", which then created a
  // SECOND Stripe customer for a host who already had one (orphaning the first
  // customer's subscription webhooks) and dropped the renewal price gate below to
  // its no-pass branch. Money path: fail the checkout rather than guess the state.
  const profile = await mustQuery(
    supabase
      .from("profiles")
      .select("stripe_customer_id, tier, tier_expires_at")
      .eq("id", user.id)
      .maybeSingle(),
    "stripe/checkout: profile",
  );

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

  // ── billing-caps.md ("One plan at a time for Pro; passes stack") ──────────────────────────────────────
  // Pro stays ONE AT A TIME: a second subscription would double-bill against one cap, and a
  // size or cadence change belongs to /api/stripe/change-plan (the storage check, then Stripe's
  // confirm page with correct proration). Derived server-side from `profiles` (the webhook is
  // its sole writer), never from the request body. The CheckoutButton acts on this code by
  // posting the clicked Pro plan to change-plan, so the words below are what a host reads only
  // when that hop fails, or when a Pro host tries to buy a pass.
  //
  // Event Passes STACK (Will, 2026-08-27): each purchase is its own ledger row granting +1 event
  // slot and +75 GB for its own year, so "already holds a pass" is no longer a refusal. The old
  // cap-collapse hazard (a pass write flattening a Pro cap) is gone structurally: pass state is
  // recomputed from the ledger and never touches a Pro profile. Pro holders still cannot buy a
  // pass (nothing to stack ONTO under a bigger live cap).
  const entitlement = resolveEntitlement(profile, new Date());

  if (entitlement.held === "pro") {
    return refuse(
      "already_subscribed",
      planId === "event_pass"
        ? "You're on Pro, which already includes everything a pass adds."
        : "You're already on Pro. Change your size or switch between monthly and yearly from your plan instead.",
    );
  }

  // The ledger, not the profile label, answers renewal eligibility and the credit math: the
  // profile's tier can lag the nightly sweep, while windows never lie about "active right now".
  const now = new Date();
  const passes = await getLivePasses(user.id);
  const activeNow = activeNowPasses(passes, now);

  if (renewal && activeNow.length === 0) {
    // QA #35's price gate, ledger-edition: the discounted renewal price extends a pass that is
    // still running. With nothing active there is nothing to chain onto — a lapsed holder buys a
    // fresh pass at the standard price.
    return refuse(
      "not_eligible",
      "Renewal applies to an Event Pass that is still active. Yours has ended, so start a new Event Pass from the pricing page.",
      403,
    );
  }

  const plan = planById(planId);

  // ── THE STORAGE GUARD (Will, 2026-09-22; billing-caps.md) ─────────────────────────────────
  // A Pro checkout REPLACES the cap (every live pass becomes credit), so a host must fit the
  // plan they buy: stacked passes holding 140 GB cannot buy Pro 100 GB and shrink into the
  // over-cap grace. Active bytes against the plan's PLAIN cap, refused with the numbers
  // BEFORE a Stripe customer exists. An Event Pass is never checked: it stacks, so it can
  // only ever add room. A Free host in the grace meets the same line (the check is tier-blind).
  if (replacesCap(plan)) {
    const { activeBytes } = await getHostStorageSummary();
    const check = checkPlanChange(activeBytes, plan);
    if (!check.ok) {
      return NextResponse.json(
        { ok: false, ...check.refusal },
        { status: 409 },
      );
    }
  }

  // ── The prorated Pass → Pro credit (billing-caps.md) ───────────────────────────────────────────────
  // "I only pay for what I've used, and everything else goes toward what I get moving forward."
  // Computed here (the promise the buyer clicks on), stamped into session metadata, and honored
  // by the webhook on completion: it grants the amount as Stripe customer balance (auto-applied
  // to upcoming Pro invoices; Checkout's own first invoice never consumes balance, so nothing is
  // lost to the first charge) and consumes every live pass. Passes with unopened renewal windows
  // credit at 100% — nothing gets banked, nothing gets lost.
  const metadata: Record<string, string> = { plan_id: planId };
  if (renewal) metadata.renewal = "1";
  if (plan.tier === "pro") {
    const creditCents = passProCreditCents(passes, now);
    if (creditCents > 0) {
      metadata.pass_credit_cents = String(creditCents);
      // Audit trail only (consumption is every-live-row); capped well under Stripe's 500-char
      // metadata value limit.
      metadata.credited_pass_ids = passes
        .map((p) => p.id)
        .slice(0, 10)
        .join(",");
    }
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
  // metadata.plan_id to recognize an Event Pass purchase (no subscription fires),
  // metadata.renewal to chain the window, and metadata.pass_credit_cents to honor
  // the prorated credit.
  const siteUrl = await getSiteUrl();
  // ── WHERE THE BUYER LANDS (`back=finish`, Will 2026-09-20) ──────────────────
  // "Checkout returns to the exact control that was locked, now open and
  // waiting." The caller names that control's page in `next`; `safeReturnPath`
  // answers with the dashboard for ANYTHING it does not recognise, so this line
  // can never become an open redirect no matter what a client POSTs. Parsed off
  // the raw body rather than through `checkoutSchema`, which is the shared shape
  // of a PLAN and has no business knowing about return paths.
  const returnPath = withWelcomeMarker(
    safeReturnPath((body as { next?: unknown })?.next),
  );
  const session = await stripe.checkout.sessions.create({
    mode: plan.billing === "one_time" ? "payment" : "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    metadata,
    // client_reference_id is a belt-and-suspenders link the webhook can use to bind
    // the customer to the host (we also already persisted stripe_customer_id above).
    client_reference_id: user.id,
    success_url: `${siteUrl}${returnPath}`,
    cancel_url: `${siteUrl}/pricing`,
    // The storage check above is only as fresh as the session is short.
    ...(replacesCap(plan)
      ? {
          expires_at:
            Math.floor(Date.now() / 1000) + PRO_CHECKOUT_WINDOW_SECONDS,
        }
      : {}),
  });

  return NextResponse.json({ ok: true, url: session.url });
}
