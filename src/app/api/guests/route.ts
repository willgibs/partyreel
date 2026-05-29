import { NextResponse } from "next/server";

// STUB — Phase 2. POST joins a guest to an event via the create_guest RPC
// (validated by the event's qr_token) and returns an opaque session_token. The
// guest has no account — that token is their capability for subsequent uploads
// (ADR-0004).
export async function POST() {
  return NextResponse.json(
    { error: "not_implemented", phase: 2 },
    { status: 501 },
  );
}
