"use client";

import { useEffect, useRef, useState } from "react";

import { parseCssMs } from "@/lib/shared/read-css-ms";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

/**
 * The 04-text-states-swap island: old text exits UP with blur, new text enters
 * from below. Three phases, exactly as the marketing.css grammar expects:
 * `.is-exit` -> swap the text + `.is-enter-start` (transition suppressed) ->
 * reflow -> drop the class so it settles in.
 *
 * The island owns the text node IMPERATIVELY (React renders only the first
 * value): if React re-rendered children on every change it would have already
 * committed the NEW string by the time the effect could start the exit, and the
 * old text would never get to leave. Same division of labour as the rest of the
 * marketing motion layer — CSS owns the movement, the island owns the flag.
 *
 * The wait comes from the CSS clock (--mkt-swap-dur) read off THIS element, not
 * documentElement: the chapter-2 tokens are declared on [data-mkt], which lives
 * on the cinema layout / paper chapter, so a documentElement read would silently
 * fall back. parseCssMs (never parseInt) because Lightning CSS canonicalizes
 * `150ms` to `.15s` in the shipped bundle.
 *
 * Reduced motion swaps instantly: the CSS kills the transition, so running the
 * phases anyway would blank the text for a beat with nothing to show for it.
 */
export function TextSwap({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  // Frozen on mount: what React ever renders. Everything after is the island's.
  const [initial] = useState(value);
  const shown = useRef(value);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || value === shown.current) return;
    shown.current = value;

    if (reduced) {
      el.textContent = value;
      return;
    }

    el.classList.remove("is-enter-start");
    el.classList.add("is-exit");
    const wait = parseCssMs(
      getComputedStyle(el).getPropertyValue("--mkt-swap-dur"),
      150,
    );

    let raf = 0;
    const timer = setTimeout(() => {
      el.textContent = value;
      el.classList.remove("is-exit");
      el.classList.add("is-enter-start");
      // Two frames: one to commit the suppressed-transition start pose, one to
      // release it. A single frame occasionally coalesced into no animation.
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(() =>
          el.classList.remove("is-enter-start"),
        );
      });
    }, wait);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [value, reduced]);

  return (
    <span ref={ref} className={cn("mkt-text-swap", className)}>
      {initial}
    </span>
  );
}
