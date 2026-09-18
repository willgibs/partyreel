/**
 * A tiny per-key rate damper for the SIGNAL failure log.
 *
 * WHY: a failure in a fail-open path (a rate-limiter read, a transactional send) happens once per
 * REQUEST, so a database outage produces thousands of them a minute. Sentry is built for that and
 * gets every one; `job_runs` is not, and writing a row each time would hammer the exact table
 * /admin/jobs reads its health from — an outage that made the health console the thing making it
 * worse. One row per key per window is enough to answer "did anything fail in the last 24 hours?".
 *
 * PURE and injectable-clock so it can be unit-tested. Process-local by design, which means a floor
 * rather than a census: every serverless instance records its own FIRST failure (the one the signal
 * actually needs) and damps the rest.
 */

export class Throttle<K> {
  private readonly lastAt = new Map<K, number>();

  constructor(private readonly windowMs: number) {}

  /**
   * Claim the slot for `key` at `nowMs`. True the first time in each window (and marks it taken),
   * false while the window is still open. Claiming and checking are ONE call on purpose: two calls
   * would race in concurrent handlers and let a burst through.
   */
  claim(key: K, nowMs: number): boolean {
    const last = this.lastAt.get(key);
    if (last !== undefined && nowMs - last < this.windowMs) return false;
    this.lastAt.set(key, nowMs);
    return true;
  }

  /** Test seam: the throttle is process state, so a test has to be able to clear it. */
  reset(): void {
    this.lastAt.clear();
  }
}
