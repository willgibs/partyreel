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
const countKeptTicketUploads = vi.fn();
const getUser = vi.fn();
const getEventByQrToken = vi.fn();
const recordAbuseEvent = vi.fn().mockResolvedValue(undefined);
const checkAbuseRate = vi
  .fn()
  .mockResolvedValue({ allowed: true, retryAfterSec: 0 });

vi.mock("@/lib/db/mutations/guest-media", () => ({
  listSessionMediaIds: (...args: unknown[]) => listSessionMediaIds(...args),
  listOwnUploadStatuses: (...args: unknown[]) => listOwnUploadStatuses(...args),
  countKeptTicketUploads: (...args: unknown[]) =>
    countKeptTicketUploads(...args),
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
// Whose the body's ticket is to a signed-in viewer is `session-owner.server.ts`'s (its own pins); here the
// answer is handed in: by default the ticket is hers, and a test sets it aside.
const sortTickets = vi.fn();
vi.mock("@/lib/guest/session-owner.server", () => ({
  sortTickets: (...args: unknown[]) => sortTickets(...args),
}));

// ★ THE DOOR (the doors, 20260929120000): a private album, or a ticket a block holds, shuts it. Its own
// rule is decide.test.ts's and closed-door.server.test.ts's; here a held ticket stands in for a shut
// door, so the route's answer to it can be read against its answer to a private album, word for word.
const ticketBlocked = vi.fn();
const callerOptions = vi.fn();
vi.mock("@/lib/events/closed-door.server", async () =>
  (await import("@/lib/events/testing/door-double")).doorDouble({
    blocked: (event, tickets) => ticketBlocked(event, tickets),
    callerOptions: (options) => callerOptions(options),
  }),
);

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
  countKeptTicketUploads.mockResolvedValue(0);
  getUser.mockResolvedValue({ data: { user: null } });
  sortTickets
    .mockReset()
    .mockImplementation(
      async (_viewer: string | null, tickets: readonly string[]) => ({
        hers: [...tickets],
        others: [],
      }),
    );
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

/**
 * A SIGNED-IN ACCOUNT'S OWN READS ON A SHARED PHONE (crumbs-27, the read side of crumbs-26's owner rule). The
 * route answers "which are mine" for the account beside the ticket the phone still holds for the album; the
 * ticket speaks for her only as far as it is hers (her own row, or one the claim takes), or another guest's
 * photographs were listed as hers, with a Remove control, and their statuses filled her tracker.
 */
describe("★ a signed-in account reads only tickets that are hers", () => {
  const signedIn = () =>
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

  it("a ticket that is not hers lists nothing, and another guest's rows are never read", async () => {
    signedIn();
    sortTickets.mockResolvedValue({ hers: [], others: [MINE] });
    expect(await ids({ qr_token: TOKEN, session_token: MINE })).toEqual([]);
    expect(sortTickets).toHaveBeenCalledWith("user-1", [MINE]);
    expect(listSessionMediaIds).not.toHaveBeenCalled();
  });

  it("a ticket that is hers lists its rows, as ever", async () => {
    signedIn();
    listSessionMediaIds.mockResolvedValue(["m1"]);
    expect(await ids({ qr_token: TOKEN, session_token: MINE })).toEqual(["m1"]);
    expect(listSessionMediaIds).toHaveBeenCalledWith({
      eventId: "event-1",
      sessionToken: MINE,
    });
  });

  it("signed out the ticket is the device's, and nobody is asked whose it is", async () => {
    listSessionMediaIds.mockResolvedValue(["m1"]);
    expect(await ids({ qr_token: TOKEN, session_token: MINE })).toEqual(["m1"]);
    expect(sortTickets).toHaveBeenCalledWith(null, [MINE]);
  });

  it("her tracker reads her account's rows and a ticket only as far as it is hers", async () => {
    signedIn();
    sortTickets.mockResolvedValue({ hers: [], others: [MINE] });
    listOwnUploadStatuses.mockResolvedValue([{ id: "a1", status: "approved" }]);
    const res = await post({
      qr_token: TOKEN,
      session_token: MINE,
      statuses: true,
    });
    await expect(res.json()).resolves.toEqual({
      ok: true,
      items: [{ id: "a1", status: "approved" }],
    });
    // Her account alone: the phone's ticket is another guest's, so its rows are not asked for.
    expect(listOwnUploadStatuses).toHaveBeenCalledWith({
      eventId: "event-1",
      sessionToken: null,
      userId: "user-1",
    });
  });

  it("a tracker ask with no ticket sorts nothing", async () => {
    signedIn();
    await post({ qr_token: TOKEN, statuses: true });
    expect(sortTickets).not.toHaveBeenCalled();
  });
});

describe("the closed door: a ticket a block holds meets the private album's answer", () => {
  it("answers both arms exactly as a private album's, asks with the body's ticket, and reads nothing", async () => {
    const asked = [
      { qr_token: TOKEN, session_token: MINE },
      { qr_token: TOKEN, session_token: MINE, statuses: true },
    ];
    getEventByQrToken.mockResolvedValue({
      ok: true,
      data: { id: "event-1", visibility: "private" },
    });
    const shut = await Promise.all(
      asked.map(async (body) => (await post(body)).json()),
    );

    getEventByQrToken.mockResolvedValue({
      ok: true,
      data: { id: "event-1", visibility: "open" },
    });
    ticketBlocked.mockResolvedValue(true);
    const held = await Promise.all(
      asked.map(async (body) => (await post(body)).json()),
    );
    expect(ticketBlocked).toHaveBeenCalledWith(
      expect.objectContaining({ id: "event-1" }),
      [MINE],
    );
    ticketBlocked.mockReset();

    expect(held).toEqual(shut);
    expect(listSessionMediaIds).not.toHaveBeenCalled();
    expect(listOwnUploadStatuses).not.toHaveBeenCalled();
  });
});

/**
 * ★ WHETHER THIS PHONE'S PHOTOS HERE ARE HERS NOW (`kept: true`, build 33's red-team). The album asks it when a confirm
 * door opened there and her own claim moved nothing, since the page's door read claims the ticket first. The same
 * capability rules as the other two answers (the token in the body, never cached, the limiter checked and not
 * recorded, the door asked with the body's ticket), and the account is the server's `getUser()`: signed out, or at a
 * door that holds the ticket, the answer is 0 and nothing is counted.
 */
describe("kept: whether this phone's photos here are hers now", () => {
  async function kept(body: unknown): Promise<unknown> {
    const res = await post(body);
    expect(res.headers.get("Cache-Control")).toContain("no-store");
    return ((await res.json()) as { kept?: unknown }).kept;
  }

  it("★ counts the body's ticket for the signed-in account, at THIS event", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u-1" } } });
    countKeptTicketUploads.mockResolvedValue(3);
    expect(
      await kept({ qr_token: TOKEN, session_token: MINE, kept: true }),
    ).toBe(3);
    expect(countKeptTicketUploads).toHaveBeenCalledWith({
      eventId: "event-1",
      sessionToken: MINE,
      userId: "u-1",
    });
    expect(callerOptions).toHaveBeenCalledWith(
      expect.objectContaining({ bodyTokens: [MINE], cookie: false }),
    );
  });

  it("signed out, nothing is hers to keep: 0, and nothing is read", async () => {
    expect(
      await kept({ qr_token: TOKEN, session_token: MINE, kept: true }),
    ).toBe(0);
    expect(countKeptTicketUploads).not.toHaveBeenCalled();
    expect(getEventByQrToken).not.toHaveBeenCalled();
  });

  it("a door that holds the ticket, or an album that is not there, answers 0", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u-1" } } });
    ticketBlocked.mockResolvedValue(true);
    expect(
      await kept({ qr_token: TOKEN, session_token: MINE, kept: true }),
    ).toBe(0);
    ticketBlocked.mockReset();
    getEventByQrToken.mockResolvedValue({ ok: false });
    expect(
      await kept({ qr_token: TOKEN, session_token: MINE, kept: true }),
    ).toBe(0);
    expect(countKeptTicketUploads).not.toHaveBeenCalled();
  });

  it("needs its ticket, and meets the limiter before any read", async () => {
    expect((await post({ qr_token: TOKEN, kept: true })).status).toBe(400);
    checkAbuseRate.mockResolvedValue({ allowed: false, retryAfterSec: 30 });
    const res = await post({
      qr_token: TOKEN,
      session_token: MINE,
      kept: true,
    });
    expect(res.status).toBe(429);
    expect(countKeptTicketUploads).not.toHaveBeenCalled();
    expect(recordAbuseEvent).not.toHaveBeenCalled();
  });
});
