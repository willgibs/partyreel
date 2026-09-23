// THE PER-PLAY BYTE BUDGET for a video window in the live reel (the reel round, 2026-09-22; Will's
// ruling "Range-window decode on device"). Pure arithmetic + two tiny stateful ledgers; no DOM, no
// mediabunny, no fetch — so the whole budget is unit-testable in the node project and the reader
// can be handed a decision it only has to obey.
//
// WHY A BUDGET AT ALL. The live reel plays a window of the ORIGINAL upload (up to 10 GB, no
// transcode). The only thing standing between a guest's phone and a 40 Mbps 4K original is this
// estimate: bytes ≈ file_size_bytes / duration_seconds × window. Over the per-clip cap we shorten
// the window down to a floor, and below the floor we draw the poster. Nothing here ever throws;
// the worst outcome is "the poster", which is exactly what the engine drew before this lane.
//
// ★ WHY IT IS CHARGED PER PLAY, NOT PER CLIP. `cache: "no-store"` is mandatory on every read (the
// ACAO cache-poisoning trap in uploads-and-r2.md: the same presigned url is fetched first by a
// plain <img> tile, R2 answers without Access-Control-Allow-Origin and sends no Vary: Origin, so a
// later CORS read of the browser cache fails). No HTTP cache means the SECOND loop re-downloads
// every byte. So a video plays with motion at most once every K loops and draws its poster
// otherwise (VIDEO_MOTION_EVERY_N_LOOPS), and a session ceiling ends motion for the night once the
// device has spent enough. Both are knobs the player surfaces; these are the defaults.

/** The window a video plays with motion, in seconds (the plan's "a six-second window"). */
export const VIDEO_WINDOW_SEC = 6;

/** The shortest window worth fetching. Under this a clip reads as a stutter, so it draws its
 *  poster instead (a still that holds is better than a half-second of motion). */
export const VIDEO_WINDOW_FLOOR_SEC = 2;

/**
 * The per-clip cap on one play's estimated transfer. 6 MiB over a 6s window is ~8.4 Mbps, which
 * covers a phone's 1080p h264 original and refuses a 4K one outright (a 4K60 iPhone clip is
 * ~50 Mbps: the estimate lands ~37 MiB, the window shortens to the floor, still over, poster).
 * Tuned against the fetch having to land inside ONE previous clip's hold (~2.7s) on a venue's
 * wifi; a slower link simply misses its cue and draws the poster that pass (ladder.ts).
 */
export const VIDEO_CLIP_BYTE_CAP = 6 * 1024 * 1024;

/**
 * What the container costs on top of the window's media bytes: the ftyp/moov (or EBML header +
 * cues) mediabunny must read before it can seek. A faststart mp4's moov is small; a 10 GB original
 * with a per-frame index is not, and a phone's mov can carry a few hundred KB of sample tables.
 * Counted in every estimate so the cap is a cap on the REQUEST, not on the pixels.
 */
export const VIDEO_CONTAINER_OVERHEAD_BYTES = 256 * 1024;

/**
 * The session ceiling: total video bytes this device spends before every video falls to its poster
 * for the rest of the night. 200 MiB is roughly an hour of a wall at the default cadence (six
 * videos in a thirty-item album, a ~90s loop, motion every third loop, ~4 MiB a play) and about
 * eight minutes of a guest scrolling the album on cellular. The screen raises it, a phone on
 * saveData never starts (ladder.ts).
 */
export const VIDEO_SESSION_BYTE_CEILING = 200 * 1024 * 1024;

/** A video plays with motion once every K loops and draws its poster otherwise. */
export const VIDEO_MOTION_EVERY_N_LOOPS = 3;

/** The estimated transfer for one play, or why there is none. */
export type WindowPlan = {
  /** The window to fetch, in seconds (≤ the requested window, ≥ the floor). */
  windowSec: number;
  /** What that window is estimated to cost, container overhead included. */
  estimatedBytes: number;
  /** True when the window was shortened to fit the cap. */
  shortened: boolean;
};

/**
 * bytes ≈ file_size_bytes / duration_seconds × window, plus the container's fixed read.
 * A non-finite or non-positive duration is treated as "one window long", which is the pessimistic
 * reading (the whole file for the window) and therefore the safe one.
 */
export function estimateWindowBytes(
  fileSizeBytes: number,
  durationSec: number,
  windowSec: number,
): number {
  if (!Number.isFinite(fileSizeBytes) || fileSizeBytes <= 0) {
    return VIDEO_CONTAINER_OVERHEAD_BYTES;
  }
  const media =
    Number.isFinite(durationSec) && durationSec > 0
      ? (fileSizeBytes / durationSec) * Math.max(0, windowSec)
      : fileSizeBytes;
  return Math.round(
    Math.min(fileSizeBytes, media) + VIDEO_CONTAINER_OVERHEAD_BYTES,
  );
}

/**
 * The window ladder: the requested window if it fits the cap, else the longest window that does,
 * else null (→ the poster). Pure; the caller decides what null means.
 *
 * `fileSizeBytes` unknown (null) is NOT optimism: the reader re-runs this with the real size the
 * moment `source.getSize()` lands, before any bulk range read, so an unknown size costs at most the
 * container's own read. The gallery payload does not carry `media.file_size_bytes` today (it is on
 * the table; the guest RPC's allow-list does not return it) — see the Handoff.
 */
export function planVideoWindow(input: {
  fileSizeBytes?: number | null;
  durationSec?: number | null;
  /** Defaults to VIDEO_WINDOW_SEC. */
  windowSec?: number;
  /** Defaults to VIDEO_CLIP_BYTE_CAP. */
  capBytes?: number;
  /** Defaults to VIDEO_WINDOW_FLOOR_SEC. */
  floorSec?: number;
}): WindowPlan | null {
  const requested = input.windowSec ?? VIDEO_WINDOW_SEC;
  const cap = input.capBytes ?? VIDEO_CLIP_BYTE_CAP;
  const floor = input.floorSec ?? VIDEO_WINDOW_FLOOR_SEC;
  if (requested < floor) return null;

  const duration = input.durationSec ?? 0;
  // A clip shorter than the window plays all of it; the window can never exceed the source.
  const ceiling = duration > 0 ? Math.min(requested, duration) : requested;
  if (ceiling < floor) {
    // A source shorter than the floor is still worth playing whole: it is cheap by definition.
    const whole = duration > 0 ? duration : requested;
    const bytes = estimateWindowBytes(
      input.fileSizeBytes ?? 0,
      duration,
      whole,
    );
    return bytes <= cap
      ? {
          windowSec: whole,
          estimatedBytes: bytes,
          shortened: whole < requested,
        }
      : null;
  }

  const size = input.fileSizeBytes ?? null;
  if (size === null) {
    // Unknown size: plan the full window and let the reader re-check on the real size.
    return {
      windowSec: ceiling,
      estimatedBytes: estimateWindowBytes(0, duration, ceiling),
      shortened: ceiling < requested,
    };
  }

  const full = estimateWindowBytes(size, duration, ceiling);
  if (full <= cap) {
    return {
      windowSec: ceiling,
      estimatedBytes: full,
      shortened: ceiling < requested,
    };
  }

  // Over the cap: the longest window whose estimate fits, quantized to a tenth of a second so the
  // number is stable and legible in the harness. Below the floor there is no window worth having.
  const perSec = duration > 0 ? size / duration : Infinity;
  const affordable = (cap - VIDEO_CONTAINER_OVERHEAD_BYTES) / perSec;
  const windowSec = Math.floor(affordable * 10) / 10;
  if (!Number.isFinite(windowSec) || windowSec < floor) return null;
  return {
    windowSec,
    estimatedBytes: estimateWindowBytes(size, duration, windowSec),
    shortened: true,
  };
}

// --- The K-loop cadence ------------------------------------------------------------------------

/** A stable non-negative 32-bit hash of a clip key (FNV-1a); no crypto, only spread. */
function hashKey(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * WHICH loop in every run of K a given clip takes its motion pass on. Keyed by the clip so the
 * videos in an album SPREAD across the cadence instead of all spending on loop 0 — three videos at
 * K = 3 cost one window a loop, not three windows every third loop.
 */
export function motionLoopOffset(clipKey: string, everyNLoops: number): number {
  const k = Math.max(1, Math.floor(everyNLoops));
  return hashKey(clipKey) % k;
}

/** Whether this clip plays with motion on this loop (K = 1 → every loop). */
export function playsWithMotion(
  loopIndex: number,
  clipKey: string,
  everyNLoops: number = VIDEO_MOTION_EVERY_N_LOOPS,
): boolean {
  const k = Math.max(1, Math.floor(everyNLoops));
  if (k === 1) return true;
  const loop = Math.max(0, Math.floor(loopIndex));
  return loop % k === motionLoopOffset(clipKey, k);
}

// --- The session ledger ------------------------------------------------------------------------

export type VideoByteLedger = {
  /** Bytes charged so far this session. */
  readonly spentBytes: number;
  readonly ceilingBytes: number;
  /** True once the ceiling is reached: every video draws its poster from here on. */
  readonly exhausted: boolean;
  /** Whether one more play of this estimated size still fits under the ceiling. */
  canAfford: (estimatedBytes: number) => boolean;
  /**
   * Charge a play up front (the estimate), and get back the reconciler. Call it with what the
   * source actually read so the ledger tracks reality rather than arithmetic; calling it twice is
   * a no-op, so a reader that both finishes and disposes settles once.
   */
  charge: (estimatedBytes: number) => (actualBytes: number) => void;
  reset: () => void;
};

/** A per-session ledger (per player, per device). Not a singleton on purpose: the venue screen and
 *  a guest's phone want different ceilings, and a test wants a fresh one every case. */
export function createVideoByteLedger(
  ceilingBytes: number = VIDEO_SESSION_BYTE_CEILING,
): VideoByteLedger {
  let spent = 0;
  const ledger: VideoByteLedger = {
    get spentBytes() {
      return spent;
    },
    get ceilingBytes() {
      return ceilingBytes;
    },
    get exhausted() {
      return spent >= ceilingBytes;
    },
    canAfford: (estimatedBytes) => spent + estimatedBytes <= ceilingBytes,
    charge: (estimatedBytes) => {
      const estimate = Math.max(0, Math.round(estimatedBytes));
      spent += estimate;
      let settled = false;
      return (actualBytes: number) => {
        if (settled) return;
        settled = true;
        const actual = Math.max(0, Math.round(actualBytes));
        spent = Math.max(0, spent - estimate + actual);
      };
    },
    reset: () => {
      spent = 0;
    },
  };
  return ledger;
}
