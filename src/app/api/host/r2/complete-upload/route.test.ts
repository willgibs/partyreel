/**
 * THE HOST'S COMPLETION CARRIES THE LIVE REEL'S ONE FIELD (`reel-host`, the clip's server side).
 *
 * A clip the host makes from the live reel and adds to the album lands with `reel_eligible` false,
 * so the reel never plays a reel it made; every other host upload leaves the column's default. The
 * REAL route and pipeline run here; the RPC wrapper, R2 and the Supabase client are the stubbed
 * edges, and what is pinned is the argument `create_media_as_host` receives.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const createMediaAsHost = vi.fn();
const headObjectSize = vi.fn();
const getUser = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, getAll: () => [] }),
}));
vi.mock("@/lib/db/mutations/host-media", () => ({
  createMediaAsHost: (...args: unknown[]) => createMediaAsHost(...args),
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
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: () => getUser() } }),
}));

const { POST } = await import("@/app/api/host/r2/complete-upload/route");

const HOST = "11111111-1111-4111-8111-111111111111";
const EVENT = "33333333-3333-4333-8333-333333333333";
const MEDIA = "44444444-4444-4444-8444-444444444444";

beforeEach(() => {
  createMediaAsHost.mockReset();
  createMediaAsHost.mockResolvedValue({
    ok: true,
    data: { media_id: MEDIA, status: "approved" },
  });
  headObjectSize.mockReset();
  headObjectSize.mockResolvedValue(8_000_000);
  getUser.mockReset();
  getUser.mockResolvedValue({ data: { user: { id: HOST } } });
});

async function complete(extra: Record<string, unknown> = {}) {
  const res = await POST(
    new Request("https://partyreel.com/api/host/r2/complete-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: EVENT,
        media_id: MEDIA,
        key: `events/${EVENT}/video/${MEDIA}/original.mp4`,
        content_type: "video/mp4",
        size_bytes: 8_000_000,
        duration_seconds: 12,
        upload_id: null,
        parts: [],
        ...extra,
      }),
    }),
  );
  return { status: res.status };
}

describe("the host's completion and the live reel", () => {
  it("writes a clip added from the reel as not reel-eligible", async () => {
    const { status } = await complete({ reel_eligible: false });
    expect(status).toBe(200);
    expect(createMediaAsHost).toHaveBeenCalledWith(
      expect.objectContaining({ hostId: HOST, reelEligible: false }),
    );
  });

  it("leaves every other upload to the column's default", async () => {
    await complete();
    const [input] = createMediaAsHost.mock.calls[0] as [
      Record<string, unknown>,
    ];
    expect(input.reelEligible).toBeUndefined();
  });

  it("refuses a field that is not a boolean, before any write", async () => {
    const { status } = await complete({ reel_eligible: "no" });
    expect(status).toBe(400);
    expect(createMediaAsHost).not.toHaveBeenCalled();
  });

  it("still answers a signed-out caller 401 before reading the body", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { status } = await complete({ reel_eligible: false });
    expect(status).toBe(401);
    expect(createMediaAsHost).not.toHaveBeenCalled();
  });
});
