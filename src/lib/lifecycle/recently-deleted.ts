/**
 * Recently Deleted: the recovery window's constants, and the countdown chip's words.
 *
 * Soft-deleted media and events stay recoverable for RECENTLY_DELETED_WINDOW_DAYS, then the purge cron hard-deletes
 * them. ★ DELETED COUNTS IN STORAGE (trash-in-storage, Will 2026-10-03): her plan's cap holds her albums and her
 * Deleted together (`host_storage_summary`), so what Deleted holds is bounded by the cap itself and needs no budget of
 * its own; an item leaves early only for good (her Delete permanently or Empty Deleted, or the oldest first when an
 * upload needs room and her setting lets it: `leave_deleted`). The window is hand-mirrored as a SQL `interval
 * '30 days'` in the purge_at triggers, `host_deleted_media` and the restores: keep them in lockstep (same convention
 * as the per-file limits in lib/media/limits.ts).
 */

/** Recoverable window for soft-deleted media/events before the cron hard-purges them. */
export const RECENTLY_DELETED_WINDOW_DAYS = 30;

/**
 * How many days before an item's hard-purge the host gets a "Recently deleted is about to be
 * cleared" nudge in the notification bell (the in-app, no-email channel: we never email a host
 * about what they intentionally deleted). Sibling of RENEWAL_NUDGE_DAYS; the threshold is applied
 * in the pure buildNotifications. Stays within the recovery window.
 */
export const RECOVERY_PURGE_NUDGE_DAYS = 7;

/**
 * Whole days until a bin item's hard-purge, for the "Deletes in N days" countdown chip.
 * Ceil so an item half a day out reads "1 day" (not "0"); clamped to >= 0 so a just-overdue
 * item the cron hasn't reached yet reads "0" -> the UI shows "today". `nowMs` is passed in
 * (pure + testable, no Date.now() inside). A null `purge_at` shouldn't happen (the
 * set_media_purge_at trigger always stamps removed/deleted rows) but falls back to the full
 * window rather than rendering a wrong "0".
 */
export function binCountdownDays(
  purgeAt: string | null,
  nowMs: number,
): number {
  if (!purgeAt) return RECENTLY_DELETED_WINDOW_DAYS;
  const ms = new Date(purgeAt).getTime() - nowMs;
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

/** UI label for the countdown chip from a whole-day count (see binCountdownDays). Single-sourced
 * so the dashboard event cards + the event-detail media tiles read identically. */
export function binCountdownLabel(days: number): string {
  if (days <= 0) return "Deletes today";
  if (days === 1) return "Deletes in 1 day";
  return `Deletes in ${days} days`;
}
