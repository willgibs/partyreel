import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE HOST'S POLL: signed in, their own event or a 404, one row when nothing moved, and a held upload
 * reaching them (the host's version moves on every status change).
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
});

describe("auth", () => {
  it("401 without a session, before anything is read", async () => {
    user = null;
    const res = await post({});
    expect(res.status).toBe(401);
    expect(getEvent).not.toHaveBeenCalled();
    expect(readAlbumVersions).not.toHaveBeenCalled();
  });

  it("404 for an event that is not the caller's (RLS answers null), never a refusal", async () => {
    getEvent.mockResolvedValue(null);
    const res = await post({});
    expect(res.status).toBe(404);
    expect(readAlbumVersions).not.toHaveBeenCalled();
    expect(readAlbumChanges).not.toHaveBeenCalled();
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
