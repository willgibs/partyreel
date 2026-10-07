/**
 * THE GUEST PRESIGN, HELD TO THE TICKET'S OWNER.
 *
 * A browser that kept a confirmed guest's ticket would credit the next person's photograph to that
 * guest (another account signed in, or anyone signed out, past Require verified emails, because
 * `create_media` reads the ROW's `verified_at`), so the route asks whose ticket it is before a
 * single byte is presigned. These run the REAL route, pipeline and owner check; only the edges are
 * stubbed (the RPC wrapper, R2, the two Supabase clients), so the row's account and the caller are
 * the two dials every case turns.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  CAMERA_VIDEO_MAX_BYTES,
  CAMERA_VIDEO_SECONDS,
} from "@/lib/media/limits";

const getUploadContext = vi.fn();
const mayUploadPastLock = vi.fn();
const guestUploadsOpen = vi.fn();
const presignUpload = vi.fn();
const rowRead = vi.fn();
const getUser = vi.fn();
const meterUpload = vi.fn();

vi.mock("server-only", () => ({}));
// The presign's meter (upload-meter): its own reading and its fail-closed call are `server-pipeline-meter.test.ts`'s;
// here it is the dial for what the meter answers.
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
// The platform's uploads switch (the spend watch): its own fail-open read is `spend-watch-switches.test.ts`'s.
vi.mock("@/lib/jobs/spend-watch-switches", () => ({
  guestUploadsOpen: () => guestUploadsOpen(),
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: vi.fn(),
  captureError: vi.fn(),
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
// The owner check itself runs for real: only the row read and the caller are dialled here.
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: () => rowRead() }) }),
    }),
  }),
}));
// The caller's own client: who is signed in, and the claim, which runs as them (it answers here as a
// ticket that is not the caller's: nothing taken, the row unchanged).
const claimRpc = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: () => getUser() },
    rpc: (fn: string, args: unknown) => claimRpc(fn, args),
  }),
}));

const { POST } = await import("@/app/api/r2/presign-upload/route");
// One file is a burst of one on the wire (crumbs-90): its body built as ever, its answer read back as the file's.
const { answerOfOne, burstOfOne } =
  await import("@/lib/upload/testing/burst-of-one");

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
 * The row the posted ticket names: `null` is a name-only row, an id is an account's (confirmed).
 * `verifiedAt` alone, with no account, is a deleted account's confirmed row.
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
      body: burstOfOne({
        session_token: TOKEN,
        content_type: "image/jpeg",
        size_bytes: 1000,
      }),
    }),
  );
  return answerOfOne<{ ok: boolean; code?: string; message?: string }>(res);
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
  ticketBelongsTo(null);
  callerIs(null);
  claimRpc.mockResolvedValue({ data: 0, error: null });
  meterUpload.mockResolvedValue({ ok: true });
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

  it("accepts a NAME-ONLY row's ticket for someone signed out", async () => {
    ticketBelongsTo(null);
    callerIs(null);
    const { status } = await presign();
    expect(status).toBe(200);
    expect(claimRpc).not.toHaveBeenCalled();
  });

  it("★ refuses a name-only row's ticket to a SIGNED-IN account it is not, and presigns nothing (build 27's red-team)", async () => {
    // Reshaped on purpose (crumbs-26): this accepted it "for anyone, signed out or signed in", and on a
    // shared phone a signed-in account's photo went up under the typed name of the visitor before her.
    // The claim is asked first (a ticket she typed herself is hers to add on); this one it leaves.
    ticketBelongsTo(null);
    callerIs(OTHER);
    const { status, body } = await presign();
    expect(status).toBe(403);
    expect(body.code).toBe("session_other_account");
    expect(claimRpc).toHaveBeenCalledWith("claim_anonymous_uploads", {
      p_session_tokens: [TOKEN],
    });
    expect(presignUpload).not.toHaveBeenCalled();
  });

  it("presigns on a name-only ticket the claim has just made the caller's", async () => {
    rowRead
      .mockResolvedValueOnce({
        data: { user_id: null, verified_at: null },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { user_id: OTHER, verified_at: "2026-09-30T08:00:00Z" },
        error: null,
      });
    callerIs(OTHER);
    const { status } = await presign();
    expect(status).toBe(200);
    expect(presignUpload).toHaveBeenCalled();
  });

  it("★ outranks the identity gate: a confirmed person's ticket never carries a signed-out visitor past Require verified emails", async () => {
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

/**
 * THE ALBUM'S CAMERA AT THE PRESIGN (20261002200000): the shot past the roll, or past its ceiling, and a camera
 * video past its bounds are refused before their bytes move, in the server's own words; free uploads are untouched,
 * and nothing is presigned for a refused shot. `create_media` holds the same lines (its own pins: roll.test.ts).
 */
describe("the album's camera", () => {
  async function presignVideo(seconds: number, bytes: number) {
    const res = await POST(
      new Request("https://partyreel.com/api/r2/presign-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: burstOfOne({
          session_token: TOKEN,
          content_type: "video/mp4",
          size_bytes: bytes,
          duration_seconds: seconds,
        }),
      }),
    );
    return answerOfOne<{ code?: string; message?: string }>(res);
  }
  const ROLL = { used: 3, cap: 24, taken: 3, ceiling: 72 };

  it("★ refuses the shot past her roll, at the roll's own size, with nothing presigned", async () => {
    getUploadContext.mockResolvedValue(
      context({ capture: "camera", roll: { ...ROLL, used: 24, taken: 30 } }),
    );
    const { status, body } = await presign();
    expect(status).toBe(409);
    expect(body).toMatchObject({
      code: "roll_spent",
      message: "You've taken all 24 shots on your roll.",
    });
    expect(presignUpload).not.toHaveBeenCalled();
  });

  it("refuses the shot past the ceiling, a frame free or not", async () => {
    getUploadContext.mockResolvedValue(
      context({ capture: "camera", roll: { ...ROLL, used: 10, taken: 72 } }),
    );
    const { status, body } = await presign();
    expect(status).toBe(409);
    expect(body.message).toBe("You've used all 3 re-shoots on your roll.");
    expect(presignUpload).not.toHaveBeenCalled();
  });

  it("a frame left presigns as ever; free uploads never meet a roll", async () => {
    getUploadContext.mockResolvedValue(
      context({ capture: "camera", roll: ROLL }),
    );
    expect((await presign()).status).toBe(200);
    getUploadContext.mockResolvedValue(
      context({ capture: "upload", roll: { ...ROLL, used: 24 } }),
    );
    expect((await presign()).status).toBe(200);
  });

  // ★ RESHAPED ON PURPOSE (camera-clip: the clip runs to thirty seconds; scar kept: a camera video past its length or its
  // bytes is refused in its own code before the roll, with nothing presigned; reason dropped: the old ten seconds and
  // 128 MB, whose literals (30 s, 129 MB) are now read from the constants, one step past each bound).
  it("a camera video: its length and its bytes, each in its own words, before the roll", async () => {
    getUploadContext.mockResolvedValue(
      context({ capture: "camera", roll: { ...ROLL, used: 24 } }),
    );
    const long = await presignVideo(CAMERA_VIDEO_SECONDS + 1, 1024);
    expect(long.status).toBe(422);
    expect(long.body.code).toBe("too_long");
    getUploadContext.mockResolvedValue(
      context({ capture: "camera", roll: ROLL }),
    );
    const large = await presignVideo(8, CAMERA_VIDEO_MAX_BYTES + 1);
    expect(large.status).toBe(422);
    expect(large.body.code).toBe("too_large");
    expect(presignUpload).not.toHaveBeenCalled();
  });

  it("a full-length clip presigns: thirty seconds at about 5 Mbps is no longer past any bound", async () => {
    getUploadContext.mockResolvedValue(
      context({ capture: "camera", roll: ROLL }),
    );
    const full = await presignVideo(CAMERA_VIDEO_SECONDS, 19 * 1024 ** 2);
    expect(full.status).toBe(200);
    expect(presignUpload).toHaveBeenCalled();
  });
});

describe("the platform's uploads switch (spend-watch)", () => {
  it("★ refuses every guest upload while it is off, in Partyreel's words, before anything else is asked", async () => {
    guestUploadsOpen.mockResolvedValue(false);
    // A ticket that would otherwise be refused (not this caller's) still meets the platform's sentence first: it
    // says nothing about the album, and a runaway costs one small read a request.
    ticketBelongsTo(OWNER);
    callerIs(OTHER);
    const { status, body } = await presign();
    expect(status).toBe(503);
    expect(body).toEqual({
      ok: false,
      code: "uploads_paused",
      message:
        "Uploads are paused on Partyreel for now. Try again in a little while.",
    });
    expect(getUploadContext).not.toHaveBeenCalled();
    expect(presignUpload).not.toHaveBeenCalled();
  });

  it("presigns as ever while it is on", async () => {
    guestUploadsOpen.mockResolvedValue(true);
    const { status, body } = await presign();
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(presignUpload).toHaveBeenCalled();
  });
});

/**
 * THE PRESIGN'S METER (upload-meter, 20261003210500, reworked on the Advisor's Q19): after every gate and before any
 * URL is minted, the engine asks the meter about the declared bytes; every refusal it makes reaches the guest in the
 * album's words, never the plan's, with nothing presigned, and a meter that cannot answer lets the upload go (fail
 * OPEN: the complete counts the month on the bytes that landed). The meter's own SQL is its migration's rolled-back
 * proof.
 */
describe("the meter", () => {
  async function presignWith(over: Record<string, unknown>) {
    const res = await POST(
      new Request("https://partyreel.com/api/r2/presign-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: burstOfOne({
          session_token: TOKEN,
          content_type: "image/jpeg",
          size_bytes: 1000,
          ...over,
        }),
      }),
    );
    const { status, body } = await answerOfOne<{
      ok: boolean;
      code?: string;
      message?: string;
      preview?: unknown;
      preview_refused?: string;
    }>(res);
    return { status, retryAfter: res.headers.get("Retry-After"), body };
  }

  it("★ asks the meter once, with the declared bytes, for the event the ticket resolved, before any URL is minted", async () => {
    const { status } = await presignWith({
      content_type: "video/mp4",
      size_bytes: 52_428_800,
    });
    expect(status).toBe(200);
    expect(meterUpload).toHaveBeenCalledTimes(1);
    expect(meterUpload).toHaveBeenCalledWith({
      eventId: EVENT,
      kind: "video",
      bytes: 52_428_800,
    });
    expect(meterUpload.mock.invocationCallOrder[0]).toBeLessThan(
      presignUpload.mock.invocationCallOrder[0]!,
    );
  });

  it("a request any gate refuses is never counted", async () => {
    getUploadContext.mockResolvedValue(context({ visibility: "private" }));
    expect((await presign()).status).toBe(403);
    getUploadContext.mockResolvedValue(context({ accepting_uploads: false }));
    expect((await presign()).status).toBe(403);
    getUploadContext.mockResolvedValue(context({ at_monthly_cap: true }));
    expect((await presign()).status).toBe(409);
    getUploadContext.mockResolvedValue(context({ max_upload_bytes: 999 }));
    expect((await presign()).status).toBe(422);
    guestUploadsOpen.mockResolvedValue(false);
    expect((await presign()).status).toBe(503);
    expect(meterUpload).not.toHaveBeenCalled();
    expect(presignUpload).not.toHaveBeenCalled();
  });

  it.each([
    [
      "storage",
      { ok: false, reason: "storage" },
      409,
      "cap_reached",
      "This album is full right now. The host needs to free up space.",
    ],
    [
      "monthly",
      { ok: false, reason: "monthly" },
      409,
      "cap_reached",
      "This album has hit its upload limit for now.",
    ],
    [
      "hourly",
      { ok: false, reason: "hourly", retryAfterSec: 1234 },
      429,
      "rate_limited",
      "This album has taken a lot of uploads this hour. Try again in a little while.",
    ],
    [
      "event_gone",
      { ok: false, reason: "event_gone" },
      409,
      "event_gone",
      "This event is no longer available.",
    ],
  ])(
    "★ the meter's %s refusal reaches her in the album's words, and nothing is presigned",
    async (_reason, answer, status, code, message) => {
      meterUpload.mockResolvedValue(answer);
      const res = await presignWith({});
      expect(res.status).toBe(status);
      expect(res.body).toEqual({ ok: false, code, message });
      expect(res.body.message).not.toMatch(/\bplan\b/i);
      expect(res.retryAfter).toBe(code === "rate_limited" ? "1234" : null);
      expect(presignUpload).not.toHaveBeenCalled();
    },
  );

  it("★ a meter that cannot answer lets the upload go (fail OPEN), minted at its staging twin as ever", async () => {
    meterUpload.mockResolvedValue({ ok: false, reason: "unavailable" });
    const res = await presignWith({});
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(presignUpload).toHaveBeenCalledTimes(1);
  });
});

/**
 * A PREVIEW NEVER HEAVIER THAN ITS ORIGINAL (upload-meter): the preview is never metered, so past its original's
 * declared bytes (or past 2 MB) its PUT is refused, in words, in the preview's own slot of the answer, and the original
 * presigns as ever: its tile then serves the original, and a guest never loses a photograph over its tile.
 */
describe("the preview", () => {
  async function presignWith(over: Record<string, unknown>) {
    const res = await POST(
      new Request("https://partyreel.com/api/r2/presign-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: burstOfOne({
          session_token: TOKEN,
          content_type: "image/jpeg",
          ...over,
        }),
      }),
    );
    return answerOfOne<{
      ok: boolean;
      url?: string;
      preview?: { key: string };
      preview_refused?: string;
    }>(res);
  }
  const MB = 1024 * 1024;

  it("★ refuses a preview heavier than its original, in words, and still presigns the original (and counts it)", async () => {
    const { status, body } = await presignWith({
      size_bytes: 1000,
      preview_size_bytes: 2_000_000,
    });
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.url).toBe("https://r2.example/put");
    expect(body.preview).toBeUndefined();
    expect(body.preview_refused).toBe(
      "A preview can't be larger than the file it shows, so this upload's tile shows the file itself.",
    );
    expect(presignUpload).toHaveBeenCalledTimes(1);
    expect(presignUpload.mock.calls[0]![0]).toMatchObject({
      contentLength: 1000,
    });
    expect(meterUpload).toHaveBeenCalledWith(
      expect.objectContaining({ bytes: 1000 }),
    );
  });

  it("one byte heavier is refused; as heavy as its original, or lighter, goes", async () => {
    expect(
      (await presignWith({ size_bytes: 1000, preview_size_bytes: 1001 })).body
        .preview_refused,
    ).toBeDefined();
    for (const preview_size_bytes of [1000, 999, 1]) {
      presignUpload.mockClear();
      const { body } = await presignWith({
        size_bytes: 1000,
        preview_size_bytes,
      });
      expect(body.preview_refused, `${preview_size_bytes}`).toBeUndefined();
      expect(body.preview).toMatchObject({
        key: expect.stringMatching(/\/preview\.webp$/),
      });
      expect(presignUpload).toHaveBeenCalledTimes(2);
      expect(presignUpload.mock.calls[0]![0]).toMatchObject({
        contentType: "image/webp",
        contentLength: preview_size_bytes,
      });
    }
  });

  it("past 2 MB beside any original is refused in its own words, as before but no longer silently", async () => {
    const { body } = await presignWith({
      size_bytes: 50 * MB,
      preview_size_bytes: 2 * MB + 1,
    });
    expect(body.preview).toBeUndefined();
    expect(body.preview_refused).toBe(
      "A preview can be at most 2 MB, so this upload's tile shows the file itself.",
    );
    const atTheCap = await presignWith({
      size_bytes: 50 * MB,
      preview_size_bytes: 2 * MB,
    });
    expect(atTheCap.body.preview).toBeDefined();
    expect(atTheCap.body.preview_refused).toBeUndefined();
  });

  it("an upload that declares no preview hears nothing about one", async () => {
    const { body } = await presignWith({ size_bytes: 1000 });
    expect(body.preview).toBeUndefined();
    expect(body.preview_refused).toBeUndefined();
    expect(Object.keys(body)).not.toContain("preview_refused");
  });
});

/**
 * ★ EVERY SINGLE PUT LANDS IN STAGING (upload-meter, the Advisor's Q19): the original under the multipart threshold,
 * its preview and its phone copy are each minted at their key's `staging/` twin, which the backup and the orphan sweep
 * never read and a lifecycle rule empties a day on; the answer still names the `events/` keys, which the client echoes
 * at complete, where the copy into `events/` happens. A multipart original targets its key directly: nothing becomes
 * an object there until the complete assembles it.
 */
describe("staging", () => {
  async function presignWith(over: Record<string, unknown>) {
    const res = await POST(
      new Request("https://partyreel.com/api/r2/presign-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: burstOfOne({
          session_token: TOKEN,
          content_type: "image/jpeg",
          ...over,
        }),
      }),
    );
    return answerOfOne<{
      ok: boolean;
      strategy?: string;
      media_id?: string;
      key?: string;
      preview?: { key: string; url: string };
      phone?: { key: string; url: string };
    }>(res);
  }
  const MB = 1024 * 1024;
  const stagedTwin = (key: string) => key.replace(/^events\//, "staging/");

  it("★ mints a single PUT, its preview and its phone copy at their staging twins; the answer names the events/ keys", async () => {
    presignUpload.mockImplementation(async (p: { key: string }) => ({
      url: `https://r2.example/put/${p.key}`,
      headers: {},
    }));
    const { status, body } = await presignWith({
      size_bytes: 3 * MB,
      preview_size_bytes: 40_000,
      phone_size_bytes: 600_000,
    });
    expect(status).toBe(200);
    expect(body.strategy).toBe("single");
    expect(body.key).toBe(
      `events/${EVENT}/photo/${body.media_id}/original.jpg`,
    );
    expect(body.preview?.key).toBe(
      `events/${EVENT}/photo/${body.media_id}/preview.webp`,
    );
    expect(body.phone?.key).toBe(
      `events/${EVENT}/photo/${body.media_id}/phone.jpg`,
    );
    const minted = presignUpload.mock.calls.map(
      (c) => (c[0] as { key: string }).key,
    );
    expect(minted.sort()).toEqual(
      [body.key!, body.preview!.key, body.phone!.key].map(stagedTwin).sort(),
    );
    for (const key of minted) expect(key.startsWith("staging/")).toBe(true);
    expect(body.preview?.url).toBe(
      `https://r2.example/put/${stagedTwin(body.preview!.key)}`,
    );
  });

  it("a multipart original goes to its own key (nothing lands there until the complete), its preview to staging", async () => {
    createMultipartUpload.mockResolvedValue({ uploadId: "upload-1" });
    presignUploadPart.mockResolvedValue({ url: "https://r2.example/part" });
    const { status, body } = await presignWith({
      content_type: "video/mp4",
      size_bytes: 120 * MB,
      preview_size_bytes: 40_000,
    });
    expect(status).toBe(200);
    expect(body.strategy).toBe("multipart");
    expect(createMultipartUpload).toHaveBeenCalledWith({
      key: body.key,
      contentType: "video/mp4",
    });
    expect(body.key!.startsWith("events/")).toBe(true);
    expect(presignUpload).toHaveBeenCalledTimes(1);
    expect(presignUpload.mock.calls[0]![0]).toMatchObject({
      key: stagedTwin(body.preview!.key),
    });
  });
});
