/**
 * Pure largest-first selection for over-capacity auto-reduce. Given a host's ACTIVE
 * media (status<>'removed', in live events) and the storage cap, returns the ids to
 * soft-remove — biggest files first — until the remaining active bytes fit under the
 * cap. Removing the largest first minimizes how many items we touch. Pure (no I/O) so
 * the cron's destructive decision is unit-tested.
 */
export function selectForAutoReduce(
  media: { id: string; file_size_bytes: number }[],
  capBytes: number,
): string[] {
  let active = media.reduce((sum, m) => sum + m.file_size_bytes, 0);
  if (active <= capBytes) return [];

  const remove: string[] = [];
  for (const m of [...media].sort(
    (a, b) => b.file_size_bytes - a.file_size_bytes,
  )) {
    if (active <= capBytes) break;
    remove.push(m.id);
    active -= m.file_size_bytes;
  }
  return remove;
}
