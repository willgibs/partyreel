import { NextResponse } from "next/server";

// STUB — Phase 4. Stripe webhook = the SINGLE source of truth for a host's tier;
// never trust the client. CRITICAL: read the RAW body with `await req.text()`
// (NOT req.json()) before stripe.webhooks.constructEvent — JSON-parsing mutates
// the bytes and the signature check fails. Writes tier/storage_cap to profiles
// via the service-role admin client (lib/supabase/admin.ts), which bypasses RLS.
export async function POST() {
  return NextResponse.json(
    { error: "not_implemented", phase: 4 },
    { status: 501 },
  );
}
