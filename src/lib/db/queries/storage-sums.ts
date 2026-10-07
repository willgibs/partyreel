/**
 * THE STORAGE SUMS' READS (storage-sums-signal): the check's one call (`storage_sums_drift`, service role, STABLE,
 * writes nothing: 20261006180000), the check of one host by it, the count a stopped pass leaves, the newest run row the
 * next run and the Rebuild start from, and the names the card gives the hosts it lists. Every read throws on a failed
 * query (`mustQuery`): a check that could not be read is never a clean one.
 */
import "server-only";

import { mustCount, mustQuery, QueryFailedError } from "@/lib/db/must-query";
import {
  parseDriftPage,
  recheckOf,
  uuidBefore,
  type DriftPage,
  type Recheck,
} from "@/lib/lifecycle/sweeps/storage-sums-state";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

/** The job whose run rows carry the check's record (the catalog's `storage_sums`). */
const JOB = "storage_sums";

/** One call: the hosts after `after` (from the first when null), at most `limit`, each compared with the walk. */
export async function readDriftPage(
  admin: AdminClient,
  after: string | null,
  limit: number,
): Promise<DriftPage> {
  // A pass's first call omits `p_after`, which the function reads as null: the hosts from the first.
  const { data, error } = await admin.rpc(
    "storage_sums_drift",
    after === null ? { p_limit: limit } : { p_after: after, p_limit: limit },
  );
  if (error) {
    throw new QueryFailedError("storage sums: storage_sums_drift", error);
  }
  return parseDriftPage(data);
}

/**
 * THE CHECK OF ONE HOST: the call that starts just before her checks her alone (`uuidBefore`), and its answer names
 * whom it checked, so a host whose account is gone reads as gone, never as at parity by someone else's figures.
 */
export async function recheckHost(
  admin: AdminClient,
  hostId: string,
): Promise<Recheck> {
  return recheckOf(hostId, await readDriftPage(admin, uuidBefore(hostId), 1));
}

/** How many hosts a pass stopped at `after` has still to check (the run's `remaining`). */
export async function countHostsAfter(
  admin: AdminClient,
  after: string | null,
): Promise<number> {
  let query = admin
    .from("profiles")
    .select("id", { count: "exact", head: true });
  if (after !== null) query = query.gt("id", after);
  return mustCount(query, "storage sums: hosts left in the pass");
}

/**
 * THE CHECK'S RECORD: the newest run that ran and wrote one (ok or error, its counts there). A pause's skipped row
 * carries nothing, a running one is this very run or one that died, and one that threw wrote only its note: reading
 * past those, a failed night never erases the list of drifted hosts, their Rebuilds or the pass's place. What the next
 * run resumes from, the card lists and the Rebuild amends. Null before any.
 */
export async function readLatestStorageSumsCounts(): Promise<unknown> {
  const row = await mustQuery(
    createAdminClient()
      .from("job_runs")
      .select("counts")
      .eq("job", JOB)
      .in("status", ["ok", "error"])
      .not("counts", "is", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    "storage sums: the last run",
  );
  return row?.counts ?? null;
}

/**
 * The names the card gives the hosts it lists (their address, else their display name), at most the list's 25 ids in
 * one read. A host with no profile any more has no name: the card shows her id.
 */
export async function readHostLabels(
  ids: readonly string[],
): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  // row-cap: at most FINDINGS_MAX (25) ids, the hosts one run row names
  const rows = await mustQuery(
    createAdminClient()
      .from("profiles")
      .select("id, email, display_name")
      .in("id", [...ids]),
    "storage sums: the listed hosts' names",
  );
  const out = new Map<string, string>();
  for (const row of rows ?? []) {
    const label = row.email?.trim() || row.display_name?.trim();
    if (label) out.set(row.id, label);
  }
  return out;
}
