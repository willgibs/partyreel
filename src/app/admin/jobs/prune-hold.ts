/**
 * RELEASE THE HOLD: the backup prune's one positive control (durability-backups.md, "The deletion-aware prune"; the
 * Advisor's Q20). The prune's Worker holds a backlog far over its usual and never lets it through by itself, so a
 * person's release is a stamp: the time "Release the hold" was last pressed on /admin/jobs. The job heartbeat's start
 * answer carries it to the Worker (`/api/internal/job-run`, `releasedAtMs`), and the Worker honours it only when it is
 * newer than the standing hold (`decideHold`, workers/backup/src/prune-ledger.ts), so a press releases the hold it was
 * pressed for and never a later one. The pause switch stays the brake; this is the go.
 *
 * ITS HOME IS AN `ops_flags` ROW, its `updated_at` the stamp (`enabled` carries nothing): the operator controls'
 * table, deny-all and service-role only, so the stamp needed no migration. No job's switch reads this key
 * (`getJobFlags` reads the catalog's flag keys alone), so it can never pause or start anything.
 */
import "server-only";

import { mustQuery } from "@/lib/db/must-query";
import { createAdminClient } from "@/lib/supabase/admin";

export const PRUNE_HOLD_RELEASE_KEY = "backup_prune_hold_released";

/**
 * The prune's last report from a run that ran (ok or error): the Worker puts a standing hold on every such report
 * (`held_since`), while a paused run's skipped row carries nothing, so the card reads past it. Null before any.
 */
export async function readLastPruneReport(): Promise<unknown> {
  const row = await mustQuery(
    createAdminClient()
      .from("job_runs")
      .select("counts")
      .eq("job", "backup_prune")
      .in("status", ["ok", "error"])
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    "admin/jobs: the prune's last report",
  );
  return row?.counts ?? null;
}

/** The last release pressed (epoch ms), or null when none ever was. Throws when the row cannot be read. */
export async function readPruneHoldReleasedAtMs(): Promise<number | null> {
  const row = await mustQuery(
    createAdminClient()
      .from("ops_flags")
      .select("updated_at")
      .eq("key", PRUNE_HOLD_RELEASE_KEY)
      .maybeSingle(),
    "admin/jobs: the prune hold's release",
  );
  const at = row ? Date.parse(row.updated_at) : Number.NaN;
  return Number.isFinite(at) ? at : null;
}

/** Stamp a release now. The caller re-checks admin + AAL2 first; this is the write half only. */
export async function stampPruneHoldRelease(): Promise<{
  error: string | null;
}> {
  const { error } = await createAdminClient().from("ops_flags").upsert(
    {
      key: PRUNE_HOLD_RELEASE_KEY,
      enabled: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );
  return { error: error?.message ?? null };
}
