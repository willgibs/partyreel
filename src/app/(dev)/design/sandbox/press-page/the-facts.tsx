"use client";

import { ArrowUpRight } from "lucide-react";

import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { Container } from "@/components/shared/container";
import { PRESS_FACTS } from "@/lib/constants/press";
import { cn } from "@/lib/utils";

/**
 * DECISION 4: HOW CHECKABLE THE FACTS ARE. `rendered-rows` recreates the real
 * fact-sheet markup verbatim on the real PRESS_FACTS array (the /llms.txt
 * single source). `rows-plus-url` is the same rows plus one added link.
 * `stat-strip` pulls a handful of the same real facts into a masthead-style
 * strip, the full table demoted below.
 */

const INLINE_LINK =
  "underline decoration-current/30 underline-offset-4 transition-colors duration-150 hover:decoration-current";

const isTabular = (value: string) => /^[\d$]/.test(value);

function factHref(label: string, value: string): string | null {
  if (label === "Website") return `https://${value}`;
  if (label === "Press contact") return `mailto:${value}`;
  return null;
}

function FactRows({ rows = PRESS_FACTS }: { rows?: typeof PRESS_FACTS }) {
  return (
    <dl className="divide-y divide-border border-t">
      {rows.map(({ label, value }) => {
        const href = factHref(label, value);
        return (
          <div
            key={label}
            className="grid gap-1 py-3.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)] sm:items-baseline sm:gap-12"
          >
            <dt className="text-sm font-medium">{label}</dt>
            <dd
              className={cn(
                "text-sm text-pretty text-muted-foreground",
                isTabular(value) && "text-[13px] tabular-nums",
              )}
            >
              {href ? (
                <a href={href} className={cn("text-foreground", INLINE_LINK)}>
                  {value}
                </a>
              ) : (
                value
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function RenderedRows() {
  return (
    <div className="max-w-2xl">
      <FactRows />
    </div>
  );
}

function RowsPlusUrl() {
  return (
    <div className="max-w-2xl">
      <FactRows />
      <a
        href="/llms-full.txt"
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "mkt-learn mt-5 inline-flex items-center gap-1.5 text-sm font-medium",
          INLINE_LINK,
        )}
      >
        Machine-readable copy, for a script
        <ArrowUpRight aria-hidden className="size-3.5 shrink-0" />
      </a>
    </div>
  );
}

const STAT_IDS = ["How it works", "Guests need", "Availability"];

function StatStrip() {
  const stats = STAT_IDS.map((label) => PRESS_FACTS.find((f) => f.label === label)!);
  const rest = PRESS_FACTS.filter((f) => !STAT_IDS.includes(f.label));
  return (
    <div className="max-w-2xl">
      <ul className="grid gap-4 rounded-tile border bg-muted/40 p-5 sm:grid-cols-3">
        {stats.map((s) => (
          <li key={s.label}>
            <Eyebrow>{s.label}</Eyebrow>
            <p className="mt-1.5 text-sm text-pretty">{s.value}</p>
          </li>
        ))}
      </ul>
      <p className="mt-5 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-[0.14em]">
        The rest of the sheet
      </p>
      <FactRows rows={rest} />
    </div>
  );
}

export function FactsPreview({
  variant,
}: {
  variant: "rendered-rows" | "rows-plus-url" | "stat-strip";
}) {
  return (
    <Container className="py-10">
      {variant === "rows-plus-url" ? (
        <RowsPlusUrl />
      ) : variant === "stat-strip" ? (
        <StatStrip />
      ) : (
        <RenderedRows />
      )}
    </Container>
  );
}
