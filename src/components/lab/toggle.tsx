"use client";

import { cn } from "@/lib/utils";

/** A board's segmented control (viewport, ground, copy, a candidate's switch). */
export function Toggle<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  wrap = false,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
  /** Let the options wrap onto more rows (a toggle with more than about six
   *  options overflows a 375 canvas otherwise; the rounding track's ask). */
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
