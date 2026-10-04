/**
 * A HOLD FILMS FOR THE CLIP'S LENGTH, AS THE CAMERA SCREEN WIRES IT: the recorder is asked to end itself at
 * `CAMERA_VIDEO_SECONDS` (its `maxMs`), the mark reads the time rolled against it ("0:07 of 0:30") and the shutter's ring
 * fills to it, each from the one constant. The browser's camera, canvas and recorder are stood in (jsdom has none of
 * them); what is pinned is the screen's own wiring over them, so a length typed in one place and not another fails here.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GuestEvent } from "@/lib/db/queries/guest-events";
import { CAMERA_VIDEO_SECONDS } from "@/lib/media/limits";

import { AlbumCamera } from "./album-camera";
import { HOLD_MS } from "./use-shutter-press";

const media = vi.hoisted(() => {
  const track = {
    stop: vi.fn(),
    kind: "video",
    readyState: "live",
    getCapabilities: () => ({}),
  };
  const stream = {
    active: true,
    getTracks: () => [track],
    getVideoTracks: () => [track],
    getAudioTracks: () => [],
  };
  return { stream };
});

vi.mock("@/lib/guest/camera/stream", () => ({
  openCamera: vi.fn(async () => media.stream),
  stopStream: vi.fn(),
  cameraCount: vi.fn(async () => 1),
  hasTorch: () => false,
  setTorch: vi.fn(async () => true),
  microphoneState: vi.fn(async () => "prompt"),
  openMicrophone: vi.fn(async () => null),
  stillCaptureFor: () => null,
  stillLimits: vi.fn(async () => null),
}));

vi.mock("@/lib/guest/camera/capture", () => ({
  JPEG_QUALITY: 0.92,
  frameSize: () => ({ width: 1080, height: 1440 }),
  drawFrame: () => true,
  drawThumb: () => document.createElement("canvas"),
  canvasJpeg: vi.fn(
    async () => new Blob([new Uint8Array([1])], { type: "image/jpeg" }),
  ),
  pipelineStill: vi.fn(async () => null),
}));

/** The recorder the screen starts: what it was asked for is kept, and the test plays the browser's part. */
const recorder = vi.hoisted(() => ({
  input: null as null | {
    maxMs: number;
    onStart: (at: number) => void;
    onEnd: (video: null) => void;
  },
  stop: vi.fn(),
  cancel: vi.fn(),
}));
vi.mock("@/lib/guest/camera/recorder", () => ({
  canFilm: () => true,
  startFilming: vi.fn((input: NonNullable<typeof recorder.input>) => {
    recorder.input = input;
    return { stop: recorder.stop, cancel: recorder.cancel };
  }),
}));

vi.mock("@/components/guest/camera/remove-shot", () => ({
  removeOwnShot: vi.fn(async () => true),
}));

const EVENT = {
  id: "evt-1",
  name: "Maya & Jay",
  capture: "camera",
  roll_size: 24,
  develops_at: new Date(Date.now() + 6 * 3_600_000).toISOString(),
  moderation_mode: "live",
  accepts_video: true,
} as unknown as GuestEvent;

beforeEach(() => {
  vi.clearAllMocks();
  recorder.input = null;
  localStorage.clear();
  localStorage.setItem("pr_session_qr-token-1", "s".repeat(32));
  global.fetch = vi.fn(async () =>
    Response.json({
      ok: true,
      items: [],
      roll: { used: 6, cap: 24, taken: 6, ceiling: 72 },
    }),
  ) as typeof fetch;
  HTMLMediaElement.prototype.play = vi.fn(async () => {});
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia: vi.fn() },
  });
});

afterEach(() => {
  vi.useRealTimers();
});

/** The ring's circumference in its own units (`camera-shutter.tsx`: a circle of radius 44). */
const CIRCUMFERENCE = 2 * Math.PI * 44;

describe("a hold films for the clip's length", () => {
  it("★ asks the recorder for it, reads against it and fills the ring to it", async () => {
    render(
      <AlbumCamera
        open
        openedAt={Date.now()}
        onOpenChange={() => {}}
        event={EVENT}
        qrToken="qr-token-1"
        queue={[]}
        onAddFiles={() => {}}
        onRetry={() => {}}
        isDemo={false}
      />,
    );
    await screen.findByText("Tap for a photo. Hold for a video.");

    vi.useFakeTimers({
      toFake: [
        "setTimeout",
        "clearTimeout",
        "setInterval",
        "clearInterval",
        "Date",
      ],
    });
    const shutter = document.querySelector(
      "[data-cam-shutter]",
    ) as HTMLButtonElement;
    shutter.setPointerCapture = vi.fn();
    fireEvent.pointerDown(shutter, { pointerType: "touch", pointerId: 1 });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(HOLD_MS + 20);
    });

    // The recorder is asked to end itself at the clip's one length.
    expect(recorder.input, "the hold started a recording").not.toBeNull();
    expect(recorder.input!.maxMs).toBe(CAMERA_VIDEO_SECONDS * 1000);

    // The browser says it is rolling: the mark starts at nothing, against the whole.
    act(() => recorder.input!.onStart(Date.now()));
    const mark = () => document.querySelector("[data-cam-rec]")?.textContent;
    expect(mark()).toBe("0:00 of 0:30");

    // Seven seconds in: the mark and the ring have followed the clock.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(7_000);
    });
    expect(mark()).toBe("0:07 of 0:30");
    const ring = document.querySelector(
      ".cam-shutter-progress",
    ) as SVGCircleElement;
    expect(Number(ring.getAttribute("stroke-dashoffset"))).toBeCloseTo(
      CIRCUMFERENCE * (1 - 7 / CAMERA_VIDEO_SECONDS),
      1,
    );

    // The clip's end: the mark is full and so is the ring.
    await act(async () => {
      await vi.advanceTimersByTimeAsync((CAMERA_VIDEO_SECONDS - 7) * 1000);
    });
    expect(mark()).toBe("0:30 of 0:30");
    expect(Number(ring.getAttribute("stroke-dashoffset"))).toBeCloseTo(0, 1);

    // Let go: the camera stops the recording it started.
    fireEvent.pointerUp(shutter, { pointerId: 1 });
    expect(recorder.stop).toHaveBeenCalledTimes(1);
  });
});
