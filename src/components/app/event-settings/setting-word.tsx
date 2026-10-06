"use client";

import { useRef, useState, type ReactNode } from "react";
import { Check } from "lucide-react";

import {
  ResponsiveMenu,
  ResponsiveMenuItem,
} from "@/components/ui/responsive-menu";
import { cn } from "@/lib/utils";

/** One answer a live word offers, with the line it says before it acts (a consequence, a hint). */
export type WordChoice = {
  id: string;
  label: string;
  /** Said under the answer before it is chosen: what it does to people, or what it needs first. */
  note?: string;
  selected?: boolean;
};

/**
 * A WORD THAT IS A CONTROL (event-settings r1: "tap 'anyone with the link' to change who gets in"). It
 * reads as part of its sentence, underlined like a link's quieter cousin, and pressing it opens the
 * quick choice (`ResponsiveMenu`: a menu under the word at a desk, rows at the thumb in a hand), whose
 * rows are the answers. A row is the act, so any row whose act reaches people says so on its own line
 * first, which is the consequence line's rule said inside a menu.
 *
 * ★ IT STANDS ABOVE THE ROW'S OWN BUTTON. The row behind the sentence opens its page; the word is a
 * separate control over it (`relative z-10`), never a button inside a button.
 */
export function SettingWord({
  children,
  title,
  choices,
  onChoose,
  busy = false,
}: {
  /** The word as its sentence says it. */
  children: ReactNode;
  /** What the choice is about, the menu's name (and a phone's caption over the rows). */
  title: string;
  choices: readonly WordChoice[];
  onChoose: (id: string) => void;
  busy?: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        ref={ref}
        type="button"
        data-setting-word=""
        aria-haspopup="menu"
        aria-expanded={open}
        aria-busy={busy || undefined}
        onClick={() => setOpen(true)}
        className={cn(
          "pointer-events-auto relative z-10 rounded-sm font-medium text-foreground underline decoration-foreground/35 decoration-dotted decoration-2 underline-offset-4 transition-[text-decoration-color] duration-150 outline-none hover:decoration-foreground/70 focus-halo motion-reduce:transition-none",
          open && "bg-accent",
          busy && "opacity-70",
        )}
      >
        {children}
      </button>
      <ResponsiveMenu
        open={open}
        onOpenChange={setOpen}
        anchor={ref}
        title={title}
        showTitle
      >
        {choices.map((choice) => (
          <ResponsiveMenuItem
            key={choice.id}
            aria-current={choice.selected ? "true" : undefined}
            hint={
              choice.selected ? (
                <Check className="size-4" aria-label="Chosen" />
              ) : undefined
            }
            onSelect={() => {
              if (!choice.selected) onChoose(choice.id);
            }}
          >
            <span className="block">{choice.label}</span>
            {choice.note ? (
              <span className="block text-xs text-pretty text-muted-foreground">
                {choice.note}
              </span>
            ) : null}
          </ResponsiveMenuItem>
        ))}
      </ResponsiveMenu>
    </>
  );
}
