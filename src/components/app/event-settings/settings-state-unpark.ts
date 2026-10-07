"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";

/**
 * ★ A SAVE'S TRANSITION THAT REACT PARKS FOR GOOD IS LET GO (crumbs-89, red-team 57b's MEDIUM and LOW: after a hard load
 * of the hub with a room open, 7 of 12 first saves never reached the hub's row, and the Guests room's list stuck on
 * "Saving…" while the database held the address, until some later press).
 *
 * WHY (measured on a production build, crumbs-89's probes, the cause pinned by its last step): a hub save is a Server
 * Action that revalidates the hub, and Next commits its answer in a transition, which renders the page's streamed
 * payload chunk by chunk. React 19.3's canary (Next 16.2.6's own) can park that transition with every byte of it in
 * hand: when it unwinds a render already suspended-with-delay on a payload chunk that has arrived meanwhile, the
 * chunk's `then` answers at once, inside the render, and `pingSuspendedRoot` drops that ping (it records none while the
 * render context is set at that exit status), so the lane is marked suspended with nothing left to wake it. Read off the
 * live page: the root's transition lane pending and suspended, no ping pending, the router's new state whole, the last
 * parked thenable a chunk that went `resolved_model` to fulfilled as it was bound; and ONE unrelated state update let
 * it render and commit at once (React's `markRootUpdated` clears every suspended lane). The heavier the page (an album
 * with photographs), the longer the stream and the likelier the race (3 of 6 on an album of 8; rarely on an empty one).
 *
 * So once a save has answered, a caller still waiting on the server's row (`stillWaiting`, as its newest render reads
 * it) is nudged with one empty
 * update at 1, 2.5, 5 and 9 seconds: a parked transition renders and commits on the first, and one that is still
 * streaming simply tries again and waits as before, so the nudge costs a re-render of the caller and never moves a
 * value. It writes no address (`lib/history-entry.ts`'s hazards are writes of the URL) and asks the server nothing.
 * Retire it when the bundled React no longer drops that ping (a ROADMAP line).
 */
const NUDGES_MS = [1000, 2500, 5000, 9000] as const;

export function useUnparkAfterSave(stillWaiting: boolean): () => void {
  const [, nudge] = useReducer((n: number) => n + 1, 0);
  const timers = useRef<number[]>([]);
  // The newest render's reading of what the caller waits on: read when a timer fires, never captured at the save.
  const waiting = useRef(stillWaiting);
  useEffect(() => {
    waiting.current = stillWaiting;
  });
  useEffect(
    () => () => {
      for (const id of timers.current) window.clearTimeout(id);
    },
    [],
  );
  return useCallback(() => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = NUDGES_MS.map((ms) =>
      window.setTimeout(() => {
        if (waiting.current) nudge();
      }, ms),
    );
  }, []);
}
