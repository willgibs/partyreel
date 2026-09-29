import {
  nextStepForEvent,
  type NextStep,
  type NextStepEvent,
  STORAGE_STEP_PCT,
} from "@/lib/dashboard/next-step";
import { type Door, stepOf } from "@/lib/event/door/door";
import { photosToGo, reelState } from "@/lib/event/reel-progress";
import { DOOR_STEP_LINES, GATE_LINES } from "@/lib/events/visibility-labels";
import { formatCount } from "@/lib/format/count";
import { formatEventDate } from "@/lib/utils";

/**
 * READY, AS ONE PURE FUNCTION: the board's proposal for what "ready" means,
 * written the way the wiring would write it, so every drawing on the board
 * reads the same answer and the answer can be tested.
 *
 * ★ EVERY ITEM IS STATE THE APP ALREADY HOLDS (the brief's one rule). Nothing
 * here asks a host to tick a box and nothing here is stored: the door and its
 * counts, `accepting_uploads`, the album's approved count and the reel's
 * playable count, `event_date` and `description`, the link's own visit count
 * (`event_link_totals.qr_scans`, which the hub already reads for its Views
 * number, the host's own visits included), and the account's storage. So a
 * tick can never disagree with the event, and a host who fixes a thing
 * anywhere (Settings, the album, a scan) sees it ticked everywhere at once.
 *
 * ★ READY WAITS ONLY ON WHAT A GUEST NEEDS (the lane's call, carried on the
 * board and in the manifest as a Question): a door that lets guests in,
 * uploads open, the code opened once, and room when the shelf is full. The
 * welcome and the first photos are worth doing and are listed, but they never
 * hold "ready" back, because a host who skips a note has not failed to set up
 * an event, and a readiness that waits on them would turn a suggestion into an
 * obligation.
 *
 * ★ THE CODE TICKS AT ITS FIRST OPEN. The app cannot see a printer, but it can
 * see the link opened: every visit to `/e/<token>` counts (`recordLinkHit`,
 * bot-filtered), the host's own test scan included, so "scan it once from
 * your phone" (the help's own advice) is how it learns the code is out and
 * works. That is why today's launch list could never tick its print row, and
 * why this one can.
 *
 * ★ WHAT A GUEST NEEDS COMES FIRST, THEN WHAT IS WORTH DOING: the door,
 * uploads and the code (the three the bar measures, so a full bar is "ready"),
 * then the first photos and the welcome. On a phone the one row a new event
 * is missing, the code, stands above the fold rather than under two
 * suggestions.
 */

/** What the checklist reads: one event's own state, every fact already held. */
export type ReadyFacts = {
  door: Door;
  hasPassword: boolean;
  /** People already in (the door's counts). */
  guestsIn: number;
  /** Addresses on the invite list. */
  invited: number;
  acceptingUploads: boolean;
  /** The album's approved items (`event_card_stats.approved`). */
  approved: number;
  /** Items that can play in the reel (`getReelProgress`). */
  playable: number;
  showReel: boolean;
  /** The platform lever (`ops_flags.live_reel_enabled`). */
  liveReelEnabled: boolean;
  /** `YYYY-MM-DD`, or null. */
  eventDate: string | null;
  description: string | null;
  /** Visits to the event's link, the host's own included. */
  opened: number;
  /** The account's storage used, as a whole percent of its cap. */
  storagePct: number;
};

export type ReadyItemId =
  | "door"
  | "adds"
  | "photos"
  | "welcome"
  | "code"
  | "room";

/** Where an item's action leads: a Settings page, the album, the code, the plans. */
export type ReadyTarget =
  | "door"
  | "adds"
  | "event"
  | "add-photos"
  | "print"
  | "share"
  | "plans";

export type ReadyAction = { label: string; to: ReadyTarget };

export type ReadyItem = {
  id: ReadyItemId;
  /** Ready waits on it: a guest needs it to get in and add. */
  essential: boolean;
  done: boolean;
  title: string;
  /** What is true now, in one line. */
  line: string;
  /** What finishes it; empty once it is done. */
  actions: readonly ReadyAction[];
};

export type Readiness = {
  /** Every item, the essentials first in the list's order, then what is worth doing. */
  items: readonly ReadyItem[];
  /** Every essential is done: a guest can get in and add. */
  ready: boolean;
  done: number;
  total: number;
  /** The essentials done, of how many: what the bar and the count measure. */
  needed: { done: number; of: number };
  /** The items not done, in the list's order. */
  left: readonly ReadyItem[];
};

/** Whether the door lets a guest through, as it stands. */
export function doorLetsGuestsIn(f: ReadyFacts): boolean {
  switch (f.door) {
    case "open":
    case "approve":
      return true;
    case "password":
      return f.hasPassword;
    case "invite":
      return f.invited > 0;
    case "closed":
      return f.guestsIn > 0;
    case "private":
      return false;
  }
}

/** The door's own line for a guest, in the door's one home's words. */
function doorGuestLine(door: Door): string {
  const step = stepOf(door);
  if (step !== "private" || door === "private") return DOOR_STEP_LINES[step];
  return GATE_LINES[door as Exclude<Door, "open" | "private">];
}

const times = (n: number) => `${formatCount(n)} ${n === 1 ? "time" : "times"}`;

function doorItem(f: ReadyFacts): ReadyItem {
  const done = doorLetsGuestsIn(f);
  const line = done
    ? doorGuestLine(f.door)
    : f.door === "private"
      ? DOOR_STEP_LINES.only_me
      : f.door === "invite"
        ? "Your invite list is empty, so nobody can get in yet."
        : f.door === "closed"
          ? "Nobody is in yet, and nobody new can join."
          : "Set the password guests will type.";
  return {
    id: "door",
    essential: true,
    done,
    title: "Who can get in",
    line,
    actions: done ? [] : [{ label: "Choose", to: "door" }],
  };
}

function addsItem(f: ReadyFacts): ReadyItem {
  return {
    id: "adds",
    essential: true,
    done: f.acceptingUploads,
    title: "What guests can add",
    line: f.acceptingUploads
      ? "Uploads are open."
      : "Uploads are paused. Guests can still look.",
    actions: f.acceptingUploads ? [] : [{ label: "Open", to: "adds" }],
  };
}

function photosItem(f: ReadyFacts): ReadyItem {
  const reel = reelState({
    showReel: f.showReel,
    liveReelEnabled: f.liveReelEnabled,
    playable: f.playable,
  });
  // With the reel on, the album is seeded when the reel plays; off, one photo does it.
  const done = reel === "off" ? f.approved > 0 : reel === "live";
  const toGo = photosToGo(f.playable);
  const line = done
    ? reel === "live"
      ? `${formatCount(f.approved)} in the album, and the highlight reel is playing.`
      : `${formatCount(f.approved)} in the album.`
    : f.approved === 0
      ? "An album with a few photos in it invites guests to add theirs."
      : `${toGo === 1 ? "One more photo starts" : `${formatCount(toGo)} more photos start`} the highlight reel.`;
  return {
    id: "photos",
    essential: false,
    done,
    title: "The first photos",
    line,
    actions: done ? [] : [{ label: "Add photos", to: "add-photos" }],
  };
}

function welcomeItem(f: ReadyFacts): ReadyItem {
  const note = Boolean(f.description?.trim());
  const date = Boolean(f.eventDate);
  const done = note && date;
  const line = done
    ? `${formatEventDate(f.eventDate!)}, and a note guests read first.`
    : !note && !date
      ? "The date under the name, and a note guests read first."
      : !note
        ? "Write the note guests read first, after they scan the code."
        : "Set the date. It shows under the name.";
  return {
    id: "welcome",
    essential: false,
    done,
    title: "The welcome",
    line,
    actions: done
      ? []
      : [{ label: !note && !date ? "Add them" : "Add it", to: "event" }],
  };
}

function codeItem(f: ReadyFacts): ReadyItem {
  const done = f.opened > 0;
  return {
    id: "code",
    essential: true,
    done,
    title: "The code",
    line: done
      ? `Opened ${times(f.opened)}.`
      : "Nobody has opened it yet. Print it or send it, then scan it once yourself.",
    actions: done
      ? []
      : [
          { label: "Print", to: "print" },
          { label: "Share", to: "share" },
        ],
  };
}

/** Room, only once the shelf runs short; essential only when it is full. */
function roomItem(f: ReadyFacts): ReadyItem | null {
  if (f.storagePct <= STORAGE_STEP_PCT) return null;
  const full = f.storagePct >= 100;
  return {
    id: "room",
    essential: full,
    done: false,
    title: "Room for the party",
    line: full
      ? "Your storage is full, so new uploads are refused."
      : `${formatCount(f.storagePct)}% of your storage is used.`,
    actions: [{ label: "See plans", to: "plans" }],
  };
}

/**
 * The checklist and whether a guest could arrive now: what a guest needs
 * first (the door, uploads, the code, and room once the shelf is full), then
 * what is worth doing (the first photos, the welcome, room running short).
 */
export function readiness(f: ReadyFacts): Readiness {
  const room = roomItem(f);
  const all = [
    doorItem(f),
    addsItem(f),
    codeItem(f),
    ...(room ? [room] : []),
    photosItem(f),
    welcomeItem(f),
  ];
  const items = [
    ...all.filter((i) => i.essential),
    ...all.filter((i) => !i.essential),
  ];
  const left = items.filter((i) => !i.done);
  const essentials = items.filter((i) => i.essential);
  return {
    items,
    ready: essentials.every((i) => i.done),
    done: items.length - left.length,
    total: items.length,
    needed: {
      done: essentials.filter((i) => i.done).length,
      of: essentials.length,
    },
    left,
  };
}

/* ── What needs you, never empty ──────────────────────────────────────────── */

/** One event as the dashboard knows it: the pulse's facts and the checklist's. */
export type JobEvent = NextStepEvent & ReadyFacts;

export type JobKind =
  | NextStep["kind"]
  | "door-shut"
  | "photos"
  | "welcome"
  | "code"
  | "invite"
  | "album";

/** A step the band draws: production's shape, with the new kinds beside its own. */
export type Job = Omit<NextStep, "kind"> & { kind: JobKind };

const JOB_OF: Partial<
  Record<
    ReadyItemId,
    (name: string, item: ReadyItem) => [JobKind, string, string]
  >
> = {
  door: (name) => [
    "door-shut",
    `Choose who can get into ${name}`,
    "Who can get in",
  ],
  photos: (name) => [
    "photos",
    `Add the first photos to ${name}`,
    "Add the first photos",
  ],
  welcome: (name, item) =>
    item.actions[0]?.label === "Add them"
      ? [
          "welcome",
          `Add the date and a note to ${name}`,
          "Add the date and a note",
        ]
      : ["welcome", `Finish the welcome for ${name}`, "Finish the welcome"],
  code: (name) => ["code", `Scan the code for ${name}`, "Scan the code once"],
};

/**
 * How long after its date a party keeps a job of its own when nothing waits:
 * the month its album is shared and downloaded in. Past it, an event speaks
 * only when something waits, so years of parties never fold into a long band.
 */
export const AFTER_PARTY_DAYS = 30;

/** Whole days from the event's date to `today`, by the date parts alone (null when undated). */
function daysSince(eventDate: string | null, today: string): number | null {
  if (!eventDate) return null;
  const day = (d: string) => {
    const [y, m, dd] = d.split("-").map(Number);
    return Date.UTC(y ?? 0, (m ?? 1) - 1, dd ?? 1);
  };
  return Math.round((day(today) - day(eventDate)) / 86_400_000);
}

/**
 * ONE JOB PER EVENT. What waits comes first, in production's own order and
 * words (`nextStepForEvent`: the door, a queue, paused uploads, a reel one
 * photo short, the code the day before). Before the party, the checklist's
 * first item left, its essentials before what is worth doing, and with
 * nothing left the one thing a live event always wants, guests. After it, the
 * checklist is moot and the album is what she shares (the same link), for a
 * month; then the event is quiet until something waits. So the band is never
 * a void while a party is coming or just past, and no job is filler.
 */
export function nextJob(event: JobEvent, today: string): Job | null {
  const waiting = nextStepForEvent(event, today);
  if (waiting) return waiting;
  const href = `/dashboard/${event.id}`;
  const since = daysSince(event.eventDate, today);
  if (since !== null && since > 0) {
    return since <= AFTER_PARTY_DAYS
      ? {
          kind: "album",
          eventId: event.id,
          label: `Share the album of ${event.name}`,
          short: "Share the album",
          href: `${href}?room=share`,
          tone: "quiet",
        }
      : null;
  }
  const { items } = readiness(event);
  const next =
    items.find((i) => !i.done && i.essential && i.id !== "room") ??
    items.find((i) => !i.done && i.id !== "room");
  const phrase = next ? JOB_OF[next.id]?.(event.name, next) : undefined;
  if (next && phrase) {
    const [kind, label, short] = phrase;
    return { kind, eventId: event.id, label, short, href, tone: "quiet" };
  }
  return {
    kind: "invite",
    eventId: event.id,
    label: `Invite guests to ${event.name}`,
    short: "Invite guests",
    href: `${href}?room=share`,
    tone: "quiet",
  };
}

/** How ready an event is, in the band's words: the count option's one line. */
export function readyWord(event: JobEvent): { label: string; short: string } {
  const r = readiness(event);
  const worth = r.left.filter((i) => !i.essential).length;
  if (r.ready && worth === 0)
    return { label: `${event.name} is ready`, short: "Ready" };
  if (r.ready)
    return {
      label: `${event.name} is ready, ${formatCount(worth)} worth doing`,
      short: `Ready, ${formatCount(worth)} worth doing`,
    };
  const needed = r.needed.of - r.needed.done;
  return {
    label: `${formatCount(needed)} left before guests arrive at ${event.name}`,
    short: `${formatCount(needed)} left`,
  };
}
