import { describe, expect, it, vi } from "vitest";

import { forEachIsolated, tallyIsClean, tallyNote } from "@/lib/jobs/isolate";

const noop = () => {};

describe("forEachIsolated", () => {
  it("runs every row and reports a clean tally", async () => {
    const seen: number[] = [];
    const tally = await forEachIsolated(
      [1, 2, 3],
      async (n) => {
        seen.push(n);
      },
      { onError: noop },
    );
    expect(seen).toEqual([1, 2, 3]);
    expect(tally.processed).toBe(3);
    expect(tallyIsClean(tally)).toBe(true);
  });

  it("keeps going past a bad row — the whole point of QA #27", async () => {
    const seen: string[] = [];
    const tally = await forEachIsolated(
      ["a", "bad", "c"],
      async (row) => {
        if (row === "bad") throw new Error("bounced address");
        seen.push(row);
      },
      { onError: noop },
    );
    expect(seen).toEqual(["a", "c"]);
    expect(tally.processed).toBe(2);
    expect(tally.failed).toBe(1);
  });

  it("reports each failure once, with the row", async () => {
    const onError = vi.fn();
    await forEachIsolated(
      ["ok", "bad"],
      async (row) => {
        if (row === "bad") throw new Error("nope");
      },
      { onError },
    );
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0]).toBe("bad");
  });

  it("never reads as clean just because it kept going", async () => {
    // The failure mode isolation could introduce: a sweep that swallowed everything and closed green.
    const tally = await forEachIsolated(
      [1, 2],
      async () => {
        throw new Error("x");
      },
      { onError: noop, abortAfterConsecutive: 0 },
    );
    expect(tally.failed).toBe(2);
    expect(tallyIsClean(tally)).toBe(false);
    expect(tallyNote("accounts", tally)).toContain("2 accounts failed");
  });

  it("aborts once failures come in a row, and counts what it never attempted", async () => {
    // Consecutive failures are a dead dependency, not bad rows. Burning 100 more queries against it
    // helps nobody, and a run that "completed" against a dead database is the lie we are removing.
    const attempted: number[] = [];
    const tally = await forEachIsolated(
      [1, 2, 3, 4, 5, 6, 7, 8],
      async (n) => {
        attempted.push(n);
        throw new Error("connection refused");
      },
      { onError: noop, abortAfterConsecutive: 3 },
    );
    expect(attempted).toEqual([1, 2, 3]);
    expect(tally.failed).toBe(3);
    expect(tally.skipped).toBe(5);
    expect(tally.aborted).toBe(true);
    expect(tallyNote("accounts", tally)).toContain("not attempted");
  });

  it("resets the consecutive counter on a success", async () => {
    // Scattered bad rows are exactly what isolation is FOR; only an unbroken streak is systemic.
    const tally = await forEachIsolated(
      [1, 2, 3, 4, 5, 6],
      async (n) => {
        if (n % 2 === 1) throw new Error("odd");
      },
      { onError: noop, abortAfterConsecutive: 2 },
    );
    expect(tally.aborted).toBe(false);
    expect(tally.failed).toBe(3);
    expect(tally.processed).toBe(3);
  });

  it("keeps the first error's message for the run note, not every message", async () => {
    const tally = await forEachIsolated(
      [1, 2],
      async (n) => {
        throw new Error(`failure ${n}`);
      },
      { onError: noop, abortAfterConsecutive: 0 },
    );
    expect(tally.firstError).toBe("failure 1");
  });

  it("survives a reporter that throws", async () => {
    const tally = await forEachIsolated(
      [1],
      async () => {
        throw new Error("row");
      },
      {
        onError: () => {
          throw new Error("Sentry is down");
        },
      },
    );
    expect(tally.failed).toBe(1);
  });

  it("returns a clean empty tally for no rows", async () => {
    const tally = await forEachIsolated([], async () => {}, { onError: noop });
    expect(tallyIsClean(tally)).toBe(true);
    expect(tallyNote("accounts", tally)).toBeNull();
  });

  it("stops where stopWhen says, and counts what it left as unreached, which is not a failure", async () => {
    // The purge sweeps pass their deadline here: a budget that runs out is a backlog to report
    // (`stopped_early`), never a failed run.
    const seen: number[] = [];
    let budget = 3;
    const tally = await forEachIsolated(
      [1, 2, 3, 4, 5],
      async (n) => {
        seen.push(n);
      },
      { onError: noop, stopWhen: () => budget-- <= 0 },
    );
    expect(seen).toEqual([1, 2, 3]);
    expect(tally).toMatchObject({
      processed: 3,
      failed: 0,
      skipped: 0,
      unreached: 2,
    });
    expect(tallyIsClean(tally)).toBe(true);
    expect(tallyNote("accounts", tally)).toBeNull();
  });

  it("asks stopWhen before the first row too, so no time at all attempts nothing", async () => {
    const body = vi.fn(async () => {});
    const tally = await forEachIsolated([1, 2], body, {
      onError: noop,
      stopWhen: () => true,
    });
    expect(body).not.toHaveBeenCalled();
    expect(tally.unreached).toBe(2);
  });
});
