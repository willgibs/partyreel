"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

import { useInViewOnce } from "@/lib/shared/use-in-view-once";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

type Fact = { label: string; value: string; href: string };

/**
 * THE FILMSTRIP (after Will's rework note on the floating stats): the numbers
 * printed on a strip of film, with perforated edges, hairline frame cells and
 * the number-pop-in recipe firing once in view. Every cell links to the guide
 * that explains its number; the FINAL value is server-rendered so no-JS and
 * SEO always read the truth. The perforation is a CSS gradient, not
 * marketing.css (no policy surface).
 *
 * The numerals are the StatBand register (kill-mono, 2026-09-14): the display
 * face with tabular figures, because a number on a film cell is the subject of
 * that cell. The label under it stays the tracked uppercase micro-register.
 */
export function HelpFactsBand({ facts }: { facts: Fact[] }) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>(0.4);
  const reduced = usePrefersReducedMotion();

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-2xl border bg-card ring-1 ring-foreground/5"
    >
      <Perforation edge="top" />
      <div className="grid grid-cols-2 gap-px border-y bg-border sm:grid-cols-3 lg:grid-cols-5">
        {facts.map((fact, index) => (
          <Link
            key={fact.label}
            href={fact.href}
            className={cn(
              "group flex flex-col items-center gap-1.5 bg-card px-4 py-6 text-center transition-colors duration-150 hover:bg-muted/50",
              // 5 frames: the last spans the leftover cell(s) below lg.
              index === facts.length - 1 &&
                "col-span-2 sm:col-span-1 lg:col-span-1",
              index === 3 && "sm:col-span-2 lg:col-span-1",
            )}
          >
            <span className="font-heading text-prose tabular-nums">
              {reduced ? (
                fact.value
              ) : (
                <PoppingValue value={fact.value} fired={inView} />
              )}
            </span>
            <span className="text-label font-medium text-muted-foreground uppercase transition-colors duration-150 group-hover:text-foreground">
              {fact.label}
            </span>
          </Link>
        ))}
      </div>
      <Perforation edge="bottom" />
    </div>
  );
}

/** The film edge: a row of sprocket holes drawn with one repeating gradient. */
function Perforation({ edge }: { edge: "top" | "bottom" }) {
  return (
    <div aria-hidden className="bg-muted/40 px-4 py-[7px]">
      <div
        className="h-1.5 w-full rounded-full"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, var(--border) 0 8px, transparent 8px 20px)",
        }}
        data-edge={edge}
      />
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
          // Words, units, and separators stay planted; only digits pop. A
          // plain space would be a whitespace-only text node, which flex
          // layout DROPS — render NBSP so "10 GB" keeps its gap.
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
