import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { STOPPED_EARLY_KEY } from "@/app/admin/jobs/catalog";
import {
  createSweepClock,
  deadlineAt,
  NO_DEADLINE,
  rotateAfter,
  stoppedEarly,
  SWEEP_WINDOW_MS,
} from "@/lib/lifecycle/sweep-budget";

/** A clock the test moves by hand. */
function manualClock(start = 1_000_000) {
  let t = start;
  return {
    now: () => t,
    advance: (ms: number) => {
      t += ms;
    },
  };
}

describe("deadlines", () => {
  it("passes at its instant, not before", () => {
    const clock = manualClock();
    const deadline = deadlineAt(clock.now() + 100, clock.now);
    expect(deadline.passed()).toBe(false);
    clock.advance(99);
    expect(deadline.passed()).toBe(false);
    clock.advance(1);
    expect(deadline.passed()).toBe(true);
  });

  it("NO_DEADLINE never passes", () => {
    expect(NO_DEADLINE.passed()).toBe(false);
    expect(NO_DEADLINE.at).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("the sweep clock", () => {
  it("gives each sweep an equal share of what is LEFT, so a quick sweep hands its time on", () => {
    const clock = manualClock(0);
    const sweeps = createSweepClock({
      startMs: 0,
      windowMs: 9_000,
      sweeps: 3,
      now: clock.now,
    });
    const first = sweeps.next();
    expect(first.at).toBe(3_000);
    clock.advance(500); // the first sweep finished early
    const second = sweeps.next();
    expect(second.at).toBe(500 + 8_500 / 2);
    clock.advance(8_000); // the second overran its share
    const third = sweeps.next();
    // The last sweep gets everything that is left, and never more than the window.
    expect(third.at).toBe(9_000);
    expect(sweeps.endMs).toBe(9_000);
  });

  it("a sweep past the window, or past the last share, gets a deadline that has already passed", () => {
    const clock = manualClock(0);
    const sweeps = createSweepClock({
      startMs: 0,
      windowMs: 1_000,
      sweeps: 1,
      now: clock.now,
    });
    clock.advance(2_000);
    expect(sweeps.next().passed()).toBe(true);
    expect(sweeps.next().passed()).toBe(true);
  });

  it("the window fits inside the route's maxDuration with room for the tail", () => {
    // The sweeps share SWEEP_WINDOW_MS; the freshness scan, the heartbeat and one batch's overrun
    // need the rest. Read from the route itself, so the two numbers cannot drift apart.
    const route = readFileSync(
      join(process.cwd(), "src/app/api/cron/purge/route.ts"),
      "utf8",
    );
    const maxDuration = Number(
      /export const maxDuration = (\d+);/.exec(route)?.[1],
    );
    expect(maxDuration).toBeGreaterThan(0);
    expect(SWEEP_WINDOW_MS + 15_000).toBeLessThanOrEqual(maxDuration * 1000);
  });

  it("the route shares the window between exactly as many sweeps as it runs under a deadline", () => {
    const route = readFileSync(
      join(process.cwd(), "src/app/api/cron/purge/route.ts"),
      "utf8",
    );
    const declared = Number(/const BUDGETED_SWEEPS = (\d+);/.exec(route)?.[1]);
    const run = route.match(/await runBudgeted\("/g)?.length ?? 0;
    expect(run).toBe(declared);
  });
});

describe("stoppedEarly", () => {
  it("carries the catalog's flag, and the count when there is one", () => {
    expect(stoppedEarly(12)).toEqual({ stopped_early: true, remaining: 12 });
    expect(stoppedEarly(null)).toEqual({ stopped_early: true });
    expect(Object.keys(stoppedEarly(null))).toEqual([STOPPED_EARLY_KEY]);
  });
});

describe("rotateAfter", () => {
  const ids = ["c", "a", "e", "b", "d"];
  const key = (id: string) => id;

  it("sorts by key, and starts from the beginning with no cursor", () => {
    expect(rotateAfter(ids, null, key)).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("starts after the cursor and wraps round to what came before it", () => {
    expect(rotateAfter(ids, "b", key)).toEqual(["c", "d", "e", "a", "b"]);
    // A cursor between keys (a row since deleted) still starts at the next one.
    expect(rotateAfter(ids, "bb", key)).toEqual(["c", "d", "e", "a", "b"]);
  });

  it("starts from the beginning when the cursor is past every key", () => {
    expect(rotateAfter(ids, "z", key)).toEqual(["a", "b", "c", "d", "e"]);
  });
});
