/**
 * THE LIVE PLAYER's contract, and it is one sentence: the clock only ever goes forward.
 *
 * ★ NO `@contract-for:` LINE YET, DELIBERATELY. The marker would put player-live.tsx in the
 * Library's index, which then owes it a `for` line in `rules/component-notes.ts` — and this lane
 * wires no production surface, so the Library would be advertising a component nothing mounts. The
 * wiring lane that gives the live reel its first surface adds both in one change; until then the
 * assertions below bind exactly as hard, they are just not advertised.
 *
 * Everything the live reel does to itself while it plays — a viewer switching looks, an upload
 * splicing in, a host hiding the photograph on screen, a window handing over — is a moment where the
 * fixed player would have zeroed its clock and blanked. So the pins here drive the real source over
 * a real take, mock only the DRAW (registry.test.ts and the reel-live harness own the fourteen
 * styles), and assert on the frames the player reports: non-decreasing across a style switch, across
 * a splice, across a drop and across a handover.
 *
 * The other half is that the tick cannot die: a throwing draw must report and keep running, because
 * a rAF that dies is a black rectangle for the rest of the night.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createBitmapCache } from "./asset-cache";
import type { CanvasImage } from "./canvas2d";
import { FPS } from "./constants";
import { frameStateAt } from "./timeline";

// ── The mocks ──────────────────────────────────────────────────────────────
const log = vi.hoisted(() => {
  const drawn: { frame: number; clips: number }[] = [];
  let thrower: ((frame: number) => void) | null = null;
  const drawReelFrame = vi.fn((...args: unknown[]) => {
    const frame = args[1] as number;
    const props = args[2] as { clips: unknown[] };
    thrower?.(frame);
    drawn.push({ frame, clips: props.clips.length });
  });
  return {
    drawn,
    drawReelFrame,
    setThrower: (fn: ((frame: number) => void) | null) => {
      thrower = fn;
    },
  };
});

vi.mock("./registry", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./registry")>();
  return { ...actual, drawReelFrame: log.drawReelFrame };
});

const { LiveReelPlayer } = await import("./player-live");
const { createClipSource } = await import("@/lib/reel/live/source");
type LiveMediaItem = import("@/lib/reel/live/items").LiveMediaItem;
type LiveFrameState = import("./player-live").LiveFrameState;

// ── A hand-driven rAF clock ────────────────────────────────────────────────
// ★ `nowMs` is MODULE-level and only ever advances, because rAF timestamps do: a per-call counter
// would hand the player a timestamp from the past and the very thing under test (a clock that only
// goes forward) would be the harness's own bug.
const frames = new Map<number, FrameRequestCallback>();
let nextFrameId = 0;
let nowMs = 0;

async function tickFrames(count: number, stepMs = 1000 / 60) {
  for (let i = 0; i < count; i++) {
    const queued = [...frames.values()];
    frames.clear();
    nowMs += stepMs;
    for (const cb of queued) await act(async () => cb(nowMs));
  }
}

class MockIntersectionObserver {
  callback: (entries: { isIntersecting: boolean }[]) => void;
  constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
    this.callback = cb;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

// ── A recording 2d context (jsdom has no canvas backend) ───────────────────
function recordingContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const slots: Record<string, unknown> = {};
  return new Proxy(slots, {
    get(target, prop) {
      if (prop === "canvas") return canvas;
      if (typeof prop !== "string") return undefined;
      if (prop in target) return target[prop];
      const fn = () => undefined;
      target[prop] = fn;
      return fn;
    },
    set(target, prop, value) {
      target[prop as string] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

const fakeImage = (url: string) => ({ url }) as unknown as CanvasImage;

function item(i: number): LiveMediaItem {
  return {
    id: `m${i}`,
    type: "photo",
    url: `/u/${i}.jpg`,
    previewUrl: `/p/${i}.webp`,
    status: "approved",
    createdAt: new Date(
      Date.parse("2026-08-15T18:00:00Z") - i * 3_600_000,
    ).toISOString(),
    uploaderKey: ["host", "g1", "g2", "g3"][i % 4],
  };
}
const album = (n: number) => Array.from({ length: n }, (_, i) => item(i));

function makeSource(items = album(24)) {
  return createClipSource({
    eventId: "e1",
    items,
    windowSize: 4,
    cache: createBitmapCache(async (url) => fakeImage(url), 64),
    load: (async (clips: readonly { url: string }[]) => ({
      clips: clips.map((clip) =>
        clip.url
          ? {
              image: fakeImage(clip.url),
              width: 4,
              height: 4,
              wash: null,
              halo: null,
            }
          : null,
      ),
      failures: 0,
      grain: null,
    })) as never,
  });
}

let getContextSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  log.drawn.length = 0;
  log.drawReelFrame.mockClear();
  log.setThrower(null);
  frames.clear();
  nextFrameId = 0;
  nowMs = 0;
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

/** Mount, let the first window's (fake) decode settle, and collect every reported frame. */
async function mountPlayer(
  props: Partial<React.ComponentProps<typeof LiveReelPlayer>> = {},
) {
  const seen: LiveFrameState[] = [];
  const source = props.source ?? makeSource();
  const view = render(
    <LiveReelPlayer
      source={source}
      styleId="classic"
      surface="hand"
      paused={false}
      onFrame={(state) => seen.push(state)}
      {...props}
    />,
  );
  await act(async () => {});
  await tickFrames(2);
  return { ...view, source, seen };
}

const monotonic = (seen: LiveFrameState[]) =>
  seen.every(
    (state, i) => i === 0 || state.globalFrame >= seen[i - 1].globalFrame,
  );

describe("LiveReelPlayer", () => {
  it("plays: one draw per frame, from the first window's plan", async () => {
    const { seen } = await mountPlayer();
    await tickFrames(30);
    expect(log.drawReelFrame).toHaveBeenCalled();
    expect(seen.length).toBeGreaterThan(10);
    expect(monotonic(seen)).toBe(true);
    expect(seen.at(-1)!.clipId).toBeTruthy();
  });

  it("★ the clock never goes backward across a STYLE SWITCH", async () => {
    const { rerender, source, seen } = await mountPlayer();
    await tickFrames(40);
    const before = seen.at(-1)!.globalFrame;

    await act(async () => {
      rerender(
        <LiveReelPlayer
          source={source}
          styleId="punchy"
          surface="hand"
          paused={false}
          onFrame={(state) => seen.push(state)}
        />,
      );
    });
    await tickFrames(40);

    expect(monotonic(seen)).toBe(true);
    expect(seen.at(-1)!.globalFrame).toBeGreaterThan(before);
    // And the reel did not start over: the style switch re-planned in place.
    expect(seen.at(-1)!.localFrame).toBeGreaterThan(0);
  });

  it("★ the clock never goes backward across a SPLICE", async () => {
    const source = makeSource();
    const { seen } = await mountPlayer({ source });
    await tickFrames(30);
    const before = seen.at(-1)!.globalFrame;

    await act(async () => {
      source.setItems([...album(24), { ...item(99), id: "fresh" }]);
    });
    await tickFrames(40);

    expect(monotonic(seen)).toBe(true);
    expect(seen.at(-1)!.globalFrame).toBeGreaterThan(before);
  });

  it("★ the clock never goes backward across a DROP of the clip on screen", async () => {
    const source = makeSource();
    const { seen } = await mountPlayer({ source });
    await tickFrames(20);
    const onScreen = seen.at(-1)!.clipId!;
    const before = seen.at(-1)!.globalFrame;

    await act(async () => {
      source.drop([onScreen]);
    });
    await tickFrames(40);

    expect(monotonic(seen)).toBe(true);
    expect(seen.at(-1)!.globalFrame).toBeGreaterThan(before);
    // And the photograph is gone well inside one hold (~40 frames at this pacing).
    expect(seen.at(-1)!.clipId).not.toBe(onScreen);
  });

  it("★ an arrival is the NEXT photograph, not the next window's", async () => {
    const source = makeSource();
    const { seen } = await mountPlayer({ source });
    await tickFrames(60, 1000 / 24);
    const before = seen.at(-1)!;

    await act(async () => {
      source.setItems([...album(24), { ...item(99), id: "fresh" }]);
    });
    // Two hundred frames is about four clips at this pacing; the arrival must land inside one.
    let landed: (typeof seen)[number] | undefined;
    for (let i = 0; i < 200 && !landed; i++) {
      await tickFrames(1, 1000 / 24);
      landed = seen.at(-1)!.clipId === "fresh" ? seen.at(-1)! : undefined;
    }
    expect(landed, "the arrival never reached the screen").toBeDefined();

    const clips = new Set(
      seen
        .slice(seen.indexOf(before))
        .map((s) => s.clipId)
        .filter(Boolean),
    );
    // The clip on screen at the splice and the arrival: nothing in between.
    expect(clips.size).toBeLessThanOrEqual(2);
    expect(monotonic(seen)).toBe(true);
  });

  it("★ an arrival lands in the window ON SCREEN, even arriving mid-transition", async () => {
    // The case that shipped an eleven-second splice in the first soak: a rewindow has to wait for
    // the transition to finish, and while it waits the PREFETCH must not eat the queue — planning
    // the next window is what consumes it. The property is sharper than a stopwatch: the arrival
    // belongs to the window already on screen, never to the one after it. A wide window (eight
    // clips) is what makes the difference visible.
    const source = createClipSource({
      eventId: "e1",
      items: album(60),
      windowSize: 8,
      cache: createBitmapCache(async (url) => fakeImage(url), 64),
      load: (async (clips: readonly { url: string }[]) => ({
        clips: clips.map((clip) =>
          clip.url
            ? {
                image: fakeImage(clip.url),
                width: 4,
                height: 4,
                wash: null,
                halo: null,
              }
            : null,
        ),
        failures: 0,
        grain: null,
      })) as never,
    });
    const { seen } = await mountPlayer({ source });
    const live = album(60);

    for (let round = 0; round < 4; round++) {
      // Splice on the very frame the clip on screen CHANGES, which is frame 0 of a transition: the
      // rewindow must wait, and the prefetch must wait with it.
      const was = seen.at(-1)!.clipId;
      for (let i = 0; i < 200 && seen.at(-1)!.clipId === was; i++) {
        await tickFrames(1, 1000 / 24);
      }
      const at = seen.at(-1)!;
      const arrival = { ...item(900 + round), id: `fresh-${round}` };
      live.push(arrival);
      await act(async () => {
        source.setItems([...live]);
      });
      let landed: LiveFrameState | undefined;
      for (let i = 0; i < 200 && !landed; i++) {
        await tickFrames(1, 1000 / 24);
        if (seen.at(-1)!.clipId === arrival.id) landed = seen.at(-1)!;
      }
      expect(
        landed,
        `round ${round}: the arrival never reached the screen`,
      ).toBeDefined();
      expect(
        landed!.windowIndex,
        `round ${round}: the arrival waited for the next window`,
      ).toBe(at.windowIndex);
    }
    expect(monotonic(seen)).toBe(true);
  });

  it("hands over to the next window without restarting anything", async () => {
    const { seen } = await mountPlayer();
    // Four clips at the hand's pacing is a couple of hundred frames; run past the handover.
    await tickFrames(320, 1000 / 24);
    const windows = [...new Set(seen.map((s) => s.windowIndex))];
    expect(windows.length).toBeGreaterThan(1);
    expect(windows).toEqual([...windows].sort((a, b) => a - b));
    expect(monotonic(seen)).toBe(true);
  });

  it("★ a handover keeps the SAME clip at the SAME frame (the seam is invisible)", async () => {
    // The player used to resume the incoming window at ITS OWN handoverOffset (the entering gap of
    // a clip one window further on) instead of the leaving window's: every handover moved the
    // shared clip by the difference between two transition lengths. Read the clip-local frame off
    // the window the player reports, tick by tick, and it must run on through every swap. Six clips
    // in windows of six is the small album, where every handover is also a loop boundary.
    // Moods whose palettes mix transition LENGTHS (a fade beside a cut or a slide): with one length
    // the old bug was invisible, since both offsets were the same number.
    for (const [styleId, n] of [
      ["classic", 2],
      ["warm", 2],
      ["warm", 6],
      ["punchy", 6],
      ["warm", 24],
    ] as const) {
      const look = { styleId, surface: "hand" as const };
      const source = createClipSource({
        eventId: "e1",
        items: album(n),
        windowSize: 6,
        cache: createBitmapCache(async (url) => fakeImage(url), 64),
        load: (async (clips: readonly { url: string }[]) => ({
          clips: clips.map((clip) =>
            clip.url
              ? {
                  image: fakeImage(clip.url),
                  width: 4,
                  height: 4,
                  wash: null,
                  halo: null,
                }
              : null,
          ),
          failures: 0,
          grain: null,
        })) as never,
      });
      const clipLocal: { window: number; clip: string | null; at: number }[] =
        [];
      const view = render(
        <LiveReelPlayer
          source={source}
          styleId={look.styleId}
          surface={look.surface}
          paused={false}
          onFrame={(state) => {
            const win = source.windowAt(state.windowIndex, look);
            if (!win) return;
            // The TOP clip's own frame: during a transition that is the entering clip, which is
            // exactly the one a handover carries (the swap lands the frame its entrance ends).
            clipLocal.push({
              window: state.windowIndex,
              clip: state.clipId,
              at: frameStateAt(win.plan, state.localFrame).top.localFrame,
            });
          }}
        />,
      );
      await act(async () => {});
      await tickFrames(420, 1000 / 24);
      let swaps = 0;
      for (let i = 1; i < clipLocal.length; i++) {
        const [a, b] = [clipLocal[i - 1], clipLocal[i]];
        if (a.window === b.window) continue;
        swaps += 1;
        expect(b.clip, `${styleId} n=${n}: the clip across swap ${swaps}`).toBe(
          a.clip,
        );
        // One tick is one frame at this step; the clip's own frame steps by exactly that.
        expect(
          Math.abs(b.at - a.at - 1),
          `${styleId} n=${n}: the clip's frame across swap ${swaps} (${a.at} -> ${b.at})`,
        ).toBeLessThanOrEqual(1);
      }
      expect(swaps, `${styleId} n=${n}: no handover happened`).toBeGreaterThan(
        0,
      );
      view.unmount();
    }
  });

  it("★ a throwing draw reports and the tick keeps running", async () => {
    const failures: number[] = [];
    const { seen } = await mountPlayer({ onFailure: (n) => failures.push(n) });
    await tickFrames(10);
    const drawsBefore = log.drawReelFrame.mock.calls.length;

    log.setThrower((frame) => {
      if (frame % 3 === 0) throw new Error("the ImageBitmap is detached");
    });
    await tickFrames(30);
    log.setThrower(null);
    await tickFrames(10);

    expect(failures.length).toBeGreaterThan(0);
    expect(failures).toEqual([...failures].sort((a, b) => a - b));
    // The draw kept being called right through the throwing stretch and past it.
    expect(log.drawReelFrame.mock.calls.length).toBeGreaterThan(
      drawsBefore + 5,
    );
    expect(monotonic(seen)).toBe(true);
  });

  it("freezes rather than skips while the tab is hidden", async () => {
    const { seen } = await mountPlayer();
    await tickFrames(20);
    const atHide = seen.at(-1)!.globalFrame;

    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await tickFrames(40, 1000 / 24);
    hidden.mockRestore();
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await tickFrames(2);

    // The reel resumes where it was; the hidden minutes are not fast-forwarded through.
    expect(seen.at(-1)!.globalFrame).toBeLessThanOrEqual(atHide + 4);
  });

  it("reports the item on screen for the caption", async () => {
    const seenItems: (LiveMediaItem | null)[] = [];
    await mountPlayer({ onClipChange: (it) => seenItems.push(it) });
    await tickFrames(20);
    expect(seenItems.length).toBeGreaterThan(0);
    expect(seenItems[0]?.id).toBeTruthy();
    expect(seenItems[0]?.previewUrl).toBeTruthy();
  });

  it("starts paused under reduced motion, and the caller's control still wins", async () => {
    const { setReducedMotion } = await import("../../../../vitest.setup");
    setReducedMotion(true);
    try {
      const { seen } = await mountPlayer({ paused: undefined });
      await tickFrames(30);
      expect(seen.every((s) => s.globalFrame === 0)).toBe(true);
    } finally {
      setReducedMotion(false);
    }
  });

  it("is a THUMB at maxDim: a smaller backing store, the same composition", async () => {
    const { container } = await mountPlayer({ maxDim: 216 });
    const canvas = container.querySelector("canvas")!;
    expect(Math.max(canvas.width, canvas.height)).toBe(216);
    await tickFrames(5);
    expect(log.drawReelFrame).toHaveBeenCalled();
  });

  it("gives every retain back on unmount, and leaves the source to its owner", async () => {
    const source = makeSource();
    const releases: number[] = [];
    const spy = vi.spyOn(source, "release").mockImplementation((index) => {
      releases.push(index);
    });
    const disposed = vi.spyOn(source, "dispose");
    const { unmount } = await mountPlayer({ source });
    await tickFrames(10);
    unmount();
    expect(releases.length).toBeGreaterThan(0);
    expect(disposed).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("draws nothing at all when the album has nothing eligible", async () => {
    const source = makeSource([]);
    await mountPlayer({ source });
    await tickFrames(20);
    expect(log.drawReelFrame).not.toHaveBeenCalled();
  });
});

/** A guard on the fixture: the engine's own frame rate is what the clock counts in. */
it("counts in the engine's frames", () => {
  expect(FPS).toBe(24);
});
