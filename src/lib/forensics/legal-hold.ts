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
 *   - expired_events sweep + account deletion → an event containing ANY held media is SKIPPED
 *     WHOLE (deleting the event row would FK-CASCADE the held media rows away, and its R2
 *     enumeration would delete the held objects). The event stays soft-deleted in the bin until
 *     the hold releases. WHICH events hold anything is ONE answer per candidate set, the
 *     `held_event_ids(uuid[])` function's uuid[] (`readHeldEventIds`,
 *     `src/lib/lifecycle/reclaim.ts`), never a list of held rows: a row list stops at PostgREST's
 *     1,000, and an event whose held rows fell past the cut read as purgeable (the 1,000-row
 *     round). Both callers ask again right before the event-row delete, so a hold placed mid-sweep
 *     keeps its event.
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
 * Split candidate event ids into purgeable vs hold-blocked, given the ids among them that hold ANY
 * held media (`held_event_ids`' answer). Blocked events keep their ENTIRE media set (FK cascade is
 * all-or-nothing) and re-enter the sweep on a later run once the hold releases. An id in the held
 * set that is not a candidate changes nothing.
 */
export function partitionEventsByHold(
  eventIds: readonly string[],
  heldEventIds: readonly string[],
): { purgeable: string[]; blocked: string[] } {
  const blockedSet = new Set(heldEventIds);
  const purgeable: string[] = [];
  const blocked: string[] = [];
  for (const id of eventIds) {
    (blockedSet.has(id) ? blocked : purgeable).push(id);
  }
  return { purgeable, blocked };
}
