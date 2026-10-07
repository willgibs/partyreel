import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE LOOK'S TWO SERVER FUNCTIONS (guests-room r1, `card=standing`): public endpoints taking raw client values. Pinned:
 * a malformed value answers the one empty answer in no detail; the cursor a client hands back reaches a filter only as
 * the album's codec rewrote it; the host's side asks who she is and proves the event hers before a link is minted;
 * the album's side stands behind the album's own gate (`full`, never the demo) and mints through the album's own
 * minter, so a guest's card holds only what her album shows her.
 */

vi.mock("server-only", () => ({}));

const calls = vi.hoisted(() => ({
  user: { id: "host-1" } as { id: string } | null,
  readHostLook: vi.fn(),
  readAlbumLook: vi.fn(),
  getEvent: vi.fn(),
  readHostLinksBody: vi.fn(),
  resolveAlbumViewer: vi.fn(),
  mintGuestAlbumLinks: vi.fn(),
  captureError: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: calls.user } }) },
  }),
}));
vi.mock("@/lib/db/queries/guest-look", () => ({
  readHostLook: calls.readHostLook,
  readAlbumLook: calls.readAlbumLook,
}));
vi.mock("@/lib/db/queries/events", () => ({ getEvent: calls.getEvent }));
vi.mock("@/lib/event/host-links.server", () => ({
  readHostLinksBody: calls.readHostLinksBody,
}));
vi.mock("@/lib/events/album-viewer.server", () => ({
  resolveAlbumViewer: calls.resolveAlbumViewer,
}));
vi.mock("@/lib/events/album-wire-links.server", () => ({
  mintGuestAlbumLinks: calls.mintGuestAlbumLinks,
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureError: calls.captureError,
}));

const { readAlbumLookAction, readHostLookAction } =
  await import("./look-actions");

const EVENT = "00000000-0000-4000-8000-0000000000e1";
const USER = "00000000-0000-4000-8000-0000000000a1";
const GUEST = "00000000-0000-4000-8000-0000000000b1";
const PHOTO = "00000000-0000-4000-8000-0000000000c1";

const page = {
  photos: 2,
  videos: 0,
  rows: [
    { id: PHOTO, type: "photo", width: 4, height: 3, duration: null },
    { id: "dropped", type: "photo", width: 4, height: 3, duration: null },
  ],
  next: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  calls.user = { id: "host-1" };
  calls.readHostLook.mockResolvedValue({ eventId: EVENT, ...page });
  calls.getEvent.mockResolvedValue({ id: EVENT, name: "Maya & Jay" });
  calls.readHostLinksBody.mockResolvedValue({
    links: [[PHOTO, "tile", "view", "dl", ["Sam", 0, "sam@example.com"]]],
    likes: {},
  });
  calls.resolveAlbumViewer.mockResolvedValue({
    kind: "viewer",
    event: { id: EVENT, name: "Maya & Jay" },
    decision: { access: "full", gate: null },
    isDemo: false,
  });
  calls.readAlbumLook.mockResolvedValue(page);
  calls.mintGuestAlbumLinks.mockResolvedValue({
    links: [[PHOTO, "tile", "view", "dl", ["Sam", 0]]],
  });
});

const hostAsk = (over: Record<string, unknown> = {}) => ({
  target: { kind: "row", guestId: GUEST },
  after: null,
  limit: 4,
  ...over,
});

const albumAsk = (over: Record<string, unknown> = {}) => ({
  qrToken: "qr-1",
  who: { kind: "row", guestId: GUEST },
  after: null,
  limit: 4,
  ...over,
});

describe("readHostLookAction", () => {
  it("answers a page of her guest's photographs, the album's own items, a dropped row no item", async () => {
    const answer = await readHostLookAction(hostAsk());
    expect(answer).toMatchObject({ ok: true, photos: 2, videos: 0 });
    expect(answer.ok && answer.items.map((i) => i.id)).toEqual([PHOTO]);
    expect(calls.getEvent).toHaveBeenCalledWith(EVENT);
    expect(calls.readHostLinksBody.mock.calls[0][2]).toEqual([
      PHOTO,
      "dropped",
    ]);
  });

  it.each([
    ["no value at all", undefined],
    ["a target that names nobody", hostAsk({ target: { kind: "row" } })],
    [
      "an id that is no uuid",
      hostAsk({ target: { kind: "row", guestId: "1 or 1" } }),
    ],
    ["a page past the panel's", hostAsk({ limit: 500 })],
    ["a cursor with no id", hostAsk({ after: { at: "2026-10-03T18:00:00Z" } })],
  ])(
    "★ refuses %s, in no detail, before anything is read",
    async (_label, ask) => {
      expect(await readHostLookAction(ask)).toEqual({ ok: false });
      expect(calls.readHostLook).not.toHaveBeenCalled();
    },
  );

  it("★ a cursor's time reaches the read only as the album's codec writes it, and one that is no time reads nothing", async () => {
    await readHostLookAction(
      hostAsk({
        after: { at: "2026-10-03T18:00:00.123456+00:00", id: PHOTO },
      }),
    );
    expect(calls.readHostLook.mock.calls[0][1]).toEqual({
      after: { at: "2026-10-03T18:00:00.123456Z", id: PHOTO },
      limit: 4,
    });
    calls.readHostLook.mockClear();
    expect(
      await readHostLookAction(
        hostAsk({ after: { at: "x,id.gt.0", id: PHOTO } }),
      ),
    ).toEqual({ ok: false });
    expect(calls.readHostLook).not.toHaveBeenCalled();
  });

  it("★ signed out: nothing is read", async () => {
    calls.user = null;
    expect(await readHostLookAction(hostAsk())).toEqual({ ok: false });
    expect(calls.readHostLook).not.toHaveBeenCalled();
  });

  it("★ a person who is nobody's here, or an event that is not hers, mints no link", async () => {
    calls.readHostLook.mockResolvedValueOnce(null);
    expect(await readHostLookAction(hostAsk())).toEqual({ ok: false });
    calls.getEvent.mockResolvedValueOnce(null);
    expect(await readHostLookAction(hostAsk())).toEqual({ ok: false });
    expect(calls.readHostLinksBody).not.toHaveBeenCalled();
  });

  it("a read that throws is reported and answered as nothing, never a throw into the card", async () => {
    calls.readHostLook.mockRejectedValueOnce(new Error("db down"));
    expect(await readHostLookAction(hostAsk())).toEqual({ ok: false });
    expect(calls.captureError).toHaveBeenCalledWith("db", expect.any(Error), {
      action: "guest_look_host",
    });
  });
});

describe("readAlbumLookAction", () => {
  it("answers what the album shows of a guest, through the album's own minter, with no address", async () => {
    const answer = await readAlbumLookAction(
      albumAsk({ who: { kind: "account", userId: USER } }),
    );
    expect(answer.ok && answer.items.map((i) => i.id)).toEqual([PHOTO]);
    expect(JSON.stringify(answer)).not.toMatch(/"uploaderEmail"|@/);
    expect(calls.resolveAlbumViewer).toHaveBeenCalledWith("qr-1", undefined);
    expect(calls.mintGuestAlbumLinks).toHaveBeenCalledWith(
      expect.objectContaining({ id: EVENT }),
      [PHOTO, "dropped"],
      { isDemo: false },
    );
  });

  it("hands the album's gate the device's ticket where the card has one", async () => {
    await readAlbumLookAction(albumAsk({ sessionToken: "ticket-1" }));
    expect(calls.resolveAlbumViewer).toHaveBeenCalledWith("qr-1", "ticket-1");
  });

  it.each([
    ["a gone album (unknown, or a door that shuts her out)", { kind: "gone" }],
    [
      "a teaser",
      {
        kind: "viewer",
        decision: { access: "teaser" },
        isDemo: false,
        event: { id: EVENT },
      },
    ],
    [
      "a locked album",
      {
        kind: "viewer",
        decision: { access: "none" },
        isDemo: false,
        event: { id: EVENT },
      },
    ],
    [
      "the demo, which lists nobody",
      {
        kind: "viewer",
        decision: { access: "full" },
        isDemo: true,
        event: { id: EVENT },
      },
    ],
  ])("★ %s answers nothing, and no person is read", async (_label, viewer) => {
    calls.resolveAlbumViewer.mockResolvedValueOnce(viewer);
    expect(await readAlbumLookAction(albumAsk())).toEqual({ ok: false });
    expect(calls.readAlbumLook).not.toHaveBeenCalled();
  });

  it("★ refuses a photograph as the person (the credit's look is the host's alone) and a malformed token", async () => {
    expect(
      await readAlbumLookAction(
        albumAsk({ who: { kind: "media", mediaId: PHOTO } }),
      ),
    ).toEqual({ ok: false });
    expect(await readAlbumLookAction(albumAsk({ qrToken: "" }))).toEqual({
      ok: false,
    });
    expect(calls.resolveAlbumViewer).not.toHaveBeenCalled();
  });

  it("★ the album's own read refusing a viewer its decision let in (a password album without its cookie): nothing", async () => {
    calls.mintGuestAlbumLinks.mockResolvedValueOnce(null);
    expect(await readAlbumLookAction(albumAsk())).toEqual({ ok: false });
  });

  it("a person with nothing the album shows answers an empty page, and mints nothing", async () => {
    calls.readAlbumLook.mockResolvedValueOnce({
      photos: 0,
      videos: 0,
      rows: [],
      next: null,
    });
    expect(await readAlbumLookAction(albumAsk())).toEqual({
      ok: true,
      photos: 0,
      videos: 0,
      items: [],
      next: null,
    });
    expect(calls.mintGuestAlbumLinks).not.toHaveBeenCalled();
  });
});
