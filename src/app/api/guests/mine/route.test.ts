/**
 * WHICH PHOTOGRAPHS ARE THIS ANONYMOUS GUEST'S — the list that decides whether
 * a Remove control appears at all.
 *
 * The rule under every case here: the answer is whatever the SERVER read for
 * the token that was posted, and every kind of "no" looks the same from a
 * browser. The isolation itself (a token never reaching another session's rows)
 * is the query's, verified against the real database; this file guards that the
 * route cannot hand back anything the query did not say.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const listSessionMediaIds = vi.fn();
const getEventByQrToken = vi.fn();
const recordAbuseEvent = vi.fn().mockResolvedValue(undefined);
const checkAbuseRate = vi
  .fn()
  .mockResolvedValue({ allowed: true, retryAfterSec: 0 });

vi.mock("@/lib/db/mutations/guest-media", () => ({
  listSessionMediaIds: (...args: unknown[]) => listSessionMediaIds(...args),
}));
vi.mock("@/lib/db/queries/guest-events", () => ({
  getEventByQrToken: (...args: unknown[]) => getEventByQrToken(...args),
}));
vi.mock("@/lib/security/abuse-rate-limit-store", () => ({
  abuseHashes: () => ({ ipHash: "ip", scopeHash: "scope" }),
  checkAbuseRate: (...args: unknown[]) => checkAbuseRate(...args),
  recordAbuseEvent: (...args: unknown[]) => recordAbuseEvent(...args),
}));
vi.mock("@/lib/observability/sentry", () => ({ captureWarning: vi.fn() }));

const { POST } = await import("@/app/api/guests/mine/route");

const TOKEN = "qr-token-1234";
const MINE = "a-session-token-of-real-length";
const THEIRS = "another-guests-session-token!!";

function post(body: unknown) {
  return POST(
    new Request("https://partyreel.com/api/guests/mine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

async function ids(body: unknown): Promise<unknown> {
  const res = await post(body);
  const parsed = (await res.json()) as { ids?: unknown };
  return parsed.ids;
}

beforeEach(() => {
  vi.clearAllMocks();
  checkAbuseRate.mockResolvedValue({ allowed: true, retryAfterSec: 0 });
  getEventByQrToken.mockResolvedValue({
    ok: true,
    data: { id: "event-1", visibility: "open" },
  });
  listSessionMediaIds.mockResolvedValue([]);
});

describe("the list is the server's, for the token that was posted", () => {
  it("asks for THIS event and THIS token, and returns exactly that answer", async () => {
    listSessionMediaIds.mockResolvedValue(["m1", "m2"]);
    expect(await ids({ qr_token: TOKEN, session_token: MINE })).toEqual([
      "m1",
      "m2",
    ]);
    expect(listSessionMediaIds).toHaveBeenCalledWith({
      eventId: "event-1",
      sessionToken: MINE,
    });
  });

  it("never lists another session's ids", async () => {
    // The route is a pass-through by construction: it holds no list of its own
    // and cannot widen the query's scope. A different token is a different read.
    listSessionMediaIds.mockImplementation(
      ({ sessionToken }: { sessionToken: string }) =>
        Promise.resolve(sessionToken === MINE ? ["m1"] : []),
    );
    expect(await ids({ qr_token: TOKEN, session_token: MINE })).toEqual(["m1"]);
    expect(await ids({ qr_token: TOKEN, session_token: THEIRS })).toEqual([]);
  });
});

describe("every 'no' looks the same from a browser", () => {
  it("an unknown event answers an empty list, not a 404", async () => {
    getEventByQrToken.mockResolvedValue({ ok: false });
    const res = await post({ qr_token: TOKEN, session_token: MINE });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, ids: [] });
    expect(listSessionMediaIds).not.toHaveBeenCalled();
  });

  it("a PRIVATE event answers an empty list and reads nothing", async () => {
    getEventByQrToken.mockResolvedValue({
      ok: true,
      data: { id: "event-1", visibility: "private" },
    });
    expect(await ids({ qr_token: TOKEN, session_token: MINE })).toEqual([]);
    expect(listSessionMediaIds).not.toHaveBeenCalled();
  });

  it("an unknown token answers an empty list, exactly like an empty album", async () => {
    expect(await ids({ qr_token: TOKEN, session_token: THEIRS })).toEqual([]);
  });
});

describe("what it accepts, and what it never caches", () => {
  it("refuses a body missing either token", async () => {
    for (const body of [{}, { qr_token: TOKEN }, { session_token: MINE }]) {
      expect((await post(body)).status).toBe(400);
    }
    expect(listSessionMediaIds).not.toHaveBeenCalled();
  });

  it("is never cached — the answer is per session token", async () => {
    const res = await post({ qr_token: TOKEN, session_token: MINE });
    expect(res.headers.get("Cache-Control")).toContain("no-store");
  });
});

describe("the limiter", () => {
  it("429s a tripped one before reading anything", async () => {
    checkAbuseRate.mockResolvedValue({ allowed: false, retryAfterSec: 30 });
    const res = await post({ qr_token: TOKEN, session_token: MINE });
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
    expect(listSessionMediaIds).not.toHaveBeenCalled();
  });

  it("does NOT record: this runs once per page load, and the join backstop is sized for joins", async () => {
    await post({ qr_token: TOKEN, session_token: MINE });
    expect(recordAbuseEvent).not.toHaveBeenCalled();
  });

  it("fails OPEN on a limiter outage — the session token is the gate", async () => {
    checkAbuseRate.mockRejectedValue(new Error("counters down"));
    listSessionMediaIds.mockResolvedValue(["m1"]);
    expect(await ids({ qr_token: TOKEN, session_token: MINE })).toEqual(["m1"]);
  });
});
