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
const listOwnUploadStatuses = vi.fn();
const getUser = vi.fn();
const getEventByQrToken = vi.fn();
const recordAbuseEvent = vi.fn().mockResolvedValue(undefined);
const checkAbuseRate = vi
  .fn()
  .mockResolvedValue({ allowed: true, retryAfterSec: 0 });

vi.mock("@/lib/db/mutations/guest-media", () => ({
  listSessionMediaIds: (...args: unknown[]) => listSessionMediaIds(...args),
  listOwnUploadStatuses: (...args: unknown[]) => listOwnUploadStatuses(...args),
}));
// Her tracker's ask reads the account from the server's own `getUser()`.
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
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
  listOwnUploadStatuses.mockResolvedValue([]);
  getUser.mockResolvedValue({ data: { user: null } });
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

/**
 * HER TRACKER'S ASK (`statuses: true`, `guest-capture` r1 `tracker=button`): where each of her
 * uploads here stands. The same capability rules as the ids: the token in the body, every "no" an
 * empty list, never cached, the limiter checked and not recorded; and an ACCOUNT speaks for its own
 * rows through the server's `getUser()`, never through anything the body says.
 */
describe("statuses: her own uploads, with where each stands", () => {
  async function items(body: unknown): Promise<unknown> {
    const res = await post(body);
    const parsed = (await res.json()) as { items?: unknown };
    return parsed.items;
  }

  it("answers the server's read for THIS event and THIS token", async () => {
    listOwnUploadStatuses.mockResolvedValue([
      { id: "m2", status: "pending" },
      { id: "m1", status: "approved" },
    ]);
    expect(
      await items({ qr_token: TOKEN, session_token: MINE, statuses: true }),
    ).toEqual([
      { id: "m2", status: "pending" },
      { id: "m1", status: "approved" },
    ]);
    expect(listOwnUploadStatuses).toHaveBeenCalledWith({
      eventId: "event-1",
      sessionToken: MINE,
      userId: null,
    });
  });

  it("a signed-in viewer's account speaks for its rows, from getUser() and nowhere else", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    await items({ qr_token: TOKEN, statuses: true, user_id: "someone-else" });
    expect(listOwnUploadStatuses).toHaveBeenCalledWith({
      eventId: "event-1",
      sessionToken: null,
      userId: "user-1",
    });
  });

  it("tells a refusal (`host-curation`'s `told=line`, TRACKER_TELLS_REFUSAL)", async () => {
    listOwnUploadStatuses.mockResolvedValue([{ id: "m3", status: "refused" }]);
    expect(
      await items({ qr_token: TOKEN, session_token: MINE, statuses: true }),
    ).toEqual([{ id: "m3", status: "refused" }]);
  });

  it("a private or unknown event answers an empty list and reads nothing", async () => {
    getEventByQrToken.mockResolvedValue({
      ok: true,
      data: { id: "event-1", visibility: "private" },
    });
    expect(
      await items({ qr_token: TOKEN, session_token: MINE, statuses: true }),
    ).toEqual([]);
    getEventByQrToken.mockResolvedValue({ ok: false });
    expect(
      await items({ qr_token: TOKEN, session_token: MINE, statuses: true }),
    ).toEqual([]);
    expect(listOwnUploadStatuses).not.toHaveBeenCalled();
  });

  it("is never cached, and the limiter still guards it (checked, never recorded)", async () => {
    const res = await post({
      qr_token: TOKEN,
      session_token: MINE,
      statuses: true,
    });
    expect(res.headers.get("Cache-Control")).toContain("no-store");
    expect(recordAbuseEvent).not.toHaveBeenCalled();

    checkAbuseRate.mockResolvedValue({ allowed: false, retryAfterSec: 30 });
    const tripped = await post({ qr_token: TOKEN, statuses: true });
    expect(tripped.status).toBe(429);
    expect(listOwnUploadStatuses).toHaveBeenCalledTimes(1);
  });

  it("the ids answer is untouched by the new ask: a body without `statuses` still needs its token", async () => {
    expect((await post({ qr_token: TOKEN })).status).toBe(400);
    expect(
      (await post({ qr_token: TOKEN, session_token: MINE, statuses: false }))
        .status,
    ).toBe(200);
    expect(listOwnUploadStatuses).not.toHaveBeenCalled();
  });
});
