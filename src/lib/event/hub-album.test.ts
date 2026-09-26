/**
 * THE HUB'S ALBUM, THE PURE HALF (album-host-wiring): the seed replayed into the store, the list the
 * hub shows in the view's order, the tiles built once per input, and the links read before the link
 * store has any.
 *
 * What breaks quietly here, and what each pin holds:
 *   - a seed replayed twice, or a live answer merged with seed links from another presign bucket,
 *     would date a link by the wrong clock and draw it dead;
 *   - a held item in the hub's list would put Review's queue in the album;
 *   - a tile rebuilt for an unchanged item re-renders it on every window's links;
 *   - the host's address on the guest's shape would be a leak, so only the host's links fill it.
 */
import { describe, expect, it, vi } from "vitest";

import type { AlbumTransport } from "@/lib/album/store";
import {
  createHubItems,
  createLikeCounts,
  firstWindowIds,
  hubEntries,
  hubItem,
  linkReader,
  neighbourIds,
  newestPreviewUrl,
  seedingTransport,
  seedLinkMap,
  seedLinksExpireAt,
  seedSnapshot,
  type HubAlbumSeed,
} from "@/lib/event/hub-album";
import {
  ENTRY_HIDDEN,
  ENTRY_PENDING,
  ENTRY_PREVIEW,
  ENTRY_REEL,
  ENTRY_VIDEO,
  WHO_HOST,
  WHO_VERIFIED,
  type AlbumLinkTuple,
  type HostAlbumLinksBody,
  type HostWhoTuple,
  type ManifestEntry,
} from "@/lib/events/album-wire";
import {
  PRESIGN_BUCKET_MS,
  STABLE_DOWNLOAD_TTL_SECONDS,
} from "@/lib/r2/presign-bucket";

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
/** Entry n: newer for a smaller n, approved unless flagged. */
const entry = (n: number, flags = ENTRY_REEL): ManifestEntry => [
  id(n),
  400,
  300,
  flags,
  2_000_000_000_000_000 - n,
];
const link = (
  n: number,
  who: HostWhoTuple | null = null,
): AlbumLinkTuple<HostWhoTuple> => [
  id(n),
  `tile-${n}`,
  `view-${n}`,
  `download-${n}`,
  who,
];
const links = (
  ids: number[],
  extra: Partial<HostAlbumLinksBody> = {},
): HostAlbumLinksBody => ({
  ok: true,
  access: "full",
  gate: null,
  b: 100,
  now: 100 * PRESIGN_BUCKET_MS + 1000,
  links: ids.map((n) => link(n)),
  missing: [],
  likes: {},
  ...extra,
});
const seed = (
  entries: ManifestEntry[],
  seedLinks = links([]),
): HubAlbumSeed => ({
  eventId: "e1",
  sync: {
    kind: "manifest",
    v: 7,
    attr: 2,
    entries,
    next: null,
    ok: true,
    counts: { album: entries.length, pending: 0 },
  },
  etag: '"a1-seed"',
  links: seedLinks,
});

function liveTransport(answer: (ids: string[]) => HostAlbumLinksBody) {
  const asked: string[][] = [];
  const sync = vi.fn(async () => ({ status: 304 as const }));
  const transport: AlbumTransport<HostWhoTuple> = {
    sync,
    manifest: async () => {
      throw new Error("no pages");
    },
    links: async (ids) => {
      asked.push(ids);
      return answer(ids);
    },
  };
  return { transport, asked, sync };
}

describe("the hub's list", () => {
  it("is the album without Review's queue, newest first, or reversed for Oldest first", () => {
    const all = [entry(1), entry(2, ENTRY_PENDING), entry(3, ENTRY_HIDDEN)];
    expect(hubEntries(all, "newest").map((e) => e[0])).toEqual([id(1), id(3)]);
    expect(hubEntries(all, "oldest").map((e) => e[0])).toEqual([id(3), id(1)]);
    // The manifest it was handed is never touched (the store's snapshot is shared).
    expect(all.map((e) => e[0])).toEqual([id(1), id(2), id(3)]);
  });

  it("mints the first window from the newest hub items, never a held one", () => {
    const all = [entry(1, ENTRY_PENDING), entry(2), entry(3), entry(4)];
    expect(firstWindowIds(all, 2)).toEqual([id(2), id(3)]);
  });

  it("reaches either side of the open photograph for the viewer, the photograph first", () => {
    const list = [1, 2, 3, 4, 5].map((n) => entry(n));
    expect(neighbourIds(list, id(3), 1)).toEqual([id(3), id(4), id(2)]);
    expect(neighbourIds(list, id(1), 2)).toEqual([id(1), id(2), id(3)]);
    expect(neighbourIds(list, id(9), 2)).toEqual([]);
  });
});

describe("the seed, replayed", () => {
  it("answers the store's first sync with the page's manifest and validator, once", async () => {
    const s = seed([entry(1), entry(2)]);
    const { transport, sync } = liveTransport(() => links([]));
    const t = seedingTransport(s, transport, () => {});
    expect(await t.sync({ since: null, etag: null })).toEqual({
      status: 200,
      etag: '"a1-seed"',
      body: s.sync,
    });
    expect(sync).not.toHaveBeenCalled();
    // The next poll is the live route's, from the seed's version and validator.
    await t.sync({ since: 7, etag: '"a1-seed"' });
    expect(sync).toHaveBeenCalledWith({ since: 7, etag: '"a1-seed"' });
  });

  it("replays the seed's links for an ask the seed covers, with no request, and each id once", async () => {
    const s = seed(
      [entry(1), entry(2)],
      links([1, 2], { likes: { [id(2)]: 4 } }),
    );
    const { transport, asked } = liveTransport((ids) =>
      links(ids.map((i) => Number(i.slice(-2)))),
    );
    const onLikes = vi.fn();
    const t = seedingTransport(s, transport, onLikes);
    const first = (await t.links([id(1), id(2)])) as HostAlbumLinksBody;
    expect(asked).toEqual([]);
    expect(first.links.map((l) => l[0])).toEqual([id(1), id(2)]);
    expect(first.b).toBe(100);
    expect(onLikes).toHaveBeenCalledWith([id(1), id(2)], first);
    expect(first.likes).toEqual({ [id(2)]: 4 });
    // A re-mint later asks the live route: the seed is spent.
    await t.links([id(1)]);
    expect(asked).toEqual([[id(1)]]);
  });

  it("merges the seed into a live answer minted in the seed's bucket", async () => {
    const s = seed([entry(1), entry(2), entry(3)], links([1, 2]));
    const { transport, asked } = liveTransport(() => links([3]));
    const t = seedingTransport(s, transport, () => {});
    const body = await t.links([id(1), id(2), id(3)]);
    // Only the id the seed lacks is asked for; one body, one bucket, dates all three.
    expect(asked).toEqual([[id(3)]]);
    expect(body.links.map((l) => l[0]).sort()).toEqual([id(1), id(2), id(3)]);
  });

  it("never merges a seed from an older bucket: the live route mints those ids too", async () => {
    const s = seed([entry(1), entry(2)], links([1], { b: 99 }));
    const { transport, asked } = liveTransport((ids) =>
      links(ids.map((i) => Number(i.slice(-2)))),
    );
    const t = seedingTransport(s, transport, () => {});
    const body = await t.links([id(1), id(2)]);
    expect(asked).toEqual([[id(2)], [id(1)]]);
    expect(body.b).toBe(100);
    expect(body.links.map((l) => l[1]).sort()).toEqual(["tile-1", "tile-2"]);
  });

  it("stands for the album the server rendered until the store has adopted it", () => {
    const s = seed([entry(1)]);
    expect(seedSnapshot(s)).toMatchObject({
      status: "ready",
      entries: s.sync.entries,
      version: 7,
      counts: { album: 1, pending: 0 },
    });
  });
});

describe("the links a tile is drawn with", () => {
  it("reads the link store first, and the seed's links only while they live", () => {
    const s = seed([entry(1)], links([1]));
    const received = 5_000_000;
    const dies = seedLinksExpireAt(s, received);
    // The seed's bucket start plus the stable presign's life, on this device's clock.
    expect(dies).toBe(
      received +
        (100 * PRESIGN_BUCKET_MS +
          STABLE_DOWNLOAD_TTL_SECONDS * 1000 -
          s.links.now),
    );
    let now = received;
    const held = new Map<
      string,
      { tile: string; view: string; download: string; who: null }
    >();
    const read = linkReader(
      { get: (i) => held.get(i) as never },
      seedLinkMap(s),
      dies,
      () => now,
    );
    expect(read(id(1))?.tile).toBe("tile-1");
    held.set(id(1), {
      tile: "fresh",
      view: "fresh",
      download: "fresh",
      who: null,
    });
    expect(read(id(1))?.tile).toBe("fresh");
    held.clear();
    now = dies;
    expect(read(id(1))).toBeUndefined();
  });

  it("names the newest previewed photograph the first window linked, never a video or a hidden one", () => {
    const s = seed(
      [
        entry(1, ENTRY_REEL | ENTRY_VIDEO | ENTRY_PREVIEW),
        entry(2, ENTRY_REEL | ENTRY_HIDDEN | ENTRY_PREVIEW),
        entry(3, ENTRY_REEL),
        entry(4, ENTRY_REEL | ENTRY_PREVIEW),
      ],
      links([1, 2, 3, 4]),
    );
    expect(newestPreviewUrl(s)).toBe("tile-4");
    expect(newestPreviewUrl(seed([entry(3)], links([3])))).toBeNull();
  });
});

describe("a hub tile", () => {
  it("draws the manifest's shape and status, the window's links and credit, and its count", () => {
    const item = hubItem(
      entry(1, ENTRY_REEL | ENTRY_PREVIEW | ENTRY_HIDDEN),
      {
        tile: "preview",
        view: "original",
        download: "save",
        who: ["Maya", WHO_VERIFIED, "maya@example.com"],
      },
      3,
    );
    expect(item).toMatchObject({
      id: id(1),
      type: "photo",
      url: "original",
      previewUrl: "preview",
      downloadUrl: "save",
      status: "hidden",
      uploaderName: "Maya",
      isHost: false,
      isVerified: true,
      uploaderEmail: "maya@example.com",
      likeCount: 3,
      width: 400,
      height: 300,
      reelEligible: true,
    });
  });

  it("holds no link until its window's lands, and a video keeps its duration", () => {
    const video: ManifestEntry = [id(2), 0, 0, ENTRY_VIDEO, 5, 12.5];
    const item = hubItem(video, undefined, 0);
    expect(item).toMatchObject({
      type: "video",
      url: "",
      previewUrl: null,
      downloadUrl: undefined,
      width: null,
      height: null,
      durationSeconds: 12.5,
      reelEligible: false,
    });
    const host = hubItem(
      entry(3),
      {
        tile: "t",
        view: "t",
        download: "d",
        who: [null, WHO_HOST, null],
      },
      0,
    );
    expect(host.isHost).toBe(true);
    // No preview: the tile draws the original, and the preview slot says so.
    expect(host.previewUrl).toBeNull();
  });

  it("is the same object for the same inputs, so a window's links re-render only their tiles", () => {
    const items = createHubItems();
    const list = [entry(1), entry(2)];
    const held = new Map<
      string,
      { tile: string; view: string; download: string; who: null }
    >();
    const first = items(
      list,
      (i) => held.get(i),
      () => 0,
    );
    // Nothing changed: the same list back.
    expect(
      items(
        list,
        (i) => held.get(i),
        () => 0,
      ),
    ).toBe(first);
    // Item 2's links land: a new list, item 1 the object it was.
    held.set(id(2), { tile: "t2", view: "v2", download: "d2", who: null });
    const next = items(
      list,
      (i) => held.get(i),
      () => 0,
    );
    expect(next).not.toBe(first);
    expect(next[0]).toBe(first[0]);
    expect(next[1]).not.toBe(first[1]);
    // A re-mint with the same urls in a new object rebuilds nothing.
    held.set(id(2), { tile: "t2", view: "v2", download: "d2", who: null });
    expect(
      items(
        list,
        (i) => held.get(i),
        () => 0,
      ),
    ).toBe(next);
    // A count that moved rebuilds its tile alone.
    const counted = items(
      list,
      (i) => held.get(i),
      (i) => (i === id(1) ? 5 : 0),
    );
    expect(counted[0].likeCount).toBe(5);
    expect(counted[1]).toBe(next[1]);
  });
});

describe("the like counts", () => {
  it("take each minted id's count, and read an unliked one as 0", () => {
    const counts = createLikeCounts();
    counts.apply([id(1), id(2)], links([1, 2], { likes: { [id(1)]: 3 } }));
    expect(counts.get(id(1))).toBe(3);
    expect(counts.get(id(2))).toBe(0);
    // Unliked since: the next answer omits it, and it reads 0 again.
    counts.apply([id(1)], links([1]));
    expect(counts.get(id(1))).toBe(0);
  });

  it("leave an id the answer did not mint as it was", () => {
    const counts = createLikeCounts();
    counts.apply([id(1)], links([1], { likes: { [id(1)]: 2 } }));
    counts.apply([id(1)], links([], { missing: [id(1)] }));
    expect(counts.get(id(1))).toBe(2);
  });
});
