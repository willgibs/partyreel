/**
 * THE DOORS' WORDS: what each door into her rooms says, worded in ONE place so the page's first paint, the row's live
 * counts and every drawing of the row can never word a door two ways. Server-safe on purpose (no "use client"): the hub's
 * page builds each face from this and hands it to the row, and `reviewCardFace` and `reelCardFace` are read by the
 * Library, the event-header and identity boards and the help center's and the marketing mocks' tests besides.
 *
 * The doors themselves (the card at rest, the pill under the bar) are `room-card-door.tsx`'s; the row is
 * `event-cards-row.tsx`'s.
 *
 * ★ A FACE IS A LINE AND, WHERE SOMETHING WAITS ON HER, A COUNT. Review's held uploads and the people at her door are the
 * only needs-action counts: today's waiting light stands beside a numeral and the line keeps the word it counts. Settings'
 * steps left are hers to act on but wait on nobody, so they are plain words in the ink, never the waiting light; and a
 * paused upload door says Paused, the uploads' own word (`uploadsLabel`), never Closed, which is a door's.
 */
import type { Door } from "@/lib/event/door/door";
import { photosToGo, type ReelState } from "@/lib/event/reel-progress";
import {
  AS_GUEST_DOOR,
  EVENT_ROOMS,
  type EventRoomId,
} from "@/lib/event/sections";
import { doorLabel, uploadsLabel } from "@/lib/events/visibility-labels";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

/** The five doors: the four rooms, and her album as a guest's phone shows it, the row's last. */
export type DoorRoomId = EventRoomId | typeof AS_GUEST_DOOR.id;

/** A door's whole name: a card's title, and the first words of its accessible name. */
export const ROOM_LABEL: Record<DoorRoomId, string> = {
  ...(Object.fromEntries(EVENT_ROOMS.map((r) => [r.id, r.label])) as Record<
    EventRoomId,
    string
  >),
  [AS_GUEST_DOOR.id]: AS_GUEST_DOOR.label,
};

/** The word a small door has room for: a pill's word, and a narrow card's title. */
export const ROOM_SHORT: Record<DoorRoomId, string> = {
  ...ROOM_LABEL,
  reel: "Reel",
};

/** What a door says and, where it has one, the count that needs her or one hers to act on. */
export type RoomFace = {
  /** The line under the title: "8 waiting", "31 guests", "2 left", "Paused". */
  value: string;
  /** Something waits on her (uploads in Review, people at her door): the waiting light and a numeral. */
  amber?: boolean;
  /** That waiting count, so a return from the room ticks it down. */
  count?: number;
  /** Settings' steps left (event-ready): the line reads in the foreground ink, a count to act on, never amber. */
  strong?: boolean;
  /** Settings' steps left as a number, for a pill too small for its words: an unlit mark, never amber. */
  left?: number;
  /** Uploads are paused (Settings, once its steps are done): the line reads Paused, the pill wears a pause. */
  paused?: boolean;
};

/**
 * A WAITING LINE ONCE ITS NUMERAL STANDS ON ITS OWN: the word the count counts ("8 waiting" is the numeral 8 and the
 * line "waiting"). Read off the count's own grouping, never a pattern over the words, so a count that grows a comma
 * ("1,234 waiting") still leaves the word whole.
 */
export function countWord(value: string, count: number): string {
  const lead = formatCount(count);
  return value.startsWith(lead) ? value.slice(lead.length).trimStart() : value;
}

/**
 * THE REEL CARD'S LINE, from the reel's state: what the door says under its name. One pure function of (state, have, of,
 * developing), as `doorLabel` and `reviewCardFace` are for their doors.
 */
export function reelCardFace(
  state: ReelState,
  have: number,
  of: number,
  developing: boolean,
): string {
  if (state === "off") return "Off";
  if (state === "live")
    // ★ SHORT ON PURPOSE: the card's line is a phone's half width, where "Guests get it at the develop" was cut at every
    // width; the whole sentence is the card's `title`.
    return developing ? "Guests get it later" : "Live for guests";
  if (have === 0) return `Starts at ${of} photos`;
  const toGo = photosToGo(have);
  return `${toGo} more ${toGo === 1 ? "photo" : "photos"}`;
}

/**
 * THE REVIEW CARD'S FACE, from whether review is on and what waits in it: the server's first paint and the row's live count
 * read it from this one place, so the two can never word it differently.
 */
export function reviewCardFace(
  moderationOn: boolean,
  pending: number,
): { value: string; amber: boolean; count: number | undefined } {
  const waiting = moderationOn && pending > 0;
  return {
    value: moderationOn
      ? pending > 0
        ? `${formatCount(pending)} waiting`
        : "All caught up"
      : "Off",
    amber: waiting,
    count: waiting ? pending : undefined,
  };
}

/**
 * THE GUESTS CARD'S FACE: who waits at her door first, in the needs-action light, since letting her in is done in that room
 * (event-settings r1, `queue=room`); else how many are in.
 *
 * ★ A SEALED ROLL IS SAID, NEVER READ AS NOBODY (crumbs-81, the Guests room's own line). A guest whose only approved shots
 * wait for the develop joins the list at the develop, so while a roll is shot the count is zero and the card said "0
 * guests" over a party that had filled it. When the list is empty only for that reason the card says the roll is developing,
 * in the camera's own word ("shots"), as the room does over its empty list; once anyone is in, the number of guests is true
 * and stands.
 */
export function guestsCardFace({
  waiting,
  guests,
  shots,
}: {
  /** People waiting on the host at her door. */
  waiting: number;
  /** Guests in the list, the one count. */
  guests: number;
  /** Approved guest shots held under the develop's seal (`countWaitingGuestShots`), 0 for an album holding nothing back. */
  shots: number;
}): RoomFace {
  if (waiting > 0)
    return {
      value: `${formatCount(waiting)} waiting`,
      amber: true,
      count: waiting,
    };
  if (guests === 0 && shots > 0)
    return {
      value: `${formatCount(shots)} ${shots === 1 ? "shot" : "shots"} developing`,
    };
  return {
    value: `${formatCount(guests)} ${guests === 1 ? "guest" : "guests"}`,
  };
}

/**
 * THE SETTINGS CARD'S FACE: what a guest still needs, counted, while its steps are not all ticked (event-ready); then, once
 * they are, uploads paused in their own word (the carried call G4: "Paused", plain and never amber, in place of the door's
 * word, the code's corner keeping its pause); then the door, in the one function that words it everywhere.
 */
export function settingsCardFace({
  left,
  accepting,
  door,
}: {
  /** Steps still to do (`stepsLeft`, 0 once the checklist has stepped aside). */
  left: number;
  /** Uploads are on (`events.accepting_uploads`). */
  accepting: boolean;
  door: Door;
}): RoomFace {
  if (left > 0)
    return { value: `${formatCount(left)} left`, strong: true, left };
  if (!accepting) return { value: uploadsLabel(false), paused: true };
  return { value: doorLabel(door) };
}

/**
 * THE RETIRED TILE'S SHELL, kept only for the help center's picture of the row (`desk-screens.tsx`, which draws the
 * card the hub wore before the cards over the seam). The row's own doors are `room-card-door.tsx`'s and never wear these.
 */
export const ROOM_CARD_BASE = cn(
  "group flex shrink-0 flex-col justify-between rounded-xl border outline-none transition-all duration-200 ease-emphasis",
  "focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.98] motion-reduce:active:scale-100",
);

/** The retired tile's quiet border (the help center's picture). */
export const ROOM_CARD_QUIET = "border-border hover:border-foreground/25";
