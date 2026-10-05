/**
 * ★ A COMPLETE WHOSE ANSWER WAS LOST, SENT AGAIN (uploads-idempotent). The phone's Try again after a dropped or timed-out
 * complete sends that very complete again, its media ids and all (`uploader.ts`), never the upload, so the engine has to
 * answer the second request as the one landing the first may already have made. Proved against ONE database, which the
 * two RPCs write and the meter reads: a whole burst its first try recorded answers `recorded` file by file; a partial
 * one (its database went away mid-burst) answers those `recorded` and lands the rest; a multipart its first try
 * assembled and never recorded lands as assembled; a host's batch alike through her own route. ★ In every case no row
 * is written twice and the month moves by each file's bytes once, read as the meter reads it (`uploads_used`).
 * The REAL routes and engine run; the RPC wrappers, R2 and the Supabase clients are the stubbed edges, and the database
 * and the bucket are small fakes the stubs share.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUploadContext = vi.fn();
const getUser = vi.fn();
const captureUploadForensics = vi.fn();
const copyObject = vi.fn();
const deleteR2Objects = vi.fn();
const completeMultipartUpload = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, getAll: () => [] }),
}));
vi.mock("@/lib/upload/server-pipeline-meter", () => ({
  meterUpload: vi.fn(),
}));
vi.mock("@/lib/db/mutations/guest", () => ({
  getUploadContext: (...args: unknown[]) => getUploadContext(...args),
  createMedia: (input: Write) => db.write(input),
}));
vi.mock("@/lib/db/mutations/host-media", () => ({
  createMediaAsHost: (input: Write) => db.write(input),
}));
vi.mock("@/lib/events/upload-lock", () => ({
  mayUploadPastLock: async () => true,
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: vi.fn(),
  captureError: vi.fn(),
}));
vi.mock("@/lib/forensics/capture", () => ({
  captureUploadForensics: (...args: unknown[]) =>
    captureUploadForensics(...args),
}));
vi.mock("@/lib/r2/presign", () => ({
  presignUpload: vi.fn(),
  presignUploadPart: vi.fn(),
  createMultipartUpload: vi.fn(),
  abortMultipartUpload: vi.fn(),
  sumMultipartParts: async ({ uploadId }: { uploadId: string }) =>
    bucket.partsOf(uploadId),
  completeMultipartUpload: (...args: unknown[]) =>
    completeMultipartUpload(...args),
  headObject: async ({ key }: { key: string }) => bucket.head(key),
  headObjectSize: async ({ key }: { key: string }) => {
    const head = bucket.head(key);
    if (!head) throw new Error(`NotFound: ${key}`);
    return head.size;
  },
  copyObject: (...args: unknown[]) => copyObject(...args),
}));
vi.mock("@/lib/r2/delete", () => ({
  deleteR2Objects: (...args: unknown[]) => deleteR2Objects(...args),
}));
vi.mock("@/lib/upload/server-pipeline-recorded", () => ({
  readRecordedUpload: async (id: string) => db.read(id),
}));
// The guest ticket's owner (`checkSessionOwner`) reads its row on the admin client: a name-only ticket.
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { user_id: null, verified_at: null },
            error: null,
          }),
        }),
      }),
    }),
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: () => getUser() },
    rpc: async () => ({ data: 0, error: null }),
  }),
}));
vi.mock("@/lib/security/abuse-rate-limit-store", () => ({
  abuseHashes: () => ({ ipHash: "ip", scopeHash: "scope" }),
  checkAbuseRate: async () => ({ allowed: true }),
  recordAbuseEvent: async () => {},
}));

const guest = await import("@/app/api/r2/complete-upload/route");
const host = await import("@/app/api/host/r2/complete-upload/route");

const TOKEN = "a".repeat(64);
const HOST = "11111111-1111-4111-8111-111111111111";
const EVENT = "33333333-3333-4333-8333-333333333333";
const IDS = [
  "44444444-4444-4444-8444-444444444441",
  "44444444-4444-4444-8444-444444444442",
  "44444444-4444-4444-8444-444444444443",
];
/** The n-th file of a burst holds n,000 bytes in R2. */
const SIZES = [1000, 2000, 3000];
const keyOf = (id: string, kind = "photo", ext = "jpg") =>
  `events/${EVENT}/${kind}/${id}/original.${ext}`;
const stagedOf = (key: string) => key.replace(/^events\//, "staging/");

/** What a `create_media*` stub is handed (the fields the fake database reads). */
type Write = { mediaId: string; originalKey: string; fileSizeBytes: number };

/**
 * THE DATABASE BOTH RPCS WRITE AND THE METER READS: one row an id, and the host's month. A write is `create_media*`'s
 * one transaction (the insert, then the month), so a duplicate id counts nothing and answers as the wrapper maps
 * Postgres's 23505 (`idempotent`); while `down`, a write fails as the wrapper reads a database it cannot reach
 * (`unknown`, written or not as `committed` says: its answer lost on the way back).
 */
const db = {
  rows: new Map<string, { originalKey: string; bytes: number }>(),
  month: 0,
  down: null as null | { committed: boolean; ids: Set<string> },
  writes: 0,
  write({ mediaId, originalKey, fileSizeBytes }: Write) {
    this.writes += 1;
    const down = this.down?.ids.has(mediaId) ? this.down : null;
    if (down && !down.committed) {
      return {
        ok: false,
        code: "unknown",
        message: "Couldn't save the upload. Please try again.",
      };
    }
    if (this.rows.has(mediaId)) {
      return { ok: true, data: { idempotent: true } };
    }
    this.rows.set(mediaId, { originalKey, bytes: fileSizeBytes });
    this.month += fileSizeBytes;
    if (down) {
      return {
        ok: false,
        code: "unknown",
        message: "Couldn't save the upload. Please try again.",
      };
    }
    return { ok: true, data: { media_id: mediaId, status: "approved" } };
  },
  read(id: string) {
    const row = this.rows.get(id);
    return row ? { originalKey: row.originalKey } : null;
  },
};
/** `uploads_used`: the month's bytes, the one read the meter (and every advisory) asks before it admits a presign. */
const uploadsUsed = () => db.month;

/**
 * THE BUCKET: each file's staged single PUT (a day's lifecycle away from gone), what the complete copied into
 * `events/`, and the multiparts still open, by upload id. Assembling one moves it to its key and lets the upload go,
 * as R2 does (a second ListParts or CompleteMultipartUpload of it fails `NoSuchUpload`).
 */
const bucket = {
  objects: new Map<string, number>(),
  open: new Map<string, { key: string; bytes: number }>(),
  head(key: string) {
    const size = this.objects.get(key);
    return size === undefined ? null : { size, lastModified: null };
  },
  partsOf(uploadId: string) {
    const up = this.open.get(uploadId);
    if (!up)
      throw Object.assign(new Error("NoSuchUpload"), { name: "NoSuchUpload" });
    return up.bytes;
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  db.rows.clear();
  db.month = 0;
  db.down = null;
  db.writes = 0;
  bucket.objects.clear();
  bucket.open.clear();
  IDS.forEach((id, i) => bucket.objects.set(stagedOf(keyOf(id)), SIZES[i]!));
  getUploadContext.mockResolvedValue({
    ok: true,
    data: {
      event_id: EVENT,
      accepting_uploads: true,
      event_deleted: false,
      visibility: "open",
      require_verified_email: false,
      guest_verified: false,
    },
  });
  // A guest's phone is signed in to nothing (her ticket is her capability); the host's describe signs her in.
  getUser.mockResolvedValue({ data: { user: null } });
  copyObject.mockImplementation(
    async (a: { sourceKey: string; destinationKey: string }) => {
      const size = bucket.objects.get(a.sourceKey);
      if (size === undefined) throw new Error(`NoSuchKey: ${a.sourceKey}`);
      bucket.objects.set(a.destinationKey, size);
    },
  );
  deleteR2Objects.mockImplementation(async (keys: string[]) => {
    for (const k of keys) bucket.objects.delete(k);
    return { deleted: keys.length, errored: [] };
  });
  completeMultipartUpload.mockImplementation(
    async (a: { key: string; uploadId: string }) => {
      const up = bucket.open.get(a.uploadId);
      if (!up)
        throw Object.assign(new Error("NoSuchUpload"), {
          name: "NoSuchUpload",
        });
      bucket.open.delete(a.uploadId);
      bucket.objects.set(a.key, up.bytes);
    },
  );
});

/** A landed photograph's entry, as the phone sends it (and sends again, unchanged, on its Try again). */
const entry = (id: string) => ({
  media_id: id,
  key: keyOf(id),
  content_type: "image/jpeg",
  size_bytes: 1,
  upload_id: null,
  parts: [],
});

type FileAnswer = { ok: boolean; status?: number | string; code?: string };

async function send(
  route: { POST: (r: Request) => Promise<Response> },
  identity: Record<string, string>,
  files: unknown[],
) {
  const res = await route.POST(
    new Request("https://partyreel.com/api/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...identity, files }),
    }),
  );
  const body = (await res.json()) as { files?: FileAnswer[] };
  return body.files ?? [];
}
const guestBurst = (files: unknown[]) =>
  send(guest, { session_token: TOKEN }, files);
const hostBatch = (files: unknown[]) => send(host, { event_id: EVENT }, files);

const SUM = SIZES.reduce((a, b) => a + b, 0);
const RECORDED = { ok: true, status: "recorded" };

describe("★ a guest's burst, its answer lost, sent again", () => {
  it("every file answers `recorded` from its row: no row written twice, the month moved once", async () => {
    const first = await guestBurst(IDS.map(entry));
    expect(first.every((f) => f.ok && f.status === "approved")).toBe(true);
    expect(uploadsUsed()).toBe(SUM);
    const copies = copyObject.mock.calls.length;

    const again = await guestBurst(IDS.map(entry));
    expect(again).toEqual([RECORDED, RECORDED, RECORDED]);
    expect(db.rows.size).toBe(3);
    expect(db.writes).toBe(3);
    expect(uploadsUsed()).toBe(SUM);
    // Answered before anything moved: nothing copied again, nothing taken back out, no second forensic record.
    expect(copyObject).toHaveBeenCalledTimes(copies);
    expect(deleteR2Objects).not.toHaveBeenCalled();
    expect(captureUploadForensics).toHaveBeenCalledTimes(3);
  });

  it("★ a partial burst (its database went away after the first file): the replay answers it `recorded` and lands the rest, each once", async () => {
    db.down = { committed: false, ids: new Set(IDS.slice(1)) };
    const first = await guestBurst(IDS.map(entry));
    expect(first.map((f) => f.ok)).toEqual([true, false, false]);
    expect(first[1]).toMatchObject({ code: "unknown" });
    expect(db.rows.size).toBe(1);
    expect(uploadsUsed()).toBe(SIZES[0]);

    db.down = null;
    const again = await guestBurst(IDS.map(entry));
    expect(again).toEqual([
      RECORDED,
      { ok: true, status: "approved" },
      { ok: true, status: "approved" },
    ]);
    expect(db.rows.size).toBe(3);
    expect(uploadsUsed()).toBe(SUM);
    // The two that landed now landed from their staged twins, each written once.
    expect([...db.rows.keys()]).toEqual(IDS);
  });

  it("a write that committed while its answer was lost on the way back is the row's, then and on the replay", async () => {
    db.down = { committed: true, ids: new Set([IDS[1]!]) };
    const first = await guestBurst(IDS.map(entry));
    // The engine reads the row before it takes anything out: the upload IS recorded, and says so.
    expect(first).toEqual([
      { ok: true, status: "approved" },
      RECORDED,
      { ok: true, status: "approved" },
    ]);
    expect(deleteR2Objects).not.toHaveBeenCalled();

    db.down = null;
    expect(await guestBurst(IDS.map(entry))).toEqual([
      RECORDED,
      RECORDED,
      RECORDED,
    ]);
    expect(db.rows.size).toBe(3);
    expect(uploadsUsed()).toBe(SUM);
  });
});

describe("★ a multipart its first try assembled and never recorded", () => {
  const CLIP = IDS[0]!;
  const CLIP_KEY = keyOf(CLIP, "video", "mp4");
  const BYTES = 150 * 1024 * 1024;
  const clip = {
    media_id: CLIP,
    key: CLIP_KEY,
    content_type: "video/mp4",
    size_bytes: BYTES,
    upload_id: "upload-1",
    parts: [
      { partNumber: 1, eTag: '"e1"' },
      { partNumber: 2, eTag: '"e2"' },
    ],
  };

  beforeEach(() => {
    bucket.open.set("upload-1", { key: CLIP_KEY, bytes: BYTES });
  });

  it("lands as assembled on the replay, its HEAD the size: one row, the month once", async () => {
    db.down = { committed: false, ids: new Set([CLIP]) };
    const first = await guestBurst([clip]);
    expect(first[0]).toMatchObject({ ok: false, code: "unknown" });
    // R2 holds it assembled, and no row names it.
    expect(bucket.head(CLIP_KEY)?.size).toBe(BYTES);
    expect(bucket.open.size).toBe(0);
    expect(db.rows.size).toBe(0);

    db.down = null;
    const again = await guestBurst([clip]);
    expect(again).toEqual([{ ok: true, status: "approved" }]);
    expect(completeMultipartUpload).toHaveBeenCalledTimes(1);
    expect(db.rows.get(CLIP)).toEqual({ originalKey: CLIP_KEY, bytes: BYTES });
    expect(uploadsUsed()).toBe(BYTES);
  });

  it("with nothing at its key the failure stands, said as one a replay may still settle (a twin assembling it)", async () => {
    bucket.open.clear();
    const res = await guestBurst([clip]);
    expect(res[0]).toMatchObject({
      ok: false,
      status: 502,
      code: "complete_failed",
    });
    expect(db.writes).toBe(0);
  });

  it("recorded by its first try, the replay is its row's and R2 is never asked to assemble it twice", async () => {
    expect(await guestBurst([clip])).toEqual([
      { ok: true, status: "approved" },
    ]);
    expect(await guestBurst([clip])).toEqual([RECORDED]);
    expect(completeMultipartUpload).toHaveBeenCalledTimes(1);
    expect(uploadsUsed()).toBe(BYTES);
  });
});

describe("★ a host's batch, its answer lost, sent again", () => {
  beforeEach(() => {
    getUser.mockResolvedValue({ data: { user: { id: HOST } } });
  });

  it("answers `recorded` for each file through her own route: no row twice, her month once", async () => {
    const first = await hostBatch(IDS.map(entry));
    expect(first.every((f) => f.ok && f.status === "approved")).toBe(true);
    const again = await hostBatch(IDS.map(entry));
    expect(again).toEqual([RECORDED, RECORDED, RECORDED]);
    expect(db.rows.size).toBe(3);
    expect(db.writes).toBe(3);
    expect(uploadsUsed()).toBe(SUM);
  });

  it("a partial batch lands its rest on the replay, each once", async () => {
    db.down = { committed: false, ids: new Set([IDS[2]!]) };
    await hostBatch(IDS.map(entry));
    expect(db.rows.size).toBe(2);
    db.down = null;
    expect(await hostBatch(IDS.map(entry))).toEqual([
      RECORDED,
      RECORDED,
      { ok: true, status: "approved" },
    ]);
    expect(db.rows.size).toBe(3);
    expect(uploadsUsed()).toBe(SUM);
  });
});
