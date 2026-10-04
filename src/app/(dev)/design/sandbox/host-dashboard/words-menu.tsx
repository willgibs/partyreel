"use client";

import { useRef } from "react";
import { Check } from "lucide-react";

import {
  ResponsiveMenu,
  ResponsiveMenuItem,
  ResponsiveMenuNote,
} from "@/components/ui/responsive-menu";

import { Face, type LeadProps } from "./chooser";
import { type RuleId, RULES } from "./model";
import { StageView } from "./stage-view";
import { Phrase, reasonOf, rowOf, SAID } from "./words-say";

/**
 * THE WORDS, CHOSEN IN THE HOUSE'S QUICK CHOICE (the direction's way (a),
 * drawn to compare and not picked): the phrase is the house's word that is a
 * control (`SettingWord`) and opens production's `ResponsiveMenu`, a menu
 * under the phrase at a desk and rows at the thumb in a hand. Kept so the lane
 * can draw it again; `words.tsx` says why the stage turning won.
 */
export function WordsMenuLead(p: LeadProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const today = p.ctx.today;
  const eyebrow = p.hand ? (
    <Phrase
      ref={ref}
      rule={p.rule}
      label={reasonOf(p.rule, p.stage.event, today)}
      open={p.open}
      onPress={() => p.onOpen(!p.open)}
    />
  ) : null;

  // Up and down between the four (the menu's own keys look for plain menu items).
  const move = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const rows = Array.from(
      e.currentTarget.parentElement?.querySelectorAll<HTMLElement>(
        "[data-hd-rule-item]",
      ) ?? [],
    );
    const at = rows.indexOf(e.currentTarget);
    const next =
      (at + (e.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length;
    rows[next]?.focus();
  };

  return (
    <>
      <StageView
        key={p.stage.event.id}
        stage={p.stage}
        ctx={p.ctx}
        ends={p.ends}
        fresh={p.fresh}
        countWord={p.countWord}
        eyebrow={eyebrow}
      />
      {p.hand && (
        <ResponsiveMenu
          open={p.open}
          onOpenChange={p.onOpen}
          anchor={ref}
          title="Lead your stage with"
          showTitle
          className="w-[23rem]"
        >
          {RULES.map((r) => {
            const e = p.picks[r.id];
            const on = r.id === p.rule;
            return (
              <ResponsiveMenuItem
                key={r.id}
                role="menuitemradio"
                aria-checked={on}
                data-hd-rule-item={r.id}
                onKeyDown={move}
                icon={e ? <Face e={e} /> : undefined}
                hint={on ? <Check className="size-4" aria-hidden /> : undefined}
                onSelect={() => {
                  if (!on) p.onRule(r.id as RuleId);
                }}
              >
                <span className="block">{SAID[r.id].label}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {
                    rowOf(
                      r.id,
                      p.picks,
                      p.stage.event.id,
                      p.rule,
                      p.ends,
                      today,
                    ).line
                  }
                </span>
              </ResponsiveMenuItem>
            );
          })}
          <ResponsiveMenuNote>
            A party on its own day always leads.
          </ResponsiveMenuNote>
        </ResponsiveMenu>
      )}
    </>
  );
}
