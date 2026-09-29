/**
 * THE DOOR, ON THE SERVER: who this request is at an event's door, and the event as the door lets
 * them meet it (event-settings r1; the one closed door of event-safety r1, grown into every door).
 *
 * Every guest path asks this, on every request: the page and its metadata, the join, the ask, the
 * waiting door's check-in, the unlock, the album's reads, the export, and the write routes. One read
 * answers it (`event_door_standing`: the account, every device, and the tickets the request carries,
 * one browser each; never a device id or an IP), and one pure function decides (`decideDoor`):
 *   - shut      the one shut screen, and in every route the private album's own answer;
 *   - waiting   the held door, which opens by itself when the host lets her in;
 *   - ask       an address the invite list does not name: ask the host, or use a different email;
 *   - newcomer  a gate the host answers or a list keeps: the door's own steps, nothing real behind;
 *   - through   on to the album and its own gates.
 *
 * ★ A PRIVATE ALBUM, A CLOSED DOOR, A DECLINE AND A BLOCK COST ONE READ AND ANSWER THE SAME. The
 * standing is asked whatever the album's door, whenever the request carries an account, a ticket, or an
 * album the anon read answers as private (Only me, every gate, and an account a block holds), so none
 * of them can be told apart by the work it takes; a request with none of those (a signed-out stranger
 * at an open or password album) costs nothing, as before.
 *
 * ★ THE EVENT AS THE DOOR SHOWS IT. The anon read (`get_event_by_qr_token`) answers a gated album as a
 * private one, which is right for anyone the door shuts. Past that, this module re-reads what the door
 * shows (`readDoorEventDetails`): someone standing at a door sees the album's name and its host (the
 * welcome, "Maya will let you in", "Ask Maya"); someone it let in sees what an unlocked password album
 * shows. And to her alone it issues the door's pass (`lib/event/door/pass.server.ts`), which the
 * album's own server reads ask for before they read a gated album's contents, or a password album's
 * without its unlock cookie.
 */
import "server-only";

import { cache } from "react";

import {
  getEventByQrToken,
  type GuestEvent,
} from "@/lib/db/queries/guest-events";
import {
  readDoorEventDetails,
  readDoorStanding,
  type DoorCaller,
} from "@/lib/db/queries/event-doors";
import {
  decideDoor,
  type DoorDecision,
  type DoorStanding,
} from "@/lib/event/door/decide";
import { issueDoorPass } from "@/lib/event/door/pass.server";
import {
  isSessionTokenShape,
  readGuestSessionCookie,
} from "@/lib/guest/session-cookie";
import { getRequestAuth } from "@/lib/supabase/request-auth";

export type { DoorCaller };

/** One request at one door. */
export type GuestDoor = {
  decision: DoorDecision;
  standing: DoorStanding;
  /** The event as this request meets it: its door, what the door shows of it, and its pass. */
  event: GuestEvent;
};

/** Whether the door shuts this request out: the private album's own answer, in every route. */
export function isShut(door: GuestDoor): boolean {
  return door.decision.kind === "shut";
}

/**
 * Whether the door lets this request on to the album: every write route's question. A door that holds
 * her (the held door, the ask, a gate's newcomer) has nothing of hers to write to yet, so a write
 * route answers it as it answers the shut door, in the private album's words.
 */
export function isThrough(door: GuestDoor): boolean {
  return door.decision.kind === "through";
}

/**
 * Who is asking, from the request itself: the `getUser()` account (unless `account: false`) and the
 * tickets it carries, shape-checked. `cookie` reads this browser's `pr_guest_<eventId>` ticket, a READ
 * capability: ★ A WRITE ROUTE NEVER ASKS FOR IT (the name, email, mine and remove routes pass their
 * body's ticket alone, `lib/guest/session-cookie.ts`), so the CSRF surface does not move.
 */
export async function doorCallerFor(
  eventId: string,
  opts: {
    bodyTokens?: readonly unknown[];
    cookie?: boolean;
    account?: boolean;
  } = {},
): Promise<DoorCaller> {
  const { bodyTokens = [], cookie = true, account = true } = opts;
  const [cookieToken, auth] = await Promise.all([
    cookie ? readGuestSessionCookie(eventId) : Promise.resolve(null),
    account ? getRequestAuth() : Promise.resolve(null),
  ]);
  const tickets = [...bodyTokens, cookieToken].filter(isSessionTokenShape);
  return {
    userId: auth?.user?.id ?? null,
    tickets: [...new Set(tickets)],
  };
}

/** A stranger at a door the link opens, which needs no read: nobody is let in, blocked or waiting. */
function linkStanding(event: GuestEvent): DoorStanding {
  return {
    found: true,
    door: event.visibility === "password" ? "password" : "open",
    host: false,
    blocked: false,
    wasIn: false,
    in: false,
    waiting: false,
    listed: false,
    confirmed: false,
  };
}

/**
 * WHO THIS REQUEST IS AT THIS DOOR, and the event as it meets it. `event` is the album's own read
 * (`getEventByQrToken`) for this request.
 */
export async function resolveGuestDoor(
  event: GuestEvent,
  caller: DoorCaller,
): Promise<GuestDoor> {
  // A signed-out stranger with no ticket at an album the link opens (or its password protects) needs
  // no read: nothing the standing could say would change what the link shows her.
  const strangerAtTheLink =
    caller.userId === null &&
    caller.tickets.length === 0 &&
    event.visibility !== "private";
  const standing = strangerAtTheLink
    ? linkStanding(event)
    : await readDoorStanding(event.id, event.visibility, caller);
  const decision = decideDoor(standing);
  return {
    decision,
    standing,
    event: await eventAtDoor(event, decision, standing),
  };
}

/**
 * What the door shows of the event. ★ ONLY WHAT THE DOOR ALREADY SHOWS: shut shows nothing (the page is
 * the shut screen); a door a person stands at shows the album's name and its host; someone the door let
 * in sees what an unlocked password album shows, and carries the pass. A stranger it lets on to an open
 * album or a password step is the album's own to answer, with no pass. An open album and the host need
 * no re-read (the anon read never redacted them).
 */
async function eventAtDoor(
  event: GuestEvent,
  decision: DoorDecision,
  standing: DoorStanding,
): Promise<GuestEvent> {
  const door = standing.door;
  if (decision.kind === "shut") return { ...event, door, doorPass: null };

  const through = decision.kind === "through";
  // ★ THE PASS IS FOR SOMEONE THE DOOR LET IN (the host, a guest already in, an address the list
  // names), never for a stranger it merely lets on to a password: the password album's own reads take
  // a pass in place of the unlock cookie, so a pass issued at the password step would open the album
  // without its password to any read that trusts it.
  const passes = through && decision.admitted;
  const met: GuestEvent = {
    ...event,
    door,
    doorPass: passes ? issueDoorPass(event.id) : null,
  };

  // The anon read redacted a gated album's name and metadata (it is stored private), and a password
  // album's metadata; re-read what this door shows, but only where it redacted something.
  const redacted =
    door !== "open" &&
    !standing.host &&
    (event.name === "" ||
      (event.description === null &&
        event.event_date === null &&
        event.host_display_name === null));
  if (!redacted) return met;
  // A password album's newcomer is the password step's, which reveals the name alone (its own
  // redaction, and the unlock cookie's re-read inside `getEventByQrToken`).
  if (door === "password" && !(through && decision.admitted)) return met;

  const details = await readDoorEventDetails(event.id);
  if (!details) return met;
  if (!through) {
    // Standing at the door: the album's name and its host, and nothing the album itself holds.
    return {
      ...met,
      name: details.name,
      host_display_name: details.hostDisplayName,
    };
  }
  return {
    ...met,
    name: details.name,
    description: details.description,
    event_date: details.eventDate,
    custom_slug: details.customSlug,
    host_display_name: details.hostDisplayName,
  };
}

/**
 * THE PAGE'S DOOR, one answer per render: `generateMetadata` and the page ask it with the same token,
 * so React's request cache runs the album's read, the standing and the re-read once for both. Null for
 * a link that names no live event.
 */
export const pageDoor = cache(async function pageDoor(
  token: string,
): Promise<GuestDoor | null> {
  const result = await getEventByQrToken(token);
  if (!result.ok) return null;
  const caller = await doorCallerFor(result.data.id);
  return resolveGuestDoor(result.data, caller);
});
