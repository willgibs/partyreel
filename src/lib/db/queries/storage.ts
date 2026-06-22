/**
 * Host storage summary for the dashboard meter (recovery Phase 4). RLS-scoped server client +
 * getUser() re-check (RLS is the boundary; the proxy is not). Computes the two numbers the meter
 * needs WITHOUT the host_active_bytes RPC (that one is authenticated-revoked, internal-only):
 *
 *   - activeBytes  = what the cap actually ENFORCES = non-removed media in NON-deleted events.
 *                    Since Recovery Phase 1 the cap reads THIS (not the physical
 *                    storage_used_bytes), so the meter must too — deleting now visibly frees room.
 *   - standbyBytes = the "Recently deleted" footprint = removed media OR (any) media in a
 *                    soft-deleted event — the same bin the cron's sweepStandbyBudget bounds.
 *                    Shown as a secondary "+ X in Recently deleted" line.
 *
 * One RLS read of the host's own media joined to its event's deleted_at, partitioned in JS
 * (mirrors getAccountDetail's active-bytes pass in accounts.ts). active vs standby are
 * complementary + exhaustive — every media row is exactly one. (Fetches one row per media; fine
 * at this scale, an aggregate RPC would be the move only for very large accounts.)
 */
import "server-only";

import { createClient } from "@/lib/supabase/server";

export type HostStorageSummary = {
  activeBytes: number;
  standbyBytes: number;
};

type SummaryRow = {
  file_size_bytes: number;
  status: string;
  events: { deleted_at: string | null } | null;
};

export async function getHostStorageSummary(): Promise<HostStorageSummary> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { activeBytes: 0, standbyBytes: 0 };

  // media_host_all scopes to the host's own media; the events embed reads each row's event
  // deleted_at (events_host_all scopes events to the host too). Deleted events' media stay readable
  // here (the policy gates on ownership, not deleted_at).
  // The embed is PINNED to the direct FK (`media_event_id_fkey`): once `reel_items` (a junction with
  // FKs to BOTH events and media) existed, PostgREST also inferred an events<->media many-to-many, so
  // a bare `events!inner(...)` became ambiguous (PGRST201). ANY new junction over two already-related
  // tables breaks their embeds the same way — always hint the FK. See database-security.md.
  const { data, error } = await supabase
    .from("media")
    .select("file_size_bytes, status, events!media_event_id_fkey!inner(deleted_at)");
  if (error) throw error;

  let activeBytes = 0;
  let standbyBytes = 0;
  for (const row of (data ?? []) as unknown as SummaryRow[]) {
    const inLiveEvent = row.events != null && row.events.deleted_at == null;
    if (row.status !== "removed" && inLiveEvent) {
      activeBytes += row.file_size_bytes;
    } else {
      standbyBytes += row.file_size_bytes;
    }
  }
  return { activeBytes, standbyBytes };
}
