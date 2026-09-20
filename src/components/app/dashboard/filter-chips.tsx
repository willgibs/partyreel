"use client";

import { FILTER_CHIPS, type FilterValue } from "@/lib/dashboard/filters";
import { cn } from "@/lib/utils";

/**
 * ★ RETIRED FROM PRODUCTION, KEPT ON DISK (home-wiring, 2026-09-20). The
 * five-chip inbox this bar drove is gone: `/dashboard` is the pulse now
 * (`home=pulse`), the personal feeds moved to the profile's owner mode, and
 * the bin and the saved events became FILTERS of the events list rather than
 * chips of their own. Nothing in the app renders this any more.
 *
 * It stays, with its props intact, because the LAB draws it: the `app-shape`
 * board's `home.tsx` composes it as the "inbox, as today" option, and a wiring
 * lane never deletes or reshapes a module the lab imports. Change its props and
 * that board stops building.
 *
 * The dashboard filter bar (Phase 5 S2b) — the single-feed replacement for the
 * radix tabs. A controlled segmented control: NOT radix Tabs (one-panel-per-value
 * can't express "All shows three sections", and dropping radix sidesteps the
 * TabsContent-strands-Suspense landmine if streaming is ever revisited).
 *
 * Emil management-tool contract: the active swap is INSTANT (no color/bg
 * transition); the only motion is the press (active:scale, transform-only).
 * Horizontal-scrolls on narrow viewports so five chips never wrap to two rows.
 * Honest ARIA: aria-pressed buttons in a group (these are filters, not a
 * tab/panel relationship — we deliberately broke that).
 */
export function FilterChips({
  active,
  onChange,
  trashCount,
}: {
  active: FilterValue;
  onChange: (value: FilterValue) => void;
  /** The Trash chip's badge — the only count that earns its place. */
  trashCount: number;
}) {
  return (
    <div
      role="group"
      aria-label="Filter your dashboard"
      className="-mx-1 flex gap-1.5 overflow-x-auto px-1 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {FILTER_CHIPS.map((chip) => {
        const isActive = active === chip.value;
        return (
          <button
            key={chip.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(chip.value)}
            className={cn(
              "flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium outline-none transition-transform duration-150 ease-emphasis active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring/50",
              isActive
                ? "border border-transparent bg-foreground text-background"
                : "border border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {chip.label}
            {chip.value === "trash" && trashCount > 0 && (
              <span
                className={cn(
                  "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums",
                  isActive
                    ? "bg-background/20 text-background"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {trashCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
