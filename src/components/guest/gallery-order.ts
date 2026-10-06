"use client";

/**
 * THE GUEST ALBUM'S ORDER, LIVE ON THE PAGE (album-order): the album's own order on this device's clock, and her
 * choice, remembered. The arithmetic is `lib/shared/album-order.ts`'s; this holds it as the page's state.
 *
 * ★ IT STARTS FROM THE PAGE'S WORD AND TURNS ON THE CLOCK. The page's server decides the first paint's order (the turn
 * in the reader's zone, her remembered choice), and the hydration renders exactly that; from then on one timer turns
 * the album at its moment, and a return to the tab reads the clock again (a phone asleep through 9 am wakes to the
 * album in order). A turn under a reader moves nothing she is looking at: the rows hold her photograph on its pixel
 * (`album-window.tsx`), and the pill says where what landed out of sight now lies.
 *
 * ★ HER CHOICE IS A DEPARTURE, OR NOTHING. Choosing the album's own order forgets what she chose, so an album keeps
 * turning for a guest who only ever looked at the menu; choosing the other is remembered on this device, for this
 * album (`pr_album_sort`), and survives the turn.
 */
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  albumTurnAt,
  rememberChosenSort,
  shownSort,
  sortAt,
  type AlbumSort,
  type AlbumTurnFacts,
  type GuestAlbumOrder,
} from "@/lib/shared/album-order";

/** A timer's longest delay (about 24.8 days): a turn further ahead is waited out in steps. */
const LONGEST_DELAY_MS = 2 ** 31 - 1;

/** What the album's view reads: the order it shows, and her way to choose one. */
export type GuestAlbumOrderState = {
  sort: AlbumSort;
  choose: (sort: AlbumSort) => void;
};

export function useGuestAlbumOrder({
  eventId,
  initial,
  facts,
  isDemo,
}: {
  eventId: string;
  /**
   * The page's word (`guestAlbumOrder`). Absent where no page decided it (a test's stand-in page): the album stays
   * newest first and runs no clock, since only the page's server knows the zone its first paint was read in.
   */
  initial?: GuestAlbumOrder;
  /** The album's days and its develop as the page holds them now (a Develop now moves the turn). */
  facts: AlbumTurnFacts;
  isDemo: boolean;
}): GuestAlbumOrderState {
  const zone = initial?.zone ?? null;
  const { eventDate, eventEndDate, developsAt } = facts;
  const turnAt = useMemo(
    () =>
      isDemo || zone === null
        ? null
        : albumTurnAt({ eventDate, eventEndDate, developsAt }, zone),
    [isDemo, eventDate, eventEndDate, developsAt, zone],
  );
  const [own, setOwn] = useState<AlbumSort>(initial?.own ?? "newest");
  const [chosen, setChosen] = useState<AlbumSort | null>(
    initial?.chosen ?? null,
  );

  // THE CLOCK: at mount (a page rendered a breath before the turn), at the turn itself, and on every return to the
  // tab. An album that never turns reads newest first without a clock at all.
  useEffect(() => {
    if (turnAt === null) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const read = () => {
      clearTimeout(timer);
      const now = Date.now();
      setOwn(sortAt(turnAt, now));
      if (now < turnAt)
        timer = setTimeout(read, Math.min(turnAt - now, LONGEST_DELAY_MS));
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
  }, [turnAt]);

  const ownNow: AlbumSort = turnAt === null ? "newest" : own;
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
