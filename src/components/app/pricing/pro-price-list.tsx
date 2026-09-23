"use client";

import { ChangePlanButton } from "@/components/app/pricing/change-plan-button";
import {
  planHolds,
  refusalSentence,
  type StorageRefusal,
} from "@/lib/billing/storage-guard";
import { planById, type Plan } from "@/lib/constants/tiers";
import type { PlanFacts } from "@/lib/billing/plan-facts";
import { CHANGE_REFUSAL_MESSAGES } from "@/lib/stripe/change-plan";
import { PRO_PLAN_IDS, type ProPlanId } from "@/lib/validation/checkout";

/**
 * A PRO HOST'S PLAN, AS SIX PRICES (the storage guard, billing-caps.md). The general
 * billing portal used to own every Pro move, and its switcher could not know what a
 * host stores; this list is where sizes and cadences change now, and every row's
 * switch runs the storage check before Stripe's confirm page opens.
 *
 * ★ PLAIN ON PURPOSE. Its designed face comes from the `host-storage` board; this
 * pass ships the honest version: the six prices, the host's own marked, the sizes
 * that cannot hold what they store marked too, one sentence with the numbers, and
 * one line before a shrink about Deleted. Rows are buttons, never radios or a
 * slider, so the sheet's `carry=cards` contract (no selector) still holds.
 */

/** Size first, then monthly before yearly: how a host scans for "the same, yearly". */
const ROWS: (Plan & { id: ProPlanId })[] = PRO_PLAN_IDS.map((id) => ({
  ...planById(id),
  id,
})).sort(
  (a, b) =>
    a.storageBytes - b.storageBytes ||
    Number(a.interval === "year") - Number(b.interval === "year"),
);

export function ProPriceList({
  facts,
  returnTo,
  refusal,
  onRefused,
}: {
  /** The sheet's server read; null until it lands (or when it could not). */
  facts: PlanFacts | null;
  returnTo?: string;
  /** A refusal a switch came back with (storage grew since the sheet opened). */
  refusal: StorageRefusal | null;
  onRefused: (refusal: StorageRefusal) => void;
}) {
  const stored = facts?.activeBytes ?? null;
  const current = facts?.currentPlanId ?? null;
  const blocked = facts?.changeBlocked ?? null;
  const fits = (plan: Plan) => stored === null || planHolds(plan, stored);

  // The sentence names the LARGEST size that cannot hold what they store (the
  // cheapest move a removal buys) and the smallest that can.
  const tooSmall = ROWS.filter((plan) => !fits(plan));
  const largestTooSmall = tooSmall[tooSmall.length - 1] ?? null;
  const smallestFit = ROWS.find(
    (plan) =>
      fits(plan) &&
      (!largestTooSmall || plan.interval === largestTooSmall.interval),
  );
  const capBytes = facts?.capBytes ?? null;
  const offersShrink =
    capBytes !== null &&
    ROWS.some(
      (plan) =>
        fits(plan) && plan.id !== current && plan.storageBytes < capBytes,
    );

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-border rounded-xl border">
        {ROWS.map((plan) => {
          const isCurrent = plan.id === current;
          const holds = fits(plan);
          return (
            <li
              key={plan.id}
              data-price-row={plan.id}
              data-current={isCurrent ? "true" : undefined}
              data-fits={holds ? "true" : "false"}
              className="flex min-h-12 items-center justify-between gap-3 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {plan.name}
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {plan.priceLabel}
                </p>
              </div>
              {isCurrent ? (
                <span className="inline-flex h-7 items-center rounded-action-sm border border-border px-2.5 text-xs text-muted-foreground">
                  Your plan
                </span>
              ) : !holds ? (
                <span className="text-xs text-faint">Too small</span>
              ) : blocked ? null : (
                <ChangePlanButton
                  planId={plan.id}
                  next={returnTo}
                  onRefused={onRefused}
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                >
                  Switch
                </ChangePlanButton>
              )}
            </li>
          );
        })}
      </ul>

      {blocked ? (
        <p
          data-note="blocked"
          className="text-xs text-pretty text-muted-foreground"
        >
          {CHANGE_REFUSAL_MESSAGES[blocked]}
        </p>
      ) : null}

      {refusal ? (
        <p
          role="alert"
          data-note="refusal"
          className="text-xs text-pretty text-foreground"
        >
          {refusal.message}
        </p>
      ) : stored !== null && largestTooSmall ? (
        <p
          data-note="fit"
          className="text-xs text-pretty text-muted-foreground"
        >
          {refusalSentence(stored, largestTooSmall, smallestFit ?? null)}
        </p>
      ) : null}

      {offersShrink && !blocked ? (
        <p
          data-note="deleted"
          className="text-xs text-pretty text-muted-foreground"
        >
          A smaller size also shrinks Deleted: it keeps items only up to the new
          size.
        </p>
      ) : null}
    </div>
  );
}
