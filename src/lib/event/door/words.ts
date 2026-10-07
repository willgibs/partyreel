/**
 * THE DOOR'S SMALL WORDS FOR THE HOST (event-settings r1): how long someone has waited, and how many
 * wait, said the same in the Guests room, the pulse and the bell.
 *
 * Pure (the caller passes `now`, since a clock read in render is impure), so the words are tested.
 */
import type { Door } from "@/lib/event/door/door";
import { formatCount } from "@/lib/format/count";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** When she asked, as the room says it: "just now", "5 minutes ago", "yesterday", "3 days ago". */
export function askedAgo(askedAt: string, now: number): string {
  const ms = now - new Date(askedAt).getTime();
  if (!Number.isFinite(ms) || ms < MINUTE) return "just now";
  if (ms < HOUR) {
    const m = Math.floor(ms / MINUTE);
    return `${m} ${m === 1 ? "minute" : "minutes"} ago`;
  }
  if (ms < DAY) {
    const h = Math.floor(ms / HOUR);
    return `${h} ${h === 1 ? "hour" : "hours"} ago`;
  }
  const d = Math.floor(ms / DAY);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

/** How many wait at the door, in one phrase: "1 person" / "3 people". */
export function peopleWaiting(n: number): string {
  return `${formatCount(n)} ${n === 1 ? "person" : "people"}`;
}

/**
 * What the host is told once people waiting at the door are in without her pressing Let in: the album
 * turned Public, or the invite list became the door, or the list gained an address that waited (build
 * 23's BUG-2). One sentence for all three, because to the host it is one event.
 */
export function cameInLine(n: number): string {
  return `${peopleWaiting(n)} waiting at the door came in.`;
}

/**
 * What choosing the invite list as the door would do to the people waiting at it: the ones it names come
 * in ("Lets in the 1 person waiting at the door who is on your list."), said in the door menu's own
 * words for what a door does to people (`doorConsequence`: Public's "Lets in the 1 person waiting at the
 * door."), and null where it would let in nobody, since a line for an effect that does not happen is
 * a promise not kept. `n` is `DoorCounts.waitingListed`, the read-only twin of what the list then admits.
 */
export function listedWouldComeInLine(n: number): string | null {
  if (!(n > 0)) return null;
  return `Lets in the ${peopleWaiting(n)} waiting at the door ${n === 1 ? "who is" : "who are"} on your list.`;
}

/**
 * WHAT THE HOST IS TOLD WHEN HER NAMES-ONLY DOOR COMES BACK (crumbs-89). Letting each person in and the invite list hold
 * An email first on, and the switch says why ("On while you let each person in"); a gate that turned it on from off is
 * remembered by the event, and the door's leaving it gives her names only back (`events_email_held`, 20261007140000).
 * Said in the switch's own words, of the gate that has gone: the door the page showed when she moved it. A door the page
 * never showed holding it (a move from another device the page had not seen) is said without naming a gate.
 */
export function emailBackLine(heldBy: Door): {
  title: string;
  description: string;
} {
  const why =
    heldBy === "invite"
      ? "while your invite list was the way in"
      : heldBy === "approve"
        ? "while you let each person in"
        : "while the door asked for a confirmed address";
  return {
    title: "An email first is off again.",
    description: `It was only on ${why}.`,
  };
}
