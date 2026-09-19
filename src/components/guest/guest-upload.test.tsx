/**
 * BEHAVIOR PINS for GuestUpload (program Phase 2, slice 1). Freezes the
 * ref-based queue machine before Phase 4 rewrites it as a reducer hook:
 * one-at-a-time uploads, progress patching, the just-in-time silent join,
 * demo simulation, error + retry, and the coordinator callbacks. Pins assert
 * behavior (payloads, callbacks, copy, toasts) - never styles.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import type { GuestEvent } from "@/lib/db/queries/guest-events";
import { uploadFile } from "@/lib/upload/uploader";

import { GuestUpload } from "./guest-upload";

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
} as unknown as GuestEvent;

const HOLD_EVENT = {
  id: "evt-1",
  moderation_mode: "hold_for_approval",
} as unknown as GuestEvent;

function makeFile(name = "photo.jpg") {
  return new File([new Uint8Array([1, 2, 3])], name, { type: "image/jpeg" });
}

function mount(props?: Partial<Parameters<typeof GuestUpload>[0]>) {
  const onSession = vi.fn();
  const onUploaded = vi.fn();
  const utils = render(
    <GuestUpload
      event={EVENT}
      qrToken="qr-token-1"
      sessionToken="sess-1"
      onSession={onSession}
      onUploaded={onUploaded}
      isDemo={false}
      {...props}
    />,
  );
  const addFiles = (files: File[]) => {
    const input = utils.container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files } });
  };
  return { ...utils, onSession, onUploaded, addFiles };
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

    resolveFirst({ ok: true, status: "approved", mediaId: "med-1", kind: "photo" });
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

    // Phase 4: an approved upload's feedback IS the gallery tile + the green
    // check (no copy here); the contract is the payload + the growth prompt.
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

  it("pending outcome surfaces the waiting-for-approval copy (as a toast)", async () => {
    mockUploadFile.mockResolvedValue({
      ok: true,
      status: "pending",
      mediaId: "med-1",
      kind: "photo",
    });
    const { addFiles } = mount({ event: HOLD_EVENT });
    addFiles([makeFile()]);

    // Phase 4: the per-file list is gone; the pinned copy fires as a toast.
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Sent, waiting for host approval",
      ),
    );
  });

  it("failure surfaces the message and retry re-runs it", async () => {
    mockUploadFile
      .mockResolvedValueOnce({ ok: false, message: "That upload failed." })
      .mockResolvedValueOnce({
        ok: true,
        status: "approved",
        mediaId: "med-1",
        kind: "photo",
      });
    const { addFiles, snapshots, handleRef } = mountWithQueue();
    addFiles([makeFile()]);

    // Phase 4: the error surfaces as a toast + an in-tile retry; the retry
    // path runs through the imperative handle (what the tile calls).
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Couldn't add that photo", {
        description: "That upload failed.",
      }),
    );
    handleRef.current!.retry(snapshots.at(-1)![0].id);
    await waitFor(() =>
      expect(snapshots.at(-1)?.[0]).toMatchObject({ status: "done" }),
    );
    expect(mockUploadFile).toHaveBeenCalledTimes(2);
  });
});

describe("GuestUpload: just-in-time join", () => {
  it("no session: POSTs /api/guests with the qr_token, then uploads the stash", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      json: () =>
        Promise.resolve({ ok: true, session_token: "fresh-token" }),
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
      json: () => Promise.resolve({ ok: false, message: "Bad token" }),
    } as Response);

    const { addFiles, onSession } = mount({ sessionToken: null });
    addFiles([makeFile()]);

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

// ─── Phase 4 contracts: the lifted queue + the imperative handle ─────────────
// These pin the NEW subscriber surface (onQueueChange snapshots + handle.retry
// + handle.openPicker) BEFORE S5 swaps the per-file list UI for in-gallery
// tiles, so the visual swap lands against an already-pinned contract.
import type {
  GuestUploadHandle,
} from "./guest-upload";
import type { QueueItem } from "@/lib/guest/use-upload-queue";
import { createRef } from "react";

function mountWithQueue(props?: Partial<Parameters<typeof GuestUpload>[0]>) {
  const snapshots: QueueItem[][] = [];
  const handleRef = createRef<GuestUploadHandle>();
  const base = mount({
    ...props,
    ref: handleRef,
    onQueueChange: (items: QueueItem[]) => snapshots.push(items),
  });
  return { ...base, snapshots, handleRef };
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
    resolveUpload({ ok: true, status: "approved", mediaId: "med-9", kind: "photo" });
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
    handleRef.current!.retry(snapshots.at(-1)![0].id);
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
    // "error" is what renders the tap-to-retry affordance; "uploading" is the
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
    handleRef.current!.retry(snapshots.at(-1)![0].id);
    await waitFor(() =>
      expect(snapshots.at(-1)?.[0]).toMatchObject({ status: "done" }),
    );
  });

  it("handle.openPicker clicks the hidden file input", () => {
    const { container, handleRef } = mountWithQueue();
    const hidden = container.querySelector(
      'input[type="file"][hidden]',
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(hidden, "click");
    handleRef.current!.openPicker();
    expect(clickSpy).toHaveBeenCalled();
  });
});
