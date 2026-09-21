// @contract-for: src/components/guest/guest-upload.tsx
// @contract-for: src/lib/guest/use-upload-queue.ts
/**
 * BEHAVIOR PINS for GuestUpload (program Phase 2, slice 1), and since the
 * `guest-upload` wiring (2026-09-21) the ENGINE's contract in the Library too.
 *
 * The queue machine's pins are untouched and deliberately so: one-at-a-time
 * uploads, progress patching, the just-in-time silent join, demo simulation,
 * retry, and the rule that a rejected file errors only its own item while the
 * batch carries on. Those survived this board and must survive the next one.
 *
 * What the board CHANGED is where files come from and where a refusal is read,
 * and both are pinned here: nothing reaches `addFiles` until a guest has said
 * Send on the review step (`tap=sheet` with his "preview the photos before
 * upload"), and a run that ends with anything refused opens the failure sheet
 * once instead of firing a toast (`failed=sheet`). Pins assert behavior
 * (payloads, callbacks, what is on screen), never styles.
 */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { createRef } from "react";

import type { GuestEvent } from "@/lib/db/queries/guest-events";
import type { QueueItem } from "@/lib/guest/use-upload-queue";
import { uploadFile } from "@/lib/upload/uploader";

import { GuestUpload, type GuestUploadHandle } from "./guest-upload";

vi.mock("@/lib/upload/uploader", () => ({ uploadFile: vi.fn() }));
// Out of scope for these pins (own state machine + supabase); doneCount>0
// gating is pinned via the stub's presence.
vi.mock("@/components/guest/save-account-prompt", () => ({
  SaveAccountPrompt: () => <div data-testid="save-account-prompt" />,
}));
// The claim prompt OWNS the post-upload slot since the profile wiring
// (2026-09-19): it resolves the viewer and decides which single card stands,
// which is its own contract (claim-handle-prompt.test.tsx) and its own supabase
// call. Stubbed to render the card it was handed, so what stays pinned HERE is
// the thing this file is about: the slot mounts on doneCount > 0 and never in
// the demo.
vi.mock("@/components/guest/claim-handle-prompt", () => ({
  ClaimHandlePrompt: ({ savePrompt }: { savePrompt: React.ReactNode }) => (
    <>{savePrompt}</>
  ),
}));

const mockUploadFile = vi.mocked(uploadFile);

const EVENT = {
  id: "evt-1",
  moderation_mode: "auto_approve",
  host_display_name: "Maya",
} as unknown as GuestEvent;

const HOLD_EVENT = {
  id: "evt-1",
  moderation_mode: "hold_for_approval",
  host_display_name: "Maya",
} as unknown as GuestEvent;

function makeFile(name = "photo.jpg") {
  return new File([new Uint8Array([1, 2, 3])], name, { type: "image/jpeg" });
}

function mount(props?: Partial<Parameters<typeof GuestUpload>[0]>) {
  const onSession = vi.fn();
  const onUploaded = vi.fn();
  const handleRef = createRef<GuestUploadHandle>();
  const utils = render(
    <GuestUpload
      ref={handleRef}
      event={EVENT}
      qrToken="qr-token-1"
      sessionToken="sess-1"
      onSession={onSession}
      onUploaded={onUploaded}
      isDemo={false}
      {...props}
    />,
  );
  /**
   * THE WHOLE FRONT OF THE ACT, as a guest performs it: open the sheet, choose
   * from the album, then SEND on the review step. Nothing reaches the queue
   * before that last tap, which is the point of the step.
   */
  const addFiles = (files: File[]) => {
    act(() => handleRef.current!.openAdd());
    const album = document.querySelector(
      'input[type="file"][multiple]',
    ) as HTMLInputElement;
    fireEvent.change(album, { target: { files } });
    fireEvent.click(
      screen.getByRole("button", { name: `Send ${files.length}` }),
    );
  };
  return { ...utils, onSession, onUploaded, handleRef, addFiles };
}

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
});

describe("GuestUpload: queue", () => {
  it("uploads with the guest endpoint pair + session identity", async () => {
    mockUploadFile.mockResolvedValue({
      ok: true,
      status: "approved",
      mediaId: "med-1",
      kind: "photo",
    });
    const { addFiles } = mount();
    addFiles([makeFile()]);

    await waitFor(() => expect(mockUploadFile).toHaveBeenCalledTimes(1));
    expect(mockUploadFile).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoints: {
          presign: "/api/r2/presign-upload",
          complete: "/api/r2/complete-upload",
        },
        identity: { session_token: "sess-1" },
      }),
    );
  });

  it("runs ONE file at a time: the second starts only after the first resolves", async () => {
    let resolveFirst!: (v: Awaited<ReturnType<typeof uploadFile>>) => void;
    mockUploadFile
      .mockImplementationOnce(
        () => new Promise((resolve) => (resolveFirst = resolve)),
      )
      .mockResolvedValueOnce({
        ok: true,
        status: "approved",
        mediaId: "med-2",
        kind: "photo",
      });

    const { addFiles } = mount();
    addFiles([makeFile("a.jpg"), makeFile("b.jpg")]);

    await waitFor(() => expect(mockUploadFile).toHaveBeenCalledTimes(1));
    // Give the runner a beat: the second must NOT start while #1 is in flight.
    await new Promise((r) => setTimeout(r, 30));
    expect(mockUploadFile).toHaveBeenCalledTimes(1);

    resolveFirst({
      ok: true,
      status: "approved",
      mediaId: "med-1",
      kind: "photo",
    });
    await waitFor(() => expect(mockUploadFile).toHaveBeenCalledTimes(2));
  });

  // Phase 4: the per-file list UI moved into GALLERY TILES; progress now
  // surfaces through the lifted queue snapshots (the same wiring the tiles
  // read). Same coverage - onProgress reaches an observable output at 50%.
  it("patches per-file progress through the onProgress callback", async () => {
    let report!: (f: number) => void;
    mockUploadFile.mockImplementation(
      ({ onProgress }) =>
        new Promise(() => {
          report = onProgress!;
        }),
    );
    const { addFiles, snapshots } = mountWithQueue();
    addFiles([makeFile()]);

    await waitFor(() => expect(mockUploadFile).toHaveBeenCalled());
    report(0.5);
    await waitFor(() => {
      expect(snapshots.at(-1)?.[0]).toMatchObject({
        status: "uploading",
        progress: 50,
      });
    });
  });

  it("approved outcome: reports onUploaded and mounts the growth prompt", async () => {
    mockUploadFile.mockResolvedValue({
      ok: true,
      status: "approved",
      mediaId: "med-1",
      kind: "photo",
    });
    const { addFiles, onUploaded } = mount();
    const file = makeFile();
    addFiles([file]);

    // An approved upload's feedback IS the gallery tile (the sweep, as of
    // `landing=sweep`); the contract here is the payload + the growth prompt.
    await waitFor(() =>
      expect(onUploaded).toHaveBeenCalledWith({
        mediaId: "med-1",
        // The queue id rides along so the gallery can re-key its optimistic
        // blob URL (queueId -> mediaId) with zero flicker.
        queueId: expect.any(String),
        file,
        kind: "photo",
        status: "approved",
      }),
    );
    // doneCount > 0 mounts the save-account growth prompt (non-demo).
    await screen.findByTestId("save-account-prompt");
  });

  it("a HELD outcome says nothing here: the waiting TILE is the whole answer", async () => {
    mockUploadFile.mockResolvedValue({
      ok: true,
      status: "pending",
      mediaId: "med-1",
      kind: "photo",
    });
    const { addFiles, snapshots } = mountWithQueue({ event: HOLD_EVENT });
    addFiles([makeFile()]);

    // `held=tile` (2026-09-21) retired the "Sent, waiting for host approval"
    // toast. What the album needs instead is on the queue item: the outcome AND
    // the media id, which is the only way its tile can tell it has been
    // approved later.
    await waitFor(() =>
      expect(snapshots.at(-1)?.[0]).toMatchObject({
        status: "done",
        mediaStatus: "pending",
        mediaId: "med-1",
      }),
    );
    expect(toast.success).not.toHaveBeenCalled();
  });
});

describe("GuestUpload: just-in-time join", () => {
  it("no session: POSTs /api/guests with the qr_token, then uploads the stash", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, session_token: "fresh-token" }),
    } as Response);
    mockUploadFile.mockResolvedValue({
      ok: true,
      status: "approved",
      mediaId: "med-1",
      kind: "photo",
    });

    const { addFiles, onSession } = mount({ sessionToken: null });
    addFiles([makeFile()]);

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/guests",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ qr_token: "qr-token-1" }),
        }),
      ),
    );
    await waitFor(() => expect(onSession).toHaveBeenCalledWith("fresh-token"));
    // The stashed file uploads with the NEW token.
    await waitFor(() =>
      expect(mockUploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          identity: { session_token: "fresh-token" },
        }),
      ),
    );
  });

  it("join rejection: toasts and clears the stash, nothing uploads", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ ok: false, message: "Bad token" }),
    } as Response);

    const { addFiles, onSession } = mount({ sessionToken: null });
    addFiles([makeFile()]);

    // The JOIN's toast stays: nothing was ever queued, so there is no run to
    // end and no failure sheet to open. `failed=sheet` is about FILES.
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Couldn't start uploading", {
        description: "Bad token",
      }),
    );
    expect(onSession).not.toHaveBeenCalled();
    expect(mockUploadFile).not.toHaveBeenCalled();
  });

  it("join network failure: the connection toast, stash cleared", async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error("offline"));

    const { addFiles } = mount({ sessionToken: null });
    addFiles([makeFile()]);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Couldn't start uploading", {
        description: "Check your connection and try again.",
      }),
    );
    expect(mockUploadFile).not.toHaveBeenCalled();
  });
});

/**
 * THE IDENTITY RESHAPE'S PINS (2026-09-21). Three facts about WHO a queue
 * uploads as, all of them behaviour the door cannot see.
 */
describe("GuestUpload: the identity reshape", () => {
  it("a stored session never joins again: the name was answered once", async () => {
    mockUploadFile.mockResolvedValue({
      ok: true,
      status: "approved",
      mediaId: "med-1",
      kind: "photo",
    });
    const { addFiles } = mount({ sessionToken: "sess-1" });
    addFiles([makeFile()]);
    await waitFor(() => expect(mockUploadFile).toHaveBeenCalledTimes(1));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("the silent join carries NO name: the door is the only place one is typed", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, session_token: "fresh-token" }),
    } as Response);
    mockUploadFile.mockResolvedValue({
      ok: true,
      status: "approved",
      mediaId: "med-1",
      kind: "photo",
    });
    const { addFiles } = mount({ sessionToken: null, isVerified: true });
    addFiles([makeFile()]);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const body = JSON.parse(
      (vi.mocked(global.fetch).mock.calls[0][1] as RequestInit).body as string,
    );
    expect(body).toEqual({ qr_token: "qr-token-1" });
    expect(body).not.toHaveProperty("display_name");
  });

  it("a mid-run verification_required drops the session, refuses the rest, and the sheet says the server's own line", async () => {
    // Three files: the first goes, the second meets the flip, and the third
    // must never be tried — the session is spent for all of them.
    mockUploadFile
      .mockResolvedValueOnce({
        ok: true,
        status: "approved",
        mediaId: "med-1",
        kind: "photo",
      })
      .mockResolvedValue({
        ok: false,
        code: "verification_required",
        message: "This event now needs a confirmed email.",
      });

    const { addFiles, onSession } = mount({ sessionToken: "sess-1" });
    addFiles([makeFile("a.jpg"), makeFile("b.jpg"), makeFile("c.jpg")]);

    await waitFor(() => expect(onSession).toHaveBeenCalledWith(null));
    // The run ENDED here rather than walking into a third refusal.
    expect(mockUploadFile).toHaveBeenCalledTimes(2);
    // One sheet, both remaining files on it, one true sentence.
    const sheet = await screen.findByText("2 files did not go");
    expect(sheet).toBeInTheDocument();
    expect(
      screen.getAllByText("This event now needs a confirmed email."),
    ).toHaveLength(2);
  });
});

describe("GuestUpload: demo mode", () => {
  it("simulates the upload: no network, synthetic approved outcome", async () => {
    const { addFiles, onUploaded, onSession } = mount({
      sessionToken: null,
      isDemo: true,
    });
    addFiles([makeFile()]);

    // Demo join is local: the session flips to "demo" without a fetch.
    await waitFor(() => expect(onSession).toHaveBeenCalledWith("demo"));
    await waitFor(
      () =>
        expect(onUploaded).toHaveBeenCalledWith(
          expect.objectContaining({ status: "approved", kind: "photo" }),
        ),
      { timeout: 3000 },
    );
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockUploadFile).not.toHaveBeenCalled();
    // The growth prompt never shows in demo.
    expect(screen.queryByTestId("save-account-prompt")).not.toBeInTheDocument();
  });
});

describe("GuestUpload: moderation copy", () => {
  it("hold_for_approval shows the review notice; auto_approve does not", () => {
    const { unmount } = mount({ event: HOLD_EVENT });
    expect(
      screen.getByText(
        "The host reviews uploads before they appear in the album.",
      ),
    ).toBeInTheDocument();
    unmount();

    mount();
    expect(
      screen.queryByText(
        "The host reviews uploads before they appear in the album.",
      ),
    ).not.toBeInTheDocument();
  });
});

/* ── The act's two ends (the `guest-upload` board, 2026-09-21) ────────────── */

describe("GuestUpload: the add sheet is the only door in", () => {
  it("openAdd opens the sheet, and nothing is queued until Send", () => {
    const { handleRef, snapshots } = mountWithQueue();
    // Closed, the sheet is not in the document at all — which is also why both
    // inputs live inside it rather than on the page.
    expect(document.querySelector('input[type="file"]')).toBeNull();

    act(() => handleRef.current!.openAdd());
    const album = document.querySelector(
      'input[type="file"][multiple]',
    ) as HTMLInputElement;
    fireEvent.change(album, {
      target: { files: [makeFile(), makeFile("b.jpg")] },
    });

    // The review step is standing and the queue is still empty: this is the
    // whole of "allow guests to catch an accidental selection".
    expect(screen.getByRole("button", { name: "Send 2" })).toBeInTheDocument();
    expect(mockUploadFile).not.toHaveBeenCalled();
    expect(snapshots.at(-1) ?? []).toEqual([]);
  });
});

describe("GuestUpload: a run that ends badly opens the failure sheet", () => {
  it("lists every refusal with the server's own sentence, and no toast fires", async () => {
    mockUploadFile
      .mockResolvedValueOnce({ ok: false, message: "That upload failed." })
      .mockResolvedValueOnce({
        ok: true,
        status: "approved",
        mediaId: "med-2",
        kind: "photo",
      });
    const { addFiles } = mount();
    addFiles([makeFile("a.jpg"), makeFile("b.jpg")]);

    await waitFor(() =>
      expect(screen.getByText("1 file did not go")).toBeInTheDocument(),
    );
    expect(screen.getByText("That upload failed.")).toBeInTheDocument();
    expect(screen.getByText("a.jpg")).toBeInTheDocument();
    // `failed=sheet` retired the upload error toast outright.
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("stays shut when the run is clean", async () => {
    mockUploadFile.mockResolvedValue({
      ok: true,
      status: "approved",
      mediaId: "med-1",
      kind: "photo",
    });
    const { addFiles } = mount();
    addFiles([makeFile()]);

    await waitFor(() => expect(mockUploadFile).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 30));
    expect(screen.queryByText(/did not go/)).toBeNull();
  });

  it("its Retry re-queues the file", async () => {
    mockUploadFile
      .mockResolvedValueOnce({ ok: false, message: "That upload failed." })
      .mockResolvedValueOnce({
        ok: true,
        status: "approved",
        mediaId: "med-1",
        kind: "photo",
      });
    const { addFiles, snapshots } = mountWithQueue();
    addFiles([makeFile()]);

    await waitFor(() =>
      expect(screen.getByText("1 file did not go")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /Try again/ }));
    await waitFor(() =>
      expect(snapshots.at(-1)?.[0]).toMatchObject({ status: "done" }),
    );
    expect(mockUploadFile).toHaveBeenCalledTimes(2);
  });
});

/* ── A dismissed failure is GONE, not hidden (the alias red-team's DEFECT 1,
   2026-09-21): "Not now" used to close the sheet without ever touching the
   queue, so the same errored item sat there forever and the NEXT run's end -
   however clean - saw it and reopened on it (reproduced: refuse notes.txt,
   Not now, a clean twelve-file run still ended on "1 file did not go"). ── */

describe("GuestUpload: dismissing a failure retires it for good", () => {
  it("Not now drops it: a later clean run never resurrects it", async () => {
    mockUploadFile
      .mockResolvedValueOnce({ ok: false, message: "That upload failed." })
      .mockResolvedValueOnce({
        ok: true,
        status: "approved",
        mediaId: "med-2",
        kind: "photo",
      });
    const { addFiles } = mount();
    addFiles([makeFile("notes.txt")]);

    await waitFor(() =>
      expect(screen.getByText("1 file did not go")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(screen.queryByText("1 file did not go")).not.toBeInTheDocument();

    // A second, unrelated run - clean end to end - must judge itself only by
    // what is STILL in the queue, not by the failure dismissed a moment ago.
    addFiles([makeFile("clean.jpg")]);
    await waitFor(() => expect(mockUploadFile).toHaveBeenCalledTimes(2));
    await new Promise((r) => setTimeout(r, 30));
    expect(screen.queryByText(/did not go/)).toBeNull();
  });

  it("Retry all still re-queues every listed file (the close behind it never eats them)", async () => {
    mockUploadFile
      .mockResolvedValueOnce({ ok: false, message: "Nope A." })
      .mockResolvedValueOnce({ ok: false, message: "Nope B." })
      .mockResolvedValueOnce({
        ok: true,
        status: "approved",
        mediaId: "med-a",
        kind: "photo",
      })
      .mockResolvedValueOnce({
        ok: true,
        status: "approved",
        mediaId: "med-b",
        kind: "photo",
      });
    const { addFiles, snapshots } = mountWithQueue();
    addFiles([makeFile("a.jpg"), makeFile("b.jpg")]);

    await waitFor(() =>
      expect(screen.getByText("2 files did not go")).toBeInTheDocument(),
    );
    // Retry all closes the sheet on top of the very ids it just re-queued -
    // the same `dismiss` DEFECT 1 needed must not treat a retried id as an
    // abandoned one.
    fireEvent.click(screen.getByRole("button", { name: /Retry all/ }));

    await waitFor(() => {
      const last = snapshots.at(-1)!;
      expect(last).toHaveLength(2);
      expect(last.every((it) => it.status === "done")).toBe(true);
    });
    expect(mockUploadFile).toHaveBeenCalledTimes(4);
    expect(screen.queryByText(/did not go/)).toBeNull();
  });
});

// ─── Phase 4 contracts: the lifted queue + the imperative handle ─────────────
// These pin the subscriber surface (onQueueChange snapshots + handle.retry),
// which the in-gallery tiles read.

function mountWithQueue(props?: Partial<Parameters<typeof GuestUpload>[0]>) {
  const snapshots: QueueItem[][] = [];
  return {
    ...mount({
      ...props,
      onQueueChange: (items: QueueItem[]) => snapshots.push(items),
    }),
    snapshots,
  };
}

describe("GuestUpload: the lifted queue contract (Phase 4)", () => {
  it("onQueueChange mirrors the lifecycle: queued -> uploading(progress) -> done", async () => {
    let report!: (f: number) => void;
    let resolveUpload!: (v: Awaited<ReturnType<typeof uploadFile>>) => void;
    mockUploadFile.mockImplementation(
      ({ onProgress }) =>
        new Promise((resolve) => {
          report = onProgress!;
          resolveUpload = resolve;
        }),
    );
    const { addFiles, snapshots } = mountWithQueue();
    addFiles([makeFile()]);

    await waitFor(() => expect(mockUploadFile).toHaveBeenCalled());
    report(0.5);
    await waitFor(() => {
      const last = snapshots.at(-1)!;
      expect(last[0]).toMatchObject({
        kind: "photo",
        status: "uploading",
        progress: 50,
      });
    });
    resolveUpload({
      ok: true,
      status: "approved",
      mediaId: "med-9",
      kind: "photo",
    });
    await waitFor(() => {
      const last = snapshots.at(-1)!;
      expect(last[0]).toMatchObject({ status: "done", progress: 100 });
    });
  });

  it("handle.retry(id) resets an errored item and re-runs the queue", async () => {
    mockUploadFile
      .mockResolvedValueOnce({ ok: false, message: "Nope." })
      .mockResolvedValueOnce({
        ok: true,
        status: "approved",
        mediaId: "med-1",
        kind: "photo",
      });
    const { addFiles, snapshots, handleRef } = mountWithQueue();
    addFiles([makeFile()]);

    await waitFor(() =>
      expect(snapshots.at(-1)?.[0]).toMatchObject({
        status: "error",
        error: "Nope.",
      }),
    );
    act(() => handleRef.current!.retry(snapshots.at(-1)![0].id));
    await waitFor(() =>
      expect(snapshots.at(-1)?.[0]).toMatchObject({ status: "done" }),
    );
    expect(mockUploadFile).toHaveBeenCalledTimes(2);
  });

  // QA #12: one dropped request used to freeze its tile at "uploading" (so the
  // in-tile retry never appeared) AND break out of the sequential loop, silently
  // abandoning the rest of the batch. These pin that a REJECTION is contained.
  it("a REJECTED upload errors only its own tile, never wedges it at uploading", async () => {
    mockUploadFile.mockRejectedValueOnce(new Error("network went away"));
    const { addFiles, snapshots } = mountWithQueue();
    addFiles([makeFile()]);

    await waitFor(() =>
      expect(snapshots.at(-1)?.[0]).toMatchObject({ status: "error" }),
    );
    // "error" is what puts the file on the failure sheet; "uploading" is the
    // stuck state the guest could do nothing about.
    expect(snapshots.at(-1)?.[0].status).not.toBe("uploading");
  });

  it("a REJECTED upload does not stop the rest of the batch", async () => {
    mockUploadFile
      .mockRejectedValueOnce(new Error("network went away"))
      .mockResolvedValueOnce({
        ok: true,
        status: "approved",
        mediaId: "med-2",
        kind: "photo",
      })
      .mockResolvedValueOnce({
        ok: true,
        status: "approved",
        mediaId: "med-3",
        kind: "photo",
      });
    const { addFiles, snapshots } = mountWithQueue();
    addFiles([makeFile("a.jpg"), makeFile("b.jpg"), makeFile("c.jpg")]);

    await waitFor(() => {
      const last = snapshots.at(-1)!;
      expect(last.map((it) => it.status)).toEqual(["error", "done", "done"]);
    });
    expect(mockUploadFile).toHaveBeenCalledTimes(3);
  });

  it("a rejected upload is still retryable", async () => {
    mockUploadFile
      .mockRejectedValueOnce(new Error("network went away"))
      .mockResolvedValueOnce({
        ok: true,
        status: "approved",
        mediaId: "med-1",
        kind: "photo",
      });
    const { addFiles, snapshots, handleRef } = mountWithQueue();
    addFiles([makeFile()]);

    await waitFor(() =>
      expect(snapshots.at(-1)?.[0]).toMatchObject({ status: "error" }),
    );
    act(() => handleRef.current!.retry(snapshots.at(-1)![0].id));
    await waitFor(() =>
      expect(snapshots.at(-1)?.[0]).toMatchObject({ status: "done" }),
    );
  });
});
