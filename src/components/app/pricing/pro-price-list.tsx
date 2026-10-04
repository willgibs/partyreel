"use client";

import { useState } from "react";

import {
  CadenceToggle,
  type Cadence,
} from "@/components/app/pricing/cadence-toggle";
import { ChangePlanButton } from "@/components/app/pricing/change-plan-button";
import {
  HeldChip,
  PlanCardHead,
  planCardClass,
} from "@/components/app/pricing/plan-card";
import { RefusalFace } from "@/components/app/storage/refusal-face";
import type { PlanFacts } from "@/lib/billing/plan-facts";
import {
  formatBytesUp,
  planHolds,
  proFitLine,
  type StorageRefusal,
} from "@/lib/billing/storage-guard";
import {
  ESTIMATE_BASIS_NOTE,
  formatCapacity,
  planById,
  plansForTier,
  type Plan,
} from "@/lib/constants/tiers";
import { CHANGE_REFUSAL_MESSAGES } from "@/lib/stripe/change-plan";
import { cn, formatBytes } from "@/lib/utils";
import { isProPlanId, type ProPlanId } from "@/lib/validation/checkout";

/**
 * A PRO HOST'S PLAN: THREE SIZES UNDER ONE MONTHLY / YEARLY TOGGLE (host-storage r2, Will
 * 2026-09-28: `prices=sizes`, "Three sizes, her bytes in each", with his note: "it feels really
 * weird how we're including monthly AND yearly pricing at the same time in each card ... Would make
 * much more sense to follow the common/expected pattern of a monthly/yearly toggle up top (users
 * know there's always savings for annual, we could include a discount tag beside yearly) so each
 * card can focus on the plan/storage, not comparing monthly vs yearly within each").
 *
 * So: the toggle on top (opening on HER billing, the saving tagged beside Yearly), then one card per
 * size, smallest first, the sheet's own card grammar (`plan-card.tsx`) stacked full width. A card is
 * the size at the billing shown, what it holds, and a bar of how full what she stores would make
 * it, so fit is drawn before a tap: the size that cannot hold her bytes is visibly over. Her plan is
 * the ink card, held; her size at the other billing is a real switch, and says so ("Switch to
 * yearly"). The six prices are all still here, three a side.
 *
 * ★ WHAT `storage-wiring` BUILT ON THESE ROWS STAYS (the brief): a size too small is a PRESS that
 * flips its card in place to the refusal, the list's full width (`RefusalFace`), with what she
 * stores, what the size holds, the gap, and the two ways out ("Keep Pro 500 GB" when the size
 * that fits is hers, that size's other price when it is not); a switch the server refused (she
 * stores more than when the sheet opened) flips its card the same way, on the refusal's own
 * figure, on the billing it was for. A flipped card whose size holds her bytes again (she removed
 * enough in the list and the sheet re-read) is a price again, with its Switch. Every switch runs
 * the storage check before Stripe's confirm page (billing-caps.md); sizes are cards with buttons
 * under one toggle, never a selector or a slider.
 */

/** The three sizes at one billing, smallest first: how a host scans for "the one that fits". */
function sizesAt(cadence: Cadence): (Plan & { id: ProPlanId })[] {
  return plansForTier("pro", cadence)
    .filter((plan): plan is Plan & { id: ProPlanId } => isProPlanId(plan.id))
    .sort((a, b) => a.storageBytes - b.storageBytes);
}

const billingWord = (cadence: Cadence) =>
  cadence === "year" ? "yearly" : "monthly";

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
  // Her own press on the toggle; until she makes one, the list shows her billing.
  const [chosen, setChosen] = useState<Cadence | null>(null);
  const [flipped, setFlipped] = useState<ProPlanId | null>(null);
  // A refused switch's figure, fresher than the facts it beat; the next read supersedes it.
  const [refusedAt, setRefusedAt] = useState<number | null>(null);
  const [factsSeen, setFactsSeen] = useState(facts);
  if (facts !== factsSeen) {
    setFactsSeen(facts);
    setRefusedAt(null);
  }

  const stored = refusedAt ?? facts?.storedBytes ?? null;
  const current =
    facts?.currentPlanId && isProPlanId(facts.currentPlanId)
      ? planById(facts.currentPlanId)
      : null;
  const cadence: Cadence = chosen ?? current?.interval ?? "month";
  const sizes = sizesAt(cadence);
  const blocked = facts?.changeBlocked ?? null;
  const fits = (plan: Plan) => stored === null || planHolds(plan, stored);

  function refused(refusal: StorageRefusal) {
    setRefusedAt(refusal.storedBytes);
    if (isProPlanId(refusal.planId)) {
      setFlipped(refusal.planId);
      // A refusal shows on the billing it was for, whichever side she was looking at.
      setChosen(planById(refusal.planId).interval ?? "month");
    }
  }

  function toggle(next: Cadence) {
    setChosen(next);
    // A new billing is a new question: nothing stays flipped across it.
    setFlipped(null);
  }

  const showsRefusal =
    flipped !== null &&
    stored !== null &&
    sizes.some((plan) => plan.id === flipped) &&
    !planHolds(planById(flipped), stored);
  // Read at the billing on show, so the line never names a price the cards are not showing.
  const fitLine = stored === null ? null : proFitLine(stored, current, cadence);

  return (
    <div className="space-y-3">
      <CadenceToggle value={cadence} onChange={toggle} />

      <ul
        aria-label={`Pro sizes, ${billingWord(cadence)}`}
        className="space-y-2.5"
      >
        {sizes.map((plan) => {
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
                className="rounded-xl border border-dashed border-destructive/50 bg-destructive/5 p-4"
              >
                <RefusalFace
                  plan={plan}
                  storedBytes={stored}
                  current={current}
                  canSwitch={!blocked}
                  returnTo={returnTo}
                  onKeep={() => setFlipped(null)}
                  onRefused={refused}
                  onStorageChanged={onStorageChanged}
                />
              </li>
            );
          }
          // Her size at the other billing: the switch that changes only how she pays.
          const sameSize =
            current !== null && plan.storageBytes === current.storageBytes;
          return (
            <li
              key={plan.id}
              data-price-row={plan.id}
              data-current={isCurrent ? "true" : undefined}
              data-fits={holds ? "true" : "false"}
              className={planCardClass(isCurrent)}
            >
              <PlanCardHead
                plan={plan}
                ink={isCurrent}
                // The basis is said once, under the three (ESTIMATE_BASIS_NOTE).
                holds={`about ${formatCapacity(plan.storageBytes, { basis: false })}`}
                aside={
                  isCurrent ? (
                    <HeldChip ink />
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
                      {sameSize
                        ? `Switch to ${billingWord(cadence)}`
                        : "Switch"}
                    </ChangePlanButton>
                  )
                }
              />
              {stored !== null && stored > 0 ? (
                <FitBar
                  stored={stored}
                  bytes={plan.storageBytes}
                  ink={isCurrent}
                />
              ) : null}
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

      {/* FIT, plainly, while no card is flipped (the flipped card says it with
          its own numbers): read at the billing on show, and never offering the
          plan she is on (`proFitLine`). */}
      {!showsRefusal && fitLine ? (
        <p
          data-note="fit"
          className="text-xs text-pretty text-muted-foreground"
        >
          {fitLine}
        </p>
      ) : null}

      {/* What every "about N photos" above assumes: once, under the three,
          the quietest line last. */}
      <p data-note="basis" className="text-xs text-pretty text-faint">
        {ESTIMATE_BASIS_NOTE}
      </p>
    </div>
  );
}

/**
 * HOW FULL WHAT SHE STORES WOULD MAKE THIS SIZE: the storage meter's own bar (a fill with no
 * light, `bg-foreground/70`: nothing near a cap is lit), and past the plain cap the one colour
 * failure wears. What she stores prints through the storage flow's one rounding (up), as the
 * meter and the refusal print it; so does the gap, which is an instruction.
 */
function FitBar({
  stored,
  bytes,
  ink,
}: {
  stored: number;
  bytes: number;
  ink: boolean;
}) {
  const ratio = stored / bytes;
  const over = ratio > 1;
  const pct = Math.min(100, Math.max(2, ratio * 100));
  return (
    <div className="space-y-1" data-fit-bar="">
      <span
        aria-hidden
        className={cn(
          "block h-1.5 overflow-hidden rounded-full",
          ink ? "bg-background/20" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "block h-full rounded-full",
            over
              ? "bg-destructive"
              : ink
                ? "bg-background/85"
                : "bg-foreground/70",
          )}
          style={{ width: `${pct}%` }}
        />
      </span>
      <p
        className={cn(
          "text-xs tabular-nums",
          over
            ? "text-destructive"
            : ink
              ? "text-background/70"
              : "text-muted-foreground",
        )}
      >
        {fitBarLine(stored, bytes)}
      </p>
    </div>
  );
}

/**
 * The bar's line: what she stores of this size, and how full that makes it, or how far over. ★ UNDER
 * ONE PERCENT IT SAYS SO: floored at 1%, 97.9 MB of 2 TB read "1% full" of a size it barely touches.
 * The bar draws only once she stores something, so a size is never "0% full" here.
 */
export function fitBarLine(stored: number, bytes: number): string {
  const of = `${formatBytesUp(stored)} of ${formatBytes(bytes)}`;
  if (stored > bytes) {
    return `${of} · over by ${formatBytesUp(stored - bytes)}`;
  }
  const percent = (stored / bytes) * 100;
  return percent < 1
    ? `${of} · under 1% full`
    : `${of} · ${Math.round(percent)}% full`;
}
