"use client";

import type { CSSProperties } from "react";

import {
  DistributionChart,
  TrendChart,
  type TrendSeries,
} from "@/components/admin/metrics-charts";
import { cn } from "@/lib/utils";

/**
 * DECISION 1: THE ADMIN CHART RAMP'S CAST, drawn on the real MetricsCharts.
 *
 * `TrendChart` and `DistributionChart` take colour as a plain string on their
 * data (never a palette of their own), so nothing here forks them: the four
 * candidates are four values for `--chart-1..5`, set as an inline style on the
 * wrapping card, which is what `--color-chart-N` (theme.css) resolves through.
 * Light and dark are two different casts of the *same* CSS custom property,
 * which is why they are asked as two separate decisions rather than one with a
 * mode switch (the board guidance: "dark and light are chosen separately").
 *
 * FIXTURES: a five-source distribution (today's real "Newsletter by source"
 * card never colours past two categories; this exercises every step of the
 * ramp) and a two-line trend (today's real pairing, on chart-2/chart-4 rather
 * than the brand ink, so the ramp itself is what is on trial).
 */

export type CastId = "today" | "graphite" | "accent" | "warm";

type Ramp = readonly [string, string, string, string, string];
type Palette = { light: Ramp; dark: Ramp };

/** Today's shipped ramp (globals.css), copied verbatim: chroma 0 throughout. */
const TODAY: Palette = {
  light: [
    "oklch(0.87 0 0)",
    "oklch(0.556 0 0)",
    "oklch(0.439 0 0)",
    "oklch(0.371 0 0)",
    "oklch(0.269 0 0)",
  ],
  dark: [
    "oklch(0.92 0 0)",
    "oklch(0.78 0 0)",
    "oklch(0.64 0 0)",
    "oklch(0.5 0 0)",
    "oklch(0.38 0 0)",
  ],
};

/** The same five lightness steps, hue 286 (Graphite's own hue) at the same
 *  whisper of chroma the room's hairlines already carry (--border light is
 *  0.0068, --ring dark is 0.0105 at this hue). */
const GRAPHITE: Palette = {
  light: [
    "oklch(0.87 0.008 286)",
    "oklch(0.556 0.008 286)",
    "oklch(0.439 0.008 286)",
    "oklch(0.371 0.008 286)",
    "oklch(0.269 0.008 286)",
  ],
  dark: [
    "oklch(0.92 0.01 286)",
    "oklch(0.78 0.01 286)",
    "oklch(0.64 0.01 286)",
    "oklch(0.5 0.01 286)",
    "oklch(0.38 0.01 286)",
  ],
};

/** The same steps at a warm hue instead of cool, the same chroma magnitude as
 *  Graphite's cast so the two read as a fair either/or rather than one being
 *  a stronger effect than the other. */
const WARM: Palette = {
  light: [
    "oklch(0.87 0.008 65)",
    "oklch(0.556 0.008 65)",
    "oklch(0.439 0.008 65)",
    "oklch(0.371 0.008 65)",
    "oklch(0.269 0.008 65)",
  ],
  dark: [
    "oklch(0.92 0.01 65)",
    "oklch(0.78 0.01 65)",
    "oklch(0.64 0.01 65)",
    "oklch(0.5 0.01 65)",
    "oklch(0.38 0.01 65)",
  ],
};

/** Today's ramp, minus its lightest step: the first series takes a calm blue
 *  accent instead (never a hue already spoken for by state feedback). */
const ACCENT: Palette = {
  light: [
    "oklch(0.58 0.16 250)",
    "oklch(0.556 0 0)",
    "oklch(0.439 0 0)",
    "oklch(0.371 0 0)",
    "oklch(0.269 0 0)",
  ],
  dark: [
    "oklch(0.72 0.15 250)",
    "oklch(0.78 0 0)",
    "oklch(0.64 0 0)",
    "oklch(0.5 0 0)",
    "oklch(0.38 0 0)",
  ],
};

const PALETTES: Record<CastId, Palette> = {
  today: TODAY,
  graphite: GRAPHITE,
  accent: ACCENT,
  warm: WARM,
};

/**
 * ★ A REAL PRODUCTION GAP, WORKED AROUND LOCALLY, NEVER FIXED HERE. Tailwind's
 * `@theme inline` only emits a `--color-chart-N: var(--chart-N)` alias into
 * the compiled sheet for a token it can see USED somewhere as literal text;
 * today that is `--color-chart-3` alone (admin/metrics/page.tsx spells it),
 * so `--color-chart-1`, `-2`, `-4` and `-5` compute to nothing anywhere in the
 * app and every series wired to them silently paints SVG's fallback, black.
 * Measured with a headless capture against the running dev server: the
 * distribution chart's four un-cast bars all came back `rgb(0, 0, 0)`.
 * `globals.css`/`theme.css` are read-only from this lane, so the fix is
 * flagged for the Orchestrator rather than patched here; this board sets
 * BOTH the raw token and its alias inline, which is a legal, scoped way to
 * guarantee the alias exists under this card regardless of what the rest of
 * the app has emitted, and it is what lets four of five cast options be
 * judged at all.
 */
const rampStyle = (ramp: Ramp): CSSProperties =>
  ({
    "--chart-1": ramp[0],
    "--chart-2": ramp[1],
    "--chart-3": ramp[2],
    "--chart-4": ramp[3],
    "--chart-5": ramp[4],
    "--color-chart-1": ramp[0],
    "--color-chart-2": ramp[1],
    "--color-chart-3": ramp[2],
    "--color-chart-4": ramp[3],
    "--color-chart-5": ramp[4],
  }) as CSSProperties;

/** A five-source distribution: every step of the ramp gets a real bar. */
const SOURCE_DATA = [
  { label: "Homepage", value: 812, color: "var(--color-chart-1)" },
  { label: "Blog", value: 540, color: "var(--color-chart-2)" },
  { label: "QR code", value: 390, color: "var(--color-chart-3)" },
  { label: "Referral", value: 260, color: "var(--color-chart-4)" },
  { label: "Other", value: 140, color: "var(--color-chart-5)" },
];

/** A two-line trend over 14 days, on the ramp rather than the brand ink. */
const TREND_SERIES: TrendSeries[] = [
  { key: "scans", label: "QR scans", color: "var(--color-chart-2)" },
  { key: "views", label: "Album views", color: "var(--color-chart-4)" },
];
const TREND_DATA = Array.from({ length: 14 }, (_, i) => {
  const day = new Date(Date.UTC(2026, 8, 1 + i)).toISOString().slice(0, 10);
  const scans = 120 + Math.round(40 * Math.sin(i / 2.3) + i * 6);
  const views = 70 + Math.round(24 * Math.sin(i / 2.3 + 1) + i * 4);
  return { day, scans, views };
});

export function ChartCastDemo({
  cast,
  mode,
}: {
  cast: CastId;
  mode: "light" | "dark";
}) {
  const ramp = PALETTES[cast][mode];
  return (
    // Forced, never left to the lab's own ambient theme: `.dark` and
    // `.surface-paper` are this codebase's real light/dark force-hooks
    // (globals.css; PaperChapter's own convention), and `bg-background
    // text-foreground` must be explicit alongside them (an inherited color
    // is a resolved value, not a live var(), so a dark ambient page would
    // otherwise leave near-white ink under a "light" card).
    <div
      className={cn(
        mode === "dark" ? "dark" : "surface-paper",
        "bg-background text-foreground",
      )}
      style={{ padding: 20 }}
    >
      <div
        className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2"
        style={rampStyle(ramp)}
      >
        <div>
          <p className="mb-2 text-sm font-medium text-card-foreground">
            Newsletter by source
          </p>
          <DistributionChart data={SOURCE_DATA} height={200} />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-card-foreground">
            Scans and views (14 days)
          </p>
          <TrendChart data={TREND_DATA} series={TREND_SERIES} height={200} />
        </div>
      </div>
    </div>
  );
}
