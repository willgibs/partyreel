"use client";

import type { Ref } from "react";

import type { HostedEvent, StageView } from "@/lib/dashboard/home-view";
import { daysFrom, phaseOfEvent } from "@/lib/dashboard/when";
import { eventUrl } from "@/lib/events/share-urls";
import { cn } from "@/lib/utils";

import type { Picks } from "./chooser";
import { type RuleId, RULES, SITE, whenFor } from "./model";

/**
 * THE STAGE'S OWN WORDS FOR ITS RULE (`chooser=words`, round four): what the
 * stage's first line says about why its event leads, and what each rule says
 * about the event it would lead with today. Pure words, so every drawing of
 * the direction says the same thing.
 *
 * ★ EACH RULE'S NAME READS TWO WAYS: as the reason over the event ("Your
 * newest · No date yet") and after the chooser's "Lead with" ("Lead with your
 * next party"), so the control and its choices are one sentence. The four are
 * still `RULES`' four; only their words are this direction's.
 */

export const SAID: Record<RuleId, { label: string; line: string }> = {
  newest: {
    label: "Your newest",
    line: "The event you made last, or a party within a month",
  },
  upcoming: { label: "Your next party", line: "The soonest party by its date" },
  opened: { label: "Where you left off", line: "The event you were in last" },
  photos: { label: "Latest photos", line: "The album photos landed in last" },
};

const FMT = (o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { ...o, timeZone: "UTC" });
const MONTH_DAY = FMT({ month: "short", day: "numeric" });
const MONTH_YEAR = FMT({ month: "short", year: "numeric" });

/** A past day in a row's fewest words: today, yesterday, then its date (a weekday behind reads as the next one). */
function pastDay(day: string, today: string): string {
  const d = daysFrom(today, day);
  if (d === 0) return "today";
  if (d === -1) return "yesterday";
  const [y, m, n] = day.split("-").map(Number);
  const at = new Date(Date.UTC(y!, m! - 1, n!));
  return day.slice(0, 4) === today.slice(0, 4)
    ? MONTH_DAY.format(at)
    : MONTH_YEAR.format(at);
}

/** Whether the rule found its own kind of event, or fell back to her newest (`leadOf`'s "else the newest made"). */
function ownPick(rule: RuleId, e: HostedEvent, today: string): boolean {
  if (rule === "upcoming")
    return e.date !== null && daysFrom(today, e.date) > 0;
  if (rule === "photos") return e.lastArrival !== null;
  return true;
}

/**
 * WHY THIS EVENT LEADS, the stage's first words before its phase word. The
 * rule's own name while the rule found its own kind of event; a party not yet
 * held is her next party even before it has a date (Create asks none); and
 * where a rule had to fall back, the truth: her newest.
 */
export function reasonOf(rule: RuleId, e: HostedEvent, today: string): string {
  if (rule === "upcoming" && !ownPick(rule, e, today))
    return phaseOfEvent(e, today) === "before"
      ? SAID.upcoming.label
      : SAID.newest.label;
  if (!ownPick(rule, e, today)) return SAID.newest.label;
  return SAID[rule].label;
}

/** Where a rule with nothing of its own kind leads until it has one. */
const UNTIL: Record<RuleId, string> = {
  newest: "",
  upcoming: "until a party has a date",
  opened: "until you open one",
  photos: "until photos land",
};

/**
 * WHAT A RULE LEADS WITH TODAY, in one line under its name, and whether its
 * row wears the event's face. Each event is named once:
 *  - the kept rule names the event on the stage and the fact that makes it the
 *    one (made yesterday, Dec 12, photos Oct 8);
 *  - a rule with nothing of its own kind says what it leads with until it has
 *    some ("Your newest, until a party has a date");
 *  - a rule that agrees with the stage says "Leading now", so three rules
 *    agreeing on her wedding read as agreement, never as one name three times;
 *  - a rule that agrees with a rule above it says which ("The same as your
 *    newest");
 *  - any other names its event, with its face: what choosing it would change.
 */
export function rowOf(
  rule: RuleId,
  picks: Picks,
  stageId: string,
  kept: RuleId,
  ends: Record<string, string>,
  today: string,
): { line: string; face: HostedEvent | null } {
  const e = picks[rule];
  if (!e) return { line: SAID[rule].line, face: null };
  const own = ownPick(rule, e, today);
  // The name keeps its dot and the fact stays whole, so a narrow row wraps between the two.
  const said = (fact: string) => `${e.name} · ${fact.replace(/ /g, " ")}`;
  if (rule === kept)
    return {
      line: own
        ? said(factOf(rule, e, ends, today))
        : `${e.name} · your newest, ${UNTIL[rule]}`,
      face: null,
    };
  if (!own)
    return {
      line: `Your newest, ${UNTIL[rule]}`,
      face: e.id === stageId ? null : e,
    };
  if (e.id === stageId) return { line: "Leading now", face: null };
  const order = RULES.findIndex((r) => r.id === rule);
  const above = RULES.slice(0, order)
    .map((r) => r.id)
    .find(
      (r) =>
        r !== kept && picks[r]?.id === e.id && ownPick(r, picks[r]!, today),
    );
  if (above)
    return {
      line: `The same as ${SAID[above].label.toLowerCase()}`,
      face: null,
    };
  return { line: said(factOf(rule, e, ends, today)), face: e };
}

/** The fact that makes an event a rule's: when photos landed, when she made it, or its day. */
function factOf(
  rule: RuleId,
  e: HostedEvent,
  ends: Record<string, string>,
  today: string,
): string {
  if (rule === "photos" && e.lastArrival)
    return `photos ${pastDay(e.lastArrival.day, today)}`;
  if (rule === "newest") {
    const day = e.date ?? e.lastArrival?.day ?? null;
    // A party within a month leads Newest by its day; anything else, by when she made it.
    if (day !== null && Math.abs(daysFrom(today, day)) <= 30)
      return whenFor(e, ends, today);
    return `made ${pastDay(e.createdAt.slice(0, 10), today)}`;
  }
  return whenFor(e, ends, today);
}

/** The stage an event would draw if it led (`lifted`'s own shape, without the page around it). */
export function stageOf(e: HostedEvent, current: StageView): StageView {
  if (e.id === current.event.id) return current;
  return {
    event: e,
    photos: e.stills.map((url, i) => ({ id: `${e.id}:${i}`, url })),
    guests: null,
    share: { joinUrl: eventUrl(SITE, e.qrToken), qrStyle: e.qrStyle },
  };
}

/**
 * THE PHRASE THAT IS THE CONTROL: the reason the stage's first line gives,
 * drawn as the house's word that is a control (`SettingWord`, event-settings
 * r1: underlined like a link's quieter cousin, its dots brightening under the
 * pointer), in the line's own small capitals and white where the rest of the
 * line is muted. A dot then joins it to the phase word, so the two read as one
 * line: "YOUR NEWEST · NO DATE YET".
 *
 * ★ A THUMB'S TARGET ON A LABEL'S TYPE: the words are 16 px high, the press
 * reaches 44 (an invisible `after:` box), and the line's height never moves.
 */
export function Phrase({
  rule,
  label,
  open,
  controls,
  onPress,
  ref,
}: {
  rule: RuleId;
  label: string;
  open: boolean;
  /** The chooser's id, while it is showing. */
  controls?: string;
  onPress: () => void;
  ref?: Ref<HTMLButtonElement>;
}) {
  return (
    <>
      <button
        ref={ref}
        type="button"
        data-hd-rule={rule}
        data-hd-phrase=""
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? controls : undefined}
        onClick={onPress}
        className={cn(
          "relative -mx-1 rounded-md px-1 font-medium text-white uppercase outline-none",
          "underline decoration-white/40 decoration-dotted decoration-[1.5px] underline-offset-[5px]",
          "transition-[text-decoration-color] duration-150 hover:decoration-white motion-reduce:transition-none",
          "focus-visible:ring-2 focus-visible:ring-white/60",
          "after:absolute after:-inset-x-1 after:-inset-y-3.5 after:content-['']",
        )}
      >
        {label}
        <span className="sr-only">: choose what leads</span>
      </button>
      <span aria-hidden>·</span>
    </>
  );
}
