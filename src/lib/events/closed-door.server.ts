/**
 * THE ONE CLOSED DOOR (event-safety r1, Will's `door=private`: "reusing an existing lock screen to
 * lock out blocked users, without the 'blocked' experience feeling distinct ... Sneaky block").
 *
 * A private album and a person this event blocked meet the same door, the same answers and the same
 * work, so nobody can tell one from the other. Two halves make that true:
 *   - AN ACCOUNT (or the address it confirmed) the event blocked is answered in SQL:
 *     `get_event_by_qr_token` reads the event as PRIVATE to that caller, so every surface that
 *     resolves the event (`getEventByQrToken`) takes its private branch already, at no extra cost;
 *   - A TICKET (a typed name has no account, only the guest row its browser keeps: the
 *     `pr_guest_<eventId>` cookie, and a write's body token) is answered here, by
 *     `event_ticket_blocked`, whenever the request carries one.
 *
 * ★ ASKED WHETHER OR NOT THE ALBUM IS PRIVATE. The ticket check runs for every request that holds a
 * ticket, before the private branch and on a private album too, so a blocked ticket and a private
 * album cost the same work and answer in the same time; a request with no ticket costs nothing for
 * either. Every caller then branches on the one boolean exactly where it used to branch on
 * `visibility === "private"`, and answers what a private album answers there, word for word.
 */
import "server-only";

import { cache } from "react";

import { isTicketBlocked } from "@/lib/db/queries/event-blocks";
import type { GuestEvent } from "@/lib/db/queries/guest-events";
import {
  isSessionTokenShape,
  readGuestSessionCookie,
} from "@/lib/guest/session-cookie";

/** The event as the door needs it: its id, and its visibility as this caller sees it. */
type DoorEvent = Pick<GuestEvent, "id" | "visibility">;

/**
 * Is this album closed to this request? Private (which an account the event blocked already reads,
 * from SQL), or a ticket this request holds is one a block holds. `tickets` are raw values (a cookie,
 * a body field): only a real token shape is ever sent anywhere.
 */
export async function isClosedDoor(
  event: DoorEvent,
  tickets: readonly unknown[],
): Promise<boolean> {
  const tokens = [...new Set(tickets.filter(isSessionTokenShape))];
  const held =
    tokens.length > 0 ? await isTicketBlocked(event.id, tokens) : false;
  return event.visibility === "private" || held;
}

/**
 * The door for a READ, by this browser's own ticket for this event (the cookie): the page, its card,
 * the join, the unlock and the export. ★ A WRITE ROUTE NEVER ASKS THIS ONE: the name, email, mine and
 * remove routes ask `isClosedDoor` with their body's ticket alone, because the cookie is a read
 * capability that no write route reads (`lib/guest/session-cookie.ts`); the album's own read asks
 * with both copies (`album-viewer.server.ts`).
 */
export async function isClosedToThisBrowser(
  event: DoorEvent,
): Promise<boolean> {
  const cookie = await readGuestSessionCookie(event.id);
  return isClosedDoor(event, [cookie]);
}

/**
 * The page's door, one answer per render: `generateMetadata` and the page ask it with the same
 * primitives, so React's request cache runs the ticket check once for both.
 */
export const pageIsClosed = cache(
  (eventId: string, visibility: GuestEvent["visibility"]): Promise<boolean> =>
    isClosedToThisBrowser({ id: eventId, visibility }),
);
