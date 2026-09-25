/**
 * SWEEP 1: EVENTS WHOSE RECOVERABLE TAIL HAS ELAPSED. Hard-deletes their media (R2, rows, the
 * `storage_used_bytes` meter), then the event rows (which cascade to guests and reports).
 * `coalesce(purge_at, deleted_at + the window)`, so a legacy soft-delete with no
 * `purge_at` is still reclaimed instead of leaking storage forever.
 *
 * HOW IT STAYS WHOLE (the 1,000-row round, 2026-09-23):
 *  - The expired events are read in keyset batches of `IN_CHUNK` ids, under the sweep's deadline. A
 *    sweep the deadline stops reports `stopped_early` with the expired events it did not finish,
 *    counted; its next run starts again at the lowest id still standing, since a finished event is
 *    deleted (it DRAINS, so it keeps no cursor).
 *  - LEGAL HOLD is one `held_event_ids` answer per batch (`readHeldEventIds`): an event holding ANY
 *    held media is skipped WHOLE, because the event-row delete would cascade the held rows away and
 *    the object enumeration would delete their objects. It stays in the bin until the hold releases.
 *  - Each batch's media is read in keyset pages of `MAX_ROWS` by id, and each page is reclaimed
 *    before the next is read. ★ EVERY media row must be gone BEFORE the event row goes: the cascade
 *    would otherwise delete the rest with no R2 delete (permanent orphans, replicated into the WORM
 *    backup) and no meter decrement (a host's cap shrunk forever). That is why a batch the deadline
 *    interrupts keeps its event rows for the next run, and why the media read is a keyset loop, never
 *    one read (cut at 1,000) nor an offset loop (which skips rows while it deletes them).
 *  - Right before the event rows go, the holds are asked again, and the media read itself leaves held
 *    rows out: a hold placed while the sweep runs keeps its row, and its event.
 */
import "server-only";

import { mustCount, QueryFailedError } from "@/lib/db/must-query";
import {
  IN_CHUNK,
  inChunks,
  MAX_ROWS,
  readAllPages,
  type AllPages,
} from "@/lib/db/read-all";
import { partitionEventsByHold } from "@/lib/forensics/legal-hold";
import {
  addReclaimed,
  emptyReclaimed,
  readHeldEventIds,
  reclaimMedia,
  type AdminClient,
  type MediaKeyRow,
  type Reclaimed,
} from "@/lib/lifecycle/reclaim";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";
import {
  NO_DEADLINE,
  stoppedEarly,
  type Deadline,
  type StoppedEarly,
} from "@/lib/lifecycle/sweep-budget";

export type ExpiredEventsTally = Reclaimed & {
  events: number;
  hold_blocked_events: number;
} & Partial<StoppedEarly>;

/** The expiry predicate as a PostgREST `or()`: `coalesce(purge_at, deleted_at + window) <= now`. */
export function expiryFilter(now: Date): string {
  const legacyCutoff = new Date(
    now.getTime() - RECENTLY_DELETED_WINDOW_DAYS * 86_400_000,
  ).toISOString();
  return `purge_at.lte.${now.toISOString()},and(purge_at.is.null,deleted_at.lte.${legacyCutoff})`;
}

/** One keyset page of expired event ids, ascending: the sweep's discovery read. */
export function expiredEventsPage(
  admin: AdminClient,
  now: Date,
  after: string | null,
  limit: number,
) {
  let query = admin
    .from("events")
    .select("id")
    .not("deleted_at", "is", null)
    .or(expiryFilter(now))
    .order("id", { ascending: true })
    .limit(limit);
  if (after) query = query.gt("id", after);
  return query;
}

/** How many expired events stand past `after` (all of them from null): what a stopped sweep left. */
export async function countExpiredEvents(
  admin: AdminClient,
  now: Date,
  after: string | null,
): Promise<number> {
  let query = admin
    .from("events")
    .select("id", { count: "exact", head: true })
    .not("deleted_at", "is", null)
    .or(expiryFilter(now));
  if (after) query = query.gt("id", after);
  return mustCount(query, "cron/purge: expired events left");
}

export async function sweepExpiredEvents(
  admin: AdminClient,
  now: Date,
  handled: Set<string>,
  opts: { deadline?: Deadline } = {},
): Promise<ExpiredEventsTally> {
  const deadline = opts.deadline ?? NO_DEADLINE;
  const tally: ExpiredEventsTally = {
    events: 0,
    hold_blocked_events: 0,
    ...emptyReclaimed(),
  };

  let after: string | null = null;
  for (;;) {
    if (deadline.passed()) {
      return {
        ...tally,
        ...stoppedEarly(await countExpiredEvents(admin, now, after)),
      };
    }
    // Annotated: the loop feeds `batch.after` back in, which TypeScript cannot infer through.
    const batch: AllPages<{ id: string }, string> = await readAllPages(
      "cron/purge: expired events",
      (cursor: string | null, limit) =>
        expiredEventsPage(admin, now, cursor, limit),
      (event) => event.id,
      { budget: IN_CHUNK, after },
    );
    if (batch.rows.length === 0) break;

    const ids = batch.rows.map((event) => event.id);
    const { purgeable, blocked } = partitionEventsByHold(
      ids,
      await readHeldEventIds(admin, ids),
    );
    tally.hold_blocked_events += blocked.length;

    const finished = await purgeEventBatch(
      admin,
      purgeable,
      handled,
      deadline,
      tally,
    );
    if (!finished) {
      // The events in this batch that did finish are deleted, so counting from the batch's own
      // starting cursor counts exactly what is left: the unfinished ones and everything after.
      return {
        ...tally,
        ...stoppedEarly(await countExpiredEvents(admin, now, after)),
      };
    }
    if (!batch.more) break;
    after = batch.after;
  }
  return tally;
}

/**
 * Purge one batch of hold-free expired events (at most `IN_CHUNK`, so the whole batch is one chunk):
 * every media page reclaimed, then the event rows. False when the deadline stopped it before the
 * event rows could go.
 */
async function purgeEventBatch(
  admin: AdminClient,
  eventIds: readonly string[],
  handled: Set<string>,
  deadline: Deadline,
  tally: ExpiredEventsTally,
): Promise<boolean> {
  if (eventIds.length === 0) return true;
  const outcomes = await inChunks(
    "cron/purge: expired media",
    eventIds,
    async (chunk) => {
      let after: string | null = null;
      for (;;) {
        if (deadline.passed()) return [false];
        const page: AllPages<MediaKeyRow, string> = await readAllPages(
          "cron/purge: expired media",
          (cursor: string | null, limit) => {
            let query = admin
              .from("media")
              .select("id, original_key, preview_key")
              .in("event_id", chunk)
              .filter("legal_hold_at", "is", null)
              .order("id", { ascending: true })
              .limit(limit);
            if (cursor) query = query.gt("id", cursor);
            return query;
          },
          (media) => media.id,
          { budget: MAX_ROWS, after },
        );
        if (page.rows.length > 0) {
          addReclaimed(tally, await reclaimMedia(admin, page.rows));
          for (const media of page.rows) handled.add(media.id);
        }
        if (!page.more) break;
        after = page.after;
      }

      // Every unheld media row of these events is gone. Ask the holds again: an event held since
      // the partition keeps its row (and its held media) for a later run.
      const stillHeld = new Set(await readHeldEventIds(admin, chunk));
      const doomed = chunk.filter((id) => !stillHeld.has(id));
      tally.hold_blocked_events += chunk.length - doomed.length;
      if (doomed.length === 0) return [true];

      const { error } = await admin
        .from("events")
        .delete()
        .in(
          "id",
          chunk.filter((id) => !stillHeld.has(id)),
        );
      if (error) throw new QueryFailedError("cron/purge: delete events", error);
      tally.events += doomed.length;
      return [true];
    },
    { concurrency: 1 },
  );
  return outcomes.every(Boolean);
}
