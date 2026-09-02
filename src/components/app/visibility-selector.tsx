"use client";

import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import { Globe, KeyRound, Lock } from "lucide-react";

import type { Database } from "@/lib/db/types";
import { cn } from "@/lib/utils";

type Visibility = Database["public"]["Enums"]["event_visibility"];

/**
 * The word for each visibility state, single-sourced (Will's ruling, 2026-09-02:
 * "Public sounds much clearer than open"). ★ "Open" is the ACCEPTING-UPLOADS state and
 * never a visibility word: the two were written separately, so the settings selector
 * said Public while the event header chip said Open, for the same `visibility = 'open'`
 * row. Read this record; do not re-type a label next to the enum.
 */
export const VISIBILITY_LABELS: Record<Visibility, string> = {
  open: "Public",
  password: "Password",
  private: "Private",
};

const OPTIONS: { value: Visibility; Icon: typeof Globe }[] = [
  { value: "open", Icon: Globe },
  { value: "password", Icon: KeyRound },
  { value: "private", Icon: Lock },
];

// One-line hint shown under the selector for the active choice (single-sourced so the
// form and any future surface describe the states identically).
export const VISIBILITY_HINTS: Record<Visibility, string> = {
  open: "Anyone with the link can view the album.",
  password: "Anyone with the link and the password can view the album.",
  private: "Only you can view it. Guests see a friendly locked screen.",
};

type VisibilitySelectorProps = {
  value: Visibility;
  onValueChange: (value: Visibility) => void;
  // The Password option is disabled when the host can't create one (Free tier) AND
  // none is set. A downgraded host who already has a password keeps the segment.
  passwordDisabled?: boolean;
};

export function VisibilitySelector({
  value,
  onValueChange,
  passwordDisabled = false,
}: VisibilitySelectorProps) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      onValueChange={(next) => {
        // radix emits "" when you re-click the active item; keep exactly one selected.
        if (next) onValueChange(next as Visibility);
      }}
      className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1"
    >
      {OPTIONS.map(({ value: optionValue, Icon }) => (
        <ToggleGroupPrimitive.Item
          key={optionValue}
          value={optionValue}
          disabled={optionValue === "password" && passwordDisabled}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors outline-none",
            "hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
            "data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm",
            "disabled:pointer-events-none disabled:opacity-50",
            "active:scale-[0.98] motion-reduce:active:scale-100",
          )}
        >
          <Icon className="size-3.5" />
          {VISIBILITY_LABELS[optionValue]}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  );
}
