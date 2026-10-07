/**
 * THE GUEST COMPLETION, HELD TO THE TICKET'S OWNER.
 *
 * A presign outlives a sign-out by up to two hours, so the owner check is asked again at the write
 * that actually credits a photograph to a row. The REAL route, pipeline and owner check run here;
 * the RPC wrappers, R2 and the two Supabase clients are the stubbed edges.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getUploadContext = vi.fn();
const createMedia = vi.fn();
const mayUploadPastLock = vi.fn();
const headObjectSize = vi.fn();
const rowRead = vi.fn();
const getUser = vi.fn();
const checkAbuseRate = vi.fn();
const recordAbuseEvent = vi.fn();
const meterUpload = vi.fn();
const readPartyZone = vi.fn();

vi.mock("server-only", () => ({}));
// The party's zone, read on the complete only for a zoneless wall clock (crumbs-85).
vi.mock("@/lib/event/zone.server", () => ({
  readPartyZone: (...args: unknown[]) => readPartyZone(...args),
}));
// The presign's meter (upload-meter): stubbed only so the complete can be shown never to ask it.
vi.mock("@/lib/upload/server-pipeline-meter", () => ({
  meterUpload: (...args: unknown[]) => meterUpload(...args),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, getAll: () => [] }),
}));
vi.mock("@/lib/db/mutations/guest", () => ({
  getUploadContext: (...args: unknown[]) => getUploadContext(...args),
  createMedia: (...args: unknown[]) => createMedia(...args),
}));
vi.mock("@/lib/events/upload-lock", () => ({
  mayUploadPastLock: (...args: unknown[]) => mayUploadPastLock(...args),
}));
const captureWarning = vi.fn();
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: (...args: unknown[]) => captureWarning(...args),
  captureError: vi.fn(),
}));
vi.mock("@/lib/forensics/capture", () => ({
  captureUploadForensics: vi.fn(),
}));
// The staging landing (upload-meter): a staged single PUT's HEAD, its copy into events/, and the copies a refused
// record takes back out. `headObject` answers null by default (nothing staged), the path a presign made before staging
// takes, so every older case below runs as it always did.
const headObject = vi.fn();
const copyObject = vi.fn();
const sumMultipartParts = vi.fn();
const completeMultipartUpload = vi.fn();
const deleteR2Objects = vi.fn();
vi.mock("@/lib/r2/presign", () => ({
  presignUpload: vi.fn(),
  presignUploadPart: vi.fn(),
  createMultipartUpload: vi.fn(),
  completeMultipartUpload: (...args: unknown[]) =>
    completeMultipartUpload(...args),
  sumMultipartParts: (...args: unknown[]) => sumMultipartParts(...args),
  abortMultipartUpload: vi.fn(),
  headObjectSize: (...args: unknown[]) => headObjectSize(...args),
  headObject: (...args: unknown[]) => headObject(...args),
  copyObject: (...args: unknown[]) => copyObject(...args),
}));
vi.mock("@/lib/r2/delete", () => ({
  deleteR2Objects: (...args: unknown[]) => deleteR2Objects(...args),
}));
// The row a complete may already have (crumbs-62): none by default, so every older case below runs as it always did.
const readRecordedUpload = vi.fn();
vi.mock("@/lib/upload/server-pipeline-recorded", () => ({
  readRecordedUpload: (...args: unknown[]) => readRecordedUpload(...args),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: () => rowRead() }) }),
    }),
  }),
}));
// The caller's own client: who is signed in, and the claim, which runs as them.
const claimRpc = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: () => getUser() },
    rpc: (fn: string, args: unknown) => claimRpc(fn, args),
  }),
}));
vi.mock("@/lib/security/abuse-rate-limit-store", () => ({
  abuseHashes: (ip: string, kind: string, scope: string) => ({
    ipHash: `ip:${ip}`,
    scopeHash: `scope:${kind}:${scope}`,
  }),
  checkAbuseRate: (...args: unknown[]) => checkAbuseRate(...args),
  recordAbuseEvent: (...args: unknown[]) => recordAbuseEvent(...args),
}));

const { POST } = await import("@/app/api/r2/complete-upload/route");

const TOKEN = "a".repeat(64);
const EVENT = "33333333-3333-4333-8333-333333333333";
const MEDIA = "44444444-4444-4444-8444-444444444444";
const OWNER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";

function context(over: Record<string, unknown> = {}) {
  return {
    ok: true,
    data: {
      event_id: EVENT,
      accepting_uploads: true,
      event_deleted: false,
      visibility: "open",
      require_verified_email: false,
      guest_verified: false,
      at_storage_cap: false,
      at_monthly_cap: false,
      video_blocked: false,
      max_upload_bytes: 10 * 1024 ** 3,
      ...over,
    },
  };
}

/** `null` is a name-only row; an id is an account's (confirmed); `verifiedAt` alone is an orphan. */
function ticketBelongsTo(
  userId: string | null,
  verifiedAt: string | null = userId ? "2026-09-22T20:00:00Z" : null,
) {
  rowRead.mockResolvedValue({
    data: { user_id: userId, verified_at: verifiedAt },
    error: null,
  });
}

function callerIs(userId: string | null) {
  getUser.mockResolvedValue({ data: { user: userId ? { id: userId } : null } });
}

async function complete(extra: Record<string, unknown> = {}) {
  const res = await POST(
    new Request("https://partyreel.com/api/r2/complete-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_token: TOKEN,
        media_id: MEDIA,
        key: `events/${EVENT}/photo/${MEDIA}/original.jpg`,
        content_type: "image/jpeg",
        size_bytes: 1000,
        upload_id: null,
        parts: [],
        ...extra,
      }),
    }),
  );
  const body = (await res.json()) as {
    ok: boolean;
    code?: string;
    status?: string;
  };
  return { status: res.status, body, setCookie: res.headers.get("set-cookie") };
}

beforeEach(() => {
  vi.clearAllMocks();
  getUploadContext.mockResolvedValue(context());
  mayUploadPastLock.mockResolvedValue(true);
  headObjectSize.mockResolvedValue(1000);
  createMedia.mockResolvedValue({
    ok: true,
    data: { media_id: MEDIA, status: "approved" },
  });
  ticketBelongsTo(null);
  callerIs(null);
  checkAbuseRate.mockResolvedValue({ allowed: true });
  claimRpc.mockResolvedValue({ data: 0, error: null });
  headObject.mockResolvedValue(null);
  copyObject.mockResolvedValue(undefined);
  deleteR2Objects.mockResolvedValue({ deleted: 1, errored: [] });
  readRecordedUpload.mockResolvedValue(null);
});

describe("an account's ticket completes only for that account", () => {
  it("★ refuses a claimed row's ticket to a SIGNED-OUT caller: no row, no cookie", async () => {
    ticketBelongsTo(OWNER);
    callerIs(null);
    const { status, body, setCookie } = await complete();
    expect(status).toBe(403);
    expect(body.code).toBe("session_other_account");
    expect(createMedia).not.toHaveBeenCalled();
    expect(setCookie).toBeNull();
  });

  it("★ refuses it to ANOTHER signed-in account", async () => {
    ticketBelongsTo(OWNER);
    callerIs(OTHER);
    const { status, body } = await complete();
    expect(status).toBe(403);
    expect(body.code).toBe("session_other_account");
    expect(createMedia).not.toHaveBeenCalled();
  });

  it("accepts it for its OWNER: the photograph is recorded", async () => {
    ticketBelongsTo(OWNER);
    callerIs(OWNER);
    const { status, body } = await complete();
    expect(status).toBe(200);
    expect(body).toEqual({ ok: true, status: "approved" });
    expect(createMedia).toHaveBeenCalledTimes(1);
  });

  it("accepts a NAME-ONLY row's ticket for someone signed out", async () => {
    ticketBelongsTo(null);
    callerIs(null);
    const { status } = await complete();
    expect(status).toBe(200);
    expect(createMedia).toHaveBeenCalledTimes(1);
  });

  it("★ refuses a name-only row's ticket to a SIGNED-IN account the claim leaves it to: no row, no cookie (build 27's red-team)", async () => {
    // Reshaped on purpose (crumbs-26): this accepted it "for anyone, signed out or signed in". A presign
    // made before a sign-in in another tab reaches here too; the file goes up again on her own ticket.
    ticketBelongsTo(null);
    callerIs(OTHER);
    const { status, body, setCookie } = await complete();
    expect(status).toBe(403);
    expect(body.code).toBe("session_other_account");
    expect(claimRpc).toHaveBeenCalledWith("claim_anonymous_uploads", {
      p_session_tokens: [TOKEN],
    });
    expect(createMedia).not.toHaveBeenCalled();
    expect(setCookie).toBeNull();
  });

  it("outranks the identity gate here too: a confirmed row does not carry a signed-out caller", async () => {
    getUploadContext.mockResolvedValue(
      context({ require_verified_email: true, guest_verified: true }),
    );
    ticketBelongsTo(OWNER);
    callerIs(null);
    const { body } = await complete();
    expect(body.code).toBe("session_other_account");
    expect(createMedia).not.toHaveBeenCalled();
  });

  it("a DELETED account's confirmed row completes for nobody", async () => {
    ticketBelongsTo(null, "2026-09-22T20:00:00Z");
    callerIs(OTHER);
    const { status, body } = await complete();
    expect(status).toBe(403);
    expect(body.code).toBe("session_other_account");
    expect(createMedia).not.toHaveBeenCalled();
  });
});

describe("the month was counted at the presign (upload-meter)", () => {
  it("★ a completion never asks the meter: the file counted once, when its URL was minted", async () => {
    const { status } = await complete();
    expect(status).toBe(200);
    expect(createMedia).toHaveBeenCalledTimes(1);
    // The size the row records is still R2's HEAD, never the declaration the presign counted.
    expect(createMedia.mock.calls[0][0].fileSizeBytes).toBe(1000);
    await complete({ reel_eligible: false });
    expect(meterUpload).not.toHaveBeenCalled();
  });
});

describe("the ladder around it", () => {
  it("a private event still answers first", async () => {
    getUploadContext.mockResolvedValue(context({ visibility: "private" }));
    ticketBelongsTo(OWNER);
    callerIs(null);
    const { status, body } = await complete();
    expect(status).toBe(403);
    expect(body.code).toBe("unauthorized");
    expect(rowRead).not.toHaveBeenCalled();
  });
});

describe("the live reel's one field (a clip added to the album)", () => {
  it("writes a clip as not reel-eligible, so the live reel never plays a reel", async () => {
    const { status } = await complete({ reel_eligible: false });
    expect(status).toBe(200);
    expect(createMedia).toHaveBeenCalledWith(
      expect.objectContaining({ reelEligible: false }),
    );
  });

  it("says nothing for every other upload (the column's default decides)", async () => {
    await complete();
    expect(createMedia.mock.calls[0][0].reelEligible).toBeUndefined();
  });

  it("refuses a malformed flag rather than guessing", async () => {
    const { status, body } = await complete({ reel_eligible: "no" });
    expect(status).toBe(400);
    expect(body.code).toBe("bad_request");
    expect(createMedia).not.toHaveBeenCalled();
  });
});

describe("the clip-add limiter (reel_clip_add)", () => {
  it("checks the limiter first, keyed to the guest's OWN session, then records only a real write", async () => {
    const { status } = await complete({ reel_eligible: false });
    expect(status).toBe(200);
    expect(checkAbuseRate).toHaveBeenCalledWith(
      "reel_clip_add",
      "ip:unknown",
      `scope:reel_clip_add:${TOKEN}`,
    );
    expect(recordAbuseEvent).toHaveBeenCalledTimes(1);
  });

  it("refuses once the daily budget is spent, before the pipeline ever writes", async () => {
    checkAbuseRate.mockResolvedValue({ allowed: false, retryAfterSec: 3600 });
    const { status, body } = await complete({ reel_eligible: false });
    expect(status).toBe(429);
    expect(body.code).toBe("rate_limited");
    expect(createMedia).not.toHaveBeenCalled();
    expect(recordAbuseEvent).not.toHaveBeenCalled();
  });

  it("never checks or counts an ordinary (non-clip) upload", async () => {
    await complete();
    expect(checkAbuseRate).not.toHaveBeenCalled();
    expect(recordAbuseEvent).not.toHaveBeenCalled();
  });

  it("never counts a clip write the pipeline itself refused", async () => {
    ticketBelongsTo(OWNER);
    callerIs(OTHER);
    const { status } = await complete({ reel_eligible: false });
    expect(status).toBe(403);
    expect(recordAbuseEvent).not.toHaveBeenCalled();
  });
});

// THE CAMERA (20261002200000): a shot the roll refuses at the moment it lands (two phones of one guest, the 25th's
// race lost at create_media) answers 409 in the server's own sentence, as a full album does; a cookie is never set.
describe("the roll's refusal at the complete", () => {
  it("answers 409 with the roll's own sentence", async () => {
    createMedia.mockResolvedValue({
      ok: false,
      code: "roll_spent",
      message: "You've taken all 24 shots on your roll.",
    });
    const { status, body } = await complete();
    expect(status).toBe(409);
    expect(body.code).toBe("roll_spent");
  });
});

// ★ A ROW SEALED UNTIL ITS ALBUM DEVELOPS (build 43's red-team, the upload half): the complete says `sealed` as the
// write did, so the guest's queue draws no album tile for a shot nobody may see yet. Said only when true: every other
// answer is byte for byte the one it was.
describe("a sealed landing", () => {
  it("answers `sealed` beside its status", async () => {
    createMedia.mockResolvedValue({
      ok: true,
      data: { media_id: MEDIA, status: "approved", sealed: true },
    });
    const { status, body } = await complete();
    expect(status).toBe(200);
    expect(body).toEqual({ ok: true, status: "approved", sealed: true });
  });

  it("says nothing of a seal where the write made none", async () => {
    createMedia.mockResolvedValue({
      ok: true,
      data: { media_id: MEDIA, status: "approved", sealed: false },
    });
    const { body } = await complete();
    expect(body).toEqual({ ok: true, status: "approved" });
  });
});

/**
 * ★ THE STAGING LANDING (upload-meter, the Advisor's Q19): a single PUT landed at its key's `staging/` twin, so the
 * complete HEADs it there (the authoritative size), copies it into its `events/` key before any row names it, and only
 * then records it, where `create_media` counts the month on that size, once. A refused or failed record takes the
 * copies back out of `events/`; a multipart, assembled by the complete at its key, and a single PUT presigned before
 * staging, found at its key, land as they always did.
 */
describe("the staging landing", () => {
  const ORIGINAL = `events/${EVENT}/photo/${MEDIA}/original.jpg`;
  const STAGED = `staging/${EVENT}/photo/${MEDIA}/original.jpg`;
  const PREVIEW = `events/${EVENT}/photo/${MEDIA}/preview.webp`;
  const STAGED_PREVIEW = `staging/${EVENT}/photo/${MEDIA}/preview.webp`;

  it("★ copies a staged single PUT into its key, then records it on the staged HEAD's size", async () => {
    headObject.mockImplementation(async ({ key }: { key: string }) =>
      key === STAGED ? { size: 123_456, lastModified: null } : null,
    );
    const { status, body } = await complete({ size_bytes: 999 });
    expect(status).toBe(200);
    expect(body).toEqual({ ok: true, status: "approved" });
    expect(copyObject).toHaveBeenCalledWith({
      sourceKey: STAGED,
      destinationKey: ORIGINAL,
    });
    expect(copyObject.mock.invocationCallOrder[0]).toBeLessThan(
      createMedia.mock.invocationCallOrder[0]!,
    );
    expect(createMedia.mock.calls[0][0]).toMatchObject({
      originalKey: ORIGINAL,
      fileSizeBytes: 123_456,
    });
    expect(headObjectSize).not.toHaveBeenCalled();
    expect(deleteR2Objects).not.toHaveBeenCalled();
  });

  it("a single PUT presigned before staging is found at its key, uncopied, as before", async () => {
    headObjectSize.mockResolvedValue(4242);
    const { status } = await complete();
    expect(status).toBe(200);
    expect(headObject).toHaveBeenCalledWith({ key: STAGED });
    expect(headObjectSize).toHaveBeenCalledWith({ key: ORIGINAL });
    expect(copyObject).not.toHaveBeenCalled();
    expect(createMedia.mock.calls[0][0].fileSizeBytes).toBe(4242);
  });

  it("an upload that landed nowhere is refused, and nothing is recorded", async () => {
    headObjectSize.mockRejectedValue(new Error("NotFound"));
    const { status, body } = await complete();
    expect(status).toBe(400);
    expect(body.code).toBe("bad_key");
    expect(createMedia).not.toHaveBeenCalled();
  });

  it("a copy R2 will not make refuses the completion (a retry may pass), and records nothing", async () => {
    headObject.mockResolvedValue({ size: 1000, lastModified: null });
    copyObject.mockRejectedValue(new Error("InternalError"));
    const { status, body } = await complete();
    expect(status).toBe(502);
    expect(body.code).toBe("complete_failed");
    expect(createMedia).not.toHaveBeenCalled();
  });

  it("★ a refused record takes its copies back out of events/: no object without a row", async () => {
    headObject.mockImplementation(async ({ key }: { key: string }) =>
      key === STAGED ? { size: 1000, lastModified: null } : null,
    );
    createMedia.mockResolvedValue({
      ok: false,
      code: "cap_reached",
      message: "Storage capacity exceeded for this plan.",
    });
    const { status } = await complete({ preview_key: PREVIEW });
    expect(status).toBe(409);
    expect(copyObject).toHaveBeenCalledWith({
      sourceKey: STAGED_PREVIEW,
      destinationKey: PREVIEW,
    });
    expect(deleteR2Objects).toHaveBeenCalledWith([ORIGINAL, PREVIEW]);
  });

  it("a record that throws takes them back out too, and the throw still surfaces", async () => {
    headObject.mockResolvedValue({ size: 1000, lastModified: null });
    createMedia.mockRejectedValue(new Error("database down"));
    await expect(complete()).rejects.toThrow("database down");
    expect(deleteR2Objects).toHaveBeenCalledWith([ORIGINAL]);
  });

  it("a preview that never landed is recorded as none, so its tile serves the original", async () => {
    headObject.mockImplementation(async ({ key }: { key: string }) =>
      key === STAGED ? { size: 1000, lastModified: null } : null,
    );
    copyObject.mockImplementation(
      async ({ sourceKey }: { sourceKey: string }) => {
        if (sourceKey === STAGED_PREVIEW) throw new Error("NoSuchKey");
      },
    );
    const { status } = await complete({ preview_key: PREVIEW });
    expect(status).toBe(200);
    expect(createMedia.mock.calls[0][0].previewKey).toBeNull();
  });

  it("a multipart is assembled at its key and recorded on its HEAD there, never looked for in staging", async () => {
    sumMultipartParts.mockResolvedValue(200 * 1024 * 1024);
    completeMultipartUpload.mockResolvedValue(undefined);
    headObjectSize.mockResolvedValue(200 * 1024 * 1024);
    const { status } = await complete({
      upload_id: "upload-1",
      parts: [{ partNumber: 1, eTag: "e1" }],
    });
    expect(status).toBe(200);
    expect(headObject).not.toHaveBeenCalledWith({ key: STAGED });
    expect(copyObject).not.toHaveBeenCalled();
    expect(headObjectSize).toHaveBeenCalledWith({ key: ORIGINAL });
  });
});

/**
 * ★ A COMPLETE SENT AGAIN FOR AN UPLOAD ALREADY RECORDED (crumbs-62, red-team 49's LOW). A phone retries a request whose
 * answer it lost, and the camera roll's last shot is the likeliest: its complete lands, the roll is full by that very
 * shot, and the complete comes again. It used to land the staged files a second time and meet every gate, and the gate
 * that had moved since (the roll, the album closed, a cap its own bytes reached) refused it and withdrew the `events/`
 * files the recorded row names; and anyone could send one, on any ticket or a dead one, for an upload whose key a
 * tile's link shows. The row answers first now, before any gate, copy or withdrawal, as `create_media` answers a
 * duplicate id, and a refusal takes back out only what no row names.
 */
describe("a complete sent again for an upload already recorded", () => {
  const ORIGINAL = `events/${EVENT}/photo/${MEDIA}/original.jpg`;
  const PREVIEW = `events/${EVENT}/photo/${MEDIA}/preview.webp`;
  const PHONE = `events/${EVENT}/photo/${MEDIA}/phone.jpg`;
  const CLIP = `events/${EVENT}/video/${MEDIA}/original.mp4`;
  const CLIP_PREVIEW = `events/${EVENT}/video/${MEDIA}/preview.webp`;
  const staged = (key: string) => key.replace(/^events\//, "staging/");
  const PHOTO_BODY = {
    preview_key: PREVIEW,
    phone_key: PHONE,
    size_bytes: 3_000_000,
  };
  const ROLL_SPENT = {
    code: "roll_spent",
    message: "You've taken all 24 shots on your roll.",
  };

  /** The database as the complete meets it: the rows recorded by id, and the refusal a gate now gives a record. */
  let rows: Map<string, string>;
  let refusal: { code: string; message: string } | null;

  beforeEach(() => {
    rows = new Map();
    refusal = null;
    // Every file of the upload sits staged, as it does for a day after its PUTs.
    const sizes: Record<string, number> = {
      [staged(ORIGINAL)]: 3_000_000,
      [staged(PREVIEW)]: 40_000,
      [staged(PHONE)]: 600_000,
      [staged(CLIP)]: 4_000_000,
      [staged(CLIP_PREVIEW)]: 30_000,
    };
    headObject.mockImplementation(async ({ key }: { key: string }) =>
      key in sizes ? { size: sizes[key], lastModified: null } : null,
    );
    // `create_media` as the database answers it: its gates first, then the insert, whose duplicate id is idempotent.
    createMedia.mockImplementation(
      async (input: { mediaId: string; originalKey: string }) => {
        if (refusal) return { ok: false, ...refusal };
        if (rows.has(input.mediaId)) {
          return { ok: true, data: { idempotent: true } };
        }
        rows.set(input.mediaId, input.originalKey);
        return {
          ok: true,
          data: { media_id: input.mediaId, status: "approved" },
        };
      },
    );
    readRecordedUpload.mockImplementation(async (id: string) =>
      rows.has(id) ? { originalKey: rows.get(id) } : null,
    );
  });

  it("★ the roll full by that very shot: its row answers `recorded`, nothing copied again, nothing withdrawn", async () => {
    const first = await complete(PHOTO_BODY);
    expect(first.body).toEqual({ ok: true, status: "approved" });
    expect(copyObject).toHaveBeenCalledTimes(3);
    refusal = ROLL_SPENT;

    const again = await complete(PHOTO_BODY);
    expect(deleteR2Objects).not.toHaveBeenCalled();
    expect(again.status).toBe(200);
    expect(again.body).toEqual({ ok: true, status: "recorded" });
    expect(copyObject).toHaveBeenCalledTimes(3);
    // Before any gate: the second complete never asked the door, the owner or the record.
    expect(getUploadContext).toHaveBeenCalledTimes(1);
    expect(createMedia).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      "the album closed",
      () => {
        refusal = {
          code: "uploads_closed",
          message: "This event isn't accepting uploads right now.",
        };
      },
    ],
    [
      "a cap its own bytes reached",
      () => {
        refusal = {
          code: "cap_reached",
          message: "Storage capacity exceeded for this plan.",
        };
      },
    ],
    [
      "the album gone private",
      () =>
        getUploadContext.mockResolvedValue(context({ visibility: "private" })),
    ],
    [
      "an email asked for",
      () =>
        getUploadContext.mockResolvedValue(
          context({ require_verified_email: true }),
        ),
    ],
  ])(
    "★ %s since: still its row's answer, and every file stays",
    async (_gate, moveIt) => {
      await complete(PHOTO_BODY);
      moveIt();
      const again = await complete(PHOTO_BODY);
      expect(again.body).toEqual({ ok: true, status: "recorded" });
      expect(deleteR2Objects).not.toHaveBeenCalled();
    },
  );

  it("★ a stranger's complete for it, on a dead ticket, answers its row and never deletes a file (the key a tile's link shows is all it takes)", async () => {
    await complete(PHOTO_BODY);
    getUploadContext.mockResolvedValue({
      ok: false,
      code: "invalid_session",
      message: "Your upload session has expired. Refresh and rejoin.",
    });
    refusal = {
      code: "invalid_session",
      message: "Your upload session has expired.",
    };
    const forged = await complete({
      ...PHOTO_BODY,
      session_token: "not-a-ticket",
    });
    expect(deleteR2Objects).not.toHaveBeenCalled();
    expect(forged.body).toEqual({ ok: true, status: "recorded" });
    expect(copyObject).toHaveBeenCalledTimes(3);
    expect(createMedia).toHaveBeenCalledTimes(1);
  });

  it("★ its row is read before any gate, HEAD or copy", async () => {
    await complete(PHOTO_BODY);
    expect(readRecordedUpload).toHaveBeenCalledWith(MEDIA);
    const read = readRecordedUpload.mock.invocationCallOrder[0]!;
    expect(read).toBeLessThan(headObject.mock.invocationCallOrder[0]!);
    expect(read).toBeLessThan(copyObject.mock.invocationCallOrder[0]!);
    expect(read).toBeLessThan(getUploadContext.mock.invocationCallOrder[0]!);
  });

  it("a key that is not its row's is refused, and nothing moves", async () => {
    await complete(PHOTO_BODY);
    const res = await complete({
      key: `events/${EVENT}/photo/${MEDIA}/original.png`,
      content_type: "image/png",
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("bad_key");
    expect(copyObject).toHaveBeenCalledTimes(3);
    expect(createMedia).toHaveBeenCalledTimes(1);
    expect(deleteR2Objects).not.toHaveBeenCalled();
  });

  it("★ a twin complete that loses the race to its own row is answered by the row, and withdraws nothing", async () => {
    // Two completes of one upload in flight at once: this one read no row, landed its copies, then met the roll its
    // twin's insert had just filled.
    readRecordedUpload
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ originalKey: ORIGINAL });
    refusal = ROLL_SPENT;
    const res = await complete(PHOTO_BODY);
    expect(res.body).toEqual({ ok: true, status: "recorded" });
    expect(copyObject).toHaveBeenCalledTimes(3);
    expect(deleteR2Objects).not.toHaveBeenCalled();
  });

  it("a twin that threw still withdraws nothing its row names, and is answered by the row", async () => {
    readRecordedUpload
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ originalKey: ORIGINAL });
    createMedia.mockRejectedValue(new Error("statement timeout"));
    const res = await complete(PHOTO_BODY);
    expect(res.body).toEqual({ ok: true, status: "recorded" });
    expect(deleteR2Objects).not.toHaveBeenCalled();
  });

  it("a read that fails takes nothing back out, and says so (the orphan sweep reclaims what no row names)", async () => {
    readRecordedUpload.mockRejectedValue(new Error("connection reset"));
    refusal = {
      code: "cap_reached",
      message: "Storage capacity exceeded for this plan.",
    };
    const res = await complete(PHOTO_BODY);
    expect(res.status).toBe(409);
    expect(deleteR2Objects).not.toHaveBeenCalled();
    expect(captureWarning).toHaveBeenCalledWith(
      "upload",
      "unrecorded_copies_left",
      expect.objectContaining({ keys: [ORIGINAL, PREVIEW, PHONE] }),
    );
  });

  it("a read that fails never stops an upload: it lands as it always did", async () => {
    readRecordedUpload.mockRejectedValue(new Error("connection reset"));
    const res = await complete(PHOTO_BODY);
    expect(res.body).toEqual({ ok: true, status: "approved" });
    expect(copyObject).toHaveBeenCalledTimes(3);
  });

  it("a multipart's complete sent again answers its row, and never asks R2 to assemble it twice", async () => {
    sumMultipartParts.mockResolvedValue(200 * 1024 * 1024);
    // R2 has no such upload once it is assembled: a second CompleteMultipartUpload fails.
    completeMultipartUpload
      .mockResolvedValueOnce(undefined)
      .mockRejectedValue(new Error("NoSuchUpload"));
    headObjectSize.mockResolvedValue(200 * 1024 * 1024);
    const multipart = {
      key: CLIP,
      content_type: "video/mp4",
      upload_id: "upload-1",
      parts: [{ partNumber: 1, eTag: "e1" }],
    };
    expect((await complete(multipart)).body).toEqual({
      ok: true,
      status: "approved",
    });
    const again = await complete(multipart);
    expect(again.body).toEqual({ ok: true, status: "recorded" });
    expect(completeMultipartUpload).toHaveBeenCalledTimes(1);
  });

  it("★ a clip added to the album and sent again is its row's to answer, and spends none of the day's budget, a spent one included", async () => {
    const clip = {
      key: CLIP,
      content_type: "video/mp4",
      preview_key: CLIP_PREVIEW,
      reel_eligible: false,
    };
    expect((await complete(clip)).status).toBe(200);
    expect(recordAbuseEvent).toHaveBeenCalledTimes(1);
    checkAbuseRate.mockResolvedValue({ allowed: false, retryAfterSec: 3600 });

    const again = await complete(clip);
    expect(again.status).toBe(200);
    expect(again.body).toEqual({ ok: true, status: "recorded" });
    expect(checkAbuseRate).toHaveBeenCalledTimes(1);
    expect(recordAbuseEvent).toHaveBeenCalledTimes(1);
  });
});

describe("★ the capture time a guest's complete claims (capture-time, uploads-and-r2.md)", () => {
  // The server's clock, fixed: the bounds are now plus a day and 1990 (`capture-time.ts`, their one home).
  beforeEach(() => {
    vi.useFakeTimers({
      now: new Date("2026-10-05T12:00:00Z"),
      toFake: ["Date"],
    });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  const recorded = () =>
    (createMedia.mock.calls.at(-1) as [Record<string, unknown>])[0].capturedAt;

  it("records a claim inside the bounds, as the instant the column stores", async () => {
    const { status } = await complete({
      captured_at: "2026-10-04T01:14:05.000Z",
    });
    expect(status).toBe(200);
    expect(recorded()).toBe("2026-10-04T01:14:05.000Z");
  });

  it("★ drops a lie (a day and more ahead, or before 1990) and the upload still lands: the arrival stands", async () => {
    for (const lie of [
      "2026-10-06T12:00:01.000Z",
      "2099-01-01T00:00:00.000Z",
      "1989-12-31T23:59:59.000Z",
      "1970-01-01T00:00:00.000Z",
    ]) {
      const { status, body } = await complete({ captured_at: lie });
      expect(status, lie).toBe(200);
      expect(body.ok, lie).toBe(true);
      expect(recorded(), lie).toBeNull();
    }
  });

  it("★ a claim that is no instant is none, never a refusal of the file; an older tab's body says none", async () => {
    for (const bad of [
      12345,
      "yesterday",
      { at: "now" },
      ["2026-10-04T01:14:05Z"],
      true,
      null,
      "infinity",
    ]) {
      const { status } = await complete({ captured_at: bad });
      expect(status, JSON.stringify(bad)).toBe(200);
      expect(recorded(), JSON.stringify(bad)).toBeNull();
    }
    const { status } = await complete();
    expect(status).toBe(200);
    expect(recorded()).toBeNull();
  });
});

/**
 * ★ A ZONELESS WALL CLOCK IS READ IN THE PARTY'S ZONE (crumbs-85, capture-time's and event-zone's Deferred line): the
 * complete carries the bare clock beside the browser's reading, and the server reads it on the party's own clock, so a
 * guest whose phone is on home time, or a camera that wrote no zone, lands where the party lived it. Its cost: one read
 * of the zone, only for a complete that carries such a clock.
 */
describe("★ a zoneless wall clock, read in the party's zone", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      now: new Date("2026-10-05T12:00:00Z"),
      toFake: ["Date"],
    });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  const recorded = () =>
    (createMedia.mock.calls.at(-1) as [Record<string, unknown>])[0].capturedAt;

  it("★ reads the bare clock on the party's clock, over the browser's reading", async () => {
    readPartyZone.mockResolvedValue("Asia/Makassar");
    const { status } = await complete({
      // The browser read it in its own zone (London, BST): 20:14:05Z.
      captured_at: "2026-10-03T20:14:05.000Z",
      captured_wall: "2026-10-03T21:14:05",
    });
    expect(status).toBe(200);
    expect(readPartyZone).toHaveBeenCalledWith(EVENT);
    // 21:14:05 in Makassar (UTC+8).
    expect(recorded()).toBe("2026-10-03T13:14:05.000Z");
  });

  it("keeps the browser's reading where the party names no zone, or the party's reading is out of bounds", async () => {
    readPartyZone.mockResolvedValue(null);
    await complete({
      captured_at: "2026-10-03T20:14:05.000Z",
      captured_wall: "2026-10-03T21:14:05",
    });
    expect(recorded()).toBe("2026-10-03T20:14:05.000Z");
    readPartyZone.mockResolvedValue("Pacific/Kiritimati");
    // A clock a day and more past now on the party's clock is no capture: the claim stands.
    await complete({
      captured_at: "2026-10-03T20:14:05.000Z",
      captured_wall: "2026-10-07T21:14:05",
    });
    expect(recorded()).toBe("2026-10-03T20:14:05.000Z");
  });

  it("★ reads no zone for a complete that carries no bare clock, and a malformed one is none, never a refusal", async () => {
    await complete({ captured_at: "2026-10-04T01:14:05.000Z" });
    expect(readPartyZone).not.toHaveBeenCalled();
    for (const bad of ["2026-10-03 21:14:05", "21:14", 7, { at: 1 }]) {
      const { status } = await complete({
        captured_at: "2026-10-04T01:14:05.000Z",
        captured_wall: bad,
      });
      expect(status, JSON.stringify(bad)).toBe(200);
      expect(recorded(), JSON.stringify(bad)).toBe("2026-10-04T01:14:05.000Z");
    }
    expect(readPartyZone).not.toHaveBeenCalled();
  });
});
