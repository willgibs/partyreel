/**
 * THE HOST'S PRESIGN SAYS THE ROOM IN THE METER'S NUMBERS, NEVER IN A BARE "FULL" (crumbs-72). The context's early
 * answer (`get_host_upload_context`) knows only that the account is full; the meter (`meter_upload`) knows the room THIS
 * file needs, what Deleted holds and whether her setting lets Deleted make the room. A full account used to be refused at
 * the context with a sentence that had none of it, so the numbers were only ever read for an account that was not yet
 * full. The route's engine, strategy and meter refusal are real here; the edges are stubbed (the context RPC, the meter,
 * R2, the session). The rest of the host's presign is `src/lib/upload/server-pipeline.test.ts`.
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
  createMediaAsHost: vi.fn(),
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
  copyObject: vi.fn(),
}));
vi.mock("@/lib/r2/delete", () => ({ deleteR2Objects: vi.fn() }));
vi.mock("@/lib/upload/server-pipeline-recorded", () => ({
  readRecordedUpload: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: () => getUser() } }),
}));

const { POST } = await import("./route");
const { roomRefusalWords } =
  await import("@/components/app/storage/storage-figures");

const EVENT = "33333333-3333-4333-8333-333333333333";
const HOST = "11111111-1111-4111-8111-111111111111";
const FILE_BYTES = 4_000_000;

function context(over: Record<string, unknown> = {}) {
  return {
    ok: true,
    data: {
      event_id: EVENT,
      at_storage_cap: false,
      at_monthly_cap: false,
      video_blocked: false,
      ...over,
    },
  };
}

async function presign() {
  const res = await POST(
    new Request("https://partyreel.com/api/host/r2/presign-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: EVENT,
        content_type: "image/jpeg",
        size_bytes: FILE_BYTES,
      }),
    }),
  );
  return {
    status: res.status,
    body: (await res.json()) as {
      ok: boolean;
      code?: string;
      message?: string;
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getUser.mockResolvedValue({ data: { user: { id: HOST } } });
  getHostUploadContext.mockResolvedValue(context());
  meterUpload.mockResolvedValue({ ok: true });
  presignUpload.mockResolvedValue({
    url: "https://r2.example/put",
    headers: {},
  });
});

describe("★ a full account is refused in the meter's numbers, not in a bare 'full'", () => {
  it.each([
    [
      "Make room on: the file only has to fit beside her albums",
      { neededBytes: 5_000_000, deletedBytes: 2_000_000, makesRoom: true },
    ],
    [
      "Make room off, Deleted enough to empty",
      { neededBytes: 1_000_000, deletedBytes: 3_000_000, makesRoom: false },
    ],
    [
      "Make room off, Deleted not enough",
      { neededBytes: 9_000_000, deletedBytes: 3_000_000, makesRoom: false },
    ],
  ])("%s", async (_name, numbers) => {
    // The context says full, as the database does for any file once the room is at its cap and 10%.
    getHostUploadContext.mockResolvedValue(context({ at_storage_cap: true }));
    meterUpload.mockResolvedValue({ ok: false, reason: "storage", ...numbers });
    const { status, body } = await presign();
    expect(status).toBe(409);
    expect(body.code).toBe("cap_reached");
    // The room THIS file needs, and the one way to make it: `roomRefusalWords`' own sentence, whole.
    expect(body.message).toBe(roomRefusalWords(numbers));
    expect(body.message).toMatch(/needs \d/);
    expect(body.message).not.toMatch(/Storage is full/);
    expect(presignUpload).not.toHaveBeenCalled();
  });

  it("the meter is asked for the full account's file, once, with its declared bytes (the context never answers for it)", async () => {
    getHostUploadContext.mockResolvedValue(context({ at_storage_cap: true }));
    meterUpload.mockResolvedValue({
      ok: false,
      reason: "storage",
      neededBytes: 5_000_000,
      deletedBytes: 0,
      makesRoom: true,
    });
    await presign();
    expect(meterUpload).toHaveBeenCalledTimes(1);
    expect(meterUpload).toHaveBeenCalledWith({
      eventId: EVENT,
      kind: "photo",
      bytes: FILE_BYTES,
    });
  });

  it("a database that sends no numbers keeps the plain sentence, which still says the file", async () => {
    getHostUploadContext.mockResolvedValue(context({ at_storage_cap: true }));
    meterUpload.mockResolvedValue({
      ok: false,
      reason: "storage",
      neededBytes: null,
      deletedBytes: null,
      makesRoom: null,
    });
    const { status, body } = await presign();
    expect(status).toBe(409);
    expect(body.message).toBe(roomRefusalWords({}));
  });
});

describe("the plan's month is still refused at the context, in the meter's own sentence", () => {
  const MONTH = "You've hit this plan's upload limit for now.";

  it("a spent month never reaches the meter", async () => {
    getHostUploadContext.mockResolvedValue(context({ at_monthly_cap: true }));
    const { status, body } = await presign();
    expect(status).toBe(409);
    expect(body).toEqual({ ok: false, code: "cap_reached", message: MONTH });
    expect(meterUpload).not.toHaveBeenCalled();
  });

  it("the month is said first when both are spent, as the meter orders them", async () => {
    getHostUploadContext.mockResolvedValue(
      context({ at_monthly_cap: true, at_storage_cap: true }),
    );
    const { body } = await presign();
    expect(body.message).toBe(MONTH);
    expect(meterUpload).not.toHaveBeenCalled();
  });
});
