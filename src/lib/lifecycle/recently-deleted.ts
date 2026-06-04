/**
 * Recently Deleted — recovery lifecycle constants + the standby-budget eviction selector.
 *
 * Soft-deleted media/events stay recoverable for RECENTLY_DELETED_WINDOW_DAYS, then the purge
 * cron hard-deletes them. On TOP of that time window, a STANDBY BUDGET caps the TOTAL
 * deleted-but-stored bytes per account so the restore -> re-delete "timer refresh" can't
 * accumulate unbounded junk: budget = RECENTLY_DELETED_BUDGET_MULTIPLIER x the account's
 * effective storage cap, enforced OLDEST-first by the cron (sweepStandbyBudget). The window is
 * hand-mirrored as a SQL `interval '30 days'` in the media purge_at trigger + the cron filters —
 * keep in lockstep (same convention as the per-file limits in lib/media/limits.ts).
 */

/** Recoverable window for soft-deleted media/events before the cron hard-purges them. */
export const RECENTLY_DELETED_WINDOW_DAYS = 30;

/**
 * Standby (recently-deleted) byte budget as a multiple of the account's effective storage cap.
 * 1x -> the bin holds up to one cap's worth, so total physical we ever hold is <= ~2x cap. The
 * cron evicts oldest-first when standby exceeds this. A multiplier (not a literal) so it tracks
 * cap/pricing changes via effectiveStorageCap automatically.
 */
export const RECENTLY_DELETED_BUDGET_MULTIPLIER = 1;

/**
 * Pure oldest-first selection for the standby-budget eviction. Given a host's BIN items
 * (status='removed' OR in a soft-deleted event) and the byte budget, returns the ids to
 * HARD-purge — OLDEST `binned_at` first — until the remaining standby bytes fit under budget.
 * Oldest-first is the anti-abuse property: a restore -> re-delete "refresh" can't keep fresh
 * bytes alive at the expense of genuinely-old ones, so the TOTAL is bounded regardless of
 * cycling. Mirror of selectForAutoReduce, but oldest-first instead of largest-first. `binned_at`
 * is an ISO timestamp (sorts lexicographically == chronologically).
 */
export function selectForStandbyEviction(
  binItems: { id: string; file_size_bytes: number; binned_at: string }[],
  budgetBytes: number,
): string[] {
  let total = binItems.reduce((sum, m) => sum + m.file_size_bytes, 0);
  if (total <= budgetBytes) return [];

  const evict: string[] = [];
  for (const m of [...binItems].sort((a, b) =>
    a.binned_at < b.binned_at ? -1 : a.binned_at > b.binned_at ? 1 : 0,
  )) {
    if (total <= budgetBytes) break;
    evict.push(m.id);
    total -= m.file_size_bytes;
  }
  return evict;
}
