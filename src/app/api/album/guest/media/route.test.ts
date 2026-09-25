import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * LINKS BY ID FOR A GUEST: only a viewer let in whole gets any, at most 200 ids a call, anything not
 * approved in this album comes back missing, and no raw key or address ever rides the answer.
 */
vi.mock("server-only", () => ({}));

const resolveAlbumViewer = vi.fn();
vi.mock("@/lib/events/album-viewer.server", () => ({
  resolveAlbumViewer: (...a: unknown[]) => resolveAlbumViewer(...a),
}));
const readGuestAlbumMedia = vi.fn();
vi.mock("@/lib/db/queries/album-guest", () => ({
  readGuestAlbumMedia: (...a: unknown[]) => readGuestAlbumMedia(...a),
}));
vi.mock("@/lib/r2/presign", () => ({
  presignDownload: async ({
    key,
    downloadFilename,
  }: {
    key: string;
    downloadFilename?: string;
  }) =>
    `https://r2.test/${key}?sig${downloadFilename ? `&dl=${downloadFilename}` : ""}`,
}));

const { POST } = await import("@/app/api/album/guest/media/route");

const EVENT = {
  id: "e0000000-0000-4000-8000-000000000001",
  qr_token: "qr-1",
  name: "Maya & Jay",
  visibility: "open",
};
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const key = (n: number, v = "original") =>
  `events/${EVENT.id}/photo/${id(n)}/${v}.jpg`;

function post(body: unknown) {
  return POST(
    new Request("https://partyreel.com/api/album/guest/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

function viewer(
  access: "full" | "teaser" | "none",
  gate: string | null = null,
  isDemo = false,
) {
  return {
    kind: "viewer",
    event: EVENT,
    decision: { access, gate },
    isDemo,
    heal: null,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  resolveAlbumViewer.mockResolvedValue(viewer("full"));
  // The album holds 1 (with a preview) and 2 (without); 3 is held, hidden or another album's.
  readGuestAlbumMedia.mockResolvedValue({
    rows: [
      {
        id: id(1),
        type: "photo",
        original_key: key(1),
        preview_key: key(1, "preview"),
      },
      { id: id(2), type: "photo", original_key: key(2), preview_key: null },
    ],
    identities: new Map([
      [
        id(1),
        {
          displayName: "Maya",
          email: "maya@example.com",
          isHost: false,
          isVerified: true,
        },
      ],
      [
        id(2),
        {
          displayName: "Host One",
          email: null,
          isHost: true,
          isVerified: true,
        },
      ],
    ]),
  });
});

describe("links for a viewer let in whole", () => {
  it("answers a tile, a view and a download per item, the bucket, and the rest as missing", async () => {
    const res = await post({ qr_token: "qr-1", ids: [id(1), id(2), id(3)] });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      ok: true,
      access: "full",
      gate: null,
      missing: [id(3)],
    });
    expect(Number.isInteger(body.b)).toBe(true);
    const [one, two] = body.links;
    expect(one[0]).toBe(id(1));
    expect(one[1]).toContain("preview.jpg"); // the tile is the preview
    expect(one[2]).toContain("original.jpg"); // the view is the original
    expect(one[3]).toContain("&dl=maya-jay-");
    expect(one[4]).toEqual(["Maya", 2]);
    // No preview: the view IS the tile, sent once.
    expect(two[1]).toContain("original.jpg");
    expect(two[2]).toBeNull();
    expect(two[4]).toEqual(["Host One", 1 | 2]);
  });

  it("★ never an address, never a raw key: every key on the wire sits inside a presigned link", async () => {
    const res = await post({ qr_token: "qr-1", ids: [id(1), id(2)] });
    const text = await res.text();
    expect(text).not.toContain("maya@example.com");
    expect(text).not.toContain("@");
    expect(text).not.toMatch(/"(original_key|preview_key|email)"/);
    expect(
      text.replace(/https:\/\/r2\.test\/events\/[^"]+/g, ""),
    ).not.toContain("events/");
  });

  it("the demo names nobody", async () => {
    resolveAlbumViewer.mockResolvedValue(viewer("full", null, true));
    await post({ qr_token: "qr-1", ids: [id(1)] });
    expect(readGuestAlbumMedia).toHaveBeenCalledWith(EVENT, [id(1)], {
      attribute: false,
    });
  });

  it("dedupes the ask", async () => {
    await post({ qr_token: "qr-1", ids: [id(1), id(1), id(2)] });
    expect(readGuestAlbumMedia).toHaveBeenCalledWith(EVENT, [id(1), id(2)], {
      attribute: true,
    });
  });
});

describe("nobody else gets a link", () => {
  it.each([
    ["a teaser viewer", viewer("teaser", "account")],
    ["an upload-gated viewer", viewer("teaser", "upload")],
    ["a password album without its cookie", viewer("none", "password")],
  ])("%s gets none, every id missing", async (_label, v) => {
    resolveAlbumViewer.mockResolvedValue(v);
    const body = await (
      await post({ qr_token: "qr-1", ids: [id(1), id(2)] })
    ).json();
    expect(body.links).toEqual([]);
    expect(body.missing).toEqual([id(1), id(2)]);
    expect(readGuestAlbumMedia).not.toHaveBeenCalled();
  });

  it("a private or unknown album gets none, and the same shape (no existence leak)", async () => {
    resolveAlbumViewer.mockResolvedValue({ kind: "gone" });
    const body = await (await post({ qr_token: "qr-1", ids: [id(1)] })).json();
    expect(body).toMatchObject({
      access: "none",
      gate: null,
      links: [],
      missing: [id(1)],
    });
  });

  it("the gate inside the read refusing (null) answers none", async () => {
    readGuestAlbumMedia.mockResolvedValue(null);
    const body = await (await post({ qr_token: "qr-1", ids: [id(1)] })).json();
    expect(body.links).toEqual([]);
  });
});

describe("the cap and malformed input", () => {
  it("200 ids is the cap: 200 answers, 201 is refused", async () => {
    const two = Array.from({ length: 200 }, (_, i) => id(i + 1));
    expect((await post({ qr_token: "qr-1", ids: two })).status).toBe(200);
    const over = Array.from({ length: 201 }, (_, i) => id(i + 1));
    expect((await post({ qr_token: "qr-1", ids: over })).status).toBe(400);
  });

  it.each([
    [{ qr_token: "qr-1", ids: [] }],
    [{ qr_token: "qr-1", ids: ["not-a-uuid"] }],
    [{ qr_token: "qr-1", ids: ["0F000000-0000-4000-8000-00000000000A"] }],
    [{ qr_token: "qr-1", ids: "x" }],
    [{ ids: [id(1)] }],
  ])("refuses %j", async (body) => {
    expect((await post(body)).status).toBe(400);
    expect(resolveAlbumViewer).not.toHaveBeenCalled();
  });
});
