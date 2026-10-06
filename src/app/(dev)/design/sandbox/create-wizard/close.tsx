"use client";

import { Check } from "lucide-react";

import { BeatSteps } from "@/components/app/create-event-wizard/beat";
import {
  type Readiness,
  readyHead,
  settingsSteps,
} from "@/lib/events/readiness";
import { cn } from "@/lib/utils";

/**
 * WHAT CREATE CLOSES ON, UNDER PRINT AND SHARE (F1, built in text on
 * 2026-10-04 as Settings' five marks): four answers, from all of Settings to
 * none of it, each read off production's own readiness of the new event
 * (`readiness.ts`), so the steps, the ticks and what guests still need are
 * the event's, never this board's.
 *
 *  - `marks`: production's `BeatSteps`, untouched.
 *  - `next`: one line, what guests still need. A new event's one essential
 *    left is always the code (its door and its adds are born done), which the
 *    two rounds above it already do, so the line points at them. Its words
 *    are this board's: a wiring keeps them beside the code's own item.
 *  - `named`: Settings' five steps as chips, each titled as Settings' rail
 *    titles it (`settingsSteps`), the done ones ticked.
 *  - `none`: nothing.
 */

export type CloseWay = "marks" | "next" | "named" | "none";

/** What guests still need, in one line: the essential left, said as the two rounds above it do it. */
function stillNeeds(r: Readiness): string {
  const need = r.left.find((i) => i.essential);
  if (!need) return readyHead(r).line;
  if (need.id === "code")
    return "Guests still need your code: print it, or share it.";
  return `Guests still need ${need.title.charAt(0).toLowerCase()}${need.title.slice(1)}.`;
}

export function Close({ way, r }: { way: CloseWay; r: Readiness }) {
  if (way === "none") return null;
  if (way === "marks") return <BeatSteps r={r} onPlans={() => {}} />;
  if (way === "next")
    return (
      <p
        data-cw-close="next"
        className="max-w-[18rem] text-center text-caption text-pretty text-muted-foreground"
      >
        {stillNeeds(r)}
      </p>
    );
  const steps = settingsSteps(r);
  return (
    <ol
      data-cw-close="named"
      aria-label="Settings' steps"
      className="flex max-w-[22rem] flex-wrap justify-center gap-1.5 md:max-w-[34rem]"
    >
      {steps.map((s) => (
        <li
          key={s.item}
          data-done={s.done ? "true" : "false"}
          className={cn(
            "cw-chip flex h-7 items-center gap-1.5 rounded-full pr-3 pl-1 text-caption",
            s.done ? "text-muted-foreground" : "text-foreground",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "flex size-5 items-center justify-center rounded-full",
              s.done
                ? "bg-success text-success-foreground"
                : "bg-muted text-[11px] font-semibold text-muted-foreground tabular-nums ring-1 ring-foreground/10",
            )}
          >
            {s.done ? <Check className="size-3" strokeWidth={3} /> : s.n}
          </span>
          {s.title}
          <span className="sr-only">{s.done ? ", done" : ", to do"}</span>
        </li>
      ))}
    </ol>
  );
}
