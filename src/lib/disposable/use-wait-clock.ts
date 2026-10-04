"use client";

/**
 * THE WAIT'S CLOCK ON THE PAGE: the reader's own now, or null before hydration. The server cannot know her clock, so
 * every line that says a time (`wait-words.ts`: "All at once at 9 am", "in 10 h 20 min") reads whole without it until
 * then, and the hydrating render matches the server's HTML.
 *
 * ★ THE CLOCK TURNS AT THE DEVELOP ITSELF (red-team 46's LOW). A reader decides "ahead or reached" by comparing a develop
 * time with this clock, so a clock read up to half a minute ago kept her hub's cover standing, and a guest's "Develops at
 * 7:42 am" over a developed album, for as long after the host's own Develop now. Two rules at the hook, so every reader
 * is right with no change of its own:
 *  - EVERY RENDER READS A CLOCK THAT HAS PASSED WHAT IT IS GIVEN: a reading older than `WAIT_CLOCK_FRESH_MS` is read
 *    again by the render that finds it (a develop moved to now, a develop time that arrives, a reader that mounts late),
 *    where the old hook handed every reader the reading the first one took, up to a step ago. Within a burst of renders
 *    the readers share one reading, so a memo keyed on it holds, and a render that comes later never reads an older
 *    time than one before it.
 *  - THE STEPS FALL ON THE WALL CLOCK'S HALF MINUTES (:00 and :30), never on a timer that began whenever the first
 *    reader mounted, so a develop time, which is picked to the minute (Develop now is already reached), meets a step
 *    exactly at its own moment.
 *
 * ★ ONE TIMER FOR EVERY READER, AND NONE WITHOUT ONE: the first subscriber starts it and the last one stops it, so a
 * page with nothing waiting runs no clock at all. A store read (`useSyncExternalStore`), never a `setState` in an
 * effect.
 */
import { useSyncExternalStore } from "react";

/** The wall clock's steps: the half minutes, so a countdown in minutes never lags a minute behind. */
export const WAIT_CLOCK_STEP_MS = 30_000;

/**
 * How old a reading may be when a reader renders. Under it, readers share one reading (a burst of renders is one
 * moment, and the page's memos hold); over it, the render reads the clock again.
 */
export const WAIT_CLOCK_FRESH_MS = 250;

/** How far short of its half minute the wall clock may read when a timer fires: a hair, never a clock that was set back. */
const EARLY_MS = 50;

let now: number | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
/** The half minute the armed timer is for. */
let due = 0;
const listeners = new Set<() => void>();

/**
 * Reads the clock again when the reading is older than `WAIT_CLOCK_FRESH_MS` (or the clock was set back). Called as a
 * reader renders, and it tells nobody: readers that already hold the old reading move at the next step, as before, and
 * a render is never another reader's reason to render.
 */
function refresh() {
  const at = Date.now();
  if (now === null || Math.abs(at - now) >= WAIT_CLOCK_FRESH_MS) now = at;
}

/** Arms the timer for the next half minute of the wall clock, strictly ahead of now (and never a second one). */
function arm() {
  if (timer !== null) clearTimeout(timer);
  const at = Date.now();
  due = (Math.floor(at / WAIT_CLOCK_STEP_MS) + 1) * WAIT_CLOCK_STEP_MS;
  timer = setTimeout(fire, due - at);
}

function fire() {
  timer = null;
  const at = Date.now();
  if (at < due && due - at <= EARLY_MS) {
    // A timer may land a hair before its moment: a step is never taken before the half minute it is for. (A wall
    // clock set back is no hair: it steps at once and goes on from the clock as it now reads, never waiting it out.)
    timer = setTimeout(fire, due - at);
    return;
  }
  now = at;
  for (const listener of listeners) listener();
  if (listeners.size > 0) arm();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (timer === null) {
    // React reads the snapshot again once it has subscribed, so the first reader sees the time without a step.
    now = Date.now();
    arm();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };
}

const getSnapshot = () => now;
const getServerSnapshot = () => null;
const noSubscription = () => () => {};

/**
 * The reader's now (epoch ms), or null on the server and while hydrating. It turns on every half minute of the wall
 * clock, and a render reads it afresh when its reading is stale. `enabled` false reads no clock at all (null), so a
 * reader with no time to tell (an album that never develops) runs no timer.
 */
export function useWaitClock(enabled = true): number | null {
  // The server has no clock of its own to read (every reader there gets the null below), so only a browser refreshes.
  if (enabled && typeof window !== "undefined") refresh();
  return useSyncExternalStore(
    enabled ? subscribe : noSubscription,
    enabled ? getSnapshot : getServerSnapshot,
    getServerSnapshot,
  );
}
