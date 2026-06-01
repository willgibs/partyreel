import { type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

// A single KPI tile for the admin metrics dashboard (P6a): label + big value + optional sub-line and
// icon. Presentational + server-compatible (no client JS); the page formats the value (bytes/currency/
// counts) before passing it in. P6b's charts sit alongside these in the page, not inside the card.
export function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">{label}</span>
          {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </div>
        {sub ? (
          <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
