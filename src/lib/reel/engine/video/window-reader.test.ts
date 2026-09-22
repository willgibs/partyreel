// The range-window reader: the ring the synchronous draw reads, the pacing that bounds memory AND
// bytes, every failure resolving to "the poster" without a throw, and disposal on abort.
//
// The mediabunny seam (OpenVideoInput) is faked here on purpose: these pins are about the reader's
// own contract, and they run in the NODE project where there is no DOM, no canvas and no WebCodecs.
// The real decode path is proven in the lab harness at /design/lab/tools/reel-video over a real mov
// and a real webm.

import { describe, expect, it } from "vitest";

import {
  createReaderDeck,
  decodeSizeFor,
  openWindowReader,
  VIDEO_POOL_HEADROOM,
  type DecodedCanvas,
  type OpenVideoInput,
  type WindowReaderSpec,
} from "./window-reader";

const FRAME = { width: 1080, height: 1920 };

/** A settled-promises tick: enough for the pump to run to its next await. */
const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

type FakeOpts = {
  /** Source timestamps to yield, in presentation order. */
  timestamps?: number[];
  size?: number | null;
  decodable?: boolean;
  hasTrack?: boolean;
  openError?: Error;
  displayWidth?: number;
  displayHeight?: number;
  bytesPerFrame?: number;
};

type FakeProbe = {
  open: OpenVideoInput;
  /** Set when the canvases generator's finally ran (a break/return closed it). */
  generatorReturned: boolean;
  inputDisposed: number;
  poolSize: number | null;
  size: { width?: number; height?: number } | null;
  yielded: number;
};

function fakeOpen(opts: FakeOpts = {}): FakeProbe {
  const timestamps = opts.timestamps ?? [0, 0.1, 0.2, 0.3, 0.4, 0.5];
  const probe: FakeProbe = {
    open: async () => {
      throw new Error("replaced below");
    },
    generatorReturned: false,
    inputDisposed: 0,
    poolSize: null,
    size: null,
    yielded: 0,
  };

  probe.open = async () => {
    if (opts.openError) throw opts.openError;
    let onRead: ((bytes: number) => void) | null = null;
    return {
      getPrimaryVideoTrack: async () =>
        opts.hasTrack === false
          ? null
          : {
              displayWidth: opts.displayWidth ?? 1920,
              displayHeight: opts.displayHeight ?? 1080,
              canDecode: async () => opts.decodable !== false,
              canvases: async function* (
                startSec: number,
                endSec: number,
                size,
                poolSize,
              ): AsyncGenerator<DecodedCanvas, void, unknown> {
                probe.poolSize = poolSize;
                probe.size = size;
                try {
                  for (const timestamp of timestamps) {
                    if (timestamp < startSec || timestamp >= endSec) continue;
                    probe.yielded += 1;
                    onRead?.(opts.bytesPerFrame ?? 1000);
                    yield {
                      // A canvas stand-in: the node project has no DOM, and the reader only ever
                      // reads .width/.height off it before handing it to the draw.
                      canvas: {
                        width: 640,
                        height: 360,
                      } as unknown as HTMLCanvasElement,
                      timestamp,
                      duration: 1 / 30,
                    };
                  }
                } finally {
                  probe.generatorReturned = true;
                }
              },
            },
      getSize: async () => (opts.size === undefined ? 5_000_000 : opts.size),
      onRead: (listener) => {
        onRead = listener;
      },
      dispose: () => {
        probe.inputDisposed += 1;
      },
    };
  };
  return probe;
}

function spec(
  probe: FakeProbe,
  over: Partial<WindowReaderSpec> = {},
): WindowReaderSpec {
  return {
    clipKey: "media-a",
    url: "https://example.test/original.mp4",
    startSec: 0,
    windowSec: 6,
    frame: FRAME,
    open: probe.open,
    ...over,
  };
}

describe("openWindowReader: the ring", () => {
  it("answers the newest decoded frame at or before the clip's local time", async () => {
    const probe = fakeOpen({ timestamps: [0, 0.1, 0.2, 0.3] });
    const reader = openWindowReader(spec(probe));
    expect(await reader.ready()).toBe(true);
    await tick();

    expect(reader.frameAt(0)!.localSec).toBeCloseTo(0);
    expect(reader.frameAt(0.15)!.localSec).toBeCloseTo(0.1);
    expect(reader.frameAt(0.35)!.localSec).toBeCloseTo(0.3);
    reader.dispose();
  });

  it("reports frames in clip-LOCAL seconds, not source seconds", async () => {
    const probe = fakeOpen({ timestamps: [4, 4.1, 4.2] });
    const reader = openWindowReader(spec(probe, { startSec: 4, windowSec: 2 }));
    expect(await reader.ready()).toBe(true);
    await tick();
    expect(reader.frameAt(0)!.localSec).toBeCloseTo(0);
    expect(reader.frameAt(0.25)!.localSec).toBeCloseTo(0.2);
    reader.dispose();
  });

  it("answers null before a single frame has landed (→ the poster)", () => {
    const probe = fakeOpen();
    const reader = openWindowReader(spec(probe));
    expect(reader.frameAt(0)).toBeNull();
    reader.dispose();
  });

  it("holds the newest frame it has rather than dropping back to the poster", async () => {
    const probe = fakeOpen({ timestamps: [0, 0.1] });
    const reader = openWindowReader(spec(probe));
    await reader.ready();
    await tick();
    // Way past anything decoded: a hold, never a blank.
    expect(reader.frameAt(5)!.localSec).toBeCloseTo(0.1);
    reader.dispose();
  });

  it("paces the pump: the ring is a bound on decoded frames AND on bytes read", async () => {
    const many = Array.from({ length: 200 }, (_, i) => i / 30);
    const probe = fakeOpen({ timestamps: many, bytesPerFrame: 1000 });
    const reader = openWindowReader(spec(probe, { ringFrames: 4 }));
    await reader.ready();
    await tick();
    await tick();

    expect(reader.ringSize).toBeLessThanOrEqual(4);
    expect(reader.framesDecoded).toBeLessThanOrEqual(4);
    const parked = reader.framesDecoded;

    // The draw advancing is what lets the pump advance.
    for (let t = 0; t < 1; t += 1 / 30) reader.frameAt(t);
    await tick();
    expect(reader.framesDecoded).toBeGreaterThan(parked);
    expect(reader.ringSize).toBeLessThanOrEqual(4);
    reader.dispose();
  });

  it("sizes the sink's pool above the ring so a held canvas is never repainted", async () => {
    const probe = fakeOpen();
    const reader = openWindowReader(spec(probe, { ringFrames: 5 }));
    await reader.ready();
    expect(probe.poolSize).toBe(5 + VIDEO_POOL_HEADROOM);
    reader.dispose();
  });
});

describe("openWindowReader: every failure is the poster", () => {
  it("a codec this device cannot decode resolves to the poster with no throw", async () => {
    const probe = fakeOpen({ decodable: false });
    const reader = openWindowReader(spec(probe));
    expect(await reader.ready()).toBe(false);
    expect(reader.frameAt(0)).toBeNull();
    expect(reader.failure?.kind).toBe("undecodable");
    expect(reader.failure?.possibleExpiry).toBe(false);
    expect(reader.decodable).toBe(false);
    reader.dispose();
  });

  it("a source with no video track resolves to the poster", async () => {
    const probe = fakeOpen({ hasTrack: false });
    const reader = openWindowReader(spec(probe));
    expect(await reader.ready()).toBe(false);
    expect(reader.failure?.kind).toBe("no-video-track");
    expect(reader.failure?.possibleExpiry).toBe(false);
    reader.dispose();
  });

  it("a missing Content-Range is one more poster outcome, never a throw", async () => {
    // The R2 CORS precondition not having landed looks exactly like this: the source cannot read
    // its own size because the header is not exposed.
    const probe = fakeOpen({ size: null });
    const reader = openWindowReader(spec(probe));
    expect(await reader.ready()).toBe(false);
    expect(reader.failure?.kind).toBe("range-unreadable");
    expect(reader.frameAt(0)).toBeNull();
    reader.dispose();
  });

  it("reports a statusless rejection as a POSSIBLE EXPIRY (the presign trap)", async () => {
    const probe = fakeOpen({ openError: new Error("Failed to fetch") });
    const reader = openWindowReader(spec(probe));
    expect(await reader.ready()).toBe(false);
    expect(reader.failure?.kind).toBe("open");
    expect(reader.failure?.possibleExpiry).toBe(true);
  });

  it("does not call a rejection WITH a status an expiry", async () => {
    const probe = fakeOpen({ openError: new Error("HTTP 404 Not Found") });
    const reader = openWindowReader(spec(probe));
    await reader.ready();
    expect(reader.failure?.possibleExpiry).toBe(false);
  });

  it("hands the caller its failure once", async () => {
    const seen: string[] = [];
    const probe = fakeOpen({ decodable: false });
    const reader = openWindowReader(
      spec(probe, { onFailure: (f) => seen.push(f.kind) }),
    );
    await reader.ready();
    reader.dispose();
    await tick();
    expect(seen).toEqual(["undecodable"]);
  });
});

describe("openWindowReader: disposal", () => {
  it("returns the generator and disposes the Input on abort mid-read", async () => {
    const many = Array.from({ length: 200 }, (_, i) => i / 30);
    const probe = fakeOpen({ timestamps: many });
    const reader = openWindowReader(spec(probe, { ringFrames: 3 }));
    await reader.ready();
    await tick();
    expect(probe.generatorReturned).toBe(false);

    reader.dispose();
    await tick();
    await tick();

    expect(probe.generatorReturned).toBe(true);
    expect(probe.inputDisposed).toBeGreaterThan(0);
    expect(reader.state).toBe("disposed");
    expect(reader.frameAt(0)).toBeNull();
  });

  it("disposes the Input when aborted before the first frame", async () => {
    const probe = fakeOpen();
    const reader = openWindowReader(spec(probe));
    reader.dispose();
    await tick();
    await tick();
    expect(probe.inputDisposed).toBeGreaterThan(0);
  });

  it("reconciles the bytes it really read when the window ends", async () => {
    const settled: number[] = [];
    const probe = fakeOpen({ timestamps: [0, 0.1, 0.2], bytesPerFrame: 700 });
    const reader = openWindowReader(
      spec(probe, { onBytes: (b) => settled.push(b) }),
    );
    await reader.ready();
    for (let t = 0; t < 1; t += 0.1) reader.frameAt(t);
    await tick();
    await tick();
    expect(settled.length).toBe(1);
    expect(settled[0]).toBe(2100);
    reader.dispose();
  });

  it("is idempotent", async () => {
    const probe = fakeOpen();
    const reader = openWindowReader(spec(probe));
    await reader.ready();
    reader.dispose();
    reader.dispose();
    await tick();
    expect(reader.state).toBe("disposed");
  });
});

describe("waitFor (the encoder's seam)", () => {
  it("resolves once the window has decoded through that moment", async () => {
    const probe = fakeOpen({ timestamps: [0, 0.1, 0.2, 0.3, 0.4] });
    const reader = openWindowReader(spec(probe, { ringFrames: 2 }));
    expect(await reader.waitFor(0.35)).toBe(true);
    expect(reader.frameAt(0.35)!.localSec).toBeCloseTo(0.3);
    reader.dispose();
  });

  it("resolves false rather than hanging when the reader failed", async () => {
    const probe = fakeOpen({ decodable: false });
    const reader = openWindowReader(spec(probe));
    expect(await reader.waitFor(1)).toBe(false);
    reader.dispose();
  });

  it("resolves on a drained window instead of waiting for the timeout", async () => {
    const probe = fakeOpen({ timestamps: [0, 0.1] });
    const reader = openWindowReader(spec(probe));
    expect(await reader.waitFor(5, 50)).toBe(true);
    reader.dispose();
  });
});

describe("decodeSizeFor", () => {
  it("caps the LONG edge at the composition's short side, aspect preserved", () => {
    expect(decodeSizeFor({ displayWidth: 1920, displayHeight: 1080 }, FRAME)) //
      .toEqual({ width: 1080 });
    expect(
      decodeSizeFor({ displayWidth: 1080, displayHeight: 1920 }, FRAME),
    ).toEqual({ height: 1080 });
  });

  it("never upscales a source that is already smaller", () => {
    expect(decodeSizeFor({ displayWidth: 640, displayHeight: 360 }, FRAME)) //
      .toEqual({});
  });

  it("reads the short side of a LANDSCAPE composition too", () => {
    const landscape = { width: 1920, height: 1080 };
    expect(
      decodeSizeFor({ displayWidth: 3840, displayHeight: 2160 }, landscape),
    ).toEqual({ width: 1080 });
  });

  it("falls back to the cap when a track reports no dimensions", () => {
    expect(decodeSizeFor({ displayWidth: 0, displayHeight: 0 }, FRAME)).toEqual(
      {
        width: 1080,
      },
    );
  });
});

describe("the reader deck", () => {
  it("keeps at most two readers live: the playing clip's and the next", async () => {
    const probe = fakeOpen();
    const deck = createReaderDeck();
    deck.acquire(spec(probe, { clipKey: "a" }));
    deck.acquire(spec(probe, { clipKey: "b" }));
    deck.acquire(spec(probe, { clipKey: "c" }));
    expect(deck.liveCount).toBe(2);
    expect(deck.keys).toEqual(["b", "c"]);
    deck.disposeAll();
    await tick();
  });

  it("hands back the same reader for the same window", async () => {
    const probe = fakeOpen();
    const deck = createReaderDeck();
    const first = deck.acquire(spec(probe, { clipKey: "a" }));
    const again = deck.acquire(spec(probe, { clipKey: "a" }));
    expect(again).toBe(first);
    deck.disposeAll();
    await tick();
  });

  it("REOPENS on a new presign: an Input is never held across a bucket roll", async () => {
    const probe = fakeOpen();
    const deck = createReaderDeck();
    const first = deck.acquire(spec(probe, { clipKey: "a" }));
    const rolled = deck.acquire(
      spec(probe, { clipKey: "a", url: "https://example.test/original.mp4?2" }),
    );
    expect(rolled).not.toBe(first);
    expect(first.state).toBe("disposed");
    expect(deck.liveCount).toBe(1);
    deck.disposeAll();
    await tick();
  });

  it("disposes what it evicts", async () => {
    const probe = fakeOpen();
    const deck = createReaderDeck({ maxLive: 1 });
    const first = deck.acquire(spec(probe, { clipKey: "a" }));
    deck.acquire(spec(probe, { clipKey: "b" }));
    expect(first.state).toBe("disposed");
    deck.disposeAll();
    await tick();
    expect(deck.liveCount).toBe(0);
  });
});
