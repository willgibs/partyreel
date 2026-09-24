/**
 * SWEEP 2: REMOVED MEDIA PAST ITS RECOVERY WINDOW. A removal frees the event's slot at once (counts
 * skip `removed`); the bytes are reclaimed here once `purge_at` (trigger-derived: `removed_at` + the
 * window) passes, which is what gives "Deleted" its undo. A guest's own withdrawal
 * (`removed_by_uploader`) is final for the host but purges exactly like this, on its own `purge_at`.
 *
 * ★ OLDEST FIRST, IN BUDGETED KEYSET BATCHES (the 1,000-row round, 2026-09-23). This read used to be
 * one unordered request, which PostgREST cut at 1,000 rows: at most a thousand items a night, an
 * arbitrary thousand, and a backlog that grew without a word. It now pages on `(purge_at, id)`
 * ascending (the `media_purge_at_idx` partial index serves it) and reclaims each page before reading
 * the next, until the deadline. A purged row is gone, so the sweep DRAINS: its next run starts at the
 * oldest row still due, and a stopped run reports how many due rows it left, counted.
 *
 * LEGAL HOLD: held rows are excluded HERE, in the read, before the R2-first delete. The SQL guard in
 * `purge_media_rows` protects only the row; this filter is what protects the OBJECT.
 */
import "server-only";

import { mustCount } from "@/lib/db/must-query";
import { MAX_ROWS, readAllPages, type AllPages } from "@/lib/db/read-all";
import {
  addReclaimed,
  emptyReclaimed,
  reclaimMedia,
  type AdminClient,
  type MediaKeyRow,
  type Reclaimed,
} from "@/lib/lifecycle/reclaim";
import {
  NO_DEADLINE,
  stoppedEarly,
  type Deadline,
  type StoppedEarly,
} from "@/lib/lifecycle/sweep-budget";

export type RemovedMediaTally = Reclaimed & Partial<StoppedEarly>;

/** A composite cursor: the raw `purge_at` string (never a `Date`: microseconds decide ties) and the id. */
export type PurgeCursor = { at: string; id: string };

/** One page of removed media past its window, oldest `purge_at` first, never a held row. */
export function dueRemovedMediaPage(
  admin: AdminClient,
  now: Date,
  after: PurgeCursor | null,
  limit: number,
) {
  let query = admin
    .from("media")
    .select("id, original_key, preview_key, purge_at")
    .eq("status", "removed")
    .not("purge_at", "is", null)
    .lte("purge_at", now.toISOString())
    .filter("legal_hold_at", "is", null)
    .order("purge_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(limit);
  if (after) {
    query = query.or(
      `purge_at.gt.${after.at},and(purge_at.eq.${after.at},id.gt.${after.id})`,
    );
  }
  return query;
}

/** Every removed row still due (a head count): what a stopped sweep left. */
export async function countDueRemovedMedia(
  admin: AdminClient,
  now: Date,
): Promise<number> {
  return mustCount(
    admin
      .from("media")
      .select("id", { count: "exact", head: true })
      .eq("status", "removed")
      .not("purge_at", "is", null)
      .lte("purge_at", now.toISOString())
      .filter("legal_hold_at", "is", null),
    "cron/purge: removed media left",
  );
}

export async function sweepRemovedMedia(
  admin: AdminClient,
  now: Date,
  handled: Set<string>,
  opts: { deadline?: Deadline } = {},
): Promise<RemovedMediaTally> {
  const deadline = opts.deadline ?? NO_DEADLINE;
  const tally: RemovedMediaTally = emptyReclaimed();

  let after: PurgeCursor | null = null;
  for (;;) {
    if (deadline.passed()) {
      return {
        ...tally,
        ...stoppedEarly(await countDueRemovedMedia(admin, now)),
      };
    }
    // Annotated: the loop feeds `page.after` back in, which TypeScript cannot infer through.
    const page: AllPages<
      MediaKeyRow & { purge_at: string | null },
      PurgeCursor
    > = await readAllPages(
      "cron/purge: removed media",
      (cursor: PurgeCursor | null, limit) =>
        dueRemovedMediaPage(admin, now, cursor, limit),
      // `purge_at` is never null here: the page filters `purge_at is not null`.
      (row) => ({ at: row.purge_at as string, id: row.id }),
      { budget: MAX_ROWS, after },
    );
    // An earlier sweep in this run may already have reclaimed a row (its id is in `handled`).
    const rows = page.rows.filter((row) => !handled.has(row.id));
    if (rows.length > 0) {
      addReclaimed(tally, await reclaimMedia(admin, rows));
      for (const row of rows) handled.add(row.id);
    }
    if (!page.more) break;
    after = page.after;
  }
  return tally;
}
