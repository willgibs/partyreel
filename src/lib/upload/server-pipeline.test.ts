/**
 * THE ENGINE'S METER AND STAGING THROUGH THE HOST'S ROUTES (upload-meter, 20261003210500, reworked on the Advisor's
 * Q19). The guest's path is its routes' own tests (`src/app/api/r2/presign-upload/route.test.ts`,
 * `complete-upload/route.test.ts`); this is the host's: the REAL routes, their strategies and the engine, with the
 * edges stubbed (the context RPC, the meter, R2, the session, the record). A host's upload meets the meter at its
 * presign like a guest's (every refusal in her plan's words, never an event leaked, nothing minted), its single PUTs are
 * minted at their staging twins, and its complete copies them in before the row counts the month.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const getHostUploadContext = vi.fn();
const createMediaAsHost = vi.fn();
const meterUpload = vi.fn();
const presignUpload = vi.fn();
const headObject = vi.fn();
const headObjectSize = vi.fn();
const copyObject = vi.fn();
const deleteR2Objects = vi.fn();
const getUser = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, getAll: () => [] }),
}));
vi.mock("@/lib/db/mutations/host-media", () => ({
  getHostUploadContext: (...args: unknown[]) => getHostUploadContext(...args),
  createMediaAsHost: (...args: unknown[]) => createMediaAsHost(...args),
}));
vi.mock("@/lib/upload/server-pipeline-meter", () => ({
  meterUpload: (...args: unknown[]) => meterUpload(...args),
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: vi.fn(),
  captureError: vi.fn(),
}));
vi.mock("@/lib/forensics/capture", () => ({
  captureUploadForensics: vi.fn(),
}));
vi.mock("@/lib/r2/presign", () => ({
  presignUpload: (...args: unknown[]) => presignUpload(...args),
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
// The row a complete may already have (crumbs-62): none unless a case records one.
const readRecordedUpload = vi.fn();
vi.mock("@/lib/upload/server-pipeline-recorded", () => ({
  readRecordedUpload: (...args: unknown[]) => readRecordedUpload(...args),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: () => getUser() } }),
}));

const { POST } = await import("@/app/api/host/r2/presign-upload/route");
const complete = await import("@/app/api/host/r2/complete-upload/route");
const { STAGING_PREFIX, stagingKeyFor } = await import("@/lib/r2/keys");
const { previewRefusal, PREVIEW_HEAVIER_THAN_ORIGINAL, PREVIEW_PAST_ITS_CAP } =
  await import("@/lib/upload/server-pipeline");
const { MAX_PREVIEW_BYTES } = await import("@/lib/media/preview-size");

const EVENT = "33333333-3333-4333-8333-333333333333";
const HOST = "11111111-1111-4111-8111-111111111111";
const MEDIA = "44444444-4444-4444-8444-444444444444";

async function hostPresign(over: Record<string, unknown> = {}) {
  const res = await POST(
    new Request("https://partyreel.com/api/host/r2/presign-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: EVENT,
        content_type: "image/jpeg",
        size_bytes: 4_000_000,
        ...over,
      }),
    }),
  );
  return {
    status: res.status,
    retryAfter: res.headers.get("Retry-After"),
    body: (await res.json()) as {
      ok: boolean;
      code?: string;
      message?: string;
      preview_refused?: string;
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getUser.mockResolvedValue({ data: { user: { id: HOST } } });
  getHostUploadContext.mockResolvedValue({
    ok: true,
    data: {
      event_id: EVENT,
      at_storage_cap: false,
      at_monthly_cap: false,
      video_blocked: false,
    },
  });
  meterUpload.mockResolvedValue({ ok: true });
  presignUpload.mockResolvedValue({
    url: "https://r2.example/put",
    headers: {},
  });
  createMediaAsHost.mockResolvedValue({
    ok: true,
    data: { media_id: MEDIA, status: "approved" },
  });
  headObject.mockResolvedValue(null);
  copyObject.mockResolvedValue(undefined);
  deleteR2Objects.mockResolvedValue({ deleted: 1, errored: [] });
  readRecordedUpload.mockResolvedValue(null);
});

describe("the host's presign meets the meter too", () => {
  it("★ asks the meter once, with her declared bytes, for the event she owns, before any URL is minted", async () => {
    const { status } = await hostPresign();
    expect(status).toBe(200);
    expect(meterUpload).toHaveBeenCalledTimes(1);
    expect(meterUpload).toHaveBeenCalledWith({
      eventId: EVENT,
      kind: "photo",
      bytes: 4_000_000,
    });
    expect(meterUpload.mock.invocationCallOrder[0]).toBeLessThan(
      presignUpload.mock.invocationCallOrder[0]!,
    );
  });

  it("a signed-out caller or an event she does not own never reaches the meter", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect((await hostPresign()).status).toBe(401);
    getUser.mockResolvedValue({ data: { user: { id: HOST } } });
    getHostUploadContext.mockResolvedValue({
      ok: false,
      code: "not_owner",
      message: "This event isn't available.",
    });
    expect((await hostPresign()).status).toBe(404);
    expect(meterUpload).not.toHaveBeenCalled();
  });

  it.each([
    [
      "storage",
      { ok: false, reason: "storage" },
      409,
      "cap_reached",
      "This file won't fit in your plan's storage. Free up space or upgrade.",
    ],
    [
      "monthly",
      { ok: false, reason: "monthly" },
      409,
      "cap_reached",
      "You've hit this plan's upload limit for now.",
    ],
    [
      "hourly",
      { ok: false, reason: "hourly", retryAfterSec: 60 },
      429,
      "rate_limited",
      "Your albums have taken a lot of uploads this hour. Try again in a little while.",
    ],
    [
      "event_gone",
      { ok: false, reason: "event_gone" },
      404,
      "not_found",
      "This event isn't available.",
    ],
  ])(
    "★ the meter's %s refusal reaches her in her plan's words, and nothing is presigned",
    async (_reason, answer, status, code, message) => {
      meterUpload.mockResolvedValue(answer);
      const res = await hostPresign();
      expect(res.status).toBe(status);
      expect(res.body).toEqual({ ok: false, code, message });
      expect(res.retryAfter).toBe(code === "rate_limited" ? "60" : null);
      expect(presignUpload).not.toHaveBeenCalled();
    },
  );

  it("★ a meter that cannot answer lets her upload go (fail OPEN)", async () => {
    meterUpload.mockResolvedValue({ ok: false, reason: "unavailable" });
    const res = await hostPresign();
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(presignUpload).toHaveBeenCalledTimes(1);
  });

  it("her preview heavier than its original is refused in words, the original presigned", async () => {
    const res = await hostPresign({
      size_bytes: 10_000,
      preview_size_bytes: 10_001,
    });
    expect(res.status).toBe(200);
    expect(res.body.preview_refused).toBe(PREVIEW_HEAVIER_THAN_ORIGINAL);
    expect(presignUpload).toHaveBeenCalledTimes(1);
  });
});

describe("previewRefusal, the one rule", () => {
  it("refuses past 2 MB first, then past its original, and lets the rest go", () => {
    expect(previewRefusal(MAX_PREVIEW_BYTES + 1, 10 * MAX_PREVIEW_BYTES)).toBe(
      PREVIEW_PAST_ITS_CAP,
    );
    expect(previewRefusal(MAX_PREVIEW_BYTES + 1, 1)).toBe(PREVIEW_PAST_ITS_CAP);
    expect(previewRefusal(1001, 1000)).toBe(PREVIEW_HEAVIER_THAN_ORIGINAL);
    expect(previewRefusal(1000, 1000)).toBeNull();
    expect(previewRefusal(MAX_PREVIEW_BYTES, MAX_PREVIEW_BYTES)).toBeNull();
    expect(previewRefusal(1, 10_000_000_000)).toBeNull();
  });

  it("each sentence says what happens to the tile, and names the cap it holds", () => {
    expect(PREVIEW_PAST_ITS_CAP).toBe(
      "A preview can be at most 2 MB, so this upload's tile shows the file itself.",
    );
    for (const sentence of [
      PREVIEW_PAST_ITS_CAP,
      PREVIEW_HEAVIER_THAN_ORIGINAL,
    ]) {
      expect(sentence).toMatch(/tile shows the file itself\.$/);
      expect(sentence).not.toMatch(/[—–]/);
    }
  });
});

describe("the host's staging", () => {
  const ORIGINAL = `events/${EVENT}/photo/${MEDIA}/original.jpg`;
  const STAGED = `staging/${EVENT}/photo/${MEDIA}/original.jpg`;

  async function hostComplete(over: Record<string, unknown> = {}) {
    const res = await complete.POST(
      new Request("https://partyreel.com/api/host/r2/complete-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: EVENT,
          media_id: MEDIA,
          key: ORIGINAL,
          content_type: "image/jpeg",
          size_bytes: 4_000_000,
          upload_id: null,
          parts: [],
          ...over,
        }),
      }),
    );
    return { status: res.status, body: (await res.json()) as { ok: boolean } };
  }

  it("★ her single PUT is minted at its staging twin; the answer names its events/ key", async () => {
    const res = await hostPresign();
    expect(res.status).toBe(200);
    const minted = (presignUpload.mock.calls[0]![0] as { key: string }).key;
    expect(minted.startsWith(STAGING_PREFIX)).toBe(true);
    expect(minted.replace(/^staging\//, "events/")).toMatch(
      new RegExp(`^events/${EVENT}/photo/[0-9a-f-]{36}/original\\.jpg$`),
    );
  });

  it("★ her complete copies the staged object in, then records it on the staged HEAD's size", async () => {
    headObject.mockImplementation(async ({ key }: { key: string }) =>
      key === STAGED ? { size: 3_999_999, lastModified: null } : null,
    );
    const { status } = await hostComplete();
    expect(status).toBe(200);
    expect(copyObject).toHaveBeenCalledWith({
      sourceKey: STAGED,
      destinationKey: ORIGINAL,
    });
    expect(createMediaAsHost.mock.calls[0]![0]).toMatchObject({
      hostId: HOST,
      originalKey: ORIGINAL,
      fileSizeBytes: 3_999_999,
    });
    expect(headObjectSize).not.toHaveBeenCalled();
  });

  it("a refused record of hers takes the copy back out of events/", async () => {
    headObject.mockImplementation(async ({ key }: { key: string }) =>
      key === STAGED ? { size: 1000, lastModified: null } : null,
    );
    createMediaAsHost.mockResolvedValue({
      ok: false,
      code: "cap_reached",
      message: "Storage capacity exceeded for this plan.",
    });
    const { status } = await hostComplete();
    expect(status).toBe(409);
    expect(deleteR2Objects).toHaveBeenCalledWith([ORIGINAL]);
  });

  /**
   * ★ HER COMPLETE SENT AGAIN IS ITS ROW'S TO ANSWER (crumbs-62, red-team 49's LOW): a recorded upload's complete that
   * comes again (an answer lost on the way back) used to land her staged file a second time and meet her plan again,
   * where the room her own bytes now fill refused it and withdrew the file her row names; a signed-in stranger's
   * complete for it (ownership refused) withdrew it the same way. Answered by the row now, before anything moves.
   */
  it.each([
    [
      "her room, full with its own bytes",
      {
        ok: false,
        code: "cap_reached",
        message: "Storage capacity exceeded for this plan.",
      },
    ],
    [
      "a signed-in stranger's, whose event it is not",
      {
        ok: false,
        code: "not_owner",
        message: "This event isn't available.",
      },
    ],
  ])(
    "★ sent again and refused by %s: answered `recorded` from its row, her file kept",
    async (_who, refusal) => {
      headObject.mockImplementation(async ({ key }: { key: string }) =>
        key === STAGED ? { size: 1000, lastModified: null } : null,
      );
      expect((await hostComplete()).body).toEqual({
        ok: true,
        status: "approved",
      });
      readRecordedUpload.mockResolvedValue({ originalKey: ORIGINAL });
      createMediaAsHost.mockResolvedValue(refusal);

      const again = await hostComplete();
      expect(again.status).toBe(200);
      expect(again.body).toEqual({ ok: true, status: "recorded" });
      expect(copyObject).toHaveBeenCalledTimes(1);
      expect(createMediaAsHost).toHaveBeenCalledTimes(1);
      expect(deleteR2Objects).not.toHaveBeenCalled();
    },
  );
});

describe("stagingKeyFor, the staging twin", () => {
  it("maps exactly our media layout, every variant, and nothing else", () => {
    const id = "44444444-4444-4444-8444-444444444444";
    for (const tail of [
      `photo/${id}/original.jpg`,
      `photo/${id}/preview.webp`,
      `photo/${id}/phone.jpg`,
      `video/${id}/original.mp4`,
    ]) {
      expect(stagingKeyFor(`events/${EVENT}/${tail}`)).toBe(
        `${STAGING_PREFIX}${EVENT}/${tail}`,
      );
    }
    for (const notOurs of [
      `staging/${EVENT}/photo/${id}/original.jpg`,
      `preservation/${EVENT}/${id}/original.jpg`,
      `events/${EVENT}/photo/not-a-uuid/original.jpg`,
      `events/${EVENT}/photo/${id}/x/original.jpg`,
      "avatars/someone.jpg",
      "",
    ]) {
      expect(stagingKeyFor(notOurs), notOurs).toBeNull();
    }
  });

  it("is outside events/, the one prefix the backup's reconcile and the orphan sweep read", () => {
    expect(STAGING_PREFIX).toBe("staging/");
    expect(STAGING_PREFIX.startsWith("events/")).toBe(false);
  });
});

/**
 * ★ THE HOST'S ROUTES TAKE A BURST WITH NO CHANGE OF THEIRS (compute-uploads): the engine reads the burst's body for
 * every strategy, and a strategy written before bursts (the host's, which reads no `Burst`) runs each file through
 * its own gates as ever. Her 401 still comes before the body is read.
 */
describe("the host's routes take a burst", () => {
  const IDS = [
    "44444444-4444-4444-8444-444444444441",
    "44444444-4444-4444-8444-444444444442",
  ];
  const keyOf = (id: string) => `events/${EVENT}/photo/${id}/original.jpg`;

  async function hostBurst(
    route: (req: Request) => Promise<Response>,
    files: unknown[],
  ) {
    const res = await route(
      new Request("https://partyreel.com/api/host/r2/burst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: EVENT, files }),
      }),
    );
    return {
      status: res.status,
      body: (await res.json()) as {
        ok: boolean;
        code?: string;
        files?: { ok: boolean; code?: string; status?: unknown }[];
      },
    };
  }

  it("presigns each file in her plan's words, a clip on a photos-only plan refused alone", async () => {
    getHostUploadContext.mockImplementation(
      async (_event: string, kind: string) => ({
        ok: true,
        data: {
          event_id: EVENT,
          at_storage_cap: false,
          at_monthly_cap: false,
          video_blocked: kind === "video",
        },
      }),
    );
    const { status, body } = await hostBurst(POST, [
      { content_type: "image/jpeg", size_bytes: 1000 },
      { content_type: "video/mp4", size_bytes: 5000 },
      { content_type: "image/jpeg", size_bytes: 2000 },
    ]);
    expect(status).toBe(200);
    expect(body.files?.map((f) => f.ok)).toEqual([true, false, true]);
    expect(body.files?.[1]).toMatchObject({
      status: 403,
      code: "video_not_allowed",
    });
    // The meter, each admitted file once, with the bytes before it.
    expect(meterUpload.mock.calls.map(([a]) => a.bytes)).toEqual([1000, 3000]);
  });

  it("records each file once; a refused one alone takes its copy back out", async () => {
    headObject.mockImplementation(async ({ key }: { key: string }) =>
      key.startsWith(STAGING_PREFIX)
        ? { size: 1000, lastModified: null }
        : null,
    );
    createMediaAsHost.mockImplementation(
      async ({ mediaId }: { mediaId: string }) =>
        mediaId === IDS[0]
          ? { ok: false, code: "cap_reached", message: "Storage is full." }
          : { ok: true, data: { media_id: mediaId, status: "approved" } },
    );
    const { status, body } = await hostBurst(
      complete.POST,
      IDS.map((id) => ({
        media_id: id,
        key: keyOf(id),
        content_type: "image/jpeg",
        size_bytes: 1000,
        upload_id: null,
        parts: [],
      })),
    );
    expect(status).toBe(200);
    expect(body.files).toEqual([
      {
        ok: false,
        status: 409,
        code: "cap_reached",
        message: "Storage is full.",
      },
      { ok: true, status: "approved" },
    ]);
    expect(createMediaAsHost).toHaveBeenCalledTimes(2);
    expect(deleteR2Objects).toHaveBeenCalledWith([keyOf(IDS[0])]);
  });

  it("a signed-out caller is refused before her burst is read", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { status, body } = await hostBurst(POST, [
      { content_type: "image/jpeg", size_bytes: 1000 },
    ]);
    expect(status).toBe(401);
    expect(body.code).toBe("unauthorized");
    expect(getHostUploadContext).not.toHaveBeenCalled();
  });
});
