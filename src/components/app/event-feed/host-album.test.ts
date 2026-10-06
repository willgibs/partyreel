import { describe, expect, it, vi } from "vitest";

import type { AlbumTransport } from "@/lib/album/store";
import type { HubAlbumSeed } from "@/lib/event/hub-album";
import {
  ENTRY_REEL,
  type HostAlbumLinksBody,
  type HostWhoTuple,
  type ManifestEntry,
} from "@/lib/events/album-wire";
import { PRESIGN_BUCKET_MS } from "@/lib/r2/presign-bucket";

/**
 * THE HUB'S ALBUM, BUILT FROM THE PAGE'S SEED (`createHubAlbum`), ON AN ALBUM WHOSE ATTRIBUTION HAS MOVED (guest-requests).
 *
 * The page mints the first window's links after it reads the album's attribution version (`attr`), so every one of them
 * names its uploader as of that version. The link store dates each link with the attribution it was asked under, and an
 * attribution move makes every held name stale: it re-mints them all on the next poll. A store that starts at 0 asked
 * for the seed's own links at 0 (the window asks as it mounts, before the provider's first sync has adopted the seed),
 * so on any album whose `attr_version` had moved, a rename or a confirmation ever, the first poll after the hub opened
 * re-asked every link the page had just minted: a links call of up to a window's ids, for names it already held. The
 * store is told the seed's attribution where it is built, so the seed's links are held as what they are.
 *
 * The live routes are stood in by a transport that counts what reaches it.
 */
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
vi.mock("@/lib/observability/sentry", () => ({
  captureError: vi.fn(),
  captureWarning: vi.fn(),
}));

const { createHubAlbum, HUB_WRITES } = await import("./host-album");

const EVENT_ID = "e0000000-0000-4000-8000-000000000001";
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const T0 = 1_790_206_284_000_000;
const ENTRIES: ManifestEntry[] = [3, 2, 1].map((n) => [
  id(n),
  4,
  3,
  ENTRY_REEL,
  T0 + n,
]);

/** A links answer for `ids`, minted now, each crediting a guest. */
function linksBody(ids: readonly string[], prefix: string): HostAlbumLinksBody {
  const now = Date.now();
  return {
    ok: true,
    access: "full",
    gate: null,
    b: Math.floor(now / PRESIGN_BUCKET_MS),
    now,
    links: ids.map((mediaId) => [
      mediaId,
      `${prefix}/${mediaId}`,
      null,
      `${prefix}/${mediaId}?dl`,
      ["Ana Perez", 0, null] as HostWhoTuple,
    ]),
    missing: [],
    likes: {},
  };
}

/** The page's seed: the sync route's first answer at attribution `attr`, and the first window's links. */
function seedAt(attr: number): HubAlbumSeed {
  return {
    eventId: EVENT_ID,
    sync: {
      ok: true,
      kind: "manifest",
      v: 10,
      attr,
      entries: ENTRIES,
      next: null,
      counts: { album: ENTRIES.length, pending: 0 },
    },
    etag: '"h1-seed"',
    links: linksBody(
      ENTRIES.map(([mediaId]) => mediaId),
      "https://r2.test/seed",
    ),
  };
}

/** The host's routes: a quiet album (every poll a 304), and a links route that counts each ask. */
function quietRoutes() {
  const asked: string[][] = [];
  const transport: AlbumTransport<HostWhoTuple> = {
    sync: vi.fn(async () => ({ status: 304 as const })),
    manifest: vi.fn(async () => {
      throw new Error("this album has one manifest page");
    }),
    links: vi.fn(async (ids: string[]) => {
      asked.push(ids);
      return linksBody(ids, "https://r2.test/fresh");
    }),
  };
  return { transport, asked };
}

/** The hub as the page opens it, in React's order: the window's ask (a child's effect) before the provider's two syncs. */
async function openHub(attr: number) {
  const routes = quietRoutes();
  const hub = createHubAlbum(seedAt(attr), routes.transport, HUB_WRITES);
  const window = hub.store.links.ensure(ENTRIES.map(([mediaId]) => mediaId));
  // The provider's mount: adopt the page's album, then ask once what moved since (a 304).
  const adopted = hub.sync();
  const asked = hub.sync();
  await Promise.all([window, adopted, asked]);
  return { hub, ...routes };
}

describe("the hub's album, seeded on an album whose attribution has moved", () => {
  it("★ the polls after the hub opens re-ask nothing the page minted: the seed's links are held at the seed's attribution", async () => {
    const { hub, asked } = await openHub(3);
    // The next polls, each of which re-mints whatever the link store holds as aged or stale.
    await hub.sync();
    await hub.sync();
    expect(asked).toEqual([]);
    // Drawn from the seed's own links, credits and all.
    for (const [mediaId] of ENTRIES) {
      expect(hub.linkOf(mediaId)?.tile).toBe(`https://r2.test/seed/${mediaId}`);
      expect(hub.store.links.get(mediaId)?.attr).toBe(3);
    }
  });

  it("an album whose attribution never moved (0) asks nothing either, as before", async () => {
    const { hub, asked } = await openHub(0);
    await hub.sync();
    expect(asked).toEqual([]);
  });

  it("a move AFTER the page rendered still re-mints the names: the next answer's attribution makes them stale", async () => {
    const { hub, asked, transport } = await openHub(3);
    vi.mocked(transport.sync).mockResolvedValueOnce({
      status: 200,
      etag: '"h1-renamed"',
      body: {
        ok: true,
        kind: "delta",
        v: 10,
        attr: 4,
        upsert: [],
        remove: [],
        counts: { album: ENTRIES.length, pending: 0 },
      },
    });
    await hub.sync();
    expect(asked).toEqual([ENTRIES.map(([mediaId]) => mediaId)]);
    expect(hub.linkOf(id(1))?.tile).toBe(`https://r2.test/fresh/${id(1)}`);
  });
});
