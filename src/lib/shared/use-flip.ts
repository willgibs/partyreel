"use client";

/* eslint-disable react-hooks/immutability -- a FLIP imperatively mutates DOM element
   styles (transform/transition) in a layout effect; that imperative DOM write IS the
   technique. The lint guards against mutating React-owned values, not the live DOM. */
import { useCallback, useLayoutEffect, useRef } from "react";

import { readCssMs } from "@/lib/shared/read-css-ms";

// A hand-rolled FLIP (First-Last-Invert-Play): when a tracked set reorders, each node is snapped
// back to its previous box with NO transition, then transitioned to its new place, so things
// visibly slide instead of jumping. Ratified over framer-motion's `layout` prop in the
// /design/event-feed lab (cleaner, off the main thread, no extra dependency). Reduced motion skips
// the invert (instant reflow). Tunable via --tune-reorder-ms.
//
// Usage: const register = useFlip(orderKey); then on each tracked wrapper, ref={register(key)}.
// orderKey must change whenever the order changes (e.g. order.join()) so the layout effect fires.
//
// TWO AXES (generalized for the /blog library, 2026-08-28). Born for the event feed's stacked
// sections, which are full-width and therefore only ever move on Y; a filtered multi-column grid
// moves on X as well, and a Y-only invert makes cards slide diagonally out of nowhere. dx is 0 for
// any full-width stack, so the event feed's behavior is byte-identical. This is why the blog does
// NOT need the second, unextracted FLIP living inside use-sortable-grid.ts.
//
// ★ prev rects are PRUNED for unmounted keys at the end of every pass. Without it a node that
// leaves the set (a card filtered out) keeps its stale rect forever and, on returning, inverts
// from wherever it sat under a different filter, which reads as cards flying in from nowhere.
// Note the prune cannot happen in the ref cleanup: `register(key)` returns a fresh closure each
// render, so React detaches and reattaches EVERY node on EVERY render, and dropping prev on null
// would disable the FLIP entirely. At layout-effect time `nodes` is exactly the mounted set.
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
        const dx = was.left - now.left;
        const dy = was.top - now.top;
        if (dx || dy) {
          el.style.transition = "none";
          el.style.transform = `translate(${dx}px, ${dy}px)`;
          void el.offsetWidth; // force reflow so the invert is the starting point
          requestAnimationFrame(() => {
            el.style.transition = `transform ${dur}ms var(--ease-in-out-strong)`;
            el.style.transform = "";
          });
        }
      }
      prev.current.set(key, now);
    }
    // Drop rects for nodes that are no longer mounted (see the prune note above).
    for (const key of prev.current.keys()) {
      if (!nodes.current.has(key)) prev.current.delete(key);
    }
  }, [orderKey]);

  return register;
}
