"use client";

import { CalendarDays, Check, ChevronDown, Sparkles } from "lucide-react";

import { Stage } from "@/components/app/dashboard/stage";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { HomeContext } from "@/lib/dashboard/home-event";
import type { HostedEvent, StageView } from "@/lib/dashboard/home-view";
import { GLASS_MARK } from "@/lib/glass";
import { cn } from "@/lib/utils";

import { EmptyStage } from "./empty-stage";
import {
  type RuleId,
  ruleLabel,
  RULES,
  type RuleWay,
  type StageWay,
  whenFor,
} from "./model";

/**
 * THE STAGE, AND THE RULE THAT CHOOSES IT (`rule`, his r2 note on `pick`:
 * "Rather than directly selecting an event, these could be more like sort
 * options, such as: newest, last opened, upcoming, etc. ... for accounts with
 * 100 events, doesn't result in a mega dropdown to choose").
 *
 * The stage is production's own (`components/app/dashboard/stage.tsx`) for an
 * event with photographs, and the `stage` ask's drawing for one without
 * (`empty-stage.tsx`). The rule is four sentences she can predict (`RULES`),
 * never a list of her events, and each says what it would lead with today, so
 * the choice is seen before it is made. Where it is set is the ask:
 *  - `corner`: a quiet menu in the stage's corner, on the product's glass;
 *  - `tabs`: the four as a row over the stage, one press each;
 *  - `head`: in the page head's Customize, beside New event (`dashboard.tsx`);
 *  - `settings`: in Settings, the stage's corner saying which rule and where.
 */

export type Picks = Record<RuleId, HostedEvent | null>;

/** An event's face in a rule's line: its cover, or its date as a tile wears it. */
function Face({ e }: { e: HostedEvent }) {
  const cover = e.stills[0];
  return (
    <span className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element -- a fixture still at a crop
        <img
          src={cover}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <CalendarDays className="size-3.5 text-muted-foreground" aria-hidden />
      )}
    </span>
  );
}

/**
 * THE FOUR RULES, each with what it would lead with today: one press picks a
 * rule, and the stage follows at once. Kept on her account.
 */
export function RuleChoices({
  rule,
  onRule,
  picks,
  ends,
  today,
  dense = false,
}: {
  rule: RuleId;
  onRule: (r: RuleId) => void;
  picks: Picks;
  ends: Record<string, string>;
  today: string;
  /** In a menu: the rows tighter, the event's face smaller. */
  dense?: boolean;
}) {
  return (
    <div className="space-y-1">
      <ul role="radiogroup" aria-label="Lead with" className="space-y-0.5">
        {RULES.map((r) => {
          const e = picks[r.id];
          const on = r.id === rule;
          return (
            <li key={r.id}>
              <button
                type="button"
                role="radio"
                aria-checked={on}
                data-hd-rule-item={r.id}
                onClick={() => onRule(r.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-2.5 text-left outline-none hover:bg-muted focus-visible:bg-muted",
                  dense ? "py-2" : "py-2.5",
                  on && "bg-muted",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    {r.label}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {r.line}
                  </span>
                </span>
                {e && (
                  <span
                    className={cn(
                      "flex min-w-0 items-center gap-2",
                      dense ? "w-40" : "w-48",
                    )}
                  >
                    <Face e={e} />
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-medium">
                        {e.name}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {whenFor(e, ends, today)}
                      </span>
                    </span>
                  </span>
                )}
                <span className="flex w-4 shrink-0 justify-center">
                  {on && <Check className="size-4" aria-hidden />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="px-2.5 pt-1 text-xs text-muted-foreground">
        A party on its own day always leads.
      </p>
    </div>
  );
}

const PILL = cn(
  "flex h-8 items-center gap-1.5 rounded-full px-3 text-xs leading-none font-medium whitespace-nowrap text-white outline-none focus-visible:ring-2 focus-visible:ring-white/60",
  GLASS_MARK,
);

/** `corner`: the rule's word on the stage's glass, its menu one press away. */
function CornerMenu({
  rule,
  onRule,
  picks,
  ends,
  today,
  open,
  onOpen,
}: {
  rule: RuleId;
  onRule: (r: RuleId) => void;
  picks: Picks;
  ends: Record<string, string>;
  today: string;
  open: boolean;
  onOpen: (open: boolean) => void;
}) {
  return (
    <Popover open={open} onOpenChange={onOpen} modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-hd-rule={rule}
          aria-label={`Lead with: ${ruleLabel(rule)}`}
          className={PILL}
        >
          <Sparkles className="size-3.5" aria-hidden />
          {ruleLabel(rule)}
          <ChevronDown className="size-3.5 opacity-70" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[26rem] p-2"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <p className="px-2.5 pt-1.5 pb-2 text-xs text-muted-foreground">
          Lead your dashboard with
        </p>
        <RuleChoices
          rule={rule}
          onRule={(r) => {
            onRule(r);
            onOpen(false);
          }}
          picks={picks}
          ends={ends}
          today={today}
          dense
        />
      </PopoverContent>
    </Popover>
  );
}

/** `tabs`: the four rules over the stage, the one on pressed, one press each. */
export function RuleTabs({
  rule,
  onRule,
}: {
  rule: RuleId;
  onRule: (r: RuleId) => void;
}) {
  return (
    <div
      data-hd-rule={rule}
      className="flex items-center gap-3 max-sm:flex-col max-sm:items-start max-sm:gap-1.5"
    >
      <span className="text-label text-muted-foreground uppercase">
        Lead with
      </span>
      <div
        role="radiogroup"
        aria-label="Lead with"
        className="flex max-w-full [scrollbar-width:none] gap-0.5 overflow-x-auto rounded-full bg-muted p-0.5"
      >
        {RULES.map((r) => (
          <button
            key={r.id}
            type="button"
            role="radio"
            aria-checked={r.id === rule}
            data-hd-rule-item={r.id}
            title={r.line}
            onClick={() => onRule(r.id)}
            className={cn(
              "h-7 shrink-0 rounded-full px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              r.id === rule
                ? "bg-background text-foreground shadow-lift"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StageSlot({
  stage,
  ctx,
  ends,
  stageWay,
  ruleWay,
  rule,
  onRule,
  picks,
  hand,
  open,
  onOpen,
  onSettings,
  fresh,
}: {
  stage: StageView;
  ctx: HomeContext;
  ends: Record<string, string>;
  stageWay: StageWay;
  ruleWay: RuleWay;
  rule: RuleId;
  onRule: (r: RuleId) => void;
  picks: Picks;
  /** More than one event: a rule has something to choose. */
  hand: boolean;
  open: boolean;
  onOpen: (open: boolean) => void;
  /** `settings`: the corner's word opens Settings. */
  onSettings: () => void;
  fresh: boolean;
}) {
  const event = stage.event;
  const empty = stage.photos.length === 0;
  const control = !hand ? null : ruleWay === "corner" ? (
    <CornerMenu
      rule={rule}
      onRule={onRule}
      picks={picks}
      ends={ends}
      today={ctx.today}
      open={open}
      onOpen={onOpen}
    />
  ) : ruleWay === "settings" ? (
    <button
      type="button"
      data-hd-rule={rule}
      onClick={onSettings}
      className={PILL}
    >
      <Sparkles className="size-3.5" aria-hidden />
      {ruleLabel(rule)}
      <span className="font-normal opacity-70">· Settings</span>
    </button>
  ) : null;
  return (
    <div className="space-y-3" data-hd-stage-slot="">
      {hand && ruleWay === "tabs" && <RuleTabs rule={rule} onRule={onRule} />}
      <div className="relative">
        {empty ? (
          <EmptyStage
            key={event.id}
            way={stageWay}
            event={event}
            ctx={ctx}
            share={stage.share}
            end={ends[event.id]}
            fresh={fresh}
          />
        ) : (
          <Stage
            // A new party of the moment is a new stage, as the page keys it.
            key={event.id}
            event={event}
            ctx={ctx}
            guests={stage.guests}
            photos={stage.photos}
            share={stage.share}
            qrToken={event.qrToken}
          />
        )}
        {control && (
          <div className="absolute top-3 right-3 z-10">{control}</div>
        )}
      </div>
    </div>
  );
}
