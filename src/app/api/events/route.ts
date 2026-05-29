import { NextResponse } from "next/server";

// STUB — Phase 1. Host-only event CRUD. POST creates an event (generates qr/
// share tokens; the DB enforce_event_limit trigger blocks creation past the
// tier's maxEvents). Must re-verify the host via getUser() — never trust the
// client. DB access goes through lib/db/*, not inline here.
export async function POST() {
  return NextResponse.json(
    { error: "not_implemented", phase: 1 },
    { status: 501 },
  );
}
