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
 * complementary + exhaustive — every media row is exactly one.
 *
 * ★ IT IS ALSO THE STORAGE GUARD'S NUMBER (billing-caps.md, "no plan change leaves a host storing
 * more than the new cap"): the checkout and change-plan routes refuse a smaller plan off
 * `activeBytes`, so an undercount here SELLS a plan the host does not fit. Hence the paging below.
 */
import "server-only";

import { cache } from "react";

import { getRequestAuth } from "@/lib/supabase/request-auth";

export type HostStorageSummary = {
  activeBytes: number;
  standbyBytes: number;
};

type SummaryRow = {
  id: string;
  file_size_bytes: number;
  status: string;
  events: { deleted_at: string | null } | null;
};

/**
 * PostgREST answers at most `max_rows` rows per request (1000 on this project,
 * supabase/config.toml), silently. An unpaged select summed the first thousand
 * items and dropped the rest, so a 35,000-photo wedding read as about 4 GB: a
 * wrong meter, and a storage guard that would have let that host buy Pro 100 GB.
 */
const PAGE = 1000;

/** Adds one page to the running totals (pure; exported for the paging test). */
export function tallyStorageRows(
  totals: HostStorageSummary,
  rows: readonly SummaryRow[],
): HostStorageSummary {
  let { activeBytes, standbyBytes } = totals;
  for (const row of rows) {
    const inLiveEvent = row.events != null && row.events.deleted_at == null;
    if (row.status !== "removed" && inLiveEvent) {
      activeBytes += row.file_size_bytes;
    } else {
      standbyBytes += row.file_size_bytes;
    }
  }
  return { activeBytes, standbyBytes };
}

// cache() = request-scoped dedupe (see lib/supabase/request-auth); the getUser()
// re-check now rides the shared per-request validation.
export const getHostStorageSummary = cache(
  async function getHostStorageSummary(): Promise<HostStorageSummary> {
    const { supabase, user } = await getRequestAuth();
    if (!user) return { activeBytes: 0, standbyBytes: 0 };

    // media_host_all scopes to the host's own media; the events embed reads each row's event
    // deleted_at (events_host_all scopes events to the host too). Deleted events' media stay readable
    // here (the policy gates on ownership, not deleted_at).
    // The embed is PINNED to the direct FK (`media_event_id_fkey`): once `reel_items` (a junction with
    // FKs to BOTH events and media) existed, PostgREST also inferred an events<->media many-to-many, so
    // a bare `events!inner(...)` became ambiguous (PGRST201). ANY new junction over two already-related
    // tables breaks their embeds the same way — always hint the FK. See database-security.md.
    //
    // KEYSET PAGES ordered by id: an offset would skip a row whenever one is removed mid-read, and
    // the first page asks for the exact count so the common account (under a thousand items) is
    // ONE round trip. The loop never trusts a page's length against PAGE (PostgREST clamps to its
    // own max_rows, so a short page is not proof of the last one): it stops at the count or at an
    // empty page, whichever comes first.
    let totals: HostStorageSummary = { activeBytes: 0, standbyBytes: 0 };
    let total: number | null = null;
    let seen = 0;
    let lastId: string | null = null;
    for (;;) {
      let query = supabase
        .from("media")
        .select(
          "id, file_size_bytes, status, events!media_event_id_fkey!inner(deleted_at)",
          lastId === null ? { count: "exact" } : undefined,
        )
        .order("id", { ascending: true })
        .limit(PAGE);
      if (lastId !== null) query = query.gt("id", lastId);
      const { data, error, count } = await query;
      if (error) throw error;
      if (lastId === null) total = count ?? null;

      const rows = (data ?? []) as unknown as SummaryRow[];
      if (rows.length === 0) break;
      totals = tallyStorageRows(totals, rows);
      seen += rows.length;
      lastId = rows[rows.length - 1].id;
      if (total !== null && seen >= total) break;
    }
    return totals;
  },
);
