/**
 * WHICH LONE KEYS A LIVE ROW STILL NAMES: the one question the Worker asks the app before it counts a key as held by
 * the backup alone, or copies one back (durability-backups.md, "The restore"). The Worker cannot reach the database,
 * so the prune's confirm route answers it (src/app/api/internal/backup-prune/route.ts, its `loneKeys` shape): a key is
 * named when its media row exists and holds that exact key as its original, its preview or its phone copy.
 *
 * WHY A KEY, NOT AN ITEM: a row can outlive one of its objects on purpose. A phone copy over its cap is deleted at the
 * upload's complete and the row recorded without it, after the backup already took a copy; restoring that key would
 * put back an object no row names, which no sweep would ever reclaim (the orphan sweep keys on the row's id). So the
 * prune counts, and the restore copies, only keys a live row names.
 *
 * PURE: the body the route takes and the answer read strictly, never anything else read as a name.
 */

/** A batch the route takes in one body: its MAX_ROWS, as the prune's own confirm. */
export const NAMED_BATCH = 1000;

export type NamedAnswer =
  | { kind: "named"; named: string[] }
  | { kind: "unavailable"; detail: string };

/** The body that asks. */
export function namedRequest(keys: readonly string[]): { loneKeys: string[] } {
  return { loneKeys: [...keys] };
}

/**
 * The route's answer, read strictly: `{ named: string[] }`, every one a key it was asked about. Anything else is
 * `unavailable`, which names nothing: an answer the Worker cannot read is never read as "a live row names these".
 */
export function readNamedAnswer(
  body: unknown,
  asked: readonly string[],
): NamedAnswer {
  if (body && typeof body === "object" && !Array.isArray(body)) {
    const named = (body as Record<string, unknown>).named;
    if (Array.isArray(named) && named.every((k) => typeof k === "string")) {
      const askedSet = new Set(asked);
      if (named.every((k) => askedSet.has(k as string))) {
        return { kind: "named", named: named as string[] };
      }
      return {
        kind: "unavailable",
        detail: "an answer naming a key it was not asked about",
      };
    }
  }
  return { kind: "unavailable", detail: "an answer of the wrong shape" };
}
