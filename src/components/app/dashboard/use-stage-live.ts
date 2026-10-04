"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
 * ★ THE ALBUM'S OWN RULES (album-calm): the doorbell answers in calm batches on the device's clock, so
 * a wall left open all night (visible, so it batches) moves about every fifteen seconds while guests
 * upload, never a photograph a second; and a hidden tab is no listener at all, its return's catch-up
 * covering what it missed. ★ ONE ASK AT A TIME besides: a batch that lands while an answer is on its
 * way asks once more when it arrives, never alongside it.
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
  // What the wall shows, for the poll's rest: it moves when the wall does (never with its links or the hour).
  const [wall, setWall] = useState<string | null>(null);

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
        if (live) {
          latest.current(live);
          setWall(wallOf(live));
        }
      } while (again.current);
    } finally {
      busy.current = false;
    }
  }, [eventId]);

  const { live } = useGalleryDoorbell({
    qrToken,
    enabled,
    onRefresh: () => void poll(),
  });
  useLivePoll({
    enabled,
    live,
    onPoll: useCallback(() => void poll(), [poll]),
    changeKey: wall,
  });
}

/** The wall as a value that moves only when it does: its counts and its photographs (never their links, re-signed
 *  on every answer, nor the last hour's count, which moves with the clock). */
function wallOf(live: StageLive): string {
  return `${live.approved}:${live.pending}:${live.waiting}:${live.photos.map((p) => p.id).join(",")}`;
}
