import { NextResponse } from "next/server";

import {
  getEventByQrToken,
  getEventMediaByQrToken,
} from "@/lib/db/queries/guest-events";
import { toGridItems } from "@/lib/r2/grid-items";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Poll target for the guest event page's LIVE gallery. Body: { qr_token }.
// Returns approved media (newest-first, presigned) — and EMPTY for a private /
// deleted event, because get_event_media_by_qr_token enforces `is_public`. The
// qr_token IS the capability (ADR-0004); reading a public album needs no session.
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

  // The event name is only needed to build a friendly download filename; the
  // is_public gate lives in the media RPC, so a private event yields no items.
  const event = await getEventByQrToken(qrToken);
  if (!event.ok) return NextResponse.json({ ok: true, items: [] });

  const media = await getEventMediaByQrToken(qrToken);
  const items = await toGridItems(media, event.data.name);
  return NextResponse.json({ ok: true, items });
}
