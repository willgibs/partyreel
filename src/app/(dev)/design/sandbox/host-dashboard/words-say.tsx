"use client";

import type { Ref } from "react";

import { ChevronDown } from "lucide-react";

import type { HostedEvent, StageView } from "@/lib/dashboard/home-view";
import { eventUrl } from "@/lib/events/share-urls";
import { cn } from "@/lib/utils";

import type { Leads } from "./chooser";
import { factOf, type Lead, nearWords, type RuleId, SITE } from "./model";

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

/**
 * WHY THIS EVENT LEADS, the stage's first words (the fresh-eyes pass, round
 * four: the reason alone, and only the reason that fired). The rule's own name
 * while the rule found its own kind of event; for Newest's party within a
 * month, its day ("In 18 days", "Tomorrow"), since being near is why it leads;
 * where a rule had to fall back, the truth: her newest.
 */
export function reasonOf(lead: Lead | null, today: string): string {
  if (!lead || lead.fellBack || lead.why === "made") return SAID.newest.label;
  if (lead.why === "near") {
    const w = nearWords(lead.day!, today);
    return w[0]!.toUpperCase() + w.slice(1);
  }
  return SAID[lead.rule].label;
}

/**
 * WHAT A RULE LEADS WITH TODAY, in one line under its name (the fresh-eyes
 * pass: "every subline names its event"): the event and the fact its rule
 * read ("Nia & Alex's Wedding · opened last", "· nothing dated ahead"), and a
 * face only where choosing it would put another event on the stage.
 */
export function rowOf(
  rule: RuleId,
  leads: Leads,
  stageId: string,
  today: string,
): { line: string; face: HostedEvent | null } {
  const lead = leads[rule];
  if (!lead) return { line: SAID[rule].line, face: null };
  // The name keeps its dot and the fact stays whole, so a narrow row wraps between the two.
  const fact = factOf(lead, today).replace(/ /g, "\u00a0");
  return {
    line: `${lead.event.name}\u00a0· ${fact}`,
    face: lead.event.id === stageId ? null : lead.event,
  };
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
 * pointer), in the line's own small capitals, white where the line is muted,
 * and a chevron after it, so it reads as a choice and never as a glossary's
 * mark. It stands alone in the line: the phase word gives way to it while the
 * control shows (the date is said a line below, under the name).
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
        <ChevronDown
          className="ml-1 inline size-3 -translate-y-px align-middle opacity-80"
          aria-hidden
        />
        <span className="sr-only">: choose what leads</span>
      </button>
    </>
  );
}
