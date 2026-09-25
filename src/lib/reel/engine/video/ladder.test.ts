// The fallback ladder: every rung, and the ORDER of the rungs. The order is the contract — a
// device that will never play motion must never open a reader, so the cheap refusals come first.

import { describe, expect, it } from "vitest";

import { createVideoByteLedger } from "./budget";
import { decideVideo, readSaveData, videosDefaultOn } from "./ladder";

const MB = 1024 * 1024;

/** A clip that would happily play with motion; each case spoils exactly one thing. */
const playable = {
  includeVideos: true,
  clipType: "video" as const,
  clipKey: "media-a",
  everyNLoops: 1,
  fileSizeBytes: 3 * MB,
  durationSec: 10,
};

describe("decideVideo", () => {
  it("plays a clip that clears every rung", () => {
    const decision = decideVideo(playable);
    expect(decision.motion).toBe(true);
    if (decision.motion) expect(decision.plan.windowSec).toBe(6);
  });

  it("refuses a photo before anything else", () => {
    const decision = decideVideo({ ...playable, clipType: "photo" });
    expect(decision).toEqual({ motion: false, reason: "not-a-video" });
  });

  it("refuses when Include videos is off", () => {
    const decision = decideVideo({ ...playable, includeVideos: false });
    expect(decision).toEqual({ motion: false, reason: "videos-off" });
  });

  it("refuses a codec this device cannot decode", () => {
    const decision = decideVideo({ ...playable, decodable: false });
    expect(decision).toEqual({ motion: false, reason: "undecodable" });
  });

  it("treats a codec it has not probed yet as worth trying", () => {
    expect(decideVideo({ ...playable, decodable: null }).motion).toBe(true);
  });

  it("refuses once the session ceiling is spent", () => {
    const ledger = createVideoByteLedger(1 * MB);
    ledger.charge(1 * MB);
    const decision = decideVideo({ ...playable, ledger });
    expect(decision).toEqual({ motion: false, reason: "session-ceiling" });
  });

  it("refuses a play the ceiling cannot afford, even before it is spent", () => {
    const ledger = createVideoByteLedger(1 * MB);
    const decision = decideVideo({ ...playable, ledger });
    expect(decision).toEqual({ motion: false, reason: "session-ceiling" });
  });

  it("draws the poster on a loop that is not this clip's motion pass", () => {
    const k = 3;
    const posterLoops = [0, 1, 2].filter(
      (loop) =>
        decideVideo({ ...playable, everyNLoops: k, loopIndex: loop }).motion ===
        false,
    );
    expect(posterLoops.length).toBe(k - 1);
  });

  it("refuses a clip over the per-clip byte budget", () => {
    const decision = decideVideo({
      ...playable,
      fileSizeBytes: 50 * MB,
      durationSec: 10,
    });
    expect(decision).toEqual({ motion: false, reason: "over-budget" });
  });

  it("is the poster THIS pass when the window did not land by the cue", () => {
    const decision = decideVideo({ ...playable, ready: false });
    expect(decision).toEqual({ motion: false, reason: "not-ready" });
  });

  it("puts the cheap refusals before the arithmetic (videos off wins over budget)", () => {
    const decision = decideVideo({
      ...playable,
      includeVideos: false,
      fileSizeBytes: 50 * MB,
    });
    expect(decision).toEqual({ motion: false, reason: "videos-off" });
  });

  it("puts undecodable before the ceiling", () => {
    const ledger = createVideoByteLedger(1);
    ledger.charge(1);
    const decision = decideVideo({ ...playable, decodable: false, ledger });
    expect(decision).toEqual({ motion: false, reason: "undecodable" });
  });
});

describe("where Include videos starts", () => {
  it("is on by default, and off only under Data Saver", () => {
    expect(videosDefaultOn(undefined)).toBe(true);
    expect(videosDefaultOn(null)).toBe(true);
    expect(videosDefaultOn(false)).toBe(true);
    expect(videosDefaultOn(true)).toBe(false);
  });

  it("reads null where the browser has no Network Information API", () => {
    // The node project has no navigator with a connection; the bridge must not throw.
    expect(readSaveData()).toBeNull();
  });
});
