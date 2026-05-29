import { NextResponse } from "next/server";

// STUB — Phase 4. Creates a Stripe Checkout session (Pro/Max subscription or the
// one-time Event Pass) for the signed-in host and returns the redirect URL.
// Prices map to tiers in lib/constants/tiers.ts. The webhook — not this route —
// is the source of truth for the resulting tier.
export async function POST() {
  return NextResponse.json(
    { error: "not_implemented", phase: 4 },
    { status: 501 },
  );
}
