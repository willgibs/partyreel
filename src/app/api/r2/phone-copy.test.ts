/**
 * THE PHONE-SIZE COPY THROUGH THE GUEST'S PRESIGN AND COMPLETE (take-home r1, `save=light`).
 *
 * Every new photograph gets a 2048 px JPEG beside its preview, made in her browser and PUT straight to R2. It is
 * never metered, so it is capped twice, 4 MB and half its original's bytes: on the declared sizes at presign (the
 * PUT is never minted past them) and on the HEAD's at complete (where a copy that breaks either is dropped, and the
 * photograph lands without one). It is best-effort everywhere: no copy, a missing one or a refused one never costs
 * her the upload. The REAL routes and pipeline run; R2, the RPC wrappers and the two Supabase clients are the stubbed
 * edges.
 *
 * ★ RESHAPED ON PURPOSE by upload-meter's staging (the Advisor's Q19; scar kept: both caps, on the declared sizes
 * at presign and on the HEAD's at complete, and nothing about a copy ever refusing the photograph). Every single PUT
 * is now minted at its key's `staging/` twin and copied into `events/` by the complete: the copy's PUT goes to its
 * staging twin, a staged copy within both caps is copied in, and one past either is never copied at all (the staging
 * rule deletes it, so nothing is deleted here). A copy presigned before staging (found at its key) keeps the old
 * path, a delete included.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUploadContext = vi.fn();
const createMedia = vi.fn();
const mayUploadPastLock = vi.fn();
const presignUpload = vi.fn();
const headObjectSize = vi.fn();
const headObject = vi.fn();
const copyObject = vi.fn();
const deleteR2Objects = vi.fn();
const captureWarning = vi.fn();
const rowRead = vi.fn();
const getUser = vi.fn();

vi.mock("server-only", () => ({}));
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
  captureWarning: (...args: unknown[]) => captureWarning(...args),
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
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: () => rowRead() }) }),
    }),
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: () => getUser() },
    rpc: vi.fn(async () => ({ data: 0, error: null })),
  }),
}));
vi.mock("@/lib/security/abuse-rate-limit-store", () => ({
  abuseHashes: () => ({ ipHash: "ip", scopeHash: "scope" }),
  checkAbuseRate: vi.fn(async () => ({ allowed: true })),
  recordAbuseEvent: vi.fn(async () => undefined),
}));

const presignRoute = await import("@/app/api/r2/presign-upload/route");
const completeRoute = await import("@/app/api/r2/complete-upload/route");

const MB = 1024 * 1024;
const TOKEN = "a".repeat(64);
const EVENT = "33333333-3333-4333-8333-333333333333";
const MEDIA = "44444444-4444-4444-8444-444444444444";
const OTHER_MEDIA = "55555555-5555-4555-8555-555555555555";
const ORIGINAL = `events/${EVENT}/photo/${MEDIA}/original.jpg`;
const PHONE = `events/${EVENT}/photo/${MEDIA}/phone.jpg`;
const STAGED_ORIGINAL = `staging/${EVENT}/photo/${MEDIA}/original.jpg`;
const STAGED_PHONE = `staging/${EVENT}/photo/${MEDIA}/phone.jpg`;
const stagedTwin = (key: string) => key.replace(/^events\//, "staging/");

/** What R2 holds, by key, for the HEADs the complete makes (a key not here is absent). */
let heads: Record<string, number> = {};

function context() {
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
    },
  };
}

type PresignBody = {
  ok: boolean;
  media_id?: string;
  key?: string;
  phone?: { key: string; url: string; headers: Record<string, string> };
};

async function presign(body: Record<string, unknown>) {
  const res = await presignRoute.POST(
    new Request("https://partyreel.com/api/r2/presign-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_token: TOKEN, ...body }),
    }),
  );
  return { status: res.status, body: (await res.json()) as PresignBody };
}

async function complete(extra: Record<string, unknown> = {}) {
  const res = await completeRoute.POST(
    new Request("https://partyreel.com/api/r2/complete-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_token: TOKEN,
        media_id: MEDIA,
        key: ORIGINAL,
        content_type: "image/jpeg",
        size_bytes: 3 * MB,
        upload_id: null,
        parts: [],
        ...extra,
      }),
    }),
  );
  return {
    status: res.status,
    body: (await res.json()) as { ok: boolean; code?: string },
  };
}

/** What `createMedia` was asked to record. */
const recorded = () =>
  createMedia.mock.calls[0]?.[0] as
    | { phoneKey?: string | null; phoneBytes?: number | null }
    | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  getUploadContext.mockResolvedValue(context());
  mayUploadPastLock.mockResolvedValue(true);
  presignUpload.mockImplementation(async (p: { key: string }) => ({
    url: `https://r2.example/put/${p.key}`,
    headers: {},
  }));
  rowRead.mockResolvedValue({
    data: { user_id: null, verified_at: null },
    error: null,
  });
  getUser.mockResolvedValue({ data: { user: null } });
  createMedia.mockResolvedValue({
    ok: true,
    data: { media_id: MEDIA, status: "approved" },
  });
  // A staged photograph of 3 MB and its staged copy of 0.55 MB, as every upload since staging lands.
  heads = {
    [STAGED_ORIGINAL]: 3 * MB,
    [STAGED_PHONE]: Math.round(0.55 * MB),
  };
  headObject.mockImplementation(async ({ key }: { key: string }) =>
    key in heads ? { size: heads[key], lastModified: null } : null,
  );
  headObjectSize.mockResolvedValue(3 * MB);
  copyObject.mockResolvedValue(undefined);
  deleteR2Objects.mockResolvedValue({ deleted: 1, errored: [] });
});

describe("presign: the phone copy's PUT, minted beside the photograph's", () => {
  it("mints a size-bound JPEG PUT at the staging twin of the photograph's own phone key", async () => {
    const { status, body } = await presign({
      content_type: "image/jpeg",
      size_bytes: 3 * MB,
      phone_size_bytes: 600_000,
    });
    expect(status).toBe(200);
    expect(body.phone?.key).toBe(
      `events/${EVENT}/photo/${body.media_id}/phone.jpg`,
    );
    expect(presignUpload).toHaveBeenCalledWith({
      key: stagedTwin(body.phone!.key),
      contentType: "image/jpeg",
      contentLength: 600_000,
    });
  });

  it.each([
    ["past 4 MB", { size_bytes: 40 * MB, phone_size_bytes: 4 * MB + 1 }],
    [
      "past half the original",
      { size_bytes: 1_000_000, phone_size_bytes: 500_001 },
    ],
  ])("mints none %s, and the photograph still uploads", async (_, sizes) => {
    const { status, body } = await presign({
      content_type: "image/jpeg",
      ...sizes,
    });
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.phone).toBeUndefined();
    expect(presignUpload).toHaveBeenCalledTimes(1);
    expect(presignUpload.mock.calls[0][0].key).toBe(stagedTwin(body.key!));
  });

  it("mints none for a video: a clip stays as taken", async () => {
    const { body } = await presign({
      content_type: "video/mp4",
      size_bytes: 30 * MB,
      phone_size_bytes: 600_000,
    });
    expect(body.ok).toBe(true);
    expect(body.phone).toBeUndefined();
  });

  it("answers an upload that asks for none exactly as before", async () => {
    const { body } = await presign({
      content_type: "image/jpeg",
      size_bytes: 3 * MB,
    });
    expect(body.phone).toBeUndefined();
    expect(Object.keys(body)).toEqual([
      "ok",
      "strategy",
      "media_id",
      "key",
      "content_type",
      "url",
      "headers",
    ]);
  });
});

describe("complete: the copy recorded on its HEAD's size, or dropped", () => {
  it("records the copy with the size R2 holds, never the client's word, copied in from staging", async () => {
    heads[STAGED_PHONE] = 612_345;
    const { status } = await complete({ phone_key: PHONE });
    expect(status).toBe(200);
    expect(headObject).toHaveBeenCalledWith({ key: STAGED_PHONE });
    expect(copyObject).toHaveBeenCalledWith({
      sourceKey: STAGED_PHONE,
      destinationKey: PHONE,
    });
    expect(recorded()).toMatchObject({ phoneKey: PHONE, phoneBytes: 612_345 });
    expect(deleteR2Objects).not.toHaveBeenCalled();
  });

  it("records none for an upload that sent none", async () => {
    await complete();
    expect(headObject).not.toHaveBeenCalledWith({ key: STAGED_PHONE });
    expect(headObject).not.toHaveBeenCalledWith({ key: PHONE });
    expect(recorded()).toMatchObject({ phoneKey: null, phoneBytes: null });
  });

  it("refuses a phone key that names another upload, as it refuses a stranger's preview", async () => {
    const { status, body } = await complete({
      phone_key: `events/${EVENT}/photo/${OTHER_MEDIA}/phone.jpg`,
    });
    expect(status).toBe(400);
    expect(body.code).toBe("bad_key");
    expect(createMedia).not.toHaveBeenCalled();
  });

  it("refuses a phone key on a video, and any other variant in its slot", async () => {
    const video = await complete({
      key: `events/${EVENT}/video/${MEDIA}/original.mp4`,
      content_type: "video/mp4",
      phone_key: `events/${EVENT}/video/${MEDIA}/phone.jpg`,
    });
    expect(video.status).toBe(400);
    const preview = await complete({
      phone_key: `events/${EVENT}/photo/${MEDIA}/preview.webp`,
    });
    expect(preview.status).toBe(400);
    expect(createMedia).not.toHaveBeenCalled();
  });

  it("lands the photograph without a copy whose object is not there", async () => {
    delete heads[STAGED_PHONE];
    const { status } = await complete({ phone_key: PHONE });
    expect(status).toBe(200);
    expect(recorded()).toMatchObject({ phoneKey: null, phoneBytes: null });
    expect(captureWarning).toHaveBeenCalledWith(
      "upload",
      "phone_copy_missing",
      expect.objectContaining({ media_id: MEDIA }),
    );
  });

  it.each([
    ["heavier than half its original", 3 * MB, Math.round(1.5 * MB) + 1],
    ["past 4 MB", 40 * MB, 4 * MB + 1],
  ])(
    "drops a staged copy %s, never copies it in, and still lands the photograph",
    async (_, original, phone) => {
      heads[STAGED_ORIGINAL] = original;
      heads[STAGED_PHONE] = phone;
      const { status } = await complete({ phone_key: PHONE });
      expect(status).toBe(200);
      expect(recorded()).toMatchObject({ phoneKey: null, phoneBytes: null });
      expect(copyObject).not.toHaveBeenCalledWith(
        expect.objectContaining({ sourceKey: STAGED_PHONE }),
      );
      // Staged, it is the staging rule's to delete: nothing here deletes it, and nothing in events/ needs deleting.
      expect(deleteR2Objects).not.toHaveBeenCalled();
      expect(captureWarning).toHaveBeenCalledWith(
        "upload",
        "phone_copy_over_cap",
        expect.objectContaining({ media_id: MEDIA, phoneBytes: phone }),
      );
    },
  );

  it("a copy presigned before staging, found at its key past a cap, is dropped and its object deleted, as before", async () => {
    heads = { [PHONE]: Math.round(1.5 * MB) + 1 };
    headObjectSize.mockResolvedValue(3 * MB);
    const { status } = await complete({ phone_key: PHONE });
    expect(status).toBe(200);
    expect(recorded()).toMatchObject({ phoneKey: null, phoneBytes: null });
    expect(deleteR2Objects).toHaveBeenCalledWith([PHONE]);
  });

  it("measures half against the original R2 holds (a short multipart), never the declared size", async () => {
    // Declared 3 MB, but only 1 MB landed: a 600 KB copy is past half of what is stored.
    heads = { [STAGED_PHONE]: 600_000 };
    headObjectSize.mockResolvedValue(1 * MB);
    await complete({
      phone_key: PHONE,
      size_bytes: 3 * MB,
      upload_id: "upload-1",
      parts: [{ partNumber: 1, eTag: "e1" }],
    });
    expect(recorded()).toMatchObject({ phoneKey: null, phoneBytes: null });
    expect(copyObject).not.toHaveBeenCalled();
  });

  it("a delete that fails is said, and the photograph still lands", async () => {
    heads = { [PHONE]: 4 * MB + 1 };
    headObjectSize.mockResolvedValue(40 * MB);
    deleteR2Objects.mockRejectedValue(new Error("R2 is down"));
    const { status } = await complete({ phone_key: PHONE });
    expect(status).toBe(200);
    expect(captureWarning).toHaveBeenCalledWith(
      "upload",
      "phone_copy_delete_failed",
      expect.objectContaining({ key: PHONE }),
    );
  });
});
