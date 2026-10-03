/**
 * THE PRESIGN'S METER, READ AND CALLED (upload-meter, 20261003210500). `meter_upload`'s answer is read by one pure
 * ladder, and the call fails CLOSED: an error, a missing answer or one it does not know is `unavailable` (the presign
 * then refuses), reported every time, and never a count the meter did not make.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const captureError = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    rpc: (...args: unknown[]) => rpc(...args),
  }),
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureError: (...args: unknown[]) => captureError(...args),
  captureWarning: vi.fn(),
}));

const { meterUpload, parseMeterAnswer } =
  await import("@/lib/upload/server-pipeline-meter");

const EVENT = "33333333-3333-4333-8333-333333333333";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("parseMeterAnswer", () => {
  it("reads a count and each refusal the meter makes", () => {
    expect(parseMeterAnswer({ ok: true })).toEqual({ ok: true });
    expect(parseMeterAnswer({ ok: false, reason: "monthly" })).toEqual({
      ok: false,
      reason: "monthly",
    });
    expect(parseMeterAnswer({ ok: false, reason: "storage" })).toEqual({
      ok: false,
      reason: "storage",
    });
    expect(parseMeterAnswer({ ok: false, reason: "event_gone" })).toEqual({
      ok: false,
      reason: "event_gone",
    });
    expect(
      parseMeterAnswer({ ok: false, reason: "hourly", retry_after_sec: 2275 }),
    ).toEqual({ ok: false, reason: "hourly", retryAfterSec: 2275 });
  });

  it("the breaker's hint is an hour at most: one it did not give reads as the whole hour", () => {
    for (const hint of [undefined, null, "soon", 0, -5, 3601, Number.NaN]) {
      expect(
        parseMeterAnswer({
          ok: false,
          reason: "hourly",
          retry_after_sec: hint,
        }),
      ).toEqual({ ok: false, reason: "hourly", retryAfterSec: 3600 });
    }
    expect(
      parseMeterAnswer({ ok: false, reason: "hourly", retry_after_sec: 12.2 }),
    ).toEqual({ ok: false, reason: "hourly", retryAfterSec: 13 });
  });

  it("★ anything it does not know is unavailable, never a count", () => {
    for (const answer of [
      null,
      undefined,
      "ok",
      true,
      {},
      { ok: "true" },
      { ok: 1 },
      { ok: false },
      { ok: false, reason: "weekly" },
      [],
    ]) {
      expect(parseMeterAnswer(answer), JSON.stringify(answer)).toEqual({
        ok: false,
        reason: "unavailable",
      });
    }
  });
});

describe("meterUpload", () => {
  it("asks meter_upload with the event, the kind and the declared bytes, and passes its answer through", async () => {
    rpc.mockResolvedValue({ data: { ok: true }, error: null });
    await expect(
      meterUpload({ eventId: EVENT, kind: "video", bytes: 123_456_789 }),
    ).resolves.toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("meter_upload", {
      p_event_id: EVENT,
      p_type: "video",
      p_bytes: 123_456_789,
    });
    expect(captureError).not.toHaveBeenCalled();

    rpc.mockResolvedValue({
      data: { ok: false, reason: "monthly" },
      error: null,
    });
    await expect(
      meterUpload({ eventId: EVENT, kind: "photo", bytes: 1 }),
    ).resolves.toEqual({ ok: false, reason: "monthly" });
    // A refusal the meter made is an answer, not a failure: nothing is reported.
    expect(captureError).not.toHaveBeenCalled();
  });

  it("★ fails CLOSED on an error, and says so", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { code: "PGRST202", message: "Could not find the function" },
    });
    await expect(
      meterUpload({ eventId: EVENT, kind: "photo", bytes: 1000 }),
    ).resolves.toEqual({ ok: false, reason: "unavailable" });
    expect(captureError).toHaveBeenCalledTimes(1);
    expect(captureError.mock.calls[0]![0]).toBe("upload");
  });

  it("★ fails CLOSED on a throw and on an answer it does not know, and says so each time", async () => {
    rpc.mockRejectedValue(new Error("fetch failed"));
    await expect(
      meterUpload({ eventId: EVENT, kind: "photo", bytes: 1000 }),
    ).resolves.toEqual({ ok: false, reason: "unavailable" });
    rpc.mockResolvedValue({ data: { ok: "maybe" }, error: null });
    await expect(
      meterUpload({ eventId: EVENT, kind: "photo", bytes: 1000 }),
    ).resolves.toEqual({ ok: false, reason: "unavailable" });
    expect(captureError).toHaveBeenCalledTimes(2);
  });
});
