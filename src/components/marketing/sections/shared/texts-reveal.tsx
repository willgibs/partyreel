"use client";

import { useInViewOnce } from "@/lib/shared/use-in-view-once";
import { cn } from "@/lib/utils";

/**
 * The texts-reveal trigger (18-texts-reveal, marketing.css chapter 2): flips
 * `.is-shown` on the `.mkt-lines` group once it scrolls into view, so each
 * child `.mkt-line` (staggered by its `--i`) rises in with the recipe's blur.
 * CSS owns all motion INCLUDING the reduced-motion arrival guarantee (the
 * reduce block forces the lines visible), so this island is observation-only,
 * the same contract as system/reveal.tsx. It exists because .mkt-lines keys on
 * a CLASS (the recipe's shape), not on data-inview, so the Reveal island
 * cannot drive it.
 */
export function TextsReveal({
  threshold = 0.2,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { threshold?: number }) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>(threshold);
  return (
    <div
      ref={ref}
      className={cn("mkt-lines", inView && "is-shown", className)}
      {...props}
    >
      {children}
    </div>
  );
}
