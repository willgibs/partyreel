import { NextResponse } from "next/server";

import { getStripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

// Opens the Stripe Billing Portal for the signed-in host (manage/cancel subscription,
// update card) and returns the portal URL. Requires a Stripe customer — only hosts
// who've been through checkout have one. Cancellations flow back via the subscription
// webhooks, so this route makes no entitlement writes.
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

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
