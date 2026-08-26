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
 *
 * ONE PRICE REGISTER (R4/A10): the labels come from tiers.ts as whole phrases
 * ("$0", "from $9/mo", "$24 one-time"), and setting all three at price size
 * made the row read as three different type treatments — a bare number beside
 * two mono sentences. The label is split into a MONEY core and its qualifier
 * words; the core keeps the big face, the qualifiers drop to a small muted
 * one. Same face and same strings throughout, so every card now leads with a
 * number of the same weight. tiers.ts stays the only copy source.
 */

type PriceParts = { prefix: string; money: string; suffix: string };

/** "$24 one-time" -> { money: "$24", suffix: "one-time" }; a label with no
 *  recognizable money core renders whole (nothing is ever dropped). */
export function splitPrice(label: string): PriceParts {
  const m = label.match(/^(.*?)(\$[\d.,]+(?:\/[a-z]+)?)(.*)$/i);
  if (!m) return { prefix: "", money: label, suffix: "" };
  return { prefix: m[1].trim(), money: m[2], suffix: m[3].trim() };
}

export function PricePop({ label }: { label: string }) {
  const { ref, inView } = useInViewOnce<HTMLSpanElement>(0.4);
  const { prefix, money, suffix } = splitPrice(label);
  let digit = 0;
  return (
    <span ref={ref} data-mkt-digits data-on={inView ? "true" : "false"}>
      {prefix && <Qualifier className="mr-1.5">{prefix}</Qualifier>}
      {money.split("").map((ch, i) =>
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
      {suffix && <Qualifier className="ml-1.5">{suffix}</Qualifier>}
    </span>
  );
}

function Qualifier({
  children,
  className,
}: {
  children: string;
  className: string;
}) {
  return (
    <span
      className={`text-[0.55em] font-medium tracking-normal text-muted-foreground ${className}`}
    >
      {children}
    </span>
  );
}
