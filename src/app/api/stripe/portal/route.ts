import { NextResponse } from "next/server";

// STUB — Phase 4. Opens the Stripe Billing Portal for the signed-in host
// (manage/cancel subscription, update card) and returns the portal URL.
export async function POST() {
  return NextResponse.json(
    { error: "not_implemented", phase: 4 },
    { status: 501 },
  );
}
