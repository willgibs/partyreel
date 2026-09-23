/**
 * THE GUEST PRESIGN, HELD TO THE TICKET'S OWNER (the upload-owner lane, 2026-09-23).
 *
 * The alias red-team: a browser that kept a confirmed guest's ticket credited the next person's
 * photograph to that guest (another account signed in, or anyone signed out, past Require verified
 * emails, because `create_media` reads the ROW's `verified_at`). The route now asks whose ticket it
 * is before a single byte is presigned. These run the REAL route, pipeline and owner check; only
 * the edges are stubbed (the RPC wrapper, R2, the two Supabase clients), so the row's account and
 * the caller are the two dials every case turns.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUploadContext = vi.fn();
const mayUploadPastLock = vi.fn();
const presignUpload = vi.fn();
const rowRead = vi.fn();
const getUser = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, getAll: () => [] }),
}));
vi.mock("@/lib/db/mutations/guest", () => ({
  getUploadContext: (...args: unknown[]) => getUploadContext(...args),
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
  presignUpload: (...args: unknown[]) => presignUpload(...args),
  presignUploadPart: vi.fn(),
  createMultipartUpload: vi.fn(),
  completeMultipartUpload: vi.fn(),
  sumMultipartParts: vi.fn(),
  abortMultipartUpload: vi.fn(),
  headObjectSize: vi.fn(),
}));
// The owner check itself runs for real: only the row read and the caller are dialled here.
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

const { POST } = await import("@/app/api/r2/presign-upload/route");

const TOKEN = "a".repeat(64);
const EVENT = "33333333-3333-4333-8333-333333333333";
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

/**
 * The row the posted ticket names: `null` is a name-only row, an id is an account's (confirmed, as
 * the red-team's was). `verifiedAt` alone, with no account, is a deleted account's confirmed row.
 */
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

async function presign() {
  const res = await POST(
    new Request("https://partyreel.com/api/r2/presign-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_token: TOKEN,
        content_type: "image/jpeg",
        size_bytes: 1000,
      }),
    }),
  );
  const body = (await res.json()) as {
    ok: boolean;
    code?: string;
    message?: string;
  };
  return { status: res.status, body };
}

beforeEach(() => {
  vi.clearAllMocks();
  getUploadContext.mockResolvedValue(context());
  mayUploadPastLock.mockResolvedValue(true);
  presignUpload.mockResolvedValue({
    url: "https://r2.example/put",
    headers: {},
  });
  ticketBelongsTo(null);
  callerIs(null);
});

describe("an account's ticket presigns only for that account", () => {
  it("★ refuses a claimed row's ticket to a SIGNED-OUT caller, and presigns nothing", async () => {
    ticketBelongsTo(OWNER);
    callerIs(null);
    const { status, body } = await presign();
    expect(status).toBe(403);
    expect(body.code).toBe("session_other_account");
    expect(presignUpload).not.toHaveBeenCalled();
  });

  it("★ refuses it to ANOTHER signed-in account", async () => {
    ticketBelongsTo(OWNER);
    callerIs(OTHER);
    const { status, body } = await presign();
    expect(status).toBe(403);
    expect(body.code).toBe("session_other_account");
    expect(presignUpload).not.toHaveBeenCalled();
  });

  it("accepts it for its OWNER", async () => {
    ticketBelongsTo(OWNER);
    callerIs(OWNER);
    const { status, body } = await presign();
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(presignUpload).toHaveBeenCalled();
  });

  it("accepts a NAME-ONLY row's ticket for anyone, signed out or signed in", async () => {
    ticketBelongsTo(null);
    for (const caller of [null, OTHER]) {
      callerIs(caller);
      const { status } = await presign();
      expect(status).toBe(200);
    }
    // And the anonymous crowd never pays the Auth round trip for it.
    expect(getUser).not.toHaveBeenCalled();
  });

  it("★ outranks the identity gate: a confirmed person's ticket no longer carries a signed-out visitor past Require verified emails", async () => {
    // The row is the confirmed account's (guest_verified: true, as the RPC reports the ROW), so
    // the identity gate alone would wave this through. The owner check does not.
    getUploadContext.mockResolvedValue(
      context({ require_verified_email: true, guest_verified: true }),
    );
    ticketBelongsTo(OWNER);
    callerIs(null);
    const { status, body } = await presign();
    expect(status).toBe(403);
    expect(body.code).toBe("session_other_account");
    expect(presignUpload).not.toHaveBeenCalled();
  });

  it("★ a DELETED account's confirmed row presigns for nobody: the same hole by another road", async () => {
    // Deleting an account nulls guests.user_id and leaves verified_at, which create_media reads.
    getUploadContext.mockResolvedValue(
      context({ require_verified_email: true, guest_verified: true }),
    );
    ticketBelongsTo(null, "2026-09-22T20:00:00Z");
    for (const caller of [null, OTHER]) {
      callerIs(caller);
      const { status, body } = await presign();
      expect(status).toBe(403);
      expect(body.code).toBe("session_other_account");
    }
    expect(presignUpload).not.toHaveBeenCalled();
  });

  it("the refusal never names whose ticket it was", async () => {
    ticketBelongsTo(OWNER);
    callerIs(OTHER);
    const { body } = await presign();
    expect(JSON.stringify(body)).not.toContain(OWNER);
  });
});

describe("the ladder around it", () => {
  it("a private event still answers first: the lock outranks every other upload state", async () => {
    getUploadContext.mockResolvedValue(context({ visibility: "private" }));
    ticketBelongsTo(OWNER);
    callerIs(null);
    const { status, body } = await presign();
    expect(status).toBe(403);
    expect(body.code).toBe("unauthorized");
    expect(rowRead).not.toHaveBeenCalled();
  });

  it("closed uploads still answer first: the truer sentence when it holds for everybody", async () => {
    getUploadContext.mockResolvedValue(context({ accepting_uploads: false }));
    ticketBelongsTo(OWNER);
    callerIs(null);
    const { body } = await presign();
    expect(body.code).toBe("uploads_closed");
  });

  it("a dead ticket is still the RPC's invalid_session, never a second opinion", async () => {
    getUploadContext.mockResolvedValue({
      ok: false,
      code: "invalid_session",
      message: "Your upload session has expired. Refresh and rejoin.",
    });
    const { status, body } = await presign();
    expect(status).toBe(401);
    expect(body.code).toBe("invalid_session");
    expect(rowRead).not.toHaveBeenCalled();
  });
});
