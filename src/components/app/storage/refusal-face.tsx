"use client";

import { useEffect, useRef } from "react";

import { ChangePlanButton } from "@/components/app/pricing/change-plan-button";
import { Button } from "@/components/ui/button";
import {
  fittingProPlans,
  formatBytesUp,
  planWithBilling,
  type StorageRefusal,
} from "@/lib/billing/storage-guard";
import type { Plan } from "@/lib/constants/tiers";
import { cn, formatBytes } from "@/lib/utils";
import { isProPlanId, type ProPlanId } from "@/lib/validation/checkout";

import { StorageList } from "./storage-list";

/**
 * WHAT A TOO-SMALL PRICE FLIPS TO (host-storage r1, `refusal=inline`, with his note: "these
 * should be stacked vertically so each card's lines don't break as quickly, like it does in this
 * tight 3 column layout"). In place, over the price she tapped, the list's full width: what she
 * stores, what that size holds and the gap, then the two ways out, the fix first.
 *
 * ★ THE SECOND WAY OUT IS THE SMALLEST SIZE THAT FITS, AT THE BILLING SHE TAPPED (round two's
 * carried `keep-plan`): when that is the plan she is on it is "Keep Pro 500 GB", which flips the
 * row back, never "choose Pro 500 GB" to a host already on it; tapped yearly, it is that size's
 * yearly price, a real switch through the change-plan route. While her subscription cannot change
 * here, it only flips back.
 *
 * ★ "SEE WHAT'S USING SPACE" STACKS THE LIST OVER THE PLAN, with the price she tapped as its goal:
 * the strip counts down to it and, at zero, finishes this very switch. Its back arrow in a hand
 * says "Your plan", and closing it returns here.
 */
export function RefusalFace({
  plan,
  storedBytes,
  current,
  canSwitch,
  returnTo,
  onKeep,
  onRefused,
  onStorageChanged,
}: {
  /** The price she tapped that cannot hold what she stores. */
  plan: Plan & { id: ProPlanId };
  storedBytes: number;
  /** The plan she is on, when the sheet knows it. */
  current: Plan | null;
  canSwitch: boolean;
  returnTo?: string;
  /** Flip the row back to its price. */
  onKeep: () => void;
  /** The second way out came back refused (she stores more than when the sheet opened). */
  onRefused: (refusal: StorageRefusal) => void;
  /** The list deleted something for good, or emptied Deleted: the plan's facts are stale. */
  onStorageChanged?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // The press that flipped it took its own button away: the face takes the focus it held, so a
  // keyboard or a screen reader lands on what the press produced.
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  const fit = fittingProPlans(storedBytes, plan.interval ?? "month")[0] ?? null;
  // A real switch only to a size that fits, is not hers, and can open here; else Keep.
  const switchTo =
    fit && fit.id !== current?.id && canSwitch && isProPlanId(fit.id)
      ? { ...fit, id: fit.id }
      : null;

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="group"
      aria-label={`${plan.name} is smaller than what you store`}
      data-refusal={plan.id}
      className="animate-in space-y-3 rounded-lg duration-200 ease-emphasis fade-in-0 outline-none"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 text-sm font-medium text-pretty text-foreground">
          {plan.name} is smaller than what you store
        </p>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {plan.priceLabel}
        </span>
      </div>
      <span
        aria-hidden
        className="block h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <span className="block h-full w-full rounded-full bg-destructive" />
      </span>
      <dl className="space-y-1 text-sm">
        <Fact term="You store" value={formatBytesUp(storedBytes)} />
        <Fact
          term={`${plan.name} holds`}
          value={formatBytes(plan.storageBytes)}
        />
        <Fact
          term="Free at least"
          value={formatBytesUp(storedBytes - plan.storageBytes)}
          gap
        />
      </dl>
      <div className="flex flex-col gap-2 sm:flex-row">
        <StorageList
          back="Your plan"
          goal={{ target: plan, canSwitch, returnTo }}
          onChanged={onStorageChanged}
        >
          <Button type="button" size="sm" className="sm:flex-1">
            See what&rsquo;s using space
          </Button>
        </StorageList>
        {switchTo ? (
          <ChangePlanButton
            planId={switchTo.id}
            next={returnTo}
            onRefused={onRefused}
            size="sm"
            variant="outline"
            className="sm:flex-1"
          >
            {`${planWithBilling(switchTo)} instead`}
          </ChangePlanButton>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="sm:flex-1"
            onClick={onKeep}
          >
            {current ? `Keep ${current.name}` : "Keep my plan"}
          </Button>
        )}
      </div>
    </div>
  );
}

function Fact({
  term,
  value,
  gap = false,
}: {
  term: string;
  value: string;
  gap?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{term}</dt>
      <dd
        data-refusal-gap={gap ? "" : undefined}
        className={cn(
          "font-medium tabular-nums",
          gap ? "text-destructive" : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
