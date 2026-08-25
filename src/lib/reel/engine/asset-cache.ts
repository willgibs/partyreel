// A shared DECODED-BITMAP cache for the canvas engine: one decode per url, no matter how many
// players want it. The style rail mounts 14 thumb players over the SAME first-4 clips as the hero,
// so without this the page decodes each preview 15 times (15 network fetches + 15 GPU bitmaps for
// ~4 distinct images). With it: one fetch, one bitmap, 15 readers.
//
// WHAT THIS IS *NOT*: it does not touch the HTTP cache. The decode underneath is still assets.ts's
// `{ mode: "cors", cache: "no-store" }` fetch, deliberately — re-read the CORS note in assets.ts
// before "optimizing" that away: the same presigned url is often fetched FIRST by a plain <img>
// tile, so R2 caches an ACAO-less response (it sends no Vary: Origin) and a later CORS fetch reads
// the poisoned entry and fails, nulling every clip. Reusing an already-DECODED in-memory bitmap has
// none of that hazard — it never goes near the HTTP layer.
//
// CANCELLATION: a caller's AbortSignal rejects only THAT caller. The shared decode runs signal-less,
// because a thumb unmounting mid-load must not cancel the decode the other 14 players are awaiting.
// (The cost of the trade is bounded: these are ~16 KB previews.)

import { decodeImage, type DecodeImage } from "./assets";
import type { CanvasImage } from "./canvas2d";

/**
 * How many decoded images stay resident. Sized for the worst live page: the hero's full cut (up to a
 * ~60s reel) plus the rail's 14 thumbs sharing the first 4 — 48 keeps a whole browse session hot
 * while capping GPU memory (an ImageBitmap of a ~640px preview is ~1.5 MB, so ~70 MB at the ceiling).
 */
export const BITMAP_CACHE_MAX = 48;

/** Duck-typed close: ImageBitmap has it, HTMLImageElement/HTMLCanvasElement don't. Structural rather
 *  than `instanceof ImageBitmap` so this stays testable in the node unit project (no DOM globals). */
type Closable = { close?: () => void };

export type BitmapCache = {
  /** The DecodeImage to hand to loadReelAssets' `decode` option. */
  decode: DecodeImage;
  /** Drop every entry (closing the bitmaps). Tests + a future "leave the studio" teardown. */
  clear: () => void;
  /** Resident entry count (tests / debugging). */
  size: () => number;
};

/**
 * Build a cache over any decoder. Exported (rather than only the singleton) so the pins can drive it
 * with a fake decoder — the LRU/dedupe/abort behavior is the contract, not the fetch.
 */
export function createBitmapCache(
  decode: DecodeImage,
  max: number = BITMAP_CACHE_MAX,
): BitmapCache {
  // Insertion-ordered Map == the LRU order (a hit re-inserts to become newest). Values are the
  // in-flight/settled PROMISE, which is what makes concurrent callers dedupe onto one decode.
  const entries = new Map<string, Promise<CanvasImage>>();

  function evict() {
    while (entries.size > max) {
      const oldest = entries.keys().next().value;
      if (oldest === undefined) return;
      const dropped = entries.get(oldest);
      entries.delete(oldest);
      // Release the bitmap EAGERLY. An ImageBitmap holds GPU-side memory that GC reclaims only
      // whenever it feels like it, so a browse session that churns styles would balloon without
      // this. (A rejected entry has nothing to close.)
      void dropped?.then(
        (image) => (image as Closable).close?.(),
        () => {},
      );
    }
  }

  const cachedDecode: DecodeImage = (url, signal) => {
    const hit = entries.get(url);
    if (hit) {
      entries.delete(url); // LRU touch: re-insert so this url is the newest again
      entries.set(url, hit);
      return raceAbort(hit, signal);
    }
    // NOTE: no `signal` here on purpose (see the CANCELLATION note at the top).
    const shared = decode(url);
    entries.set(url, shared);
    // A FAILED decode must not be cached as a permanent failure (a flaky network would black out
    // the reel for the rest of the session), and an untouched rejected promise would surface as an
    // unhandled rejection. This one handler does both: drop the entry, swallow the noise.
    void shared.catch(() => {
      if (entries.get(url) === shared) entries.delete(url);
    });
    evict();
    return raceAbort(shared, signal);
  };

  return {
    decode: cachedDecode,
    clear: () => {
      for (const entry of entries.values()) {
        void entry.then(
          (image) => (image as Closable).close?.(),
          () => {},
        );
      }
      entries.clear();
    },
    size: () => entries.size,
  };
}

function abortError(): DOMException {
  // The same shape assets.ts already keys off (`err.name === "AbortError"`), so loadReelAssets'
  // rethrow-on-abort path is unchanged whether the decode is cached or not.
  return new DOMException("The image decode was aborted.", "AbortError");
}

/** Reject THIS caller on its own signal while the shared decode keeps running for everyone else. */
function raceAbort<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(abortError());
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(abortError());
    signal.addEventListener("abort", onAbort, { once: true });
    void promise
      .then(resolve, reject)
      .finally(() => signal.removeEventListener("abort", onAbort));
  });
}

/** The app-wide singleton: every CanvasReelPlayer on the page shares this one decode set. */
export const sharedBitmapCache = createBitmapCache(decodeImage);
