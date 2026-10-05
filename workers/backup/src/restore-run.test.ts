/**
 * THE RESTORE ON FAKE BUCKETS (durability-backups.md, "The restore"): the backup's lone copies copied back into the
 * primary, driven against two in-memory buckets, a stand-in for the app's confirm route that names keys from a set of
 * rows' keys, and an in-memory lone copies' table. The rules, each with its test: only a key a live row still names;
 * never over an object that is there, the write itself conditional; never by halves past one write's reach; a dry run
 * copies nothing; every outcome said, the ones it could not fix closing the pass as an error; its deadline and its cap
 * its budget.
 */
import { describe, expect, it, vi } from "vitest";

import { readNamedAnswer, type NamedAnswer } from "./named";
import {
  RESTORE_MAX_BYTES,
  fmtBytes,
  restoreModeOf,
  runRestore,
  type RestoreLimits,
  type RestorePorts,
} from "./restore-run";
import { createFakeR2, putCalls, type FakeR2 } from "./testing/fake-r2";

const NOW = Date.UTC(2026, 9, 5, 6, 30, 0);
const OLD = new Date(NOW - 40 * 86_400_000);
const MB = 1024 * 1024;

function uuid(n: number): string {
  return `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
}
const EVENT = uuid(0xe);
const key = (n: number, variant = "original.jpg") =>
  `events/${EVENT}/photo/${uuid(n)}/${variant}`;

type World = {
  backup: FakeR2;
  primary: FakeR2;
  /** The keys live rows name (the app's media rows, by their key columns). */
  named: Set<string>;
  /** The lone copies' table. */
  table: Set<string>;
  confirm: "route" | "down";
  namedCalls: string[][];
  clock: { t: number };
  /** Minutes the clock moves on every bucket call, to walk a pass into its deadline. */
  tickPerCall: number;
  ports: RestorePorts;
};

function makeWorld(): World {
  const w = {
    backup: createFakeR2([], { nowMs: NOW }),
    primary: createFakeR2([], { nowMs: NOW }),
    named: new Set<string>(),
    table: new Set<string>(),
    confirm: "route",
    namedCalls: [] as string[][],
    clock: { t: NOW },
    tickPerCall: 0,
  } as World;
  const tick = () => {
    w.clock.t += w.tickPerCall * 60_000;
  };
  const sorted = () => [...w.table].sort();
  w.ports = {
    backup: {
      head: async (k) => {
        tick();
        const obj = await w.backup.head(k);
        return obj ? { size: obj.size ?? 0 } : null;
      },
      get: async (k) => {
        tick();
        return w.backup.get(k);
      },
    },
    primary: {
      head: async (k) => {
        tick();
        return w.primary.head(k);
      },
      put: async (k, body, options) => {
        tick();
        return w.primary.put(k, body, options as never);
      },
    },
    async named(keys): Promise<NamedAnswer> {
      w.namedCalls.push([...keys]);
      if (w.confirm === "down")
        return { kind: "unavailable", detail: "HTTP 503" };
      return readNamedAnswer(
        { named: keys.filter((k) => w.named.has(k)) },
        keys,
      );
    },
    keys: (after, limit) =>
      sorted()
        .filter((k) => after === null || k > after)
        .slice(0, limit),
    resolve: (keys) => {
      for (const k of keys) w.table.delete(k);
    },
    countAfter: (after) =>
      sorted().filter((k) => after === null || k > after).length,
    now: () => w.clock.t,
  };
  return w;
}

/** A lone copy: the backup holds it, the primary does not, the table carries it, and (by default) its row names it. */
function addLone(
  w: World,
  k: string,
  opts: { size?: number; named?: boolean; contentType?: string } = {},
): string {
  w.backup.objects.set(k, {
    key: k,
    uploaded: OLD,
    size: opts.size ?? 2 * MB,
    contentType: opts.contentType ?? "image/jpeg",
  });
  w.table.add(k);
  if (opts.named ?? true) w.named.add(k);
  return k;
}

function restore(
  w: World,
  mode: "on" | "dryrun" = "on",
  limits?: Partial<RestoreLimits>,
) {
  return runRestore(w.ports, { mode, limits });
}

describe("what it copies back", () => {
  it("★ copies back exactly the keys a live row names, under a write that refuses anything already there", async () => {
    const w = makeWorld();
    const a = addLone(w, key(1));
    const b = addLone(w, key(2, "preview.webp"), {
      size: 40_000,
      contentType: "image/webp",
    });
    const result = await restore(w);
    expect(result.status).toBe("ok");
    expect(w.primary.objects.has(a)).toBe(true);
    expect(w.primary.objects.has(b)).toBe(true);
    // Every write conditional, every one stored, its content type carried over.
    expect(putCalls(w.primary)).toEqual([
      expect.objectContaining({
        key: a,
        condition: "*",
        stored: true,
        size: 2 * MB,
        contentType: "image/jpeg",
      }),
      expect.objectContaining({
        key: b,
        condition: "*",
        stored: true,
        size: 40_000,
        contentType: "image/webp",
      }),
    ]);
    expect(result.counts).toMatchObject({
      restore_mode: "on",
      restored: 2,
      restored_bytes: 2 * MB + 40_000,
      checked: 2,
    });
    expect(result.note).toMatch(/^Restored 2 keys \(2 MB\) from the backup\./);
    // Copied back, so no longer lone: the table drops both.
    expect(w.table.size).toBe(0);
  });

  it("★ never copies a key no live row names, and drops it from the table: a row that let go of an object keeps it gone", async () => {
    const w = makeWorld();
    // A phone copy over its cap: deleted at the complete, the row recorded without it, the backup holding a copy.
    const dropped = addLone(w, key(3, "phone.jpg"), { named: false });
    const result = await restore(w);
    expect(w.primary.objects.has(dropped)).toBe(false);
    expect(putCalls(w.primary)).toEqual([]);
    expect(w.backup.calls.filter((c) => c.op === "get")).toEqual([]);
    expect(result.counts).toMatchObject({ restored: 0, unnamed: 1 });
    expect(result.status).toBe("ok");
    expect(result.note).toMatch(/1 is named by no live row, so left alone\./);
    expect(w.table.has(dropped)).toBe(false);
  });

  it("★ never over an object that is there: one HEADs present, and one put back between the HEAD and the write is refused by the write itself", async () => {
    const w = makeWorld();
    const there = addLone(w, key(4));
    w.primary.objects.set(there, {
      key: there,
      uploaded: new Date(NOW),
      size: 7,
    });
    const raced = addLone(w, key(5));
    w.primary.appearOnPut.add(raced);
    const result = await restore(w);
    // The first is never read from the backup or written; the second's write is refused, the other writer's object kept.
    expect(putCalls(w.primary)).toEqual([
      expect.objectContaining({ key: raced, condition: "*", stored: false }),
    ]);
    expect(w.primary.objects.get(there)?.size).toBe(7);
    expect(w.primary.objects.get(raced)?.size).toBe(1);
    expect(result.counts).toMatchObject({ restored: 0, present: 2 });
    expect(result.status).toBe("ok");
    expect(w.table.size).toBe(0);
  });

  it("copies nothing in a dry run, says what it would, and keeps every key held", async () => {
    const w = makeWorld();
    addLone(w, key(6));
    addLone(w, key(7), { named: false });
    const result = await restore(w, "dryrun");
    expect(putCalls(w.primary)).toEqual([]);
    expect(w.backup.calls.filter((c) => c.op === "get")).toEqual([]);
    expect(result.counts).toMatchObject({
      restore_mode: "dryrun",
      would_restore: 1,
      unnamed: 1,
    });
    expect("restored" in result.counts).toBe(false);
    expect(result.note).toMatch(
      /^Dry run, copied nothing: 1 key would be restored \(RESTORE_MODE on copies them\)\./,
    );
    // A dry run's keys stay lone; the unnamed one is dropped all the same.
    expect([...w.table]).toEqual([key(6)]);
  });

  it("says when nothing is held, and closes ok", async () => {
    const w = makeWorld();
    const result = await restore(w);
    expect(result).toEqual({
      status: "ok",
      note: "Nothing is held by the backup alone.",
      counts: { restore_mode: "on", restored: 0, checked: 0 },
    });
    expect(w.namedCalls).toEqual([]);
  });
});

describe("what it cannot do, and says", () => {
  it("★ never writes an object past one conditional write's reach by halves: it stays held, said, and the pass is an error", async () => {
    const w = makeWorld();
    const big = addLone(w, key(8, "original.mp4"), { size: 6 * 1024 * MB });
    const result = await restore(w);
    expect(putCalls(w.primary)).toEqual([]);
    expect(w.backup.calls.filter((c) => c.op === "get")).toEqual([]);
    expect(result.status).toBe("error");
    expect(result.counts).toMatchObject({ restored: 0, too_large: 1 });
    expect(result.note).toMatch(
      /1 could not be restored: 1 is over the 4\.99 GB one conditional write takes, so copy it by hand\. This pass's log names each\./,
    );
    expect(w.table.has(big)).toBe(true);
  });

  it("keeps a failed copy held for the next pass, with its reason, and closes as an error", async () => {
    const w = makeWorld();
    const flaky = addLone(w, key(9));
    const fine = addLone(w, key(10));
    w.primary.failPut.add(flaky);
    const result = await restore(w);
    expect(result.status).toBe("error");
    expect(result.counts).toMatchObject({ restored: 1, failed: 1 });
    expect(result.note).toMatch(
      /1 failed to copy \(Error: R2 is unavailable\) and wait for the next pass/,
    );
    expect([...w.table]).toEqual([flaky]);
    expect(w.primary.objects.has(fine)).toBe(true);
  });

  it("drops a key the backup no longer holds, says its row names an object neither bucket holds, and closes as an error", async () => {
    const w = makeWorld();
    const lost = addLone(w, key(11));
    w.backup.objects.delete(lost);
    const result = await restore(w);
    expect(result.status).toBe("error");
    expect(result.counts).toMatchObject({ backup_missing: 1 });
    expect(result.note).toMatch(
      /1 is gone from the backup too: its row names an object neither bucket holds/,
    );
    expect(w.table.has(lost)).toBe(false);
  });

  it("copies nothing and keeps every key when the app cannot say which keys a row names", async () => {
    const w = makeWorld();
    addLone(w, key(12));
    w.confirm = "down";
    const result = await restore(w);
    expect(putCalls(w.primary)).toEqual([]);
    expect(result.status).toBe("error");
    expect(result.note).toMatch(
      /Could not ask the app which keys a live row names \(HTTP 503\), so it copied nothing more\./,
    );
    expect(w.table.size).toBe(1);
  });

  it("reads an answer naming a key it was not asked about as no answer at all", () => {
    expect(readNamedAnswer({ named: [key(1), key(2)] }, [key(1)])).toEqual({
      kind: "unavailable",
      detail: "an answer naming a key it was not asked about",
    });
    for (const body of [
      null,
      [],
      { named: "x" },
      { named: [1] },
      { keys: [] },
    ]) {
      expect(readNamedAnswer(body, [key(1)]).kind, JSON.stringify(body)).toBe(
        "unavailable",
      );
    }
    expect(readNamedAnswer({ named: [] }, [key(1)])).toEqual({
      kind: "named",
      named: [],
    });
  });
});

describe("its budget", () => {
  it("asks the app a confirm batch at a time, through the whole table", async () => {
    const w = makeWorld();
    for (let i = 20; i < 25; i++) addLone(w, key(i));
    const result = await restore(w, "on", { batch: 2 });
    expect(w.namedCalls.map((c) => c.length)).toEqual([2, 2, 1]);
    expect(result.counts).toMatchObject({ restored: 5, checked: 5 });
    expect(w.table.size).toBe(0);
  });

  it("stops at its deadline with what it left counted, and the next pass carries on", async () => {
    const w = makeWorld();
    for (let i = 30; i < 36; i++) addLone(w, key(i));
    // Four calls a key at a minute each: the third key starts past an 9-minute deadline.
    w.tickPerCall = 1;
    const first = await restore(w, "on", { deadlineMs: 9 * 60_000 });
    expect(first.counts).toMatchObject({
      restored: 3,
      remaining: 3,
      stopped_early: true,
    });
    expect(first.note).toMatch(
      /Stopped at its deadline with 3 to go; the next pass carries on\./,
    );
    w.tickPerCall = 0;
    const second = await restore(w);
    expect(second.counts).toMatchObject({ restored: 3 });
    expect("stopped_early" in second.counts).toBe(false);
    expect(w.table.size).toBe(0);
  });

  it("stops at its per-pass cap, counted", async () => {
    const w = makeWorld();
    for (let i = 40; i < 45; i++) addLone(w, key(i));
    const result = await restore(w, "on", { keysPerPass: 3 });
    expect(result.counts).toMatchObject({
      restored: 3,
      checked: 3,
      remaining: 2,
      stopped_early: true,
    });
    expect(result.note).toMatch(/Stopped at its 3 keys with 2 to go/);
  });

  it("keeps its note inside the 500 characters the heartbeat takes", async () => {
    const w = makeWorld();
    for (let i = 50; i < 60; i++) addLone(w, key(i), { named: i % 2 === 0 });
    w.primary.failPut.add(key(50));
    w.backup.objects.get(key(52))!.size = 6 * 1024 * MB;
    w.backup.objects.delete(key(54));
    w.primary.objects.set(key(56), { key: key(56), uploaded: new Date(NOW) });
    const result = await restore(w, "on", { keysPerPass: 9 });
    expect(result.note.length).toBeLessThanOrEqual(500);
    expect(result.note.split(". ")[1]).toMatch(/^3 could not be restored: /);
  });
});

describe("its record", () => {
  it("logs every key's outcome with its key", async () => {
    const w = makeWorld();
    addLone(w, key(70));
    addLone(w, key(71), { named: false });
    addLone(w, key(72), { size: 6 * 1024 * MB });
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await restore(w);
      expect(log).toHaveBeenCalledWith("restore: restored from the backup", {
        key: key(70),
        bytes: 2 * MB,
      });
      expect(warn).toHaveBeenCalledWith(
        "restore: named by no live row, left alone",
        {
          key: key(71),
        },
      );
      expect(error).toHaveBeenCalledWith(
        "restore: over one conditional write's reach; copy it by hand",
        { key: key(72), bytes: 6 * 1024 * MB },
      );
    } finally {
      log.mockRestore();
      warn.mockRestore();
      error.mockRestore();
    }
  });
});

describe("its mode and its words", () => {
  it("copies only on the literal on, stops only on the literal off, and reads anything else as a dry run", () => {
    expect(restoreModeOf("on")).toBe("on");
    expect(restoreModeOf("off")).toBe("off");
    for (const raw of [undefined, "", "dryrun", "live", "ON", "true"]) {
      expect(restoreModeOf(raw), String(raw)).toBe("dryrun");
    }
  });

  it("prints the largest write as 4.99 GB, never a rounded 5 GB an object just under it would seem to pass", () => {
    expect(fmtBytes(RESTORE_MAX_BYTES, "floor")).toBe("4.99 GB");
    expect(fmtBytes(2 * MB + 40_000)).toBe("2 MB");
    expect(fmtBytes(0)).toBe("0 B");
  });
});
