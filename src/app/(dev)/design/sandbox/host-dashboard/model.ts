import type { EventListRow, EventSeason } from "@/lib/dashboard/events-view";
import { sortEventRows } from "@/lib/dashboard/events-view";
import {
  buildHomeView,
  type HomeInput,
  type HomeView,
  type HostedEvent,
} from "@/lib/dashboard/home-view";
import { momentEvent } from "@/lib/dashboard/moment";
import {
  AFTER_DAYS,
  dayOf,
  daysFrom,
  phaseOfEvent,
  WEEK_DAYS,
} from "@/lib/dashboard/when";
import { eventUrl } from "@/lib/events/share-urls";

import type { Host } from "./fixtures";

/**
 * THE BOARD'S RULES, PURE, AND PRODUCTION'S WHEREVER PRODUCTION HAS ONE.
 *
 * The page is production's composition (`buildHomeView`) over production's
 * rules (`momentEvent`, `seasonsOf`, `weekEvents`, `marksOf`); this file adds
 * only what a round-two option changes: which event leads on a quiet day, the
 * host's own pick, and how the collection lays the same rows out (a Recent row,
 * a Display menu, a list for the past). `model.test.ts` holds that the page as
 * built is production's to the byte.
 */

export const SITE = "https://partyreel.com";

/* ── the answers a frame is drawn in ──────────────────────────────────── */

/** How the collection works at forty (`events`). */
export type EventsWay = "built" | "recent" | "display" | "index";
/** What the stage leads with on a quiet day (`lead`). */
export type QuietRule = "time" | "made" | "left" | "rest";
/** Whether she can choose the stage's event herself (`pick`). */
export type PickWay = "none" | "kept" | "step";

export type Answers = { events: EventsWay; lead: QuietRule; pick: PickWay };

/* ── which event leads ────────────────────────────────────────────────── */

/** Within `days` of the viewer's day, by the event's own day (`dayOf`). */
function within(e: HostedEvent, today: string, days: number): boolean {
  const day = dayOf(e);
  return day !== null && Math.abs(daysFrom(today, day)) <= days;
}

const newestMade = (a: HostedEvent, b: HostedEvent) =>
  Date.parse(b.createdAt) - Date.parse(a.createdAt);

/**
 * THE QUIET DAY'S RULE. Production's moment decides whenever time can (a party
 * on its day, else the nearest within a month); a quiet day is one where it
 * cannot, and each rule answers it its own way:
 *  - `time`, as built: the next dated party however far, else the album photos
 *    last landed in, else the newest made (`moment.ts`'s steps 3 to 5);
 *  - `made`: the event she made last, dated or not;
 *  - `left`: a party within a week still leads; otherwise the event she last
 *    opened (a new event counts as opened: Create lands her in it);
 *  - `rest`: time's own pick, drawn as one line rather than a stage from nine
 *    events (`rests`), so a planner's events lead a quiet day's page.
 */
export function ruleLead(
  rule: QuietRule,
  host: Pick<Host, "hosted" | "ctx">,
  trail: readonly string[],
): HostedEvent | null {
  const { hosted, ctx } = host;
  const moment = momentEvent(hosted, ctx.today)?.event ?? null;
  if (!moment || rule === "time" || rule === "rest") return moment;
  if (rule === "made") {
    if (within(moment, ctx.today, AFTER_DAYS)) return moment;
    return [...hosted].sort(newestMade)[0] ?? moment;
  }
  if (within(moment, ctx.today, WEEK_DAYS)) return moment;
  const last = trail
    .map((id) => hosted.find((e) => e.id === id))
    .find((e): e is HostedEvent => Boolean(e));
  return last ?? moment;
}

/**
 * WHETHER THE STAGE RESTS (`rest`): on a quiet day, for a host with nine events
 * or more (the round's threshold, `NEW_PIECES_FROM`), the stage folds to one
 * line. Under nine, and on any day time can speak, it stands as built: a host
 * with one wedding keeps the page that is that party.
 */
export function rests(
  rule: QuietRule,
  host: Pick<Host, "hosted" | "ctx">,
): boolean {
  if (rule !== "rest" || host.hosted.length < NEW_PIECES_FROM) return false;
  const moment = momentEvent(host.hosted, host.ctx.today)?.event;
  return Boolean(moment) && !within(moment!, host.ctx.today, AFTER_DAYS);
}

/** Whether a party is on its own day: the one thing a pick never overrides. */
export function partyOnItsDay(host: Pick<Host, "hosted" | "ctx">): boolean {
  return host.hosted.some((e) => phaseOfEvent(e, host.ctx.today) === "live");
}

/**
 * THE STAGE'S CONTENDERS, for a host who steps through them (`pick=step`) or
 * picks one (`pick=kept`): the rule's lead, then the next dated party, the
 * newest made and the album photos last landed in, each once.
 */
export function contenders(
  rule: QuietRule,
  host: Pick<Host, "hosted" | "ctx">,
  trail: readonly string[],
  count = 3,
): HostedEvent[] {
  const { hosted, ctx } = host;
  const lead = ruleLead(rule, host, trail);
  const next = hosted
    .filter((e) => e.date !== null && daysFrom(ctx.today, e.date) > 0)
    .sort((a, b) => a.date!.localeCompare(b.date!))[0];
  const made = [...hosted].sort(newestMade)[0];
  const photos = hosted
    .filter((e) => e.lastArrival !== null)
    .sort((a, b) => b.lastArrival!.at.localeCompare(a.lastArrival!.at))[0];
  const out: HostedEvent[] = [];
  for (const e of [lead, next, made, photos, ...hosted])
    if (e && !out.some((x) => x.id === e.id)) out.push(e);
  return out.slice(0, count);
}

/* ── the page, around a lead ──────────────────────────────────────────── */

const DECOY = "hd-decoy";

export function homeInput(host: Host, leadId?: string | null): HomeInput {
  const lead = host.hosted.find((e) => e.id === leadId) ?? null;
  const phase = lead ? phaseOfEvent(lead, host.ctx.today) : null;
  return {
    ctx: host.ctx,
    hosted: host.hosted,
    guests: host.guests,
    deleted: host.deleted,
    siteUrl: SITE,
    // The page reads who came for the stage alone, and only once it has had a day.
    stageReads: lead
      ? {
          id: lead.id,
          photos: null,
          guests: phase === "before" ? null : (host.people[lead.id] ?? 0),
        }
      : null,
  };
}

/**
 * THE PAGE AROUND A LEAD: production's own `buildHomeView` when the lead is the
 * one production picks, and otherwise production's composition with that event
 * on the stage. ★ NOTHING IS COMPOSED TWICE: the second case asks
 * `buildHomeView` for the page with a DECOY on the stage (an event dated today
 * and busier than any, so production's moment always leads with it), which
 * draws every real event as a row, a week card and a group member through
 * production's own rules; the chosen lead is then lifted out of the rows, the
 * week and its group, exactly as production leaves its own lead out.
 */
export function homeAround(host: Host, leadId: string | null): HomeView {
  const base = buildHomeView(homeInput(host, leadId));
  const lead = host.hosted.find((e) => e.id === leadId);
  if (!lead || base.stage?.event.id === lead.id) return base;
  return lifted(host, lead);
}

/**
 * The page with `lead` on the stage, by way of the decoy. Exported for the
 * test that holds it to production: lifted around production's own lead, it IS
 * production's page.
 */
export function lifted(host: Host, lead: HostedEvent): HomeView {
  const input = homeInput(host, lead.id);
  const decoy: HostedEvent = {
    ...lead,
    id: DECOY,
    date: host.ctx.today,
    waiting: Number.MAX_SAFE_INTEGER,
  };
  const wide = buildHomeView({
    ...input,
    hosted: [...host.hosted, decoy],
    stageReads: null,
  });
  const reads = input.stageReads?.id === lead.id ? input.stageReads : null;
  return {
    ...wide,
    stage: {
      event: lead,
      photos: lead.stills.map((url, i) => ({ id: `${lead.id}:${i}`, url })),
      guests: reads?.guests ?? null,
      share: { joinUrl: eventUrl(SITE, lead.qrToken), qrStyle: lead.qrStyle },
    },
    week: wide.week.filter((c) => c.id !== lead.id),
    events: {
      ...wide.events,
      rows: wide.events.rows.filter(
        (r) => !(r.kind === "hosted" && r.id === lead.id),
      ),
      seasons: wide.events.seasons
        .map((s) => ({ ...s, ids: s.ids.filter((id) => id !== lead.id) }))
        .filter((s) => s.ids.length > 0),
    },
  };
}

/* ── the collection, laid out ─────────────────────────────────────────── */

/** From this many events the round's new pieces show, with the search (`EVENTS_SEARCH_FROM`). */
export const NEW_PIECES_FROM = 9;

/** How many events the Recent row holds. */
export const RECENT_MAX = 6;

/**
 * THE RECENT ROW: the events she opened lately, newest first, as the rows the
 * collection already draws; never the stage's own event or one in This week,
 * which already stand above it.
 */
export function recentRows(
  view: HomeView,
  trail: readonly string[],
  max = RECENT_MAX,
): EventListRow[] {
  const above = new Set([
    ...(view.stage ? [view.stage.event.id] : []),
    ...view.week.map((c) => c.id),
  ]);
  const out: EventListRow[] = [];
  for (const id of trail) {
    if (above.has(id) || out.some((r) => r.id === id)) continue;
    const row = view.events.rows.find(
      (r) => r.id === id && r.kind !== "deleted",
    );
    if (row) out.push(row);
  }
  return out.slice(0, max);
}

export type Show = "covers" | "list";
export type Grouping = "when" | "year" | "none";
export type Order = "date" | "name" | "waiting";
export type Display = { show: Show; group: Grouping; order: Order };

export const DISPLAY_DEFAULT: Display = {
  show: "covers",
  group: "when",
  order: "date",
};

/** One group as an option lays it out: its words, how large its tiles draw, its rows. */
export type Laid = {
  id: string;
  label: string;
  size: "large" | "medium" | "small";
  rows: EventListRow[];
};

type Days = ReadonlyMap<string, string | null>;

/** Newest day first, the undated first of all (they are still being set up). */
function byDay(rows: readonly EventListRow[], days: Days): EventListRow[] {
  const key = (r: EventListRow) => days.get(r.id) ?? "9999";
  return [...rows].sort((a, b) => key(b).localeCompare(key(a)));
}

function ordered(
  rows: readonly EventListRow[],
  order: Order,
  days: Days,
): EventListRow[] {
  // Name and Most waiting are production's own orders (`sortEventRows`).
  return order === "date"
    ? byDay(rows, days)
    : sortEventRows([...rows], order === "name" ? "name" : "waiting");
}

/**
 * THE DISPLAY MENU'S LAYOUT: the rows grouped by when (production's groups,
 * every year open), by year, or not at all, in her order. By when, the date
 * order is each group's own (production's, by when).
 */
export function displayGroups(
  rows: readonly EventListRow[],
  seasons: readonly EventSeason[],
  days: Days,
  d: Display,
): Laid[] {
  if (d.group === "none")
    return [
      {
        id: "all",
        label: "Every event",
        size: "small",
        rows: ordered(rows, d.order, days),
      },
    ];
  if (d.group === "year") {
    const yearOf = (r: EventListRow) =>
      days.get(r.id)?.slice(0, 4) ?? "No date";
    const years = [...new Set(rows.map(yearOf))].sort((a, b) =>
      a === "No date" ? -1 : b === "No date" ? 1 : b.localeCompare(a),
    );
    return years.map((y) => ({
      id: `y-${y}`,
      label: y === "No date" ? "No date yet" : y,
      size: "small",
      rows: ordered(
        rows.filter((r) => yearOf(r) === y),
        d.order,
        days,
      ),
    }));
  }
  const byKey = new Map(rows.map((r) => [`${r.kind}-${r.id}`, r]));
  return seasons
    .map((s) => {
      const inIt = s.ids
        .map((id) =>
          byKey.get(`${s.id === "guest" ? "guest" : "hosted"}-${id}`),
        )
        .filter((r): r is EventListRow => Boolean(r));
      return {
        id: s.id,
        label: s.label,
        size: s.size === "folded" ? ("small" as const) : s.size,
        rows: d.order === "date" ? inIt : ordered(inIt, d.order, days),
      };
    })
    .filter((g) => g.rows.length > 0);
}

/** The list's own orders, by its column heads. */
export type ListSort = "date" | "name" | "size";

/**
 * COVERS NEAR, A LIST FOR THE PAST: what is coming and what just happened stay
 * production's groups of covers; everything older, and the events she added
 * to, is one list, filtered by year and sorted by a column.
 */
export function indexOf(
  rows: readonly EventListRow[],
  seasons: readonly EventSeason[],
  days: Days,
): { near: Laid[]; past: EventListRow[]; years: string[] } {
  const near = displayGroups(
    rows,
    seasons.filter((s) => s.id === "coming" || s.id === "recent"),
    days,
    DISPLAY_DEFAULT,
  );
  const nearIds = new Set(near.flatMap((g) => g.rows.map((r) => r.id)));
  const past = byDay(
    rows.filter((r) => !nearIds.has(r.id)),
    days,
  );
  const years = [...new Set(past.map((r) => days.get(r.id)?.slice(0, 4) ?? ""))]
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a));
  return { near, past, years };
}

export function sortList(
  rows: readonly EventListRow[],
  sort: ListSort,
  days: Days,
): EventListRow[] {
  if (sort === "date") return byDay(rows, days);
  if (sort === "name") return sortEventRows([...rows], "name");
  return [...rows].sort((a, b) => b.items - a.items);
}
