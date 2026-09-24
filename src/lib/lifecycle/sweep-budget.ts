/**
 * THE PURGE CRON'S TIME BUDGET, and what a sweep says when the budget stops it (the 1,000-row
 * round, 2026-09-23; `read-all.ts` rule 5: "a sweep has a budget and reports what it left").
 *
 * WHY: the cron is ONE Vercel invocation (`maxDuration = 60` in `src/app/api/cron/purge/route.ts`)
 * running a dozen sweeps in a row. A sweep that reads its whole backlog and deletes it in one go
 * either stops at PostgREST's 1,000 rows (silently, the bug this round ends) or, once it pages,
 * runs until Vercel kills the function, and a killed invocation never closes its heartbeat: the
 * job reads as running, then as missed, and every sweep behind the slow one never ran. So every
 * sweep works in keyset batches and checks a DEADLINE before each batch, and a sweep the deadline
 * stops says so (`stoppedEarly`), so the jobs console can show it.
 *
 * THE SHARE: the window is divided as the sweeps START, each budgeted sweep taking an equal share
 * of what is LEFT among the sweeps still to run. A quick sweep hands its unused time down the line,
 * and a backlog in one sweep can never starve the ones behind it.
 *
 * PURE: no I/O, and the clock is injectable, so the arithmetic is unit-tested next door.
 */
import type { STOPPED_EARLY_KEY } from "@/app/admin/jobs/catalog";

/**
 * How much of the invocation the sweeps may share. `maxDuration` is 60 s: the remaining 18 s cover
 * the freshness scan, the heartbeat writes, the response, and the one batch a sweep may run past
 * its deadline (a deadline is checked BEFORE a batch starts, never mid-batch, so a batch of R2 and
 * row deletes is never abandoned halfway). `sweep-budget.test.ts` reads the route's `maxDuration`
 * and holds the two together.
 */
export const SWEEP_WINDOW_MS = 42_000;

/** When a sweep must stop starting new batches. */
export type Deadline = {
  /** Epoch ms at which it passes (`Infinity` for none). */
  readonly at: number;
  /** True once no new batch should start. */
  passed(): boolean;
};

/** A deadline at a fixed instant. */
export function deadlineAt(
  atMs: number,
  now: () => number = Date.now,
): Deadline {
  return { at: atMs, passed: () => now() >= atMs };
}

/** No deadline: a script, a test, or a caller that bounds the work some other way. */
export const NO_DEADLINE: Deadline = {
  at: Number.POSITIVE_INFINITY,
  passed: () => false,
};

export type SweepClock = {
  /** The instant the whole window closes. */
  readonly endMs: number;
  /** The next sweep's deadline: an equal share of what is left among the sweeps still to run. */
  next(): Deadline;
};

/**
 * Share a window out between `sweeps` sweeps, in the order they call `next()`. A call past the
 * last share gets a deadline that has already passed: the route asks once per budgeted sweep, and
 * a sweep with no time left does no work and reports that it stopped.
 */
export function createSweepClock(opts: {
  startMs: number;
  windowMs: number;
  sweeps: number;
  now?: () => number;
}): SweepClock {
  const now = opts.now ?? Date.now;
  const endMs = opts.startMs + opts.windowMs;
  let left = Math.max(0, Math.floor(opts.sweeps));
  return {
    endMs,
    next() {
      const t = now();
      const share = left > 0 ? Math.max(0, endMs - t) / left : 0;
      left = Math.max(0, left - 1);
      return deadlineAt(Math.min(endMs, t + share), now);
    },
  };
}

/**
 * What a sweep adds to its tally when its deadline stopped it with work left: the flag the console
 * reads (`STOPPED_EARLY_KEY` in the catalog, `attention` on the card) and, where it can be counted,
 * how many candidates it did not reach. `remaining` is a top-level number so `/admin/jobs` prints it;
 * a sweep that cannot count what it left (the orphan sweep's R2 listing) omits it and its note says so.
 */
export type StoppedEarly = { stopped_early: true; remaining?: number };

export function stoppedEarly(remaining: number | null): StoppedEarly {
  const out = { stopped_early: true as const } satisfies Record<
    typeof STOPPED_EARLY_KEY,
    true
  >;
  return remaining === null ? out : { ...out, remaining };
}

/**
 * The candidates in the order a RESUMING sweep takes them: first those after the cursor its last
 * run stopped at, then (wrapping round) those before it. Sorted by `keyOf` first, so the order is
 * the id order the reads page in. A sweep that never gets through its whole list in one run still
 * reaches every candidate across runs, instead of re-reading the same head of the list every night.
 */
export function rotateAfter<T>(
  rows: readonly T[],
  cursor: string | null,
  keyOf: (row: T) => string,
): T[] {
  const sorted = [...rows].sort((a, b) => {
    const ka = keyOf(a);
    const kb = keyOf(b);
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
  if (cursor === null) return sorted;
  const start = sorted.findIndex((row) => keyOf(row) > cursor);
  if (start <= 0) return sorted;
  return [...sorted.slice(start), ...sorted.slice(0, start)];
}
