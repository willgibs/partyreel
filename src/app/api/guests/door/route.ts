import { NextResponse } from "next/server";

import { checkInAtDoor } from "@/lib/db/queries/event-doors";
import { getEventByQrToken } from "@/lib/db/queries/guest-events";
import { decideDoor } from "@/lib/event/door/decide";
import { doorCallerFor } from "@/lib/events/closed-door.server";
import { doorCheckInSchema } from "@/lib/validation/upload";

/** Never cached: the answer is this person's, at this moment. */
const NO_STORE = { "Cache-Control": "private, no-store" };

/**
 * THE HELD DOOR'S CHECK-IN (the doors, event-settings r1, `waiting=held`), about every 30 s while the
 * door is open and again the moment its tab comes back into view. It answers one word:
 *   - `waiting`  the host has not answered yet;
 *   - `in`       she is let in: the door plays "You're in" and opens onto the album;
 *   - `moved`    anything else changed about the door (it closed, she was turned away, the link is
 *                gone, a password now stands first), which the page answers with a plain refresh
 *                onto whatever the server now says, with no beat.
 *
 * ★ IT ASKS THE PAGE'S OWN QUESTION, SO THE TWO NEVER DISAGREE: the account, this browser's cookie and
 * the ticket the door holds, through the same standing (`event_door_check_in`, which is
 * `event_door_standing` plus a stamp on her waiting rows, so a later let-in mail can tell whether she is
 * still at the door; no mail sends from here). `in` is said only where the page, refreshed, opens the
 * album itself: a door that lets her through without having let her in (a password now) is `moved`.
 *
 * It reveals nothing a caller could not learn by loading the page: the standing is the caller's own.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "bad_request" },
      { status: 400, headers: NO_STORE },
    );
  }
  const parsed = doorCheckInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "bad_request" },
      { status: 400, headers: NO_STORE },
    );
  }
  const { qr_token, session_token } = parsed.data;

  const found = await getEventByQrToken(qr_token);
  // A link that names no live album any more: the refresh lands on its 404.
  if (!found.ok) {
    return NextResponse.json(
      { ok: true, standing: "moved" },
      { headers: NO_STORE },
    );
  }

  const caller = await doorCallerFor(found.data.id, {
    bodyTokens: [session_token],
  });
  const standing = await checkInAtDoor(found.data.id, caller);

  const decision = decideDoor(standing);
  const answer =
    decision.kind === "waiting"
      ? "waiting"
      : decision.kind === "through" && decision.admitted
        ? "in"
        : "moved";
  return NextResponse.json(
    { ok: true, standing: answer },
    { headers: NO_STORE },
  );
}
