import { describe, expect, it } from "vitest";

import { ALBUM_BATCH_MS, createRefreshCoalescer } from "./refresh-coalescer";

/**
 * THE BATCH CLOCK (album-calm, Will's yes of 2026-10-03: "15 seconds is still an incredibly reasonable time for one
 * guest's photos to distribute out"). ★ RESHAPED ON PURPOSE: the leading edge is gone. Its scar is kept: one sync
 * answers a whole burst of pings, never a sync a ping, and a dispose cancels what is pending. Its expired reason (a
 * ping refetched at once, sub-second, then held a 2 s window) gave way to the calm batch: every ping waits for the
 * device's next tick, so another guest's photographs land together about every fifteen seconds.
 */
function harness(phase = 0) {
  let t = 1000;
  const fires: number[] = [];
  const timers: {
    at: number;
    cb: () => void;
    id: number;
    cleared: boolean;
  }[] = [];
  let nextId = 1;
  const c = createRefreshCoalescer(() => fires.push(t), {
    now: () => t,
    random: () => phase,
    setTimeoutFn: (cb, ms) => {
      const id = nextId++;
      timers.push({ at: t + ms, cb, id, cleared: false });
      return id as unknown as ReturnType<typeof setTimeout>;
    },
    clearTimeoutFn: (id) => {
      const timer = timers.find((x) => x.id === (id as unknown as number));
      if (timer) timer.cleared = true;
    },
  });
  const advance = (ms: number) => {
    const target = t + ms;
    for (;;) {
      const due = timers
        .filter((x) => !x.cleared && x.at <= target)
        .sort((a, b) => a.at - b.at)[0];
      if (!due) break;
      t = due.at;
      due.cleared = true;
      due.cb();
    }
    t = target;
  };
  return { c, fires, advance, now: () => t };
}

describe("the batch clock", () => {
  it("is fifteen seconds, named once", () => {
    expect(ALBUM_BATCH_MS).toBe(15_000);
  });

  it("★ a ping never syncs at once: it waits for this device's next tick", () => {
    // Phase 0.5: this device's ticks fall at 1000 + 7,500 + k * 15,000.
    const { c, fires, advance } = harness(0.5);
    c.ping();
    expect(fires).toEqual([]);
    advance(7_499);
    expect(fires).toEqual([]);
    advance(1);
    expect(fires).toEqual([8_500]);
  });

  it("★ every ping before the tick rides the same sync: a burst is one batch", () => {
    const { c, fires, advance } = harness(0.5);
    for (let i = 0; i < 20; i++) {
      c.ping();
      advance(300);
    }
    // Twenty pings over six seconds, all before the 8,500 tick.
    advance(10_000);
    expect(fires).toEqual([8_500]);
  });

  it("★ a stream of pings lands as one batch a tick, never one a ping", () => {
    const { c, fires, advance } = harness(0);
    // A ping every 2 s for a minute: thirty pings.
    for (let i = 0; i < 30; i++) {
      c.ping();
      advance(2_000);
    }
    advance(15_000);
    // Ticks at 1000 + k * 15,000; never two syncs closer than the clock.
    expect(fires).toEqual([16_000, 31_000, 46_000, 61_000]);
    for (let i = 1; i < fires.length; i++)
      expect(fires[i] - fires[i - 1]).toBeGreaterThanOrEqual(ALBUM_BATCH_MS);
  });

  it("a quiet album never ticks: no ping, no sync", () => {
    const { fires, advance } = harness(0.3);
    advance(10 * ALBUM_BATCH_MS);
    expect(fires).toEqual([]);
  });

  it("★ two devices that heard the same ping ask at different moments (each draws its own phase)", () => {
    const a = harness(0.1);
    const b = harness(0.8);
    a.c.ping();
    b.c.ping();
    a.advance(ALBUM_BATCH_MS);
    b.advance(ALBUM_BATCH_MS);
    expect(a.fires).toEqual([1000 + 1_500]);
    expect(b.fires).toEqual([1000 + 12_000]);
  });

  it("never waits longer than one interval", () => {
    for (const phase of [0, 0.25, 0.5, 0.75, 0.999]) {
      const { c, fires, advance, now } = harness(phase);
      advance(4_321);
      const heard = now();
      c.ping();
      advance(ALBUM_BATCH_MS);
      expect(fires).toHaveLength(1);
      expect(fires[0] - heard).toBeLessThanOrEqual(ALBUM_BATCH_MS);
      expect(fires[0]).toBeGreaterThanOrEqual(heard);
    }
  });

  it("dispose cancels a pending batch (a tab gone hidden, an unmount)", () => {
    const { c, fires, advance } = harness(0.5);
    c.ping();
    c.dispose();
    advance(10 * ALBUM_BATCH_MS);
    expect(fires).toEqual([]);
  });
});

/**
 * ★ A MOMENT IS ONE WRITE, NEVER A STREAM (crumbs-61, red-team 48's LOW). A Develop now (or a develop time reached) opens
 * every sealed shot of an album in one write and rings the doorbell once: the cover lifts on the host's screen and every
 * guest's eyebrow should say developed in the same second, where the batch clock had each guest learn it on her own beat
 * (+0.38 s, +0.84 s and +7.2 s measured, up to fifteen by design). The batch is for a stream of arrivals; one ring that
 * stands for a whole write asks at once, and the sync it makes covers every ping heard before it.
 */
describe("★ a moment asks at once", () => {
  it("asks at the moment itself, never at the tick, on a device that heard nothing before it", () => {
    const { c, fires, advance } = harness(0.5);
    c.moment();
    expect(fires).toEqual([1_000]);
    advance(10 * ALBUM_BATCH_MS);
    expect(fires).toEqual([1_000]);
  });

  it("★ the sync it makes covers every ping heard before it: the batch that was waiting for its tick is spent", () => {
    const { c, fires, advance } = harness(0.5);
    c.ping();
    advance(2_000);
    c.moment();
    expect(fires).toEqual([3_000]);
    // The tick that ping was waiting for (8,500) never fires a second sync for it.
    advance(10 * ALBUM_BATCH_MS);
    expect(fires).toEqual([3_000]);
  });

  it("a ping after a moment waits for the batch clock as ever", () => {
    const { c, fires, advance } = harness(0.5);
    c.moment();
    advance(1_000);
    c.ping();
    advance(ALBUM_BATCH_MS);
    // Ticks fall at 1000 + 7,500 + k * 15,000: the next one past 2,000 is 8,500.
    expect(fires).toEqual([1_000, 8_500]);
  });

  it("two moments are two syncs: each is a write of its own", () => {
    const { c, fires, advance } = harness(0.5);
    c.moment();
    advance(5_000);
    c.moment();
    expect(fires).toEqual([1_000, 6_000]);
  });

  it("a stream of arrivals around a moment still lands one batch a tick", () => {
    const { c, fires, advance } = harness(0);
    for (let i = 0; i < 5; i++) {
      c.ping();
      advance(2_000);
    }
    c.moment();
    for (let i = 0; i < 5; i++) {
      c.ping();
      advance(500);
    }
    advance(ALBUM_BATCH_MS);
    // The moment's sync at 11,000 spends the five pings before it; the five after it ride the next tick (16,000).
    expect(fires).toEqual([11_000, 16_000]);
  });
});
