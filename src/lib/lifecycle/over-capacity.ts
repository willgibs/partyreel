/**
 * Over-capacity grace (the retention flow): a lapsed paid account that is over
 * its new cap keeps full access for this many days before the cron auto-reduces
 * it (largest files first, into the 30-day Deleted bin). Lives here, not in the
 * cron route, so the help center's spec inline can render the real number
 * without importing a route handler. The cron reads it from here.
 */
export const OVER_CAP_GRACE_DAYS = 45;
