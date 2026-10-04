/**
 * What a host stores, in one read (trash-in-storage, Will 2026-10-03: Deleted counts in storage). Her plan's cap holds
 * everything she keeps, her albums and her Deleted together, so the one figure every cap check reads is `storedBytes`;
 * the two halves are what the storage chart draws apart:
 *
 *   - activeBytes  = her albums: non-removed media in non-deleted events (`host_active_bytes`).
 *   - deletedBytes = her Deleted: exactly what her two Deleted lists show, inside their 30 days (`host_deleted_media`),
 *                    never a guest's own withdrawal, an operator's removal or an item asked to leave for good.
 *   - systemBytes  = the part of Deleted the over-capacity reduce put there (its grace reads what she keeps by choice,
 *                    everything stored less these: lifecycle-recovery.md).
 *   - storedBytes  = activeBytes + deletedBytes: what her plan's cap holds. A delete moves bytes from her albums to
 *                    Deleted and frees nothing; an item frees room only when it leaves Deleted for good.
 *
 * ★ ONE AGGREGATE, `public.host_storage_summary(uuid)` (its third column from 20261003220000): a SUM each in SQL, so
 * every page reads one row whatever the account's size. The definitions live there alone (`storage-summary.test.ts`
 * reads them off the migrations): the cap checks in SQL (`create_media*`, `meter_upload`, the advisories) read the same
 * function, so no figure on screen can disagree with a refusal.
 *
 * ★ IT IS ALSO THE STORAGE GUARD'S NUMBER (billing-caps.md, "no plan change leaves a host storing more than the new
 * cap"): checkout and change-plan refuse a smaller plan off `storedBytes`, so an undercount here SELLS a plan she does not
 * fit, and a failed read throws rather than reading as an empty account.
 *
 * The function is service-role only (a caller-supplied host id would read anyone's totals), so it rides the admin
 * client, and every caller proves whose id it passes first: `getHostStorageSummary` with `getUser()`, the admin's
 * account view behind `requireAdmin()`, the cron with its secret.
 */
import "server-only";

import { cache } from "react";

import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestAuth } from "@/lib/supabase/request-auth";

export type HostStorageSummary = {
  /** Her albums: what the plan holds outside Deleted. */
  activeBytes: number;
  /** Her Deleted, as her two Deleted lists show it. */
  deletedBytes: number;
  /** The over-capacity reduce's own removals, inside Deleted. */
  systemBytes: number;
  /** What her plan's cap holds: her albums and her Deleted together. */
  storedBytes: number;
};

export const NO_STORAGE: HostStorageSummary = {
  activeBytes: 0,
  deletedBytes: 0,
  systemBytes: 0,
  storedBytes: 0,
};

/**
 * One host's figures from the aggregate. Service-role, so the CALLER proves the id: never pass one that did not come
 * from `getUser()` or an admin-gated read.
 */
export async function readHostStorageSummary(
  hostId: string,
): Promise<HostStorageSummary> {
  const { data, error } = await createAdminClient().rpc(
    "host_storage_summary",
    { p_host_id: hostId },
  );
  if (error) throw error;
  // A `returns table` function answers a list; this one always answers exactly one row (every SUM coalesces to 0).
  // `standby_bytes` is the SQL's own name for her Deleted, kept for the builds deployed before 20261003220000.
  const row = data?.[0];
  const activeBytes = Number(row?.active_bytes ?? 0);
  const deletedBytes = Number(row?.standby_bytes ?? 0);
  return {
    activeBytes,
    deletedBytes,
    systemBytes: Number(row?.system_bytes ?? 0),
    storedBytes: activeBytes + deletedBytes,
  };
}

// cache() = request-scoped dedupe (see lib/supabase/request-auth); the getUser() re-check rides the shared
// per-request validation, and a signed-out caller reads zeros without a query.
export const getHostStorageSummary = cache(
  async function getHostStorageSummary(): Promise<HostStorageSummary> {
    const { user } = await getRequestAuth();
    if (!user) return NO_STORAGE;
    return readHostStorageSummary(user.id);
  },
);
