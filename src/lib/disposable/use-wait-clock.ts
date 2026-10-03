"use client";

/**
 * THE WAIT'S CLOCK ON THE PAGE: the reader's own now, read every half minute, or null before hydration. The server
 * cannot know her clock, so every line that says a time (`wait-words.ts`: "All at once at 9 am", "in 10 h 20 min")
 * reads whole without it until then, and the hydrating render matches the server's HTML.
 *
 * ★ ONE TIMER FOR EVERY READER, AND NONE WITHOUT ONE: the first subscriber starts it and the last one stops it, so a
 * page with nothing waiting runs no clock at all. A store read (`useSyncExternalStore`), never a `setState` in an
 * effect.
 */
import { useSyncExternalStore } from "react";

/** How often the clock is read again: a countdown in minutes never lags a minute behind. */
export const WAIT_CLOCK_STEP_MS = 30_000;

let now: number | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function tick() {
  now = Date.now();
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (timer === null) {
    // React reads the snapshot again once it has subscribed, so the first reader sees the time without a tick.
    now = Date.now();
    timer = setInterval(tick, WAIT_CLOCK_STEP_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

const getSnapshot = () => now;
const getServerSnapshot = () => null;
const noSubscription = () => () => {};

/**
 * The reader's now (epoch ms, read every half minute), or null on the server and while hydrating. `enabled` false
 * reads no clock at all (null), so a reader with no time to tell (an album that never develops) runs no timer.
 */
export function useWaitClock(enabled = true): number | null {
  return useSyncExternalStore(
    enabled ? subscribe : noSubscription,
    enabled ? getSnapshot : getServerSnapshot,
    getServerSnapshot,
  );
}
