/**
 * THE QUEUE'S RECOVERY FROM SOMEBODY ELSE'S TICKET, AND FROM A DEAD ONE.
 *
 * The routes refuse a ticket whose row belongs to an account the viewer is not
 * (`session_other_account`), and one whose row is gone (`invalid_session`). These pin what the queue
 * does about it, which is the half of that rule a guest actually lives through: the ticket goes down
 * (token, name, cookie), the viewer joins again as whoever the server says they are, and the SAME file
 * goes up on the new ticket, so no photograph is lost and none is credited to the ticket's owner. A
 * confirmed account never notices; anyone else is handed to the door while the files wait, never failed.
 *
 * The engine's other pins live in guest-upload.test.tsx (its test file); these run the hook on
 * its own, because what they pin is the queue's side of a server rule rather than a sheet.
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useLiveQueue,
  useQueueProgress,
  useUploadQueue,
  type QueueItem,
  type QueueProgress,
} from "@/lib/guest/use-upload-queue";
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
  /** The page's door lets the viewer through to the album (its access is not `none`); true unless a test says. */
  doorOpen?: boolean;
  /** The album is the viewer's own: her event's id, and her Add is the host's (null for everyone else). */
  ownerEventId?: string | null;
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
        doorOpen: props.doorOpen,
        ownerEventId: props.ownerEventId,
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

/**
 * A DEAD TICKET (crumbs-21): a newcomer waiting at letting each person in, or at the invite list, whose
 * door then became a password lost her waiting ticket with her ask (migration 20260929230000), and the
 * phone that asked still holds its token. After she unlocks, her Add meets `invalid_session`, which
 * used to fail the file with "Refresh and rejoin" (a refresh keeps the stored token, so it never could).
 */
const DEAD: UploadOutcome = {
  ok: false,
  code: "invalid_session",
  message: "Your upload session has expired. Refresh and rejoin.",
};

describe("a dead ticket: the row it named is gone", () => {
  it("★ puts it down, joins afresh as the confirmed account, and the SAME file goes up on the new ticket", async () => {
    answer({
      "/api/guests/leave": [{ ok: true, body: { ok: true } }],
      "/api/guests": [
        { ok: true, body: { ok: true, session_token: "past-the-password" } },
      ],
    });
    mockUploadFile
      .mockResolvedValueOnce(DEAD)
      .mockResolvedValueOnce(landed("med-1"));
    const file = makeFile();
    const q = mountQueue({ sessionToken: STALE, isVerified: true });

    act(() => q.result.current.addFiles([file]));

    await waitFor(() => expect(q.onUploaded).toHaveBeenCalledTimes(1));
    expect(sentOn(0)).toBe(STALE);
    expect(sentOn(1)).toBe("past-the-password");
    expect(mockUploadFile.mock.calls[1][0].file).toBe(file);
    expect(q.items()).toEqual([expect.objectContaining({ status: "done" })]);
    // Down before the join, both halves, so the join's fresh cookie outlives the leave.
    expect(fetchUrls()).toEqual(["/api/guests/leave", "/api/guests"]);
    expect(localStorage.getItem(`pr_session_${QR}`)).toBeNull();
    expect(q.onSession.mock.calls).toEqual([[null], ["past-the-password"]]);
    expect(q.onDoorNeeded).not.toHaveBeenCalled();
  });

  it("joins silently once per chain: a second dead ticket goes to the door, never a loop", async () => {
    answer({
      "/api/guests/leave": [
        { ok: true, body: { ok: true } },
        { ok: true, body: { ok: true } },
      ],
      "/api/guests": [
        { ok: true, body: { ok: true, session_token: "also-dead" } },
      ],
    });
    mockUploadFile.mockResolvedValue(DEAD);
    const q = mountQueue({ sessionToken: STALE, isVerified: true });
    act(() => q.result.current.addFiles([makeFile()]));
    await waitFor(() => expect(q.onDoorNeeded).toHaveBeenCalledTimes(1));
    expect(fetchUrls().filter((u) => u === "/api/guests")).toHaveLength(1);
    expect(mockUploadFile).toHaveBeenCalledTimes(2);
    expect(q.items()).toEqual([expect.objectContaining({ status: "queued" })]);
  });

  it("anyone the queue cannot name meets the door: the file waits, never failed", async () => {
    answer({ "/api/guests/leave": [{ ok: true, body: { ok: true } }] });
    mockUploadFile.mockResolvedValueOnce(DEAD);
    const q = mountQueue({ sessionToken: STALE, isVerified: false });
    act(() => q.result.current.addFiles([makeFile()]));
    await waitFor(() => expect(q.onDoorNeeded).toHaveBeenCalledTimes(1));
    expect(fetchUrls()).toEqual(["/api/guests/leave"]);
    expect(q.items()).toEqual([expect.objectContaining({ status: "queued" })]);
  });
});

/**
 * A JOIN THAT LANDS WAITING IS THE ASK, NEVER A TICKET TO SEND ON (crumbs-27). Where the host lets each guest in,
 * a confirmed newcomer's join mints her a WAITING row (`admission: "waiting"`); a file sent on it is refused "This
 * event is private." (the door reads a waiting ticket as a private album's), so the queue used to take the ticket,
 * send the file and fail it, when the truth was that the host had not let her in yet. It hands her to the door
 * instead: the page refreshes onto the held door (the join's own cookie is the ticket the door reads there), the
 * files wait `queued`, and they go the moment the door lets her through.
 */
const WAITING = {
  ok: true,
  session_token: "waiting-token",
  admission: "waiting",
};
const LET_IN = { ok: true, session_token: "in-token", admission: "in" };

describe("a silent join that lands waiting is handed to the door", () => {
  it("★ after somebody else's ticket went down: the file is not sent on the waiting ticket and not failed, and the door has her", async () => {
    answer({
      "/api/guests/leave": [{ ok: true, body: { ok: true } }],
      "/api/guests": [{ ok: true, body: WAITING }],
    });
    mockUploadFile.mockResolvedValue(landed("med-1"));
    mockUploadFile.mockResolvedValueOnce(OTHER_ACCOUNT);
    const q = mountQueue({ sessionToken: STALE, isVerified: true });

    act(() => q.result.current.addFiles([makeFile()]));

    await waitFor(() => expect(q.onDoorNeeded).toHaveBeenCalledTimes(1));
    // Only the refused attempt on the ticket that was not hers: nothing goes up on the waiting one.
    expect(mockUploadFile).toHaveBeenCalledTimes(1);
    expect(sentOn(0)).toBe(STALE);
    expect(q.items()).toEqual([expect.objectContaining({ status: "queued" })]);
    // The ticket went down, and nothing adopts the waiting one here: the door reads its cookie, and the
    // ticket the files go up on is the one she is handed once she is let in.
    expect(q.onSession.mock.calls).toEqual([[null]]);
    expect(q.onUploaded).not.toHaveBeenCalled();
    expect(fetchUrls()).toEqual(["/api/guests/leave", "/api/guests"]);
  });

  it("★ and the files go up, on a ticket of hers, the moment the door lets her through", async () => {
    answer({
      "/api/guests/leave": [{ ok: true, body: { ok: true } }],
      "/api/guests": [
        { ok: true, body: WAITING },
        { ok: true, body: LET_IN },
      ],
    });
    mockUploadFile.mockResolvedValue(landed("med-1"));
    mockUploadFile.mockResolvedValueOnce(OTHER_ACCOUNT);
    const file = makeFile();
    const q = mountQueue({ sessionToken: STALE, isVerified: true });
    act(() => q.result.current.addFiles([file]));
    await waitFor(() => expect(q.onDoorNeeded).toHaveBeenCalledTimes(1));

    // The refresh lands on the held door (access none): nothing runs behind it.
    q.rerender({ sessionToken: null, isVerified: true, doorOpen: false });
    expect(mockUploadFile).toHaveBeenCalledTimes(1);

    // The host lets her in; the page refreshes onto the album.
    q.rerender({ sessionToken: null, isVerified: true, doorOpen: true });
    await waitFor(() => expect(q.onUploaded).toHaveBeenCalledTimes(1));
    expect(sentOn(1)).toBe("in-token");
    expect(mockUploadFile.mock.calls[1][0].file).toBe(file);
    expect(q.items()).toEqual([expect.objectContaining({ status: "done" })]);
    // She was let in, so this join asks nobody and mints her ticket (the chain starts over).
    expect(fetchUrls().filter((u) => u === "/api/guests")).toHaveLength(2);
    expect(q.onSession.mock.calls).toEqual([[null], ["in-token"]]);
    expect(q.onDoorNeeded).toHaveBeenCalledTimes(1);
  });

  it("the door opening with nothing waiting starts nothing", () => {
    answer({});
    const q = mountQueue({ sessionToken: STALE, isVerified: true });
    q.rerender({ sessionToken: STALE, isVerified: true, doorOpen: false });
    q.rerender({ sessionToken: STALE, isVerified: true, doorOpen: true });
    expect(mockUploadFile).not.toHaveBeenCalled();
    expect(fetchUrls()).toEqual([]);
  });

  it("a first Add with no ticket that lands waiting keeps her picks queued for the door, never sent, never failed", async () => {
    localStorage.clear();
    answer({ "/api/guests": [{ ok: true, body: WAITING }] });
    mockUploadFile.mockResolvedValue(landed("med-1"));
    const q = mountQueue({ sessionToken: null, isVerified: true });
    const clip = new File([new Uint8Array([1])], "clip.webm", {
      type: "video/webm",
    });

    act(() =>
      q.result.current.addFiles([makeFile("a.jpg"), makeFile("b.jpg")]),
    );

    await waitFor(() => expect(q.onDoorNeeded).toHaveBeenCalledTimes(1));
    expect(mockUploadFile).not.toHaveBeenCalled();
    expect(q.items().map((it) => it.status)).toEqual(["queued", "queued"]);
    expect(q.onSession).not.toHaveBeenCalled();
    // One join for the whole pick: the runner does not join again behind the stash.
    expect(fetchUrls()).toEqual(["/api/guests"]);
    // The clip's seam rides the same hold.
    act(() => q.result.current.addClip(clip, new Blob([new Uint8Array([1])])));
    expect(mockUploadFile).not.toHaveBeenCalled();
  });

  it("★ the verified re-join after a mid-run flip that lands waiting holds the file too, and lets go of the spent ticket", async () => {
    answer({
      "/api/guests": [
        { ok: true, body: WAITING },
        { ok: true, body: LET_IN },
      ],
    });
    mockUploadFile.mockResolvedValue(landed("med-1"));
    mockUploadFile.mockResolvedValueOnce({
      ok: false,
      code: "verification_required",
      message: "Confirm your email to add photos to this event.",
    });
    const q = mountQueue({ sessionToken: STALE, isVerified: true });

    act(() => q.result.current.addFiles([makeFile()]));

    await waitFor(() => expect(q.onDoorNeeded).toHaveBeenCalledTimes(1));
    expect(mockUploadFile).toHaveBeenCalledTimes(1);
    expect(q.items()).toEqual([expect.objectContaining({ status: "queued" })]);
    expect(q.onVerificationRequired).not.toHaveBeenCalled();
    // The ticket the flip spent is let go, or the file would go up on it once she is let in.
    expect(q.onSession.mock.calls).toEqual([[null]]);

    q.rerender({ sessionToken: null, isVerified: true, doorOpen: false });
    q.rerender({ sessionToken: null, isVerified: true, doorOpen: true });
    await waitFor(() => expect(q.onUploaded).toHaveBeenCalledTimes(1));
    expect(sentOn(1)).toBe("in-token");
  });

  it("a join that lets her straight in is adopted as ever", async () => {
    answer({
      "/api/guests/leave": [{ ok: true, body: { ok: true } }],
      "/api/guests": [{ ok: true, body: LET_IN }],
    });
    mockUploadFile
      .mockResolvedValueOnce(OTHER_ACCOUNT)
      .mockResolvedValueOnce(landed("med-1"));
    const q = mountQueue({ sessionToken: STALE, isVerified: true });
    act(() => q.result.current.addFiles([makeFile()]));
    await waitFor(() => expect(q.onUploaded).toHaveBeenCalledTimes(1));
    expect(sentOn(1)).toBe("in-token");
    expect(q.onDoorNeeded).not.toHaveBeenCalled();
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
    // A run that captured its ticket once would re-send this file on the SPENT ticket and fail
    // the very run the re-join exists to save.
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

describe("the clip's seam (addClipToAlbum)", () => {
  it("sends a clip through the ordinary queue, not reel-eligible, with its poster as the preview", async () => {
    mockUploadFile.mockResolvedValue({
      ok: true,
      status: "approved",
      mediaId: "clip-1",
      kind: "video",
    });
    const clip = new File([new Uint8Array([1, 2, 3])], "clip.mp4", {
      type: "video/mp4",
    });
    const poster = new Blob([new Uint8Array([9])], { type: "image/png" });
    const q = mountQueue({ sessionToken: STALE, isVerified: false });

    act(() => q.result.current.addClip(clip, poster));

    await waitFor(() => expect(q.onUploaded).toHaveBeenCalledTimes(1));
    const sent = mockUploadFile.mock.calls[0][0];
    expect(sent.file).toBe(clip);
    expect(sent.reelEligible).toBe(false);
    expect(sent.poster).toBe(poster);
    expect(q.items()).toEqual([
      expect.objectContaining({
        status: "done",
        kind: "video",
        reelEligible: false,
      }),
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
      mediaId: "clip-2",
      kind: "video",
    });
    const clip = new File([new Uint8Array([1])], "clip.webm", {
      type: "video/webm",
    });
    const q = mountQueue({ sessionToken: null, isVerified: false });
    act(() => q.result.current.addClip(clip, new Blob([new Uint8Array([1])])));
    await waitFor(() => expect(q.onUploaded).toHaveBeenCalledTimes(1));
    expect(sentOn(0)).toBe("fresh-token");
    expect(mockUploadFile.mock.calls[0][0].reelEligible).toBe(false);
  });
});

/* ── A PROGRESS TICK IS NOT A QUEUE CHANGE (album-guest-wiring): a tick lives in the queue's own
   progress store, so what reads `items` (the page's whole shell) never re-renders for one; the bar
   that draws it subscribes to its own item. ── */

function fakeProgress(initial: Record<string, number> = {}) {
  const values = new Map(Object.entries(initial));
  const listeners = new Set<() => void>();
  const store: QueueProgress & { tick: (id: string, v: number) => void } = {
    get: (id) => values.get(id) ?? 0,
    subscribe: (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    tick: (id, v) => {
      values.set(id, v);
      for (const l of listeners) l();
    },
  };
  return store;
}

const flying = (id: string, over: Partial<QueueItem> = {}): QueueItem => ({
  id,
  file: new File(["x"], `${id}.jpg`, { type: "image/jpeg" }),
  kind: "photo",
  status: "uploading",
  progress: 0,
  ...over,
});

describe("useQueueProgress", () => {
  it("reads one item's live progress and re-renders on its ticks", () => {
    const progress = fakeProgress({ q1: 10 });
    const { result } = renderHook(() => useQueueProgress(progress, "q1"));
    expect(result.current).toBe(10);
    act(() => progress.tick("q1", 60));
    expect(result.current).toBe(60);
  });

  it("is zero without a store or an id", () => {
    const { result } = renderHook(() => useQueueProgress(null, "q1"));
    expect(result.current).toBe(0);
  });
});

describe("useLiveQueue", () => {
  it("hands back the very same items while it is not live (nothing re-renders for a tick)", () => {
    const progress = fakeProgress({ q1: 40 });
    const items = [flying("q1")];
    const { result } = renderHook(() => useLiveQueue(items, progress, false));
    expect(result.current).toBe(items);
    act(() => progress.tick("q1", 80));
    expect(result.current).toBe(items);
  });

  it("folds each uploading item's live progress in while it is live", () => {
    const progress = fakeProgress({ q1: 40 });
    const items = [
      flying("q1"),
      flying("q2", { status: "done", progress: 100 }),
    ];
    const { result } = renderHook(() => useLiveQueue(items, progress, true));
    expect(result.current.map((it) => it.progress)).toEqual([40, 100]);
    act(() => progress.tick("q1", 90));
    expect(result.current[0].progress).toBe(90);
  });
});

/**
 * THE DOOR SETTLES ON WHO IS HERE BEFORE IT ASKS (crumbs-29, build 30's red-team).
 *
 * Two ways a page's idea of its viewer outlived the truth, both handed to the door now rather than stranded:
 *   - a page rendered while a sign-out was still in flight took its viewer for a confirmed account, skipped the
 *     name step, and her Send toasted "Couldn't start uploading / Enter a name." over an upload step with no field
 *     to type one (a dead end until a reload);
 *   - a phone holding another guest's ticket, its viewer signed in elsewhere and blocked here: the ticket went down
 *     with its name, and the page drew the name step for the seconds its refresh took to find the block.
 */
describe("the door settles on who is here before it asks", () => {
  it("★ a first Add whose join the server refuses for want of a name keeps her picks for the door, never a toast", async () => {
    localStorage.clear();
    const { toast } = await import("sonner");
    answer({
      "/api/guests": [
        {
          ok: false,
          body: { ok: false, code: "name_required", message: "Enter a name." },
        },
      ],
    });
    mockUploadFile.mockResolvedValue(landed("med-1"));
    // The page rendered as a confirmed account (the sign-out was still in flight), with no ticket here yet.
    const q = mountQueue({ sessionToken: null, isVerified: true });
    const clip = new File([new Uint8Array([1])], "clip.webm", {
      type: "video/webm",
    });

    act(() => q.result.current.addFiles([makeFile("a.jpg")]));

    await waitFor(() => expect(q.onDoorNeeded).toHaveBeenCalledTimes(1));
    expect(toast.error).not.toHaveBeenCalled();
    expect(mockUploadFile).not.toHaveBeenCalled();
    expect(q.items().map((it) => it.status)).toEqual(["queued"]);

    // The refresh finds her signed out; the door's name step joins and hands its ticket down.
    q.rerender({ sessionToken: "door-token", isVerified: false });
    await waitFor(() => expect(q.onUploaded).toHaveBeenCalledTimes(1));
    expect(sentOn(0)).toBe("door-token");
    // A clip added after the door has its ticket goes as any file.
    act(() => q.result.current.addClip(clip, new Blob([new Uint8Array([1])])));
    await waitFor(() => expect(q.onUploaded).toHaveBeenCalledTimes(2));
  });

  it("any other refusal of the first join still toasts, and nothing waits", async () => {
    localStorage.clear();
    const { toast } = await import("sonner");
    answer({
      "/api/guests": [
        {
          ok: false,
          body: {
            ok: false,
            code: "rate_limited",
            message: "Too many joins from this network right now.",
          },
        },
      ],
    });
    const q = mountQueue({ sessionToken: null, isVerified: true });
    act(() => q.result.current.addFiles([makeFile("a.jpg")]));
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(q.onDoorNeeded).not.toHaveBeenCalled();
    expect(q.items()).toEqual([]);
  });

  it("★ a ticket only the door can replace: the door hears it before the ticket and its name go down, and is told when they have", async () => {
    let releaseLeave = () => {};
    global.fetch = vi.fn(
      (input: RequestInfo | URL) =>
        new Promise<Response>((resolve) => {
          if (String(input) !== "/api/guests/leave") {
            throw new Error(`unexpected fetch ${String(input)}`);
          }
          releaseLeave = () =>
            resolve({ ok: true, json: async () => ({ ok: true }) } as Response);
        }),
    );
    mockUploadFile.mockResolvedValueOnce(OTHER_ACCOUNT);
    const q = mountQueue({ sessionToken: STALE, isVerified: false });
    let nameWhenTold: string | null | undefined;
    let ticketDown: Promise<void> | undefined;
    q.onDoorNeeded.mockImplementation((down?: Promise<void>) => {
      nameWhenTold = localStorage.getItem(`pr_guest_name_${QR}`);
      ticketDown = down;
    });

    act(() => q.result.current.addFiles([makeFile()]));

    await waitFor(() => expect(q.onDoorNeeded).toHaveBeenCalledTimes(1));
    // Told while the ticket's name still stood: the door holds before anything it reads goes down.
    expect(nameWhenTold).toBe("Hi Will");
    expect(ticketDown).toBeInstanceOf(Promise);
    // Then the ticket goes down, the local half at once.
    expect(localStorage.getItem(`pr_guest_name_${QR}`)).toBeNull();
    expect(localStorage.getItem(`pr_session_${QR}`)).toBeNull();
    // And the page's refresh waits on the cookie's half, so it never reads the ticket that is leaving.
    let settled = false;
    void ticketDown!.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    releaseLeave();
    await waitFor(() => expect(settled).toBe(true));
    expect(q.items()).toEqual([expect.objectContaining({ status: "queued" })]);
    expect(q.onDoorNeeded).toHaveBeenCalledTimes(1);
  });

  it("a confirmed viewer's ticket going down never troubles the door: she joins silently, as ever", async () => {
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
    await waitFor(() => expect(q.onUploaded).toHaveBeenCalledTimes(1));
    expect(q.onDoorNeeded).not.toHaveBeenCalled();
  });
});

/**
 * ★ THE OWNER'S ADD RIDES THE HOST'S OWN ROUTES (crumbs-29's Deferred, a bug). The host adding to her own album from
 * its guest page went through the guest queue, and `create_guest` never counts the host as in, so at a gated door her
 * upload never went (proved rolled back on 55bcdbe0): approve minted her a waiting ticket her picks waited on for good,
 * invite refused "Ask the host to let you in.", closed "This event is private.", and Only me refuses every mint. She is
 * never her own guest (the notes in `create_guest`, the presign route and `upload-lock.ts` said so all along): her Add
 * goes through the host's pair, as the hub's does and the reel's Add to event does (`clip-add.ts`), approved and
 * metered on her storage, with no ticket, no join and no door.
 */
describe("the album's owner, adding to her own album", () => {
  const HOST_PAIR = {
    presign: "/api/host/r2/presign-upload",
    complete: "/api/host/r2/complete-upload",
  };

  it("★ sends her picks through the host's pair, as the host of this event: no join, no ticket, no door", async () => {
    localStorage.clear();
    // Any fetch here would be a join: none is expected.
    answer({});
    mockUploadFile
      .mockResolvedValueOnce(landed("med-1"))
      .mockResolvedValueOnce(landed("med-2"));
    const q = mountQueue({
      sessionToken: null,
      isVerified: true,
      ownerEventId: "event-1",
    });

    act(() =>
      q.result.current.addFiles([makeFile("a.jpg"), makeFile("b.jpg")]),
    );

    await waitFor(() => expect(q.onUploaded).toHaveBeenCalledTimes(2));
    for (const [sent] of mockUploadFile.mock.calls) {
      expect(sent.endpoints).toEqual(HOST_PAIR);
      expect(sent.identity).toEqual({ event_id: "event-1" });
    }
    expect(fetchUrls()).toEqual([]);
    expect(q.onSession).not.toHaveBeenCalled();
    expect(q.onDoorNeeded).not.toHaveBeenCalled();
    expect(q.items().map((it) => it.status)).toEqual(["done", "done"]);
  });

  it("never sends on a guest ticket the device still holds from an earlier visit", async () => {
    mockUploadFile.mockResolvedValueOnce(landed("med-1"));
    const q = mountQueue({
      sessionToken: STALE,
      isVerified: true,
      ownerEventId: "event-1",
    });
    act(() => q.result.current.addFiles([makeFile()]));
    await waitFor(() => expect(q.onUploaded).toHaveBeenCalledTimes(1));
    expect(mockUploadFile.mock.calls[0][0].identity).toEqual({
      event_id: "event-1",
    });
  });

  it("a refusal from the host's route is the file's own, in its words, and nobody joins", async () => {
    answer({});
    mockUploadFile.mockResolvedValueOnce({
      ok: false,
      code: "cap_reached",
      message: "Storage is full for your plan. Free up space or upgrade.",
    });
    const q = mountQueue({
      sessionToken: null,
      isVerified: true,
      ownerEventId: "event-1",
    });
    act(() => q.result.current.addFiles([makeFile()]));
    await waitFor(() => expect(q.items()[0]?.status).toBe("error"));
    expect(q.items()[0]).toMatchObject({
      error: "Storage is full for your plan. Free up space or upgrade.",
      errorCode: "cap_reached",
    });
    expect(fetchUrls()).toEqual([]);
    expect(q.onDoorNeeded).not.toHaveBeenCalled();
  });

  it("her clip goes the same way, still never a reel's", async () => {
    answer({});
    mockUploadFile.mockResolvedValueOnce({
      ok: true,
      status: "approved",
      mediaId: "clip-1",
      kind: "video",
    });
    const clip = new File([new Uint8Array([1, 2, 3])], "clip.mp4", {
      type: "video/mp4",
    });
    const poster = new Blob([new Uint8Array([9])], { type: "image/png" });
    const q = mountQueue({
      sessionToken: null,
      isVerified: true,
      ownerEventId: "event-1",
    });
    act(() => q.result.current.addClip(clip, poster));
    await waitFor(() => expect(q.onUploaded).toHaveBeenCalledTimes(1));
    const sent = mockUploadFile.mock.calls[0][0];
    expect(sent.endpoints).toEqual(HOST_PAIR);
    expect(sent.identity).toEqual({ event_id: "event-1" });
    expect(sent.reelEligible).toBe(false);
    expect(sent.poster).toBe(poster);
    expect(fetchUrls()).toEqual([]);
  });
});
