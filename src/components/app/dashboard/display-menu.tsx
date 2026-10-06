"use client";

import { useRef, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  LayoutGrid,
  Rows3,
  SlidersHorizontal,
  Table2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { floatingGutter } from "@/components/ui/floating-layer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  changed,
  type Display,
  directionWords,
  GROUPS,
  LAYOUTS,
  type Layout,
  lensOptions,
  naturalDesc,
  resetChoices,
  SCALES,
  SORTS,
  WHENS,
} from "@/lib/dashboard/display";
import type { EventsFilter } from "@/lib/dashboard/events-view";
import { formatCount } from "@/lib/format/count";

/**
 * THE DISPLAY MENU (host-dashboard r3, Will 2026-10-04: `events=menu`): every choice over her events in one place,
 * quiet until she opens it. The layout, the order and its direction, what shows (whose, when, a year), the groups
 * and the covers' size, and a Reset; what is set is counted on its button and said in a line under the head
 * (`events-section.tsx`). Her choices are kept on her account, on every device (`display.ts`).
 *
 * ★ EVERY CHOICE IS ONE PRESS AND TAKES EFFECT AT ONCE: the list lays itself out as she presses (a filter is
 * instant or it is not a filter), and the menu stays open over the list she is shaping.
 *
 * ★ RESET LEAVES THE FOCUS ON THE MENU (red-team 53's NIT). It shows only while something is set, so the press that
 * undoes everything removes the very button holding the focus, which then fell to the page's body and threw a
 * keyboard user out of the menu she was shaping. The press hands the focus to the menu's own panel first, so the next
 * Tab walks the choices from the top (all of them reset) and Escape still closes it.
 */

const LAYOUT_ICONS: Record<Layout, ReactNode> = {
  gallery: <LayoutGrid />,
  table: <Table2 />,
  list: <Rows3 />,
};

// A pill is a segment of the house set (identity r5): clear in its group's flat track, afloat when chosen.
const PILL = "h-7 rounded-full px-3 text-xs";

/** One choice among a few, as a row of pills: the pressed one stays pressed (a second press never leaves none). */
function Pills<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { id: T; label: string }[];
  onChange: (next: T) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as T)}
      aria-label={label}
      className="flex-wrap justify-start rounded-2xl"
    >
      {options.map((o) => (
        <ToggleGroupItem key={o.id} value={o.id} className={PILL}>
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-label text-muted-foreground uppercase">{label}</p>
      {children}
    </div>
  );
}

export function DisplayMenu({
  display,
  onChange,
  counts,
  years,
}: {
  display: Display;
  onChange: (next: Display) => void;
  counts: Record<EventsFilter, number>;
  /** The years her events sit in, newest first (and the one she has set). */
  years: readonly string[];
}) {
  const n = changed(display).length;
  const panel = useRef<HTMLDivElement>(null);
  const set = (patch: Partial<Display>) => onChange({ ...display, ...patch });
  const lenses = lensOptions(counts, display.lens).map((l) => ({
    id: l.id,
    label: `${l.label} ${formatCount(l.count)}`,
  }));
  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          // What the badge counts, said for a reader that cannot see it (its first word is the visible one).
          aria-label={n > 0 ? `Display, ${n} set` : undefined}
        >
          <SlidersHorizontal /> Display
          {n > 0 && (
            <span
              aria-hidden
              className="ml-0.5 flex size-4 items-center justify-center rounded-full bg-foreground text-micro font-semibold text-background tabular-nums"
            >
              {n}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        ref={panel}
        align="end"
        collisionPadding={floatingGutter}
        // Taller than the room around its button (a phone, or a button mid-page), it scrolls inside itself rather
        // than running off the window: every choice stays reachable without moving the page.
        className="max-h-[var(--radix-popover-content-available-height)] w-[22rem] space-y-4 overflow-y-auto p-4 outline-none"
      >
        <Section label="Layout">
          <ToggleGroup
            type="single"
            value={display.layout}
            onValueChange={(v) => v && set({ layout: v as Layout })}
            aria-label="Layout"
            // Three radio cards, not segments: no track under them (identity r5's radio card).
            className="grid w-full grid-cols-3 gap-1.5 bg-transparent p-0"
          >
            {LAYOUTS.map((l) => (
              <ToggleGroupItem
                key={l.id}
                value={l.id}
                className="flex h-14 flex-col gap-1 rounded-xl bg-(--choice) text-xs hover:bg-(--choice-up) data-[state=on]:afloat-card"
              >
                {LAYOUT_ICONS[l.id]}
                {l.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Section>

        <Section label="Order">
          <div className="space-y-1.5">
            <Pills
              label="Sort by"
              value={display.sort}
              options={SORTS}
              onChange={(sort) => set({ sort, desc: naturalDesc(sort) })}
            />
            <button
              type="button"
              onClick={() => set({ desc: !display.desc })}
              className="flex h-7 items-center gap-1.5 rounded-full px-2 text-xs text-muted-foreground outline-none hover:text-foreground focus-halo"
            >
              {display.desc ? (
                <ArrowDown className="size-3.5" aria-hidden />
              ) : (
                <ArrowUp className="size-3.5" aria-hidden />
              )}
              {directionWords(display.sort, display.desc)}
            </button>
          </div>
        </Section>

        <Section label="Show">
          <div className="space-y-1.5">
            <Pills
              label="Whose"
              value={display.lens}
              options={lenses}
              onChange={(lens) => set({ lens })}
            />
            <Pills
              label="When"
              value={display.when}
              options={WHENS}
              onChange={(when) => set({ when })}
            />
            {(years.length > 1 || display.year !== null) && (
              <Pills
                label="Year"
                value={display.year ?? "all"}
                options={[
                  { id: "all", label: "Every year" },
                  ...years.map((y) => ({ id: y, label: y })),
                ]}
                onChange={(y) => set({ year: y === "all" ? null : y })}
              />
            )}
          </div>
        </Section>

        <div className="grid grid-cols-2 gap-3">
          <Section label="Group">
            <Pills
              label="Group"
              value={display.group}
              options={GROUPS}
              onChange={(group) => set({ group })}
            />
          </Section>
          {display.layout === "gallery" && (
            <Section label="Covers">
              <Pills
                label="Cover size"
                value={display.scale}
                options={SCALES}
                onChange={(scale) => set({ scale })}
              />
            </Section>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span>Kept for your account, on every device</span>
          {n > 0 && (
            <button
              type="button"
              onClick={() => {
                onChange(resetChoices(display));
                panel.current?.focus({ preventScroll: true });
              }}
              className="font-medium text-foreground outline-none hover:underline focus-halo"
            >
              Reset
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
