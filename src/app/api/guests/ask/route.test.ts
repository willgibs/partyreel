/**
 * ASK THE HOST TO LET ME IN (the doors, event-settings r1): the held door's `Ask to join` and the shut
 * door's `Ask Maya to let me in` (`unlisted=ask`).
 *
 *   ★ THE ASKER IS HER CONFIRMED ACCOUNT, never the body: a signed-out or unconfirmed caller is sent
 *     to the email step, and the id every mint carries is `getUser()`'s.
 *   ★ THE DOOR DECIDES: a door that shuts her out asks nothing, in the private album's words; an invite
 *     list mints through `ask_to_join`; every other door mints through the join's own `create_guest`.
 *   ★ THE TICKET GOES ON THE COOKIE, as a join's does, so the held door's page knows her on this device.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const createGuest = vi.fn();
const askToJoin = vi.fn();
const getEventByQrToken = vi.fn();
const mayUploadPastLock = vi.fn();
const getUser = vi.fn();

vi.mock("@/lib/db/mutations/guest", () => ({
  createGuest: (...args: unknown[]) => createGuest(...args),
  askToJoin: (...args: unknown[]) => askToJoin(...args),
}));
vi.mock("@/lib/db/queries/guest-events", () => ({
  getEventByQrToken: (...args: unknown[]) => getEventByQrToken(...args),
}));
vi.mock("@/lib/events/upload-lock", () => ({
  mayUploadPastLock: (...args: unknown[]) => mayUploadPastLock(...args),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve({ auth: { getUser } }),
}));
vi.mock("@/lib/security/abuse-rate-limit-store", () => ({
  abuseHashes: () => ({ ipHash: "ip", scopeHash: "scope" }),
  checkAbuseRate: () => Promise.resolve({ allowed: true, retryAfterSec: 0 }),
  recordAbuseEvent: () => Promise.resolve(undefined),
}));
vi.mock("@/lib/observability/sentry", () => ({ captureWarning: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

const ticketBlocked = vi.fn();
const doorDecides = vi.fn();
vi.mock("@/lib/events/closed-door.server", async () =>
  (await import("@/lib/events/testing/door-double")).doorDouble({
    blocked: (event, tickets) => ticketBlocked(event, tickets),
    decide: (event, caller) => doorDecides(event, caller),
  }),
);

const { POST } = await import("@/app/api/guests/ask/route");

const TOKEN = "qr-token-1234";
const TICKET = "c".repeat(64);
const CONFIRMED = {
  id: "user-sam",
  email: "sam@example.com",
  email_confirmed_at: "2026-09-29T00:00:00Z",
};

function post(body: unknown) {
  return POST(
    new Request("https://partyreel.com/api/guests/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

/** The album, as the door reads it: `visibility` stands in for the door itself (the double's own). */
function album(visibility: string) {
  getEventByQrToken.mockResolvedValue({
    ok: true,
    data: { id: "event-1", visibility, require_verified_email: true },
  });
}

const MINTED = {
  ok: true,
  data: {
    session_token: TICKET,
    guest_id: "g1",
    event_id: "event-1",
    display_name: null,
    verified: true,
    emailAttached: false,
    admission: "waiting",
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  ticketBlocked.mockReset();
  doorDecides.mockReset();
  getUser.mockResolvedValue({ data: { user: CONFIRMED } });
  mayUploadPastLock.mockResolvedValue(false);
  createGuest.mockResolvedValue(MINTED);
  askToJoin.mockResolvedValue(MINTED);
  album("approve");
});

describe("who asks", () => {
  it("a malformed body is a 400, and nothing is read", async () => {
    expect((await post("{not json")).status).toBe(400);
    expect((await post({})).status).toBe(400);
    expect(getEventByQrToken).not.toHaveBeenCalled();
  });

  it("a link that names no album is a 404", async () => {
    getEventByQrToken.mockResolvedValue({ ok: false, code: "not_found" });
    const res = await post({ qr_token: TOKEN });
    expect(res.status).toBe(404);
    expect(createGuest).not.toHaveBeenCalled();
    expect(askToJoin).not.toHaveBeenCalled();
  });

  it("★ a signed-out or UNCONFIRMED caller is sent to the email step, and nothing mints", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const signedOut = await post({ qr_token: TOKEN });
    getUser.mockResolvedValue({
      data: { user: { ...CONFIRMED, email_confirmed_at: null } },
    });
    const unconfirmed = await post({ qr_token: TOKEN });
    for (const res of [signedOut, unconfirmed]) {
      expect(res.status).toBe(422);
      expect(((await res.json()) as { code: string }).code).toBe(
        "verification_required",
      );
    }
    expect(createGuest).not.toHaveBeenCalled();
    expect(askToJoin).not.toHaveBeenCalled();
  });

  it("★ the asker is the session's account, never a body's id", async () => {
    album("invite");
    await post({ qr_token: TOKEN, user_id: "someone-else" });
    expect(askToJoin).toHaveBeenCalledWith({
      qrToken: TOKEN,
      userId: "user-sam",
    });
  });
});

describe("the door decides", () => {
  it("★ a door that shuts her out asks nothing, in the private album's words", async () => {
    album("private");
    const res = await post({ qr_token: TOKEN });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      ok: false,
      code: "unauthorized",
      message: "This event is private.",
    });
    // A block on an open album reads the same.
    album("open");
    ticketBlocked.mockResolvedValue(true);
    const blocked = await post({ qr_token: TOKEN });
    expect(blocked.status).toBe(403);
    expect(createGuest).not.toHaveBeenCalled();
    expect(askToJoin).not.toHaveBeenCalled();
  });

  it("an invite list mints through ask_to_join", async () => {
    album("invite");
    const res = await post({ qr_token: TOKEN });
    expect(res.status).toBe(200);
    expect(askToJoin).toHaveBeenCalledOnce();
    expect(createGuest).not.toHaveBeenCalled();
  });

  it("where the host lets each guest in, the join's own mint holds her, nameless and addressless", async () => {
    const res = await post({ qr_token: TOKEN });
    expect(res.status).toBe(200);
    expect(createGuest).toHaveBeenCalledWith({
      qrToken: TOKEN,
      userId: "user-sam",
      unlockProven: false,
      displayName: null,
      pendingEmail: null,
    });
    expect(((await res.json()) as { admission: string }).admission).toBe(
      "waiting",
    );
  });

  it("a door that moved to a password under her: someone already in passes it, a stranger does not", async () => {
    album("password");
    doorDecides.mockResolvedValueOnce({ kind: "through", admitted: true });
    await post({ qr_token: TOKEN });
    expect(createGuest).toHaveBeenLastCalledWith(
      expect.objectContaining({ unlockProven: true }),
    );
    expect(mayUploadPastLock).not.toHaveBeenCalled();

    await post({ qr_token: TOKEN });
    expect(mayUploadPastLock).toHaveBeenCalledWith("event-1");
    expect(createGuest).toHaveBeenLastCalledWith(
      expect.objectContaining({ unlockProven: false }),
    );
  });

  it("a refused mint answers in its own words and status", async () => {
    createGuest.mockResolvedValue({
      ok: false,
      code: "unauthorized",
      message: "This event is private.",
    });
    const res = await post({ qr_token: TOKEN });
    expect(res.status).toBe(403);
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});

describe("the ticket", () => {
  it("★ goes on the cookie, as a join's does, and the answer carries the mint's own words", async () => {
    const res = await post({ qr_token: TOKEN });
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`pr_guest_event-1=${TICKET}`);
    expect(cookie).toContain("HttpOnly");
    expect(await res.json()).toEqual({
      ok: true,
      session_token: TICKET,
      event_id: "event-1",
      display_name: null,
      verified: true,
      email_attached: false,
      admission: "waiting",
    });
  });
});
