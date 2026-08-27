"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

import { useInViewOnce } from "@/lib/shared/use-in-view-once";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

type Fact = { label: string; value: string; href: string };

/**
 * The numbers band (R6 polish): StatBand's ratified stat register (Geist Mono
 * numerals at display scale, the number-pop-in recipe firing once in view)
 * applied to the help facts, each stat a quiet link to the guide that explains
 * it. Digits pop, punctuation and units stay planted; the FINAL value is
 * server-rendered so no-JS and SEO always read the true numbers. Mono here is
 * the ruling-sanctioned use: tabular numerals, StatBand precedent.
 */
export function HelpFactsBand({ facts }: { facts: Fact[] }) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>(0.4);
  const reduced = usePrefersReducedMotion();

  return (
    <div
      ref={ref}
      className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5"
    >
      {facts.map((fact) => (
        <Link
          key={fact.label}
          href={fact.href}
          className="group flex flex-col items-center gap-2 text-center"
        >
          <span className="font-mono text-3xl font-medium tracking-tight tabular-nums sm:text-4xl">
            {reduced ? (
              fact.value
            ) : (
              <PoppingValue value={fact.value} fired={inView} />
            )}
          </span>
          <span className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase transition-colors duration-150 group-hover:text-foreground">
            {fact.label}
          </span>
        </Link>
      ))}
    </div>
  );
}

function PoppingValue({ value, fired }: { value: string; fired: boolean }) {
  let digitIndex = 0;
  return (
    <span
      data-mkt-digits
      data-on={fired ? "true" : "false"}
      className="inline-flex items-baseline whitespace-nowrap"
    >
      {value.split("").map((ch, i) => {
        if (!/\d/.test(ch)) {
          // Words, units, and separators stay planted; only digits pop.
          return <span key={i}>{ch === " " ? " " : ch}</span>;
        }
        const style = { "--i": digitIndex++ } as CSSProperties;
        return (
          <span key={i} data-mkt-digit className="inline-block" style={style}>
            {ch}
          </span>
        );
      })}
    </span>
  );
}
