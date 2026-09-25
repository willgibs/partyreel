/**
 * THE PAGED BIN'S LIST (album-host-wiring): `useHubBin`, behind the hub's Deleted filter.
 *
 * Nothing is read until the filter is chosen, and then the list (ids, shapes, countdowns, no links)
 * is read again each time it is chosen: a host who deletes from the album and then opens Deleted must
 * find what she just deleted there. The last list stays on screen while a new one is read, one read
 * runs at a time, and an item that leaves the bin during a read never comes back with that read.
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { BinEntry, BinManifestBody } from "@/lib/event/bin";

import { useHubBin } from "./recently-deleted-grid";

vi.mock("@/app/(app)/dashboard/[eventId]/actions", () => ({
  purgeMediaNowAction: vi.fn(),
  restoreMediaAction: vi.fn(),
}));

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const entry = (n: number): BinEntry => [id(n), 400, 300, 0, 29];

/** The bin's list route, answered by hand: each read waits until the test answers it. */
let reads: {
  url: string;
  answer: (entries: BinEntry[]) => void;
  fail: () => void;
}[] = [];

beforeEach(() => {
  reads = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(
      (url: string) =>
        new Promise((resolve) => {
          reads.push({
            url,
            answer: (entries) =>
              resolve({
                ok: true,
                status: 200,
                json: async () =>
                  ({ ok: true, entries }) satisfies BinManifestBody,
              }),
            fail: () =>
              resolve({ ok: false, status: 500, json: async () => ({}) }),
          });
        }),
    ),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const ids = (entries: readonly BinEntry[]) => entries.map((e) => e[0]);

describe("useHubBin", () => {
  it("reads nothing until the filter is chosen, then reads the list", async () => {
    const { result } = renderHook(() => useHubBin("e1"));
    expect(result.current.status).toBe("idle");
    expect(reads).toHaveLength(0);

    act(() => result.current.open());
    expect(result.current.status).toBe("loading");
    expect(reads).toHaveLength(1);
    expect(reads[0].url).toBe("/api/events/e1/bin");

    await act(async () => reads[0].answer([entry(1), entry(2)]));
    expect(result.current.status).toBe("ready");
    expect(ids(result.current.entries)).toEqual([id(1), id(2)]);
  });

  // ★ The reshape of "only once" (the old bin kept its list for the island's life because every item
  // in it cost a presign; the paged bin's list has none, and a kept list hid what she just deleted).
  it("reads the list again each time the filter is chosen, keeping the last list on screen meanwhile", async () => {
    const { result } = renderHook(() => useHubBin("e1"));
    act(() => result.current.open());
    await act(async () => reads[0].answer([entry(1)]));

    act(() => result.current.open());
    expect(reads).toHaveLength(2);
    expect(result.current.status).toBe("ready");
    expect(ids(result.current.entries)).toEqual([id(1)]);

    // She deleted a photograph from the album in between: it is in this read.
    await act(async () => reads[1].answer([entry(2), entry(1)]));
    expect(ids(result.current.entries)).toEqual([id(2), id(1)]);
  });

  it("runs one read at a time", async () => {
    const { result } = renderHook(() => useHubBin("e1"));
    act(() => {
      result.current.open();
      result.current.open();
    });
    expect(reads).toHaveLength(1);
    await act(async () => reads[0].answer([]));
    act(() => result.current.open());
    expect(reads).toHaveLength(2);
  });

  it("never brings back, with a read, an item that left the bin while it ran", async () => {
    const { result } = renderHook(() => useHubBin("e1"));
    act(() => result.current.open());
    await act(async () => reads[0].answer([entry(1), entry(2)]));

    act(() => result.current.open());
    // Restored while the read is out: the answer was read before the restore landed.
    act(() => result.current.drop([id(2)]));
    expect(ids(result.current.entries)).toEqual([id(1)]);
    await act(async () => reads[1].answer([entry(1), entry(2)]));
    expect(ids(result.current.entries)).toEqual([id(1)]);
  });

  it("says a failed first read, and keeps the list when a read again fails", async () => {
    const { result } = renderHook(() => useHubBin("e1"));
    act(() => result.current.open());
    await act(async () => reads[0].fail());
    expect(result.current.status).toBe("error");

    act(() => result.current.open());
    await act(async () => reads[1].answer([entry(1)]));
    expect(result.current.status).toBe("ready");

    act(() => result.current.open());
    await act(async () => reads[2].fail());
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(ids(result.current.entries)).toEqual([id(1)]);
  });
});
