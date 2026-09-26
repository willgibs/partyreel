/**
 * Password-unlock for a protected event. Body: { qr_token, password }.
 * Verifies the password via the anon `verify_event_password` RPC (which returns the
 * event id on a bcrypt match, else null) and, on success, sets the signed httpOnly
 * unlock cookie. The client then router.refresh()es so the RSC re-resolves with the
 * cookie present and serves the gated media (via the admin-read).
 *
 * The cookie is set HERE because a Route Handler can write cookies; an RSC can't
 * (see lib/supabase/server.ts). Failures return a GENERIC 401 — we never distinguish
 * "wrong password" from "no such event" / "not password-protected".
 *
 * The cookie is signed for the event's PASSWORD VERSION (unlock-cookie.ts), so a
 * password change signs everyone out; the version is read before the check (below).
 */
import { NextResponse } from "next/server";

import {
  readUnlockStateByToken,
  signUnlock,
  type UnlockState,
} from "@/lib/events/unlock-cookie";
import { captureError, captureWarning } from "@/lib/observability/sentry";
import { clientIp } from "@/lib/security/unlock-rate-limit";
import {
  checkUnlockRate,
  clearUnlockFailures,
  recordUnlockFailure,
  unlockHashes,
} from "@/lib/security/unlock-rate-limit-store";
import { createAdminClient } from "@/lib/supabase/admin";
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
  const { qr_token, password } = parsed.data;

  // Rate-limit FAILED unlock attempts (venue-NAT-aware: count failures; a SUCCESS clears the IP, so a
  // crowd on one venue WiFi entering the correct password is never blocked). Defense-in-depth: FAIL
  // OPEN on any limiter error — bcrypt + the generic 401 below remain the real password gate.
  let rlTokenHash: string | null = null;
  let rlIpHash: string | null = null;
  let gate = { allowed: true, retryAfterSec: 0 };
  try {
    const hashes = unlockHashes(qr_token, clientIp(request.headers));
    rlTokenHash = hashes.tokenHash;
    rlIpHash = hashes.ipHash;
    gate = await checkUnlockRate(hashes.tokenHash, hashes.ipHash);
  } catch (e) {
    // Fail OPEN (availability-first; bcrypt + the generic 401 remain the password gate) but ALERT.
    // Now that verify_event_password is service-role-only, this limiter is the SOLE, unbypassable
    // throttle on guessing -- a silent limiter outage is an open brute-force window, so surface it.
    gate = { allowed: true, retryAfterSec: 0 };
    captureWarning("security", "unlock_limiter_unavailable_fail_open", {
      reason: e instanceof Error ? e.message : String(e),
    });
  }
  if (!gate.allowed) {
    return NextResponse.json(
      { ok: false, code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSec) } },
    );
  }

  // ★ THE PASSWORD STATE IS READ BEFORE THE PASSWORD IS CHECKED, and the cookie is signed for
  // exactly what was read. Read after the check, a host changing the password between the bcrypt
  // match and the read would have the NEW state signed for a guess against the OLD one: a guest who
  // knew only the retired password would walk in under its replacement. Read before, that race can
  // only fail closed: the check runs against the new hash and refuses, or the cookie carries the old
  // version and is refused on its first read.
  let state: UnlockState | null;
  try {
    state = await readUnlockStateByToken(qr_token);
  } catch (e) {
    // Nothing to sign against. An outage, not a wrong password: no rate-limit failure recorded.
    captureError("security", e, { phase: "unlock_state_read" });
    return NextResponse.json(
      { ok: false, code: "unavailable" },
      { status: 503 },
    );
  }

  // Service-role admin client: verify_event_password is now revoked from anon/authenticated, so this
  // route is the ONLY caller -> every guess is forced through the rate limiter above (H2).
  const supabase = createAdminClient();
  const { data: eventId, error } = await supabase.rpc("verify_event_password", {
    p_qr_token: qr_token,
    p_password: password,
  });

  // null event id = wrong password / not a password event / no such event. Generic. A match with no
  // state read before it, or a state naming another event, cannot happen (the match needs the hash
  // the read found, on the same link); if it ever did, it fails closed the same way.
  if (error || !eventId || !state || state.eventId !== eventId) {
    // Record the failure for the rate-limiter (best-effort; never blocks the response).
    if (rlTokenHash && rlIpHash) {
      await recordUnlockFailure(rlTokenHash, rlIpHash).catch(() => {});
    }
    return NextResponse.json(
      { ok: false, code: "wrong_password" },
      { status: 401 },
    );
  }

  // Success — clear this IP's recorded failures so a venue crowd's earlier fat-fingering can't
  // accumulate toward the cap (best-effort).
  if (rlIpHash) {
    await clearUnlockFailures(rlIpHash).catch(() => {});
  }

  let cookie: { name: string; value: string; maxAge: number };
  try {
    cookie = signUnlock(state);
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
