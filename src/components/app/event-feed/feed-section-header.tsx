"use client";

import { useEffect, useRef, useState } from "react";

import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

// The single subtle header EVERY stacked feed section leads with (Gallery / Reel / Review), so a long
// scroll reads clearly AND — the load-bearing bit — toggling pills never bounces the layout. The band is
// locked to `min-h-7` (28px == a `size="sm"` Button's h-7) on the ROW, not derived from its children, so a
// label-only header (Gallery/Reel) and an action-bearing header (Review-pending carries the Select /
// Approve all cluster) resolve to the EXACT same height + top. ★ Keep any `action` control at `size="sm"` /
// `icon-sm` (h-7): a `size="default"`/`lg` button is h-8 and would grow the band past 28px, reintroducing
// the bounce. Subtle by construction: an 11px uppercase eyebrow + the pill-identical count badge, no rules /
// fills / chevrons. `amber` is the only tone, reserved for a live review queue (needs-action).
//
// ★ A BAND THAT WRAPS KEEPS ITS HEIGHT WHILE THE ACTION FILLS IT (crumbs-35, build 34's red-team). The
// 28px floor holds only where the tools fit on one line. In a hand the album's resting tools (Add photos,
// Download, Select, View) wrap to a second line, 62px, and the bulk bar that replaces them is one line,
// 28px, so the album beneath moved 34px on Select and back on Cancel (measured at 375: its first tile at
// 88, 54, 88; 68px at 320, where the tools wrap to three lines), and leaving select mode after a bulk
// delete jumped it when the browser's scroll anchoring missed the band growing back. So the row measures
// itself while the action is NOT filling it and, while it is, keeps that height as its minimum: the bar sits
// centred in a band exactly as tall as the tools were, at every width, and nothing beneath it moves.
export function FeedSectionHeader({
  label,
  count,
  amber,
  action,
  actionFills = false,
}: {
  label: string;
  count?: number;
  /** The needs-action tone — a live Review queue only. */
  amber?: boolean;
  /** Right-side slot: the album's controls, Review's cluster (must stay ≤ h-7, see above). */
  action?: React.ReactNode;
  /**
   * In a hand the action takes the row and the label steps aside, kept for a screen reader (crumbs-32):
   * the album's bulk bar while selecting, whose 44px targets do not fit beside the label at 375. The
   * band keeps the height it had at rest (above), so nothing bounces at any width; at a desk, where the
   * tools fit on one line, that is 28px and nothing changes.
   */
  actionFills?: boolean;
}) {
  const { rowRef, minHeight } = useRestingHeight(actionFills);
  return (
    <div
      ref={rowRef}
      style={minHeight ? { minHeight } : undefined}
      className={cn(
        "flex min-h-7 items-center justify-between gap-3",
        actionFills && "max-sm:justify-end",
      )}
    >
      <h2
        className={cn(
          "flex items-center gap-1.5",
          actionFills && "max-sm:sr-only",
        )}
      >
        <span
          className={cn(
            "text-label font-semibold uppercase",
            amber ? "text-warning" : "text-muted-foreground",
          )}
        >
          {label}
        </span>
        {count ? (
          <span
            className={cn(
              "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums",
              amber
                ? "bg-warning/15 text-warning"
                : "bg-muted text-muted-foreground",
            )}
          >
            {formatCount(count)}
          </span>
        ) : null}
      </h2>
      {action}
    </div>
  );
}

/**
 * THE ROW'S HEIGHT AT REST: measured while nothing fills it (a ResizeObserver, so a rotation or a wider
 * window re-reads it), and handed back as the minimum while something does. A row never measured, or one in
 * a browser without the observer, holds nothing, which is the band as it was.
 */
function useRestingHeight(filled: boolean) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [resting, setResting] = useState<number | null>(null);
  useEffect(() => {
    const row = rowRef.current;
    if (!row || filled || typeof ResizeObserver === "undefined") return;
    // The observer reports once as it starts, so the first read needs no call of its own.
    const observer = new ResizeObserver(() =>
      setResting(row.getBoundingClientRect().height),
    );
    observer.observe(row);
    return () => observer.disconnect();
  }, [filled]);
  return { rowRef, minHeight: filled ? resting : null };
}
