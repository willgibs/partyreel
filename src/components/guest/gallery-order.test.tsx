/**
 * THE GUEST ALBUM'S ORDER, LIVE (`gallery-order.ts`): it starts from the page's word (so the hydration agrees), turns
 * as the page hears the album (her close turns it into the night in order, a reopen turns it back), turns at a
 * develop's instant on this device's clock and on a return to the tab, follows a develop that moves, and keeps her
 * choice only as a departure from the album's own, remembered on this device for this album.
 *
 * Reshaped by event-zone: the page's word was a zone (the reader's) with the album's days, which this hook read the turn
 * in. ★ RESHAPED ON PURPOSE AGAIN (crumbs-91, call AY1; scar kept: the turn at its moment for a page open across it,
 * the sleeping phone, the develop that moves, her choice as a departure). The expired reason: the party's morning after
 * as the moment (`GuestAlbumOrder.morningAfter`), which turned a week's trip dated on its first day the next morning,
 * mid-trip. The turn is the album's own state: her word on adding, and a develop's instant, so the morning is gone from
 * these cases.
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useGuestAlbumOrder } from "@/components/guest/gallery-order";
import {
  ALBUM_SORT_COOKIE,
  readChosenSort,
  type GuestAlbumOrder,
} from "@/lib/shared/album-order";

const EVENT = "11111111-2222-4333-8444-555555555555";
/** A develop's instant (a Disposable's own chosen moment). */
const DEVELOP = Date.parse("2026-10-03T20:00:00Z");
/** The page's word on an album open to uploads, nothing developed: newest first. */
const OPEN: GuestAlbumOrder = { own: "newest", chosen: null };
/** The page's word on an album its host has closed: the night in order. */
const CLOSED: GuestAlbumOrder = { own: "oldest", chosen: null };

const cookie = () =>
  document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${ALBUM_SORT_COOKIE}=`))
    ?.slice(ALBUM_SORT_COOKIE.length + 1) ?? null;

type Live = { open: boolean; developsAt: string | null };

function hook(
  live: Live,
  initial: GuestAlbumOrder | undefined,
  isDemo = false,
) {
  return renderHook(
    (props: Live) =>
      useGuestAlbumOrder({
        eventId: EVENT,
        initial,
        open: props.open,
        developsAt: props.developsAt,
        isDemo,
      }),
    { initialProps: live },
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

describe("the turn, as the page hears the album", () => {
  it("★ her close turns an open page's album into the night in order, and a reopen turns it back", () => {
    const { result, rerender } = hook({ open: true, developsAt: null }, OPEN);
    expect(result.current.sort).toBe("newest");
    // The album's sync carries her close (`accepting` false): every open page turns on that word.
    rerender({ open: false, developsAt: null });
    expect(result.current.sort).toBe("oldest");
    // She reopens adding: a live album again, its newest first.
    rerender({ open: true, developsAt: null });
    expect(result.current.sort).toBe("newest");
  });

  it("★ an open album never turns on the clock: a day, a week, a year on, it is still the live feed", () => {
    vi.setSystemTime(DEVELOP);
    const { result } = hook({ open: true, developsAt: null }, OPEN);
    for (const later of [86_400_000, 7 * 86_400_000, 365 * 86_400_000]) {
      act(() => {
        vi.advanceTimersByTime(later);
      });
      expect(result.current.sort).toBe("newest");
    }
  });

  it("starts from the page's word: a closed album is in order from the first render", () => {
    const { result } = hook({ open: false, developsAt: null }, CLOSED);
    expect(result.current.sort).toBe("oldest");
  });
});

describe("a develop's instant, on this device's clock", () => {
  const develop = new Date(DEVELOP).toISOString();

  it("★ turns at its own moment for a reader whose page is open across it", () => {
    vi.setSystemTime(DEVELOP - 60_000);
    const { result } = hook({ open: true, developsAt: develop }, OPEN);
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

  it("starts from the page's word, then reads its own clock (a page rendered a breath before the develop)", () => {
    vi.setSystemTime(DEVELOP + 5_000);
    const { result } = hook({ open: true, developsAt: develop }, OPEN);
    // After mount the clock has spoken: the album is in order.
    expect(result.current.sort).toBe("oldest");
  });

  it("reads the clock again on a return to the tab (a phone asleep through the develop)", () => {
    vi.setSystemTime(DEVELOP - 3_600_000);
    const { result } = hook({ open: true, developsAt: develop }, OPEN);
    // The timers of a sleeping tab never fired; the wall clock moved on.
    vi.setSystemTime(DEVELOP + 3_600_000);
    act(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => "visible",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(result.current.sort).toBe("oldest");
  });

  it("follows a develop that moves: a Develop now turns the album at once, and one taken away leaves her word", () => {
    vi.setSystemTime(DEVELOP - 6 * 3_600_000);
    const { result, rerender } = hook(
      { open: true, developsAt: develop },
      OPEN,
    );
    expect(result.current.sort).toBe("newest");
    rerender({ open: true, developsAt: new Date(Date.now()).toISOString() });
    expect(result.current.sort).toBe("oldest");
    // The host takes the develop away: an open album is the live feed again.
    rerender({ open: true, developsAt: null });
    expect(result.current.sort).toBe("newest");
  });

  it("★ a develop still ahead on a closed album: her close has turned it already", () => {
    vi.setSystemTime(DEVELOP - 3_600_000);
    const { result } = hook({ open: false, developsAt: develop }, CLOSED);
    expect(result.current.sort).toBe("oldest");
    act(() => {
      vi.advanceTimersByTime(2 * 3_600_000);
    });
    expect(result.current.sort).toBe("oldest");
  });

  it("the demo and a page that decided nothing stay newest first, closed or developed", () => {
    vi.setSystemTime(DEVELOP + 86_400_000);
    expect(
      hook({ open: false, developsAt: develop }, CLOSED, true).result.current
        .sort,
    ).toBe("newest");
    expect(
      hook({ open: false, developsAt: null }, undefined).result.current.sort,
    ).toBe("newest");
    // A page that decided nothing runs no clock, even under a develop time reached.
    expect(
      hook({ open: true, developsAt: develop }, undefined).result.current.sort,
    ).toBe("newest");
  });
});

describe("her choice", () => {
  it("★ a departure is kept and remembered for this album; choosing the album's own forgets it, and the album keeps turning", () => {
    const { result, rerender } = hook({ open: true, developsAt: null }, OPEN);
    act(() => result.current.choose("oldest"));
    expect(result.current.sort).toBe("oldest");
    expect(readChosenSort(cookie(), EVENT)).toBe("oldest");
    // Back to the album's own: forgotten, so the turn is the album's again.
    act(() => result.current.choose("newest"));
    expect(result.current.sort).toBe("newest");
    expect(readChosenSort(cookie(), EVENT)).toBeNull();
    rerender({ open: false, developsAt: null });
    expect(result.current.sort).toBe("oldest");
  });

  it("a remembered choice survives the turn, and a reopen", () => {
    const { result, rerender } = hook(
      { open: false, developsAt: null },
      { own: "oldest", chosen: "newest" },
    );
    expect(result.current.sort).toBe("newest");
    rerender({ open: true, developsAt: null });
    expect(result.current.sort).toBe("newest");
    rerender({ open: false, developsAt: null });
    expect(result.current.sort).toBe("newest");
  });
});
