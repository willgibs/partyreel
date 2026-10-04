"use client";

/**
 * THE HYBRID CADENCE, IN ONE PLACE (lifted out of `guest/live-gallery.tsx` by
 * `landing=sweep`'s "consistent across guest and host arrival experiences":
 * the guest's album, the host's and the dashboard's live stage all poll on exactly
 * this shape, and two copies of a cadence is how the albums drift apart while
 * all look right).
 *
 * While a Realtime channel is up, its pings do the work and this is a safety
 * net at a minute; when the socket drops, it falls back to the old blind poll
 * at twelve seconds. Either way it STOPS while the tab is hidden and refetches
 * once the moment it comes back — frugality (a party album left open on a
 * laptop all evening) and correctness (the catch-up fetch is what makes a
 * returning tab right immediately rather than up to a minute late).
 *
 * ★ THE RETURN'S ONE SYNC IS THIS HOOK'S (album-calm). A hidden tab leaves the
 * doorbell's channel (`use-gallery-doorbell.ts`) and hears nothing, so this
 * catch-up is all it needs and all it gets: one sync, at once, through the
 * album's own store, and what it missed arrives through the album's new-media
 * entry. ★ And hidden means hidden from the first frame: a tab that MOUNTS
 * hidden (a link opened in a background tab) starts no timer, and a socket
 * whose state changes under a hidden tab (the doorbell leaving its channel)
 * restarts none.
 */
import { useEffect } from "react";

/** The socket is down: the old blind cadence carries the album. */
export const FAST_POLL_MS = 12_000;
/** The socket is up: a safety net under the doorbell, nothing more. */
export const SLOW_POLL_MS = 60_000;

export function useLivePoll({
  enabled,
  live,
  onPoll,
}: {
  /** Nothing to poll (the demo, a locked gallery) switches the whole thing off. */
  enabled: boolean;
  /** The Realtime channel is subscribed: the slow net rather than the fast poll. */
  live: boolean;
  /**
   * One fetch. Keep it STABLE (a `useCallback` that does not close over the
   * item list): a callback that changes per arrival would restart the interval
   * on every photograph, which is a poll that never actually waits.
   */
  onPoll: () => void;
}) {
  useEffect(() => {
    if (!enabled) return;
    const pollMs = live ? SLOW_POLL_MS : FAST_POLL_MS;
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (!timer) timer = setInterval(onPoll, pollMs);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        onPoll();
        start();
      }
    };
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, live, onPoll]);
}
