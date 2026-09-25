import { describe, expect, it, vi } from "vitest";

import { isOrdered } from "@/lib/album/manifest";
import { createAlbumStore, type AlbumTransport } from "@/lib/album/store";
import {
  AlbumSim,
  simTransport,
  type SimMedia,
  type SimPoint,
} from "@/lib/album/testing/album-sim";
import type { GuestWhoTuple } from "@/lib/events/album-wire";

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

  it("a held upload moves nothing a guest sees: the guest's poll stays on 304", async () => {
    const { sim, store } = setup();
    sim.commit([{ op: "insert", media: photo() }]);
    await store.sync();
    sim.commit([{ op: "insert", media: photo("pending") }]);
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
