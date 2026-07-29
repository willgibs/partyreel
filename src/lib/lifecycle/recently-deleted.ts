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
 * How many days before an item's hard-purge the host gets a "Recently deleted is about to be
 * cleared" nudge in the notification bell (the in-app, no-email channel: we never email a host
 * about what they intentionally deleted). Sibling of RENEWAL_NUDGE_DAYS; the threshold is applied
 * in the pure buildNotifications. Stays within the recovery window.
 */
export const RECOVERY_PURGE_NUDGE_DAYS = 7;

/**
 * Pure oldest-first selection for the standby-budget eviction. Given a host's BIN items
 * (status='removed' OR in a soft-deleted event) and the byte budget, returns the ids to
 * HARD-purge — OLDEST `binned_at` first — until the remaining standby bytes fit under budget.
 * Oldest-first is the anti-abuse property: a restore -> re-delete "refresh" can't keep fresh
 * bytes alive at the expense of genuinely-old ones, so the TOTAL is bounded regardless of
 * cycling. Mirror of selectForAutoReduce, but oldest-first instead of largest-first. `binned_at`
 * is an ISO timestamp (sorts lexicographically == chronologically).
 */
/**
 * Freshly-binned rows are NEVER eligible for standby eviction (QA #2 belt-and-braces). The
 * over-cap sweep and the standby sweep run in the SAME cron invocation; without this, a set the
 * over-cap sweep just soft-removed (all sharing an identical `binned_at`) could exceed the budget
 * on its own and the standby sweep would hard-delete it seconds after the "recoverable for 30
 * days" email. The primary guard is removed_by_system (system-binned rows are excluded from the
 * standby query entirely); this age gate additionally protects host-initiated deletes and any
 * future auto-bin path. 24h ≫ one cron run, ≪ the 30-day window.
 */
export const STANDBY_MIN_BIN_AGE_MS = 24 * 60 * 60 * 1000;

export function selectForStandbyEviction(
  binItems: { id: string; file_size_bytes: number; binned_at: string }[],
  budgetBytes: number,
  nowMs: number,
): string[] {
  let total = binItems.reduce((sum, m) => sum + m.file_size_bytes, 0);
  if (total <= budgetBytes) return [];

  // Only rows binned at least STANDBY_MIN_BIN_AGE_MS ago can be evicted; fresh rows keep counting
  // toward `total` (so the budget math is honest) but are never selected. A bin that is over
  // budget purely because of fresh rows evicts nothing this run and self-resolves once they age.
  const evictable = binItems.filter(
    (m) => nowMs - new Date(m.binned_at).getTime() >= STANDBY_MIN_BIN_AGE_MS,
  );

  const evict: string[] = [];
  for (const m of [...evictable].sort((a, b) =>
    a.binned_at < b.binned_at ? -1 : a.binned_at > b.binned_at ? 1 : 0,
  )) {
    if (total <= budgetBytes) break;
    evict.push(m.id);
    total -= m.file_size_bytes;
  }
  return evict;
}

/**
 * Whole days until a bin item's hard-purge, for the "Deletes in N days" countdown chip.
 * Ceil so an item half a day out reads "1 day" (not "0"); clamped to >= 0 so a just-overdue
 * item the cron hasn't reached yet reads "0" -> the UI shows "today". `nowMs` is passed in
 * (pure + testable, no Date.now() inside). A null `purge_at` shouldn't happen (the
 * set_media_purge_at trigger always stamps removed/deleted rows) but falls back to the full
 * window rather than rendering a wrong "0".
 */
export function binCountdownDays(purgeAt: string | null, nowMs: number): number {
  if (!purgeAt) return RECENTLY_DELETED_WINDOW_DAYS;
  const ms = new Date(purgeAt).getTime() - nowMs;
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

/**
 * Is the host's standby (recently-deleted) footprint OVER its budget — i.e. the cron's
 * sweepStandbyBudget will evict the OLDEST items EARLY, before their 30-day window? Budget =
 * RECENTLY_DELETED_BUDGET_MULTIPLIER x the account's effective cap; an unlimited cap (null) is
 * never over. Single-sources the multiplier with the cron so the dashboard warning matches the
 * actual eviction behaviour.
 */
export function overStandbyBudget(
  standbyBytes: number,
  effectiveCapBytes: number | null,
): boolean {
  if (effectiveCapBytes == null) return false;
  return standbyBytes > effectiveCapBytes * RECENTLY_DELETED_BUDGET_MULTIPLIER;
}

/** UI label for the countdown chip from a whole-day count (see binCountdownDays). Single-sourced
 * so the dashboard event cards + the event-detail media tiles read identically. */
export function binCountdownLabel(days: number): string {
  if (days <= 0) return "Deletes today";
  if (days === 1) return "Deletes in 1 day";
  return `Deletes in ${days} days`;
}
