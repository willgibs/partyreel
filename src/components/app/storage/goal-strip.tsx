"use client";

import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatBytesUp, planWithBilling } from "@/lib/billing/storage-guard";
import type { Plan } from "@/lib/constants/tiers";
import { cn } from "@/lib/utils";

import { goalStep, type GoalCount } from "./storage-list-rules";

/**
 * THE LIVE STRIP (host-storage r1, `goal=live`): when a smaller plan is why she is here, it counts
 * down as she selects, and at zero its own button finishes the switch.
 *
 * ★ ITS BUTTON REMOVES FIRST. The switch is checked against what she STORES, so while anything is
 * only selected it reads "Remove and switch" (they go to Deleted, then the switch opens); once
 * nothing is pending it reads "Switch to Pro 100 GB, monthly", the price she tapped, named with
 * its billing because that is exactly what Stripe's confirm page will show her. The change-plan
 * route decides again, whatever this strip counted.
 *
 * The count is a live region: a screen reader hears it close, and hears "Enough freed" once.
 */
export type GoalPhase = "idle" | "removing" | "opening";

export function GoalStrip({
  target,
  count,
  canSwitch,
  phase,
  onFinish,
}: {
  /** The price she tapped that could not hold what she stores. */
  target: Plan;
  count: GoalCount;
  /** False while her subscription cannot change here (the plan's note says why). */
  canSwitch: boolean;
  phase: GoalPhase;
  onFinish: () => void;
}) {
  const step = goalStep(count);
  const label =
    phase === "removing"
      ? "Removing…"
      : phase === "opening"
        ? "Opening…"
        : step === "remove-and-switch"
          ? "Remove and switch"
          : `Switch to ${planWithBilling(target)}`;
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
              Enough freed for {target.name}
            </span>
          ) : (
            <>
              <span className="tabular-nums">
                {formatBytesUp(count.remaining)}
              </span>{" "}
              left to free for {target.name}
            </>
          )}
        </p>
        {count.done && canSwitch ? (
          <Button
            type="button"
            size="sm"
            data-storage-finish={step}
            disabled={phase !== "idle"}
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
