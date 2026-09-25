/**
 * THE CLIENT'S MANIFEST: the whole album as the server's order has it, newest first, each item a
 * five-number tuple (album-wire.ts), and the one operation that ever changes it, `mergeEntries`.
 *
 * ★ EVERY CHANGE IS A MERGE BY ID INTO THE SERVER'S ORDER. A delta's upserts, a manifest page, a
 * resync: each is "these entries are now in the album, these ids are not", applied by id and placed
 * on `(t desc, id desc)` (compareEntries), so applying the same thing twice changes nothing. That is
 * what lets the protocol be generous: a change that commits between the version read and a manifest
 * page arrives twice, once in the page and once in the next delta, and the second is a no-op.
 *
 * ★ COPY ON WRITE. A merge returns a NEW array (the one it was handed is never touched), so a
 * `useSyncExternalStore` snapshot is stable until something actually changed, and a render can
 * compare by reference. A merge is one pass: the untouched entries walk once, the incoming ones are
 * sorted and threaded in (O(n + k log k)), so a 500-change delta into a 10,000-item album costs
 * microseconds, not a splice per item.
 *
 * Pure: no DOM, no React, no fetch.
 */
import {
  compareEntries,
  entryId,
  type ManifestEntry,
} from "@/lib/events/album-wire";

/**
 * `entries` with every id in `remove` and every id in `upsert` taken out, then `upsert` threaded in at
 * its place. `entries` must already be in the album's order (every array this module returns is).
 * The last upsert of an id wins, and a duplicate id in the result is impossible by construction.
 */
export function mergeEntries(
  entries: readonly ManifestEntry[],
  upsert: readonly ManifestEntry[],
  remove: readonly string[] = [],
): ManifestEntry[] {
  if (upsert.length === 0 && remove.length === 0) return entries.slice();

  // The last upsert of an id wins (a page and a delta may both carry one).
  const incoming = new Map<string, ManifestEntry>();
  for (const e of upsert) incoming.set(entryId(e), e);
  const gone = new Set(remove);
  for (const id of gone) incoming.delete(id);

  const add = [...incoming.values()].sort(compareEntries);
  const out: ManifestEntry[] = [];
  let i = 0;
  for (const e of entries) {
    const id = entryId(e);
    if (gone.has(id) || incoming.has(id)) continue;
    while (i < add.length && compareEntries(add[i], e) < 0) out.push(add[i++]);
    out.push(e);
  }
  while (i < add.length) out.push(add[i++]);
  return out;
}

/** The album's order as a check: every neighbour strictly newer than the next, so no id repeats. */
export function isOrdered(entries: readonly ManifestEntry[]): boolean {
  for (let i = 1; i < entries.length; i++) {
    if (compareEntries(entries[i - 1], entries[i]) >= 0) return false;
  }
  return true;
}

/** The ids of a manifest, as a set (membership: "is this item in the album"). */
export function idsOf(entries: readonly ManifestEntry[]): Set<string> {
  return new Set(entries.map(entryId));
}
