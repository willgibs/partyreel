"use client";

import { useId } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { yearlySavingTag } from "./cadence";

export type Cadence = "month" | "year";

const OPTIONS: readonly { id: Cadence; label: string }[] = [
  { id: "month", label: "Monthly" },
  { id: "year", label: "Yearly" },
];

/**
 * MONTHLY OR YEARLY, ONCE, ABOVE THE SIZES (host-storage r2, `prices=sizes`, his note: "follow
 * the common/expected pattern of a monthly/yearly toggle up top ... so each card can focus on the
 * plan/storage, not comparing monthly vs yearly within each"). The /pricing pair's own segmented
 * control (a muted track, the page's white thumb sliding under the choice, pressed buttons in a
 * group rather than radios), so a host who priced Pro there meets the same object here.
 *
 * ★ THE SAVING IS A TAG RIGHT BESIDE YEARLY, NOT INSIDE IT (his "a discount tag beside yearly").
 * Inside the segment, "Yearly" and the tag outgrew half of a 320-pixel phone; beside the control,
 * the control stays as wide as its words and the tag always has its room. It is computed from the
 * prices (`cadence.ts`), and the Yearly button names it to a screen reader (`aria-describedby`),
 * so the saving is heard where it is seen.
 *
 * Nothing glides but the thumb, and reduced motion keeps it still.
 */
export function CadenceToggle({
  value,
  onChange,
}: {
  value: Cadence;
  onChange: (next: Cadence) => void;
}) {
  const tag = yearlySavingTag();
  const tagId = useId();
  const at = OPTIONS.findIndex((option) => option.id === value);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        role="group"
        aria-label="Billing"
        data-cadence-toggle=""
        className="relative inline-grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 select-none"
      >
        <span
          aria-hidden
          className="absolute inset-y-1 left-1 w-[calc((100%-0.75rem)/2)] rounded-md bg-background transition-transform duration-200 ease-emphasis motion-reduce:transition-none"
          style={{ transform: `translateX(calc(${at} * (100% + 0.25rem)))` }}
        />
        {OPTIONS.map((option) => {
          const on = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={on}
              aria-describedby={option.id === "year" && tag ? tagId : undefined}
              data-cadence={option.id}
              onClick={() => onChange(option.id)}
              className={cn(
                "relative z-10 inline-flex h-8 items-center justify-center rounded-md px-3.5 text-sm font-medium transition-colors duration-150 ease-emphasis outline-none focus-halo",
                on
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {tag ? (
        <Badge id={tagId} variant="success" data-saving-tag="">
          {tag}
        </Badge>
      ) : null}
    </div>
  );
}
