/**
 * STOPPING ONE FILE OF THE GUEST'S QUEUE (upload-cancel, E6 for uploads). What is held, with a burst of three and the
 * middle one stopped: each file of a burst carries a stop of its own and only that file's is aborted; the stopped file
 * LEAVES the queue (no `error` item for the failure sheet, the ring or her uploads to count, and `onUploaded` never
 * hears of it, so nothing is counted) while its siblings land; `stop` hands back a Try again that sends the same file
 * again; a stop that comes too late hands back nothing and the file is as it landed; a file still waiting for its burst
 * leaves at once; and the demo rehearses the same.
 *
 * The uploader's own half (a PUT aborted, the siblings recorded together without it, a complete never aborted) is
 * `uploader.burst.test.ts`'s; here the uploader is a stand-in that honours each file's signal as the engine does.
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useUploadQueue, type QueueItem } from "@/lib/guest/use-upload-queue";
import {
  uploadBurst,
  type BurstFile,
  type UploadOutcome,
} from "@/lib/upload/uploader";

/**
 * What lets a file in the air land, by name; what says its bytes are up (the engine's `onSent`: it now waits, whole, to
 * be recorded); and the files whose abort comes too late to count (a complete asked).
 */
const { landing, bytesUp, tooLate } = vi.hoisted(() => ({
  landing: new Map<string, (outcome: UploadOutcome) => void>(),
  bytesUp: new Map<string, () => void>(),
  tooLate: new Set<string>(),
}));

vi.mock("@/lib/upload/uploader", () => {
  const cancelled: UploadOutcome = {
    ok: false,
    message: "That upload was cancelled.",
    cause: "cancelled",
  };
  return {
    UPLOAD_WORDS: { cancelled: "That upload was cancelled." },
    // The engine's contract for one file's stop: a file whose signal is aborted settles cancelled (never started, or
    // aborted in the air), unless its complete is already asked; its siblings go on.
    uploadBurst: vi.fn(
      async (args: {
        files: readonly BurstFile[];
        onOutcome?: (index: number, outcome: UploadOutcome) => void;
      }) => {
        const out: UploadOutcome[] = [];
        for (const [i, one] of args.files.entries()) {
          let outcome: UploadOutcome;
          if (one.signal?.aborted) {
            outcome = cancelled;
          } else {
            one.onSending?.();
            bytesUp.set(one.file.name, () => one.onSent?.());
            outcome = await new Promise<UploadOutcome>((resolve) => {
              landing.set(one.file.name, resolve);
              one.signal?.addEventListener(
                "abort",
                () => {
                  if (!tooLate.has(one.file.name)) resolve(cancelled);
                },
                { once: true },
              );
            });
          }
          out.push(outcome);
          args.onOutcome?.(i, outcome);
        }
        return out;
      },
    ),
  };
});
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const burst = vi.mocked(uploadBurst);
const QR = "qr-token-1";

const landed = (mediaId: string): UploadOutcome => ({
  ok: true,
  status: "approved",
  mediaId,
  kind: "photo",
});
const file = (name: string) =>
  new File([new Uint8Array([1, 2, 3])], name, { type: "image/jpeg" });

function mount(isDemo = false) {
  const onUploaded = vi.fn();
  const hook = renderHook(() =>
    useUploadQueue({
      qrToken: QR,
      sessionToken: "t",
      onSession: vi.fn(),
      onUploaded,
      isDemo,
    }),
  );
  const items = (): QueueItem[] => hook.result.current.items;
  const idOf = (name: string) =>
    items().find((it) => it.file.name === name)!.id;
  const statuses = () => items().map((it) => [it.file.name, it.status]);
  return { ...hook, onUploaded, items, idOf, statuses };
}

/** Let a file in the air land, then give the queue its turn. */
async function land(name: string, outcome: UploadOutcome) {
  await act(async () => {
    landing.get(name)!(outcome);
    await Promise.resolve();
  });
}

/** Its bytes are up: the file waits, whole, to be recorded (the queue holds it `queued` at 100). */
async function up(name: string) {
  await act(async () => {
    bytesUp.get(name)!();
    await Promise.resolve();
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  landing.clear();
  bytesUp.clear();
  tooLate.clear();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("a burst of three, the middle one stopped", () => {
  it("★ only that file's signal is aborted; it leaves the queue (no failure), its siblings land, and nothing is counted for it", async () => {
    const q = mount();
    await act(async () =>
      q.result.current.addFiles([file("a.jpg"), file("b.jpg"), file("c.jpg")]),
    );
    // One burst, one stop a file, none aborted yet.
    const sent = burst.mock.calls[0]![0].files;
    expect(sent.map((f) => f.signal?.aborted)).toEqual([false, false, false]);
    expect(new Set(sent.map((f) => f.signal)).size).toBe(3);

    await land("a.jpg", landed("m-a"));
    expect(q.statuses()).toEqual([
      ["a.jpg", "done"],
      ["b.jpg", "uploading"],
      ["c.jpg", "queued"],
    ]);

    // The middle one is in the air: stop it.
    let result: Awaited<ReturnType<typeof q.result.current.stop>> = null;
    await act(async () => {
      result = await q.result.current.stop(q.idOf("b.jpg"));
    });
    expect(result).toBeTypeOf("function");
    expect(sent.map((f) => f.signal?.aborted)).toEqual([false, true, false]);
    // It is gone from the queue, and nothing is an error: the failure sheet has nothing to list.
    expect(q.statuses()).toEqual([
      ["a.jpg", "done"],
      ["c.jpg", "uploading"],
    ]);
    expect(q.items().some((it) => it.status === "error")).toBe(false);

    await land("c.jpg", landed("m-c"));
    expect(q.statuses()).toEqual([
      ["a.jpg", "done"],
      ["c.jpg", "done"],
    ]);
    // Only the two that landed were told to the album: nothing was recorded, so nothing is counted, for the stopped one.
    expect(q.onUploaded.mock.calls.map(([u]) => u.mediaId)).toEqual([
      "m-a",
      "m-c",
    ]);
  });

  it("★ its Try again sends the same file again as a fresh try", async () => {
    const q = mount();
    await act(async () =>
      q.result.current.addFiles([file("a.jpg"), file("b.jpg"), file("c.jpg")]),
    );
    await land("a.jpg", landed("m-a"));
    let again: Awaited<ReturnType<typeof q.result.current.stop>> = null;
    await act(async () => {
      again = await q.result.current.stop(q.idOf("b.jpg"));
    });
    await land("c.jpg", landed("m-c"));
    expect(burst).toHaveBeenCalledTimes(1);

    await act(async () => again!());
    // A burst of its own, the very file she stopped, uploading.
    expect(burst).toHaveBeenCalledTimes(2);
    expect(burst.mock.calls[1]![0].files.map((f) => f.file.name)).toEqual([
      "b.jpg",
    ]);
    await land("b.jpg", landed("m-b"));
    expect(q.onUploaded.mock.calls.map(([u]) => u.mediaId)).toEqual([
      "m-a",
      "m-c",
      "m-b",
    ]);
    expect(q.statuses().every(([, status]) => status === "done")).toBe(true);
  });

  it("the first and the last can be stopped the same way: the file in the air, and one that has not started", async () => {
    const q = mount();
    await act(async () =>
      q.result.current.addFiles([file("a.jpg"), file("b.jpg"), file("c.jpg")]),
    );
    // c has not started (the stand-in sends one at a time): its stop is aborted before it begins.
    await act(async () => {
      void q.result.current.stop(q.idOf("c.jpg"));
    });
    await act(async () => {
      void q.result.current.stop(q.idOf("a.jpg"));
    });
    await land("b.jpg", landed("m-b"));
    expect(q.statuses()).toEqual([["b.jpg", "done"]]);
    expect(q.onUploaded.mock.calls.map(([u]) => u.mediaId)).toEqual(["m-b"]);
  });
});

describe("the store the album's stack reads", () => {
  it("★ carries the queue's own stop: a stop through it ends that file alone, and an unbound store answers too late", async () => {
    const q = mount();
    await act(async () =>
      q.result.current.addFiles([file("a.jpg"), file("b.jpg")]),
    );
    const { progress } = q.result.current;
    expect(progress.stop).toBeTypeOf("function");
    let result: Awaited<ReturnType<NonNullable<typeof progress.stop>>> = null;
    await act(async () => {
      result = await progress.stop!(q.idOf("a.jpg"));
    });
    expect(result).toBeTypeOf("function");
    expect(q.statuses()).toEqual([["b.jpg", "uploading"]]);
    await land("b.jpg", landed("m-b"));
    expect(q.onUploaded).toHaveBeenCalledTimes(1);
  });
});

describe("a stop that cannot be one", () => {
  it("too late (its complete is asked): it lands as it would have, and stop hands back nothing", async () => {
    tooLate.add("a.jpg");
    const q = mount();
    await act(async () => q.result.current.addFiles([file("a.jpg")]));
    const asked = q.result.current.stop(q.idOf("a.jpg"));
    await land("a.jpg", landed("m-a"));
    await expect(asked).resolves.toBeNull();
    expect(q.statuses()).toEqual([["a.jpg", "done"]]);
    expect(q.onUploaded).toHaveBeenCalledTimes(1);
  });

  it("★ too late is answered AT ONCE, not at the landing: a file whose bytes are up with nothing left to send has its complete coming, so the press closes its question now and aborts nothing", async () => {
    // The engine ignores the abort of a file whose complete is asked (the stand-in, as `tooLate` says).
    tooLate.add("a.jpg");
    const q = mount();
    await act(async () => q.result.current.addFiles([file("a.jpg")]));
    const id = q.idOf("a.jpg");
    await up("a.jpg");
    expect(q.statuses()).toEqual([["a.jpg", "queued"]]);

    // The answer is in hand before anything lands (the old stop waited for the landing, which on a real complete is
    // seconds: the question stood there unchanged and the press read as unheard).
    let answer: unknown = "waiting";
    await act(async () => {
      void q.result.current.stop(id).then((r) => {
        answer = r;
      });
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(answer).toBeNull();
    // Nothing was aborted: the file lands exactly as it would have, and is told to the album once.
    expect(burst.mock.calls[0]![0].files[0]!.signal?.aborted).toBe(false);
    expect(q.statuses()).toEqual([["a.jpg", "queued"]]);
    await land("a.jpg", landed("m-a"));
    expect(q.statuses()).toEqual([["a.jpg", "done"]]);
    expect(q.onUploaded.mock.calls.map(([u]) => u.mediaId)).toEqual(["m-a"]);
  });

  it("a file whose bytes are up while a sibling still goes is only waiting for it: nothing is asked yet, so its stop still takes it back", async () => {
    const q = mount();
    await act(async () =>
      q.result.current.addFiles([file("a.jpg"), file("b.jpg")]),
    );
    await up("a.jpg");
    expect(q.statuses()).toEqual([
      ["a.jpg", "queued"],
      ["b.jpg", "queued"],
    ]);
    let result: Awaited<ReturnType<typeof q.result.current.stop>> = null;
    await act(async () => {
      result = await q.result.current.stop(q.idOf("a.jpg"));
    });
    // Cancelled, with the way to send it again; it left the queue and b goes on.
    expect(result).toBeTypeOf("function");
    expect(burst.mock.calls[0]![0].files[0]!.signal?.aborted).toBe(true);
    expect(q.statuses()).toEqual([["b.jpg", "uploading"]]);
  });

  it("a file that is done, or none at all: nothing to stop", async () => {
    const q = mount();
    await act(async () => q.result.current.addFiles([file("a.jpg")]));
    const id = q.idOf("a.jpg");
    await land("a.jpg", landed("m-a"));
    await expect(q.result.current.stop(id)).resolves.toBeNull();
    await expect(q.result.current.stop("nobody")).resolves.toBeNull();
    expect(q.statuses()).toEqual([["a.jpg", "done"]]);
  });

  it("a refusal that beat the stop is the failure it was: the stop says nothing and the file keeps its sentence", async () => {
    tooLate.add("a.jpg");
    const q = mount();
    await act(async () => q.result.current.addFiles([file("a.jpg")]));
    const asked = q.result.current.stop(q.idOf("a.jpg"));
    await land("a.jpg", { ok: false, message: "That file is too big." });
    await expect(asked).resolves.toBeNull();
    expect(q.items()).toEqual([
      expect.objectContaining({
        status: "error",
        error: "That file is too big.",
      }),
    ]);
  });
});

describe("a file still waiting for its burst", () => {
  it("leaves at once, started nothing, and is never sent", async () => {
    const q = mount();
    await act(async () => q.result.current.addFiles([file("a.jpg")]));
    // A second pick joins the NEXT burst: it is queued, with no stop of its own yet.
    await act(async () => q.result.current.addFiles([file("b.jpg")]));
    expect(q.statuses()).toEqual([
      ["a.jpg", "uploading"],
      ["b.jpg", "queued"],
    ]);
    let again: Awaited<ReturnType<typeof q.result.current.stop>> = null;
    await act(async () => {
      again = await q.result.current.stop(q.idOf("b.jpg"));
    });
    expect(again).toBeTypeOf("function");
    expect(q.statuses()).toEqual([["a.jpg", "uploading"]]);
    await land("a.jpg", landed("m-a"));
    expect(burst).toHaveBeenCalledTimes(1);
    expect(q.statuses()).toEqual([["a.jpg", "done"]]);
  });
});

describe("the demo rehearses it too", () => {
  it("a demo file stopped mid-ramp is cancelled and leaves the queue; the next goes on", async () => {
    vi.useFakeTimers();
    const q = mount(true);
    await act(async () => {
      q.result.current.addFiles([file("a.jpg"), file("b.jpg")]);
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(q.statuses()).toEqual([
      ["a.jpg", "uploading"],
      ["b.jpg", "queued"],
    ]);
    // Her stop on the file in the air; the next ramp step notices it.
    let result: Awaited<ReturnType<typeof q.result.current.stop>> = null;
    const asked = q.result.current.stop(q.idOf("a.jpg"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(130);
      result = await asked;
    });
    expect(result).toBeTypeOf("function");
    expect(q.statuses()).toEqual([["b.jpg", "uploading"]]);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(q.statuses()).toEqual([["b.jpg", "done"]]);
    expect(q.onUploaded).toHaveBeenCalledTimes(1);
  });
});
