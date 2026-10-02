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
const readOwnUploads = vi.fn();
const countKeptTicketUploads = vi.fn();
const getUser = vi.fn();
const getEventByQrToken = vi.fn();
const recordAbuseEvent = vi.fn().mockResolvedValue(undefined);
const checkAbuseRate = vi
  .fn()
  .mockResolvedValue({ allowed: true, retryAfterSec: 0 });

vi.mock("@/lib/db/mutations/guest-media", () => ({
  listSessionMediaIds: (...args: unknown[]) => listSessionMediaIds(...args),
  // Her pictures ride the read (20261002200000); a case that names none has none.
  readOwnUploads: async (...args: unknown[]) => ({
    pictures: [],
    ...(await readOwnUploads(...args)),
  }),
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
const captureError = vi.fn();
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: vi.fn(),
  captureError: (...args: unknown[]) => captureError(...args),
}));
// THE CAMERA'S ROLL (20261002200000), the upload gate's answer for this viewer.
const getUploadGate = vi.fn();
vi.mock("@/lib/db/queries/guest-gate", () => ({
  getUploadGate: (...args: unknown[]) => getUploadGate(...args),
}));
// HER OWN PICTURES, presigned here for her alone.
const presignDownload = vi.fn();
vi.mock("@/lib/r2/presign", () => ({
  presignDownload: (...args: unknown[]) => presignDownload(...args),
}));
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
  readOwnUploads.mockResolvedValue({ items: [], news: [] });
  countKeptTicketUploads.mockResolvedValue(0);
  getUser.mockResolvedValue({ data: { user: null } });
  getUploadGate.mockResolvedValue({ contributed: false, albumFull: false, eventGone: false, roll: null });
  presignDownload.mockImplementation(async ({ key }: { key: string }) => `https://r2.test/${key}?sig`);
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
    readOwnUploads.mockResolvedValue({
      items: [
        { id: "m2", status: "pending" },
        { id: "m1", status: "approved" },
      ],
      news: [],
    });
    expect(
      await items({ qr_token: TOKEN, session_token: MINE, statuses: true }),
    ).toEqual([
      { id: "m2", status: "pending" },
      { id: "m1", status: "approved" },
    ]);
    expect(readOwnUploads).toHaveBeenCalledWith({
      eventId: "event-1",
      sessionToken: MINE,
      userId: null,
      tell: false,
    });
  });

  it("a signed-in viewer's account speaks for its rows, from getUser() and nowhere else", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    await items({ qr_token: TOKEN, statuses: true, user_id: "someone-else" });
    expect(readOwnUploads).toHaveBeenCalledWith({
      eventId: "event-1",
      sessionToken: null,
      userId: "user-1",
      tell: false,
    });
  });

  it("tells a refusal (`host-curation`'s `told=line`, TRACKER_TELLS_REFUSAL)", async () => {
    readOwnUploads.mockResolvedValue({
      items: [{ id: "m3", status: "refused" }],
      news: [],
    });
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
    expect(readOwnUploads).not.toHaveBeenCalled();
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
    expect(readOwnUploads).toHaveBeenCalledTimes(1);
  });

  it("the ids answer is untouched by the new ask: a body without `statuses` still needs its token", async () => {
    expect((await post({ qr_token: TOKEN })).status).toBe(400);
    expect(
      (await post({ qr_token: TOKEN, session_token: MINE, statuses: false }))
        .status,
    ).toBe(200);
    expect(readOwnUploads).not.toHaveBeenCalled();
  });
});

/**
 * ★ HER NEWS, ASKED WITH `tell` (crumbs-38, the approval toast's server half): the uploads of hers a decision let into
 * the album since she was last told, read and marked told by `readOwnUploads` (its own pins are guest-media.test.ts's).
 * Pinned here: only a `tell` asks for it (a plain statuses read marks nothing told), the answer carries the read's
 * news beside the items, and every "no" (a door that holds her, a private album) tells nothing at all.
 */
describe("tell: what she is told on her return", () => {
  it("asks the read to tell, and answers its news beside the items", async () => {
    readOwnUploads.mockResolvedValue({
      items: [{ id: "m1", status: "approved" }],
      news: ["m1"],
    });
    const res = await post({
      qr_token: TOKEN,
      session_token: MINE,
      statuses: true,
      tell: true,
    });
    await expect(res.json()).resolves.toEqual({
      ok: true,
      items: [{ id: "m1", status: "approved" }],
      news: ["m1"],
    });
    expect(readOwnUploads).toHaveBeenCalledWith({
      eventId: "event-1",
      sessionToken: MINE,
      userId: null,
      tell: true,
    });
    expect(res.headers.get("Cache-Control")).toContain("no-store");
  });

  it("a plain statuses read tells nothing and marks nothing told", async () => {
    readOwnUploads.mockResolvedValue({
      items: [{ id: "m1", status: "approved" }],
      news: [],
    });
    const res = await post({
      qr_token: TOKEN,
      session_token: MINE,
      statuses: true,
    });
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).not.toHaveProperty("news");
    expect(readOwnUploads).toHaveBeenCalledWith(
      expect.objectContaining({ tell: false }),
    );
  });

  it("a door that holds her tells nothing, and nothing is read or marked", async () => {
    getEventByQrToken.mockResolvedValue({
      ok: true,
      data: { id: "event-1", visibility: "private" },
    });
    const res = await post({
      qr_token: TOKEN,
      session_token: MINE,
      statuses: true,
      tell: true,
    });
    await expect(res.json()).resolves.toEqual({ ok: true, items: [] });
    expect(readOwnUploads).not.toHaveBeenCalled();
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
    readOwnUploads.mockResolvedValue({
      items: [{ id: "a1", status: "approved" }],
      news: [],
    });
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
    expect(readOwnUploads).toHaveBeenCalledWith({
      eventId: "event-1",
      sessionToken: null,
      userId: "user-1",
      tell: false,
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
    expect(readOwnUploads).not.toHaveBeenCalled();
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

describe("her own pictures and her roll (20261002200000)", () => {
  async function answer(body: unknown) {
    return (await (await post(body)).json()) as {
      items: { id: string; status: string; sealed?: true; picture?: unknown }[];
      roll?: unknown;
    };
  }
  const ask = { qr_token: TOKEN, session_token: MINE, statuses: true };

  it("★ a held or sealed item of hers carries its picture, presigned here; an item the album shows carries none", async () => {
    readOwnUploads.mockResolvedValue({
      items: [
        { id: "m1", status: "pending" },
        { id: "m2", status: "approved", sealed: true },
        { id: "m3", status: "approved" },
      ],
      news: [],
      pictures: [
        { id: "m1", type: "photo", original_key: "events/e/photo/1/original.jpg", preview_key: "events/e/photo/1/preview.webp", created_at: "2026-10-02T12:00:00.000000+00:00" },
        { id: "m2", type: "video", original_key: "events/e/video/2/original.mp4", preview_key: null, created_at: "2026-10-02T12:01:00.000000+00:00" },
      ],
    });
    const out = await answer(ask);
    expect(out.items).toEqual([
      {
        id: "m1",
        status: "pending",
        picture: { type: "photo", at: Date.parse("2026-10-02T12:00:00.000000+00:00"), tile: "https://r2.test/events/e/photo/1/preview.webp?sig" },
      },
      {
        id: "m2",
        status: "approved",
        sealed: true,
        picture: { type: "video", at: Date.parse("2026-10-02T12:01:00.000000+00:00"), tile: "https://r2.test/events/e/video/2/original.mp4?sig" },
      },
      { id: "m3", status: "approved" },
    ]);
    // Stable inside the bucket, like every album link, so a re-ask hands back the URL the browser cached.
    expect(presignDownload).toHaveBeenCalledWith({ key: "events/e/photo/1/preview.webp", stable: true });
    // Read for THIS ticket alone: the read is the one that decides whose a picture is.
    expect(readOwnUploads).toHaveBeenCalledWith(expect.objectContaining({ sessionToken: MINE }));
  });

  it("a presign that fails costs that picture alone, and is reported", async () => {
    readOwnUploads.mockResolvedValue({
      items: [{ id: "m1", status: "pending" }, { id: "m2", status: "pending" }],
      news: [],
      pictures: [
        { id: "m1", type: "photo", original_key: "events/e/photo/1/original.jpg", preview_key: null, created_at: "2026-10-02T12:00:00.000000+00:00" },
        { id: "m2", type: "photo", original_key: "events/e/photo/2/original.jpg", preview_key: null, created_at: "2026-10-02T12:00:00.000000+00:00" },
      ],
    });
    presignDownload.mockImplementation(async ({ key }: { key: string }) => {
      if (key.includes("/1/")) throw new Error("r2 down");
      return `https://r2.test/${key}?sig`;
    });
    const out = await answer(ask);
    expect(out.items[0]).toEqual({ id: "m1", status: "pending" });
    expect(out.items[1].picture).toBeDefined();
    expect(captureError).toHaveBeenCalledTimes(1);
  });

  it("★ an album with its camera on answers her roll, read for her ticket and her account; free uploads none", async () => {
    getEventByQrToken.mockResolvedValue({
      ok: true,
      data: { id: "event-1", visibility: "open", capture: "camera", roll_size: 24 },
    });
    getUploadGate.mockResolvedValue({
      contributed: true,
      albumFull: false,
      eventGone: false,
      roll: { used: 3, cap: 24, taken: 5, ceiling: 72 },
    });
    const out = await answer(ask);
    expect(out.roll).toEqual({ used: 3, cap: 24, taken: 5, ceiling: 72 });
    expect(getUploadGate).toHaveBeenCalledWith({ eventId: "event-1", sessionToken: MINE, userId: null });

    getEventByQrToken.mockResolvedValue({ ok: true, data: { id: "event-1", visibility: "open" } });
    getUploadGate.mockClear();
    const free = await answer(ask);
    expect(free).not.toHaveProperty("roll");
    expect(getUploadGate).not.toHaveBeenCalled();
  });

  it("a ticket that is not hers is never read for her roll: her account's rows alone", async () => {
    getEventByQrToken.mockResolvedValue({
      ok: true,
      data: { id: "event-1", visibility: "open", capture: "camera", roll_size: 24 },
    });
    sortTickets.mockImplementation(async () => ({ hers: [], others: [MINE] }));
    getUser.mockResolvedValue({ data: { user: { id: "user-9" } } });
    await answer(ask);
    expect(getUploadGate).toHaveBeenCalledWith({ eventId: "event-1", sessionToken: null, userId: "user-9" });
  });
});
