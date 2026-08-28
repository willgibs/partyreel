"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

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
 *
 * ★ THE GLASS IS A LAYER, NOT THE HEADER (2026-08-28 nav round). The glass used
 * to live on the <header> itself and the blur was toggled as a CLASS, which
 * bought two problems at once:
 *   1. backdrop-filter is not in any transition list, so while background-color
 *      crossfaded over 200ms the blur SNAPPED — the "jagged nav background".
 *   2. a backdrop-filter on the header makes the whole subtree part of that
 *      backdrop root, and the dropdown panel renders INSIDE the header. Every
 *      hover repaint in the panel was therefore happening inside a blurred
 *      region, which is the expensive half of "skimming links feels slow".
 * Moving the glass to an inert `-z-10` sibling layer fixes both: the header no
 * longer filters anything, and the state change is a pure opacity crossfade —
 * the one property compositors animate cheapest. The layer keeps its blur
 * mounted at all times, so no filter is ever created or destroyed mid-motion.
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

/** The glass itself: background + blur + hairline, painted behind the bar's
 *  content and never in its ancestor chain. `opacity` is the only thing that
 *  ever changes. */
function GlassLayer({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 border-b border-border bg-background/80 backdrop-blur",
        className,
      )}
    />
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
      <header className="sticky top-0 isolate z-40">
        <GlassLayer />
        {children}
      </header>
    );
  }

  const stuck = ioReady ? !inView : mountScrolled;
  return (
    <>
      <div ref={sentinelRef} aria-hidden className="-mb-px h-px w-full" />
      <header
        data-stuck={stuck ? "true" : undefined}
        className="group/hdr sticky top-0 isolate z-40"
      >
        {/* The glass fades in when the page scrolls, and is FORCED while a nav
            panel is open (a big solid panel under a fully transparent bar reads
            disconnected over the hero wall). Scoped to the nav trigger on
            purpose: the old `[data-state=open]` also matched the mobile
            trigger, which needs nothing since its menu covers the screen. */}
        <GlassLayer className="opacity-0 transition-opacity duration-200 ease-emphasis group-has-[[data-slot=navigation-menu-trigger][data-state=open]]/hdr:opacity-100 group-data-[stuck=true]/hdr:opacity-100 motion-reduce:transition-none" />
        {children}
      </header>
    </>
  );
}
