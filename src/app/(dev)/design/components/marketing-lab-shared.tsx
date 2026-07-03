"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Shared plumbing for the marketing-identity round (lab-local, 2026-07-03).
 * Each direction renders inside a DesktopFrame: a browser-chrome mock with its
 * OWN scroll viewport, so the signature scroll sections can be FELT (the whole
 * point of prototyping motion in the lab) without hijacking the page scroll.
 *
 * Reveal/useInView drive the scroll-triggered CSS in design.css: the observer
 * flips `data-inview="true"` ONCE (reveals are one-way; re-triggering on every
 * scroll pass reads glitchy, and `once` keeps the observer cheap). The CSS owns
 * the actual motion + the reduced-motion fallback.
 */

export function useInView<T extends HTMLElement>(threshold = 0.2) {
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

/** A wrapper that gains data-inview="true" once scrolled into view. */
export function Reveal({
  className,
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      data-inview={inView ? "true" : undefined}
      className={className}
      style={style}
    >
      {children}
    </div>
  );
}

/** JS-driven choreography (montage timers, count-ups) checks this so reduced
 *  motion gets the FINAL state instead of theater (CSS handles the rest).
 *  useSyncExternalStore keeps it setState-free (the media query IS an external
 *  store); the server snapshot is false, so SSR renders the full-motion markup
 *  and the client corrects before anything plays. */
const REDUCED_MQ = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_MQ);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MQ).matches,
    () => false,
  );
}

/** The desktop browser mock every direction lives in. The viewport scrolls
 *  internally (fixed height) so each direction's scroll choreography is
 *  self-contained and comparable side by side. */
export function DesktopFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-background shadow-[0_24px_60px_-32px_rgba(0,0,0,0.35)]">
      <div className="flex items-center gap-2 border-b bg-muted/60 px-3 py-2">
        <span className="flex gap-1.5">
          <i className="size-2.5 rounded-full bg-border" />
          <i className="size-2.5 rounded-full bg-border" />
          <i className="size-2.5 rounded-full bg-border" />
        </span>
        <span className="mx-auto flex h-6 w-56 items-center justify-center rounded-md bg-background text-[11px] text-muted-foreground">
          partyreel.com
        </span>
        {/* Right spacer mirrors the dots so the address pill stays centered. */}
        <span className="w-[46px]" aria-hidden />
      </div>
      <div className="h-[560px] overflow-y-auto overscroll-contain">
        {children}
      </div>
    </div>
  );
}
