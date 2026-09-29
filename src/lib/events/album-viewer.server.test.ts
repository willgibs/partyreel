import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * WHO IS ASKING: the paged album's gate is the gallery poll's, resolved the same way, so a guest can
 * never see more through the new routes than through the old one. The door runs for real
 * (`closed-door.server.ts`); only its SQL question (`event_door_standing`) is stood in for.
 */
vi.mock("server-only", () => ({}));

const cookieJar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined,
  }),
}));
const getEventByQrToken = vi.fn();
vi.mock("@/lib/db/queries/guest-events", () => ({
  getEventByQrToken: (...a: unknown[]) => getEventByQrToken(...a),
}));
let demo = false;
vi.mock("@/lib/demo", () => ({ isDemoToken: () => demo }));
const resolveViewerDecision = vi.fn();
const isEventOwner = vi.fn();
vi.mock("@/lib/events/gallery-access.server", () => ({
  resolveViewerDecision: (...a: unknown[]) => resolveViewerDecision(...a),
  isEventOwner: (...a: unknown[]) => isEventOwner(...a),
}));
const isUnlocked = vi.fn();
vi.mock("@/lib/events/unlock-cookie", () => ({
  isUnlocked: (...a: unknown[]) => isUnlocked(...a),
}));
let user: { id: string; email_confirmed_at: string | null } | null = null;
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user } }) },
  }),
}));

// The door's SQL question (the doors, 20260929120000): the real door runs, and only the standing is
// stood in for. By default it is a stranger at the album's own door.
type Caller = { userId: string | null; tickets: string[] };
const readDoorStanding = vi.fn();
vi.mock("@/lib/db/queries/event-doors", () => ({
  readDoorStanding: (...a: unknown[]) => readDoorStanding(...a),
  readDoorEventDetails: async () => null,
}));

/**
 * The door a stranger meets at the album the read served last: its stored visibility, which is what the SQL
 * question answers for her (Only me and a gate are stored private, as the anon read reads them).
 */
async function servedDoor(): Promise<string> {
  const last = getEventByQrToken.mock.results.at(-1)?.value;
  const served = (await last) as { data?: { visibility?: string } } | undefined;
  return served?.data?.visibility ?? "open";
}

function standing(over: Record<string, unknown>) {
  return {
    found: true,
    door: "open",
    host: false,
    blocked: false,
    wasIn: false,
    in: false,
    waiting: false,
    listed: false,
    confirmed: false,
    ...over,
  };
}

const { resolveAlbumViewer } = await import("@/lib/events/album-viewer.server");
const { holdsDoorPass } = await import("@/lib/event/door/pass.server");

const EVENT = { id: "evt-1", qr_token: "qr-1", visibility: "open" };
const TOKEN = "a".repeat(64);

beforeEach(() => {
  vi.clearAllMocks();
  cookieJar.clear();
  demo = false;
  user = null;
  getEventByQrToken.mockResolvedValue({ ok: true, data: EVENT });
  resolveViewerDecision.mockResolvedValue({ access: "full", gate: null });
  isEventOwner.mockResolvedValue(false);
  isUnlocked.mockResolvedValue(false);
  readDoorStanding.mockImplementation(async () =>
    standing({ door: await servedDoor() }),
  );
});

describe("the event", () => {
  it("an unknown event and a private one are both simply gone", async () => {
    getEventByQrToken.mockResolvedValue({ ok: false, code: "not_found" });
    expect(await resolveAlbumViewer("qr-1", undefined)).toEqual({
      kind: "gone",
    });
    getEventByQrToken.mockResolvedValue({
      ok: true,
      data: { ...EVENT, visibility: "private" },
    });
    expect(await resolveAlbumViewer("qr-1", undefined)).toEqual({
      kind: "gone",
    });
    expect(resolveViewerDecision).not.toHaveBeenCalled();
  });

  it("the demo is full and nobody's, with no auth read at all", async () => {
    demo = true;
    const v = await resolveAlbumViewer("qr-1", TOKEN);
    expect(v).toMatchObject({
      kind: "viewer",
      decision: { access: "full", gate: null },
      isDemo: true,
      heal: null,
    });
    expect(resolveViewerDecision).not.toHaveBeenCalled();
  });
});

describe("the viewer", () => {
  it("a password album asks the unlock cookie; an open one does not", async () => {
    getEventByQrToken.mockResolvedValue({
      ok: true,
      data: { ...EVENT, visibility: "password" },
    });
    await resolveAlbumViewer("qr-1", undefined);
    expect(isUnlocked).toHaveBeenCalledWith("evt-1");
    expect(resolveViewerDecision).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ isUnlocked: false }),
    );
    vi.clearAllMocks();
    getEventByQrToken.mockResolvedValue({ ok: true, data: EVENT });
    resolveViewerDecision.mockResolvedValue({ access: "full", gate: null });
    await resolveAlbumViewer("qr-1", undefined);
    expect(isUnlocked).not.toHaveBeenCalled();
  });

  it("only a CONFIRMED email is authed, and the owner is asked by host id", async () => {
    user = { id: "u-1", email_confirmed_at: null };
    await resolveAlbumViewer("qr-1", undefined);
    expect(resolveViewerDecision).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ isAuthed: false, userId: "u-1" }),
    );
    expect(isEventOwner).toHaveBeenCalledWith(
      "evt-1",
      "u-1",
      expect.anything(),
    );
    user = { id: "u-1", email_confirmed_at: "2026-09-01T00:00:00Z" };
    await resolveAlbumViewer("qr-1", undefined);
    expect(resolveViewerDecision).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ isAuthed: true }),
    );
  });

  it("the body's token wins as the identity, and a differing one is reported as the heal", async () => {
    cookieJar.set("pr_guest_evt-1", "b".repeat(64));
    const v = await resolveAlbumViewer("qr-1", TOKEN);
    expect(resolveViewerDecision).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ sessionToken: TOKEN }),
    );
    expect(v.kind === "viewer" && v.heal?.value).toBe(TOKEN);
  });

  it("no heal when the cookie already holds the token, or the body's is not a token", async () => {
    cookieJar.set("pr_guest_evt-1", TOKEN);
    const same = await resolveAlbumViewer("qr-1", TOKEN);
    expect(same.kind === "viewer" && same.heal).toBeNull();
    const junk = await resolveAlbumViewer("qr-1", "not-a-token");
    expect(junk.kind === "viewer" && junk.heal).toBeNull();
    expect(resolveViewerDecision).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ sessionToken: TOKEN }),
    );
  });
});

describe("the shut door: a ticket a block holds is gone, as a private album is", () => {
  const COOKIE = "c".repeat(64);
  const blockedWhenHolding = (ticket: string) =>
    readDoorStanding.mockImplementation(
      async (_id: string, caller: Caller) =>
        standing({
          door: await servedDoor(),
          blocked: caller.tickets.includes(ticket),
        }),
    );

  it("a body ticket the block holds is gone, and nothing is resolved", async () => {
    blockedWhenHolding(TOKEN);
    expect(await resolveAlbumViewer("qr-1", TOKEN)).toEqual({ kind: "gone" });
    expect(resolveViewerDecision).not.toHaveBeenCalled();
  });

  it("the cookie's ticket counts too, so a poll that sends no body token is still refused", async () => {
    cookieJar.set("pr_guest_evt-1", COOKIE);
    blockedWhenHolding(COOKIE);
    expect(await resolveAlbumViewer("qr-1", undefined)).toEqual({
      kind: "gone",
    });
  });

  it("asks with every ticket the request holds, the body's and the cookie's, for this event", async () => {
    cookieJar.set("pr_guest_evt-1", COOKIE);
    await resolveAlbumViewer("qr-1", TOKEN);
    expect(readDoorStanding).toHaveBeenCalledWith("evt-1", {
      userId: null,
      tickets: [TOKEN, COOKIE],
    });
  });

  it("★ asks on a PRIVATE album too, so a block and a private album cost the same work", async () => {
    getEventByQrToken.mockResolvedValue({
      ok: true,
      data: { ...EVENT, visibility: "private" },
    });
    expect(await resolveAlbumViewer("qr-1", TOKEN)).toEqual({ kind: "gone" });
    expect(readDoorStanding).toHaveBeenCalledWith("evt-1", {
      userId: null,
      tickets: [TOKEN],
    });
  });

  it("asks nothing when a signed-out request holds no ticket at an open album", async () => {
    await resolveAlbumViewer("qr-1", "not-a-token");
    expect(readDoorStanding).not.toHaveBeenCalled();
  });
});

describe("the doors (event-settings r1): the door answers first", () => {
  it("★ a door that holds her answers the album with nothing real, and nothing else is resolved", async () => {
    user = { id: "u-1", email_confirmed_at: "2026-09-01T00:00:00Z" };
    getEventByQrToken.mockResolvedValue({
      ok: true,
      data: { ...EVENT, visibility: "private", name: "" },
    });
    readDoorStanding.mockResolvedValue(
      standing({ door: "approve", waiting: true, confirmed: true }),
    );
    const v = await resolveAlbumViewer("qr-1", TOKEN);
    expect(v).toMatchObject({
      kind: "viewer",
      decision: { access: "none", gate: "waiting" },
    });
    expect(resolveViewerDecision).not.toHaveBeenCalled();
    expect(v.kind === "viewer" && holdsDoorPass(v.event)).toBe(false);
  });

  it("★ someone already in passes the password without its cookie, and carries the pass", async () => {
    getEventByQrToken.mockResolvedValue({
      ok: true,
      data: { ...EVENT, visibility: "password" },
    });
    readDoorStanding.mockResolvedValue(
      standing({ door: "password", in: true, wasIn: true }),
    );
    const v = await resolveAlbumViewer("qr-1", TOKEN);
    expect(isUnlocked).not.toHaveBeenCalled();
    expect(resolveViewerDecision).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ isUnlocked: true }),
    );
    expect(v.kind === "viewer" && holdsDoorPass(v.event)).toBe(true);
  });

  it("a stranger at a password album still needs the cookie, and carries no pass", async () => {
    getEventByQrToken.mockResolvedValue({
      ok: true,
      data: { ...EVENT, visibility: "password" },
    });
    readDoorStanding.mockResolvedValue(standing({ door: "password" }));
    const v = await resolveAlbumViewer("qr-1", TOKEN);
    expect(isUnlocked).toHaveBeenCalledWith("evt-1");
    expect(v.kind === "viewer" && holdsDoorPass(v.event)).toBe(false);
  });
});
