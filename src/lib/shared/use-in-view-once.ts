"use client";

import { useEffect, useRef, useState } from "react";

/**
 * One-way "has this scrolled into view yet" (Track B F3; promoted verbatim from the marketing
 * lab's `marketing-lab-shared.tsx`, the ancestor of `use-prefers-reduced-motion` too). The
 * observer flips once and DISCONNECTS: reveals are one-way, because re-triggering on every scroll
 * pass reads glitchy, and `once` keeps the observer cheap. CSS owns the actual motion off a
 * `data-inview` attribute plus the reduced-motion fallback.
 *
 * This is NOT `use-in-view-sentinel` (two-way "is it visible right now", for sticky affordances)
 * and not `use-ambient-pause` (the loop-pause contract) — three different questions, three hooks.
 *
 * `rootMargin` (additive, default none) exists for APPROACH-MOUNT islands: the /reel style
 * switcher lazy-loads its engine chunk on approach, so it trips the observer a generous margin
 * BEFORE arrival (threshold 0 + e.g. "600px 0px") and the chunk + first decode land while the
 * visitor is still scrolling toward it. Reveal callers keep the default (trip on real entry).
 *
 * `viewportFraction` (additive, default off) is the answer to the ONE question `threshold` cannot
 * express: threshold is a fraction of the ELEMENT, so on anything taller than the screen it asks
 * for more pixels than the screen can hold and the observer never trips. See armingThreshold.
 */

/**
 * ★ THRESHOLD IS ELEMENT-RELATIVE, AND THAT BREAKS ON ANYTHING TALLER THAN THE SCREEN.
 *
 * `threshold: 0.35` means "35% of the ELEMENT is visible". For a 3000px lamp in an 800px viewport
 * the maximum reachable ratio is 800/3000 = 0.27, so the observer can never trip and a one-shot
 * wired to it simply never fires: no error, no warning, nothing on screen. The taller the surface,
 * the more certainly it fails, which is the opposite of what the number reads like.
 *
 * `viewportFraction` asks the question the caller actually means -- "arm once this covers f of the
 * SCREEN" -- and converts it into the element-relative ratio IntersectionObserver takes. Two
 * properties are deliberate:
 *
 *   - it takes the MINIMUM with `threshold`, so arming is never LATER than it was. The fraction is
 *     a rescue for tall elements, not a second gate to satisfy.
 *   - an element shorter than `f` of the screen can never cover that fraction, and clamping to 1
 *     would demand full visibility. Min-with-threshold makes that case a no-op instead: short
 *     elements keep exactly the behaviour they had.
 *
 * Pure and exported so the geometry is testable without a layout.
 */
export function armingThreshold(
  threshold: number,
  viewportFraction: number | undefined,
  elementHeight: number,
  viewportHeight: number,
): number {
  if (viewportFraction == null) return threshold;
  // A zero height means the element has not been laid out (or the tab is in a zero-size frame).
  // Guessing from it would produce either 0 or Infinity, so fall back to the caller's threshold.
  if (!(elementHeight > 0) || !(viewportHeight > 0)) return threshold;
  const viewportRelative = Math.min(
    1,
    (viewportFraction * viewportHeight) / elementHeight,
  );
  return Math.min(threshold, viewportRelative);
}

export function useInViewOnce<T extends HTMLElement>(
  threshold = 0.2,
  rootMargin?: string,
  options?: {
    /**
     * Arm once the element covers this fraction of the VIEWPORT, whichever comes first with
     * `threshold`. Omit and nothing changes.
     */
    viewportFraction?: number;
  },
) {
  // Read off the object here, never inside the effect: the dep has to be the primitive, or a fresh
  // options literal on every render would re-create the observer on every render.
  const viewportFraction = options?.viewportFraction;
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Measured ONCE, at observe time. The observer disconnects on the first hit, so there is
    // nothing to keep in sync afterwards, and a lamp's box is set by its wrapper rather than by
    // content that reflows. A ResizeObserver here would cost more than it could ever fix.
    const armAt = armingThreshold(
      threshold,
      viewportFraction,
      el.getBoundingClientRect().height,
      window.innerHeight,
    );
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: armAt, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin, viewportFraction]);
  return { ref, inView };
}
