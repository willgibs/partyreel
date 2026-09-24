/**
 * SWEEP 8: THE STANDBY BUDGET (anti-abuse). Deleted-but-stored media does not count against the cap,
 * so the TOTAL of it per account is bounded to `RECENTLY_DELETED_BUDGET_MULTIPLIER` x the effective
 * cap, evicted OLDEST-first when over: a restore-then-delete "timer refresh" cannot keep junk alive
 * (size is the bound, not the clock). Runs after the expiry sweeps (so `handled` holds what they
 * purged) and after over-capacity (whose auto-reduce is system-removed and never counts here).
 *
 * WHAT COUNTS (the bin, its two disjoint arms): a host's REMOVED media, less what the system removed
 * (`removed_by_system`: over-capacity's auto-reduce, which purges on its own `purge_at`) and less a
 * guest's own withdrawal (`removed_by_uploader`: delete-final, Will 2026-09-23: the withdrawal is
 * final, not the host's, never counts in the host's budget and is never evicted by it; it purges on
 * its own 30-day `purge_at` through the removed_media sweep), plus the live media of a soft-deleted
 * event. Never a held row: a hold is our doing, not the host's hoarding, and the delete is R2-first.
 *
 * WHOLE (the 1,000-row round, 2026-09-23; H12):
 *  - The hosts come from `standby_hosts(p_after, p_limit)`, keyset pages of `(host_id, standby_bytes)`
 *    whose bytes are exactly the bin above: no more one row per removed photo platform-wide (cut at
 *    1,000, so a host past the cut was never checked) and a 2,000-id `profiles.in()`.
 *  - Only a host over its budget has its bin read, and the bin is read WHOLE (both arms by keyset),
 *    so eviction picks oldest-first across all of it, not across the first thousand rows.
 *  - Under the deadline, host by host. The sweep DRAINS (a host brought under budget passes quickly
 *    next time), so it keeps no cursor: a stopped run says so, and the next starts at the first host.
 */
import "server-only";

import { effectiveStorageCap, toBillingTier } from "@/lib/constants/tiers";
import { mustQuery } from "@/lib/db/must-query";
import {
  inChunks,
  MAX_ROWS,
  readAllPages,
  type AllPages,
} from "@/lib/db/read-all";
import {
  addReclaimed,
  emptyReclaimed,
  reclaimMedia,
  type AdminClient,
  type Reclaimed,
} from "@/lib/lifecycle/reclaim";
import {
  RECENTLY_DELETED_BUDGET_MULTIPLIER,
  selectForStandbyEviction,
} from "@/lib/lifecycle/recently-deleted";
import {
  NO_DEADLINE,
  stoppedEarly,
  type Deadline,
  type StoppedEarly,
} from "@/lib/lifecycle/sweep-budget";

export type StandbyTally = Reclaimed & {
  candidates: number;
  over_budget: number;
} & Partial<StoppedEarly>;

export type StandbyHost = { host_id: string; standby_bytes: number };

export type BinRow = {
  id: string;
  original_key: string;
  preview_key: string | null;
  file_size_bytes: number;
  removed_at: string | null;
  events: { deleted_at: string | null };
};

const BIN_SELECT =
  "id, original_key, preview_key, file_size_bytes, removed_at, events!media_event_id_fkey!inner(host_id, deleted_at)";

/** THE READ HALF, discovery: one keyset page of hosts with standby bytes, by host id. */
export function standbyHostsPage(
  admin: AdminClient,
  after: string | null,
  limit: number,
) {
  return admin.rpc("standby_hosts", {
    p_after: after ?? undefined,
    p_limit: limit,
  });
}

/** Each host's budget in bytes (null for an unlimited tier), read in `IN_CHUNK` id chunks. */
export async function readStandbyBudgets(
  admin: AdminClient,
  hostIds: readonly string[],
): Promise<Map<string, number | null>> {
  const profiles = await inChunks(
    "cron/purge: standby caps",
    hostIds,
    async (chunk) =>
      (await mustQuery(
        admin
          .from("profiles")
          .select("id, tier, storage_cap_bytes")
          .in("id", chunk),
        "cron/purge: standby caps",
      )) ?? [],
  );
  const budgets = new Map<string, number | null>();
  for (const p of profiles) {
    const cap = effectiveStorageCap(toBillingTier(p.tier), p.storage_cap_bytes);
    budgets.set(
      p.id,
      cap === null ? null : RECENTLY_DELETED_BUDGET_MULTIPLIER * cap,
    );
  }
  return budgets;
}

/** THE READ HALF, per host: the whole bin, both arms, by keyset on id. Never a held row. */
export async function readStandbyBin(
  admin: AdminClient,
  hostId: string,
): Promise<BinRow[]> {
  const [removed, inDeletedEvents] = await Promise.all([
    readAllPages(
      "cron/purge: standby removed bin",
      (after: string | null, limit) => {
        let query = admin
          .from("media")
          .select(BIN_SELECT)
          .eq("events.host_id", hostId)
          .eq("status", "removed")
          .eq("removed_by_system", false)
          .eq("removed_by_uploader", false)
          .filter("legal_hold_at", "is", null)
          .order("id", { ascending: true })
          .limit(limit);
        if (after) query = query.gt("id", after);
        return query;
      },
      (row) => row.id,
    ),
    readAllPages(
      "cron/purge: standby deleted-event bin",
      (after: string | null, limit) => {
        let query = admin
          .from("media")
          .select(BIN_SELECT)
          .eq("events.host_id", hostId)
          .not("events.deleted_at", "is", null)
          .neq("status", "removed")
          .filter("legal_hold_at", "is", null)
          .order("id", { ascending: true })
          .limit(limit);
        if (after) query = query.gt("id", after);
        return query;
      },
      (row) => row.id,
    ),
  ]);
  return [
    ...(removed.rows as unknown as BinRow[]),
    ...(inDeletedEvents.rows as unknown as BinRow[]),
  ].map((row) => ({ ...row, file_size_bytes: Number(row.file_size_bytes) }));
}

/**
 * The bin clock for an item: the EARLIER of its `removed_at` and its event's `deleted_at`, so a
 * restore that refreshes `removed_at` cannot push it behind the event's older deletion in the queue.
 */
export function binnedAt(row: BinRow, nowIso: string): string {
  const a = row.removed_at;
  const b = row.events.deleted_at;
  if (!a) return b ?? nowIso;
  if (!b) return a;
  return a < b ? a : b;
}

export async function sweepStandbyBudget(
  admin: AdminClient,
  now: Date,
  handled: Set<string>,
  opts: { deadline?: Deadline } = {},
): Promise<StandbyTally> {
  const deadline = opts.deadline ?? NO_DEADLINE;
  const nowIso = now.toISOString();
  const tally: StandbyTally = {
    candidates: 0,
    over_budget: 0,
    ...emptyReclaimed(),
  };

  let after: string | null = null;
  for (;;) {
    if (deadline.passed()) return { ...tally, ...stoppedEarly(null) };
    // Annotated: the loop feeds `page.after` back in, which TypeScript cannot infer through.
    const page: AllPages<StandbyHost, string> = await readAllPages(
      "cron/purge: standby hosts",
      (cursor: string | null, limit) => standbyHostsPage(admin, cursor, limit),
      (host) => host.host_id,
      { budget: MAX_ROWS, after },
    );
    if (page.rows.length === 0) break;
    tally.candidates += page.rows.length;
    const budgets = await readStandbyBudgets(
      admin,
      page.rows.map((host) => host.host_id),
    );

    for (const host of page.rows) {
      const budget = budgets.get(host.host_id);
      // No profile (an account mid-deletion) or an unlimited tier: no budget to enforce.
      if (budget === undefined || budget === null) continue;
      // The function's figure is the bin's bytes, so a host within budget needs no bin read at all.
      if (Number(host.standby_bytes) <= budget) continue;
      if (deadline.passed()) return { ...tally, ...stoppedEarly(null) };

      const bin = (await readStandbyBin(admin, host.host_id)).filter(
        (row) => !handled.has(row.id),
      );
      const standby = bin.reduce((sum, row) => sum + row.file_size_bytes, 0);
      if (standby <= budget) continue;
      tally.over_budget += 1;

      const evictIds = new Set(
        selectForStandbyEviction(
          bin.map((row) => ({
            id: row.id,
            file_size_bytes: row.file_size_bytes,
            binned_at: binnedAt(row, nowIso),
          })),
          budget,
          now.getTime(),
        ),
      );
      if (evictIds.size === 0) continue;
      const evict = bin.filter((row) => evictIds.has(row.id));
      addReclaimed(tally, await reclaimMedia(admin, evict));
      for (const row of evict) handled.add(row.id);
    }

    if (!page.more) break;
    after = page.after;
  }
  return tally;
}
