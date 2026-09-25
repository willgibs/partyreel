import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE PAGED BIN'S TWO ROUTES (album-host-wiring): the list (ids, shapes, countdowns, no link and no
 * key) and a window's links (the album's links shape, no attachment), each for the caller's own event
 * only, re-verified with getUser() and read through RLS.
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
const listRecentlyDeletedMedia = vi.fn();
const readBinMediaByIds = vi.fn();
vi.mock("@/lib/db/queries/media", () => ({
  listRecentlyDeletedMedia: (...a: unknown[]) => listRecentlyDeletedMedia(...a),
  readBinMediaByIds: (...a: unknown[]) => readBinMediaByIds(...a),
}));
vi.mock("@/lib/r2/presign", () => ({
  presignDownload: async ({ key }: { key: string }) =>
    `https://r2.test/${key}?sig`,
}));

const { GET } = await import("@/app/api/events/[eventId]/bin/route");
const { POST } = await import("@/app/api/events/[eventId]/bin/media/route");

const EVENT_ID = "e0000000-0000-4000-8000-000000000001";
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const ctx = { params: Promise.resolve({ eventId: EVENT_ID }) };
const list = () =>
  GET(new Request(`https://partyreel.com/api/events/${EVENT_ID}/bin`), ctx);
const media = (body: unknown) =>
  POST(
    new Request(`https://partyreel.com/api/events/${EVENT_ID}/bin/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    ctx,
  );

beforeEach(() => {
  vi.clearAllMocks();
  user = { id: "host-1" };
  getEvent.mockResolvedValue({ id: EVENT_ID, name: "Maya & Jay" });
  listRecentlyDeletedMedia.mockResolvedValue([
    {
      id: id(1),
      type: "photo",
      width: 400,
      height: 300,
      duration_seconds: null,
      preview_key: "events/e/photo/1/preview.webp",
      original_key: "events/e/photo/1/original.jpg",
      countdownDays: 28,
    },
    {
      id: id(2),
      type: "video",
      width: null,
      height: null,
      duration_seconds: 7.25,
      preview_key: null,
      original_key: "events/e/video/2/original.mp4",
      countdownDays: 3,
    },
  ]);
  readBinMediaByIds.mockResolvedValue([
    {
      id: id(1),
      type: "photo",
      original_key: "events/e/photo/1/original.jpg",
      preview_key: "events/e/photo/1/preview.webp",
    },
    {
      id: id(2),
      type: "video",
      original_key: "events/e/video/2/original.mp4",
      preview_key: null,
    },
  ]);
});

describe("the bin's list", () => {
  it("is ids, shapes and countdowns, and never a key or a link", async () => {
    const res = await list();
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    const body = await res.json();
    // [id, w, h, flags (video 1, preview 2), days, dur?]
    expect(body.entries).toEqual([
      [id(1), 400, 300, 2, 28],
      [id(2), 0, 0, 1, 3, 7.25],
    ]);
    expect(JSON.stringify(body)).not.toContain("events/");
  });

  it("401 without a session; 404 for anyone's event but the caller's", async () => {
    user = null;
    expect((await list()).status).toBe(401);
    user = { id: "host-1" };
    getEvent.mockResolvedValue(null);
    expect((await list()).status).toBe(404);
    expect(listRecentlyDeletedMedia).not.toHaveBeenCalled();
  });
});

describe("a window of the bin's links", () => {
  it("mints the tile and the original, no attachment, and answers the rest missing", async () => {
    const res = await media({ ids: [id(1), id(2), id(3)] });
    const body = await res.json();
    expect(body.links).toEqual([
      [
        id(1),
        "https://r2.test/events/e/photo/1/preview.webp?sig",
        "https://r2.test/events/e/photo/1/original.jpg?sig",
        "",
        null,
      ],
      [
        id(2),
        "https://r2.test/events/e/video/2/original.mp4?sig",
        null,
        "",
        null,
      ],
    ]);
    expect(body.missing).toEqual([id(3)]);
    expect(typeof body.b).toBe("number");
    expect(typeof body.now).toBe("number");
    expect(readBinMediaByIds).toHaveBeenCalledWith(
      expect.anything(),
      EVENT_ID,
      [id(1), id(2), id(3)],
      expect.any(Number),
    );
  });

  it("refuses a malformed ask, and 200 ids is the cap", async () => {
    expect((await media({ ids: ["nope"] })).status).toBe(400);
    expect((await media({ ids: [] })).status).toBe(400);
    const over = Array.from({ length: 201 }, (_, i) => id(i + 1));
    expect((await media({ ids: over })).status).toBe(400);
  });

  it("401 without a session; 404 for anyone's event but the caller's", async () => {
    user = null;
    expect((await media({ ids: [id(1)] })).status).toBe(401);
    user = { id: "host-1" };
    getEvent.mockResolvedValue(null);
    expect((await media({ ids: [id(1)] })).status).toBe(404);
    expect(readBinMediaByIds).not.toHaveBeenCalled();
  });
});
