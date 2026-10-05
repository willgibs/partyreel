import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * WHAT A BATCH COSTS THE HUB, COUNTED (compute-reads: "the hub's delta carries its new items' links, so a batch is one
 * call on the hub too").
 *
 * The REAL pieces end to end: the hub's album (`createHubAlbum`: the store, the link store, the carrying transport
 * under the seeding transport, the like counts), the browser's own transport (`hostAlbumTransport`) over a fetch that
 * counts and hands each request to the REAL route handlers (the host's sync poll and its links route, both minting
 * through `readHostLinksBody`). Only the database, the signed-in session and the presigner are stood in, by a small
 * in-memory album, so what is counted is what the code under them does: how many requests a host's hub makes for a
 * batch of guest photographs, and for the moves around it. The guest's twin is `compute-model`'s `guest-join-upload`
 * (`pnpm compute:model`), which a signed-in hub cannot join on a local port (sign-in returns only to port 3000).
 *
 * Before the lane: a batch was TWO calls (the delta, then the links route for its ids, asked by the arrival gate).
 */
vi.mock("server-only", () => ({}));

const EVENT_ID = "e0000000-0000-4000-8000-000000000001";
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

/* ── the database, in memory: one event's media, each item's status, version and like count ── */
type Status = "pending" | "approved" | "hidden" | "removed";
type Item = {
  n: number;
  status: Status;
  version: number;
  likes: number;
  /** `created_at` in microseconds: a bigger n is newer. */
  t: number;
};
const album = vi.hoisted(() => ({
  version: 10,
  items: new Map<number, Item>(),
  /** The next read of the links' rows fails (a flaky database), once. */
  failNextLinksRead: false,
}));
const T0 = 1_790_206_284_000_000;
function put(n: number, status: Status, likes = 0) {
  album.items.set(n, {
    n,
    status,
    version: ++album.version,
    likes,
    t: T0 + n,
  });
}
const live = () =>
  [...album.items.values()].filter((i) => i.status !== "removed");
const countOf = (status: Status) =>
  [...album.items.values()].filter((i) => i.status === status).length;

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "host-1" } } }) },
  }),
}));
vi.mock("@/lib/db/queries/events", () => ({
  getEvent: async (eventId: string) =>
    eventId === EVENT_ID ? { id: EVENT_ID, name: "Maya & Jay" } : null,
}));
vi.mock("@/lib/db/queries/album-state", () => ({
  readAlbumVersions: async () => ({
    version: album.version,
    albumMax: album.version,
    attrVersion: 1,
  }),
  readAlbumChanges: async (
    _eventId: string,
    _scope: string,
    after: number,
    limit: number,
  ) => ({
    version: album.version,
    albumMax: album.version,
    attrVersion: 1,
    watermark: 0,
    approved: countOf("approved"),
    hidden: countOf("hidden"),
    pending: countOf("pending"),
    changes:
      limit === 0
        ? []
        : [...album.items.values()]
            .filter((i) => i.version > after)
            .map((i) => ({
              mediaId: id(i.n),
              version: i.version,
              status: i.status,
              type: "photo",
              width: 4,
              height: 3,
              durationSeconds: null,
              hasPreview: false,
              reelEligible: true,
              createdAt: i.t,
              guestId: null,
            })),
  }),
}));
vi.mock("@/lib/db/queries/album-host", () => ({
  readHostManifestPage: async () => ({
    entries: live()
      .sort((a, b) => b.t - a.t)
      .map((i) => [
        id(i.n),
        4,
        3,
        4 | (i.status === "hidden" ? 8 : 0) | (i.status === "pending" ? 16 : 0),
        i.t,
      ]),
    next: null,
  }),
  readHostAlbumMedia: async (
    _supabase: unknown,
    _eventId: string,
    ids: string[],
  ) => {
    if (album.failNextLinksRead) {
      album.failNextLinksRead = false;
      throw new Error("album: host links");
    }
    const rows = live().filter((i) => ids.includes(id(i.n)));
    return {
      rows: rows.map((i) => ({
        id: id(i.n),
        type: "photo",
        original_key: `events/${EVENT_ID}/photo/${id(i.n)}/original.jpg`,
        preview_key: null,
      })),
      identities: new Map(
        rows.map((i) => [
          id(i.n),
          {
            displayName: `Guest ${i.n}`,
            email: `g${i.n}@example.com`,
            isHost: false,
            isVerified: true,
          },
        ]),
      ),
    };
  },
}));
vi.mock("@/lib/db/queries/likes", () => ({
  readMediaLikeCounts: async (_eventId: string, ids: string[]) =>
    new Map(
      live()
        .filter((i) => i.likes > 0 && ids.includes(id(i.n)))
        .map((i) => [id(i.n), i.likes]),
    ),
}));
vi.mock("@/lib/r2/presign", () => ({
  presignDownload: async ({
    key,
    downloadFilename,
  }: {
    key: string;
    downloadFilename?: string;
  }) => `https://r2.test/${key}?sig${downloadFilename ? "&dl" : ""}`,
}));
const captureError = vi.fn();
vi.mock("@/lib/observability/sentry", () => ({
  captureError: (...a: unknown[]) => captureError(...a),
  captureWarning: vi.fn(),
}));
// The album provider's own imports: the hub's Server Functions and the doorbell's socket, neither used here.
vi.mock("@/app/(app)/dashboard/[eventId]/actions", () => ({
  removeMediaAction: vi.fn(),
  removeMediaBulkAction: vi.fn(),
  restoreMediaAction: vi.fn(),
  purgeMediaNowAction: vi.fn(),
  setMediaStatusAction: vi.fn(),
  setMediaStatusBulkAction: vi.fn(),
}));
vi.mock("@/lib/guest/use-gallery-doorbell", () => ({
  useGalleryDoorbell: () => ({ live: false }),
}));

const { POST: syncRoute } =
  await import("@/app/api/album/host/[eventId]/sync/route");
const { POST: mediaRoute } =
  await import("@/app/api/album/host/[eventId]/media/route");
const { POST: manifestRoute } =
  await import("@/app/api/album/host/[eventId]/manifest/route");
const { createHubAlbum, HUB_WRITES } =
  await import("@/components/app/event-feed/host-album");
const { hostAlbumTransport } = await import("@/lib/album/transport");
const { firstWindowIds } = await import("@/lib/event/hub-album");

/* ── the browser's side of the wire: every request counted, and handed to the real handler ── */
const calls = { sync: 0, media: 0, manifest: 0 };
const handlers = {
  sync: syncRoute,
  media: mediaRoute,
  manifest: manifestRoute,
};
async function route(kind: keyof typeof handlers, init: RequestInit) {
  const request = new Request(
    `https://partyreel.com/api/album/host/${EVENT_ID}/${kind}`,
    { method: "POST", headers: init.headers, body: init.body },
  );
  return handlers[kind](request, {
    params: Promise.resolve({ eventId: EVENT_ID }),
  });
}
const countingFetch: typeof fetch = async (input, init = {}) => {
  const kind = String(input).split("/").pop() as keyof typeof handlers;
  calls[kind] += 1;
  return route(kind, init);
};
const spent = () => ({ ...calls });
const reset = () => {
  calls.sync = calls.media = calls.manifest = 0;
};

/** The hub as the page opens it: its seed is the sync route's own first answer and the first window's links. */
async function openHub() {
  const first = await route("sync", { body: "{}" });
  const sync = await first.json();
  const windowIds = firstWindowIds(sync.entries);
  const links = await (
    await route("media", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: windowIds }),
    })
  ).json();
  const hub = createHubAlbum(
    { eventId: EVENT_ID, sync, etag: first.headers.get("etag")!, links },
    hostAlbumTransport({ eventId: EVENT_ID, fetch: countingFetch }),
    HUB_WRITES,
  );
  // What the provider does on mount: adopt the page's album, then ask once what moved since (a 304).
  await hub.sync();
  await hub.sync();
  reset();
  return hub;
}

beforeEach(() => {
  captureError.mockClear();
  album.version = 10;
  album.items.clear();
  album.failNextLinksRead = false;
  for (let n = 1; n <= 5; n++) put(n, "approved");
  reset();
});

describe("a batch on the hub", () => {
  it("★ a guest's burst of ten photographs is ONE call: the delta, its links and counts inside it", async () => {
    const hub = await openHub();
    for (let n = 101; n <= 110; n++) put(n, "approved");
    const arrived = Array.from({ length: 10 }, (_, i) => id(110 - i));

    await hub.sync();
    // The arrival gate and the window ask for the batch's links, as they do the moment a delta lands.
    await hub.store.links.ensure(arrived);

    expect(spent()).toEqual({ sync: 1, media: 0, manifest: 0 });
    // Every one is drawable: its link is in the store, with the uploader's credit, and it counts nobody's like.
    for (const arrival of arrived) {
      expect(hub.linkOf(arrival)?.tile).toContain(`/${arrival}/original.jpg`);
      expect(hub.linkOf(arrival)?.who?.[2]).toMatch(/^g1\d\d@example.com$/);
      expect(hub.likeCounts.get(arrival)).toBe(0);
    }
    expect(hub.store.getSnapshot().entries).toHaveLength(15);
    expect(hub.store.getSnapshot().counts).toEqual({ album: 15, pending: 0 });
  });

  it("★ a carried photograph brings its like count with it, so the hub never draws a liked one as unliked", async () => {
    const hub = await openHub();
    // Brought back from the bin with two likes on it, and one that nobody liked: both arrive as upserts.
    put(106, "approved", 2);
    put(107, "approved");

    await hub.sync();
    await hub.store.links.ensure([id(106), id(107)]);

    expect(spent()).toEqual({ sync: 1, media: 0, manifest: 0 });
    expect(hub.likeCounts.get(id(106))).toBe(2);
    expect(hub.likeCounts.get(id(107))).toBe(0);
  });

  it("a quiet poll is one call and no more: the 304 carries nothing, and nothing is minted for it", async () => {
    const hub = await openHub();
    await hub.sync();
    await hub.sync();
    expect(spent()).toEqual({ sync: 2, media: 0, manifest: 0 });
  });

  it("★ a moderated party's held arrivals carry nothing, and Review's ask for its queue is the one call it was", async () => {
    const hub = await openHub();
    for (let n = 101; n <= 105; n++) put(n, "pending");
    const held = Array.from({ length: 5 }, (_, i) => id(105 - i));

    await hub.sync();
    expect(spent()).toEqual({ sync: 1, media: 0, manifest: 0 });
    expect(hub.store.getSnapshot().counts).toEqual({ album: 5, pending: 5 });

    // The press on the Review card asks for the whole queue's links, by id, once.
    await hub.store.links.ensure(held);
    expect(spent()).toEqual({ sync: 1, media: 1, manifest: 0 });
    for (const heldId of held) expect(hub.linkOf(heldId)).toBeDefined();
  });

  it("the host's own Hide is one call and asks for nothing: its tile keeps the link it holds", async () => {
    const hub = await openHub();
    await hub.store.links.ensure([id(3)]);
    reset();
    put(3, "hidden");

    await hub.sync();
    await hub.store.links.ensure([id(3)]);

    expect(spent()).toEqual({ sync: 1, media: 0, manifest: 0 });
    expect(hub.linkOf(id(3))).toBeDefined();
    expect(hub.store.getSnapshot().counts).toEqual({ album: 5, pending: 0 });
  });

  it("★ a carry that fails costs the delta nothing: the batch lands, and its links are asked for as they always were", async () => {
    const hub = await openHub();
    for (let n = 101; n <= 103; n++) put(n, "approved");
    album.failNextLinksRead = true;

    await hub.sync();
    await hub.store.links.ensure([id(103), id(102), id(101)]);

    // The delta (its carry failed, reported), then the links route's own answer: two calls, never a lost batch.
    expect(spent()).toEqual({ sync: 1, media: 1, manifest: 0 });
    expect(captureError).toHaveBeenCalledTimes(1);
    expect(hub.store.getSnapshot().entries).toHaveLength(8);
    for (const n of [101, 102, 103]) expect(hub.linkOf(id(n))).toBeDefined();
  });

  it("a batch that overflows a screenful carries the newest and leaves the rest to the window, in one more call", async () => {
    const hub = await openHub();
    for (let n = 101; n <= 160; n++) put(n, "approved"); // sixty: past the 48 a delta carries
    const all = Array.from({ length: 60 }, (_, i) => id(160 - i));

    await hub.sync();
    await hub.store.links.ensure(all);

    // The newest 48 rode the delta; the twelve oldest of the batch are the window's own ask.
    expect(spent()).toEqual({ sync: 1, media: 1, manifest: 0 });
    for (const arrival of all) expect(hub.linkOf(arrival)).toBeDefined();
  });
});
