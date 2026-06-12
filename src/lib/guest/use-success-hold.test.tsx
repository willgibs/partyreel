/**
 * Pins for the success hold (Phase 4.5 S5): it holds until the beat AND the
 * refresh land, takes the lighter path on a gate-to-gate hop, flags slow, and
 * raises stalled on a hung refresh. Fake timers drive the beat/watchdog;
 * rerendering with a new `current` stands in for the RSC re-derive.
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useSuccessHold } from "./use-success-hold";

function setup(initial: string | null = "password") {
  return renderHook(
    ({ current }: { current: string | null }) =>
      useSuccessHold({
        current,
        minBeatMs: 900,
        slowMs: 1500,
        watchdogMs: 8000,
      }),
    { initialProps: { current: initial } },
  );
}

afterEach(() => vi.useRealTimers());

describe("useSuccessHold", () => {
  it("holds until BOTH the beat elapses and the refresh lands, then releases", () => {
    vi.useFakeTimers();
    const { result, rerender } = setup();
    expect(result.current.holding).toBe(false);

    act(() => result.current.onUnlocked());
    expect(result.current.holding).toBe(true);

    // Beat done but the refresh hasn't landed (current still "password").
    act(() => vi.advanceTimersByTime(900));
    expect(result.current.holding).toBe(true);

    // The RSC drops the gate -> current null = the full unlock landed.
    act(() => rerender({ current: null }));
    expect(result.current.holding).toBe(false);
  });

  it("does not release before the beat even if the refresh lands fast", () => {
    vi.useFakeTimers();
    const { result, rerender } = setup();
    act(() => result.current.onUnlocked());
    act(() => rerender({ current: null })); // refresh landed at ~0ms
    expect(result.current.holding).toBe(true); // beat not elapsed
    act(() => vi.advanceTimersByTime(900));
    expect(result.current.holding).toBe(false);
  });

  it("the lighter path: a password->account hop releases the hold (no exit)", () => {
    vi.useFakeTimers();
    const { result, rerender } = setup();
    act(() => result.current.onUnlocked());
    act(() => vi.advanceTimersByTime(900));
    act(() => rerender({ current: "account" }));
    expect(result.current.holding).toBe(false); // hands off to the account step
  });

  it("flags slow past 1.5s while still holding", () => {
    vi.useFakeTimers();
    const { result } = setup();
    act(() => result.current.onUnlocked());
    act(() => vi.advanceTimersByTime(1500));
    expect(result.current.holding).toBe(true);
    expect(result.current.slow).toBe(true);
    expect(result.current.stalled).toBe(false);
  });

  it("raises stalled when the refresh never lands (8s watchdog)", () => {
    vi.useFakeTimers();
    const { result } = setup();
    act(() => result.current.onUnlocked());
    act(() => vi.advanceTimersByTime(8000));
    expect(result.current.stalled).toBe(true);
    expect(result.current.holding).toBe(true); // the form never reappears; Retry is offered
  });

  it("a landed refresh is never reported as stalled", () => {
    vi.useFakeTimers();
    const { result, rerender } = setup();
    act(() => result.current.onUnlocked());
    act(() => vi.advanceTimersByTime(900));
    act(() => rerender({ current: null })); // landed + released
    act(() => vi.advanceTimersByTime(8000));
    expect(result.current.stalled).toBe(false);
  });
});
