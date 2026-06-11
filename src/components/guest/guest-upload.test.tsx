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

  it("patches per-file progress through the onProgress callback", async () => {
    let report!: (f: number) => void;
    mockUploadFile.mockImplementation(
      ({ onProgress }) =>
        new Promise(() => {
          report = onProgress!;
        }),
    );
    const { addFiles } = mount();
    addFiles([makeFile()]);

    await waitFor(() => expect(mockUploadFile).toHaveBeenCalled());
    report(0.5);
    // The wrapper feeds `value` only into the indicator transform (it never
    // reaches radix's aria-valuenow), so the indicator position IS the
    // observable progress output.
    await screen.findByRole("progressbar");
    await waitFor(() => {
      const indicator = document.querySelector(
        '[data-slot="progress-indicator"]',
      ) as HTMLElement;
      expect(indicator.style.transform).toBe("translateX(-50%)");
    });
  });

  it("approved outcome: reports onUploaded and shows the posted copy", async () => {
    mockUploadFile.mockResolvedValue({
      ok: true,
      status: "approved",
      mediaId: "med-1",
      kind: "photo",
    });
    const { addFiles, onUploaded } = mount();
    const file = makeFile();
    addFiles([file]);

    await screen.findByText("Posted to the gallery");
    expect(onUploaded).toHaveBeenCalledWith({
      mediaId: "med-1",
      file,
      kind: "photo",
      status: "approved",
    });
    // doneCount > 0 mounts the save-account growth prompt (non-demo).
    expect(screen.getByTestId("save-account-prompt")).toBeInTheDocument();
  });

  it("pending outcome shows the waiting-for-approval copy", async () => {
    mockUploadFile.mockResolvedValue({
      ok: true,
      status: "pending",
      mediaId: "med-1",
      kind: "photo",
    });
    const { addFiles } = mount({ event: HOLD_EVENT });
    addFiles([makeFile()]);

    await screen.findByText("Sent, waiting for host approval");
  });

  it("failure marks the item, shows the message, and Retry re-runs it", async () => {
    mockUploadFile
      .mockResolvedValueOnce({ ok: false, message: "That upload failed." })
      .mockResolvedValueOnce({
        ok: true,
        status: "approved",
        mediaId: "med-1",
        kind: "photo",
      });
    const { addFiles } = mount();
    addFiles([makeFile()]);

    await screen.findByText("That upload failed.");
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));

    await screen.findByText("Posted to the gallery");
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
      screen.getByText("The host reviews uploads before they appear in the gallery."),
    ).toBeInTheDocument();
    unmount();

    mount();
    expect(
      screen.queryByText(
        "The host reviews uploads before they appear in the gallery.",
      ),
    ).not.toBeInTheDocument();
  });
});
