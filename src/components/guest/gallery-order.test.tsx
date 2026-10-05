/**
 * THE GUEST ALBUM'S ORDER, LIVE (`gallery-order.ts`): it starts from the page's word (so the hydration agrees), turns
 * at the instant the page's server handed it (event-zone: the party's morning after, never a zone) on this device's
 * clock and on a return to the tab, follows a develop that moves, and keeps her choice only as a departure from the
 * turn, remembered on this device for this album.
 *
 * Reshaped by event-zone: the page's word was a zone (the reader's) with the album's days, which this hook read the turn
 * in; it is the turn's instant now (`AlbumOpening.morningAfter`), so the days and the zone are gone from these cases and
 * every scar they pinned (the turn at its moment, the sleeping phone, the develop, her choice) stands as it was.
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useGuestAlbumOrder } from "@/components/guest/gallery-order";
import type { AlbumOpening } from "@/lib/event/zone-morning";
import { ALBUM_SORT_COOKIE, readChosenSort } from "@/lib/shared/album-order";

const EVENT = "11111111-2222-4333-8444-555555555555";
// The party's morning after, as the page's server hands it: 9 am in Auckland the morning after a Saturday party.
const TURN = Date.parse("2026-10-03T20:00:00Z");
const OPENING: AlbumOpening = {
  morningAfter: TURN,
  own: "newest",
  chosen: null,
};

const cookie = () =>
  document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${ALBUM_SORT_COOKIE}=`))
    ?.slice(ALBUM_SORT_COOKIE.length + 1) ?? null;

function hook(
  developsAt: string | null,
  initial: AlbumOpening | undefined,
  isDemo = false,
) {
  return renderHook(
    (props: { developsAt: string | null }) =>
      useGuestAlbumOrder({
        eventId: EVENT,
        initial,
        developsAt: props.developsAt,
        isDemo,
      }),
    { initialProps: { developsAt } },
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

describe("the turn, at the server's instant, on this device's clock", () => {
  it("★ turns at its own moment for a reader whose page is open across it", () => {
    vi.setSystemTime(TURN - 60_000);
    const { result } = hook(null, OPENING);
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
    const { result } = hook(null, OPENING);
    // After mount the clock has spoken: the album is in order.
    expect(result.current.sort).toBe("oldest");
  });

  it("reads the clock again on a return to the tab (a phone asleep through 9 am)", () => {
    vi.setSystemTime(TURN - 3_600_000);
    const { result } = hook(null, OPENING);
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
    const { result, rerender } = hook(new Date(TURN).toISOString(), OPENING);
    expect(result.current.sort).toBe("newest");
    rerender({ developsAt: new Date(Date.now()).toISOString() });
    expect(result.current.sort).toBe("oldest");
  });

  it("★ a develop wins over the morning after, and the morning after stands again when the develop is taken away", () => {
    vi.setSystemTime(TURN + 60_000);
    // A develop a day after the party's morning: the album waits for it, past the morning after.
    const { result, rerender } = hook(
      new Date(TURN + 86_400_000).toISOString(),
      OPENING,
    );
    expect(result.current.sort).toBe("newest");
    // The host takes the develop away: the party's morning after (passed) turns it.
    rerender({ developsAt: null });
    expect(result.current.sort).toBe("oldest");
  });

  it("an undated album, the demo and a page that decided nothing stay newest first", () => {
    vi.setSystemTime(TURN + 86_400_000);
    expect(
      hook(null, { morningAfter: null, own: "newest", chosen: null }).result
        .current.sort,
    ).toBe("newest");
    expect(hook(null, OPENING, true).result.current.sort).toBe("newest");
    expect(hook(null, undefined).result.current.sort).toBe("newest");
    // A page that decided nothing runs no clock, even under a develop time reached.
    expect(
      hook(new Date(TURN).toISOString(), undefined).result.current.sort,
    ).toBe("newest");
  });
});

describe("her choice", () => {
  it("★ a departure is kept and remembered for this album; choosing the album's own forgets it, and the album keeps turning", () => {
    vi.setSystemTime(TURN - 60_000);
    const { result } = hook(null, OPENING);
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
    const { result } = hook(null, {
      morningAfter: TURN,
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
