import { NextResponse } from "next/server";

// STUB — Phase 2. Issues presigned URLs for a browser → R2 DIRECT multipart
// upload (a 2 GB video can never pass through a Vercel function). Will call into
// lib/r2/presign.ts. Gotchas to honor: client checksum WHEN_REQUIRED, presign
// signableHeaders = {"content-type"}, bucket CORS must expose ETag. See ADR-0003.
export async function POST() {
  return NextResponse.json(
    { error: "not_implemented", phase: 2 },
    { status: 501 },
  );
}
