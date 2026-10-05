import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE HOST'S POLL: signed in, their own event or a 404, one row when nothing moved, a held upload
 * reaching them (the host's version moves on every status change), and a delta carrying its new items'
 * links (compute-reads).
 */
vi.mock("server-only", () => ({}));

let user: { id: string } | null = { id: "host-1" };
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user } }) },
  }),
}));
const getEvent = vi.fn();
vi.mock("@/lib/db/queries/events", () => ({
  getEvent: (...a: unknown[]) => getEvent(...a),
}));
const readAlbumVersions = vi.fn();
const readAlbumChanges = vi.fn();
vi.mock("@/lib/db/queries/album-state", () => ({
  readAlbumVersions: (...a: unknown[]) => readAlbumVersions(...a),
  readAlbumChanges: (...a: unknown[]) => readAlbumChanges(...a),
}));
const readHostManifestPage = vi.fn();
vi.mock("@/lib/db/queries/album-host", () => ({
  readHostManifestPage: (...a: unknown[]) => readHostManifestPage(...a),
}));
// The host's links answer (the one builder behind the links route and the hub page), called for a delta's carry.
const readHostLinksBody = vi.fn();
vi.mock("@/lib/event/host-links.server", () => ({
  readHostLinksBody: (...a: unknown[]) => readHostLinksBody(...a),
}));
const captureError = vi.fn();
vi.mock("@/lib/observability/sentry", () => ({
  captureError: (...a: unknown[]) => captureError(...a),
}));

const { POST } = await import("@/app/api/album/host/[eventId]/sync/route");

const EVENT_ID = "e0000000-0000-4000-8000-000000000001";
const M = "00000000-0000-4000-8000-000000000001";

function post(
  body: unknown,
  headers: Record<string, string> = {},
  eventId = EVENT_ID,
) {
  return POST(
    new Request(`https://partyreel.com/api/album/host/${eventId}/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ eventId }) },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  user = { id: "host-1" };
  getEvent.mockResolvedValue({ id: EVENT_ID, name: "E" });
  readAlbumVersions.mockResolvedValue({
    version: 12,
    albumMax: 4,
    attrVersion: 1,
  });
  readAlbumChanges.mockImplementation(
    async (_id, scope: string, after: number) => ({
      version: 12,
      albumMax: 4,
      attrVersion: 1,
      watermark: 0,
      approved: 3,
      hidden: 1,
      pending: 2,
      changes:
        scope === "host" && after > 0 && after < 12
          ? [
              {
                mediaId: M,
                version: 12,
                status: "pending",
                type: "photo",
                width: 1,
                height: 1,
                durationSeconds: null,
                hasPreview: false,
                reelEligible: true,
                createdAt: 5,
                guestId: "g-1",
              },
            ]
          : [],
    }),
  );
  readHostManifestPage.mockResolvedValue({ entries: [], next: null });
  readHostLinksBody.mockImplementation(async (_supabase, _event, ids) => ({
    ok: true,
    access: "full",
    gate: null,
    b: 1_000,
    now: 1_800_000_000_000,
    links: (ids as string[]).map((id) => [
      id,
      `https://r2.test/${id}/tile`,
      null,
      `https://r2.test/${id}/dl`,
      ["Maya", 0, "maya@example.com"],
    ]),
    missing: [],
    likes: {},
  }));
});

describe("auth", () => {
  it("401 without a session, before anything is read", async () => {
    user = null;
    const res = await post({});
    expect(res.status).toBe(401);
    expect(getEvent).not.toHaveBeenCalled();
    expect(readAlbumVersions).not.toHaveBeenCalled();
    expect(readHostLinksBody).not.toHaveBeenCalled();
  });

  it("404 for an event that is not the caller's (RLS answers null), never a refusal", async () => {
    getEvent.mockResolvedValue(null);
    const res = await post({});
    expect(res.status).toBe(404);
    expect(readAlbumVersions).not.toHaveBeenCalled();
    expect(readAlbumChanges).not.toHaveBeenCalled();
    expect(readHostLinksBody).not.toHaveBeenCalled();
  });
});

describe("the poll", () => {
  it("a first load answers the host's manifest and the hub's two numbers, from one snapshot", async () => {
    const res = await post({});
    const body = await res.json();
    expect(body).toMatchObject({
      kind: "manifest",
      v: 12,
      counts: { album: 4, pending: 2 },
    });
    expect(readAlbumChanges).toHaveBeenCalledWith(EVENT_ID, "host", 0, 0);
    expect(res.headers.get("etag")).toMatch(/^"a1-/);
  });

  it("★ 304 when nothing moved, one row read", async () => {
    const etag = (await post({})).headers.get("etag")!;
    vi.clearAllMocks();
    getEvent.mockResolvedValue({ id: EVENT_ID, name: "E" });
    readAlbumVersions.mockResolvedValue({
      version: 12,
      albumMax: 4,
      attrVersion: 1,
    });
    const res = await post({ since: 12 }, { "If-None-Match": etag });
    expect(res.status).toBe(304);
    expect(readAlbumChanges).not.toHaveBeenCalled();
    expect(readHostLinksBody).not.toHaveBeenCalled();
  });

  it("a held upload moves the host's version, and arrives as a delta with its held flag", async () => {
    const etag = (await post({})).headers.get("etag")!;
    readAlbumVersions.mockResolvedValue({
      version: 13,
      albumMax: 4,
      attrVersion: 1,
    });
    const res = await post({ since: 11 }, { "If-None-Match": etag });
    const body = await res.json();
    expect(body.kind).toBe("delta");
    expect(body.upsert[0][0]).toBe(M);
    expect(body.upsert[0][3] & 16).toBe(16);
  });

  it("a host validator never validates another event", async () => {
    const etag = (await post({})).headers.get("etag")!;
    const other = "e0000000-0000-4000-8000-000000000002";
    getEvent.mockResolvedValue({ id: other, name: "F" });
    const res = await post({ since: 12 }, { "If-None-Match": etag }, other);
    expect(res.status).toBe(200);
  });

  it.each([[{ since: -1 }], [{ since: "3" }], [{ since: 2.5 }]])(
    "refuses %j",
    async (body) => {
      expect((await post(body)).status).toBe(400);
    },
  );
});

/**
 * ★ ONE CALL A BATCH ON THE HUB TOO (compute-reads): a delta carries its new items' links, as the guest's does
 * (album-calm), so a batch of photographs arrives on the hub in the poll's one answer where it took two calls (the
 * delta, then the links route for its ids). Minted by the links route's own builder (`readHostLinksBody`), like counts
 * and the uploader's proved address included, since this is the host's own album.
 */
describe("★ a delta carries its new items' links (compute-reads)", () => {
  const id = (n: number) =>
    `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  /** One change a photograph, created `n` microseconds past a moment (a bigger n is newer). */
  const change = (n: number, status = "approved") => ({
    mediaId: id(n),
    version: 12,
    status,
    type: "photo",
    width: 4,
    height: 3,
    durationSeconds: null,
    hasPreview: false,
    reelEligible: true,
    createdAt: 1_790_206_284_644_108 + n,
    guestId: null,
  });
  const changes = (list: ReturnType<typeof change>[]) =>
    readAlbumChanges.mockImplementation(async () => ({
      version: 12,
      albumMax: 4,
      attrVersion: 1,
      watermark: 0,
      approved: 3,
      hidden: 1,
      pending: 2,
      changes: list,
    }));

  it("★ carries a tile, a view, a download, a name and the like count of each new photograph, dated by its bucket and the server's clock", async () => {
    changes([change(7), change(8)]);
    readHostLinksBody.mockImplementation(async (_s, _e, ids: string[]) => ({
      ok: true,
      access: "full",
      gate: null,
      b: 1_000,
      now: 1_800_000_000_000,
      links: ids.map((i) => [
        i,
        `https://r2.test/${i}/tile`,
        null,
        `https://r2.test/${i}/dl`,
        ["Maya", 2, "maya@example.com"],
      ]),
      missing: [],
      likes: { [id(8)]: 3 },
    }));
    const body = await (await post({ since: 5 })).json();
    expect(body.kind).toBe("delta");
    expect(body.upsert.map((e: unknown[]) => e[0]).sort()).toEqual([
      id(7),
      id(8),
    ]);
    // Called as the links route calls it: the request's client, the event the caller was proved to host, the ids.
    const [client, event, ids] = readHostLinksBody.mock.calls[0];
    expect(client).toHaveProperty("auth");
    expect(event).toMatchObject({ id: EVENT_ID, name: "E" });
    expect(ids).toEqual([id(8), id(7)]);
    // The carried part is the guest's shape plus the counts: no `ok`, no `access`, and no `missing` (the links
    // route answers for a gone id).
    expect(body.links).toEqual({
      b: 1_000,
      now: 1_800_000_000_000,
      links: [
        [
          id(8),
          `https://r2.test/${id(8)}/tile`,
          null,
          `https://r2.test/${id(8)}/dl`,
          ["Maya", 2, "maya@example.com"],
        ],
        [
          id(7),
          `https://r2.test/${id(7)}/tile`,
          null,
          `https://r2.test/${id(7)}/dl`,
          ["Maya", 2, "maya@example.com"],
        ],
      ],
      likes: { [id(8)]: 3 },
    });
  });

  it("an item nobody liked carries an empty count, which is how a host's carry reads (absent is 0)", async () => {
    changes([change(7)]);
    const body = await (await post({ since: 5 })).json();
    expect(body.links.likes).toEqual({});
  });

  it("★ the newest first, at most a screenful (ALBUM_DELTA_LINKS_MAX)", async () => {
    const { ALBUM_DELTA_LINKS_MAX } = await import("@/lib/events/album-wire");
    // In change order, oldest first, as the log hands them over.
    changes(Array.from({ length: 60 }, (_, i) => change(100 + i)));
    await post({ since: 5 });
    const ids = readHostLinksBody.mock.calls[0][2] as string[];
    expect(ids).toHaveLength(ALBUM_DELTA_LINKS_MAX);
    expect(ids[0]).toBe(id(159));
    expect(ids).not.toContain(id(100));
  });

  it("★ only the approved ones: a held upload and a hidden one carry none (the hub draws nothing for the first, and the host's Hide is an upsert whose tile already holds its link)", async () => {
    changes([change(7), change(8, "pending"), change(9, "hidden")]);
    const body = await (await post({ since: 5 })).json();
    // All three are the delta's upserts (the host's version moves on every status change)...
    expect(body.upsert.map((e: unknown[]) => e[0]).sort()).toEqual([
      id(7),
      id(8),
      id(9),
    ]);
    // ...and only the approved one is minted for.
    expect(readHostLinksBody.mock.calls[0][2]).toEqual([id(7)]);
    expect(body.links.links.map((l: unknown[]) => l[0])).toEqual([id(7)]);
  });

  it("a delta of held and hidden upserts alone mints nothing at all, and carries no links", async () => {
    changes([change(8, "pending"), change(9, "hidden")]);
    const body = await (await post({ since: 5 })).json();
    expect(body.kind).toBe("delta");
    expect(body).not.toHaveProperty("links");
    expect(readHostLinksBody).not.toHaveBeenCalled();
  });

  it("a manifest, a delta with nothing new and a removal carry none, and read nothing for them", async () => {
    const first = await (await post({})).json();
    expect(first.kind).toBe("manifest");
    expect(first).not.toHaveProperty("links");
    changes([]);
    const quiet = await (await post({ since: 5 })).json();
    expect(quiet.kind).toBe("delta");
    expect(quiet).not.toHaveProperty("links");
    changes([change(7, "removed")]);
    const gone = await (await post({ since: 5 })).json();
    expect(gone.remove).toEqual([id(7)]);
    expect(gone).not.toHaveProperty("links");
    expect(readHostLinksBody).not.toHaveBeenCalled();
  });

  it("a read that finds none of them carries none, and the delta still lands", async () => {
    changes([change(7)]);
    readHostLinksBody.mockResolvedValue({
      ok: true,
      access: "full",
      gate: null,
      b: 1_000,
      now: 1_800_000_000_000,
      links: [],
      missing: [id(7)],
      likes: {},
    });
    const body = await (await post({ since: 5 })).json();
    expect(body.kind).toBe("delta");
    expect(body.upsert).toHaveLength(1);
    expect(body).not.toHaveProperty("links");
  });

  it("★ a read that FAILS is reported, never silent, and costs the delta nothing", async () => {
    changes([change(7)]);
    readHostLinksBody.mockRejectedValue(new Error("album: host links"));
    const res = await post({ since: 5 });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.kind).toBe("delta");
    expect(body.upsert).toHaveLength(1);
    expect(body.counts).toEqual({ album: 4, pending: 2 });
    expect(body).not.toHaveProperty("links");
    expect(captureError).toHaveBeenCalledWith(
      "media",
      expect.any(Error),
      expect.objectContaining({ eventId: EVENT_ID }),
    );
  });

  it("the validator does not move for the links (a quiet album still answers 304)", async () => {
    changes([change(7)]);
    const etag = (await post({ since: 5 })).headers.get("etag")!;
    readAlbumVersions.mockResolvedValue({
      version: 12,
      albumMax: 4,
      attrVersion: 1,
    });
    readHostLinksBody.mockClear();
    const quiet = await post({ since: 12 }, { "If-None-Match": etag });
    expect(quiet.status).toBe(304);
    expect(readHostLinksBody).not.toHaveBeenCalled();
  });

  it("is never cached: the links are the host's own, with an address in them", async () => {
    changes([change(7)]);
    const res = await post({ since: 5 });
    expect(res.headers.get("cache-control")).toBe("private, no-store");
  });
});
