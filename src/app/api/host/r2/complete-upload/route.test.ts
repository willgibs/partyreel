/**
 * THE HOST'S COMPLETION CARRIES THE LIVE REEL'S ONE FIELD (`reel-host`, the clip's server side).
 *
 * A clip the host makes from the live reel and adds to the album lands with `reel_eligible` false,
 * so the reel never plays a reel it made; every other host upload leaves the column's default. The
 * REAL route and pipeline run here; the RPC wrapper, R2 and the Supabase client are the stubbed
 * edges, and what is pinned is the argument `create_media_as_host` receives.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createMediaAsHost = vi.fn();
const readPartyZone = vi.fn();
const headObjectSize = vi.fn();
const getUser = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, getAll: () => [] }),
}));
vi.mock("@/lib/db/mutations/host-media", () => ({
  createMediaAsHost: (...args: unknown[]) => createMediaAsHost(...args),
}));
vi.mock("@/lib/event/zone.server", () => ({
  readPartyZone: (...args: unknown[]) => readPartyZone(...args),
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
  // upload-meter's staging: nothing staged, so these run the path a presign made before staging takes (its staged
  // landing is `src/lib/upload/server-pipeline.test.ts`'s).
  headObject: vi.fn(async () => null),
  copyObject: vi.fn(),
}));
// No row recorded yet (crumbs-62's re-sent complete is `src/lib/upload/server-pipeline.test.ts`'s).
vi.mock("@/lib/upload/server-pipeline-recorded", () => ({
  readRecordedUpload: vi.fn(async () => null),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: () => getUser() } }),
}));

const { POST } = await import("@/app/api/host/r2/complete-upload/route");
// One file is a burst of one on the wire (crumbs-90): its body built as ever, its answer read back as the file's.
const { answerOfOne, burstOfOne } =
  await import("@/lib/upload/testing/burst-of-one");

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
  readPartyZone.mockReset();
  readPartyZone.mockResolvedValue(null);
});

async function complete(extra: Record<string, unknown> = {}) {
  const res = await POST(
    new Request("https://partyreel.com/api/host/r2/complete-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: burstOfOne({
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
  return { status: (await answerOfOne(res)).status };
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

describe("★ the capture time a host's complete claims (capture-time, uploads-and-r2.md)", () => {
  const recorded = () =>
    (createMediaAsHost.mock.calls.at(-1) as [Record<string, unknown>])[0]
      .capturedAt;

  it("records one inside the bounds and drops a lie or a malformed claim, the upload landing either way", async () => {
    vi.useFakeTimers({
      now: new Date("2026-10-05T12:00:00Z"),
      toFake: ["Date"],
    });
    try {
      expect(
        (await complete({ captured_at: "2026-10-04T01:14:05.000Z" })).status,
      ).toBe(200);
      expect(recorded()).toBe("2026-10-04T01:14:05.000Z");
      for (const lie of [
        "2026-10-07T00:00:00.000Z",
        "1971-01-01T00:00:00.000Z",
        42,
        "now",
      ]) {
        expect((await complete({ captured_at: lie })).status, String(lie)).toBe(
          200,
        );
        expect(recorded(), String(lie)).toBeNull();
      }
      expect((await complete()).status).toBe(200);
      expect(recorded()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

/**
 * ★ THE HOST'S OWN ZONELESS CLOCK IS READ IN THE PARTY'S ZONE TOO (crumbs-86, the guest's crumbs-85 rule): her own camera
 * file, with an Exif clock that names no zone, lands where the party lived it rather than in her browser's zone. Its cost:
 * one read of the zone, only for a complete that carries such a clock; the id is the body's, and the RPC still refuses an
 * event that is not hers.
 */
describe("★ a host's zoneless wall clock, read in the party's zone", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      now: new Date("2026-10-05T12:00:00Z"),
      toFake: ["Date"],
    });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  const recorded = () =>
    (createMediaAsHost.mock.calls.at(-1) as [Record<string, unknown>])[0]
      .capturedAt;

  it("★ reads the bare clock on the party's clock, over the browser's reading", async () => {
    readPartyZone.mockResolvedValue("Asia/Makassar");
    const { status } = await complete({
      // Her browser read it in its own zone (London, BST): 20:14:05Z.
      captured_at: "2026-10-03T20:14:05.000Z",
      captured_wall: "2026-10-03T21:14:05",
    });
    expect(status).toBe(200);
    expect(readPartyZone).toHaveBeenCalledWith(EVENT);
    // 21:14:05 in Makassar (UTC+8).
    expect(recorded()).toBe("2026-10-03T13:14:05.000Z");
  });

  it("keeps the browser's reading where the party names no zone, or the party's reading is out of bounds", async () => {
    await complete({
      captured_at: "2026-10-03T20:14:05.000Z",
      captured_wall: "2026-10-03T21:14:05",
    });
    expect(recorded()).toBe("2026-10-03T20:14:05.000Z");
    readPartyZone.mockResolvedValue("Pacific/Kiritimati");
    await complete({
      captured_at: "2026-10-03T20:14:05.000Z",
      captured_wall: "2026-10-07T21:14:05",
    });
    expect(recorded()).toBe("2026-10-03T20:14:05.000Z");
  });

  it("★ reads no zone for a complete that carries no bare clock, and a malformed one is none, never a refusal", async () => {
    await complete({ captured_at: "2026-10-04T01:14:05.000Z" });
    expect(readPartyZone).not.toHaveBeenCalled();
    for (const bad of ["2026-10-03 21:14:05", "21:14", 7, { at: 1 }]) {
      const { status } = await complete({
        captured_at: "2026-10-04T01:14:05.000Z",
        captured_wall: bad,
      });
      expect(status, JSON.stringify(bad)).toBe(200);
      expect(recorded(), JSON.stringify(bad)).toBe("2026-10-04T01:14:05.000Z");
    }
    expect(readPartyZone).not.toHaveBeenCalled();
  });

  it("still refuses an event that is not hers: the zone places only a row the RPC refuses", async () => {
    readPartyZone.mockResolvedValue("Asia/Makassar");
    createMediaAsHost.mockResolvedValue({
      ok: false,
      code: "not_owner",
      message: "Not your event.",
    });
    const { status } = await complete({
      captured_at: "2026-10-03T20:14:05.000Z",
      captured_wall: "2026-10-03T21:14:05",
    });
    expect(status).toBe(404);
  });
});
