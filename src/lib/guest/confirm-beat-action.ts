"use server";

/**
 * THE EVENTS WAITING UNDER HER EMAIL, COUNTED FOR THE MOMENT CARD (`identity-claims` r3, Will's
 * `pointer=line`). The card acknowledges, in its one line about other events
 * (`confirm-beat.ts`'s `otherEventsLine`), the events whose photos were added under her email and
 * wait in her dashboard's claims review. This is that count, and nothing else leaves: a number,
 * never a name, an event id or a key.
 *
 * ★ THE COUNT IS THE SERVER'S, FROM THE BANNER'S OWN READ. `getMyClaimableGuestRows` is the list the
 * dashboard's banner counts: it re-verifies the caller with `getUser()` (`getRequestAuth`) and rides
 * `list_guest_rows_by_email`, which keys on `auth.uid()` and lists nothing for a caller whose
 * address is unconfirmed, so no address, id or count here is the client's to supply. The one value
 * handed in is the album on screen (its canonical token), and it can only narrow her own count:
 * the album she is looking at is never one of the OTHER events, even when rows typed under her
 * email on another device wait there too (her dashboard holds those).
 *
 * ★ ONE READ IN THE COMMON CASE: an account with nothing waiting answers 0 before the album is
 * resolved at all. The list is read without its previews (a presign it never shows is work for
 * nothing), so its preview keys stay here unsigned and unsent.
 *
 * Any failure answers 0, since a line that cannot be counted is simply not said, and is captured
 * where failures are read. It writes nothing and revalidates nothing, so the album under the card
 * never re-renders for it.
 */
import { z } from "zod";

import { getMyClaimableGuestRows } from "@/lib/db/queries/claims";
import { getEventByQrToken } from "@/lib/db/queries/guest-events";
import { captureError } from "@/lib/observability/sentry";

// The album routes' own bound on a token (`/api/album/guest/*`).
const QR_TOKEN = z.string().min(1).max(200);

/** How many OTHER events wait under the signed-in caller's confirmed email; 0 on any doubt. */
export async function countWaitingEventsAction(
  qrToken: unknown,
): Promise<number> {
  const parsed = QR_TOKEN.safeParse(qrToken);
  if (!parsed.success) return 0;
  try {
    const waiting = await getMyClaimableGuestRows();
    if (waiting.length === 0) return 0;
    const here = await getEventByQrToken(parsed.data);
    // A token that names no album says nothing, rather than a count it cannot scope.
    if (!here.ok) return 0;
    return waiting.filter((event) => event.eventId !== here.data.id).length;
  } catch (error) {
    captureError("account", error, { seam: "moment_waiting" });
    return 0;
  }
}
