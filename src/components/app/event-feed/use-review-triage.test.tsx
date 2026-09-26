/**
 * THE REVIEW ROOM'S STATE MACHINE, PINNED (the ROADMAP's Host line: "no test covers
 * `useReviewTriage`").
 *
 * What is contract here is the host's trust in the queue: an approve or hide LEADS with the
 * result (the tiles leave at once) and a failure puts every tile back with a sentence; the whole
 * queue approves in batches of the bulk cap, so Approve all reaches past it; the last tile plays
 * the all-caught-up beat (a toast under reduced motion); a fresh render of the queue re-syncs it
 * without clobbering a beat in flight; and moderation off is its own state whatever the queue
 * holds. Not a duration, a class or a word of copy is pinned.
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type GridMedia } from "@/components/app/media-grid";
import { MAX_BULK_ITEMS } from "@/lib/event/bulk-selection";
import { setReducedMotion } from "../../../../vitest.setup";

import { useReviewTriage } from "./use-review-triage";

const { approveBulkAction, hideBulkAction, toast } = vi.hoisted(() => ({
  approveBulkAction: vi.fn(),
  hideBulkAction: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

vi.mock("@/app/(app)/dashboard/[eventId]/actions", () => ({
  approveBulkAction: (...args: unknown[]) => approveBulkAction(...args),
  hideBulkAction: (...args: unknown[]) => hideBulkAction(...args),
}));
vi.mock("sonner", () => ({ toast }));
// The beat's and the exit's clocks are CSS variables; a test reads them as instant.
vi.mock("@/lib/shared/read-css-ms", () => ({ readCssMs: () => 0 }));

const item = (i: number): GridMedia => ({
  id: `m${i}`,
  type: "photo",
  url: `signed:m${i}`,
  status: "pending",
});

beforeEach(() => {
  approveBulkAction.mockReset();
  approveBulkAction.mockResolvedValue({ ok: true });
  hideBulkAction.mockReset();
  hideBulkAction.mockResolvedValue({ ok: true });
  toast.success.mockReset();
  toast.error.mockReset();
  toast.warning.mockReset();
  setReducedMotion(false);
});

function triage(items: GridMedia[], moderationOn = true) {
  return renderHook(
    (props: { items: GridMedia[]; moderationOn: boolean }) =>
      useReviewTriage({ eventId: "ev-1", ...props }),
    { initialProps: { items, moderationOn } },
  );
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
});

describe("approving and hiding", () => {
  it("removes the acted tiles at once and tells the host how many", async () => {
    const { result } = triage([item(1), item(2), item(3)]);
    await act(async () => {
      await result.current.run("approve", ["m1", "m2"]);
    });
    expect(result.current.pending.map((p) => p.id)).toEqual(["m3"]);
    expect(approveBulkAction).toHaveBeenCalledWith("ev-1", ["m1", "m2"]);
    expect(toast.success).toHaveBeenCalledTimes(1);
  });

  it("hides with the warning a hide always wears", async () => {
    const { result } = triage([item(1), item(2)]);
    await act(async () => {
      await result.current.run("hide", ["m1"]);
    });
    expect(hideBulkAction).toHaveBeenCalledWith("ev-1", ["m1"]);
    expect(toast.warning).toHaveBeenCalledTimes(1);
    expect(result.current.pending.map((p) => p.id)).toEqual(["m2"]);
  });

  it("puts every tile back, with a sentence, when the server refuses", async () => {
    approveBulkAction.mockResolvedValue({ ok: false, message: "Nope." });
    const { result } = triage([item(1), item(2)]);
    await act(async () => {
      await result.current.run("approve", ["m1"]);
    });
    expect(result.current.pending.map((p) => p.id)).toEqual(["m1", "m2"]);
    expect(toast.error).toHaveBeenCalledWith("Nope.");
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

  it("does nothing for an empty selection or while a run is in flight", async () => {
    let release: (v: { ok: boolean }) => void = () => {};
    approveBulkAction.mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      }),
    );
    const { result } = triage([item(1), item(2)]);
    await act(async () => {
      await result.current.run("approve", []);
    });
    expect(approveBulkAction).not.toHaveBeenCalled();

    let first: Promise<void> = Promise.resolve();
    act(() => {
      first = result.current.run("approve", ["m1"]);
    });
    await waitFor(() => expect(result.current.busy).toBe(true));
    await act(async () => {
      await result.current.run("approve", ["m2"]);
    });
    expect(approveBulkAction).toHaveBeenCalledTimes(1);
    await act(async () => {
      release({ ok: true });
      await first;
    });
    expect(result.current.busy).toBe(false);
  });
});

describe("the last tile", () => {
  it("plays the all-caught-up beat, then settles caught up", async () => {
    const { result } = triage([item(1)]);
    await act(async () => {
      await result.current.run("approve", ["m1"]);
    });
    // The beat ran (and, at zero length, finished) with no toast: the beat IS the feedback.
    expect(result.current.visualState).toBe("caught-up");
    expect(result.current.beatKind).toBe("approve");
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("confirms with a toast instead of the beat under reduced motion", async () => {
    setReducedMotion(true);
    const { result } = triage([item(1)]);
    await act(async () => {
      await result.current.run("approve", ["m1"]);
    });
    expect(toast.success).toHaveBeenCalledWith("All caught up");
    expect(result.current.visualState).toBe("caught-up");
  });
});

describe("a fresh render of the queue", () => {
  it("re-syncs to the server's queue when its set changes", () => {
    const { result, rerender } = triage([item(1)]);
    rerender({ items: [item(1), item(2)], moderationOn: true });
    expect(result.current.pending.map((p) => p.id)).toEqual(["m1", "m2"]);
  });

  it("keeps the local list when the server hands back the same set", async () => {
    const { result, rerender } = triage([item(1), item(2)]);
    await act(async () => {
      await result.current.run("approve", ["m1"]);
    });
    // The same ids as the mount: no real change, so the optimistic removal stands until the
    // server's own queue (without m1) arrives.
    rerender({ items: [item(1), item(2)], moderationOn: true });
    expect(result.current.pending.map((p) => p.id)).toEqual(["m2"]);
  });
});
