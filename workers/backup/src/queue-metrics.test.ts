import { describe, expect, it, vi } from "vitest";

import {
  DEPTH_KEYS,
  depthNote,
  readQueue,
  readQueueDepths,
  type MetricsSource,
} from "./queue-metrics";

const NOW = Date.parse("2026-09-18T12:00:00.000Z");

function queue(
  backlogCount: number,
  oldestMessageTimestamp?: Date,
): MetricsSource {
  return {
    metrics: async () => ({
      backlogCount,
      backlogBytes: backlogCount * 512,
      oldestMessageTimestamp,
    }),
  };
}

describe("readQueue", () => {
  it("reports a backlog and the age of its oldest message", async () => {
    const reading = await readQueue(
      queue(7, new Date(NOW - 90 * 60_000)),
      NOW,
      "live",
    );
    expect(reading).toEqual({ backlog: 7, oldestMinutes: 90 });
  });

  it("reports an empty queue as zero with no age", async () => {
    expect(await readQueue(queue(0), NOW, "live")).toEqual({
      backlog: 0,
      oldestMinutes: null,
    });
  });

  it("returns null when the binding is absent", async () => {
    // The Worker must keep backing media up on a deploy whose wrangler.jsonc predates the bindings.
    expect(await readQueue(undefined, NOW, "live")).toBeNull();
  });

  it("returns null rather than throwing when the read fails", async () => {
    // ★ A metrics call must never cost a backup run. Losing the copy to gain the reading would be a
    // durability regression traded for an observability gain.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const broken: MetricsSource = {
      metrics: async () => {
        throw new Error("queue unavailable");
      },
    };
    expect(await readQueue(broken, NOW, "dlq")).toBeNull();
    spy.mockRestore();
  });

  it("returns null on a runtime too old to answer", async () => {
    expect(await readQueue({} as MetricsSource, NOW, "live")).toBeNull();
  });

  it("never reports a negative age for a clock skew", async () => {
    const reading = await readQueue(queue(1, new Date(NOW + 5000)), NOW, "live");
    expect(reading?.oldestMinutes).toBe(0);
  });
});

describe("readQueueDepths", () => {
  it("flattens both queues into the counts keys the app reads back", async () => {
    const counts = await readQueueDepths(
      {
        BACKUP_QUEUE: queue(3) as unknown as Queue,
        BACKUP_DLQ: queue(2, new Date(NOW - 120 * 60_000)) as unknown as Queue,
      },
      NOW,
    );
    expect(counts).toEqual({
      [DEPTH_KEYS.queueBacklog]: 3,
      [DEPTH_KEYS.deadLetterBacklog]: 2,
      [DEPTH_KEYS.deadLetterOldestMin]: 120,
    });
  });

  it("omits a queue it could not read, rather than reporting zero", async () => {
    // ★ The whole point. A fabricated zero on a dead-letter card is worse than no card: it is the
    // calm, healthy-looking nothing this console exists to refuse.
    const counts = await readQueueDepths(
      { BACKUP_QUEUE: queue(4) as unknown as Queue },
      NOW,
    );
    expect(counts[DEPTH_KEYS.queueBacklog]).toBe(4);
    expect(DEPTH_KEYS.deadLetterBacklog in counts).toBe(false);
  });

  it("returns an empty reading when neither binding exists", async () => {
    expect(await readQueueDepths({}, NOW)).toEqual({});
  });
});

describe("depthNote", () => {
  it("says nothing when there are no dead letters", async () => {
    expect(depthNote({ [DEPTH_KEYS.deadLetterBacklog]: 0 })).toBeNull();
    expect(depthNote({})).toBeNull();
  });

  it("names the count and the oldest message's age", () => {
    expect(
      depthNote({
        [DEPTH_KEYS.deadLetterBacklog]: 1,
        [DEPTH_KEYS.deadLetterOldestMin]: 30,
      }),
    ).toBe("1 dead letter waiting, oldest 30 min");
    expect(
      depthNote({
        [DEPTH_KEYS.deadLetterBacklog]: 4,
        [DEPTH_KEYS.deadLetterOldestMin]: 4320,
      }),
    ).toBe("4 dead letters waiting, oldest 3 d");
  });
});

describe("the cross-package key contract", () => {
  it("pins the exact strings the app's catalog reads back", () => {
    // ★ The app cannot import this module (separate package, separate tsconfig), so the literals are
    // asserted on BOTH sides. Change one without the other and this turns red, or its twin in
    // src/app/admin/jobs/catalog.test.ts does. A drifted key would silently stop resolving and the
    // dead-letter card would read "No reading" forever, which is the failure this whole round is about.
    expect(DEPTH_KEYS.queueBacklog).toBe("queue_backlog");
    expect(DEPTH_KEYS.queueOldestMin).toBe("queue_oldest_min");
    expect(DEPTH_KEYS.deadLetterBacklog).toBe("dead_letter_backlog");
    expect(DEPTH_KEYS.deadLetterOldestMin).toBe("dead_letter_oldest_min");
  });
});
