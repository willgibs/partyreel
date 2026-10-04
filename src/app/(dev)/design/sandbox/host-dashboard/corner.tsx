"use client";

import { Check, ChevronDown, Sparkles } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { GLASS_MARK } from "@/lib/glass";
import { cn } from "@/lib/utils";

import { Face, type LeadProps } from "./chooser";
import { ruleLabel, RULES, whenFor } from "./model";
import { StageView } from "./stage-view";

/**
 * THE CORNER (round three's drawing, the starting point this round refines):
 * the rule's word on the stage's glass at its top right, its menu listing the
 * four rules, each with the event it would lead with today.
 */

const PILL = cn(
  "flex h-8 items-center gap-1.5 rounded-full px-3 text-xs leading-none font-medium whitespace-nowrap text-white outline-none focus-visible:ring-2 focus-visible:ring-white/60",
  GLASS_MARK,
);

export function CornerLead(p: LeadProps) {
  const control = p.hand ? (
    <div className="absolute top-3 right-3 z-10">
      <Popover open={p.open} onOpenChange={p.onOpen} modal={false}>
        <PopoverTrigger asChild>
          <button
            type="button"
            data-hd-rule={p.rule}
            aria-label={`Lead with: ${ruleLabel(p.rule)}`}
            className={PILL}
          >
            <Sparkles className="size-3.5" aria-hidden />
            {ruleLabel(p.rule)}
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
          <ul role="radiogroup" aria-label="Lead with" className="space-y-0.5">
            {RULES.map((r) => {
              const e = p.picks[r.id];
              const on = r.id === p.rule;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={on}
                    data-hd-rule-item={r.id}
                    onClick={() => {
                      p.onRule(r.id);
                      p.onOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left outline-none hover:bg-muted focus-visible:bg-muted",
                      on && "bg-muted",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">
                        {r.label}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {r.line}
                      </span>
                    </span>
                    {e && (
                      <span className="flex w-40 min-w-0 items-center gap-2">
                        <Face e={e} />
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-medium">
                            {e.name}
                          </span>
                          <span className="block truncate text-[11px] text-muted-foreground">
                            {whenFor(e, p.ends, p.ctx.today)}
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
        </PopoverContent>
      </Popover>
    </div>
  ) : null;
  return (
    <StageView
      key={p.stage.event.id}
      stage={p.stage}
      ctx={p.ctx}
      ends={p.ends}
      fresh={p.fresh}
      countWord={p.countWord}
      overlay={control}
    />
  );
}
