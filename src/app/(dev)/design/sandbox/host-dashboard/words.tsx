"use client";

import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

import type { LeadProps } from "./chooser";
import { ruleLabel, RULES } from "./model";
import { StageView } from "./stage-view";

/**
 * THE STAGE'S OWN WORDS (a stub: its helper draws its best version). The rule
 * is the first word of the stage's first line, and choosing happens there.
 */
export function WordsLead(p: LeadProps) {
  const eyebrow = p.hand ? (
    <span className="flex items-center gap-2">
      <button
        type="button"
        data-hd-rule={p.rule}
        aria-expanded={p.open}
        onClick={() => p.onOpen(!p.open)}
        className="flex items-center gap-1 text-white outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        {ruleLabel(p.rule)}
        <ChevronDown className="size-3" aria-hidden />
      </button>
      <span aria-hidden>·</span>
    </span>
  ) : null;
  const overlay =
    p.hand && p.open ? (
      <ul
        role="radiogroup"
        aria-label="Lead with"
        className="absolute top-14 left-5 z-10 rounded-xl bg-gallery/95 p-1 ring-1 ring-white/15 sm:left-8 lg:left-10"
      >
        {RULES.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              role="radio"
              aria-checked={r.id === p.rule}
              data-hd-rule-item={r.id}
              onClick={() => {
                p.onRule(r.id);
                p.onOpen(false);
              }}
              className={cn(
                "block w-full rounded-lg px-3 py-2 text-left text-sm text-white outline-none hover:bg-white/10",
                r.id === p.rule && "bg-white/10",
              )}
            >
              {r.label}
            </button>
          </li>
        ))}
      </ul>
    ) : null;
  return (
    <StageView
      key={p.stage.event.id}
      stage={p.stage}
      ctx={p.ctx}
      ends={p.ends}
      fresh={p.fresh}
      countWord={p.countWord}
      eyebrow={eyebrow}
      overlay={overlay}
    />
  );
}
