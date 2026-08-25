"use client";

import {
  useCallback,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

/**
 * The header's scroll-state shell (the transparent-over-hero enhancement the
 * system track deferred as "a one-prop change" — cashed in once the album-wall
 * hero landed and made it worth it). Two variants:
 *
 *  - SOLID (paper + the root 404): the classic always-glass sticky header.
 *  - OVERLAY (cinema): the header starts TRANSPARENT so the hero's media wall
 *    runs underneath it edge-to-top, then gains glass + a hairline the moment
 *    the page scrolls. The ongoing signal is an IntersectionObserver on a
 *    zero-cost in-flow sentinel (never a scroll listener, the house rule) —
 *    BUT the observer's first callback is async, so a page that LOADS already
 *    scrolled (an anchored link, back-forward restore, a throttled background
 *    tab where IO may not fire at all) would paint a transparent header over
 *    content. A pre-paint layout-effect scroll check covers exactly that
 *    window: it decides `stuck` until the observer's first real callback, then
 *    the observer owns it. SSR + first client render stay identical
 *    (transparent), so there is no hydration mismatch; the correction lands
 *    before paint. The border is always present but transparent at rest — the
 *    swap is paint-only, never layout.
 */
/** The at-hydration scroll truth, as a store read (the useHydrated precedent):
 *  the server snapshot is false (transparent, matching SSR), the client
 *  snapshot reads the REAL scroll position during the hydration pass — no
 *  effect, no setState, no hydration mismatch (differing snapshots are
 *  exactly what useSyncExternalStore exists to reconcile). */
const noopSubscribe = () => () => {};
function useMountScrolled(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.scrollY > 8,
    () => false,
  );
}

export function HeaderShell({
  overlay = false,
  children,
}: {
  overlay?: boolean;
  children: React.ReactNode;
}) {
  const [inView, setInView] = useState(true);
  const [ioReady, setIoReady] = useState(false);
  const mountScrolled = useMountScrolled();
  const observerRef = useRef<IntersectionObserver | null>(null);

  const sentinelRef = useCallback((el: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
      setIoReady(true);
    });
    observer.observe(el);
    observerRef.current = observer;
  }, []);

  if (!overlay) {
    return (
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        {children}
      </header>
    );
  }

  const stuck = ioReady ? !inView : mountScrolled;
  return (
    <>
      <div ref={sentinelRef} aria-hidden className="h-px w-full -mb-px" />
      <header
        data-stuck={stuck ? "true" : undefined}
        className={`sticky top-0 z-40 border-b transition-[background-color,border-color] duration-200 ${
          stuck
            ? "border-border bg-background/80 backdrop-blur"
            : "border-transparent bg-transparent"
        }`}
      >
        {children}
      </header>
    </>
  );
}
