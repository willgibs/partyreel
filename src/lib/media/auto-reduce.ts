/** One active item as the reduce weighs it. */
export type ReduceItem = { id: string; file_size_bytes: number };

/**
 * Pure largest-first selection for over-capacity auto-reduce, ONE PAGE AT A TIME. Given a page of a host's
 * ACTIVE media (status <> 'removed', in live events), the bytes still active across the host's WHOLE active
 * set, and the storage cap, it returns the page's ids to soft-remove, biggest files first, until what is left
 * fits under the cap, and the active bytes left after them. Removing the largest first minimizes how many
 * items we touch.
 *
 * ★ PAGED (crumbs-37). The reduce reads the active set largest first a page at a time (`reduceToCap`,
 * src/lib/lifecycle/sweeps/over-capacity.ts), in this function's order (size descending, then id
 * ascending), so it stops reading once what is left fits and can stop at its deadline between pages; walking
 * the pages in order through here removes exactly the items one sort of the whole set would (a whole set is a
 * page of one). Pure (no I/O) so the cron's destructive decision is unit-tested.
 */
export function takeLargestFirst(
  page: readonly ReduceItem[],
  activeBytes: number,
  capBytes: number,
): { ids: string[]; activeBytes: number } {
  const ids: string[] = [];
  let active = activeBytes;
  for (const m of [...page].sort(largestFirst)) {
    if (active <= capBytes) break;
    ids.push(m.id);
    active -= m.file_size_bytes;
  }
  return { ids, activeBytes: active };
}

/** The reduce's one order: the biggest file first, ties by id ascending (the reads' keyset order). */
export function largestFirst(a: ReduceItem, b: ReduceItem): number {
  return (
    b.file_size_bytes - a.file_size_bytes ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
}
