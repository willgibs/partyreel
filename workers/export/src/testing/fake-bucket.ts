/**
 * An in-memory stand-in for the PRIMARY R2 bucket, for the Worker's tests: `get`, `head` and `list`
 * the way R2 answers them (a missing key is `null`, a listing is lexicographic, a thousand keys a
 * page at most, with a cursor while it is truncated), and a record of every call, so a test can say
 * what the Worker read and what it never touched.
 */
export type BucketCall = { op: "get" | "head" | "list"; key: string };

export type FakeBucket = {
  objects: Map<string, Uint8Array>;
  calls: BucketCall[];
  /** Make every call throw, as an R2 outage would. */
  failing: boolean;
  get(
    key: string,
  ): Promise<{ body: ReadableStream<Uint8Array>; size: number } | null>;
  head(key: string): Promise<{ key: string; size: number } | null>;
  list(options: {
    prefix: string;
    cursor?: string;
    limit?: number;
  }): Promise<{
    objects: { key: string; size: number }[];
    truncated: boolean;
    cursor?: string;
  }>;
};

export function createFakeBucket(
  entries: Record<string, string | Uint8Array> = {},
): FakeBucket {
  const enc = new TextEncoder();
  const objects = new Map<string, Uint8Array>(
    Object.entries(entries).map(([k, v]) => [
      k,
      typeof v === "string" ? enc.encode(v) : v,
    ]),
  );
  const bucket: FakeBucket = {
    objects,
    calls: [],
    failing: false,
    async get(key) {
      bucket.calls.push({ op: "get", key });
      if (bucket.failing) throw new Error("R2 is unavailable");
      const bytes = objects.get(key);
      if (!bytes) return null;
      return { body: new Blob([bytes]).stream(), size: bytes.byteLength };
    },
    async head(key) {
      bucket.calls.push({ op: "head", key });
      if (bucket.failing) throw new Error("R2 is unavailable");
      const bytes = objects.get(key);
      return bytes ? { key, size: bytes.byteLength } : null;
    },
    async list({ prefix, cursor, limit = 1000 }) {
      bucket.calls.push({ op: "list", key: prefix });
      if (bucket.failing) throw new Error("R2 is unavailable");
      const keys = [...objects.keys()]
        .filter((k) => k.startsWith(prefix))
        .sort();
      const start = cursor ? Number(cursor) : 0;
      const page = keys.slice(start, start + limit);
      const truncated = start + limit < keys.length;
      return {
        objects: page.map((key) => ({
          key,
          size: objects.get(key)!.byteLength,
        })),
        truncated,
        cursor: truncated ? String(start + limit) : undefined,
      };
    },
  };
  return bucket;
}
