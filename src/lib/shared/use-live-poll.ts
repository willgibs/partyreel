"use client";

/**
 * THE HYBRID CADENCE, IN ONE PLACE (lifted out of `guest/live-gallery.tsx` by
 * `landing=sweep`'s "consistent across guest and host arrival experiences":
 * the host's own live surfaces poll on exactly this shape, and two copies of a
 * cadence is how the two albums drift apart while both look right).
 *
 * While a Realtime channel is up, its pings do the work and this is a safety
 * net at a minute; when the socket drops, it falls back to the old blind poll
 * at twelve seconds. Either way it STOPS while the tab is hidden and refetches
 * once the moment it comes back — frugality (a party album left open on a
 * laptop all evening) and correctness (the catch-up fetch is what makes a
 * returning tab right immediately rather than up to a minute late).
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
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, live, onPoll]);
}
