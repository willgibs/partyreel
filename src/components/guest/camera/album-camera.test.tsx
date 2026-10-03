/**
 * THE ALBUM'S CAMERA, PINNED AS A GUEST USES IT (disposable-mode r3's picks, wired): it opens the phone's camera and
 * reads her roll from the server, a press is a shot handed to the page's one queue at once with the count stepping
 * down, the roll's end says so with her shots one tap away, her shots are hers to take back (a removal freeing its
 * frame by the server's count), a refusal of the album stops the shutter in the server's words, and the camera is let
 * go when it closes or the page hides.
 *
 * The browser's camera, canvas and recorder are stood in (jsdom has none of them); what is pinned is the camera's own
 * behaviour over them: payloads, the words it says, the controls it offers. Never styles.
 */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GuestEvent } from "@/lib/db/queries/guest-events";
import type { FileExtra, QueueItem } from "@/lib/guest/use-upload-queue";

import { AlbumCamera } from "./album-camera";

const media = vi.hoisted(() => {
  const stop = vi.fn();
  const track = {
    stop,
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
  return { stop, track, stream };
});

vi.mock("@/lib/guest/camera/stream", () => ({
  openCamera: vi.fn(async () => media.stream),
  stopStream: vi.fn((s: { getTracks: () => { stop: () => void }[] } | null) => {
    for (const t of s?.getTracks() ?? []) t.stop();
  }),
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
    async () => new Blob([new Uint8Array([1, 2, 3])], { type: "image/jpeg" }),
  ),
  pipelineStill: vi.fn(async () => null),
}));

vi.mock("@/lib/guest/camera/recorder", () => ({
  canFilm: () => false,
  startFilming: vi.fn(() => null),
}));

const removeOwnShot = vi.hoisted(() => vi.fn(async () => true));
vi.mock("@/components/guest/camera/remove-shot", () => ({ removeOwnShot }));

const OPENED_AT = Date.now();
const AHEAD = new Date(OPENED_AT + 6 * 3_600_000).toISOString();

const EVENT = {
  id: "evt-1",
  name: "Maya & Jay",
  capture: "camera",
  roll_size: 24,
  develops_at: AHEAD,
  moderation_mode: "live",
  accepts_video: false,
} as unknown as GuestEvent;

/** The server's answer to her roll's read, per call. */
let rolls: { used: number; cap: number; taken: number; ceiling: number }[] = [];
let ownItems: unknown[] = [];

function mine() {
  return vi
    .mocked(global.fetch)
    .mock.calls.filter(([url]) => String(url) === "/api/guests/mine");
}

/** The page's side: the queue the camera hands its shots to, and whether it is open. */
function Page({
  onAdd,
  initialQueue = [],
  onOpenChange,
  isOwner = false,
}: {
  onAdd?: (files: File[], extra?: FileExtra) => void;
  initialQueue?: QueueItem[];
  onOpenChange?: (open: boolean) => void;
  isOwner?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [queue, setQueue] = useState<QueueItem[]>(initialQueue);
  return (
    <>
      <AlbumCamera
        open={open}
        openedAt={OPENED_AT}
        onOpenChange={(next) => {
          setOpen(next);
          onOpenChange?.(next);
        }}
        event={EVENT}
        qrToken="qr-token-1"
        queue={queue}
        onAddFiles={(files, extra) => {
          onAdd?.(files, extra);
          setQueue((prev) => [
            ...prev,
            ...files.map((file, i) => ({
              id: `q-${prev.length + i}`,
              file,
              kind: "photo" as const,
              status: "uploading" as const,
              progress: 0,
            })),
          ]);
        }}
        onRetry={vi.fn()}
        isDemo={false}
        isOwner={isOwner}
      />
      <button type="button" onClick={() => setQueue([])}>
        Dismiss them
      </button>
      <button type="button" onClick={() => setOpen(true)}>
        Open the camera
      </button>
      <button
        type="button"
        onClick={() =>
          setQueue((prev) =>
            prev.map((it) => ({
              ...it,
              status: "done" as const,
              mediaStatus: "sealed",
              mediaId: `m-${it.id}`,
            })),
          )
        }
      >
        Land them
      </button>
      <button
        type="button"
        onClick={() =>
          setQueue((prev) =>
            prev.map((it) => ({
              ...it,
              status: "error" as const,
              error: "This event isn't accepting uploads right now.",
              errorCode: "uploads_closed",
            })),
          )
        }
      >
        Refuse them
      </button>
    </>
  );
}

async function opened() {
  await screen.findByText("Tap for a photo.");
}

function press() {
  const shutter = document.querySelector(
    "[data-cam-shutter]",
  ) as HTMLButtonElement;
  fireEvent.pointerDown(shutter, {
    pointerType: "mouse",
    button: 0,
    pointerId: 1,
  });
  fireEvent.pointerUp(shutter, {
    pointerType: "mouse",
    button: 0,
    pointerId: 1,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  rolls = [{ used: 6, cap: 24, taken: 6, ceiling: 72 }];
  ownItems = [];
  localStorage.clear();
  localStorage.setItem("pr_session_qr-token-1", "s".repeat(32));
  global.fetch = vi.fn(async (input: RequestInfo | URL) => {
    if (String(input) === "/api/guests/mine") {
      const roll = rolls.length > 1 ? rolls.shift() : rolls[0];
      return Response.json({ ok: true, items: ownItems, roll });
    }
    throw new Error(`unexpected fetch ${String(input)}`);
  }) as typeof fetch;
  HTMLMediaElement.prototype.play = vi.fn(async () => {});
  // A page that can ask for a camera at all (`canAskCamera`); the ask itself is `openCamera`'s, stood in above.
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia: vi.fn() },
  });
});

describe("the album's camera", () => {
  it("★ opens the phone's camera and counts her roll as the server answers it", async () => {
    render(<Page />);
    await opened();
    await waitFor(() =>
      expect(screen.getByText("Frame 7 of 24")).toBeInTheDocument(),
    );
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(
      screen.getByText("Develops at", { exact: false }),
    ).toBeInTheDocument();
    // Her roll is asked with the ticket in the body, and never for her news.
    const body = JSON.parse(String((mine()[0][1] as RequestInit).body));
    expect(body).toEqual({
      qr_token: "qr-token-1",
      session_token: "s".repeat(32),
      statuses: true,
    });
  });

  it("★ a press is a shot in the queue at once, the count stepping down and the roll saying so", async () => {
    const onAdd = vi.fn();
    render(<Page onAdd={onAdd} />);
    await opened();
    await screen.findByText("Frame 7 of 24");
    await act(async () => press());
    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    const [files] = onAdd.mock.calls[0] as [File[], FileExtra | undefined];
    expect(files[0].type).toBe("image/jpeg");
    expect(files[0].name).toMatch(/^shot-\d{8}-\d{6}\.jpg$/);
    expect(screen.getByText("Shot 7 is on the roll.")).toBeInTheDocument();
    expect(screen.getByText("17")).toBeInTheDocument();
    expect(screen.getByText("Frame 8 of 24 · sending 1")).toBeInTheDocument();
  });

  it("★ ends the roll in its own words, with her shots one tap away and the shutter gone", async () => {
    rolls = [{ used: 24, cap: 24, taken: 24, ceiling: 72 }];
    render(<Page />);
    await screen.findByText("That’s your roll");
    expect(
      screen.getByText(/^24 shots, developing with everyone’s\. They’re back /),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Remove a shot to free its frame."),
    ).toBeInTheDocument();
    expect(
      (document.querySelector("[data-cam-shutter]") as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "See your shots" }));
    expect(
      await screen.findByRole("heading", { name: "Your shots" }),
    ).toBeInTheDocument();
  });

  it("★ takes one of hers back from her shots, and the frame comes back by the server's count", async () => {
    rolls = [
      { used: 24, cap: 24, taken: 24, ceiling: 72 },
      { used: 23, cap: 24, taken: 24, ceiling: 72 },
    ];
    ownItems = [
      {
        id: "m-sealed",
        status: "approved",
        sealed: true,
        picture: { type: "photo", at: 1, tile: "https://r2/x/preview.webp" },
      },
      { id: "m-in", status: "approved" },
    ];
    render(<Page />);
    await screen.findByText("That’s your roll");
    fireEvent.click(screen.getByRole("button", { name: "See your shots" }));
    await screen.findByRole("heading", { name: "Your shots" });
    // Only what the album cannot show is hers to take back here.
    expect(
      screen.getAllByRole("button", { name: "Remove this shot" }),
    ).toHaveLength(1);
    expect(screen.getByText("In the album")).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Remove this shot" }));
    });
    expect(removeOwnShot).toHaveBeenCalledWith({
      qrToken: "qr-token-1",
      sessionToken: "s".repeat(32),
      mediaId: "m-sealed",
    });
    await waitFor(() => expect(mine()).toHaveLength(2));
    fireEvent.click(screen.getByRole("button", { name: "Back to the camera" }));
    await screen.findByText("Frame 24 of 24");
    expect(screen.queryByText("That’s your roll")).toBeNull();
  });

  it("★ stops the shutter when the album itself refuses, in the server's own words", async () => {
    render(<Page />);
    await opened();
    await act(async () => press());
    // The page's own controls stand behind the camera's layer (hidden from the reader while it is open).
    fireEvent.click(
      screen.getByRole("button", { name: "Refuse them", hidden: true }),
    );
    expect(
      await screen.findByText("This event isn't accepting uploads right now."),
    ).toBeInTheDocument();
    expect(
      (document.querySelector("[data-cam-shutter]") as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("★ never reads her roll while a shot of hers is in the air (it would count it twice), and reads it once it lands", async () => {
    render(<Page />);
    await opened();
    await waitFor(() => expect(mine()).toHaveLength(1));
    await act(async () => press());
    // Closed and opened again while the shot goes: the opening's read waits for it.
    fireEvent.click(screen.getByRole("button", { name: "Back to the album" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Open the camera" }));
    });
    await opened();
    expect(mine()).toHaveLength(1);
    expect(screen.getByText("Frame 8 of 24 · sending 1")).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Land them", hidden: true }),
      );
    });
    await waitFor(() => expect(mine()).toHaveLength(2));
  });

  it("★ lets a shot the failure sheet dismissed leave her roll, never sending for ever", async () => {
    render(<Page />);
    await opened();
    await screen.findByText("Frame 7 of 24");
    await act(async () => press());
    fireEvent.click(
      screen.getByRole("button", { name: "Refuse them", hidden: true }),
    );
    await screen.findByText("This event isn't accepting uploads right now.");
    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss them", hidden: true }),
    );
    await waitFor(() =>
      expect(screen.getByText("Frame 7 of 24")).toBeInTheDocument(),
    );
    expect(screen.queryByText(/sending/)).toBeNull();
    expect(
      screen.queryByText("This event isn't accepting uploads right now."),
    ).toBeNull();
  });

  it("keeps no roll for the host: her shots counted as taken, never an end, her roll never asked", async () => {
    rolls = [{ used: 24, cap: 24, taken: 24, ceiling: 72 }];
    render(<Page isOwner />);
    await opened();
    expect(screen.getByText("No roll for the host")).toBeInTheDocument();
    expect(screen.getByText("taken")).toBeInTheDocument();
    await act(async () => press());
    expect(screen.getByText("Shot 1 taken.")).toBeInTheDocument();
    expect(screen.queryByText("That’s your roll")).toBeNull();
    expect(mine()).toHaveLength(0);
  });

  it("★ lets the phone's camera go when it closes, and when the page hides", async () => {
    const onOpenChange = vi.fn();
    render(<Page onOpenChange={onOpenChange} />);
    await opened();
    await act(async () => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => "hidden",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(media.stop).toHaveBeenCalled();
    media.stop.mockClear();
    await act(async () => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => "visible",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    fireEvent.click(screen.getByRole("button", { name: "Back to the album" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() => expect(media.stop).toHaveBeenCalled());
    expect(document.querySelector("[data-cam-screen]")).toBeNull();
  });
});
