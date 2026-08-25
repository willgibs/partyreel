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
 */
export function useInViewOnce<T extends HTMLElement>(
  threshold = 0.2,
  rootMargin?: string,
) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin]);
  return { ref, inView };
}
