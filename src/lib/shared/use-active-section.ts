"use client";

/**
 * Scroll-spy for the event feed's contextual floating action bar. One IntersectionObserver with
 * a thin trigger band near vertical center (rootMargin) reports which stacked section the host is
 * currently looking at as they scroll the "All" feed; the bar reads `activeSection` to MORPH its
 * action to that section (Review → Select/Approve all, Gallery → Add, Reel → Create reel). When
 * the feed is filtered to a single section the caller pins the active key directly (no spying
 * needed). SSR / pre-mount defaults to the first key (top of the stack) so the bar never flickers.
 *
 * `orderedKeys` decides tie-breaks: when two sections straddle the band, the one EARLIER in the
 * order wins (so a short section above doesn't lose the band to the tall one below). The order can
 * change live (the urgency reorder); registration is keyed (stable per section), so the same
 * wrapper node keeps its observation across a reorder — only the tie-break order updates.
 */
import { useCallback, useEffect, useRef, useState } from "react";

export function useActiveSection<K extends string>(orderedKeys: K[]) {
  const [active, setActive] = useState<K | null>(orderedKeys[0] ?? null);
  const nodes = useRef(new Map<K, HTMLElement>());
  const observer = useRef<IntersectionObserver | null>(null);
  const visible = useRef<Set<K>>(new Set());
  // Mirror the latest order into a ref so the observer callback reads it without re-creating the
  // observer. Updated in an effect (never during render) — the reorder is infrequent and the
  // observer fires asynchronously, so by the time recompute() runs the ref is already current.
  const orderRef = useRef(orderedKeys);
  useEffect(() => {
    orderRef.current = orderedKeys;
  });

  const recompute = useCallback(() => {
    for (const k of orderRef.current) {
      if (visible.current.has(k)) {
        setActive(k);
        return;
      }
    }
  }, []);

  const registerSection = useCallback(
    (key: K) => (el: HTMLElement | null) => {
      const prev = nodes.current.get(key);
      if (prev && observer.current) observer.current.unobserve(prev);
      if (el) {
        el.dataset.sectionKey = key;
        nodes.current.set(key, el);
        observer.current?.observe(el);
      } else {
        nodes.current.delete(key);
        visible.current.delete(key);
      }
    },
    [],
  );

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const k = (e.target as HTMLElement).dataset.sectionKey as
            | K
            | undefined;
          if (!k) continue;
          if (e.isIntersecting) visible.current.add(k);
          else visible.current.delete(k);
        }
        recompute();
      },
      // A ~5%-tall band near vertical center: a section is "active" while it crosses the band.
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    observer.current = obs;
    for (const el of nodes.current.values()) obs.observe(el);
    return () => {
      obs.disconnect();
      observer.current = null;
    };
  }, [recompute]);

  return { activeSection: active, registerSection };
}
