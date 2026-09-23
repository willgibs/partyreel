/**
 * Host storage summary for the dashboard meter (recovery Phase 4), the account page, the plan sheet's facts and both
 * storage-guard routes. The two numbers the meter needs:
 *
 *   - activeBytes  = what the cap actually ENFORCES = non-removed media in NON-deleted events.
 *                    Since Recovery Phase 1 the cap reads THIS (not the physical
 *                    storage_used_bytes), so the meter must too — deleting now visibly frees room.
 *   - standbyBytes = the "Recently deleted" footprint = removed media OR (any) media in a
 *                    soft-deleted event — the same bin the cron's sweepStandbyBudget bounds.
 *                    Shown as a secondary "+ X in Recently deleted" line.
 *
 * ★ ONE AGGREGATE, `public.host_storage_summary(uuid)` (20260923140000): a SUM each in SQL, so the meter and the guard
 * read one row whatever the album's size, where a read of the rows pages 1,000 at a time past PostgREST's cap (a
 * 35,000-item account would be 35 round trips on every dashboard load). Its active filter is `host_active_bytes`'s,
 * the one SQL definition every upload function enforces, and storage-summary.test.ts reads both migrations to hold
 * that.
 *
 * ★ IT IS ALSO THE STORAGE GUARD'S NUMBER (billing-caps.md, "no plan change leaves a host storing
 * more than the new cap"): the checkout and change-plan routes refuse a smaller plan off
 * `activeBytes`, so an undercount here SELLS a plan the host does not fit, and a failed read throws rather than
 * reading as an empty account.
 *
 * The function is service-role only (a caller-supplied host id would read anyone's totals), so it rides the admin
 * client, and every caller proves whose id it passes first: `getHostStorageSummary` with `getUser()`, the admin's
 * account view behind `requireAdmin()`.
 */
import "server-only";

import { cache } from "react";

import { createAdminClient } from "@/lib/supabase/admin";
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
 * The two definitions in TypeScript, over rows: every media row is exactly one of active or standby, the split the
 * aggregate makes in SQL. No read here sums rows (the aggregate does); this is the definition in code, for anything
 * that holds rows, and storage-summary.test.ts states it over fixtures.
 */
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

/**
 * One host's two numbers from the aggregate. Service-role, so the CALLER proves the id: never pass one that did not
 * come from `getUser()` or an admin-gated read.
 */
export async function readHostStorageSummary(
  hostId: string,
): Promise<HostStorageSummary> {
  const { data, error } = await createAdminClient().rpc(
    "host_storage_summary",
    { p_host_id: hostId },
  );
  if (error) throw error;
  // A `returns table` function answers a list; this one always answers exactly one row (both SUMs coalesce to 0).
  const row = data?.[0];
  return {
    activeBytes: Number(row?.active_bytes ?? 0),
    standbyBytes: Number(row?.standby_bytes ?? 0),
  };
}

// cache() = request-scoped dedupe (see lib/supabase/request-auth); the getUser() re-check rides the shared
// per-request validation, and a signed-out caller reads zeros without a query.
export const getHostStorageSummary = cache(
  async function getHostStorageSummary(): Promise<HostStorageSummary> {
    const { user } = await getRequestAuth();
    if (!user) return { activeBytes: 0, standbyBytes: 0 };
    return readHostStorageSummary(user.id);
  },
);
