/**
 * Orphan-sweep circuit-breaker (durability-backups.md — media durability).
 *
 * The purge cron's orphan sweep (src/app/api/cron/purge/route.ts `sweepOrphans`) hard-deletes any
 * R2 object whose `media` row is gone. It TRUSTS the DB to decide "this is an orphan". If the media
 * rows are ever lost or unlinked (a bad migration, a restore to an older snapshot, an accidental
 * mass row-delete, an RLS/query bug returning a partial set), nearly every object would look
 * orphaned and ONE cron run could delete the entire bucket — and there is no backup to undo it.
 *
 * This is the pure decision the sweep consults right before its single bulk delete. It fails CLOSED:
 * when the candidate set looks pathological, the sweep deletes NOTHING this run and alerts a human.
 * The deliberate failure mode is a storage LEAK (objects briefly not reclaimed) — trivially fixed on
 * a later run once the DB is healthy — which is vastly preferable to an irreversible wipe.
 *
 * Kept pure (no I/O) so it is unit-tested with fixtures. The sweep bounds each run to a page cap, so
 * `objectsScanned` means "objects looked at THIS run" — the right denominator for the fraction guard.
 */

/**
 * Absolute ceiling on objects a single run may delete. Real orphan volume is a handful
 * (presign-without-complete races, crashed-sweep stragglers) — far below a full bucket, comfortably
 * above any honest backlog. Above this, a human looks first. NOTE: intentional bulk purges (e.g. the
 * pre-launch test-data reset) will exceed this BY DESIGN — they must run through an explicit
 * force-purge path, never the guarded daily cron.
 */
export const ORPHAN_DELETE_ABSOLUTE_CAP = 1000;

/**
 * Scale-aware backstop: if more than this share of the objects we scanned resolve to "orphan", the
 * DB is almost certainly wrong (partial row loss), not the bucket. Catches losses that stay under
 * the absolute cap on a large bucket.
 */
export const ORPHAN_DELETE_MAX_FRACTION = 0.25;

/**
 * Don't apply the fraction guard until at least this many objects have been scanned. On a tiny early
 * bucket a few genuine orphans can be a large fraction, and deleting those is correct.
 */
export const ORPHAN_RATIO_MIN_SCANNED = 50;

export type OrphanBreakerReason =
  | "media_table_empty"
  | "absolute_cap"
  | "fraction_cap";

export type OrphanGuardInput = {
  /** Total rows in `media` (any status). 0 while candidates exist == the DB lost its rows. */
  mediaCount: number;
  /** R2 objects this run resolved to "no media row" — the delete set if the sweep proceeds. */
  candidateCount: number;
  /** R2 objects listed/considered this run — the fraction guard's denominator. */
  objectsScanned: number;
};

export type OrphanGuardResult = {
  trip: boolean;
  reason: OrphanBreakerReason | null;
};

/** Decide whether the orphan sweep should ABORT (delete nothing) this run. */
export function evaluateOrphanSweep(
  input: OrphanGuardInput,
): OrphanGuardResult {
  const { mediaCount, candidateCount, objectsScanned } = input;

  // Nothing to delete -> nothing to guard. Never trip on an empty candidate set, even if the media
  // table is also empty (a brand-new / fully-purged bucket): there is simply no action to block.
  if (candidateCount === 0) return { trip: false, reason: null };

  // Objects exist but the media table is empty: the DB is in a bad state, not "every object is a
  // genuine orphan". The canonical catastrophic case (lost rows / mid-restore / query returning none).
  if (mediaCount === 0) return { trip: true, reason: "media_table_empty" };

  // Too many at once in absolute terms.
  if (candidateCount > ORPHAN_DELETE_ABSOLUTE_CAP)
    return { trip: true, reason: "absolute_cap" };

  // Too large a share of what we looked at (only once the sample is big enough to be meaningful).
  if (
    objectsScanned >= ORPHAN_RATIO_MIN_SCANNED &&
    candidateCount > objectsScanned * ORPHAN_DELETE_MAX_FRACTION
  )
    return { trip: true, reason: "fraction_cap" };

  return { trip: false, reason: null };
}
