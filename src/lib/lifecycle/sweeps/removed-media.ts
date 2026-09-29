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
 * `purge_media_rows` protects only the row; this filter is what protects the OBJECT. An open report's
 * item is left by `reclaimMedia` itself, which asks `kept_media_ids` before deleting anything.
 *
 * ★ THEN WHAT A KEEPER DEFERRED (admin-triage r2, 20260929140000). An ASKED row (`purge_asked_at`: the host's
 * Delete permanently, or a removal past its window, that something kept) is due the night its keeper lets go,
 * whatever its own `purge_at` says, so a second pass reads them by id. And last, `defer_kept_due_media` marks
 * asked every removal past its window that something still keeps, so its bytes leave the host's meter the night
 * any other removal's would: a quietly held item she deleted reads, in every number she has, like any delete.
 */
import "server-only";

import { mustCount, mustQuery } from "@/lib/db/must-query";
import { MAX_ROWS, readAllPages, type AllPages } from "@/lib/db/read-all";
import { seamRpc } from "@/lib/db/triage-seam";
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

export type RemovedMediaTally = Reclaimed &
  Partial<StoppedEarly> & {
    /** Removals past their window that something keeps, marked asked this run (their meter bytes released). */
    deferred?: number;
  };

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

/**
 * One page of ASKED rows (a permanent delete a keeper deferred), by id, never a held row: due now whatever their
 * window, and still left by `reclaimMedia` while an open report keeps one.
 */
export function askedMediaPage(
  admin: AdminClient,
  after: string | null,
  limit: number,
) {
  let query = admin
    .from("media")
    .select("id, original_key, preview_key")
    .eq("status", "removed")
    .filter("purge_asked_at", "not.is", null)
    .filter("legal_hold_at", "is", null)
    .order("id", { ascending: true })
    .limit(limit);
  if (after) query = query.gt("id", after);
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

/** Mark asked every removal past its window that something keeps; how many it marked. */
async function deferKeptDueMedia(admin: AdminClient): Promise<number> {
  const marked = await mustQuery(
    seamRpc<number>(admin, "defer_kept_due_media", {}),
    "cron/purge: defer_kept_due_media",
  );
  return Number(marked ?? 0);
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

  // The asked rows, by id: a row this run already took (it was also past its window) is in `handled`.
  let askedAfter: string | null = null;
  for (;;) {
    if (deadline.passed()) return { ...tally, ...stoppedEarly(null) };
    // Annotated: the loop feeds `page.after` back in, which TypeScript cannot infer through.
    const page: AllPages<MediaKeyRow, string> = await readAllPages(
      "cron/purge: asked media",
      (cursor: string | null, limit) => askedMediaPage(admin, cursor, limit),
      (row) => row.id,
      { budget: MAX_ROWS, after: askedAfter },
    );
    const rows = page.rows.filter((row) => !handled.has(row.id));
    if (rows.length > 0) {
      addReclaimed(tally, await reclaimMedia(admin, rows));
      for (const row of rows) handled.add(row.id);
    }
    if (!page.more) break;
    askedAfter = page.after;
  }

  if (deadline.passed()) return { ...tally, ...stoppedEarly(null) };
  const deferred = await deferKeptDueMedia(admin);
  return deferred > 0 ? { ...tally, deferred } : tally;
}
