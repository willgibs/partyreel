"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { pickIndicatorTarget } from "./nav-indicator-target";

/**
 * THE HEADER INDICATOR (the nav round). One soft object
 * travels with the cursor across the primary nav and parks under whichever
 * trigger owns the open panel, so the bar answers a hover *before* the panel
 * has decided to open. Same measure-and-write technique as the reel's
 * style-switcher island (JS writes offsetLeft/offsetWidth, CSS owns the tween),
 * but expressed in Tailwind utilities + inline geometry rather than a
 * marketing.css class: the header also renders on the root /404, where
 * marketing.css never loads, and a `.mkt-*` class there would be an unstyled
 * ghost. Every clock is a var(…, fallback) for the same reason.
 *
 * Will asked to see the PILL with the underline as the fallback if he doesn't
 * like it, so the swap is one word: NAV_INDICATOR below. Both variants ride the
 * exact same measurement and the same travel clock; only the box differs.
 */
export const NAV_INDICATOR: "pill" | "underline" = "pill";

/** The measured geometry the indicator writes, in list-local pixels. */
type Placement = { left: number; width: number };

export function useNavIndicator(openIndex: number | null) {
  const listRef = useRef<HTMLUListElement | null>(null);
  const indicatorRef = useRef<HTMLSpanElement | null>(null);
  const placedRef = useRef(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);

  const target = pickIndicatorTarget({ hoverIndex, focusIndex, openIndex });

  const place = useCallback((index: number | null, animate: boolean) => {
    const el = indicatorRef.current;
    const list = listRef.current;
    if (!el || !list) return;
    if (index === null) {
      // Fade out IN PLACE: keeping the geometry means the next hover resumes
      // from where the cursor left, instead of snapping in from x=0.
      el.style.opacity = "0";
      return;
    }
    const item = list.querySelector<HTMLElement>(`[data-nav-index="${index}"]`);
    if (!item) return;
    // Rect deltas, not offsetLeft: every nav item is `relative` (the primitive
    // needs it), so offsetLeft would be measured against the item itself.
    const listBox = list.getBoundingClientRect();
    const itemBox = item.getBoundingClientRect();
    const next: Placement = {
      left: itemBox.left - listBox.left,
      width: itemBox.width,
    };
    if (!animate) {
      // ★ THE FIRST-PLACEMENT GOTCHA (the style-switcher island hit it too):
      // without suspending the transition the indicator flies in from x=0 on
      // its very first appearance. Suspend, write, force the reflow that
      // COMMITS the new geometry as the current state, then restore — the
      // restore is safe immediately after the reflow, so this needs no rAF
      // (which also keeps it correct in a backgrounded tab).
      el.style.transitionProperty = "none";
      el.style.width = `${next.width}px`;
      el.style.transform = `translateX(${next.left}px)`;
      void el.offsetHeight;
      el.style.transitionProperty = "";
    } else {
      el.style.width = `${next.width}px`;
      el.style.transform = `translateX(${next.left}px)`;
    }
    el.style.opacity = "1";
  }, []);

  useLayoutEffect(() => {
    place(target, placedRef.current);
    if (target !== null) placedRef.current = true;
  }, [target, place]);

  // Re-measure without animating when the bar reflows (font swap, resize, a
  // label change). Animating a reflow would read as a random glide.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => place(target, false));
    ro.observe(list);
    return () => ro.disconnect();
  }, [target, place]);

  /** Props for one nav item's <li>. `index` is its position in PRIMARY_NAV.
   *  Goes on the LIST ITEM, not the trigger: the <li> is what the indicator
   *  measures, and React's synthesized pointerenter/focus still fire there when
   *  the pointer or focus lands on the control inside it. */
  const itemProps = useCallback(
    (index: number) => ({
      "data-nav-index": index,
      // Mouse only: on touch, `pointerenter` fires on tap and would leave the
      // indicator stranded under whatever was last tapped.
      onPointerEnter: (event: React.PointerEvent) => {
        if (event.pointerType === "mouse") setHoverIndex(index);
      },
      onFocus: () => setFocusIndex(index),
      onBlur: () => setFocusIndex((i) => (i === index ? null : i)),
    }),
    [],
  );

  /** Props for the <ul> that owns the indicator. */
  const listProps = {
    ref: listRef,
    onPointerLeave: (event: React.PointerEvent) => {
      if (event.pointerType === "mouse") setHoverIndex(null);
    },
  };

  const indicator = (
    <span
      ref={indicatorRef}
      aria-hidden
      className={cn(
        "pointer-events-none absolute left-0 z-0 opacity-0",
        // The travel clock is the indicator's own: a segmented-control pill
        // tracks a click and can take --mkt-tabs-dur (250ms); this one tracks a
        // moving cursor and has to keep up.
        "transition-[transform,width,opacity] duration-[var(--mkt-nav-indicator-ms,180ms)] ease-emphasis motion-reduce:transition-none",
        NAV_INDICATOR === "pill"
          ? "inset-y-0 rounded-full bg-muted"
          : "bottom-0 h-0.5 rounded-full bg-foreground",
      )}
    />
  );

  return { listProps, itemProps, indicator, listRef };
}
