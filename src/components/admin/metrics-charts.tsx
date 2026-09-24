"use client";

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

import { compactAxisWidth, formatCompactNumber, formatCount } from "@/lib/format/count";

// recharts wrappers for the admin metrics dashboard (P6b). Client-only (recharts measures the DOM via
// ResponsiveContainer), fed serializable data from the server page. Theming is grayscale + the single
// coral accent, via CSS-var strings passed straight to SVG stroke/fill (the tokens live in globals.css
// and flip under the .dark class, so the charts inherit light/dark for free). Keep series colors to
// `var(--color-brand)` (hero) + the `--color-chart-*` / foreground grays.
//
// `initialDimension` is REQUIRED: ResponsiveContainer's first render (before its ResizeObserver fires)
// otherwise measures width/height = -1 and logs "width(-1)/height(-1)…". Seeding a positive initial size
// renders cleanly on server + first client paint (no warning, no hydration mismatch); the observer then
// resizes to the real container width.
//
// ★ EVERY YAXIS TICKS COMPACT AND WIDENS TO FIT (the 1,000-row round's follow-on, 2026-09-24). A fixed
// `width={28}` clipped a four-digit tick ("1400" drew as "400"): the axis now measures the widest
// COMPACT label its own data can draw (`compactAxisWidth`) and formats every tick with it
// (`formatCompactNumber`, "1.4K"/"12K"/"1.2M"; a number under 1,000 is unchanged). The tooltip stays
// exact (`formatCount`), since a hover is where the precise figure belongs.

const AXIS = "var(--color-muted-foreground)";
const GRID = "var(--color-border)";
const INITIAL_WIDTH = 600;

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
  // Every value any line can draw, so the axis fits whichever series is
  // tallest (never just the first, and never a stale width from a prior page).
  const values = data.flatMap((row) =>
    series.map((s) => Number(row[s.key]) || 0),
  );
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{ width: INITIAL_WIDTH, height }}
      >
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
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
            width={compactAxisWidth(values)}
            tickFormatter={formatCompactNumber}
            tick={{ fontSize: 11, fill: AXIS }}
            stroke={GRID}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelFormatter={(label) => formatDay(String(label))}
            formatter={(value) => formatCount(Number(value))}
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
  const values = data.map((d) => d.value);
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{ width: INITIAL_WIDTH, height }}
      >
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: AXIS }}
            stroke={GRID}
          />
          <YAxis
            allowDecimals={false}
            width={compactAxisWidth(values)}
            tickFormatter={formatCompactNumber}
            tick={{ fontSize: 11, fill: AXIS }}
            stroke={GRID}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: "var(--color-muted)" }}
            formatter={(value) => formatCount(Number(value))}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.label} fill={d.color ?? "var(--color-foreground)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
