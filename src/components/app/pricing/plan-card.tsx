import type { ReactNode } from "react";

import type { Plan } from "@/lib/constants/tiers";
import { cn } from "@/lib/utils";

/**
 * ONE PLAN AS A CARD, the plan sheet's own grammar, shared by its two faces: the Free host's pair
 * (Free over one Pro size) and a Pro host's three sizes (`pro-price-list.tsx`). A card is the
 * popup's full width (his `plans=wide` note: "stack this rather than a 2col row"), its name, its
 * price in the display face, and what it holds; the plan a host is on is the same card in ink,
 * the pair's shipped read. Kept to the pieces both faces draw so neither can drift a hairline from
 * the other.
 */
export function planCardClass(ink: boolean): string {
  return cn(
    "flex min-w-0 flex-col gap-3 rounded-xl border p-4",
    ink ? "border-transparent bg-foreground" : "bg-card",
  );
}

/**
 * The card's head: name, price, what it holds, what it lets her upload, and whatever sits beside them (a chip, a
 * press).
 */
export function PlanCardHead({
  plan,
  ink = false,
  holds,
  uploads,
  aside,
}: {
  plan: Plan;
  ink?: boolean;
  /** "about 29,257 photos or 26 hours of video", already worded by the caller. */
  holds: string;
  /**
   * "100 GB of uploads a month" (`uploadsPhrase`): ★ A SIZE'S UPLOADS ARE PART OF WHAT IT IS (red-team 52's LOW:
   * each card named its storage and estimate and never its uploads), published beside the room it comes with.
   */
  uploads?: string;
  aside?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <p
          className={cn(
            "text-sm font-medium",
            ink ? "text-background" : "text-foreground",
          )}
        >
          {plan.name}
        </p>
        <p
          className={cn(
            "font-heading text-subsection tabular-nums",
            ink && "text-background",
          )}
        >
          {plan.priceLabel}
        </p>
        <p
          className={cn(
            "text-xs text-pretty",
            ink ? "text-background/70" : "text-faint",
          )}
        >
          {holds}
        </p>
        {uploads ? (
          <p
            data-note="uploads"
            className={cn(
              "text-xs text-pretty",
              ink ? "text-background/70" : "text-faint",
            )}
          >
            {uploads}
          </p>
        ) : null}
      </div>
      {aside}
    </div>
  );
}

/**
 * The sentence a switch below this month's uploads earns (`uploadsPauseNote`), on the card it belongs to and in the
 * primary ink: the one line on a card a host must read before she presses. Words, never a refusal.
 */
export function UploadsPause({
  ink = false,
  children,
}: {
  ink?: boolean;
  children: ReactNode;
}) {
  return (
    <p
      data-note="uploads-pause"
      className={cn(
        "text-xs text-pretty",
        ink ? "text-background" : "text-foreground",
      )}
    >
      {children}
    </p>
  );
}

/** "Your plan": the held mark, never a button (pressing the plan you are on does nothing). */
export function HeldChip({ ink = false }: { ink?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 shrink-0 items-center justify-center rounded-action-sm border px-2.5 text-xs",
        ink
          ? "border-background/25 text-background/80"
          : "border-border text-muted-foreground",
      )}
    >
      Your plan
    </span>
  );
}
