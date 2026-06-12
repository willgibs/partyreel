"use client";

/**
 * Tracks whether a sentinel element is inside the viewport (Phase 4: the
 * floating Add pill shows only while the header action block is scrolled
 * OUT of view - "header Add on load, floating Add on scroll, never both").
 * IntersectionObserver only; no scroll listeners. SSR/pre-mount defaults to
 * in-view so the pill never flashes during hydration.
 */
import { useEffect, useRef, useState } from "react";

export function useInViewSentinel<T extends HTMLElement>() {
  const sentinelRef = useRef<T | null>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { sentinelRef, inView };
}
