// THE FALLBACK LADDER for a video clip in the live reel (the reel round, 2026-09-22). One pure
// function holding the whole order, so the player, the venue screen, the cut's encoder and the lab
// harness can never disagree about WHY a given clip is drawing its poster.
//
// The ladder, in the plan's own order:
//   "Include videos" off  → the poster (which still gets the style's Ken-Burns: a held still, not a
//                           frozen frame — "the poster with motion")
//   the codec is undecodable here (HEVC on a Windows or Linux screen without a decoder) → the poster
//   the session ceiling is spent → the poster, for the rest of the night
//   this loop is a poster pass (the K-loop cadence) → the poster
//   over the per-clip byte budget → the poster
//   the window is not ready by its cue → the poster THIS pass, retried next loop
//
// Cheap, stateful checks come before the arithmetic and the arithmetic before the network, so a
// device that will never play motion never opens a reader. Nothing here throws and nothing here
// touches the DOM: `saveData` arrives as a value, never read from navigator inside the decision.

import { planVideoWindow, playsWithMotion, type WindowPlan } from "./budget";

export type VideoFallbackReason =
  | "not-a-video"
  | "videos-off"
  | "undecodable"
  | "session-ceiling"
  | "cadence"
  | "over-budget"
  | "not-ready";

export type VideoDecision =
  | { motion: true; plan: WindowPlan }
  | { motion: false; reason: VideoFallbackReason };

/** Human words for the harness and the failure reports; never user-facing copy. */
export const VIDEO_FALLBACK_LABEL: Record<VideoFallbackReason, string> = {
  "not-a-video": "a photo: nothing to decode",
  "videos-off": "Include videos is off",
  undecodable: "this device cannot decode the codec",
  "session-ceiling": "the session byte ceiling is spent",
  cadence: "a poster pass in the loop cadence",
  "over-budget": "over the per-clip byte budget",
  "not-ready": "the window did not land by its cue",
};

export type VideoLadderInput = {
  /** The player's "Include videos" toggle. */
  includeVideos: boolean;
  clipType: "photo" | "video";
  /** A stable per-clip key (the media id): spreads the cadence and keys the reader deck. */
  clipKey: string;
  /** Which loop of the live reel this pass belongs to (the fixed player passes 0). */
  loopIndex?: number;
  /** K: a video plays with motion at most once every K loops. */
  everyNLoops?: number;
  /**
   * The device's decoder answer for this track, or null when it has not been probed yet. Null is
   * OPTIMISTIC on purpose: probing costs a metadata read, so the first pass opens a reader and the
   * reader's own canDecode() answer turns a later pass into "undecodable".
   */
  decodable?: boolean | null;
  /** The session ledger's view; only the two reads the ladder needs. */
  ledger?: { exhausted: boolean; canAfford: (bytes: number) => boolean };
  fileSizeBytes?: number | null;
  durationSec?: number | null;
  windowSec?: number;
  capBytes?: number;
  floorSec?: number;
  /**
   * Whether the window has at least one decoded frame by the clip's cue. Defaults true: a caller
   * deciding at the cue (before a reader exists) is asking "should I try", and only the caller
   * deciding at draw time knows the ring's real state.
   */
  ready?: boolean;
};

/** The whole ladder in one pure call. */
export function decideVideo(input: VideoLadderInput): VideoDecision {
  if (input.clipType !== "video") {
    return { motion: false, reason: "not-a-video" };
  }
  if (!input.includeVideos) {
    return { motion: false, reason: "videos-off" };
  }
  if (input.decodable === false) {
    return { motion: false, reason: "undecodable" };
  }
  if (input.ledger?.exhausted) {
    return { motion: false, reason: "session-ceiling" };
  }
  if (
    !playsWithMotion(input.loopIndex ?? 0, input.clipKey, input.everyNLoops)
  ) {
    return { motion: false, reason: "cadence" };
  }

  const plan = planVideoWindow({
    fileSizeBytes: input.fileSizeBytes,
    durationSec: input.durationSec,
    windowSec: input.windowSec,
    capBytes: input.capBytes,
    floorSec: input.floorSec,
  });
  if (!plan) {
    return { motion: false, reason: "over-budget" };
  }
  if (input.ledger && !input.ledger.canAfford(plan.estimatedBytes)) {
    return { motion: false, reason: "session-ceiling" };
  }
  if (input.ready === false) {
    return { motion: false, reason: "not-ready" };
  }
  return { motion: true, plan };
}

/**
 * Where "Include videos" STARTS on this device. Will's ruling is that it defaults ON everywhere;
 * the one exception in the plan is Data Saver, which is the device telling us it is metered.
 * Takes the value rather than reading navigator, so it is pure; `readSaveData()` below is the
 * one-line bridge a client component calls.
 */
export function videosDefaultOn(saveData?: boolean | null): boolean {
  return saveData !== true;
}

/** `navigator.connection.saveData`, or null where the browser has no Network Information API
 *  (every Safari, and any non-DOM context). Never throws. */
export function readSaveData(): boolean | null {
  if (typeof navigator === "undefined") return null;
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection;
  return typeof connection?.saveData === "boolean" ? connection.saveData : null;
}
