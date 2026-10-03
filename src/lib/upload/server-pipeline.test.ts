/**
 * THE ENGINE'S METER THROUGH THE HOST'S PRESIGN (upload-meter, 20261003210500). The guest's path is its route's own
 * test (`src/app/api/r2/presign-upload/route.test.ts`); this is the host's: the REAL route, its strategy and the
 * engine, with the edges stubbed (the context RPC, the meter, R2, the session). A host's upload counts against her
 * month at its presign like a guest's, and every refusal names her plan, never leaks an event, and mints nothing.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const getHostUploadContext = vi.fn();
const meterUpload = vi.fn();
const presignUpload = vi.fn();
const getUser = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, getAll: () => [] }),
}));
vi.mock("@/lib/db/mutations/host-media", () => ({
  getHostUploadContext: (...args: unknown[]) => getHostUploadContext(...args),
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
  headObjectSize: vi.fn(),
  headObject: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: () => getUser() } }),
}));

const { POST } = await import("@/app/api/host/r2/presign-upload/route");
const { previewRefusal, PREVIEW_HEAVIER_THAN_ORIGINAL, PREVIEW_PAST_ITS_CAP } =
  await import("@/lib/upload/server-pipeline");
const { MAX_PREVIEW_BYTES } = await import("@/lib/media/preview-size");

const EVENT = "33333333-3333-4333-8333-333333333333";
const HOST = "11111111-1111-4111-8111-111111111111";

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
});

describe("the host's presign counts too", () => {
  it("★ counts her declared bytes once, for the event she owns, before any URL is minted", async () => {
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

  it("a signed-out caller or an event she does not own is never counted", async () => {
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
      "You've hit this plan's upload limit for the month.",
    ],
    [
      "hourly",
      { ok: false, reason: "hourly", retryAfterSec: 60 },
      429,
      "rate_limited",
      "You've uploaded a lot this hour. Try again in a little while.",
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

  it("★ a meter that cannot answer refuses her upload too (fail CLOSED)", async () => {
    meterUpload.mockResolvedValue({ ok: false, reason: "unavailable" });
    const res = await hostPresign();
    expect(res.status).toBe(503);
    expect(res.body.code).toBe("server_error");
    expect(presignUpload).not.toHaveBeenCalled();
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
