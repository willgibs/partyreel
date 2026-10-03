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
  type AlbumLinkTuple,
  type AlbumLinksBody,
  type GuestFullSync,
  type GuestWhoTuple,
  type ManifestEntry,
} from "@/lib/events/album-wire";
import {
  PRESIGN_BUCKET_MS,
  STABLE_DOWNLOAD_TTL_SECONDS,
} from "@/lib/r2/presign-bucket";

import { carriedIds, carryingTransport } from "./album-wire-carry";

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
      const served = clock + SKEW;
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
