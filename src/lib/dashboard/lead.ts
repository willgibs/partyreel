/**
 * WHAT LEADS THE STAGE, BY THE RULE SHE KEEPS (host-dashboard r4, Will 2026-10-05: `chooser=words`; his r2 note on
 * `pick`: "Rather than directly selecting an event, these could be more like sort options, such as: newest, last
 * opened, upcoming, etc. This helps it continue to be a reliable featured, but for accounts with 100 events, doesn't
 * result in a mega dropdown to choose. More algorithmic, repeatable solution."). Four rules, each a sentence she can
 * predict, and a party on its own day leads under every one of them (the live wall, settled):
 *
 *  - `newest` (the default, and `lead=made` as `moment.ts` settled it): a party within a month first, else the event
 *    she made last. It IS `momentEvent`, so a host who never chooses meets the stage she always met.
 *  - `upcoming`: the soonest dated party ahead, else her newest.
 *  - `opened`: the event she was in last (`events.host_opened_at`: a press into it from her dashboard, or its hub
 *    opened by any link), else her newest.
 *  - `photos`: the album photographs last landed in, else her newest.
 *
 * ★ A RULE THAT FINDS NOTHING OF ITS OWN KIND FALLS BACK TO HER NEWEST AND SAYS SO (`fellBack`), so the stage never
 * leads with nothing and never gives a false reason: "Your next party" is only said of a party that is next.
 *
 * ★ EVERY FACT IS READ AS THE VIEWER'S DAY, never the server's (dashboard.md): `today` is hers, and the day an event
 * was made is asked of `dayOfInstant`, which the page binds to her zone (the default reads UTC, for a test).
 *
 * ★ A RULE'S PICK IS TOTAL AND STABLE: every tie goes to the event made last, so the same events and the same day
 * always lead the same way, and no rule can shuffle the stage between two visits.
 *
 * Pure and node-safe: the page composes the lead from it, and the client reads what each rule would lead with (the
 * chooser's four rows) from the same rules (`leading.ts`), so a rule never says one thing and leads another.
 */
import type { HomeEvent } from "./home-event";
import { momentEvent } from "./moment";
import {
  AFTER_DAYS,
  daysFrom,
  daysToEvent,
  type Phase,
  phaseOfEvent,
  spanOf,
} from "./when";

export type RuleId = "newest" | "upcoming" | "opened" | "photos";

/** In the order the chooser lists them. */
export const RULES: readonly RuleId[] = [
  "newest",
  "upcoming",
  "opened",
  "photos",
];

/** Quiet by default (his r2 note: "the newest ... generally expecting a host to continue preparing it"). */
export const DEFAULT_RULE: RuleId = "newest";

/** Narrows a stored or forged value to a rule: a stranger is the default. */
export function resolveRule(raw: unknown): RuleId {
  return RULES.includes(raw as RuleId) ? (raw as RuleId) : DEFAULT_RULE;
}

/* ── Kept on her account, beside her Display ─────────────────────────────── */

/**
 * The key her rule rides under in `profiles.events_display` (the column holds her Display's choices, sparse, and its
 * CHECK is an envelope, not the key list: `display.ts`). Kept only when it differs from the default, so `{}` is every
 * default and a default changed later reaches everyone who never chose.
 */
export const LEAD_KEY = "lead";

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** The rule a profile's `events_display` keeps, whatever else it holds: never trusted, a stranger is the default. */
export function leadFrom(stored: unknown): RuleId {
  return isRecord(stored) ? resolveRule(stored[LEAD_KEY]) : DEFAULT_RULE;
}

/** What the column keeps once it keeps `rule`: the rest as it was, the rule only where it is not the default. */
export function withLead(
  stored: Record<string, string | boolean>,
  rule: RuleId,
): Record<string, string | boolean> {
  const rest = { ...stored };
  delete rest[LEAD_KEY];
  return rule === DEFAULT_RULE ? rest : { ...rest, [LEAD_KEY]: rule };
}

/* ── What a rule leads with ──────────────────────────────────────────────── */

/**
 * WHAT A RULE READ TO PICK ITS EVENT, kept beside the event so every place says the same true thing about why an
 * event leads (the board's fresh-eyes pass: "one false reason breaks the idea").
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

export type Lead<T> = {
  /** The rule that read it. */
  rule: RuleId;
  event: T;
  phase: Phase;
  why: Why;
  /** The rule found nothing of its own kind and led with her newest. */
  fellBack: boolean;
  /**
   * The day the fact is about, as the viewer's `YYYY-MM-DD`: today for a party on its day, a near party's nearest day, a
   * soonest party's date, the day photographs last landed, the day the event was made. Null for `opened`.
   */
  day: string | null;
};

/** The event as the rules read it: the facts the clock reads, and when she last pressed into it. */
export type Leadable = HomeEvent & { openedAt?: string | null };

/** The default reading of the day an event was made: its UTC day (the page reads it in the viewer's zone). */
const utcDay = (iso: string): string => iso.slice(0, 10);

const byMade = (a: Leadable, b: Leadable) =>
  Date.parse(b.createdAt) - Date.parse(a.createdAt);

/**
 * THE EVENT THAT LEADS UNDER A RULE, AND WHY: a party on its own day first (`momentEvent`'s first two steps: a host
 * date, then an undated album whose photographs are landing today), then the rule; `null` only for no events at all.
 */
export function leadOf<T extends Leadable>(
  events: readonly T[],
  today: string,
  rule: RuleId,
  dayOfInstant: (iso: string) => string = utcDay,
): Lead<T> | null {
  const moment = momentEvent(events, today);
  if (!moment) return null;
  const lead = (event: T, why: Why, fellBack: boolean, day: string | null) => ({
    rule,
    event,
    phase: phaseOfEvent(event, today),
    why,
    fellBack,
    day,
  });

  if (moment.phase === "live") return lead(moment.event, "live", false, today);

  // Her newest is what every rule falls back to, and what Newest itself leads with past the month.
  const newest = [...events].sort(byMade)[0]!;
  const made = (fellBack: boolean) =>
    lead(newest, "made", fellBack, dayOfInstant(newest.createdAt));

  if (rule === "newest") {
    // ★ `momentEvent` IS NEWEST: its nearest-within-a-month step, else the newest made, so the default never moves.
    const away = daysToEvent(moment.event, today);
    if (away === null || Math.abs(away) > AFTER_DAYS)
      return lead(
        moment.event,
        "made",
        false,
        dayOfInstant(moment.event.createdAt),
      );
    const span = spanOf(moment.event)!;
    // Ahead by its first day, behind by its last (`daysToEvent`).
    const day = daysFrom(today, span.first) > 0 ? span.first : span.last;
    return lead(moment.event, "near", false, day);
  }

  if (rule === "upcoming") {
    const next = events
      .filter((e) => e.date !== null && daysFrom(today, e.date) > 0)
      .sort((a, b) => a.date!.localeCompare(b.date!) || byMade(a, b))[0];
    return next ? lead(next, "next", false, next.date) : made(true);
  }

  if (rule === "opened") {
    const last = events
      .filter((e) => e.openedAt)
      .sort(
        (a, b) =>
          Date.parse(b.openedAt!) - Date.parse(a.openedAt!) || byMade(a, b),
      )[0];
    return last ? lead(last, "opened", false, null) : made(true);
  }

  const latest = events
    .filter((e) => e.lastArrival !== null)
    .sort(
      (a, b) =>
        Date.parse(b.lastArrival!.at) - Date.parse(a.lastArrival!.at) ||
        byMade(a, b),
    )[0];
  return latest
    ? lead(latest, "photos", false, latest.lastArrival!.day)
    : made(true);
}

/** What each of the four rules would lead with today, or null with no events at all. */
export function leadsOf<T extends Leadable>(
  events: readonly T[],
  today: string,
  dayOfInstant?: (iso: string) => string,
): Record<RuleId, Lead<T>> | null {
  if (events.length === 0) return null;
  const leads = {} as Record<RuleId, Lead<T>>;
  for (const rule of RULES)
    leads[rule] = leadOf(events, today, rule, dayOfInstant)!;
  return leads;
}

/**
 * A rule has something to choose when she has more than one event and none is on its day: a party on its own day leads
 * under every rule, and with one event there is nothing to lead instead. The control stands only then.
 */
export function hasChoice(events: readonly Leadable[], today: string): boolean {
  return (
    events.length > 1 && !events.some((e) => phaseOfEvent(e, today) === "live")
  );
}
