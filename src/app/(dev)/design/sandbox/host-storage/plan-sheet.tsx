"use client";

import type { ReactNode } from "react";
import { ArrowUpRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { floatingPopupShapes } from "@/components/ui/floating-layer";
import { POPUP_KINDS } from "@/components/ui/popup-kinds";
import { TIER_NAMES } from "@/lib/constants/tiers";
import { cn } from "@/lib/utils";

/**
 * THE PLAN AS IT SHIPS FOR A PRO HOST (`pricing-sheet.tsx`, kind `plan`):
 * popups' `plans=wide`, a wide dialog at a desk and the whole screen under a
 * close in a hand (`POPUP_KINDS.plan`), its head, its body, the portal door and
 * the quiet foot, verbatim. Only the six prices inside it change between
 * options.
 *
 * ★ QUOTED, NOT MOUNTED. `PopupContent` is a Radix Dialog: it would portal to
 * the lab page's document from inside this frame and lock that page's scroll.
 * So this is one still element wearing the shipped classes: `CONTENT` below is
 * `popup.tsx`'s own (not exported), and the shape is `floatingPopupShapes`
 * itself, scoped by the same `data-shape` the real element sets for the width
 * it opens at. A retune of the wide or cover shape reaches this board with
 * no edit here.
 */

const CONTENT =
  "fixed z-50 flex flex-col overflow-hidden bg-popover text-sm text-popover-foreground shadow-layer outline-none";

/** The scrim a centred shape stands over; a whole screen draws none. */
export function Scrim() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs"
    />
  );
}

/** `lead()`'s Pro sentence, verbatim (a Pro host whose switch is open). */
const TITLE = `You are on ${TIER_NAMES.pro} already`;
const SUB =
  "Change your size, or switch between monthly and yearly, here. Your card, invoices and cancelling stay in the billing portal.";

export function PlanSheet({
  desk,
  children,
}: {
  desk: boolean;
  children: ReactNode;
}) {
  const shape = desk ? POPUP_KINDS.plan.desk : POPUP_KINDS.plan.hand;
  return (
    <>
      {desk && <Scrim />}
      <div
        role="dialog"
        aria-modal
        aria-label={TITLE}
        data-hs-sheet=""
        data-kind="plan"
        data-shape={shape}
        className={cn(CONTENT, floatingPopupShapes)}
      >
        <div className="flex shrink-0 flex-col gap-1 p-4 pr-12">
          <p className="font-heading text-card-title font-medium text-pretty text-foreground">
            {TITLE}
          </p>
          <p className="text-sm text-pretty text-muted-foreground">{SUB}</p>
        </div>

        <div
          data-hs-body=""
          className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 pb-4"
        >
          {children}

          <Button type="button" variant="outline" size="sm" className="w-full">
            Manage billing
          </Button>

          {/* The quiet foot (`learn=foot`), drawn still: a new tab in
              production, and nowhere from inside a frame. */}
          <span className="inline-flex items-center gap-1 pt-1 text-xs text-muted-foreground">
            See every plan <ArrowUpRight className="size-3.5" aria-hidden />
          </span>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          tabIndex={-1}
          className={cn("absolute", desk ? "top-2 right-2" : "top-3 right-3")}
        >
          <X />
          <span className="sr-only">Close</span>
        </Button>
      </div>
    </>
  );
}
