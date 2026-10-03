import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { UploadsWait } from "@/lib/guest/upload-tracker";

import { useLiveUploadsWait } from "./event-experience-wait";

/**
 * ★ WHETHER WHAT SHE ADDS WAITS, LIVE ON THE PAGE (red-team 44's LOW): the page's server read it once, so an open page
 * kept a develop's promise over an album that had developed (Develop now, or the time passing) and, with the album's
 * head routed by it, would have kept her next upload out of the album. The reading starts at the server's, ends when
 * the develop time comes on this device's clock, and follows every word of the album's sync (a Develop now, a time
 * moved, none at all); approve-each keeps hers waiting for as long as the page's event says so.
 */
const T = Date.parse("2026-10-03T03:00:00.000Z");
const iso = (ms: number) => new Date(ms).toISOString();

function hook(initial: UploadsWait, moderationMode = "live") {
  return renderHook(
    (props: { initial: UploadsWait; moderationMode: string }) =>
      useLiveUploadsWait(props),
    { initialProps: { initial, moderationMode } },
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useLiveUploadsWait", () => {
  it("starts at the server's reading", () => {
    const at = iso(T + 60_000);
    const { result } = hook({ waits: true, developsAt: at });
    expect(result.current.reading).toEqual({ waits: true, developsAt: at });
  });

  it("★ ends when the develop time comes, with no reload", () => {
    const at = iso(T + 60_000);
    const { result } = hook({ waits: true, developsAt: at });
    act(() => {
      vi.advanceTimersByTime(59_000);
    });
    expect(result.current.reading.waits).toBe(true);
    act(() => {
      vi.advanceTimersByTime(1_500);
    });
    expect(result.current.reading).toEqual({ waits: false, developsAt: null });
  });

  it("keeps an approve-each album's uploads waiting for the host past its develop", () => {
    const at = iso(T + 60_000);
    const { result } = hook(
      { waits: true, developsAt: at },
      "hold_for_approval",
    );
    act(() => {
      vi.advanceTimersByTime(61_000);
    });
    expect(result.current.reading).toEqual({ waits: true, developsAt: null });
  });

  it("★ follows a Develop now the album's sync carries, at once and with no frame of the old promise", () => {
    const { result } = hook({ waits: true, developsAt: iso(T + 3_600_000) });
    act(() => {
      result.current.onSynced(iso(T - 1_000));
    });
    expect(result.current.reading).toEqual({ waits: false, developsAt: null });
  });

  it("★ never reads a develop already reached as ahead, even for a moment (an album developed before the page)", () => {
    const { result } = hook({ waits: false, developsAt: null });
    const seen: UploadsWait[] = [];
    act(() => {
      result.current.onSynced(iso(T - 86_400_000));
    });
    seen.push(result.current.reading);
    act(() => {
      vi.runOnlyPendingTimers();
    });
    seen.push(result.current.reading);
    expect(seen).toEqual([
      { waits: false, developsAt: null },
      { waits: false, developsAt: null },
    ]);
  });

  it("follows a develop time the host sets or moves, and one taken away", () => {
    const { result } = hook({ waits: false, developsAt: null });
    const later = iso(T + 7_200_000);
    act(() => {
      result.current.onSynced(later);
    });
    expect(result.current.reading).toEqual({ waits: true, developsAt: later });
    act(() => {
      result.current.onSynced(null);
    });
    expect(result.current.reading).toEqual({ waits: false, developsAt: null });
  });

  it("waits out a develop time further ahead than one timer can hold", () => {
    const at = iso(T + 30 * 86_400_000);
    const { result } = hook({ waits: true, developsAt: at });
    act(() => {
      vi.advanceTimersByTime(25 * 86_400_000);
    });
    expect(result.current.reading.waits).toBe(true);
    act(() => {
      vi.advanceTimersByTime(5 * 86_400_000 + 1_000);
    });
    expect(result.current.reading.waits).toBe(false);
  });

  it("adopts a fresh server reading when the page renders again with one (a refresh)", () => {
    const { result, rerender } = hook({ waits: false, developsAt: null });
    const at = iso(T + 60_000);
    rerender({
      initial: { waits: true, developsAt: at },
      moderationMode: "live",
    });
    expect(result.current.reading).toEqual({ waits: true, developsAt: at });
  });
});
