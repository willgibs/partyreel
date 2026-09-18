import { NextResponse } from "next/server";

import { createGuest } from "@/lib/db/mutations/guest";
import { getEventByQrToken } from "@/lib/db/queries/guest-events";
import { mayUploadPastLock } from "@/lib/events/upload-lock";
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
// for subsequent uploads (database-security.md). No account, no JWT.
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

  // QA #18 (host-app.md ruling 2): the write path inherits the read gate — resolve the event's
  // visibility BEFORE minting. `private` never mints (the /e/ page master-locks everyone, owner
  // included; a 403 leaks nothing the page didn't already show any link-holder). `password`
  // requires the unlock cookie or ownership (mayUploadPastLock — the owner reads the album
  // without unlocking, so they upload without it too). The RPC re-refuses both as the belt.
  const eventResult = await getEventByQrToken(qr_token);
  if (!eventResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        code: "not_found",
        message: "This event link is no longer valid.",
      },
      { status: 404 },
    );
  }
  const event = eventResult.data;
  if (event.visibility === "private") {
    return NextResponse.json(
      { ok: false, code: "unauthorized", message: "This event is private." },
      { status: 403 },
    );
  }
  let unlockProven = false;
  if (event.visibility === "password") {
    unlockProven = await mayUploadPastLock(event.id);
    if (!unlockProven) {
      return NextResponse.json(
        {
          ok: false,
          code: "unlock_required",
          message: "This event is locked. Enter the event password to upload.",
        },
        { status: 403 },
      );
    }
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
    unlockProven,
  });

  if (!result.ok) {
    const status =
      result.code === "not_found"
        ? 404
        : result.code === "email_required"
          ? 422
          : result.code === "unlock_required" || result.code === "unauthorized"
            ? 403
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
