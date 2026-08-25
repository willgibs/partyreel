"use client";

import type { CSSProperties } from "react";

import { useInViewOnce } from "@/lib/shared/use-in-view-once";

/**
 * number-pop-in over a price label (the .mkt digit hooks, marketing.css
 * chapter 2): each DIGIT re-enters from below with blur once the card scrolls
 * into view; non-digit characters ($, /, letters) stay static so "from $9/mo"
 * pops only its number. The server HTML carries the true label and the digits
 * are visible before the animation fires (and always, under reduced motion),
 * the StatBand content-first contract.
 */
export function PricePop({ label }: { label: string }) {
  const { ref, inView } = useInViewOnce<HTMLSpanElement>(0.4);
  let digit = 0;
  return (
    <span ref={ref} data-mkt-digits data-on={inView ? "true" : "false"}>
      {label.split("").map((ch, i) =>
        /\d/.test(ch) ? (
          <span
            key={i}
            data-mkt-digit
            style={{ "--i": digit++ } as CSSProperties}
          >
            {ch}
          </span>
        ) : (
          <span key={i}>{ch}</span>
        ),
      )}
    </span>
  );
}
