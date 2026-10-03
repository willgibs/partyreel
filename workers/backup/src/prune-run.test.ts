/**
 * THE PRUNE ON A FAKE BACKUP (durability-backups.md, "The deletion-aware prune"): the run that deletes from the
 * last-resort copy, driven against two in-memory buckets and a stand-in for the app's confirm route that answers
 * from a set of media rows, exactly as the route does (the ids it was asked about that have no row; its
 * `media_table_empty` breaker when there are no rows at all).
 *
 * The rules, each with its test: a key goes only when its row is gone AND the primary does not hold it (listed and
 * then HEADed right before the delete), past the 36-day gate, recognized; a doubt anywhere deletes nothing; a run
 * carries on where the last one stopped; its caps are its budget, never a fixed 500; a backlog far over the usual
 * waits a week.
 */
import { describe, expect, it } from "vitest";

import {
  EMPTY_LEDGER,
  PRUNE_HOLD_FLOOR_MEDIA,
  PRUNE_HOLD_RELEASE_MS,
  type PruneLedger,
} from "./prune-ledger";
import {
  readConfirmAnswer,
  runPrune,
  type ConfirmAnswer,
  type PruneLimits,
  type PrunePorts,
} from "./prune-run";
import {
  createFakeR2,
  headedKeys,
  listStarts,
  type FakeR2,
} from "./testing/fake-r2";

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 9, 5, 6, 0, 0); // a Monday, 06:00 UTC: the prune's cron
const OLD = new Date(NOW - 40 * DAY); // past the 36-day gate
const YOUNG = new Date(NOW - 10 * DAY); // inside the lock

/** A v4-shaped uuid that sorts by `n`, so a fixture's listing order is readable. */
function uuid(n: number, block = 0): string {
  return `${block.toString(16).padStart(8, "0")}-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
}

const EVENT = uuid(1, 0xe);

function key(media: string, variant = "original.jpg", event = EVENT): string {
  return `events/${event}/photo/${media}/${variant}`;
}

type World = {
  backup: FakeR2;
  primary: FakeR2;
  /** Media ids that still have a row (the app's `media` table). */
  rows: Set<string>;
  confirmCalls: string[][];
  /** How the confirm route answers: as the route does, down, or naming an id it was never asked about. */
  confirm: "route" | "down" | "liar";
  /** Fail the confirm call with this index (0-based) and answer the rest as the route does. */
  failConfirmAt: number | null;
  clock: { t: number };
  /** Minutes the clock moves on every R2 call, to walk a run into its deadline. */
  tickPerCall: number;
  ports: PrunePorts;
};

function makeWorld(): World {
  const backup = createFakeR2([], { nowMs: NOW, lockMs: 35 * DAY });
  const primary = createFakeR2([], { nowMs: NOW });
  const w = {
    backup,
    primary,
    rows: new Set<string>(),
    confirmCalls: [] as string[][],
    confirm: "route" as World["confirm"],
    failConfirmAt: null as number | null,
    clock: { t: NOW },
    tickPerCall: 0,
  } as World;
  const tick = () => {
    w.clock.t += w.tickPerCall * 60_000;
  };
  const wrap = (bucket: FakeR2) => ({
    list: async (o: { prefix: string; startAfter?: string; limit: number }) => {
      tick();
      return bucket.list(o);
    },
    head: async (k: string) => {
      tick();
      return bucket.head(k);
    },
    delete: async (keys: string[]) => {
      tick();
      return bucket.delete(keys);
    },
  });
  w.ports = {
    backup: wrap(backup),
    primary: wrap(primary),
    now: () => w.clock.t,
    async confirm(ids): Promise<ConfirmAnswer> {
      const index = w.confirmCalls.length;
      w.confirmCalls.push([...ids]);
      if (w.confirm === "down" || w.failConfirmAt === index) {
        return { kind: "unavailable", detail: "HTTP 503" };
      }
      const gone = ids.filter((id) => !w.rows.has(id));
      if (gone.length > 0 && w.rows.size === 0) {
        return { kind: "trip", reason: "media_table_empty" };
      }
      if (w.confirm === "liar") {
        return { kind: "gone", goneIds: [...gone, uuid(999_999, 0xbad)] };
      }
      return { kind: "gone", goneIds: gone };
    },
  };
  return w;
}

/** A media item: its keys in the backup (always), the primary (when kept) and a row (when live). */
function addMedia(
  w: World,
  media: string,
  opts: {
    inPrimary?: boolean;
    row?: boolean;
    uploaded?: Date;
    variants?: string[];
    event?: string;
  } = {},
): string[] {
  const variants = opts.variants ?? ["original.jpg", "preview.webp"];
  const keys = variants.map((v) => key(media, v, opts.event));
  for (const k of keys) {
    w.backup.objects.set(k, { key: k, uploaded: opts.uploaded ?? OLD });
    if (opts.inPrimary) {
      w.primary.objects.set(k, { key: k, uploaded: opts.uploaded ?? OLD });
    }
  }
  if (opts.row) w.rows.add(media);
  return keys;
}

/** A live media item the backup holds alongside the primary: the bulk of any real backup. */
function addLive(w: World, media: string, opts: { event?: string } = {}) {
  return addMedia(w, media, { inPrimary: true, row: true, ...opts });
}

/** A media item that is gone: no row, no primary object, its backup copy past the gate. */
function addGone(
  w: World,
  media: string,
  opts: { event?: string; uploaded?: Date } = {},
) {
  return addMedia(w, media, { inPrimary: false, row: false, ...opts });
}

async function run(
  w: World,
  opts: {
    mode?: string;
    ledger?: PruneLedger;
    limits?: Partial<PruneLimits>;
    at?: number;
  } = {},
) {
  if (opts.at !== undefined) {
    w.clock.t = opts.at;
    w.backup.nowMs = opts.at;
  }
  return runPrune(w.ports, {
    mode: opts.mode ?? "live",
    ledger: opts.ledger ?? EMPTY_LEDGER,
    startedAtMs: w.clock.t,
    limits: opts.limits,
  });
}

const deletedKeys = (b: FakeR2) =>
  b.calls.flatMap((c) => (c.op === "delete" ? c.keys : []));

describe("the safety gates", () => {
  it("deletes nothing in a dry run and says what it would delete", async () => {
    const w = makeWorld();
    addLive(w, uuid(1));
    const gone = addGone(w, uuid(2));
    const result = await run(w, { mode: "dryrun" });
    expect(deletedKeys(w.backup)).toEqual([]);
    expect(w.backup.objects.size).toBe(4);
    expect(result.counts.would_delete_keys).toBe(gone.length);
    expect(result.counts.gone_media).toBe(1);
    expect(result.status).toBe("ok");
  });

  it("treats anything but the literal live as a dry run", async () => {
    for (const mode of ["dryrun", "", "LIVE", "Live", "live "]) {
      const w = makeWorld();
      addLive(w, uuid(1));
      addGone(w, uuid(2));
      await run(w, { mode });
      expect(deletedKeys(w.backup), mode).toEqual([]);
    }
  });

  it("deletes a backup key only when its row is gone AND the primary does not hold it", async () => {
    const w = makeWorld();
    addLive(w, uuid(1)); // row + primary: kept
    const both = addGone(w, uuid(2)); // no row, no primary: goes
    const rowOnly = addMedia(w, uuid(3), { row: true }); // row, no primary: kept
    const primaryOnly = addMedia(w, uuid(4), { inPrimary: true }); // primary, no row: kept
    await run(w);
    expect(deletedKeys(w.backup).sort()).toEqual([...both].sort());
    for (const k of [...rowOnly, ...primaryOnly]) {
      expect(w.backup.objects.has(k)).toBe(true);
    }
  });

  it("never asks the app about a media item the primary still holds", async () => {
    const w = makeWorld();
    for (let i = 1; i <= 50; i++) addLive(w, uuid(i));
    addGone(w, uuid(51));
    await run(w);
    expect(w.confirmCalls).toEqual([[uuid(51)]]);
  });

  it("keeps an item whose row exists though the primary lost it, and counts what the backup alone holds", async () => {
    const w = makeWorld();
    addLive(w, uuid(1));
    const orphaned = addMedia(w, uuid(2), { row: true });
    const result = await run(w);
    expect(deletedKeys(w.backup)).toEqual([]);
    expect(result.counts.primary_missing).toBe(orphaned.length);
  });

  it("never touches a key younger than 36 days, and so never tries a delete the lock would swallow", async () => {
    const w = makeWorld();
    addLive(w, uuid(1));
    const young = addGone(w, uuid(2), { uploaded: YOUNG });
    const justInside = addGone(w, uuid(3), {
      uploaded: new Date(NOW - 36 * DAY + 1),
    });
    const old = addGone(w, uuid(4));
    await run(w);
    expect(deletedKeys(w.backup).sort()).toEqual([...old].sort());
    for (const k of [...young, ...justInside]) {
      expect(w.backup.objects.has(k)).toBe(true);
    }
    expect(w.backup.lockedDeletes).toEqual([]);
    expect(w.confirmCalls.flat()).toEqual([uuid(4)]);
  });

  it("never touches a key it cannot recognize as ours", async () => {
    const w = makeWorld();
    addLive(w, uuid(1));
    const strays = [
      "events/_backup_drill/big.bin",
      `events/${EVENT}/photo/not-a-uuid/original.jpg`,
      `events/${EVENT}/photo/${uuid(5)}`,
      `events/${EVENT}/photo/${uuid(6)}/original.jpg/extra`,
    ];
    for (const k of strays) w.backup.objects.set(k, { key: k, uploaded: OLD });
    await run(w);
    expect(deletedKeys(w.backup)).toEqual([]);
    expect(w.confirmCalls).toEqual([]);
  });

  it("HEADs every key right before deleting it: an object the listing missed but the primary holds is kept", async () => {
    const w = makeWorld();
    addLive(w, uuid(1));
    const restored = addMedia(w, uuid(2), { inPrimary: true });
    // The listing does not show it (restored between the listing and the delete); the HEAD finds it.
    for (const k of restored) w.primary.hiddenFromList.add(k);
    const gone = addGone(w, uuid(3));
    await run(w);
    expect(deletedKeys(w.backup).sort()).toEqual([...gone].sort());
    expect(headedKeys(w.primary)).toEqual(
      expect.arrayContaining([...restored, ...gone]),
    );
    for (const k of restored) expect(w.backup.objects.has(k)).toBe(true);
  });

  it("keeps a whole item when a HEAD fails, and closes the run as an error", async () => {
    const w = makeWorld();
    addLive(w, uuid(1));
    const flaky = addGone(w, uuid(2));
    w.primary.failHead.add(flaky[1]);
    const gone = addGone(w, uuid(3));
    const result = await run(w);
    expect(deletedKeys(w.backup).sort()).toEqual([...gone].sort());
    for (const k of flaky) expect(w.backup.objects.has(k)).toBe(true);
    expect(result.status).toBe("error");
    expect(result.counts.checks_failed).toBe(1);
  });

  it("skips the run when the primary holds nothing, and leaves the ledger as it was", async () => {
    const w = makeWorld();
    addGone(w, uuid(1));
    w.rows.add(uuid(999)); // the table is not empty: only the bucket is
    const result = await run(w);
    expect(deletedKeys(w.backup)).toEqual([]);
    expect(w.confirmCalls).toEqual([]);
    expect(result.ledger).toBeNull();
  });
});

describe("fails closed: a doubt deletes nothing", () => {
  it("deletes nothing and keeps the cursor when the confirm route is unavailable", async () => {
    const w = makeWorld();
    addLive(w, uuid(1));
    addGone(w, uuid(2));
    w.confirm = "down";
    const result = await run(w, {
      ledger: { ...EMPTY_LEDGER, cursor: key(uuid(0)) },
    });
    expect(deletedKeys(w.backup)).toEqual([]);
    expect(result.status).toBe("error");
    expect(result.ledger).toBeNull();
  });

  it("deletes nothing when the app's breaker trips", async () => {
    const w = makeWorld();
    addMedia(w, uuid(1), { inPrimary: true }); // the primary holds something
    addGone(w, uuid(2));
    // ...but the table has no rows at all: media_table_empty
    const result = await run(w);
    expect(deletedKeys(w.backup)).toEqual([]);
    expect(result.status).toBe("error");
    expect(result.note).toMatch(/media_table_empty/);
  });

  it("deletes nothing when the confirm route names an item it was never asked about", async () => {
    const w = makeWorld();
    addLive(w, uuid(1));
    addGone(w, uuid(2));
    w.confirm = "liar";
    const result = await run(w);
    expect(deletedKeys(w.backup)).toEqual([]);
    expect(result.status).toBe("error");
    expect(result.ledger).toBeNull();
  });

  it("deletes nothing from earlier batches when a later confirm fails", async () => {
    const w = makeWorld();
    addLive(w, uuid(1));
    for (let i = 2; i <= 12; i++) addGone(w, uuid(i));
    w.failConfirmAt = 2;
    const result = await run(w, { limits: { confirmBatch: 4 } });
    expect(w.confirmCalls.length).toBe(3);
    expect(deletedKeys(w.backup)).toEqual([]);
    expect(result.status).toBe("error");
    expect(result.ledger).toBeNull();
  });

  it("stops rather than looping when the listing does not move past its cursor", async () => {
    const w = makeWorld();
    addLive(w, uuid(1));
    addGone(w, uuid(2));
    w.backup.pageCap = 2; // two keys a page, so the listing has a second page to get wrong
    const stuck = w.ports.backup.list;
    w.ports.backup.list = async (o) => stuck({ ...o, startAfter: undefined });
    const result = await run(w);
    expect(w.backup.calls.filter((c) => c.op === "list").length).toBeLessThan(
      5,
    );
    expect(result.status).toBe("error");
    expect(deletedKeys(w.backup)).toEqual([]);
  });
});

describe("the merge", () => {
  it("reads the primary over a backup page's whole range, however many of its pages that takes", async () => {
    const w = makeWorld();
    for (let i = 1; i <= 30; i++) addLive(w, uuid(i));
    // The primary also holds objects the backup has not copied yet, interleaved through the range.
    for (let i = 1; i <= 30; i++) {
      const k = key(uuid(i), "phone.jpg");
      w.primary.objects.set(k, { key: k, uploaded: OLD });
    }
    const gone = addGone(w, uuid(31));
    w.primary.pageCap = 7; // the range now spans many primary pages
    w.backup.pageCap = 25;
    const result = await run(w);
    expect(deletedKeys(w.backup).sort()).toEqual([...gone].sort());
    expect(w.confirmCalls.flat()).toEqual([uuid(31)]);
    expect(result.counts.absent_from_primary).toBe(2);
  });

  it("deletes nothing when the backup's listing comes back empty but unfinished", async () => {
    const w = makeWorld();
    addLive(w, uuid(1));
    addGone(w, uuid(2));
    w.ports.backup.list = async () => ({ objects: [], truncated: true });
    const result = await run(w);
    expect(result.status).toBe("error");
    expect(result.ledger).toBeNull();
    expect(deletedKeys(w.backup)).toEqual([]);
  });

  it("deletes nothing when the primary's listing does not move forward", async () => {
    const w = makeWorld();
    for (let i = 1; i <= 10; i++) addLive(w, uuid(i));
    addGone(w, uuid(11));
    w.primary.pageCap = 2;
    const real = w.ports.primary.list;
    let calls = 0;
    w.ports.primary.list = async (o) =>
      // The probe, then a listing that answers its first page whatever it is asked.
      ++calls === 1 ? real(o) : real({ ...o, startAfter: undefined });
    const result = await run(w);
    expect(result.status).toBe("error");
    expect(result.note).toMatch(/primary's listing did not move forward/);
    expect(deletedKeys(w.backup)).toEqual([]);
  });
});

describe("the cursor", () => {
  it("carries on where the last run stopped, never from the head", async () => {
    const w = makeWorld();
    for (let i = 1; i <= 2500; i++) addLive(w, uuid(i)); // 5,000 keys: five pages
    // The clock walks a minute an R2 call, so a four-minute deadline stops the run a page or two in.
    w.tickPerCall = 1;
    const stopped = await run(w, { limits: { deadlineMs: 4 * 60_000 } });
    expect(stopped.counts.stopped_early).toBe(true);
    expect(stopped.ledger?.cursor).toMatch(/^events\//);
    const resumeAt = stopped.ledger!.cursor!;
    w.backup.calls.length = 0;
    w.tickPerCall = 0;
    const next = await run(w, { ledger: stopped.ledger! });
    expect(listStarts(w.backup)[0]).toBe(resumeAt);
    expect(next.ledger?.cursor).toBeNull();
    expect(next.counts.pass_complete).toBe(true);
  });

  it("starts the next pass at the head once a pass reaches the end", async () => {
    const w = makeWorld();
    addLive(w, uuid(1));
    addGone(w, uuid(2));
    const done = await run(w, {
      ledger: { ...EMPTY_LEDGER, cursor: key(uuid(0)) },
    });
    expect(done.ledger?.cursor).toBeNull();
    w.backup.calls.length = 0;
    await run(w, { ledger: done.ledger! });
    expect(listStarts(w.backup)[0]).toBeUndefined();
  });

  it("deletes every prunable key exactly once across runs, and nothing else", async () => {
    const w = makeWorld();
    const expected: string[] = [];
    for (let i = 1; i <= 1200; i++) {
      if (i % 7 === 0) expected.push(...addGone(w, uuid(i)));
      else addLive(w, uuid(i));
    }
    let ledger: PruneLedger = EMPTY_LEDGER;
    for (let r = 0; r < 12; r++) {
      const result = await run(w, { ledger, limits: { deleteMedia: 25 } });
      ledger = result.ledger ?? ledger;
      if (ledger.cursor === null && result.counts.remaining === undefined)
        break;
    }
    const deleted = deletedKeys(w.backup);
    expect(new Set(deleted).size).toBe(deleted.length);
    expect([...deleted].sort()).toEqual([...expected].sort());
  });
});

describe("caps sized to the deletions", () => {
  it("drains a backlog far past the old 500 media in one run", async () => {
    const w = makeWorld();
    addLive(w, uuid(1));
    const gone: string[] = [];
    for (let i = 2; i <= 1501; i++) gone.push(...addGone(w, uuid(i)));
    const result = await run(w);
    expect(deletedKeys(w.backup).length).toBe(gone.length);
    expect(result.counts.gone_media).toBe(1500);
    expect(result.counts.stopped_early).toBeUndefined();
  });

  it("stops at its delete cap with a counted remaining, and the next run carries on from the first item it left", async () => {
    const w = makeWorld();
    addLive(w, uuid(1));
    for (let i = 2; i <= 26; i++) addGone(w, uuid(i));
    const first = await run(w, { limits: { deleteMedia: 10 } });
    expect(first.counts.gone_media).toBe(10);
    expect(deletedKeys(w.backup).length).toBe(20);
    expect(first.counts.stopped_early).toBe(true);
    expect(first.counts.remaining).toBeGreaterThan(0);
    // The next run starts right after the last key settled: just before the first item it did not reach.
    expect(first.ledger!.cursor).toBe(key(uuid(11), "preview.webp"));
    expect(first.counts.pass_complete).toBe(false);
    const second = await run(w, {
      ledger: first.ledger!,
      limits: { deleteMedia: 10 },
    });
    expect(second.counts.gone_media).toBe(10);
    const third = await run(w, {
      ledger: second.ledger!,
      limits: { deleteMedia: 10 },
    });
    expect(third.counts.gone_media).toBe(5);
    expect(third.ledger?.cursor).toBeNull();
    expect(w.backup.objects.size).toBe(2);
  });

  it("fills its delete cap exactly with six HEADs in flight, never short of it and never past it", async () => {
    for (const cap of [1, 5, 6, 7, 13]) {
      const w = makeWorld();
      addLive(w, uuid(1));
      for (let i = 2; i <= 40; i++) addGone(w, uuid(i));
      const result = await run(w, { limits: { deleteMedia: cap } });
      expect(result.counts.gone_media, `cap ${cap}`).toBe(cap);
      expect(deletedKeys(w.backup).length, `cap ${cap}`).toBe(cap * 2);
    }
  });

  it("stops at its deadline with the cursor where it stopped", async () => {
    const w = makeWorld();
    for (let i = 1; i <= 3000; i++) addLive(w, uuid(i)); // six pages of keys
    w.tickPerCall = 1;
    const result = await run(w, { limits: { deadlineMs: 3 * 60_000 } });
    expect(result.counts.stopped_early).toBe(true);
    expect(result.status).toBe("ok");
    expect(result.ledger?.cursor).toMatch(/^events\//);
    expect(result.ledger?.cursor).not.toBe(key(uuid(3000), "preview.webp"));
  });

  it("stops inside its subrequest budget, never past it", async () => {
    const w = makeWorld();
    for (let i = 1; i <= 3000; i++) addLive(w, uuid(i));
    for (let i = 3001; i <= 3040; i++) addGone(w, uuid(i));
    const budget = 9;
    let calls = 0;
    const count = <T extends (...a: never[]) => unknown>(fn: T) =>
      ((...a: Parameters<T>) => {
        calls += 1;
        return fn(...a);
      }) as T;
    w.ports.backup.list = count(w.ports.backup.list);
    w.ports.backup.head = count(w.ports.backup.head);
    w.ports.backup.delete = count(w.ports.backup.delete);
    w.ports.primary.list = count(w.ports.primary.list);
    w.ports.primary.head = count(w.ports.primary.head);
    w.ports.confirm = count(w.ports.confirm);
    const result = await run(w, { limits: { subrequests: budget + 3 } });
    expect(calls).toBeLessThanOrEqual(budget + 3);
    expect(result.counts.stopped_early).toBe(true);
  });

  it("deletes in calls of at most 1,000 keys", async () => {
    const w = makeWorld();
    addLive(w, uuid(1));
    for (let i = 2; i <= 1101; i++) addGone(w, uuid(i)); // 2,200 keys
    await run(w);
    const sizes = w.backup.calls.flatMap((c) =>
      c.op === "delete" ? [c.keys.length] : [],
    );
    expect(sizes.reduce((a, b) => a + b, 0)).toBe(2200);
    expect(Math.max(...sizes)).toBeLessThanOrEqual(1000);
  });
});

describe("the hold: a backlog far over the usual waits a week", () => {
  const backlog = PRUNE_HOLD_FLOOR_MEDIA + 1;

  function bigWorld() {
    const w = makeWorld();
    addLive(w, uuid(1));
    for (let i = 2; i <= backlog + 1; i++) {
      addGone(w, uuid(i), { event: uuid(1, 0xf), uploaded: OLD });
    }
    return w;
  }

  it("deletes nothing on the run that finds it, reads Needs a look, and keeps its cursor", async () => {
    const w = bigWorld();
    const ledger: PruneLedger = {
      ...EMPTY_LEDGER,
      cursor: null,
      history: [{ atMs: NOW - 7 * DAY, goneMedia: 12, live: true }],
    };
    const result = await run(w, { ledger });
    expect(deletedKeys(w.backup)).toEqual([]);
    expect(result.counts.breaker_tripped).toBe(true);
    expect(result.counts.remaining).toBe(backlog * 2);
    expect(result.status).toBe("ok");
    expect(result.ledger?.hold).toEqual({ sinceMs: NOW, goneMedia: backlog });
    expect(result.ledger?.cursor).toBeNull();
  });

  it("goes ahead on a run at least six days after the hold began", async () => {
    const w = bigWorld();
    const held: PruneLedger = {
      ...EMPTY_LEDGER,
      hold: { sinceMs: NOW - PRUNE_HOLD_RELEASE_MS, goneMedia: backlog },
    };
    const result = await run(w, { ledger: held });
    expect(deletedKeys(w.backup).length).toBe(backlog * 2);
    expect(result.ledger?.hold).toBeNull();
  });

  it("keeps holding a run that comes sooner", async () => {
    const w = bigWorld();
    const held: PruneLedger = {
      ...EMPTY_LEDGER,
      hold: { sinceMs: NOW - 2 * DAY, goneMedia: backlog },
    };
    const result = await run(w, { ledger: held });
    expect(deletedKeys(w.backup)).toEqual([]);
    expect(result.ledger?.hold?.sinceMs).toBe(NOW - 2 * DAY);
  });

  it("reports in a dry run that a live run would hold, without setting a hold", async () => {
    const w = bigWorld();
    const result = await run(w, { mode: "dryrun" });
    expect(result.counts.would_hold).toBe(true);
    expect(result.counts.breaker_tripped).toBeUndefined();
    expect(result.ledger?.hold).toBeNull();
  });

  it("records every run's backlog, dry or live, as the usual the next runs judge by", async () => {
    const w = makeWorld();
    addLive(w, uuid(1));
    addGone(w, uuid(2));
    const result = await run(w, { mode: "dryrun" });
    expect(result.ledger?.history).toEqual([
      { atMs: NOW, goneMedia: 1, live: false },
    ]);
  });
});

describe("readConfirmAnswer: the confirm route's answer, read strictly", () => {
  it("reads the route's two shapes", () => {
    expect(
      readConfirmAnswer({ trip: false, goneIds: ["a"], mediaCount: 3 }),
    ).toEqual({
      kind: "gone",
      goneIds: ["a"],
    });
    expect(
      readConfirmAnswer({ trip: true, reason: "media_table_empty" }),
    ).toEqual({
      kind: "trip",
      reason: "media_table_empty",
    });
  });

  it("never reads anything else as a list of gone items", () => {
    for (const body of [
      null,
      "ok",
      [],
      {},
      { trip: false },
      { trip: false, goneIds: "a" },
      { trip: false, goneIds: [1, 2] },
      { trip: "false", goneIds: ["a"] },
      { goneIds: ["a"] },
    ]) {
      expect(readConfirmAnswer(body).kind, JSON.stringify(body)).toBe(
        "unavailable",
      );
    }
  });
});
