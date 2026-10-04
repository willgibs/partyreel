/**
 * An in-memory stand-in for an R2 bucket, for the prune's tests: `list`, `head` and `delete` the way R2 answers
 * them (a listing is lexicographic, at most 1,000 keys a page, `startAfter` exclusive, `truncated` while more
 * remain; a missing key HEADs to `null`; a delete of an absent key succeeds), and a record of every call, so a test
 * can say what the prune read, what it asked about and what it never touched.
 *
 * Three levers stage what R2 cannot be made to do on demand: `failHead` (a HEAD that throws, as an outage would),
 * `hiddenFromList` (a key the listing does not show but a HEAD finds: an object restored between the listing and
 * the delete), and `lock` (the Bucket Lock: a delete of a key younger than the lock is a silent no-op that still
 * succeeds, exactly as R2 answers it, recorded so a test can prove the prune never tried).
 */
export type FakeObject = { key: string; uploaded: Date };

export type FakeR2Call =
  | { op: "list"; prefix: string; startAfter?: string; limit: number }
  | { op: "head"; key: string }
  | { op: "delete"; keys: string[] };

export type FakeR2 = {
  objects: Map<string, FakeObject>;
  calls: FakeR2Call[];
  failHead: Set<string>;
  hiddenFromList: Set<string>;
  /** The lock window in ms (0 = no lock); `lockedDeletes` records each key a delete left in place. */
  lockMs: number;
  lockedDeletes: string[];
  /** The clock the lock is judged against. */
  nowMs: number;
  /** Cap a page below 1,000, as R2 may under memory pressure. */
  pageCap: number;
  list(options: {
    prefix: string;
    startAfter?: string;
    limit: number;
  }): Promise<{ objects: FakeObject[]; truncated: boolean }>;
  head(key: string): Promise<FakeObject | null>;
  delete(keys: string[]): Promise<void>;
};

export function createFakeR2(
  objects: readonly FakeObject[] = [],
  opts: { nowMs?: number; lockMs?: number } = {},
): FakeR2 {
  const bucket: FakeR2 = {
    objects: new Map(objects.map((o) => [o.key, o])),
    calls: [],
    failHead: new Set(),
    hiddenFromList: new Set(),
    lockMs: opts.lockMs ?? 0,
    lockedDeletes: [],
    nowMs: opts.nowMs ?? Date.now(),
    pageCap: 1000,
    async list({ prefix, startAfter, limit }) {
      bucket.calls.push({ op: "list", prefix, startAfter, limit });
      const keys = [...bucket.objects.keys()]
        .filter((k) => k.startsWith(prefix))
        .filter((k) => !bucket.hiddenFromList.has(k))
        .filter((k) => startAfter === undefined || k > startAfter)
        .sort();
      const take = Math.min(limit, 1000, bucket.pageCap);
      const page = keys.slice(0, take);
      return {
        objects: page.map((k) => bucket.objects.get(k)!),
        truncated: keys.length > take,
      };
    },
    async head(key) {
      bucket.calls.push({ op: "head", key });
      if (bucket.failHead.has(key)) throw new Error("R2 is unavailable");
      return bucket.objects.get(key) ?? null;
    },
    async delete(keys) {
      if (keys.length > 1000)
        throw new Error("R2 deletes at most 1,000 keys a call");
      bucket.calls.push({ op: "delete", keys: [...keys] });
      for (const key of keys) {
        const obj = bucket.objects.get(key);
        if (!obj) continue;
        if (
          bucket.lockMs > 0 &&
          bucket.nowMs - obj.uploaded.getTime() < bucket.lockMs
        ) {
          bucket.lockedDeletes.push(key);
          continue;
        }
        bucket.objects.delete(key);
      }
    },
  };
  return bucket;
}

/** The keys a fake was asked to HEAD, in order. */
export function headedKeys(bucket: FakeR2): string[] {
  return bucket.calls.flatMap((c) => (c.op === "head" ? [c.key] : []));
}

/** Every list call's `startAfter`, in order (undefined is the head of the listing). */
export function listStarts(bucket: FakeR2): (string | undefined)[] {
  return bucket.calls.flatMap((c) => (c.op === "list" ? [c.startAfter] : []));
}
