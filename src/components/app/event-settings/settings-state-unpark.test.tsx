/**
 * ★ A SAVE'S TRANSITION THAT REACT PARKS FOR GOOD IS LET GO (crumbs-89, red-team 57b): once a save has answered, a caller
 * still waiting on the server's row is nudged with one empty update at 1, 2.5, 5 and 9 seconds, and nothing at all once it
 * no longer waits. The park itself is React's (measured on a production build: `settings-state-unpark.ts`); what is
 * pinned here is the nudge's own contract, since a nudge that never fires is the bug back, and one that fires while
 * nothing waits is a render for nothing.
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

/** The hook in a component that counts its own renders. */
function mount(waiting: { now: boolean }) {
  let renders = 0;
  const view = renderHook(() => {
    renders += 1;
    return useUnparkAfterSave(waiting.now);
  });
  return { view, renders: () => renders };
}

describe("the nudge after a save", () => {
  it("★ re-renders its caller at 1, 2.5, 5 and 9 seconds while the caller still waits on its commit", () => {
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
    // And then it rests: four nudges a save, never a loop.
    act(() => vi.advanceTimersByTime(60_000));
    expect(renders()).toBe(before + 4);
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

  it("a newer save starts the nudges over, and an unmounted caller is never nudged", () => {
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
    view.unmount();
    expect(() => act(() => vi.advanceTimersByTime(20_000))).not.toThrow();
  });
});
