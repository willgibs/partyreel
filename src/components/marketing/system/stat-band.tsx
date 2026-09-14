"use client";

import type { CSSProperties } from "react";

import { useInViewOnce } from "@/lib/shared/use-in-view-once";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

export type Stat = {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
};

type StatBandProps = {
  stats: Stat[];
  /**
   * "spin" = the slot-machine reel (spinning-counter recipe, --mkt-count-*);
   * "pop" = the per-digit blurred pop (number-pop-in recipe, --mkt-digit-*);
   * "none" = static. Fired ONCE when the band scrolls into view; reduced motion
   * always renders the final numbers (no reels, no pop).
   */
  animate?: "spin" | "pop" | "none";
  className?: string;
};

// One extra full 0-9 pass before landing: enough to read as a roll, cheap to paint.
const SPIN_ROUNDS = 2;

function formatValue(value: number): string {
  return value.toLocaleString("en-US");
}

/**
 * The recurring counter band (Track B system layer): one row of big numbers
 * with quiet labels.
 *
 * THE STAT REGISTER (rebuilt by the kill-mono sweep, 2026-09-14). A count is
 * the subject of its block, so it renders where every other subject number on
 * this site renders: the DISPLAY face (Urbanist via font-heading) with
 * tabular figures, the register the pricing cards ratified on 2026-08-27. The
 * band used to set these in Geist Mono at 500, which read like a readout of
 * someone else's data rather than a claim we are making. The label keeps the
 * tracked uppercase micro-register it shares with the pricing stat rows: it is
 * the counterweight that stops a bold numeral from reading as body copy.
 *
 * Server-renders the FINAL digits (the spin starts each reel ON its digit and
 * rolls when fired), so no-JS and SEO always see the true numbers; the motion
 * is pure enhancement. The motion CSS lives in marketing.css chapter 2
 * (mkt-count-* / mkt-digits hooks). tabular-nums is load-bearing now, not
 * decoration: it is what holds a reel column's ten digits to one width.
 */
export function StatBand({
  stats,
  animate = "spin",
  className,
}: StatBandProps) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>(0.4);
  const reduced = usePrefersReducedMotion();
  const mode = reduced ? "none" : animate;

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-wrap items-start justify-center gap-x-12 gap-y-8",
        className,
      )}
    >
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col items-center gap-2">
          <div className="font-heading text-3xl tabular-nums sm:text-4xl">
            {stat.prefix}
            <StatValue value={stat.value} mode={mode} fired={inView} />
            {stat.suffix}
          </div>
          <span className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function StatValue({
  value,
  mode,
  fired,
}: {
  value: number;
  mode: "spin" | "pop" | "none";
  fired: boolean;
}) {
  const text = formatValue(value);
  if (mode === "none") return <span>{text}</span>;

  if (mode === "pop") {
    // number-pop-in: each character is its own [data-mkt-digit]; the group's
    // data-on fires the keyframe once, staggered by --i.
    return (
      <span
        data-mkt-digits
        data-on={fired ? "true" : "false"}
        className="inline-flex items-baseline"
      >
        {text.split("").map((ch, i) => (
          <span
            key={i}
            data-mkt-digit
            className="inline-block"
            style={{ "--i": i } as CSSProperties}
          >
            {ch}
          </span>
        ))}
      </span>
    );
  }

  // spin: one clipped reel column per digit (separators stay static). The strip
  // starts translated to the FINAL digit (so SSR/no-JS shows the true number)
  // and rolls SPIN_ROUNDS further passes down to the same digit when fired.
  let col = 0;
  return (
    <span className="inline-flex items-baseline" aria-label={text} role="img">
      {text.split("").map((ch, i) => {
        if (!/\d/.test(ch)) {
          return (
            <span key={i} aria-hidden>
              {ch}
            </span>
          );
        }
        const digit = Number(ch);
        const rest = digit;
        const target = SPIN_ROUNDS * 10 + digit;
        const colIndex = col++;
        return (
          <span
            key={i}
            aria-hidden
            data-mkt-count-col
            className="inline-flex h-[var(--mkt-count-cell,1.15em)] overflow-hidden"
            style={{ "--col-i": colIndex } as CSSProperties}
          >
            <span
              data-mkt-count-strip
              className="flex flex-col"
              style={{
                transform: `translateY(calc(${fired ? target : rest} * var(--mkt-count-cell, 1.15em) * -1))`,
              }}
            >
              {/* shrink-0 is load-bearing (T1's expansion find): the column
                  window's inline-flex stretched the strip and let these cells
                  flex-shrink from 1.15em toward their line box, landing every
                  spin ~1.4px/cell off (visible split half-digits on /reel's
                  RenderSection). Fixed height only works if it can't shrink. */}
              {Array.from({ length: SPIN_ROUNDS * 10 + 10 }, (_, n) => (
                <span
                  key={n}
                  className="flex h-[var(--mkt-count-cell,1.15em)] shrink-0 items-center justify-center"
                >
                  {n % 10}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}
