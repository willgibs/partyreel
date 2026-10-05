/**
 * WHEN A RESTORE PASS RUNS (restore-schedule.ts): a request sets the alarm for now, joins one already set, or queues
 * a pass behind the one in flight; never a second pass beside one, never a request lost, never blocked by a pass that
 * died.
 */
import { describe, expect, it } from "vitest";

import {
  RESTORE_STALE_MS,
  decideRestoreRequest,
  readTime,
  readTrigger,
  strongerTrigger,
} from "./restore-schedule";

const NOW = Date.UTC(2026, 9, 5, 5, 0, 0);

describe("decideRestoreRequest", () => {
  it("starts a pass when none is set or running", () => {
    expect(
      decideRestoreRequest({
        nowMs: NOW,
        runningSinceMs: null,
        alarmAtMs: null,
      }),
    ).toBe("started");
  });

  it("joins an alarm already set rather than setting a second", () => {
    expect(
      decideRestoreRequest({
        nowMs: NOW,
        runningSinceMs: null,
        alarmAtMs: NOW + 500,
      }),
    ).toBe("queued");
  });

  it("queues behind a pass in flight, so the request is never lost and never runs beside it", () => {
    expect(
      decideRestoreRequest({
        nowMs: NOW,
        runningSinceMs: NOW - 60_000,
        alarmAtMs: null,
      }),
    ).toBe("running");
  });

  it("is never blocked by a pass that died: one marked running past any alarm's reach no longer counts", () => {
    expect(
      decideRestoreRequest({
        nowMs: NOW,
        runningSinceMs: NOW - RESTORE_STALE_MS,
        alarmAtMs: null,
      }),
    ).toBe("started");
    // 15 minutes is the most an alarm runs; the mark outlives that by a minute before it is read as dead.
    expect(RESTORE_STALE_MS).toBeGreaterThan(15 * 60_000);
  });
});

describe("its records", () => {
  it("lets an operator's press outrank the clock", () => {
    expect(strongerTrigger(null, "schedule")).toBe("schedule");
    expect(strongerTrigger("schedule", "manual")).toBe("manual");
    expect(strongerTrigger("manual", "schedule")).toBe("manual");
  });

  it("reads only what it wrote", () => {
    expect(readTrigger("manual")).toBe("manual");
    expect(readTrigger("schedule")).toBe("schedule");
    expect(readTrigger("now")).toBeNull();
    expect(readTime(NOW)).toBe(NOW);
    for (const raw of [null, "1", -1, 0, Number.NaN])
      expect(readTime(raw)).toBeNull();
  });
});
