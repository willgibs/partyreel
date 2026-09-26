// THE RANGE-WINDOW VIDEO READER (the reel round: "range-window decode on
// device"). A window of the ORIGINAL upload, fetched by byte range and decoded on the viewer's
// device into a small ring of canvases the synchronous draw reads. Nothing is stored, nothing is
// transcoded, R2 egress is free; the cost is transfer on the viewer's side, which budget.ts bounds
// and ladder.ts decides.
//
// THE SHAPE. An async PUMP (this module) fills a bounded ring; the DRAW reads it through
// `frameAt(localSec)`, which never awaits (reel-types.ts's ReelVideoSource carries the ★ invariant
// and why). The pump is paced by the draw's own cursor: it stops pulling once the ring is full and
// resumes when `frameAt` prunes what playback has passed, so a clip that is never drawn never
// fetches more than one ring's worth of bytes.
//
// FAILURE IS NEVER A THROW. Every outcome that is not "frames" is the POSTER: no video track, a
// codec this device cannot decode, a range read the browser will not let us see (an R2 bucket
// whose CORS does not EXPOSE Content-Range answers exactly like this), an aborted read. The reader
// records the failure and `frameAt` keeps answering null.
//
// ★ THE PRESIGN TRAP (uploads-and-r2.md). An EXPIRED presigned url answers a CORS-shaped failure
// with no status, indistinguishable from a network error, so every rejection is reported with
// `possibleExpiry` and the caller decides (clear the gallery ETag, refetch, at most once a minute).
// An Input is created PER PLAY from the CURRENT url and never held across a presign bucket roll:
// the deck below reopens whenever a key's url changes.
//
// ★ cache: "no-store" IS LOAD-BEARING, not a tuning knob. The same presigned url is often fetched
// first by a plain <img> tile: R2 answers without Access-Control-Allow-Origin and sends no
// Vary: Origin, so the browser caches an ACAO-less response and every later CORS read of it fails.
// (The same reason assets.ts fetches its stills no-store.) It also means the bytes are paid for
// again on every play, which is why budget.ts charges per play.

import type { ReelVideoFrame, ReelVideoSource } from "../reel-types";

// --- Constants ----------------------------------------------------------------------------------

/** Decoded frames held at once. Small on purpose: these are full canvases, and two readers are
 *  live at once during a transition. Eight frames is ~0.27s of a 30fps source — enough slack for
 *  the draw to stay ahead of a pump that is keeping up, and a hold (never a blank) when it is not. */
export const VIDEO_RING_FRAMES = 8;

/** CanvasSink pool size = the ring plus headroom for the sink's own read-ahead, so a canvas the
 *  ring still holds is never repainted under it. (poolSize 0 would allocate a canvas per frame.) */
export const VIDEO_POOL_HEADROOM = 4;

/** The source cache mediabunny may hold per reader. Sized just over the per-clip byte cap so one
 *  window's bytes stay resident and a paced decode never re-requests a range it already read. */
export const VIDEO_SOURCE_CACHE_BYTES = 8 * 1024 * 1024;

/** Parallel range requests per reader: ONE. Two readers are live at once, and a venue's uplink is
 *  better served by finishing the playing clip's window than by racing the next one's. */
export const VIDEO_SOURCE_PARALLELISM = 1;

/** Two quick retries, then fail (mediabunny's default backoff never gives up, which would keep a
 *  dead presign in flight for the rest of the night). */
export const VIDEO_RETRY_DELAYS_SEC = [0.25, 0.5];

/** At most two readers live at once: the playing clip's and the next one's. */
export const VIDEO_MAX_LIVE_READERS = 2;

/** How long `waitFor` will block before giving up on a window (→ the poster). Only the ENCODER
 *  waits; the live draw never blocks, it reads the ring and moves on. */
export const VIDEO_WAIT_TIMEOUT_MS = 8_000;

// --- The mediabunny seam ------------------------------------------------------------------------
//
// The reader talks to these three tiny shapes, never to mediabunny directly, for two reasons: the
// unit tests run in the NODE project (no DOM, no WebCodecs) and drive a fake, and the real opener
// imports mediabunny DYNAMICALLY so a page that never plays a video never pulls the demuxer into
// its chunk (constants.ts carries the same lesson for the encoder).

export type DecodedCanvas = {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  /** Source timestamp in seconds. */
  timestamp: number;
  duration: number;
};

export type VideoTrackHandle = {
  displayWidth: number;
  displayHeight: number;
  canDecode: () => Promise<boolean>;
  /** Decoded frames for [startSec, endSec), in presentation order. */
  canvases: (
    startSec: number,
    endSec: number,
    size: { width?: number; height?: number },
    poolSize: number,
  ) => AsyncGenerator<DecodedCanvas, void, unknown>;
};

export type VideoInputHandle = {
  getPrimaryVideoTrack: () => Promise<VideoTrackHandle | null>;
  /** The file's byte length, or null when the source will not say (an unranged or CORS-blind read). */
  getSize: () => Promise<number | null>;
  /** Every byte range the source actually reads, for the ledger and the harness readout. */
  onRead: (listener: (bytes: number) => void) => void;
  dispose: () => void;
};

export type OpenVideoInput = (spec: {
  url: string;
  maxCacheSize: number;
  parallelism: number;
}) => Promise<VideoInputHandle>;

/** The real opener: mediabunny's Input over a UrlSource, imported on demand. */
export const openMediabunnyInput: OpenVideoInput = async ({
  url,
  maxCacheSize,
  parallelism,
}) => {
  const { ALL_FORMATS, CanvasSink, Input, UrlSource } =
    await import("mediabunny");
  const source = new UrlSource(url, {
    // See the ★ note at the head of this file: both of these are load-bearing.
    requestInit: { cache: "no-store", mode: "cors" },
    maxCacheSize,
    parallelism,
    getRetryDelay: (previousAttempts) =>
      VIDEO_RETRY_DELAYS_SEC[previousAttempts] ?? null,
  });
  const input = new Input({ formats: ALL_FORMATS, source });
  return {
    getPrimaryVideoTrack: async () => {
      const track = await input.getPrimaryVideoTrack();
      if (!track) return null;
      return {
        displayWidth: track.displayWidth,
        displayHeight: track.displayHeight,
        canDecode: () => track.canDecode(),
        canvases: (startSec, endSec, size, poolSize) =>
          new CanvasSink(track, {
            ...size,
            poolSize,
          }).canvases(startSec, endSec),
      };
    },
    getSize: () => input.source.getSizeOrNull().catch(() => null),
    onRead: (listener) => {
      input.source.on("read", ({ start, end }) => listener(end - start));
    },
    dispose: () => input.dispose(),
  };
};

// --- Failures -----------------------------------------------------------------------------------

export type VideoReadFailureKind =
  | "open" // the Input never came up (network, CORS, a format nothing here reads)
  | "no-video-track"
  | "undecodable" // canDecode() said no: this device has no decoder for the codec
  | "range-unreadable" // the source would not report its size: no Content-Range through CORS
  | "decode" // the pump threw mid-window
  | "aborted"; // disposed while reading

export type VideoReadFailure = {
  kind: VideoReadFailureKind;
  message: string;
  /**
   * True when the rejection carried no HTTP status. An expired presign answers exactly like a
   * network or CORS error (uploads-and-r2.md), so the caller treats this as "possibly expired":
   * clear the gallery ETag and force a refetch, at most once a minute.
   */
  possibleExpiry: boolean;
};

// --- Sizing -------------------------------------------------------------------------------------

/**
 * The decode size for a track in a given composition: the LONG edge capped at the composition's
 * SHORT side, aspect preserved by setting exactly one dimension (mediabunny deduces the other).
 *
 * WHY NOT `fit: "cover"` at the composition's size (the plan's sketch): the renderer decides
 * cover-vs-contain itself from the clip's declared dims, and mismatched-orientation media is
 * deliberately CONTAINED, not cropped. A pre-cropped decode would double-crop a contained clip and
 * make the motion frame disagree with the poster it takes over from, mid-clip, on screen.
 * Returning an empty object (no upscale) leaves the sink at the track's native size.
 */
export function decodeSizeFor(
  track: { displayWidth: number; displayHeight: number },
  frame: { width: number; height: number },
): { width?: number; height?: number } {
  const cap = Math.max(1, Math.min(frame.width, frame.height));
  const { displayWidth: w, displayHeight: h } = track;
  if (!(w > 0) || !(h > 0)) return { width: cap };
  const longEdge = Math.max(w, h);
  if (longEdge <= cap) return {};
  return w >= h ? { width: cap } : { height: cap };
}

// --- The reader ---------------------------------------------------------------------------------

export type ReaderState =
  | "opening"
  | "probing"
  | "filling"
  | "drained"
  | "failed"
  | "disposed";

export type WindowReaderSpec = {
  /** A stable per-clip key (the media id). */
  clipKey: string;
  /** The CURRENT presigned url. A new url is a new reader (see the ★ presign trap). */
  url: string;
  /** Where the window starts in the SOURCE (the clip's trimStartSec). */
  startSec: number;
  /** How long the window is, in seconds (what budget.ts planned). */
  windowSec: number;
  /** The composition, for sizing the decode. */
  frame: { width: number; height: number };
  /** Called once with the bytes this reader actually read (the ledger's reconciler). */
  onBytes?: (actualBytes: number) => void;
  /** Called once if the reader fails; the caller decides what a possible expiry means. */
  onFailure?: (failure: VideoReadFailure) => void;
  /** Ring size override (tests, the harness knob). */
  ringFrames?: number;
  /** The mediabunny seam (tests hand in a fake). */
  open?: OpenVideoInput;
};

export type WindowReader = ReelVideoSource & {
  readonly clipKey: string;
  readonly url: string;
  readonly state: ReaderState;
  readonly failure: VideoReadFailure | null;
  /** Bytes the source reported reading so far. */
  readonly bytesRead: number;
  readonly framesDecoded: number;
  /** null until the track has been probed. */
  readonly decodable: boolean | null;
  /** Frames resident in the ring right now (the harness readout). */
  readonly ringSize: number;
  /** Resolves true once a frame is in the ring, false if the reader failed or drained empty. */
  ready: () => Promise<boolean>;
  /**
   * THE ENCODER'S SEAM. Await the ring reaching `localSec`, pruning as it goes (which is what lets
   * the paced pump advance). Resolves true when the frame for that moment is the one `frameAt`
   * will answer with, false when the reader ended, was disposed or timed out without one — all of
   * which mean "draw the poster". The live draw never calls this.
   */
  waitFor: (localSec: number, timeoutMs?: number) => Promise<boolean>;
  /** Idempotent: returns the generator and disposes the Input. Safe mid-read. */
  dispose: () => void;
};

/** The failure kinds an expired presign can produce: the read never landed. */
const EXPIRY_KINDS = new Set<VideoReadFailureKind>([
  "open",
  "range-unreadable",
  "decode",
]);

/** Is this rejection CORS-shaped (no HTTP status in its message)? An expired presign looks exactly
 *  like a network failure, so anything that does not name a status is "possibly expired". */
function looksLikeExpiry(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return !/\b(4\d\d|5\d\d)\b/.test(message);
}

function describe(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

/**
 * Open a reader for one window of one clip. Returns immediately; the pump runs in the background
 * and every failure lands in `failure` rather than as a rejection. `frameAt` is safe to call at
 * any point in the reader's life, including before the first byte lands.
 */
export function openWindowReader(spec: WindowReaderSpec): WindowReader {
  const capacity = Math.max(2, spec.ringFrames ?? VIDEO_RING_FRAMES);
  const ring: ReelVideoFrame[] = [];
  let state: ReaderState = "opening";
  let failure: VideoReadFailure | null = null;
  let bytesRead = 0;
  let framesDecoded = 0;
  let decodable: boolean | null = null;
  let disposed = false;
  let input: VideoInputHandle | null = null;
  let generator: AsyncGenerator<DecodedCanvas, void, unknown> | null = null;

  // The pump's backpressure: resolved whenever the draw prunes the ring or the reader is disposed.
  let wakePump: (() => void) | null = null;
  // The first-frame gate `ready()` awaits.
  let settleReady: ((ok: boolean) => void) | null = null;
  const readyPromise = new Promise<boolean>((resolve) => {
    settleReady = resolve;
  });
  // Every waiter parked in `waitFor`, woken on a push, a failure, a drain or disposal.
  let waiters: (() => void)[] = [];

  function wake(): void {
    const w = wakePump;
    wakePump = null;
    w?.();
  }

  function notify(): void {
    const parked = waiters;
    waiters = [];
    for (const w of parked) w();
  }

  function settle(ok: boolean): void {
    const s = settleReady;
    settleReady = null;
    s?.(ok);
  }

  function fail(kind: VideoReadFailureKind, err: unknown): void {
    if (failure) return;
    failure = {
      kind,
      message: describe(err),
      // Only a read that never landed can be an expiry. A source we read fine but that carries no
      // video track, and a codec this device lacks, are answers, not failures of the url.
      possibleExpiry: EXPIRY_KINDS.has(kind) && looksLikeExpiry(err),
    };
    state = disposed ? "disposed" : "failed";
    spec.onFailure?.(failure);
    settle(false);
    wake();
    notify();
  }

  async function waitForRoom(): Promise<void> {
    while (!disposed && ring.length >= capacity) {
      await new Promise<void>((resolve) => {
        wakePump = resolve;
      });
    }
  }

  async function pump(): Promise<void> {
    const open = spec.open ?? openMediabunnyInput;
    try {
      input = await open({
        url: spec.url,
        maxCacheSize: VIDEO_SOURCE_CACHE_BYTES,
        parallelism: VIDEO_SOURCE_PARALLELISM,
      });
      if (disposed) return;
      input.onRead((bytes) => {
        bytesRead += bytes;
      });

      state = "probing";
      const track = await input.getPrimaryVideoTrack();
      if (disposed) return;
      if (!track) {
        fail("no-video-track", new Error("no video track in this source"));
        return;
      }

      // The size read doubles as the RANGE PROBE: a bucket whose CORS does not expose
      // Content-Range / Content-Length answers null here, and that is one more poster outcome.
      const size = await input.getSize();
      if (disposed) return;
      if (size === null) {
        fail(
          "range-unreadable",
          new Error("the source would not report its size (Content-Range?)"),
        );
        return;
      }

      decodable = await track.canDecode();
      if (disposed) return;
      if (!decodable) {
        fail("undecodable", new Error("no decoder for this codec here"));
        return;
      }

      state = "filling";
      const start = Math.max(0, spec.startSec);
      generator = track.canvases(
        start,
        start + Math.max(0, spec.windowSec),
        decodeSizeFor(track, spec.frame),
        capacity + VIDEO_POOL_HEADROOM,
      );
      for await (const decoded of generator) {
        if (disposed) break;
        ring.push({
          image: decoded.canvas,
          width: decoded.canvas.width,
          height: decoded.canvas.height,
          localSec: decoded.timestamp - start,
        });
        framesDecoded += 1;
        settle(true);
        notify();
        // Guard against a pump that somehow outran the wait (a fake, a burst): the ring is a
        // bound, never a suggestion.
        while (ring.length > capacity) ring.shift();
        await waitForRoom();
      }
      if (!disposed) {
        state = "drained";
        settle(ring.length > 0);
        notify();
      }
    } catch (err) {
      if (disposed) {
        // Disposal cancels in-flight reads inside mediabunny, which surfaces as a rejection here.
        state = "disposed";
        settle(false);
        return;
      }
      fail(state === "filling" ? "decode" : "open", err);
    } finally {
      // The window's end, however it ended: return the generator, then dispose the Input.
      const gen = generator;
      generator = null;
      try {
        await gen?.return(undefined);
      } catch {
        // A generator that already finished (or whose Input is gone) throws here; nothing to do.
      }
      const handle = input;
      input = null;
      try {
        handle?.dispose();
      } catch {
        // Already disposed.
      }
      spec.onBytes?.(bytesRead);
      settle(ring.length > 0);
      notify();
    }
  }

  /** Prune everything playback has passed and wake the pump; the shared half of frameAt/waitFor. */
  function advance(localSec: number): void {
    while (ring.length >= 2 && ring[1].localSec <= localSec) ring.shift();
    wake();
  }

  function decodedThrough(localSec: number): boolean {
    if (ring.length === 0) return false;
    return ring[ring.length - 1].localSec >= localSec || state === "drained";
  }

  void pump();

  const reader: WindowReader = {
    kind: "window",
    get clipKey() {
      return spec.clipKey;
    },
    get url() {
      return spec.url;
    },
    get state() {
      return state;
    },
    get failure() {
      return failure;
    },
    get bytesRead() {
      return bytesRead;
    },
    get framesDecoded() {
      return framesDecoded;
    },
    get decodable() {
      return decodable;
    },
    get ringSize() {
      return ring.length;
    },
    /**
     * SYNCHRONOUS, and the only thing the draw ever calls. Prunes everything playback has passed
     * (which is what lets the pump advance), then answers the newest frame at or before localSec.
     *
     * Two deliberate softenings, both "a hold beats a blank":
     * - before the window's first frame, the first frame answers (the poster hands over cleanly
     *   instead of popping a few frames in);
     * - when the pump has fallen behind, the newest frame it HAS answers, so the picture holds
     *   rather than dropping back to the poster mid-clip.
     */
    frameAt: (localSec: number) => {
      advance(localSec);
      if (ring.length === 0) return null;
      return ring[0];
    },
    ready: () => readyPromise,
    waitFor: async (localSec, timeoutMs = VIDEO_WAIT_TIMEOUT_MS) => {
      const deadline = Date.now() + Math.max(0, timeoutMs);
      for (;;) {
        advance(localSec);
        if (disposed) return false;
        if (decodedThrough(localSec)) return true;
        if (failure || state === "drained") return ring.length > 0;
        const left = deadline - Date.now();
        if (left <= 0) return ring.length > 0;
        let timer: ReturnType<typeof setTimeout> | undefined;
        await new Promise<void>((resolve) => {
          waiters.push(resolve);
          timer = setTimeout(resolve, left);
        });
        if (timer) clearTimeout(timer);
      }
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      state = "disposed";
      ring.length = 0;
      settle(false);
      wake();
      notify();
      // The pump's finally clause returns the generator and disposes the Input; do the Input here
      // too so an abort during `open` (before the loop ever starts) still frees it.
      const handle = input;
      input = null;
      try {
        handle?.dispose();
      } catch {
        // Already disposed.
      }
    },
  };
  return reader;
}

// --- The deck (at most two readers live) ---------------------------------------------------------

export type ReaderDeck = {
  /** The reader for this spec, opening one if needed. A changed url, window or start REOPENS (an
   *  Input is never held across a presign bucket roll). Opening past the limit disposes the
   *  least-recently-acquired reader. */
  acquire: (spec: WindowReaderSpec) => WindowReader;
  /** The live reader for a key, or null. Never opens one. */
  peek: (clipKey: string) => WindowReader | null;
  release: (clipKey: string) => void;
  disposeAll: () => void;
  readonly liveCount: number;
  readonly keys: string[];
};

/** A deck of at most `maxLive` readers, keyed by clip. The whole memory story of motion video: two
 *  rings of canvases, two Inputs, two source caches, and nothing else outlives a window. */
export function createReaderDeck(
  opts: {
    maxLive?: number;
    /** Open override (tests). */
    openReader?: (spec: WindowReaderSpec) => WindowReader;
  } = {},
): ReaderDeck {
  const maxLive = Math.max(1, opts.maxLive ?? VIDEO_MAX_LIVE_READERS);
  const openReader = opts.openReader ?? openWindowReader;
  // Insertion order IS the recency order: an acquire re-inserts its key.
  const live = new Map<
    string,
    { reader: WindowReader; spec: WindowReaderSpec }
  >();

  function sameWindow(a: WindowReaderSpec, b: WindowReaderSpec): boolean {
    return (
      a.url === b.url &&
      a.startSec === b.startSec &&
      a.windowSec === b.windowSec &&
      a.frame.width === b.frame.width &&
      a.frame.height === b.frame.height
    );
  }

  function drop(key: string): void {
    const entry = live.get(key);
    if (!entry) return;
    live.delete(key);
    entry.reader.dispose();
  }

  return {
    acquire: (spec) => {
      const existing = live.get(spec.clipKey);
      if (existing) {
        if (sameWindow(existing.spec, spec)) {
          // Re-insert: this key is now the most recently used.
          live.delete(spec.clipKey);
          live.set(spec.clipKey, existing);
          return existing.reader;
        }
        drop(spec.clipKey);
      }
      const reader = openReader(spec);
      live.set(spec.clipKey, { reader, spec });
      while (live.size > maxLive) {
        const oldest = live.keys().next().value;
        if (oldest === undefined) break;
        drop(oldest);
      }
      return reader;
    },
    peek: (clipKey) => live.get(clipKey)?.reader ?? null,
    release: drop,
    disposeAll: () => {
      for (const key of [...live.keys()]) drop(key);
    },
    get liveCount() {
      return live.size;
    },
    get keys() {
      return [...live.keys()];
    },
  };
}
