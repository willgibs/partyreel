/**
 * WHO THIS REQUEST IS AT THIS DOOR, AND WHAT THAT MEANS (event-settings r1, Will 2026-09-29).
 *
 * The server answers one standing per request (`event_door_standing`: keyed on the account, every
 * device, and the tickets this request holds, one browser each; never a device id or an IP), and this
 * pure function turns it into the one decision the page, its metadata and every guest route act on.
 *
 * ★ ONE RULE FOR EVERYONE ALREADY IN: a gate stops newcomers; only Only me and a block shut out someone
 * already in. So "in" passes the password and every gate, and only `private` and `blocked` can shut a
 * person who was in, who then reads the previous guest's line (locked-door r1 `previous=private`: the
 * host made it private, as her dashboard card already says; a blocked person reads the same, so the
 * block stays invisible).
 *
 * ★ EVERY NEWCOMER TURNED AWAY MEETS ONE SHUT SCREEN (event-safety r1 `newcomer=same`): an Only me
 * album, a closed door, a decline (which is a block) and a block alike, so none can be told apart.
 * An address not on the invite list is the one newcomer who meets a door of her own (`unlisted=ask`):
 * Ask the host to let me in, or use a different email.
 *
 * Pure: no client or server imports, so the table below is unit-tested whole.
 */
import { isDoor, type Door } from "@/lib/event/door/door";

/** The server's answer (`event_door_standing`), as this module reads it. */
export type DoorStanding = {
  /** The event exists and is live. */
  found: boolean;
  door: Door;
  /** The caller hosts it: the one person every door lets in. */
  host: boolean;
  /** A block holds the account, the address it confirmed, or a ticket's row. */
  blocked: boolean;
  /** A row of theirs is past the door, blocked or not: the previous guest's line. */
  wasIn: boolean;
  /** Past the door and not blocked. */
  in: boolean;
  /** Asked, and the host has not answered. */
  waiting: boolean;
  /** An invite list names the account's confirmed address. */
  listed: boolean;
  /** The account's address is confirmed. */
  confirmed: boolean;
};

export type DoorDecision =
  /** The one shut screen; `previous` adds the previous guest's line. */
  | { kind: "shut"; previous: boolean }
  /** The held door: the host will let her in, and it opens by itself when she does. */
  | { kind: "waiting" }
  /**
   * A confirmed newcomer who can ask to be let in: at letting each person in, one tap asks; at an
   * invite list that does not name her address, she asks, or uses a different email (`unlisted=ask`).
   */
  | { kind: "ask"; gate: "approve" | "invite" }
  /**
   * A newcomer with no confirmed email yet, at a gate the host answers or a list keeps: the door's own
   * steps (the welcome, the email), with nothing real behind it; confirming asks at letting each person
   * in, and at an invite list lets in an address it names.
   */
  | { kind: "newcomer"; gate: "approve" | "invite" }
  /**
   * On to the album and its own gates (the password, the email step, a photo first). `admitted` is the
   * door's word that this request is already past it: it passes the password without the password, and
   * reads a gated album's contents.
   */
  | { kind: "through"; admitted: boolean };

/** The decision for one standing. */
export function decideDoor(standing: DoorStanding): DoorDecision {
  if (standing.host) return { kind: "through", admitted: true };
  if (standing.blocked) return { kind: "shut", previous: standing.wasIn };
  switch (standing.door) {
    case "private":
      return { kind: "shut", previous: standing.wasIn };
    case "open":
    case "password":
      return { kind: "through", admitted: standing.in };
    case "closed":
      return standing.in
        ? { kind: "through", admitted: true }
        : { kind: "shut", previous: false };
    case "approve":
      if (standing.in) return { kind: "through", admitted: true };
      if (standing.waiting) return { kind: "waiting" };
      if (standing.confirmed) return { kind: "ask", gate: "approve" };
      return { kind: "newcomer", gate: "approve" };
    case "invite":
      // The list is the host's own yes: an address it names comes straight in, whatever it asked before.
      if (standing.in || standing.listed) return { kind: "through", admitted: true };
      if (standing.waiting) return { kind: "waiting" };
      if (standing.confirmed) return { kind: "ask", gate: "invite" };
      return { kind: "newcomer", gate: "invite" };
  }
}

/** Whether a decision lets this request read the album's contents at all. */
export function readsAlbum(decision: DoorDecision): boolean {
  return decision.kind === "through";
}

/**
 * Whether a decision shows the event's name and its host (the welcome, the held door, the ask door):
 * every door a person stands at, never the shut screen.
 */
export function showsTheEvent(decision: DoorDecision): boolean {
  return decision.kind !== "shut";
}

/**
 * The standing as the server's jsonb carries it, read defensively: anything missing or malformed reads
 * as a stranger at a private album (the closed side), never as someone let in.
 */
export function readStanding(raw: unknown): DoorStanding {
  const v = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const flag = (key: string) => v[key] === true;
  return {
    found: flag("found"),
    door: isDoor(v.door) ? v.door : "private",
    host: flag("host"),
    blocked: flag("blocked"),
    wasIn: flag("was_in"),
    in: flag("in"),
    waiting: flag("waiting"),
    listed: flag("listed"),
    confirmed: flag("confirmed"),
  };
}
