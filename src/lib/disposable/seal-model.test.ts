/**
 * THE SEAL'S INTEGRITY MODEL (disposable mode, 20261002200000): the paged album's own protocol (the routes' planner,
 * the real validators and the real client store, `album-version.test.ts`'s harness) over the migration's semantics with
 * the seal in them (`AlbumSim`: `album_bits`, a guest album of approved AND unsealed items, a develop as a write).
 *
 * Seeded schedules of uploads (sealed and not, approved and held), a host's moderation, a guest's own removals, purges,
 * the log's prune and develops (one row, or the whole roll), interleaved inside requests at every point a real one
 * gives way. Checked on every answer the guest's client receives: ★ NO SEALED ID IN IT, a manifest's entry, a delta's
 * upsert or removal, or a link. Checked after the writes stop: the client holds exactly the guest's album, and no count
 * check ever missed. And the parked phone: a client sitting on 304s hears the develop on its next poll.
 *
 * Teeth: the same schedules against a server whose manifest read forgets the seal (the column filter's absence, which
 * partyreel.com's older reads have until milestone 34) hand sealed ids to the client.
 */
import { describe, expect, it } from "vitest";

import { createAlbumStore, type AlbumTransport } from "@/lib/album/store";
import {
  AlbumSim,
  simTransport,
  type SimMedia,
  type SimOp,
  type SimPoint,
  type SimStatus,
} from "@/lib/album/testing/album-sim";
import {
  compareEntries,
  type AlbumCursor,
  type GuestWhoTuple,
} from "@/lib/events/album-wire";

const SCHEDULES = 3_000;
const EVENT = "e0000000-0000-4000-8000-0000000000d1";
const NEIGHBOUR = "e0000000-0000-4000-8000-0000000000d2";

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

/**
 * A sim whose manifest read forgets the seal (a guest's album read with no column filter): every approved item, sealed
 * or not. Its version, its log and its counts are the real server's; only the album the pages and the links read moves.
 */
function forgetsTheSeal(sim: AlbumSim): AlbumSim {
  const forgetful = (event: string, scope: "album" | "host") => {
    if (scope !== "album") return sim.album(event, scope);
    const sealed = [...sim.media.values()].filter((m) => m.sealed);
    for (const m of sealed) m.sealed = false;
    try {
      return sim.album(event, scope);
    } finally {
      for (const m of sealed) m.sealed = true;
    }
  };
  return new Proxy(sim, {
    get(target, prop, receiver) {
      if (prop === "album") return forgetful;
      if (prop === "page") {
        return (
          event: string,
          scope: "album" | "host",
          after: AlbumCursor | null,
          budget: number,
        ) => {
          const all = forgetful(event, scope);
          const from = after
            ? all.findIndex((e) => compareEntries(e, after) > 0)
            : 0;
          const rows = from < 0 ? [] : all.slice(from, from + budget);
          const last = rows[rows.length - 1];
          return {
            entries: rows,
            next: rows.length === budget && last ? [last[4], last[0]] : null,
          };
        };
      }
      const value: unknown = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

type Outcome = {
  sealedSeen: number;
  diverged: boolean;
  integrityMisses: number;
  develops: number;
  deltas: number;
  notModified: number;
};

async function runSchedule(
  seed: number,
  opts: { forgetful?: boolean } = {},
): Promise<Outcome> {
  const rng = prng(seed);
  const sim = new AlbumSim();
  let n = 0;
  const media = (event: string): SimMedia => {
    n += 1;
    return {
      id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
      event,
      status: rng() < 0.7 ? "approved" : "pending",
      t: 1_790_000_000_000_000 + int(rng, 0, 40) * 1000,
      type: rng() < 0.2 ? "video" : "photo",
      w: int(rng, 0, 4000),
      h: int(rng, 0, 3000),
      dur: null,
      preview: rng() < 0.7,
      reel: true,
      // A disposable album: most shots wait for the roll to develop.
      sealed: rng() < 0.6,
    };
  };
  let develops = 0;
  const transaction = (): SimOp[] => {
    const ops: SimOp[] = [];
    for (let k = int(rng, 1, 4); k > 0; k--) {
      const event = rng() < 0.8 ? EVENT : NEIGHBOUR;
      const existing = [...sim.media.values()].filter((m) => m.event === event);
      const roll = rng();
      if (roll < 0.35 || existing.length === 0) {
        ops.push({ op: "insert", media: media(event) });
      } else if (roll < 0.7) {
        ops.push({
          op: "status",
          id: pick(rng, existing).id,
          status: pick(rng, STATUSES),
        });
      } else if (roll < 0.85) {
        // A develop of one row (a straggler healed, a reseal's due row): never a seal put back on.
        const sealed = existing.filter((m) => m.sealed);
        if (sealed.length > 0) {
          ops.push({ op: "seal", id: pick(rng, sealed).id, sealed: false });
          develops += 1;
        }
      } else if (roll < 0.9) {
        // The whole roll develops at once (develop_due, Develop now, disposable to album).
        for (const m of existing.filter((m) => m.sealed)) {
          ops.push({ op: "seal", id: m.id, sealed: false });
        }
        develops += 1;
      } else {
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

  for (let i = int(rng, 0, 10); i > 0; i--) {
    sim.commit([{ op: "insert", media: media(rng() < 0.85 ? EVENT : NEIGHBOUR) }]);
  }

  let writing = true;
  const between = (_point: SimPoint) => {
    if (!writing) return;
    const roll = rng();
    if (roll < 0.3) sim.commit(transaction());
    else if (roll < 0.35) sim.prune(rng() < 0.8 ? EVENT : NEIGHBOUR);
  };
  const server = opts.forgetful ? forgetsTheSeal(sim) : sim;
  const inner = simTransport({
    sim: server,
    event: EVENT,
    scope: "album",
    pageSize: int(rng, 2, 6),
    resyncAfter: int(rng, 2, 8),
    between,
  });

  // ★ Every id an answer carries, checked against the seal AS THE ANSWER IS RECEIVED (a seal is never put back, so a
  // row sealed now was sealed when it was read).
  let sealedSeen = 0;
  const sealedNow = (id: string) => sim.media.get(id)?.sealed === true;
  const watch = (ids: readonly string[]) => {
    for (const id of ids) if (sealedNow(id)) sealedSeen += 1;
  };
  const transport: AlbumTransport<GuestWhoTuple> = {
    async sync(req) {
      const res = await inner.sync(req);
      if (res.status === 200) {
        const body = res.body;
        if ("entries" in body) watch(body.entries.map((e) => e[0]));
        if ("upsert" in body) {
          watch(body.upsert.map((e) => e[0]));
          watch(body.remove);
        }
      }
      return res;
    },
    async manifest(after) {
      const page = await inner.manifest(after);
      watch(page.entries.map((e) => e[0]));
      return page;
    },
    async links(ids) {
      const answer = await inner.links(ids);
      watch(answer.links.map((l) => l[0]));
      return answer;
    },
  };
  const store = createAlbumStore({ transport, linkBatchSize: 3 });

  for (let step = int(rng, 20, 70); step > 0; step--) {
    const roll = rng();
    if (roll < 0.45) sim.commit(transaction());
    else if (roll < 0.85) await store.sync();
    else await store.links.ensure([...sim.media.keys()].filter(() => rng() < 0.3));
  }

  writing = false;
  for (
    let i = 0;
    i < 6 && store.getSnapshot().version !== sim.versions(EVENT).albumMax;
    i++
  ) {
    await store.sync();
  }
  await store.sync();
  const stats = store.stats();
  return {
    sealedSeen,
    diverged:
      JSON.stringify(store.getSnapshot().entries) !==
      JSON.stringify(sim.album(EVENT, "album")),
    integrityMisses: stats.integrityMisses,
    develops,
    deltas: stats.deltas,
    notModified: stats.notModified,
  };
}

describe("the seal's integrity model", () => {
  it(`${SCHEDULES.toLocaleString()} seeded schedules: no sealed id ever reaches a guest, and every guest converges on her album`, async () => {
    const failures: number[] = [];
    let develops = 0;
    let deltas = 0;
    let notModified = 0;
    for (let seed = 1; seed <= SCHEDULES; seed++) {
      const out = await runSchedule(seed);
      develops += out.develops;
      deltas += out.deltas;
      notModified += out.notModified;
      if (out.sealedSeen > 0 || out.diverged || out.integrityMisses > 0) {
        failures.push(seed);
      }
    }
    // The run went through the seal's every branch, not a quiet corner of it.
    expect(develops).toBeGreaterThan(SCHEDULES);
    expect(deltas).toBeGreaterThan(SCHEDULES * 3);
    expect(notModified).toBeGreaterThan(SCHEDULES / 2);
    expect(
      failures,
      `failing seeds: ${failures.slice(0, 10).join(", ")}`,
    ).toEqual([]);
  }, 120_000);

  it("has teeth: a server whose manifest read forgets the seal hands sealed ids to a guest", async () => {
    let leaked = 0;
    for (let seed = 1; seed <= 500; seed++) {
      const out = await runSchedule(seed, { forgetful: true });
      if (out.sealedSeen > 0) leaked += 1;
    }
    expect(leaked).toBeGreaterThan(0);
  }, 120_000);
});

describe("a parked phone hears the develop", () => {
  const shot = (k: number, sealed: boolean): SimMedia => ({
    id: `00000000-0000-4000-8000-${String(k).padStart(12, "0")}`,
    event: EVENT,
    status: "approved",
    t: 1_790_000_000_000_000 + k * 1000,
    type: "photo",
    w: 4,
    h: 3,
    dur: null,
    preview: true,
    reel: true,
    sealed,
  });

  it("★ a client on 304s while the roll waits gets a 200 the moment it develops, and the roll arrives whole", async () => {
    const sim = new AlbumSim();
    sim.commit([{ op: "insert", media: shot(1, false) }]);
    sim.commit(
      Array.from({ length: 5 }, (_, i) => ({
        op: "insert" as const,
        media: shot(i + 2, true),
      })),
    );
    const store = createAlbumStore({
      transport: simTransport({ sim, event: EVENT, scope: "album" }),
      linkBatchSize: 3,
    });
    await store.sync();
    // Before the develop: the album is the one open shot, and the roll is a number.
    expect(store.getSnapshot().entries.map((e) => e[0])).toEqual([shot(1, false).id]);
    expect(sim.waitingCount(EVENT)).toBe(5);
    const before = store.stats();
    await store.sync();
    expect(store.stats().notModified - before.notModified).toBe(1);

    // The develop is a write: one transaction unseals the roll.
    sim.commit(
      Array.from({ length: 5 }, (_, i) => ({
        op: "seal" as const,
        id: shot(i + 2, true).id,
        sealed: false,
      })),
    );
    const parked = store.stats();
    await store.sync();
    const after = store.stats();
    expect(after.notModified).toBe(parked.notModified);
    expect(after.deltas - parked.deltas).toBe(1);
    expect(store.getSnapshot().entries).toEqual(sim.album(EVENT, "album"));
    expect(store.getSnapshot().entries).toHaveLength(6);
    expect(sim.waitingCount(EVENT)).toBe(0);
  });

  it("a sealed shot added while she watches moves her version (what waits rides the answer) but never her album", async () => {
    const sim = new AlbumSim();
    sim.commit([{ op: "insert", media: shot(1, false) }]);
    const store = createAlbumStore({
      transport: simTransport({ sim, event: EVENT, scope: "album" }),
      linkBatchSize: 3,
    });
    await store.sync();
    const v = store.getSnapshot().version;
    sim.commit([{ op: "insert", media: shot(2, true) }]);
    await store.sync();
    expect(store.getSnapshot().version).toBeGreaterThan(v ?? 0);
    expect(store.getSnapshot().entries.map((e) => e[0])).toEqual([shot(1, false).id]);
    expect(store.stats().integrityMisses).toBe(0);
  });

  it("★ a held upload waits as a sealed one does: her version moves, her album does not, and its approval brings it in once", async () => {
    const sim = new AlbumSim();
    sim.commit([{ op: "insert", media: shot(1, false) }]);
    const store = createAlbumStore({
      transport: simTransport({ sim, event: EVENT, scope: "album" }),
      linkBatchSize: 3,
    });
    await store.sync();
    const v = store.getSnapshot().version ?? 0;
    sim.commit([{ op: "insert", media: { ...shot(2, false), status: "pending" } }]);
    expect(sim.waitingCount(EVENT)).toBe(1);
    await store.sync();
    const held = store.getSnapshot().version ?? 0;
    expect(held).toBeGreaterThan(v);
    expect(store.getSnapshot().entries.map((e) => e[0])).toEqual([shot(1, false).id]);
    sim.commit([{ op: "status", id: shot(2, false).id, status: "approved" }]);
    expect(sim.waitingCount(EVENT)).toBe(0);
    await store.sync();
    expect(store.getSnapshot().version ?? 0).toBeGreaterThan(held);
    expect(store.getSnapshot().entries).toEqual(sim.album(EVENT, "album"));
    expect(store.getSnapshot().entries).toHaveLength(2);
    expect(store.stats().integrityMisses).toBe(0);
  });
});
