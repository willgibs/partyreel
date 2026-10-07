/**
 * ★ A SAVE'S TRANSITION THAT REACT PARKS FOR GOOD IS LET GO (crumbs-89, red-team 57b), UNTIL ITS COMMIT LANDS (crumbs-91,
 * red-team 57c): once a save has answered, a caller still waiting on the server's row is nudged with one empty update
 * at 1, 2.5, 5 and 9 seconds and then every 4 seconds while it waits, nothing at all once it no longer waits, and
 * nothing past five minutes after the answer. The park itself is React's (measured on a production build:
 * `settings-state-unpark.ts`); what is pinned here is the nudge's own contract, since a nudge that stops while the
 * caller still waits is the bug back (a slow stream commits after the window), one that fires while nothing waits is a
 * render for nothing, and one with no end is a loop.
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useUnparkAfterSave } from "./settings-state-unpark";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

const SECOND = 1000;
const MINUTE = 60 * SECOND;

/** The hook in a component that counts its own renders. */
function mount(waiting: { now: boolean }) {
  let renders = 0;
  const view = renderHook(() => {
    renders += 1;
    return useUnparkAfterSave(waiting.now);
  });
  return { view, renders: () => renders };
}

/**
 * Time passing half a second an act, so every nudge renders on its own: one act batches every update inside it into
 * a single render, which would count a minute of nudges as one. (A case that wants none can pass time in one act: a
 * batch hides how many, never whether.)
 */
function pass(ms: number) {
  for (let left = ms; left > 0; left -= 500)
    act(() => vi.advanceTimersByTime(Math.min(500, left)));
}

describe("the nudge after a save", () => {
  it("★ re-renders its caller at 1, 2.5, 5 and 9 seconds, then every 4 seconds, while the caller still waits on its commit", () => {
    const waiting = { now: true };
    const { view, renders } = mount(waiting);
    const before = renders();
    act(() => view.result.current());
    act(() => vi.advanceTimersByTime(999));
    expect(renders()).toBe(before);
    act(() => vi.advanceTimersByTime(1));
    expect(renders()).toBe(before + 1);
    act(() => vi.advanceTimersByTime(1500));
    expect(renders()).toBe(before + 2);
    act(() => vi.advanceTimersByTime(2500));
    expect(renders()).toBe(before + 3);
    act(() => vi.advanceTimersByTime(4000));
    expect(renders()).toBe(before + 4);
    // Reshaped on purpose (crumbs-91, red-team 57c's LOW): this rested here, "four nudges a save, never a loop", and
    // that reason expired. The revalidated tree commits only when the action's response stream ends, and on a slow
    // desk build it ended after the fourth nudge: an invite remove answered at 1.75 s stood "Saving… 1 on the list"
    // for 90 s, and a door save held its row for 2 minutes. It nudges on at a steady step while the caller waits, and
    // the loop it guarded against is bounded by the ceiling instead (the next case).
    act(() => vi.advanceTimersByTime(3999));
    expect(renders()).toBe(before + 4);
    act(() => vi.advanceTimersByTime(1));
    expect(renders()).toBe(before + 5);
    act(() => vi.advanceTimersByTime(4000));
    expect(renders()).toBe(before + 6);
  });

  it("★ still nudges past the slow desk's 2 minutes, and stops at the ceiling, five minutes after the answer, though the caller waits on", () => {
    const waiting = { now: true };
    const { view, renders } = mount(waiting);
    const before = renders();
    act(() => view.result.current());
    pass(2 * MINUTE);
    const atTwoMinutes = renders();
    pass(10 * SECOND);
    expect(renders()).toBeGreaterThan(atTwoMinutes);
    pass(5 * MINUTE - 2 * MINUTE - 10 * SECOND);
    // The early four and the steady step's to the ceiling (13 s to 297 s), each a render of its own, and no more.
    expect(renders()).toBe(before + 4 + 72);
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(60 * MINUTE));
    expect(renders()).toBe(before + 4 + 72);
  });

  it("★ does nothing once the caller no longer waits: the commit landed, so a nudge would be a render for nothing", () => {
    const waiting = { now: true };
    const { view, renders } = mount(waiting);
    const before = renders();
    act(() => view.result.current());
    act(() => vi.advanceTimersByTime(1000));
    expect(renders()).toBe(before + 1);
    // The commit lands: the caller renders with nothing to wait on (its isPending false, its overlay empty).
    waiting.now = false;
    view.rerender();
    act(() => vi.advanceTimersByTime(20_000));
    expect(renders()).toBe(before + 2);
  });

  it("ends at the first nudge to find the commit landed in the steady step too, and leaves no timer behind", () => {
    const waiting = { now: true };
    const { view, renders } = mount(waiting);
    const before = renders();
    act(() => view.result.current());
    pass(13 * SECOND);
    expect(renders()).toBe(before + 5);
    waiting.now = false;
    view.rerender();
    act(() => vi.advanceTimersByTime(4 * SECOND));
    expect(renders()).toBe(before + 6);
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(10 * MINUTE));
    expect(renders()).toBe(before + 6);
  });

  it("a newer save starts the nudges over, its ceiling with them", () => {
    const waiting = { now: true };
    const { view, renders } = mount(waiting);
    const before = renders();
    act(() => view.result.current());
    act(() => vi.advanceTimersByTime(900));
    act(() => view.result.current());
    act(() => vi.advanceTimersByTime(900));
    // The first save's 1 s nudge was replaced by the second's, still 100 ms away.
    expect(renders()).toBe(before);
    act(() => vi.advanceTimersByTime(100));
    expect(renders()).toBe(before + 1);

    // A newer save near that one's ceiling carries its own: early nudges first, and on past the old five minutes.
    pass(4 * MINUTE + 50 * SECOND);
    act(() => view.result.current());
    const atNewer = renders();
    act(() => vi.advanceTimersByTime(1000));
    expect(renders()).toBe(atNewer + 1);
    pass(30 * SECOND);
    const pastTheOldCeiling = renders();
    pass(30 * SECOND);
    expect(renders()).toBeGreaterThan(pastTheOldCeiling);
  });

  it("an unmounted caller is never nudged, and holds no timer", () => {
    const waiting = { now: true };
    const { view, renders } = mount(waiting);
    const before = renders();
    act(() => view.result.current());
    pass(13 * SECOND);
    expect(renders()).toBe(before + 5);
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
    expect(() => act(() => vi.advanceTimersByTime(10 * MINUTE))).not.toThrow();
    expect(renders()).toBe(before + 5);
  });
});
