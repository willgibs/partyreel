import { NextResponse } from "next/server";

// STUB — Phase 3 (moderation + lifecycle). Operates on a single media item
// (route param `mediaId`):
//   • PATCH  → approve / hide (set media.status); host-only via event ownership.
//   • DELETE → remove the row AND its R2 objects; host-only.
// Authz is by event ownership (RLS + a getUser() re-check), never the client.
export async function PATCH() {
  return NextResponse.json(
    { error: "not_implemented", phase: 3 },
    { status: 501 },
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "not_implemented", phase: 3 },
    { status: 501 },
  );
}
