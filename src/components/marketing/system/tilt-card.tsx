"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

/**
 * The 3D pointer tilt (card-tilt recipe, re-tokened to --mkt-tilt-*; CSS in
 * marketing.css chapter 2). The pointer is tracked on the OUTER flat wrapper
 * (never transforms) so the rotating card's edges can't slip out from under the
 * cursor — the recipe's flicker gotcha. DELIBERATE deviation from the recipe:
 * mouse-only (no touch-action: none, touch pointers ignored) because a finger
 * over a marketing card must SCROLL the page, not tilt a tile; the recipe itself
 * calls the tilt a hover-only affordance. Reduced motion flattens (CSS guard +
 * this early return).
 */
export function TiltCard({
  children,
  className,
  maxTiltDeg = 12,
}: {
  children: ReactNode;
  className?: string;
  /** Peak tilt at the card edges; 10-16 reads subtle per the recipe. */
  maxTiltDeg?: number;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();

  function reset() {
    const wrap = wrapRef.current;
    const card = cardRef.current;
    if (!wrap || !card) return;
    wrap.classList.remove("is-hover");
    card.classList.remove("is-tilting");
    card.style.setProperty("--mkt-tilt-rx", "0deg");
    card.style.setProperty("--mkt-tilt-ry", "0deg");
  }

  function track(e: PointerEvent<HTMLDivElement>) {
    if (reduced || e.pointerType !== "mouse") return;
    const wrap = wrapRef.current;
    const card = cardRef.current;
    if (!wrap || !card) return;
    const r = wrap.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    wrap.classList.add("is-hover");
    card.classList.add("is-tilting");
    card.style.setProperty(
      "--mkt-tilt-ry",
      `${((px - 0.5) * maxTiltDeg).toFixed(2)}deg`,
    );
    card.style.setProperty(
      "--mkt-tilt-rx",
      `${((0.5 - py) * maxTiltDeg).toFixed(2)}deg`,
    );
    card.style.setProperty("--mkt-tilt-gx", `${(px * 100).toFixed(1)}%`);
    card.style.setProperty("--mkt-tilt-gy", `${(py * 100).toFixed(1)}%`);
  }

  return (
    <div
      ref={wrapRef}
      className={cn("mkt-tilt", className)}
      onPointerMove={track}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") reset();
      }}
      onPointerCancel={reset}
    >
      <div ref={cardRef} className="mkt-tilt-card">
        {children}
        <div className="mkt-tilt-glare" aria-hidden />
      </div>
    </div>
  );
}
