"use client";

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
// ONE IMPLEMENTATION (the library phase, 2026-09-11): the pass itself is `runFlip`, exported, so a
// caller that already owns its node and rect maps for other reasons (use-sortable-grid.ts, which
// also drags a tile under the finger) runs the same arithmetic instead of carrying a second copy.
// `skip` leaves a key alone for the pass (not inverted, not re-baselined) and `onSkip` lets the
// caller place it from the same fresh order; that is the whole difference a drag needs.
//
// TWO AXES (generalized for the /blog library, 2026-08-28). Born for the event feed's stacked
// sections, which are full-width and therefore only ever move on Y; a filtered multi-column grid
// moves on X as well, and a Y-only invert makes cards slide diagonally out of nowhere. dx is 0 for
// any full-width stack, so the event feed's behavior is byte-identical. (The sortable grid's own
// copy of the loop is gone since 2026-09-11; it calls runFlip below.)
//
// ★ prev rects are PRUNED for unmounted keys at the end of every pass. Without it a node that
// leaves the set (a card filtered out) keeps its stale rect forever and, on returning, inverts
// from wherever it sat under a different filter, which reads as cards flying in from nowhere.
// Note the prune cannot happen in the ref cleanup: `register(key)` returns a fresh closure each
// render, so React detaches and reattaches EVERY node on EVERY render, and dropping prev on null
// would disable the FLIP entirely. At layout-effect time `nodes` is exactly the mounted set.
export type FlipOptions = {
  /** Leave this key alone this pass: no invert, and its rect is not re-baselined either. */
  skip?: (key: string) => boolean;
  /** Called for each skipped key in the same layout pass (the dragged tile follows the finger). */
  onSkip?: (key: string) => void;
  /**
   * Invert the SIZE as well as the place (the album's justified rows: a photograph that changes
   * rows changes height with it). It scales about the node's own centre, so it assumes the default
   * `transform-origin`; the content scales with the box for the length of the glide.
   */
  scale?: boolean;
  /** The glide in ms (default `--tune-reorder-ms`, read in the nodes' own document); 0 is instant. */
  duration?: number;
  /** The curve (default `--ease-in-out-strong`). */
  easing?: string;
  /**
   * Animate only what is on screen before or after (within half a screen): a node off screen both
   * times simply moves. A thousand-tile album glides the forty a reader can see, not all of them.
   */
  visibleOnly?: boolean;
};

/**
 * One FLIP pass over `nodes`: invert each node from its previous rect to its new one and let it
 * transition back, then remember the new rect, then prune rects for keys no longer mounted.
 * Reduced motion skips the invert (instant reflow). Pure DOM arithmetic; the hook and the sortable
 * grid both call it.
 *
 * ★ EVERY RECT IS READ BEFORE ANY STYLE IS WRITTEN (the album-rows lane, 2026-09-25). The pass used
 * to read a node, write its invert and force a reflow, node by node, which is one full layout per
 * moved node: harmless for a dozen feed sections, and seconds of jank for the hundreds of tiles an
 * arrival shifts in a justified album. Now: every read, then every write, then ONE forced reflow
 * (it is what makes the invert the transition's starting point), then one frame to let them all go.
 * The output is identical; only the order of the DOM work changed.
 */
export function runFlip(
  nodes: Map<string, HTMLElement>,
  prev: Map<string, DOMRect>,
  options: FlipOptions = {},
) {
  const first = nodes.values().next().value as HTMLElement | undefined;
  // The nodes' own window: a lab frame portals them into another document.
  const win = first?.ownerDocument.defaultView ?? window;
  const reduce = win.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dur =
    options.duration ??
    readCssMs("--tune-reorder-ms", 500, first?.ownerDocument.documentElement);
  const ease = options.easing ?? "var(--ease-in-out-strong)";

  // 1. Read.
  const now = new Map<string, DOMRect>();
  const skipped: string[] = [];
  for (const [key, el] of nodes) {
    if (options.skip?.(key)) skipped.push(key);
    else now.set(key, el.getBoundingClientRect());
  }
  // finger-followed, not FLIPped; its (transformed) rect must not become the baseline
  for (const key of skipped) options.onSkip?.(key);

  // 2. Write every invert.
  const moving: HTMLElement[] = [];
  const reach = win.innerHeight * 0.5;
  const onScreen = (r: DOMRect) =>
    r.bottom > -reach && r.top < win.innerHeight + reach;
  for (const [key, rect] of now) {
    const was = prev.get(key);
    prev.set(key, rect);
    if (!was || reduce || dur <= 0) continue;
    if (options.visibleOnly && !onScreen(was) && !onScreen(rect)) continue;
    const el = nodes.get(key)!;
    let transform = "";
    if (options.scale && rect.width > 0 && rect.height > 0) {
      const sx = was.width / rect.width;
      const sy = was.height / rect.height;
      const tx = was.left + was.width / 2 - (rect.left + rect.width / 2);
      const ty = was.top + was.height / 2 - (rect.top + rect.height / 2);
      // Sub-pixel drift is not motion: nothing to show, nothing to run.
      if (
        Math.abs(tx) < 0.5 &&
        Math.abs(ty) < 0.5 &&
        Math.abs(sx - 1) < 0.005 &&
        Math.abs(sy - 1) < 0.005
      )
        continue;
      transform = `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`;
    } else {
      const dx = was.left - rect.left;
      const dy = was.top - rect.top;
      if (!dx && !dy) continue;
      transform = `translate(${dx}px, ${dy}px)`;
    }
    el.style.transition = "none";
    el.style.transform = transform;
    moving.push(el);
  }

  // 3. One reflow, so every invert is its transition's starting point; then let them all go.
  if (moving.length > 0) {
    void moving[0].offsetWidth;
    win.requestAnimationFrame(() => {
      for (const el of moving) {
        el.style.transition = `transform ${dur}ms ${ease}`;
        el.style.transform = "";
      }
    });
  }

  // Drop rects for nodes that are no longer mounted (see the prune note above).
  for (const key of prev.keys()) {
    if (!nodes.has(key)) prev.delete(key);
  }
}

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
    runFlip(nodes.current, prev.current);
  }, [orderKey]);

  return register;
}
