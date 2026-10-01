/**
 * THE ALBUM-LOG SWEEP (crumbs-37, `20261001150000_album_log_prune.sql`): the paged album's change log
 * keeps one row per item that ever changed, and a purged item's row (its tombstone) outlived the item for
 * good. Each night this sweep walks the log album by album through `album_prune_tombstones`, which
 * deletes an album's tombstones and raises its two watermarks to their versions in one transaction, so
 * the log holds the living album and nothing it no longer needs.
 *
 * ★ NEVER A SILENT GAP. A client holding a version below its scope's watermark is sent the album whole
 * (`planAlbumSync`, src/lib/events/album-sync.ts); one at or above it missed nothing. So the sweep may
 * stop anywhere, or prune any album at any moment, and every client still converges: the integrity model
 * (`src/lib/db/album-version.test.ts`) prunes at every point a write could land.
 *
 * WHOLE AND BUDGETED (lifecycle-recovery.md, "The daily purge cron"): one call takes the albums the next
 * `ALBUM_LOG_WINDOW` rows of the log touch, each whole, so the walk always rests on an album boundary, and
 * the deadline is asked before each call, never inside one. It EXAMINES rather than drains (most albums
 * hold nothing to prune), so it rotates like the account sweeps: a run that stops stores the album it
 * stopped after (`resume_after` on its own run row), and the next run carries on from there, wrapping
 * round to the albums before it, so a log longer than one night's share is still walked whole in turn.
 *
 * Its own job (`purge_album_log`: a run row, a switch and a card, admin-observability.md), though it deletes
 * neither bytes nor accounts: it writes in the album's live core, so an operator can stop it alone.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { mustCount, QueryFailedError } from "@/lib/db/must-query";
import type { AdminClient } from "@/lib/lifecycle/reclaim";
import {
  NO_DEADLINE,
  stoppedEarly,
  type Deadline,
  type StoppedEarly,
} from "@/lib/lifecycle/sweep-budget";
import { resumeFields } from "@/lib/lifecycle/sweeps/rotation";

/**
 * The change rows one call's window spans (its albums are then taken whole). Five thousand rows is a few
 * ordinary albums or one big one: tens of milliseconds an index walk, small enough that the deadline is
 * asked often, large enough that a log of a million rows is two hundred calls.
 */
export const ALBUM_LOG_WINDOW = 5_000;

export type AlbumLogTally = {
  /** Albums examined this run. */
  albums: number;
  /** Change rows examined (each album whole). */
  examined: number;
  /** Tombstones pruned. */
  pruned: number;
  /** Albums whose watermark the run raised. */
  pruned_albums: number;
  resume_after?: string;
} & Partial<StoppedEarly>;

/** What one call of `album_prune_tombstones` answers. */
type PruneAnswer = {
  albums: number;
  examined: number;
  pruned: number;
  pruned_albums: number;
  /** The last album the call took; null when the log has none after the cursor (a pass is complete). */
  last: string | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The function's jsonb, read defensively: an answer this code does not know fails the run, never reads as zero. */
export function parsePruneAnswer(data: unknown): PruneAnswer {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new TypeError("album_prune_tombstones: not an object");
  }
  const o = data as Record<string, unknown>;
  const count = (key: string) => {
    const value = o[key];
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
      throw new TypeError(`album_prune_tombstones: ${key} is not a count`);
    }
    return value;
  };
  const last = o.last;
  if (last !== null && (typeof last !== "string" || !UUID.test(last))) {
    throw new TypeError("album_prune_tombstones: last is not an album id");
  }
  return {
    albums: count("albums"),
    examined: count("examined"),
    pruned: count("pruned"),
    pruned_albums: count("pruned_albums"),
    last: last === null ? null : last.toLowerCase(),
  };
}

async function pruneAfter(
  admin: AdminClient,
  after: string | null,
  window: number,
): Promise<PruneAnswer> {
  // ★ A CAST ACROSS THE APPLY: the generated types learn `album_prune_tombstones` when the Orchestrator
  // regenerates them after 20261001150000 lands. Until it stands, PostgREST answers that it does not exist,
  // and the run fails red on its card, which is the truth (nothing is being pruned).
  const { data, error } = await (admin as unknown as SupabaseClient).rpc(
    "album_prune_tombstones",
    { p_after: after, p_limit: window },
  );
  if (error) {
    throw new QueryFailedError("cron/purge: album_prune_tombstones", error);
  }
  return parsePruneAnswer(data);
}

/** The albums a stopped run left this pass: those after the cursor, and (once wrapped) up to where it began. */
async function countLeft(
  admin: AdminClient,
  after: string | null,
  until: string | null,
): Promise<number> {
  let query = admin
    .from("album_state")
    .select("event_id", { count: "exact", head: true });
  if (after) query = query.gt("event_id", after);
  if (until) query = query.lte("event_id", until);
  return mustCount(query, "cron/purge: albums left in the log");
}

export async function sweepAlbumLog(
  admin: AdminClient,
  opts: {
    deadline?: Deadline;
    resumeAfter?: string | null;
    /** Rows a call's window spans; a test shrinks it. */
    window?: number;
  } = {},
): Promise<AlbumLogTally> {
  const deadline = opts.deadline ?? NO_DEADLINE;
  const window = opts.window ?? ALBUM_LOG_WINDOW;
  const start = opts.resumeAfter ?? null;
  const tally = { albums: 0, examined: 0, pruned: 0, pruned_albums: 0 };

  // From the cursor to the log's end, then (when the run began part way) from the top back to it.
  let after = start;
  let wrapped = start === null;
  for (;;) {
    if (deadline.passed()) {
      const left = wrapped
        ? await countLeft(admin, after, start)
        : (await countLeft(admin, after, null)) +
          (await countLeft(admin, null, start));
      // Stopped before its first call: the old cursor stands, so no time at all never resets the turn.
      return { ...tally, ...stoppedEarly(left), ...resumeFields(after) };
    }
    const answer = await pruneAfter(admin, after, window);
    tally.albums += answer.albums;
    tally.examined += answer.examined;
    tally.pruned += answer.pruned;
    tally.pruned_albums += answer.pruned_albums;

    if (answer.last === null) {
      // The log's end. A run that began at the top has walked it all; one that began part way wraps.
      if (wrapped) return tally;
      wrapped = true;
      after = null;
      continue;
    }
    after = answer.last;
    // Wrapped round past where this run began: every album has had its turn.
    if (wrapped && start !== null && after >= start) return tally;
  }
}
