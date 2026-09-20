import { cn } from "@/lib/utils";

// The single subtle header EVERY stacked feed section leads with (Gallery / Reel / Review), so a long
// scroll reads clearly AND — the load-bearing bit — toggling pills never bounces the layout. The band is
// locked to `min-h-7` (28px == a `size="sm"` Button's h-7) on the ROW, not derived from its children, so a
// label-only header (Gallery/Reel) and an action-bearing header (Review-pending carries the Select /
// Approve all cluster) resolve to the EXACT same height + top. ★ Keep any `action` control at `size="sm"` /
// `icon-sm` (h-7): a `size="default"`/`lg` button is h-8 and would grow the band past 28px, reintroducing
// the bounce. Subtle by construction: an 11px uppercase eyebrow + the pill-identical count badge, no rules /
// fills / chevrons. `amber` is the only tone, reserved for a live review queue (needs-action).
export function FeedSectionHeader({
  label,
  count,
  amber,
  action,
}: {
  label: string;
  count?: number;
  /** The needs-action tone — a live Review queue only. */
  amber?: boolean;
  /** Right-side slot; ONLY Review-pending fills it (must stay ≤ h-7, see above). */
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-7 items-center justify-between gap-3">
      <h2 className="flex items-center gap-1.5">
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
            {count}
          </span>
        ) : null}
      </h2>
      {action}
    </div>
  );
}
