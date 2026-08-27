"use client";

import { useInViewOnce } from "@/lib/shared/use-in-view-once";

type RevealProps = React.ComponentProps<"div"> & {
  /** IntersectionObserver threshold (default 0.2, the lab-ratified trip point). */
  threshold?: number;
};

/**
 * The one-way in-view trigger (Track B system layer): wraps use-in-view-once and
 * flips `data-inview` so the marketing.css chapter-1 grammar fires — descendants
 * carrying `[data-mkt-reveal]` (standard rise) or `[data-mkt-cut]` (cinema cut)
 * animate once, staggered by their `--i` custom property. CSS owns all motion
 * (including the reduced-motion fade), this component owns only the observation.
 */
export function Reveal({
  threshold = 0.2,
  className,
  children,
  ...props
}: RevealProps) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>(threshold);
  return (
    <div
      ref={ref}
      data-inview={inView ? "true" : "false"}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}
