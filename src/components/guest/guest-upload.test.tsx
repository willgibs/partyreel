/**
 * BEHAVIOR PINS for GuestUpload, and for the upload ENGINE under it
 * (use-upload-queue.ts).
 *
 * The queue machine's pins: one-at-a-time uploads, progress patching, the
 * just-in-time silent join, demo simulation, retry, and the rule that a
 * rejected file errors only its own item while the batch carries on. They must
 * survive any redesign of the surface above the queue.
 *
 * The surface's own pins are where files come from and where a refusal is read:
 * nothing reaches `addFiles` until a guest has said Send on the review step (so
 * a guest previews the photos before they upload), and a run that ends with
 * anything refused opens the failure sheet once instead of firing a toast. Pins
 * assert behavior (payloads, callbacks, what is on screen), never styles.
 *
 * ★ THE QUEUE IS THE PAGE'S, so these mount a HARNESS that owns it exactly as
 * `event-experience.tsx` does and hands `GuestUpload` the snapshot. That is deliberate rather
 * than a convenience: the door's upload step and the album's sheets read ONE queue in production,
 * and a pin that mocked it away would stop proving the thing that actually has to hold. The
 * engine's own pins live in this file for the same reason.
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
import { createRef, useEffect, useRef } from "react";

import type { GuestEvent } from "@/lib/db/queries/guest-events";
import {
  useUploadQueue,
  type QueueItem,
  type UploadedItem,
} from "@/lib/guest/use-upload-queue";
import { uploadFile } from "@/lib/upload/uploader";

import { GuestUpload, type GuestUploadHandle } from "./guest-upload";

vi.mock("@/lib/upload/uploader", () => ({ uploadFile: vi.fn() }));
// Out of scope for these pins (own state machine + supabase); doneCount>0
// gating is pinned via the stub's presence.
vi.mock("@/components/guest/save-account-prompt", () => ({
  SaveAccountPrompt: ({ count }: { count?: number }) => (
    <div data-testid="save-account-prompt" data-count={count} />
  ),
}));
// The claim prompt OWNS the post-upload slot: it resolves the viewer and
// decides which single card stands, which is its own contract
// (claim-handle-prompt.test.tsx) and its own supabase call. Stubbed to render
// the card it was handed, so what stays pinned HERE is the thing this file is
// about: the slot mounts on doneCount > 0, or on a confirmation's return
// (`moment`), and never in the demo.
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

/**
 * The page shell's own shape, small enough to read: the queue lives here, `GuestUpload` is handed
 * its snapshot and the three callbacks, and the test drives it through the real sheets.
 */
function Harness({
  handleRef,
  onSession,
  onUploaded,
  onQueueChange,
  onVerificationRequired,
  isDemo = false,
  isVerified = false,
  sessionToken = "sess-1",
  ...rest
}: {
  handleRef: React.RefObject<GuestUploadHandle | null>;
  onSession: (token: string | null) => void;
  onUploaded: (item: UploadedItem) => void;
  onQueueChange?: (items: QueueItem[]) => void;
  onVerificationRequired?: (message: string) => void;
  isDemo?: boolean;
  isVerified?: boolean;
  sessionToken?: string | null;
  event?: GuestEvent;
  suppressFailures?: boolean;
  moment?: boolean;
  removedIds?: ReadonlySet<string>;
}) {
  const pendingRef = useRef<string | null>(null);
  const { items, addFiles, retry, dismiss } = useUploadQueue({
    qrToken: "qr-token-1",
    sessionToken,
    onSession,
    onUploaded,
    isDemo,
    isVerified,
    onVerificationRequired: (message, hadQueuedFiles) => {
      if (hadQueuedFiles) {
        pendingRef.current = message;
        return;
      }
      onVerificationRequired?.(message);
    },
  });
  useEffect(() => {
    onQueueChange?.(items);
  }, [items, onQueueChange]);
  return (
    <GuestUpload
      ref={handleRef}
      event={rest.event ?? EVENT}
      qrToken="qr-token-1"
      sessionToken={sessionToken}
      queue={items}
      onAddFiles={addFiles}
      onRetry={retry}
      onDismiss={dismiss}
      suppressFailures={rest.suppressFailures}
      onFailuresClosed={() => {
        if (pendingRef.current === null) return;
        const message = pendingRef.current;
        pendingRef.current = null;
        onVerificationRequired?.(message);
      }}
      isDemo={isDemo}
      moment={rest.moment}
      removedIds={rest.removedIds}
    />
  );
}

function mount(props?: Record<string, unknown>) {
  const onSession = vi.fn();
  const onUploaded = vi.fn();
  const handleRef = createRef<GuestUploadHandle>();
  const utils = render(
    <Harness
      handleRef={handleRef}
      onSession={onSession}
      onUploaded={onUploaded}
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

  // Per-file progress is drawn by the GALLERY TILES, so it surfaces here through
  // the lifted queue snapshots (the same wiring the tiles read): onProgress
  // reaches an observable output at 50%.
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

    // An approved upload's feedback IS the gallery tile (the landing sweep); the
    // contract here is the payload + the growth prompt.
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

    // The waiting tile answers, never a "Sent, waiting for host approval"
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
    // end and no failure sheet to open. The failure sheet is about FILES.
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
 * WHO A QUEUE UPLOADS AS: three facts, all of them behaviour the door cannot
 * see.
 */
describe("GuestUpload: who a queue uploads as", () => {
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

/* ── The refresh waits for the failure sheet. A mid-run verification_required
   must not call onVerificationRequired (the caller's router.refresh()) in the
   SAME tick as the queue's own state update, before the "run ended" effect
   below even runs: the access flip that follows remounts this whole tree via
   key={access} and tears the failure sheet down mid-read. A join-time refusal
   (nothing ever queued) has no sheet to wait for and fires at once. ── */

describe("GuestUpload: the refresh waits for the failure sheet", () => {
  it("does not call onVerificationRequired while the mid-run sheet is open", async () => {
    mockUploadFile.mockResolvedValue({
      ok: false,
      code: "verification_required",
      message: "This event now needs a confirmed email.",
    });
    const onVerificationRequired = vi.fn();
    const { addFiles } = mount({
      sessionToken: "sess-1",
      onVerificationRequired,
    });
    addFiles([makeFile()]);

    await screen.findByText("1 file did not go");
    expect(onVerificationRequired).not.toHaveBeenCalled();
  });

  it("closing the sheet with Not now calls it exactly once", async () => {
    mockUploadFile.mockResolvedValue({
      ok: false,
      code: "verification_required",
      message: "This event now needs a confirmed email.",
    });
    const onVerificationRequired = vi.fn();
    const { addFiles } = mount({
      sessionToken: "sess-1",
      onVerificationRequired,
    });
    addFiles([makeFile()]);

    await screen.findByText("1 file did not go");
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(onVerificationRequired).toHaveBeenCalledTimes(1);
  });

  it("Retry (Try again) also closes the sheet and fires the deferred refresh — the gate, never a dead stall", async () => {
    mockUploadFile.mockResolvedValue({
      ok: false,
      code: "verification_required",
      message: "This event now needs a confirmed email.",
    });
    const onVerificationRequired = vi.fn();
    const { addFiles } = mount({
      sessionToken: "sess-1",
      onVerificationRequired,
    });
    addFiles([makeFile()]);

    await screen.findByText("1 file did not go");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onVerificationRequired).toHaveBeenCalledTimes(1);
  });

  it("a join-time refusal (nothing queued) calls onVerificationRequired at once, no sheet ever opens", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: () =>
        Promise.resolve({
          ok: false,
          code: "verification_required",
          message: "Confirm your email to join this event.",
        }),
    } as Response);
    const onVerificationRequired = vi.fn();
    const { addFiles } = mount({
      sessionToken: null,
      onVerificationRequired,
    });
    addFiles([makeFile()]);

    await waitFor(() =>
      expect(onVerificationRequired).toHaveBeenCalledTimes(1),
    );
    expect(onVerificationRequired).toHaveBeenCalledWith(
      "Confirm your email to join this event.",
    );
    expect(screen.queryByText(/did not go/)).toBeNull();
    expect(mockUploadFile).not.toHaveBeenCalled();
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

/* ── The act's two ends ───────────────────────────────────────────────────── */

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
    // whole point of the step, a guest catching an accidental selection.
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
    // A refused file is the sheet's to report, never an upload error toast's.
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

/* ── A dismissed failure is GONE, not hidden: "Not now" retires the item from
   the queue rather than only closing the sheet, or the same errored item would
   sit there forever and the NEXT run's end - however clean - would see it and
   reopen on it. ── */

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
    // the `dismiss` that retires a dismissed failure must not treat a retried
    // id as an abandoned one.
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

// ─── The lifted queue + the imperative handle ────────────────────────────────
// These pin the subscriber surface (onQueueChange snapshots + handle.retry),
// which the in-gallery tiles read.

function mountWithQueue(props?: Record<string, unknown>) {
  const snapshots: QueueItem[][] = [];
  return {
    ...mount({
      ...props,
      onQueueChange: (items: QueueItem[]) => snapshots.push(items),
    }),
    snapshots,
  };
}

describe("GuestUpload: the lifted queue contract", () => {
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

  // One dropped request must never freeze its item at "uploading" (a stuck
  // state no retry can reach) nor break out of the sequential loop, silently
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

/**
 * THE SLOT ON A CONFIRMATION'S RETURN. A guest who confirmed through Google or a
 * magic link comes back to a fresh page with nothing uploaded this visit; when
 * the album says a confirmation from here just claimed their uploads, the slot
 * stands anyway, so the follow moment can play.
 */
describe("GuestUpload: the slot on a confirmation's return", () => {
  it("stands with nothing uploaded this visit when the album says the moment is due", async () => {
    mount({ moment: true });
    expect(await screen.findByTestId("save-account-prompt")).toBeInTheDocument();
  });

  it("stays empty without it until something is uploaded", () => {
    mount();
    expect(screen.queryByTestId("save-account-prompt")).toBeNull();
  });

  it("never stands in the demo, moment or not", () => {
    mount({ moment: true, isDemo: true, sessionToken: null });
    expect(screen.queryByTestId("save-account-prompt")).toBeNull();
  });
});

/**
 * THE CARD COUNTS WHAT IS STILL IN THE ALBUM. The post-upload slot's number is "your N photos are
 * on this album", so a finished upload the guest removed again leaves it: the page hands down the
 * ids this visit's removals took back out, and the slot leaves once none of this visit's uploads
 * is left.
 */
describe("GuestUpload: the post-upload card counts what is still in the album", () => {
  it("drops a removed upload from the count, and unmounts once none is left", async () => {
    mockUploadFile
      .mockResolvedValueOnce({
        ok: true,
        status: "approved",
        mediaId: "med-1",
        kind: "photo",
      })
      .mockResolvedValueOnce({
        ok: true,
        status: "approved",
        mediaId: "med-2",
        kind: "photo",
      });
    const onSession = vi.fn();
    const onUploaded = vi.fn();
    const handleRef = createRef<GuestUploadHandle>();
    const harness = (removedIds?: ReadonlySet<string>) => (
      <Harness
        handleRef={handleRef}
        onSession={onSession}
        onUploaded={onUploaded}
        removedIds={removedIds}
      />
    );
    const { rerender } = render(harness());
    act(() => handleRef.current!.openAdd());
    fireEvent.change(
      document.querySelector('input[type="file"][multiple]') as HTMLInputElement,
      { target: { files: [makeFile("a.jpg"), makeFile("b.jpg")] } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Send 2" }));
    await waitFor(() =>
      expect(
        screen.getByTestId("save-account-prompt").getAttribute("data-count"),
      ).toBe("2"),
    );

    rerender(harness(new Set(["med-1"])));
    expect(
      screen.getByTestId("save-account-prompt").getAttribute("data-count"),
    ).toBe("1");

    rerender(harness(new Set(["med-1", "med-2"])));
    expect(screen.queryByTestId("save-account-prompt")).toBeNull();
  });
});
