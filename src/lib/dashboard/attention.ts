import { peopleWaiting } from "@/lib/event/door/words";
import { readiness } from "@/lib/events/readiness";
import { formatCount } from "@/lib/format/count";

import { type HomeContext, type HomeEvent, readyFactsOf } from "./home-event";
import { nextStepForEvent } from "./next-step";
import { daysFrom, phaseOfEvent, WEEK_DAYS } from "./when";

/**
 * WHAT ASKS FOR A HOST'S ATTENTION, AND WHERE (host-dashboard r1, `needs=week`, Will 2026-10-02: "This
 * stacks amazingly with the featured event"). Every event has at most ONE item today, and where it
 * reaches the page is the week's rule: the parties within a week of their date say their one step or
 * their Ready, the stage's event says its own, and a party further off or long over speaks only
 * through a mark on its tile and the bell. That is the whole answer to forty events stacking forty
 * steps: thirty-six of them are not this week.
 *
 * ★ A PARTY LONG OVER SPEAKS ONLY WHEN SOMEONE WAITS (the carried `finished` call): at its door or in
 * its queue. A paused album after its day is the help's own advice followed, how a host finishes a
 * party, never a step, which retires the old band's "Uploads are paused on X" for every party long
 * over.
 *
 * ★ READINESS AND THE QUEUES ARE PRODUCTION'S. What ready means is `lib/events/readiness.ts` (the hub's
 * checklist and Settings' steps), and the queue order is `nextStepForEvent` (people at the door, then
 * the review queue, then paused uploads, a reel one photo short, the code the day before): this file
 * only decides WHICH of them an event says, and WHEN.
 */

export type ItemKind =
  | "door"
  | "review"
  | "paused"
  | "reel"
  | "print"
  | "code"
  | "door-shut"
  | "password"
  | "adds";

/**
 * Where an item's act leads: the Guests room's door, the Review room, a Settings page, the hub, the
 * code on paper, or the code card (Invite). The drawing turns each into its link or its button.
 */
export type ItemTarget =
  | "guests"
  | "review"
  | "door"
  | "adds"
  | "hub"
  | "print"
  | "invite";

export type Item = {
  kind: ItemKind;
  eventId: string;
  /** The step, the event not named: "2 people at the door". */
  line: string;
  /** The same step as a mark on a cover says it: "2 at the door". */
  short: string;
  /** Its act, a verb: "Let them in". */
  act: string;
  to: ItemTarget;
  /** Someone waits (amber), or something to set up (quiet). */
  tone: "waiting" | "setup";
};

const uploads = (n: number) =>
  `${formatCount(n)} ${n === 1 ? "upload" : "uploads"}`;

/**
 * THE EVENT'S ONE ITEM TODAY, or nothing. The queues speak in every phase (people at the door, then the
 * review queue); on its day, paused uploads and a reel one photo short; before its day, the first
 * essential readiness leaves undone (a door nobody can pass, a password not set, uploads paused, the
 * code never opened), then the code printed the day before. What is merely worth doing (the first
 * photos, the welcome) is the hub's checklist's to say, never the dashboard's, and room is the
 * storage ring's.
 */
export function itemFor(e: HomeEvent, ctx: HomeContext): Item | null {
  const phase = phaseOfEvent(e, ctx.today);
  const make = (
    kind: ItemKind,
    line: string,
    act: string,
    to: ItemTarget,
    tone: Item["tone"],
    short = line,
  ): Item => ({ kind, eventId: e.id, line, short, act, to, tone });

  const queue = nextStepForEvent(
    {
      id: e.id,
      name: e.name,
      waiting: e.waiting,
      pending: e.pending,
      acceptingUploads: e.acceptingUploads,
      showReel: e.showReel,
      liveReelEnabled: ctx.liveReelEnabled,
      reelItems: e.playable,
      eventDate: e.date,
    },
    ctx.today,
  );
  if (queue?.kind === "door")
    return make(
      "door",
      `${peopleWaiting(e.waiting)} at the door`,
      "Let them in",
      "guests",
      "waiting",
      `${formatCount(e.waiting)} at the door`,
    );
  if (queue?.kind === "review")
    return make(
      "review",
      `${uploads(e.pending)} to review`,
      "Review",
      "review",
      "waiting",
      `${formatCount(e.pending)} to review`,
    );

  if (phase === "live") {
    if (queue?.kind === "paused")
      return make(
        "paused",
        "Uploads are paused",
        "Open uploads",
        "adds",
        "setup",
      );
    if (queue?.kind === "reel")
      return make(
        "reel",
        "1 more photo starts the reel",
        "Add a photo",
        "hub",
        "setup",
      );
    return null;
  }
  if (phase !== "before") return null;

  const facts = readyFactsOf(e, ctx);
  const left = facts
    ? readiness(facts).left.find((i) => i.essential && i.id !== "room")
    : undefined;
  if (left?.id === "door")
    return e.door === "password"
      ? make("password", "No password set", "Set it", "door", "setup")
      : make("door-shut", "Nobody can get in yet", "Choose", "door", "setup");
  if (left?.id === "adds")
    return make("adds", "Uploads are paused", "Open uploads", "adds", "setup");
  if (left?.id === "code")
    return make("code", "Code never opened", "Invite", "invite", "setup");
  if (queue?.kind === "print")
    return make("print", "Print the code", "Print", "print", "setup");
  return null;
}

/**
 * THIS WEEK: every party within seven days of its date, either way, nearest first (a day ahead before
 * the day behind it). Only a date the host set counts here: the week is about the parties a host is
 * planning and has just thrown, and an undated album that is busy today leads the stage instead
 * (`moment.ts`).
 */
export function weekEvents<T extends HomeEvent>(
  events: readonly T[],
  today: string,
): T[] {
  return events
    .filter(
      (e) => e.date !== null && Math.abs(daysFrom(today, e.date)) <= WEEK_DAYS,
    )
    .sort((a, b) => {
      const da = daysFrom(today, a.date!);
      const db = daysFrom(today, b.date!);
      return Math.abs(da) - Math.abs(db) || db - da;
    });
}

/** A mark on a cover: Live in its top left, one state in its top right. */
export type Marks = {
  live: boolean;
  state: { tone: "waiting" | "setup"; text: string } | null;
};

/**
 * THE MARKS AN EVENT'S TILE WEARS: Live while it is on its day, and, in the other corner, what waits
 * (people at its door, a queue) on any event, or its one step when the week puts it on the page. A
 * party further off keeps its setup to itself, as the page does (the week's rule, in a mark).
 */
export function marksOf(
  e: HomeEvent,
  ctx: HomeContext,
  inWeek: boolean,
): Marks {
  const live = phaseOfEvent(e, ctx.today) === "live";
  const item = itemFor(e, ctx);
  if (!item) return { live, state: null };
  if (item.tone === "waiting")
    return { live, state: { tone: "waiting", text: item.short } };
  return inWeek
    ? { live, state: { tone: "setup", text: item.line } }
    : { live, state: null };
}

/**
 * WHAT A PARTY IN THE WEEK SAYS WHEN NOTHING IS ASKED OF IT: Ready for guests before its day (what a
 * planner looks for on a Friday), and after it the album's count. Ready is readiness's own answer, so
 * a full shelf (room, essential only when full and the ring's to say) never reads as ready.
 */
export function quietLine(e: HomeEvent, ctx: HomeContext): string {
  if (phaseOfEvent(e, ctx.today) === "before") {
    const facts = readyFactsOf(e, ctx);
    if (!facts) return "";
    return readiness(facts).ready ? "Ready for guests" : "Your storage is full";
  }
  return e.approved > 0
    ? `${formatCount(e.approved)} in the album`
    : "Nothing in the album yet";
}
