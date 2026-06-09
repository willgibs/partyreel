import { NextResponse } from "next/server";

import { createGuest } from "@/lib/db/mutations/guest";
import { captureWarning } from "@/lib/observability/sentry";
import {
  abuseHashes,
  checkAbuseRate,
  recordAbuseEvent,
} from "@/lib/security/abuse-rate-limit-store";
import { clientIp } from "@/lib/security/unlock-rate-limit";
import { createClient } from "@/lib/supabase/server";
import { joinSchema } from "@/lib/validation/upload";

// POST joins a guest to an event via the create_guest RPC (validated by the
// event's qr_token) and returns an opaque session_token — the guest's capability
// for subsequent uploads (ADR-0004). No account, no JWT.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "bad_request", message: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "bad_request", message: "Invalid join request." },
      { status: 400 },
    );
  }

  const { qr_token } = parsed.data;

  // Abuse limiter (venue-safe): a scraper joining many DISTINCT events from one IP trips the breadth signal;
  // a venue crowd (ONE event from one NAT IP) never does. Fail OPEN on a limiter error — the qr_token
  // capability is the real gate.
  let joinKeys: { ipHash: string; scopeHash: string } | null = null;
  try {
    joinKeys = abuseHashes(clientIp(request.headers), "join", qr_token);
    const gate = await checkAbuseRate(
      "join",
      joinKeys.ipHash,
      joinKeys.scopeHash,
    );
    if (!gate.allowed) {
      return NextResponse.json(
        {
          ok: false,
          code: "rate_limited",
          message:
            "Too many joins from this network right now. Please try again in a bit.",
        },
        { status: 429, headers: { "Retry-After": String(gate.retryAfterSec) } },
      );
    }
  } catch {
    captureWarning("security", "abuse_limiter_unavailable_fail_open", {
      kind: "join",
    });
    joinKeys = null;
  }

  // create_guest is service-role-only (H3); derive the TRUSTED user id here from the verified session (or
  // null for an anonymous guest). The RPC reads the verified email from auth.users for this id, so the
  // client can't supply an identity or email.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await createGuest({
    qrToken: qr_token,
    userId: user?.id ?? null,
  });

  if (!result.ok) {
    const status =
      result.code === "not_found"
        ? 404
        : result.code === "email_required"
          ? 422
          : 500;
    return NextResponse.json(
      { ok: false, code: result.code, message: result.message },
      { status },
    );
  }

  // Record the successful join for the breadth signal (best-effort).
  if (joinKeys) {
    await recordAbuseEvent("join", joinKeys.ipHash, joinKeys.scopeHash).catch(
      () => {},
    );
  }

  // Return only what the client needs to upload — guest_id stays internal.
  return NextResponse.json({
    ok: true,
    session_token: result.data.session_token,
    event_id: result.data.event_id,
  });
}
