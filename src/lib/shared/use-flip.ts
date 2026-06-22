"use client";

/* eslint-disable react-hooks/immutability -- a FLIP imperatively mutates DOM element
   styles (transform/transition) in a layout effect; that imperative DOM write IS the
   technique. The lint guards against mutating React-owned values, not the live DOM. */
import { useCallback, useLayoutEffect, useRef } from "react";

import { readCssMs } from "@/lib/shared/read-css-ms";

// A hand-rolled FLIP (First-Last-Invert-Play) for the event feed's section reorder: when the
// urgency order changes (the review queue clears, or moderation toggles), each tracked section
// is snapped back to its previous box with NO transition, then transitioned to its new place, so
// the sections visibly slide to their new positions instead of jumping. Ratified over framer-
// motion's `layout` prop in the /design/event-feed lab (cleaner, off the main thread, no extra
// dependency). Reduced motion skips the invert (instant reflow). Tunable via --tune-reorder-ms.
//
// Usage: const register = useFlip(orderKey); then on each tracked wrapper, ref={register(key)}.
// orderKey must change whenever the order changes (e.g. order.join()) so the layout effect fires.
export function useFlip(orderKey: string) {
  const nodes = useRef(new Map<string, HTMLElement>());
  const prev = useRef(new Map<string, DOMRect>());

  const register = useCallback(
    (key: string) => (el: HTMLElement | null) => {
      if (el) nodes.current.set(key, el);
      else nodes.current.delete(key);
    },
    [],
  );

  useLayoutEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const dur = readCssMs("--tune-reorder-ms", 500);
    for (const [key, el] of nodes.current) {
      const now = el.getBoundingClientRect();
      const was = prev.current.get(key);
      if (was && !reduce) {
        const dy = was.top - now.top;
        if (dy) {
          el.style.transition = "none";
          el.style.transform = `translateY(${dy}px)`;
          void el.offsetWidth; // force reflow so the invert is the starting point
          requestAnimationFrame(() => {
            el.style.transition = `transform ${dur}ms var(--ease-in-out-strong)`;
            el.style.transform = "";
          });
        }
      }
      prev.current.set(key, now);
    }
  }, [orderKey]);

  return register;
}
