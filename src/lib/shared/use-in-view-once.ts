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
 */
export function useInViewOnce<T extends HTMLElement>(threshold = 0.2) {
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
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, inView };
}
