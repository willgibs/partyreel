"use client";

/**
 * THE GUEST ALBUM'S ORDER, LIVE ON THE PAGE (album-order): the album's own order as the page hears the album, and her
 * choice, remembered. The arithmetic is `lib/shared/album-order.ts`'s (`albumOwnSort`); this holds it as the page's
 * state.
 *
 * ★ IT STARTS FROM THE PAGE'S WORD AND TURNS WITH THE ALBUM (AY1). The page's server decides the first paint's order (the
 * album's own, her remembered choice), and the hydration renders exactly it. From then on the order follows the
 * album's state as the page hears it: her close, which the album's sync carries to every open page on its next answer
 * (`open`, `useLiveUploadsWord`), turns it into the night in order, and a reopen turns it back; and a develop's
 * instant, one moment wherever it is read, turns it on this device's clock (one timer to it, and a return to the tab
 * reads the clock again: a phone asleep through the develop wakes to the album in order). A turn under a reader moves
 * nothing she is looking at: the rows hold her photograph on its pixel (`album-window.tsx`), and the pill says where
 * what landed out of sight now lies.
 *
 * ★ A DEVELOP IS AS THE PAGE HOLDS IT (`developsAt`: a Develop now, a time set, moved or taken away, each turning the
 * album at its moment, `useLiveUploadsWait`'s `turnDevelopsAt`).
 *
 * ★ HER CHOICE IS A DEPARTURE, OR NOTHING. Choosing the album's own order forgets what she chose, so an album keeps
 * turning for a guest who only ever looked at the menu; choosing the other is remembered on this device, for this
 * album (`pr_album_sort`), and survives the turn.
 */
import { useCallback, useEffect, useState } from "react";

import {
  developMoment,
  rememberChosenSort,
  shownSort,
  type AlbumSort,
  type GuestAlbumOrder,
} from "@/lib/shared/album-order";

/** A timer's longest delay (about 24.8 days): a develop further ahead is waited out in steps. */
const LONGEST_DELAY_MS = 2 ** 31 - 1;

/** What the album's view reads: the order it shows, and her way to choose one. */
export type GuestAlbumOrderState = {
  sort: AlbumSort;
  choose: (sort: AlbumSort) => void;
};

export function useGuestAlbumOrder({
  eventId,
  initial,
  open,
  developsAt,
  isDemo,
}: {
  eventId: string;
  /**
   * The page's word (`guestAlbumOrder`). Absent where no page decided it (a test's stand-in page): the album stays newest
   * first and runs no clock.
   */
  initial?: GuestAlbumOrder;
  /** Whether the album takes uploads, as the page last heard it (the server's reading, then the sync's every word). */
  open: boolean;
  /** The develop time as the page holds it now (ISO, ahead or reached), or null: a Develop now moves the turn. */
  developsAt: string | null;
  isDemo: boolean;
}): GuestAlbumOrderState {
  const decided = initial !== undefined && !isDemo;
  const develop = decided ? developMoment(developsAt) : null;
  // Whether the develop has come on this device's clock. Seeded with the page's word, which says it wherever it matters
  // (an open album with a develop is in order at the render exactly when its develop had come), so the hydration lays
  // the server's order; the clock decides from the first effect on.
  const [developed, setDeveloped] = useState(initial?.own === "oldest");
  const [chosen, setChosen] = useState<AlbumSort | null>(
    initial?.chosen ?? null,
  );

  // THE DEVELOP'S CLOCK: at mount (a page rendered a breath before the develop), at the develop itself, and on every
  // return to the tab. An album with no develop turns on her word alone, with no clock at all.
  useEffect(() => {
    if (develop === null) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const read = () => {
      clearTimeout(timer);
      const now = Date.now();
      setDeveloped(now >= develop);
      if (now < develop)
        timer = setTimeout(read, Math.min(develop - now, LONGEST_DELAY_MS));
    };
    read();
    const onShow = () => {
      if (document.visibilityState === "visible") read();
    };
    document.addEventListener("visibilitychange", onShow);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onShow);
    };
  }, [develop]);

  const ownNow: AlbumSort =
    !decided || (open && (develop === null || !developed))
      ? "newest"
      : "oldest";
  const choose = useCallback(
    (next: AlbumSort) => {
      const departure = next === ownNow ? null : next;
      setChosen(departure);
      rememberChosenSort(eventId, departure);
    },
    [eventId, ownNow],
  );
  return { sort: shownSort({ own: ownNow, chosen }), choose };
}
