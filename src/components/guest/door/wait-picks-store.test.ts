/**
 * HER CHOICE AT THE HELD DOOR, KEPT ON THE DEVICE (door-reveal; the ROADMAP line from door-wiring: "keep them in
 * IndexedDB so a reload or a closed tab keeps her choice"). Pinned against a small in-memory IndexedDB: her
 * files come back as files, under her account alone (another account's choice is put down unread), never past
 * their days, and gone once forgotten; a browser with no IndexedDB answers quietly.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: async () => ({
        data: { session: { user: { id: "u-lena" } } },
      }),
    },
  }),
}));

import {
  doorOwner,
  forgetHeldPicks,
  KEEP_DAYS,
  keepHeldPicks,
  readHeldPicks,
} from "./wait-picks-store";

/**
 * Just enough IndexedDB for one store keyed by `album`: open, then put, get and delete in a transaction, each
 * request answered a tick later and its transaction completing a tick after that (the store's own order).
 */
function fakeIndexedDB() {
  const rows = new Map<string, unknown>();
  const later = (fn: () => void) => setTimeout(fn, 0);
  return {
    rows,
    open() {
      const req: {
        result?: unknown;
        onupgradeneeded?: () => void;
        onsuccess?: () => void;
      } = {};
      later(() => {
        req.result = {
          objectStoreNames: { contains: () => true },
          createObjectStore: () => {},
          close: () => {},
          transaction() {
            const tx: { oncomplete?: () => void; objectStore: () => unknown } =
              {
                objectStore: () => ({
                  put: (value: { album: string }) =>
                    answer(tx, () => {
                      rows.set(value.album, value);
                      return value.album;
                    }),
                  get: (key: string) => answer(tx, () => rows.get(key)),
                  delete: (key: string) =>
                    answer(tx, () => {
                      rows.delete(key);
                      return undefined;
                    }),
                }),
              };
            return tx;
          },
        };
        req.onupgradeneeded?.();
        req.onsuccess?.();
      });
      return req;
    },
  };

  function answer<T>(tx: { oncomplete?: () => void }, run: () => T) {
    const req: { result?: T; onsuccess?: () => void } = {};
    later(() => {
      req.result = run();
      req.onsuccess?.();
      later(() => tx.oncomplete?.());
    });
    return req;
  }
}

const ALBUM = "0123456789abcdef0123456789abcdef";
const photo = (name: string) =>
  new File([new Uint8Array([1, 2, 3])], name, {
    type: "image/jpeg",
    lastModified: 1_700_000_000_000,
  });

let fake: ReturnType<typeof fakeIndexedDB>;
beforeEach(() => {
  fake = fakeIndexedDB();
  vi.stubGlobal("indexedDB", fake);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("her choice, kept on the device", () => {
  it("★ comes back as her files, under her account", async () => {
    expect(
      await keepHeldPicks(ALBUM, "u-lena", [photo("a.jpg"), photo("b.jpg")]),
    ).toBe(true);
    const back = await readHeldPicks(ALBUM, "u-lena");
    expect(back?.map((f) => [f.name, f.type, f.size, f.lastModified])).toEqual([
      ["a.jpg", "image/jpeg", 3, 1_700_000_000_000],
      ["b.jpg", "image/jpeg", 3, 1_700_000_000_000],
    ]);
  });

  it("a new choice replaces the last (her Change)", async () => {
    await keepHeldPicks(ALBUM, "u-lena", [photo("a.jpg")]);
    await keepHeldPicks(ALBUM, "u-lena", [photo("c.jpg")]);
    expect((await readHeldPicks(ALBUM, "u-lena"))?.map((f) => f.name)).toEqual([
      "c.jpg",
    ]);
  });

  it("★ another account on the same phone never gets it, and it is put down unread", async () => {
    await keepHeldPicks(ALBUM, "u-lena", [photo("a.jpg")]);
    expect(await readHeldPicks(ALBUM, "u-someone-else")).toBeNull();
    expect(fake.rows.has(ALBUM)).toBe(false);
    expect(await readHeldPicks(ALBUM, "u-lena")).toBeNull();
  });

  it(`never past ${KEEP_DAYS} days`, async () => {
    await keepHeldPicks(ALBUM, "u-lena", [photo("a.jpg")]);
    const row = fake.rows.get(ALBUM) as { at: number };
    row.at -= (KEEP_DAYS + 1) * 24 * 60 * 60 * 1000;
    expect(await readHeldPicks(ALBUM, "u-lena")).toBeNull();
    expect(fake.rows.has(ALBUM)).toBe(false);
  });

  it("is gone once forgotten (she is in, the door moved, she switched address)", async () => {
    await keepHeldPicks(ALBUM, "u-lena", [photo("a.jpg")]);
    await forgetHeldPicks(ALBUM);
    expect(await readHeldPicks(ALBUM, "u-lena")).toBeNull();
  });

  it("keeps nothing for nobody, and nothing at all", async () => {
    expect(await keepHeldPicks(ALBUM, "", [photo("a.jpg")])).toBe(false);
    expect(await keepHeldPicks(ALBUM, "u-lena", [])).toBe(false);
    expect(fake.rows.size).toBe(0);
  });

  it("a browser with no IndexedDB answers quietly: the choice lives in the tab", async () => {
    vi.stubGlobal("indexedDB", undefined);
    expect(await keepHeldPicks(ALBUM, "u-lena", [photo("a.jpg")])).toBe(false);
    expect(await readHeldPicks(ALBUM, "u-lena")).toBeNull();
    await expect(forgetHeldPicks(ALBUM)).resolves.toBeUndefined();
  });

  it("whose it is: the account on the device", async () => {
    expect(await doorOwner()).toBe("u-lena");
  });
});
