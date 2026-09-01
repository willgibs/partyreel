// Over-capacity grace (the lapsed-paid-account lifecycle). A downgraded account that is
// over its new cap gets this long to upgrade or remove media before the purge cron
// auto-reduces largest-first; a reminder email goes out this many days before the
// deadline. The numbers lived as module-private consts in the purge route handler;
// they moved here (beside inactivity.ts / recently-deleted.ts) so the marketing MDX
// spec components can read them without importing a route handler. The cron is still
// the only writer of the behavior; this file is just the single source of the numbers.
export const OVER_CAP_GRACE_DAYS = 45;
export const OVER_CAP_REMINDER_DAYS = 7;
