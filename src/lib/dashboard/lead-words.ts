/**
 * THE STAGE'S WORDS FOR WHY ITS EVENT LEADS (host-dashboard r4, `chooser=words`): what its first line says, and what
 * each rule says of the event it would lead with today. Pure words, decided on the server beside the rules
 * (`leading.ts`) and handed to the chooser as text, so what a row says and what choosing it leads with can never
 * disagree, and the client reads no rule.
 *
 * ★ EACH RULE'S NAME READS TWO WAYS: as the reason over the event ("Your newest", "Where you left off") and after the
 * chooser's "Lead with" ("Lead with your next party"), so the control and its choices are one sentence.
 *
 * ★ THE REASON IS ONLY THE REASON THAT FIRED (the board's fresh-eyes pass): the rule's own name while the rule found its
 * own kind of event; for Newest's party within a month, its day ("In 18 days", "Tomorrow"), since being near is why it
 * leads; where a rule had to fall back, the truth: her newest.
 *
 * ★ AN UNDATED ALBUM IS NEVER GIVEN A DAY SHE DID NOT SET (dashboard.md: the inferred day places an event, it never dates
 * it): where Newest leads with one because its photographs landed lately, the words are its photographs' ("Photos
 * yesterday"), as the stage's own first line says "No date yet" of it.
 */
import type { Lead, Leadable, RuleId } from "./lead";
import { daysFrom, whenOf } from "./when";

/** Each rule's name as the stage says it, over its event and in the chooser's rows. */
export const RULE_WORDS: Record<RuleId, string> = {
  newest: "Your newest",
  upcoming: "Your next party",
  opened: "Where you left off",
  photos: "Latest photos",
};

// en-US in UTC, as every day on this page is said (`when.ts`): a `YYYY-MM-DD` read back in UTC is that day anywhere.
const fmt = (o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { ...o, timeZone: "UTC" });
const MONTH_DAY = fmt({ month: "short", day: "numeric" });
const MONTH_YEAR = fmt({ month: "short", year: "numeric" });

const atUtc = (day: string): Date => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1));
};

/** A day either side of today in a row's fewest words: today, tomorrow, yesterday, in 18 days, 10 days ago. */
export function nearWords(day: string, today: string): string {
  const d = daysFrom(today, day);
  if (d === 0) return "today";
  if (d === 1) return "tomorrow";
  if (d === -1) return "yesterday";
  return d > 0 ? `in ${d} days` : `${-d} days ago`;
}

/** A day behind today: today, yesterday, else its date (its month and year once this year has gone). */
function pastWords(day: string, today: string): string {
  const d = daysFrom(today, day);
  if (d === 0) return "today";
  if (d === -1) return "yesterday";
  return (
    day.slice(0, 4) === today.slice(0, 4) ? MONTH_DAY : MONTH_YEAR
  ).format(atUtc(day));
}

/**
 * THE FACT A RULE READ, in a row's few words after its event's name: "made yesterday", "in 18 days", "Sat, Dec 12",
 * "opened last", "photos Sep 26", and where the rule found nothing of its own kind, that: "nothing dated ahead".
 */
export function factOf(lead: Lead<Leadable>, today: string): string {
  if (lead.fellBack)
    return lead.rule === "upcoming"
      ? "nothing dated ahead"
      : lead.rule === "photos"
        ? "no photos yet"
        : "nothing opened yet";
  switch (lead.why) {
    case "live":
      return "on today";
    case "near": {
      // An undated album is placed by its photographs, and said by them: its day is never a date she set.
      const words = nearWords(lead.day!, today);
      return lead.event.date === null ? `photos ${words}` : words;
    }
    case "next":
      return whenOf(lead.event.date, today, false, lead.event.endDate);
    case "opened":
      return "opened last";
    case "photos":
      return `photos ${pastWords(lead.day!, today)}`;
    case "made":
      return `made ${pastWords(lead.day!, today)}`;
  }
}

/** WHY THIS EVENT LEADS, the stage's first words: "Your newest", "Latest photos", "In 18 days". */
export function reasonOf(lead: Lead<Leadable>, today: string): string {
  if (lead.fellBack || lead.why === "made") return RULE_WORDS.newest;
  if (lead.why === "near") {
    const words = factOf(lead, today);
    return words.charAt(0).toUpperCase() + words.slice(1);
  }
  return RULE_WORDS[lead.rule];
}

/**
 * WHAT A RULE LEADS WITH TODAY, in one line under its name: the event and the fact its rule read ("Nia & Alex's
 * Wedding · made yesterday", "· nothing dated ahead"). The dot keeps its name and the fact stays whole (no-break
 * spaces), so a narrow row wraps between the two.
 */
export function lineOf(lead: Lead<Leadable>, today: string): string {
  const fact = factOf(lead, today).replace(/ /g, "\u00a0");
  return `${lead.event.name}\u00a0· ${fact}`;
}
