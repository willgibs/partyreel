"use client";

import { type ReactNode, useId } from "react";
import { ChevronDown, Clock } from "lucide-react";

import {
  DEVELOPS_NOW_WITHIN_MS,
  toLocalInput,
} from "@/components/app/event-settings/camera-settings-develop-time";
import { developTimeWords } from "@/lib/disposable/develop-words";
import { DEVELOP_MAX_AHEAD_DAYS } from "@/lib/disposable/reveal";
import { useWaitClock } from "@/lib/disposable/use-wait-clock";
import { developsWhen } from "@/lib/guest/camera/words";
import { cn } from "@/lib/utils";

/** Asks the field's own picker to open: a browser with none, or one that will not for this press, leaves the field. */
function openPicker(field: HTMLInputElement) {
  try {
    field.showPicker();
  } catch {
    // The field is the way.
  }
}

/**
 * The time in words: the camera's own ("tomorrow at 9 am") while it is ahead; once a draft is not, the day itself, so a
 * refused time reads as the day she picked and never as "at 9 am" today.
 */
function wordsFor(iso: string, now: number): string {
  return Date.parse(iso) > now
    ? developsWhen(iso, now)
    : (developTimeWords(iso) ?? "");
}

/**
 * THE DISPOSABLE'S DEVELOP TIME, ONE ROW DIRECTLY UNDER ITS CARD (create-wizard r3's add=styles, Will: "If disposable is
 * selected, time should either be directly below option item or on a focused following screen, but not tucked
 * underneath the timeline where it may not be noticed"): "Develops", and when, in the camera's own words ("tomorrow at
 * 9 am"), a setting's row in the room's material, never a new control.
 *
 * ★ THE ROW IS THE PICKER'S FACE, THE NATIVE FIELD ITS HAND: a `datetime-local` lies transparent over the whole row, so a
 * phone's own wheel and a desk's own calendar open from a press anywhere on it (the same field Settings' develop time
 * is, picked in her own zone), while the row says the time in words, never as a field's digits. A press asks the
 * picker to open itself (`showPicker`), which a desk's browser does not do for a press on a field's middle.
 *
 * ★ WHAT SHE PICKS IS A DRAFT UNTIL SHE HAS FINISHED IT (Settings' rule, crumbs-60): leaving the field or Return judges
 * it, once, and a half-typed year is never a time (`judgeDevelopTime`); the words say the draft while it is a whole time,
 * and the refusal stands under the row in words. Create knows no date yet, so the time it offers is 9 am tomorrow; a
 * party further off is a pick away, here or later in Settings (a stored time never follows the event's date).
 *
 * ★ IT OPENS WITH ITS CARD AND SHUTS WITH IT, in place (a row of height that eases), kept in the DOM, inert and
 * hidden while shut, so its place never moves the card above it and nothing of it waits in the tab order. What else
 * stands under the pick (`after`: its roll, customize r1's `roll=both`) opens and shuts inside the same slot.
 */
export function DevelopRow({
  open,
  developsAt,
  draft,
  refusal,
  onDraft,
  onFinish,
  after,
  className,
}: {
  /** The Disposable card is picked: the row is there. */
  open: boolean;
  /** The develop time that will be sent (ISO), or null before one is offered. */
  developsAt: string | null;
  /** What the field holds, unfinished (`YYYY-MM-DDTHH:mm`, "" when half filled), or null when it holds the time. */
  draft: string | null;
  /** Why what she finished is not a time, said under the row. */
  refusal: string | null;
  onDraft: (value: string) => void;
  onFinish: () => void;
  /** What else stands under the Disposable's pick, opening and shutting with the row (its roll). */
  after?: ReactNode;
  className?: string;
}) {
  const fieldId = useId();
  const refusalId = `${fieldId}-refusal`;
  // The reader's own now (the house's one clock), read only while the row is there: it says "tomorrow" by her calendar.
  const now = useWaitClock(open);
  // The words say the draft while it is a whole time, else the time that will be sent.
  const draftAt = draft ? new Date(draft) : null;
  const shown =
    draftAt && Number.isFinite(draftAt.getTime())
      ? draftAt.toISOString()
      : developsAt;
  return (
    <div
      data-develop-slot=""
      data-open={open ? "" : undefined}
      inert={!open}
      aria-hidden={open ? undefined : true}
      className={cn("cr-develop-slot", className)}
      onTransitionEnd={(e) => {
        // Opened under its card on a screen too short to hold it: it is brought into view, never left where it
        // may not be noticed (his own worry, and the room's body scrolls). Only what is out of view moves.
        if (
          !open ||
          e.target !== e.currentTarget ||
          e.propertyName !== "grid-template-rows"
        )
          return;
        const calm = window.matchMedia?.(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        e.currentTarget.scrollIntoView?.({
          block: "nearest",
          behavior: calm ? "auto" : "smooth",
        });
      }}
    >
      <div className="cr-develop-inner">
        <label
          data-develop-row=""
          data-invalid={refusal ? "" : undefined}
          className="cr-develop relative flex h-12 w-full items-center gap-3 rounded-2xl px-4"
        >
          <Clock
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground"
          />
          <span aria-hidden className="text-working text-muted-foreground">
            Develops
          </span>
          <span
            aria-hidden
            data-develop-words=""
            className="ml-auto text-working font-medium"
          >
            {shown && now !== null ? wordsFor(shown, now) : ""}
          </span>
          <ChevronDown
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground"
          />
          <input
            id={fieldId}
            type="datetime-local"
            aria-label="Develop time"
            aria-invalid={refusal ? true : undefined}
            aria-describedby={refusal ? refusalId : undefined}
            value={draft ?? (developsAt ? toLocalInput(developsAt) : "")}
            min={
              now === null
                ? undefined
                : toLocalInput(
                    new Date(now + DEVELOPS_NOW_WITHIN_MS).toISOString(),
                  )
            }
            max={
              now === null
                ? undefined
                : toLocalInput(
                    new Date(
                      now + DEVELOP_MAX_AHEAD_DAYS * 86_400_000,
                    ).toISOString(),
                  )
            }
            onChange={(e) => onDraft(e.target.value)}
            onBlur={onFinish}
            onKeyDown={(e) => {
              if (e.key === "Enter") onFinish();
              // A key can open the picker too (the field's own segments are out of sight under the row).
              if (e.key === " ") {
                e.preventDefault();
                openPicker(e.currentTarget);
              }
            }}
            onClick={(e) => openPicker(e.currentTarget)}
            className="cr-develop-input"
          />
        </label>
        <p
          id={refusalId}
          aria-live="polite"
          className="mt-2 px-1 text-caption text-pretty text-destructive empty:hidden"
        >
          {refusal ?? ""}
        </p>
        {after}
      </div>
    </div>
  );
}
