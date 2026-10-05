"use client";

import {
  type ReactNode,
  startTransition,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

import {
  readStageGuestsAction,
  setLeadRuleAction,
} from "@/app/(app)/dashboard/actions";
import { EventsEmptyTeaser } from "@/components/app/dashboard/events-empty-teaser";
import { EventsSection } from "@/components/app/dashboard/events-section";
import { Stage } from "@/components/app/dashboard/stage";
import { StageLead } from "@/components/app/dashboard/stage-lead";
import { WeekRow } from "@/components/app/dashboard/week-row";
import {
  type Display,
  RECENT_FROM,
  recentRowsOf,
} from "@/lib/dashboard/display";
import type { HomeContext } from "@/lib/dashboard/home-event";
import type { StageView } from "@/lib/dashboard/home-view";
import { DEFAULT_RULE, resolveRule, type RuleId } from "@/lib/dashboard/lead";
import { type Around, type Leading, pageAround } from "@/lib/dashboard/leading";
import { phaseOfEvent } from "@/lib/dashboard/when";

/**
 * THE PAGE UNDER ITS HEAD, AROUND WHATEVER LEADS (host-dashboard r4, `chooser=words`): the stage, this week, the notes
 * and her events, composed on the client because a rule's press moves the stage and everything around it in the same
 * frame (Will's standing direction: "everything should feel as immediate/responsive/snappy").
 *
 * ★ A PRESS RECOMPOSES FROM WHAT THE PAGE ALREADY HOLDS (`pageAround`, pinned to the page the server would draw for the
 * same choice): the new lead takes the stage and leaves the week and her events, the lead the server drew takes its
 * place in them, and the Recent row is decided again over her events as they now stand. Nothing is asked of the server
 * to draw it, and the page is never refreshed (a refresh would presign every event's covers again for a choice she
 * already sees): her account keeps the rule beside it, in a transition, and a failure says so and leaves what she
 * chose on screen, as the Display menu does.
 *
 * ★ WHERE SHE HAS NO CHOICE (`leading` is null: one event, or a party on its day) THIS IS THE PAGE IT WAS: the stage the
 * server drew, no control, nothing else sent.
 *
 * ★ A NUMBER THE PAGE DID NOT READ IS READ ONCE, WHEN THE STAGE NEEDS IT. The page reads who came for the stage it draws
 * and no other, so an event a press leads with arrives without it and asks for it as the stage turns back
 * (`readStageGuestsAction`: hers under RLS, a service-role read behind that proof), and the number appears when it
 * lands. A failed read costs the stage that one number.
 *
 * ★ BACK RESTORES THE PAGE AS THE SERVER FIRST DREW IT (the router cache), so the rule she chose in this tab is
 * remembered beside the account's own copy, as her events' layout is (`events-section.tsx`), and a remount reads it first.
 * It names the account, and is written only by her press.
 */

/** The rule this tab last kept, by account: a page the browser's Back brings back is drawn from before her last choice. */
let remembered: { owner: string; rule: RuleId } | null = null;

const recall = (owner: string): RuleId | null =>
  remembered !== null && remembered.owner === owner ? remembered.rule : null;

export function HomeBody({
  drawn,
  hasAny,
  ctx,
  owner,
  display,
  leading,
  notes,
}: {
  /** The stage, week and events as the server drew them for the rule she keeps (`drawnOf`). */
  drawn: Around;
  /** She has any event at all, hosted, added to or binned: the create teaser's opposite. */
  hasAny: boolean;
  ctx: HomeContext;
  /** Whose home this is (her profile's id), for what the browser remembers of it. */
  owner: string;
  /** Her kept choices for her events (`resolveDisplay` of her profile), so the first paint is already hers. */
  display: Display;
  /** What a rule's press takes, or null where she has no choice. */
  leading: Leading | null;
  /** The claims review's line and the page invite, above the events. */
  notes?: ReactNode;
}) {
  const [rule, setRule] = useState<RuleId>(() =>
    leading ? resolveRule(recall(owner) ?? leading.rule) : DEFAULT_RULE,
  );
  const [guestsOf, setGuestsOf] = useState<Record<string, number>>({});

  const around = useMemo(
    () => (leading ? pageAround(drawn, leading, rule) : drawn),
    [drawn, leading, rule],
  );
  const stage = around.stage;

  /** Any event a rule leads with as the stage draws it, its guests where they have been read. */
  const stageOf = (eventId: string): StageView => {
    const first = drawn.stage!;
    const base =
      first.event.id === eventId ? first : (leading?.alts[eventId] ?? first);
    const read = guestsOf[base.event.id];
    return read === undefined || base.guests !== null
      ? base
      : { ...base, guests: read };
  };
  const shown = stage ? stageOf(stage.event.id) : null;

  // The guest number an event a press led with did not arrive with, read once it has had a day (before it, nobody has come).
  const askFor =
    stage !== null &&
    stage !== drawn.stage &&
    stage.guests === null &&
    guestsOf[stage.event.id] === undefined &&
    phaseOfEvent(stage.event, ctx.today) !== "before"
      ? stage.event.id
      : null;
  useEffect(() => {
    if (askFor === null) return;
    void readStageGuestsAction(askFor)
      .then((count) => {
        if (count !== null) setGuestsOf((g) => ({ ...g, [askFor]: count }));
      })
      .catch(() => {
        // The stage keeps what it shows: one number unsaid, and the action has said why where failures are read.
      });
  }, [askFor]);

  /** Moves the stage at once, and keeps the rule for her account beside it. */
  function keep(next: RuleId) {
    setRule(next);
    remembered = { owner, rule: next };
    startTransition(async () => {
      try {
        const answer = await setLeadRuleAction(next);
        if (!answer.ok) toast.error(answer.message, { id: "lead-rule" });
      } catch {
        toast.error("Couldn't keep that for your account. Please try again.", {
          id: "lead-rule",
        });
      }
    });
  }

  const { rows, week } = around;
  // From seven events (hers hosted and added to, the stage's included) the Recent row is worth its place.
  const total =
    rows.filter((r) => r.kind !== "deleted").length + (stage ? 1 : 0);
  const recent =
    total >= RECENT_FROM
      ? recentRowsOf(rows, new Set(week.map((c) => c.id)))
      : [];

  return (
    <>
      {shown &&
        (leading ? (
          <StageLead
            stage={shown}
            ctx={ctx}
            rule={rule}
            choices={leading.choices}
            stageOf={stageOf}
            onRule={keep}
          />
        ) : (
          <Stage
            // A new party of the moment is a new stage: its live state never carries over.
            key={shown.event.id}
            event={shown.event}
            ctx={ctx}
            guests={shown.guests}
            photos={shown.photos}
            share={shown.share}
            qrToken={shown.event.qrToken}
          />
        ))}
      <WeekRow cards={week} />
      {notes}
      {hasAny ? (
        <EventsSection
          rows={rows}
          today={ctx.today}
          owner={owner}
          initial={display}
          recent={recent}
        />
      ) : (
        <EventsEmptyTeaser />
      )}
    </>
  );
}
