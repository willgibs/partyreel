import { NextResponse } from "next/server";

import { askToJoin, createGuest } from "@/lib/db/mutations/guest";
import { getEventByQrToken } from "@/lib/db/queries/guest-events";
import {
  doorCallerFor,
  isShut,
  resolveGuestDoor,
} from "@/lib/events/closed-door.server";
import { mayUploadPastLock } from "@/lib/events/upload-lock";
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
import { createClient } from "@/lib/supabase/server";
import { askToJoinSchema } from "@/lib/validation/upload";

/**
 * ASK THE HOST TO LET ME IN (the doors, event-settings r1): a confirmed newcomer at a door where the
 * host lets each guest in (the held door's `Ask to join`), or at an invite list that does not name her
 * address (the shut door's `Ask Maya to let me in`, `unlisted=ask`). It mints her a WAITING ticket,
 * with the cookie beside it exactly as a join's, and the page refreshes onto the held door.
 *
 * ★ THE ASKER IS HER CONFIRMED ACCOUNT, NEVER THE BODY: `getUser()`, and the RPCs read the confirmation
 * and the address from auth.users themselves. An unconfirmed session is sent to the email step (422).
 *
 * ★ THE DOOR DECIDES, NOT THE CLIENT'S IDEA OF IT. A door that shuts her out asks nothing, in the
 * private album's words (403: a block, a decline, a closed door and Only me alike). An invite list
 * mints through `ask_to_join` (an address it names comes straight in); every other door mints through
 * the join's own `create_guest`, which holds a newcomer where the host lets each guest in, and answers
 * a door that moved under her (Public now, a password) as the join would.
 *
 * Venue-safe, like the join: the ask draws on the join's own breadth budget (it mints a row, as a join
 * does), scoped to the album, and fails OPEN on a limiter error, since the confirmed account and the
 * door are the real gate.
 */
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
  const parsed = askToJoinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "bad_request", message: "Invalid ask." },
      { status: 400 },
    );
  }
  const { qr_token } = parsed.data;

  let keys: { ipHash: string; scopeHash: string } | null = null;
  try {
    keys = abuseHashes(clientIp(request.headers), "join", qr_token);
    const gate = await checkAbuseRate("join", keys.ipHash, keys.scopeHash);
    if (!gate.allowed) {
      return NextResponse.json(
        {
          ok: false,
          code: "rate_limited",
          message:
            "Too many requests from this network right now. Please try again in a bit.",
        },
        { status: 429, headers: { "Retry-After": String(gate.retryAfterSec) } },
      );
    }
  } catch {
    captureWarning("security", "abuse_limiter_unavailable_fail_open", {
      kind: "join",
      route: "ask",
    });
    keys = null;
  }

  const found = await getEventByQrToken(qr_token);
  if (!found.ok) {
    return NextResponse.json(
      {
        ok: false,
        code: "not_found",
        message: "This event link is no longer valid.",
      },
      { status: 404 },
    );
  }
  const event = found.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // ★ VERIFIED MEANS A CONFIRMED EMAIL, NEVER "HAS A USER ID" (the join's own rule).
  if (!user?.email_confirmed_at) {
    return NextResponse.json(
      {
        ok: false,
        code: "verification_required",
        message: "Confirm your email to ask the host.",
      },
      { status: 422 },
    );
  }

  const door = await resolveGuestDoor(event, await doorCallerFor(event.id));
  if (isShut(door)) {
    return NextResponse.json(
      { ok: false, code: "unauthorized", message: "This event is private." },
      { status: 403 },
    );
  }

  const admitted = door.decision.kind === "through" && door.decision.admitted;
  const result =
    door.standing.door === "invite"
      ? await askToJoin({ qrToken: qr_token, userId: user.id })
      : await createGuest({
          qrToken: qr_token,
          userId: user.id,
          // Someone already in passes the password without it; a stranger at a password door still
          // needs the unlock (the join's own proof).
          unlockProven:
            event.visibility === "password"
              ? admitted || (await mayUploadPastLock(event.id))
              : false,
          displayName: null,
          pendingEmail: null,
        });

  if (!result.ok) {
    const status =
      result.code === "not_found"
        ? 404
        : result.code === "verification_required"
          ? 422
          : result.code === "unlock_required" ||
              result.code === "unauthorized" ||
              result.code === "unlisted"
            ? 403
            : 500;
    return NextResponse.json(
      { ok: false, code: result.code, message: result.message },
      { status },
    );
  }

  if (keys) {
    await recordAbuseEvent("join", keys.ipHash, keys.scopeHash).catch(
      () => {},
    );
  }

  // The join's own answer, from the mint itself (never echoed from the request).
  const response = NextResponse.json({
    ok: true,
    session_token: result.data.session_token,
    event_id: result.data.event_id,
    display_name: result.data.display_name,
    verified: result.data.verified,
    email_attached: result.data.emailAttached,
    admission: result.data.admission,
  });
  // ★ THE TICKET GOES ON THE COOKIE TOO (the join's own rule): the held door's page and its check-in
  // read the account and this cookie, so the refresh lands on the held door on this device.
  applyGuestCookies(response, [
    await guestSessionCookieIfChanged(
      result.data.event_id,
      result.data.session_token,
    ),
  ]);
  return response;
}
