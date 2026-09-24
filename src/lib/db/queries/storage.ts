/**
 * Host storage summary for the dashboard meter (recovery Phase 4), the account page, the plan sheet's facts and both
 * storage-guard routes. The two numbers the meter needs:
 *
 *   - activeBytes  = what the cap actually ENFORCES = non-removed media in NON-deleted events.
 *                    Since Recovery Phase 1 the cap reads THIS (not the physical
 *                    storage_used_bytes), so the meter must too — deleting now visibly frees room.
 *   - standbyBytes = the "Recently deleted" footprint = what the host can RESTORE: a host's
 *                    removal, or any live media in a soft-deleted event, and never a guest's own
 *                    withdrawal (`removed_by_uploader`, delete-final: it counts in neither number).
 *                    Shown as a secondary "+ X in Recently deleted" line.
 *
 * ★ ONE AGGREGATE, `public.host_storage_summary(uuid)` (20260923140000, its Deleted figure narrowed by 20260923160000):
 * a SUM each in SQL, so the meter and the guard read one row whatever the album's size, where a read of the rows pages
 * 1,000 at a time past PostgREST's cap (a 35,000-item account would be 35 round trips on every dashboard load). The
 * definitions live there alone: its active filter is `host_active_bytes`'s, the one SQL definition every upload
 * function enforces, and storage-summary.test.ts reads the migrations to hold both.
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
