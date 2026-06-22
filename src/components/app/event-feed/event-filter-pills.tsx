"use client";

import { cn } from "@/lib/utils";
import { type EventFilter } from "@/lib/event/sections";

export type FeedPill = {
  value: EventFilter;
  label: string;
  count?: number;
  /** The load-bearing review count renders amber (a needs-action signal). */
  amber?: boolean;
};

// The event feed's filter pills — the single-feed replacement for the Gallery/Reel/Reviews tabs,
// mirroring the dashboard's FilterChips (aria-pressed buttons in a group, NOT radix Tabs; one
// "All" value stacks every section). A=Condense (ratified in the lab): the bar is sticky under the
// app header and SHRINKS once the feed scrolls past the top (data-stuck → the pills go compact +
// the bar gains a hairline + backdrop), so the filter stays in reach without eating vertical space.
// The active swap itself is instant (a management-tool contract); the only motion is the press
// (active:scale) + the smooth height/padding morph of the condense.
//
// Hydration-safe: native pills only, NO radix Tooltip (the SSR'd host-page subtree-bail trap).
export function EventFilterPills({
  pills,
  active,
  onSelect,
  stuck,
}: {
  pills: FeedPill[];
  active: EventFilter;
  onSelect: (value: EventFilter) => void;
  /** True once the feed has scrolled past its top sentinel → condense + elevate. */
  stuck: boolean;
}) {
  return (
    <div
      data-stuck={stuck || undefined}
      className="sticky top-14 z-30 -mx-4 px-4 py-2 transition-[box-shadow,border-color] duration-200 data-[stuck]:border-b data-[stuck]:border-border data-[stuck]:bg-background/85 data-[stuck]:backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
    >
      <div
        role="group"
        aria-label="Filter the event"
        className="-mx-1 flex gap-1.5 overflow-x-auto px-1 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {pills.map((pill) => {
          const isActive = active === pill.value;
          return (
            <button
              key={pill.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => onSelect(pill.value)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full font-medium outline-none transition-[transform,height,padding,font-size] duration-200 ease-emphasis focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.97]",
                stuck ? "h-7 px-3 text-xs" : "h-8 px-3.5 text-sm",
                isActive
                  ? "border border-transparent bg-foreground text-background"
                  : "border border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {pill.label}
              {pill.count ? (
                <span
                  className={cn(
                    "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums",
                    isActive
                      ? "bg-background/20 text-background"
                      : pill.amber
                        ? "bg-warning/15 text-warning"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {pill.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
