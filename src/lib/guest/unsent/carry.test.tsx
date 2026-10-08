/**
 * WHAT HER PHONE KEPT, THROUGH THE PAGE'S ONE QUEUE (no-signal r1, Will's `carry=phone`). The keep itself is stood in
 * (`use-keep.test.tsx` and `keep.test.ts` hold it); what is pinned is the queue's side: what an earlier page kept goes
 * again by itself as the page opens, under its own ids, and is told as landed as any send is; a kept file the server
 * says is somebody else's ticket is put down, never re-sent as whoever holds the phone now, while a file sent in this
 * page goes on as ever; and the stack is told where a waiting file is held.
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RestoredFile } from "@/lib/guest/unsent/keep";
import { useUploadQueue } from "@/lib/guest/use-upload-queue";
import {
  uploadFile,
  type BurstFile,
  type UploadOutcome,
} from "@/lib/upload/uploader";

const keep = vi.hoisted(() => ({
  onRestore: null as null | ((files: RestoredFile[]) => void),
  onKept: null as null | ((id: string, kept: boolean) => void),
  owner: null as string | null,
  enabled: false,
}));
vi.mock("@/lib/guest/unsent/use-keep", () => ({
  useUnsentKeep: (input: {
    owner: string | null;
    enabled: boolean;
    onRestore: (files: RestoredFile[]) => void;
    onKept: (id: string, kept: boolean) => void;
  }) => {
    keep.onRestore = input.onRestore;
    keep.onKept = input.onKept;
    keep.owner = input.owner;
    keep.enabled = input.enabled;
  },
}));

vi.mock("@/lib/upload/uploader", () => {
  const uploadFile = vi.fn();
  // The burst over the one-file stand-in, as the queue's own pins drive it (`use-upload-queue.test.tsx`).
  const session = new Set([
    "session_other_account",
    "invalid_session",
    "verification_required",
  ]);
  const uploadBurst = vi.fn(
    async (args: {
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
          outcome = (await uploadFile({
            file: one.file,
            endpoints: args.endpoints,
            identity: args.identity,
          })) as UploadOutcome;
          if (!outcome.ok && session.has(outcome.code ?? "")) stop = outcome;
        }
        out.push(outcome);
        args.onOutcome?.(i, outcome);
      }
      return out;
    },
  );
  const hasKeptComplete = vi.fn((_file: File) => false);
  return { uploadFile, uploadBurst, hasKeptComplete };
});
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const mockUploadFile = vi.mocked(uploadFile);
const QR = "qr-carry";
const TICKET = "t".repeat(64);

const landed = (mediaId: string): UploadOutcome => ({
  ok: true,
  status: "approved",
  mediaId,
  kind: "photo",
});
const OTHER_ACCOUNT: UploadOutcome = {
  ok: false,
  code: "session_other_account",
  message:
    "Someone else added photos from this device. Try again to add yours.",
};
const DEAD_TICKET: UploadOutcome = {
  ok: false,
  code: "invalid_session",
  message: "This ticket is no longer valid.",
};

const makeFile = (name: string) =>
  new File([new Uint8Array([1, 2, 3])], name, { type: "image/jpeg" });

/** fetch, answered per URL from a queue of bodies (the join and the leave are all the queue calls). */
function answer(routes: Record<string, { ok: boolean; body: unknown }[]>) {
  global.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const next = routes[url]?.shift();
    if (!next) throw new Error(`unexpected fetch ${url}`);
    return { ok: next.ok, json: async () => next.body } as Response;
  }) as typeof fetch;
}

function mountQueue(props: {
  sessionToken: string | null;
  isVerified: boolean;
}) {
  const onSession = vi.fn();
  const onUploaded = vi.fn();
  const onDoorNeeded = vi.fn();
  const hook = renderHook(() =>
    useUploadQueue({
      qrToken: QR,
      sessionToken: props.sessionToken,
      onSession,
      onUploaded,
      isDemo: false,
      isVerified: props.isVerified,
      onDoorNeeded,
    }),
  );
  return {
    ...hook,
    onSession,
    onUploaded,
    onDoorNeeded,
    items: () => hook.result.current.items,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  keep.onRestore = null;
  keep.onKept = null;
  localStorage.clear();
  localStorage.setItem(`pr_session_${QR}`, TICKET);
});

describe("what her phone kept, as the page opens", () => {
  it("★ files her sends under who they go up as, and copies nothing in the demo or behind a door", () => {
    mountQueue({ sessionToken: TICKET, isVerified: false });
    expect(keep.owner).toBe(`ticket:${TICKET}`);
    expect(keep.enabled).toBe(true);
  });

  it("★ goes again by itself, under its own id, and is told as landed as any send is", async () => {
    answer({});
    mockUploadFile.mockResolvedValueOnce(landed("med-kept"));
    const q = mountQueue({ sessionToken: TICKET, isVerified: false });
    const file = makeFile("IMG_0412.jpg");
    act(() => keep.onRestore!([{ id: "kept-1", file, takenAt: 99 }]));
    await waitFor(() =>
      expect(q.items()).toEqual([
        expect.objectContaining({
          id: "kept-1",
          status: "done",
          mediaId: "med-kept",
        }),
      ]),
    );
    expect(mockUploadFile.mock.calls[0]![0].file).toBe(file);
    expect(q.onUploaded).toHaveBeenCalledWith(
      expect.objectContaining({ queueId: "kept-1", mediaId: "med-kept" }),
    );
    // The camera's moment rode with it (`takenAt`), so the complete claims it as the shot's capture time.
    expect(q.items()[0]).toMatchObject({ takenAt: 99 });
  });

  it("never adds a file twice: one the queue already holds stays the one item", async () => {
    answer({});
    mockUploadFile.mockReturnValue(new Promise<UploadOutcome>(() => {}));
    const q = mountQueue({ sessionToken: TICKET, isVerified: false });
    const file = makeFile("a.jpg");
    act(() => keep.onRestore!([{ id: "kept-1", file }]));
    act(() => keep.onRestore!([{ id: "kept-1", file }]));
    await waitFor(() => expect(q.items()).toHaveLength(1));
  });

  it("★ a kept file the server says is somebody else's ticket is put down, never re-sent as whoever holds the phone now", async () => {
    // A confirmed viewer on a shared phone: the device's ticket is not hers. What she sends in this page goes up as her,
    // as ever; what the phone kept from an earlier page was the ticket's owner's, and is put down.
    answer({
      "/api/guests/leave": [{ ok: true, body: { ok: true } }],
      "/api/guests": [
        { ok: true, body: { ok: true, session_token: "fresh-token" } },
      ],
    });
    mockUploadFile
      .mockResolvedValueOnce(OTHER_ACCOUNT)
      .mockResolvedValueOnce(landed("med-mine"));
    const q = mountQueue({ sessionToken: TICKET, isVerified: true });
    const kept = makeFile("someone-elses.jpg");
    const mine = makeFile("mine.jpg");
    act(() => {
      keep.onRestore!([{ id: "kept-1", file: kept }]);
      q.result.current.addFiles([mine]);
    });
    await waitFor(() =>
      expect(q.items()).toEqual([
        expect.objectContaining({ file: mine, status: "done" }),
      ]),
    );
    // Only her own went again, on her own fresh ticket.
    const sent = mockUploadFile.mock.calls.map(([a]) => a.file.name);
    expect(sent.filter((n) => n === "someone-elses.jpg")).toHaveLength(1);
    expect(
      (
        mockUploadFile.mock.calls.at(-1)![0].identity as {
          session_token: string;
        }
      ).session_token,
    ).toBe("fresh-token");
    expect(q.onUploaded).toHaveBeenCalledTimes(1);
  });

  it("a kept file on a dead ticket goes on: the device's own ticket, its row gone", async () => {
    answer({
      "/api/guests/leave": [{ ok: true, body: { ok: true } }],
      "/api/guests": [
        { ok: true, body: { ok: true, session_token: "fresh-token" } },
      ],
    });
    mockUploadFile
      .mockResolvedValueOnce(DEAD_TICKET)
      .mockResolvedValueOnce(landed("med-kept"));
    const q = mountQueue({ sessionToken: TICKET, isVerified: true });
    act(() => keep.onRestore!([{ id: "kept-1", file: makeFile("a.jpg") }]));
    await waitFor(() =>
      expect(q.items()).toEqual([
        expect.objectContaining({ id: "kept-1", status: "done" }),
      ]),
    );
  });

  it("★ tells the stack where a waiting file is held: on her phone, or in the page alone", async () => {
    answer({});
    mockUploadFile.mockResolvedValueOnce({
      ok: false,
      message: "Your connection dropped. Check your signal, then try again.",
      cause: "dropped",
    });
    const q = mountQueue({ sessionToken: TICKET, isVerified: false });
    act(() => q.result.current.addFiles([makeFile("a.jpg")]));
    await waitFor(() =>
      expect(q.items()[0]).toMatchObject({
        status: "queued",
        cause: "dropped",
      }),
    );
    const id = q.items()[0]!.id;
    const store = q.result.current.progress;
    expect(store.waits?.(id)).toBe("page");
    act(() => keep.onKept!(id, true));
    expect(store.waits?.(id)).toBe("kept");
  });
});
