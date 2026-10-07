"use client";

import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatBytesUp, planWithBilling } from "@/lib/billing/storage-guard";
import { cn, formatBytes } from "@/lib/utils";

import type { FitGoal, StorageGoal } from "./storage-list";
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
 * ★ HER OWN PLAN'S GOAL DRAWS HER PLAN'S LINE (host-moments r1, Will 2026-10-07, `goal=line`; crumbs-32 opened it
 * from the over-cap banner): nothing is switched, so it has no button; it draws what she stores as a bar with her
 * plan's line across it, the part past the line shrinking as she picks, and ends "Fits Pro 50 GB once these go"
 * (`PlanLine`). The switch goal keeps its words.
 *
 * The count is a live region: a screen reader hears it close, and hears where she stands once it does.
 */
export type GoalPhase = "idle" | "deleting" | "opening";

/** What the switch strip says: the gap left, or that it is closed, for the size she is here for. */
function switchWords(
  goal: Exclude<StorageGoal, FitGoal>,
  count: GoalCount,
): string {
  return count.done
    ? `Enough freed for ${goal.target.name}`
    : `left to free for ${goal.target.name}`;
}

/**
 * What her own plan's line says: how far over she still is (the over-cap banner's own number, counting down), then
 * that she fits once what she picked goes, or that she fits.
 */
export function planLineWords(
  goal: FitGoal,
  count: GoalCount,
): { over: string | null; done: string | null } {
  const plan = goal.plan ?? "your plan";
  const step = fitStep(count);
  if (step === "counting") {
    return { over: formatBytesUp(count.remaining), done: null };
  }
  return {
    over: null,
    done: step === "delete" ? `Fits ${plan} once these go` : `Fits ${plan}`,
  };
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
  if (goal.kind === "fit") return <PlanLine goal={goal} count={count} />;
  const step = goalStep(count);
  const label =
    step === "delete-and-switch"
      ? "Delete and switch"
      : `Switch to ${planWithBilling(goal.target)}`;
  // Working = words (identity r5): the key says what it is doing beside the arc, and holds its width.
  const workingLabel =
    phase === "deleting"
      ? "Deleting"
      : phase === "opening"
        ? "Opening"
        : undefined;
  const words = switchWords(goal, count);
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
        {count.done && goal.canSwitch ? (
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

/** One part of the plan's bar, sliding as she picks (the house curve; still for reduced motion). */
const SLIDES =
  "absolute inset-y-0 transition-[left,width] duration-300 ease-emphasis motion-reduce:transition-none";

/**
 * HER PLAN'S LINE, DRAWN (`goal=line`): the bar is what she stored as this visit began (the count's gap past her
 * cap, and the cap), her plan's line stands across it at the cap, and three parts fill it: what stays, up to the
 * line; what still stands past it, in the alarm's colour, which is the number above counting down; and what goes,
 * hatched (deleted for good here, or selected). As she picks, the hatch takes the part past the line until none is
 * left. ★ ONE NUMBER WITH THE BANNER: what stands past the line is the count's `remaining`, the gap the over-cap
 * banner's key said, rounded up the same way.
 */
function PlanLine({ goal, count }: { goal: FitGoal; count: GoalCount }) {
  const cap = goal.capBytes;
  const total = cap + count.gap;
  const going = Math.min(count.freed, total);
  const after = total - going;
  const pct = (bytes: number) =>
    `${total > 0 ? (Math.max(0, bytes) / total) * 100 : 0}%`;
  const words = planLineWords(goal, count);
  return (
    <div
      data-storage-goal=""
      data-storage-goal-line=""
      data-state={fitStep(count)}
      className="border-b px-4 py-3"
    >
      <div className="flex min-h-7 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p
          aria-live="polite"
          className="min-w-0 text-sm font-medium text-pretty text-foreground"
        >
          {words.done ? (
            <span className="inline-flex items-center gap-1.5">
              <Check className="size-4 shrink-0 text-success" aria-hidden />
              {words.done}
            </span>
          ) : (
            <>
              <span className="tabular-nums">{words.over}</span> over your plan
            </>
          )}
        </p>
        <p
          data-storage-goal-stored=""
          className="text-xs text-muted-foreground tabular-nums"
        >
          {`${formatBytesUp(after)} of ${formatBytes(cap)}`}
        </p>
      </div>
      <span
        aria-hidden
        className="relative mt-2 block h-2 rounded-full bg-muted"
      >
        <span
          className={cn(SLIDES, "left-0 rounded-l-full bg-foreground/70")}
          style={{ width: pct(Math.min(after, cap)) }}
        />
        <span
          data-storage-goal-past=""
          className={cn(SLIDES, "bg-destructive")}
          style={{ left: pct(cap), width: pct(after - cap) }}
        />
        <span
          data-storage-goal-going=""
          className={cn(
            SLIDES,
            "rounded-r-full bg-[repeating-linear-gradient(135deg,var(--color-muted-foreground)_0_2px,transparent_2px_5px)] opacity-50",
          )}
          style={{ left: pct(after), width: pct(going) }}
        />
        {/* Her plan's line, standing across the bar where it holds. */}
        <span
          className="absolute -inset-y-1 w-0.5 -translate-x-1/2 rounded-full bg-foreground"
          style={{ left: pct(cap) }}
        />
      </span>
      <p className="mt-1.5 text-right text-micro text-muted-foreground">
        {`Your plan: ${goal.plan ?? formatBytes(cap)}`}
      </p>
    </div>
  );
}
