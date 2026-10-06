/**
 * THE RECONCILE ON FAKE BUCKETS (durability-backups.md, "The reconcile"): the media backup's daily backstop, driven
 * against two in-memory buckets, a copy that behaves as backupOne does, a stand-in for the app's named question that
 * answers from the keys live rows name, and the lone copies' table on Node's own SQLite.
 *
 * The rules, each with its test: a run is two listings merged a thousand keys at a time, never a HEAD per object; it
 * copies exactly what the backup lacks and says, never overwrites, a key whose copies differ; it fits its invocation
 * and carries on by cursor when it cannot; the young keys the backup alone holds, that a live row names, are counted
 * and kept for the restore; and a run that stops early or errs says so.
 */
import { describe, expect, it, vi } from "vitest";

import { createLoneStore, type LoneStore } from "./lone-store";
import { PRIMARY_MISSING_KEY } from "./prune-run";
import {
  EMPTY_RECONCILE_LEDGER,
  parseReconcileLedger,
  type ReconcileLedger,
} from "./reconcile-ledger";
import {
  RECONCILE_COUNT_KEYS,
  RECONCILE_LIMITS,
  copiesDiffer,
  runReconcile,
  type CopyOutcome,
  type ReconcileBucket,
  type ReconcileLimits,
  type ReconcileListed,
  type ReconcilePorts,
} from "./reconcile-run";
import { runRestore } from "./restore-run";
import { COPY_PART_BYTES, SINGLE_PUT_MAX_BYTES, partRanges } from "./strategy";
import { createFakeR2, putCalls, type FakeR2 } from "./testing/fake-r2";
import { openDb, sqlOf, transactionOf } from "./testing/sqlite";

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 9, 5, 5, 0, 0); // 05:00 UTC: the reconcile's cron
const YOUNG = new Date(NOW - 10 * DAY); // inside the prune's 36-day gate
const OLD = new Date(NOW - 40 * DAY); // past it

/** A v4-shaped uuid that sorts by `n`, so a fixture's listing order is readable. */
function uuid(n: number, block = 0): string {
  return `${block.toString(16).padStart(8, "0")}-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
}

const EVENT = uuid(1, 0xe);

function key(media: string, variant = "original.jpg", event = EVENT): string {
  return `events/${event}/photo/${media}/${variant}`;
}

/** An MD5's 32 hex digits, distinct per seed: a single upload's etag. */
function md5(seed: number): string {
  return seed.toString(16).padStart(32, "0");
}

type World = {
  primary: FakeR2;
  backup: FakeR2;
  /** Keys a live row names (the app's `mediaKeysOf`). */
  named: Set<string>;
  namedCalls: string[][];
  namedDown: boolean;
  copies: string[];
  copyFails: Set<string>;
  clock: { t: number };
  /** Milliseconds the clock moves on every list call, copy and part. */
  listMs: number;
  copyMs: number;
  partMs: number;
  table: LoneStore;
  ports: ReconcilePorts;
};

async function makeWorld(): Promise<World> {
  const db = await openDb();
  const w = {
    primary: createFakeR2([], { nowMs: NOW }),
    backup: createFakeR2([], { nowMs: NOW, lockMs: 35 * DAY }),
    named: new Set<string>(),
    namedCalls: [] as string[][],
    namedDown: false,
    copies: [] as string[],
    copyFails: new Set<string>(),
    clock: { t: NOW },
    listMs: 0,
    copyMs: 0,
    partMs: 0,
    table: createLoneStore(sqlOf(db), transactionOf(db)),
  } as World;
  const listing = (bucket: FakeR2): ReconcileBucket => ({
    async list(o) {
      w.clock.t += w.listMs;
      return bucket.list(o);
    },
  });
  w.ports = {
    primary: listing(w.primary),
    backup: listing(w.backup),
    // backupOne, over the fakes: a HEAD of the backup first, the source's GET, then the put (part by part past
    // 100 MiB, `keepGoing` asked before each, exactly as index.ts does).
    async copy(k, size, keepGoing): Promise<CopyOutcome> {
      w.copies.push(k);
      w.clock.t += w.copyMs;
      if (w.copyFails.has(k)) throw new Error("R2 is unavailable");
      if (w.backup.objects.has(k)) return "exists";
      const src = w.primary.objects.get(k);
      if (!src) return "missing";
      if (size > SINGLE_PUT_MAX_BYTES) {
        for (const _ of partRanges(size, COPY_PART_BYTES)) {
          if (!keepGoing()) return "deferred";
          w.clock.t += w.partMs;
        }
      }
      w.backup.objects.set(k, { ...src, uploaded: new Date(w.clock.t) });
      return "copied";
    },
    async named(keys) {
      w.namedCalls.push([...keys]);
      if (w.namedDown) return { kind: "unavailable", detail: "HTTP 503" };
      return { kind: "named", named: keys.filter((k) => w.named.has(k)) };
    },
    lone: {
      async settle(walk) {
        if (!walk) return { held: w.table.tally().keys, added: 0 };
        const after = w.table.settle(walk, w.clock.t);
        return { held: after.keys, added: after.added };
      },
    },
    now: () => w.clock.t,
  };
  return w;
}

/** An object in both buckets, as the live queue left it: same size, same checksum. */
function addBacked(
  w: World,
  k: string,
  opts: { size?: number; etag?: string; uploaded?: Date } = {},
): void {
  const obj = {
    key: k,
    uploaded: opts.uploaded ?? OLD,
    size: opts.size ?? 1000,
    etag: opts.etag ?? md5(k.length + (opts.size ?? 1000)),
  };
  w.primary.objects.set(k, obj);
  w.backup.objects.set(k, { ...obj });
}

/** An object in the primary that the backup never got (a missed notification, a dead letter). */
function addMissed(w: World, k: string, size = 1000): void {
  w.primary.objects.set(k, { key: k, uploaded: YOUNG, size, etag: md5(size) });
}

/** A key the backup holds and the primary does not (a purged item's, or a lone copy). */
function addBackupOnly(w: World, k: string, uploaded: Date = YOUNG): void {
  w.backup.objects.set(k, { key: k, uploaded, size: 1000, etag: md5(7) });
}

function run(
  w: World,
  opts: {
    ledger?: ReconcileLedger;
    limits?: Partial<ReconcileLimits>;
    restoreMode?: "on" | "dryrun" | "off";
  } = {},
) {
  return runReconcile(w.ports, {
    ledger: opts.ledger ?? EMPTY_RECONCILE_LEDGER,
    startedAtMs: w.clock.t,
    restoreMode: opts.restoreMode,
    limits: opts.limits,
  });
}

function listCalls(bucket: FakeR2): number {
  return bucket.calls.filter((c) => c.op === "list").length;
}

/** Silence the logs a test means to provoke, and hand them back for a look. */
function quietly<T>(fn: () => Promise<T>): Promise<T> {
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  return fn().finally(() => {
    error.mockRestore();
    log.mockRestore();
  });
}

describe("the card's keys", () => {
  it("pins the keys the card reads (src/app/admin/jobs/reconcile-view.ts asserts the same strings)", () => {
    expect(RECONCILE_COUNT_KEYS).toEqual({
      checked: "checked",
      copied: "copied",
      failed: "failed",
      tooLarge: "too_large",
      copiesLeft: "copies_left",
      mismatched: "mismatched",
      absent: "absent_from_primary",
      youngAbsent: "young_absent",
      loneFound: "lone_found",
      loneUnjudged: "lone_unjudged",
      passComplete: "pass_complete",
      passWalked: "pass_walked",
      passStartedAt: "pass_started_at",
      lastPassAt: "last_pass_at",
      lastPassWalked: "last_pass_walked",
      stoppedEarly: "stopped_early",
      breakerTripped: "breaker_tripped",
    });
    // And the lone copies' count the prune and the restore report under: one reading, three sources.
    expect(PRIMARY_MISSING_KEY).toBe("primary_missing");
  });
});

describe("copiesDiffer", () => {
  it("compares size always, and a checksum only when both are a single upload's MD5", () => {
    expect(
      copiesDiffer({ size: 5, etag: md5(1) }, { size: 6, etag: md5(1) }),
    ).toBe("size");
    expect(
      copiesDiffer({ size: 5, etag: md5(1) }, { size: 5, etag: md5(2) }),
    ).toBe("checksum");
    expect(
      copiesDiffer({ size: 5, etag: `"${md5(1)}"` }, { size: 5, etag: md5(1) }),
    ).toBeNull();
    // The backup copies a large object in its own 32 MiB parts: the same bytes, a different multipart etag.
    expect(
      copiesDiffer(
        { size: 5, etag: `${md5(3)}-24` },
        { size: 5, etag: `${md5(4)}-5` },
      ),
    ).toBeNull();
    expect(
      copiesDiffer({ size: 5, etag: md5(3) }, { size: 5, etag: `${md5(4)}-2` }),
    ).toBeNull();
  });
});

/**
 * ★ A LISTING MERGE, NOT A HEAD PER OBJECT (backup-reconcile item 1). On the old code every one of the primary's
 * objects took a HEAD of the backup (backupOne's presence check): 3,419 objects, 3,419 HEADs, 715 s on 2026-10-04, and
 * the next day's run cut off by the platform before it could report.
 */
describe("the merge", () => {
  it("★ compares 3,419 backed-up objects in eight listings and not one copy or HEAD", async () => {
    const w = await makeWorld();
    for (let i = 0; i < 3_419; i++) addBacked(w, key(uuid(i)));
    const result = await run(w);
    expect(w.copies).toEqual([]);
    expect(w.backup.calls.some((c) => c.op === "head")).toBe(false);
    // Four pages a side, and the probe of the primary.
    expect(listCalls(w.primary)).toBe(5);
    expect(listCalls(w.backup)).toBe(4);
    expect(result.status).toBe("ok");
    expect(result.counts).toMatchObject({
      checked: 3_419,
      copied: 0,
      pass_complete: true,
      pass_walked: 3_419,
      subrequests: 10,
    });
    expect(result.note).toBe(
      "The pass reached the end: 3,419 keys compared with the backup's, every one backed up.",
    );
  });

  it("copies exactly the keys the backup lacks, and nothing it holds", async () => {
    const w = await makeWorld();
    addBacked(w, key(uuid(1)));
    addMissed(w, key(uuid(2)));
    addBacked(w, key(uuid(3)));
    addMissed(w, key(uuid(4), "preview.webp"));
    const result = await quietly(() => run(w));
    expect(w.copies).toEqual([key(uuid(2)), key(uuid(4), "preview.webp")]);
    expect(w.backup.objects.has(key(uuid(2)))).toBe(true);
    expect(result.counts).toMatchObject({ checked: 4, copied: 2 });
    expect(result.note).toMatch(
      /^The pass reached the end: 4 keys compared with the backup's, 2 copied that the live queue missed\.$/,
    );
  });

  it("copies a key outside our layout the backup lacks, as the old reconcile did, and never judges one as lone", async () => {
    const w = await makeWorld();
    addBacked(w, key(uuid(1)));
    addMissed(w, "events/_drill/x");
    addBackupOnly(w, "events/_drill/y");
    const result = await quietly(() => run(w));
    expect(w.copies).toEqual(["events/_drill/x"]);
    expect(w.namedCalls).toEqual([]);
    expect(result.counts.absent_from_primary).toBe(1);
    expect("young_absent" in result.counts).toBe(false);
  });

  it("★ says a key whose copies differ and never overwrites it: the run reads Needs a look", async () => {
    const w = await makeWorld();
    const k = key(uuid(1));
    // The primary rewritten in place after the backup took it (the EXIF backfill of 2026-07-03 did exactly this).
    w.primary.objects.set(k, {
      key: k,
      uploaded: OLD,
      size: 2_744_175,
      etag: md5(1),
    });
    w.backup.objects.set(k, {
      key: k,
      uploaded: OLD,
      size: 2_755_644,
      etag: md5(2),
    });
    // A large video: the same bytes, multipart etags in each side's own parts.
    const v = key(uuid(2), "original.mp4");
    w.primary.objects.set(v, {
      key: v,
      uploaded: OLD,
      size: 300e6,
      etag: `${md5(5)}-30`,
    });
    w.backup.objects.set(v, {
      key: v,
      uploaded: OLD,
      size: 300e6,
      etag: `${md5(6)}-9`,
    });
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const result = await run(w);
      expect(w.copies).toEqual([]);
      expect(putCalls(w.backup)).toEqual([]);
      expect(result.counts).toMatchObject({
        mismatched: 1,
        breaker_tripped: true,
      });
      expect(result.status).toBe("ok");
      expect(result.note).toMatch(
        /1 key differs between the buckets \(size or checksum\): left as they are, never overwritten; this run's log names each\./,
      );
      expect(logged).toHaveBeenCalledWith(
        "reconcile: the two copies differ; left as they are, never overwritten",
        { key: k, why: "size", primarySize: 2_744_175, backupSize: 2_755_644 },
      );
    } finally {
      logged.mockRestore();
    }
  });

  it("counts a copy that throws, closes as an error, and walks on to copy the rest", async () => {
    const w = await makeWorld();
    addMissed(w, key(uuid(1)));
    addMissed(w, key(uuid(2)));
    w.copyFails.add(key(uuid(1)));
    const result = await quietly(() => run(w));
    expect(result.status).toBe("error");
    expect(result.counts).toMatchObject({
      copied: 1,
      failed: 1,
      pass_complete: true,
    });
    expect(result.note).toMatch(
      /1 key failed to copy \(Error: R2 is unavailable\): the next pass tries again\./,
    );
  });

  it("reads a key the live queue copied in between, or one deleted in between, as no failure", async () => {
    const w = await makeWorld();
    addMissed(w, key(uuid(1)));
    addMissed(w, key(uuid(2)));
    const base = w.ports.copy;
    w.ports.copy = async (k, size, keepGoing) => {
      if (k === key(uuid(1)))
        w.backup.objects.set(k, w.primary.objects.get(k)!);
      if (k === key(uuid(2))) w.primary.objects.delete(k);
      return base(k, size, keepGoing);
    };
    const result = await quietly(() => run(w));
    expect(result.status).toBe("ok");
    expect(result.counts.copied).toBe(0);
  });

  it("closes a pass over two empty buckets as a reading of nothing, never a doubt", async () => {
    const w = await makeWorld();
    const result = await run(w);
    expect(result.status).toBe("ok");
    expect(result.counts).toMatchObject({ checked: 0, pass_complete: true });
  });

  it("★ trusts nothing to an empty primary beside a full backup: copies and judges nothing, keeps the ledger, errs", async () => {
    const w = await makeWorld();
    addBackupOnly(w, key(uuid(1)));
    w.named.add(key(uuid(1)));
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const result = await run(w);
      expect(result.status).toBe("error");
      expect(result.ledger).toBeNull();
      expect(w.namedCalls).toEqual([]);
      expect(w.table.tally().keys).toBe(0);
      expect(result.note).toMatch(/^The primary lists nothing under events\//);
    } finally {
      logged.mockRestore();
    }
  });

  it("aborts on a listing that does not move forward, keeping the ledger and the table", async () => {
    const w = await makeWorld();
    for (let i = 0; i < 1_500; i++) addBacked(w, key(uuid(i)));
    w.table.settle(
      {
        after: null,
        through: null,
        found: [{ key: key(uuid(9_999)), uploadedMs: YOUNG.getTime() }],
        judged: { side: "young", cutMs: NOW - 36 * DAY },
      },
      NOW,
    );
    const real = w.ports.backup.list.bind(w.ports.backup);
    let calls = 0;
    w.ports.backup.list = async (o) => {
      calls += 1;
      // The second page starts over at the head.
      return real(calls === 2 ? { ...o, startAfter: undefined } : o);
    };
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const result = await run(w);
      expect(result.status).toBe("error");
      expect(result.ledger).toBeNull();
      expect(result.note).toBe("The backup's listing did not move forward.");
      expect(w.table.tally().keys).toBe(1);
    } finally {
      logged.mockRestore();
    }
  });
});

/**
 * ★ IT FITS ITS INVOCATION, AND CARRIES ON WHEN IT CANNOT (item 1). The old reconcile restarted at the head every run
 * with a 5,000-object cap, so past the cap the tail was never examined (its "next run continues" was false), and a
 * HEAD per object made the 15-minute cut long before.
 */
describe("the deadline, the budget and the cursor", () => {
  it("★ stops at its deadline with a cursor at the first key it did not finish, and the next run carries the pass to the end, every key compared once", async () => {
    const w = await makeWorld();
    for (let i = 0; i < 5_000; i++) addBacked(w, key(uuid(i)));
    for (const i of [1_200, 3_300, 4_800]) addMissed(w, key(uuid(i, 1)));
    w.listMs = 60_000; // a minute a listing walks the run into its deadline a few pages in
    const first = await quietly(() =>
      run(w, { limits: { deadlineMs: 4 * 60_000 } }),
    );
    expect(first.counts.stopped_early).toBe(true);
    expect(first.counts.pass_complete).toBe(false);
    expect(first.status).toBe("ok");
    expect(first.ledger?.cursor).not.toBeNull();
    expect(first.note).toMatch(
      /^Stopped at its deadline with [\d,]+ keys compared so far this pass; the next run carries on\.$/,
    );

    let ledger = first.ledger!;
    let walked = first.counts.checked as number;
    let copied = first.counts.copied as number;
    for (let runs = 0; runs < 10 && ledger.cursor !== null; runs++) {
      w.clock.t += DAY;
      const next = await quietly(() =>
        run(w, { ledger, limits: { deadlineMs: 4 * 60_000 } }),
      );
      walked += next.counts.checked as number;
      copied += next.counts.copied as number;
      ledger = next.ledger!;
      if (next.counts.pass_complete) {
        expect(next.counts.pass_walked).toBe(5_003);
        expect(next.counts.pass_started_at).toBe(new Date(NOW).toISOString());
        expect(next.counts.last_pass_walked).toBe(5_003);
      }
    }
    expect(ledger.cursor).toBeNull();
    expect(ledger.last?.walked).toBe(5_003);
    expect(walked).toBe(5_003);
    expect(copied).toBe(3);
  });

  it("stops at its subrequest budget the same way, never dying of too many", async () => {
    const w = await makeWorld();
    for (let i = 0; i < 4_000; i++) addBacked(w, key(uuid(i)));
    const result = await run(w, { limits: { subrequests: 5 } });
    expect(result.counts.stopped_early).toBe(true);
    expect(result.counts.subrequests).toBeLessThanOrEqual(5);
    expect(result.note).toMatch(/^Stopped at its subrequest budget/);
  });

  it("rewinds the cursor to the first copy it could not make, and the next run makes it", async () => {
    const w = await makeWorld();
    for (let i = 0; i < 10; i++) addMissed(w, key(uuid(i)));
    w.copyMs = 60_000;
    const first = await quietly(() =>
      run(w, { limits: { deadlineMs: 4 * 60_000, copyConcurrency: 1 } }),
    );
    expect(first.counts.copied).toBe(4);
    expect(first.counts.copies_left).toBe(6);
    expect(first.ledger?.cursor).toBe(key(uuid(3)));
    expect(first.counts.checked).toBe(4);
    w.copyMs = 0;
    const second = await quietly(() => run(w, { ledger: first.ledger! }));
    expect(second.counts).toMatchObject({
      copied: 6,
      checked: 6,
      pass_complete: true,
      pass_walked: 10,
    });
  });

  it("defers a multipart copy that would outrun the run to the next, which starts with it", async () => {
    const w = await makeWorld();
    addMissed(w, key(uuid(1)));
    const big = key(uuid(2), "original.mp4");
    addMissed(w, big, 4 * COPY_PART_BYTES + 1);
    w.copyMs = 3 * 60_000; // the first copy takes the run past its early window
    w.partMs = 60_000;
    const first = await quietly(() =>
      run(w, {
        limits: {
          deadlineMs: 6 * 60_000,
          partHorizonMs: 5 * 60_000,
          copyConcurrency: 1,
        },
      }),
    );
    expect(first.counts).toMatchObject({
      copied: 1,
      copies_left: 1,
      stopped_early: true,
    });
    expect(first.ledger?.cursor).toBe(key(uuid(1)));
    expect(w.backup.objects.has(big)).toBe(false);
    w.copyMs = 0;
    const second = await quietly(() =>
      run(w, {
        ledger: first.ledger!,
        limits: { deadlineMs: 6 * 60_000, partHorizonMs: 5 * 60_000 },
      }),
    );
    expect(second.counts).toMatchObject({ copied: 1, pass_complete: true });
    expect(w.backup.objects.has(big)).toBe(true);
  });

  it("★ says a copy past one run's reach, errs, walks past it, and never spends another pass's run on it", async () => {
    const w = await makeWorld();
    const huge = key(uuid(1), "original.mp4");
    addMissed(w, huge, 40 * COPY_PART_BYTES);
    addMissed(w, key(uuid(2)));
    w.partMs = 60_000;
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      // It starts at the run's head, copies parts until the part horizon, and aborts: no run could finish it.
      const first = await run(w, { limits: { copyConcurrency: 1 } });
      expect(first.status).toBe("error");
      expect(first.counts).toMatchObject({ too_large: 1, stopped_early: true });
      expect(first.ledger?.cursor).toBe(huge);
      expect(first.ledger?.tooLarge).toEqual([
        { key: huge, size: 40 * COPY_PART_BYTES },
      ]);
      expect(first.note).toMatch(
        /1 key is past one run's copy reach: copy by hand; this run's log names each\./,
      );
      expect(logged).toHaveBeenCalledWith(
        "reconcile: past one run's copy reach; copy it by hand",
        { key: huge, bytes: 40 * COPY_PART_BYTES },
      );
      // The next run carries on past it and ends the pass.
      w.clock.t += DAY;
      const second = await run(w, { ledger: first.ledger! });
      expect(second.counts).toMatchObject({ copied: 1, pass_complete: true });
      // The pass after says it again, and never tries it.
      w.clock.t += DAY;
      w.copies.length = 0;
      const third = await run(w, { ledger: second.ledger! });
      expect(w.copies).toEqual([]);
      expect(third.status).toBe("error");
      expect(third.counts).toMatchObject({ too_large: 1, pass_complete: true });
      // Copied by hand, it leaves the list.
      w.backup.objects.set(huge, { ...w.primary.objects.get(huge)! });
      w.clock.t += DAY;
      const fourth = await run(w, { ledger: third.ledger! });
      expect(fourth.status).toBe("ok");
      expect(fourth.ledger?.tooLarge).toEqual([]);
    } finally {
      logged.mockRestore();
    }
  });

  it("calls a run that settled nothing no progress: an error, the ledger left as it was", async () => {
    const w = await makeWorld();
    for (let i = 0; i < 2_000; i++) addBacked(w, key(uuid(i)));
    const ledger: ReconcileLedger = {
      v: 1,
      cursor: key(uuid(500)),
      pass: { startedAtMs: NOW - DAY, walked: 501 },
      last: { atMs: NOW - 3 * DAY, walked: 1_990 },
      tooLarge: [],
    };
    // The probe alone fits the budget: no page is ever listed.
    const result = await run(w, { ledger, limits: { subrequests: 1 } });
    expect(result.status).toBe("error");
    expect(result.ledger).toBeNull();
    expect(result.note).toMatch(
      /^It made no progress: stopped at its subrequest budget/,
    );
    expect(result.counts).toMatchObject({
      pass_walked: 501,
      pass_started_at: new Date(NOW - DAY).toISOString(),
      last_pass_at: new Date(NOW - 3 * DAY).toISOString(),
      last_pass_walked: 1_990,
    });
  });
});

/**
 * ★ THE YOUNG LONE COPIES (item 2): a key the backup holds, the primary lost and a live row still names, younger than
 * the prune's 36-day gate. On the old code nothing looked at them until the gate (the prune judges past it only), so a
 * primary object lost in its first five weeks waited that long to be counted and restored.
 */
describe("the young lone copies", () => {
  it("★ counts the young keys a live row names, keeps them for the restore, reports the whole table and asks for a pass", async () => {
    const w = await makeWorld();
    addBacked(w, key(uuid(1)));
    const lone = key(uuid(2));
    const purged = key(uuid(3)); // a deleted item's key: no row names it
    addBackupOnly(w, lone);
    addBackupOnly(w, purged);
    w.named.add(lone);
    // An old lone copy the prune already holds stays, and counts in the whole.
    w.table.walk(
      {
        after: null,
        through: null,
        found: [key(uuid(9))],
        judged: { side: "old", cutMs: NOW - 36 * DAY },
      },
      NOW - DAY,
    );
    const result = await quietly(() => run(w, { restoreMode: "dryrun" }));
    expect(w.namedCalls).toEqual([[lone, purged]]);
    expect(w.table.page(null, 10)).toEqual([lone, key(uuid(9))]);
    expect(result.counts).toMatchObject({
      absent_from_primary: 2,
      young_absent: 2,
      lone_found: 1,
      [PRIMARY_MISSING_KEY]: 2,
      restore_mode: "dryrun",
    });
    expect(result.askRestore).toBe(true);
    const lines = result.note.split(". ");
    expect(lines[1]).toBe(
      "1 young key is held by the backup alone: its row names it, its primary object is gone",
    );
    expect(result.note).toMatch(
      /The restore is in dry run, so it copies nothing until RESTORE_MODE is on; this run's log names each\./,
    );
  });

  it("leaves a key past the gate to the prune: never asked about, never kept", async () => {
    const w = await makeWorld();
    addBacked(w, key(uuid(1)));
    addBackupOnly(w, key(uuid(2)), OLD);
    w.named.add(key(uuid(2)));
    const result = await run(w);
    expect(w.namedCalls).toEqual([]);
    expect(w.table.tally().keys).toBe(0);
    expect(result.counts).toMatchObject({
      absent_from_primary: 1,
      lone_found: 0,
      [PRIMARY_MISSING_KEY]: 0,
    });
    expect(result.askRestore).toBe(false);
  });

  it("asks the app a thousand keys at a time", async () => {
    const w = await makeWorld();
    addBacked(w, key(uuid(0)));
    for (let i = 1; i <= 2_500; i++) addBackupOnly(w, key(uuid(i)));
    await run(w);
    expect(w.namedCalls.map((c) => c.length)).toEqual([1_000, 1_000, 500]);
  });

  it("drops a young copy that came back to the primary, and asks for no pass for one it already held", async () => {
    const w = await makeWorld();
    addBacked(w, key(uuid(1)));
    const a = key(uuid(2));
    const b = key(uuid(3));
    addBackupOnly(w, a);
    addBackupOnly(w, b);
    w.named.add(a).add(b);
    await quietly(() => run(w));
    expect(w.table.page(null, 10)).toEqual([a, b]);
    // `a` is put back in the primary; `b` still lone.
    w.primary.objects.set(a, { ...w.backup.objects.get(a)! });
    w.clock.t += DAY;
    const next = await quietly(() => run(w));
    expect(w.table.page(null, 10)).toEqual([b]);
    expect(next.counts[PRIMARY_MISSING_KEY]).toBe(1);
    expect(next.askRestore).toBe(false);
  });

  it("★ hands them to the restore, whose own guards copy back exactly the named keys", async () => {
    const w = await makeWorld();
    addBacked(w, key(uuid(1)));
    const lone = key(uuid(2));
    addBackupOnly(w, lone);
    w.named.add(lone);
    await quietly(() => run(w, { restoreMode: "on" }));
    const restored = await quietly(() =>
      runRestore(
        {
          backup: {
            head: async (k) => {
              const obj = await w.backup.head(k);
              return obj ? { size: obj.size ?? 0 } : null;
            },
            get: (k) => w.backup.get(k),
          },
          primary: {
            head: (k) => w.primary.head(k),
            put: (k, body, options) => w.primary.put(k, body, options as never),
          },
          named: w.ports.named,
          keys: (after, limit) => w.table.page(after, limit),
          resolve: (keys) => {
            w.table.resolve(keys);
          },
          countAfter: (after) => w.table.countAfter(after),
          now: () => w.clock.t,
        },
        { mode: "on" },
      ),
    );
    expect(restored.counts).toMatchObject({ restored: 1 });
    expect(w.primary.objects.has(lone)).toBe(true);
    expect(putCalls(w.primary)).toEqual([
      expect.objectContaining({ key: lone, condition: "*", stored: true }),
    ]);
    expect(w.table.tally().keys).toBe(0);
  });

  it("★ says it could not ask, keeps the table as it was where it could not judge, and errs", async () => {
    const w = await makeWorld();
    addBacked(w, key(uuid(1)));
    const held = key(uuid(2));
    addBackupOnly(w, held);
    w.table.settle(
      {
        after: null,
        through: null,
        found: [{ key: held, uploadedMs: YOUNG.getTime() }],
        judged: { side: "young", cutMs: NOW - 36 * DAY },
      },
      NOW - DAY,
    );
    w.namedDown = true;
    const result = await run(w);
    expect(result.status).toBe("error");
    expect(w.table.page(null, 10)).toEqual([held]);
    expect(result.counts).toMatchObject({
      lone_unjudged: 1,
      [PRIMARY_MISSING_KEY]: 1,
      pass_complete: true,
    });
    expect(result.note).toMatch(
      /Could not ask the app which young keys a live row names \(HTTP 503\), so 1 young key wait for the next pass\./,
    );
  });

  it("reports no count at all without the table: a count of its own young keys would read as the whole backup's", async () => {
    const w = await makeWorld();
    addBacked(w, key(uuid(1)));
    addBackupOnly(w, key(uuid(2)));
    w.named.add(key(uuid(2)));
    delete w.ports.lone;
    const result = await quietly(() => run(w));
    expect(PRIMARY_MISSING_KEY in result.counts).toBe(false);
    expect(result.counts.lone_found).toBe(1);
  });

  it("errs, and says where to look, when the table cannot be written", async () => {
    const w = await makeWorld();
    addBacked(w, key(uuid(1)));
    addBackupOnly(w, key(uuid(2)));
    w.named.add(key(uuid(2)));
    w.ports.lone = {
      settle: async () => {
        throw new Error("the object is overloaded");
      },
    };
    const result = await quietly(() => run(w));
    expect(result.status).toBe("error");
    expect(PRIMARY_MISSING_KEY in result.counts).toBe(false);
    expect(result.note).toMatch(
      /The lone copies' table could not be written: this run's log names the young keys it found\./,
    );
  });

  it("stops judging at its cap and says to copy the bucket back whole", async () => {
    const w = await makeWorld();
    addBacked(w, key(uuid(0)));
    for (let i = 1; i <= 5; i++) {
      addBackupOnly(w, key(uuid(i)));
      w.named.add(key(uuid(i)));
    }
    const result = await quietly(() => run(w, { limits: { loneKeys: 3 } }));
    expect(w.table.page(null, 10)).toEqual([
      key(uuid(1)),
      key(uuid(2)),
      key(uuid(3)),
    ]);
    expect(result.counts).toMatchObject({ lone_found: 3, lone_unjudged: 2 });
    expect(result.note).toMatch(
      /It stopped judging at 3 young lone copies; 2 more wait: copy the bucket back whole/,
    );
  });

  it("judges only what its range settled: a run cut short asks nothing about the keys past its cursor", async () => {
    const w = await makeWorld();
    for (let i = 0; i < 10; i++) addMissed(w, key(uuid(i)));
    const past = key(uuid(50));
    addBackupOnly(w, past);
    w.named.add(past);
    w.copyMs = 60_000;
    const result = await quietly(() =>
      run(w, { limits: { deadlineMs: 2 * 60_000, copyConcurrency: 1 } }),
    );
    expect(result.counts.stopped_early).toBe(true);
    expect(w.namedCalls).toEqual([]);
    expect(w.table.tally().keys).toBe(0);
  });
});

describe("the reconcile's ledger", () => {
  it("reads a stored record back, and an empty store as a new pass", () => {
    expect(parseReconcileLedger(null)).toEqual({
      ledger: EMPTY_RECONCILE_LEDGER,
    });
    const stored = {
      v: 1,
      cursor: key(uuid(4)),
      pass: { startedAtMs: NOW - DAY, walked: 1_000 },
      last: { atMs: NOW - 2 * DAY, walked: 5_862 },
      tooLarge: [],
    };
    expect(parseReconcileLedger(stored)).toEqual({ ledger: stored });
  });

  it("falls back the safe way: a damaged cursor or pass starts a new pass at the head, never skipping a key", () => {
    const last = { atMs: NOW - 2 * DAY, walked: 5_862 };
    expect(
      parseReconcileLedger({ v: 1, cursor: "avatars/x", pass: null, last }),
    ).toEqual({
      ledger: { v: 1, cursor: null, pass: null, last, tooLarge: [] },
      note: "Reconcile cursor unreadable; started a new pass at the head.",
    });
    expect(
      parseReconcileLedger({ v: 1, cursor: key(uuid(4)), pass: null, last }),
    ).toEqual({
      ledger: { v: 1, cursor: null, pass: null, last, tooLarge: [] },
      note: "Reconcile pass unreadable; started a new pass at the head.",
    });
    expect(parseReconcileLedger("garbage").note).toBe(
      "Reconcile ledger unreadable; started a new pass at the head.",
    );
    expect(
      parseReconcileLedger({
        v: 1,
        cursor: null,
        pass: null,
        last: { atMs: -1 },
      }).ledger.last,
    ).toBeNull();
  });

  it("keeps the keys past one run's reach it can read, and drops one it cannot (tried again, said again)", () => {
    const big = { key: key(uuid(7), "original.mp4"), size: 9e9 };
    expect(
      parseReconcileLedger({
        v: 1,
        cursor: null,
        pass: null,
        last: null,
        tooLarge: [big, { key: "avatars/x", size: 5 }, { key: big.key }],
      }).ledger.tooLarge,
    ).toEqual([big]);
    // A ledger from before the list existed reads as none.
    expect(
      parseReconcileLedger({ v: 1, cursor: null, pass: null, last: null })
        .ledger.tooLarge,
    ).toEqual([]);
  });
});

/**
 * ★ MEASURED ON FAKES (item 1: "3,419 and 100,000 objects: wall time and subrequests against the Worker's limits").
 * The wall time is modeled serially, an upper bound (the run lists both sides at once when both pages run out), at
 * 270 ms a listing: the prune's live run of 2026-10-04 made 59 subrequests in 15.8 s, its confirm calls to Vercel
 * included. The old reconcile is modeled at its own live figure, 209 ms an object (715 s over 3,419).
 */
describe("the reconcile at scale", () => {
  const LIST_MS = 270;
  const OLD_MS_PER_OBJECT = 715_362 / 3_419;
  const CUT_MS = 15 * 60_000;
  const LIMIT_SUBREQUESTS = 100_000; // wrangler.jsonc

  /** A sorted bucket that lists by binary search, so a 100,000-key fixture lists in microseconds. */
  function sortedBucket(objects: ReconcileListed[]): ReconcileBucket & {
    calls: number;
  } {
    const keys = objects.map((o) => o.key);
    const bucket = {
      calls: 0,
      async list(o: { prefix: string; startAfter?: string; limit: number }) {
        bucket.calls += 1;
        let lo = 0;
        let hi = keys.length;
        const after = o.startAfter;
        if (after !== undefined) {
          while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (keys[mid] > after) hi = mid;
            else lo = mid + 1;
          }
        }
        const take = Math.min(o.limit, 1000);
        return {
          objects: objects.slice(lo, lo + take),
          truncated: lo + take < objects.length,
        };
      },
    };
    return bucket;
  }

  async function measure(n: number) {
    const primary: ReconcileListed[] = [];
    const backup: ReconcileListed[] = [];
    for (let i = 0; i < n; i++) {
      const k = key(uuid(i, 0x10 + (i % 7)));
      const obj = { key: k, size: 2e6, etag: md5(i), uploaded: OLD };
      primary.push(obj);
      backup.push(obj);
      // About one purged item's key in nine, as the live buckets hold (654 of 6,516 on 2026-10-05).
      if (i % 9 === 0) {
        backup.push({ ...obj, key: `${k}.purged`, uploaded: OLD });
      }
    }
    primary.sort((a, b) => (a.key < b.key ? -1 : 1));
    backup.sort((a, b) => (a.key < b.key ? -1 : 1));
    const clock = { t: NOW };
    const P = sortedBucket(primary);
    const B = sortedBucket(backup);
    const timed = (bucket: ReconcileBucket): ReconcileBucket => ({
      async list(o) {
        clock.t += LIST_MS;
        return bucket.list(o);
      },
    });
    const db = await openDb();
    const table = createLoneStore(sqlOf(db), transactionOf(db));
    const cpu0 = performance.now();
    const result = await runReconcile(
      {
        primary: timed(P),
        backup: timed(B),
        copy: async () => "copied",
        named: async () => ({ kind: "named", named: [] }),
        lone: {
          settle: async (walk) => ({
            held: walk ? table.settle(walk, clock.t).keys : table.tally().keys,
            added: 0,
          }),
        },
        now: () => clock.t,
      },
      { ledger: EMPTY_RECONCILE_LEDGER, startedAtMs: NOW },
    );
    return {
      result,
      cpuMs: performance.now() - cpu0,
      wallMs: clock.t - NOW,
      oldWallMs: n * OLD_MS_PER_OBJECT,
      // The probe is a listing of the primary too; counted apart.
      lists: P.calls + B.calls - 1,
      backupKeys: backup.length,
    };
  }

  it.each([3_419, 100_000])(
    "★ walks %i objects in one run, far inside the 15-minute cut and the subrequest limit",
    async (n) => {
      const m = await measure(n);
      console.log(
        `reconcile at ${n.toLocaleString("en-US")} objects: ${m.lists} listings, ${m.result.counts.subrequests} subrequests ` +
          `(limit ${LIMIT_SUBREQUESTS.toLocaleString("en-US")}), modeled wall ${(m.wallMs / 1000).toFixed(1)} s ` +
          `(cut ${CUT_MS / 1000} s), engine CPU ${m.cpuMs.toFixed(0)} ms; the old reconcile, modeled: ` +
          `${(m.oldWallMs / 1000).toFixed(0)} s and ${n.toLocaleString("en-US")} HEADs`,
      );
      expect(m.result.counts.pass_complete).toBe(true);
      expect(m.result.counts.checked).toBe(n);
      // Each side listed once a thousand keys, the probe and the table: nothing an object.
      expect(m.result.counts.subrequests).toBe(m.lists + 2);
      expect(m.lists).toBe(
        Math.ceil(n / 1000) + Math.ceil(m.backupKeys / 1000),
      );
      expect(m.wallMs).toBeLessThan(RECONCILE_LIMITS.deadlineMs);
      expect(m.wallMs).toBeLessThan(CUT_MS / 5);
      // The old reconcile did not fit at the larger size at all, and its HEADs alone were n subrequests.
      if (n === 100_000) expect(m.oldWallMs).toBeGreaterThan(CUT_MS);
    },
  );
});
