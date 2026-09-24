import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatCount, formatSignedCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

// A single KPI tile for the admin metrics dashboard (P6a): label + big value + optional sub-line and
// icon. Presentational + server-compatible (no client JS); the page pre-formats a value that ISN'T a
// plain count (bytes, currency) before passing it in — a raw `number` is always a count and this card
// is the one place it is grouped (`lib/format/count.ts`), so the overview's four figures format the
// same way as every page that already calls `formatCount` itself. P6b's charts sit alongside these in
// the page, not inside the card.
//
// ★ THE DELTA IS OPTIONAL AND `null` IS NOT ZERO (admin-wiring, 2026-09-20). The home's four figures
// carry a fortnight's change (`home=kpi`), but one of them cannot: nothing in the database remembers
// how many people were paying a fortnight ago. `delta={null}` draws no arrow at all, `delta={0}`
// draws "No change", and the difference between those two is the difference between a console that
// knows and one that guesses. Every /admin/metrics card passes neither and is unchanged.
export function MetricCard({
  label,
  value,
  sub,
  delta,
  icon: Icon,
  children,
}: {
  label: string;
  value: string | number;
  sub?: string;
  /** The change over the card's own window. Undefined or null = say nothing. */
  delta?: number | null;
  icon?: LucideIcon;
  /** A sparkline, or anything else that belongs under the figure. */
  children?: React.ReactNode;
}) {
  const showDelta = typeof delta === "number";
  const up = showDelta && delta > 0;
  const down = showDelta && delta < 0;

  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between gap-2">
          <span className="text-working text-muted-foreground">{label}</span>
          {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight tabular-nums">
            {typeof value === "number" ? formatCount(value) : value}
          </span>
          {showDelta ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-caption font-medium tabular-nums",
                // A rise is not automatically good and a fall is not
                // automatically bad, so only a rise takes the state colour and
                // everything else stays quiet: the label above says what the
                // direction is a direction IN.
                up ? "text-success" : "text-muted-foreground",
              )}
            >
              {up ? (
                <ArrowUpRight aria-hidden className="size-3" />
              ) : down ? (
                <ArrowDownRight aria-hidden className="size-3" />
              ) : null}
              {delta === 0 ? "No change" : formatSignedCount(delta)}
              <span className="sr-only"> against the fortnight before</span>
            </span>
          ) : null}
        </div>
        {sub ? (
          <div className="mt-1 text-caption text-muted-foreground">{sub}</div>
        ) : null}
        {children ? <div className="mt-3">{children}</div> : null}
      </CardContent>
    </Card>
  );
}
