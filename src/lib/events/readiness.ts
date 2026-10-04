import { STORAGE_STEP_PCT } from "@/lib/dashboard/next-step";
import { type Door, doorOf, stepOf } from "@/lib/event/door/door";
import { photosToGo, reelState } from "@/lib/event/reel-progress";
import {
  SETTINGS_GROUP_TITLES,
  type SettingsGroup,
} from "@/lib/events/guest-experience-summary";
import { lastDayOf } from "@/lib/events/dates";
import { DOOR_STEP_LINES, GATE_LINES } from "@/lib/events/visibility-labels";
import { formatCount } from "@/lib/format/count";
import { formatEventDate } from "@/lib/utils";

/**
 * READY FOR GUESTS, AS ONE PURE FUNCTION (Will's `event-ready` picks, 2026-10-02): what an event still
 * needs before guests arrive, read by the hub's checklist at its head (`list=head`), Settings' rail of
 * steps (`guide=steps`) and Create's hand-off (`create=hand`), so a tick in one of them is a tick in all.
 *
 * ★ EVERY ITEM IS STATE THE APP ALREADY HOLDS, AND READY IS NEVER STORED NOR SHOWN TO A GUEST. The door
 * and its counts, `accepting_uploads`, the album's count and the reel's playable count, `event_date` and
 * `description`, the link's visits (the hub's own Views number, the host's own visits included) and the
 * account's storage. Nothing asks a host to tick a box, and nothing here gates anything: a host who fixes
 * a thing anywhere (Settings, the album, a scan) sees it ticked everywhere at once.
 *
 * ★ READY WAITS ONLY ON WHAT A GUEST NEEDS (the board's carried `ready` call): a door that lets guests
 * in, uploads open, the code opened once, and room once the shelf is full. The welcome and the first
 * photos are worth doing and are listed, but never hold ready back: a host who skips a note has not
 * failed to set up an event, and a readiness that waited on it would turn a suggestion into an
 * obligation.
 *
 * ★ THE CODE TICKS AT ITS FIRST OPEN. The app cannot see a printer, but it sees the link opened: every
 * visit to `/e/<token>` counts (`recordLinkHit`, bot-filtered), the host's own test scan included, so
 * "scan it once from your phone" (the help's own advice) is how it learns the code is out and works.
 *
 * ★ WHAT A GUEST NEEDS COMES FIRST, THEN WHAT IS WORTH DOING: on a phone the one row a new event is
 * missing, the code, stands above the fold rather than under two suggestions.
 *
 * The `needs` ask's derivations (one job per event on the dashboard, a ready count per card) stayed with
 * the retired board: Will asked for that band to be rethought whole (host-dashboard r1).
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
  /** The album's count (approved and hidden: the number the hub's header says). */
  approved: number;
  /** Items that can play in the reel, counted at least to its minimum. */
  playable: number;
  showReel: boolean;
  /** The platform lever (`ops_flags.live_reel_enabled`). */
  liveReelEnabled: boolean;
  /** `YYYY-MM-DD`, or null: a range's first day. */
  eventDate: string | null;
  /** The last day of a range (`YYYY-MM-DD`), or null; absent reads as one day. */
  eventEndDate?: string | null;
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

/** Where an item's action leads: a Settings page, the album's uploader, the code card, paper, the plans. */
export type ReadyTarget =
  | "door"
  | "adds"
  | "event"
  | "add-photos"
  | "invite"
  | "print"
  | "plans";

export type ReadyAction = { label: string; to: ReadyTarget };

export type ReadyItem = {
  id: ReadyItemId;
  /** Ready waits on it: a guest needs it to find the album, get in and add. */
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
  /** Every essential is done: a guest can find the album, get in and add. */
  ready: boolean;
  done: number;
  total: number;
  /** The essentials done, of how many: what the bar and the count measure. */
  needed: { done: number; of: number };
  /** The items not done, in the list's order. */
  left: readonly ReadyItem[];
};

/**
 * Whether the door lets a guest through, as it stands.
 *
 * ★ AN INVITE LIST NEEDS NO NAMES TO LET PEOPLE IN. The addresses it holds come straight in and anyone
 * else can ask the host (`GATE_LINES.invite`, and `decideDoor`'s `ask` in `lib/event/door/decide.ts`), so
 * a list still empty is a door a guest can get through, as letting each person in is. What holds ready
 * back is a door nobody can pass: Only me, a password not yet set, a closed door with nobody in.
 */
export function doorLetsGuestsIn(f: ReadyFacts): boolean {
  switch (f.door) {
    case "open":
    case "approve":
    case "invite":
      return true;
    case "password":
      return f.hasPassword;
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

/** With the reel on, the album is seeded when the reel plays; off, one photo does it. */
function photosDone(f: ReadyFacts): boolean {
  const reel = reelState({
    showReel: f.showReel,
    liveReelEnabled: f.liveReelEnabled,
    playable: f.playable,
  });
  return reel === "off" ? f.approved > 0 : reel === "live";
}

function photosItem(f: ReadyFacts): ReadyItem {
  const done = photosDone(f);
  const live = done && f.showReel && f.liveReelEnabled;
  const toGo = photosToGo(f.playable);
  const line = done
    ? live
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
    ? `${formatEventDate(f.eventDate!, f.eventEndDate)}, and a note guests read first.`
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

/**
 * The code. ★ ITS DOOR TO THE CODE CARD READS INVITE (`popups` r1, `share=card`, Will 2026-09-27:
 * "open 'Invite' then 'Share'"): every door onto the card does, and its Share is the phone's own sheet.
 */
function codeItem(f: ReadyFacts): ReadyItem {
  const done = f.opened > 0;
  return {
    id: "code",
    essential: true,
    done,
    title: "The code",
    line: done
      ? `Opened ${times(f.opened)}.`
      : "Nobody has opened it yet. Send it or print it, then scan it once yourself.",
    actions: done
      ? []
      : [
          { label: "Invite", to: "invite" },
          { label: "Print", to: "print" },
        ],
  };
}

/** Room, only once the shelf runs short (the dashboard's own threshold); essential only when it is full. */
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
 * The checklist and whether a guest could arrive now: what a guest needs first (the door, uploads, the
 * code, and room once the shelf is full), then what is worth doing (the first photos, the welcome, room
 * running short).
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

/** The checklist's head, in its two states: what a guest still needs, or ready and what is worth doing. */
export function readyHead(r: Readiness): { title: string; line: string } {
  const worth = r.left.filter((i) => !i.essential).length;
  if (r.ready && worth === 0) {
    return { title: "Ready for guests", line: "Everything is set." };
  }
  if (r.ready) {
    return {
      title: "Ready for guests",
      line: `${worth === 1 ? "One thing" : `${formatCount(worth)} things`} still worth doing.`,
    };
  }
  const more = r.needed.of - r.needed.done;
  return {
    title: "Before guests arrive",
    line: `Guests still need ${more === 1 ? "one more thing" : `${formatCount(more)} more things`}.`,
  };
}

/**
 * ★ SETTINGS HOLDS WHAT SETTINGS CAN FINISH. Its rail is the four groups and the code; room is the
 * plan's (the hub's checklist and the dashboard's storage line say it), so Settings' own readiness, its
 * head and the hub's Settings card read the event with room left out, and never count a step Settings
 * does not draw.
 */
export function settingsReadiness(f: ReadyFacts): Readiness {
  return readiness({ ...f, storagePct: 0 });
}

/** What a guest still needs that Settings' rail holds: the hub's Settings card counts it (0 when ready). */
export function stepsLeft(f: ReadyFacts): number {
  const r = settingsReadiness(f);
  return r.needed.of - r.needed.done;
}

/**
 * WHAT A STEP ON SETTINGS' RAIL STILL WANTS, in Settings' own words: its sentence already says where the
 * group stands ("Only you. Guests meet a closed album."), so this says only what is missing, and nothing
 * once the step is ticked. The rail's steps are the checklist's items in Settings' order: the door, what
 * guests can add, the reel (its first photos), the event (the welcome), then the code.
 */
export function stepWants(
  id: Exclude<ReadyItemId, "room">,
  f: ReadyFacts,
): string | null {
  switch (id) {
    case "door":
      if (doorLetsGuestsIn(f)) return null;
      return f.door === "private"
        ? "Nobody else can get in yet."
        : f.door === "closed"
          ? "Nobody is in yet."
          : "No password set yet.";
    case "adds":
      // Its sentence says Paused, and guests can still look: nothing more to add.
      return null;
    case "photos": {
      if (photosDone(f)) return null;
      const reelOn = f.showReel && f.liveReelEnabled;
      if (!reelOn) return "No photos in the album yet.";
      return f.playable === 0
        ? "It starts at two photos; none yet."
        : photosToGo(f.playable) === 1
          ? "One more photo starts it."
          : `${formatCount(photosToGo(f.playable))} more photos start it.`;
    }
    case "welcome": {
      const note = Boolean(f.description?.trim());
      const date = Boolean(f.eventDate);
      if (note && date) return null;
      return !note && !date
        ? "No date or note yet."
        : !note
          ? "No note yet."
          : "No date yet.";
    }
    case "code":
      return f.opened > 0
        ? null
        : "Nobody has opened it yet. Send it or print it, then scan it once yourself.";
  }
}

/**
 * ★ BEFORE GUESTS ARRIVE IS MOOT ONCE THEY HAVE: the checklist steps aside from the day after the event's
 * date, done or not (an album a host pauses once the party is over, as the help advises, is finished, not
 * unready), and from the day after a range's LAST day (lane `event-dates`: a weekend's checklist stands
 * through its Sunday). An undated event keeps it until it is done. `today` is the viewer's calendar day
 * (`viewer-day.ts`), every day a `YYYY-MM-DD`, so the comparison is the strings'. It only hides a list:
 * nothing about the event changes on its last day.
 */
export function checklistOver(
  eventDate: string | null,
  today: string,
  eventEndDate?: string | null,
): boolean {
  const last = lastDayOf(eventDate, eventEndDate);
  return last !== null && last < today;
}

/**
 * A NEW EVENT'S FACTS, from what Create sent (the create schema's defaults filled): nothing in it yet,
 * nobody in, never opened. Create's hand-off lists what is left from these. ★ The account's storage is
 * the route's to read and hand over (create-wizard r2's carried `room`, taken): past the dashboard's own
 * threshold room joins what is left on the beat, as it does on the hub, said beside Settings' steps
 * because it is the plan's, never a step.
 */
export function newEventFacts(
  created: {
    visibility: string;
    accepting_uploads: boolean;
    event_date?: string | null;
    event_end_date?: string | null;
    description?: string | null;
  },
  /** The account's storage used (`storageUsedPct`), 0 where nobody read it. */
  storagePct = 0,
): ReadyFacts {
  return {
    // A new event cannot hold a password (`createEvent` stores a password request as open).
    door: doorOf(
      created.visibility === "password" ? "open" : created.visibility,
      null,
    ),
    hasPassword: false,
    guestsIn: 0,
    invited: 0,
    acceptingUploads: created.accepting_uploads,
    approved: 0,
    playable: 0,
    // The reel's switch is update-only: a new event takes its column default, on.
    showReel: true,
    liveReelEnabled: true,
    eventDate: created.event_date || null,
    eventEndDate: created.event_end_date || null,
    description: created.description || null,
    opened: 0,
    storagePct,
  };
}

/**
 * THE ACCOUNT'S STORAGE, AS THE WHOLE PERCENT `ReadyFacts.storagePct` READS: active bytes against the
 * effective cap (what the cap is enforced against, so deleting visibly frees room), rounded, never past
 * 100, and 0 where there is no cap to run short of. The dashboard meter's own math, in one place for the
 * route that hands it to a checklist (`/dashboard/new`; the hub and the dashboard still say it inline).
 */
export function storageUsedPct(
  activeBytes: number,
  capBytes: number | null,
): number {
  if (!capBytes || capBytes <= 0) return 0;
  return Math.min(100, Math.round((activeBytes / capBytes) * 100));
}

/**
 * SETTINGS' FIVE STEPS, IN ITS RAIL'S ORDER (event-ready `guide=steps`): each step is the checklist item it
 * finishes (who can get in, what guests can add, the reel's first photos, the welcome), then the code. A
 * surface that draws them (Create's beat, under the code: create-wizard r2 `beat=develop`) reads them here,
 * titled as Settings titles its rows, so the rail a host is shown is the rail Get it ready opens onto.
 * Room is never a step: it is the plan's, said beside them.
 */
export const SETTINGS_STEP_ITEMS = [
  { item: "door", group: "door" },
  { item: "adds", group: "adds" },
  { item: "photos", group: "reel" },
  { item: "welcome", group: "event" },
  { item: "code", group: null },
] as const satisfies readonly {
  item: Exclude<ReadyItemId, "room">;
  group: SettingsGroup | null;
}[];

export type SettingsStep = {
  /** Its number on the rail, 1 to 5. */
  n: number;
  item: Exclude<ReadyItemId, "room">;
  title: string;
  done: boolean;
};

export function settingsSteps(r: Readiness): SettingsStep[] {
  return SETTINGS_STEP_ITEMS.map(({ item, group }, i) => {
    const it = r.items.find((x) => x.id === item);
    return {
      n: i + 1,
      item,
      // The four groups are titled as Settings' rows are; the code is its own item's title.
      title: group ? SETTINGS_GROUP_TITLES[group] : (it?.title ?? item),
      done: it?.done ?? false,
    };
  });
}
