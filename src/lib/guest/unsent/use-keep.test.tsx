/**
 * THE KEEP IN STEP WITH THE QUEUE (no-signal r1, `carry=phone`). Pinned with the store stood in (`keep.ts`'s own pins
 * hold the store): a copy for each file on its way, written as she sends it and never before an identity; put down the
 * moment it lands, is stopped or refused, even when that happens while its copy is written; re-filed when the queue's
 * ticket moves; this page's lock held only while it keeps a copy; and, once as the page opens, what an earlier page
 * kept handed back, under this page, with what is not hers put down; and (crumbs-93) what a page that closed left
 * handed back to one that stayed open, on its own line checks, its lock free.
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LINE_EVERY_MS } from "@/lib/guest/unsent/line";
import type { QueueItem } from "@/lib/guest/use-upload-queue";

const store = vi.hoisted(() => ({
  kept: new Map<string, unknown>(),
  keepOk: true,
  writes: [] as { resolve: (ok: boolean) => void; id: string }[],
  deferWrites: false,
  read: [] as unknown[],
  live: null as Set<string> | null,
  released: 0,
  held: 0,
}));

vi.mock("./keep", async (importOriginal) => {
  const real = await importOriginal<typeof import("./keep")>();
  return {
    ...real,
    keepFile: vi.fn(
      (r: { id: string }) =>
        new Promise<boolean>((resolve) => {
          const done = (ok: boolean) => {
            if (ok) store.kept.set(r.id, r);
            resolve(ok);
          };
          if (store.deferWrites) store.writes.push({ id: r.id, resolve: done });
          else done(store.keepOk);
        }),
    ),
    forgetFiles: vi.fn(async (ids: readonly string[]) => {
      for (const id of ids) store.kept.delete(id);
    }),
    readKept: vi.fn(async () => store.read),
    refile: vi.fn(async () => true),
    liveTabs: vi.fn(async () => store.live),
    aloneForAlbum: vi.fn(async (_album: string, fn: () => Promise<unknown>) =>
      fn(),
    ),
    holdThisTab: vi.fn(() => {
      store.held += 1;
      return () => {
        store.released += 1;
      };
    }),
  };
});

import { forgetFiles, keepFile, readKept, refile, thisTab } from "./keep";
import { useUnsentKeep } from "./use-keep";

type Item = Pick<
  QueueItem,
  | "id"
  | "file"
  | "status"
  | "progress"
  | "cause"
  | "takenAt"
  | "reelEligible"
  | "poster"
>;

const file = (name: string) =>
  new File([new Uint8Array([1, 2])], name, {
    type: "image/jpeg",
    lastModified: 5,
  });
const item = (
  id: string,
  status: QueueItem["status"] = "queued",
  extra: Partial<Item> = {},
): Item => ({
  id,
  file: file(`${id}.jpg`),
  status,
  progress: 0,
  ...extra,
});

function mount(initial: {
  items: Item[];
  owner?: string | null;
  enabled?: boolean;
}) {
  const onKept = vi.fn();
  const onRestore = vi.fn();
  const hook = renderHook(
    (p: { items: Item[]; owner: string | null; enabled: boolean }) =>
      useUnsentKeep({
        items: p.items,
        album: "qr-1",
        owner: p.owner,
        enabled: p.enabled,
        onKept,
        onRestore,
      }),
    {
      initialProps: {
        items: initial.items,
        owner: initial.owner === undefined ? "ticket:t-1" : initial.owner,
        enabled: initial.enabled ?? true,
      },
    },
  );
  return { ...hook, onKept, onRestore };
}

beforeEach(() => {
  vi.clearAllMocks();
  store.kept.clear();
  store.keepOk = true;
  store.writes = [];
  store.deferWrites = false;
  store.read = [];
  store.live = null;
  store.released = 0;
  store.held = 0;
});

describe("a copy for each file on its way", () => {
  it("★ copies each file as she sends it, filed under the album, its owner and this page, with what rode with it", async () => {
    const poster = new Blob([new Uint8Array([7])]);
    const k = mount({
      items: [
        item("a"),
        item("b", "uploading", { takenAt: 42, reelEligible: false, poster }),
      ],
    });
    await waitFor(() => expect(k.onKept).toHaveBeenCalledTimes(2));
    expect(k.onKept).toHaveBeenCalledWith("a", true);
    const b = vi.mocked(keepFile).mock.calls[1]![0];
    expect(b).toMatchObject({
      id: "b",
      album: "qr-1",
      owner: "ticket:t-1",
      tab: thisTab(),
      name: "b.jpg",
      type: "image/jpeg",
      lastModified: 5,
      takenAt: 42,
      reelEligible: false,
      poster,
    });
    // This page now keeps a copy: it holds its lock, so a page that opens leaves these to it.
    expect(store.held).toBe(1);
  });

  it("★ puts a copy down the moment its file lands, is refused, or leaves the queue, and lets the lock go with the last", async () => {
    const k = mount({ items: [item("a"), item("b"), item("c")] });
    await waitFor(() => expect(store.kept.size).toBe(3));
    k.rerender({
      items: [item("a", "done"), item("b", "error")],
      owner: "ticket:t-1",
      enabled: true,
    });
    await waitFor(() => expect(store.kept.size).toBe(0));
    expect(
      vi
        .mocked(forgetFiles)
        .mock.calls.flatMap(([ids]) => ids)
        .sort(),
    ).toEqual(["a", "b", "c"]);
    expect(store.released).toBe(1);
  });

  it("★ a file that lands while its copy is written has its copy put down as the write ends", async () => {
    store.deferWrites = true;
    const k = mount({ items: [item("a", "uploading")] });
    await waitFor(() => expect(store.writes).toHaveLength(1));
    k.rerender({
      items: [item("a", "done")],
      owner: "ticket:t-1",
      enabled: true,
    });
    await act(async () => store.writes[0]!.resolve(true));
    await waitFor(() => expect(store.kept.size).toBe(0));
    expect(k.onKept).not.toHaveBeenCalled();
  });

  it("★ carries a file only until its bytes are up: its complete outlives the page, so the copy goes, and is never made again", async () => {
    const k = mount({ items: [item("a", "uploading")] });
    await waitFor(() => expect(store.kept.size).toBe(1));
    // Its bytes are up and it waits for its burst's record: the complete (keepalive) will record it.
    k.rerender({
      items: [item("a", "queued", { progress: 100 })],
      owner: "ticket:t-1",
      enabled: true,
    });
    await waitFor(() => expect(store.kept.size).toBe(0));
    expect(k.onKept).toHaveBeenLastCalledWith("a", false);
    // Its complete lost its answer and it stands by for the line: it waits in this page (its kept complete asks again),
    // never carried past it, where it could only go up again whole and land twice.
    k.rerender({
      items: [item("a", "queued", { progress: 0, cause: "dropped" })],
      owner: "ticket:t-1",
      enabled: true,
    });
    await act(async () => {});
    expect(vi.mocked(keepFile)).toHaveBeenCalledTimes(1);
    expect(store.kept.size).toBe(0);
  });

  it("★ says when the phone could not hold one: that file waits in the page alone", async () => {
    store.keepOk = false;
    const k = mount({ items: [item("a")] });
    await waitFor(() => expect(k.onKept).toHaveBeenCalledWith("a", false));
    // Held while the copy was written (it might have been kept), and let go once nothing is.
    expect(store.released).toBe(store.held);
  });

  it("★ copies nothing with no one to send as, or while a door holds her, and nothing twice", async () => {
    const k = mount({ items: [item("a")], owner: null });
    k.rerender({ items: [item("a")], owner: "ticket:t-1", enabled: false });
    await act(async () => {});
    expect(keepFile).not.toHaveBeenCalled();
    k.rerender({ items: [item("a")], owner: "ticket:t-1", enabled: true });
    await waitFor(() => expect(keepFile).toHaveBeenCalledTimes(1));
    k.rerender({
      items: [item("a", "uploading")],
      owner: "ticket:t-1",
      enabled: true,
    });
    await act(async () => {});
    expect(keepFile).toHaveBeenCalledTimes(1);
  });

  it("★ re-files what it keeps when the queue's ticket moves under the run", async () => {
    const k = mount({ items: [item("a")] });
    await waitFor(() => expect(store.kept.size).toBe(1));
    k.rerender({ items: [item("a")], owner: "ticket:t-2", enabled: true });
    await waitFor(() =>
      expect(refile).toHaveBeenCalledWith(["a"], { owner: "ticket:t-2" }),
    );
  });
});

describe("once, as the page opens", () => {
  const kept = (over: Record<string, unknown>) => ({
    id: "old-1",
    album: "qr-1",
    owner: "ticket:t-1",
    tab: "tab-closed",
    at: Date.now() - 60_000,
    name: "IMG_1.jpg",
    type: "image/jpeg",
    lastModified: 3,
    blob: new Blob([new Uint8Array([1])], { type: "image/jpeg" }),
    ...over,
  });

  it("★ hands back what an earlier page kept for her, taken under this page first, and puts down what is not hers", async () => {
    store.read = [
      kept({}),
      kept({ id: "old-2", owner: "ticket:someone-else" }),
    ];
    const k = mount({ items: [] });
    await waitFor(() => expect(k.onRestore).toHaveBeenCalledTimes(1));
    const [files] = k.onRestore.mock.calls[0] as [{ id: string; file: File }[]];
    expect(files.map((f) => f.id)).toEqual(["old-1"]);
    expect(files[0]!.file.name).toBe("IMG_1.jpg");
    expect(refile).toHaveBeenCalledWith(["old-1"], { tab: thisTab() });
    expect(forgetFiles).toHaveBeenCalledWith(["old-2"]);
    // Taken and held: this page holds its lock before any page opening after it reads.
    expect(store.held).toBe(1);
  });

  it("leaves to a live page what it holds", async () => {
    store.read = [kept({ tab: "tab-frozen" })];
    store.live = new Set(["tab-frozen"]);
    const k = mount({ items: [] });
    await waitFor(() => expect(readKept).toHaveBeenCalledTimes(1));
    await act(async () => {});
    expect(k.onRestore).not.toHaveBeenCalled();
  });

  it("★ asks as it opens, and only with someone to send as: never in the demo, never at a door that holds her", async () => {
    store.read = [kept({})];
    const k = mount({ items: [], owner: null });
    await act(async () => {});
    expect(readKept).not.toHaveBeenCalled();
    k.rerender({ items: [], owner: "ticket:t-1", enabled: false });
    await act(async () => {});
    expect(readKept).not.toHaveBeenCalled();
    k.rerender({ items: [], owner: "ticket:t-1", enabled: true });
    await waitFor(() => expect(k.onRestore).toHaveBeenCalledTimes(1));
    k.rerender({ items: [], owner: "ticket:t-2", enabled: true });
    await act(async () => {});
    expect(readKept).toHaveBeenCalledTimes(1);
  });

  it("★ never puts a handed-back copy down before the queue holds it, nor writes it again once it does", async () => {
    store.read = [kept({})];
    const k = mount({ items: [] });
    await waitFor(() => expect(k.onRestore).toHaveBeenCalledTimes(1));
    // A render of the queue before it took them (an unrelated change) leaves the copy alone.
    k.rerender({
      items: [item("other", "done")],
      owner: "ticket:t-1",
      enabled: true,
    });
    await act(async () => {});
    expect(forgetFiles).not.toHaveBeenCalledWith(["old-1"]);
    // The queue holds it now, on its way: kept, never copied a second time.
    k.rerender({
      items: [item("old-1", "queued")],
      owner: "ticket:t-1",
      enabled: true,
    });
    await act(async () => {});
    expect(vi.mocked(keepFile).mock.calls.map(([r]) => r.id)).not.toContain(
      "old-1",
    );
    // And it goes the moment it lands.
    k.rerender({
      items: [item("old-1", "done")],
      owner: "ticket:t-1",
      enabled: true,
    });
    await waitFor(() => expect(forgetFiles).toHaveBeenCalledWith(["old-1"]));
  });
});

/**
 * ★ WHAT A CLOSED PAGE LEFT, ADOPTED BY ONE THAT STAYED OPEN (crumbs-93, red-team 58's LOW): the adoption was the open's
 * alone, so photographs kept by a tab that closed in a dead zone were neither sent nor said while another tab of the
 * album stayed open (30 s, then a reload sent them). The open page now looks again on its own line checks.
 */
describe("on its own line checks, after the open", () => {
  const closedPageLeft = (over: Record<string, unknown> = {}) => ({
    id: "left-1",
    album: "qr-1",
    owner: "ticket:t-1",
    tab: "tab-closed",
    at: Date.now() - 5_000,
    name: "IMG_9.jpg",
    type: "image/jpeg",
    lastModified: 3,
    blob: new Blob([new Uint8Array([1])], { type: "image/jpeg" }),
    ...over,
  });
  const look = () =>
    act(async () => {
      await vi.advanceTimersByTimeAsync(LINE_EVERY_MS);
    });

  beforeEach(() => {
    vi.useFakeTimers();
    // A lock table that lists no closed page: the closed tab's lock is free.
    store.live = new Set();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("★ hands the queue what a closed page left, on the line's cadence, under this page, and the stack can say them", async () => {
    const k = mount({ items: [] });
    await act(async () => {});
    // The open found nothing; the other tab closes afterwards, leaving two photographs.
    expect(k.onRestore).not.toHaveBeenCalled();
    store.read = [closedPageLeft(), closedPageLeft({ id: "left-2" })];
    await look();
    expect(k.onRestore).toHaveBeenCalledTimes(1);
    const [files] = k.onRestore.mock.calls[0] as [{ id: string }[]];
    expect(files.map((f) => f.id)).toEqual(["left-1", "left-2"]);
    expect(refile).toHaveBeenCalledWith(["left-1", "left-2"], {
      tab: thisTab(),
    });
    // Taken and held under this page's lock, as at an open.
    expect(store.held).toBe(1);
  });

  it("looks when the phone says it is online and when she comes back to the page, without waiting for the cadence", async () => {
    const k = mount({ items: [] });
    await act(async () => {});
    store.read = [closedPageLeft()];
    await act(async () => {
      window.dispatchEvent(new Event("online"));
    });
    expect(k.onRestore).toHaveBeenCalledTimes(1);
    store.read = [closedPageLeft({ id: "left-2" })];
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(k.onRestore).toHaveBeenCalledTimes(2);
  });

  it("★ leaves a page that is still alive its own files, a frozen one included", async () => {
    const k = mount({ items: [] });
    await act(async () => {});
    store.live = new Set(["tab-frozen"]);
    store.read = [closedPageLeft({ tab: "tab-frozen" })];
    await look();
    expect(k.onRestore).not.toHaveBeenCalled();
    expect(refile).not.toHaveBeenCalled();
  });

  it("★ takes nothing where the browser has no lock table to tell a closed page from a frozen one (only the open takes)", async () => {
    const k = mount({ items: [] });
    await act(async () => {});
    store.live = null;
    store.read = [closedPageLeft()];
    await look();
    expect(k.onRestore).not.toHaveBeenCalled();
    expect(refile).not.toHaveBeenCalled();
    expect(forgetFiles).not.toHaveBeenCalled();
  });

  it("★ never takes a record filed under this very page: that is its own copy, being put down", async () => {
    const k = mount({ items: [] });
    await act(async () => {});
    store.read = [closedPageLeft({ id: "mine", tab: thisTab() })];
    await look();
    expect(k.onRestore).not.toHaveBeenCalled();
    expect(refile).not.toHaveBeenCalled();
  });

  it("puts down what is not hers or too old, and sends nothing of it", async () => {
    const k = mount({ items: [] });
    await act(async () => {});
    store.read = [
      closedPageLeft({ id: "not-hers", owner: "ticket:someone-else" }),
      closedPageLeft({ id: "stale", at: Date.now() - 15 * 24 * 3_600_000 }),
    ];
    await look();
    expect(forgetFiles).toHaveBeenCalledWith(["not-hers", "stale"]);
    expect(k.onRestore).not.toHaveBeenCalled();
  });

  it("★ takes no lock when another page left nothing, and never looks with no one to send as, a door holding her, or a page hidden", async () => {
    const { aloneForAlbum } = await import("./keep");
    const k = mount({ items: [], owner: null });
    await look();
    expect(readKept).not.toHaveBeenCalled();
    k.rerender({ items: [], owner: "ticket:t-1", enabled: true });
    await act(async () => {});
    vi.mocked(readKept).mockClear();
    vi.mocked(aloneForAlbum).mockClear();
    // Nothing left by another page (and one filed under this page): the cheap look reads, and takes no lock.
    store.read = [closedPageLeft({ tab: thisTab() })];
    await look();
    expect(readKept).toHaveBeenCalledTimes(1);
    expect(aloneForAlbum).not.toHaveBeenCalled();
    // A page shown nowhere is not looked for.
    vi.mocked(readKept).mockClear();
    store.read = [closedPageLeft()];
    const shown = vi
      .spyOn(document, "visibilityState", "get")
      .mockReturnValue("hidden");
    await look();
    expect(readKept).not.toHaveBeenCalled();
    shown.mockRestore();
    // Disabled (a door holds her): no look either.
    k.rerender({ items: [], owner: "ticket:t-1", enabled: false });
    await look();
    expect(readKept).not.toHaveBeenCalled();
  });

  it("stops looking when the page goes", async () => {
    const k = mount({ items: [] });
    await act(async () => {});
    k.unmount();
    vi.mocked(readKept).mockClear();
    store.read = [closedPageLeft()];
    await vi.advanceTimersByTimeAsync(LINE_EVERY_MS * 3);
    expect(readKept).not.toHaveBeenCalled();
  });
});
