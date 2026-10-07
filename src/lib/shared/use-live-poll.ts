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
 *
 * ★ POLLS THAT REST (compute-levers; guest-flow.md, "The conditional poll",
 * built as recommended and his to change). A lit album's net was 13% of a
 * wedding's calls, because a page left lit kept asking whether anyone was
 * looking or not:
 *   - the net under a live doorbell slows to every five minutes after ten lit
 *     minutes without a touch, and stops after two hours without one. The
 *     doorbell still rings at once; the net only catches a ring that was lost.
 *     A touch (a press, a scroll, a key, a return to the tab) wakes it to the
 *     minute, asking at once when its last ask is older than a minute;
 *   - the twelve-second fallback (the doorbell down: a venue's wifi refusing
 *     websockets) slows to a minute after a minute with nothing new, and
 *     returns to twelve seconds the moment something changes (`changeKey`);
 *   - a page meant to be watched untouched (`unattended`: the reel's screen
 *     posture, a TV at the party) never stops its net, only rests it.
 * ★ AND WHERE THE CDN ABSORBS IT, THE FALLBACK'S QUIET IS LIVELIER (AB5, kept
 * with Will's invitation; X5). The quiet minute exists to spare the function a
 * call that finds nothing. Where the CDN answers the album's quiet polls from
 * its cache (`atEdge`: its last answer to this device was a cache hit, so a
 * room is asking the album too and each window's one fill is shared), asking
 * sooner costs the function nothing, so a quiet fallback asks every 20 s while
 * someone is looking (a touch in the last ten minutes, or a page meant to be
 * watched), and rests at today's minute when nobody is. A device asking alone
 * fills its own windows, each a call, so it keeps today's minute. Moving, it
 * keeps its twelve seconds: each of those polls finds a change, which is the
 * function's to answer however it is asked.
 * ★ EACH ASK SAYS WHETHER IT MUST BE EXACT (`onPoll({ exact })`): the return's
 * catch-up (a hidden tab heard no ring) and the moving fallback (every poll
 * carries the album) want the album's own answer; the net under a live
 * doorbell, a quiet fallback and a touch's wake only check that nothing
 * changed, which the CDN's few-seconds-old version may answer.
 * ★ Every wait is one whole step of the cadence, never a remainder: a step is
 * the unit the compute model's compressed clock scales (`chrome.mjs` runs a
 * timer over ten seconds K times faster), so the measured calls are the
 * cadence's own.
 */
import { useEffect, useRef } from "react";

/** The socket is down and something moved in the last minute: the old blind cadence carries the album. */
export const FAST_POLL_MS = 12_000;
/** The socket is up: a safety net under the doorbell. The socket is down and nothing moves: the fallback's rest. */
export const SLOW_POLL_MS = 60_000;
/** The net at rest: the socket is up and nobody has touched the page for `REST_AFTER_MS`. */
export const RESTED_POLL_MS = 5 * 60_000;
/** Lit and untouched this long, the net rests. */
export const REST_AFTER_MS = 10 * 60_000;
/** Untouched this long, the net stops (the doorbell still rings) until a touch. */
export const STOP_AFTER_MS = 2 * 60 * 60_000;
/** The fallback with nothing new this long slows to `SLOW_POLL_MS`. */
export const QUIET_AFTER_MS = 60_000;
/** The quiet fallback's step where the CDN answers its polls and someone is looking (AB5, the head note). */
export const EDGE_QUIET_POLL_MS = 20_000;

/** A touch: a press, a scroll (a wheel's too, over a page that cannot scroll), a key. */
const TOUCHES = ["pointerdown", "wheel", "scroll", "keydown"] as const;
const LISTEN = { capture: true, passive: true } as const;

export function useLivePoll({
  enabled,
  live,
  onPoll,
  changeKey,
  unattended,
  atEdge,
}: {
  /** Nothing to poll (the demo, a locked gallery) switches the whole thing off. */
  enabled: boolean;
  /** The Realtime channel is subscribed: the slow net rather than the fast poll. */
  live: boolean;
  /**
   * One fetch. Keep it STABLE (a `useCallback` that does not close over the
   * item list): a callback that changes per arrival would restart the cadence
   * on every photograph, which is a poll that never actually waits. `exact`:
   * this ask wants the album's own answer (the head note); otherwise it only
   * checks that nothing changed.
   */
  onPoll: (ask: { exact: boolean }) => void;
  /**
   * The answer on screen, in a value whose identity moves only when the answer
   * does (the album store's snapshot; a 304 keeps it): a move puts a resting
   * fallback back on its fast cadence. A value that never moves rests the
   * fallback after its quiet minute for good.
   */
  changeKey: unknown;
  /**
   * Asked when the net would stop for an untouched page: true while the page is
   * meant to be watched untouched, which keeps the net at its rest and never
   * stops it. Read when asked, so it may read the address as it stands.
   */
  unattended?: () => boolean;
  /**
   * Asked at each step: true while the CDN answers the album's quiet polls from
   * its cache, which makes a quiet fallback livelier (the head note). Absent,
   * the cadence is as it always was (the host's album, the dashboard's stage).
   */
  atEdge?: () => boolean;
}) {
  // The clocks outlive a socket's flap (the cadence's effect re-runs on `live`): only a new start resets them.
  const lastTouch = useRef(0);
  const lastPoll = useRef(0);
  const lastChange = useRef(0);
  const seenKey = useRef(changeKey);
  const onChange = useRef<(() => void) | null>(null);
  const unattendedRef = useRef(unattended);
  const atEdgeRef = useRef(atEdge);
  useEffect(() => {
    unattendedRef.current = unattended;
    atEdgeRef.current = atEdge;
  });

  // A start: lit from now, asked just now (the page's own read), and nothing moving yet.
  useEffect(() => {
    if (!enabled) return;
    const now = Date.now();
    lastTouch.current = now;
    lastPoll.current = now;
    lastChange.current = now;
  }, [enabled]);

  // A change on screen: the fallback's quiet minute starts again, and a resting fallback wakes.
  useEffect(() => {
    if (Object.is(seenKey.current, changeKey)) return;
    seenKey.current = changeKey;
    lastChange.current = Date.now();
    onChange.current?.();
  }, [changeKey]);

  useEffect(() => {
    if (!enabled) return;
    // A socket that drops leaves the album unsure of what it missed: the fallback starts on its fast minute.
    if (!live) lastChange.current = Date.now();
    let timer: ReturnType<typeof setTimeout> | null = null;
    /** The step the pending timer waits, or null when none waits (hidden, or the net stopped). */
    let step: number | null = null;

    const moving = () => Date.now() - lastChange.current < QUIET_AFTER_MS;
    const cadence = (): number | null => {
      const now = Date.now();
      if (!live) {
        if (moving()) return FAST_POLL_MS;
        const looked =
          now - lastTouch.current < REST_AFTER_MS ||
          unattendedRef.current?.() === true;
        return looked && atEdgeRef.current?.() === true
          ? EDGE_QUIET_POLL_MS
          : SLOW_POLL_MS;
      }
      const idle = now - lastTouch.current;
      if (idle >= STOP_AFTER_MS && !unattendedRef.current?.()) return null;
      return idle >= REST_AFTER_MS ? RESTED_POLL_MS : SLOW_POLL_MS;
    };
    const stop = () => {
      if (timer) clearTimeout(timer);
      timer = null;
      step = null;
    };
    const schedule = () => {
      stop();
      if (document.hidden) return;
      step = cadence();
      if (step !== null) timer = setTimeout(tick, step);
    };
    const poll = (exact: boolean) => {
      lastPoll.current = Date.now();
      onPoll({ exact });
    };
    function tick() {
      timer = null;
      step = null;
      // Untouched past the stop: the net ends here, unasked, until a touch wakes it.
      if (document.hidden || cadence() === null) return;
      // The moving fallback carries the album: its ask is the album's own (the head note).
      poll(!live && moving());
      schedule();
    }
    const onTouch = () => {
      lastTouch.current = Date.now();
      if (document.hidden) return;
      if (!live) {
        // The fallback rests on what changes, and on who is looking only where the CDN answers it: a quiet one
        // resting at its minute wakes to the quicker step a look earns there (AB5), asking at once if it is due.
        if (step !== SLOW_POLL_MS || cadence() !== EDGE_QUIET_POLL_MS) return;
        if (Date.now() - lastPoll.current >= EDGE_QUIET_POLL_MS) poll(false);
        schedule();
        return;
      }
      // At rest or stopped, a touch wakes the net to its minute.
      if (step === SLOW_POLL_MS) return;
      if (Date.now() - lastPoll.current >= SLOW_POLL_MS) poll(false);
      schedule();
    };
    const onVisibility = () => {
      if (document.hidden) {
        stop();
        return;
      }
      // A return is a touch, and the fallback's quiet minute starts again with it. A hidden tab heard no ring,
      // so its one catch-up is exact: the CDN's few seconds could hide what just landed.
      lastTouch.current = Date.now();
      lastChange.current = Date.now();
      poll(true);
      schedule();
    };
    onChange.current = () => {
      // A change puts a quiet fallback (at either quiet step) back on its twelve seconds.
      if (!live && step !== null && step !== FAST_POLL_MS) schedule();
    };

    schedule();
    document.addEventListener("visibilitychange", onVisibility);
    for (const type of TOUCHES) window.addEventListener(type, onTouch, LISTEN);
    return () => {
      stop();
      onChange.current = null;
      document.removeEventListener("visibilitychange", onVisibility);
      for (const type of TOUCHES)
        window.removeEventListener(type, onTouch, LISTEN);
    };
  }, [enabled, live, onPoll]);
}
