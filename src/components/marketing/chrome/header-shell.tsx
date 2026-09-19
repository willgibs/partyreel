"use client";

import { usePathname } from "next/navigation";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import {
  resetScrollDirection,
  useScrollDirection,
} from "@/lib/shared/use-scroll-direction";
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
 *    zero-cost in-flow sentinel — BUT the observer's first callback is async,
 *    so a page that LOADS already scrolled (an anchored link, back-forward
 *    restore, a throttled background tab where IO may not fire at all) would
 *    paint a transparent header over content. A pre-paint layout-effect scroll
 *    check covers exactly that window: it decides `stuck` until the observer's
 *    first real callback, then the observer owns it. SSR + first client render
 *    stay identical (transparent), so there is no hydration mismatch; the
 *    correction lands before paint. The border is always present but
 *    transparent at rest — the swap is paint-only, never layout.
 *
 * ★ THE GLASS SIGNAL IS STILL NOT A SCROLL LISTENER, and the rule that said so
 * has NARROWED rather than gone (it read "never a scroll listener, the house
 * rule", full stop; `on-scroll=hide`, 2026-09-19, is why it needed rewording
 * rather than deleting). The crossfade asks a BOOLEAN ABOUT ONE ELEMENT — is
 * the header past the top of the page — and that is precisely what an
 * IntersectionObserver answers off the main thread, so it must never regress
 * to a listener. The HIDE asks something no observer can answer at all: the
 * sign of the delta between two scroll positions. That one listener lives in
 * use-scroll-direction.ts, passive and rAF-coalesced, and it is the only one
 * the site is allowed.
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

/**
 * ★ THE BAR GETS OUT OF THE WAY (`on-scroll=hide`, Will 2026-09-19: "Hides
 * going down, returns coming up"). Four things make that safe to ship, and all
 * four are in this one declaration:
 *
 *  1. ONLY THE TRANSFORM MOVES. `--mkt-header-h` stays 4rem and the sticky
 *     `z-40` box stays exactly where it was, because about fourteen consumers
 *     derive from that one knob (every anchor's scroll-mt, the sticky reading
 *     rails, the negative-pull heroes, the phone sheet's mirrored row). A bar
 *     that changed its HEIGHT would move all of them mid-page; a bar that
 *     translates moves nothing but itself.
 *  2. IT IS ONE RULE, NOT FOUR COMPETING ONES. The hide and its three escapes
 *     are a single compound selector, so nothing depends on which utility
 *     Tailwind happens to emit last. The escapes: a nav panel open (a wide
 *     panel hanging off a bar that just left reads as a floating sheet), the
 *     phone sheet open (its trigger lives in this bar), and `:focus-within` —
 *     a keyboard reader must never tab into something off-screen, which is
 *     the whole reason this is a transform and not a `hidden`.
 *  3. THE CLOCKS ARE ASYMMETRIC. Leaving is the slower, more deliberate half
 *     on the symmetric S (nobody asked for it, so it must not snap away);
 *     arriving is faster on the front-loaded emphasis curve, because a reader
 *     scrolling back up is already reaching for the bar. Same reasoning as the
 *     glass's open/close split below, polarity flipped.
 *  4. REDUCED MOTION KEEPS THE FUNCTION AND DROPS THE DECORATION: the bar
 *     still gets out of the way, it just stops sliding to do it.
 *
 * ★ `transition-[translate]`, never `transition-transform`: Tailwind v4's
 * translate utilities set the STANDALONE `translate` property, so the
 * transform list would animate nothing (the v4 landmine, CLAUDE.md).
 * Literal clocks rather than `--mkt-*` tokens for the same reason the rest of
 * this file uses them: the root 404 renders this header WITHOUT marketing.css,
 * where a bare `--mkt-*` reference is silently unset.
 */
/* Spelled out three times rather than composed from a shared constant: the
   Tailwind v4 scanner reads SOURCE TEXT, so a class assembled at runtime is a
   class that never gets generated. The selector reads: this header, marked
   hidden, with nothing focused inside it, no nav panel open and the phone
   sheet closed. */
const HIDE_WHEN_LEAVING = cn(
  "transition-[translate] duration-150 ease-emphasis motion-reduce:transition-none",
  "[&[data-hidden]:not(:focus-within):not(:has([data-slot=navigation-menu-trigger][data-state=open])):not(:has([data-slot=sheet-trigger][data-state=open]))]:-translate-y-full",
  "[&[data-hidden]:not(:focus-within):not(:has([data-slot=navigation-menu-trigger][data-state=open])):not(:has([data-slot=sheet-trigger][data-state=open]))]:duration-[220ms]",
  "[&[data-hidden]:not(:focus-within):not(:has([data-slot=navigation-menu-trigger][data-state=open])):not(:has([data-slot=sheet-trigger][data-state=open]))]:ease-in-out-strong",
);

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

  // The bar leaves only while the reader is moving AWAY. The store's own
  // reveal zone (one header height) is a strictly stronger gate than `stuck`
  // (which trips about a pixel down the page), so both postures below hide on
  // exactly the same signal — which is what "the same on the overlay=false
  // pages" asks for, with no second rule to keep in step.
  const hidden = useScrollDirection() === "down";

  // A client navigation commits the new page a beat BEFORE the App Router
  // scrolls it to the top. Without this, a reader who left through a footer
  // link while the bar was hidden would watch it slide back in over the new
  // page's first paint. A layout effect, never render: the store notifies.
  const pathname = usePathname();
  useLayoutEffect(() => {
    resetScrollDirection();
  }, [pathname]);

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
      <header
        data-hidden={hidden ? "true" : undefined}
        className={cn("sticky top-0 isolate z-40", HIDE_WHEN_LEAVING)}
      >
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
        data-hidden={hidden ? "true" : undefined}
        className={cn("group/hdr sticky top-0 isolate z-40", HIDE_WHEN_LEAVING)}
      >
        {/* The glass fades in when the page scrolls, and is FORCED while a nav
            panel is open (a big solid panel under a fully transparent bar reads
            disconnected over the hero wall). Scoped to the nav trigger on
            purpose: the old `[data-state=open]` also matched the mobile
            trigger, which needs nothing since its menu covers the screen. */}
        {/* ★ THE CURVE, NOT THE DURATION, was what made this read as a snap
            (Will, 2026-08-29, on the transparent careers hero: "feels instant
            right now and is too visually rough"). It ran 200ms on
            --ease-emphasis, and that curve (0.23,1,0.32,1) delivers ~90% of the
            change inside the first third, so a full-width background wash
            effectively landed in ~60ms and then crept. A wash is a CROSSFADE,
            not an entrance, so it wants the symmetric S: --ease-in-out-strong
            eases in and out of the change instead of front-loading it.
            Asymmetric by state, which is what keeps the house's exits-faster
            rule: the longer clock rides the OPEN state, so opening takes 300ms
            and closing falls back to the base 220ms. */}
        <GlassLayer className="opacity-0 transition-opacity duration-[220ms] ease-in-out-strong group-has-[[data-slot=navigation-menu-trigger][data-state=open]]/hdr:opacity-100 group-has-[[data-slot=navigation-menu-trigger][data-state=open]]/hdr:duration-300 group-data-[stuck=true]/hdr:opacity-100 motion-reduce:transition-none" />
        {children}
      </header>
    </>
  );
}
