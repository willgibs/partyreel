import { act, fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { uploadFile, type UploadOutcome } from "@/lib/upload/uploader";

/**
 * ★ THE ALBUM'S OWN STORE BRINGS THE HOST'S BATCH, NEVER A PAGE REFRESH (`event-header` r1's fold-in, the
 * ROADMAP's Host line). `HostUpload` refreshed the whole hub when a batch drained, re-running every read and
 * presign, though the hub's album is a live store the doorbell already moves. Now a drained batch tells the page
 * once (`onBatchLanded`), whose album asks its store, and nothing refreshes the router.
 */
vi.mock("@/lib/upload/uploader", () => ({ uploadFile: vi.fn() }));
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const { HostUpload } = await import("@/components/app/host-upload");
const upload = vi.mocked(uploadFile);

const file = (name: string) => new File(["x"], name, { type: "image/jpeg" });

async function drop(files: File[]) {
  const input = document.querySelector<HTMLInputElement>("input[type=file]")!;
  await act(async () => {
    fireEvent.change(input, { target: { files } });
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

beforeEach(() => {
  upload.mockReset();
  refresh.mockReset();
});

describe("a drained batch", () => {
  it("★ tells the page once, whatever its size, and never refreshes the router", async () => {
    upload.mockResolvedValue({ ok: true } as UploadOutcome);
    const landed = vi.fn();
    render(
      <HostUpload eventId="event-1" videosAllowed onBatchLanded={landed} />,
    );
    await drop([file("a.jpg"), file("b.jpg"), file("c.jpg")]);
    expect(upload).toHaveBeenCalledTimes(3);
    expect(landed).toHaveBeenCalledTimes(1);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("says nothing when nothing in it landed", async () => {
    upload.mockResolvedValue({
      ok: false,
      message: "Too big.",
    } as UploadOutcome);
    const landed = vi.fn();
    render(
      <HostUpload eventId="event-1" videosAllowed onBatchLanded={landed} />,
    );
    await drop([file("a.jpg")]);
    expect(landed).not.toHaveBeenCalled();
  });
});
