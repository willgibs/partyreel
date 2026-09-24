/**
 * THE QUEUE'S RECOVERY FROM SOMEBODY ELSE'S TICKET (the upload-owner lane, 2026-09-23).
 *
 * The routes now refuse a ticket whose row belongs to an account the viewer is not
 * (`session_other_account`). These pin what the queue does about it, which is the half of the fix a
 * guest actually lives through: the ticket goes down (token, name, cookie), the viewer joins again
 * as whoever the server says they are, and the SAME file goes up on the new ticket, so no photograph
 * is lost and none is credited to the ticket's owner. A confirmed account never notices; anyone else
 * is handed to the door while the files wait, never failed.
 *
 * The engine's older pins live in guest-upload.test.tsx (its contract file); these run the hook on
 * its own, because what they pin is the queue's side of a server rule rather than a sheet.
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUploadQueue, type QueueItem } from "@/lib/guest/use-upload-queue";
import { uploadFile, type UploadOutcome } from "@/lib/upload/uploader";

vi.mock("@/lib/upload/uploader", () => ({ uploadFile: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const mockUploadFile = vi.mocked(uploadFile);
const QR = "qr-token-1";
const STALE = "s".repeat(64);

const OTHER_ACCOUNT: UploadOutcome = {
  ok: false,
  code: "session_other_account",
  message:
    "Someone else added photos from this device. Try again to add yours.",
};

function landed(mediaId: string): UploadOutcome {
  return { ok: true, status: "approved", mediaId, kind: "photo" };
}

function makeFile(name = "photo.jpg") {
  return new File([new Uint8Array([1, 2, 3])], name, { type: "image/jpeg" });
}

/** fetch, answered per URL from a queue of bodies (the join and the leave are all the queue calls). */
function answer(routes: Record<string, { ok: boolean; body: unknown }[]>) {
  global.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const next = routes[url]?.shift();
    if (!next) throw new Error(`unexpected fetch ${url}`);
    return {
      ok: next.ok,
      json: async () => next.body,
    } as Response;
  });
}

function fetchUrls() {
  return vi.mocked(global.fetch).mock.calls.map(([url]) => String(url));
}

type Props = {
  sessionToken: string | null;
  isVerified: boolean;
};

function mountQueue(initial: Props) {
  const onSession = vi.fn();
  const onUploaded = vi.fn();
  const onDoorNeeded = vi.fn();
  const onVerificationRequired = vi.fn();
  const hook = renderHook(
    (props: Props) =>
      useUploadQueue({
        qrToken: QR,
        sessionToken: props.sessionToken,
        onSession,
        onUploaded,
        isDemo: false,
        isVerified: props.isVerified,
        onVerificationRequired,
        onDoorNeeded,
      }),
    { initialProps: initial },
  );
  const items = (): QueueItem[] => hook.result.current.items;
  return {
    ...hook,
    onSession,
    onUploaded,
    onDoorNeeded,
    onVerificationRequired,
    items,
  };
}

function sentOn(call: number) {
  return (
    mockUploadFile.mock.calls[call]?.[0].identity as { session_token: string }
  ).session_token;
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  // The device kept a confirmed guest's ticket, and the name the verified door wrote beside it.
  localStorage.setItem(`pr_session_${QR}`, STALE);
  localStorage.setItem(`pr_guest_name_${QR}`, "Hi Will");
  localStorage.setItem("pr_guest_name_last", "Hi Will");
});

describe("a confirmed viewer holding somebody else's ticket", () => {
  it("★ puts the ticket down, joins as themselves, and the SAME file goes up on the new ticket", async () => {
    answer({
      "/api/guests/leave": [{ ok: true, body: { ok: true } }],
      "/api/guests": [
        { ok: true, body: { ok: true, session_token: "fresh-token" } },
      ],
    });
    mockUploadFile
      .mockResolvedValueOnce(OTHER_ACCOUNT)
      .mockResolvedValueOnce(landed("med-1"));
    const file = makeFile();
    const q = mountQueue({ sessionToken: STALE, isVerified: true });

    act(() => q.result.current.addFiles([file]));

    await waitFor(() => expect(q.onUploaded).toHaveBeenCalledTimes(1));
    expect(sentOn(0)).toBe(STALE);
    expect(sentOn(1)).toBe("fresh-token");
    expect(mockUploadFile.mock.calls[1][0].file).toBe(file);
    expect(q.onUploaded).toHaveBeenCalledWith(
      expect.objectContaining({ file }),
    );
    expect(q.items()).toEqual([expect.objectContaining({ status: "done" })]);
    // The ticket went down BEFORE the join, so the join's fresh cookie cannot be expired after it.
    expect(fetchUrls()).toEqual(["/api/guests/leave", "/api/guests"]);
    expect(q.onSession.mock.calls).toEqual([[null], ["fresh-token"]]);
    // Nothing of the ticket's owner outlives it on this device.
    expect(localStorage.getItem(`pr_guest_name_${QR}`)).toBeNull();
    expect(localStorage.getItem("pr_guest_name_last")).toBeNull();
    expect(q.onDoorNeeded).not.toHaveBeenCalled();
  });

  it("the join is silent and nameless: the account's own uid is the identity", async () => {
    answer({
      "/api/guests/leave": [{ ok: true, body: { ok: true } }],
      "/api/guests": [
        { ok: true, body: { ok: true, session_token: "fresh-token" } },
      ],
    });
    mockUploadFile
      .mockResolvedValueOnce(OTHER_ACCOUNT)
      .mockResolvedValueOnce(landed("med-1"));
    const q = mountQueue({ sessionToken: STALE, isVerified: true });
    act(() => q.result.current.addFiles([makeFile()]));
    await waitFor(() => expect(q.onUploaded).toHaveBeenCalled());
    const join = vi
      .mocked(global.fetch)
      .mock.calls.find(([url]) => url === "/api/guests");
    expect(JSON.parse(String((join![1] as RequestInit).body))).toEqual({
      qr_token: QR,
    });
  });

  it("joins silently ONCE per chain: a fresh row refused again goes to the door, never a row factory", async () => {
    answer({
      "/api/guests/leave": [
        { ok: true, body: { ok: true } },
        { ok: true, body: { ok: true } },
      ],
      "/api/guests": [
        { ok: true, body: { ok: true, session_token: "fresh-token" } },
      ],
    });
    mockUploadFile.mockResolvedValue(OTHER_ACCOUNT);
    const q = mountQueue({ sessionToken: STALE, isVerified: true });
    act(() => q.result.current.addFiles([makeFile()]));
    await waitFor(() => expect(q.onDoorNeeded).toHaveBeenCalledTimes(1));
    expect(fetchUrls().filter((u) => u === "/api/guests")).toHaveLength(1);
    expect(mockUploadFile).toHaveBeenCalledTimes(2);
    expect(q.items()).toEqual([expect.objectContaining({ status: "queued" })]);
  });
});

describe("anyone else holding somebody else's ticket", () => {
  it("★ a signed-out viewer meets the door: nothing is failed, the files wait, and go up on the ticket the door hands down", async () => {
    answer({ "/api/guests/leave": [{ ok: true, body: { ok: true } }] });
    mockUploadFile
      .mockResolvedValueOnce(OTHER_ACCOUNT)
      .mockResolvedValueOnce(landed("med-1"))
      .mockResolvedValueOnce(landed("med-2"));
    const q = mountQueue({ sessionToken: STALE, isVerified: false });

    act(() =>
      q.result.current.addFiles([makeFile("a.jpg"), makeFile("b.jpg")]),
    );

    await waitFor(() => expect(q.onDoorNeeded).toHaveBeenCalledTimes(1));
    // No silent join for someone the queue cannot name, and no failure sheet: both files wait.
    expect(fetchUrls()).toEqual(["/api/guests/leave"]);
    expect(q.items().map((it) => it.status)).toEqual(["queued", "queued"]);
    expect(mockUploadFile).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(`pr_session_${QR}`)).toBeNull();

    // The door's name step mints this person their own row and hands its ticket down.
    q.rerender({ sessionToken: "door-token", isVerified: false });

    await waitFor(() => expect(q.onUploaded).toHaveBeenCalledTimes(2));
    expect(sentOn(1)).toBe("door-token");
    expect(sentOn(2)).toBe("door-token");
    expect(q.items().map((it) => it.status)).toEqual(["done", "done"]);
  });

  it("a page that still thinks the viewer is confirmed (a sign-out in another tab) meets the server's 422 and goes to the door", async () => {
    answer({
      "/api/guests/leave": [{ ok: true, body: { ok: true } }],
      "/api/guests": [
        {
          ok: false,
          body: {
            ok: false,
            code: "name_required",
            message: "Add your name to upload.",
          },
        },
      ],
    });
    mockUploadFile.mockResolvedValueOnce(OTHER_ACCOUNT);
    const q = mountQueue({ sessionToken: STALE, isVerified: true });
    act(() => q.result.current.addFiles([makeFile()]));
    await waitFor(() => expect(q.onDoorNeeded).toHaveBeenCalledTimes(1));
    expect(q.items()).toEqual([expect.objectContaining({ status: "queued" })]);
  });
});

describe("a join nobody at the door could fix", () => {
  it("fails the waiting files in place with the join's own sentence, and Retry joins again", async () => {
    answer({
      "/api/guests/leave": [{ ok: true, body: { ok: true } }],
      "/api/guests": [
        {
          ok: false,
          body: {
            ok: false,
            code: "rate_limited",
            message:
              "Too many joins from this network right now. Please try again in a bit.",
          },
        },
        { ok: true, body: { ok: true, session_token: "fresh-token" } },
      ],
    });
    mockUploadFile
      .mockResolvedValueOnce(OTHER_ACCOUNT)
      .mockResolvedValueOnce(landed("med-1"));
    const q = mountQueue({ sessionToken: STALE, isVerified: true });
    act(() => q.result.current.addFiles([makeFile()]));

    await waitFor(() =>
      expect(q.items()).toEqual([
        expect.objectContaining({
          status: "error",
          error:
            "Too many joins from this network right now. Please try again in a bit.",
        }),
      ]),
    );
    expect(q.onDoorNeeded).not.toHaveBeenCalled();

    act(() => q.result.current.retry(q.items()[0].id));
    await waitFor(() => expect(q.onUploaded).toHaveBeenCalledTimes(1));
    expect(sentOn(1)).toBe("fresh-token");
  });
});

describe("the ticket is read per file, never once per run", () => {
  it("★ the verified re-join after a mid-run flip sends the refused file on the NEW ticket", async () => {
    // Before this lane the run captured its ticket once, so this re-join re-sent the file on the
    // SPENT ticket and failed the very run it was written to save.
    answer({
      "/api/guests": [
        { ok: true, body: { ok: true, session_token: "verified-token" } },
      ],
    });
    mockUploadFile
      .mockResolvedValueOnce({
        ok: false,
        code: "verification_required",
        message: "Confirm your email to add photos to this event.",
      })
      .mockResolvedValueOnce(landed("med-1"));
    const q = mountQueue({ sessionToken: STALE, isVerified: true });
    act(() => q.result.current.addFiles([makeFile()]));
    await waitFor(() => expect(q.onUploaded).toHaveBeenCalledTimes(1));
    expect(sentOn(1)).toBe("verified-token");
    expect(q.onVerificationRequired).not.toHaveBeenCalled();
  });
});

describe("the cut's seam (addCutToAlbum)", () => {
  it("sends a cut through the ordinary queue, not reel-eligible, with its poster as the preview", async () => {
    mockUploadFile.mockResolvedValue({
      ok: true,
      status: "approved",
      mediaId: "cut-1",
      kind: "video",
    });
    const cut = new File([new Uint8Array([1, 2, 3])], "cut.mp4", {
      type: "video/mp4",
    });
    const poster = new Blob([new Uint8Array([9])], { type: "image/png" });
    const q = mountQueue({ sessionToken: STALE, isVerified: false });

    act(() => q.result.current.addCut(cut, poster));

    await waitFor(() => expect(q.onUploaded).toHaveBeenCalledTimes(1));
    const sent = mockUploadFile.mock.calls[0][0];
    expect(sent.file).toBe(cut);
    expect(sent.reelEligible).toBe(false);
    expect(sent.poster).toBe(poster);
    expect(q.items()).toEqual([
      expect.objectContaining({ status: "done", kind: "video", reelEligible: false }),
    ]);
  });

  it("an ordinary add says nothing about the reel", async () => {
    mockUploadFile.mockResolvedValue(landed("med-2"));
    const q = mountQueue({ sessionToken: STALE, isVerified: false });
    act(() => q.result.current.addFiles([makeFile()]));
    await waitFor(() => expect(q.onUploaded).toHaveBeenCalledTimes(1));
    expect(mockUploadFile.mock.calls[0][0].reelEligible).toBeUndefined();
    expect(mockUploadFile.mock.calls[0][0].poster).toBeUndefined();
  });

  it("waits for the silent join like any file when the device holds no ticket yet", async () => {
    localStorage.clear();
    answer({
      "/api/guests": [
        { ok: true, body: { ok: true, session_token: "fresh-token" } },
      ],
    });
    mockUploadFile.mockResolvedValue({
      ok: true,
      status: "approved",
      mediaId: "cut-2",
      kind: "video",
    });
    const cut = new File([new Uint8Array([1])], "cut.webm", {
      type: "video/webm",
    });
    const q = mountQueue({ sessionToken: null, isVerified: false });
    act(() => q.result.current.addCut(cut, new Blob([new Uint8Array([1])])));
    await waitFor(() => expect(q.onUploaded).toHaveBeenCalledTimes(1));
    expect(sentOn(0)).toBe("fresh-token");
    expect(mockUploadFile.mock.calls[0][0].reelEligible).toBe(false);
  });
});
