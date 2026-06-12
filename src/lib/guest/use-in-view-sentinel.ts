"use client";

/**
 * Tracks whether a sentinel element is inside the viewport (Phase 4: the
 * floating Add pill shows only while the header action block is scrolled
 * OUT of view - "header Add on load, floating Add on scroll, never both").
 * IntersectionObserver only; no scroll listeners. SSR/pre-mount defaults to
 * in-view so the pill never flashes during hydration.
 */
import { useCallback, useRef, useState } from "react";

export function useInViewSentinel<T extends HTMLElement>() {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [inView, setInView] = useState(true);

  // A CALLBACK ref (not a mount-only effect) so the observer (re)attaches the
  // moment the sentinel node appears - the node can mount AFTER first paint:
  // a password event renders <GhostGrid> (no sentinel) at access "none", then
  // unlocks via router.refresh() which flips access none->full WITHOUT
  // remounting EventExperience. A `[]`-dep effect would have read a null ref
  // on mount and never re-run, so the pill stayed dead on the unlocked page.
  const sentinelRef = useCallback((el: T | null) => {
    observerRef.current?.disconnect();
    if (!el) {
      observerRef.current = null;
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    observerRef.current = observer;
  }, []);

  return { sentinelRef, inView };
}
