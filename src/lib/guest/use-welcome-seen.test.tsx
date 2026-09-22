/**
 * Pins for the welcome-seen flag: once per device per event for an ordinary guest, NEVER for the demo
 * (Will, 2026-09-21, "the door's first look": "it should treat each visit as a fresh visit, even if
 * it's returning. That way every demo is end-to-end."). `door-fixes`, added by his 23:46 EDT
 * override riding this lane.
 */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useWelcomeSeen } from "@/lib/guest/use-welcome-seen";

const QR = "welcome-seen-qr-1";

beforeEach(() => {
  localStorage.clear();
});

describe("useWelcomeSeen: an ordinary guest", () => {
  it("starts unseen, and markSeen persists it for this device", () => {
    const { result } = renderHook(() => useWelcomeSeen(QR, false));
    expect(result.current[0]).toBe(false);

    act(() => result.current[1]());
    expect(result.current[0]).toBe(true);
    expect(localStorage.getItem(`pr_welcome_${QR}`)).toBe("1");
  });

  it("a fresh hook instance reads a flag an earlier visit already wrote", () => {
    localStorage.setItem(`pr_welcome_${QR}`, "1");
    const { result } = renderHook(() => useWelcomeSeen(QR, false));
    expect(result.current[0]).toBe(true);
  });
});

describe("useWelcomeSeen: the demo is never seen (door-fixes)", () => {
  it("reads unseen even when this device's flag is already set", () => {
    localStorage.setItem(`pr_welcome_${QR}`, "1");
    const { result } = renderHook(() => useWelcomeSeen(QR, true));
    expect(result.current[0]).toBe(false);
  });

  it("markSeen still advances THIS visit (ephemeral), but persists nothing for the next one", () => {
    // A first cut of this fix made `seen` permanently false, which broke the demo itself: Continue
    // never advanced the itinerary past "welcome" because computeDoor kept re-adding the step. The
    // real contract is narrower: this MOUNT still moves forward once markSeen fires (or "Continue"
    // would loop forever within a single visit); nothing about it ever reaches localStorage.
    const { result } = renderHook(() => useWelcomeSeen(QR, true));
    expect(result.current[0]).toBe(false);
    act(() => result.current[1]());
    expect(result.current[0]).toBe(true);
    expect(localStorage.getItem(`pr_welcome_${QR}`)).toBeNull();

    // A brand new mount - the next visitor, a reload, a shared link - starts over regardless.
    const again = renderHook(() => useWelcomeSeen(QR, true));
    expect(again.result.current[0]).toBe(false);
  });

  it("never taints an ordinary (non-demo) event's own flag under the same key shape", () => {
    // Two different qr_tokens, one demo and one not - the demo's own no-write guarantee is
    // per-flag already (the key is qrToken-scoped), pinned here so a future demo qrToken reuse
    // could never read as "the demo made this event's welcome seen" and vice versa.
    const other = "other-event-qr-2";
    const demo = renderHook(() => useWelcomeSeen(QR, true));
    act(() => demo.result.current[1]());
    const real = renderHook(() => useWelcomeSeen(other, false));
    act(() => real.result.current[1]());
    expect(localStorage.getItem(`pr_welcome_${QR}`)).toBeNull();
    expect(localStorage.getItem(`pr_welcome_${other}`)).toBe("1");
  });
});
