/**
 * LEAVING DELETED FOR GOOD, FROM THE SERVER (trash-in-storage, migration 20261003220000): the over-capacity
 * deadline's first step. What she already deleted leaves for good, oldest first, until `bytes` have left, through
 * `leave_deleted` with `p_system` false, so the reduce's own earlier removals keep the window its mail promised. The
 * SQL takes her profiles row first and marks each item asked, so its bytes stop counting at once and the
 * removed_media sweep deletes it, R2 first, on a later night. Answers what left; a failed call throws (the run reads
 * it).
 *
 * The same function makes room for an upload inside `create_media*` and empties Deleted for `empty_deleted`; only
 * this caller reaches it over PostgREST, on the admin client, for a host the sweep has proved over its cap.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { QueryFailedError } from "@/lib/db/must-query";
import type { AdminClient } from "@/lib/lifecycle/reclaim";

/**
 * ★ THE TYPED SEAM, UNTIL THE TYPES REGENERATE: `leave_deleted` arrives with migration 20261003220000 (drop the cast
 * then). Its answer is one row of OUT parameters, an object or a one-row list depending on how PostgREST shapes it.
 */
export async function leaveDeleted(
  admin: AdminClient,
  hostId: string,
  bytes: number,
): Promise<{ items: number; freedBytes: number }> {
  const { data, error } = await (admin as unknown as SupabaseClient).rpc(
    "leave_deleted",
    { p_host_id: hostId, p_bytes: bytes, p_system: false },
  );
  if (error) throw new QueryFailedError("cron/purge: leave_deleted", error);
  const row = (Array.isArray(data) ? data[0] : data) as {
    items?: unknown;
    freed_bytes?: unknown;
  } | null;
  return {
    items: Number(row?.items ?? 0),
    freedBytes: Number(row?.freed_bytes ?? 0),
  };
}
