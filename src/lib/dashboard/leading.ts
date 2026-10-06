/**
 * THE PAGE AROUND ANY LEAD, so a rule's press moves the stage in the same frame (host-dashboard r4, `chooser=words`;
 * Will's standing direction: "everything should feel as immediate/responsive/snappy"). The server draws the page for
 * the rule she keeps. When she has a choice (`hasChoice`: more than one event and no party on its day) it also hands
 * the client what moving the stage to another event takes, and nothing more:
 *
 *  - `choices`: for each rule, the event it would lead with and the two lines it says of it (`lead-words.ts`), so the
 *    chooser reads no rule, only words;
 *  - `alts`: the stage of each OTHER event a rule would lead with (its stills, its readiness where the page asked it:
 *    `page.tsx` adds them to its one round of readiness reads), at most three;
 *  - `parked`: what the drawn lead becomes once another leads, its row in her events and its card in the week where it
 *    has one, and `weekIds`, the week's order whole, so the card goes back where it belongs.
 *
 * ★ `pageAround` IS `buildHomeView`'s PAGE FOR ANOTHER LEAD, BY CONSTRUCTION AND BY TEST (`leading.test.ts`): the lead
 * leaves the week and her events and the drawn one takes its place in them, every other card and row untouched (a row's
 * marks read whether the week holds it, which does not depend on who leads). Nothing is recomposed by a second rule, so
 * the page cannot drift from what the server would draw for the same choice, and nothing is read: a choice costs the
 * client no round trip and the server no render.
 *
 * Pure and node-safe.
 */
import { weekEvents } from "./attention";
import type { EventListRow } from "./events-view";
import {
  hostedRowOf,
  type HomeInput,
  type HomeView,
  stageViewOf,
  type StageView,
  type WeekCard,
  weekCardOf,
} from "./home-view";
import { DEFAULT_RULE, hasChoice, leadsOf, RULES, type RuleId } from "./lead";
import { lineOf, reasonOf } from "./lead-words";

/** What one rule would lead with today, and what it says of it. */
export type LeadChoice = {
  eventId: string;
  /** The stage's first words if this rule were kept: "Your newest", "In 18 days", "Latest photos". */
  reason: string;
  /** The chooser's row under the rule's name: "Nia & Alex's Wedding · made yesterday". */
  line: string;
};

export type Leading = {
  /** The rule the server drew the page for: her kept one. */
  rule: RuleId;
  choices: Record<RuleId, LeadChoice>;
  /** The stage of every other event a rule would lead with, by event id. */
  alts: Record<string, StageView>;
  /** The drawn lead as the rest of the page holds it once it does not lead. */
  parked: { card: WeekCard | null; row: EventListRow };
  /** Every party in the week, in the week's order, the drawn lead's included. */
  weekIds: string[];
};

/**
 * The page's three parts that depend on who leads. The stage is null where she hosts nothing to lead with (her events
 * are then the guest albums and the bin she holds, which still stand).
 */
export type Around = {
  stage: StageView | null;
  week: WeekCard[];
  rows: EventListRow[];
};

/**
 * THE PAGE AS THE SERVER DREW IT, in the parts that depend on who leads. These alone cross to the client (never the
 * view's groups by when, which only the board's drawings read).
 */
export function drawnOf(view: HomeView): Around {
  return { stage: view.stage, week: view.week, rows: view.events.rows };
}

/**
 * What the client needs to lead with any rule's event, or null where she has no choice (one event, a party on its day,
 * or nothing drawn): the control does not stand, and nothing extra travels.
 */
export function leadingOf(input: HomeInput, view: HomeView): Leading | null {
  const { hosted, ctx, siteUrl } = input;
  const drawn = view.stage?.event;
  if (!drawn || !hasChoice(hosted, ctx.today)) return null;
  const leads = leadsOf(hosted, ctx.today, input.dayOfInstant)!;

  const choices = {} as Record<RuleId, LeadChoice>;
  const alts: Record<string, StageView> = {};
  for (const rule of RULES) {
    const lead = leads[rule];
    choices[rule] = {
      eventId: lead.event.id,
      reason: reasonOf(lead, ctx.today),
      line: lineOf(lead, ctx.today),
    };
    if (lead.event.id !== drawn.id && !alts[lead.event.id])
      alts[lead.event.id] = stageViewOf(lead.event, siteUrl);
  }

  // The week as it would stand with no lead taken out of it: its order, and whether the drawn lead is in it.
  const week = weekEvents(hosted, ctx.today);
  const inWeek = new Set(week.map((e) => e.id));
  return {
    rule: input.rule ?? DEFAULT_RULE,
    choices,
    alts,
    parked: {
      card: inWeek.has(drawn.id) ? weekCardOf(drawn, ctx, siteUrl) : null,
      row: hostedRowOf(drawn, ctx, inWeek.has(drawn.id)),
    },
    weekIds: week.map((e) => e.id),
  };
}

/**
 * THE PAGE WITH THE EVENT A RULE LEADS WITH ON ITS STAGE: its stage, the week without it (the drawn lead's card back in
 * its place) and her events without it (the drawn lead's row among them). The drawn page itself when the rule leads
 * with the event the server drew, or with one the server sent no stage for.
 */
export function pageAround(
  drawn: Around,
  leading: Leading,
  rule: RuleId,
): Around {
  const id = leading.choices[rule].eventId;
  const stage = leading.alts[id];
  if (!drawn.stage || id === drawn.stage.event.id || !stage) return drawn;

  const cards = new Map(drawn.week.map((c) => [c.id, c]));
  if (leading.parked.card)
    cards.set(leading.parked.card.id, leading.parked.card);
  return {
    stage,
    week: leading.weekIds
      .filter((weekId) => weekId !== id)
      .flatMap((weekId) => cards.get(weekId) ?? []),
    rows: [
      ...drawn.rows.filter((r) => !(r.kind === "hosted" && r.id === id)),
      leading.parked.row,
    ],
  };
}
