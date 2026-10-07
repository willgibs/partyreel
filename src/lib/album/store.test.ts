import { describe, expect, it, vi } from "vitest";

import {
  ALBUM_EDGE_TRUST_MS,
  type AlbumVersionAnswer,
} from "@/lib/album/edge-version";
import { isOrdered } from "@/lib/album/manifest";
import {
  createAlbumStore,
  type AlbumTransport,
  type SyncResult,
} from "@/lib/album/store";
import {
  AlbumSim,
  simTransport,
  type SimMedia,
  type SimPoint,
} from "@/lib/album/testing/album-sim";
import type { GuestWhoTuple } from "@/lib/events/album-wire";
import { guestAlbumEtag } from "@/lib/events/album-validator";

const EVENT = "e0000000-0000-4000-8000-000000000001";
let seq = 0;
function photo(status: SimMedia["status"] = "approved", t?: number): SimMedia {
  seq += 1;
  return {
    id: `00000000-0000-4000-8000-${String(seq).padStart(12, "0")}`,
    event: EVENT,
    status,
    t: t ?? 1_790_000_000_000_000 + seq * 1000,
    type: "photo",
    w: 4,
    h: 3,
    dur: null,
    preview: true,
    reel: true,
  };
}

function setup(
  opts: {
    scope?: "album" | "host";
    pageSize?: number;
    resyncAfter?: number;
    between?: (point: SimPoint, sim: AlbumSim) => void;
  } = {},
) {
  const sim = new AlbumSim();
  const scope = opts.scope ?? "album";
  const transport = simTransport({
    sim,
    event: EVENT,
    scope,
    pageSize: opts.pageSize,
    resyncAfter: opts.resyncAfter,
    between: opts.between ? (p) => opts.between!(p, sim) : undefined,
  });
  const onIntegrityMiss = vi.fn();
  const store = createAlbumStore({ transport, onIntegrityMiss });
  const ids = () => store.getSnapshot().entries.map((e) => e[0]);
  const truth = () => sim.album(EVENT, scope).map((e) => e[0]);
  return { sim, store, ids, truth, onIntegrityMiss, transport };
}

describe("a first load, then the poll", () => {
  it("adopts the manifest at the version read before it, then 304s while nothing moves", async () => {
    const { sim, store, ids, truth } = setup();
    sim.commit([
      { op: "insert", media: photo() },
      { op: "insert", media: photo() },
    ]);
    await store.sync();
    const snap = store.getSnapshot();
    expect(snap.status).toBe("ready");
    expect(snap.version).toBe(1);
    expect(ids()).toEqual(truth());
    await store.sync();
    await store.sync();
    expect(store.stats()).toMatchObject({
      manifests: 1,
      notModified: 2,
      deltas: 0,
    });
  });

  it("a change arrives as a delta by id, and the album stays in the server's order", async () => {
    const { sim, store, ids, truth } = setup();
    const a = photo();
    sim.commit([{ op: "insert", media: a }]);
    await store.sync();
    const b = photo("approved", a.t - 5);
    sim.commit([
      { op: "insert", media: b },
      { op: "status", id: a.id, status: "hidden" },
    ]);
    await store.sync();
    expect(store.stats().deltas).toBe(1);
    expect(ids()).toEqual(truth());
    expect(ids()).toEqual([b.id]);
  });

  // ★ Reshaped by disposable-foundation (20261002200000, the program's synthesis of 2026-10-02): what waits (held
  // rows and sealed ones, counted together) is the guest's to count, so a held upload now moves `album_max` and her
  // poll answers once (a delta carrying no change, the waiting count beside it) where it stayed on 304. Its expired
  // reason: "a held upload moves nothing a guest sees" held while guests saw nothing of a held row. What it still
  // guards: her album never takes the held row.
  it("a held upload moves nothing in a guest's album: her poll answers once with no change", async () => {
    const { sim, store, ids } = setup();
    const open = photo();
    sim.commit([{ op: "insert", media: open }]);
    await store.sync();
    sim.commit([{ op: "insert", media: photo("pending") }]);
    await store.sync();
    expect(store.stats().notModified).toBe(0);
    expect(store.stats().deltas).toBe(1);
    expect(ids()).toEqual([open.id]);
    await store.sync();
    expect(store.stats().notModified).toBe(1);
  });

  it("the host's scope sees the held upload, with its status in the flags", async () => {
    const { sim, store, ids, truth } = setup({ scope: "host" });
    sim.commit([{ op: "insert", media: photo() }]);
    await store.sync();
    const held = photo("pending");
    sim.commit([{ op: "insert", media: held }]);
    await store.sync();
    expect(ids()).toEqual(truth());
    const entry = store.getSnapshot().entries.find((e) => e[0] === held.id)!;
    expect(entry[3] & 16).toBe(16);
    expect(store.getSnapshot().counts).toEqual({ album: 1, pending: 1 });
  });
});

describe("a long album pages, and a change between pages is never lost", () => {
  it("adopts only after the last page, merging writes that landed mid-read", async () => {
    let wrote = false;
    const late = photo("approved", 1_890_000_000_000_000);
    const { sim, store, ids, truth } = setup({
      pageSize: 3,
      between: (point, s) => {
        if (point === "manifest" && !wrote) {
          wrote = true;
          // Lands between two pages, ABOVE the cursor: the pages can never see it.
          s.commit([{ op: "insert", media: late }]);
        }
      },
    });
    for (let i = 0; i < 8; i++) sim.commit([{ op: "insert", media: photo() }]);
    await store.sync();
    expect(store.stats().pages).toBeGreaterThan(0);
    // It is not in the manifest yet, and the next delta brings it.
    expect(ids()).not.toContain(late.id);
    await store.sync();
    expect(ids()).toEqual(truth());
    expect(isOrdered(store.getSnapshot().entries)).toBe(true);
  });

  it("an access lost mid-read adopts nothing and asks again", async () => {
    const { sim } = setup();
    for (let i = 0; i < 5; i++) sim.commit([{ op: "insert", media: photo() }]);
    const base = simTransport({
      sim,
      event: EVENT,
      scope: "album",
      pageSize: 2,
    });
    const transport: AlbumTransport<GuestWhoTuple> = {
      ...base,
      manifest: async () => ({
        ok: true,
        access: "teaser",
        gate: "account",
        entries: [],
        next: null,
      }),
    };
    const sync = vi.spyOn(base, "sync");
    const store = createAlbumStore({ transport: { ...transport, sync } });
    await store.sync();
    expect(store.getSnapshot().status).toBe("loading");
    // It asked again, and a server that keeps disagreeing with itself cannot spin it.
    expect(sync.mock.calls.length).toBeGreaterThan(1);
    expect(sync.mock.calls.length).toBeLessThanOrEqual(4);
  });
});

describe("resync, the integrity check, and overlap", () => {
  it("more changes than the threshold answers a fresh manifest", async () => {
    const { sim, store, ids, truth } = setup({ resyncAfter: 3 });
    sim.commit([{ op: "insert", media: photo() }]);
    await store.sync();
    for (let i = 0; i < 5; i++) sim.commit([{ op: "insert", media: photo() }]);
    await store.sync();
    expect(store.stats()).toMatchObject({ manifests: 2, deltas: 0 });
    expect(ids()).toEqual(truth());
  });

  it("a delta that leaves the album a different size than the server counted is reported and healed", async () => {
    const { sim, onIntegrityMiss } = setup();
    for (let i = 0; i < 3; i++) sim.commit([{ op: "insert", media: photo() }]);
    const base = simTransport({ sim, event: EVENT, scope: "album" });
    let lose = false;
    const transport: AlbumTransport<GuestWhoTuple> = {
      ...base,
      async sync(req) {
        const res = await base.sync(req);
        // A broken server that drops one upsert from a delta.
        if (lose && res.status === 200 && res.body.kind === "delta") {
          lose = false;
          return {
            ...res,
            body: { ...res.body, upsert: res.body.upsert.slice(1) },
          };
        }
        return res;
      },
    };
    const store = createAlbumStore({ transport, onIntegrityMiss });
    await store.sync();
    lose = true;
    sim.commit([
      { op: "insert", media: photo() },
      { op: "insert", media: photo() },
    ]);
    await store.sync();
    expect(onIntegrityMiss).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().entries.map((e) => e[0])).toEqual(
      sim.album(EVENT, "album").map((e) => e[0]),
    );
    expect(store.stats().manifests).toBe(2);
  });

  it("a sync during a sync runs once more after it, never alongside it", async () => {
    let inFlight = 0;
    let most = 0;
    const { sim } = setup();
    sim.commit([{ op: "insert", media: photo() }]);
    const base = simTransport({ sim, event: EVENT, scope: "album" });
    const transport: AlbumTransport<GuestWhoTuple> = {
      ...base,
      async sync(req) {
        inFlight += 1;
        most = Math.max(most, inFlight);
        await new Promise((r) => setTimeout(r, 1));
        try {
          return await base.sync(req);
        } finally {
          inFlight -= 1;
        }
      },
    };
    const store = createAlbumStore({ transport });
    await Promise.all([store.sync(), store.sync(), store.sync()]);
    expect(most).toBe(1);
    expect(store.stats().syncs).toBe(2);
  });

  it("a transient failure keeps the album on screen", async () => {
    const { sim } = setup();
    sim.commit([{ op: "insert", media: photo() }]);
    const base = simTransport({ sim, event: EVENT, scope: "album" });
    let fail = false;
    const store = createAlbumStore({
      transport: {
        ...base,
        sync: (req) =>
          fail ? Promise.reject(new Error("offline")) : base.sync(req),
      },
    });
    await store.sync();
    const before = store.getSnapshot();
    fail = true;
    await store.sync();
    expect(store.getSnapshot()).toBe(before);
    expect(store.stats().failures).toBe(1);
  });
});

describe("the links follow the album", () => {
  it("a removed item loses its links; a missing id makes the album poll", async () => {
    const { sim, store } = setup();
    const a = photo();
    const b = photo();
    sim.commit([
      { op: "insert", media: a },
      { op: "insert", media: b },
    ]);
    await store.sync();
    await store.links.ensure([a.id, b.id]);
    expect(store.links.get(a.id)).toBeDefined();
    // Hidden behind the store's back: the links route reports it missing, and the store polls.
    sim.commit([{ op: "status", id: b.id, status: "hidden" }]);
    store.links.forget([b.id]);
    await store.links.ensure([b.id]);
    await store.sync();
    expect(store.getSnapshot().entries.map((e) => e[0])).toEqual([a.id]);
    sim.commit([{ op: "status", id: a.id, status: "removed" }]);
    await store.sync();
    expect(store.links.get(a.id)).toBeUndefined();
  });
});

/* ★ WHAT WAITS REACHES THE PAGE (the-wait r1, Will's `wait=sheet`): the sync's waiting facts (`GuestFullSync.waiting`,
   held and sealed rows counted together, as a number and its minutes, never an id) ride every full answer into the
   snapshot, so the album's contact sheet draws everyone's from them; a 304 keeps what was said, a teaser or a lock
   says nothing of it, and the host's scope never carries it (her hub reads her own manifest). */
describe("what waits rides the guest's full answer, as numbers", () => {
  const WAITING = {
    count: 5,
    minutes: [
      [1_790_000_040_000, 2],
      [1_790_000_100_000, 3],
    ] as [number, number][],
    developsAt: "2026-10-11T16:00:00.000Z",
  };

  function guestTransport(
    answers: SyncResult[],
  ): AlbumTransport<GuestWhoTuple> {
    return {
      sync: () => Promise.resolve(answers.shift() ?? { status: 304 }),
      manifest: () => Promise.reject(new Error("no pages")),
      links: () => Promise.reject(new Error("no links")),
    };
  }

  const manifest = (waiting?: typeof WAITING): SyncResult => ({
    status: 200,
    etag: "e1",
    body: {
      kind: "manifest",
      v: 1,
      attr: 0,
      entries: [],
      next: null,
      ok: true,
      access: "full",
      gate: null,
      total: 0,
      reel: null,
      ...(waiting ? { waiting } : {}),
    },
  });

  it("★ adopts the count and its minutes from a manifest, and no id of what waits rides it", async () => {
    const store = createAlbumStore({
      transport: guestTransport([manifest(WAITING)]),
    });
    await store.sync();
    const snap = store.getSnapshot();
    expect(snap.waiting).toEqual(WAITING);
    // Nothing that waits is an entry: the album holds only what a guest sees.
    expect(snap.entries).toEqual([]);
    expect(JSON.stringify(snap.waiting)).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-/,
    );
  });

  it("a delta carries the newest word; a 304 keeps it; an answer without it says nothing waits", async () => {
    const delta: SyncResult = {
      status: 200,
      etag: "e2",
      body: {
        kind: "delta",
        v: 2,
        attr: 0,
        upsert: [],
        remove: [],
        ok: true,
        access: "full",
        gate: null,
        total: 0,
        reel: null,
        waiting: { ...WAITING, count: 6 },
      },
    };
    const store = createAlbumStore({
      transport: guestTransport([
        manifest(WAITING),
        delta,
        { status: 304 },
        manifest(),
      ]),
    });
    await store.sync();
    await store.sync();
    expect(store.getSnapshot().waiting?.count).toBe(6);
    await store.sync();
    expect(store.getSnapshot().waiting?.count).toBe(6);
    await store.sync();
    expect(store.getSnapshot().waiting).toBeUndefined();
  });

  it("a teaser or a lock says nothing of what waits", async () => {
    const store = createAlbumStore({
      transport: guestTransport([
        manifest(WAITING),
        {
          status: 200,
          etag: null,
          body: { ok: true, kind: "locked", access: "none", gate: null },
        },
      ]),
    });
    await store.sync();
    await store.sync();
    expect(store.getSnapshot().waiting).toBeUndefined();
  });

  it("the host's scope never carries it", async () => {
    const { sim, store } = setup({ scope: "host" });
    sim.commit([{ op: "insert", media: photo("pending") }]);
    await store.sync();
    expect(store.getSnapshot().waiting).toBeUndefined();
  });
});

describe("the timer's ask goes to the CDN first, where the album's version is everyone's (X5)", () => {
  const KEY = "Kk0_-".padEnd(22, "x");

  /** The guest validator the sim's album stands at: what a CDN fill read now would hold. */
  function versionOf(sim: AlbumSim): string {
    const v = sim.versions(EVENT);
    return guestAlbumEtag({
      eventId: EVENT,
      access: "full",
      gate: null,
      albumMax: v.albumMax,
      attrVersion: v.attr,
      reel: null,
    });
  }

  /** A sim whose real answers name `key` (the route's `x-album-edge`), and a CDN answering the album as it stands. */
  function edgeSetup(opts: { now?: () => number } = {}) {
    const sim = new AlbumSim();
    const base = simTransport({ sim, event: EVENT, scope: "album" });
    const named = { key: KEY as string | null };
    const transport: AlbumTransport<GuestWhoTuple> = {
      ...base,
      async sync(req) {
        const answer = await base.sync(req);
        return { ...answer, edgeKey: named.key };
      },
    };
    const cdn: {
      next: AlbumVersionAnswer | "fail" | null;
      /** Whether the CDN answers from its cache (a room asking too), or the function fills the window. */
      fromCache: boolean;
    } = { next: null, fromCache: true };
    const askVersion = vi.fn(async (key: string) => {
      expect(key).toBe(KEY);
      const next = cdn.next;
      if (next === "fail") throw new Error("offline");
      return {
        answer: next ?? { kind: "version" as const, v: versionOf(sim) },
        fromCache: cdn.fromCache,
      };
    });
    const store = createAlbumStore({ transport, askVersion, now: opts.now });
    return { sim, store, askVersion, cdn, named };
  }

  it("a quiet album's poll is the CDN's word alone: no sync, and what aged still re-mints", async () => {
    const { sim, store, askVersion } = edgeSetup();
    sim.commit([{ op: "insert", media: photo() }]);
    await store.sync();
    // Named, but nothing says yet that a room shares its windows.
    expect(store.edgeShared()).toBe(false);
    const refreshAged = vi.spyOn(store.links, "refreshAged");
    const before = store.getSnapshot();
    await store.poll();
    await store.poll();
    expect(askVersion).toHaveBeenCalledTimes(2);
    expect(store.stats()).toMatchObject({
      syncs: 1,
      edgeAsks: 2,
      edgeQuiet: 2,
    });
    expect(refreshAged).toHaveBeenCalledTimes(2);
    expect(store.getSnapshot()).toBe(before);
    expect(store.edgeShared()).toBe(true);
  });

  it("★ shared only while the CDN answers from its cache: a device asking alone fills its own windows", async () => {
    const { sim, store, cdn } = edgeSetup();
    sim.commit([{ op: "insert", media: photo() }]);
    await store.sync();
    cdn.fromCache = false;
    await store.poll();
    expect(store.edgeShared()).toBe(false);
    cdn.fromCache = true;
    await store.poll();
    expect(store.edgeShared()).toBe(true);
    // A failed ask says nothing shared.
    cdn.next = "fail";
    await store.poll();
    expect(store.edgeShared()).toBe(false);
  });

  it("a change the CDN's version shows asks the album itself, which answers the delta", async () => {
    const { sim, store } = edgeSetup();
    sim.commit([{ op: "insert", media: photo() }]);
    await store.sync();
    sim.commit([{ op: "insert", media: photo() }]);
    await store.poll();
    expect(store.stats()).toMatchObject({ syncs: 2, deltas: 1, edgeQuiet: 0 });
    expect(store.getSnapshot().entries).toHaveLength(2);
  });

  it("★ the CDN's few seconds can hide a change, never invent one: a stale version only asks the album", async () => {
    const { sim, store, cdn } = edgeSetup();
    sim.commit([{ op: "insert", media: photo() }]);
    const stale = versionOf(sim);
    await store.sync();
    sim.commit([{ op: "insert", media: photo() }]);
    // The doorbell's sync brings the change; the CDN's window still holds the version from before it.
    await store.sync();
    cdn.next = { kind: "version", v: stale };
    await store.poll();
    // Not this device's validator, so the album itself answered (a 304: nothing is lost or doubled).
    expect(store.stats()).toMatchObject({ syncs: 3, notModified: 1 });
    expect(store.getSnapshot().entries).toHaveLength(2);
  });

  it("never before a real answer named the key: the seed's first answer says nothing", async () => {
    const { sim, store, askVersion, named } = edgeSetup();
    named.key = null;
    sim.commit([{ op: "insert", media: photo() }]);
    await store.sync();
    expect(store.edgeShared()).toBe(false);
    await store.poll();
    expect(askVersion).not.toHaveBeenCalled();
    expect(store.stats()).toMatchObject({ syncs: 2, notModified: 1 });
  });

  it("an album that stops naming its key (a password now, a door) is asked itself from its next answer on", async () => {
    const { sim, store, askVersion, cdn, named } = edgeSetup();
    sim.commit([{ op: "insert", media: photo() }]);
    await store.sync();
    // The CDN's route stopped vouching (it answers `ask` for anything not open to anyone).
    cdn.next = { kind: "ask" };
    named.key = null;
    await store.poll();
    expect(store.stats()).toMatchObject({ syncs: 2, edgeAsks: 1 });
    expect(store.edgeShared()).toBe(false);
    await store.poll();
    expect(askVersion).toHaveBeenCalledTimes(1);
    expect(store.stats().syncs).toBe(3);
  });

  it("ask, clock, a failed ask: the album itself answers, and nothing breaks", async () => {
    const { sim, store, cdn } = edgeSetup();
    sim.commit([{ op: "insert", media: photo() }]);
    await store.sync();
    for (const next of [
      { kind: "ask" as const },
      { kind: "clock" as const, now: 1 },
      "fail" as const,
    ]) {
      cdn.next = next;
      await store.poll();
    }
    expect(store.stats()).toMatchObject({
      syncs: 4,
      edgeAsks: 3,
      edgeQuiet: 0,
      failures: 0,
    });
  });

  it("★ past ALBUM_EDGE_TRUST_MS since the album last answered, the poll asks the album itself (what only she can be told)", async () => {
    let t = 1_790_000_000_000;
    const { sim, store, askVersion } = edgeSetup({ now: () => t });
    sim.commit([{ op: "insert", media: photo() }]);
    await store.sync();
    t += ALBUM_EDGE_TRUST_MS - 1;
    await store.poll();
    expect(askVersion).toHaveBeenCalledTimes(1);
    t += 1;
    await store.poll();
    expect(askVersion).toHaveBeenCalledTimes(1);
    expect(store.stats()).toMatchObject({ syncs: 2, notModified: 1 });
    // That answer vouched again: the CDN answers the next.
    await store.poll();
    expect(askVersion).toHaveBeenCalledTimes(2);
  });

  it("a sync landing while the ask is out is what the answer is checked against", async () => {
    const { sim, store, askVersion } = edgeSetup();
    sim.commit([{ op: "insert", media: photo() }]);
    await store.sync();
    sim.commit([{ op: "insert", media: photo() }]);
    let release!: () => void;
    askVersion.mockImplementationOnce(async () => {
      await new Promise<void>((r) => {
        release = r;
      });
      return {
        answer: { kind: "version", v: versionOf(sim) },
        fromCache: true,
      };
    });
    const polled = store.poll();
    await Promise.resolve();
    // The doorbell's sync lands first and brings the change the CDN is about to report.
    await store.sync();
    release();
    await polled;
    expect(store.stats()).toMatchObject({ syncs: 2, deltas: 1, edgeQuiet: 1 });
  });

  it("two polls at once ask once", async () => {
    const { sim, store, askVersion } = edgeSetup();
    sim.commit([{ op: "insert", media: photo() }]);
    await store.sync();
    await Promise.all([store.poll(), store.poll()]);
    expect(askVersion).toHaveBeenCalledTimes(1);
  });

  it("with no cheap ask (the host's album), every poll is a sync", async () => {
    const { sim, store } = setup();
    sim.commit([{ op: "insert", media: photo() }]);
    await store.sync();
    await store.poll();
    expect(store.stats()).toMatchObject({ syncs: 2, edgeAsks: 0 });
  });
});
