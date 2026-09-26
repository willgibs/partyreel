/**
 * THE SEED'S PINS (gallery-seed.ts): the store adopts the page's embedded answer through its OWN
 * first sync, answered locally, with the route's validator; the embedded links answer the link
 * store's first asks, each once; and until the store has adopted it, the render reads the same
 * snapshot the store will hold.
 */
import { describe, expect, it, vi } from "vitest";

import { createAlbumStore, type AlbumTransport } from "@/lib/album/store";
import type {
  AlbumLinksBody,
  GuestWhoTuple,
  ManifestEntry,
} from "@/lib/events/album-wire";
import { PRESIGN_BUCKET_MS } from "@/lib/r2/presign-bucket";

import {
  primeTransport,
  seedLinks,
  seedSnapshot,
  type FullGallerySeed,
  type TeaserGallerySeed,
} from "./gallery-seed";

const T0 = 1_790_000_000_000_000;
const uuid = (i: number) =>
  `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
const entry = (i: number): ManifestEntry => [uuid(i), 640, 480, 4, T0 - i];
const B = 1000;
const SERVED = B * PRESIGN_BUCKET_MS + 5 * 60_000;

function fullSeed(n = 5, linked = [0, 1, 2]): FullGallerySeed {
  return {
    kind: "full",
    sync: {
      ok: true,
      kind: "manifest",
      access: "full",
      gate: null,
      v: 12,
      attr: 3,
      entries: Array.from({ length: n }, (_, i) => entry(i)),
      next: null,
      total: n,
      reel: null,
    },
    etag: '"a1-seed"',
    links: {
      ok: true,
      access: "full",
      gate: null,
      b: B,
      now: SERVED,
      links: linked.map((i) => [
        uuid(i),
        `https://r2.test/p/${i}.webp`,
        `https://r2.test/o/${i}.jpg`,
        `https://r2.test/o/${i}.jpg?dl`,
        ["Maya", 0],
      ]),
      missing: [],
    },
  };
}

function network(overrides: Partial<AlbumTransport<GuestWhoTuple>> = {}) {
  const inner: AlbumTransport<GuestWhoTuple> = {
    sync: vi.fn(async () => ({ status: 304 as const })),
    manifest: vi.fn(async () => {
      throw new Error("no pages here");
    }),
    links: vi.fn(
      async (ids: string[]): Promise<AlbumLinksBody<GuestWhoTuple>> => ({
        ok: true,
        access: "full",
        gate: null,
        b: B + 1,
        now: SERVED + PRESIGN_BUCKET_MS,
        links: ids.map((id) => [
          id,
          `https://r2.test/t/${id}`,
          null,
          "d",
          null,
        ]),
        missing: [],
      }),
    ),
    ...overrides,
  };
  return inner;
}

describe("primeTransport", () => {
  it("answers the store's first sync from the page, with the route's validator, and nothing goes out", async () => {
    const inner = network();
    const store = createAlbumStore({
      transport: primeTransport(inner, fullSeed()),
    });
    await store.sync();
    expect(inner.sync).not.toHaveBeenCalled();
    const snap = store.getSnapshot();
    expect(snap).toMatchObject({ status: "ready", version: 12, total: 5 });
    expect(snap.entries).toHaveLength(5);
    // The next poll is the network's, carrying the version and the seed's validator.
    await store.sync();
    expect(inner.sync).toHaveBeenCalledWith({ since: 12, etag: '"a1-seed"' });
  });

  it("the first answer is spent once, even by a first load that never asked for it", async () => {
    const inner = network();
    const t = primeTransport(inner, fullSeed());
    await t.sync({ since: 3, etag: null });
    expect(inner.sync).toHaveBeenCalledTimes(1);
    await t.sync({ since: null, etag: null });
    expect(inner.sync).toHaveBeenCalledTimes(2);
  });

  it("answers a links ask from the embedded links, each id once, and the rest from the network", async () => {
    const inner = network();
    const t = primeTransport(inner, fullSeed());
    const first = await t.links([uuid(0), uuid(1), uuid(4)]);
    expect(first.links.map((l) => l[0])).toEqual([uuid(0), uuid(1), uuid(4)]);
    expect(inner.links).toHaveBeenCalledWith([uuid(4)]);
    // The merged answer is dated like whichever half dies first: the embedded one here.
    expect(first).toMatchObject({ b: B, now: SERVED });
    // A second ask for a seeded id is a re-mint: it goes to the server.
    await t.links([uuid(0)]);
    expect(inner.links).toHaveBeenLastCalledWith([uuid(0)]);
  });

  it("an embedded link answers only while fresh: past its re-mint time every ask goes out", async () => {
    const inner = network();
    let clock = 1_000_000;
    // Served five minutes into its bucket: fresh for 55 more minutes on this device's clock.
    const t = primeTransport(inner, fullSeed(), () => clock);
    clock += 56 * 60_000;
    await t.links([uuid(0)]);
    expect(inner.links).toHaveBeenCalledWith([uuid(0)]);
  });

  it("the watchdog's forget spends an id's embedded link: its re-mint comes from the server", async () => {
    const inner = network();
    const t = primeTransport(inner, fullSeed());
    t.forget([uuid(1)]);
    const body = await t.links([uuid(0), uuid(1)]);
    expect(inner.links).toHaveBeenCalledWith([uuid(1)]);
    expect(body.links.find((l) => l[0] === uuid(1))?.[1]).toBe(
      `https://r2.test/t/${uuid(1)}`,
    );
  });

  it("keeps the embedded half when the network half fails", async () => {
    const inner = network({
      links: vi.fn(async () => {
        throw new Error("offline");
      }),
    });
    const body = await primeTransport(inner, fullSeed()).links([
      uuid(2),
      uuid(4),
    ]);
    expect(body.links.map((l) => l[0])).toEqual([uuid(2)]);
  });

  it("a teaser seed answers its first sync inline and holds no links", async () => {
    const teaser: TeaserGallerySeed = {
      kind: "teaser",
      sync: {
        ok: true,
        kind: "teaser",
        access: "teaser",
        gate: "account",
        items: [],
        teaserTotal: 9,
        approvedTotal: 40,
      },
      etag: '"a1-teaser"',
    };
    const inner = network();
    const store = createAlbumStore({
      transport: primeTransport(inner, teaser),
    });
    await store.sync();
    expect(store.getSnapshot()).toMatchObject({
      status: "teaser",
      gate: "account",
      teaser: { teaserTotal: 9, approvedTotal: 40 },
    });
    await primeTransport(inner, teaser).links([uuid(1)]);
    expect(inner.links).toHaveBeenCalledWith([uuid(1)]);
  });
});

describe("seedSnapshot", () => {
  it("is the snapshot the store holds once it has adopted the seed", async () => {
    const seed = fullSeed();
    const store = createAlbumStore({
      transport: primeTransport(network(), seed),
    });
    await store.sync();
    const adopted = store.getSnapshot();
    const drawn = seedSnapshot(seed);
    expect(drawn).toEqual(adopted);
    // The same entries array: adopting the seed changes nothing a render compares by reference.
    expect(adopted.entries).toBe(seed.sync.entries);
  });

  it("a locked seed is locked", () => {
    expect(seedSnapshot({ kind: "locked" })).toMatchObject({
      status: "locked",
      access: "none",
      entries: [],
    });
  });
});

describe("seedLinks", () => {
  it("dates the embedded links on the reading clock, as the link store would at receipt", () => {
    const now = 50_000;
    const links = seedLinks(fullSeed(), now);
    const link = links.get(uuid(0))!;
    expect(link).toMatchObject({
      tile: "https://r2.test/p/0.webp",
      view: "https://r2.test/o/0.jpg",
      download: "https://r2.test/o/0.jpg?dl",
      who: ["Maya", 0],
      attr: 3,
    });
    // Served five minutes into its bucket: it dies 85 minutes from now, re-mints in 55.
    expect(link.expiresAt - now).toBe(85 * 60_000);
    expect(link.remintAt - now).toBe(55 * 60_000);
    expect(links.size).toBe(3);
  });
});
