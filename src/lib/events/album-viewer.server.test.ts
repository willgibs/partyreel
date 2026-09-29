import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * WHO IS ASKING: the paged album's gate is the gallery poll's, resolved the same way, so a guest can
 * never see more through the new routes than through the old one.
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

// The ticket half of the closed door (the per-event block, 20260928120000): the real door runs, and
// only the SQL question is stood in for.
const isTicketBlocked = vi.fn();
vi.mock("@/lib/db/queries/event-blocks", () => ({
  isTicketBlocked: (...a: unknown[]) => isTicketBlocked(...a),
}));

const { resolveAlbumViewer } = await import("@/lib/events/album-viewer.server");

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
  isTicketBlocked.mockResolvedValue(false);
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

describe("the closed door (the per-event block): a ticket a block holds is gone, as a private album is", () => {
  const COOKIE = "c".repeat(64);

  it("a body ticket the block holds is gone, and nothing is resolved", async () => {
    isTicketBlocked.mockImplementation(
      async (_event: string, tokens: string[]) => tokens.includes(TOKEN),
    );
    expect(await resolveAlbumViewer("qr-1", TOKEN)).toEqual({ kind: "gone" });
    expect(resolveViewerDecision).not.toHaveBeenCalled();
  });

  it("the cookie's ticket counts too, so a poll that sends no body token is still refused", async () => {
    cookieJar.set("pr_guest_evt-1", COOKIE);
    isTicketBlocked.mockImplementation(
      async (_event: string, tokens: string[]) => tokens.includes(COOKIE),
    );
    expect(await resolveAlbumViewer("qr-1", undefined)).toEqual({
      kind: "gone",
    });
  });

  it("asks with every ticket the request holds, the body's and the cookie's, for this event", async () => {
    cookieJar.set("pr_guest_evt-1", COOKIE);
    await resolveAlbumViewer("qr-1", TOKEN);
    expect(isTicketBlocked).toHaveBeenCalledWith("evt-1", [TOKEN, COOKIE]);
  });

  it("★ asks on a PRIVATE album too, so a block and a private album cost the same work", async () => {
    getEventByQrToken.mockResolvedValue({
      ok: true,
      data: { ...EVENT, visibility: "private" },
    });
    expect(await resolveAlbumViewer("qr-1", TOKEN)).toEqual({ kind: "gone" });
    expect(isTicketBlocked).toHaveBeenCalledWith("evt-1", [TOKEN]);
  });

  it("asks nothing when the request holds no ticket at all", async () => {
    await resolveAlbumViewer("qr-1", "not-a-token");
    expect(isTicketBlocked).not.toHaveBeenCalled();
  });
});
