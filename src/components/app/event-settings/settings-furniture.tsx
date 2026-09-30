"use client";

import { useId, type ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/**
 * SETTINGS' FURNITURE, one idiom for every page (the board's parts, wired): a group is one card of
 * rows split by hairlines on the card surface and its ring, and a row is its name and ONE line on the
 * left with its control on the right (the carried call `one-line`: the long explanations move into the
 * confirm a consequential switch already opens), or its control under its name where the control is
 * wide (a field, the looks, the steps).
 */

/** One group of rows on the card surface. */
export function SettingsCard({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  /** What the group is, for a screen reader (the page's own title says it for the eye). */
  label?: string;
}) {
  return (
    <div
      role={label ? "group" : undefined}
      aria-label={label}
      className={cn(
        "divide-y divide-border overflow-hidden rounded-lg bg-card text-card-foreground ring-1 ring-foreground/10",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * A SWITCH ROW: the setting's name and its one line beside its switch, the whole label pressable.
 * `held` is another choice holding it on (the board's `held-on` call: on and still, the reason under
 * it), which disables the switch rather than hiding it.
 */
export function SwitchSetting({
  label,
  line,
  checked,
  onCheckedChange,
  held,
  disabled = false,
  after,
  className,
}: {
  label: ReactNode;
  line?: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Another choice holds it on: the reason, said under its line. */
  held?: string | null;
  disabled?: boolean;
  /** Anything that stands under the row inside it (a dormant setting it controls). */
  after?: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("space-y-3 px-4 py-3", className)}>
      <div className="flex items-start justify-between gap-4">
        <Label
          htmlFor={id}
          className="min-w-0 flex-1 cursor-pointer flex-col items-start gap-0.5 font-normal"
        >
          <span className="text-sm font-medium text-foreground">{label}</span>
          {line ? (
            <span className="text-caption text-pretty text-muted-foreground">
              {line}
            </span>
          ) : null}
          {held ? (
            <span className="text-caption text-pretty text-muted-foreground">
              {held}
            </span>
          ) : null}
        </Label>
        <Switch
          id={id}
          checked={checked}
          disabled={disabled || Boolean(held)}
          onCheckedChange={onCheckedChange}
        />
      </div>
      {after}
    </div>
  );
}

/** A row whose control stands under its name (a field, the looks, the hold's steps). */
export function StackSetting({
  label,
  labelId,
  line,
  children,
  className,
}: {
  label: ReactNode;
  /** The label's id, for a control that names itself by it (`aria-labelledby`). */
  labelId?: string;
  line?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2.5 px-4 py-3", className)}>
      <div className="space-y-0.5">
        <p id={labelId} className="text-sm font-medium">
          {label}
        </p>
        {line ? (
          <p className="text-caption text-pretty text-muted-foreground">
            {line}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/** A page's own quiet note under its groups. */
export function SettingsNote({ children }: { children: ReactNode }) {
  return (
    <p className="px-1 text-caption text-pretty text-muted-foreground">
      {children}
    </p>
  );
}

/** How every setting saves, said once under the four rows (the board's `saves` call). */
export const SAVES_NOTE = "Changes save as you make them.";
