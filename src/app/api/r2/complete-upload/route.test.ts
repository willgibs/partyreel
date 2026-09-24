/**
 * THE GUEST COMPLETION, HELD TO THE TICKET'S OWNER.
 *
 * A presign outlives a sign-out by up to two hours, so the owner check is asked again at the write
 * that actually credits a photograph to a row. The REAL route, pipeline and owner check run here;
 * the RPC wrappers, R2 and the two Supabase clients are the stubbed edges.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUploadContext = vi.fn();
const createMedia = vi.fn();
const mayUploadPastLock = vi.fn();
const headObjectSize = vi.fn();
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
  captureWarning: vi.fn(),
  captureError: vi.fn(),
}));
vi.mock("@/lib/forensics/capture", () => ({
  captureUploadForensics: vi.fn(),
}));
vi.mock("@/lib/r2/presign", () => ({
  presignUpload: vi.fn(),
  presignUploadPart: vi.fn(),
  createMultipartUpload: vi.fn(),
  completeMultipartUpload: vi.fn(),
  sumMultipartParts: vi.fn(),
  abortMultipartUpload: vi.fn(),
  headObjectSize: (...args: unknown[]) => headObjectSize(...args),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: () => rowRead() }) }),
    }),
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: () => getUser() } }),
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

  it("accepts a NAME-ONLY row's ticket for anyone, signed out or signed in", async () => {
    ticketBelongsTo(null);
    for (const caller of [null, OTHER]) {
      callerIs(caller);
      const { status } = await complete();
      expect(status).toBe(200);
    }
    expect(createMedia).toHaveBeenCalledTimes(2);
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

describe("the live reel's one field (a cut added to the album)", () => {
  it("writes a cut as not reel-eligible, so the live reel never plays a reel", async () => {
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
