/**
 * A BURST'S PRESIGN (compute-uploads, the compute model's lever 4): one request presigns the files a phone sends
 * together, each file through the very spine its own request ran. What is held: each file gets its own answer, in
 * order, field for field the one-file answer; a file refused never stops its siblings; who is sending is asked once
 * and, refused, refuses the whole request in the one-file words; the meter judges each file with its earlier
 * siblings' bytes and the roll counts its earlier shots, as one-at-a-time presigns saw them landed; the meter tallies
 * each file once; an entry can never name another ticket. The REAL route, pipeline and owner check run; the RPC
 * wrappers, R2 and the Supabase clients are the stubbed edges (`route.test.ts`'s).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MAX_BURST_FILES } from "@/lib/upload/burst";

const getUploadContext = vi.fn();
const mayUploadPastLock = vi.fn();
const guestUploadsOpen = vi.fn();
const presignUpload = vi.fn();
const rowRead = vi.fn();
const getUser = vi.fn();
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
}));
vi.mock("@/lib/events/upload-lock", () => ({
  mayUploadPastLock: (...args: unknown[]) => mayUploadPastLock(...args),
}));
vi.mock("@/lib/jobs/spend-watch-switches", () => ({
  guestUploadsOpen: () => guestUploadsOpen(),
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: vi.fn(),
  captureError: (...args: unknown[]) => captureError(...args),
}));
vi.mock("@/lib/forensics/capture", () => ({
  captureUploadForensics: vi.fn(),
}));
const createMultipartUpload = vi.fn();
const presignUploadPart = vi.fn();
vi.mock("@/lib/r2/presign", () => ({
  presignUpload: (...args: unknown[]) => presignUpload(...args),
  presignUploadPart: (...args: unknown[]) => presignUploadPart(...args),
  createMultipartUpload: (...args: unknown[]) => createMultipartUpload(...args),
  completeMultipartUpload: vi.fn(),
  sumMultipartParts: vi.fn(),
  abortMultipartUpload: vi.fn(),
  headObjectSize: vi.fn(),
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

const { POST } = await import("@/app/api/r2/presign-upload/route");

const TOKEN = "a".repeat(64);
const EVENT = "33333333-3333-4333-8333-333333333333";
const OWNER = "11111111-1111-4111-8111-111111111111";
const MB = 1024 ** 2;

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

const photo = (size_bytes = 1000) => ({
  content_type: "image/jpeg",
  size_bytes,
});

type FileAnswer = {
  ok: boolean;
  status?: number;
  code?: string;
  message?: string;
  media_id?: string;
  strategy?: string;
  key?: string;
};

async function presignBurst(
  files: unknown,
  shared: Record<string, unknown> = { session_token: TOKEN },
) {
  const res = await POST(
    new Request("https://partyreel.com/api/r2/presign-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...shared, files }),
    }),
  );
  const body = (await res.json()) as {
    ok: boolean;
    code?: string;
    message?: string;
    files?: FileAnswer[];
  };
  return { status: res.status, body, files: body.files ?? [] };
}

beforeEach(() => {
  vi.clearAllMocks();
  guestUploadsOpen.mockResolvedValue(true);
  getUploadContext.mockResolvedValue(context());
  mayUploadPastLock.mockResolvedValue(true);
  presignUpload.mockResolvedValue({
    url: "https://r2.example/put",
    headers: {},
  });
  rowRead.mockResolvedValue({
    data: { user_id: null, verified_at: null },
    error: null,
  });
  getUser.mockResolvedValue({ data: { user: null } });
  claimRpc.mockResolvedValue({ data: 0, error: null });
  meterUpload.mockResolvedValue({ ok: true });
});

describe("one request presigns a burst", () => {
  it("★ each file gets its own answer, in order, field for field the one-file answer", async () => {
    const { status, body, files } = await presignBurst([
      photo(),
      photo(),
      photo(),
    ]);
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(files).toHaveLength(3);
    for (const f of files) {
      expect(Object.keys(f)).toEqual([
        "ok",
        "strategy",
        "media_id",
        "key",
        "content_type",
        "url",
        "headers",
      ]);
      expect(f.key).toBe(`events/${EVENT}/photo/${f.media_id}/original.jpg`);
    }
    expect(new Set(files.map((f) => f.media_id)).size).toBe(3);
  });

  it("★ the meter tallies each file once, and judges each with its earlier siblings' bytes", async () => {
    await presignBurst([photo(1000), photo(2000), photo(3000)]);
    expect(meterUpload).toHaveBeenCalledTimes(3);
    expect(meterUpload.mock.calls.map(([a]) => a.bytes)).toEqual([
      1000, 3000, 6000,
    ]);
  });

  it("asks who is sending once: the switch, the ticket's context and its owner, one read each", async () => {
    await presignBurst([photo(), photo(), photo(), photo()]);
    expect(guestUploadsOpen).toHaveBeenCalledTimes(1);
    expect(getUploadContext).toHaveBeenCalledTimes(1);
    expect(rowRead).toHaveBeenCalledTimes(1);
  });

  it("a burst that mixes photographs and a clip asks the context once a kind", async () => {
    await presignBurst([
      photo(),
      { content_type: "video/mp4", size_bytes: 5 * MB },
      photo(),
    ]);
    expect(getUploadContext.mock.calls.map(([, kind]) => kind)).toEqual([
      "photo",
      "video",
    ]);
  });

  it("an entry can never name another ticket: the burst's own is every file's", async () => {
    await presignBurst([{ ...photo(), session_token: "b".repeat(64) }]);
    expect(getUploadContext).toHaveBeenCalledWith(TOKEN, "photo");
    expect(getUploadContext).not.toHaveBeenCalledWith(
      "b".repeat(64),
      expect.anything(),
    );
  });
});

describe("★ a file refused never stops its siblings", () => {
  it("a clip in a photos-only album is refused alone, in the album's words", async () => {
    getUploadContext.mockImplementation(async (_t: string, kind: string) =>
      context({ video_blocked: kind === "video" }),
    );
    const { status, files } = await presignBurst([
      photo(),
      { content_type: "video/mp4", size_bytes: 5 * MB },
      photo(),
    ]);
    expect(status).toBe(200);
    expect(files.map((f) => f.ok)).toEqual([true, false, true]);
    expect(files[1]).toEqual({
      ok: false,
      status: 403,
      code: "video_not_allowed",
      message: "This event accepts photos only.",
    });
  });

  it("a file past the album's size cap is refused alone", async () => {
    getUploadContext.mockResolvedValue(context({ max_upload_bytes: 2 * MB }));
    const { files } = await presignBurst([photo(), photo(3 * MB), photo()]);
    expect(files.map((f) => f.ok)).toEqual([true, false, true]);
    expect(files[1].code).toBe("too_large");
  });

  it("a file the meter cannot fit is refused alone, and its bytes never count against the next", async () => {
    // The room holds 2,500 more bytes: the 5,000 cannot fit, the files around it can.
    meterUpload.mockImplementation(async ({ bytes }: { bytes: number }) =>
      bytes > 2500
        ? {
            ok: false,
            reason: "storage",
            neededBytes: bytes - 2500,
            deletedBytes: 0,
            makesRoom: true,
          }
        : { ok: true },
    );
    const { files } = await presignBurst([
      photo(1000),
      photo(5000),
      photo(1000),
    ]);
    expect(files.map((f) => f.ok)).toEqual([true, false, true]);
    expect(files[1]).toMatchObject({ status: 409, code: "cap_reached" });
    expect(meterUpload.mock.calls.map(([a]) => a.bytes)).toEqual([
      1000, 6000, 2000,
    ]);
  });

  it("a file the room cannot take once its siblings land is refused, as it was presigned after them", async () => {
    meterUpload.mockImplementation(async ({ bytes }: { bytes: number }) =>
      bytes > 2500 ? { ok: false, reason: "monthly" } : { ok: true },
    );
    const { files } = await presignBurst([
      photo(1000),
      photo(1000),
      photo(1000),
    ]);
    expect(files.map((f) => f.ok)).toEqual([true, true, false]);
    expect(files[2]).toEqual({
      ok: false,
      status: 409,
      code: "cap_reached",
      message: "This album has hit its upload limit for now.",
    });
  });

  it("an entry that cannot be read is its own refusal", async () => {
    const { files } = await presignBurst([
      photo(),
      { content_type: "image/jpeg" },
      photo(),
    ]);
    expect(files.map((f) => f.ok)).toEqual([true, false, true]);
    expect(files[1]).toEqual({
      ok: false,
      status: 400,
      code: "bad_request",
      message: "Invalid upload request.",
    });
  });

  it("a file whose multipart R2 would not open is its own failure, reported, and its siblings presign", async () => {
    createMultipartUpload.mockRejectedValue(new Error("R2 is down"));
    const { status, files } = await presignBurst([
      photo(),
      { content_type: "video/mp4", size_bytes: 200 * MB },
      photo(),
    ]);
    expect(status).toBe(200);
    expect(files.map((f) => f.ok)).toEqual([true, false, true]);
    expect(files[1]).toMatchObject({ status: 502, code: "presign_failed" });
    expect(captureError).toHaveBeenCalledTimes(1);
  });
});

describe("★ the roll counts the burst's earlier shots", () => {
  it("two frames left: the third shot of a burst meets the roll's own sentence", async () => {
    getUploadContext.mockResolvedValue(
      context({
        capture: "camera",
        roll: { used: 22, cap: 24, taken: 22, ceiling: 72 },
      }),
    );
    const { files } = await presignBurst([photo(), photo(), photo()]);
    expect(files.map((f) => f.ok)).toEqual([true, true, false]);
    expect(files[2]).toEqual({
      ok: false,
      status: 409,
      code: "roll_spent",
      message: "You've taken all 24 shots on your roll.",
    });
    // The refused shot was never metered: it spends none of the hour.
    expect(meterUpload).toHaveBeenCalledTimes(2);
  });

  it("the retakes' ceiling counts them too", async () => {
    getUploadContext.mockResolvedValue(
      context({
        capture: "camera",
        roll: { used: 3, cap: 24, taken: 71, ceiling: 72 },
      }),
    );
    const { files } = await presignBurst([photo(), photo()]);
    expect(files.map((f) => f.ok)).toEqual([true, false]);
    expect(files[1].message).toBe("You've used all 3 re-shoots on your roll.");
  });
});

describe("★ who is sending refuses the whole request, in the one-file words", () => {
  it("another account's ticket: 403, and nothing is presigned or metered", async () => {
    rowRead.mockResolvedValue({
      data: { user_id: OWNER, verified_at: "2026-09-22T20:00:00Z" },
      error: null,
    });
    const { status, body } = await presignBurst([photo(), photo()]);
    expect(status).toBe(403);
    expect(body).toMatchObject({ ok: false, code: "session_other_account" });
    expect(body).not.toHaveProperty("files");
    expect(presignUpload).not.toHaveBeenCalled();
    expect(meterUpload).not.toHaveBeenCalled();
  });

  it.each([
    [
      "the platform's switch is off",
      () => guestUploadsOpen.mockResolvedValue(false),
      503,
      "uploads_paused",
    ],
    [
      "a ticket nobody knows",
      () =>
        getUploadContext.mockResolvedValue({
          ok: false,
          code: "invalid_session",
          message: "Your upload session has expired. Refresh and rejoin.",
        }),
      401,
      "invalid_session",
    ],
    [
      "uploads closed",
      () =>
        getUploadContext.mockResolvedValue(
          context({ accepting_uploads: false }),
        ),
      403,
      "uploads_closed",
    ],
    [
      "a private album",
      () =>
        getUploadContext.mockResolvedValue(context({ visibility: "private" })),
      403,
      "unauthorized",
    ],
    [
      "an album already full",
      () =>
        getUploadContext.mockResolvedValue(context({ at_storage_cap: true })),
      409,
      "cap_reached",
    ],
  ])("%s", async (_name, arrange, status, code) => {
    arrange();
    const res = await presignBurst([photo(), photo(), photo()]);
    expect(res.status).toBe(status);
    expect(res.body).toMatchObject({ ok: false, code });
    expect(presignUpload).not.toHaveBeenCalled();
  });
});

describe("a burst the route cannot read is refused whole", () => {
  it.each([
    ["no files", []],
    ["files that are not a list", { content_type: "image/jpeg" }],
    ["an entry that is not an object", [photo(), "photo"]],
    [
      `more than ${MAX_BURST_FILES} files`,
      Array.from({ length: MAX_BURST_FILES + 1 }, () => photo()),
    ],
  ])("%s", async (_name, files) => {
    const { status, body } = await presignBurst(files);
    expect(status).toBe(400);
    expect(body).toEqual({
      ok: false,
      code: "bad_request",
      message: "Invalid upload request.",
    });
    expect(meterUpload).not.toHaveBeenCalled();
  });

  it(`takes ${MAX_BURST_FILES} files in one request`, async () => {
    const { files } = await presignBurst(
      Array.from({ length: MAX_BURST_FILES }, () => photo()),
    );
    expect(files).toHaveLength(MAX_BURST_FILES);
    expect(files.every((f) => f.ok)).toBe(true);
  });
});
