import { sparklinePath } from "@/lib/admin/kpi";
import { cn } from "@/lib/utils";

/**
 * A FORTNIGHT AS ONE LINE, drawn on the server (`home=kpi`, Will 2026-09-20).
 *
 * Fourteen numbers under four figures. It is inline SVG and not the recharts
 * pair /admin/metrics uses, because those are a client island behind
 * `ssr: false` and a Skeleton: a line that pops in after hydration under
 * figures that were there from the first paint reads as a page still loading
 * long after it has loaded.
 *
 * ★ IT IS A SHAPE, AND IT SAYS SO. No axis, no grid, no hover, no numbers on
 * it: nothing here is readable as a value and nothing pretends to be. The
 * figures above carry the quantities and this carries the direction, which is
 * the whole of what fourteen days of signups is for on a landing page.
 */
export function Sparkline({
  counts,
  className,
  label,
}: {
  counts: number[];
  className?: string;
  /** What the line is of, for a reader who cannot see it. */
  label: string;
}) {
  const width = 240;
  const height = 40;
  const d = sparklinePath(counts, width, height);
  if (!d) return null;
  const total = counts.reduce((sum, n) => sum + n, 0);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`${label}: ${total} over ${counts.length} days`}
      className={cn("h-10 w-full", className)}
    >
      {/* The fill first, so the stroke sits on top of its own wash. It reuses
          the line's path closed to the baseline rather than a second path with
          its own arithmetic to drift from. */}
      <path
        d={`${d} L ${width} ${height} L 0 ${height} Z`}
        className="fill-foreground/6"
      />
      <path
        d={d}
        fill="none"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        // `vector-effect` keeps the stroke 1.5px after `preserveAspectRatio`
        // has stretched the box: without it a wide card draws a fat line and a
        // narrow one draws a hair.
        vectorEffect="non-scaling-stroke"
        className="stroke-foreground/50"
      />
    </svg>
  );
}
