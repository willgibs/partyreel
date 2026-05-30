/**
 * Event Pass renewal-nudge window — the single source for "expiring soon."
 *
 * The purge cron's `renewal_nudges` sweep emails when an active pass expires within this many
 * days; the in-app notification center (Phase 6 cut #4) surfaces the SAME window. Keep them in
 * lockstep here so the email and the badge never disagree.
 */
export const RENEWAL_NUDGE_DAYS = 14;
