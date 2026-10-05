import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  uploadFile,
  type BurstFile,
  type UploadOutcome,
} from "@/lib/upload/uploader";

/**
 * ★ THE ALBUM'S OWN STORE BRINGS THE HOST'S BATCH, NEVER A PAGE REFRESH (`event-header` r1's fold-in, the
 * ROADMAP's Host line). `HostUpload` refreshed the whole hub when a batch drained, re-running every read and
 * presign, though the hub's album is a live store the doorbell already moves. Now a drained batch tells the page
 * once (`onBatchLanded`), whose album asks its store, and nothing refreshes the router.
 */
vi.mock("@/lib/upload/uploader", () => {
  const uploadFile = vi.fn();
  // The burst over the one-file stand-in (compute-uploads; the burst's own engine is `uploader.burst.test.ts`'s):
  // each file in turn, in the air then told.
  const uploadBurst = async (args: {
    files: readonly BurstFile[];
    endpoints: { presign: string; complete: string };
    identity: Record<string, string>;
    onOutcome?: (index: number, outcome: UploadOutcome) => void;
  }) => {
    const out: UploadOutcome[] = [];
    for (const [i, one] of args.files.entries()) {
      // One file's own stop (upload-cancel): a file whose signal is aborted before its turn never starts.
      const outcome: UploadOutcome = one.signal?.aborted
        ? {
            ok: false,
            message: "That upload was cancelled.",
            cause: "cancelled",
          }
        : await (async () => {
            one.onSending?.();
            return (await uploadFile({
              file: one.file,
              endpoints: args.endpoints,
              identity: args.identity,
              onProgress: one.onProgress,
              onSent: one.onSent,
              signal: one.signal,
            })) as UploadOutcome;
          })();
      out.push(outcome);
      args.onOutcome?.(i, outcome);
    }
    return out;
  };
  return { uploadFile, uploadBurst };
});
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

/**
 * A ROW IN FLIGHT CAN BE STOPPED, ONE AT A TIME (upload-cancel, E6 for uploads), with a batch of three and the middle
 * one stopped. The x asks in the row (Keep going first, the downloads' words); Stop upload aborts that file alone
 * through its own signal, its siblings land and the page is told once; the stopped row reads "Upload cancelled." with
 * Try again (neutral, never an error) and counts nothing; a row whose bytes are up has no x. The engine's half (the PUT
 * aborted, the siblings recorded together without it) is `uploader.burst.test.ts`'s.
 */
describe("stopping a row", () => {
  const CANCELLED: UploadOutcome = {
    ok: false,
    message: "That upload was cancelled.",
    cause: "cancelled",
  };
  const LANDED = { ok: true } as UploadOutcome;
  /** A file in the air waits for the test to land it, or for its own signal to stop it (as the engine's PUT does). */
  const landing = new Map<string, (outcome: UploadOutcome) => void>();
  const sentOnes = new Map<string, () => void>();
  const signals: Record<string, AbortSignal | undefined> = {};

  function inTheAir() {
    upload.mockImplementation(
      ((args: { file: File; signal?: AbortSignal; onSent?: () => void }) =>
        new Promise<UploadOutcome>((resolve) => {
          landing.set(args.file.name, resolve);
          signals[args.file.name] = args.signal;
          if (args.onSent) sentOnes.set(args.file.name, args.onSent);
          args.signal?.addEventListener("abort", () => resolve(CANCELLED), {
            once: true,
          });
        })) as unknown as typeof uploadFile,
    );
  }
  const land = async (name: string) => {
    await act(async () => {
      landing.get(name)!(LANDED);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  };
  const rowOf = (name: string) => screen.getByText(name).closest("li")!;
  const xOf = (name: string) =>
    within(rowOf(name)).queryByRole("button", { name: `Stop upload: ${name}` });

  beforeEach(() => {
    landing.clear();
    sentOnes.clear();
    for (const k of Object.keys(signals)) delete signals[k];
    inTheAir();
  });

  it("★ the middle one: asks first, aborts that file alone, reads Upload cancelled. with Try again, and its siblings land", async () => {
    const landed = vi.fn();
    render(
      <HostUpload eventId="event-1" videosAllowed onBatchLanded={landed} />,
    );
    await drop([file("a.jpg"), file("b.jpg"), file("c.jpg")]);
    // The first is in the air; every row can be stopped, and none asks yet.
    expect(xOf("a.jpg")).not.toBeNull();
    expect(xOf("b.jpg")).not.toBeNull();
    expect(screen.queryByText("Stop this upload?")).toBeNull();
    await land("a.jpg");
    expect(within(rowOf("a.jpg")).getByText("Added to the album")).toBeTruthy();

    // The middle one is in the air: its x asks first, with Keep going first, and nothing is stopped by the press.
    fireEvent.click(xOf("b.jpg")!);
    const question = within(rowOf("b.jpg")).getByRole("group", {
      name: "Stop this upload?",
    });
    expect(
      within(question)
        .getAllByRole("button")
        .map((b) => b.textContent),
    ).toEqual(["Keep going", "Stop upload"]);
    expect(signals["b.jpg"]!.aborted).toBe(false);

    fireEvent.click(
      within(question).getByRole("button", { name: "Stop upload" }),
    );
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    // Its own signal alone: the first and the last are none the wiser.
    expect(signals["b.jpg"]!.aborted).toBe(true);
    expect(signals["a.jpg"]!.aborted).toBe(false);
    expect(signals["c.jpg"]!.aborted).toBe(false);
    // Neutral and never an error: the words, with the way back, and not the failure's Retry.
    const row = rowOf("b.jpg");
    expect(within(row).getByText("Upload cancelled.")).toBeTruthy();
    expect(within(row).getByRole("button", { name: /Try again/ })).toBeTruthy();
    expect(within(row).queryByRole("button", { name: /Retry/ })).toBeNull();
    expect(xOf("b.jpg")).toBeNull();

    // The last one went on, and the batch told the page once.
    await land("c.jpg");
    expect(within(rowOf("c.jpg")).getByText("Added to the album")).toBeTruthy();
    expect(landed).toHaveBeenCalledTimes(1);
    expect(upload).toHaveBeenCalledTimes(3);
  });

  it("Keep going changes nothing: the question goes, the upload never noticed", async () => {
    render(<HostUpload eventId="event-1" videosAllowed />);
    await drop([file("a.jpg")]);
    fireEvent.click(xOf("a.jpg")!);
    fireEvent.click(screen.getByRole("button", { name: "Keep going" }));
    expect(screen.queryByText("Stop this upload?")).toBeNull();
    expect(signals["a.jpg"]!.aborted).toBe(false);
    // The row's x is back, to ask again.
    expect(xOf("a.jpg")).not.toBeNull();
    await land("a.jpg");
  });

  it("★ Try again puts the same file back in the queue, and it goes up", async () => {
    const landed = vi.fn();
    render(
      <HostUpload eventId="event-1" videosAllowed onBatchLanded={landed} />,
    );
    await drop([file("a.jpg"), file("b.jpg")]);
    fireEvent.click(xOf("a.jpg")!);
    fireEvent.click(screen.getByRole("button", { name: "Stop upload" }));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(within(rowOf("a.jpg")).getByText("Upload cancelled.")).toBeTruthy();
    await land("b.jpg");

    await act(async () => {
      fireEvent.click(
        within(rowOf("a.jpg")).getByRole("button", { name: /Try again/ }),
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    // The very file, in the air again, with a fresh signal.
    expect(upload).toHaveBeenCalledTimes(3);
    expect(upload.mock.calls[2]![0].file.name).toBe("a.jpg");
    expect(signals["a.jpg"]!.aborted).toBe(false);
    await land("a.jpg");
    expect(within(rowOf("a.jpg")).getByText("Added to the album")).toBeTruthy();
  });

  it("a row still waiting for its batch is cancelled where it stands, and is never sent", async () => {
    render(<HostUpload eventId="event-1" videosAllowed />);
    await drop([file("a.jpg")]);
    // A second drop joins the NEXT batch: queued, with no burst of its own yet.
    await drop([file("b.jpg")]);
    fireEvent.click(xOf("b.jpg")!);
    fireEvent.click(screen.getByRole("button", { name: "Stop upload" }));
    expect(within(rowOf("b.jpg")).getByText("Upload cancelled.")).toBeTruthy();
    await land("a.jpg");
    expect(upload).toHaveBeenCalledTimes(1);
  });

  it("★ once its bytes are up (waiting to be recorded with its batch) the row has no x: its complete is coming", async () => {
    render(<HostUpload eventId="event-1" videosAllowed />);
    await drop([file("a.jpg")]);
    expect(xOf("a.jpg")).not.toBeNull();
    await act(async () => {
      sentOnes.get("a.jpg")!();
    });
    expect(xOf("a.jpg")).toBeNull();
    await land("a.jpg");
  });

  it("a row that lands or fails has no x, and a question standing about it goes with it", async () => {
    render(<HostUpload eventId="event-1" videosAllowed />);
    await drop([file("a.jpg")]);
    fireEvent.click(xOf("a.jpg")!);
    expect(screen.queryByText("Stop this upload?")).not.toBeNull();
    await land("a.jpg");
    expect(screen.queryByText("Stop this upload?")).toBeNull();
    expect(xOf("a.jpg")).toBeNull();
  });
});
