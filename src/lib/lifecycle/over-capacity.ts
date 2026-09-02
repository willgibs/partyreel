/**
 * The over-capacity grace policy, as constants (pure; no imports).
 *
 * Lifted out of the purge cron at the /features/album round (2026-09-02) so
 * the marketing page and the pricing FAQ DERIVE the window instead of typing
 * "45": a lifecycle number that lives only inside an API route is a number
 * every copy surface has to hand-copy, and hand copies drift. The cron is the
 * enforcement; this is the single source both sides read.
 */

/** Days a lapsed paid account gets to trim under its new cap before the
 *  largest files are moved to the recovery bin. */
export const OVER_CAP_GRACE_DAYS = 45;

/** The reminder fires this many days before the grace deadline. */
export const OVER_CAP_REMINDER_DAYS = 7;
