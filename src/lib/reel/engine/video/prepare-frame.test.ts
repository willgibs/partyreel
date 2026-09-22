// The wiring between the timeline and the readers: the encoder's seam pulling a video clip's
// frames IN ORDER, the ladder running in exactly one place, the deck staying at two readers and the
// ledger being charged once a play and reconciled to what was read.
//
// The draw is simulated rather than mocked: this walks the same frameStateAt the mood renderer
// walks and reads the same synchronous `frameAt`, so "frames in order" means the order the export
// would actually put them in. encode.ts's own await lands in ./encode-seam.test.tsx.

import { describe, expect, it } from "vitest";

import { FPS } from "../constants";
import type { ReelClip, ReelProps } from "../reel-types";
import { THEME_CLASSIC } from "../reel-types";
import { frameStateAt, planFor } from "../timeline";
import { createVideoByteLedger } from "./budget";
import { createVideoPlayback } from "./prepare-frame";
import {
  createReaderDeck,
  openWindowReader,
  type DecodedCanvas,
  type OpenVideoInput,
  type WindowReaderSpec,
} from "./window-reader";

const MB = 1024 * 1024;

/** A 30fps source of `seconds` seconds, decoded as fast as the ring is drained. */
function fakeOpen(seconds = 8, bytesPerFrame = 2000): OpenVideoInput {
  return async () => {
    let onRead: ((bytes: number) => void) | null = null;
    return {
      getPrimaryVideoTrack: async () => ({
        displayWidth: 1920,
        displayHeight: 1080,
        canDecode: async () => true,
        canvases: async function* (
          startSec: number,
          endSec: number,
        ): AsyncGenerator<DecodedCanvas, void, unknown> {
          for (let i = 0; i < seconds * 30; i += 1) {
            const timestamp = i / 30;
            if (timestamp < startSec) continue;
            if (timestamp >= endSec) return;
            onRead?.(bytesPerFrame);
            yield {
              canvas: {
                width: 640,
                height: 360,
              } as unknown as HTMLCanvasElement,
              timestamp,
              duration: 1 / 30,
            };
          }
        },
      }),
      getSize: async () => 4 * MB,
      onRead: (listener) => {
        onRead = listener;
      },
      dispose: () => {},
    };
  };
}

function deckOver(open: OpenVideoInput, maxLive = 2) {
  return createReaderDeck({
    maxLive,
    openReader: (spec: WindowReaderSpec) => openWindowReader({ ...spec, open }),
  });
}

const CLIPS: ReelClip[] = [
  { url: "poster-a.webp", type: "video", width: 1920, height: 1080 },
  { url: "photo-b.webp", type: "photo", width: 1080, height: 1350 },
  { url: "poster-c.webp", type: "video", width: 1080, height: 1920 },
];

function makeProps(): ReelProps {
  return {
    clips: CLIPS,
    theme: { ...THEME_CLASSIC, photoHoldSec: 2 },
    seed: 11,
    orientation: "portrait",
    styleId: "classic",
  };
}

function playbackOver(
  props: ReelProps,
  over: {
    includeVideos?: boolean;
    capBytes?: number;
    ledger?: ReturnType<typeof createVideoByteLedger>;
  } = {},
) {
  const deck = deckOver(fakeOpen());
  return {
    deck,
    playback: createVideoPlayback({
      props,
      frame: { width: 1080, height: 1920 },
      deck,
      everyNLoops: 1,
      includeVideos: over.includeVideos ?? true,
      capBytes: over.capBytes,
      ledger: over.ledger,
      sourceFor: (index) =>
        CLIPS[index]?.type === "video"
          ? {
              clipKey: `media-${index}`,
              url: `https://example.test/original-${index}.mp4`,
              fileSizeBytes: 4 * MB,
              durationSec: 8,
            }
          : null,
    }),
  };
}

describe("createVideoPlayback: the encoder's seam", () => {
  it("produces a video clip's frames in order across the whole encode", async () => {
    const props = makeProps();
    const { playback, deck } = playbackOver(props);
    const plan = planFor(props);
    const sources = plan.clips.map((_, i) => playback.videoSourceFor(i));

    const seen = new Map<number, number[]>();
    let maxLive = 0;
    for (let f = 0; f < plan.totalFrames; f += 1) {
      await playback.prepareFrame(f);
      maxLive = Math.max(maxLive, deck.liveCount);
      const state = frameStateAt(plan, f);
      for (const layer of [state.under, state.top]) {
        if (!layer) continue;
        const clip = plan.clips[layer.clipIndex];
        if (clip.type !== "video") continue;
        const decoded = sources[layer.clipIndex].frameAt(
          layer.localFrame / FPS,
        );
        if (!decoded) continue;
        const list = seen.get(layer.clipIndex) ?? [];
        list.push(decoded.localSec);
        seen.set(layer.clipIndex, list);
      }
    }

    expect(seen.size).toBeGreaterThan(0);
    for (const [, times] of seen) {
      expect(times.length).toBeGreaterThan(10);
      expect(times).toEqual([...times].sort((a, b) => a - b));
      // and it really moved, rather than holding one frame the whole way.
      expect(new Set(times).size).toBeGreaterThan(5);
    }
    expect(maxLive).toBeLessThanOrEqual(2);
    playback.dispose();
  });

  it("never opens a third reader, whatever the timeline does", async () => {
    const props = makeProps();
    const { playback, deck } = playbackOver(props);
    for (let i = 0; i < CLIPS.length; i += 1) playback.cue(i);
    expect(deck.liveCount).toBeLessThanOrEqual(2);
    playback.dispose();
    expect(deck.liveCount).toBe(0);
  });

  it("charges the ledger once a play and reconciles it to the bytes read", async () => {
    const props = makeProps();
    const ledger = createVideoByteLedger(100 * MB);
    const { playback } = playbackOver(props, { ledger });

    playback.cue(0);
    const charged = ledger.spentBytes;
    expect(charged).toBeGreaterThan(0);
    playback.cue(0); // the same presign: no second charge
    expect(ledger.spentBytes).toBe(charged);

    playback.dispose();
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    // Disposal ends the window, which settles the estimate down to what was actually read.
    expect(ledger.spentBytes).toBeLessThan(charged);
  });

  it("opens nothing at all when Include videos is off", () => {
    const props = makeProps();
    const { playback, deck } = playbackOver(props, { includeVideos: false });
    const decision = playback.cue(0);
    expect(decision).toEqual({ motion: false, reason: "videos-off" });
    expect(deck.liveCount).toBe(0);
    expect(playback.videoSourceFor(0).frameAt(0)).toBeNull();
    playback.dispose();
  });

  it("drops every reader the moment the toggle goes off", async () => {
    const props = makeProps();
    const { playback, deck } = playbackOver(props);
    playback.cue(0);
    expect(deck.liveCount).toBe(1);
    playback.setIncludeVideos(false);
    expect(deck.liveCount).toBe(0);
    expect(playback.videoSourceFor(0).frameAt(0)).toBeNull();
    playback.dispose();
  });

  it("falls to the poster, silently, for a clip over the per-clip cap", () => {
    const props = makeProps();
    const { playback, deck } = playbackOver(props, { capBytes: 64 * 1024 });
    expect(playback.cue(0)).toEqual({ motion: false, reason: "over-budget" });
    expect(deck.liveCount).toBe(0);
    expect(playback.videoSourceFor(0).frameAt(0)).toBeNull();
    playback.dispose();
  });

  it("retires a reader at the loop boundary so the cadence decides again", () => {
    const props = makeProps();
    const deck = deckOver(fakeOpen());
    let loop = 0;
    const playback = createVideoPlayback({
      props,
      frame: { width: 1080, height: 1920 },
      deck,
      everyNLoops: 1,
      loopIndex: () => loop,
      sourceFor: () => ({
        clipKey: "media-0",
        url: "https://example.test/original-0.mp4",
        fileSizeBytes: 4 * MB,
        durationSec: 8,
      }),
    });

    expect(playback.cue(0).motion).toBe(true);
    const first = deck.peek("media-0");
    expect(first).not.toBeNull();

    loop = 1;
    playback.cue(0);
    const second = deck.peek("media-0");
    expect(second).not.toBe(first);
    expect(first!.state).toBe("disposed");
    playback.dispose();
  });

  it("opens no reader at all on a poster loop of the cadence", () => {
    const props = makeProps();
    const deck = deckOver(fakeOpen());
    let loop = 0;
    const playback = createVideoPlayback({
      props,
      frame: { width: 1080, height: 1920 },
      deck,
      everyNLoops: 2,
      loopIndex: () => loop,
      sourceFor: () => ({
        clipKey: "media-0",
        url: "https://example.test/original-0.mp4",
        fileSizeBytes: 4 * MB,
        durationSec: 8,
      }),
    });

    const seen = new Set<boolean>();
    for (loop = 0; loop < 4; loop += 1) {
      const decision = playback.cue(0);
      seen.add(decision.motion);
      if (!decision.motion) {
        expect(decision.reason).toBe("cadence");
        expect(deck.liveCount).toBe(0);
      }
    }
    expect(seen.has(true)).toBe(true);
    expect(seen.has(false)).toBe(true);
    playback.dispose();
  });

  it("answers null for a photo's source rather than asking anything", () => {
    const props = makeProps();
    const { playback } = playbackOver(props);
    expect(playback.cue(1)).toEqual({ motion: false, reason: "not-a-video" });
    expect(playback.videoSourceFor(1).frameAt(0)).toBeNull();
    playback.dispose();
  });

  it("prepareFrame resolves for a reel with no video at all", async () => {
    const props: ReelProps = {
      clips: [{ url: "a.webp", type: "photo" }],
      theme: THEME_CLASSIC,
      seed: 3,
    };
    const deck = deckOver(fakeOpen());
    const playback = createVideoPlayback({
      props,
      frame: { width: 1080, height: 1920 },
      deck,
      sourceFor: () => null,
    });
    await playback.prepareFrame(0);
    expect(deck.liveCount).toBe(0);
    playback.dispose();
  });
});
