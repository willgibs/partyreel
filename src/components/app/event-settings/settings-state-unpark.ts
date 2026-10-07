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
 * it) is nudged with one empty update at 1, 2.5, 5 and 9 seconds, then every 4 seconds while it still waits: a parked
 * transition goes on rendering at the next nudge, and one that is still streaming simply tries again and waits as
 * before, so a nudge costs a re-render of the caller and never moves a value. It writes no address
 * (`lib/history-entry.ts`'s hazards are writes of the URL) and asks the server nothing.
 *
 * ★ UNTIL THE COMMIT LANDS, NEVER FOR A WINDOW AFTER THE ANSWER (red-team 57c's LOW). The revalidated tree commits only
 * when the action's response stream ends, and on a slow desk build that stream ran up to 38 s past the answer, so the
 * four early nudges all fell inside it and a commit parked after the last stood with nothing to wake it: an invite
 * remove's "Saving… 1 on the list" for 90 s, and a door save's row for 2 minutes, each until her next keystroke or
 * press. So the nudges go on at a steady step (the last early gap, held), and they end at the first that finds the
 * caller no longer waiting, at its unmount, or at the ceiling, five minutes after the answer: far past any stream
 * seen, and what keeps a caller that waits on something no nudge can bring (a stream that never ends) from
 * re-rendering for good. A newer save starts them over, its ceiling with them.
 *
 * Retire it when the bundled React no longer drops that ping (a ROADMAP line).
 */
const EARLY_MS = [1000, 2500, 5000, 9000] as const;
const STEADY_MS = 4000;
const CEILING_MS = 5 * 60_000;

/** Every nudge's time after the answer: the early four, then one each steady step, to the ceiling. */
const NUDGES_MS: readonly number[] = (() => {
  const at: number[] = [...EARLY_MS];
  for (let t = at[at.length - 1] + STEADY_MS; t <= CEILING_MS; t += STEADY_MS)
    at.push(t);
  return at;
})();

export function useUnparkAfterSave(stillWaiting: boolean): () => void {
  const [, nudge] = useReducer((n: number) => n + 1, 0);
  // The one nudge due, if any: each schedules the next, so a save holds a single timer at a time.
  const timer = useRef<number | undefined>(undefined);
  // The newest render's reading of what the caller waits on: read when a nudge falls due, never captured at the save.
  const waiting = useRef(stillWaiting);
  useEffect(() => {
    waiting.current = stillWaiting;
  });
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return useCallback(() => {
    window.clearTimeout(timer.current);
    const arm = (i: number) => {
      // Past the ceiling: the caller waits on what no nudge can bring, and nothing loops for good.
      if (i >= NUDGES_MS.length) return;
      timer.current = window.setTimeout(
        () => {
          // The commit landed (or nothing waits): the nudges end here, and the next save starts them over.
          if (!waiting.current) return;
          nudge();
          arm(i + 1);
        },
        NUDGES_MS[i] - (i === 0 ? 0 : NUDGES_MS[i - 1]),
      );
    };
    arm(0);
  }, []);
}
