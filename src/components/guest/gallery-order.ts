"use client";

/**
 * THE GUEST ALBUM'S ORDER, LIVE ON THE PAGE (album-order): the album's own order on this device's clock, and her
 * choice, remembered. The arithmetic is `lib/shared/album-order.ts`'s; this holds it as the page's state.
 *
 * ★ IT STARTS FROM THE PAGE'S WORD AND TURNS ON THE CLOCK. The page's server decides the first paint's order (the turn,
 * her remembered choice) and hands the moment the album turns as an INSTANT (event-zone: 9 am the morning after in the
 * party's own zone, `AlbumOpening.morningAfter`), never a zone, so every reader's album turns at that one moment
 * wherever she is and whatever her browser knows of zones. The hydration renders exactly the server's order; from then
 * on one timer turns the album at its moment, and a return to the tab reads the clock again (a phone asleep through
 * 9 am wakes to the album in order). A turn under a reader moves nothing she is looking at: the rows hold her
 * photograph on its pixel (`album-window.tsx`), and the pill says where what landed out of sight now lies.
 *
 * ★ A DEVELOP TIME WINS, LIVE: the page holds it as the album's sync says it (a Develop now, a time set, moved or taken
 * away), so the turn follows it, and falls back to the party's morning after when it goes (`openingTurnAt`).
 *
 * ★ HER CHOICE IS A DEPARTURE, OR NOTHING. Choosing the album's own order forgets what she chose, so an album keeps
 * turning for a guest who only ever looked at the menu; choosing the other is remembered on this device, for this
 * album (`pr_album_sort`), and survives the turn.
 */
import { useCallback, useEffect, useMemo, useState } from "react";

import { openingTurnAt, type AlbumOpening } from "@/lib/event/zone-morning";
import {
  rememberChosenSort,
  shownSort,
  sortAt,
  type AlbumSort,
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
  developsAt,
  isDemo,
}: {
  eventId: string;
  /**
   * The page's word (`albumOpening`). Absent where no page decided it (a test's stand-in page): the album stays newest
   * first and runs no clock, since only the page's server knows when the party's morning comes.
   */
  initial?: AlbumOpening;
  /** The develop time as the page holds it now (ISO, ahead or reached), or null: a Develop now moves the turn. */
  developsAt: string | null;
  isDemo: boolean;
}): GuestAlbumOrderState {
  const decided = initial !== undefined;
  const morningAfter = initial?.morningAfter ?? null;
  const turnAt = useMemo(
    () => (isDemo || !decided ? null : openingTurnAt(morningAfter, developsAt)),
    [isDemo, decided, morningAfter, developsAt],
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
