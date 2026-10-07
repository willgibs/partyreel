"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { Face } from "@/app/(app)/dashboard/[eventId]/guests/people";
import { SettingsCard } from "@/components/app/event-settings/settings-furniture";
import { cn } from "@/lib/utils";

/**
 * ONE CALM ROW FOR EVERYONE (guests-room r1, `rows=list`, Will 2026-10-07): the furniture every section of the Guests
 * room is made of, so a person reads alike at the door, among the guests, on the invite list and in Blocked: a face,
 * the name, one quiet line that says how they stand, and at most one act at its end, on the same line at a phone.
 *
 * ★ APPLE'S INSET-GROUPED LIST, IN THE HOUSE'S OWN CARD: a section is its eyebrow, one card of rows and a footnote
 * under the card saying what its acts do, so the first thing under a head is people. The card is Settings' own
 * (`SettingsCard`: its tone, its ring, its corner), since the two rooms stand in one panel; its hairlines start where
 * the words start, never under a face, so the faces stand in one unbroken column.
 */

/** A section's card of rows: Settings' group; Blocked's is unlit (its ring alone, no tone: a light that is off). */
export function RoomGroup({
  unlit = false,
  children,
}: {
  unlit?: boolean;
  children: ReactNode;
}) {
  return (
    <SettingsCard className={cn("divide-y-0", unlit && "bg-transparent")}>
      {children}
    </SettingsCard>
  );
}

/**
 * A row's hairline, from where the words start (12 + the 40px face + 12) to the card's end, never under a face.
 * The first row of a card draws none.
 */
export const ROW_LINE =
  "relative before:absolute before:top-0 before:right-0 before:left-16 before:h-px before:bg-border first:before:hidden";

/** A row's body: the face, the words and the act on one line, a thumb's height at least. */
export const ROW_BODY = "flex min-h-14 items-center gap-3 px-3 py-2";

/**
 * A whole row that is one press (a guest's, which opens their card): Settings' rows' own hover, so a row answers a
 * pointer alike in both rooms of the panel, and the house's halo drawn inside it, since the card clips.
 */
export const ROW_PRESS =
  "w-full text-left outline-none focus-halo halo-inset transition-colors duration-150 hover:bg-muted/40 motion-reduce:transition-none";

/** Rows a fold lets out arrive as a fade, never a jump; still under reduced motion. */
export const ARRIVES =
  "transition-opacity duration-200 ease-emphasis motion-reduce:transition-none motion-safe:starting:opacity-0";

/** A row's words: the name (and what stands beside it), and the one line under it. */
export function Words({
  name,
  aside,
  line,
  mark,
  quiet = false,
  className,
}: {
  name: ReactNode;
  /** When, beside the name: how long they have waited at the door, when a block landed. */
  aside?: ReactNode;
  line?: ReactNode;
  mark?: ReactNode;
  quiet?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 flex-1", className)}>
      <p
        className={cn(
          "flex min-w-0 items-baseline gap-1.5 text-sm font-medium",
          quiet && "text-muted-foreground",
        )}
      >
        <span className="truncate">{name}</span>
        {mark ? <span className="self-center">{mark}</span> : null}
        {aside ? (
          <span className="shrink-0 text-caption font-normal text-muted-foreground tabular-nums">
            {aside}
          </span>
        ) : null}
      </p>
      {line ? (
        <p className="mt-0.5 truncate text-caption text-muted-foreground">
          {line}
        </p>
      ) : null}
    </div>
  );
}

/** The faces a fold wears: the same in every fold, so their words start in one place. */
export const FOLD_FACES = 3;

/**
 * A FOLD: one row standing for the rows it holds back, wearing the first of their faces, so a fold of people still
 * reads as people. A list's lets out the next page where it stands; a disclosure's opens what it holds under it and
 * closes again (`expanded`).
 */
export function Fold({
  faces,
  expanded,
  controls,
  onPress,
  children,
  ...data
}: {
  faces: readonly { key: string; name: string; seed?: string | null }[];
  /** A disclosure's state; left out, the fold lets its rows out a page at a time. */
  expanded?: boolean;
  controls?: string;
  onPress: () => void;
  children: ReactNode;
} & Record<`data-${string}`, string>) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-expanded={expanded}
      aria-controls={controls}
      className={cn(
        // A fold that heads its card (nobody above it) draws no line over itself.
        "flex min-h-12 items-center gap-3 border-t px-3 text-sm first:border-t-0",
        ROW_PRESS,
      )}
      {...data}
    >
      {/* ★ THE FACES STAND IN THE FACE COLUMN, the words on the words' own line: three faces at 20px, a half over each
          other, are the column's 40px, so "23 more" starts where every name above it starts. */}
      <span className="flex w-10 shrink-0 justify-center -space-x-2.5">
        {faces.slice(0, FOLD_FACES).map((f) => (
          <Face
            key={f.key}
            name={f.name}
            seed={f.seed}
            className="size-5 text-micro ring-2 ring-card"
          />
        ))}
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <ChevronDown
        aria-hidden
        className={cn(
          "size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-in-out-strong motion-reduce:transition-none",
          expanded && "rotate-180",
        )}
      />
    </button>
  );
}
