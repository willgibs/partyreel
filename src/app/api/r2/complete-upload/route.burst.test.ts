/**
 * A BURST'S COMPLETE (compute-uploads, the compute model's lever 4): one request records the files a phone sent
 * together, each file through the very spine its own request ran, one after another. What is held: ★ a file refused
 * never stops its siblings, which land and are counted once (one `create_media` a file, on its own HEAD size; the
 * meter never asked again); the refused file's copies go back out and no sibling's do; who is sending is asked once;
 * an upload named twice in a request is completed once; a recorded upload's replay is its row's; a throw is one
 * file's; the guest's clips meet the day's budget one after another; the ticket's cookie rides the answer once. The
 * REAL route, pipeline and owner check run; the RPC wrappers, R2 and the Supabase clients are the stubbed edges.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUploadContext = vi.fn();
const createMedia = vi.fn();
const mayUploadPastLock = vi.fn();
const headObjectSize = vi.fn();
const rowRead = vi.fn();
const getUser = vi.fn();
const checkAbuseRate = vi.fn();
const recordAbuseEvent = vi.fn();
const meterUpload = vi.fn();
const captureError = vi.fn();

vi.mock("server-only", () => ({}));
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
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: vi.fn(),
  captureError: (...args: unknown[]) => captureError(...args),
}));
const captureUploadForensics = vi.fn();
vi.mock("@/lib/forensics/capture", () => ({
  captureUploadForensics: (...args: unknown[]) =>
    captureUploadForensics(...args),
}));
const headObject = vi.fn();
const copyObject = vi.fn();
const deleteR2Objects = vi.fn();
vi.mock("@/lib/r2/presign", () => ({
  presignUpload: vi.fn(),
  presignUploadPart: vi.fn(),
  createMultipartUpload: vi.fn(),
  completeMultipartUpload: vi.fn(),
  sumMultipartParts: vi.fn(),
  abortMultipartUpload: vi.fn(),
  headObjectSize: (...args: unknown[]) => headObjectSize(...args),
  headObject: (...args: unknown[]) => headObject(...args),
  copyObject: (...args: unknown[]) => copyObject(...args),
}));
vi.mock("@/lib/r2/delete", () => ({
  deleteR2Objects: (...args: unknown[]) => deleteR2Objects(...args),
}));
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
const IDS = [
  "44444444-4444-4444-8444-444444444441",
  "44444444-4444-4444-8444-444444444442",
  "44444444-4444-4444-8444-444444444443",
];

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

const keyOf = (id: string) => `events/${EVENT}/photo/${id}/original.jpg`;
const stagedOf = (id: string) => `staging/${EVENT}/photo/${id}/original.jpg`;

/** One landed photograph's entry, as the browser sends it. */
const landed = (id: string, extra: Record<string, unknown> = {}) => ({
  media_id: id,
  key: keyOf(id),
  content_type: "image/jpeg",
  size_bytes: 1000,
  upload_id: null,
  parts: [],
  ...extra,
});

type FileAnswer = {
  ok: boolean;
  status?: number | string;
  code?: string;
  message?: string;
};

async function completeBurst(files: unknown[]) {
  const res = await POST(
    new Request("https://partyreel.com/api/r2/complete-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_token: TOKEN, files }),
    }),
  );
  const body = (await res.json()) as { ok: boolean; files?: FileAnswer[] };
  return {
    status: res.status,
    body,
    files: body.files ?? [],
    setCookie: res.headers.get("set-cookie"),
  };
}

/** Each staged single PUT's HEAD answers its own size: the n-th file holds n,000 bytes. */
function stagedSizes() {
  headObject.mockImplementation(async ({ key }: { key: string }) => {
    const i = IDS.findIndex((id) => key === stagedOf(id));
    return i >= 0 ? { size: (i + 1) * 1000 } : null;
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getUploadContext.mockResolvedValue(context());
  mayUploadPastLock.mockResolvedValue(true);
  headObjectSize.mockResolvedValue(1000);
  createMedia.mockImplementation(async ({ mediaId }: { mediaId: string }) => ({
    ok: true,
    data: { media_id: mediaId, status: "approved" },
  }));
  rowRead.mockResolvedValue({
    data: { user_id: null, verified_at: null },
    error: null,
  });
  getUser.mockResolvedValue({ data: { user: null } });
  checkAbuseRate.mockResolvedValue({ allowed: true });
  claimRpc.mockResolvedValue({ data: 0, error: null });
  stagedSizes();
  copyObject.mockResolvedValue(undefined);
  deleteR2Objects.mockResolvedValue({ deleted: 1, errored: [] });
  readRecordedUpload.mockResolvedValue(null);
});

describe("one request records a burst", () => {
  it("★ each file lands once, on its own HEAD size, and gets its own answer in order", async () => {
    const { status, body, files } = await completeBurst(
      IDS.map((id) => landed(id)),
    );
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(files).toEqual([
      { ok: true, status: "approved" },
      { ok: true, status: "approved" },
      { ok: true, status: "approved" },
    ]);
    expect(createMedia).toHaveBeenCalledTimes(3);
    expect(
      createMedia.mock.calls.map(([a]) => [a.mediaId, a.fileSizeBytes]),
    ).toEqual([
      [IDS[0], 1000],
      [IDS[1], 2000],
      [IDS[2], 3000],
    ]);
    // The month was counted where each URL was minted: the complete never asks the meter.
    expect(meterUpload).not.toHaveBeenCalled();
    expect(captureUploadForensics).toHaveBeenCalledTimes(3);
  });

  it("asks who is sending once: the ticket's context and its owner, one read each", async () => {
    await completeBurst(IDS.map((id) => landed(id)));
    expect(getUploadContext).toHaveBeenCalledTimes(1);
    expect(rowRead).toHaveBeenCalledTimes(1);
  });

  it("the ticket's cookie rides the burst's answer once", async () => {
    const { setCookie } = await completeBurst(IDS.map((id) => landed(id)));
    expect(setCookie).toContain(`pr_guest_${EVENT}`);
    expect(setCookie?.match(/pr_guest_/g)).toHaveLength(1);
  });

  it("says `sealed` for a file the write sealed, and nothing for its siblings", async () => {
    createMedia.mockImplementation(
      async ({ mediaId }: { mediaId: string }) => ({
        ok: true,
        data: {
          media_id: mediaId,
          status: "approved",
          sealed: mediaId === IDS[1],
        },
      }),
    );
    const { files } = await completeBurst(IDS.map((id) => landed(id)));
    expect(files).toEqual([
      { ok: true, status: "approved" },
      { ok: true, status: "approved", sealed: true },
      { ok: true, status: "approved" },
    ]);
  });
});

describe("★ a burst's files land side by side and are recorded in its order", () => {
  it("at most four land at once, and the rows are written one after another, in order", async () => {
    const ids = Array.from(
      { length: 7 },
      (_, i) => `55555555-5555-4555-8555-55555555555${i}`,
    );
    let inFlight = 0;
    let most = 0;
    headObject.mockImplementation(async ({ key }: { key: string }) => {
      inFlight += 1;
      most = Math.max(most, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight -= 1;
      return key.startsWith("staging/") ? { size: 1000 } : null;
    });
    let writing = 0;
    createMedia.mockImplementation(async ({ mediaId }: { mediaId: string }) => {
      writing += 1;
      expect(writing).toBe(1);
      await new Promise((resolve) => setTimeout(resolve, 1));
      writing -= 1;
      return { ok: true, data: { media_id: mediaId, status: "approved" } };
    });
    const { files } = await completeBurst(ids.map((id) => landed(id)));
    expect(files.every((f) => f.ok)).toBe(true);
    expect(most).toBeGreaterThan(1);
    expect(most).toBeLessThanOrEqual(4);
    expect(createMedia.mock.calls.map(([a]) => a.mediaId)).toEqual(ids);
  });
});

describe("★ a file refused never stops its siblings, which land and are counted once", () => {
  it("the roll refuses the middle shot: its copies go back out, its siblings land", async () => {
    createMedia.mockImplementation(async ({ mediaId }: { mediaId: string }) =>
      mediaId === IDS[1]
        ? {
            ok: false,
            code: "roll_spent",
            message: "You've taken all 24 shots on your roll.",
          }
        : { ok: true, data: { media_id: mediaId, status: "approved" } },
    );
    const { status, files } = await completeBurst(IDS.map((id) => landed(id)));
    expect(status).toBe(200);
    expect(files).toEqual([
      { ok: true, status: "approved" },
      {
        ok: false,
        status: 409,
        code: "roll_spent",
        message: "You've taken all 24 shots on your roll.",
      },
      { ok: true, status: "approved" },
    ]);
    // One create_media a file: the refused one's refusal counted nothing, its siblings once each.
    expect(createMedia.mock.calls.map(([a]) => a.mediaId)).toEqual(IDS);
    // Only the refused file's copy is taken back out of events/.
    expect(deleteR2Objects).toHaveBeenCalledTimes(1);
    expect(deleteR2Objects).toHaveBeenCalledWith([keyOf(IDS[1])]);
    // Forensics for the two that landed.
    expect(captureUploadForensics).toHaveBeenCalledTimes(2);
  });

  it("a file whose key is not its own is refused alone, before anything of it moves", async () => {
    const stranger = `events/${EVENT}/photo/${IDS[0]}/original.jpg`;
    const { files } = await completeBurst([
      landed(IDS[0]),
      landed(IDS[1], { key: stranger }),
      landed(IDS[2]),
    ]);
    expect(files.map((f) => f.ok)).toEqual([true, false, true]);
    expect(files[1]).toMatchObject({ status: 400, code: "bad_key" });
    expect(createMedia.mock.calls.map(([a]) => a.mediaId)).toEqual([
      IDS[0],
      IDS[2],
    ]);
  });

  it("an upload that landed nowhere is refused alone", async () => {
    headObject.mockImplementation(async ({ key }: { key: string }) =>
      key === stagedOf(IDS[1]) ? null : { size: 1000 },
    );
    headObjectSize.mockRejectedValue(new Error("NotFound"));
    const { files } = await completeBurst(IDS.map((id) => landed(id)));
    expect(files.map((f) => f.ok)).toEqual([true, false, true]);
    expect(files[1]).toMatchObject({ status: 400, code: "bad_key" });
  });

  it("a record that throws is that file's alone: reported, and its siblings land", async () => {
    createMedia.mockImplementation(async ({ mediaId }: { mediaId: string }) => {
      if (mediaId === IDS[1]) throw new Error("connection reset");
      return { ok: true, data: { media_id: mediaId, status: "approved" } };
    });
    const { status, files } = await completeBurst(IDS.map((id) => landed(id)));
    expect(status).toBe(200);
    expect(files.map((f) => f.ok)).toEqual([true, false, true]);
    expect(files[1]).toMatchObject({ status: 502, code: "complete_failed" });
    expect(captureError).toHaveBeenCalled();
  });

  it("★ an upload named twice in one request is completed once", async () => {
    const { files } = await completeBurst([landed(IDS[0]), landed(IDS[0])]);
    expect(files.map((f) => f.ok)).toEqual([true, false]);
    expect(files[1]).toMatchObject({ status: 400, code: "bad_request" });
    expect(createMedia).toHaveBeenCalledTimes(1);
  });

  it("a recorded upload's replay in a burst is its row's, and moves nothing; its siblings land", async () => {
    readRecordedUpload.mockImplementation(async (id: string) =>
      id === IDS[0] ? { originalKey: keyOf(IDS[0]) } : null,
    );
    const { files } = await completeBurst(IDS.map((id) => landed(id)));
    expect(files[0]).toEqual({ ok: true, status: "recorded" });
    expect(createMedia.mock.calls.map(([a]) => a.mediaId)).toEqual([
      IDS[1],
      IDS[2],
    ]);
    expect(copyObject).not.toHaveBeenCalledWith(
      expect.objectContaining({ destinationKey: keyOf(IDS[0]) }),
    );
  });

  it("a ticket that is not the caller's refuses each file in the session's words, and records none", async () => {
    rowRead.mockResolvedValue({
      data: {
        user_id: "11111111-1111-4111-8111-111111111111",
        verified_at: "2026-09-22T20:00:00Z",
      },
      error: null,
    });
    const { status, files } = await completeBurst(IDS.map((id) => landed(id)));
    expect(status).toBe(200);
    expect(files.every((f) => f.code === "session_other_account")).toBe(true);
    expect(files.every((f) => f.status === 403)).toBe(true);
    expect(createMedia).not.toHaveBeenCalled();
  });
});

describe("★ a burst's clips meet the day's budget one after another", () => {
  const CLIP_IDS = IDS.slice(0, 2);
  const clip = (id: string) =>
    landed(id, {
      key: `events/${EVENT}/video/${id}/original.mp4`,
      content_type: "video/mp4",
      reel_eligible: false,
    });

  it("the budget's last clip lands and is spent; the next is refused before a byte of it lands", async () => {
    headObjectSize.mockResolvedValue(5000);
    headObject.mockResolvedValue(null);
    checkAbuseRate
      .mockResolvedValueOnce({ allowed: true })
      .mockResolvedValueOnce({ allowed: false, retryAfterSec: 3600 });
    const { files } = await completeBurst(CLIP_IDS.map(clip));
    expect(files[0]).toEqual({ ok: true, status: "approved" });
    expect(files[1]).toEqual({
      ok: false,
      status: 429,
      code: "rate_limited",
      message: "You've added a lot of clips today. Try again tomorrow.",
    });
    expect(createMedia).toHaveBeenCalledTimes(1);
    expect(recordAbuseEvent).toHaveBeenCalledTimes(1);
    // Each clip's check came after the one before it was spent.
    expect(checkAbuseRate.mock.invocationCallOrder[1]).toBeGreaterThan(
      recordAbuseEvent.mock.invocationCallOrder[0],
    );
  });

  it("a photograph in the same burst never meets the budget", async () => {
    await completeBurst([landed(IDS[2])]);
    expect(checkAbuseRate).not.toHaveBeenCalled();
    expect(recordAbuseEvent).not.toHaveBeenCalled();
  });
});

describe("a burst the route cannot read is refused whole", () => {
  it.each([
    ["no files", []],
    ["an entry that is not an object", [landed(IDS[0]), 7]],
  ])("%s", async (_name, files) => {
    const { status, body } = await completeBurst(files);
    expect(status).toBe(400);
    expect(body).toEqual({
      ok: false,
      code: "bad_request",
      message: "Invalid completion request.",
    });
    expect(createMedia).not.toHaveBeenCalled();
  });
});

describe("★ a burst's files each carry their own capture time (capture-time, Will's X7)", () => {
  it("one in the bounds is recorded, one lying is dropped, one with none says none, and all three land", async () => {
    vi.useFakeTimers({
      now: new Date("2026-10-05T12:00:00Z"),
      toFake: ["Date"],
    });
    try {
      const { files } = await completeBurst([
        landed(IDS[0], { captured_at: "2026-10-04T01:14:05.000Z" }),
        landed(IDS[1], { captured_at: "2031-01-01T00:00:00.000Z" }),
        landed(IDS[2]),
      ]);
      expect(files.every((f) => f.ok)).toBe(true);
      expect(
        createMedia.mock.calls.map(([a]) => [a.mediaId, a.capturedAt]),
      ).toEqual([
        [IDS[0], "2026-10-04T01:14:05.000Z"],
        [IDS[1], null],
        [IDS[2], null],
      ]);
    } finally {
      vi.useRealTimers();
    }
  });
});
