"use client";

import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import { Globe, KeyRound, Lock } from "lucide-react";

import {
  VISIBILITY_LABELS,
  type Visibility,
} from "@/lib/events/visibility-labels";
import { cn } from "@/lib/utils";

const OPTIONS: { value: Visibility; Icon: typeof Globe }[] = [
  { value: "open", Icon: Globe },
  { value: "password", Icon: KeyRound },
  { value: "private", Icon: Lock },
];

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
