import { NextResponse } from "next/server";

import { mustQuery } from "@/lib/db/must-query";
import { getStripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

// Opens the Stripe Billing Portal for the signed-in host (the card, the invoices,
// cancelling) on the account's DEFAULT configuration, and returns the portal URL.
// Requires a Stripe customer — only hosts who've been through checkout have one.
// Cancellations flow back via the subscription webhooks, so this route makes no
// entitlement writes. A Pro size or cadence change never comes here: it goes through
// /api/stripe/change-plan, which checks the storage first (billing-caps.md), and the
// default configuration's own plan switcher is switched off once that path is live.
export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        code: "unauthorized",
        message: "Sign in to manage billing.",
      },
      { status: 401 },
    );
  }

  // mustQuery: swallowed, a failed read became "no_customer", i.e. a PAYING host
  // told they have no billing account and left with no way to cancel. A 500 is the
  // honest answer to a broken read; the no_customer branch below stays for the real
  // never-checked-out case.
  const profile = await mustQuery(
    supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle(),
    "stripe/portal: profile",
  );

  if (!profile?.stripe_customer_id) {
    return NextResponse.json(
      { ok: false, code: "no_customer", message: "No billing account yet." },
      { status: 400 },
    );
  }

  const siteUrl = await getSiteUrl();
  const session = await getStripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${siteUrl}/dashboard`,
  });

  return NextResponse.json({ ok: true, url: session.url });
}
