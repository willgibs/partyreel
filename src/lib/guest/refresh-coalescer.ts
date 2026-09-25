/**
 * Leading-edge refresh coalescer for the gallery doorbell.
 *
 * A doorbell ping should refetch IMMEDIATELY (sub-second doorbell-to-render),
 * but a burst of pings (approve-all rings once per row; a photo dump rings per
 * upload) must not stampede the poll route. Shape:
 *
 *   ping #1  -> fire NOW (leading edge)
 *   pings within the suppression window -> remember, don't fire
 *   window ends + something was suppressed -> ONE trailing fire
 *
 * A small random jitter pads the window so a venue full of phones that all
 * heard the same ping doesn't refetch in lockstep.
 *
 * Pure + injectable clock/timers so the timing rules are Vitest-pinnable.
 */

export type RefreshCoalescer = {
  /** A doorbell ping arrived. */
  ping: () => void;
  /** Cancel any pending trailing fire (unmount/teardown). */
  dispose: () => void;
};

export function createRefreshCoalescer(
  fire: () => void,
  opts?: {
    /** Suppression window after a fire. Default 2000ms. */
    windowMs?: number;
    /** Max extra jitter added to the window. Default 400ms. */
    jitterMs?: number;
    now?: () => number;
    setTimeoutFn?: (cb: () => void, ms: number) => ReturnType<typeof setTimeout>;
    clearTimeoutFn?: (t: ReturnType<typeof setTimeout>) => void;
    random?: () => number;
  },
): RefreshCoalescer {
  const windowMs = opts?.windowMs ?? 2000;
  const jitterMs = opts?.jitterMs ?? 400;
  const now = opts?.now ?? Date.now;
  const setT = opts?.setTimeoutFn ?? setTimeout;
  const clearT = opts?.clearTimeoutFn ?? clearTimeout;
  const random = opts?.random ?? Math.random;

  let suppressedUntil = 0;
  let pendingTrailing: ReturnType<typeof setTimeout> | null = null;

  const fireNow = () => {
    suppressedUntil = now() + windowMs + random() * jitterMs;
    fire();
  };

  return {
    ping() {
      const t = now();
      if (t >= suppressedUntil) {
        fireNow();
        return;
      }
      if (pendingTrailing) return; // a trailing fire is already scheduled
      pendingTrailing = setT(
        () => {
          pendingTrailing = null;
          fireNow();
        },
        Math.max(0, suppressedUntil - t),
      );
    },
    dispose() {
      if (pendingTrailing) {
        clearT(pendingTrailing);
        pendingTrailing = null;
      }
    },
  };
}
