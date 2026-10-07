/**
 * HER UNSENT FILES, KEPT ON HER PHONE (no-signal r1, Will's `carry=phone`). Pinned against a small in-memory IndexedDB:
 * a file kept comes back as the very bytes, named and dated as picked, with what rode with it; a record goes when it is
 * put down; a page that opens takes what is hers and held by no live page, and puts down what is not hers or has waited
 * too long; a browser with no IndexedDB, or no room, answers quietly and keeps nothing.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  forgetFiles,
  hasRoomFor,
  keepFile,
  keepOwner,
  readKept,
  refile,
  restoredFile,
  sortKept,
  thisTab,
  UNSENT_KEEP_DAYS,
  type KeptRecord,
} from "./keep";

/** Just enough IndexedDB for one store keyed by `id` with an `album` index: each request answered a tick later. */
function fakeIndexedDB() {
  const rows = new Map<string, KeptRecord>();
  const later = (fn: () => void) => setTimeout(fn, 0);
  type Req = { result?: unknown; onsuccess?: () => void };
  const request = (
    tx: { pending: number; done: () => void },
    run: () => unknown,
  ) => {
    const req: Req = {};
    tx.pending += 1;
    later(() => {
      req.result = run();
      req.onsuccess?.();
      tx.pending -= 1;
      tx.done();
    });
    return req;
  };
  return {
    rows,
    open() {
      const req: {
        result?: unknown;
        onsuccess?: () => void;
        onupgradeneeded?: () => void;
      } = {};
      later(() => {
        req.result = {
          objectStoreNames: { contains: () => true },
          close: () => {},
          transaction() {
            const tx = {
              pending: 0,
              oncomplete: undefined as undefined | (() => void),
              done() {
                if (tx.pending === 0) later(() => tx.oncomplete?.());
              },
              objectStore: () => ({
                put: (value: KeptRecord) =>
                  request(tx, () => {
                    rows.set(value.id, value);
                    return value.id;
                  }),
                get: (key: string) => request(tx, () => rows.get(key)),
                delete: (key: string) =>
                  request(tx, () => {
                    rows.delete(key);
                    return undefined;
                  }),
                index: () => ({
                  getAll: (album: string) =>
                    request(tx, () =>
                      [...rows.values()].filter((r) => r.album === album),
                    ),
                }),
              }),
            };
            return tx;
          },
        };
        req.onsuccess?.();
      });
      return req;
    },
  };
}

const NOW = new Date("2026-10-07T23:41:00Z").getTime();

function record(over: Partial<KeptRecord> = {}): KeptRecord {
  return {
    id: "q-1",
    album: "qr-1",
    owner: "ticket:t-1",
    tab: "tab-old",
    at: NOW - 60_000,
    name: "IMG_0412.jpg",
    type: "image/jpeg",
    lastModified: NOW - 120_000,
    blob: new Blob([new Uint8Array([1, 2, 3])], { type: "image/jpeg" }),
    ...over,
  };
}

describe("keepOwner", () => {
  it("★ files a file under who it goes up as: the host on her own album, else the device's ticket, else nothing", () => {
    expect(keepOwner({ ownerEventId: "evt-1", ticket: "t-1" })).toBe(
      "host:evt-1",
    );
    expect(keepOwner({ ownerEventId: null, ticket: "t-1" })).toBe("ticket:t-1");
    expect(keepOwner({ ownerEventId: null, ticket: null })).toBeNull();
  });
});

describe("sortKept: what a page that opens does with what is kept", () => {
  const base = {
    owner: "ticket:t-1",
    liveTabs: new Set<string>(),
    held: new Set<string>(),
    tab: "tab-new",
    now: NOW,
  };

  it("★ takes what is hers and held by no live page", () => {
    const { take, drop } = sortKept([record()], base);
    expect(take.map((r) => r.id)).toEqual(["q-1"]);
    expect(drop).toEqual([]);
  });

  it("★ puts down unread what is not hers: another ticket's, or the host's when she is not the host here", () => {
    const { take, drop } = sortKept(
      [
        record({ id: "a", owner: "ticket:someone-else" }),
        record({ id: "b", owner: "host:evt-1" }),
      ],
      base,
    );
    expect(take).toEqual([]);
    expect(drop).toEqual(["a", "b"]);
  });

  it("puts down what has waited past its days", () => {
    const old = NOW - (UNSENT_KEEP_DAYS * 24 * 60 * 60 * 1000 + 1);
    const { take, drop } = sortKept([record({ at: old })], base);
    expect(take).toEqual([]);
    expect(drop).toEqual(["q-1"]);
  });

  it("★ leaves to a live page what it holds: two open pages never send one photograph", () => {
    const { take, drop } = sortKept([record({ tab: "tab-frozen" })], {
      ...base,
      liveTabs: new Set(["tab-frozen"]),
    });
    expect(take).toEqual([]);
    expect(drop).toEqual([]);
  });

  it("takes every record of hers where the browser cannot say which pages live", () => {
    const { take } = sortKept([record({ tab: "tab-frozen" })], {
      ...base,
      liveTabs: null,
    });
    expect(take.map((r) => r.id)).toEqual(["q-1"]);
  });

  it("never takes what its own queue already holds", () => {
    const { take, drop } = sortKept([record()], {
      ...base,
      held: new Set(["q-1"]),
    });
    expect(take).toEqual([]);
    expect(drop).toEqual([]);
  });
});

describe("restoredFile", () => {
  it("★ hands back the very bytes, named and dated as picked, with what rode with them", async () => {
    const poster = new Blob([new Uint8Array([9])], { type: "image/webp" });
    const back = restoredFile(
      record({
        type: "video/mp4",
        name: "shot.mp4",
        takenAt: NOW - 5_000,
        reelEligible: false,
        poster,
      }),
    );
    expect(back.id).toBe("q-1");
    expect(back.file.name).toBe("shot.mp4");
    expect(back.file.type).toBe("video/mp4");
    expect(back.file.lastModified).toBe(NOW - 120_000);
    expect(new Uint8Array(await back.file.arrayBuffer())).toEqual(
      new Uint8Array([1, 2, 3]),
    );
    expect(back).toMatchObject({
      takenAt: NOW - 5_000,
      reelEligible: false,
      poster,
    });
  });

  it("carries nothing a file never had", () => {
    expect(Object.keys(restoredFile(record())).sort()).toEqual(["file", "id"]);
  });
});

describe("the store, quietly", () => {
  let idb: ReturnType<typeof fakeIndexedDB>;
  beforeEach(() => {
    idb = fakeIndexedDB();
    vi.stubGlobal("indexedDB", idb);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("★ keeps a file, reads it back by its album, and lets it go", async () => {
    expect(await keepFile(record())).toBe(true);
    expect(await keepFile(record({ id: "q-2", album: "qr-other" }))).toBe(true);
    const ids = async (album: string) =>
      (await readKept(album)).map((r) => (r as KeptRecord).id);
    expect(await ids("qr-1")).toEqual(["q-1"]);
    await forgetFiles(["q-1"]);
    expect(await readKept("qr-1")).toEqual([]);
    expect(await ids("qr-other")).toEqual(["q-2"]);
  });

  it("re-files records under a page, or a ticket, and leaves a gone one gone", async () => {
    await keepFile(record());
    expect(
      await refile(["q-1", "q-gone"], { tab: thisTab(), owner: "ticket:t-2" }),
    ).toBe(true);
    const [row] = await readKept("qr-1");
    expect(row).toMatchObject({ tab: thisTab(), owner: "ticket:t-2" });
    expect(idb.rows.has("q-gone")).toBe(false);
  });

  it("★ puts down a row that is no whole record: a row with no bytes is never half a file", async () => {
    idb.rows.set("broken", {
      ...record({ id: "broken" }),
      blob: undefined as unknown as Blob,
    });
    const rows = await readKept("qr-1");
    const { take, drop } = sortKept(rows, {
      owner: "ticket:t-1",
      liveTabs: new Set(),
      held: new Set(),
      tab: "tab-new",
      now: NOW,
    });
    expect(take).toEqual([]);
    expect(drop).toEqual(["broken"]);
  });

  it("★ keeps nothing where the phone has no room for it, and says so", async () => {
    vi.stubGlobal("navigator", {
      storage: {
        estimate: async () => ({
          quota: 50 * 1024 ** 2,
          usage: 49 * 1024 ** 2,
        }),
      },
    });
    expect(await hasRoomFor(10 * 1024 ** 2)).toBe(false);
    expect(
      await keepFile(
        record({ blob: new Blob([new Uint8Array(10 * 1024 ** 2)]) }),
      ),
    ).toBe(false);
    expect(idb.rows.size).toBe(0);
  });
});

describe("with no IndexedDB at all", () => {
  it("answers quietly: nothing kept, nothing read, nothing thrown", async () => {
    vi.stubGlobal("indexedDB", undefined);
    try {
      expect(await keepFile(record())).toBe(false);
      expect(await readKept("qr-1")).toEqual([]);
      await expect(forgetFiles(["q-1"])).resolves.toBeUndefined();
      expect(await refile(["q-1"], { tab: "t" })).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
