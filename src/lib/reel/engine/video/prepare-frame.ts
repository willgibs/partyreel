// THE WIRING between the reel's timeline and the range-window readers (the reel round,
// 2026-09-22): one object that answers "what does clip N draw right now", opens at most two
// readers, charges the session ledger, and hands the cut's encoder its `prepareFrame`.
//
// Nothing in here is production surface. It is the piece the LIVE player and the CUT's encoder both
// call, so the ladder is evaluated in exactly one place and the harness can show the same numbers
// the product will.
//
// THE TWO HALVES.
// - The live player: `cue(clipIndex)` as a clip comes up (open its reader, charge the estimate),
//   then the draw reads the ring through the `ReelVideoSource` on the clip. The draw NEVER awaits.
// - The cut's encoder: `prepareFrame(outputFrame)` awaited before each drawReelFrame; it pulls the
//   clips on screen at that frame up to their local time, sequentially, through the same readers.
//
// A DELIBERATE CALL: a window shorter than its clip's hold (the budget shortened it) ends on a
// FREEZE of its last decoded frame, not a snap back to the poster. The poster is usually the first
// frame of the clip, so returning to it mid-hold reads as a rewind; a freeze reads as a beat.

import { FPS } from "../constants";
import type { ReelProps, ReelVideoFrame, ReelVideoSource } from "../reel-types";
import { frameStateAt, planFor } from "../timeline";
import {
  createVideoByteLedger,
  VIDEO_MOTION_EVERY_N_LOOPS,
  VIDEO_WINDOW_SEC,
  type VideoByteLedger,
} from "./budget";
import { decideVideo, type VideoDecision } from "./ladder";
import {
  createReaderDeck,
  type ReaderDeck,
  type VideoReadFailure,
  type WindowReader,
} from "./window-reader";

/** What the payload knows about a video clip's ORIGINAL file. */
export type VideoClipSource = {
  /** A stable key for this clip: the media id. Keys the reader deck AND spreads the K-loop cadence. */
  clipKey: string;
  /** The CURRENT presigned url of the ORIGINAL (never the poster). A new presign is a new reader. */
  url: string;
  /** `media.file_size_bytes`. Unknown is allowed: the reader re-checks on the real size. */
  fileSizeBytes?: number | null;
  /** `media.duration_seconds`. */
  durationSec?: number | null;
  /** The in-point in the source; defaults to the clip's own trimStartSec, else 0. */
  startSec?: number;
};

export type VideoPlaybackOptions = {
  props: ReelProps;
  /** The composition size (reelDimensions), for sizing the decode. */
  frame: { width: number; height: number };
  /** Clip index → its original-file facts, or null for a photo / a video with no original url. */
  sourceFor: (clipIndex: number) => VideoClipSource | null;
  /** The player's "Include videos" toggle (default on; ladder.videosDefaultOn decides the start). */
  includeVideos?: boolean;
  /** K: motion at most once every K loops. */
  everyNLoops?: number;
  /** The window a full-budget clip plays, capped by the clip's own hold. */
  windowSec?: number;
  /** Per-clip byte cap override (the harness knob). */
  capBytes?: number;
  /** The session ledger; one is created when none is passed. */
  ledger?: VideoByteLedger;
  /** The reader deck; one is created when none is passed. */
  deck?: ReaderDeck;
  /** Which loop the live reel is on. The fixed player and the encoder stay on 0. */
  loopIndex?: () => number;
  onDecision?: (clipIndex: number, decision: VideoDecision) => void;
  onFailure?: (clipIndex: number, failure: VideoReadFailure) => void;
};

export type VideoPlayback = {
  /** The stable motion source to hang on clip N (`ReelClip.video`). Safe to attach to every clip:
   *  a photo's, and a clip with no reader, simply answers null and the poster draws. */
  videoSourceFor: (clipIndex: number) => ReelVideoSource;
  /** Run the ladder for clip N and open its reader when the answer is motion. Idempotent per
   *  (clip, url): call it as a clip comes up AND for the one after it. */
  cue: (clipIndex: number) => VideoDecision;
  /** The encoder seam: pass it to encodeReel's `prepareFrame`. Resolves, never rejects. */
  prepareFrame: (outputFrame: number) => Promise<void>;
  setIncludeVideos: (on: boolean) => void;
  readonly includeVideos: boolean;
  /** The last decision per clip index (the harness readout). */
  decisions: () => Map<number, VideoDecision>;
  stats: () => {
    liveReaders: number;
    spentBytes: number;
    ceilingBytes: number;
    framesDecoded: number;
    bytesRead: number;
  };
  dispose: () => void;
};

export function createVideoPlayback(
  options: VideoPlaybackOptions,
): VideoPlayback {
  const { props, frame } = options;
  const deck = options.deck ?? createReaderDeck();
  const ledger = options.ledger ?? createVideoByteLedger();
  const loopIndex = options.loopIndex ?? (() => 0);
  const everyNLoops = options.everyNLoops ?? VIDEO_MOTION_EVERY_N_LOOPS;
  let includeVideos = options.includeVideos ?? true;

  const decisions = new Map<number, VideoDecision>();
  // The reader we opened per clip, so a clip the deck evicted is not silently re-charged on the
  // next draw: the ladder runs again, which is the point of `cue`.
  //
  // ★ A READER LIVES FOR ONE LOOP. Its window drains to a frozen last frame, so carrying it into
  // the next loop would replay that freeze instead of the clip — and would quietly defeat the
  // K-loop cadence, which only means anything if the next loop has to decide again.
  const opened = new Map<number, { key: string; url: string; loop: number }>();
  const sources = new Map<number, ReelVideoSource>();

  /** The clip's hold in seconds, from the one plan every consumer shares. */
  function holdSec(clipIndex: number): number {
    const plan = planFor(props);
    const clip = plan.clips[clipIndex];
    return clip ? clip.durationInFrames / plan.fps : 0;
  }

  function readerFor(clipIndex: number): WindowReader | null {
    const opening = opened.get(clipIndex);
    if (!opening) return null;
    const reader = deck.peek(opening.key);
    if (!reader || reader.url !== opening.url) return null;
    return reader;
  }

  /** Retire the reader a previous loop opened (see the ★ note on `opened`). */
  function retireStale(clipIndex: number): void {
    const opening = opened.get(clipIndex);
    if (!opening || opening.loop === loopIndex()) return;
    opened.delete(clipIndex);
    deck.release(opening.key);
  }

  function record(clipIndex: number, decision: VideoDecision): VideoDecision {
    decisions.set(clipIndex, decision);
    options.onDecision?.(clipIndex, decision);
    return decision;
  }

  function cue(clipIndex: number): VideoDecision {
    const plan = planFor(props);
    const clip = plan.clips[clipIndex];
    if (!clip)
      return record(clipIndex, { motion: false, reason: "not-a-video" });

    const source = clip.type === "video" ? options.sourceFor(clipIndex) : null;
    if (!source || !source.url) {
      return record(clipIndex, {
        motion: false,
        reason: clip.type === "video" ? "not-ready" : "not-a-video",
      });
    }

    retireStale(clipIndex);
    const live = readerFor(clipIndex);
    if (live && live.url === source.url) {
      // Already open on this presign: keep the decision that opened it (and let an `undecodable`
      // answer that has since landed downgrade it).
      if (live.decodable === false) {
        live.dispose();
        opened.delete(clipIndex);
        return record(clipIndex, { motion: false, reason: "undecodable" });
      }
      return (
        decisions.get(clipIndex) ??
        record(clipIndex, { motion: false, reason: "not-ready" })
      );
    }

    const decision = decideVideo({
      includeVideos,
      clipType: "video",
      clipKey: source.clipKey,
      loopIndex: loopIndex(),
      everyNLoops,
      decodable: deck.peek(source.clipKey)?.decodable ?? null,
      ledger,
      fileSizeBytes: source.fileSizeBytes,
      durationSec: source.durationSec,
      // Never fetch more than the clip is on screen for: the window is capped by its own hold.
      windowSec: Math.min(
        options.windowSec ?? VIDEO_WINDOW_SEC,
        Math.max(0, holdSec(clipIndex)),
      ),
      capBytes: options.capBytes,
    });
    if (!decision.motion) {
      opened.delete(clipIndex);
      return record(clipIndex, decision);
    }

    const settle = ledger.charge(decision.plan.estimatedBytes);
    deck.acquire({
      clipKey: source.clipKey,
      url: source.url,
      startSec: source.startSec ?? clip.trimStartSec ?? 0,
      windowSec: decision.plan.windowSec,
      frame,
      onBytes: settle,
      onFailure: (failure) => options.onFailure?.(clipIndex, failure),
    });
    opened.set(clipIndex, {
      key: source.clipKey,
      url: source.url,
      loop: loopIndex(),
    });
    return record(clipIndex, decision);
  }

  return {
    videoSourceFor: (clipIndex) => {
      let source = sources.get(clipIndex);
      if (!source) {
        source = {
          kind: "window",
          frameAt: (localSec: number): ReelVideoFrame | null => {
            const reader = readerFor(clipIndex);
            if (!reader) return null;
            return reader.frameAt(localSec);
          },
        };
        sources.set(clipIndex, source);
      }
      return source;
    },
    cue,
    prepareFrame: async (outputFrame: number) => {
      const plan = planFor(props);
      const state = frameStateAt(plan, outputFrame);
      const layers = state.under ? [state.under, state.top] : [state.top];
      for (const layer of layers) {
        const clip = plan.clips[layer.clipIndex];
        if (clip?.type !== "video") continue;
        const decision = cue(layer.clipIndex);
        if (!decision.motion) continue;
        const reader = readerFor(layer.clipIndex);
        if (!reader) continue;
        // Sequential on purpose: one reader at a time keeps the encode's transfer profile the same
        // as the live player's, and the deck holds at most two anyway.
        await reader.waitFor(layer.localFrame / FPS);
      }
    },
    setIncludeVideos: (on) => {
      includeVideos = on;
      if (!on) {
        deck.disposeAll();
        opened.clear();
      }
    },
    get includeVideos() {
      return includeVideos;
    },
    decisions: () => new Map(decisions),
    stats: () => {
      const live = deck.keys.map((key) => deck.peek(key));
      return {
        liveReaders: deck.liveCount,
        spentBytes: ledger.spentBytes,
        ceilingBytes: ledger.ceilingBytes,
        framesDecoded: live.reduce((n, r) => n + (r?.framesDecoded ?? 0), 0),
        bytesRead: live.reduce((n, r) => n + (r?.bytesRead ?? 0), 0),
      };
    },
    dispose: () => {
      deck.disposeAll();
      opened.clear();
      decisions.clear();
    },
  };
}
