"use client";

import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ViewMenuOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type ViewMenuGroup = {
  /** React's list key; never rendered. */
  id: string;
  /** The group's own label, and its accessible name (`role="group"`, via `aria-label`). */
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly ViewMenuOption[];
  /**
   * The whole group reserved: every option still renders, none is operable —
   * a vocabulary seat held for a control that is not honestly wired yet
   * (pair with `hint` so a reader learns WHY, not just that nothing happens).
   */
  disabled?: boolean;
  /** A trailing note beside the group's label, e.g. "Coming soon". */
  hint?: string;
};

/**
 * THE APP'S ONE VIEW MENU (`app-vocabulary` r2, `controls-home=view-menu`,
 * 2026-09-20): "Tile size, Sort and Filter move behind one button; Download
 * and Select stay the row's only two verbs." His note: "If it's easier to
 * have sort, filter, or more than one exclusive 'View' menu, that's okay.
 * However, the rest of the options with everything visible at the top-level
 * felt far too busy."
 *
 * ★ ONE SHARED PRIMITIVE, ARBITRARY GROUPS. The host gallery passes tile
 * size, sort and filter (`event-gallery.tsx`); the guest album passes tile
 * size and Yours (`guest-shape` r2's `theirs` note: "combine this new filter
 * with the tile size filter to create a new parent dropdown" — mounted by
 * `guest-chrome-wiring` once it syncs past this lane). Neither this file nor
 * its trigger knows which: every group is a plain radio group (a label,
 * options, a value, a handler), on the shipped `ui/dropdown-menu.tsx`
 * (`events-section.tsx`'s own Sort/Show menus are the precedent this follows
 * exactly — one `DropdownMenuGroup` per label, so the panel's own sibling-
 * margin rule needs no manual separator between groups). This is also the
 * shape "a future view control (a date filter, a fourth tile step) joins"
 * (the ruling's own `lands` line): a caller adds a group, never a menu.
 *
 * ★ A DISABLED GROUP IS A KEPT PROMISE, NOT A DEAD ROW. `event-gallery.tsx`
 * ships its Sort group `disabled` because the gallery holds its album as an
 * opaque, server-rendered slot, never the approved list itself — reordering
 * DOM it cannot see would sort whatever happens to be mounted, not the
 * album, which is worse than no control at all (`app-vocabulary` r2's own
 * honesty rule: never a sort of one page). The row still renders — his ask
 * was for the WORD "Sort" to stop crowding the top level, not for it to
 * disappear — with `hint` saying so, and disabling every option rather than
 * hiding the group keeps the vocabulary honest about what is reserved versus
 * what would quietly do nothing.
 */
export function ViewMenu({
  groups,
  trigger = "View",
}: {
  groups: readonly ViewMenuGroup[];
  trigger?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <SlidersHorizontal /> {trigger}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {groups.map((group) => (
          <DropdownMenuGroup key={group.id}>
            <DropdownMenuLabel className="flex items-baseline justify-between gap-3">
              <span>{group.label}</span>
              {group.hint ? (
                <span className="text-micro text-muted-foreground/70">
                  {group.hint}
                </span>
              ) : null}
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              aria-label={group.label}
              value={group.value}
              onValueChange={group.onChange}
            >
              {group.options.map((option) => (
                <DropdownMenuRadioItem
                  key={option.value}
                  value={option.value}
                  disabled={group.disabled || option.disabled}
                >
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
