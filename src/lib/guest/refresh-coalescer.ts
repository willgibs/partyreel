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
 * write, a tab's return (`use-live-poll.ts`'s catch-up) and Try again.
 *
 * ★ A MOMENT IS ONE WRITE, NEVER A STREAM (crumbs-61, red-team 48's LOW). A ring that stands for a whole write (a Develop
 * now, a develop time reached, a hold released: `album_doorbell`, which says so in its payload, `use-gallery-doorbell.ts`)
 * is not one more arrival, and a device that waited for its tick learned it up to fifteen seconds after the host's own
 * screen did (+0.38 s, +0.84 s and +7.2 s measured on three guests): `moment()` asks at once, and the sync it makes
 * covers every ping heard before it, so the batch that was waiting is spent. Pings after it wait for the next tick as
 * ever. Pure, with an injectable clock and timers, so the rules are Vitest-pinnable.
 */

/** THE BATCH CLOCK, named once: how often another guest's arrivals land, together, on a device that is listening. */
export const ALBUM_BATCH_MS = 15_000;

/**
 * Whether a ping says it stands for ONE WRITE that moved many rows (`album_doorbell`: a develop, a hold released), as
 * supabase-js hands a broadcast to its listener: `{ type, event, payload }`, the payload the sender's own (with the id
 * `realtime.send` stamps beside it). An arrival's ping is contentless, so anything but a payload that says `moment: true`
 * is an arrival. The key is the database's (`20261003211000_doorbell_moment.sql`), held to it by
 * `use-gallery-doorbell.sql.test.ts`.
 */
export function isMoment(message: unknown): boolean {
  if (typeof message !== "object" || message === null) return false;
  const payload = (message as { payload?: unknown }).payload;
  return (
    typeof payload === "object" &&
    payload !== null &&
    (payload as { moment?: unknown }).moment === true
  );
}

export type RefreshCoalescer = {
  /** A doorbell ping arrived (an arrival): it waits for this device's next tick. */
  ping: () => void;
  /** A ring that stands for one whole write arrived (a develop): ask at once, and spend the batch that was waiting. */
  moment: () => void;
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
    moment() {
      // The sync made now answers every ping heard before it: the tick that batch waited for has nothing left to ask.
      if (pending) {
        clearT(pending);
        pending = null;
      }
      fire();
    },
    dispose() {
      if (pending) {
        clearT(pending);
        pending = null;
      }
    },
  };
}
