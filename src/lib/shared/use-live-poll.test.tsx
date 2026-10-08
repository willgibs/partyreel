/**
 * THE HYBRID CADENCE (use-live-poll.ts): a minute's net while the socket is up, twelve seconds while it is down,
 * NOTHING while the tab is hidden, and one poll at once the moment it comes back. ★ The hidden rule is pinned against
 * the two ways it leaked: a tab that MOUNTS hidden (a link opened in a background tab) started its interval anyway,
 * and a socket whose state changes while the tab is hidden (the doorbell leaves its channel when the tab hides,
 * album-calm) re-ran the cadence and started it again, under a tab nobody was looking at.
 *
 * ★ AND THE POLLS REST (compute-levers; guest-flow.md, "The conditional poll"): the net under a live doorbell rests
 * at five minutes after ten untouched minutes and stops after two untouched hours, a touch waking it; the fallback
 * slows to a minute after a quiet minute and returns to twelve seconds on a change; a page watched untouched (the
 * reel's screen) never stops.
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  EDGE_QUIET_POLL_MS,
  FAST_POLL_MS,
  QUIET_AFTER_MS,
  REST_AFTER_MS,
  RESTED_POLL_MS,
  SLOW_POLL_MS,
  STOP_AFTER_MS,
  useLivePoll,
} from "./use-live-poll";

function setHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", {
    configurable: true,
    get: () => hidden,
  });
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => (hidden ? "hidden" : "visible"),
  });
}
function goHidden(hidden: boolean) {
  setHidden(hidden);
  document.dispatchEvent(new Event("visibilitychange"));
}
/** A person at the page: a press, a scroll or a key. */
function touch(type: "pointerdown" | "scroll" | "wheel" | "keydown") {
  window.dispatchEvent(new Event(type));
}
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

beforeEach(() => {
  vi.useFakeTimers();
  setHidden(false);
});
afterEach(() => {
  vi.useRealTimers();
  setHidden(false);
});

type Props = {
  enabled: boolean;
  live: boolean;
  changeKey: unknown;
  unattended?: () => boolean;
  atEdge?: () => boolean;
};

function mount(props: Partial<Props> = {}) {
  const onPoll = vi.fn<(ask: { exact: boolean }) => void>();
  const view = renderHook<void, Props>((p) => useLivePoll({ ...p, onPoll }), {
    initialProps: {
      enabled: props.enabled ?? true,
      live: props.live ?? true,
      changeKey: props.changeKey ?? "v1",
      unattended: props.unattended,
      atEdge: props.atEdge,
    },
  });
  return { onPoll, ...view };
}

/** Each ask's word on whether it must be the album's own answer, in order. */
const exacts = (onPoll: { mock: { calls: [{ exact: boolean }][] } }) =>
  onPoll.mock.calls.map(([ask]) => ask.exact);

describe("the cadence", () => {
  it("polls a minute apart while the socket is up, and twelve seconds apart while it is down", () => {
    const up = mount({ live: true });
    vi.advanceTimersByTime(SLOW_POLL_MS * 2);
    expect(up.onPoll).toHaveBeenCalledTimes(2);
    up.unmount();
    const down = mount({ live: false });
    vi.advanceTimersByTime(FAST_POLL_MS * 3);
    expect(down.onPoll).toHaveBeenCalledTimes(3);
  });

  it("switched off, nothing at all", () => {
    const { onPoll } = mount({ enabled: false });
    vi.advanceTimersByTime(SLOW_POLL_MS * 3);
    goHidden(true);
    goHidden(false);
    touch("pointerdown");
    expect(onPoll).not.toHaveBeenCalled();
  });
});

describe("★ a hidden tab polls nothing", () => {
  it("stops when the tab hides", () => {
    const { onPoll } = mount({ live: false });
    goHidden(true);
    vi.advanceTimersByTime(FAST_POLL_MS * 10);
    expect(onPoll).not.toHaveBeenCalled();
  });

  it("★ a tab that opens hidden polls nothing until it is shown", () => {
    setHidden(true);
    const { onPoll } = mount({ live: false });
    vi.advanceTimersByTime(FAST_POLL_MS * 10);
    expect(onPoll).not.toHaveBeenCalled();
    goHidden(false);
    expect(onPoll).toHaveBeenCalledTimes(1);
  });

  it("★ a socket that changes state under a hidden tab never starts the cadence again", () => {
    const { onPoll, rerender } = mount({ live: true });
    goHidden(true);
    // The doorbell leaves its channel when the tab hides; whatever the socket says meanwhile, nothing polls.
    rerender({ enabled: true, live: false, changeKey: "v1" });
    vi.advanceTimersByTime(FAST_POLL_MS * 10);
    rerender({ enabled: true, live: true, changeKey: "v1" });
    vi.advanceTimersByTime(SLOW_POLL_MS * 3);
    expect(onPoll).not.toHaveBeenCalled();
  });

  it("★ a hidden tab's touch asks nothing", () => {
    const { onPoll } = mount({ live: true });
    vi.advanceTimersByTime(STOP_AFTER_MS);
    const asked = onPoll.mock.calls.length;
    setHidden(true);
    touch("keydown");
    vi.advanceTimersByTime(HOUR);
    expect(onPoll).toHaveBeenCalledTimes(asked);
  });
});

describe("★ the return", () => {
  it("polls once, at once, then keeps the cadence", () => {
    const { onPoll } = mount({ live: true });
    goHidden(true);
    vi.advanceTimersByTime(3 * 60 * 60_000);
    goHidden(false);
    expect(onPoll).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(SLOW_POLL_MS - 1);
    expect(onPoll).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(onPoll).toHaveBeenCalledTimes(2);
  });
});

describe("★ the net rests (the doorbell live)", () => {
  it("asks every minute for ten untouched minutes, then every five", () => {
    const { onPoll } = mount({ live: true });
    vi.advanceTimersByTime(REST_AFTER_MS);
    expect(onPoll).toHaveBeenCalledTimes(10);
    vi.advanceTimersByTime(RESTED_POLL_MS - 1);
    expect(onPoll).toHaveBeenCalledTimes(10);
    vi.advanceTimersByTime(1);
    expect(onPoll).toHaveBeenCalledTimes(11);
  });

  it("★ stops after two untouched hours, and asks nothing more however long the page stays lit", () => {
    const { onPoll } = mount({ live: true });
    vi.advanceTimersByTime(STOP_AFTER_MS);
    // Ten at the minute, then every five minutes from the fifteenth to the 115th: 31 where the old net asked 120.
    expect(onPoll).toHaveBeenCalledTimes(31);
    vi.advanceTimersByTime(10 * HOUR);
    expect(onPoll).toHaveBeenCalledTimes(31);
  });

  it("a touch wakes a stopped net: one ask at once, then the minute again", () => {
    const { onPoll } = mount({ live: true });
    vi.advanceTimersByTime(STOP_AFTER_MS + HOUR);
    expect(onPoll).toHaveBeenCalledTimes(31);
    touch("pointerdown");
    expect(onPoll).toHaveBeenCalledTimes(32);
    vi.advanceTimersByTime(SLOW_POLL_MS);
    expect(onPoll).toHaveBeenCalledTimes(33);
  });

  it("a touch at rest wakes it to the minute, asking at once only when the last ask is older than a minute", () => {
    const { onPoll } = mount({ live: true });
    vi.advanceTimersByTime(REST_AFTER_MS + 2 * MINUTE);
    expect(onPoll).toHaveBeenCalledTimes(10);
    touch("scroll");
    expect(onPoll).toHaveBeenCalledTimes(11);
    // Just after an ask, a touch waits out the minute rather than asking twice.
    touch("wheel");
    expect(onPoll).toHaveBeenCalledTimes(11);
    vi.advanceTimersByTime(SLOW_POLL_MS);
    expect(onPoll).toHaveBeenCalledTimes(12);
  });

  it("a page in use never rests: every touch keeps the minute", () => {
    const { onPoll } = mount({ live: true });
    for (let i = 0; i < 6; i++) {
      vi.advanceTimersByTime(5 * MINUTE);
      touch("keydown");
    }
    expect(onPoll).toHaveBeenCalledTimes(30);
    vi.advanceTimersByTime(REST_AFTER_MS);
    expect(onPoll).toHaveBeenCalledTimes(40);
  });

  it("★ a page watched untouched (the reel's screen) rests its net but never stops it", () => {
    const { onPoll } = mount({ live: true, unattended: () => true });
    vi.advanceTimersByTime(4 * HOUR);
    // Ten at the minute, then every five minutes to the fourth hour: 56, where a phone's stops at 31.
    expect(onPoll).toHaveBeenCalledTimes(56);
  });

  it("asks whether the page is watched untouched at the moment it would stop, never before", () => {
    let screen = false;
    const { onPoll } = mount({ live: true, unattended: () => screen });
    vi.advanceTimersByTime(HOUR);
    screen = true;
    vi.advanceTimersByTime(3 * HOUR);
    expect(onPoll).toHaveBeenCalledTimes(56);
  });

  it("keeps its clocks through a socket's flap: a drop and a rejoin are no touch", () => {
    const { onPoll, rerender } = mount({ live: true });
    vi.advanceTimersByTime(9 * MINUTE);
    expect(onPoll).toHaveBeenCalledTimes(9);
    rerender({ enabled: true, live: false, changeKey: "v1" });
    rerender({ enabled: true, live: true, changeKey: "v1" });
    vi.advanceTimersByTime(SLOW_POLL_MS);
    expect(onPoll).toHaveBeenCalledTimes(10);
    vi.advanceTimersByTime(RESTED_POLL_MS - 1);
    expect(onPoll).toHaveBeenCalledTimes(10);
    vi.advanceTimersByTime(1);
    expect(onPoll).toHaveBeenCalledTimes(11);
  });
});

describe("★ the fallback rests on what changes (the doorbell down)", () => {
  it("asks every twelve seconds for a quiet minute, then every minute", () => {
    const { onPoll } = mount({ live: false });
    vi.advanceTimersByTime(QUIET_AFTER_MS);
    expect(onPoll).toHaveBeenCalledTimes(5);
    vi.advanceTimersByTime(SLOW_POLL_MS - 1);
    expect(onPoll).toHaveBeenCalledTimes(5);
    vi.advanceTimersByTime(1);
    expect(onPoll).toHaveBeenCalledTimes(6);
    vi.advanceTimersByTime(HOUR);
    expect(onPoll).toHaveBeenCalledTimes(66);
  });

  it("★ returns to twelve seconds the moment something changes, for a minute from the change", () => {
    const { onPoll, rerender } = mount({ live: false });
    vi.advanceTimersByTime(2 * MINUTE);
    expect(onPoll).toHaveBeenCalledTimes(6);
    act(() => rerender({ enabled: true, live: false, changeKey: "v2" }));
    vi.advanceTimersByTime(FAST_POLL_MS);
    expect(onPoll).toHaveBeenCalledTimes(7);
    vi.advanceTimersByTime(QUIET_AFTER_MS - FAST_POLL_MS);
    expect(onPoll).toHaveBeenCalledTimes(11);
    vi.advanceTimersByTime(SLOW_POLL_MS - 1);
    expect(onPoll).toHaveBeenCalledTimes(11);
    vi.advanceTimersByTime(1);
    expect(onPoll).toHaveBeenCalledTimes(12);
  });

  it("never stops, however long nobody touches it: the fallback is the only way the album hears anything", () => {
    const { onPoll } = mount({ live: false });
    vi.advanceTimersByTime(8 * HOUR);
    expect(onPoll).toHaveBeenCalledTimes(5 + 8 * 60 - 1);
  });

  it("a touch neither wakes nor slows it", () => {
    const { onPoll } = mount({ live: false });
    vi.advanceTimersByTime(2 * MINUTE);
    expect(onPoll).toHaveBeenCalledTimes(6);
    touch("pointerdown");
    vi.advanceTimersByTime(FAST_POLL_MS);
    expect(onPoll).toHaveBeenCalledTimes(6);
  });

  it("a socket that drops starts the fallback on its fast minute", () => {
    const { onPoll, rerender } = mount({ live: true });
    vi.advanceTimersByTime(REST_AFTER_MS + RESTED_POLL_MS);
    expect(onPoll).toHaveBeenCalledTimes(11);
    rerender({ enabled: true, live: false, changeKey: "v1" });
    vi.advanceTimersByTime(FAST_POLL_MS);
    expect(onPoll).toHaveBeenCalledTimes(12);
  });
});

describe("★ each ask says whether it must be the album's own answer (X5)", () => {
  it("the net under a live doorbell only checks; the return's catch-up is exact", () => {
    const { onPoll } = mount({ live: true });
    vi.advanceTimersByTime(2 * SLOW_POLL_MS);
    goHidden(true);
    goHidden(false);
    expect(exacts(onPoll)).toEqual([false, false, true]);
  });

  it("the moving fallback carries the album (exact); a minute with nothing new, it only checks", () => {
    const { onPoll } = mount({ live: false });
    vi.advanceTimersByTime(QUIET_AFTER_MS + SLOW_POLL_MS);
    // 12, 24, 36 and 48 s inside the moving minute; 60 s ends it with nothing new; then the quiet minute.
    expect(exacts(onPoll)).toEqual([true, true, true, true, false, false]);
  });

  it("a touch's wake only checks", () => {
    const { onPoll } = mount({ live: true });
    vi.advanceTimersByTime(STOP_AFTER_MS);
    onPoll.mockClear();
    touch("pointerdown");
    expect(exacts(onPoll)).toEqual([false]);
  });
});

describe("★ where the CDN answers the album's quiet polls, a quiet fallback is livelier (AB5, X5)", () => {
  const atEdge = () => true;

  it("asks every twenty seconds while someone looks, then today's minute once nobody has for ten minutes", () => {
    const { onPoll } = mount({ live: false, atEdge });
    vi.advanceTimersByTime(QUIET_AFTER_MS);
    expect(onPoll).toHaveBeenCalledTimes(5);
    vi.advanceTimersByTime(EDGE_QUIET_POLL_MS - 1);
    expect(onPoll).toHaveBeenCalledTimes(5);
    vi.advanceTimersByTime(1);
    expect(onPoll).toHaveBeenCalledTimes(6);
    vi.advanceTimersByTime(REST_AFTER_MS - QUIET_AFTER_MS - EDGE_QUIET_POLL_MS);
    expect(onPoll).toHaveBeenCalledTimes(
      5 + (REST_AFTER_MS - QUIET_AFTER_MS) / EDGE_QUIET_POLL_MS,
    );
    const rested = onPoll.mock.calls.length;
    vi.advanceTimersByTime(SLOW_POLL_MS - 1);
    expect(onPoll).toHaveBeenCalledTimes(rested);
    vi.advanceTimersByTime(1);
    expect(onPoll).toHaveBeenCalledTimes(rested + 1);
    // Still never stopped: the fallback is the only way the album hears anything.
    vi.advanceTimersByTime(8 * HOUR);
    expect(onPoll).toHaveBeenCalledTimes(rested + 1 + 8 * 60);
  });

  it("a touch wakes a resting one to twenty seconds, asking at once when its last ask is that old", () => {
    const { onPoll } = mount({ live: false, atEdge });
    vi.advanceTimersByTime(REST_AFTER_MS + 30_000);
    const before = onPoll.mock.calls.length;
    touch("scroll");
    expect(onPoll).toHaveBeenCalledTimes(before + 1);
    expect(onPoll.mock.calls.at(-1)?.[0]).toEqual({ exact: false });
    vi.advanceTimersByTime(EDGE_QUIET_POLL_MS);
    expect(onPoll).toHaveBeenCalledTimes(before + 2);
  });

  it("a touch when its last ask is fresh asks nothing, only quickens the next", () => {
    const { onPoll } = mount({ live: false, atEdge });
    vi.advanceTimersByTime(REST_AFTER_MS + 5_000);
    const before = onPoll.mock.calls.length;
    touch("keydown");
    expect(onPoll).toHaveBeenCalledTimes(before);
    vi.advanceTimersByTime(EDGE_QUIET_POLL_MS);
    expect(onPoll).toHaveBeenCalledTimes(before + 1);
  });

  it("a page watched untouched (the party screen) keeps the twenty seconds for good", () => {
    const { onPoll } = mount({ live: false, atEdge, unattended: () => true });
    vi.advanceTimersByTime(QUIET_AFTER_MS);
    const quiet = onPoll.mock.calls.length;
    vi.advanceTimersByTime(3 * HOUR);
    expect(onPoll).toHaveBeenCalledTimes(
      quiet + (3 * HOUR) / EDGE_QUIET_POLL_MS,
    );
  });

  it("a change puts it back on twelve seconds for a minute", () => {
    const { onPoll, rerender } = mount({ live: false, atEdge });
    vi.advanceTimersByTime(QUIET_AFTER_MS + EDGE_QUIET_POLL_MS);
    expect(onPoll).toHaveBeenCalledTimes(6);
    act(() =>
      rerender({ enabled: true, live: false, changeKey: "v2", atEdge }),
    );
    vi.advanceTimersByTime(FAST_POLL_MS);
    expect(onPoll).toHaveBeenCalledTimes(7);
  });

  it("asked at each step: an album the CDN stops answering (a password now) slows to today's minute", () => {
    let edge = true;
    const { onPoll } = mount({ live: false, atEdge: () => edge });
    vi.advanceTimersByTime(QUIET_AFTER_MS + EDGE_QUIET_POLL_MS);
    expect(onPoll).toHaveBeenCalledTimes(6);
    edge = false;
    vi.advanceTimersByTime(EDGE_QUIET_POLL_MS);
    expect(onPoll).toHaveBeenCalledTimes(7);
    vi.advanceTimersByTime(SLOW_POLL_MS - 1);
    expect(onPoll).toHaveBeenCalledTimes(7);
    vi.advanceTimersByTime(1);
    expect(onPoll).toHaveBeenCalledTimes(8);
  });

  it("★ moving, it keeps its twelve seconds: each of those polls is the album's own answer however asked", () => {
    const { onPoll } = mount({ live: false, atEdge });
    vi.advanceTimersByTime(QUIET_AFTER_MS);
    expect(onPoll).toHaveBeenCalledTimes(QUIET_AFTER_MS / FAST_POLL_MS);
  });

  it("the net under a live doorbell is untouched by it", () => {
    const { onPoll } = mount({ live: true, atEdge });
    vi.advanceTimersByTime(REST_AFTER_MS);
    expect(onPoll).toHaveBeenCalledTimes(REST_AFTER_MS / SLOW_POLL_MS);
  });
});
