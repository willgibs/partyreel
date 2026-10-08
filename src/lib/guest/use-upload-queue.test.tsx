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
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { joinEvent } from "@/lib/guest/join";
import {
  LINE_EVERY_MS,
  LINE_FIRST_MS,
  LINE_TEXT,
  LINE_URL,
  releaseGap,
} from "@/lib/guest/unsent/line";
import {
  JOIN_OFFLINE_WORDS,
  joinLostTheLine,
  landedAs,
  runLandedOf,
  runProgressOf,
  runSentOf,
  useLiveQueue,
  useQueueProgress,
  useRunCounts,
  useRunProgress,
  useRunSent,
  useUploadQueue,
  type QueueItem,
  type QueueProgress,
} from "@/lib/guest/use-upload-queue";
import {
  hasKeptComplete,
  uploadBurst,
  uploadFile,
  type BurstFile,
  type UploadOutcome,
} from "@/lib/upload/uploader";

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
              message:
                "Something went wrong with that upload. Please try again.",
            };
          }
          if (!outcome.ok && session.has(outcome.code ?? "")) stop = outcome;
        }
        out.push(outcome);
        args.onOutcome?.(i, outcome);
      }
      return out;
    },
  );
  // Whether a file's complete lost its answer and is kept: no file's, until a case says so (the heal's own pins).
  const hasKeptComplete = vi.fn((_file: File) => false);
  return { uploadFile, uploadBurst, hasKeptComplete };
});
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

/*
 * ★ A DROPPED LINE STANDS BY, AND GOES AGAIN WHEN THE LINE ANSWERS (no-signal r1, Will's `drop=standby` over
 * `carry=phone`). A file the connection ended is never a failure now: it waits `queued`, its cause kept
 * (`waitsForLine`), its bar at nothing, while the run (so the shutter's ring and the stack) holds it, and it goes again,
 * the very same File, once the line answers: a tiny static file asked a few seconds on, every 20 s after, on the phone's
 * `online` and on her return to the page (`unsent/line.ts`).
 *
 * RESHAPED ON PURPOSE (no-signal-wiring): these pinned "★ a lost answer heals itself" (red-team 55's LOW) and "★ the
 * cause of a failure rides the queue". The reason that expired is the failure itself: a dropped file used to fail into
 * the sheet, and the heal (`use-upload-queue.heal.ts`, which the host's panel still reads) asked a kept complete again
 * for it; no guest file fails for the line any more, so a lost answer stands by with every other drop and goes again on
 * its kept complete when the line answers. The scars kept: the very same File goes again (so the uploader asks its kept
 * complete, never a second upload), a landing is told once, a check that finds the line down changes nothing she sees,
 * nothing goes while the door holds her, the owner's go through her own pair, no join is made for a file that has its
 * ticket, a refusal carries no cause and a cancel is no failure, and a Retry for a file the line's return already took
 * moves nothing (crumbs-90).
 */
describe("★ a dropped line stands by, and goes again when the line answers", () => {
  const DROPPED = "Your connection dropped. Check your signal, then try again.";
  const droppedOutcome: UploadOutcome = {
    ok: false,
    message: DROPPED,
    cause: "dropped",
  };
  let lineUp = false;
  let lineAsks = 0;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    lineUp = false;
    lineAsks = 0;
  });
  afterEach(() => {
    vi.useRealTimers();
    // What a case queued for the uploader and the kept complete it named go with it, whatever it ended on.
    mockUploadFile.mockReset();
    vi.mocked(hasKeptComplete).mockReset();
  });

  /** fetch as `answer` gives it, with the line's own file (`/line.txt`) answering its words while `lineUp`. */
  function withLine(
    routes: Record<string, { ok: boolean; body: unknown }[]> = {},
  ) {
    answer(routes);
    const routed = global.fetch;
    global.fetch = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        if (String(input).startsWith(LINE_URL)) {
          lineAsks += 1;
          if (!lineUp) throw new TypeError("Failed to fetch");
          return { ok: true, text: async () => LINE_TEXT } as Response;
        }
        return routed(input, init);
      },
    ) as typeof fetch;
  }

  /** Every request but the line's own. */
  const nonLineUrls = () => fetchUrls().filter((u) => !u.startsWith(LINE_URL));

  /** A file sent once and dropped: the queue at the moment the line went. */
  async function droppedOnce(
    props: Props = { sessionToken: STALE, isVerified: false },
  ) {
    withLine();
    const file = makeFile("lost.jpg");
    // Its complete was kept (a lost answer): the uploader asks it again by this very File.
    vi.mocked(hasKeptComplete).mockImplementation((f) => f === file);
    mockUploadFile.mockResolvedValueOnce(droppedOutcome);
    const q = mountQueue(props);
    act(() => q.result.current.addFiles([file]));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(q.items()).toEqual([
      expect.objectContaining({
        status: "queued",
        cause: "dropped",
        progress: 0,
      }),
    ]);
    return { q, file };
  }

  it("★ stands by: queued, its cause kept and its bar at nothing, never an error, and the run still holds it", async () => {
    const { q } = await droppedOnce();
    const it0 = q.items()[0]!;
    expect(it0.error).toBeUndefined();
    expect(it0.errorCode).toBeUndefined();
    // Still on its way: the shutter's ring holds it, at what landed (nothing), its count on its shoulder.
    expect(
      runProgressOf(q.items(), q.result.current.progress, new Set()),
    ).toEqual({ sending: 1, progress: 0, landed: 0, failed: 0 });
    // And the stack reads it off the store: waiting, in the page alone (jsdom keeps no IndexedDB).
    expect(q.result.current.progress.waits?.(it0.id)).toBe("page");
    expect(q.result.current.progress.get(it0.id)).toBe(0);
  });

  it("★ goes again a few seconds on once the line answers, the very same File, and is told as landed once", async () => {
    const { q, file } = await droppedOnce();
    lineUp = true;
    mockUploadFile.mockResolvedValueOnce(landed("med-1"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(LINE_FIRST_MS);
    });
    // The very same File went again (the uploader sends its kept complete, never a presign or a byte), once.
    expect(mockUploadFile).toHaveBeenCalledTimes(2);
    expect(mockUploadFile.mock.calls[1]![0].file).toBe(file);
    expect(q.items()).toEqual([
      expect.objectContaining({
        status: "done",
        mediaId: "med-1",
        error: undefined,
        cause: undefined,
      }),
    ]);
    expect(q.result.current.progress.waits?.(q.items()[0]!.id)).toBeNull();
    // Told as any landing is: the album draws it as her own upload, once.
    expect(q.onUploaded).toHaveBeenCalledTimes(1);
    expect(q.onUploaded).toHaveBeenCalledWith(
      expect.objectContaining({ file, mediaId: "med-1", status: "approved" }),
    );
  });

  it("★ a check that finds the line still down changes nothing she sees, and the line is asked again on its cadence", async () => {
    const { q } = await droppedOnce();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(LINE_FIRST_MS);
    });
    expect(lineAsks).toBe(1);
    expect(mockUploadFile).toHaveBeenCalledTimes(1);
    expect(q.items()).toEqual([
      expect.objectContaining({ status: "queued", cause: "dropped" }),
    ]);
    // Not again before the line's own 20 s.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(LINE_EVERY_MS - 1);
    });
    expect(lineAsks).toBe(1);
    lineUp = true;
    mockUploadFile.mockResolvedValueOnce(landed("med-2"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(lineAsks).toBe(2);
    expect(q.items()).toEqual([expect.objectContaining({ status: "done" })]);
  });

  it("★ the phone's own `online` and her return to the page ask at once", async () => {
    const { q } = await droppedOnce();
    lineUp = true;
    mockUploadFile.mockResolvedValueOnce(landed("med-1"));
    await act(async () => {
      window.dispatchEvent(new Event("online"));
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(q.items()).toEqual([expect.objectContaining({ status: "done" })]);
  });

  it("★ a send that drops again on an answering line backs off: the next goes 40 s on, never every 20 s", async () => {
    const { q } = await droppedOnce();
    lineUp = true;
    mockUploadFile.mockResolvedValueOnce(droppedOutcome);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(LINE_FIRST_MS);
    });
    // The line answered, the send went, and it dropped again: a miss.
    expect(mockUploadFile).toHaveBeenCalledTimes(2);
    expect(q.items()[0]).toMatchObject({ status: "queued", cause: "dropped" });
    // Nothing goes before the backoff, whatever asks: the cadence, the phone's `online`.
    await act(async () => {
      window.dispatchEvent(new Event("online"));
      await vi.advanceTimersByTimeAsync(releaseGap(1) - 1_000);
    });
    expect(mockUploadFile).toHaveBeenCalledTimes(2);
    mockUploadFile.mockResolvedValueOnce(landed("med-1"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(mockUploadFile).toHaveBeenCalledTimes(3);
    expect(q.items()).toEqual([expect.objectContaining({ status: "done" })]);
  });

  it("a dropped connection stands by with its cause, a refusal fails with none, and a cancel is no failure here", async () => {
    withLine();
    mockUploadFile
      .mockResolvedValueOnce(droppedOutcome)
      .mockResolvedValueOnce({
        ok: false,
        message: "That upload was cancelled.",
        cause: "cancelled",
      })
      .mockResolvedValueOnce({
        ok: false,
        code: "too_large",
        message: "Files for this event are capped at 500 MB.",
      });
    const q = mountQueue({ sessionToken: STALE, isVerified: false });
    act(() =>
      q.result.current.addFiles([
        makeFile("a.jpg"),
        makeFile("b.jpg"),
        makeFile("c.jpg"),
      ]),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    // The cancelled one (b) left the queue: the sheet lists what did not go, and a cancel is not that.
    expect(q.items().map((it) => [it.file.name, it.status, it.cause])).toEqual([
      ["a.jpg", "queued", "dropped"],
      ["c.jpg", "error", undefined],
    ]);
    expect(q.items()[1]).toMatchObject({ errorCode: "too_large" });
    // The refusal is the file's own: the line's return never sends it, only her Retry may.
    lineUp = true;
    mockUploadFile.mockResolvedValueOnce(landed("med-a"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(LINE_FIRST_MS);
    });
    expect(mockUploadFile).toHaveBeenCalledTimes(4);
    expect(mockUploadFile.mock.calls[3]![0].file.name).toBe("a.jpg");
    expect(q.items().map((it) => it.status)).toEqual(["done", "error"]);
  });

  it("the line's return gives the cause back as the file goes again", async () => {
    const { q } = await droppedOnce();
    lineUp = true;
    // The second go stays in the air, so what the item holds is exactly what the send left it.
    mockUploadFile.mockReturnValueOnce(new Promise<UploadOutcome>(() => {}));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(LINE_FIRST_MS);
    });
    expect(q.items()[0]!.status).toBe("uploading");
    expect(q.items()[0]!.cause).toBeUndefined();
    expect(q.items()[0]!.error).toBeUndefined();
  });

  it("nothing goes while a door holds her: the line's return leaves it for the door's own opening", async () => {
    const { q } = await droppedOnce({ sessionToken: STALE, isVerified: false });
    q.rerender({ sessionToken: STALE, isVerified: false, doorOpen: false });
    lineUp = true;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(LINE_FIRST_MS);
    });
    expect(mockUploadFile).toHaveBeenCalledTimes(1);
    mockUploadFile.mockResolvedValueOnce(landed("med-1"));
    q.rerender({ sessionToken: STALE, isVerified: false, doorOpen: true });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(q.items()).toEqual([expect.objectContaining({ status: "done" })]);
  });

  it("goes through the host's own pair for the album's owner", async () => {
    const { q } = await droppedOnce({
      sessionToken: null,
      isVerified: true,
      ownerEventId: "evt-own",
    });
    lineUp = true;
    mockUploadFile.mockResolvedValueOnce(landed("med-own"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(LINE_FIRST_MS);
    });
    expect(mockUploadFile.mock.calls[1]![0].identity).toEqual({
      event_id: "evt-own",
    });
    expect(q.items()).toEqual([expect.objectContaining({ status: "done" })]);
  });

  it("★ a Retry for a file that stands by, or that the line's return took, sends nothing beside it: in the air or landed (crumbs-90)", async () => {
    // The scar kept from the heal's race: a press names a file a moment ago's words drew, and a file the line's return
    // already took (in the air, or landed) must never go up again as a second upload of the same photograph.
    const { q, file } = await droppedOnce();
    const id = q.items()[0]!.id;
    // Standing by: it is no failure, so her press moves nothing (the line is what sends it).
    await act(async () => {
      q.result.current.retry(id);
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(mockUploadFile).toHaveBeenCalledTimes(1);
    let answerSend: (outcome: UploadOutcome) => void = () => {};
    mockUploadFile.mockImplementationOnce(
      () =>
        new Promise<UploadOutcome>((resolve) => {
          answerSend = resolve;
        }),
    );
    lineUp = true;
    await act(async () => {
      window.dispatchEvent(new Event("online"));
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(mockUploadFile).toHaveBeenCalledTimes(2);
    expect(mockUploadFile.mock.calls[1]![0].file).toBe(file);
    // In the air: her press moves nothing.
    await act(async () => {
      q.result.current.retry(id);
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(mockUploadFile).toHaveBeenCalledTimes(2);
    await act(async () => {
      answerSend(landed("med-1"));
      await vi.advanceTimersByTimeAsync(0);
    });
    // Landed: still nothing, and the photograph stays the one row it is.
    await act(async () => {
      q.result.current.retry(id);
      await vi.advanceTimersByTimeAsync(LINE_EVERY_MS * 3);
    });
    expect(mockUploadFile).toHaveBeenCalledTimes(2);
    expect(q.items()).toEqual([
      expect.objectContaining({ status: "done", mediaId: "med-1" }),
    ]);
    expect(q.onUploaded).toHaveBeenCalledTimes(1);
  });

  it("is the file sent again and no more: no join is made and no ticket is touched", async () => {
    const { q } = await droppedOnce();
    lineUp = true;
    mockUploadFile.mockResolvedValueOnce(landed("med-1"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(LINE_FIRST_MS);
    });
    expect(nonLineUrls()).toEqual([]);
    expect(q.onSession).not.toHaveBeenCalled();
  });

  it("★ while the phone says it is offline, what she adds stands by at once: no presign, no join", async () => {
    withLine();
    const onLine = Object.getOwnPropertyDescriptor(
      Navigator.prototype,
      "onLine",
    );
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });
    try {
      const q = mountQueue({ sessionToken: STALE, isVerified: false });
      act(() =>
        q.result.current.addFiles([makeFile("a.jpg"), makeFile("b.jpg")]),
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(mockUploadFile).not.toHaveBeenCalled();
      expect(vi.mocked(uploadBurst)).not.toHaveBeenCalled();
      expect(q.items().map((it) => [it.status, it.cause])).toEqual([
        ["queued", "dropped"],
        ["queued", "dropped"],
      ]);
      // Nor is the line asked while the phone says it is offline: the one way its word is true.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(LINE_FIRST_MS);
      });
      expect(lineAsks).toBe(0);
    } finally {
      delete (navigator as { onLine?: boolean }).onLine;
      if (onLine) Object.defineProperty(Navigator.prototype, "onLine", onLine);
    }
  });

  it("★ a first pick whose silent join never reached the network stands by, never a toast, and goes once the line answers, the join asked again", async () => {
    localStorage.clear();
    const { toast } = await import("sonner");
    // No route for the join: its request never reaches a server (the join module's own offline refusal).
    withLine();
    const q = mountQueue({ sessionToken: null, isVerified: true });
    act(() => q.result.current.addFiles([makeFile("a.jpg")]));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(toast.error).not.toHaveBeenCalled();
    expect(q.onDoorNeeded).not.toHaveBeenCalled();
    expect(q.items()).toEqual([
      expect.objectContaining({ status: "queued", cause: "dropped" }),
    ]);
    // The line comes back: the join is asked again as the file goes, and the file rides its ticket.
    withLine({
      "/api/guests": [
        { ok: true, body: { ok: true, session_token: "fresh-token" } },
      ],
    });
    lineUp = true;
    mockUploadFile.mockResolvedValueOnce(landed("med-1"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(LINE_FIRST_MS);
    });
    expect(q.items()).toEqual([expect.objectContaining({ status: "done" })]);
    expect(sentOn(0)).toBe("fresh-token");
  });

  it("holds the join module's own words for a request that never left (`JOIN_OFFLINE_WORDS`)", async () => {
    global.fetch = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }) as typeof fetch;
    const joined = await joinEvent({ qrToken: "qr-offline" });
    expect(joined.ok).toBe(false);
    if (joined.ok) return;
    expect(joined.refusal.message).toBe(JOIN_OFFLINE_WORDS);
    expect(joinLostTheLine(joined.refusal)).toBe(true);
    // A server's own refusal is never the line.
    expect(
      joinLostTheLine({ kind: "other", message: "Too many joins right now." }),
    ).toBe(false);
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

/*
 * ★ ONE ROW FOR A RE-JOIN (crumbs-43; ROADMAP: "a name-only guest whose session drops re-joins on the same device as a
 * second guest row with the same name, so the guest list shows one person twice"). The drop was the flip's: a host
 * turning An email first on mid-run put a name-only guest's ticket down, so her next Add after the host turned it off
 * again joined afresh under the same name (a second row), and a confirmation in between had no ticket left to claim.
 * The ticket stays now; the switch is asked again at every upload.
 */
describe("a name-only guest through the flip", () => {
  it("★ keeps her ticket: the files fail in place, and once the switch is off her next Add rides the SAME row", async () => {
    answer({});
    mockUploadFile
      .mockResolvedValueOnce({
        ok: false,
        code: "verification_required",
        message: "Confirm your email to add photos to this event.",
      })
      .mockResolvedValueOnce(landed("med-1"));
    const q = mountQueue({ sessionToken: STALE, isVerified: false });

    act(() => q.result.current.addFiles([makeFile("a.jpg")]));
    await waitFor(() =>
      expect(q.items()).toEqual([
        expect.objectContaining({
          status: "error",
          errorCode: "verification_required",
        }),
      ]),
    );
    expect(q.onSession).not.toHaveBeenCalled();
    expect(q.onVerificationRequired).toHaveBeenCalledWith(
      "Confirm your email to add photos to this event.",
      true,
    );

    // The host turns it off again; she adds another.
    act(() => q.result.current.addFiles([makeFile("b.jpg")]));
    await waitFor(() => expect(q.onUploaded).toHaveBeenCalledTimes(1));
    expect(sentOn(1)).toBe(STALE);
    // No join, so no second row under her name: the queue called nothing but the upload.
    expect(fetchUrls()).toEqual([]);
    expect(q.onSession).not.toHaveBeenCalled();
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

/* ── A ROW SEALED UNTIL ITS ALBUM DEVELOPS (build 43's red-team, the upload half; disposable-camera): the
   completion says `sealed` as the write did, and the queue tells that landing as `sealed`, which nothing draws,
   where it used to land `approved` and stand in the album for her alone until a reload. ── */

function sealedLanding(mediaId: string, kind: "photo" | "video" = "photo") {
  return { ok: true as const, status: "approved", mediaId, kind, sealed: true };
}

describe("a row sealed until its album develops", () => {
  it("is told by the server's own answer (landedAs)", () => {
    expect(landedAs("approved", true)).toBe("sealed");
    expect(landedAs("approved", false)).toBe("approved");
    expect(landedAs("approved", undefined)).toBe("approved");
    // A held row is the host's to decide first, sealed or not.
    expect(landedAs("pending", true)).toBe("pending");
  });

  it("★ lands `sealed`, never `approved`: the album draws no tile for it and her tracker keeps it", async () => {
    mockUploadFile.mockResolvedValue(sealedLanding("shot-1"));
    const q = mountQueue({ sessionToken: STALE, isVerified: false });
    act(() => q.result.current.addFiles([makeFile("shot.jpg")]));
    await waitFor(() => expect(q.onUploaded).toHaveBeenCalledTimes(1));
    expect(q.onUploaded).toHaveBeenCalledWith(
      expect.objectContaining({ mediaId: "shot-1", status: "sealed" }),
    );
    expect(q.items()[0]).toEqual(
      expect.objectContaining({ status: "done", mediaStatus: "sealed" }),
    );
  });

  it("an unsealed landing is told as the server said it, as ever", async () => {
    mockUploadFile.mockResolvedValue(landed("shot-2"));
    const q = mountQueue({ sessionToken: STALE, isVerified: false });
    act(() => q.result.current.addFiles([makeFile("shot.jpg")]));
    await waitFor(() => expect(q.onUploaded).toHaveBeenCalledTimes(1));
    expect(q.onUploaded).toHaveBeenCalledWith(
      expect.objectContaining({ status: "approved" }),
    );
  });
});

describe("the camera's shots", () => {
  it("a camera video carries its first frame as its poster, and stays the reel's", async () => {
    mockUploadFile.mockResolvedValue(sealedLanding("vid-1", "video"));
    const video = new File([new Uint8Array([1])], "shot.mp4", {
      type: "video/mp4",
    });
    const poster = new Blob([new Uint8Array([2])], { type: "image/jpeg" });
    const q = mountQueue({ sessionToken: STALE, isVerified: false });
    act(() => q.result.current.addFiles([video], { poster }));
    await waitFor(() => expect(q.onUploaded).toHaveBeenCalledTimes(1));
    expect(mockUploadFile.mock.calls[0][0].poster).toBe(poster);
    expect(mockUploadFile.mock.calls[0][0].reelEligible).toBeUndefined();
  });

  it("★ shots taken while the first one's silent join is out ride that one join, in order, none lost", async () => {
    localStorage.clear();
    let joined: (value: Response) => void = () => {};
    global.fetch = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          joined = resolve;
        }),
    );
    mockUploadFile
      .mockResolvedValueOnce(sealedLanding("s1"))
      .mockResolvedValueOnce(sealedLanding("s2"))
      .mockResolvedValueOnce(landed("s3"));
    const q = mountQueue({ sessionToken: null, isVerified: true });
    const first = makeFile("shot-1.jpg");
    const second = makeFile("shot-2.jpg");
    const third = makeFile("shot-3.jpg");
    const poster = new Blob([new Uint8Array([2])], { type: "image/jpeg" });
    act(() => q.result.current.addFiles([first]));
    act(() => q.result.current.addFiles([second], { poster }));
    act(() => q.result.current.addFiles([third]));
    // One join for the three of them.
    expect(global.fetch).toHaveBeenCalledTimes(1);
    await act(async () => {
      joined({
        ok: true,
        json: async () => ({ ok: true, session_token: "fresh-token" }),
      } as Response);
    });
    await waitFor(() => expect(q.onUploaded).toHaveBeenCalledTimes(3));
    expect(mockUploadFile.mock.calls.map((c) => c[0].file)).toEqual([
      first,
      second,
      third,
    ]);
    // What each was handed rides with it through the stash.
    expect(mockUploadFile.mock.calls[1][0].poster).toBe(poster);
    expect(sentOn(0)).toBe("fresh-token");
    expect(sentOn(2)).toBe("fresh-token");
    expect(q.items().map((it) => it.mediaStatus)).toEqual([
      "sealed",
      "sealed",
      "approved",
    ]);
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

describe("★ what waits goes as one burst (compute-uploads)", () => {
  const burstMock = vi.mocked(uploadBurst);

  it("picks waiting together are one burst, on one ticket, each told as it lands", async () => {
    let n = 0;
    mockUploadFile.mockImplementation(async () => landed(`med-${++n}`));
    const q = mountQueue({ sessionToken: "ticket-1", isVerified: false });
    act(() =>
      q.result.current.addFiles([
        makeFile("a.jpg"),
        makeFile("b.jpg"),
        makeFile("c.jpg"),
      ]),
    );
    await waitFor(() =>
      expect(q.items().map((it) => it.status)).toEqual([
        "done",
        "done",
        "done",
      ]),
    );
    expect(burstMock).toHaveBeenCalledTimes(1);
    expect(burstMock.mock.calls[0]![0].files).toHaveLength(3);
    expect(burstMock.mock.calls[0]![0].identity).toEqual({
      session_token: "ticket-1",
    });
    expect(q.onUploaded).toHaveBeenCalledTimes(3);
  });

  it("★ only the file in the air is `uploading`; one whose bytes are up waits `queued` at 100 for its burst's record", async () => {
    let release!: () => void;
    const recorded = new Promise<void>((resolve) => (release = resolve));
    burstMock.mockImplementationOnce(async ({ files, onOutcome }) => {
      files[0]!.onSending?.();
      files[0]!.onSent?.();
      files[1]!.onSending?.();
      await recorded;
      const out = [landed("med-a"), landed("med-b")];
      out.forEach((o, i) => onOutcome?.(i, o));
      return out;
    });
    const q = mountQueue({ sessionToken: "ticket-1", isVerified: false });
    act(() =>
      q.result.current.addFiles([makeFile("a.jpg"), makeFile("b.jpg")]),
    );
    await waitFor(() =>
      expect(q.items().map((it) => [it.status, it.progress])).toEqual([
        ["queued", 100],
        ["uploading", 0],
      ]),
    );
    expect(q.onUploaded).not.toHaveBeenCalled();
    await act(async () => release());
    await waitFor(() =>
      expect(q.items().map((it) => it.status)).toEqual(["done", "done"]),
    );
  });

  it("a pick made while a burst goes rides the next burst", async () => {
    let release!: () => void;
    const first = new Promise<void>((resolve) => (release = resolve));
    burstMock.mockImplementationOnce(async ({ files, onOutcome }) => {
      await first;
      const out = files.map((_, i) => landed(`med-${i}`));
      out.forEach((o, i) => onOutcome?.(i, o));
      return out;
    });
    mockUploadFile.mockResolvedValue(landed("med-late"));
    const q = mountQueue({ sessionToken: "ticket-1", isVerified: false });
    act(() =>
      q.result.current.addFiles([makeFile("a.jpg"), makeFile("b.jpg")]),
    );
    await waitFor(() => expect(burstMock).toHaveBeenCalledTimes(1));
    act(() => q.result.current.addFiles([makeFile("late.jpg")]));
    await act(async () => release());
    await waitFor(() =>
      expect(q.items().map((it) => it.status)).toEqual([
        "done",
        "done",
        "done",
      ]),
    );
    expect(burstMock).toHaveBeenCalledTimes(2);
    expect(burstMock.mock.calls[1]![0].files.map((f) => f.file.name)).toEqual([
      "late.jpg",
    ]);
  });
});

/**
 * ★ THE QUEUE'S TWO THROUGHPUT LINES (uploads-bursts): a dropped burst's Retry all goes back as the one burst it was, and
 * the next burst begins on the last one's bytes, its complete still waiting for the last one's answer.
 */
describe("★ bursts back to back (uploads-bursts)", () => {
  const burstMock = vi.mocked(uploadBurst);
  const DROPPED = "Your connection dropped. Check your signal, then try again.";
  const REFUSED = "That upload didn't go through. Please try again.";
  type BurstArgs = Parameters<typeof uploadBurst>[0];

  /** A burst whose bytes go up at once (each file sent, then its `onSendDone`) and whose complete answers on `answer`. */
  function bytesThenComplete(outcome: (i: number) => UploadOutcome) {
    let answer!: () => void;
    const answered = new Promise<void>((resolve) => (answer = resolve));
    burstMock.mockImplementationOnce(async (args: BurstArgs) => {
      for (const one of args.files) {
        one.onSending?.();
        one.onProgress?.(1);
        one.onSent?.();
      }
      args.onSendDone?.();
      await answered;
      const out = args.files.map((_, i) => outcome(i));
      out.forEach((o, i) => args.onOutcome?.(i, o));
      return out;
    });
    return { answer: () => act(async () => answer()) };
  }
  const many = (count: number) =>
    Array.from({ length: count }, (_, i) => makeFile(`p${i}.jpg`));

  it("★ a failed burst's Retry all goes back as ONE burst: one presign and one complete for the lot", async () => {
    // RESHAPED (no-signal-wiring): the burst failed as a dropped line, which no longer fails (it stands by, and the
    // line's return sends it as one burst: the next case). The scar kept is the Retry all's: a failure that is no
    // drop (an answer that was an error) goes back as the one burst it was, and the sheet's close drops none of it.
    mockUploadFile.mockResolvedValue({
      ok: false,
      message: REFUSED,
    });
    const q = mountQueue({ sessionToken: "ticket-1", isVerified: false });
    act(() => q.result.current.addFiles(many(5)));
    await waitFor(() =>
      expect(q.items().every((it) => it.status === "error")).toBe(true),
    );
    expect(burstMock).toHaveBeenCalledTimes(1);

    let n = 0;
    mockUploadFile.mockImplementation(async () => landed(`med-${++n}`));
    // The sheet's Retry all: each listed file, in one tick, then the sheet's close dismisses the very same ids.
    const ids = q.items().map((it) => it.id);
    act(() => {
      for (const id of ids) q.result.current.retry(id);
      q.result.current.dismiss(ids);
    });
    await waitFor(() =>
      expect(q.items().every((it) => it.status === "done")).toBe(true),
    );
    expect(burstMock).toHaveBeenCalledTimes(2);
    expect(burstMock.mock.calls[1]![0].files).toHaveLength(5);
    // The status gate held: the close found them queued, so none was dropped.
    expect(q.items()).toHaveLength(5);
  });

  it("★ a dropped burst goes back as ONE burst when the line answers: one presign and one complete for the lot", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    try {
      const real = global.fetch;
      global.fetch = vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).startsWith(LINE_URL)) {
          return { ok: true, text: async () => LINE_TEXT } as Response;
        }
        return real(input);
      }) as typeof fetch;
      mockUploadFile.mockResolvedValue({
        ok: false,
        message: DROPPED,
        cause: "dropped",
      });
      const q = mountQueue({ sessionToken: "ticket-1", isVerified: false });
      act(() => q.result.current.addFiles(many(5)));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(q.items().every((it) => it.status === "queued")).toBe(true);
      expect(burstMock).toHaveBeenCalledTimes(1);
      let n = 0;
      mockUploadFile.mockImplementation(async () => landed(`med-${++n}`));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(LINE_FIRST_MS);
      });
      expect(q.items().every((it) => it.status === "done")).toBe(true);
      expect(burstMock).toHaveBeenCalledTimes(2);
      expect(burstMock.mock.calls[1]![0].files).toHaveLength(5);
    } finally {
      vi.useRealTimers();
    }
  });

  it("a single file's Retry is a burst of that file alone, as ever", async () => {
    mockUploadFile.mockResolvedValue({
      ok: false,
      message: REFUSED,
    });
    const q = mountQueue({ sessionToken: "ticket-1", isVerified: false });
    act(() => q.result.current.addFiles(many(3)));
    await waitFor(() =>
      expect(q.items().every((it) => it.status === "error")).toBe(true),
    );
    mockUploadFile.mockResolvedValue(landed("med-1"));
    act(() => q.result.current.retry(q.items()[1]!.id));
    await waitFor(() => expect(q.items()[1]!.status).toBe("done"));
    expect(burstMock).toHaveBeenCalledTimes(2);
    expect(burstMock.mock.calls[1]![0].files.map((f) => f.file.name)).toEqual([
      "p1.jpg",
    ]);
    expect(q.items().map((it) => it.status)).toEqual([
      "error",
      "done",
      "error",
    ]);
  });

  it("★ the next burst begins on the last one's bytes, before its complete answers, and records after it", async () => {
    const first = bytesThenComplete((i) => landed(`med-a${i}`));
    const second = bytesThenComplete((i) => landed(`med-b${i}`));
    const q = mountQueue({ sessionToken: "ticket-1", isVerified: false });
    // 21 picks: a burst of 20, and the 21st past the boundary.
    act(() => q.result.current.addFiles(many(21)));
    await waitFor(() => expect(burstMock).toHaveBeenCalledTimes(2));
    expect(burstMock.mock.calls[0]![0].files).toHaveLength(20);
    expect(burstMock.mock.calls[1]![0].files.map((f) => f.file.name)).toEqual([
      "p20.jpg",
    ]);
    // The first burst's complete has not answered: its files wait, up, and nothing is told yet.
    expect(q.onUploaded).not.toHaveBeenCalled();
    // The second burst's complete waits for the first's answer, and only for that.
    const after = burstMock.mock.calls[1]![0].recordAfter!;
    let firstRecorded = false;
    void after.then(() => (firstRecorded = true));
    await act(async () => {});
    expect(firstRecorded).toBe(false);
    await first.answer();
    await waitFor(() => expect(firstRecorded).toBe(true));
    expect(q.onUploaded).toHaveBeenCalledTimes(20);
    await second.answer();
    await waitFor(() =>
      expect(q.items().every((it) => it.status === "done")).toBe(true),
    );
    expect(q.onUploaded).toHaveBeenCalledTimes(21);
    expect(burstMock).toHaveBeenCalledTimes(2);
  });

  it("a waiting file is never taken twice: the last burst's files, up and `queued` at 100, are not the next burst's", async () => {
    const first = bytesThenComplete((i) => landed(`med-a${i}`));
    const q = mountQueue({ sessionToken: "ticket-1", isVerified: false });
    act(() => q.result.current.addFiles(many(2)));
    await waitFor(() =>
      expect(q.items().map((it) => [it.status, it.progress])).toEqual([
        ["queued", 100],
        ["queued", 100],
      ]),
    );
    // Its bytes are up, so a pick now goes at once, alone.
    mockUploadFile.mockResolvedValue(landed("med-late"));
    act(() => q.result.current.addFiles([makeFile("late.jpg")]));
    await waitFor(() => expect(burstMock).toHaveBeenCalledTimes(2));
    expect(burstMock.mock.calls[1]![0].files.map((f) => f.file.name)).toEqual([
      "late.jpg",
    ]);
    await first.answer();
    await waitFor(() =>
      expect(q.items().every((it) => it.status === "done")).toBe(true),
    );
    expect(burstMock).toHaveBeenCalledTimes(2);
  });

  it("★ a refused complete of the last burst still lands on the failure sheet with its files", async () => {
    const CAP = {
      ok: false,
      code: "cap_reached",
      message: "This album is full.",
    } as const;
    const first = bytesThenComplete(() => CAP);
    mockUploadFile.mockResolvedValue(landed("med-b"));
    const q = mountQueue({ sessionToken: "ticket-1", isVerified: false });
    act(() => q.result.current.addFiles(many(21)));
    await waitFor(() => expect(burstMock).toHaveBeenCalledTimes(2));
    await first.answer();
    await waitFor(() =>
      expect(q.items().filter((it) => it.status === "error")).toHaveLength(20),
    );
    await waitFor(() => expect(q.items()[20]!.status).toBe("done"));
    expect(q.items()[0]).toMatchObject({
      status: "error",
      errorCode: "cap_reached",
      error: "This album is full.",
    });
  });

  it("★ a session refusal its complete brought late takes the burst begun on that ticket with it: every file goes again on the new one", async () => {
    answer({
      "/api/guests/leave": [{ ok: true, body: { ok: true } }],
      "/api/guests": [
        { ok: true, body: { ok: true, session_token: "fresh-token" } },
      ],
    });
    const first = bytesThenComplete(() => OTHER_ACCOUNT);
    // The burst begun on the same ticket meets the same refusal at its presign.
    mockUploadFile.mockResolvedValueOnce(OTHER_ACCOUNT);
    const q = mountQueue({ sessionToken: STALE, isVerified: true });
    act(() => q.result.current.addFiles(many(21)));
    await waitFor(() => expect(burstMock).toHaveBeenCalledTimes(2));
    let n = 0;
    mockUploadFile.mockImplementation(async () => landed(`med-${++n}`));
    await first.answer();
    await waitFor(() =>
      expect(q.items().every((it) => it.status === "done")).toBe(true),
    );
    // One join for the lot, and the 21 went again on the fresh ticket (20, then the one past the boundary).
    expect(fetchUrls()).toEqual(["/api/guests/leave", "/api/guests"]);
    const again = burstMock.mock.calls.slice(2);
    expect(again.map((c) => c[0].identity)).toEqual([
      { session_token: "fresh-token" },
      { session_token: "fresh-token" },
    ]);
    expect(again.flatMap((c) => c[0].files)).toHaveLength(21);
    expect(q.onUploaded).toHaveBeenCalledTimes(21);
  });

  it("★ a stop is its own burst's: a file of the last burst, up with its complete asked, is too late at once while the next one goes", async () => {
    const first = bytesThenComplete((i) => landed(`med-a${i}`));
    // The next burst's file stays in the air.
    mockUploadFile.mockReturnValueOnce(new Promise<UploadOutcome>(() => {}));
    const q = mountQueue({ sessionToken: "ticket-1", isVerified: false });
    act(() => q.result.current.addFiles(many(21)));
    await waitFor(() => expect(q.items()[20]!.status).toBe("uploading"));
    let answer: unknown = "unanswered";
    await act(async () => {
      answer = await q.result.current.stop(q.items()[0]!.id);
    });
    expect(answer).toBeNull();
    expect(burstMock.mock.calls[0]![0].files[0]!.signal!.aborted).toBe(false);
    await first.answer();
    await waitFor(() => expect(q.items()[0]!.status).toBe("done"));
  });
});

/**
 * ★ A REFUSAL OF THE FILE ITSELF CARRIES THE CODE ITS SOURCE GAVE IT (red-team 54's LOW; RESHAPED ON PURPOSE in crumbs-83).
 * The uploader refuses a wrong type and a file over the ceiling before any request, and with no `code` the failure sheet
 * offered a Retry whose press sent nothing (the same check refused the same file at once). The scar kept: such a file
 * reaches every surface with the code the refusal ladder reads as "choose another", so none offers it a Retry. The expired
 * reason dropped: that the queue asked the file again with the uploader's validators (`localRefusalCode`) because the
 * uploader said no code; the uploader tags them where it decides them now (`uploader.burst.test.ts` pins that), and the
 * queue carries whatever code it is told and makes none up.
 */
describe("a refusal of the file itself that the uploader made locally", () => {
  const file = (name: string, type: string, size?: number) => {
    const f = new File([new Uint8Array([1, 2, 3])], name, { type });
    if (size !== undefined) Object.defineProperty(f, "size", { value: size });
    return f;
  };

  it("★ keeps the code the uploader tagged it with, so no surface offers it a Retry", async () => {
    mockUploadFile.mockImplementation(async ({ file: f }: { file: File }) =>
      f.type === "text/plain"
        ? {
            ok: false,
            code: "unsupported_type",
            message: "That file type isn't supported.",
          }
        : {
            ok: false,
            code: "too_large",
            message: "This file is larger than the 10 GB maximum.",
          },
    );
    const q = mountQueue({ sessionToken: "ticket-1", isVerified: false });
    act(() =>
      q.result.current.addFiles([
        file("notes.txt", "text/plain"),
        file("big.mov", "video/quicktime", 11 * 1024 ** 3),
      ]),
    );
    await waitFor(() =>
      expect(q.items().every((it) => it.status === "error")).toBe(true),
    );
    expect(q.items().map((it) => it.errorCode)).toEqual([
      "unsupported_type",
      "too_large",
    ]);
    expect(q.items().map((it) => it.error)).toEqual([
      "That file type isn't supported.",
      "This file is larger than the 10 GB maximum.",
    ]);
  });

  it("★ makes no code up: a code-less failure stays one worth another go, whatever the file it was", async () => {
    mockUploadFile.mockResolvedValue({
      ok: false,
      message: "That upload didn't go through. Please try again.",
    });
    const q = mountQueue({ sessionToken: "ticket-1", isVerified: false });
    act(() =>
      q.result.current.addFiles([
        file("notes.txt", "text/plain"),
        file("big.mov", "video/quicktime", 11 * 1024 ** 3),
        file("a.jpg", "image/jpeg"),
      ]),
    );
    await waitFor(() =>
      expect(q.items().every((it) => it.status === "error")).toBe(true),
    );
    // The old queue asked the file itself again here and named the first two `unsupported_type` and `too_large`.
    expect(q.items().map((it) => it.errorCode)).toEqual([
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("never speaks for the line: a connection that dropped stands by with no code, whatever the file", async () => {
    // RESHAPED (no-signal-wiring): "stays a failure worth another go" became "stands by" (a drop is a wait now, never
    // a failure: `drop=standby`). The scar kept: the queue makes no code up for a file the line could not carry.
    mockUploadFile.mockResolvedValue({
      ok: false,
      message: "Your connection dropped.",
      cause: "dropped",
    });
    const q = mountQueue({ sessionToken: "ticket-1", isVerified: false });
    act(() => q.result.current.addFiles([file("notes.txt", "text/plain")]));
    await waitFor(() =>
      expect(q.items()[0]).toMatchObject({
        status: "queued",
        cause: "dropped",
      }),
    );
    expect(q.items()[0]?.errorCode).toBeUndefined();
  });

  it("leaves the server's own code as it spoke it", async () => {
    mockUploadFile.mockResolvedValue({
      ok: false,
      code: "cap_reached",
      message: "This album is full right now.",
    });
    const q = mountQueue({ sessionToken: "ticket-1", isVerified: false });
    act(() => q.result.current.addFiles([file("notes.txt", "text/plain")]));
    await waitFor(() => expect(q.items()[0]?.status).toBe("error"));
    expect(q.items()[0]?.errorCode).toBe("cap_reached");
  });
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
 * THE RUN, AS ONE NUMBER (`event-header` r1, `stays=shutter`: the shutter's ring is the progress of hers on their
 * way). A derived selector over the queue the page already holds: the queue's own API does not move.
 */
describe("runProgressOf", () => {
  const NONE: ReadonlySet<string> = new Set();

  it("counts a landed or refused file whole, a going one its own share, a queued one nothing", () => {
    const progress = fakeProgress({ q2: 50 });
    const items = [
      flying("q1", { status: "done", progress: 100 }),
      flying("q2"),
      flying("q3", { status: "queued" }),
      flying("q4", { status: "error" }),
    ];
    expect(runProgressOf(items, progress, NONE)).toEqual({
      sending: 2,
      progress: 0.625,
      landed: 1,
      failed: 1,
    });
  });

  it("★ a file whose bytes are up waits for its burst's record whole, never back at nothing (compute-uploads)", () => {
    const progress = fakeProgress({ q1: 100, q2: 40 });
    const items = [
      flying("q1", { status: "queued", progress: 100 }),
      flying("q2"),
      flying("q3", { status: "queued" }),
    ];
    expect(runProgressOf(items, progress, NONE)).toMatchObject({
      sending: 3,
      progress: 0.467,
    });
  });

  it("★ leaves out what finished before the run began, but not a file going again", () => {
    const progress = fakeProgress({});
    const items = [
      flying("old", { status: "done", progress: 100 }),
      flying("retry", { status: "queued" }),
      flying("new", { status: "done", progress: 100 }),
    ];
    const run = runProgressOf(items, progress, new Set(["old", "retry"]));
    expect(run.sending).toBe(1);
    expect(run.landed).toBe(1);
    expect(run.progress).toBe(0.5);
  });

  it("is nothing at all with nothing in the run", () => {
    expect(runProgressOf([], fakeProgress(), NONE)).toEqual({
      sending: 0,
      progress: 0,
      landed: 0,
      failed: 0,
    });
  });
});

describe("useRunProgress", () => {
  it("★ starts a run when something goes where nothing was, and follows its ticks", () => {
    const progress = fakeProgress({});
    const before = [flying("old", { status: "done", progress: 100 })];
    const { result, rerender } = renderHook(
      ({ items }) => useRunProgress(items, progress),
      { initialProps: { items: before } },
    );
    expect(result.current).toEqual({
      sending: 0,
      progress: 0,
      landed: 0,
      failed: 0,
    });
    const run = [...before, flying("a"), flying("b", { status: "queued" })];
    rerender({ items: run });
    expect(result.current.sending).toBe(2);
    expect(result.current.progress).toBe(0);
    act(() => progress.tick("a", 50));
    expect(result.current.progress).toBe(0.25);
    // `a` lands and `b` goes: the run's whole is still its own two.
    const later = [
      before[0]!,
      flying("a", { status: "done", progress: 100 }),
      flying("b"),
    ];
    rerender({ items: later });
    act(() => progress.tick("b", 50));
    expect(result.current).toEqual({
      sending: 1,
      progress: 0.75,
      landed: 1,
      failed: 0,
    });
  });

  it("stands whole once the run ends, until the next begins", () => {
    const progress = fakeProgress({});
    const { result, rerender } = renderHook(
      ({ items }) => useRunProgress(items, progress),
      { initialProps: { items: [flying("a")] } },
    );
    rerender({ items: [flying("a", { status: "done", progress: 100 })] });
    expect(result.current).toEqual({
      sending: 0,
      progress: 1,
      landed: 1,
      failed: 0,
    });
    // A new pick is a new run: what landed before is not in it.
    rerender({
      items: [
        flying("a", { status: "done", progress: 100 }),
        flying("c", { status: "queued" }),
      ],
    });
    expect(result.current.sending).toBe(1);
    expect(result.current.landed).toBe(0);
    expect(result.current.progress).toBe(0);
  });
});

/**
 * ★ THE RUN'S OWN COUNT, FOR A FAILURE'S HEADING (crumbs-76; ROADMAP: "a Retry that fails again, or a slot mounted
 * mid-run, reads '1 of 0 didn't upload'"). The heading's "SENT" was how many items the queue held beyond a baseline
 * taken at the run's start, and a Retry adds no item: the baseline was the whole queue and the count nothing. The count
 * is now the run's own files by their ids (`inRun`, the queue's one definition of a run), plus any failure the heading
 * lists that an earlier try left, so what it lists is always part of what it counts.
 */
describe("runSentOf", () => {
  const NONE: ReadonlySet<string> = new Set();

  it("counts every file when nothing is known to be outside the run", () => {
    const items = [
      flying("a", { status: "done", progress: 100 }),
      flying("b", { status: "error" }),
    ];
    expect(runSentOf(items, NONE, [items[1]!])).toBe(2);
  });

  it("★ a file going again is the run's, so a Retry is a run of one, never of none", () => {
    // `a` failed in an earlier try and is queued again: it is in the run whatever else the queue holds.
    const items = [
      flying("old", { status: "done", progress: 100 }),
      flying("a", { status: "queued" }),
    ];
    expect(runSentOf(items, new Set(["old"]), [])).toBe(1);
    // ...and it is still the run's once it has failed again.
    const again = [items[0]!, flying("a", { status: "error" })];
    expect(runSentOf(again, new Set(["old"]), [again[1]!])).toBe(1);
  });

  it("★ leaves out what settled before the run began, and counts what the heading lists that did not go with it", () => {
    const old = flying("old", { status: "done", progress: 100 });
    const left = flying("left", { status: "error" });
    const again = flying("again", { status: "error" });
    // `left` failed in an earlier try and was not retried: listed, so counted (never "2 of 1").
    expect(
      runSentOf([old, left, again], new Set(["old", "left"]), [left, again]),
    ).toBe(2);
    // Not listed (dismissed to the next surface, say), it is outside the run.
    expect(
      runSentOf([old, left, again], new Set(["old", "left"]), [again]),
    ).toBe(1);
  });
});

/**
 * ★ HOW MANY OF THE RUN'S FILES HAVE LANDED (red-team 54b's NIT), the other half of "N of SENT didn't upload": the sheet
 * may say the rest is in the album only when every file it does not list has landed, and a file going again after a Retry
 * is not one of them until it does.
 */
describe("runLandedOf", () => {
  const NONE: ReadonlySet<string> = new Set();

  it("counts the files that landed, not the ones going or refused", () => {
    const items = [
      flying("a", { status: "done", progress: 100 }),
      flying("b", { status: "uploading", progress: 40 }),
      flying("c", { status: "error" }),
      flying("d", { status: "queued" }),
    ];
    expect(runLandedOf(items, NONE)).toBe(1);
  });

  it("leaves out what landed before the run began", () => {
    const items = [
      flying("old", { status: "done", progress: 100 }),
      flying("a", { status: "done", progress: 100 }),
    ];
    expect(runLandedOf(items, new Set(["old"]))).toBe(1);
  });
});

describe("useRunCounts", () => {
  const failuresOf = (items: readonly QueueItem[]) =>
    items.filter((it) => it.status === "error");
  const countsOf = (items: readonly QueueItem[]) =>
    renderHook(({ items }) => useRunCounts(items, failuresOf(items)), {
      initialProps: { items },
    });

  it("★ a row's Retry on a run that failed whole is a run of two with none landed while it goes, then one landed", () => {
    const failed = [
      flying("a", { status: "error" }),
      flying("b", { status: "error" }),
    ];
    const { result, rerender } = countsOf([
      flying("a", { status: "queued" }),
      flying("b", { status: "queued" }),
    ]);
    rerender({ items: failed });
    expect(result.current).toEqual({ sent: 2, landed: 0 });
    // a's own Retry: it goes up again, b stays listed.
    rerender({
      items: [flying("a", { status: "uploading" }), failed[1]!],
    });
    expect(result.current).toEqual({ sent: 2, landed: 0 });
    // ...and lands.
    rerender({
      items: [flying("a", { status: "done", progress: 100 }), failed[1]!],
    });
    expect(result.current).toEqual({ sent: 2, landed: 1 });
  });

  it("agrees with useRunSent on what the run is", () => {
    const items = [
      flying("a", { status: "done", progress: 100 }),
      flying("b", { status: "error" }),
    ];
    const counts = countsOf(items);
    const sent = renderHook(() => useRunSent(items, failuresOf(items)));
    expect(counts.result.current.sent).toBe(sent.result.current);
  });
});

describe("useRunSent", () => {
  /** The queue as the failure heading reads it: the items, and the failures it lists. */
  const failuresOf = (items: readonly QueueItem[]) =>
    items.filter((it) => it.status === "error");
  const sentOf = (items: readonly QueueItem[]) =>
    renderHook(({ items }) => useRunSent(items, failuresOf(items)), {
      initialProps: { items },
    });

  it("★ a Retry that fails again reads the run it was, never 1 of 0", () => {
    const first = [flying("a", { status: "error" })];
    const { result, rerender } = sentOf(first);
    expect(result.current).toBe(1);
    // Retry: the very item goes queued, no item is added.
    rerender({ items: [flying("a", { status: "queued" })] });
    // ...and it fails again.
    rerender({ items: [flying("a", { status: "error" })] });
    expect(result.current).toBe(1);
  });

  it("★ a run begun here counts its own files and leaves out what an earlier run landed", () => {
    const earlier = [flying("old", { status: "done", progress: 100 })];
    const { result, rerender } = sentOf(earlier);
    rerender({
      items: [...earlier, flying("a"), flying("b", { status: "queued" })],
    });
    rerender({
      items: [
        ...earlier,
        flying("a", { status: "done", progress: 100 }),
        flying("b", { status: "error" }),
      ],
    });
    expect(result.current).toBe(2);
  });

  it("★ a mount mid-run counts everything it holds: it never saw the run begin", () => {
    // The door's run is going when the slot mounts: two landed, one in the air, one waiting.
    const held = [
      flying("a", { status: "done", progress: 100 }),
      flying("b", { status: "done", progress: 100 }),
      flying("c"),
      flying("d", { status: "queued" }),
    ];
    const { result, rerender } = sentOf(held);
    rerender({
      items: [
        held[0]!,
        held[1]!,
        flying("c", { status: "error" }),
        flying("d", { status: "error" }),
      ],
    });
    expect(result.current).toBe(4);
  });

  it("★ a single Retry beside failures still listed is that go continuing: the whole stays what it was", () => {
    // Five went out together and three did not (the whole is five); the first of the three is retried, the other two
    // stay listed, and the retry's run is a file of the same go.
    const first = [
      flying("a", { status: "uploading" }),
      flying("b", { status: "queued" }),
      flying("c", { status: "queued" }),
      flying("d", { status: "queued" }),
      flying("e", { status: "queued" }),
    ];
    const { result, rerender } = sentOf(first);
    const ended = [
      flying("a", { status: "error" }),
      flying("b", { status: "error" }),
      flying("c", { status: "error" }),
      flying("d", { status: "done", progress: 100 }),
      flying("e", { status: "done", progress: 100 }),
    ];
    rerender({ items: ended });
    expect(result.current).toBe(5);
    rerender({ items: [flying("a", { status: "queued" }), ...ended.slice(1)] });
    // Two listed beside the one going again, in the same five: never "2 of 1", and never a whole that shrank to three.
    expect(result.current).toBe(5);
    rerender({ items: [flying("a", { status: "error" }), ...ended.slice(1)] });
    expect(result.current).toBe(5);
  });

  it("★ a Retry of everything listed is a go of its own: the files going again, and nothing that landed before", () => {
    const first = [
      flying("a", { status: "uploading" }),
      flying("b", { status: "queued" }),
      flying("c", { status: "queued" }),
    ];
    const { result, rerender } = sentOf(first);
    const ended = [
      flying("a", { status: "error" }),
      flying("b", { status: "error" }),
      flying("c", { status: "done", progress: 100 }),
    ];
    rerender({ items: ended });
    expect(result.current).toBe(3);
    rerender({
      items: [
        flying("a", { status: "queued" }),
        flying("b", { status: "queued" }),
        ended[2]!,
      ],
    });
    rerender({
      items: [
        flying("a", { status: "error" }),
        flying("b", { status: "error" }),
        ended[2]!,
      ],
    });
    expect(result.current).toBe(2);
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

/**
 * ★ HER CHOICE AT THE HELD DOOR (`locked-door` r2, Will's `wait=pick`): she chooses what she will add
 * while the host decides, and the queue holds it. Her ticket at that door is a waiting one the routes
 * refuse in the private album's words, so the pins are what the door promises her: "Nothing is sent
 * until you're let in", and then that it goes in the moment she is.
 */
describe("her choice at the held door", () => {
  it("★ is held, never sent and never failed, while the door holds her, whatever ticket the device keeps", async () => {
    answer({});
    mockUploadFile.mockResolvedValue(landed("med-1"));
    const q = mountQueue({
      sessionToken: STALE,
      isVerified: true,
      doorOpen: false,
    });

    act(() =>
      q.result.current.holdAtDoor([makeFile("a.jpg"), makeFile("b.jpg")]),
    );
    expect(q.items().map((it) => it.status)).toEqual(["queued", "queued"]);

    // A ticket arriving under the held door (the ask's own, adopted) starts nothing either.
    q.rerender({
      sessionToken: "w".repeat(64),
      isVerified: true,
      doorOpen: false,
    });
    // And an Add that somehow reaches the queue while the door holds her waits with the rest.
    act(() => q.result.current.addFiles([makeFile("c.jpg")]));
    await act(async () => {});
    expect(mockUploadFile).not.toHaveBeenCalled();
    expect(fetchUrls()).toEqual([]);
    expect(q.items().every((it) => it.status === "queued")).toBe(true);
    expect(q.onDoorNeeded).not.toHaveBeenCalled();
  });

  it("a new choice replaces the last: what is held is what the door shows her", () => {
    answer({});
    const q = mountQueue({
      sessionToken: STALE,
      isVerified: true,
      doorOpen: false,
    });
    act(() =>
      q.result.current.holdAtDoor([makeFile("a.jpg"), makeFile("b.jpg")]),
    );
    act(() => q.result.current.holdAtDoor([makeFile("c.jpg")]));
    expect(q.items().map((it) => it.file.name)).toEqual(["c.jpg"]);
  });

  it("★ goes in, on her ticket, the moment the door lets her through", async () => {
    answer({});
    mockUploadFile.mockResolvedValue(landed("med-1"));
    const WAITING_TICKET = "w".repeat(64);
    const q = mountQueue({
      sessionToken: WAITING_TICKET,
      isVerified: true,
      doorOpen: false,
    });
    act(() =>
      q.result.current.holdAtDoor([makeFile("a.jpg"), makeFile("b.jpg")]),
    );
    expect(mockUploadFile).not.toHaveBeenCalled();

    // The host lets her in: the same row is admitted (`let_guest_in` flips her waiting rows to `in`),
    // so her ticket now passes, and the refresh opens the page's door.
    q.rerender({
      sessionToken: WAITING_TICKET,
      isVerified: true,
      doorOpen: true,
    });
    await waitFor(() => expect(q.onUploaded).toHaveBeenCalledTimes(2));
    expect(sentOn(0)).toBe(WAITING_TICKET);
    expect(q.items().map((it) => it.status)).toEqual(["done", "done"]);
  });
});
