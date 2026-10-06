/**
 * ONE CALL A BATCH (album-calm, PRICING lever 1c): a delta carries its new items' links, so the client stops making
 * the second call for them. Driven through the REAL album store and link store (`src/lib/album/`), over a transport
 * that stands in for the routes, so what is pinned is what the album does: the carried links answer the link store's
 * ask with no request, dated exactly as the server dated them, never past their re-mint time, never for an id the
 * album dropped, and never for an album the viewer can no longer see.
 */
import { describe, expect, it, vi } from "vitest";

import {
  createAlbumStore,
  type AlbumTransport,
  type SyncResult,
} from "@/lib/album/store";
import {
  ALBUM_DELTA_LINKS_MAX,
  ALBUM_LINK_REMINT_MS,
  ENTRY_HIDDEN,
  ENTRY_PENDING,
  type AlbumLinkTuple,
  type AlbumLinksBody,
  type GuestFullSync,
  type GuestWhoTuple,
  type HostAlbumLinksBody,
  type HostSyncBody,
  type HostWhoTuple,
  type ManifestEntry,
} from "@/lib/events/album-wire";
import {
  PRESIGN_BUCKET_MS,
  STABLE_DOWNLOAD_TTL_SECONDS,
} from "@/lib/r2/presign-bucket";

import {
  carriedIds,
  carryingTransport,
  hostCarriedIds,
  type HostCarriedSync,
} from "./album-wire-carry";

const T0 = 1_790_000_000_000_000;
const uuid = (i: number) =>
  `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
const entry = (i: number): ManifestEntry => [uuid(i), 640, 480, 4, T0 + i];
const tuple = (i: number, tag = "carried"): AlbumLinkTuple<GuestWhoTuple> => [
  uuid(i),
  `https://r2.test/${tag}/${i}/tile`,
  null,
  `https://r2.test/${tag}/${i}/dl`,
  ["Maya", 0],
];

/** The server's clock, a little off this device's (the link store dates by offsets, never by agreement). */
const SKEW = 7 * 60_000;

function world() {
  let clock = 1_800_000_000_000;
  const now = () => clock;
  const answers: SyncResult[] = [];
  const asked: string[][] = [];
  let failLinks = false;
  let drift = 0;
  const inner: AlbumTransport<GuestWhoTuple> & {
    forget: (ids: Iterable<string>) => void;
  } = {
    async sync() {
      const next = answers.shift();
      if (!next) return { status: 304 };
      return next;
    },
    async manifest() {
      throw new Error("no pages here");
    },
    async links(ids) {
      asked.push([...ids]);
      if (failLinks) throw new Error("offline");
      const served = clock + SKEW + drift;
      return {
        ok: true,
        access: "full",
        gate: null,
        b: Math.floor(served / PRESIGN_BUCKET_MS),
        now: served,
        links: ids.map((id) => tuple(Number(id.slice(-12)), "fresh")),
        missing: [],
      };
    },
    forget: vi.fn(),
  };
  const transport = carryingTransport(inner, now);
  const store = createAlbumStore<GuestWhoTuple>({ transport, now });
  return {
    inner,
    transport,
    store,
    asked,
    answer: (r: SyncResult) => answers.push(r),
    advance: (ms: number) => (clock += ms),
    now,
    failLinks: (v: boolean) => (failLinks = v),
    drift: (ms: number) => (drift += ms),
  };
}

function full(
  over: Partial<GuestFullSync> & Record<string, unknown>,
): SyncResult {
  return {
    status: 200,
    etag: '"a1-x"',
    body: {
      ok: true,
      access: "full",
      gate: null,
      total: 0,
      reel: null,
      ...over,
    } as GuestFullSync,
  };
}
const manifest = (entries: ManifestEntry[], v = 10, attr = 1) =>
  full({
    kind: "manifest",
    v,
    attr,
    entries,
    next: null,
    total: entries.length,
  });
/** A delta carrying links minted on the server's clock at this moment (`served`). */
function delta(
  w: ReturnType<typeof world>,
  over: {
    v: number;
    upsert?: ManifestEntry[];
    remove?: string[];
    total: number;
    attr?: number;
    carry?: number[];
  },
) {
  const served = w.now() + SKEW;
  return full({
    kind: "delta",
    v: over.v,
    attr: over.attr ?? 1,
    upsert: over.upsert ?? [],
    remove: over.remove ?? [],
    total: over.total,
    ...(over.carry
      ? {
          links: {
            b: Math.floor(served / PRESIGN_BUCKET_MS),
            now: served,
            links: over.carry.map((i) => tuple(i)),
          },
        }
      : {}),
  });
}

async function opened(
  w: ReturnType<typeof world>,
  entries = [entry(1), entry(2)],
) {
  w.answer(manifest(entries));
  await w.store.sync();
}

describe("which new items a delta carries links for", () => {
  it("its newest upserts first, at most the cap", () => {
    const upsert = Array.from({ length: 60 }, (_, i) => entry(i + 1));
    // Change order is not album order: shuffle it.
    const shuffled = [...upsert]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .reverse();
    const ids = carriedIds(shuffled);
    expect(ids).toHaveLength(ALBUM_DELTA_LINKS_MAX);
    expect(ids[0]).toBe(uuid(60));
    expect(ids.at(-1)).toBe(uuid(60 - ALBUM_DELTA_LINKS_MAX + 1));
  });

  it("none for a delta with nothing new", () => {
    expect(carriedIds([])).toEqual([]);
  });
});

describe("★ a batch arrives in one call", () => {
  it("the carried links answer the link store's ask with no request", async () => {
    const w = world();
    await opened(w);
    w.answer(
      delta(w, {
        v: 11,
        upsert: [entry(3), entry(4)],
        total: 4,
        carry: [3, 4],
      }),
    );
    await w.store.sync();
    await w.store.links.ensure([uuid(4), uuid(3)]);
    expect(w.asked).toEqual([]);
    expect(w.store.links.get(uuid(4))?.tile).toBe(
      "https://r2.test/carried/4/tile",
    );
    expect(w.store.links.get(uuid(3))?.who).toEqual(["Maya", 0]);
  });

  it("★ dated exactly as the server dated them, however late the ask comes", async () => {
    const w = world();
    await opened(w);
    const at = w.now();
    const served = at + SKEW;
    w.answer(delta(w, { v: 11, upsert: [entry(3)], total: 3, carry: [3] }));
    await w.store.sync();
    // The window reaches it five minutes on.
    w.advance(5 * 60_000);
    await w.store.links.ensure([uuid(3)]);
    const link = w.store.links.get(uuid(3))!;
    const bucketStart =
      Math.floor(served / PRESIGN_BUCKET_MS) * PRESIGN_BUCKET_MS;
    expect(link.remintAt).toBe(
      at + (bucketStart + ALBUM_LINK_REMINT_MS - served),
    );
    expect(link.expiresAt).toBe(
      at + (bucketStart + STABLE_DOWNLOAD_TTL_SECONDS * 1000 - served),
    );
  });

  it("an id the delta did not carry goes to the server, and both land in one answer", async () => {
    const w = world();
    await opened(w);
    w.answer(delta(w, { v: 11, upsert: [entry(3)], total: 3, carry: [3] }));
    await w.store.sync();
    await w.store.links.ensure([uuid(3), uuid(1)]);
    expect(w.asked).toEqual([[uuid(1)]]);
    expect(w.store.links.get(uuid(3))?.tile).toBe(
      "https://r2.test/carried/3/tile",
    );
    expect(w.store.links.get(uuid(1))?.tile).toBe(
      "https://r2.test/fresh/1/tile",
    );
  });

  it("★ a mixed answer is dated by whichever half dies first: the route's, when its clock has moved on further", async () => {
    // ★ Pinned here (test-slim): this arm rode another file's clock, and one full coverage run in three missed it.
    const w = world();
    await opened(w);
    const at = w.now();
    const served = at + SKEW;
    w.answer(delta(w, { v: 11, upsert: [entry(3)], total: 3, carry: [3] }));
    await w.store.sync();
    // The route answers its half a minute further on, in the same bucket: its links die a minute sooner.
    w.drift(60_000);
    await w.store.links.ensure([uuid(3), uuid(1)]);
    const bucketStart =
      Math.floor(served / PRESIGN_BUCKET_MS) * PRESIGN_BUCKET_MS;
    for (const id of [uuid(3), uuid(1)]) {
      expect(w.store.links.get(id)?.remintAt).toBe(
        at + (bucketStart + ALBUM_LINK_REMINT_MS - (served + 60_000)),
      );
    }
  });

  it("the server's half failing still lands the carried half", async () => {
    const w = world();
    await opened(w);
    w.answer(delta(w, { v: 11, upsert: [entry(3)], total: 3, carry: [3] }));
    await w.store.sync();
    w.failLinks(true);
    await w.store.links.ensure([uuid(3), uuid(1)]);
    expect(w.store.links.get(uuid(3))?.tile).toBe(
      "https://r2.test/carried/3/tile",
    );
    expect(w.store.links.get(uuid(1))).toBeUndefined();
  });

  it("a delta with no links (an older server) is asked for exactly as before", async () => {
    const w = world();
    await opened(w);
    w.answer(delta(w, { v: 11, upsert: [entry(3)], total: 3 }));
    await w.store.sync();
    await w.store.links.ensure([uuid(3)]);
    expect(w.asked).toEqual([[uuid(3)]]);
  });
});

describe("never a carried link it should not use", () => {
  it("never past the re-mint time it is dated to: the server re-mints it", async () => {
    const w = world();
    await opened(w);
    w.answer(delta(w, { v: 11, upsert: [entry(3)], total: 3, carry: [3] }));
    await w.store.sync();
    w.advance(ALBUM_LINK_REMINT_MS + PRESIGN_BUCKET_MS);
    await w.store.links.ensure([uuid(3)]);
    expect(w.asked).toEqual([[uuid(3)]]);
  });

  it("each carried link answers once: a re-mint (the watchdog's forget) goes to the server", async () => {
    const w = world();
    await opened(w);
    w.answer(
      delta(w, {
        v: 11,
        upsert: [entry(3), entry(4)],
        total: 4,
        carry: [3, 4],
      }),
    );
    await w.store.sync();
    await w.store.links.ensure([uuid(3)]);
    w.store.links.forget([uuid(3)]);
    await w.store.links.ensure([uuid(3)]);
    expect(w.asked).toEqual([[uuid(3)]]);
    // The watchdog lets an unasked carried link go too, and tells the layer beneath.
    w.transport.forget([uuid(4)]);
    expect(w.inner.forget).toHaveBeenCalledWith([uuid(4)]);
    await w.store.links.ensure([uuid(4)]);
    expect(w.asked).toEqual([[uuid(3)], [uuid(4)]]);
  });

  it("a later delta that takes the item away drops its carried link", async () => {
    const w = world();
    await opened(w);
    w.answer(delta(w, { v: 11, upsert: [entry(3)], total: 3, carry: [3] }));
    await w.store.sync();
    w.answer(delta(w, { v: 12, remove: [uuid(3)], total: 2 }));
    await w.store.sync();
    w.store.links.revive([uuid(3)]);
    await w.store.links.ensure([uuid(3)]);
    expect(w.asked).toEqual([[uuid(3)]]);
  });

  it("an attribution that moved drops the names read under the old one", async () => {
    const w = world();
    await opened(w);
    w.answer(delta(w, { v: 11, upsert: [entry(3)], total: 3, carry: [3] }));
    await w.store.sync();
    w.answer(delta(w, { v: 12, total: 3, attr: 2 }));
    await w.store.sync();
    await w.store.links.ensure([uuid(3)]);
    expect(w.asked).toEqual([[uuid(3)]]);
  });

  it.each([
    ["a fresh manifest", () => manifest([entry(1), entry(2), entry(3)], 20)],
    [
      "a teaser",
      () => ({
        status: 200 as const,
        etag: null,
        body: {
          ok: true,
          kind: "teaser",
          access: "teaser",
          gate: "upload",
          items: [],
          teaserTotal: 0,
          approvedTotal: 3,
        },
      }),
    ],
    [
      "a lock",
      () => ({
        status: 200 as const,
        etag: null,
        body: { ok: true, kind: "locked", access: "none", gate: "password" },
      }),
    ],
  ])("%s drops every carried link", async (_name, next) => {
    const w = world();
    await opened(w);
    w.answer(delta(w, { v: 11, upsert: [entry(3)], total: 3, carry: [3] }));
    await w.store.sync();
    w.answer(next() as SyncResult);
    await w.store.sync();
    // Whatever the album is now, a link for it comes from the server, or not at all.
    await w.transport.links([uuid(3)]);
    expect(w.asked).toEqual([[uuid(3)]]);
  });

  it("holds a bounded number, whatever a reader deep in the album never asks for", async () => {
    const w = world();
    await opened(w, []);
    let v = 10;
    let total = 0;
    for (let round = 0; round < 10; round++) {
      const ids = Array.from({ length: 40 }, (_, i) => 100 + round * 40 + i);
      total += ids.length;
      w.answer(delta(w, { v: ++v, upsert: ids.map(entry), total, carry: ids }));
      await w.store.sync();
    }
    // The newest ones still answer locally; the oldest went to the server.
    const body = (await w.transport.links([
      uuid(100),
      uuid(499),
    ])) as AlbumLinksBody<GuestWhoTuple>;
    expect(body.links.map((l) => l[0]).sort()).toEqual(
      [uuid(100), uuid(499)].sort(),
    );
    expect(w.asked).toEqual([[uuid(100)]]);
  });
});

/**
 * ★ THE HUB'S DELTA CARRIES TOO (compute-reads): the host's poll answers a delta with its approved arrivals' links
 * and their like counts, and the same layer answers the link store's ask for them with the counts beside them, where
 * the hub's like counts read them (`hub-album.ts`'s `seedingTransport` taps every links answer's `likes`).
 */
describe("which of the hub's upserts carry links", () => {
  const at = (i: number, flags: number): ManifestEntry => [
    uuid(i),
    640,
    480,
    flags,
    T0 + i,
  ];

  it("★ the approved ones only: a held upload and a hidden one carry none", () => {
    const upsert = [
      at(1, 4),
      at(2, 4 | ENTRY_PENDING),
      at(3, 4 | ENTRY_HIDDEN),
    ];
    expect(hostCarriedIds(upsert)).toEqual([uuid(1)]);
    // The guest's choice, which every entry of its album satisfies, is unchanged.
    expect(carriedIds(upsert)).toEqual([uuid(3), uuid(2), uuid(1)]);
  });

  it("the newest first, at most the cap, after the held and hidden are left out", () => {
    const upsert = [
      ...Array.from({ length: 60 }, (_, i) => at(i + 1, 4)),
      at(100, 4 | ENTRY_PENDING),
    ];
    const ids = hostCarriedIds(upsert);
    expect(ids).toHaveLength(ALBUM_DELTA_LINKS_MAX);
    expect(ids[0]).toBe(uuid(60));
    expect(ids).not.toContain(uuid(100));
  });

  it("none for a delta with nothing new", () => {
    expect(hostCarriedIds([])).toEqual([]);
  });
});

describe("★ the hub's batch arrives in one call, its counts with it", () => {
  const hostTuple = (
    i: number,
    tag = "carried",
  ): AlbumLinkTuple<HostWhoTuple> => [
    uuid(i),
    `https://r2.test/${tag}/${i}/tile`,
    null,
    `https://r2.test/${tag}/${i}/dl`,
    ["Maya", 0, "maya@example.com"],
  ];

  function hubWorld() {
    let clock = 1_800_000_000_000;
    const now = () => clock;
    const answers: SyncResult[] = [];
    const asked: string[][] = [];
    let failLinks = false;
    /** The links route's own counts, by id: what a direct ask is answered with. */
    const routeLikes: Record<number, number> = {};
    const inner: AlbumTransport<HostWhoTuple> = {
      async sync() {
        return answers.shift() ?? { status: 304 };
      },
      async manifest() {
        throw new Error("no pages here");
      },
      async links(ids) {
        asked.push([...ids]);
        if (failLinks) throw new Error("offline");
        const served = clock + SKEW;
        const body: HostAlbumLinksBody = {
          ok: true,
          access: "full",
          gate: null,
          b: Math.floor(served / PRESIGN_BUCKET_MS),
          now: served,
          links: ids.map((id) => hostTuple(Number(id.slice(-12)), "fresh")),
          missing: [],
          likes: Object.fromEntries(
            ids.flatMap((id): [string, number][] => {
              const n = routeLikes[Number(id.slice(-12))];
              return n ? [[id, n]] : [];
            }),
          ),
        };
        return body;
      },
    };
    const transport = carryingTransport(inner, now);
    const store = createAlbumStore<HostWhoTuple>({ transport, now });
    return {
      inner,
      transport,
      store,
      asked,
      routeLikes,
      answer: (r: SyncResult) => answers.push(r),
      advance: (ms: number) => (clock += ms),
      now,
      failLinks: (v: boolean) => (failLinks = v),
    };
  }

  const counts = { album: 0, pending: 0 };
  /** A host answer: the album part and the hub's two numbers, with a carry when `carry` names one. */
  function hostFull(
    over: Record<string, unknown> & { total?: number },
  ): SyncResult {
    const total = over.total ?? 0;
    const body = {
      ok: true,
      counts: { ...counts, album: total },
      ...over,
    } as HostSyncBody;
    return { status: 200, etag: '"a1-h"', body };
  }
  function hostDelta(
    w: ReturnType<typeof hubWorld>,
    over: {
      v: number;
      upsert?: ManifestEntry[];
      remove?: string[];
      total: number;
      carry?: { ids: number[]; likes?: Record<number, number> };
    },
  ): SyncResult {
    const served = w.now() + SKEW;
    const carried: HostCarriedSync["links"] | undefined = over.carry
      ? {
          b: Math.floor(served / PRESIGN_BUCKET_MS),
          now: served,
          links: over.carry.ids.map((i) => hostTuple(i)),
          likes: Object.fromEntries(
            Object.entries(over.carry.likes ?? {}).map(([i, n]) => [
              uuid(Number(i)),
              n,
            ]),
          ),
        }
      : undefined;
    return hostFull({
      kind: "delta",
      v: over.v,
      attr: 1,
      upsert: over.upsert ?? [],
      remove: over.remove ?? [],
      total: over.total,
      ...(carried ? { links: carried } : {}),
    });
  }
  async function hubOpened(w: ReturnType<typeof hubWorld>) {
    w.answer(
      hostFull({
        kind: "manifest",
        v: 10,
        attr: 1,
        entries: [entry(1), entry(2)],
        next: null,
        total: 2,
      }),
    );
    await w.store.sync();
  }
  const likesOf = async (
    w: ReturnType<typeof hubWorld>,
    ids: number[],
  ): Promise<Record<string, number> | undefined> =>
    ((await w.transport.links(ids.map(uuid))) as HostAlbumLinksBody).likes;

  it("★ the carried links answer the link store's ask with no request, the host's who tuple intact", async () => {
    const w = hubWorld();
    await hubOpened(w);
    w.answer(
      hostDelta(w, {
        v: 11,
        upsert: [entry(3), entry(4)],
        total: 4,
        carry: { ids: [3, 4] },
      }),
    );
    await w.store.sync();
    await w.store.links.ensure([uuid(4), uuid(3)]);
    expect(w.asked).toEqual([]);
    expect(w.store.links.get(uuid(4))?.tile).toBe(
      "https://r2.test/carried/4/tile",
    );
    // The address rides only the host's own tuple, and survives the carry.
    expect(w.store.links.get(uuid(3))?.who).toEqual([
      "Maya",
      0,
      "maya@example.com",
    ]);
  });

  it("★ a carried link's like count rides the answer: a count above zero is named, an unliked item is absent (reads 0)", async () => {
    const w = hubWorld();
    await hubOpened(w);
    w.answer(
      hostDelta(w, {
        v: 11,
        upsert: [entry(3), entry(4)],
        total: 4,
        carry: { ids: [3, 4], likes: { 3: 2 } },
      }),
    );
    await w.store.sync();
    expect(await likesOf(w, [3, 4])).toEqual({ [uuid(3)]: 2 });
    expect(w.asked).toEqual([]);
  });

  it("★ a host delta whose items nobody liked still answers a count map, empty: its carry reads as the host's", async () => {
    const w = hubWorld();
    await hubOpened(w);
    w.answer(
      hostDelta(w, {
        v: 11,
        upsert: [entry(3)],
        total: 3,
        carry: { ids: [3] },
      }),
    );
    await w.store.sync();
    expect(await likesOf(w, [3])).toEqual({});
  });

  it("★ a mixed ask is one answer with both halves' counts: the carried ones' and the route's", async () => {
    const w = hubWorld();
    await hubOpened(w);
    w.routeLikes[1] = 5;
    w.answer(
      hostDelta(w, {
        v: 11,
        upsert: [entry(3)],
        total: 3,
        carry: { ids: [3], likes: { 3: 2 } },
      }),
    );
    await w.store.sync();
    const body = (await w.transport.links([
      uuid(3),
      uuid(1),
    ])) as HostAlbumLinksBody;
    expect(w.asked).toEqual([[uuid(1)]]);
    expect(body.links.map((l) => l[0]).sort()).toEqual([uuid(1), uuid(3)]);
    expect(body.likes).toEqual({ [uuid(3)]: 2, [uuid(1)]: 5 });
  });

  it("the server's half failing still lands the carried half and its counts", async () => {
    const w = hubWorld();
    await hubOpened(w);
    w.answer(
      hostDelta(w, {
        v: 11,
        upsert: [entry(3)],
        total: 3,
        carry: { ids: [3], likes: { 3: 4 } },
      }),
    );
    await w.store.sync();
    w.failLinks(true);
    const body = (await w.transport.links([
      uuid(3),
      uuid(1),
    ])) as HostAlbumLinksBody;
    expect(body.links.map((l) => l[0])).toEqual([uuid(3)]);
    expect(body.likes).toEqual({ [uuid(3)]: 4 });
  });

  it("a guest's carried links never grow a count map: its answers are what they were", async () => {
    const w = world();
    await opened(w);
    w.answer(delta(w, { v: 11, upsert: [entry(3)], total: 3, carry: [3] }));
    await w.store.sync();
    expect(await w.transport.links([uuid(3)])).not.toHaveProperty("likes");
  });

  it("a delta with no links (an older server) is asked for exactly as before", async () => {
    const w = hubWorld();
    await hubOpened(w);
    w.answer(hostDelta(w, { v: 11, upsert: [entry(3)], total: 3 }));
    await w.store.sync();
    await w.store.links.ensure([uuid(3)]);
    expect(w.asked).toEqual([[uuid(3)]]);
  });

  it("each carried link answers once, so a re-mint is the route's own answer, its count with it", async () => {
    const w = hubWorld();
    await hubOpened(w);
    w.answer(
      hostDelta(w, {
        v: 11,
        upsert: [entry(4)],
        total: 3,
        carry: { ids: [4], likes: { 4: 1 } },
      }),
    );
    await w.store.sync();
    expect(await likesOf(w, [4])).toEqual({ [uuid(4)]: 1 });
    expect(w.asked).toEqual([]);
    w.routeLikes[4] = 7;
    expect(await likesOf(w, [4])).toEqual({ [uuid(4)]: 7 });
    expect(w.asked).toEqual([[uuid(4)]]);
  });
});
