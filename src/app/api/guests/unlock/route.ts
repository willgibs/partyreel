/**
 * Password-unlock for a protected album. Body: { qr_token? | share_token?, password }.
 * Verifies the password via the anon `verify_event_password` RPC (which returns the
 * event id on a bcrypt match, else null) and, on success, sets the signed httpOnly
 * unlock cookie. The client then router.refresh()es so the RSC re-resolves with the
 * cookie present and serves the gated media (via the admin-read).
 *
 * The cookie is set HERE because a Route Handler can write cookies; an RSC can't
 * (see lib/supabase/server.ts). Failures return a GENERIC 401 — we never distinguish
 * "wrong password" from "no such event" / "not password-protected".
 */
import { NextResponse } from "next/server";

import { signUnlock } from "@/lib/events/unlock-cookie";
import { createClient } from "@/lib/supabase/server";
import { unlockSchema } from "@/lib/validation/unlock";

// node:crypto (cookie HMAC) needs the Node runtime; presigned-free but keep it node.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const parsed = unlockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "bad_request" },
      { status: 400 },
    );
  }
  const { qr_token, share_token, password } = parsed.data;

  const supabase = await createClient();
  // Send exactly one token (the RPC rejects both/neither). The other defaults to null.
  const { data: eventId, error } = await supabase.rpc("verify_event_password", {
    ...(qr_token ? { p_qr_token: qr_token } : { p_share_token: share_token }),
    p_password: password,
  });

  // null event id = wrong password / not a password event / no such event. Generic.
  if (error || !eventId) {
    return NextResponse.json(
      { ok: false, code: "wrong_password" },
      { status: 401 },
    );
  }

  let cookie: { name: string; value: string; maxAge: number };
  try {
    cookie = signUnlock(eventId);
  } catch {
    // UNLOCK_COOKIE_SECRET unset — fail closed rather than mint an unsigned cookie.
    return NextResponse.json(
      { ok: false, code: "not_configured" },
      { status: 500 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookie.name, cookie.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: cookie.maxAge,
  });
  return res;
}
