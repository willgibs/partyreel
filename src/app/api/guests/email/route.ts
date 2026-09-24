/**
 * ATTACHING, CHANGING OR DETACHING THE UNPROVED ADDRESS. Body:
 * `{ qr_token, session_token, email | null }` → `{ ok: true, email_attached }`.
 *
 * The second door to a guest's address (three identities: name only, unconfirmed email, verified
 * account). The first is the join, which takes the OPTIONAL address a guest types under their name;
 * this one covers everyone the join could not: a guest who skipped the field and wants back in, one
 * who typed it wrong, one whose row was minted before the field existed, and one who wants the
 * address gone. `set_guest_pending_email` is service-role-only like every other guest WRITE
 * (database-security.md), so this route is not a wrapper over a public RPC — it IS the gate.
 *
 * ★ WHAT THE ADDRESS IS: an invisible claim number on the guest's name. It is
 *   stored UNPROVED in `guests.pending_email`, inert by construction — never shown to the host or
 *   another guest, never attributed to any account, NEVER MAILED ON ITS OWN, never expiring. That
 *   last property is what makes accepting a stranger's address safe: there is no message to send, so
 *   there is no victim to reach. A confirmed account later CLAIMS the rows typed under its own
 *   address, from a card on the dashboard, and only that claim moves it into `guests.email`.
 *
 * ★ WHETHER, NEVER WHAT. The response says `email_attached: boolean` and never the address. The join
 *   answers the same way, for the same reason: a host's own browser calls these routes, and an
 *   unproved stranger's address has no business riding a body a host can read.
 *
 * ★ THE TOKEN COMES FROM THE BODY, NEVER THE COOKIE. `pr_guest_<eventId>` is a READ capability the
 *   RSC and the poll use to know who is asking; a WRITE route that accepted it as identity would be
 *   CSRF-able by any page that can make the browser POST. This route reads the body and only the
 *   body (pinned in route.test.ts beside the door's own `session-cookie.test.ts` list), so the CSRF
 *   surface does not move. It still WRITES the cookie on the way out — the heal, exactly as the name
 *   route does, for a guest whose row predates it.
 *
 * ★ A SESSION CAN ONLY EVER SET ITS OWN. The RPC looks the row up BY the posted session token, so a
 *   mismatched `qr_token` cannot reach another event's guest; the token scopes the limiter and the
 *   visibility gate, nothing more. A VERIFIED guest is refused outright (403): their address is
 *   their account's, and a row carrying two could disagree with itself. And an account's row takes
 *   an address only from that signed-in account
 *   (lib/guest/session-owner.ts): 403 `session_other_account` for anyone else holding its ticket,
 *   which the add-email dialog reads by name and answers by putting the ticket down.
 *
 * ★ THE LIMITER (`attach_email`, abuse-rate-limit.ts) carries the rename's numbers for the rename's
 *   reasoning — venue-shaped, breadth doing the real work. Fails OPEN like every other guest route:
 *   the session token is the real gate.
 */
import { NextResponse } from "next/server";

import { setGuestPendingEmail } from "@/lib/db/mutations/guest";
import { getEventByQrToken } from "@/lib/db/queries/guest-events";
import {
  applyGuestCookies,
  guestSessionCookieIfChanged,
} from "@/lib/guest/session-cookie";
import { checkSessionOwner } from "@/lib/guest/session-owner.server";
import { captureWarning } from "@/lib/observability/sentry";
import {
  abuseHashes,
  checkAbuseRate,
  recordAbuseEvent,
} from "@/lib/security/abuse-rate-limit-store";
import { clientIp } from "@/lib/security/unlock-rate-limit";
import { attachEmailSchema, parseGuestEmail } from "@/lib/validation/upload";

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

  const parsed = attachEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "bad_request", message: "Invalid request." },
      { status: 400 },
    );
  }
  const { qr_token, session_token } = parsed.data;

  let keys: { ipHash: string; scopeHash: string } | null = null;
  try {
    keys = abuseHashes(clientIp(request.headers), "attach_email", qr_token);
    const gate = await checkAbuseRate(
      "attach_email",
      keys.ipHash,
      keys.scopeHash,
    );
    if (!gate.allowed) {
      return NextResponse.json(
        {
          ok: false,
          code: "rate_limited",
          message: "Too many changes right now. Try again in a bit.",
        },
        { status: 429, headers: { "Retry-After": String(gate.retryAfterSec) } },
      );
    }
  } catch {
    captureWarning("security", "abuse_limiter_unavailable_fail_open", {
      kind: "attach_email",
    });
    keys = null;
  }

  // The write path inherits the read gate, exactly as the name door does: a `private` event
  // master-locks everyone, so nobody has a legitimate reason to be editing a guest row on one, and a
  // dead link answers 404. A `password` event is NOT re-gated — the address is not the album, the
  // caller already holds a token minted past that lock, and a guest fixing a typo from a re-opened
  // tab must not be sent to find the password again.
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

  // null IS THE DETACH, and so is a blank string: "clear it" and "set it to nothing" are one intent,
  // and neither is an error. Only a typed value that is not an address is refused, so the field can
  // render the sentence under itself.
  const raw = parsed.data.email;
  let email: string | null = null;
  if (typeof raw === "string" && raw.trim() !== "") {
    const checked = parseGuestEmail(raw);
    if (!checked.ok) {
      return NextResponse.json(
        { ok: false, code: checked.code, message: checked.message },
        { status: 422 },
      );
    }
    email = checked.email;
  }

  // Whose ticket is this (see the head comment): after the parse, so a typo is still answered under
  // the field, and before the write, so a row that is not this caller's is never touched.
  const owner = await checkSessionOwner(session_token);
  if (!owner.ok) {
    return NextResponse.json(
      { ok: false, code: owner.code, message: owner.message },
      { status: 403, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const result = await setGuestPendingEmail({
    sessionToken: session_token,
    email,
  });

  if (!result.ok) {
    const status =
      result.code === "invalid_session"
        ? 401
        : result.code === "unauthorized"
          ? 403
          : result.code === "email_invalid"
            ? 422
            : 500;
    return NextResponse.json(
      { ok: false, code: result.code, message: result.message },
      { status },
    );
  }

  if (keys) {
    await recordAbuseEvent("attach_email", keys.ipHash, keys.scopeHash).catch(
      () => {},
    );
  }

  // Never cacheable: the answer belongs to one session token.
  const response = NextResponse.json(
    { ok: true, email_attached: result.data.email_attached },
    { headers: { "Cache-Control": "private, no-store" } },
  );
  /* The cookie heals here too, exactly as on the name door: a guest whose row was minted before the
     cookie existed holds a token in localStorage and nothing the server can read, and the RPC has
     just proved this token resolves to a live row of this event's, so nothing unverified is written.
     Skipped when the request already carried it. */
  applyGuestCookies(response, [
    await guestSessionCookieIfChanged(eventResult.data.id, session_token),
  ]);
  return response;
}
