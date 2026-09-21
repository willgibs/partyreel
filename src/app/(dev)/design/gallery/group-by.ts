/**
 * Group items by a key in FIRST-APPEARANCE order, every item of a key merged
 * into its one group wherever it sits in the input. Two pages grew the same
 * bug from a consecutive-run scan (a group per run, one key twice, React
 * refusing the duplicate): the library index by directory (2026-09-20) and the
 * components gallery by section the same night. One rule, one home.
 */
export function groupByKey<T>(items: readonly T[], keyOf: (item: T) => string): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }
  return [...groups.entries()];
}
