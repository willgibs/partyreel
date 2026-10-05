/**
 * ★ A CANCELED SEND'S NUMBERS TELL WHAT LANDED (the walk: "10 of 60 reached your Drive" while 14 had). The status store
 * polls only while a send's numbers can move, and a send stopped with files still on their way (`landing`) is one:
 * its page keeps asking, sees 10 become 14, and goes quiet once the last of them has landed.
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SendView } from "@/lib/drive/moments";

const { FAST_MS, resetDriveStatus, useDriveStatus } =
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

function answers(...sends: SendView[]) {
  const queue = [...sends];
  const fetchMock = vi.fn(async () => {
    const send = queue.length > 1 ? queue.shift()! : queue[0]!;
    return {
      ok: true,
      json: async () => ({
        configured: true,
        connection: null,
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
