/**
 * THE PAGED ALBUM'S INTEGRITY MODEL: ten thousand seeded schedules of writes, polls, manifest page
 * boundaries and link asks, interleaved INSIDE requests, and after every one the client holds exactly
 * the server's album, in order, with nothing lost and nothing twice.
 *
 * What runs is the real protocol: the routes' planner (`planAlbumSync`), the real validators, and the
 * real client store (`createAlbumStore`, its manifest merge and its link store), over `AlbumSim`, the
 * migration's semantics as a model (one bump per event per committed transaction, compacted change
 * rows, one-snapshot reads). The SQL itself is proven on a real Postgres by the lane's pre-flight
 * (every writer shape concurrently, commit-ordered versions); this proves that a client following the
 * protocol over those semantics converges.
 *
 * Each schedule draws its own knobs (guest or host scope, a page size of 2 to 6 so every album pages,
 * a resync threshold of 2 to 8 so resyncs happen) and runs 20 to 80 steps: a transaction (inserts
 * held or approved, approvals, hides, unhides, removals, restores, purges, hard deletes, one to four
 * writes across this album and a neighbour), a poll, a rename, or a links ask for ids visible or not.
 * Writes also land at every point a real request gives way: between the version read and the first
 * page, between pages, between polls. Checked after every poll: the album is in the server's order
 * with no repeats, and no delta ever left it a different size than the server counted. Checked at
 * the end, after the writes stop: the client's album equals the server's, entry for entry.
 *
 * And the model is shown to have teeth: the same schedules, run against a mutant server that reads a
 * manifest's version AFTER its pages (the bug the protocol exists to avoid), do lose changes.
 *
 * ★ THE PRUNED LOG (crumbs-37, 20261001150000). The purge cron's album-log sweep deletes the change rows
 * of purged items (their tombstones) and raises the scope's watermark to every version it deleted, in
 * one transaction, at any moment a write could land: between steps and inside requests, a whole pass or
 * part of one. A client parked below the watermark must come back whole, never through a delta with a
 * silent gap: the schedules prune too, and a server blind to the watermark (it prunes, but answers a
 * delta from below it) is shown to lose removals that only the count check catches.
 */
import { describe, expect, it } from "vitest";

import { isOrdered } from "@/lib/album/manifest";
import { createAlbumStore, type AlbumTransport } from "@/lib/album/store";
import {
  AlbumSim,
  simTransport,
  type SimMedia,
  type SimOp,
  type SimPoint,
  type SimStatus,
} from "@/lib/album/testing/album-sim";
import type { AlbumScope } from "@/lib/events/album-sync";
import type { AlbumCursor, GuestWhoTuple } from "@/lib/events/album-wire";

const SCHEDULES = 10_000;
const EVENT = "e0000000-0000-4000-8000-00000000000a";
const NEIGHBOUR = "e0000000-0000-4000-8000-00000000000b";

/** mulberry32: a small, fast, seeded PRNG, so every schedule replays exactly. */
function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;
const pick = <T>(rng: Rng, xs: readonly T[]): T =>
  xs[Math.floor(rng() * xs.length)];
const int = (rng: Rng, lo: number, hi: number) =>
  lo + Math.floor(rng() * (hi - lo + 1));

const STATUSES: readonly SimStatus[] = [
  "pending",
  "approved",
  "hidden",
  "removed",
];

function world(rng: Rng) {
  const sim = new AlbumSim();
  let n = 0;
  const media = (event: string): SimMedia => {
    n += 1;
    return {
      id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
      event,
      status: rng() < 0.6 ? "approved" : "pending",
      // A coarse clock, so ties on the microsecond happen and the id breaks them.
      t: 1_790_000_000_000_000 + int(rng, 0, 40) * 1000,
      type: rng() < 0.2 ? "video" : "photo",
      w: int(rng, 0, 4000),
      h: int(rng, 0, 3000),
      dur: rng() < 0.5 ? rng() * 30 : null,
      preview: rng() < 0.7,
      reel: rng() < 0.9,
    };
  };
  /** One transaction: one to four writes, across this album and its neighbour. */
  const transaction = (): SimOp[] => {
    const ops: SimOp[] = [];
    for (let k = int(rng, 1, 4); k > 0; k--) {
      const event = rng() < 0.8 ? EVENT : NEIGHBOUR;
      const existing = [...sim.media.values()].filter((m) => m.event === event);
      const roll = rng();
      if (roll < 0.35 || existing.length === 0) {
        ops.push({ op: "insert", media: media(event) });
      } else if (roll < 0.85) {
        ops.push({
          op: "status",
          id: pick(rng, existing).id,
          status: pick(rng, STATUSES),
        });
      } else {
        // A purge takes a removed row; a hard delete (an event's, an account's) takes any.
        const removed = existing.filter((m) => m.status === "removed");
        const victim =
          removed.length > 0 && rng() < 0.7
            ? pick(rng, removed)
            : pick(rng, existing);
        ops.push({ op: "delete", id: victim.id });
      }
    }
    return ops;
  };
  /**
   * One prune: the album-log sweep's transaction over this album or its neighbour, a whole pass or the
   * part of one a window took (any subset of the tombstones is a legal prune).
   */
  const prune = () => {
    const event = rng() < 0.8 ? EVENT : NEIGHBOUR;
    sim.prune(event, rng() < 0.5 ? undefined : () => rng() < 0.5);
  };
  return { sim, media, transaction, prune };
}

/** A server that prunes but never says so: its reads answer a zero watermark. */
function blindToWatermark(sim: AlbumSim): AlbumSim {
  return new Proxy(sim, {
    get(target, prop, receiver) {
      if (prop === "read") {
        return (...args: Parameters<AlbumSim["read"]>) => ({
          ...target.read(...args),
          watermark: 0,
        });
      }
      const value: unknown = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

type Outcome = {
  syncs: number;
  deltas: number;
  manifests: number;
  pages: number;
  notModified: number;
  integrityMisses: number;
  /** Polls asked from below the scope's watermark: each must be answered with the album whole. */
  belowWatermark: number;
  /** The final album differed from the server's. */
  diverged: boolean;
  /** An album was out of order or held an id twice after a poll. */
  disordered: boolean;
};

async function runSchedule(
  seed: number,
  mutate?: (
    t: AlbumTransport<GuestWhoTuple>,
    sim: AlbumSim,
    scope: AlbumScope,
  ) => AlbumTransport<GuestWhoTuple>,
  opts: { blind?: boolean } = {},
): Promise<Outcome> {
  const rng = prng(seed);
  const scope: AlbumScope = rng() < 0.5 ? "album" : "host";
  const pageSize = int(rng, 2, 6);
  const resyncAfter = int(rng, 2, 8);
  const { sim, media, transaction, prune } = world(rng);

  for (let i = int(rng, 0, 12); i > 0; i--) {
    sim.commit([
      { op: "insert", media: media(rng() < 0.85 ? EVENT : NEIGHBOUR) },
    ]);
  }

  let writing = true;
  const between = (_point: SimPoint) => {
    if (!writing) return;
    const roll = rng();
    if (roll < 0.3) sim.commit(transaction());
    else if (roll < 0.36) prune();
  };
  let transport: AlbumTransport<GuestWhoTuple> = simTransport({
    sim: opts.blind ? blindToWatermark(sim) : sim,
    event: EVENT,
    scope,
    pageSize,
    resyncAfter,
    between,
  });
  if (mutate) transport = mutate(transport, sim, scope);
  const store = createAlbumStore({ transport, linkBatchSize: 3 });

  let disordered = false;
  const check = () => {
    if (!isOrdered(store.getSnapshot().entries)) disordered = true;
  };
  let belowWatermark = 0;
  const poll = async () => {
    const held = store.getSnapshot().version;
    const v = sim.versions(EVENT);
    const watermark = scope === "host" ? v.hostWatermark : v.albumWatermark;
    if (held !== null && held < watermark) belowWatermark += 1;
    await store.sync();
    check();
  };

  for (let step = int(rng, 20, 80); step > 0; step--) {
    const roll = rng();
    if (roll < 0.4) {
      sim.commit(transaction());
    } else if (roll < 0.47) {
      prune();
    } else if (roll < 0.8) {
      await poll();
    } else if (roll < 0.9) {
      sim.renamed([rng() < 0.8 ? EVENT : NEIGHBOUR]);
    } else {
      const ids = [...sim.media.keys()].filter(() => rng() < 0.3);
      await store.links.ensure(ids);
    }
  }

  // Quiescence: the writes stop, and the client catches up.
  writing = false;
  const target = () => {
    const v = sim.versions(EVENT);
    return scope === "host" ? v.version : v.albumMax;
  };
  // A last prune with the writes stopped, so the catch-up itself starts below the watermark as often
  // as a parked tab's would.
  if (rng() < 0.5) sim.prune(EVENT);
  for (let i = 0; i < 6 && store.getSnapshot().version !== target(); i++) {
    await poll();
  }
  await poll();

  const holds = store.getSnapshot().entries;
  const truth = sim.album(EVENT, scope);
  const stats = store.stats();
  return {
    syncs: stats.syncs,
    deltas: stats.deltas,
    manifests: stats.manifests,
    pages: stats.pages,
    notModified: stats.notModified,
    integrityMisses: stats.integrityMisses,
    belowWatermark,
    diverged: JSON.stringify(holds) !== JSON.stringify(truth),
    disordered,
  };
}

describe("the paged album's integrity model", () => {
  it(`${SCHEDULES.toLocaleString()} seeded schedules: the client always converges on the server's album`, async () => {
    const total: Outcome = {
      syncs: 0,
      deltas: 0,
      manifests: 0,
      pages: 0,
      notModified: 0,
      integrityMisses: 0,
      belowWatermark: 0,
      diverged: false,
      disordered: false,
    };
    const failures: number[] = [];
    for (let seed = 1; seed <= SCHEDULES; seed++) {
      const out = await runSchedule(seed);
      total.syncs += out.syncs;
      total.deltas += out.deltas;
      total.manifests += out.manifests;
      total.pages += out.pages;
      total.notModified += out.notModified;
      total.integrityMisses += out.integrityMisses;
      total.belowWatermark += out.belowWatermark;
      if (out.diverged || out.disordered || out.integrityMisses > 0)
        failures.push(seed);
    }
    // ALBUM_MODEL_REPORT=1 prints the run's shape (the lane's handoff quotes it).
    if (process.env.ALBUM_MODEL_REPORT)
      console.log(JSON.stringify({ schedules: SCHEDULES, ...total }));
    // The run covered the protocol's every branch, not a quiet corner of it.
    expect(total.deltas).toBeGreaterThan(SCHEDULES * 5);
    expect(total.manifests).toBeGreaterThan(SCHEDULES * 1.2); // first loads plus resyncs
    expect(total.pages).toBeGreaterThan(SCHEDULES);
    expect(total.notModified).toBeGreaterThan(SCHEDULES);
    // Parked below a pruned watermark often enough that the branch is the run's, not a corner's.
    expect(total.belowWatermark).toBeGreaterThan(SCHEDULES / 2);
    expect(
      failures,
      `failing seeds: ${failures.slice(0, 10).join(", ")}`,
    ).toEqual([]);
    expect(total.integrityMisses).toBe(0);
  }, 120_000);

  it("has teeth: a server that reads a manifest's version AFTER its pages loses changes", async () => {
    // The mutant: a manifest that spans pages is fetched whole (writes still land between its pages),
    // and only THEN is its version read, the order the protocol forbids. A write that lands above the
    // cursor between two pages is then in none of the pages and already behind the client's version.
    const lateVersion = (
      t: AlbumTransport<GuestWhoTuple>,
      sim: AlbumSim,
      scope: AlbumScope,
    ): AlbumTransport<GuestWhoTuple> => ({
      ...t,
      async sync(req) {
        const res = await t.sync(req);
        if (
          res.status !== 200 ||
          res.body.kind !== "manifest" ||
          res.body.next === null
        ) {
          return res;
        }
        const entries = [...res.body.entries];
        let next: AlbumCursor | null = res.body.next;
        while (next) {
          const page = await t.manifest(next);
          entries.push(...page.entries);
          next = page.next;
        }
        const v = sim.versions(EVENT);
        return {
          ...res,
          body: {
            ...res.body,
            entries,
            next: null,
            v: scope === "host" ? v.version : v.albumMax,
          },
        };
      },
    });
    let lost = 0;
    for (let seed = 1; seed <= 2_000; seed++) {
      const out = await runSchedule(seed, lateVersion);
      if (out.diverged || out.integrityMisses > 0) lost += 1;
    }
    if (process.env.ALBUM_MODEL_REPORT)
      console.log(JSON.stringify({ mutantSchedules: 2_000, lost }));
    expect(lost).toBeGreaterThan(0);
  }, 120_000);

  it("has teeth: a server blind to the watermark answers a delta from below it, and removals go missing", async () => {
    // The same prunes, but every read answers watermark 0, so a client parked below a pruned row is
    // sent a delta that cannot carry the row's removal. Only the count check catches what it lost.
    let lost = 0;
    for (let seed = 1; seed <= 2_000; seed++) {
      const out = await runSchedule(seed, undefined, { blind: true });
      if (out.diverged || out.integrityMisses > 0) lost += 1;
    }
    if (process.env.ALBUM_MODEL_REPORT)
      console.log(JSON.stringify({ blindSchedules: 2_000, lost }));
    expect(lost).toBeGreaterThan(0);
  }, 120_000);
});

describe("a client parked below the watermark comes back whole", () => {
  const item = (n: number): SimMedia => ({
    id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    event: EVENT,
    status: "approved",
    t: 1_790_000_000_000_000 + n * 1000,
    type: "photo",
    w: 4,
    h: 3,
    dur: null,
    preview: true,
    reel: true,
  });
  const id = (n: number) => item(n).id;

  /**
   * Twelve photographs; a client parks; two are removed, then purged; a thirteenth arrives; a second
   * client syncs at the newest version; the sweep prunes the two tombstones.
   */
  async function parkedWorld(scope: AlbumScope, blind = false) {
    const sim = new AlbumSim();
    sim.commit(
      Array.from({ length: 12 }, (_, i) => ({
        op: "insert" as const,
        media: item(i + 1),
      })),
    );
    const store = (s: AlbumSim) =>
      createAlbumStore({
        transport: simTransport({ sim: s, event: EVENT, scope }),
        linkBatchSize: 3,
      });
    const parked = store(blind ? blindToWatermark(sim) : sim);
    const live = store(sim);
    await parked.sync();
    sim.commit([
      { op: "status", id: id(2), status: "removed" },
      { op: "status", id: id(5), status: "removed" },
    ]);
    // The purge of a removed row moves no version: the removal's stamp is the tombstone.
    sim.commit([
      { op: "delete", id: id(2) },
      { op: "delete", id: id(5) },
    ]);
    sim.commit([{ op: "insert", media: item(13) }]);
    await live.sync();
    expect(sim.tombstones(EVENT)).toEqual([id(2), id(5)]);
    expect(sim.prune(EVENT)).toBe(2);
    expect(sim.tombstones(EVENT)).toEqual([]);
    return { sim, parked, live };
  }

  it.each(["album", "host"] as const)(
    "★ %s scope: one fresh manifest, the server's album entry for entry, no delta and no miss",
    async (scope) => {
      const { sim, parked } = await parkedWorld(scope);
      const v = sim.versions(EVENT);
      const watermark = scope === "host" ? v.hostWatermark : v.albumWatermark;
      expect(parked.getSnapshot().version).toBeLessThan(watermark);

      const before = parked.stats();
      await parked.sync();
      const after = parked.stats();
      expect(after.manifests - before.manifests).toBe(1);
      expect(after.deltas - before.deltas).toBe(0);
      expect(after.integrityMisses).toBe(0);
      expect(parked.getSnapshot().entries).toEqual(sim.album(EVENT, scope));
      expect(parked.getSnapshot().entries.map((e) => e[0])).not.toContain(
        id(2),
      );
    },
  );

  it.each(["album", "host"] as const)(
    "%s scope: a client at or above the watermark is not moved by the prune (a quiet 304)",
    async (scope) => {
      const { live } = await parkedWorld(scope);
      const before = live.stats();
      await live.sync();
      const after = live.stats();
      expect(after.notModified - before.notModified).toBe(1);
      expect(after.manifests).toBe(before.manifests);
    },
  );

  it("from a server blind to the watermark, the parked client holds the purged photographs until the count check heals it", async () => {
    const { sim, parked } = await parkedWorld("album", true);
    await parked.sync();
    // The delta from below the watermark could not carry the two removals: the count caught it.
    expect(parked.stats().integrityMisses).toBe(1);
    expect(parked.getSnapshot().entries).toEqual(sim.album(EVENT, "album"));
  });
});
