// The per-play byte budget: the window ladder (full → shortened → poster), the K-loop cadence and
// the session ledger. Pure arithmetic, so these are the pins the harness's numbers are read against.

import { describe, expect, it } from "vitest";

import {
  createVideoByteLedger,
  estimateWindowBytes,
  motionLoopOffset,
  planVideoWindow,
  playsWithMotion,
  VIDEO_CLIP_BYTE_CAP,
  VIDEO_CONTAINER_OVERHEAD_BYTES,
  VIDEO_WINDOW_FLOOR_SEC,
  VIDEO_WINDOW_SEC,
} from "./budget";

const MB = 1024 * 1024;

describe("estimateWindowBytes", () => {
  it("is bytes-per-second x window plus the container's own read", () => {
    expect(estimateWindowBytes(10_000_000, 10, 6)).toBe(
      6_000_000 + VIDEO_CONTAINER_OVERHEAD_BYTES,
    );
  });

  it("never estimates more than the whole file", () => {
    expect(estimateWindowBytes(400_000, 2, 6)).toBe(
      400_000 + VIDEO_CONTAINER_OVERHEAD_BYTES,
    );
  });

  it("treats an unknown duration as the whole file (the pessimistic reading)", () => {
    expect(estimateWindowBytes(900_000, 0, 6)).toBe(
      900_000 + VIDEO_CONTAINER_OVERHEAD_BYTES,
    );
  });

  it("costs only the container when there is no size to go on", () => {
    expect(estimateWindowBytes(0, 10, 6)).toBe(VIDEO_CONTAINER_OVERHEAD_BYTES);
  });
});

describe("planVideoWindow", () => {
  it("gives the full window to a clip that fits the cap", () => {
    const plan = planVideoWindow({ fileSizeBytes: 3 * MB, durationSec: 10 });
    expect(plan).not.toBeNull();
    expect(plan!.windowSec).toBe(VIDEO_WINDOW_SEC);
    expect(plan!.shortened).toBe(false);
    expect(plan!.estimatedBytes).toBeLessThanOrEqual(VIDEO_CLIP_BYTE_CAP);
  });

  it("shortens the window for a clip over the cap, and says so", () => {
    // 20 MB over 10s = 2 MB/s: a 6s window would be ~12 MB.
    const plan = planVideoWindow({ fileSizeBytes: 20 * MB, durationSec: 10 });
    expect(plan).not.toBeNull();
    expect(plan!.shortened).toBe(true);
    expect(plan!.windowSec).toBeLessThan(VIDEO_WINDOW_SEC);
    expect(plan!.windowSec).toBeGreaterThanOrEqual(VIDEO_WINDOW_FLOOR_SEC);
    expect(plan!.estimatedBytes).toBeLessThanOrEqual(VIDEO_CLIP_BYTE_CAP);
  });

  it("gives up on a 4K original: even the floor is over the cap (the poster)", () => {
    // 50 MB over 10s = 40 Mbps.
    expect(
      planVideoWindow({ fileSizeBytes: 50 * MB, durationSec: 10 }),
    ).toBeNull();
  });

  it("never plans a window longer than the source", () => {
    const plan = planVideoWindow({ fileSizeBytes: 2 * MB, durationSec: 4 });
    expect(plan!.windowSec).toBe(4);
    expect(plan!.shortened).toBe(true);
  });

  it("plays a source shorter than the floor whole (it is cheap by definition)", () => {
    const plan = planVideoWindow({ fileSizeBytes: 300_000, durationSec: 1 });
    expect(plan!.windowSec).toBe(1);
  });

  it("plans the full window on an unknown size, for the reader to re-check", () => {
    const plan = planVideoWindow({ fileSizeBytes: null, durationSec: 10 });
    expect(plan!.windowSec).toBe(VIDEO_WINDOW_SEC);
    expect(plan!.estimatedBytes).toBe(VIDEO_CONTAINER_OVERHEAD_BYTES);
  });

  it("honours a tighter cap (the harness knob) by shortening further", () => {
    const loose = planVideoWindow({ fileSizeBytes: 3 * MB, durationSec: 10 });
    const tight = planVideoWindow({
      fileSizeBytes: 3 * MB,
      durationSec: 10,
      capBytes: 1 * MB,
    });
    expect(loose!.windowSec).toBe(VIDEO_WINDOW_SEC);
    expect(tight!.windowSec).toBeLessThan(loose!.windowSec);
  });

  it("refuses a requested window under the floor", () => {
    expect(
      planVideoWindow({ fileSizeBytes: 1 * MB, durationSec: 10, windowSec: 1 }),
    ).toBeNull();
  });
});

describe("the K-loop cadence", () => {
  it("plays every loop at K = 1", () => {
    for (let loop = 0; loop < 5; loop += 1) {
      expect(playsWithMotion(loop, "media-a", 1)).toBe(true);
    }
  });

  it("plays exactly once in every run of K", () => {
    for (const key of ["media-a", "media-b", "media-c", "media-d"]) {
      const hits = [0, 1, 2, 3, 4, 5].filter((loop) =>
        playsWithMotion(loop, key, 3),
      );
      expect(hits.length).toBe(2); // two full runs of three
    }
  });

  it("spreads the videos of an album across the cadence", () => {
    const offsets = new Set(
      ["a", "b", "c", "d", "e", "f", "g", "h"].map((k) =>
        motionLoopOffset(k, 3),
      ),
    );
    expect(offsets.size).toBeGreaterThan(1);
    for (const offset of offsets) expect(offset).toBeLessThan(3);
  });

  it("is stable for a key", () => {
    expect(motionLoopOffset("media-a", 3)).toBe(motionLoopOffset("media-a", 3));
  });
});

describe("the session ledger", () => {
  it("charges the estimate and reconciles to what was really read", () => {
    const ledger = createVideoByteLedger(10 * MB);
    const settle = ledger.charge(4 * MB);
    expect(ledger.spentBytes).toBe(4 * MB);
    settle(1 * MB);
    expect(ledger.spentBytes).toBe(1 * MB);
  });

  it("settles once, however many times it is called", () => {
    const ledger = createVideoByteLedger(10 * MB);
    const settle = ledger.charge(4 * MB);
    settle(1 * MB);
    settle(1 * MB);
    expect(ledger.spentBytes).toBe(1 * MB);
  });

  it("ends motion for the night at the ceiling", () => {
    const ledger = createVideoByteLedger(5 * MB);
    expect(ledger.exhausted).toBe(false);
    expect(ledger.canAfford(4 * MB)).toBe(true);
    ledger.charge(5 * MB);
    expect(ledger.exhausted).toBe(true);
    expect(ledger.canAfford(1)).toBe(false);
  });

  it("resets (a new session, or the harness knob)", () => {
    const ledger = createVideoByteLedger(5 * MB);
    ledger.charge(5 * MB);
    ledger.reset();
    expect(ledger.spentBytes).toBe(0);
    expect(ledger.exhausted).toBe(false);
  });
});
