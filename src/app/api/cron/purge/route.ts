import { NextResponse } from "next/server";

// STUB — Phase 3. Vercel Cron sweeper (invoked via GET). Hard-deletes media for
// events past their purge_at / deleted_at, removing both R2 objects and rows,
// while honoring the 90-day cold-retention window kept for support recovery.
// Must authenticate the caller (Authorization: Bearer CRON_SECRET) and use the
// service-role admin client. Runs on Node (default), never the edge runtime.
export async function GET() {
  return NextResponse.json(
    { error: "not_implemented", phase: 3 },
    { status: 501 },
  );
}
