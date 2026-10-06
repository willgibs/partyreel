"use client";

import { formatBytesUp } from "@/lib/billing/storage-guard";
import type { StorageEventTotal } from "@/lib/db/queries/storage-list";
import { cn, formatBytes } from "@/lib/utils";

import type { Filter } from "./storage-list-rules";

/**
 * ALL, OR ONE EVENT (his `order=flat` note: "Filters should allow to go 'all' or by event for more
 * granularity, rather than this being a selection between strictly 'all events' or 'grouped by
 * event'"). Each chip carries what its event holds, which is what the grouped view offered,
 * without choosing it; the events run heaviest first, so the chip worth a look is the first one.
 *
 * The dashboard's chip grammar (pressed buttons in a group, not tabs: a filter, not a panel), one
 * row that scrolls sideways in a hand rather than wrapping to two. A chip past the row's edge
 * comes fully into view when chosen, by the row's own scroll.
 */
export function EventFilter({
  events,
  allBytes,
  value,
  onChange,
}: {
  events: readonly StorageEventTotal[];
  /** What she stores in all: the All chip's figure, the meter's own. */
  allBytes: number;
  value: Filter;
  onChange: (filter: Filter) => void;
}) {
  // All is what she stores, printed as the meter and the refusal print it (rounded up); an
  // event's total is a size like any other, to the nearest tenth.
  const chips: { id: Filter; label: string; size: string }[] = [
    { id: "all", label: "All events", size: formatBytesUp(allBytes) },
    ...events.map((event) => ({
      id: event.id,
      label: event.name,
      size: formatBytes(event.bytes),
    })),
  ];
  return (
    <div
      role="group"
      aria-label="Show"
      data-storage-filter=""
      className="relative -mx-1 flex [scrollbar-width:none] gap-1.5 overflow-x-auto px-1 py-0.5 [&::-webkit-scrollbar]:hidden"
    >
      {chips.map((chip) => {
        const on = chip.id === value;
        return (
          <button
            key={chip.id}
            type="button"
            aria-pressed={on}
            data-storage-chip={chip.id}
            onClick={(event) => {
              onChange(chip.id);
              const el = event.currentTarget;
              const row = el.parentElement;
              if (!row) return;
              // The row is positioned, so a chip's offset is its place in the row.
              const left = el.offsetLeft;
              const right = left + el.offsetWidth;
              if (left < row.scrollLeft) row.scrollLeft = left - 4;
              else if (right > row.scrollLeft + row.clientWidth)
                row.scrollLeft = right - row.clientWidth + 4;
            }}
            className={cn(
              "flex h-8 max-w-[16rem] shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-transform duration-150 ease-emphasis outline-none focus-halo active:scale-[0.97]",
              on
                ? "border border-transparent bg-foreground text-background"
                : "border border-border text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="truncate">{chip.label}</span>
            <span
              className={cn(
                "shrink-0 text-xs tabular-nums",
                on ? "text-background/70" : "text-faint",
              )}
            >
              {chip.size}
            </span>
          </button>
        );
      })}
    </div>
  );
}
