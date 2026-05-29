import { NextResponse } from "next/server";

// STUB — Phase 2. Completes an R2 multipart upload (needs the per-part ETags
// the browser collected), then records the object via the create_media RPC so
// status/caps/ledger are set atomically. See ADR-0003.
export async function POST() {
  return NextResponse.json(
    { error: "not_implemented", phase: 2 },
    { status: 501 },
  );
}
