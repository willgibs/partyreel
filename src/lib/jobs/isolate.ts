/**
 * PER-ROW ISOLATION for the purge cron's sweep loops (ROADMAP QA #27).
 *
 * THE BUG THIS CLOSES: every sweep is wrapped in its own try/catch, so one failure could never take
 * down the whole run — but INSIDE a sweep the loop was bare. One account with a bounced address, one
 * event whose media read hiccupped, and every account behind it in that loop was skipped for the
 * night. Silently, because the sweep's catch turned the throw into `{ error }` on the parent run and
 * nothing said "and 93 accounts never got looked at".
 *
 * PURE except for the two callbacks: no DB, no env, no Sentry, so it is unit-tested next door and
 * the call site keeps ownership of what "reporting" means. Sequential on purpose — the sweeps it
 * wraps do R2 deletes and service-role writes, and turning them concurrent would change their cost
 * shape and their ordering guarantees, neither of which is this helper's business.
 *
 * ★ A BAD ROW AND A DEAD DATABASE LOOK IDENTICAL FROM INSIDE THE LOOP. That is the whole risk of
 * per-row isolation: swallow every error and a total outage becomes a green run that quietly did
 * nothing. So two things never happen here. `abortAfterConsecutive` consecutive failures stop the
 * loop (that is not a bad row, that is a broken dependency), and the tally ALWAYS carries the
 * failure count so the caller can close its heartbeat as an error. Isolation buys the rows behind
 * the bad one a chance to run; it never buys silence.
 */

export type IsolatedTally = {
  /** Rows whose body completed. */
  processed: number;
  /** Rows whose body threw. */
  failed: number;
  /** Rows never attempted because the loop aborted (see `abortAfterConsecutive`). */
  skipped: number;
  /** True when consecutive failures stopped the loop: a systemic fault, not a bad row. */
  aborted: boolean;
  /** The first failure's message, for the run's one-line note. Never the whole list. */
  firstError: string | null;
  /**
   * Rows `stopWhen` left for the next run (a time budget ran out). NOT a failure, so it never makes
   * a tally unclean: the sweep reports it as `stopped_early` with a `remaining` count instead.
   */
  unreached: number;
};

export type IsolateOptions<T> = {
  /**
   * Called once per failed row, before the loop moves on. This is where the caller raises its Sentry
   * event; keep it cheap and NEVER let it throw (a reporter that throws would defeat the isolation).
   */
  onError: (row: T, error: unknown) => void;
  /**
   * How many failures IN A ROW mean the dependency is down rather than the row being bad. Five is
   * wide enough to step over a handful of genuinely bad rows and tight enough that an outage stops
   * costing queries almost immediately.
   */
  abortAfterConsecutive?: number;
  /**
   * Asked before each row: `true` stops the loop THERE and counts the rest as `unreached`. The purge
   * sweeps pass their deadline (`src/lib/lifecycle/sweep-budget.ts`), so one slow account can never
   * run the invocation past its 60 seconds and cost every sweep behind it.
   */
  stopWhen?: () => boolean;
};

const DEFAULT_ABORT_AFTER = 5;

export function emptyTally(): IsolatedTally {
  return {
    processed: 0,
    failed: 0,
    skipped: 0,
    aborted: false,
    firstError: null,
    unreached: 0,
  };
}

/** A tally is a clean run only when nothing failed and nothing was left unattempted. */
export function tallyIsClean(tally: IsolatedTally): boolean {
  return tally.failed === 0 && tally.skipped === 0 && !tally.aborted;
}

/** The operator-facing one-liner for a tally that is not clean. Null when it is. */
export function tallyNote(label: string, tally: IsolatedTally): string | null {
  if (tallyIsClean(tally)) return null;
  const parts = [`${tally.failed} ${label} failed`];
  if (tally.skipped > 0) parts.push(`${tally.skipped} not attempted`);
  if (tally.aborted) parts.push("stopped after consecutive failures");
  if (tally.firstError) parts.push(`first: ${tally.firstError}`);
  return parts.join(", ").slice(0, 500);
}

/**
 * Run `body` for every row, isolating each one. Never throws: the tally is the result, and a caller
 * that wants a loud failure reads `failed`/`aborted` off it.
 */
export async function forEachIsolated<T>(
  rows: readonly T[],
  body: (row: T, index: number) => Promise<void>,
  options: IsolateOptions<T>,
): Promise<IsolatedTally> {
  const abortAfter = options.abortAfterConsecutive ?? DEFAULT_ABORT_AFTER;
  const tally = emptyTally();
  let consecutive = 0;

  for (let i = 0; i < rows.length; i++) {
    if (options.stopWhen?.()) {
      tally.unreached = rows.length - i;
      break;
    }
    const row = rows[i] as T;
    try {
      await body(row, i);
      tally.processed++;
      consecutive = 0;
    } catch (e) {
      tally.failed++;
      consecutive++;
      if (tally.firstError === null) {
        tally.firstError = e instanceof Error ? e.message : String(e);
      }
      try {
        options.onError(row, e);
      } catch {
        // A reporter that throws must not cost us the isolation it was added to observe.
      }
      if (abortAfter > 0 && consecutive >= abortAfter) {
        tally.aborted = true;
        tally.skipped = rows.length - i - 1;
        break;
      }
    }
  }

  return tally;
}
