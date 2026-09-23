import { NextResponse } from "next/server";

import { captureWarning } from "@/lib/observability/sentry";
import {
  abuseHashes,
  checkAbuseRate,
  recordAbuseEvent,
} from "@/lib/security/abuse-rate-limit-store";
import { clientIp } from "@/lib/security/unlock-rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Newsletter opt-in capture (H3 server-mediation). capture_guest_email is service-role-only now, so this
// route is the only caller. The email is derived from the VERIFIED session here (getUser), NEVER from the
// client body, which closes the victim-email poisoning surface. The guest session_token (capability) ties
// the opt-in to the guest row. Signed-in-only by design: the opt-in is a switch inside the post-upload
// offer card's confirm door (save-account-prompt.tsx), posted only once that door has confirmed an email.
//
// ★ THE CRACK THIS CLOSES (the guest identity round, 2026-09-22). `capture_guest_email` writes into
// `guests.email`, the column whose single invariant is "CONFIRMED, the row's own account's address":
// the forensic row and the uploader resolver read it as proof, and the host's credit prints it beside
// a verified guest's name. A session with `user.email` set and `email_confirmed_at` NULL is an
// UNCONFIRMED sign-up: a perfectly real user id, an address nobody has proved, and until this gate it
// could walk an unproved address straight into the proved column through this route.
// `email_confirmed_at` is the ONLY thing that means verified anywhere in this reshape, so it is the
// test here too. The function holds the same line on its own side (the guests grant tidy,
// 20260922213000): it writes only on a row whose own account is the confirmed owner of the address,
// so on a shared phone, where the token names whoever joined last, this session's address can no
// longer land on that person's row. An unproved address has its own home now (`guests.pending_email`,
// set through /api/guests/email) and reaches `guests.email` only by a claim that proves it.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !user.email_confirmed_at) {
    return NextResponse.json(
      { ok: false, code: "unauthorized" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "bad_request" },
      { status: 400 },
    );
  }
  const sessionToken =
    body && typeof body === "object" && "session_token" in body
      ? (body as { session_token: unknown }).session_token
      : null;
  const newsletterOptIn =
    body && typeof body === "object" && "newsletter_opt_in" in body
      ? Boolean((body as { newsletter_opt_in: unknown }).newsletter_opt_in)
      : false;
  if (typeof sessionToken !== "string" || sessionToken.length === 0) {
    return NextResponse.json(
      { ok: false, code: "bad_request" },
      { status: 400 },
    );
  }

  // Abuse limiter: a light per-IP cap (already gated by a verified session, so abuse is bounded by account
  // creation). Fail OPEN. The scope is a constant ("") → the per-scope count IS the per-IP count.
  let captureKeys: { ipHash: string; scopeHash: string } | null = null;
  try {
    captureKeys = abuseHashes(clientIp(request.headers), "capture", "");
    const gate = await checkAbuseRate(
      "capture",
      captureKeys.ipHash,
      captureKeys.scopeHash,
    );
    if (!gate.allowed) {
      return NextResponse.json(
        { ok: false, code: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(gate.retryAfterSec) } },
      );
    }
  } catch {
    captureWarning("security", "abuse_limiter_unavailable_fail_open", {
      kind: "capture",
    });
    captureKeys = null;
  }

  // Email comes from the verified session, not the client. Best-effort: a newsletter write must never
  // surface an error to the user (the caller swallows it), so we 200 even on a DB error.
  const admin = createAdminClient();
  const { error } = await admin.rpc("capture_guest_email", {
    p_session_token: sessionToken,
    p_email: user.email,
    p_newsletter_opt_in: newsletterOptIn,
  });
  if (error) {
    return NextResponse.json({ ok: false, code: "failed" }, { status: 200 });
  }
  if (captureKeys) {
    await recordAbuseEvent(
      "capture",
      captureKeys.ipHash,
      captureKeys.scopeHash,
    ).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
