/**
 * THE HYBRID CADENCE (use-live-poll.ts): a minute's net while the socket is up, twelve seconds while it is down,
 * NOTHING while the tab is hidden, and one poll at once the moment it comes back. ★ The hidden rule is pinned against
 * the two ways it leaked: a tab that MOUNTS hidden (a link opened in a background tab) started its interval anyway,
 * and a socket whose state changes while the tab is hidden (the doorbell leaves its channel when the tab hides,
 * album-calm) re-ran the cadence and started it again, under a tab nobody was looking at.
 */
import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FAST_POLL_MS, SLOW_POLL_MS, useLivePoll } from "./use-live-poll";

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

beforeEach(() => {
  vi.useFakeTimers();
  setHidden(false);
});
afterEach(() => {
  vi.useRealTimers();
  setHidden(false);
});

function mount(props: { enabled?: boolean; live?: boolean } = {}) {
  const onPoll = vi.fn();
  const view = renderHook(
    ({ enabled, live }) => useLivePoll({ enabled, live, onPoll }),
    {
      initialProps: {
        enabled: props.enabled ?? true,
        live: props.live ?? true,
      },
    },
  );
  return { onPoll, ...view };
}

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
    rerender({ enabled: true, live: false });
    vi.advanceTimersByTime(FAST_POLL_MS * 10);
    rerender({ enabled: true, live: true });
    vi.advanceTimersByTime(SLOW_POLL_MS * 3);
    expect(onPoll).not.toHaveBeenCalled();
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
