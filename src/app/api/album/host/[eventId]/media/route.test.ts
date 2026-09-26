import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Links by id for the host: their own event only, held and hidden items included, the proved address,
 * and each linked item's like count (album-host-wiring: the host's links carry the window's counts).
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
const readHostAlbumMedia = vi.fn();
vi.mock("@/lib/db/queries/album-host", () => ({
  readHostAlbumMedia: (...a: unknown[]) => readHostAlbumMedia(...a),
}));
const readMediaLikeCounts = vi.fn();
vi.mock("@/lib/db/queries/likes", () => ({
  readMediaLikeCounts: (...a: unknown[]) => readMediaLikeCounts(...a),
}));
vi.mock("@/lib/r2/presign", () => ({
  presignDownload: async ({ key }: { key: string }) =>
    `https://r2.test/${key}?sig`,
}));

const { POST } = await import("@/app/api/album/host/[eventId]/media/route");

const EVENT_ID = "e0000000-0000-4000-8000-000000000001";
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

function post(body: unknown) {
  return POST(
    new Request(`https://partyreel.com/api/album/host/${EVENT_ID}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ eventId: EVENT_ID }) },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  user = { id: "host-1" };
  getEvent.mockResolvedValue({ id: EVENT_ID, name: "Maya & Jay" });
  readMediaLikeCounts.mockResolvedValue(new Map([[id(1), 3]]));
  readHostAlbumMedia.mockResolvedValue({
    rows: [
      {
        id: id(1),
        type: "photo",
        original_key: `events/${EVENT_ID}/photo/${id(1)}/original.jpg`,
        preview_key: null,
      },
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
    ]),
  });
});

describe("the host's links", () => {
  it("carry the uploader's proved address, and the rest come back missing", async () => {
    const body = await (await post({ ids: [id(1), id(2)] })).json();
    expect(body.links[0][4]).toEqual(["Maya", 2, "maya@example.com"]);
    expect(body.missing).toEqual([id(2)]);
  });

  it("carry each linked item's like count, and none for a missing id", async () => {
    // The count read is the service role's, so it is asked only after the ownership check and only
    // for this event; a count for an id that did not link is never answered.
    readMediaLikeCounts.mockResolvedValue(
      new Map([
        [id(1), 3],
        [id(2), 9],
      ]),
    );
    const body = await (await post({ ids: [id(1), id(2)] })).json();
    expect(body.likes).toEqual({ [id(1)]: 3 });
    expect(readMediaLikeCounts).toHaveBeenCalledWith(EVENT_ID, [id(1), id(2)]);
  });

  it("401 without a session; 404 for another host's event", async () => {
    user = null;
    expect((await post({ ids: [id(1)] })).status).toBe(401);
    user = { id: "host-1" };
    getEvent.mockResolvedValue(null);
    expect((await post({ ids: [id(1)] })).status).toBe(404);
    expect(readHostAlbumMedia).not.toHaveBeenCalled();
    expect(readMediaLikeCounts).not.toHaveBeenCalled();
  });

  it("200 ids is the cap", async () => {
    const over = Array.from({ length: 201 }, (_, i) => id(i + 1));
    expect((await post({ ids: over })).status).toBe(400);
    expect((await post({ ids: ["nope"] })).status).toBe(400);
  });
});
