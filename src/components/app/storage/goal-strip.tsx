"use client";

import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatBytesUp, planWithBilling } from "@/lib/billing/storage-guard";
import { cn } from "@/lib/utils";

import type { StorageGoal } from "./storage-list";
import { fitStep, goalStep, type GoalCount } from "./storage-list-rules";

/**
 * THE LIVE STRIP (host-storage r1, `goal=live`): when a smaller plan is why she is here, it counts
 * down as she selects, and at zero its own button finishes the switch.
 *
 * ★ ITS BUTTON DELETES FIRST. The switch is checked against what she STORES, her albums and her
 * Deleted together (trash-in-storage), so while anything is only selected it reads "Delete and
 * switch" (they are deleted for good, once she confirms, then the switch opens); once nothing is
 * pending it reads "Switch to Pro 200 GB, monthly", the price she tapped, named with its billing
 * because that is exactly what Stripe's confirm page will show her. The change-plan route decides
 * again, whatever this strip counted.
 *
 * ★ HER OWN PLAN'S GOAL HAS NO BUTTON (crumbs-32, the over-cap banner's door): nothing is switched,
 * so it counts to her cap and says where she stands, enough only selected (the bar's Delete for
 * good finishes it) or enough freed.
 *
 * The count is a live region: a screen reader hears it close, and hears "Enough freed" once.
 */
export type GoalPhase = "idle" | "deleting" | "opening";

/** What the strip says: the gap left, or that it is closed, for the plan she is here for. */
function goalWords(goal: StorageGoal, count: GoalCount): string {
  if (goal.kind === "fit") {
    if (!count.done) return "left to free to fit your plan";
    return count.pending > 0
      ? "Enough selected to fit your plan"
      : "Enough freed to fit your plan";
  }
  return count.done
    ? `Enough freed for ${goal.target.name}`
    : `left to free for ${goal.target.name}`;
}

export function GoalStrip({
  goal,
  count,
  phase,
  onFinish,
}: {
  /** The price she tapped that could not hold what she stores, or her own plan's cap. */
  goal: StorageGoal;
  count: GoalCount;
  phase: GoalPhase;
  onFinish: () => void;
}) {
  const fit = goal.kind === "fit";
  const step = fit ? fitStep(count) : goalStep(count);
  const label =
    step === "delete-and-switch"
      ? "Delete and switch"
      : goal.kind === "fit"
        ? null
        : `Switch to ${planWithBilling(goal.target)}`;
  // Working = words (identity r5): the key says what it is doing beside the arc, and holds its width.
  const workingLabel =
    phase === "deleting" ? "Deleting" : phase === "opening" ? "Opening" : undefined;
  const words = goalWords(goal, count);
  return (
    <div data-storage-goal="" data-state={step} className="border-b px-4 py-3">
      <div className="flex min-h-7 flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <p
          aria-live="polite"
          className="min-w-0 text-sm font-medium text-pretty text-foreground"
        >
          {count.done ? (
            <span className="inline-flex items-center gap-1.5">
              <Check className="size-4 shrink-0 text-success" aria-hidden />
              {words}
            </span>
          ) : (
            <>
              <span className="tabular-nums">
                {formatBytesUp(count.remaining)}
              </span>{" "}
              {words}
            </>
          )}
        </p>
        {count.done && goal.kind !== "fit" && goal.canSwitch && label ? (
          <Button
            type="button"
            size="sm"
            data-storage-finish={step}
            working={phase !== "idle"}
            workingLabel={workingLabel}
            onClick={onFinish}
            // Beside the count when both fit; on its own line, at the end, when not.
            className="ml-auto"
          >
            {label}
          </Button>
        ) : null}
      </div>
      <span
        aria-hidden
        className="mt-2 block h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <span
          className={cn(
            "block h-full rounded-full transition-[width,background-color] duration-300 ease-emphasis",
            count.done ? "bg-success" : "bg-foreground/70",
          )}
          style={{ width: `${Math.max(count.percent, 2)}%` }}
        />
      </span>
    </div>
  );
}
