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
import {
  createRef,
  StrictMode,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import type { GuestEvent } from "@/lib/db/queries/guest-events";
import {
  useUploadQueue,
  type QueueItem,
  type QueueProgress,
  type UploadedItem,
} from "@/lib/guest/use-upload-queue";
import {
  uploadFile,
  type BurstFile,
  type UploadOutcome,
} from "@/lib/upload/uploader";
import { MAX_UPLOAD_BYTES } from "@/lib/media/limits";
import { formatBytes } from "@/lib/utils";

import { GuestUpload, type GuestUploadHandle } from "./guest-upload";

vi.mock("@/lib/upload/uploader", () => {
  const uploadFile = vi.fn();
  // ★ THE BURST OVER THE ONE-FILE STAND-IN (compute-uploads): the queue sends what waits as one burst
  // (`uploadBurst`, whose own engine `uploader.burst.test.ts` holds); here it drives `uploadFile` file by file,
  // each in the air then told, and a refusal of the session is every later file's, never asked again (the burst's
  // own rule for a refusal of who is sending).
  const session = new Set([
    "session_other_account",
    "invalid_session",
    "verification_required",
  ]);
  const uploadBurst = async (args: {
    files: readonly BurstFile[];
    endpoints: { presign: string; complete: string };
    identity: Record<string, string>;
    onOutcome?: (index: number, outcome: UploadOutcome) => void;
  }) => {
    const out: UploadOutcome[] = [];
    let stop: UploadOutcome | null = null;
    for (const [i, one] of args.files.entries()) {
      let outcome: UploadOutcome;
      if (stop) {
        outcome = stop;
      } else {
        one.onSending?.();
        try {
          outcome = (await uploadFile({
            file: one.file,
            endpoints: args.endpoints,
            identity: args.identity,
            onProgress: one.onProgress,
            reelEligible: one.reelEligible,
            poster: one.poster,
          })) as UploadOutcome;
        } catch {
          // uploadBurst never rejects: one file's throw is that file's alone.
          outcome = {
            ok: false,
            message: "Something went wrong with that upload. Please try again.",
          };
        }
        if (!outcome.ok && session.has(outcome.code ?? "")) stop = outcome;
      }
      out.push(outcome);
      args.onOutcome?.(i, outcome);
    }
    return out;
  };
  return { uploadFile, uploadBurst };
});
// The claim prompt OWNS the post-upload slot: it resolves the viewer and
// decides which single card stands, which is its own contract
// (claim-handle-prompt.test.tsx) and its own supabase call. Stubbed to a marker
// carrying the count it was handed, so what stays pinned HERE is the thing this
// file is about: the slot mounts on doneCount > 0, or on a confirmation's return
// (`moment`), and never in the demo. (A signed-out guest's ask to keep is the
// door's last screen now, `entry-modal.test.tsx`, never a card in this slot.)
vi.mock("@/components/guest/claim-handle-prompt", () => ({
  ClaimHandlePrompt: ({ doneCount }: { doneCount: number }) => (
    <div data-testid="post-upload-slot" data-count={doneCount} />
  ),
}));

// The album's camera is its own chunk (`guest-upload.tsx`'s `loadCamera`): stood in for by a camera that says whether
// it is open and hands a shot to the queue as the real one does (the camera's own pins: `components/guest/camera/`).
// What the camera was last handed of the album (its develop time, which the page's live reading decides).
const camera = vi.hoisted(() => ({
  event: null as Record<string, unknown> | null,
}));
vi.mock("@/components/guest/camera/album-camera", () => ({
  AlbumCamera: ({
    open,
    onAddFiles,
    onOpenChange,
    event,
  }: {
    open: boolean;
    onAddFiles: (files: File[]) => void;
    onOpenChange: (open: boolean) => void;
    event: Record<string, unknown>;
  }) => {
    camera.event = event;
    return open ? (
      <div data-testid="album-camera">
        <button
          type="button"
          onClick={() =>
            onAddFiles([
              new File([new Uint8Array([1, 2, 3])], "shot.jpg", {
                type: "image/jpeg",
              }),
            ])
          }
        >
          Shoot
        </button>
        <button type="button" onClick={() => onOpenChange(false)}>
          Close the camera
        </button>
      </div>
    ) : null;
  },
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

/** The queue's own doors, for a test that must add or retry while the slot is gone (the page's, not the slot's). */
type QueueApi = Pick<ReturnType<typeof useUploadQueue>, "addFiles" | "retry">;

/**
 * The page shell's own shape, small enough to read: the queue lives here, `GuestUpload` is handed
 * its snapshot and the three callbacks, and the test drives it through the real sheets.
 *
 * `showSlot` is the page's access flip (`event-experience.tsx` mounts the slot only at `full`): off, the
 * slot is gone and the queue is not, exactly as when a gate takes the album's slot down.
 */
function Harness({
  handleRef,
  queueRef,
  showSlot = true,
  onSession,
  onUploaded,
  onQueueChange,
  onProgressStore,
  onVerificationRequired,
  isDemo = false,
  isVerified = false,
  sessionToken = "sess-1",
  ...rest
}: {
  handleRef: React.RefObject<GuestUploadHandle | null>;
  queueRef?: React.RefObject<QueueApi | null>;
  showSlot?: boolean;
  onSession: (token: string | null) => void;
  onUploaded: (item: UploadedItem) => void;
  onQueueChange?: (items: QueueItem[]) => void;
  onProgressStore?: (progress: QueueProgress) => void;
  onVerificationRequired?: (message: string) => void;
  isDemo?: boolean;
  isVerified?: boolean;
  sessionToken?: string | null;
  event?: GuestEvent;
  suppressFailures?: boolean;
  moment?: boolean;
  removedIds?: ReadonlySet<string>;
  capBytes?: number | null;
  uploadsWait?: { waits: boolean; developsAt: string | null };
}) {
  const pendingRef = useRef<string | null>(null);
  const { items, progress, addFiles, retry, dismiss } = useUploadQueue({
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
  useImperativeHandle(queueRef, () => ({ addFiles, retry }), [addFiles, retry]);
  useEffect(() => {
    onQueueChange?.(items);
  }, [items, onQueueChange]);
  useEffect(() => {
    onProgressStore?.(progress);
  }, [progress, onProgressStore]);
  if (!showSlot) return null;
  return (
    <GuestUpload
      ref={handleRef}
      event={rest.event ?? EVENT}
      qrToken="qr-token-1"
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
      capBytes={rest.capBytes}
      uploadsWait={rest.uploadsWait}
    />
  );
}

/**
 * THE WHOLE FRONT OF THE ACT, as a guest performs it: open the sheet, choose
 * from the album, then SEND on the review step. Nothing reaches the queue
 * before that last tap, which is the point of the step.
 */
function sendThroughSheet(
  handleRef: React.RefObject<GuestUploadHandle | null>,
  files: File[],
) {
  act(() => handleRef.current!.openAdd());
  const album = document.querySelector(
    'input[type="file"][multiple]',
  ) as HTMLInputElement;
  fireEvent.change(album, { target: { files } });
  fireEvent.click(screen.getByRole("button", { name: `Send ${files.length}` }));
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
  const addFiles = (files: File[]) => sendThroughSheet(handleRef, files);
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

  // Per-file progress is drawn by the album's stack tile, which subscribes to the queue's PROGRESS
  // STORE itself (album-guest-wiring: a tick used to rewrite `items` and re-render the page's whole
  // shell once a frame). So onProgress reaches the store at 50%, and the snapshot a status change
  // wrote stands untouched by the tick.
  it("patches per-file progress through the onProgress callback, into the progress store", async () => {
    let report!: (f: number) => void;
    mockUploadFile.mockImplementation(
      ({ onProgress }) =>
        new Promise(() => {
          report = onProgress!;
        }),
    );
    const { addFiles, snapshots, store } = mountWithQueue();
    addFiles([makeFile()]);

    await waitFor(() => expect(mockUploadFile).toHaveBeenCalled());
    const before = snapshots.length;
    report(0.5);
    const item = snapshots.at(-1)![0];
    await waitFor(() => expect(store.progress?.get(item.id)).toBe(50));
    expect(item).toMatchObject({ status: "uploading", progress: 0 });
    // The tick wrote no new snapshot: nothing that reads `items` re-rendered for it.
    expect(snapshots.length).toBe(before);
  });

  it("approved outcome: reports onUploaded and mounts the post-upload slot", async () => {
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
    // contract here is the payload + the post-upload slot.
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
    // doneCount > 0 mounts the post-upload slot (non-demo).
    await screen.findByTestId("post-upload-slot");
  });

  // ★ RESHAPED (voice-wiring): the answer this names moved from the album's waiting tile to her
  // uploads (voice-guest r2, `held=uploads`). The scar kept: no toast, and the queue item carries
  // the outcome and the media id her tracker reads.
  it("a HELD outcome says nothing here: her uploads' badge and list are the whole answer", async () => {
    mockUploadFile.mockResolvedValue({
      ok: true,
      status: "pending",
      mediaId: "med-1",
      kind: "photo",
    });
    const { addFiles, snapshots } = mountWithQueue({ event: HOLD_EVENT });
    addFiles([makeFile()]);

    // Her tracker answers, never a toast. What it needs is on the queue item:
    // the outcome AND the media id, which is the only way her uploads can tell
    // it has been let in later.
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

  // Reshaped on purpose (crumbs-43): this pinned that the flip DROPS the session, which minted a second guest row
  // under the same name on every road back (the switch turned off again, a confirmation that could not claim a
  // ticket the device no longer held). The scar it keeps: the run ends at the flip, one sheet, the server's line.
  it("a mid-run verification_required refuses the rest, keeps the ticket, and the sheet says the server's own line", async () => {
    // Three files: the first goes, the second meets the flip, and the third
    // must never be tried — the switch refuses all of them alike.
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

    // One sheet, both remaining files on it, one true sentence.
    const sheet = await screen.findByText("2 of 3 didn't upload");
    expect(sheet).toBeInTheDocument();
    expect(
      screen.getAllByText("This event now needs a confirmed email."),
    ).toHaveLength(2);
    // The run ENDED here rather than walking into a third refusal.
    expect(mockUploadFile).toHaveBeenCalledTimes(2);
    // And her ticket stands: the switch, not the row, refused the files.
    expect(onSession).not.toHaveBeenCalledWith(null);
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

    await screen.findByText("1 of 1 didn't upload");
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

    await screen.findByText("1 of 1 didn't upload");
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(onVerificationRequired).toHaveBeenCalledTimes(1);
  });

  it("Retry also closes the sheet and fires the deferred refresh — the gate, never a dead stall", async () => {
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

    await screen.findByText("1 of 1 didn't upload");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
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
    expect(screen.queryByText(/didn't upload/)).toBeNull();
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
    // The post-upload slot never shows in the demo.
    expect(screen.queryByTestId("post-upload-slot")).not.toBeInTheDocument();
  });
});

// RESHAPED TWICE (the-wait r1, `model=time`): the notice said "The host reviews uploads before they appear in the
// album.", then the wait's rule ("Uploads develop as Maya lets each one in."), here, beside the sheet that said it again.
// The rule is the album's wait's line now (`gallery-empty-state-wait.test.tsx`, where its scars moved: only an album
// that waits says it, and a develop that has come says none). The scar kept here: the slot says no rule of its own.
describe("GuestUpload: moderation copy", () => {
  it("says no rule of its own, held or live: the album's wait says it", () => {
    const { unmount } = mount({ event: HOLD_EVENT });
    expect(screen.queryByText(/^Uploads develop/)).not.toBeInTheDocument();
    unmount();

    mount();
    expect(screen.queryByText(/^Uploads develop/)).not.toBeInTheDocument();
  });
});

/* ── The act's two ends ───────────────────────────────────────────────────── */

describe("GuestUpload: the add sheet is the only door in", () => {
  it("openAdd opens the sheet, and nothing is queued until Send", () => {
    const { handleRef, snapshots } = mountWithQueue();
    // Closed, the choice is not in the document at all; its two inputs are, in
    // the page, because they must outlive the menu a row closes (`popups` r1,
    // `choices=menu`: the inputs once lived inside the sheet, a reason expired).
    expect(document.querySelector('[data-slot^="responsive-menu"]')).toBeNull();
    expect(document.querySelectorAll('input[type="file"]')).toHaveLength(2);

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

/* ── THE ALBUM'S OWN CAP, SAID BEFORE THE PICKER (crumbs-43; ROADMAP: "the upload sheet's terms line states the
   product's limits rather than the host's own cap"). The page hands the sheet the cap a guest's file meets
   (`events.max_upload_bytes`, never the host's on her own album), and the line says that number, so the first
   time a guest reads the limit is not inside a refusal. ── */
describe("GuestUpload: the Add sheet says the album's own cap", () => {
  it("states the host's per-file cap the page hands it, and the product's ceiling without one", () => {
    const cap = 100 * 1024 ** 2;
    const capped = mount({ capBytes: cap });
    act(() => capped.handleRef.current!.openAdd());
    expect(
      screen.getByText(`Photos and videos, up to ${formatBytes(cap)} each.`),
    ).toBeInTheDocument();
    capped.unmount();

    const plain = mount();
    act(() => plain.handleRef.current!.openAdd());
    expect(
      screen.getByText(
        `Photos and videos, up to ${formatBytes(MAX_UPLOAD_BYTES)} each.`,
      ),
    ).toBeInTheDocument();
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
      expect(screen.getByText("1 of 2 didn't upload")).toBeInTheDocument(),
    );
    expect(screen.getByText("That upload failed.")).toBeInTheDocument();
    expect(screen.getByText("a.jpg")).toBeInTheDocument();
    // A refused file is the sheet's to report, never an upload error toast's.
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("★ draws a dropped connection apart from a refusal: the queue's cause reaches the sheet, whatever the words", async () => {
    mockUploadFile
      .mockResolvedValueOnce({
        ok: false,
        message: "The line went quiet.",
        cause: "dropped",
      })
      .mockResolvedValueOnce({
        ok: false,
        code: "storage_error",
        message: "That upload failed.",
      });
    const { addFiles } = mount();
    addFiles([makeFile("a.jpg"), makeFile("b.jpg")]);

    await waitFor(() =>
      expect(screen.getByText("2 of 2 didn't upload")).toBeInTheDocument(),
    );
    const marked = document.querySelectorAll('[data-cause="dropped"]');
    expect(marked).toHaveLength(1);
    expect(marked[0]).toHaveTextContent("a.jpg");
    expect(marked[0].querySelector("svg.lucide-wifi-off")).not.toBeNull();
    expect(
      screen.getByText("That upload failed.").closest("li"),
    ).not.toHaveAttribute("data-cause");
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
    expect(screen.queryByText(/didn't upload/)).toBeNull();
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
      expect(screen.getByText("1 of 1 didn't upload")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /Retry/ }));
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
      expect(screen.getByText("1 of 1 didn't upload")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(screen.queryByText("1 of 1 didn't upload")).not.toBeInTheDocument();

    // A second, unrelated run - clean end to end - must judge itself only by
    // what is STILL in the queue, not by the failure dismissed a moment ago.
    addFiles([makeFile("clean.jpg")]);
    await waitFor(() => expect(mockUploadFile).toHaveBeenCalledTimes(2));
    await new Promise((r) => setTimeout(r, 30));
    expect(screen.queryByText(/didn't upload/)).toBeNull();
  });

  it("Retry both still re-queues every listed file (the close behind it never eats them)", async () => {
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
      expect(screen.getByText("2 of 2 didn't upload")).toBeInTheDocument(),
    );
    // Retry both closes the sheet on top of the very ids it just re-queued -
    // the `dismiss` that retires a dismissed failure must not treat a retried
    // id as an abandoned one.
    fireEvent.click(screen.getByRole("button", { name: /Retry both/ }));

    await waitFor(() => {
      const last = snapshots.at(-1)!;
      expect(last).toHaveLength(2);
      expect(last.every((it) => it.status === "done")).toBe(true);
    });
    expect(mockUploadFile).toHaveBeenCalledTimes(4);
    expect(screen.queryByText(/didn't upload/)).toBeNull();
  });
});

/**
 * ★ A FAILURE THE SLOT NEVER REPORTED IS NOT THE NEXT RUN'S (crumbs-47; build 38's red-team, W3 #3, LOW: "after the
 * flip, the next run's end reopens the OLD failure sheet ('1 of 1 didn't upload ... Confirm your email to add photos
 * to this event.') and its Retry sends the refused file"). The album's slot stands only at full access
 * (`event-experience.tsx`), so a gate takes it down and the page's queue outlives it. A file the flip refused, then
 * refused AGAIN once its Retry went up as the page re-gated, stayed in the queue as an error nobody was shown, and
 * the slot that mounted when the gate fell away listed it at the end of the next run, whatever that run did (a
 * landed file, a clean twelve), under a count that read "1 of 1" for a run that had gone through. The slot judges
 * only what failed in front of it, and what its own open sheet was listing goes with it when it goes (the re-gate),
 * as it does by every other way the sheet closes.
 */
describe("GuestUpload: a failure the slot never reported is not the next run's (crumbs-47)", () => {
  const REFUSED = {
    ok: false as const,
    code: "verification_required",
    message: "Confirm your email to add photos to this event.",
  };
  const LANDED = {
    ok: true as const,
    status: "approved",
    mediaId: "med-2",
    kind: "photo" as const,
  };

  /**
   * The page: its queue, and the slot the access flip mounts (`slot`) and takes down (`regate`) around it.
   * `strict` wears development's StrictMode, whose simulated unmount of a fresh mount must dismiss nothing.
   */
  function mountGated(
    props: Record<string, unknown> = {},
    slot = true,
    strict = false,
  ) {
    const onSession = vi.fn();
    const onUploaded = vi.fn();
    const handleRef = createRef<GuestUploadHandle>();
    const queueRef = createRef<QueueApi>();
    const snapshots: QueueItem[][] = [];
    const tree = (showSlot: boolean) => {
      const page = (
        <Harness
          handleRef={handleRef}
          queueRef={queueRef}
          showSlot={showSlot}
          onSession={onSession}
          onUploaded={onUploaded}
          onQueueChange={(items) => snapshots.push(items)}
          {...props}
        />
      );
      return strict ? <StrictMode>{page}</StrictMode> : page;
    };
    const view = render(tree(slot));
    return {
      handleRef,
      queueRef,
      snapshots,
      /** The page re-gates a viewer who was in the album: the slot is gone, the queue is not. */
      regate: () => view.rerender(tree(false)),
      /** The gate falls away: the slot mounts afresh over the queue the page kept. */
      ungate: () => view.rerender(tree(true)),
    };
  }
  const last = (g: ReturnType<typeof mountGated>) => g.snapshots.at(-1)!;

  it("★ the re-gate takes the slot down under its open sheet, and the refused file goes with it", async () => {
    mockUploadFile.mockReset();
    mockUploadFile.mockResolvedValue(REFUSED);
    const gated = mountGated();
    sendThroughSheet(gated.handleRef, [makeFile("rt38-i.jpg")]);
    await screen.findByText("1 of 1 didn't upload");

    // The access flip: the slot goes, sheet and all, with no close for the sheet to dismiss through.
    gated.regate();
    await act(async () => {});
    expect(screen.queryByText(/didn't upload/)).toBeNull();
    expect(last(gated).filter((it) => it.status === "error")).toEqual([]);
  });

  it("★ a refusal that lands while the slot is gone is nobody's to report: the next run's end never opens on it", async () => {
    mockUploadFile.mockReset();
    let refuseAgain!: () => void;
    mockUploadFile
      .mockResolvedValueOnce(REFUSED)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            refuseAgain = () => resolve(REFUSED);
          }),
      )
      .mockResolvedValue(LANDED);
    const gated = mountGated();
    sendThroughSheet(gated.handleRef, [makeFile("rt38-i.jpg")]);
    await screen.findByText("1 of 1 didn't upload");

    // Its Retry closes the sheet and sends the file again while the page re-gates,
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(mockUploadFile).toHaveBeenCalledTimes(2));
    gated.regate();
    // and the second refusal lands with no slot standing to show it.
    await act(async () => refuseAgain());
    await waitFor(() =>
      expect(last(gated)).toMatchObject([{ status: "error" }]),
    );

    // The host turned the switch off again: the gate falls away, the slot mounts over the same queue, her next Add lands.
    gated.ungate();
    sendThroughSheet(gated.handleRef, [makeFile("rt38-j.jpg")]);
    await waitFor(() => expect(mockUploadFile).toHaveBeenCalledTimes(3));
    await waitFor(() =>
      expect(last(gated).some((it) => it.status === "done")).toBe(true),
    );
    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });
    // No old sheet, so no Retry that sends the refused file once more.
    expect(screen.queryByText(/didn't upload/)).toBeNull();
    expect(mockUploadFile).toHaveBeenCalledTimes(3);
  });

  it("under StrictMode's double effect, a fresh mount dismisses nothing, and the re-gate still takes the refused file with it", async () => {
    mockUploadFile.mockReset();
    mockUploadFile.mockResolvedValue(REFUSED);
    // A failure already in the queue when the slot mounts (carried), then a run that fails in front of it.
    const gated = mountGated({}, false, true);
    act(() => gated.queueRef.current!.addFiles([makeFile("old.jpg")]));
    await waitFor(() =>
      expect(last(gated)).toMatchObject([{ status: "error" }]),
    );
    gated.ungate();
    expect(last(gated)).toMatchObject([{ status: "error" }]);
    expect(screen.queryByText(/didn't upload/)).toBeNull();

    sendThroughSheet(gated.handleRef, [makeFile("new.jpg")]);
    await screen.findByText("1 of 1 didn't upload");
    expect(screen.getByText("new.jpg")).toBeInTheDocument();
    expect(screen.queryByText("old.jpg")).toBeNull();

    gated.regate();
    await act(async () => {});
    // The sheet's own file went with the slot; the one it never listed is still the queue's, unreported and unlisted.
    expect(last(gated).map((it) => it.file.name)).toEqual(["old.jpg"]);
  });

  it("a slot that mounts mid-run reports that run's failures: nobody else was going to", async () => {
    mockUploadFile.mockReset();
    let landB!: () => void;
    mockUploadFile
      .mockResolvedValueOnce({ ok: false, message: "That upload failed." })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            landB = () => resolve(LANDED);
          }),
      );
    // The door's run, handed to the album when its first file landed: a is refused, b still going.
    const gated = mountGated({}, false);
    act(() =>
      gated.queueRef.current!.addFiles([makeFile("a.jpg"), makeFile("b.jpg")]),
    );
    await waitFor(() => expect(mockUploadFile).toHaveBeenCalledTimes(2));
    gated.ungate();
    await act(async () => landB());

    expect(await screen.findByText(/didn't upload/)).toBeInTheDocument();
    expect(screen.getByText("a.jpg")).toBeInTheDocument();
  });

  it("a failure the slot carried in, sent again and refused again, is that run's own and is reported", async () => {
    mockUploadFile.mockReset();
    mockUploadFile.mockResolvedValue({ ok: false, message: "Nope." });
    const gated = mountGated({}, false);
    act(() => gated.queueRef.current!.addFiles([makeFile("a.jpg")]));
    await waitFor(() =>
      expect(last(gated)).toMatchObject([{ status: "error" }]),
    );
    gated.ungate();
    expect(screen.queryByText(/didn't upload/)).toBeNull();

    // The door's own Retry, not the sheet's: the same file goes up again and is refused again.
    act(() => gated.queueRef.current!.retry(last(gated)[0].id));
    expect(await screen.findByText(/didn't upload/)).toBeInTheDocument();
    expect(screen.getByText("a.jpg")).toBeInTheDocument();
  });

  it("sending one failure again leaves the others on the sheet that is listing them", async () => {
    mockUploadFile.mockReset();
    mockUploadFile
      .mockResolvedValueOnce({ ok: false, message: "Nope A." })
      .mockResolvedValueOnce({ ok: false, message: "Nope B." })
      .mockResolvedValue(LANDED);
    const gated = mountGated();
    sendThroughSheet(gated.handleRef, [makeFile("a.jpg"), makeFile("b.jpg")]);
    await screen.findByText("2 of 2 didn't upload");

    // a.jpg's own row Retry: its run starts and ends with b.jpg still refused, still on the open sheet.
    fireEvent.click(screen.getAllByRole("button", { name: "Retry" })[0]);
    await waitFor(() => expect(mockUploadFile).toHaveBeenCalledTimes(3));
    await waitFor(() =>
      expect(last(gated).map((it) => it.status)).toEqual(["done", "error"]),
    );
    expect(screen.getByText("b.jpg")).toBeInTheDocument();
    expect(screen.getByText("Nope B.")).toBeInTheDocument();
    // ★ (crumbs-76) and its heading counts what it lists inside the run it belongs to: one of the two that went
    // out together did not, never "1 of 0" (a Retry adds no item for a count by length to find).
    expect(screen.getByText("1 of 2 didn't upload")).toBeInTheDocument();
  });

  /* ★ THE FAILURE HEADING COUNTS THE RUN'S OWN FILES (crumbs-76; ROADMAP: "a Retry that fails again, or a slot mounted
     mid-run, reads '1 of 0 didn't upload'"). The count was the queue's length less a baseline taken at the run's
     start, and a Retry adds no item. */
  /* ★ RED-TEAM 54 ON THE SAME SHEET: "after one row's Retry the sheet reads 'N of 0 didn't upload'" and "'Everything else
     is in Will Gibson's album.' under '5 of 5 didn't upload'". Five files that all failed are a run that failed whole (no
     rest to speak of), and one row's Retry goes on the same go: the whole stays five. */
  it("★ five files that all failed read '5 of 5' with no 'Everything else', and one row's Retry reads '4 of 5', never '4 of 0'", async () => {
    mockUploadFile.mockReset();
    mockUploadFile
      .mockResolvedValueOnce({ ok: false, message: "Nope 1." })
      .mockResolvedValueOnce({ ok: false, message: "Nope 2." })
      .mockResolvedValueOnce({ ok: false, message: "Nope 3." })
      .mockResolvedValueOnce({ ok: false, message: "Nope 4." })
      .mockResolvedValueOnce({ ok: false, message: "Nope 5." })
      .mockResolvedValue(LANDED);
    const gated = mountGated();
    sendThroughSheet(
      gated.handleRef,
      ["a", "b", "c", "d", "e"].map((n) => makeFile(`${n}.jpg`)),
    );
    await screen.findByText("5 of 5 didn't upload");
    expect(screen.queryByText(/Everything else/)).toBeNull();

    // The first row's own Retry (the primary above them is Retry all 5).
    const rowRetries = screen
      .getAllByRole("button", { name: "Retry" })
      .filter((b) => b.closest("li"));
    expect(rowRetries).toHaveLength(5);
    fireEvent.click(rowRetries[0]!);
    await waitFor(() => expect(mockUploadFile).toHaveBeenCalledTimes(6));
    await waitFor(() =>
      expect(last(gated).map((it) => it.status)).toEqual([
        "done",
        "error",
        "error",
        "error",
        "error",
      ]),
    );
    expect(await screen.findByText("4 of 5 didn't upload")).toBeInTheDocument();
    expect(screen.queryByText(/ of 0 /)).toBeNull();
    // One of the five did go, so the rest line is true now.
    expect(
      screen.getByText("Everything else is in Maya’s album."),
    ).toBeInTheDocument();
  });

  /* ★ A REFUSAL OF THE FILE ITSELF THAT THE UPLOADER MADE LOCALLY HAS NO RETRY (red-team 54's LOW): the uploader refuses a
     wrong type before any request and says no code, so the queue read it as a transport failure, and the sheet offered a
     Retry whose press sent nothing. The queue tells it as the file's own refusal now (`localRefusalCode`). */
  it("★ offers no Retry on a file the uploader refused itself, and says what she can do; a file that was only the line's keeps its Retry", async () => {
    mockUploadFile.mockReset();
    mockUploadFile.mockResolvedValue({
      ok: false,
      message: "That file type isn't supported.",
    });
    const gated = mountGated();
    act(() => gated.handleRef.current!.openAdd());
    const album = document.querySelector(
      'input[type="file"][multiple]',
    ) as HTMLInputElement;
    fireEvent.change(album, {
      target: {
        files: [
          new File([new Uint8Array([1])], "notes.txt", { type: "text/plain" }),
        ],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send 1" }));
    await screen.findByText("1 of 1 didn't upload");
    expect(
      screen.getByText("That file type isn't supported."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Retry/ })).toBeNull();
    expect(screen.getByText("Pick something else to add.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
  });

  it("keeps its Retry for a valid file whose failure carries no code (the server's error answer, a line that was not quite down)", async () => {
    mockUploadFile.mockReset();
    mockUploadFile.mockResolvedValue({
      ok: false,
      message: "That upload didn't go through. Please try again.",
    });
    const gated = mountGated();
    sendThroughSheet(gated.handleRef, [makeFile("a.jpg")]);
    await screen.findByText("1 of 1 didn't upload");
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.queryByText(/Pick something else/)).toBeNull();
  });

  it("★ a Retry that fails again says '1 of 1 didn't upload', never '1 of 0'", async () => {
    mockUploadFile.mockReset();
    mockUploadFile.mockResolvedValue({ ok: false, message: "Nope." });
    const gated = mountGated();
    sendThroughSheet(gated.handleRef, [makeFile("a.jpg")]);
    await screen.findByText("1 of 1 didn't upload");

    // Its Retry closes the sheet and sends the file again: the run is the one file going again.
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(mockUploadFile).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("1 of 1 didn't upload")).toBeInTheDocument();
    expect(screen.queryByText(/ of 0 /)).toBeNull();
  });

  it("★ a slot that mounts mid-run heads the whole run it ends with, never '1 of 0'", async () => {
    mockUploadFile.mockReset();
    let refuseB!: () => void;
    mockUploadFile.mockResolvedValueOnce(LANDED).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          refuseB = () => resolve({ ok: false, message: "Nope." });
        }),
    );
    // The door's run, handed to the album while it goes: a has landed, b is still in the air.
    const gated = mountGated({}, false);
    act(() =>
      gated.queueRef.current!.addFiles([makeFile("a.jpg"), makeFile("b.jpg")]),
    );
    await waitFor(() => expect(mockUploadFile).toHaveBeenCalledTimes(2));
    gated.ungate();
    await act(async () => refuseB());

    expect(await screen.findByText("1 of 2 didn't upload")).toBeInTheDocument();
  });

  it("★ a single Retry of three failures beside one that landed counts what it lists inside its run", async () => {
    mockUploadFile.mockReset();
    mockUploadFile
      .mockResolvedValueOnce({ ok: false, message: "Nope A." })
      .mockResolvedValueOnce({ ok: false, message: "Nope B." })
      .mockResolvedValueOnce(LANDED)
      // a.jpg's Retry goes up and is refused again.
      .mockResolvedValue({ ok: false, message: "Nope A again." });
    const gated = mountGated();
    sendThroughSheet(gated.handleRef, [
      makeFile("a.jpg"),
      makeFile("b.jpg"),
      makeFile("c.jpg"),
    ]);
    await screen.findByText("2 of 3 didn't upload");

    fireEvent.click(screen.getAllByRole("button", { name: "Retry" })[0]);
    await waitFor(() => expect(mockUploadFile).toHaveBeenCalledTimes(4));
    await waitFor(() =>
      expect(last(gated).map((it) => it.status)).toEqual([
        "error",
        "error",
        "done",
      ]),
    );
    // Both are listed again, with a.jpg's new refusal, in the run they belong to: never "2 of 1".
    expect(await screen.findByText("2 of 3 didn't upload")).toBeInTheDocument();
    expect(screen.getByText("Nope A again.")).toBeInTheDocument();
  });
});

// ─── The lifted queue + the imperative handle ────────────────────────────────
// These pin the subscriber surface (onQueueChange snapshots + handle.retry),
// which the in-gallery tiles read.

function mountWithQueue(props?: Record<string, unknown>) {
  const snapshots: QueueItem[][] = [];
  const store: { progress: QueueProgress | null } = { progress: null };
  return {
    ...mount({
      ...props,
      onQueueChange: (items: QueueItem[]) => snapshots.push(items),
      onProgressStore: (progress: QueueProgress) => {
        store.progress = progress;
      },
    }),
    snapshots,
    store,
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
    const { addFiles, snapshots, store } = mountWithQueue();
    addFiles([makeFile()]);

    await waitFor(() => expect(mockUploadFile).toHaveBeenCalled());
    report(0.5);
    await waitFor(() => {
      const last = snapshots.at(-1)!;
      expect(last[0]).toMatchObject({ kind: "photo", status: "uploading" });
      // The live progress is the store's (see the progress pin above).
      expect(store.progress?.get(last[0].id)).toBe(50);
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
    expect(await screen.findByTestId("post-upload-slot")).toBeInTheDocument();
  });

  it("stays empty without it until something is uploaded", () => {
    mount();
    expect(screen.queryByTestId("post-upload-slot")).toBeNull();
  });

  it("never stands in the demo, moment or not", () => {
    mount({ moment: true, isDemo: true, sessionToken: null });
    expect(screen.queryByTestId("post-upload-slot")).toBeNull();
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
      document.querySelector(
        'input[type="file"][multiple]',
      ) as HTMLInputElement,
      { target: { files: [makeFile("a.jpg"), makeFile("b.jpg")] } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Send 2" }));
    await waitFor(() =>
      expect(
        screen.getByTestId("post-upload-slot").getAttribute("data-count"),
      ).toBe("2"),
    );

    rerender(harness(new Set(["med-1"])));
    expect(
      screen.getByTestId("post-upload-slot").getAttribute("data-count"),
    ).toBe("1");

    rerender(harness(new Set(["med-1", "med-2"])));
    expect(screen.queryByTestId("post-upload-slot")).toBeNull();
  });
});

/* ── THE ALBUM'S CAMERA (disposable-camera): on an album whose host chose it, the one Add opens the camera, and its
   shots come back through the same queue and the same failure sheet. The camera is its own chunk, stood in for here by
   a camera that says whether it is open and hands a shot to the queue as the real one does. ── */

const CAMERA_EVENT = {
  ...EVENT,
  capture: "camera",
  roll_size: 24,
  develops_at: null,
} as unknown as GuestEvent;

/** Add, on a camera album: the camera's chunk resolves inside the press's own act. */
async function openCamera(
  handleRef: React.RefObject<GuestUploadHandle | null>,
) {
  await act(async () => {
    handleRef.current!.openAdd();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("GuestUpload: the album's camera", () => {
  it("★ every Add opens the camera on an album whose host chose it, never the add sheet", async () => {
    const { handleRef } = mount({ event: CAMERA_EVENT });
    await openCamera(handleRef);
    expect(await screen.findByTestId("album-camera")).toBeInTheDocument();
    expect(screen.queryByText("Take a photo")).toBeNull();
    expect(document.querySelector('input[type="file"]')).toBeNull();
  });

  it("a shot goes up through the page's one queue, as any upload does", async () => {
    mockUploadFile.mockResolvedValue({
      ok: true,
      status: "approved",
      mediaId: "shot-1",
      kind: "photo",
    });
    const { handleRef, onUploaded } = mount({ event: CAMERA_EVENT });
    await openCamera(handleRef);
    fireEvent.click(await screen.findByRole("button", { name: "Shoot" }));
    await waitFor(() => expect(onUploaded).toHaveBeenCalledTimes(1));
    expect(mockUploadFile.mock.calls[0][0].file.name).toBe("shot.jpg");
  });

  it("★ the failure sheet waits while the camera covers the screen, and opens on what failed once it closes", async () => {
    mockUploadFile.mockResolvedValue({
      ok: false,
      message: "Network error during upload.",
    });
    const { handleRef } = mount({ event: CAMERA_EVENT });
    await openCamera(handleRef);
    fireEvent.click(await screen.findByRole("button", { name: "Shoot" }));
    await waitFor(() => expect(mockUploadFile).toHaveBeenCalledTimes(1));
    await act(async () => {});
    expect(screen.queryByText(/didn't upload/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Close the camera" }));
    expect(await screen.findByText("1 of 1 didn't upload")).toBeInTheDocument();
  });
});

/* ── ★ AN ALBUM THAT DEVELOPS LATER (build 43's red-team, the upload half): "delayed" is approve-each OR a develop
   time ahead. What she adds there is sealed by the server; it lands `sealed` (no album tile, never "joined"), and the
   album says so before her first add (its wait's rule, `gallery-empty-state-wait.test.tsx`). ── */

describe("GuestUpload: an album that develops later", () => {
  const DEVELOP_EVENT = {
    ...EVENT,
    moderation_mode: "live",
    develops_at: new Date(Date.now() + 6 * 3_600_000).toISOString(),
  } as unknown as GuestEvent;

  /* ★ RED-TEAM 44'S LOW: the line read the event the page rendered with, so it promised a develop over an album that
     had developed while the page stood open. It is the page's live reading's now (`useLiveUploadsWait`), and the line
     itself the album's wait's (`gallery-empty-state-wait.test.tsx`); the camera hears the same reading. */
  it("★ follows the page's live reading: a develop that has come is the camera's too", async () => {
    const { rerender, handleRef } = mount({
      event: { ...DEVELOP_EVENT, capture: "camera" },
      uploadsWait: { waits: true, developsAt: DEVELOP_EVENT.develops_at },
    });
    rerender(
      <Harness
        handleRef={handleRef}
        onSession={vi.fn()}
        onUploaded={vi.fn()}
        event={{ ...DEVELOP_EVENT, capture: "camera" } as unknown as GuestEvent}
        uploadsWait={{ waits: false, developsAt: null }}
      />,
    );
    await openCamera(handleRef);
    expect(camera.event?.develops_at).toBeNull();
  });

  it("★ a run that ends with a refusal says the rest waits for the develop, never that it is in the album (red-team 44)", async () => {
    mockUploadFile
      .mockResolvedValueOnce({ ok: false, message: "That upload failed." })
      .mockResolvedValueOnce({
        ok: true,
        status: "approved",
        mediaId: "sealed-2",
        kind: "photo",
        sealed: true,
      });
    const { addFiles } = mount({
      event: DEVELOP_EVENT,
      // The page's one reading of the album (`useLiveUploadsWait`).
      uploadsWait: { waits: true, developsAt: DEVELOP_EVENT.develops_at },
    });
    addFiles([makeFile("a.jpg"), makeFile("b.jpg")]);
    await waitFor(() =>
      expect(screen.getByText("1 of 2 didn't upload")).toBeInTheDocument(),
    );
    expect(
      screen.getByText(/^Everything else develops with everyone's/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Everything else is in /)).toBeNull();
  });

  it("★ tells an upload the server sealed as sealed: nothing draws it in the album", async () => {
    mockUploadFile.mockResolvedValue({
      ok: true,
      status: "approved",
      mediaId: "sealed-1",
      kind: "photo",
      sealed: true,
    });
    const { addFiles, onUploaded } = mount({ event: DEVELOP_EVENT });
    addFiles([makeFile()]);
    await waitFor(() => expect(onUploaded).toHaveBeenCalledTimes(1));
    expect(onUploaded).toHaveBeenCalledWith(
      expect.objectContaining({ mediaId: "sealed-1", status: "sealed" }),
    );
  });
});
