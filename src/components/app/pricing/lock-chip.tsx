"use client";

import { useState } from "react";
import { Lock } from "lucide-react";

import {
  PricingSheet,
  type PricingPlanFacts,
} from "@/components/app/pricing/pricing-sheet";
import {
  LOCKED_FEATURES,
  type LockedFeature,
} from "@/components/app/pricing/triggers";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { trackAttrs } from "@/lib/analytics/events";
import { TIER_NAMES } from "@/lib/constants/tiers";
import { cn } from "@/lib/utils";

/**
 * THE ONE COMPONENT BEHIND EVERY LOCKED CONTROL (`words=chip`, Will
 * 2026-09-20), and his note is the whole specification of it: "the lock chip
 * should also provide context on why it's locked and provide action to
 * upgrade, rather than simply appear unusable. Convert, not block."
 *
 * So it is a BUTTON, never a disabled thing with a sad sentence beside it:
 *  - it shows the control's own name, so the row still reads as the control;
 *  - it names the plan that opens it, so the cost is visible before a click;
 *  - its tooltip says WHY it is locked (the Free truth) and WHAT opens it;
 *  - pressing it opens the pricing sheet led by this exact feature.
 *
 * It replaces four hand-written sentences that worded one rule four ways
 * (password-protected albums, the custom link, the password setting, video
 * uploads). One record in `triggers.ts` is now the only place any of them is
 * written, and a fifth gated control is a row there rather than a fifth
 * sentence.
 *
 * ★ THE SHEET IS DRIVEN, NOT TRIGGERED, AND THAT IS MECHANICAL. `SheetTrigger`
 * and `TooltipTrigger` both want to BE this button through `asChild`, and only
 * one of them can have it; nesting the two around a single element is the bug
 * that silently drops the tooltip's handlers. So the tooltip owns the element
 * and the press opens a controlled sheet. Radix returns focus to the button on
 * close either way.
 *
 * ★ THE CHIP ONLY EVER RENDERS FOR A HOST THE SERVER HAS ALREADY CALLED FREE.
 * Every call site gates it on the `locked` / `videosAllowed` prop it already
 * receives, which is `isSettingLocked(..., tier)` over the RLS-scoped profile
 * row. The chip therefore claims no entitlement of its own: it passes
 * `tier: "free"` to the sheet as CONTEXT, and the sheet's buy buttons are
 * re-resolved against `profiles` inside the checkout route (billing-caps.md).
 * A chip rendered wrongly shows a wrong headline, never a wrong permission.
 */
export function LockChip({
  feature,
  returnTo,
  className,
}: {
  feature: LockedFeature;
  /**
   * Where Checkout should come back to, so the host lands on this very control
   * with it open (`back=finish`). Validated server-side; omit for the
   * dashboard.
   */
  returnTo?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const { name, why, unlocks } = LOCKED_FEATURES[feature];
  const plan: PricingPlanFacts = { tier: "free", hasBilling: false };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            data-lock-chip={feature}
            onClick={() => setOpen(true)}
            // The accessible name carries the feature AND the plan, because a
            // screen reader gets no tooltip and no chip colour: "Password lock,
            // on Pro. See plans." is the whole of what the sighted row says.
            aria-label={`${name}, on ${TIER_NAMES.pro}. See plans.`}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-action-sm border border-border bg-card px-2.5 text-xs font-medium text-muted-foreground outline-none transition-[transform,background-color,color] duration-150 ease-emphasis hover:bg-muted hover:text-foreground active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring/50",
              className,
            )}
            {...trackAttrs("cta_click", {
              cta: "lock-chip",
              location: feature,
            })}
          >
            <Lock className="size-3" aria-hidden />
            {name}
            <span className="text-faint">{TIER_NAMES.pro}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {why} {unlocks}.
        </TooltipContent>
      </Tooltip>
      <PricingSheet
        open={open}
        onOpenChange={setOpen}
        trigger={{ kind: "locked", feature }}
        plan={plan}
        returnTo={returnTo}
      />
    </>
  );
}
