/**
 * PUTTING THE TICKET DOWN. Body: `{ qr_token }` -> `{ ok: true }`, and one expired cookie.
 *
 * The door round (Will, 2026-09-21) gave the guest session a server-readable copy,
 * `pr_guest_<eventId>`, so an RSC can resolve WHICH guest is asking before it decides how much of
 * the album to send. That copy has to be droppable, and by the same acts that already drop the
 * localStorage one: the guest header's sign-out, and any leave path. Otherwise a phone passed
 * around a table would render the full album on the last contributor's ticket, which is precisely
 * the leak Require an upload to view exists to close.
 *
 * ★ IT ASKS FOR NOTHING AND PROVES NOTHING, because expiring your own cookie needs no capability:
 * the worst a forged call can do is log the caller out of their own browser. It does not touch the
 * `guests` row (the session token stays valid, so a guest who signs back in on the same device is
 * the same guest), and it never reads or returns one.
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import { getEventByQrToken } from "@/lib/db/queries/guest-events";
import {
  applyGuestCookies,
  guestSessionCookieClear,
} from "@/lib/guest/session-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ qr_token: z.string().min(1) });

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

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "bad_request" },
      { status: 400 },
    );
  }

  // The cookie is keyed by EVENT id, and the browser only knows the qr_token (or a custom slug),
  // so one indexed lookup resolves the name to clear. A dead link answers ok with nothing cleared:
  // there is no cookie for an event that does not exist, and saying so would be an existence oracle.
  const event = await getEventByQrToken(parsed.data.qr_token);
  const response = NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "private, no-store" } },
  );
  if (event.ok) {
    applyGuestCookies(response, [guestSessionCookieClear(event.data.id)]);
  }
  return response;
}
