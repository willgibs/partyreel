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
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GuestEvent } from "@/lib/db/queries/guest-events";
import type { RollAhead } from "@/lib/guest/camera/own-shots";
import type { FileExtra, QueueItem } from "@/lib/guest/use-upload-queue";

import { UPLOAD_WORDS } from "@/lib/upload/uploader";

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

/** The server's answer to her roll's read, per call (its ceiling the roll plus her 3 re-shoots). */
let rolls: {
  used: number;
  cap: number;
  taken: number;
  ceiling: number;
  period?: number;
}[] = [];
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
  onRetry,
  answerRetries = false,
  word,
  onAskWord,
  heldAtDoor,
  event: firstEvent = EVENT,
  ahead,
}: {
  /** Her roll as the album read it as it opened (`useRollAhead`): what a camera first opened in a dead zone counts from. */
  ahead?: RollAhead;
  /** The album as the page first reads it (a later "Set a develop time" moves it, as the album's sync does). */
  event?: GuestEvent;
  onAdd?: (files: File[], extra?: FileExtra) => void;
  initialQueue?: QueueItem[];
  onOpenChange?: (open: boolean) => void;
  isOwner?: boolean;
  onRetry?: (queueId: string) => void;
  /** The page's queue takes a Retry as the real one does: the item goes back to waiting, its refusal forgotten. */
  answerRetries?: boolean;
  /**
   * The album's own word on whether it takes uploads, as the page hears it from the album's sync (`uploadsWord`), from
   * this first value (the page's render); absent, the camera has no word to hear (the door's camera).
   */
  word?: boolean;
  /** The camera asked the album for its word afresh. */
  onAskWord?: () => void;
  /** Opened from the held door's wait: her shots wait in the page's queue for the let-in. */
  heldAtDoor?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [event, setEvent] = useState<GuestEvent>(firstEvent);
  const [queue, setQueue] = useState<QueueItem[]>(initialQueue);
  // Each word the album's sync carries is a word heard, the same one again included (`useLiveUploadsWord`).
  const [uploadsWord, setUploadsWord] = useState(
    word === undefined ? undefined : { open: word, heard: 0 },
  );
  const hear = (accepting: boolean) =>
    setUploadsWord((prev) =>
      prev ? { open: accepting, heard: prev.heard + 1 } : prev,
    );
  return (
    <>
      <button type="button" onClick={() => hear(false)}>
        The album says closed
      </button>
      <button type="button" onClick={() => hear(true)}>
        The album says open
      </button>
      <button
        type="button"
        onClick={() => setEvent((e) => ({ ...e, develops_at: AHEAD }))}
      >
        Set a develop time
      </button>
      <AlbumCamera
        uploadsWord={uploadsWord}
        onAskUploadsWord={onAskWord}
        open={open}
        openedAt={OPENED_AT}
        onOpenChange={(next) => {
          setOpen(next);
          onOpenChange?.(next);
        }}
        event={event}
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
        onRetry={(queueId) => {
          onRetry?.(queueId);
          if (!answerRetries) return;
          setQueue((prev) =>
            prev.map((it) =>
              it.id === queueId
                ? {
                    ...it,
                    status: "queued" as const,
                    error: undefined,
                    errorCode: undefined,
                    cause: undefined,
                  }
                : it,
            ),
          );
        }}
        isDemo={false}
        isOwner={isOwner}
        heldAtDoor={heldAtDoor}
        ahead={ahead}
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
      <button
        type="button"
        onClick={() =>
          setQueue((prev) =>
            prev.map((it) => ({
              ...it,
              status: "error" as const,
              error: "This event is private.",
              errorCode: "unauthorized",
            })),
          )
        }
      >
        Refuse them for good
      </button>
      <button
        type="button"
        onClick={() =>
          setQueue((prev) =>
            prev.map((it) => ({
              ...it,
              status: "error" as const,
              error: "This album is full right now.",
              errorCode: "cap_reached",
            })),
          )
        }
      >
        Refuse them as full
      </button>
      <button
        type="button"
        onClick={() =>
          setQueue((prev) =>
            prev.map((it) => ({
              ...it,
              status: "uploading" as const,
              progress: 10,
            })),
          )
        }
      >
        Put them in the air
      </button>
      <button
        type="button"
        onClick={() =>
          setQueue((prev) =>
            prev.map((it) => ({
              ...it,
              status: "error" as const,
              // An answer that was an error: not the line's fault (no cause), and no code the camera reads as a refusal.
              error: UPLOAD_WORDS.refused,
              errorCode: "storage_error",
              cause: undefined,
            })),
          )
        }
      >
        Fail them
      </button>
      <button
        type="button"
        onClick={() =>
          setQueue((prev) =>
            prev.map((it) => ({
              ...it,
              // The line dropped, as the queue holds it now (no-signal r1, `drop=standby`): on its way, standing by for the
              // line, its bar at nothing and its cause kept; never an error.
              status: "queued" as const,
              progress: 0,
              error: undefined,
              errorCode: undefined,
              cause: "dropped" as const,
            })),
          )
        }
      >
        Lose the line
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
  rolls = [{ used: 6, cap: 24, taken: 6, ceiling: 27 }];
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
    // The develop is six hours ahead: today's or tomorrow's by the hour the test runs, and the camera says which
    // (`developsWhen`: the calendar's days, red-team 46's NIT), so only its shape is pinned here.
    expect(screen.getByText(/^Develops (tomorrow )?at /)).toBeInTheDocument();
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
    expect(screen.getByText("Shot 7 taken.")).toBeInTheDocument();
    expect(screen.getByText("17")).toBeInTheDocument();
    expect(screen.getByText("Frame 8 of 24 · sending 1")).toBeInTheDocument();
  });

  /* ★ THE HELD DOOR HOLDS HER SHOTS (crumbs-85): opened from the held door's wait, the camera said "Every shot goes
     straight in" and drew its shots sending while they waited in the page's queue for the let-in. */
  it("★ at the held door says her shots go in once she is let in, and draws none of them sending", async () => {
    render(<Page heldAtDoor />);
    await opened();
    expect(
      screen.getByText("They go in once you’re let in"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Every shot goes straight in")).toBeNull();
    expect(screen.queryByText(/^Develops/)).toBeNull();
    await screen.findByText("Frame 7 of 24");
    await act(async () => press());
    // Taken, and waiting: no "sending" in the caption, no sending dot on the reel.
    expect(await screen.findByText("Frame 8 of 24")).toBeInTheDocument();
    expect(screen.queryByText(/sending/)).toBeNull();
    expect(document.querySelector("[data-sending]")).toBeNull();
  });

  // ★ RESHAPED ON PURPOSE (camera-wiring, guest-moments r1's `limit=three`; scar kept: the roll's end in its own words,
  // her shots one tap away, the shutter gone; reason dropped: the way on said "Remove a shot to free its frame." with no
  // count, under a ceiling of three rolls' worth). It says how many re-shoots are left.
  it("★ ends the roll in its own words, with her shots one tap away and the shutter gone", async () => {
    rolls = [{ used: 24, cap: 24, taken: 24, ceiling: 27 }];
    render(<Page />);
    await screen.findByText("That’s your roll");
    expect(
      screen.getByText(/^24 shots, developing with everyone’s\. They’re back /),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Take a shot back to free its frame: 3 re\u2011shoots left.",
      ),
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
      { used: 24, cap: 24, taken: 24, ceiling: 27 },
      { used: 23, cap: 24, taken: 24, ceiling: 27 },
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

  /* ★ BACK PEELS ONE LAYER A PRESS, AS ESCAPE DOES (back-layers; from `disposable-camera`): only the camera held a
     history entry, so the phone's Back from her shots closed the whole camera. Her shots hold one of their own. */
  it("★ the phone's Back from her shots goes back to the camera, and the next Back closes the camera", async () => {
    // A Back the test before left on its way lands first (`ui/popup-back.ts`: a push waits for it).
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 60));
    });
    rolls = [{ used: 24, cap: 24, taken: 24, ceiling: 27 }];
    const onOpenChange = vi.fn();
    render(<Page onOpenChange={onOpenChange} />);
    await screen.findByText("That’s your roll");
    const atCamera = window.history.length;
    fireEvent.click(screen.getByRole("button", { name: "See your shots" }));
    await screen.findByRole("heading", { name: "Your shots" });
    expect(window.history.length).toBe(atCamera + 1);

    await act(async () => {
      window.history.back();
      await new Promise((resolve) => setTimeout(resolve, 60));
    });
    // The old code closed the camera here, her shots with it.
    expect(screen.queryByRole("heading", { name: "Your shots" })).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(document.querySelector("[data-album-camera]")).not.toBeNull();

    await act(async () => {
      window.history.back();
      await new Promise((resolve) => setTimeout(resolve, 60));
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(document.querySelector("[data-album-camera]")).toBeNull();
  });

  it("her shots' own Back arrow takes their entry back: the camera stands on its own, and one Back closes it", async () => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 60));
    });
    rolls = [{ used: 24, cap: 24, taken: 24, ceiling: 27 }];
    const onOpenChange = vi.fn();
    render(<Page onOpenChange={onOpenChange} />);
    await screen.findByText("That’s your roll");
    const marker = () =>
      (window.history.state as Record<string, unknown> | null)?.prPopup;
    const camera = marker();
    expect(camera).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "See your shots" }));
    await screen.findByRole("heading", { name: "Your shots" });
    expect(marker()).not.toBe(camera);
    fireEvent.click(screen.getByRole("button", { name: "Back to the camera" }));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 60));
    });
    expect(screen.queryByRole("heading", { name: "Your shots" })).toBeNull();
    expect(marker()).toBe(camera);
    expect(onOpenChange).not.toHaveBeenCalled();

    await act(async () => {
      window.history.back();
      await new Promise((resolve) => setTimeout(resolve, 60));
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
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

  /* ★ RED-TEAM 44'S NIT: the live region said "Shot 6 is on the roll." for a shot the server then refused (the album
     closed to uploads), both lines inside a second. The press says it was taken; the refusal says why, and nothing the
     camera said promised the roll a shot it never counted. */
  it("★ never says a shot is on the roll before the server has it: a refused one was taken, and the refusal says why", async () => {
    render(<Page />);
    await opened();
    const hint = () => document.querySelector("[data-cam-hint]");
    const said: string[] = [];
    const listen = new MutationObserver(() =>
      said.push(hint()?.textContent ?? ""),
    );
    listen.observe(hint() as Node, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    await act(async () => press());
    expect(hint()).toHaveTextContent("Shot 7 taken.");
    fireEvent.click(
      screen.getByRole("button", { name: "Refuse them", hidden: true }),
    );
    expect(
      await screen.findByText("This event isn't accepting uploads right now."),
    ).toBeInTheDocument();
    listen.disconnect();
    expect(said.length).toBeGreaterThan(0);
    expect(said.some((line) => /on the roll/.test(line))).toBe(false);
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

  // ★ RED-TEAM 53's NIT (crumbs-65): a shot cut mid-PUT said "1 shot didn’t send." and never why, so a stadium's dropped
  // signal read as a broken camera. RESHAPED (no-signal-wiring, Will's `roll=taken`): this pinned the uploader's drop
  // sentence beside a Retry, over a shot the queue failed. The reason that expired is the failure: the queue holds a
  // dropped shot standing by for the line now, so the camera says that, with no press (a Retry in a dead zone could
  // only fail the same way; the line's return sends it). The scars kept: the line, never a count, says it was the
  // connection; the queue's `cause` says so, never the words; the press's "Shot 7 taken." stands first for a moment
  // (`SAID_MS`); and an answered error is still counted, with its Retry.
  it("★ says a shot waits for the connection when the queue holds it standing by, with no press; an answered error is only counted", async () => {
    render(<Page />);
    await opened();
    await screen.findByText("Frame 7 of 24");
    await act(async () => press());
    fireEvent.click(
      screen.getByRole("button", { name: "Lose the line", hidden: true }),
    );
    const hint = document.querySelector("[data-cam-hint]") as HTMLElement;
    await waitFor(
      () =>
        expect(hint).toHaveTextContent(
          "No connection: your shot waits, and goes in once it’s back.",
        ),
      { timeout: 4000 },
    );
    expect(hint).not.toHaveTextContent("didn’t send");
    expect(
      screen.queryByRole("button", { name: "Retry", hidden: true }),
    ).toBeNull();

    // The same shot, failed by an answer that was an error: not the line's, so it is counted, as it always was.
    fireEvent.click(
      screen.getByRole("button", { name: "Fail them", hidden: true }),
    );
    await waitFor(() => expect(hint).toHaveTextContent("1 shot didn’t send."));
    expect(hint).not.toHaveTextContent("No connection");
    expect(
      screen.getByRole("button", { name: "Retry", hidden: true }),
    ).toBeInTheDocument();
  });

  /* ★ LIKE FILM (no-signal r1, Will's one-way door `roll=taken`): every press spends a frame at once, sent or not. A shot
     the line could not carry used to leave the count and the reel (`pendingSince` dropped a failed shot), so the camera
     said "4 left" through a dead zone and the server refused the shots past the roll when the line came back. */
  it("★ a shot waiting for the line keeps its frame spent: the count stays down, its frame half-lit and still, the caption says it waits", async () => {
    render(<Page />);
    await opened();
    await screen.findByText("Frame 7 of 24");
    await act(async () => press());
    await screen.findByText("Frame 8 of 24 · sending 1");
    fireEvent.click(
      screen.getByRole("button", { name: "Lose the line", hidden: true }),
    );
    await screen.findByText("Frame 8 of 24 · 1 waiting");
    expect(screen.getByText("17")).toBeInTheDocument();
    // On the reel: spent, and waiting (half-lit, `camera-roll.css`), never the pulsing sending dot.
    expect(document.querySelectorAll(".cam-cell[data-waiting]")).toHaveLength(
      1,
    );
    expect(document.querySelector(".cam-cell[data-sending]")).toBeNull();
    // Nothing is asked of her roll while it waits: it is not yet in any count of the server's.
    expect(mine()).toHaveLength(1);
  });

  it("★ the roll ends at 0 with its waiting shots said first, and none is refused for the roll when they land", async () => {
    rolls = [{ used: 22, cap: 24, taken: 22, ceiling: 27 }];
    render(<Page />);
    await opened();
    await screen.findByText("Frame 23 of 24");
    await act(async () => press());
    await act(async () => press());
    fireEvent.click(
      screen.getByRole("button", { name: "Lose the line", hidden: true }),
    );
    await screen.findByText("That’s your roll");
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(
      screen.getByText(
        /^24 shots; 2 wait for your connection, then develop with everyone’s\. They’re back /,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("24 of 24 · 2 waiting")).toBeInTheDocument();
    // The line is back and both land: none refused, and the roll's end says they are all in, on the count she shot by.
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Land them", hidden: true }),
      );
    });
    expect(
      await screen.findByText(
        /^24 shots, developing with everyone’s\. They’re back /,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("24 of 24")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("★ reads her roll beside a shot that waits for the line, counts it outside that read until it lands, then reads again", async () => {
    rolls = [
      { used: 6, cap: 24, taken: 6, ceiling: 27 },
      { used: 6, cap: 24, taken: 6, ceiling: 27 },
      { used: 7, cap: 24, taken: 7, ceiling: 27 },
    ];
    render(<Page />);
    await opened();
    await screen.findByText("Frame 7 of 24");
    await act(async () => press());
    fireEvent.click(
      screen.getByRole("button", { name: "Lose the line", hidden: true }),
    );
    await screen.findByText("Frame 8 of 24 · 1 waiting");
    // Closed and opened again in the dead zone: the shot that waits is no shot in the air, so her roll is read beside it.
    fireEvent.click(screen.getByRole("button", { name: "Back to the album" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Open the camera" }));
    });
    // Open again, and its line still says what waits.
    await screen.findByText(
      "No connection: your shot waits, and goes in once it’s back.",
    );
    await waitFor(() => expect(mine()).toHaveLength(2));
    // The read could not hold it (it never landed), so it is counted outside it: still 17 left.
    expect(screen.getByText("17")).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Land them", hidden: true }),
      );
    });
    // Landed, it leaves that count, and her roll is read again in the server's own: 7 of 24, 17 left.
    await waitFor(() => expect(mine()).toHaveLength(3));
    expect(screen.getByText("17")).toBeInTheDocument();
  });

  it("asks her roll again when the line is back if the read could not reach the server", async () => {
    let down = true;
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input) === "/api/guests/mine") {
        if (down) throw new TypeError("Failed to fetch");
        return Response.json({
          ok: true,
          items: [],
          roll: { used: 20, cap: 24, taken: 20, ceiling: 27 },
        });
      }
      throw new Error(`unexpected fetch ${String(input)}`);
    }) as typeof fetch;
    render(<Page />);
    await opened();
    await waitFor(() => expect(mine()).toHaveLength(1));
    // No answer: the roll's own size until it is known.
    expect(screen.getByText("Frame 1 of 24")).toBeInTheDocument();
    down = false;
    await act(async () => {
      window.dispatchEvent(new Event("online"));
    });
    await waitFor(() => expect(mine()).toHaveLength(2));
    expect(await screen.findByText("Frame 21 of 24")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("★ counts her shots on their way that it did not take: the door's camera's, or what her phone kept and sent again", async () => {
    // A shot of hers already in the page's queue as the camera opens (`takenAt` says it is a camera shot), not yet in
    // any read of her roll: its frame is spent here too.
    const kept: QueueItem = {
      id: "kept-1",
      file: new File([new Uint8Array([1])], "shot-20261007-231500.jpg", {
        type: "image/jpeg",
      }),
      kind: "photo",
      status: "queued",
      progress: 0,
      cause: "dropped",
      takenAt: OPENED_AT - 60_000,
    };
    render(<Page initialQueue={[kept]} />);
    await opened();
    // Her roll is 6 of 24 on the server, so 18 left; the kept shot spends one more.
    await waitFor(() => expect(screen.getByText("17")).toBeInTheDocument());
  });

  /* ★ A CAMERA FIRST OPENED IN A DEAD ZONE (no-signal-wiring's own red-team): it read her roll only as it opened, so with
     no line it counted from the roll's size, and a phone that shot 20 of 24 earlier in the night offered 24 again: every
     shot past her real roll was refused as it landed, the one refusal `roll=taken` rules out. The album reads her roll as
     it opens (`useRollAhead`), and the camera counts from that until its own read answers. */
  const offline = () => {
    global.fetch = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }) as typeof fetch;
  };
  const aheadOf = (used: number, landed: string[] = []): RollAhead => ({
    read: {
      roll: { used, cap: 24, taken: used, ceiling: 27 },
      shots: [],
    },
    from: OPENED_AT - 60_000,
    landed: new Set(landed),
  });
  /** What her phone kept from an earlier page, sent again as the page opened, and landed. */
  const keptLanded = (): QueueItem => ({
    id: "kept-1",
    file: new File([new Uint8Array([1])], "shot-20261007-231500.jpg", {
      type: "image/jpeg",
    }),
    kind: "photo",
    status: "done",
    progress: 100,
    mediaId: "m-kept-1",
    mediaStatus: "sealed",
    takenAt: OPENED_AT - 120_000,
  });

  it("★ first opened in a dead zone, it counts from the album's read as it opened, never from the roll's size", async () => {
    offline();
    render(<Page ahead={aheadOf(20)} />);
    await opened();
    // Its own read could not reach the server: the album's stands, 20 of 24 spent earlier in the night.
    await waitFor(() => expect(mine()).toHaveLength(1));
    expect(screen.getByText("Frame 21 of 24")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    await act(async () => press());
    fireEvent.click(
      screen.getByRole("button", { name: "Lose the line", hidden: true }),
    );
    await screen.findByText("Frame 22 of 24 · 1 waiting");
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("★ counts a shot of hers that landed after a read on top of it, until a later read holds it", async () => {
    offline();
    render(<Page ahead={aheadOf(6)} initialQueue={[keptLanded()]} />);
    await opened();
    await waitFor(() => expect(mine()).toHaveLength(1));
    // 6 in the read, and the landed shot no read holds yet: 17 left.
    expect(screen.getByText("Frame 8 of 24")).toBeInTheDocument();
    expect(screen.getByText("17")).toBeInTheDocument();
    // The line is back and the camera reads for itself (a fresh stand-in, so its one call is this read): the server
    // holds the shot now, and it is never counted twice.
    global.fetch = vi.fn(async () =>
      Response.json({
        ok: true,
        items: [],
        roll: { used: 7, cap: 24, taken: 7, ceiling: 27 },
      }),
    ) as typeof fetch;
    await act(async () => {
      window.dispatchEvent(new Event("online"));
    });
    await waitFor(() => expect(mine()).toHaveLength(1));
    expect(await screen.findByText("Frame 8 of 24")).toBeInTheDocument();
    expect(screen.getByText("17")).toBeInTheDocument();
  });

  it("a shot that had landed as the read began is in its count: never counted twice", async () => {
    offline();
    render(
      <Page ahead={aheadOf(7, ["kept-1"])} initialQueue={[keptLanded()]} />,
    );
    await opened();
    await waitFor(() => expect(mine()).toHaveLength(1));
    expect(screen.getByText("Frame 8 of 24")).toBeInTheDocument();
    expect(screen.getByText("17")).toBeInTheDocument();
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
    rolls = [{ used: 24, cap: 24, taken: 24, ceiling: 27 }];
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

/**
 * ★ HER 3 RE-SHOOTS, AND THE REEL'S NEWEST FRAME AS A DOOR OF ITS OWN (guest-moments r1's `limit=three` and
 * `where=reel`): a press on the newest frame opens that shot with Take it back and Keep it, Your shots keeps its X, both
 * free a frame and spend a re-shoot, counted where she takes one back, and the roll's end says when they are spent.
 */
describe("the album's camera, her re-shoots and the reel's newest frame", () => {
  const newest = () =>
    screen.queryByRole("button", { name: /^Your newest shot/ });
  const shutter = () =>
    document.querySelector("[data-cam-shutter]") as HTMLButtonElement;
  /** A shot taken and landed sealed, as the queue tells it (`m-q-0`). */
  async function shootAndLand() {
    await screen.findByText("Frame 7 of 24");
    await act(async () => press());
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Land them", hidden: true }),
      );
    });
  }

  it("★ a press on the newest frame opens her shot with Take it back and Keep it; Keep it takes nothing back", async () => {
    render(<Page />);
    await opened();
    await shootAndLand();
    fireEvent.click(newest()!);
    const sheet = await screen.findByRole("group", {
      name: "Your newest shot",
    });
    expect(sheet).toHaveAttribute("data-cam-take-back", "ready");
    expect(
      screen.getByText(
        "Taking it back frees its frame: 1 of your 3 re\u2011shoots.",
      ),
    ).toBeInTheDocument();
    // The keys wait on her, and the shutter waits with them; the safe key holds the focus.
    expect(screen.getByRole("button", { name: "Keep it" })).toHaveFocus();
    expect(shutter().disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Keep it" }));
    expect(
      screen.queryByRole("group", { name: "Your newest shot" }),
    ).toBeNull();
    expect(removeOwnShot).not.toHaveBeenCalled();
    expect(shutter().disabled).toBe(false);
  });

  it("★ Take it back frees its frame and spends one of her 3, said under the shutter, through the one removal", async () => {
    rolls = [
      { used: 6, cap: 24, taken: 6, ceiling: 27 },
      { used: 6, cap: 24, taken: 7, ceiling: 27 },
    ];
    render(<Page />);
    await opened();
    await shootAndLand();
    expect(screen.getByText("17")).toBeInTheDocument();
    fireEvent.click(newest()!);
    await act(async () => {
      fireEvent.click(
        await screen.findByRole("button", { name: "Take it back" }),
      );
    });
    expect(removeOwnShot).toHaveBeenCalledWith({
      qrToken: "qr-token-1",
      sessionToken: "s".repeat(32),
      mediaId: "m-q-0",
    });
    expect(
      await screen.findByText("Taken back. 2 re\u2011shoots left."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "Your newest shot" }),
    ).toBeNull();
    // The frame is hers again, by the server's count read after the removal.
    await waitFor(() => expect(mine()).toHaveLength(2));
    expect(screen.getByText("18")).toBeInTheDocument();
    // Her list's head counts what is left.
    fireEvent.click(screen.getByRole("button", { name: /^Your shots, / }));
    expect(
      await screen.findByText("6 of 24 · 2 re\u2011shoots left"),
    ).toBeInTheDocument();
  });

  it("a shot still on its way opens its sheet at once, and can be taken back once it lands", async () => {
    render(<Page />);
    await opened();
    await screen.findByText("Frame 7 of 24");
    await act(async () => press());
    fireEvent.click(newest()!);
    expect(
      await screen.findByText("Sending… You can take it back once it lands."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Take it back" })).toBeDisabled();
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Land them", hidden: true }),
      );
    });
    expect(
      screen.getByRole("button", { name: "Take it back" }),
    ).not.toBeDisabled();
  });

  it("Escape keeps the shot and closes the sheet, before it would close her shots or the camera", async () => {
    const onOpenChange = vi.fn();
    render(<Page onOpenChange={onOpenChange} />);
    await opened();
    await shootAndLand();
    fireEvent.click(newest()!);
    await screen.findByRole("group", { name: "Your newest shot" });
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: "Escape",
    });
    expect(
      screen.queryByRole("group", { name: "Your newest shot" }),
    ).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(removeOwnShot).not.toHaveBeenCalled();
  });

  it("the phone's Back keeps the shot and closes the sheet, and the next Back closes the camera", async () => {
    // A Back the test before left on its way lands first (`ui/popup-back.ts`: a push waits for it).
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 60));
    });
    const onOpenChange = vi.fn();
    render(<Page onOpenChange={onOpenChange} />);
    await opened();
    await shootAndLand();
    fireEvent.click(newest()!);
    await screen.findByRole("group", { name: "Your newest shot" });
    await act(async () => {
      window.history.back();
      await new Promise((resolve) => setTimeout(resolve, 60));
    });
    expect(
      screen.queryByRole("group", { name: "Your newest shot" }),
    ).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(removeOwnShot).not.toHaveBeenCalled();
    await act(async () => {
      window.history.back();
      await new Promise((resolve) => setTimeout(resolve, 60));
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("on an album that shows each shot, the reel stays one door: a shot in the album is taken back from the album", async () => {
    render(
      <Page event={{ ...EVENT, develops_at: null } as unknown as GuestEvent} />,
    );
    await opened();
    await screen.findByText("Frame 7 of 24");
    await act(async () => press());
    expect(newest()).toBeNull();
  });

  it("★ the roll's end at 27 of 24 says her re-shoots are used, and promises no frame", async () => {
    rolls = [{ used: 24, cap: 24, taken: 27, ceiling: 27 }];
    ownItems = [
      {
        id: "m-sealed",
        status: "approved",
        sealed: true,
        picture: { type: "photo", at: 1, tile: "https://r2/x/preview.webp" },
      },
    ];
    render(<Page />);
    await screen.findByText("That’s your roll");
    expect(
      screen.getByText(
        /^24 shots, developing with everyone’s\. They’re back .+\. Your 3 re\u2011shoots are used\.$/,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/free its frame/)).toBeNull();
    // Her list keeps its X, and says it frees no frame now.
    fireEvent.click(screen.getByRole("button", { name: "See your shots" }));
    expect(
      await screen.findByText("24 of 24 · No re\u2011shoots left"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove this shot" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your 3 re\u2011shoots are used, so removing a shot won’t free its frame.",
      ),
    ).toBeInTheDocument();
  });

  it("the ceiling ends a roll with a frame free in the same words, and counts none left", async () => {
    rolls = [{ used: 23, cap: 24, taken: 27, ceiling: 27 }];
    render(<Page />);
    await screen.findByText("That’s your roll");
    expect(
      screen.getByText(
        /^23 shots, developing .+ Your 3 re\u2011shoots are used\.$/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("23 of 24")).toBeInTheDocument();
    expect(document.querySelector("[data-cam-count] p")?.textContent).toBe("0");
  });
});

/**
 * ★ A FRESH ROLL, SAID ONCE (host-moments r1's `fresh-roll=panel`): her period against the one this device last saw her
 * hold shots on. A roll that started again is said over the finder, the shutter waiting for Start shooting, and never
 * twice; her first roll here is never called fresh.
 */
describe("the album's camera, on a fresh roll", () => {
  const A = 1_791_335_428_131;
  const B = A + 3_600_000;
  const panel = () => screen.queryByRole("group", { name: "A fresh roll" });
  const shutter = () =>
    document.querySelector("[data-cam-shutter]") as HTMLButtonElement;

  it("★ says it once over the finder, why and when, and the shutter waits for Start shooting", async () => {
    localStorage.setItem("pr_roll:qr-token-1", String(A));
    rolls = [{ used: 0, cap: 24, taken: 0, ceiling: 27, period: B }];
    render(<Page />);
    // The panel stands before the shutter's own line: it waits for her.
    await waitFor(() => expect(panel()).not.toBeNull());
    expect(screen.queryByText("Tap for a photo.")).toBeNull();
    expect(
      screen.getByText(
        /^The host set a develop time, so everyone starts again with 24 shots\. Everything develops together /,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start shooting" }),
    ).toHaveFocus();
    expect(shutter().disabled).toBe(true);
    // Spent as it is said: the device keeps the new period.
    expect(localStorage.getItem("pr_roll:qr-token-1")).toBe(String(B));
    fireEvent.click(screen.getByRole("button", { name: "Start shooting" }));
    expect(panel()).toBeNull();
    await opened();
    expect(shutter().disabled).toBe(false);
    // Closed and opened again: never twice.
    fireEvent.click(screen.getByRole("button", { name: "Back to the album" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Open the camera" }));
    });
    await opened();
    await waitFor(() => expect(mine()).toHaveLength(2));
    expect(panel()).toBeNull();
  });

  it("never calls her first roll here fresh, and keeps the period once she holds shots on it", async () => {
    rolls = [{ used: 0, cap: 24, taken: 0, ceiling: 27, period: A }];
    render(<Page />);
    await opened();
    await waitFor(() => expect(mine()).toHaveLength(1));
    expect(panel()).toBeNull();
    expect(localStorage.getItem("pr_roll:qr-token-1")).toBeNull();
    await screen.findByText("Frame 1 of 24");
    await act(async () => press());
    await waitFor(() =>
      expect(localStorage.getItem("pr_roll:qr-token-1")).toBe(String(A)),
    );
  });

  it("★ a develop time added while she shoots reads her roll again, and its fresh roll is said then", async () => {
    localStorage.setItem("pr_roll:qr-token-1", String(A));
    rolls = [
      { used: 5, cap: 24, taken: 5, ceiling: 27, period: A },
      { used: 0, cap: 24, taken: 0, ceiling: 27, period: B },
    ];
    render(
      <Page event={{ ...EVENT, develops_at: null } as unknown as GuestEvent} />,
    );
    await opened();
    await screen.findByText("Frame 6 of 24");
    expect(panel()).toBeNull();
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", {
          name: "Set a develop time",
          hidden: true,
        }),
      );
    });
    await waitFor(() => expect(mine()).toHaveLength(2));
    await waitFor(() => expect(panel()).not.toBeNull());
    expect(screen.getByText("Frame 1 of 24")).toBeInTheDocument();
  });

  it("the host's own camera keeps no roll and meets no fresh roll", async () => {
    localStorage.setItem("pr_roll:qr-token-1", String(A));
    rolls = [{ used: 0, cap: 24, taken: 0, ceiling: 27, period: B }];
    render(<Page isOwner />);
    await opened();
    expect(panel()).toBeNull();
    expect(mine()).toHaveLength(0);
  });
});

/**
 * ★ THE CAMERA HEARS THE HOST REOPEN (crumbs-76; ROADMAP: "the camera keeps its closed-uploads banner and disabled
 * shutter after the host reopens uploads, until she closes it"). Nothing tells the page when the host's switch moves (it
 * reads it at render, and the album's sync carries no word of it), so a camera that stopped for a refusal the host can
 * lift (closed, full) asks the album again by itself, calmly, and its banner and its stopped shutter go with the
 * refusal once the album says yes. Pinned as a guest sees it: the banner stays through each ask (no flicker), the next
 * ask waits longer, a hidden page asks nothing, and a refusal that is not the host's to lift is never asked again.
 */
describe("the album's camera, over an album that refuses for a reason its host can lift", () => {
  const CLOSED = "This event isn't accepting uploads right now.";
  const shutter = () =>
    document.querySelector("[data-cam-shutter]") as HTMLButtonElement;

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
  });

  /** The camera open over her first shot, the album refusing it, and the clock the camera's asks run on held still. */
  async function refused(button = "Refuse them") {
    const onRetry = vi.fn();
    render(<Page answerRetries onRetry={onRetry} />);
    await opened();
    await screen.findByText("Frame 7 of 24");
    await act(async () => press());
    vi.useFakeTimers({
      toFake: [
        "setTimeout",
        "clearTimeout",
        "setInterval",
        "clearInterval",
        "Date",
      ],
    });
    fireEvent.click(screen.getByRole("button", { name: button, hidden: true }));
    return onRetry;
  }
  const wait = (ms: number) =>
    act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });

  it("★ asks again after ten seconds, keeps its banner and stopped shutter through the ask, and hears the album say yes", async () => {
    const onRetry = await refused();
    expect(screen.getByText(CLOSED)).toBeInTheDocument();
    expect(shutter().disabled).toBe(true);
    await wait(9_000);
    expect(onRetry).not.toHaveBeenCalled();

    await wait(1_000);
    expect(onRetry).toHaveBeenCalledTimes(1);
    // The ask is out, the album has not answered: the camera has not moved (no banner gone, no shutter back, no
    // "sending" in the caption).
    expect(screen.getByText(CLOSED)).toBeInTheDocument();
    expect(shutter().disabled).toBe(true);
    expect(screen.queryByText(/sending/)).toBeNull();

    // The host reopened: the album says yes the moment the file goes up (a refusal comes before a byte moves), and the
    // refusal's banner and stopped shutter go with it, before the shot has landed.
    fireEvent.click(
      screen.getByRole("button", { name: "Put them in the air", hidden: true }),
    );
    await wait(0);
    expect(screen.queryByText(CLOSED)).toBeNull();
    expect(shutter().disabled).toBe(false);
    expect(screen.getByText(/sending 1/)).toBeInTheDocument();

    // And it lands.
    fireEvent.click(
      screen.getByRole("button", { name: "Land them", hidden: true }),
    );
    await wait(0);
    expect(screen.queryByText(CLOSED)).toBeNull();
    expect(shutter().disabled).toBe(false);
    // Nothing left to ask: the clock stands down.
    await wait(120_000);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("★ asks again calmer while the album still says no: ten seconds, then twenty, then forty, then every minute", async () => {
    const onRetry = await refused();
    const refuseAgain = async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Refuse them", hidden: true }),
      );
      await wait(0);
    };
    await wait(10_000);
    expect(onRetry).toHaveBeenCalledTimes(1);
    await refuseAgain();
    // The banner stood the whole time.
    expect(screen.getByText(CLOSED)).toBeInTheDocument();

    await wait(19_000);
    expect(onRetry).toHaveBeenCalledTimes(1);
    await wait(1_000);
    expect(onRetry).toHaveBeenCalledTimes(2);
    await refuseAgain();

    await wait(39_000);
    expect(onRetry).toHaveBeenCalledTimes(2);
    await wait(1_000);
    expect(onRetry).toHaveBeenCalledTimes(3);
    await refuseAgain();

    // A minute is as slow as it gets.
    await wait(60_000);
    expect(onRetry).toHaveBeenCalledTimes(4);
    await refuseAgain();
    await wait(60_000);
    expect(onRetry).toHaveBeenCalledTimes(5);
    expect(shutter().disabled).toBe(true);
  });

  it("★ asks nothing while the page is hidden, and asks at once when it comes back", async () => {
    const onRetry = await refused();
    await act(async () => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => "hidden",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await wait(60_000);
    expect(onRetry).not.toHaveBeenCalled();

    await act(async () => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => "visible",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("★ never asks closer to the last ask than the cadence's first step, however often the page comes back", async () => {
    const onRetry = await refused();
    const toggle = async (visible: boolean) =>
      act(async () => {
        Object.defineProperty(document, "visibilityState", {
          configurable: true,
          get: () => (visible ? "visible" : "hidden"),
        });
        document.dispatchEvent(new Event("visibilitychange"));
      });
    // Flicking between apps over a closed album: each return is not a presign of its own.
    await wait(1_000);
    await toggle(false);
    await toggle(true);
    await wait(2_000);
    await toggle(false);
    await toggle(true);
    expect(onRetry).not.toHaveBeenCalled();
    // Past the first step it asks at once, and the calm cadence starts over from there.
    await wait(8_000);
    expect(onRetry).toHaveBeenCalledTimes(1);
    await toggle(false);
    await toggle(true);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("asks again over a full album too: it is the host's to make room, and the album may say yes later", async () => {
    const onRetry = await refused("Refuse them as full");
    expect(
      screen.getByText("This album is full right now."),
    ).toBeInTheDocument();
    await wait(10_000);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(shutter().disabled).toBe(true);
  });

  it("★ never asks again over a refusal that is not the host's to lift (a lock, a gone event, a ticket that is not hers)", async () => {
    const onRetry = await refused("Refuse them for good");
    expect(screen.getByText("This event is private.")).toBeInTheDocument();
    await wait(300_000);
    expect(onRetry).not.toHaveBeenCalled();
    expect(shutter().disabled).toBe(true);
  });

  it("asks nothing once she has closed the camera (the failure sheet is hers then)", async () => {
    const onRetry = await refused();
    fireEvent.click(screen.getByRole("button", { name: "Back to the album" }));
    await wait(300_000);
    expect(onRetry).not.toHaveBeenCalled();
  });
});

/**
 * ★ THE CAMERA HEARS THE ALBUM'S OWN WORD (guest-requests). Where the page hears the album's switch from its sync
 * (`uploadsWord`: the sync carries `accepting`, its validator hashing it while closed, and the page counts each word it
 * hears), a closed album is never asked again by the camera itself: no presign at ten seconds, twenty, forty or each
 * minute, none at the page's return and none when the connection comes back. It asks once, on the first word heard after
 * the refusal that says open, and its banner and stopped shutter go with the refusal as the album says yes. A refusal
 * over a word that said open asks the album for its word afresh, since that word's validator says open too and a host
 * who reopened before the next poll would be answered 304. A full album is not the switch's to lift, so it keeps the
 * calm cadence, and a camera with no word to hear (the door's) keeps it for both.
 */
describe("the album's camera, hearing the album's word on uploads", () => {
  const CLOSED = "This event isn't accepting uploads right now.";
  const shutter = () =>
    document.querySelector("[data-cam-shutter]") as HTMLButtonElement;

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
  });

  /** The camera open over her first shot with the album's word beside it (the page's render: open), the album refusing it. */
  async function refused(button = "Refuse them") {
    const onRetry = vi.fn();
    const onAskWord = vi.fn();
    render(<Page answerRetries onRetry={onRetry} word onAskWord={onAskWord} />);
    await opened();
    await screen.findByText("Frame 7 of 24");
    await act(async () => press());
    vi.useFakeTimers({
      toFake: [
        "setTimeout",
        "clearTimeout",
        "setInterval",
        "clearInterval",
        "Date",
      ],
    });
    fireEvent.click(screen.getByRole("button", { name: button, hidden: true }));
    await wait(0);
    return { onRetry, onAskWord };
  }
  const wait = (ms: number) =>
    act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  const says = async (open: boolean) => {
    fireEvent.click(
      screen.getByRole("button", {
        name: open ? "The album says open" : "The album says closed",
        hidden: true,
      }),
    );
    await wait(0);
  };
  const toggle = async (visible: boolean) =>
    act(async () => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => (visible ? "visible" : "hidden"),
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

  it("★ never asks a closed album again by itself: not on the cadence, not at the page's return, not when the line comes back", async () => {
    const { onRetry } = await refused();
    await says(false);
    await wait(10_000);
    await wait(300_000);
    await toggle(false);
    await toggle(true);
    await act(async () => {
      window.dispatchEvent(new Event("online"));
    });
    expect(onRetry).not.toHaveBeenCalled();
    // The banner and the stopped shutter stand the whole time: the album has said nothing new.
    expect(screen.getByText(CLOSED)).toBeInTheDocument();
    expect(shutter().disabled).toBe(true);
  });

  it("★ asks once, on the album's word that it is open, and the banner goes as the album says yes", async () => {
    const { onRetry } = await refused();
    await says(false);
    await wait(120_000);
    expect(onRetry).not.toHaveBeenCalled();

    await says(true);
    expect(onRetry).toHaveBeenCalledTimes(1);
    // Asked, not answered: the camera has not moved (no banner gone, no shutter back) until the album says yes.
    expect(screen.getByText(CLOSED)).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Put them in the air", hidden: true }),
    );
    await wait(0);
    expect(screen.queryByText(CLOSED)).toBeNull();
    expect(shutter().disabled).toBe(false);
    fireEvent.click(
      screen.getByRole("button", { name: "Land them", hidden: true }),
    );
    await wait(300_000);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("★ a refusal over a word that said open asks the album afresh, once; the word it heard before the refusal lifts nothing", async () => {
    const { onRetry, onAskWord } = await refused();
    expect(onAskWord).toHaveBeenCalledTimes(1);
    await wait(300_000);
    expect(onRetry).not.toHaveBeenCalled();
    expect(onAskWord).toHaveBeenCalledTimes(1);
  });

  it("★ a host who reopened before the next poll is heard: the fresh word says open, the same word as before, and the shot goes", async () => {
    const { onRetry } = await refused();
    await says(true);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("a refusal over a word that already said closed asks nothing afresh: that word's validator moves when the album reopens", async () => {
    const onAskWord = vi.fn();
    const onRetry = vi.fn();
    render(<Page answerRetries onRetry={onRetry} word onAskWord={onAskWord} />);
    await opened();
    await screen.findByText("Frame 7 of 24");
    fireEvent.click(
      screen.getByRole("button", {
        name: "The album says closed",
        hidden: true,
      }),
    );
    await act(async () => press());
    fireEvent.click(
      screen.getByRole("button", { name: "Refuse them", hidden: true }),
    );
    await act(async () => {});
    expect(onAskWord).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "The album says open", hidden: true }),
    );
    await act(async () => {});
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("asks again on the next word: refused once more after a reopen, it waits for the album's word after that refusal", async () => {
    const { onRetry, onAskWord } = await refused();
    await says(false);
    await says(true);
    expect(onRetry).toHaveBeenCalledTimes(1);
    // The host closed it again before the shot went: refused over a word that said open, so the album is asked afresh.
    fireEvent.click(
      screen.getByRole("button", { name: "Refuse them", hidden: true }),
    );
    await wait(0);
    expect(onAskWord).toHaveBeenCalledTimes(2);
    await says(false);
    await wait(300_000);
    expect(onRetry).toHaveBeenCalledTimes(1);
    await says(true);
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it("★ a full album is not the switch's to lift: it keeps the calm cadence", async () => {
    const { onRetry } = await refused("Refuse them as full");
    await wait(10_000);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("asks nothing once she has closed the camera, whatever the album says (the failure sheet is hers then)", async () => {
    const { onRetry } = await refused();
    await says(false);
    fireEvent.click(screen.getByRole("button", { name: "Back to the album" }));
    await says(true);
    await wait(300_000);
    expect(onRetry).not.toHaveBeenCalled();
  });
});
