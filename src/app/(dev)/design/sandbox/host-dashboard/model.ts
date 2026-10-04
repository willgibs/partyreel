import {
  type EventListRow,
  type EventsFilter,
  filterEventRows,
  searchEventRows,
} from "@/lib/dashboard/events-view";
import { itemFor, quietLine } from "@/lib/dashboard/attention";
import {
  buildHomeView,
  type HomeInput,
  type HomeView,
  type HostedEvent,
  type WeekCard,
} from "@/lib/dashboard/home-view";
import { momentEvent } from "@/lib/dashboard/moment";
import {
  dayOf,
  daysFrom,
  phaseOfEvent,
  WEEK_DAYS,
  whenOf,
} from "@/lib/dashboard/when";
import { MAX_EVENTS } from "@/lib/constants/tiers";
import { eventUrl } from "@/lib/events/share-urls";
import { formatCount } from "@/lib/format/count";

import type { Host } from "./fixtures";

/**
 * THE BOARD'S RULES, PURE, AND PRODUCTION'S WHEREVER PRODUCTION HAS ONE.
 *
 * The page is production's composition (`buildHomeView`) over production's
 * rules (`momentEvent`, `seasonsOf`, `weekEvents`, `marksOf`); this file adds
 * only what the board draws that production does not have yet: which event
 * the stage features by the host's rule and the fact that picked it (round
 * four's chooser), how her events lay out (round three's Display menu, drawn
 * as settled), the Recent row, the words of a range of days (`event-dates`),
 * and the details H6 draws the other way. `model.test.ts` holds that the page
 * around production's own lead is production's to the byte.
 */

export const SITE = "https://partyreel.com";

/* ── the answers a frame is drawn in ──────────────────────────────────── */

/**
 * How a host chooses what leads her stage (`chooser`, round four): the
 * corner's glass, the stage's own words, or a deck she turns.
 */
export type ChooserWay = "corner" | "words" | "deck";
/** The dashboard's details as built, or one of them the other way (`details`, H6). */
export type DetailsWay = "built" | "week" | "count" | "limit" | "ring";

export type Answers = { chooser: ChooserWay; details: DetailsWay };

/* ── the feature's rule ───────────────────────────────────────────────── */

export type RuleId = "newest" | "upcoming" | "opened" | "photos";

/**
 * THE RULES A HOST CHOOSES AMONG (his r2 note on `pick`: "Rather than directly
 * selecting an event, these could be more like sort options, such as: newest,
 * last opened, upcoming, etc."). Each is a sentence she can predict, and a
 * party on its own day leads under every one of them (the live wall, settled).
 * `newest` is the default and is the settled `lead=made` as `event-dates`
 * wires it: a party within a month first, else the newest made.
 */
export const RULES: readonly { id: RuleId; label: string; line: string }[] = [
  {
    id: "newest",
    label: "Newest",
    line: "Your newest, or a party within a month",
  },
  { id: "upcoming", label: "Upcoming", line: "Your next party by its date" },
  { id: "opened", label: "Last opened", line: "The event you were in last" },
  { id: "photos", label: "Latest photos", line: "Where photos last landed" },
];

export const ruleLabel = (id: RuleId): string =>
  RULES.find((r) => r.id === id)?.label ?? id;

const newestMade = (a: HostedEvent, b: HostedEvent) =>
  Date.parse(b.createdAt) - Date.parse(a.createdAt);

const AFTER = 30;

/**
 * WHAT A RULE READ TO PICK ITS EVENT: the step of `leadWhyOf` that decided,
 * kept beside the event so every drawing of the chooser says the same true
 * thing about why an event leads (the fresh-eyes pass, round four: "one false
 * reason breaks the idea").
 */
export type Why =
  /** A party on its own day: it leads whatever the rule. */
  | "live"
  /** Newest: a party within a month, by its nearest day. */
  | "near"
  /** The event she made last: Newest's own, and every rule's fallback. */
  | "made"
  /** Upcoming: the soonest dated party ahead. */
  | "next"
  /** Last opened: the event she was in last. */
  | "opened"
  /** Latest photos: the album photographs last landed in. */
  | "photos";

export type Lead = {
  /** The rule that read it. */
  rule: RuleId;
  event: HostedEvent;
  why: Why;
  /** The rule found nothing of its own kind and led with her newest. */
  fellBack: boolean;
  /** The day the fact is about (the party's nearest day, its date, the photos' day), else null. */
  day: string | null;
};

/**
 * THE STAGE'S EVENT UNDER A RULE, AND WHY. A party on its own day always
 * leads (a host date first, then an undated album landing today:
 * `momentEvent`'s first step); every other day, the rule:
 *  - `newest`: production's moment within a month (the nearest party either
 *    way), else the newest made (`lead=made`, settled);
 *  - `upcoming`: the soonest dated party ahead, else the newest made;
 *  - `opened`: the event she was in last (Create lands her in a new one, so a
 *    new event counts as opened), else the newest made;
 *  - `photos`: the album photographs last landed in, else the newest made.
 */
export function leadWhyOf(
  host: Pick<Host, "hosted" | "ctx">,
  rule: RuleId,
  trail: readonly string[],
): Lead | null {
  const { hosted, ctx } = host;
  if (hosted.length === 0) return null;
  const moment = momentEvent(hosted, ctx.today);
  if (moment?.phase === "live")
    return {
      rule,
      event: moment.event,
      why: "live",
      fellBack: false,
      day: ctx.today,
    };
  const newest = [...hosted].sort(newestMade)[0]!;
  const made: Lead = {
    rule,
    event: newest,
    why: "made",
    fellBack: rule !== "newest",
    day: newest.createdAt.slice(0, 10),
  };
  if (rule === "newest") {
    const day = moment ? dayOf(moment.event) : null;
    const near = day !== null && Math.abs(daysFrom(ctx.today, day)) <= AFTER;
    return near
      ? { rule, event: moment!.event, why: "near", fellBack: false, day }
      : made;
  }
  if (rule === "upcoming") {
    const next = hosted
      .filter((e) => e.date !== null && daysFrom(ctx.today, e.date) > 0)
      .sort((a, b) => a.date!.localeCompare(b.date!))[0];
    return next
      ? { rule, event: next, why: "next", fellBack: false, day: next.date }
      : made;
  }
  if (rule === "opened") {
    const last = trail
      .map((id) => hosted.find((e) => e.id === id))
      .find((e): e is HostedEvent => Boolean(e));
    return last
      ? { rule, event: last, why: "opened", fellBack: false, day: null }
      : made;
  }
  const latest = hosted
    .filter((e) => e.lastArrival !== null)
    .sort((a, b) => b.lastArrival!.at.localeCompare(a.lastArrival!.at))[0];
  return latest
    ? {
        rule,
        event: latest,
        why: "photos",
        fellBack: false,
        day: latest.lastArrival!.day,
      }
    : made;
}

/** The stage's event under a rule (`leadWhyOf`'s event). */
export function leadOf(
  host: Pick<Host, "hosted" | "ctx">,
  rule: RuleId,
  trail: readonly string[],
): HostedEvent | null {
  return leadWhyOf(host, rule, trail)?.event ?? null;
}

const SHORT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const SHORT_YEAR = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** A day either side of today in a row's fewest words: today, tomorrow, yesterday, in 18 days, 10 days ago. */
export function nearWords(day: string, today: string): string {
  const d = daysFrom(today, day);
  if (d === 0) return "today";
  if (d === 1) return "tomorrow";
  if (d === -1) return "yesterday";
  return d > 0 ? `in ${d} days` : `${-d} days ago`;
}

/** A day behind today: today, yesterday, else its date (its year once that has gone). */
function pastWords(day: string, today: string): string {
  const d = daysFrom(today, day);
  if (d === 0) return "today";
  if (d === -1) return "yesterday";
  const [y, m, n] = day.split("-").map(Number);
  const at = new Date(Date.UTC(y!, m! - 1, n!));
  return day.slice(0, 4) === today.slice(0, 4)
    ? SHORT.format(at)
    : SHORT_YEAR.format(at);
}

/**
 * THE FACT A RULE READ, in a row's few words after its event's name (the
 * fresh-eyes pass: "the event plus the fact its rule read"): "made yesterday",
 * "in 18 days", "Sat, Dec 12", "opened last", "photos Sep 26", and where the
 * rule found nothing of its own kind, that: "nothing dated ahead".
 */
export function factOf(lead: Lead, today: string): string {
  if (lead.fellBack)
    return lead.rule === "upcoming"
      ? "nothing dated ahead"
      : lead.rule === "photos"
        ? "no photos yet"
        : "nothing opened yet";
  if (lead.why === "live") return "on today";
  if (lead.why === "near") return nearWords(lead.day!, today);
  if (lead.why === "next") return whenFor(lead.event, today);
  if (lead.why === "opened") return "opened last";
  if (lead.why === "photos") return `photos ${pastWords(lead.day!, today)}`;
  return `made ${pastWords(lead.event.createdAt.slice(0, 10), today)}`;
}

/** A rule's row under its name: the event it leads with today, and the fact it read. */
export const leadLine = (lead: Lead, today: string): string =>
  `${lead.event.name} · ${factOf(lead, today)}`;

/** Whether a party is on its own day: the one thing no rule overrides. */
export function partyOnItsDay(host: Pick<Host, "hosted" | "ctx">): boolean {
  return host.hosted.some((e) => phaseOfEvent(e, host.ctx.today) === "live");
}

/* ── an event's when ──────────────────────────────────────────────────── */

/** An event's when in a row's fewest words, a range's included: production's own (`whenOf`). */
export function whenFor(
  e: Pick<HostedEvent, "date" | "endDate">,
  today: string,
): string {
  return whenOf(e.date, today, false, e.endDate);
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
  return !lead || base.stage?.event.id === lead.id ? base : lifted(host, lead);
}

/** The page with `lead` on the stage, by way of the decoy. Exported for the test that holds it to production. */
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

/* ── the dashboard's details, as built or one the other way (H6) ────────── */

/**
 * THE ALBUM COUNT'S WORD: "in the album" as built (`stageNumbersOf`,
 * `quietLine`), since the count holds videos too; the other way names both.
 */
export const COUNT_WORDS = {
  built: "in the album",
  other: "photos and videos",
} as const;

/**
 * THE HEAD'S LINE: how many events and the plan, as built ("1 event · Event
 * Pass": the plan's cap is the ring's and Create's to say); the other way
 * counts against a plan's own limit where it has one ("1 of 1 event").
 */
export function headLine(
  host: Pick<Host, "hosted" | "plan">,
  limit: boolean,
): string {
  const n = host.hosted.length;
  const max = MAX_EVENTS[host.plan.tier];
  const events =
    limit && max !== null
      ? `${formatCount(n)} of ${formatCount(max)} ${max === 1 ? "event" : "events"}`
      : n > 0
        ? `${formatCount(n)} ${n === 1 ? "event" : "events"}`
        : "No events yet";
  return `${events} · ${host.plan.name}`;
}

/**
 * THE WEEK THE OTHER WAY: an album nobody dated whose photos landed within the
 * week joins it, said by its photos' day ("Photos Sun, Nov 8"), beside the dated parties production
 * holds (`weekEvents`: "the week holds dated parties only"), in the week's own
 * order: the nearest first, a day ahead before the same day behind.
 */
export function weekWithUndated(view: HomeView, host: Host): HomeView {
  const today = host.ctx.today;
  const lead = view.stage?.event.id;
  const held = new Set(view.week.map((c) => c.id));
  const joining: WeekCard[] = host.hosted
    .filter(
      (e) =>
        e.date === null &&
        e.lastArrival !== null &&
        e.id !== lead &&
        !held.has(e.id) &&
        Math.abs(daysFrom(today, e.lastArrival.day)) <= WEEK_DAYS,
    )
    .map((e) => ({
      id: e.id,
      name: e.name,
      href: `/dashboard/${e.id}`,
      // Said as its photos' day, never as a date she set (its tile says "No date").
      when: `Photos ${whenOf(e.lastArrival!.day, today)}`,
      coverUrl: e.stills[0] ?? null,
      face: null,
      live: false,
      item: itemFor(e, host.ctx),
      quiet: quietLine(e, host.ctx),
      share: { joinUrl: eventUrl(SITE, e.qrToken), qrStyle: e.qrStyle },
    }));
  if (joining.length === 0) return view;
  const dayOfCard = (id: string) => {
    const e = host.hosted.find((x) => x.id === id);
    return e ? (e.date ?? e.lastArrival?.day ?? today) : today;
  };
  const near = (id: string) => daysFrom(today, dayOfCard(id));
  const week = [...view.week, ...joining].sort(
    (a, b) =>
      Math.abs(near(a.id)) - Math.abs(near(b.id)) || near(b.id) - near(a.id),
  );
  return { ...view, week };
}

/** The count's word the other way, wherever the page says it: the week's quiet lines. */
export function countSaid(view: HomeView, word: string): HomeView {
  return {
    ...view,
    week: view.week.map((c) => ({
      ...c,
      quiet: c.quiet.replace(COUNT_WORDS.built, word),
    })),
  };
}

/* ── the Recent row ───────────────────────────────────────────────────── */

/** How many events the Recent row holds: one row of covers at a desk. */
export const RECENT_MAX = 4;

/**
 * From this many events (hosted and added to) the Recent row shows: below it
 * every event is on the first screen of her events anyway, and a row of the
 * last few would only repeat them.
 */
export const RECENT_FROM = 7;

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

/* ── her events, laid out her way ─────────────────────────────────────── */

export type Layout = "gallery" | "table" | "list";
export type SortKey = "made" | "date" | "opened" | "name" | "photos" | "waiting";
export type WhenFilter = "any" | "upcoming" | "past" | "undated";
export type GroupBy = "none" | "year";
export type TileScale = "s" | "m" | "l";

/** One host's way of seeing her events: kept on her account (the carried `kept`). */
export type Prefs = {
  layout: Layout;
  sort: SortKey;
  /** Newest, latest, largest or Z first; a press on the sort flips it. */
  desc: boolean;
  lens: EventsFilter;
  when: WhenFilter;
  year: string | null;
  group: GroupBy;
  scale: TileScale;
};

/**
 * THE QUIET DEFAULT (his r2 note: "All of these still feel like they're
 * over-organizing"): covers, the newest first, nothing grouped and nothing
 * filtered, so a host with three events sees three covers and nothing to set.
 */
export const PREFS_DEFAULT: Prefs = {
  layout: "gallery",
  sort: "made",
  desc: true,
  lens: "all",
  when: "any",
  year: null,
  group: "none",
  scale: "m",
};

export const SORTS: readonly { id: SortKey; label: string }[] = [
  { id: "made", label: "Newest" },
  { id: "date", label: "Event date" },
  { id: "opened", label: "Last opened" },
  { id: "name", label: "Name" },
  { id: "photos", label: "Most photos" },
  { id: "waiting", label: "Waiting" },
];

export const sortLabel = (id: SortKey): string =>
  SORTS.find((s) => s.id === id)?.label ?? id;

export const WHENS: readonly { id: WhenFilter; label: string }[] = [
  { id: "any", label: "Any time" },
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
  { id: "undated", label: "No date" },
];

/** What a sort and a filter read that a row does not carry: its day, its host's date, her opens. */
export type Facts = {
  /** The day it sits on (`dayOf`, or a guest album's last upload). */
  day: ReadonlyMap<string, string | null>;
  /** Whether its host set a date. */
  dated: ReadonlySet<string>;
  /** Her opens, by recency: 0 is the last she opened. */
  opened: ReadonlyMap<string, number>;
  today: string;
};

export function factsOf(host: Host, trail: readonly string[]): Facts {
  const day = new Map<string, string | null>();
  for (const e of host.hosted) day.set(e.id, dayOf(e));
  for (const g of host.guests) day.set(g.eventId, g.lastUploadAt.slice(0, 10));
  for (const d of host.deleted) day.set(d.id, d.date);
  return {
    day,
    dated: new Set([
      ...host.hosted.filter((e) => e.date !== null).map((e) => e.id),
      ...host.guests.map((g) => g.eventId),
    ]),
    opened: new Map(trail.map((id, i) => [id, i])),
    today: host.ctx.today,
  };
}

const yearOf = (r: EventListRow, f: Facts) =>
  f.day.get(r.id)?.slice(0, 4) ?? null;

/** The years her events sit in, newest first: the filter's chips. */
export function yearsOf(rows: readonly EventListRow[], f: Facts): string[] {
  return [
    ...new Set(rows.map((r) => yearOf(r, f)).filter((y): y is string => !!y)),
  ].sort((a, b) => b.localeCompare(a));
}

function passesWhen(r: EventListRow, w: WhenFilter, f: Facts): boolean {
  if (w === "any") return true;
  const day = f.day.get(r.id) ?? null;
  if (w === "undated") return r.kind === "hosted" && !f.dated.has(r.id);
  if (w === "upcoming") return day === null || daysFrom(f.today, day) >= 0;
  return day !== null && daysFrom(f.today, day) < 0;
}

/** The rows a host's filter keeps: production's lens, then when, then the year. */
export function filtered(
  rows: readonly EventListRow[],
  p: Pick<Prefs, "lens" | "when" | "year">,
  f: Facts,
): EventListRow[] {
  return filterEventRows([...rows], p.lens).filter(
    (r) => passesWhen(r, p.when, f) && (!p.year || yearOf(r, f) === p.year),
  );
}

/**
 * HER ORDER, every key with a direction. A key a row has nothing for (an
 * undated event by date, one she never opened) sorts after the rest either
 * way, and a tie keeps the newest made first, so a sort never shuffles.
 */
export function sorted(
  rows: readonly EventListRow[],
  sort: SortKey,
  desc: boolean,
  f: Facts,
): EventListRow[] {
  const made = (a: EventListRow, b: EventListRow) =>
    a.sortDate < b.sortDate ? 1 : a.sortDate > b.sortDate ? -1 : 0;
  const dir = desc ? -1 : 1;
  const keyed = (
    key: (r: EventListRow) => number | string | null,
  ): ((a: EventListRow, b: EventListRow) => number) => {
    return (a, b) => {
      const x = key(a);
      const y = key(b);
      if (x === null && y === null) return made(a, b);
      if (x === null) return 1;
      if (y === null) return -1;
      if (x < y) return -dir;
      if (x > y) return dir;
      return made(a, b);
    };
  };
  const out = [...rows];
  if (sort === "made") out.sort((a, b) => (desc ? made(a, b) : made(b, a)));
  else if (sort === "date") out.sort(keyed((r) => f.day.get(r.id) ?? null));
  else if (sort === "opened")
    // The last opened is rank 0, so "most recent first" is the smaller rank.
    out.sort(keyed((r) => (f.opened.has(r.id) ? -f.opened.get(r.id)! : null)));
  else if (sort === "name")
    out.sort((a, b) =>
      desc
        ? b.name.localeCompare(a.name, undefined, { numeric: true })
        : a.name.localeCompare(b.name, undefined, { numeric: true }),
    );
  else if (sort === "photos")
    out.sort(keyed((r) => (r.kind === "hosted" ? r.items : null)));
  else out.sort(keyed((r) => r.pending + r.waiting || null));
  return out;
}

export type Group = { id: string; label: string; rows: EventListRow[] };

/** Her events, filtered, sorted and grouped as she set them. */
export function arrange(
  rows: readonly EventListRow[],
  p: Prefs,
  f: Facts,
  query = "",
): Group[] {
  const kept = searchEventRows(filtered(rows, p, f), query);
  const ordered = sorted(kept, p.sort, p.desc, f);
  if (p.group === "none") return [{ id: "all", label: "", rows: ordered }];
  const groups = new Map<string, EventListRow[]>();
  for (const r of ordered) {
    const y = yearOf(r, f) ?? "No date yet";
    groups.set(y, [...(groups.get(y) ?? []), r]);
  }
  return [...groups.entries()].map(([id, list]) => ({
    id,
    label: id,
    rows: list,
  }));
}

/** Prefs that differ from the quiet default: what a Display button counts and a line names. */
export function changed(p: Prefs): string[] {
  const out: string[] = [];
  if (p.layout !== PREFS_DEFAULT.layout)
    out.push(p.layout === "table" ? "Table" : "List");
  if (p.sort !== PREFS_DEFAULT.sort || p.desc !== PREFS_DEFAULT.desc)
    out.push(`${sortLabel(p.sort)}${p.desc ? "" : ", reversed"}`);
  if (p.lens !== "all") out.push(p.lens === "hosting" ? "Hosting" : p.lens);
  if (p.when !== "any") out.push(WHENS.find((w) => w.id === p.when)!.label);
  if (p.year) out.push(p.year);
  if (p.group !== "none") out.push("By year");
  return out;
}

/* ── an event's own light ─────────────────────────────────────────────── */

/**
 * AN EVENT'S OWN LAMP: one of the house's five (`--lamp-1` to `--lamp-5`,
 * light and never UI), picked by its id so it never changes, which lights its
 * stage until its own photographs do (bible 6: "where there is no photograph,
 * light brings color with a source and a direction").
 */
export function lampOf(id: string): 1 | 2 | 3 | 4 | 5 {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return ((h % 5) + 1) as 1 | 2 | 3 | 4 | 5;
}

/** A lamp as light: a gradient's colour, never a class (the lamp set is not in `@theme`). */
export const lampLight = (n: number, alpha: number): string =>
  `color-mix(in oklch, var(--lamp-${n}) ${alpha}%, transparent)`;

/** The lamp beside a lamp: the second, softer light a stage's corner carries. */
export const nextLamp = (n: number): number => (n % 5) + 1;
