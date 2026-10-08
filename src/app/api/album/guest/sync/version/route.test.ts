import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE CDN'S ASK, ANTAGONISTICALLY (X5): only an album everyone with the link sees whole is ever answered with
 * its version, and only that answer may be kept by the CDN; every other album, a malformed ask, a key that is
 * not the token's, and a window off the clock answer something no cache keeps; and nothing here can depend
 * on who is asking, because nothing here can read who is asking.
 */
import { edgeWindowOf } from "@/lib/album/edge-version";
import { guestAlbumEtag } from "@/lib/events/album-validator";

vi.mock("server-only", () => ({}));

// ★ WHO IS ASKING IS UNREADABLE HERE: the session client and the cookie jar throw if anything reaches for them.
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => {
    throw new Error("the version route read a session");
  },
}));
vi.mock("next/headers", () => ({
  cookies: () => {
    throw new Error("the version route read a cookie");
  },
  headers: () => {
    throw new Error("the version route read the request's headers");
  },
}));

const getEventByQrTokenForAnyone = vi.fn();
vi.mock("@/lib/db/queries/guest-events", () => ({
  getEventByQrTokenForAnyone: (...a: unknown[]) =>
    getEventByQrTokenForAnyone(...a),
}));
const readGuestAlbumVersions = vi.fn();
vi.mock("@/lib/db/queries/album-guest", () => ({
  readGuestAlbumVersions: (...a: unknown[]) => readGuestAlbumVersions(...a),
}));
const developIfDue = vi.fn();
vi.mock("@/lib/disposable/develop.server", () => ({
  developIfDue: (...a: unknown[]) => developIfDue(...a),
}));
const loadGalleryReel = vi.fn();
vi.mock("@/lib/events/gallery-access.server", () => ({
  loadGalleryReel: (...a: unknown[]) => loadGalleryReel(...a),
}));

const { GET } = await import("@/app/api/album/guest/sync/version/route");
const { albumEdgeKey } = await import("@/app/api/album/guest/sync/edge.server");

const TOKEN = "0123456789abcdef0123456789abcdef";
const OTHER = "fedcba9876543210fedcba9876543210";
const KEY = albumEdgeKey(TOKEN);
const REEL = {
  showReel: true,
  liveReelEnabled: true,
  styleId: null,
  clip: null,
};
const OPEN = {
  id: "e0000000-0000-4000-8000-000000000001",
  qr_token: TOKEN,
  visibility: "open",
  require_verified_email: false,
  require_upload_to_view: false,
  accepting_uploads: true,
};

function ask(
  over: { k?: string | null; w?: string | null; token?: string | null } = {},
  headers: Record<string, string> = {},
) {
  const k = over.k === undefined ? KEY : over.k;
  const w = over.w === undefined ? String(edgeWindowOf(Date.now())) : over.w;
  const token = over.token === undefined ? TOKEN : over.token;
  const query = [k === null ? null : `k=${k}`, w === null ? null : `w=${w}`]
    .filter(Boolean)
    .join("&");
  return GET(
    new Request(`https://partyreel.com/api/album/guest/sync/version?${query}`, {
      headers: {
        ...(token === null ? {} : { "x-album-token": token }),
        ...headers,
      },
    }),
  );
}

/** Nothing about the answer may be kept anywhere, and it says nothing of the album. */
function expectUnshared(res: Response) {
  expect(res.headers.get("cache-control")).toBe("private, no-store");
  expect(res.headers.get("vercel-cdn-cache-control")).toBeNull();
  expect(res.headers.get("cdn-cache-control")).toBeNull();
  expect(res.headers.get("set-cookie")).toBeNull();
}

beforeEach(() => {
  vi.clearAllMocks();
  getEventByQrTokenForAnyone.mockResolvedValue({ ok: true, data: OPEN });
  readGuestAlbumVersions.mockResolvedValue({
    version: 9,
    albumMax: 5,
    attrVersion: 2,
  });
  loadGalleryReel.mockResolvedValue(REEL);
  developIfDue.mockResolvedValue(undefined);
});

describe("an album everyone with the link sees whole", () => {
  it("★ answers its full-access validator alone, kept by the CDN for its window and by nothing else", async () => {
    const res = await ask();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      kind: "version",
      v: guestAlbumEtag({
        eventId: OPEN.id,
        access: "full",
        gate: null,
        albumMax: 5,
        attrVersion: 2,
        reel: REEL,
        developsAt: null,
        accepting: true,
      }),
    });
    // Only the version: no photograph, link, count or name rides.
    expect(Object.keys(body).sort()).toEqual(["kind", "v"]);
    expect(res.headers.get("vercel-cdn-cache-control")).toBe("max-age=5");
    expect(res.headers.get("cache-control")).toBe(
      "public, max-age=0, must-revalidate",
    );
    // Nothing that would make it one viewer's, or stop the CDN keeping it.
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(res.headers.get("vary")).toBeNull();
    expect(res.headers.get("etag")).toBeNull();
    expect(getEventByQrTokenForAnyone).toHaveBeenCalledWith(TOKEN);
  });

  it("★ answers the same bytes whoever asks: a session, a ticket or an unlock cookie changes nothing", async () => {
    const plain = await (await ask()).text();
    const dressed = await (
      await ask(
        {},
        {
          cookie:
            "sb-access-token=x; pr_guest_e0000000=" +
            "a".repeat(64) +
            "; pr_unlock_e0000000=1",
          authorization: "Bearer someone",
        },
      )
    ).text();
    expect(dressed).toBe(plain);
  });

  it("a window either side of the server's is answered (a device's clock a little off)", async () => {
    const w = edgeWindowOf(Date.now());
    for (const near of [w - 1, w + 1]) {
      const res = await ask({ w: String(near) });
      expect((await res.json()).kind).toBe("version");
    }
  });

  it("a develop the read says is due lands before the version is read, so the window carries it", async () => {
    const order: string[] = [];
    developIfDue.mockImplementation(async () => {
      order.push("develop");
    });
    readGuestAlbumVersions.mockImplementation(async () => {
      order.push("versions");
      return { version: 9, albumMax: 5, attrVersion: 2 };
    });
    await ask();
    expect(order).toEqual(["develop", "versions"]);
    expect(developIfDue).toHaveBeenCalledWith(OPEN);
  });

  it("the develop time and a closed album move the version (each rides the sync's own validator)", async () => {
    const base = (await (await ask()).json()).v;
    getEventByQrTokenForAnyone.mockResolvedValue({
      ok: true,
      data: { ...OPEN, accepting_uploads: false },
    });
    const closed = (await (await ask()).json()).v;
    getEventByQrTokenForAnyone.mockResolvedValue({
      ok: true,
      data: { ...OPEN, develops_at: "2026-10-08T03:00:00.000Z" },
    });
    const developing = (await (await ask()).json()).v;
    expect(new Set([base, closed, developing]).size).toBe(3);
  });
});

describe("★ every other album answers `ask`, which no cache keeps and which says nothing of why", () => {
  const cases: [string, Record<string, unknown>][] = [
    ["a password album", { visibility: "password" }],
    ["Only me, or a gated album (stored private)", { visibility: "private" }],
    ["an email asked before the album", { require_verified_email: true }],
    ["an upload asked before the album", { require_upload_to_view: true }],
    [
      "an upload asked first while uploads are closed (the gate fails open, per viewer)",
      { require_upload_to_view: true, accepting_uploads: false },
    ],
  ];
  for (const [name, over] of cases) {
    it(name, async () => {
      getEventByQrTokenForAnyone.mockResolvedValue({
        ok: true,
        data: { ...OPEN, ...over },
      });
      const res = await ask();
      expect(await res.json()).toEqual({ kind: "ask" });
      expectUnshared(res);
      expect(readGuestAlbumVersions).not.toHaveBeenCalled();
      expect(developIfDue).not.toHaveBeenCalled();
    });
  }

  it("an unknown or deleted album answers exactly as a private one", async () => {
    getEventByQrTokenForAnyone.mockResolvedValue({
      ok: false,
      code: "not_found",
    });
    const gone = await ask();
    getEventByQrTokenForAnyone.mockResolvedValue({
      ok: true,
      data: { ...OPEN, visibility: "private" },
    });
    const hidden = await ask();
    expect(await gone.text()).toBe(await hidden.text());
    expectUnshared(gone);
  });

  it("the reads' gate refusing an open album (never expected) answers ask, never a version", async () => {
    readGuestAlbumVersions.mockResolvedValue(null);
    const res = await ask();
    expect(await res.json()).toEqual({ kind: "ask" });
    expectUnshared(res);
  });
});

describe("a malformed ask, or one album's key with another's token, is refused before anything is read", () => {
  const bad: [string, Parameters<typeof ask>[0]][] = [
    ["no key", { k: null }],
    ["a key of the wrong shape", { k: "short" }],
    ["a key with a stray character", { k: `${KEY.slice(0, 21)}=` }],
    ["no window", { w: null }],
    ["a window that is not a number", { w: "soon" }],
    ["a negative window", { w: "-1" }],
    ["a window past any clock", { w: "9".repeat(16) }],
    ["no token", { token: null }],
    ["an empty token", { token: "" }],
    ["a token too long to be one", { token: "a".repeat(201) }],
    ["★ another album's token under this key", { token: OTHER }],
    ["★ the token in the key's place", { k: TOKEN }],
  ];
  for (const [name, over] of bad) {
    it(name, async () => {
      const res = await ask(over);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ ok: false, code: "bad_request" });
      expectUnshared(res);
      expect(getEventByQrTokenForAnyone).not.toHaveBeenCalled();
    });
  }
});

describe("a window off the server's clock", () => {
  it("is told the server's time, read nothing, and kept nowhere", async () => {
    const before = Date.now();
    for (const far of [edgeWindowOf(before) + 2, edgeWindowOf(before) - 2, 0]) {
      const res = await ask({ w: String(far) });
      const body = await res.json();
      expect(body.kind).toBe("clock");
      expect(body.now).toBeGreaterThanOrEqual(before);
      expectUnshared(res);
    }
    expect(getEventByQrTokenForAnyone).not.toHaveBeenCalled();
  });
});

describe("a read that fails", () => {
  it("is a failure, never an answer the CDN could keep", async () => {
    getEventByQrTokenForAnyone.mockRejectedValue(new Error("timeout"));
    await expect(ask()).rejects.toThrow("timeout");
    getEventByQrTokenForAnyone.mockResolvedValue({ ok: true, data: OPEN });
    readGuestAlbumVersions.mockRejectedValue(new Error("timeout"));
    await expect(ask()).rejects.toThrow("timeout");
  });
});
