/**
 * Backup-prune circuit-breaker (durability-backups.md — media durability).
 *
 * The deletion-aware backup prune (workers/backup, the `prune` branch) reclaims a backup-bucket
 * object once BOTH its primary R2 object is absent AND its `media` row is gone. It is the INVERSE of
 * the orphan sweep and the ONLY job that deletes from the last-resort backup copy, so it carries the
 * same "one bad run wipes everything" risk: any fault that empties or decimates the source (a bad
 * migration, a snapshot restore, a mass row-delete) would make nearly every backup look prunable.
 *
 * This is the pure decision the prune consults right before its bulk delete. It runs APP-SIDE (the
 * confirm endpoint already has the authoritative `media` row count) and fails CLOSED: when the source
 * looks pathological the prune deletes NOTHING this run and a human is alerted. The deliberate failure
 * mode is a backup storage LEAK (objects briefly not reclaimed) — trivially fixed on a later run once
 * the DB is healthy — which is vastly preferable to deleting the only remaining copies.
 *
 * Sibling of evaluateOrphanSweep (src/lib/r2/orphan-guard.ts) by DESIGN, not shared code, and with one
 * deliberate difference: the orphan sweep's `fraction_cap` is OMITTED here. For an accrue-only backup
 * the "source is gone" fraction is legitimately large and GROWING as media churns, so a fraction cap
 * would mis-fire and permanently wedge the prune. The catastrophic case is the same `media_table_empty`
 * trip; per-run volume is instead bounded by a CLAMP the backup Worker applies as it accumulates
 * confirmed-gone candidates across batches (PRUNE_DELETE_CAP_PER_RUN in workers/backup), never a trip.
 *
 * Kept pure (no I/O) so it is unit-tested with fixtures.
 */

export type PruneBreakerReason = "media_table_empty";

export type PruneGuardInput = {
  /** Total rows in `media` (any status). 0 while candidates exist == the source lost its rows. */
  mediaCount: number;
  /** Backup objects this run confirmed gone (primary object absent AND media row gone) — the delete set. */
  candidateCount: number;
};

export type PruneGuardResult = {
  trip: boolean;
  reason: PruneBreakerReason | null;
};

/** Decide whether the backup prune should ABORT (delete nothing) this run. */
export function evaluatePrune(input: PruneGuardInput): PruneGuardResult {
  const { mediaCount, candidateCount } = input;

  // Nothing confirmed gone -> nothing to guard. Never trip on an empty candidate set, even if the
  // media table is also empty (a brand-new / fully-purged source): there is simply no action to block.
  if (candidateCount === 0) return { trip: false, reason: null };

  // Candidates exist but the media table is empty: the source is in a bad state (lost rows /
  // mid-restore / a query returning none), NOT "every backup is genuinely prunable". The canonical
  // catastrophic case — and exactly today's pre-launch 0-row state, which is why the prune also ships
  // in dry-run until a human flips it live.
  if (mediaCount === 0) return { trip: true, reason: "media_table_empty" };

  // Otherwise proceed. Two independent sources already had to agree an object was gone (primary
  // object absent AND row gone) for it to become a candidate, and the backup Worker clamps the per-run
  // delete set so a single run can never exceed its cap.
  return { trip: false, reason: null };
}
