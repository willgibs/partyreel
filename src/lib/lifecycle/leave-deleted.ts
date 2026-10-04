/**
 * LEAVING DELETED FOR GOOD, FROM THE SERVER (trash-in-storage, migration 20261003220000): the over-capacity
 * deadline's first step. What she already deleted leaves for good, oldest first, until `bytes` have left or `limit`
 * items have, through `leave_deleted` with `p_system` false, so the reduce's own earlier removals keep the window its
 * mail promised. The SQL takes her profiles row first and marks each item asked, so its bytes stop counting at once
 * and the removed_media sweep deletes it, R2 first, on a later night. Answers what left and whether more remains (the
 * limit stopped it); a failed call throws (the run reads it).
 *
 * ★ A BATCH A CALL (the Advisor's Q23): PostgREST runs every call under the `authenticator` role's 8 s
 * statement_timeout, the service role's included, and at 0.5 to 1 ms a row an unbounded call rolls back somewhere past
 * 8,000 items, so the sweep asks for `LEAVE_DELETED_BATCH` at a time and calls again while `more`, under its deadline.
 *
 * The same function makes room for an upload inside `create_media*` (bounded by the file's bytes) and empties Deleted
 * for `empty_deleted`; only this caller reaches it over PostgREST, on the admin client, for a host the sweep has proved
 * over its cap.
 */
import "server-only";

import { QueryFailedError } from "@/lib/db/must-query";
import type { AdminClient } from "@/lib/lifecycle/reclaim";

/** Items a call: well inside the 8 s statement_timeout at the slowest measured rate (about 1 ms a row). */
export const LEAVE_DELETED_BATCH = 2_000;

export type LeftDeleted = {
  items: number;
  freedBytes: number;
  /** The limit stopped it with Deleted still holding what it could take: call again. */
  more: boolean;
};

/**
 * `leave_deleted` (20261003220000) answers one row of OUT parameters, an object or a one-row list depending on how
 * PostgREST shapes it, so the row is read either way.
 */
export async function leaveDeleted(
  admin: AdminClient,
  hostId: string,
  bytes: number,
  limit: number = LEAVE_DELETED_BATCH,
): Promise<LeftDeleted> {
  const { data, error } = await admin.rpc("leave_deleted", {
    p_host_id: hostId,
    p_bytes: bytes,
    p_system: false,
    p_limit: limit,
  });
  if (error) throw new QueryFailedError("cron/purge: leave_deleted", error);
  const row = (Array.isArray(data) ? data[0] : data) as {
    items?: unknown;
    freed_bytes?: unknown;
    more?: unknown;
  } | null;
  return {
    items: Number(row?.items ?? 0),
    freedBytes: Number(row?.freed_bytes ?? 0),
    more: row?.more === true,
  };
}
