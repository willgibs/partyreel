"use client";

import { useSyncExternalStore } from "react";

import { DOCK_PILL } from "@/components/lab";

/**
 * THE ARRIVAL, ON DEMAND: a head is met the moment the door's reveal hands it
 * the screen (`guest-flow.md`, the success hold and the reveal), so each
 * direction draws its own entrance, and this replays it in every guest frame
 * at once. A module store, because the button rides the board's dock and the
 * frames are drawn wherever the step's stage stands, and neither is the
 * other's parent.
 *
 * ★ REDUCED MOTION SEES THE HEAD WHOLE: every entrance sits behind
 * `no-preference` (`event-header.css`), so a replay there redraws the same
 * still head, which is the design at rest (bible 5).
 */

let count = 0;
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** How many times the arrival has been asked for: a key the guest frames remount on. */
export function useReplay(): number {
  return useSyncExternalStore(
    subscribe,
    () => count,
    () => 0,
  );
}

/** The board's dock button: every guest frame plays its head's arrival again. */
export function ReplayButton() {
  return (
    <button
      type="button"
      className={DOCK_PILL}
      onClick={() => {
        count += 1;
        for (const cb of listeners) cb();
      }}
    >
      Replay the arrival
    </button>
  );
}
