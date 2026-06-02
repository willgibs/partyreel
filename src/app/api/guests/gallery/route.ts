import { NextResponse } from "next/server";

import { getApprovedMediaForUnlock } from "@/lib/db/queries/guest-events-admin";
import {
  getEventByQrToken,
  getEventMediaByQrToken,
} from "@/lib/db/queries/guest-events";
import { toGridItems } from "@/lib/r2/grid-items";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Poll target for the guest event page's LIVE gallery. Body: { qr_token }. Returns
// approved media (newest-first, presigned). Visibility-aware, mirroring the page:
//   open                 → the anon RPC (gates on visibility='open')
//   password             → the server admin-read, which SELF-GUARDS on the unlock
//                          cookie (returns [] when the request isn't unlocked); the
//                          anon RPC never serves password media
//   private / deleted    → []
// The qr_token IS the capability (ADR-0004); reading an open album needs no session.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "bad_request" },
      { status: 400 },
    );
  }

  const qrToken =
    body && typeof body === "object" && "qr_token" in body
      ? (body as { qr_token: unknown }).qr_token
      : null;
  if (typeof qrToken !== "string" || qrToken.length === 0) {
    return NextResponse.json(
      { ok: false, code: "bad_request" },
      { status: 400 },
    );
  }

  const event = await getEventByQrToken(qrToken);
  if (!event.ok || event.data.visibility === "private") {
    return NextResponse.json({ ok: true, items: [] });
  }

  const media =
    event.data.visibility === "password"
      ? await getApprovedMediaForUnlock(event.data.id)
      : await getEventMediaByQrToken(qrToken);

  const items = await toGridItems(media, event.data.name);
  return NextResponse.json({ ok: true, items });
}
