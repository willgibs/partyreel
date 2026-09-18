/**
 * Legal-hold exclusion predicates (trust-safety-forensics.md). Pure, so the purge sweeps' hold behavior is
 * unit-tested with fixtures. The invariant these serve: HELD MEDIA IS NEVER HARD-DELETED —
 * neither its DB row (purge_media_rows also refuses held ids at the SQL choke point) nor its R2
 * object (every caller deletes R2 FIRST, so each must filter held items before building its
 * delete-key list; a TS slip would otherwise destroy the object while the SQL guard saves only
 * the row).
 *
 * The enumerated hard-delete paths and how each excludes holds:
 *   - removed_media sweep + standby eviction + purgeMediaNow → filter `legal_hold_at is null`
 *     on the candidate query (these helpers back the pure part).
 *   - expired_events sweep → an event containing ANY held media is SKIPPED WHOLE (deleting the
 *     event row would FK-CASCADE the held media rows away, and its R2 enumeration would delete
 *     the held objects). The event stays soft-deleted in the bin until the hold releases.
 *   - orphan sweep → needs no change: held media HAS a row, so it is never an orphan; the
 *     preservation prefix isn't under `events/` and its keys parse to null ("not ours").
 *   - backup-prune Worker → naturally safe: its dual-gate reclaims a backup object only when the
 *     primary object is absent AND the media row is gone; a held item deletes neither, so the
 *     backup copy is never a prune candidate. (Verified against workers/backup's confirm flow +
 *     src/lib/r2/prune-guard.ts — no Worker change needed.)
 *   - over-capacity auto-reduce → intentionally NOT excluded: it only soft-removes (status =
 *     'removed'); the hard delete it feeds is the removed_media sweep, which excludes holds.
 */

export type LegalHoldRow = { legal_hold_at: string | null };

export function isUnderLegalHold(row: LegalHoldRow): boolean {
  return row.legal_hold_at !== null;
}

/** Drop held rows from a hard-delete candidate set (the R2-key builders consume the result). */
export function excludeHeld<T extends LegalHoldRow>(rows: T[]): T[] {
  return rows.filter((r) => !isUnderLegalHold(r));
}

/**
 * Split expired-event ids into purgeable vs hold-blocked given the held media found among them.
 * Blocked events keep their ENTIRE media set (FK cascade is all-or-nothing) and re-enter the
 * sweep on a later run once the hold releases.
 */
export function partitionEventsByHold(
  eventIds: string[],
  heldMedia: { event_id: string }[],
): { purgeable: string[]; blocked: string[] } {
  const blockedSet = new Set(heldMedia.map((m) => m.event_id));
  const purgeable: string[] = [];
  const blocked: string[] = [];
  for (const id of eventIds) {
    (blockedSet.has(id) ? blocked : purgeable).push(id);
  }
  return { purgeable, blocked };
}
