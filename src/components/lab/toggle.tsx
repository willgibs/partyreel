"use client";

import { cn } from "@/lib/utils";

/**
 * A board's segmented control (viewport, ground, copy, a candidate's switch).
 *
 * ★ IT WRAPS BY DEFAULT. A nowrap segmented control with six options is 547px,
 * and at 375 that is not a clipped control, it is a horizontally scrolling
 * DOCUMENT: every other element on the page then sits off-centre and none of
 * them is the cause. A wrapped control is mildly less tidy at one width; an
 * overflowing one is broken at that width and quietly wrong at every other.
 * Pass `wrap={false}` only where the row is already inside its own scroller.
 */
export function Toggle<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  wrap = true,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
  /** Pin the options to one row. Off by default: see the landmine below. */
  wrap?: boolean;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5",
        wrap && "flex-wrap",
      )}
    >
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(o.id)}
            className={cn(
              "rounded-md px-3 py-1 text-[12px] font-medium transition-colors",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
