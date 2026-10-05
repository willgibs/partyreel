/**
 * ★ A CANCELED SEND'S NUMBERS TELL WHAT LANDED (the walk: "10 of 60 reached your Drive" while 14 had). The status store
 * polls only while a send's numbers can move, and a send stopped with files still on their way (`landing`) is one:
 * its page keeps asking, sees 10 become 14, and goes quiet once the last of them has landed.
 *
 * ★ A SEND AT WORK KEEPS THE FAST BEAT (crumbs-82; the Drive re-walk's finding): an answer that had not moved dropped
 * the page to the 15 s beat, though the lanes report every 10 s, so the strip jumped in coarse steps and a timed report
 * never showed. And ★ the store holds only the connection she has now: a send made before it is history and no place
 * reads it. RESHAPED ON PURPOSE: the file's one fixture answered `connection: null`, which now (rightly) holds no send,
 * so it answers the connection the send was made on.
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SendView } from "@/lib/drive/moments";

const { FAST_MS, SLOW_MS, resetDriveStatus, useDriveStatus } =
  await import("./use-drive-status");

const canceled = (itemsSent: number, landing: boolean): SendView => ({
  id: "j1",
  eventId: "e1",
  albumName: "Arrival",
  status: "canceled",
  pauseReason: null,
  stopReason: "canceled",
  resumeAt: null,
  includeHidden: false,
  itemsTotal: 60,
  itemsSent,
  itemsKept: 0,
  itemsSkipped: 0,
  itemsFailed: 0,
  bytesTotal: 1_600_000,
  bytesSent: itemsSent * 25_000,
  folderUrl: null,
  createdAt: "2026-10-05T17:05:00Z",
  startedAt: "2026-10-05T17:05:01Z",
  lastProgressAt: "2026-10-05T17:05:30Z",
  closedAt: "2026-10-05T17:05:31Z",
  flagDue: false,
  landing,
});

/** The connection every send below was made on: it began before the sends. */
const CONNECTION = {
  email: null,
  status: "connected" as const,
  connectedAt: "2026-10-05T16:00:00Z",
  folderUrl: null,
  free: null,
};

function answers(...sends: SendView[]) {
  const queue = [...sends];
  const fetchMock = vi.fn(async () => {
    const send = queue.length > 1 ? queue.shift()! : queue[0]!;
    return {
      ok: true,
      json: async () => ({
        configured: true,
        connection: CONNECTION,
        sends: [send],
        now: new Date().toISOString(),
      }),
    };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  resetDriveStatus();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("a stopped send still landing", () => {
  it("★ keeps its page listening until the last file has landed, then goes quiet", async () => {
    vi.useFakeTimers();
    const fetchMock = answers(
      canceled(10, true),
      canceled(14, true),
      canceled(14, false),
    );
    const { result, unmount } = renderHook(() => useDriveStatus());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.status?.sends[0]?.itemsSent).toBe(10);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(FAST_MS);
    });
    expect(result.current.status?.sends[0]?.itemsSent).toBe(14);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(FAST_MS);
    });
    expect(result.current.status?.sends[0]?.landing).toBe(false);
    const asked = fetchMock.mock.calls.length;
    // Landed: nothing moves, nothing is unfinished, the page asks no more.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(fetchMock.mock.calls.length).toBe(asked);
    expect(asked).toBe(3);
    unmount();
  });
});

const working = (status: SendView["status"], itemsSent: number): SendView => ({
  ...canceled(itemsSent, false),
  status,
  stopReason: null,
  closedAt: null,
});

describe("a send at work", () => {
  it.each(["sending", "checking"] as const)(
    "★ keeps the fast beat while it is %s, though an answer had not moved",
    async (state) => {
      vi.useFakeTimers();
      // The same answer, again and again: a poll between two of the lanes' reports.
      const fetchMock = answers(working(state, 10));
      const { unmount } = renderHook(() => useDriveStatus());
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      for (let beat = 2; beat <= 5; beat++) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(FAST_MS);
        });
        expect(fetchMock, `the poll on beat ${beat}`).toHaveBeenCalledTimes(
          beat,
        );
      }
      unmount();
    },
  );

  it("waits on the slow beat while it is only paused: nothing there moves", async () => {
    vi.useFakeTimers();
    const fetchMock = answers({
      ...working("paused", 10),
      pauseReason: "google_day",
    });
    const { unmount } = renderHook(() => useDriveStatus());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(FAST_MS * 2);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(SLOW_MS);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    unmount();
  });
});

describe("the connection she has now", () => {
  it("★ holds a send made on it and none made before it", async () => {
    const before = {
      ...working("sending", 3),
      id: "earlier",
      createdAt: "2026-10-05T15:00:00Z",
    };
    const now = { ...working("sending", 4), id: "now" };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          configured: true,
          connection: CONNECTION,
          sends: [before, now],
          now: new Date().toISOString(),
        }),
      })),
    );
    const { result, unmount } = renderHook(() => useDriveStatus());
    await act(async () => {
      await Promise.resolve();
    });
    await vi.waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.status?.sends.map((s) => s.id)).toEqual(["now"]);
    unmount();
  });
});
