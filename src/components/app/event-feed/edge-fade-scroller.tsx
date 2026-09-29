"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A SIDEWAYS SCROLLER WHOSE EDGES FADE ONLY WHERE MORE OF THE ROW IS HIDDEN (Will's `phone=same`:
 * "with a conditional gradient over either side"; and `event-settings` `queue`, 2026-09-29:
 * "conditional per scrollable side, so if you're at the first/last that shadow disappears,
 * showing you're at the end with nothing more hidden"). A row that fits shows neither fade; at
 * the start the left one is gone, at the end the right. The hub's cards row rides it
 * (`event-cards-row.tsx`): a row of tiles on a tablet and the stuck pills on a phone can run past
 * the screen, and the phone's resting 2x2 grid always fits, so it never fades.
 *
 * ★ EACH FLAG IS AN ATTRIBUTE THAT IS THERE OR IS NOT, NEVER A VALUE. The variants below match
 * `[data-overflow-left]`, which any value satisfies, and `el.dataset.x = undefined` does not remove
 * the attribute: it stores the string "undefined". That one assignment showed both fades at every
 * width from the day the row shipped until crumbs-12, while a pin that read the source for the
 * flags' names stayed green; `toggleAttribute` is the fix, and `event-hub.test.tsx` now drives
 * this scroller instead of reading it.
 *
 * Its own module so that test can mount it without the cards row's server graph behind it.
 */
export function EdgeFadeScroller({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    // 1px of slack: a fractional scrollWidth is normal at fractional zooms and
    // would otherwise leave a permanent right-hand fade on a row that fits.
    el.toggleAttribute("data-overflow-left", el.scrollLeft > 1);
    el.toggleAttribute("data-overflow-right", el.scrollLeft < max - 1);
  }, []);

  // Both observers are cheap and passive: one scroll listener and one ResizeObserver, writing two
  // attributes rather than re-rendering on every frame.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    for (const child of Array.from(el.children)) ro.observe(child);
    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
    };
  }, [measure]);

  // ★ AND AGAIN AFTER EVERY RENDER, the first included. A child that mounts without resizing
  // anything changes how far the row scrolls and fires neither observer: the Invite pill joins a
  // row of tiles at a tablet's width and the group keeps its box, so its right edge would sit
  // past the screen with no fade. The measure is a few reads and writes only a flag that changed
  // (`toggleAttribute` to the state an attribute already has is no mutation).
  useEffect(measure);

  return (
    <div
      ref={ref}
      className={cn(
        "-mx-1 [scrollbar-width:none] overflow-x-auto px-1 [&::-webkit-scrollbar]:hidden",
        // The fades are masks rather than overlaid gradients so they work on
        // any background the row is stuck over, light or dark.
        "[mask-image:none] data-[overflow-left]:[mask-image:linear-gradient(to_right,transparent,black_2rem)]",
        "data-[overflow-right]:[mask-image:linear-gradient(to_left,transparent,black_2rem)]",
        "data-[overflow-left]:data-[overflow-right]:[mask-image:linear-gradient(to_right,transparent,black_2rem,black_calc(100%-2rem),transparent)]",
      )}
    >
      {children}
    </div>
  );
}
