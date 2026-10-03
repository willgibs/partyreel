/**
 * THE ALBUM'S BATCH CLOCK (album-calm; Will, 2026-10-03: "15 seconds is still an incredibly reasonable time for one
 * guest's photos to distribute out ... so a huge event isn't just machine gunning in new items at every second, more
 * in batches").
 *
 * A doorbell ping says the album changed and nothing else (`use-gallery-doorbell.ts`). This decides WHEN the device
 * asks what changed:
 *
 *   ping               -> remembered; nothing is asked yet
 *   this device's tick -> ONE sync for every ping heard since the last one
 *   no ping            -> no tick fires: a quiet album asks nothing
 *
 * The ticks are `ALBUM_BATCH_MS` apart, from a phase each device draws at random when it starts listening, so a
 * venue of phones that all heard the same ping asks across the whole interval rather than in one stampede (the
 * jitter the old 2 s window padded itself with, now the whole interval). So another guest's photographs land
 * together about every fifteen seconds (none waits longer than one interval), and a device asks at most once an
 * interval however many guests are uploading.
 *
 * Never batched, because none of it is a ping: her own upload (the provider syncs on `notifyUploaded`), a host's own
 * write, a tab's return (`use-live-poll.ts`'s catch-up) and Try again. Pure, with an injectable clock and timers, so
 * the rules are Vitest-pinnable.
 */

/** THE BATCH CLOCK, named once: how often another guest's arrivals land, together, on a device that is listening. */
export const ALBUM_BATCH_MS = 15_000;

export type RefreshCoalescer = {
  /** A doorbell ping arrived. */
  ping: () => void;
  /** Cancel the pending batch (a tab gone hidden, an unmount): whatever comes next catches up on its own. */
  dispose: () => void;
};

export function createRefreshCoalescer(
  fire: () => void,
  opts?: {
    /** The interval between ticks. Default `ALBUM_BATCH_MS`. */
    batchMs?: number;
    /** Where in the first interval this device's ticks fall (0 to 1). Default `Math.random`. */
    random?: () => number;
    now?: () => number;
    setTimeoutFn?: (
      cb: () => void,
      ms: number,
    ) => ReturnType<typeof setTimeout>;
    clearTimeoutFn?: (t: ReturnType<typeof setTimeout>) => void;
  },
): RefreshCoalescer {
  const batchMs = opts?.batchMs ?? ALBUM_BATCH_MS;
  const now = opts?.now ?? Date.now;
  const setT = opts?.setTimeoutFn ?? setTimeout;
  const clearT = opts?.clearTimeoutFn ?? clearTimeout;
  // This device's first tick: somewhere in the interval that starts now. Every later one is a whole interval on.
  const origin = now() + (opts?.random ?? Math.random)() * batchMs;

  let pending: ReturnType<typeof setTimeout> | null = null;

  /** The first tick strictly after `t`: two batches are never closer than the clock. */
  const nextTick = (t: number) =>
    t < origin
      ? origin
      : origin + (Math.floor((t - origin) / batchMs) + 1) * batchMs;

  return {
    ping() {
      if (pending) return; // this batch is already waiting for its tick
      const t = now();
      pending = setT(
        () => {
          pending = null;
          fire();
        },
        nextTick(t) - t,
      );
    },
    dispose() {
      if (pending) {
        clearT(pending);
        pending = null;
      }
    },
  };
}
