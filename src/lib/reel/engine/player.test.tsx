/**
 * Pins for CanvasReelPlayer's THUMB path (R3 Track A) and the churn gates around it.
 *
 * The load-bearing claim is NEUTRALITY: with no `maxDim`, the player must draw exactly as it always
 * has — a full-res backing store and NO transform touched — because those pixels are the ones the
 * mp4 encoder reproduces (one draw fn = player + export). With `maxDim`, the ONLY differences must
 * be a smaller backing store plus a scale/reset bracket around the draw; the DrawEnv the styles see
 * must still report FULL composition dims, or every style's geometry silently changes.
 *
 * drawReelFrame is mocked (this pins the CALLER's contract, not the 14 styles — registry.test.ts and
 * the /design/reel-parity harness own those); the env factories stay REAL so the env a thumb hands a
 * style is the genuine article.
 */
import { Profiler, type ProfilerOnRenderCallback } from "react";
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { REEL_HEIGHT, REEL_WIDTH } from "./constants";
import type { DrawEnv } from "./contract";
import type { ReelProps } from "./reel-types";
import { THEME_CLASSIC } from "./reel-types";

// ── The mocks ──────────────────────────────────────────────────────────────
// No network, no real decode: assets resolve instantly as null holds (the engine's own
// missing-media shape), which is all the player needs to start its clock.
vi.mock("./assets", () => ({
  decodeImage: vi.fn(),
  loadReelAssets: vi.fn(async (clips: { url: string }[]) => ({
    clips: clips.map(() => null),
    failures: 0,
    grain: null,
  })),
}));

// One ordered call log for BOTH the ctx statements and the draw, so the scale/draw/reset bracket can
// be asserted as a sequence. Hoisted because vi.mock factories run before the module body.
const log = vi.hoisted(() => {
  const calls: { name: string; args: unknown[] }[] = [];
  const drawReelFrame = vi.fn((...args: unknown[]) => {
    calls.push({ name: "drawReelFrame", args });
  });
  return { calls, drawReelFrame };
});
const calls = log.calls;
const drawReelFrame = log.drawReelFrame;

vi.mock("./registry", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./registry")>();
  return { ...actual, drawReelFrame: log.drawReelFrame };
});

const { CanvasReelPlayer } = await import("./player");
const { loadReelAssets } = await import("./assets");

// ── A recording 2d context ─────────────────────────────────────────────────
// jsdom has no canvas backend, so getContext() returns null and the player bails before drawing.
// This Proxy answers any 2d-context method as a recording no-op and any property as a plain slot,
// which is enough for the env factories + lets us assert the exact transform calls.
function recordingContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const slots: Record<string, unknown> = {};
  return new Proxy(slots, {
    get(target, prop) {
      if (prop === "canvas") return canvas;
      if (typeof prop !== "string") return undefined;
      if (prop in target) return target[prop];
      const fn = (...args: unknown[]) => {
        calls.push({ name: prop, args });
      };
      target[prop] = fn;
      return fn;
    },
    set(target, prop, value) {
      target[prop as string] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

// ── A hand-driven rAF clock ────────────────────────────────────────────────
const frames = new Map<number, FrameRequestCallback>();
let nextFrameId = 0;

/** Run every currently-queued rAF callback once, at timestamp `now`. */
function tickFrame(now: number) {
  const queued = [...frames.entries()];
  frames.clear();
  for (const [, cb] of queued) act(() => cb(now));
}

// ── A controllable IntersectionObserver ────────────────────────────────────
class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  callback: (entries: { isIntersecting: boolean }[]) => void;
  observed = new Set<Element>();
  disconnected = false;
  constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
    this.callback = cb;
    MockIntersectionObserver.instances.push(this);
  }
  observe(el: Element) {
    this.observed.add(el);
  }
  unobserve(el: Element) {
    this.observed.delete(el);
  }
  disconnect() {
    this.disconnected = true;
    this.observed.clear();
  }
  emit(isIntersecting: boolean) {
    act(() => this.callback([{ isIntersecting }]));
  }
}

function liveObserver() {
  return [...MockIntersectionObserver.instances]
    .reverse()
    .find((o) => !o.disconnected && o.observed.size > 0);
}

const reelProps: ReelProps = {
  clips: [
    { url: "https://r2/a", type: "photo" },
    { url: "https://r2/b", type: "photo" },
  ],
  theme: THEME_CLASSIC,
  seed: 7,
  styleId: "classic",
};

let getContextSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  calls.length = 0;
  frames.clear();
  nextFrameId = 0;
  drawReelFrame.mockClear();
  vi.mocked(loadReelAssets).mockClear();
  MockIntersectionObserver.instances = [];
  getContextSpy = vi
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockImplementation(function (this: HTMLCanvasElement) {
      return recordingContext(this);
    } as never);
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    const id = ++nextFrameId;
    frames.set(id, cb);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
});

afterEach(() => {
  getContextSpy.mockRestore();
  vi.unstubAllGlobals();
});

/** Mount the player and let the (mocked) asset load settle so the clock starts. */
async function mountPlayer(
  props: Partial<Parameters<typeof CanvasReelPlayer>[0]> = {},
  onRender?: ProfilerOnRenderCallback,
) {
  const view = render(
    <Profiler id="player" onRender={onRender ?? (() => {})}>
      <CanvasReelPlayer reelProps={reelProps} {...props} />
    </Profiler>,
  );
  await act(async () => {});
  return view;
}

function canvasOf(container: HTMLElement) {
  const canvas = container.querySelector("canvas");
  if (!canvas) throw new Error("no canvas rendered");
  return canvas;
}

const transformCalls = () => calls.filter((c) => c.name === "setTransform");

describe("CanvasReelPlayer without maxDim (the full-res path)", () => {
  it("keeps the FULL backing store and NEVER touches the transform", async () => {
    const { container } = await mountPlayer();
    const canvas = canvasOf(container);
    expect(canvas.width).toBe(REEL_WIDTH);
    expect(canvas.height).toBe(REEL_HEIGHT);

    tickFrame(0);
    expect(drawReelFrame).toHaveBeenCalled();
    // The neutrality claim: not one transform statement on the full-res path.
    expect(transformCalls()).toEqual([]);
  });

  it("hands the styles an env reporting the composition dims", async () => {
    await mountPlayer();
    tickFrame(0);
    const env = drawReelFrame.mock.calls[0][4] as DrawEnv;
    expect(env.width).toBe(REEL_WIDTH);
    expect(env.height).toBe(REEL_HEIGHT);
  });

  it("normalizes washes to the FULL frame", async () => {
    await mountPlayer();
    expect(vi.mocked(loadReelAssets).mock.calls[0][1]).toMatchObject({
      frame: { width: REEL_WIDTH, height: REEL_HEIGHT },
    });
  });
});

describe("CanvasReelPlayer with maxDim (the thumb path)", () => {
  it("caps the backing store to maxDim on the longest side", async () => {
    const { container } = await mountPlayer({ maxDim: 216 });
    const canvas = canvasOf(container);
    // Portrait 1080x1920 capped at 216 -> 122x216 (the short side rounds).
    expect(canvas.height).toBe(216);
    expect(canvas.width).toBe(Math.round((REEL_WIDTH * 216) / REEL_HEIGHT));
  });

  it("brackets the draw with a pre-scale and hands the ctx back at identity", async () => {
    const { container } = await mountPlayer({ maxDim: 216 });
    const canvas = canvasOf(container);
    drawReelFrame.mockClear();
    calls.length = 0;
    tickFrame(0);

    const scaleX = canvas.width / REEL_WIDTH;
    const scaleY = canvas.height / REEL_HEIGHT;
    // Recorded in order: scale in -> draw -> reset (the draw marker rides the same log).
    expect(
      calls
        .filter((c) => c.name === "setTransform" || c.name === "drawReelFrame")
        .map((c) => [c.name, ...(c.name === "setTransform" ? c.args : [])]),
    ).toEqual([
      ["setTransform", scaleX, 0, 0, scaleY, 0, 0],
      ["drawReelFrame"],
      ["setTransform", 1, 0, 0, 1, 0, 0],
    ]);
    expect(drawReelFrame).toHaveBeenCalledTimes(1);
    // Per-axis scale so the drawn frame fills the backing store exactly (no sub-pixel sliver).
    expect(scaleX).toBeCloseTo(scaleY, 2);
  });

  it("still reports FULL composition dims to the styles (the whole point of the scaled env)", async () => {
    await mountPlayer({ maxDim: 216 });
    tickFrame(0);
    const env = drawReelFrame.mock.calls[0][4] as DrawEnv;
    expect(env.width).toBe(REEL_WIDTH);
    expect(env.height).toBe(REEL_HEIGHT);
    // ...and its scratch layers are full-res too, so a natural-size blit lands right under the scale.
    const scratch = env.scratch(0);
    expect(scratch.canvas.width).toBe(REEL_WIDTH);
    expect(scratch.canvas.height).toBe(REEL_HEIGHT);
  });

  it("normalizes washes to the REDUCED frame (they are drawn dest-sized)", async () => {
    const { container } = await mountPlayer({ maxDim: 216 });
    const canvas = canvasOf(container);
    expect(vi.mocked(loadReelAssets).mock.calls[0][1]).toMatchObject({
      frame: { width: canvas.width, height: canvas.height },
    });
  });

  it("ignores a maxDim that is not actually smaller (no transform, full dims)", async () => {
    const { container } = await mountPlayer({ maxDim: 4000 });
    expect(canvasOf(container).width).toBe(REEL_WIDTH);
    tickFrame(0);
    expect(transformCalls()).toEqual([]);
  });
});

describe("CanvasReelPlayer render churn", () => {
  it("does NOT re-render React per frame when showControls is false", async () => {
    let commits = 0;
    await mountPlayer({ showControls: false }, () => {
      commits += 1;
    });
    const afterMount = commits;

    tickFrame(0);
    tickFrame(1000); // 1s later -> a different floored frame index
    tickFrame(2000);
    // The canvas kept advancing...
    const drawnFrames = drawReelFrame.mock.calls.map((c) => c[1] as number);
    expect(new Set(drawnFrames).size).toBeGreaterThan(1);
    // ...while React committed nothing (setShownFrame is gated behind showControls).
    expect(commits).toBe(afterMount);
  });

  it("DOES track the shown frame while the controls are mounted (the scrubber needs it)", async () => {
    let commits = 0;
    const { container } = await mountPlayer({}, () => {
      commits += 1;
    });
    const afterMount = commits;
    tickFrame(0);
    tickFrame(1000);
    expect(commits).toBeGreaterThan(afterMount);
    expect(container.querySelector('input[type="range"]')).not.toBeNull();
  });
});

describe("CanvasReelPlayer viewport gating", () => {
  it("freezes the clock off-screen and resumes it in place", async () => {
    await mountPlayer({ showControls: false });
    const observer = liveObserver();
    expect(observer).toBeDefined();

    tickFrame(0); // frame 0
    tickFrame(500); // 0.5s in -> frame 12
    const beforeOffscreen = drawReelFrame.mock.calls.length;

    observer!.emit(false); // scrolled away
    expect(frames.size).toBe(0); // the rAF loop is cancelled, not merely idle
    tickFrame(2000);
    expect(drawReelFrame.mock.calls.length).toBe(beforeOffscreen);

    observer!.emit(true); // scrolled back
    tickFrame(2000); // re-seeds the clock; no time accrues across the gap
    tickFrame(2500); // +0.5s of real playback

    expect(drawReelFrame.mock.calls.length).toBeGreaterThan(beforeOffscreen);
    const drawn = drawReelFrame.mock.calls.map((c) => c[1] as number);
    // 1.0s of PLAYING time -> frame 24. If the 1.5s off-screen had accumulated it would be 60.
    expect(drawn.at(-1)).toBe(24);
  });

  it("disconnects the observer on unmount", async () => {
    const { unmount } = await mountPlayer({ showControls: false });
    const observer = liveObserver();
    unmount();
    expect(observer!.disconnected).toBe(true);
  });

  it("runs a CONTROLLED player with no clock and no observer at all", async () => {
    await mountPlayer({ frame: 12 });
    expect(liveObserver()).toBeUndefined();
    expect(frames.size).toBe(0);
    expect(drawReelFrame).toHaveBeenCalledTimes(1);
    expect(drawReelFrame.mock.calls[0][1]).toBe(12);
  });
});
