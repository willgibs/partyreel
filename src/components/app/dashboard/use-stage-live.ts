"use client";

import { useCallback, useEffect, useRef } from "react";

import {
  readStageLiveAction,
  type StageLive,
} from "@/lib/dashboard/stage-action";
import { useGalleryDoorbell } from "@/lib/guest/use-gallery-doorbell";
import { useLivePoll } from "@/lib/shared/use-live-poll";

/**
 * THE LIVE WALL'S EARS (host-dashboard r1, `arrivals=live`): on a party's own day, the stage hears the
 * album's doorbell (the contentless ping the album's own trigger sends when an approved photograph
 * lands, `useGalleryDoorbell`) and asks for the wall again, on the product's one hybrid cadence
 * (`useLivePoll`): a minute's safety net while the socket is up, twelve seconds while it is down,
 * nothing while the tab is hidden, and once the moment it returns. Every other day it listens to
 * nothing.
 *
 * ★ ONE ASK AT A TIME: a ping that lands while an answer is on its way asks once more when it arrives,
 * never alongside it, so a burst of photographs is two reads, not twenty. And a ping heard in a hidden
 * tab waits for the tab: the return's own catch-up covers it.
 */
export function useStageLive({
  eventId,
  qrToken,
  enabled,
  onLive,
}: {
  eventId: string;
  qrToken: string;
  /** The stage's event is on its day. */
  enabled: boolean;
  /** What the wall now holds; kept as the latest closure, so a new one never restarts the cadence. */
  onLive: (live: StageLive) => void;
}): void {
  // The latest closure, kept after each render, never during one.
  const latest = useRef(onLive);
  useEffect(() => {
    latest.current = onLive;
  });
  const busy = useRef(false);
  const again = useRef(false);

  const poll = useCallback(async () => {
    if (busy.current) {
      again.current = true;
      return;
    }
    busy.current = true;
    try {
      do {
        again.current = false;
        const live = await readStageLiveAction(eventId).catch(() => null);
        if (live) latest.current(live);
      } while (again.current);
    } finally {
      busy.current = false;
    }
  }, [eventId]);

  const { live } = useGalleryDoorbell({
    qrToken,
    enabled,
    onRefresh: () => {
      if (!document.hidden) void poll();
    },
  });
  useLivePoll({
    enabled,
    live,
    onPoll: useCallback(() => void poll(), [poll]),
  });
}
