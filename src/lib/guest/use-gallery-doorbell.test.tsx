/**
 * THE DOORBELL, CALMED (album-calm): a visible album hears its pings and answers them in batches on the device's
 * clock; a hidden one is not a listener at all (a broadcast is billed one message a listener) and syncs nothing on a
 * ping; a tab that comes back rejoins, and its catch-up is the live poll's one sync, never a second here.
 *
 * The client is a stand-in shaped like supabase-js's own (`channel`, `removeChannel`), down to the trap that matters:
 * `channel(topic)` hands back the SAME channel while one by that topic is still in the client's list, and a channel
 * still leaving never subscribes again, so a rejoin that did not wait for its leave would sit deaf for good.
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ALBUM_BATCH_MS } from "@/lib/guest/refresh-coalescer";

type Status = "SUBSCRIBED" | "CHANNEL_ERROR" | "TIMED_OUT" | "CLOSED";

class FakeChannel {
  ping: (() => void) | null = null;
  status: ((status: Status) => void) | null = null;
  subscribes = 0;
  leaving = false;
  gone = false;
  constructor(readonly topic: string) {}
  on(_type: string, _filter: unknown, cb: (message?: unknown) => void) {
    this.ping = cb as () => void;
    return this;
  }
  subscribe(cb: (status: Status) => void) {
    // realtime-js subscribes only a closed channel: one still leaving ignores the call (and never calls back).
    if (this.leaving || this.subscribes > 0) return this;
    this.subscribes += 1;
    this.status = cb;
    return this;
  }
  /** The server's word on the join. */
  answer(status: Status) {
    if (!this.gone) this.status?.(status);
  }
  /**
   * A ping on the wire, delivered whether or not anyone still wants it: with the message supabase-js hands a broadcast's
   * listener (`{ type, event, payload }`, the payload the sender's own), or none, as an arrival's contentless ping.
   */
  ring(message?: unknown) {
    (this.ping as ((message?: unknown) => void) | null)?.(message);
  }
}

function fakeRealtime() {
  const list: FakeChannel[] = [];
  const made: FakeChannel[] = [];
  const leaves: { channel: FakeChannel; land: () => void }[] = [];
  const client = {
    channel(topic: string) {
      const existing = list.find((c) => c.topic === topic);
      if (existing) return existing;
      const channel = new FakeChannel(topic);
      list.push(channel);
      made.push(channel);
      return channel;
    },
    removeChannel(channel: FakeChannel) {
      channel.leaving = true;
      return new Promise<"ok">((resolve) => {
        leaves.push({
          channel,
          land: () => {
            list.splice(list.indexOf(channel), 1);
            channel.gone = true;
            channel.status?.("CLOSED");
            resolve("ok");
          },
        });
      });
    },
  };
  return {
    client,
    list,
    made,
    leaves,
    /** Every leave in flight, acknowledged. */
    async landLeaves() {
      for (const leave of leaves.splice(0)) leave.land();
      await flush();
    },
  };
}

function fakeDocument(hidden = false) {
  const listeners = new Set<() => void>();
  const doc = {
    hidden,
    addEventListener: (_type: "visibilitychange", l: () => void) =>
      listeners.add(l),
    removeEventListener: (_type: "visibilitychange", l: () => void) =>
      listeners.delete(l),
  };
  return {
    doc,
    listeners,
    set(next: boolean) {
      doc.hidden = next;
      for (const l of [...listeners]) l();
    },
  };
}

async function flush() {
  for (let i = 0; i < 5; i++) await Promise.resolve();
}

const { connectDoorbell, REJOIN_GRACE_MS, useGalleryDoorbell } =
  await import("./use-gallery-doorbell");

function setup({ hidden = false } = {}) {
  const realtime = fakeRealtime();
  const page = fakeDocument(hidden);
  const fire = vi.fn();
  const live: boolean[] = [];
  const line = connectDoorbell({
    client: realtime.client as never,
    topic: "gallery:qr-1",
    fire,
    setLive: (v) => live.push(v),
    doc: page.doc,
    // Phase 0.5: the first tick is 7.5 s after the line opened, then every 15 s.
    coalescer: { random: () => 0.5 },
  });
  const current = () => realtime.made[realtime.made.length - 1];
  return { realtime, page, fire, live, line, current };
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("a visible album", () => {
  it("joins the album's channel and is live once the join is answered", () => {
    const { realtime, live, current } = setup();
    expect(realtime.made).toHaveLength(1);
    expect(current().topic).toBe("gallery:qr-1");
    expect(current().subscribes).toBe(1);
    current().answer("SUBSCRIBED");
    expect(live).toEqual([true]);
  });

  it("★ answers a ping at its next tick, never at once, and a burst with one sync", () => {
    const { fire, current } = setup();
    current().answer("SUBSCRIBED");
    for (let i = 0; i < 6; i++) {
      current().ring();
      vi.advanceTimersByTime(1_000);
    }
    expect(fire).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1_500);
    expect(fire).toHaveBeenCalledTimes(1);
    // The next pings wait for the next tick, fifteen seconds on.
    current().ring();
    vi.advanceTimersByTime(ALBUM_BATCH_MS - 1);
    expect(fire).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(fire).toHaveBeenCalledTimes(2);
  });

  /* ★ A MOMENT IS ONE WRITE, NEVER A STREAM (crumbs-61, red-team 48's LOW): the develop's ring (`album_doorbell`, the one ring
     for a write that moved many rows) says so in its payload, and the album asks at once, where an arrival's contentless
     ping waits for the tick: the cover lifts on the host's screen and every guest learns it in the same second. */
  it("★ a ring that says it is a moment (a develop) asks at once, never at the tick", () => {
    const { fire, current } = setup();
    current().answer("SUBSCRIBED");
    current().ring({
      type: "broadcast",
      event: "ping",
      payload: { moment: true },
    });
    expect(fire).toHaveBeenCalledTimes(1);
    // And it spent the batch it would have joined: no second sync at the tick for the same ring.
    vi.advanceTimersByTime(10 * ALBUM_BATCH_MS);
    expect(fire).toHaveBeenCalledTimes(1);
  });

  it("★ a moment covers the arrivals that were waiting for the tick, and what comes after it waits as ever", () => {
    const { fire, current } = setup();
    current().answer("SUBSCRIBED");
    current().ring();
    vi.advanceTimersByTime(1_000);
    current().ring({ payload: { moment: true } });
    expect(fire).toHaveBeenCalledTimes(1);
    // The tick the first ping was waiting for (7,500 on this device's phase) has nothing left to ask for it: only a ping
    // after the moment rides it.
    vi.advanceTimersByTime(10_000);
    expect(fire).toHaveBeenCalledTimes(1);
    // It is 11,000 now; the device's next tick is 22,500 (7,500, then every fifteen seconds).
    current().ring();
    vi.advanceTimersByTime(11_499);
    expect(fire).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(fire).toHaveBeenCalledTimes(2);
  });

  it("an arrival's ping says nothing (or says something else), and waits for the tick like every ping", () => {
    const { fire, current } = setup();
    current().answer("SUBSCRIBED");
    for (const message of [
      undefined,
      {},
      { type: "broadcast", event: "ping", payload: {} },
      { payload: { moment: false } },
      { payload: { moment: "yes" } },
      { payload: null },
      null,
      "ping",
    ]) {
      current().ring(message);
    }
    expect(fire).not.toHaveBeenCalled();
    vi.advanceTimersByTime(ALBUM_BATCH_MS);
    expect(fire).toHaveBeenCalledTimes(1);
  });

  it("a socket that drops says so (the poll's fast cadence takes over)", () => {
    const { live, current } = setup();
    current().answer("SUBSCRIBED");
    current().answer("CHANNEL_ERROR");
    expect(live).toEqual([true, false]);
  });
});

describe("★ a hidden album is no listener", () => {
  it("leaves the channel the moment the tab hides", () => {
    const { realtime, page, current } = setup();
    current().answer("SUBSCRIBED");
    page.set(true);
    expect(realtime.leaves.map((l) => l.channel)).toEqual([current()]);
  });

  it("never syncs on a ping, even one already on the wire when it hid", () => {
    const { page, fire, current } = setup();
    current().answer("SUBSCRIBED");
    page.set(true);
    current().ring();
    vi.advanceTimersByTime(10 * ALBUM_BATCH_MS);
    expect(fire).not.toHaveBeenCalled();
  });

  it("★ nor on a moment already on the wire when it hid: the return's catch-up is the one sync, and it carries the develop", () => {
    const { page, fire, current } = setup();
    current().answer("SUBSCRIBED");
    page.set(true);
    current().ring({ payload: { moment: true } });
    vi.advanceTimersByTime(10 * ALBUM_BATCH_MS);
    expect(fire).not.toHaveBeenCalled();
  });

  it("drops a batch that was waiting for its tick: the return's catch-up covers it", () => {
    const { page, fire, current } = setup();
    current().answer("SUBSCRIBED");
    current().ring();
    page.set(true);
    vi.advanceTimersByTime(10 * ALBUM_BATCH_MS);
    expect(fire).not.toHaveBeenCalled();
  });

  it("a tab that opens hidden joins nothing until it is shown", async () => {
    const { realtime, page, current } = setup({ hidden: true });
    expect(realtime.made).toHaveLength(0);
    page.set(false);
    await flush();
    expect(realtime.made).toHaveLength(1);
    expect(current().subscribes).toBe(1);
  });
});

describe("★ the return", () => {
  it("rejoins once its leave has landed, and syncs nothing itself (the poll's catch-up is the one sync)", async () => {
    const { realtime, page, fire, current } = setup();
    const first = current();
    first.answer("SUBSCRIBED");
    page.set(true);
    await realtime.landLeaves();
    page.set(false);
    await flush();
    expect(realtime.made).toHaveLength(2);
    expect(current()).not.toBe(first);
    expect(current().subscribes).toBe(1);
    vi.advanceTimersByTime(10 * ALBUM_BATCH_MS);
    expect(fire).not.toHaveBeenCalled();
    // And the new channel's pings batch as before.
    current().answer("SUBSCRIBED");
    current().ring();
    vi.advanceTimersByTime(ALBUM_BATCH_MS);
    expect(fire).toHaveBeenCalledTimes(1);
  });

  it("a quick hide and show never subscribes a channel still leaving: it waits for the leave, then joins", async () => {
    const { realtime, page, current } = setup();
    const first = current();
    first.answer("SUBSCRIBED");
    page.set(true);
    page.set(false);
    page.set(true);
    page.set(false);
    await flush();
    // The leave has not landed: no second channel yet, and the leaving one was never asked to subscribe again.
    expect(realtime.made).toHaveLength(1);
    expect(first.subscribes).toBe(1);
    await realtime.landLeaves();
    expect(realtime.made).toHaveLength(2);
    expect(current().subscribes).toBe(1);
    expect(realtime.list).toEqual([current()]);
  });

  it("★ the Live mark holds across a rejoin answered within the grace (no blink on every return)", async () => {
    const { realtime, page, live, current } = setup();
    current().answer("SUBSCRIBED");
    page.set(true);
    await realtime.landLeaves();
    page.set(false);
    await flush();
    vi.advanceTimersByTime(REJOIN_GRACE_MS - 1);
    current().answer("SUBSCRIBED");
    vi.advanceTimersByTime(REJOIN_GRACE_MS);
    expect(live).toEqual([true]);
  });

  it("…and drops it when the rejoin is not answered in time, coming back when it is", async () => {
    const { realtime, page, live, current } = setup();
    current().answer("SUBSCRIBED");
    page.set(true);
    await realtime.landLeaves();
    page.set(false);
    await flush();
    vi.advanceTimersByTime(REJOIN_GRACE_MS);
    expect(live).toEqual([true, false]);
    current().answer("SUBSCRIBED");
    expect(live).toEqual([true, false, true]);
  });

  it("a rejoin refused says so at once", async () => {
    const { realtime, page, live, current } = setup();
    current().answer("SUBSCRIBED");
    page.set(true);
    await realtime.landLeaves();
    page.set(false);
    await flush();
    current().answer("TIMED_OUT");
    expect(live).toEqual([true, false]);
  });

  it("a leave's own CLOSED is never read as the socket dropping", async () => {
    const { realtime, page, live, current } = setup();
    current().answer("SUBSCRIBED");
    page.set(true);
    await realtime.landLeaves();
    expect(live).toEqual([true]);
  });
});

describe("closing (an unmount)", () => {
  it("leaves, says not live, and stops listening to the page", async () => {
    const { realtime, page, live, line, current } = setup();
    current().answer("SUBSCRIBED");
    line.close();
    expect(realtime.leaves).toHaveLength(1);
    expect(live).toEqual([true, false]);
    expect(page.listeners.size).toBe(0);
    await realtime.landLeaves();
    page.set(false);
    await flush();
    expect(realtime.made).toHaveLength(1);
  });

  it("closed while a leave is in flight, it never joins again", async () => {
    const { realtime, page, line } = setup();
    page.set(true);
    page.set(false);
    line.close();
    await realtime.landLeaves();
    expect(realtime.made).toHaveLength(1);
  });

  it("★ a remount (the album's access flip) never joins the channel its predecessor is still leaving", async () => {
    const { realtime, page, line, current } = setup();
    const first = current();
    first.answer("SUBSCRIBED");
    line.close();
    // The new line opens in the same commit, while the old leave is on the wire.
    const fire = vi.fn();
    const live: boolean[] = [];
    connectDoorbell({
      client: realtime.client as never,
      topic: "gallery:qr-1",
      fire,
      setLive: (v) => live.push(v),
      doc: page.doc,
      coalescer: { random: () => 0.5 },
    });
    expect(first.subscribes).toBe(1);
    expect(realtime.made).toHaveLength(1);
    await realtime.landLeaves();
    expect(realtime.made).toHaveLength(2);
    const second = current();
    expect(second.subscribes).toBe(1);
    second.answer("SUBSCRIBED");
    expect(live).toEqual([true]);
    second.ring();
    vi.advanceTimersByTime(ALBUM_BATCH_MS);
    expect(fire).toHaveBeenCalledTimes(1);
  });
});

describe("the hook", () => {
  it("opens one line while enabled, none while not, and closes it on unmount", async () => {
    const realtime = fakeRealtime();
    vi.doMock("@/lib/supabase/client", () => ({
      createClient: () => realtime.client,
    }));
    vi.resetModules();
    const { useGalleryDoorbell: hook } = await import("./use-gallery-doorbell");
    const onRefresh = vi.fn();
    const { result, rerender, unmount } = renderHook(
      ({ enabled }) => hook({ qrToken: "qr-1", enabled, onRefresh }),
      { initialProps: { enabled: false } },
    );
    expect(realtime.made).toHaveLength(0);
    rerender({ enabled: true });
    expect(realtime.made).toHaveLength(1);
    act(() => realtime.made[0].answer("SUBSCRIBED"));
    expect(result.current.live).toBe(true);
    unmount();
    expect(realtime.leaves).toHaveLength(1);
    vi.doUnmock("@/lib/supabase/client");
  });

  it("★ in the page itself: a hidden tab leaves the channel, and a ping it still hears syncs nothing", async () => {
    const realtime = fakeRealtime();
    vi.doMock("@/lib/supabase/client", () => ({
      createClient: () => realtime.client,
    }));
    vi.resetModules();
    const { useGalleryDoorbell: hook } = await import("./use-gallery-doorbell");
    const onRefresh = vi.fn();
    renderHook(() => hook({ qrToken: "qr-1", enabled: true, onRefresh }));
    const channel = realtime.made[0];
    act(() => channel.answer("SUBSCRIBED"));
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    try {
      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });
      expect(realtime.leaves.map((l) => l.channel)).toEqual([channel]);
      act(() => channel.ring());
      act(() => {
        vi.advanceTimersByTime(10 * ALBUM_BATCH_MS);
      });
      expect(onRefresh).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => false,
      });
      vi.doUnmock("@/lib/supabase/client");
    }
  });

  it("is the one export the album's surfaces call", () => {
    expect(typeof useGalleryDoorbell).toBe("function");
  });
});
