"use client";

import { useSyncExternalStore } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// recharts wrappers for the admin metrics dashboard (P6b). Client-only (recharts measures the DOM via
// ResponsiveContainer), fed serializable data from the server page. Theming is grayscale + the single
// coral accent, via CSS-var strings passed straight to SVG stroke/fill (the tokens live in globals.css
// and flip under the .dark class, so the charts inherit light/dark for free). Keep series colors to
// `var(--color-brand)` (hero) + the `--color-chart-*` / foreground grays.

const AXIS = "var(--color-muted-foreground)";
const GRID = "var(--color-border)";

const TOOLTIP_STYLE: React.CSSProperties = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: "0.5rem",
  fontSize: "0.75rem",
  color: "var(--color-foreground)",
};

// "2026-06-01" → "Jun 1" (UTC + explicit locale so it's deterministic; chart is client-only anyway).
function formatDay(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

// Render recharts only AFTER hydration, so its ResponsiveContainer measures a laid-out (non-zero)
// parent instead of warning "width(-1)/height(-1)" on the first paint. useSyncExternalStore is the
// hydration-safe client-only signal (server snapshot false, client true, no-op subscribe) — no
// setState-in-effect. Server + first client render both show the empty fixed-height div (no mismatch).
const emptySubscribe = () => () => {};
function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export type TrendSeries = { key: string; label: string; color: string };

/** Line chart over a `day` X-axis. One series (signups) or two (scans + views). */
export function TrendChart({
  data,
  series,
  height = 220,
}: {
  data: Record<string, string | number>[];
  series: TrendSeries[];
  height?: number;
}) {
  const mounted = useMounted();
  return (
    <div className="w-full" style={{ height }}>
      {mounted ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={GRID}
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tickFormatter={formatDay}
              tick={{ fontSize: 11, fill: AXIS }}
              stroke={GRID}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis
              allowDecimals={false}
              width={28}
              tick={{ fontSize: 11, fill: AXIS }}
              stroke={GRID}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelFormatter={(label) => formatDay(String(label))}
            />
            {series.length > 1 ? (
              <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
            ) : null}
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}

export type DistributionDatum = {
  label: string;
  value: number;
  color?: string;
};

/** Vertical bar chart for a small categorical distribution (tier mix, media type, newsletter source). */
export function DistributionChart({
  data,
  height = 200,
}: {
  data: DistributionDatum[];
  height?: number;
}) {
  const mounted = useMounted();
  return (
    <div className="w-full" style={{ height }}>
      {mounted ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={GRID}
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: AXIS }}
              stroke={GRID}
            />
            <YAxis
              allowDecimals={false}
              width={28}
              tick={{ fontSize: 11, fill: AXIS }}
              stroke={GRID}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ fill: "var(--color-muted)" }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((d) => (
                <Cell
                  key={d.label}
                  fill={d.color ?? "var(--color-foreground)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}
