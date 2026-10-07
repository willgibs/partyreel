/**
 * THE KEEP IN STEP WITH THE QUEUE (no-signal r1, `carry=phone`). Pinned with the store stood in (`keep.ts`'s own pins
 * hold the store): a copy for each file on its way, written as she sends it and never before an identity; put down the
 * moment it lands, is stopped or refused, even when that happens while its copy is written; re-filed when the queue's
 * ticket moves; this page's lock held only while it keeps a copy; and, once as the page opens, what an earlier page
 * kept handed back, under this page, with what is not hers put down.
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
  "id" | "file" | "status" | "takenAt" | "reelEligible" | "poster"
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

  it("★ asks once, and only with someone to send as: never in the demo, never at a door that holds her", async () => {
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
