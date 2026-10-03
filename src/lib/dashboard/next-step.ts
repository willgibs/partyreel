/**
 * AN EVENT'S QUEUES, IN HIS ORDER: people at the door, then the review queue, then paused uploads, a
 * reel one photo short, the code the day before (home-wiring, 2026-09-20, `home=pulse`; the doors,
 * event-settings r1). The pulse's first band read it as a row of chips; since host-dashboard r1
 * (2026-10-02) it is the queue half of each event's one item (`attention.ts`), which decides which of
 * these an event says and WHEN (a party long over speaks only when someone waits), and the band is
 * gone with Just arrived.
 *
 * PURE AND NODE-SAFE. No Date.now() lives in here and none may: the caller passes `today`, because a
 * date read during render is impure (react-hooks purity) and because a pure function is the only kind
 * this order can be TESTED in.
 */

import { peopleWaiting } from "@/lib/event/door/words";
import { photosToGo, reelState } from "@/lib/event/reel-progress";
import { formatCount } from "@/lib/format/count";

export type NextStepKind = "door" | "review" | "paused" | "reel" | "print";

export type NextStep = {
  kind: NextStepKind;
  eventId: string;
  /** The step with its event named, because a host has several. */
  label: string;
  /** The same step where its event is already named around it. */
  short: string;
  /** Where the step is taken: a path inside the event. */
  href: string;
  tone: "waiting" | "quiet";
};

export type NextStepEvent = {
  id: string;
  name: string;
  /**
   * Newcomers waiting at the door for the host to let them in (the doors, event-settings r1). Absent
   * reads as none, which is every event before the doors.
   */
  waiting?: number;
  /** Media waiting on the host's review. */
  pending: number;
  acceptingUploads: boolean;
  /** The host's Show the reel switch (`events.show_reel`). */
  showReel: boolean;
  /** The platform lever (`ops_flags.live_reel_enabled`, `reel-teardown`); off outranks the switch. */
  liveReelEnabled: boolean;
  /** Items that can play in the live reel, counted to its minimum (`getReelProgress`). */
  reelItems: number;
  /** `YYYY-MM-DD`, or null when the host never set one. */
  eventDate: string | null;
};

/**
 * Over this, the account's storage stops being ambient: the dashboard's ring turns amber, and readiness
 * lists room among what an event needs (`lib/events/readiness.ts`).
 */
export const STORAGE_STEP_PCT = 85;

/**
 * ONE STEP PER EVENT, IN HIS ORDER: a queue waiting, then uploads paused, then
 * a reel one photo short, then an event dated tomorrow. First match wins,
 * because a host with four events and four steps each is back to an inbox.
 *
 * ★ PEOPLE AT THE DOOR LEAD THE QUEUES (the doors, event-settings r1: a waiting newcomer counts
 * "wherever the host is already told about held uploads (the pulse, the bell)"): a guest standing at
 * a held door is waiting on the host right now, where a held photograph can wait for the evening. It
 * opens the Guests room at its At the door section.
 *
 * ★ THE REEL STEP TELLS THE TRUTH AND THEN LEAVES (`reel-host`, Will
 * 2026-09-25: `pulse=band`). The live reel makes itself from the second photo,
 * so there is nothing to "make": the one thing worth a host's attention is the
 * photo that starts it. The step says so while the reel is one photo short and
 * is gone the moment it plays, and it never shows with the reel off, by the
 * host's own switch or the platform lever (`reel-teardown`; either way, an off
 * reel is not waiting for anything). At none it stays
 * quiet: an event with no photographs has its checklist on its own page
 * (`EventChecklist`, the hub's head), and a step at none would push an event's
 * "Print the code" out the evening before it matters.
 */
export function nextStepForEvent(
  event: NextStepEvent,
  today: string,
): NextStep | null {
  const href = `/dashboard/${event.id}`;

  const waiting = event.waiting ?? 0;
  if (waiting > 0) {
    return {
      kind: "door",
      eventId: event.id,
      label: `${peopleWaiting(waiting)} at the door of ${event.name}`,
      short: `${peopleWaiting(waiting)} at the door`,
      href: `${href}/guests#at-the-door`,
      tone: "waiting",
    };
  }

  if (event.pending > 0) {
    return {
      kind: "review",
      eventId: event.id,
      label: `${formatCount(event.pending)} waiting on ${event.name}`,
      short: `${formatCount(event.pending)} to review`,
      href,
      tone: "waiting",
    };
  }

  if (!event.acceptingUploads) {
    return {
      kind: "paused",
      eventId: event.id,
      label: `Uploads are paused on ${event.name}`,
      short: "Uploads paused",
      href,
      tone: "quiet",
    };
  }

  const reel = reelState({
    showReel: event.showReel,
    liveReelEnabled: event.liveReelEnabled,
    playable: event.reelItems,
  });
  if (reel === "counting" && photosToGo(event.reelItems) === 1) {
    return {
      kind: "reel",
      eventId: event.id,
      label: `1 more photo starts the reel on ${event.name}`,
      short: "1 more photo",
      // The event's page, where the Reel card counts to two and Add photos sits.
      href,
      tone: "quiet",
    };
  }

  if (event.eventDate && event.eventDate === tomorrowOf(today)) {
    return {
      kind: "print",
      eventId: event.id,
      label: `Print the code for ${event.name}`,
      short: "Print the code",
      href,
      tone: "quiet",
    };
  }

  return null;
}

/**
 * `YYYY-MM-DD` plus one day, by UTC arithmetic on the date parts alone.
 *
 * ★ NEVER `new Date(today)` + setDate: that parses a bare date string as UTC
 * midnight, then reads it back in the server's zone, so for any host behind
 * UTC the answer is yesterday and "tomorrow" silently means "today". Splitting
 * the string and using Date.UTC keeps the whole calculation in one frame.
 */
function tomorrowOf(today: string): string {
  const [y, m, d] = today.split("-").map(Number);
  if (!y || !m || !d) return "";
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return next.toISOString().slice(0, 10);
}
