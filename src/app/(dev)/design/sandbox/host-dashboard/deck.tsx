"use client";

import { cn } from "@/lib/utils";

import type { LeadProps } from "./chooser";
import { RULES } from "./model";
import { StageView } from "./stage-view";

/**
 * THE DECK (a stub: its helper draws its best version). The four leads as a
 * deck the stage tops, each rule a tab she turns to.
 */
export function DeckLead(p: LeadProps) {
  return (
    <div className="space-y-2" data-hd-deck="">
      {p.hand && (
        <div
          role="radiogroup"
          aria-label="Lead with"
          data-hd-rule={p.rule}
          className="flex gap-1"
        >
          {RULES.map((r) => (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={r.id === p.rule}
              data-hd-rule-item={r.id}
              onClick={() => p.onRule(r.id)}
              className={cn(
                "h-8 rounded-t-xl px-3 text-xs outline-none",
                r.id === p.rule
                  ? "bg-gallery text-white"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
      <StageView
        key={p.stage.event.id}
        stage={p.stage}
        ctx={p.ctx}
        ends={p.ends}
        fresh={p.fresh}
        countWord={p.countWord}
      />
    </div>
  );
}
