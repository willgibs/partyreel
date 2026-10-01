"use client";

/**
 * Tracks whether a sentinel element is inside the viewport: the guest's action
 * dock takes over only while the row it grew out of is scrolled OUT of view
 * (the row on landing, a dock once it leaves, never both), and the host hub's
 * sticky row shows its code pill only once the header's own code has left.
 * IntersectionObserver only; no scroll listeners. SSR/pre-mount defaults to
 * in-view so the dock never flashes during hydration.
 */
import { useCallback, useRef, useState } from "react";

export function useInViewSentinel<T extends HTMLElement>() {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [inView, setInView] = useState(true);

  // A CALLBACK ref (not a mount-only effect) so the observer (re)attaches the
  // moment the sentinel node appears - the node can mount AFTER first paint:
  // a password event renders the ghost river (no sentinel) at access "none", then
  // unlocks via router.refresh() which flips access none->full WITHOUT
  // remounting EventExperience. A `[]`-dep effect would have read a null ref
  // on mount and never re-run, so the dock stayed dead on the unlocked page.
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
