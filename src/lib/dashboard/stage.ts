import { lastDayOf } from "@/lib/events/dates";
import type { ReadyFacts } from "@/lib/events/readiness";
import {
  readiness,
  readyHead,
  settingsReadiness,
  settingsSteps,
} from "@/lib/events/readiness";
import { formatCount } from "@/lib/format/count";

import type { Item, ItemTarget } from "./attention";
import type { HomeContext, HomeEvent } from "./home-event";
import {
  type Dated,
  daysFrom,
  daysToEvent,
  longDate,
  longDays,
  type Phase,
  WEEK_DAYS,
  whenOf,
} from "./when";

/**
 * THE STAGE'S WORDS, AS PURE FUNCTIONS (host-dashboard r1, `purpose=stage`): a phase, a name, a date,
 * the few numbers that move, and the event's own acts. The drawing (`components/app/dashboard/stage.tsx`)
 * lays them out; what they say is decided here and pinned (`stage.test.ts`).
 *
 * ★ THE STEP IS THE ITEM'S, THE STATE IS THE STAGE'S. What the stage asks of the host (Let them in,
 * Review, Invite, Print) is its event's one item (`attention.ts`); its numbers and its ticks are state
 * and always show, so two people waiting read with the needs-you dot beside the act that lets them in.
 */

/**
 * THE LIVE WALL'S SIZE: the newest nine at a desk (the newest drawn four cells large, eight beside it),
 * the newest three in a hand. A wall needs a wall's worth, so a morning's first few stand calm until
 * nine have landed.
 */
export const WALL_PHOTOS = 9;

/** A photograph on the stage: its id and a short-lived presigned url. Never a key. */
export type StagePhoto = { id: string; url: string };

/** The words over the name: when it is, and whether it is live now. */
export type StageWords = {
  /** "Live tonight", "Tomorrow", "In 12 days", "Yesterday", "No date yet". */
  word: string;
  /** The breathing dot: photographs are landing, or a dated party's evening has come. */
  live: boolean;
  /** Approved arrivals in the last hour, said beside a live word; null when none or not live. */
  pulse: number | null;
};

export function stageWordsOf(
  e: HomeEvent,
  phase: Phase,
  ctx: HomeContext,
): StageWords {
  if (phase === "live") {
    const landing = e.arrivals.lastHour > 0;
    // ★ TONIGHT ONLY FOR A DATE THE HOST SET: an undated album that is busy today has a day by its
    // photographs, and a claim about its evening would be a guess.
    const tonight = e.date !== null && ctx.evening;
    const live = landing || tonight;
    const day = tonight ? "tonight" : "today";
    return {
      word: live ? `Live ${day}` : tonight ? "Tonight" : "Today",
      live,
      pulse: landing ? e.arrivals.lastHour : null,
    };
  }
  if (!e.date) return { word: "No date yet", live: false, pulse: null };
  // ★ A RANGE COUNTS DOWN TO ITS FIRST DAY AND DATES ITS PAST FROM ITS LAST (lane `event-dates`): the line
  // under the name says the whole range, so the word over it says only how near its edge is.
  if (phase === "before") {
    const d = daysFrom(ctx.today, e.date);
    return {
      word:
        d < WEEK_DAYS ? whenOf(e.date, ctx.today) : `In ${formatCount(d)} days`,
      live: false,
      pulse: null,
    };
  }
  return {
    word: whenOf(lastDayOf(e.date, e.endDate) ?? e.date, ctx.today),
    live: false,
    pulse: null,
  };
}

/**
 * The line under the name: the date in full ("Friday, October 2"), a range's two days in full ("Friday, October 2 –
 * Sunday, October 4"), or null for an undated event (its words say so).
 */
export function stageDateLine(e: HomeEvent, today: string): string | null {
  if (!e.date) return null;
  const last = lastDayOf(e.date, e.endDate);
  return last && last !== e.date
    ? longDays(e.date, last, today)
    : longDate(e.date, today);
}

export type StageNumber = {
  key: "album" | "guests" | "door" | "review";
  label: string;
  value: number;
  tone?: "waiting";
};

/**
 * THE NUMBERS THAT MOVE, by phase: what is in the album, who came, who waits at the door, what waits on
 * review. Before its day an event is its ticks instead (`stageTicksOf`), whatever it already holds.
 * The album's number is "in the album", never "photos": it counts videos too.
 */
export function stageNumbersOf(
  e: HomeEvent,
  phase: Phase,
  guests: number | null,
): StageNumber[] {
  if (phase === "before") return [];
  const out: StageNumber[] = [
    { key: "album", label: "in the album", value: e.approved },
  ];
  if (guests !== null)
    out.push({
      key: "guests",
      label: guests === 1 ? "guest" : "guests",
      value: guests,
    });
  if (e.waiting > 0)
    out.push({
      key: "door",
      label: "at the door",
      value: e.waiting,
      tone: "waiting",
    });
  if (e.pending > 0)
    out.push({
      key: "review",
      label: "to review",
      value: e.pending,
      tone: "waiting",
    });
  return out;
}

export type StageTick = { id: string; word: string; done: boolean };

const TICK_WORDS: Record<string, string> = {
  door: "Door",
  adds: "Uploads",
  code: "Code",
  room: "Room",
};

/**
 * Readiness's essentials as ticks, a word each: what a guest needs, read off production's one function
 * (`readiness`), so a tick here is a tick in the hub's checklist and in Settings.
 */
export function stageTicksOf(facts: ReadyFacts | null): {
  ticks: StageTick[];
  ready: boolean;
} | null {
  if (!facts) return null;
  const r = readiness(facts);
  return {
    ticks: r.items
      .filter((i) => i.essential)
      .map((i) => ({
        id: i.id,
        word: TICK_WORDS[i.id] ?? i.title,
        done: i.done,
      })),
    ready: r.ready,
  };
}

export type StageAct = { label: string; to: ItemTarget };

/**
 * THE STAGE'S ACTS: the event's one item as the act, said with its number where it has one (Let 2 in,
 * Review 18); with nothing asked, the phase's own (Invite before, Open on the night, Share the album
 * after). The second is Open, the event itself, unless the first already is, or the code's Print.
 */
export function stageActsOf(
  e: HomeEvent,
  phase: Phase,
  item: Item | null,
): { primary: StageAct; secondary: StageAct | null } {
  const primary: StageAct =
    item?.kind === "door"
      ? { label: `Let ${formatCount(e.waiting)} in`, to: "guests" }
      : item?.kind === "review"
        ? { label: `Review ${formatCount(e.pending)}`, to: "review" }
        : item
          ? { label: item.act, to: item.to }
          : phase === "after" || phase === "past"
            ? { label: "Share the album", to: "invite" }
            : phase === "before"
              ? { label: "Invite", to: "invite" }
              : { label: "Open", to: "hub" };
  const secondary: StageAct | null =
    item?.kind === "code"
      ? { label: "Print", to: "print" }
      : primary.to === "hub"
        ? null
        : { label: "Open", to: "hub" };
  return { primary, secondary };
}

/* ── The stage before its first photograph (host-dashboard r3, `stage=lit`) ───────────────────────────── */

/**
 * AN EVENT'S OWN LAMP: one of the house's five (`--lamp-1` to `--lamp-5`, light and never UI), picked by its id so it
 * never changes, which lights its stage until its own photographs do (bible 6: "where there is no photograph, light
 * brings color with a source and a direction"). Her photographs take the light over the day the first one lands.
 */
export function lampOf(id: string): 1 | 2 | 3 | 4 | 5 {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return ((h % 5) + 1) as 1 | 2 | 3 | 4 | 5;
}

/** The lamp burns fuller from the week before an event's first day through its last: the day is near. */
export function lampNear(e: Dated, today: string): boolean {
  const d = daysToEvent(e, today);
  return d !== null && d >= 0 && d < WEEK_DAYS;
}

/** Each of Settings' five steps in a word, as the rail lays them flat (`stageTicksOf` says Door, Uploads, Code). */
const RAIL_WORDS: Record<string, string> = {
  door: "Door",
  adds: "Uploads",
  photos: "First photos",
  welcome: "Welcome",
  code: "Code",
};

export type StageRail = {
  steps: { n: number; item: string; word: string; done: boolean }[];
  /** The checklist's own head, in its two states: "Before guests arrive. Guests still need one more thing." */
  head: { title: string; line: string };
};

/**
 * SETTINGS' FIVE STEPS LAID FLAT under an empty stage's name: the steps are
 * Settings' own (`settingsSteps`, room left out), the head is the checklist's (`readyHead`), so a tick here is a tick in
 * the hub and in Settings. Null where readiness's own reads were not made for this event.
 */
export function stageRailOf(facts: ReadyFacts | null): StageRail | null {
  if (!facts) return null;
  return {
    steps: settingsSteps(settingsReadiness(facts)).map((s) => ({
      n: s.n,
      item: s.item,
      word: RAIL_WORDS[s.item] ?? s.title,
      done: s.done,
    })),
    head: readyHead(readiness(facts)),
  };
}

/**
 * Under the plate: how often the code has been opened (scans and views, the host's own included), or the nudge a
 * code that never was needs. Null where the reads were not made.
 */
export function openedLineOf(opened: number | null): string | null {
  if (opened === null) return null;
  if (opened === 0) return "Not opened yet: scan it once from your phone";
  return `Opened ${formatCount(opened)} ${opened === 1 ? "time" : "times"}`;
}
