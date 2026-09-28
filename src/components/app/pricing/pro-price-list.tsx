"use client";

import { useState } from "react";

import { ChangePlanButton } from "@/components/app/pricing/change-plan-button";
import { RefusalFace } from "@/components/app/storage/refusal-face";
import {
  planHolds,
  proFitLine,
  type StorageRefusal,
} from "@/lib/billing/storage-guard";
import { planById, type Plan } from "@/lib/constants/tiers";
import type { PlanFacts } from "@/lib/billing/plan-facts";
import { CHANGE_REFUSAL_MESSAGES } from "@/lib/stripe/change-plan";
import {
  isProPlanId,
  PRO_PLAN_IDS,
  type ProPlanId,
} from "@/lib/validation/checkout";

/**
 * A PRO HOST'S PLAN, AS SIX PRICES (the storage guard, billing-caps.md). The general
 * billing portal used to own every Pro move, and its switcher could not know what a
 * host stores; this list is where sizes and cadences change now, and every row's
 * switch runs the storage check before Stripe's confirm page opens.
 *
 * ★ TODAY'S SIX PLAIN ROWS, UNTIL `prices` ROUND TWO PICKS THEIR FACE. The six prices,
 * hers marked, the sizes that cannot hold what she stores marked too, one sentence with
 * the numbers, and one line before a shrink about Deleted. Rows are buttons, never
 * radios or a slider, so the sheet's `carry=cards` contract (no selector) still holds.
 *
 * ★ TOO SMALL IS A PRESS NOW (host-storage r1, `refusal=inline`): the row she taps
 * flips in place to the refusal, the list's full width (`RefusalFace`), with what she
 * stores, what the size holds, the gap, and the two ways out; a switch the server
 * refused (she stores more than when the sheet opened) flips its row the same way, on
 * the refusal's own figure. A flipped row whose size holds her bytes again (she
 * removed enough in the list and the sheet re-read) is a price again, with its Switch.
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
  onStorageChanged,
}: {
  /** The sheet's server read; null until it lands (or when it could not). */
  facts: PlanFacts | null;
  returnTo?: string;
  /** Something was removed or put back from the list: the sheet re-reads its facts. */
  onStorageChanged?: () => void;
}) {
  const [flipped, setFlipped] = useState<ProPlanId | null>(null);
  // A refused switch's figure, fresher than the facts it beat; the next read supersedes it.
  const [refusedAt, setRefusedAt] = useState<number | null>(null);
  const [factsSeen, setFactsSeen] = useState(facts);
  if (facts !== factsSeen) {
    setFactsSeen(facts);
    setRefusedAt(null);
  }

  const stored = refusedAt ?? facts?.activeBytes ?? null;
  const current =
    facts?.currentPlanId && isProPlanId(facts.currentPlanId)
      ? planById(facts.currentPlanId)
      : null;
  const blocked = facts?.changeBlocked ?? null;
  const capBytes = facts?.capBytes ?? null;
  const fits = (plan: Plan) => stored === null || planHolds(plan, stored);

  function refused(refusal: StorageRefusal) {
    setRefusedAt(refusal.storedBytes);
    if (isProPlanId(refusal.planId)) setFlipped(refusal.planId);
  }

  const showsRefusal =
    flipped !== null &&
    stored !== null &&
    !planHolds(planById(flipped), stored);
  const fitLine = stored === null ? null : proFitLine(stored, current);
  const offersShrink =
    capBytes !== null &&
    ROWS.some(
      (plan) =>
        fits(plan) && plan.id !== current?.id && plan.storageBytes < capBytes,
    );

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-border rounded-xl border">
        {ROWS.map((plan) => {
          const isCurrent = plan.id === current?.id;
          const holds = fits(plan);
          if (
            !isCurrent &&
            showsRefusal &&
            flipped === plan.id &&
            stored !== null
          ) {
            return (
              <li
                key={plan.id}
                data-price-row={plan.id}
                data-fits="false"
                data-flipped="true"
                className="bg-destructive/5 p-3 first:rounded-t-xl last:rounded-b-xl"
              >
                <RefusalFace
                  plan={plan}
                  storedBytes={stored}
                  current={current}
                  capBytes={capBytes}
                  canSwitch={!blocked}
                  returnTo={returnTo}
                  onKeep={() => setFlipped(null)}
                  onRefused={refused}
                  onStorageChanged={onStorageChanged}
                />
              </li>
            );
          }
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
                <button
                  type="button"
                  data-too-small={plan.id}
                  aria-label={`${plan.name}, ${plan.priceLabel}: too small for what you store. See why`}
                  onClick={() => setFlipped(plan.id)}
                  className="-mr-1.5 inline-flex h-7 shrink-0 items-center rounded-action-sm px-1.5 text-xs text-muted-foreground underline-offset-4 transition-colors duration-150 ease-emphasis outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  Too small
                </button>
              ) : blocked ? null : (
                <ChangePlanButton
                  planId={plan.id}
                  next={returnTo}
                  onRefused={refused}
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

      {/* FIT, plainly, while no row is flipped (the flipped row says it with
          its own numbers): read at her billing, and never offering the plan
          she is on (`proFitLine`). */}
      {!showsRefusal && fitLine ? (
        <p
          data-note="fit"
          className="text-xs text-pretty text-muted-foreground"
        >
          {fitLine}
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
