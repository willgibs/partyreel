/**
 * NAMING A GUEST WHO ARRIVED WITHOUT A NAME, AND RENAMING ONE. Body:
 * `{ qr_token, session_token, display_name }` → `{ ok: true, display_name }`.
 *
 * The identity reshape's second door (Will, 2026-09-21). The first is the join, which takes the
 * name a guest types before their first upload; this one covers everyone the join could not: a
 * guest whose row was minted before the reshape, one minted by a client that sent no name, and one
 * who simply wants to be called something else. `set_guest_display_name` is service-role-only like
 * every other guest WRITE (ADR-0016), so this route is not a wrapper over a public RPC — it IS the
 * gate, and it owns two things the database cannot:
 *
 * ★ THE PROFANITY CHECK. The obscenity matcher must never ship to a browser, so it can live
 *   neither in a client form nor in a SQL CHECK. The route runs it, exactly as
 *   updateDisplayNameAction does for a profile name. `guests_display_name_len` is the hard backstop
 *   underneath, and the RPC re-refuses a blank and an over-long name.
 *
 * ★ THE LIMITER. Its own kind (`rename`, abuse-rate-limit.ts): tighter than `join`, still sized for
 *   a venue behind one NAT. Fails OPEN like every other guest route — the session token is the
 *   real gate.
 *
 * ★ A SESSION CAN ONLY EVER RENAME ITSELF. The RPC looks the row up BY the posted session token, so
 *   a mismatched `qr_token` cannot reach another event's guest; the token scopes the limiter and
 *   the visibility gate, nothing more. (Verified against the real database: posting another guest's
 *   `guest_id`, or a different event's `qr_token`, renames the caller's OWN row and nothing else.)
 *   The one thing a mismatched token buys is a limiter SCOPE the caller picked, which is why
 *   breadth is the guard that matters here: rotating tokens to dodge the per-(IP, event) backstop
 *   walks straight into the distinct-event ceiling instead. A VERIFIED guest is refused outright
 *   (403): their name is their profile's, and a row that carried two names could disagree with
 *   itself.
 *
 * ★ BOTH TOKENS TRAVEL IN THE BODY, never the URL (a capability in a query string ends up in a log,
 *   a referrer and somebody's history).
 */
import { NextResponse } from "next/server";

import { setGuestDisplayName } from "@/lib/db/mutations/guest";
import { getEventByQrToken } from "@/lib/db/queries/guest-events";
import {
  applyGuestCookies,
  guestSessionCookieIfChanged,
} from "@/lib/guest/session-cookie";
import { captureWarning } from "@/lib/observability/sentry";
import {
  abuseHashes,
  checkAbuseRate,
  recordAbuseEvent,
} from "@/lib/security/abuse-rate-limit-store";
import { clientIp } from "@/lib/security/unlock-rate-limit";
import { containsProfanity } from "@/lib/validation/profanity";
import {
  parseGuestDisplayName,
  renameGuestSchema,
} from "@/lib/validation/upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const parsed = renameGuestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "bad_request", message: "Invalid request." },
      { status: 400 },
    );
  }
  const { qr_token, session_token } = parsed.data;

  let keys: { ipHash: string; scopeHash: string } | null = null;
  try {
    keys = abuseHashes(clientIp(request.headers), "rename", qr_token);
    const gate = await checkAbuseRate("rename", keys.ipHash, keys.scopeHash);
    if (!gate.allowed) {
      return NextResponse.json(
        {
          ok: false,
          code: "rate_limited",
          message: "Too many name changes right now. Try again in a bit.",
        },
        { status: 429, headers: { "Retry-After": String(gate.retryAfterSec) } },
      );
    }
  } catch {
    captureWarning("security", "abuse_limiter_unavailable_fail_open", {
      kind: "rename",
    });
    keys = null;
  }

  // The write path inherits the read gate (QA #18), the same way the join does: a `private` event
  // master-locks everyone, so nobody has a legitimate reason to be renaming a guest row on one. A
  // dead link answers 404. A `password` event is NOT re-gated here — the name is not the album, the
  // caller already holds a session token minted past that lock, and a guest correcting their name
  // from a re-opened tab must not be told to go and find the password again.
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
  if (eventResult.data.visibility === "private") {
    return NextResponse.json(
      { ok: false, code: "unauthorized", message: "This event is private." },
      { status: 403 },
    );
  }

  const name = parseGuestDisplayName(parsed.data.display_name);
  if (!name.ok) {
    return NextResponse.json(
      { ok: false, code: name.code, message: name.message },
      { status: 422 },
    );
  }
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

  const result = await setGuestDisplayName({
    sessionToken: session_token,
    displayName: name.name,
  });

  if (!result.ok) {
    const status =
      result.code === "invalid_session"
        ? 401
        : result.code === "unauthorized"
          ? 403
          : result.code === "name_required" || result.code === "name_invalid"
            ? 422
            : 500;
    return NextResponse.json(
      { ok: false, code: result.code, message: result.message },
      { status },
    );
  }

  if (keys) {
    await recordAbuseEvent("rename", keys.ipHash, keys.scopeHash).catch(
      () => {},
    );
  }

  // Never cacheable: the answer belongs to one session token.
  const response = NextResponse.json(
    { ok: true, display_name: result.data.display_name },
    { headers: { "Cache-Control": "private, no-store" } },
  );
  /* ★ AND THE COOKIE HEALS HERE TOO (the door as three steps, 2026-09-21). A guest whose row was
     minted before this round holds a token in localStorage and no cookie; renaming is the first
     door many of them pass through, so it adopts the token the same way the join does. The RPC
     just proved the token resolves to a live row of this event's, so nothing unverified is
     written. Skipped when the request already carried it. */
  applyGuestCookies(response, [
    await guestSessionCookieIfChanged(eventResult.data.id, session_token),
  ]);
  return response;
}
