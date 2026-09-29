/**
 * THE DOOR'S SMALL WORDS FOR THE HOST (event-settings r1): how long someone has waited, and how many
 * wait, said the same in the Guests room, the pulse and the bell.
 *
 * Pure (the caller passes `now`, since a clock read in render is impure), so the words are tested.
 */
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
