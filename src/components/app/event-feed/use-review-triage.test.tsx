/**
 * THE REVIEW ROOM'S STATE MACHINE, PINNED (the ROADMAP's Host line: "no test covers
 * `useReviewTriage`"; host-curation's seven since curation-wiring).
 *
 * What is contract here is the host's trust in the queue: a verdict LEADS with the result (the
 * tiles leave at once) and a failure puts every tile back with a sentence; a landed verdict names
 * itself on a toast whose Undo puts the uploads back where they were and returns them on the
 * server (and takes them away again if the server refuses); the whole queue approves in batches of
 * the bulk cap, so Approve all reaches past it; the last tile plays the all-caught-up beat, unless
 * uploads wait behind the line, which never join the grid on their own; a verdict never runs twice
 * on one upload; an upload decided somewhere else leaves, one the room acted on never does while
 * the album has not read that write back, and once it has, the album is its truth again (an upload
 * decided here that comes back to waiting is new, behind the line); the peek moves on from what it
 * just judged; and moderation off is its own state whatever the queue holds. Not a duration, a
 * class or a word of copy is pinned beyond the verdict's own sentence.
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type GridMedia } from "@/components/app/media-grid";
import { MAX_BULK_ITEMS } from "@/lib/event/bulk-selection";
import { setReducedMotion } from "../../../../vitest.setup";

import { useReviewTriage, type ReviewLive } from "./use-review-triage";

const { approveBulkAction, hideBulkAction, returnToReviewAction, toast } =
  vi.hoisted(() => ({
    approveBulkAction: vi.fn(),
    hideBulkAction: vi.fn(),
    returnToReviewAction: vi.fn(),
    toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
  }));

vi.mock("@/app/(app)/dashboard/[eventId]/actions", () => ({
  approveBulkAction: (...args: unknown[]) => approveBulkAction(...args),
  hideBulkAction: (...args: unknown[]) => hideBulkAction(...args),
  returnToReviewAction: (...args: unknown[]) => returnToReviewAction(...args),
}));
vi.mock("sonner", () => ({ toast }));
// The beat's and the exit's clocks are CSS variables; a test reads them as instant.
vi.mock("@/lib/shared/read-css-ms", () => ({ readCssMs: () => 0 }));

const item = (i: number | string): GridMedia => ({
  id: `m${i}`,
  type: "photo",
  url: `signed:m${i}`,
  status: "pending",
});
const ids = (list: readonly { id: string }[]) => list.map((p) => p.id);

type ToastOptions = { action: { label: string; onClick: () => void } };

/** The Undo on the newest toast of a tone. */
function undoOn(tone: "success" | "warning"): () => void {
  const calls = toast[tone].mock.calls;
  const options = calls[calls.length - 1][1] as ToastOptions;
  expect(options.action.label).toBe("Undo");
  return options.action.onClick;
}

beforeEach(() => {
  for (const fn of [approveBulkAction, hideBulkAction, returnToReviewAction]) {
    fn.mockReset();
    fn.mockResolvedValue({ ok: true });
  }
  toast.success.mockReset();
  toast.error.mockReset();
  toast.warning.mockReset();
  setReducedMotion(false);
});

type Props = {
  items: GridMedia[];
  moderationOn: boolean;
  live?: ReviewLive | null;
};

function triage(items: GridMedia[], moderationOn = true, live?: ReviewLive) {
  return renderHook(
    (props: Props) => useReviewTriage({ eventId: "ev-1", ...props }),
    { initialProps: { items, moderationOn, live } as Props },
  );
}

function liveQueue(
  waiting: string[],
  decided: string[] = [],
  media = vi.fn(async (want: readonly string[]) =>
    want.map((id) => item(id.slice(1))),
  ),
) {
  return {
    waiting,
    decided: new Set(decided),
    media,
    // The album's catch-up, answered at once: the room's write has been read back.
    sync: vi.fn(async () => {}),
  };
}

/** A live queue whose catch-ups are still in the air: nothing the room writes is read back yet. */
function unanswered(waiting: string[], decided: string[] = []) {
  const live = liveQueue(waiting, decided);
  live.sync.mockImplementation(() => new Promise<void>(() => {}));
  return live;
}

describe("the queue's states", () => {
  it("is pending with a queue, caught up without one, and off whenever moderation is", () => {
    expect(triage([item(1)]).result.current.visualState).toBe("pending");
    expect(triage([]).result.current.visualState).toBe("caught-up");
    // Moderation off is its own state even with items (the discovery teaser).
    expect(triage([item(1)], false).result.current.visualState).toBe(
      "moderation-off",
    );
  });

  it("is never caught up while uploads wait behind the line, grid or no grid", () => {
    const { result } = triage([], true, liveQueue(["m9"]));
    expect(result.current.pending).toEqual([]);
    expect(result.current.arrivals).toBe(1);
    expect(result.current.visualState).toBe("pending");
  });
});

describe("approving and rejecting", () => {
  it("removes the acted tiles at once and names the verdict on a toast with its Undo", async () => {
    const { result } = triage([item(1), item(2), item(3)]);
    await act(async () => {
      await result.current.run("approve", ["m1", "m2"]);
    });
    expect(ids(result.current.pending)).toEqual(["m3"]);
    expect(approveBulkAction).toHaveBeenCalledWith("ev-1", ["m1", "m2"]);
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.success.mock.calls[0][0]).toBe("Approved 2 photos");
    undoOn("success");
  });

  it("rejects with the warning a refusal wears (the row lands hidden)", async () => {
    const { result } = triage([item(1), item(2)]);
    await act(async () => {
      await result.current.run("reject", ["m1"]);
    });
    expect(hideBulkAction).toHaveBeenCalledWith("ev-1", ["m1"]);
    expect(toast.warning).toHaveBeenCalledTimes(1);
    expect(toast.warning.mock.calls[0][0]).toBe("Rejected 1 photo");
    expect(ids(result.current.pending)).toEqual(["m2"]);
  });

  it("puts every tile back, with a sentence, when the server refuses", async () => {
    approveBulkAction.mockResolvedValue({ ok: false, message: "Nope." });
    const { result } = triage([item(1), item(2)]);
    await act(async () => {
      await result.current.run("approve", ["m1"]);
    });
    expect(ids(result.current.pending)).toEqual(["m1", "m2"]);
    expect(toast.error).toHaveBeenCalledWith("Nope.");
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("approves a queue past the bulk cap in batches, so Approve all reaches all of it", async () => {
    const queue = Array.from({ length: MAX_BULK_ITEMS + 5 }, (_, i) => item(i));
    const { result } = triage(queue);
    await act(async () => {
      result.current.approveAll();
    });
    await waitFor(() => expect(approveBulkAction).toHaveBeenCalledTimes(2));
    const [first, second] = approveBulkAction.mock.calls.map(
      (call) => call[1] as string[],
    );
    expect(first).toHaveLength(MAX_BULK_ITEMS);
    expect(second).toHaveLength(5);
  });

  // ★ RESHAPED (curation-wiring). This pinned that a second run did nothing while one was in
  // flight, a single-flight lock that guarded against a double tap. The keyboard made that lock a
  // fault (a host pressing Enter down a queue would lose every press inside a round trip), so the
  // scar it keeps is narrower and exact: an upload whose verdict is in the air is never acted on
  // twice, while a press on another upload runs beside it.
  it("never acts twice on an upload whose verdict is in the air; another upload's runs beside it", async () => {
    let release: (v: { ok: boolean }) => void = () => {};
    approveBulkAction.mockReturnValueOnce(
      new Promise((resolve) => {
        release = resolve;
      }),
    );
    const { result } = triage([item(1), item(2), item(3)]);
    await act(async () => {
      await result.current.run("approve", []);
    });
    expect(approveBulkAction).not.toHaveBeenCalled();

    let first: Promise<void> = Promise.resolve();
    act(() => {
      first = result.current.decide("approve", "m1");
    });
    await waitFor(() => expect(approveBulkAction).toHaveBeenCalledTimes(1));
    await act(async () => {
      await result.current.decide("approve", "m1");
    });
    expect(approveBulkAction).toHaveBeenCalledTimes(1);
    await act(async () => {
      await result.current.decide("reject", "m2");
    });
    expect(hideBulkAction).toHaveBeenCalledWith("ev-1", ["m2"]);
    await act(async () => {
      release({ ok: true });
      await first;
    });
    expect(ids(result.current.pending)).toEqual(["m3"]);
  });

  it("holds the bar only while a bulk verdict runs, never for one upload's", async () => {
    let release: (v: { ok: boolean }) => void = () => {};
    approveBulkAction.mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      }),
    );
    const { result } = triage([item(1), item(2)]);
    let one: Promise<void> = Promise.resolve();
    act(() => {
      one = result.current.decide("approve", "m1");
    });
    expect(result.current.busy).toBe(false);
    let bulk: Promise<void> = Promise.resolve();
    act(() => {
      bulk = result.current.run("approve", ["m2"]);
    });
    await waitFor(() => expect(result.current.busy).toBe(true));
    await act(async () => {
      release({ ok: true });
      await Promise.all([one, bulk]);
    });
    expect(result.current.busy).toBe(false);
  });
});

describe("Undo on the verdict's toast", () => {
  it("puts an approve's uploads back where they were, then returns them on the server", async () => {
    const { result } = triage([item(1), item(2), item(3)]);
    await act(async () => {
      await result.current.run("approve", ["m2"]);
    });
    expect(ids(result.current.pending)).toEqual(["m1", "m3"]);
    await act(async () => {
      undoOn("success")();
    });
    expect(ids(result.current.pending)).toEqual(["m1", "m2", "m3"]);
    expect(returnToReviewAction).toHaveBeenCalledWith(
      "ev-1",
      ["m2"],
      "approved",
    );
  });

  it("returns a reject's uploads from where a reject leaves them, hidden", async () => {
    const { result } = triage([item(1), item(2)]);
    await act(async () => {
      await result.current.decide("reject", "m1");
    });
    await act(async () => {
      undoOn("warning")();
    });
    expect(ids(result.current.pending)).toEqual(["m1", "m2"]);
    expect(returnToReviewAction).toHaveBeenCalledWith("ev-1", ["m1"], "hidden");
  });

  it("takes them away again, in the server's words, when the Undo is refused", async () => {
    returnToReviewAction.mockResolvedValue({
      ok: false,
      code: "validation",
      message: "Review is off.",
    });
    const { result } = triage([item(1), item(2)]);
    await act(async () => {
      await result.current.run("approve", ["m1"]);
    });
    await act(async () => {
      undoOn("success")();
    });
    await waitFor(() => expect(ids(result.current.pending)).toEqual(["m2"]));
    expect(toast.error).toHaveBeenCalledWith("Review is off.");
  });

  it("brings an emptied queue back from caught up", async () => {
    const { result } = triage([item(1)]);
    await act(async () => {
      result.current.approveAll();
    });
    await waitFor(() => expect(result.current.visualState).toBe("caught-up"));
    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
    await act(async () => {
      undoOn("success")();
    });
    expect(result.current.visualState).toBe("pending");
    expect(ids(result.current.pending)).toEqual(["m1"]);
  });
});

describe("the last tile", () => {
  it("plays the all-caught-up beat, then settles caught up, its toast carrying the Undo", async () => {
    const { result } = triage([item(1)]);
    await act(async () => {
      await result.current.run("approve", ["m1"]);
    });
    expect(result.current.visualState).toBe("caught-up");
    expect(result.current.beatKind).toBe("approve");
    undoOn("success");
  });

  // ★ RESHAPED (curation-wiring). Under reduced motion this pinned a separate "All caught up"
  // toast standing in for the beat. Every verdict now names itself on a toast (its Undo rides
  // there), so that toast IS the confirmation the beat's absence needs, and a second one would
  // stack two sentences for one act. The scar kept: reduced motion still confirms the last tile.
  it("confirms the last tile with the verdict's own toast under reduced motion", async () => {
    setReducedMotion(true);
    const { result } = triage([item(1)]);
    await act(async () => {
      await result.current.run("approve", ["m1"]);
    });
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.success.mock.calls[0][0]).toBe("Approved 1 photo");
    expect(result.current.visualState).toBe("caught-up");
  });

  it("promises nothing while uploads wait behind the line", async () => {
    // The album still shows m1 waiting because its catch-up is in the air (`unanswered`): the
    // line counts m9 alone, since the room's own verdict speaks for m1 until it is read back.
    const { result } = triage([item(1)], true, unanswered(["m9", "m1"]));
    await act(async () => {
      await result.current.run("approve", ["m1"]);
    });
    expect(result.current.visualState).toBe("pending");
    expect(result.current.arrivals).toBe(1);
  });
});

describe("a server render of the queue", () => {
  // ★ RESHAPED (curation-wiring, host-curation `arrivals=prompt`). This pinned that a new server
  // render replaced the room's list whole. An upload that arrived since the host started must
  // never slip into the grid on its own, so the scar kept is that a server render is never
  // ignored: what it holds that the room has not shown waits behind the line, tile in hand.
  it("holds a render's new uploads behind the line, and a tap folds them in at the head", async () => {
    const { result, rerender } = triage([item(1), item(2)]);
    rerender({ items: [item(9), item(1), item(2)], moderationOn: true });
    expect(ids(result.current.pending)).toEqual(["m1", "m2"]);
    expect(result.current.arrivals).toBe(1);
    let joined: string[] = [];
    await act(async () => {
      joined = await result.current.foldIn();
    });
    expect(joined).toEqual(["m9"]);
    expect(ids(result.current.pending)).toEqual(["m9", "m1", "m2"]);
    expect(result.current.arrivals).toBe(0);
  });

  it("drops what a render no longer holds, never what the room acted on", async () => {
    const { result, rerender } = triage([item(1), item(2), item(3)]);
    await act(async () => {
      await result.current.decide("approve", "m1");
    });
    await act(async () => {
      undoOn("success")();
    });
    // A render read before the Undo landed: m1 decided, m3 decided elsewhere.
    rerender({ items: [item(2)], moderationOn: true });
    expect(ids(result.current.pending)).toEqual(["m1", "m2"]);
  });

  it("keeps the local list when the server hands back the same set", async () => {
    const { result, rerender } = triage([item(1), item(2)]);
    await act(async () => {
      await result.current.run("approve", ["m1"]);
    });
    // The same ids as the mount: no real change, so the optimistic removal stands.
    rerender({ items: [item(1), item(2)], moderationOn: true });
    expect(ids(result.current.pending)).toEqual(["m2"]);
  });
});

describe("the live queue (the host's album)", () => {
  it("counts the album's waiting uploads the room has not shown, and folds them in with their tiles", async () => {
    const live = liveQueue(["mn1", "mn2", "m1", "m2"]);
    const { result } = triage([item(1), item(2)], true, live);
    expect(result.current.arrivals).toBe(2);
    await act(async () => {
      await result.current.foldIn();
    });
    expect(live.media).toHaveBeenCalledWith(["mn1", "mn2"]);
    expect(ids(result.current.pending)).toEqual(["mn1", "mn2", "m1", "m2"]);
    expect(result.current.pending[0].status).toBe("pending");
    expect(result.current.arrivals).toBe(0);
  });

  it("drops an upload decided elsewhere or taken back, never one the room acted on", async () => {
    const queue = [item(1), item(2), item(3), item(4)];
    const { result, rerender } = triage(
      queue,
      true,
      unanswered(["m1", "m2", "m3", "m4"]),
    );
    await act(async () => {
      await result.current.decide("approve", "m4");
    });
    await act(async () => {
      undoOn("success")();
    });
    // m2 approved in another tab, m3 taken back by its guest, m4's Undo not read back yet (a poll
    // read before it landed says decided).
    rerender({
      items: queue,
      moderationOn: true,
      live: unanswered(["m1"], ["m2", "m4"]),
    });
    expect(ids(result.current.pending)).toEqual(["m1", "m4"]);
  });

  // ★ ROADMAP's review-room line (build 15's red-team): an upload the room decided never left
  // `known`, so one that returned to waiting from elsewhere was neither in the grid nor on the line,
  // and Approve all could play "All caught up" over it, until a reload.
  it("★ counts an upload decided here that comes back from elsewhere as new, once the album read the verdict back", async () => {
    const queue = [item(1), item(2)];
    const { result, rerender } = triage(queue, true, liveQueue(["m1", "m2"]));
    await act(async () => {
      await result.current.decide("approve", "m1");
    });
    // The catch-up read the verdict back: m1 decided.
    rerender({
      items: queue,
      moderationOn: true,
      live: liveQueue(["m2"], ["m1"]),
    });
    expect(result.current.arrivals).toBe(0);
    // A second room tab's Undo puts m1 back in the queue.
    rerender({
      items: queue,
      moderationOn: true,
      live: liveQueue(["m1", "m2"]),
    });
    expect(ids(result.current.pending)).toEqual(["m2"]);
    expect(result.current.arrivals).toBe(1);
    // So clearing the grid plays no "All caught up": m1 waits behind the line.
    await act(async () => {
      await result.current.run("approve", ["m2"]);
    });
    rerender({
      items: queue,
      moderationOn: true,
      live: liveQueue(["m1"], ["m2"]),
    });
    expect(result.current.visualState).toBe("pending");
    expect(result.current.arrivals).toBe(1);
    await act(async () => {
      await result.current.foldIn();
    });
    expect(ids(result.current.pending)).toEqual(["m1"]);
  });

  it("never counts its own verdict as new while the album has not read it back", async () => {
    const queue = [item(1), item(2)];
    const { result, rerender } = triage(queue, true, unanswered(["m1", "m2"]));
    await act(async () => {
      await result.current.decide("approve", "m1");
    });
    // A poll read before the verdict landed still says m1 is waiting.
    rerender({
      items: queue,
      moderationOn: true,
      live: unanswered(["m1", "m2"]),
    });
    expect(result.current.arrivals).toBe(0);
    expect(ids(result.current.pending)).toEqual(["m2"]);
  });

  it("drops an upload put back here and decided elsewhere, once the album read the Undo back", async () => {
    const queue = [item(1), item(2)];
    const { result, rerender } = triage(queue, true, liveQueue(["m1", "m2"]));
    await act(async () => {
      await result.current.decide("approve", "m1");
    });
    await act(async () => {
      undoOn("success")();
    });
    await waitFor(() =>
      expect(ids(result.current.pending)).toEqual(["m1", "m2"]),
    );
    // Read back (m1 waiting again), then approved in another tab.
    rerender({
      items: queue,
      moderationOn: true,
      live: liveQueue(["m1", "m2"]),
    });
    rerender({
      items: queue,
      moderationOn: true,
      live: liveQueue(["m2"], ["m1"]),
    });
    expect(ids(result.current.pending)).toEqual(["m2"]);
  });

  it("counts one that comes back into the queue as new again, behind the line", () => {
    const queue = [item(1), item(2)];
    const { result, rerender } = triage(queue, true, liveQueue(["m1", "m2"]));
    // Approved in another tab, then that tab's Undo put it back.
    rerender({
      items: queue,
      moderationOn: true,
      live: liveQueue(["m1"], ["m2"]),
    });
    expect(ids(result.current.pending)).toEqual(["m1"]);
    rerender({
      items: queue,
      moderationOn: true,
      live: liveQueue(["m1", "m2"]),
    });
    expect(ids(result.current.pending)).toEqual(["m1"]);
    expect(result.current.arrivals).toBe(1);
  });

  it("asks the album to catch up once a verdict lands, and once its Undo does", async () => {
    const live = liveQueue(["m1", "m2"]);
    const { result } = triage([item(1), item(2)], true, live);
    await act(async () => {
      await result.current.decide("approve", "m1");
    });
    expect(live.sync).toHaveBeenCalledTimes(1);
    await act(async () => {
      undoOn("success")();
    });
    await waitFor(() => expect(live.sync).toHaveBeenCalledTimes(2));
  });
});

describe("the peek", () => {
  it("moves on from what it just judged: to the next, the one before at the end, then closes", async () => {
    const { result } = triage([item(1), item(2), item(3)]);
    act(() => result.current.setPeekId("m2"));
    expect(result.current.peekId).toBe("m2");
    await act(async () => {
      await result.current.decide("approve", "m2");
    });
    expect(result.current.peekId).toBe("m3");
    await act(async () => {
      await result.current.decide("reject", "m3");
    });
    expect(result.current.peekId).toBe("m1");
    await act(async () => {
      await result.current.decide("approve", "m1");
    });
    expect(result.current.peekId).toBeNull();
  });

  it("shows nothing once its upload left the queue some other way", () => {
    const queue = [item(1), item(2)];
    const { result, rerender } = triage(queue, true, liveQueue(["m1", "m2"]));
    act(() => result.current.setPeekId("m2"));
    rerender({
      items: queue,
      moderationOn: true,
      live: liveQueue(["m1"], ["m2"]),
    });
    expect(result.current.peekId).toBeNull();
  });
});
