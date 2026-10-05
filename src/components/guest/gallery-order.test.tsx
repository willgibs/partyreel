/**
 * THE GUEST ALBUM'S ORDER, LIVE (`gallery-order.ts`): it starts from the page's word (so the hydration agrees), turns
 * at its moment on this device's clock and on a return to the tab, follows a develop that moves, and keeps her choice
 * only as a departure from the turn, remembered on this device for this album.
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useGuestAlbumOrder } from "@/components/guest/gallery-order";
import {
  ALBUM_SORT_COOKIE,
  readChosenSort,
  type AlbumTurnFacts,
  type GuestAlbumOrder,
} from "@/lib/shared/album-order";

const EVENT = "11111111-2222-4333-8444-555555555555";
// A Saturday party read in UTC turns at 09:00 UTC on Sunday.
const PARTY: AlbumTurnFacts = { eventDate: "2026-10-03" };
const TURN = Date.parse("2026-10-04T09:00:00Z");

const cookie = () =>
  document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${ALBUM_SORT_COOKIE}=`))
    ?.slice(ALBUM_SORT_COOKIE.length + 1) ?? null;

function hook(
  facts: AlbumTurnFacts,
  initial: GuestAlbumOrder | undefined,
  isDemo = false,
) {
  return renderHook(
    (props: { facts: AlbumTurnFacts }) =>
      useGuestAlbumOrder({
        eventId: EVENT,
        initial,
        facts: props.facts,
        isDemo,
      }),
    { initialProps: { facts } },
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  // The cookie is the guest album's (`Path=/e`): read it from an album's address, as the page does.
  window.history.replaceState(null, "", "/e/0123456789abcdef");
  document.cookie = `${ALBUM_SORT_COOKIE}=; Path=/e; Max-Age=0`;
});
afterEach(() => {
  vi.useRealTimers();
  window.history.replaceState(null, "", "/");
});

describe("the turn, on this device's clock", () => {
  it("★ turns at its own moment for a reader whose page is open across it", () => {
    vi.setSystemTime(TURN - 60_000);
    const { result } = hook(PARTY, {
      zone: "UTC",
      own: "newest",
      chosen: null,
    });
    expect(result.current.sort).toBe("newest");
    act(() => {
      vi.advanceTimersByTime(59_000);
    });
    expect(result.current.sort).toBe("newest");
    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(result.current.sort).toBe("oldest");
  });

  it("starts from the page's word, then reads its own clock (a page rendered a breath before the turn)", () => {
    vi.setSystemTime(TURN + 5_000);
    const { result } = hook(PARTY, {
      zone: "UTC",
      own: "newest",
      chosen: null,
    });
    // After mount the clock has spoken: the album is in order.
    expect(result.current.sort).toBe("oldest");
  });

  it("reads the clock again on a return to the tab (a phone asleep through 9 am)", () => {
    vi.setSystemTime(TURN - 3_600_000);
    const { result } = hook(PARTY, {
      zone: "UTC",
      own: "newest",
      chosen: null,
    });
    // The timers of a sleeping tab never fired; the wall clock moved on.
    vi.setSystemTime(TURN + 3_600_000);
    act(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => "visible",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(result.current.sort).toBe("oldest");
  });

  it("follows a develop that moves: a Develop now turns the album at once", () => {
    vi.setSystemTime(TURN - 6 * 3_600_000);
    const { result, rerender } = hook(
      { ...PARTY, developsAt: new Date(TURN).toISOString() },
      { zone: "UTC", own: "newest", chosen: null },
    );
    expect(result.current.sort).toBe("newest");
    rerender({
      facts: { ...PARTY, developsAt: new Date(Date.now()).toISOString() },
    });
    expect(result.current.sort).toBe("oldest");
  });

  it("an undated album, the demo and a page that decided nothing stay newest first", () => {
    vi.setSystemTime(TURN + 86_400_000);
    expect(
      hook({ eventDate: null }, { zone: "UTC", own: "newest", chosen: null })
        .result.current.sort,
    ).toBe("newest");
    expect(
      hook(PARTY, { zone: "UTC", own: "newest", chosen: null }, true).result
        .current.sort,
    ).toBe("newest");
    expect(hook(PARTY, undefined).result.current.sort).toBe("newest");
  });
});

describe("her choice", () => {
  it("★ a departure is kept and remembered for this album; choosing the album's own forgets it, and the album keeps turning", () => {
    vi.setSystemTime(TURN - 60_000);
    const { result } = hook(PARTY, {
      zone: "UTC",
      own: "newest",
      chosen: null,
    });
    act(() => result.current.choose("oldest"));
    expect(result.current.sort).toBe("oldest");
    expect(readChosenSort(cookie(), EVENT)).toBe("oldest");
    // Back to the album's own: forgotten, so the turn is hers again.
    act(() => result.current.choose("newest"));
    expect(result.current.sort).toBe("newest");
    expect(readChosenSort(cookie(), EVENT)).toBeNull();
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(result.current.sort).toBe("oldest");
  });

  it("a remembered choice survives the turn", () => {
    vi.setSystemTime(TURN + 60_000);
    const { result } = hook(PARTY, {
      zone: "UTC",
      own: "oldest",
      chosen: "newest",
    });
    expect(result.current.sort).toBe("newest");
    act(() => {
      vi.advanceTimersByTime(86_400_000);
    });
    expect(result.current.sort).toBe("newest");
  });
});
