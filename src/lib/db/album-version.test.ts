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
  return { sim, media, transaction };
}

type Outcome = {
  syncs: number;
  deltas: number;
  manifests: number;
  pages: number;
  notModified: number;
  integrityMisses: number;
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
): Promise<Outcome> {
  const rng = prng(seed);
  const scope: AlbumScope = rng() < 0.5 ? "album" : "host";
  const pageSize = int(rng, 2, 6);
  const resyncAfter = int(rng, 2, 8);
  const { sim, media, transaction } = world(rng);

  for (let i = int(rng, 0, 12); i > 0; i--) {
    sim.commit([
      { op: "insert", media: media(rng() < 0.85 ? EVENT : NEIGHBOUR) },
    ]);
  }

  let writing = true;
  const between = (_point: SimPoint) => {
    if (writing && rng() < 0.3) sim.commit(transaction());
  };
  let transport: AlbumTransport<GuestWhoTuple> = simTransport({
    sim,
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

  for (let step = int(rng, 20, 80); step > 0; step--) {
    const roll = rng();
    if (roll < 0.45) {
      sim.commit(transaction());
    } else if (roll < 0.8) {
      await store.sync();
      check();
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
  for (let i = 0; i < 6 && store.getSnapshot().version !== target(); i++) {
    await store.sync();
    check();
  }
  await store.sync();
  check();

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
});
