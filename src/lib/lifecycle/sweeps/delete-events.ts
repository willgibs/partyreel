/**
 * THE EVENT ROWS' DELETE, ONE EVENT A STATEMENT IN EVENT-ID ORDER (crumbs-75; ROADMAP's Lifecycle line, "the
 * multi-event deletes ... cascade into `album_state` and `album_changes` in row order").
 *
 * An event's delete cascades into its album's version row (`album_state`) and change log (`album_changes`), and the
 * album log's prune (`album_prune_tombstones`) takes those rows album by album in event-id order (database-security.md:
 * an album's version row is every transaction's last lock). One DELETE of a whole batch of ids cascaded in whatever
 * order its plan visited the rows (a bitmap scan visits them as they lie on disk), so a purge run's delete and an
 * overlapping run's prune could each hold one album while waiting on the other's: a deadlock Postgres breaks by
 * failing one, which then waits for the next night. So each event goes in a statement of its own, in ascending id
 * order: no transaction here ever holds two albums, so none can close a cycle with the prune, and the deletes still
 * walk the albums in the prune's own order.
 *
 * Both multi-event deletes call it (`expired-events.ts`, `account-deletion.ts`), each only once every media row of
 * those events is gone (R2 first, then the rows), and it asks the deadline before every event: one it stops before
 * keeps its row (and nothing else, its media already gone) for the next run, which finds it again.
 */
import "server-only";

import { QueryFailedError } from "@/lib/db/must-query";
import type { AdminClient } from "@/lib/lifecycle/reclaim";
import type { Deadline } from "@/lib/lifecycle/sweep-budget";

export type EventDeletes = {
  /** Event rows deleted. */
  deleted: number;
  /** False when the deadline stopped it with events still standing. */
  done: boolean;
};

export async function deleteEventsInIdOrder(
  admin: AdminClient,
  eventIds: readonly string[],
  deadline: Deadline,
  label: string,
): Promise<EventDeletes> {
  // A uuid's text sorts as Postgres orders the uuid (byte by byte, lowercase hex).
  const ordered = [...new Set(eventIds)].sort();
  let deleted = 0;
  for (const id of ordered) {
    if (deadline.passed()) return { deleted, done: false };
    const { error } = await admin.from("events").delete().eq("id", id);
    if (error) throw new QueryFailedError(label, error);
    deleted += 1;
  }
  return { deleted, done: true };
}
