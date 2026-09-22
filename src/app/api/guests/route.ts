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
import {
  applyGuestCookies,
  guestSessionCookieIfChanged,
} from "@/lib/guest/session-cookie";
import { clientIp } from "@/lib/security/unlock-rate-limit";
import { createClient } from "@/lib/supabase/server";
import { containsProfanity } from "@/lib/validation/profanity";
import {
  joinSchema,
  parseGuestDisplayName,
  parseGuestEmail,
} from "@/lib/validation/upload";

// POST joins a guest to an event via the create_guest RPC (validated by the
// event's qr_token) and returns an opaque session_token — the guest's capability
// for subsequent uploads (database-security.md).
//
// ★ THE IDENTITY RESHAPE (Will, 2026-09-21): every join now carries an identity, and which one is
// the host's switch. `require_verified_email` ON: nothing but a CONFIRMED session passes. OFF: the
// guest types a display name at the door and joins unverified under it. The DB deliberately still
// accepts a NAMELESS mint (wave 0 kept production alive through the deploy window), so the name
// requirement is THIS ROUTE'S 422 and nothing else's.
//
// ★ AND THE OPTIONAL ADDRESS UNDER IT (the guest identity round, Will 2026-09-22): on a names-mode
// door the guest may also type an email. It is stored UNPROVED in `guests.pending_email` and is
// inert by construction — never shown to the host or another guest, never attributed to an account,
// NEVER MAILED, never expiring; his words, "a name with an invisible claim number (the email)". A
// confirmed address later claims those rows from the dashboard. The response says WHETHER one was
// stored and never WHAT: echoing a stranger's address back would put it on a wire it has no reason
// to ride.
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

  // create_guest is service-role-only (H3); derive the TRUSTED identity here from the verified session
  // (or null for a name-only guest). The RPC re-reads the email AND its confirmation from auth.users
  // for this id, so the client can never supply either.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ★ VERIFIED MEANS A CONFIRMED EMAIL, NEVER "HAS A USER ID" (wave 0's finding). An unconfirmed
  // sign-up carries a perfectly good `user.id` and would sail through a `user !== null` test while
  // having proved nothing at all — which is the exact hole this whole reshape closes.
  const isVerifiedSession = Boolean(user?.email_confirmed_at);

  // The identity, decided before the mint so the refusal can say which one was missing. A verified
  // session needs no name (their profile display_name IS the identity, and create_guest nulls a
  // typed one beside it), so only an unverified joiner is asked.
  let displayName: string | null = null;
  let pendingEmail: string | null = null;
  if (!isVerifiedSession) {
    if (event.require_verified_email) {
      // The switch is ON and nothing was proved. The RPC refuses this too (the belt), but answering
      // here is what lets the door offer the sign-in instead of a dead end.
      return NextResponse.json(
        {
          ok: false,
          code: "verification_required",
          message: "Confirm your email to join this event.",
        },
        { status: 422 },
      );
    }
    const name = parseGuestDisplayName(parsed.data.display_name);
    if (!name.ok) {
      return NextResponse.json(
        { ok: false, code: name.code, message: name.message },
        { status: 422 },
      );
    }
    // Profanity is checked HERE, server-side, exactly as updateDisplayNameAction checks a profile
    // name: the obscenity matcher must never ship to a browser, so no client gate and no SQL CHECK
    // can own this. Policy, not a security boundary (validation/profanity.ts).
    if (containsProfanity(name.name)) {
      return NextResponse.json(
        {
          ok: false,
          code: "name_invalid",
          message: "That name isn't available.",
        },
        { status: 422 },
      );
    }
    displayName = name.name;

    // The optional field, parsed only when something was actually typed. A missing key and a blank
    // one are the SAME thing here — a guest who skipped it — and neither is an error; only a typed
    // address that is not an address is refused, so the door can put the sentence under the field
    // instead of failing the whole join. A VERIFIED session never reaches this branch at all, and
    // the RPC nulls the field beside a confirmed account anyway (belt and braces, one identity per
    // row).
    const rawEmail = parsed.data.email;
    if (typeof rawEmail === "string" && rawEmail.trim() !== "") {
      const email = parseGuestEmail(rawEmail);
      if (!email.ok) {
        return NextResponse.json(
          { ok: false, code: email.code, message: email.message },
          { status: 422 },
        );
      }
      pendingEmail = email.email;
    }
  }

  const result = await createGuest({
    qrToken: qr_token,
    userId: user?.id ?? null,
    unlockProven,
    displayName,
    pendingEmail,
  });

  if (!result.ok) {
    const status =
      result.code === "not_found"
        ? 404
        : result.code === "verification_required" ||
            result.code === "name_invalid" ||
            result.code === "email_invalid"
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

  // Return only what the client needs to upload — guest_id stays internal. `display_name`,
  // `verified` and `email_attached` come back from the mint itself (never echoed from the request),
  // so the door renders the identity the DATABASE settled on: a verified joiner gets null + true +
  // false even if they sent both, because create_guest nulls a typed name AND a typed address
  // beside a confirmed account.
  const response = NextResponse.json({
    ok: true,
    session_token: result.data.session_token,
    event_id: result.data.event_id,
    display_name: result.data.display_name,
    verified: result.data.verified,
    // ★ WHETHER, NEVER WHAT. The address never appears in a response body.
    email_attached: result.data.emailAttached,
  });
  /* ★ THE SESSION ALSO GOES ON A COOKIE (the door as three steps, 2026-09-21). Require an upload
     to view is resolved SERVER-SIDE, in the RSC and the poll, and neither can read the localStorage
     copy the browser is about to make. `pr_guest_<eventId>` is that same token, HttpOnly, so the
     next render knows which guest is asking. It is a READ capability only: every write route still
     takes its token from the BODY (pinned by body-token-source.test.ts), so the CSRF surface does
     not move. Skipped when the request already carried this exact token. */
  applyGuestCookies(response, [
    await guestSessionCookieIfChanged(
      result.data.event_id,
      result.data.session_token,
    ),
  ]);
  return response;
}
