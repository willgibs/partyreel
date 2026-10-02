import { nextStepForEvent, STORAGE_STEP_PCT } from "@/lib/dashboard/next-step";
import { peopleWaiting } from "@/lib/event/door/words";
import { readiness, type ReadyFacts } from "@/lib/events/readiness";
import { formatCount } from "@/lib/format/count";

import type { DashEvent, Host } from "./fixtures";

/**
 * WHAT THE DASHBOARD KNOWS, AS PURE FUNCTIONS: the board's proposal written
 * the way a wiring would write it, so every drawing reads one answer and the
 * answer is tested (`model.test.ts`).
 *
 * ★ TIME DECIDES WHAT MATTERS. An event's life has phases (before its date,
 * its day, the month its album fills and is shared, and then the years after),
 * and what deserves a host's attention changes with them: before, the door
 * and the code; on the day, the people at the door; after, the queue. A party
 * long over is finished, not unready, so it speaks only when someone waits
 * (its door or its queue), and a paused album there is the help's own advice
 * followed, never a step. That is the whole answer to forty events stacking
 * forty steps: thirty-six of them are past.
 *
 * ★ READINESS IS PRODUCTION'S (`lib/events/readiness.ts`, the hub's checklist
 * and Settings' steps), and the queues are production's rule
 * (`nextStepForEvent`): this file only decides WHICH event speaks and WHEN,
 * never what "ready" means.
 */

export type Phase = "before" | "live" | "after" | "past";

/** How long after its date an event keeps its after-party: the month its album is shared in. */
export const AFTER_DAYS = 30;

/** "This week", both ways: the window the `week` rule reads. */
export const WEEK_DAYS = 7;

const DAY_MS = 86_400_000;

const utc = (d: string) => {
  const [y, m, dd] = d.split("-").map(Number);
  return Date.UTC(y ?? 0, (m ?? 1) - 1, dd ?? 1);
};

/** Whole days from `today` to `date`: 1 is tomorrow, -1 yesterday. By the date parts alone. */
export function daysFrom(today: string, date: string): number {
  return Math.round((utc(date) - utc(today)) / DAY_MS);
}

export function phaseOf(date: string | null, today: string): Phase {
  // An undated event is set up but never "over": it reads as before.
  if (!date) return "before";
  const d = daysFrom(today, date);
  if (d > 0) return "before";
  if (d === 0) return "live";
  return -d <= AFTER_DAYS ? "after" : "past";
}

const WEEKDAY = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  timeZone: "UTC",
});
const SHORT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const MONTH_DAY = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const MONTH_YEAR = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const LONG = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

/** "Friday, October 2": the day as a heading says it. */
export const longDate = (date: string) => LONG.format(new Date(utc(date)));

/**
 * WHEN, IN THE FEWEST WORDS THAT ARE STILL EXACT. Tonight, Tomorrow, the
 * weekday inside a week ahead (a weekday behind would read as the next one,
 * so the past says its date), then the date, then the month and year once the
 * year has turned.
 */
export function whenOf(
  date: string | null,
  today: string,
  evening = true,
): string {
  if (!date) return "No date";
  const d = daysFrom(today, date);
  const at = new Date(utc(date));
  if (d === 0) return evening ? "Tonight" : "Today";
  if (d === 1) return "Tomorrow";
  if (d === -1) return evening ? "Last night" : "Yesterday";
  if (d > 1 && d < WEEK_DAYS) return WEEKDAY.format(at);
  if (Math.abs(d) <= 30) return SHORT.format(at);
  if (date.slice(0, 4) === today.slice(0, 4)) return MONTH_DAY.format(at);
  return MONTH_YEAR.format(at);
}

/** Whether the frame's clock is in the evening ("9:40 pm"), which turns Today into Tonight. */
export const isEvening = (clock: string) => /pm$/i.test(clock.trim());

export function storagePct(host: Host): number {
  return Math.min(
    100,
    Math.round((host.plan.usedBytes / host.plan.capBytes) * 100),
  );
}

/** One event's facts as production's readiness reads them. */
export function readyFacts(e: DashEvent, host: Host): ReadyFacts {
  return {
    door: e.door,
    hasPassword: e.facts.hasPassword,
    guestsIn: e.facts.guests,
    invited: 0,
    acceptingUploads: e.facts.acceptingUploads,
    approved: e.facts.approved,
    playable: e.facts.approved,
    showReel: e.showReel,
    liveReelEnabled: true,
    eventDate: e.date,
    description: e.facts.description,
    opened: e.facts.opened,
    storagePct: storagePct(host),
  };
}

/* ── the one thing an event needs today ──────────────────────────────────── */

export type ItemKind =
  | "door"
  | "review"
  | "paused"
  | "reel"
  | "print"
  | "code"
  | "door-shut"
  | "password"
  | "adds"
  | "storage";

export type Item = {
  key: string;
  /** null for the account's own (storage). */
  eventId: string | null;
  kind: ItemKind;
  /** The step, the event not named: "2 people at the door". */
  line: string;
  /** Its act, a verb: "Let them in". */
  act: string;
  /** Someone waits (amber), something to set up (quiet), the account (amber outline). */
  tone: "waiting" | "setup" | "warning";
  /** Days from today to the event (0 on the day); 0 for the account's. */
  days: number;
  /** Lower first: see `rankOf`. */
  rank: number;
};

/**
 * ★ THE ORDER OF IMPORTANCE, IN ONE PLACE. People standing at a door now; a
 * party on its day; a party tonight or tomorrow that is not ready (or needs
 * its code printed); a full shelf; a party inside the week that is not ready;
 * a queue to review; a party further off that is not ready. Nearer first
 * inside a rank.
 */
function rankOf(kind: ItemKind, phase: Phase, days: number): number {
  if (kind === "door") return 0;
  if (phase === "live") return 1;
  if (kind === "storage") return 3;
  if (phase === "before") return days <= 1 ? 2 : days <= WEEK_DAYS ? 4 : 6;
  return 5;
}

const word = (n: number, one: string, many: string) =>
  `${formatCount(n)} ${n === 1 ? one : many}`;

/**
 * THE EVENT'S ONE ITEM TODAY, or nothing. Production's queue rule speaks
 * first (people at the door, then the review queue, then paused uploads and a
 * reel one photo short), but only where the phase lets it: paused on a party
 * long over is how a host finishes one. Before the date, the first essential
 * readiness leaves undone (a door nobody can pass, a password not set,
 * uploads paused, the code never opened), then the code printed the day
 * before. What is merely worth doing (the first photos, the welcome) is the
 * hub's checklist's to say, never the dashboard's.
 */
export function itemFor(e: DashEvent, host: Host): Item | null {
  const phase = phaseOf(e.date, host.today);
  const days = e.date ? daysFrom(host.today, e.date) : 0;
  const make = (
    kind: ItemKind,
    line: string,
    act: string,
    tone: Item["tone"],
  ): Item => ({
    key: `${kind}:${e.id}`,
    eventId: e.id,
    kind,
    line,
    act,
    tone,
    days,
    rank: rankOf(kind, phase, days),
  });

  const queue = nextStepForEvent(
    {
      id: e.id,
      name: e.name,
      waiting: e.facts.waiting,
      pending: e.facts.pending,
      acceptingUploads: e.facts.acceptingUploads,
      showReel: e.showReel,
      liveReelEnabled: true,
      reelItems: e.facts.approved,
      eventDate: e.date,
    },
    host.today,
  );
  if (queue?.kind === "door")
    return make(
      "door",
      `${peopleWaiting(e.facts.waiting)} at the door`,
      "Let them in",
      "waiting",
    );
  if (queue?.kind === "review")
    return make(
      "review",
      `${word(e.facts.pending, "upload", "uploads")} to review`,
      "Review",
      "waiting",
    );

  if (phase === "live") {
    if (queue?.kind === "paused")
      return make("paused", "Uploads are paused", "Open uploads", "setup");
    if (queue?.kind === "reel")
      return make(
        "reel",
        "1 more photo starts the reel",
        "Add a photo",
        "setup",
      );
    return null;
  }

  if (phase !== "before") return null;

  const left = readiness(readyFacts(e, host)).left.find(
    (i) => i.essential && i.id !== "room",
  );
  if (left?.id === "door")
    return e.door === "password"
      ? make("password", "No password set", "Set it", "setup")
      : make("door-shut", "Nobody can get in yet", "Choose", "setup");
  if (left?.id === "adds")
    return make("adds", "Uploads are paused", "Open uploads", "setup");
  if (left?.id === "code")
    return make("code", "Code never opened", "Invite", "setup");
  if (queue?.kind === "print")
    return make("print", "Print the code", "Print", "setup");
  return null;
}

/** The account's own item: a shelf past the dashboard's own threshold. */
function storageItem(host: Host): Item | null {
  const pct = storagePct(host);
  if (pct <= STORAGE_STEP_PCT) return null;
  return {
    key: "storage",
    eventId: null,
    kind: "storage",
    line: `${pct}% of your storage used`,
    act: "See plans",
    tone: "warning",
    days: 0,
    rank: rankOf("storage", "before", 0),
  };
}

/** Every item the host has today, most important first. */
export function itemsOf(host: Host): Item[] {
  const items = host.events
    .map((e) => itemFor(e, host))
    .filter((i): i is Item => i !== null);
  const storage = storageItem(host);
  if (storage) items.push(storage);
  // A stable sort: equal rank and distance keep the account's own order.
  return items
    .map((item, i) => ({ item, i }))
    .sort(
      (a, b) =>
        a.item.rank - b.item.rank ||
        Math.abs(a.item.days) - Math.abs(b.item.days) ||
        a.i - b.i,
    )
    .map(({ item }) => item);
}

/* ── the event that leads ────────────────────────────────────────────────── */

/**
 * ★ THE MOMENT: the event a stage leads with. The one on its day (the busiest
 * if two share it: people waiting, then photos landing); else the nearest
 * inside the after-party month either way, a day behind weighing a day and a
 * half ahead, so tomorrow outranks last night; else the next one coming; else
 * the newest past, as a memory. Undated events never lead (nothing says when
 * they are).
 */
export function momentEvent(
  host: Host,
): { event: DashEvent; phase: Phase } | null {
  const dated = host.events.filter((e) => e.date !== null);
  const at = (e: DashEvent) => daysFrom(host.today, e.date!);

  const today = dated
    .filter((e) => at(e) === 0)
    .sort(
      (a, b) =>
        b.facts.waiting - a.facts.waiting || b.facts.fresh - a.facts.fresh,
    );
  if (today[0]) return { event: today[0], phase: "live" };

  const weight = (d: number) => (d >= 0 ? d : -d * 1.5);
  const near = dated
    .filter((e) => Math.abs(at(e)) <= AFTER_DAYS)
    .sort((a, b) => weight(at(a)) - weight(at(b)));
  if (near[0])
    return { event: near[0], phase: phaseOf(near[0].date, host.today) };

  const ahead = dated.filter((e) => at(e) > 0).sort((a, b) => at(a) - at(b));
  if (ahead[0]) return { event: ahead[0], phase: "before" };

  const behind = dated.filter((e) => at(e) < 0).sort((a, b) => at(b) - at(a));
  if (behind[0]) return { event: behind[0], phase: "past" };
  return null;
}

/* ── what reaches the page, and what the bell holds ─────────────────────── */

export type Rule = "bell" | "week" | "three";

/** Events inside the week either way, nearest first: what the `week` rule draws. */
export function weekEvents(host: Host): DashEvent[] {
  return host.events
    .filter(
      (e) => e.date && Math.abs(daysFrom(host.today, e.date)) <= WEEK_DAYS,
    )
    .sort(
      (a, b) =>
        Math.abs(daysFrom(host.today, a.date!)) -
          Math.abs(daysFrom(host.today, b.date!)) ||
        daysFrom(host.today, b.date!) - daysFrom(host.today, a.date!),
    );
}

/**
 * WHAT THE PAGE SHOWS, BY RULE.
 *  - `bell`: nothing as a list; the events wear their marks and the bell
 *    lists every item.
 *  - `week`: the items of the parties inside the week (the drawing shows
 *    every party there, ready or not), and people waiting at any door, since
 *    a person standing at one is never "older"; queues on parties past the
 *    week stay in the bell.
 *  - `three`: the three most important, whatever they belong to.
 */
export function pageItems(host: Host, rule: Rule): Item[] {
  const all = itemsOf(host);
  if (rule === "bell") return [];
  if (rule === "three") return all.slice(0, 3);
  const near = new Set(weekEvents(host).map((e) => e.id));
  return all.filter(
    (i) =>
      i.kind === "door" ||
      i.kind === "storage" ||
      (i.eventId !== null && near.has(i.eventId)),
  );
}

/**
 * WHAT THE BELL LISTS, BY RULE: one list, so the page never holds an item the
 * bell does not. Under `week` it is production's bell, unchanged (people at a
 * door and the review queues, each a row naming its event), because the page
 * holds the near setup steps; under `bell` and `three` it is every item, in
 * the page's own order, so the page's three are the bell's first three.
 */
export function bellItems(host: Host, rule: Rule): Item[] {
  const all = itemsOf(host);
  if (rule === "week")
    return all.filter((i) => i.kind === "door" || i.kind === "review");
  return all;
}

/* ── the collection, by when ─────────────────────────────────────────────── */

export type Season = {
  id: string;
  label: string;
  events: DashEvent[];
  /** How large its tiles draw: the near ones large, the old years folded. */
  size: "large" | "medium" | "small" | "folded";
};

/**
 * GROUPED BY WHEN: what is coming (soonest first), what just happened (the
 * after-party month, newest first), the rest of this year, then each earlier
 * year, folded. The tiles shrink as the photographs age, so forty events
 * never draw as one wall of equal covers.
 */
export function seasonsOf(host: Host): Season[] {
  const at = (e: DashEvent) => (e.date ? daysFrom(host.today, e.date) : 0);
  const year = host.today.slice(0, 4);
  const coming = host.events
    .filter((e) => !e.date || at(e) >= 0)
    .sort((a, b) => at(a) - at(b));
  const recent = host.events
    .filter((e) => e.date && at(e) < 0 && -at(e) <= AFTER_DAYS)
    .sort((a, b) => at(b) - at(a));
  const older = host.events
    .filter((e) => e.date && -at(e) > AFTER_DAYS)
    .sort((a, b) => at(b) - at(a));
  const thisYear = older.filter((e) => e.date!.startsWith(year));
  const years = [...new Set(older.map((e) => e.date!.slice(0, 4)))]
    .filter((y) => y !== year)
    .sort((a, b) => b.localeCompare(a));
  const out: Season[] = [];
  // ★ THE LARGEST TILES GO TO THE FRESHEST PHOTOGRAPHS: a party just past is
  // where the album is full and new, so it draws largest; a party still to
  // come has only its date, which reads as well a size smaller.
  if (coming.length)
    out.push({
      id: "coming",
      label: "Coming up",
      events: coming,
      size: "medium",
    });
  if (recent.length)
    out.push({
      id: "recent",
      label: "Just past",
      events: recent,
      size: "large",
    });
  if (thisYear.length)
    out.push({
      id: `year-${year}`,
      label: `Earlier in ${year}`,
      events: thisYear,
      size: "small",
    });
  for (const y of years)
    out.push({
      id: `year-${y}`,
      label: y,
      events: older.filter((e) => e.date!.startsWith(y)),
      size: "folded",
    });
  return out;
}

/** Every event newest first by its date (undated first), for the cover wall and the list. */
export function byDate(host: Host): DashEvent[] {
  const key = (e: DashEvent) => e.date ?? "9999-12-31";
  return [...host.events].sort((a, b) => key(b).localeCompare(key(a)));
}

/** The photographs an album holds in all, for a folded year's line. */
export const photosIn = (events: readonly DashEvent[]) =>
  events.reduce((n, e) => n + e.facts.approved, 0);
