/**
 * An in-memory stand-in for an R2 bucket, for the prune's and the restore's tests: `list`, `head`, `get`, `put` and
 * `delete` the way R2 answers them (a listing is lexicographic, at most 1,000 keys a page, `startAfter` exclusive,
 * `truncated` while more remain; a missing key HEADs and GETs to `null`; a delete of an absent key succeeds; a put
 * whose `onlyIf` fails stores nothing and answers `null`), and a record of every call, so a test can say what the
 * prune read, what it asked about and what it never touched.
 *
 * Its levers stage what R2 cannot be made to do on demand: `failHead`, `failGet` and `failPut` (a call that throws,
 * as an outage would), `hiddenFromList` (a key the listing does not show but a HEAD finds: an object restored between
 * the listing and the delete), `appearOnPut` (an object some other writer puts at the key between a HEAD and the
 * put, so only the put's own condition can refuse it), and `lock` (the Bucket Lock: a delete of a key younger than
 * the lock is a silent no-op that still succeeds, exactly as R2 answers it, recorded so a test can prove the prune
 * never tried).
 *
 * ★ THE PUT'S CONDITION IS READ THE WAY R2 READS IT (developers.cloudflare.com/r2/api/workers/workers-api-reference,
 * "Conditional operations", read 2026-10-05): a `Headers` with `If-None-Match: *` (RFC 7232: only when nothing is
 * stored at the key), or an `R2Conditional` whose `etagDoesNotMatch` is `*` or the stored etag. Anything it does not
 * understand throws rather than passes, so a test can never prove a condition R2 would read another way.
 */
export type FakeObject = {
  key: string;
  uploaded: Date;
  /** Bytes, for a GET's body and a HEAD's size (0 when a fixture never says). */
  size?: number;
  contentType?: string;
};

export type FakeR2Call =
  | { op: "list"; prefix: string; startAfter?: string; limit: number }
  | { op: "head"; key: string }
  | { op: "get"; key: string }
  | {
      op: "put";
      key: string;
      size: number;
      contentType?: string;
      /** What the put's condition was, as written: `if-none-match: *`, or none. */
      condition: string | null;
      stored: boolean;
    }
  | { op: "delete"; keys: string[] };

/** What a GET answers: the object's facts and a body of `size` bytes. */
export type FakeBody = {
  key: string;
  size: number;
  uploaded: Date;
  etag: string;
  httpMetadata: { contentType?: string };
  customMetadata: Record<string, string>;
  body: ReadableStream<Uint8Array>;
};

export type FakePutOptions = {
  onlyIf?: Headers | { etagDoesNotMatch?: string; etagMatches?: string };
  httpMetadata?: { contentType?: string } | Headers;
  customMetadata?: Record<string, string>;
};

export type FakeR2 = {
  objects: Map<string, FakeObject>;
  calls: FakeR2Call[];
  failHead: Set<string>;
  failGet: Set<string>;
  failPut: Set<string>;
  hiddenFromList: Set<string>;
  /** Keys another writer fills between this test's HEAD and its put: the put's own condition must refuse them. */
  appearOnPut: Set<string>;
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
  get(key: string): Promise<FakeBody | null>;
  put(
    key: string,
    value: ReadableStream | ArrayBuffer | string | null,
    options?: FakePutOptions,
  ): Promise<FakeObject | null>;
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
    failGet: new Set(),
    failPut: new Set(),
    hiddenFromList: new Set(),
    appearOnPut: new Set(),
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
    async get(key) {
      bucket.calls.push({ op: "get", key });
      if (bucket.failGet.has(key)) throw new Error("R2 is unavailable");
      const obj = bucket.objects.get(key);
      if (!obj) return null;
      const size = obj.size ?? 0;
      return {
        key,
        size,
        uploaded: obj.uploaded,
        etag: etagOf(obj),
        httpMetadata: obj.contentType ? { contentType: obj.contentType } : {},
        customMetadata: {},
        body: bodyOf(size),
      };
    },
    async put(key, value, options = {}) {
      if (bucket.appearOnPut.has(key)) {
        bucket.appearOnPut.delete(key);
        bucket.objects.set(key, {
          key,
          uploaded: new Date(bucket.nowMs),
          size: 1,
        });
      }
      const condition = conditionOf(options.onlyIf);
      const existing = bucket.objects.get(key);
      const size = await sizeOf(value);
      const contentType = contentTypeOf(options.httpMetadata);
      if (bucket.failPut.has(key)) {
        bucket.calls.push({
          op: "put",
          key,
          size,
          contentType,
          condition,
          stored: false,
        });
        throw new Error("R2 is unavailable");
      }
      const passes =
        condition === null ||
        existing === undefined ||
        // `If-None-Match: <etag>` refuses only the object holding that etag.
        (condition !== "*" && condition !== etagOf(existing));
      bucket.calls.push({
        op: "put",
        key,
        size,
        contentType,
        condition,
        stored: passes,
      });
      if (!passes) return null;
      const stored: FakeObject = {
        key,
        uploaded: new Date(bucket.nowMs),
        size,
        ...(contentType ? { contentType } : {}),
      };
      bucket.objects.set(key, stored);
      return stored;
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

/** Exactly `size` bytes, pulled a chunk at a time (a test never GETs an object larger than a few megabytes). */
function bodyOf(size: number): ReadableStream<Uint8Array> {
  let left = size;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (left <= 0) {
        controller.close();
        return;
      }
      const n = Math.min(left, 64 * 1024);
      left -= n;
      controller.enqueue(new Uint8Array(n));
    },
  });
}

/** A stable etag per object, so a condition naming one can be judged. */
function etagOf(obj: FakeObject): string {
  return `etag-${obj.key.length}-${obj.size ?? 0}-${obj.uploaded.getTime()}`;
}

/** The put's condition as R2 reads it, or a throw for anything this fake would have to guess at. */
function conditionOf(onlyIf: FakePutOptions["onlyIf"]): string | null {
  if (onlyIf === undefined) return null;
  if (onlyIf instanceof Headers) {
    const entries = [...onlyIf.entries()];
    if (entries.length === 1 && entries[0][0] === "if-none-match") {
      return entries[0][1].trim();
    }
    throw new Error(
      `the fake reads only If-None-Match, not ${JSON.stringify(entries)}`,
    );
  }
  if (
    onlyIf.etagMatches === undefined &&
    onlyIf.etagDoesNotMatch !== undefined
  ) {
    return onlyIf.etagDoesNotMatch;
  }
  throw new Error("the fake reads only etagDoesNotMatch");
}

async function sizeOf(
  value: ReadableStream | ArrayBuffer | string | null,
): Promise<number> {
  if (value === null) return 0;
  if (typeof value === "string") return value.length;
  if (value instanceof ArrayBuffer) return value.byteLength;
  // A stream is read whole, as a put reads it: what the source GET handed over is what lands.
  let n = 0;
  const reader = value.getReader();
  for (;;) {
    const { done, value: chunk } = await reader.read();
    if (done) return n;
    n += (chunk as Uint8Array).byteLength;
  }
}

function contentTypeOf(
  meta: FakePutOptions["httpMetadata"],
): string | undefined {
  if (!meta) return undefined;
  if (meta instanceof Headers) return meta.get("content-type") ?? undefined;
  return meta.contentType;
}

/** The keys a fake was asked to HEAD, in order. */
export function headedKeys(bucket: FakeR2): string[] {
  return bucket.calls.flatMap((c) => (c.op === "head" ? [c.key] : []));
}

/** Every list call's `startAfter`, in order (undefined is the head of the listing). */
export function listStarts(bucket: FakeR2): (string | undefined)[] {
  return bucket.calls.flatMap((c) => (c.op === "list" ? [c.startAfter] : []));
}

/** Every put the fake took, in order, with whether it stored. */
export function putCalls(bucket: FakeR2) {
  return bucket.calls.flatMap((c) => (c.op === "put" ? [c] : []));
}
