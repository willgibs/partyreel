"use client";

import { createContext, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";

import {
  floatingClock,
  floatingCorner,
  floatingCrossSlide,
} from "@/components/ui/floating-layer";
import { cn } from "@/lib/utils";

/**
 * THE SIDE-BY-SIDE TOOLTIP, for a ROW of icon triggers (`bulk-toolbar=icon`,
 * Will, 2026-09-20: "Side-by-side tooltips could likely use our page-side-
 * by-side internal version to switch tooltips when going across"). Moving
 * the pointer or focus from one action to its neighbour slides the label
 * across rather than fading the old one out and the new one in separately —
 * `BulkBar`'s one delight.
 *
 * Radix's own `NavigationMenu` computes an analogous `data-motion` from its
 * triggers' registered order; a row of independent Tooltip triggers has no
 * such engine underneath it, so `TooltipSlideGroup` is the bookkeeping this
 * family is missing: each `TooltipSlide` reports its own index as it opens,
 * and the group hands back the direction relative to whichever index was
 * open last (`null` the first time in a sequence — nothing to slide FROM
 * yet, so that one only fades in, same as any other tooltip).
 *
 * NOT built on the shared `ui/tooltip.tsx`: that component's `TooltipContent`
 * hard-codes `floatingEntrance` (a zoom + a hair of edge-slide), and composing
 * it with `floatingCrossSlide` on the same element would run a zoom AND a
 * cross-slide AND a blur together, which is not what the nav's own precedent
 * does (`navigation-menu.tsx` scopes its zoom to the NO-motion fallback path
 * only, mutually exclusive with the slide). This is `ui/tooltip.tsx`'s own
 * composition — the portal, the corner, the material, a clock — with
 * `floatingCrossSlide` in the entrance's place instead.
 *
 * Delay lives on the enclosing Radix `Tooltip.Provider` (the root one in
 * `providers.tsx`, or a bar's own nested one) — this file sets none of its
 * own.
 */

type Motion = "from-start" | "from-end" | null;

type SlideGroupValue = {
  /** Called by a tooltip as it opens; returns ITS motion relative to whichever
   *  index opened last (or null: nothing to slide from, so just fade). */
  register: (index: number) => Motion;
};

const SlideGroupContext = createContext<SlideGroupValue | null>(null);

export function TooltipSlideGroup({ children }: { children: ReactNode }) {
  // A ref, not state: the bookkeeping is read exactly once per open (inside
  // the child's onOpenChange), never rendered itself, so it never needs to
  // trigger a re-render of the group.
  const lastIndex = useRef<number | null>(null);

  function register(index: number): Motion {
    const prev = lastIndex.current;
    lastIndex.current = index;
    if (prev === null || prev === index) return null;
    return index > prev ? "from-end" : "from-start";
  }

  return (
    <SlideGroupContext.Provider value={{ register }}>
      {children}
    </SlideGroupContext.Provider>
  );
}

/**
 * One trigger in the group. `index` is this trigger's LEFT-TO-RIGHT position
 * in the row — the only input the direction needs; the group compares two
 * integers, it never measures a DOM rect. Outside a `TooltipSlideGroup` (or
 * reopening the same index twice in a row) it degrades to a plain fade.
 */
export function TooltipSlide({
  index,
  label,
  children,
}: {
  index: number;
  label: string;
  children: ReactNode;
}) {
  const group = useContext(SlideGroupContext);
  const [motion, setMotion] = useState<Motion>(null);

  return (
    <TooltipPrimitive.Root
      onOpenChange={(open) => {
        if (open) setMotion(group ? group.register(index) : null);
      }}
    >
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          data-slot="tooltip-content"
          data-motion={motion ?? undefined}
          sideOffset={0}
          className={cn(
            "z-50 inline-flex w-fit max-w-xs items-center gap-1.5 bg-foreground px-3 py-1.5 text-xs text-background shadow-layer",
            floatingCorner,
            floatingClock.instant,
            floatingCrossSlide,
          )}
        >
          {label}
          <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
