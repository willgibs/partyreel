/**
 * THE ALBUM'S ITEMS' PINS (reconcile-album-items.ts): every photograph is an item, linked or not; an
 * item is rebuilt only when what it draws changed; a link is held until it dies and never past it;
 * a guest's attribution names and flags, never an address; the reel's items carry no url and say
 * whether they have a still; and the arrival is "not on screen a moment ago".
 */
import { describe, expect, it, vi } from "vitest";

import type { AlbumLink } from "@/lib/album/links";
import type { GuestWhoTuple, ManifestEntry } from "@/lib/events/album-wire";
import type { GalleryItem } from "@/lib/events/gallery-reel";
import { newIds } from "@/lib/shared/arrival";

import {
  albumOnScreen,
  createAlbumItems,
  createReelItems,
  entryToItem,
  newArrivalIds,
} from "./reconcile-album-items";

// The arrival grammar's one sentence, spied and left real: `newArrivalIds` must read it (crumbs-27).
vi.mock("@/lib/shared/arrival", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/shared/arrival")>();
  return { ...actual, newIds: vi.fn(actual.newIds) };
});

const T0 = 1_790_000_000_000_000;
const entry = (
  i: number,
  flags = 4,
  w = 640,
  h = 480,
  dur?: number,
): ManifestEntry =>
  dur === undefined
    ? [`m${i}`, w, h, flags, T0 - i]
    : [`m${i}`, w, h, flags, T0 - i, dur];

const link = (
  i: number,
  over: Partial<AlbumLink<GuestWhoTuple>> = {},
): AlbumLink<GuestWhoTuple> => ({
  tile: `https://r2.test/p/${i}.webp`,
  view: `https://r2.test/o/${i}.jpg`,
  download: `https://r2.test/o/${i}.jpg?dl`,
  who: ["Maya", 2],
  remintAt: 1_000,
  expiresAt: 2_000,
  attr: 1,
  ...over,
});

const base = {
  blobs: new Map<string, string>(),
  optimistic: [] as GalleryItem[],
  removed: new Set<string>(),
  renamed: null,
  now: 100,
};

describe("entryToItem", () => {
  it("draws an unlinked entry as a loading item: its shape known, no url, no request", () => {
    expect(entryToItem(entry(1), undefined)).toMatchObject({
      id: "m1",
      type: "photo",
      url: "",
      previewUrl: null,
      downloadUrl: undefined,
      width: 640,
      height: 480,
      status: "approved",
      uploaderName: null,
      reelEligible: true,
    });
  });

  it("reads a preview only where the entry has one (else the tile IS the original)", () => {
    const withPreview = entryToItem(entry(1, 4 | 2), link(1));
    expect(withPreview).toMatchObject({
      url: "https://r2.test/o/1.jpg",
      previewUrl: "https://r2.test/p/1.webp",
    });
    const without = entryToItem(entry(2, 4), link(2));
    expect(without.previewUrl).toBeNull();
  });

  it("names and flags the uploader, never an address", () => {
    const host = entryToItem(entry(1), link(1, { who: ["Will", 1] }));
    expect(host).toMatchObject({
      uploaderName: "Will",
      isHost: true,
      isVerified: false,
    });
    expect(Object.keys(host)).not.toContain("uploaderEmail");
  });

  it("a video carries its length, and a clip is never reel-eligible", () => {
    const clip = entryToItem(entry(1, 1, 720, 1280, 12.5), link(1));
    expect(clip).toMatchObject({
      type: "video",
      durationSeconds: 12.5,
      reelEligible: false,
    });
  });

  it("an unmeasured upload keeps no shape (the grid falls back to a square)", () => {
    expect(entryToItem(entry(1, 4, 0, 0), undefined)).toMatchObject({
      width: null,
      height: null,
    });
  });
});

describe("createAlbumItems", () => {
  it("hands back the SAME object for every item whose inputs did not change", () => {
    const build = createAlbumItems();
    const entries = [entry(0), entry(1), entry(2)];
    const links = new Map([["m0", link(0)]]);
    const first = build({ ...base, entries, link: (id) => links.get(id) });
    // A link lands for m1: only m1 is rebuilt.
    links.set("m1", link(1));
    const second = build({ ...base, entries, link: (id) => links.get(id) });
    expect(second[0]).toBe(first[0]);
    expect(second[1]).not.toBe(first[1]);
    expect(second[1].url).toBe("https://r2.test/o/1.jpg");
    expect(second[2]).toBe(first[2]);
  });

  it("holds a link the store has let go of while it lives, and never past its expiry", () => {
    const build = createAlbumItems();
    const entries = [entry(0)];
    const held = link(0, { expiresAt: 500 });
    build({ ...base, entries, link: () => held, now: 100 });
    // The store cleared (a stricter drift, a watchdog forget): the album keeps drawing the link.
    const kept = build({ ...base, entries, link: () => undefined, now: 400 });
    expect(kept[0].url).toBe("https://r2.test/o/0.jpg");
    // Past its life it is never drawn.
    const dead = build({ ...base, entries, link: () => undefined, now: 600 });
    expect(dead[0].url).toBe("");
  });

  it("draws the page's embedded links before the store has them", () => {
    const build = createAlbumItems(new Map([["m0", link(0)]]));
    const items = build({
      ...base,
      entries: [entry(0)],
      link: () => undefined,
    });
    expect(items[0].url).toBe("https://r2.test/o/0.jpg");
  });

  it("puts this device's own uploads first until the manifest holds them, then draws the entry", () => {
    const build = createAlbumItems();
    const mine: GalleryItem = {
      id: "m9",
      type: "photo",
      url: "blob:mine",
      status: "approved",
    };
    const before = build({
      ...base,
      entries: [entry(0)],
      optimistic: [mine],
      link: () => undefined,
    });
    expect(before.map((m) => m.id)).toEqual(["m9", "m0"]);
    // The delta brought it: the entry is drawn, from its object url until its link lands.
    const blobs = new Map([["m9", "blob:mine"]]);
    const after = build({
      ...base,
      entries: [entry(9), entry(0)],
      optimistic: [mine],
      blobs,
      link: () => undefined,
    });
    expect(after.map((m) => m.id)).toEqual(["m9", "m0"]);
    expect(after[0]).toMatchObject({ url: "blob:mine", width: 640 });
  });

  it("takes this device's own removals off the screen, and a rename onto its own credits", () => {
    const build = createAlbumItems();
    const items = build({
      ...base,
      entries: [entry(0), entry(1)],
      link: (id) => link(Number(id.slice(1))),
      removed: new Set(["m0"]),
      renamed: { name: "Sam", ids: new Set(["m1"]) },
    });
    expect(items.map((m) => m.id)).toEqual(["m1"]);
    expect(items[0].uploaderName).toBe("Sam");
  });
});

describe("createReelItems", () => {
  it("carries no url, says whether each has a still, and keeps an entry's item by identity", () => {
    const build = createReelItems();
    const photo = entry(0);
    const posterVideo = entry(1, 1 | 2 | 4);
    const rawVideo = entry(2, 1 | 4);
    const first = build([photo, posterVideo, rawVideo]);
    expect(first.map((m) => [m.id, m.url, m.drawable])).toEqual([
      ["m0", "", true],
      ["m1", "", true],
      ["m2", "", false],
    ]);
    const second = build([photo, posterVideo]);
    expect(second[0]).toBe(first[0]);
    expect(second[1]).toBe(first[1]);
  });

  it("carries neither a time nor an uploader, as the gallery payload never did (the take's shuffle)", () => {
    const [item] = createReelItems()([entry(0)]);
    expect(item.createdAt).toBeUndefined();
    expect(item.uploaderKey).toBeUndefined();
  });
});

describe("newArrivalIds", () => {
  const ids = (...xs: number[]) => xs.map((i) => ({ id: `m${i}` }));

  it("reports exactly what was not on screen a moment ago", () => {
    expect(newArrivalIds(ids(1, 2), ids(3, 1, 2))).toEqual(new Set(["m3"]));
  });

  // ★ RESHAPED ON PURPOSE (crumbs-30; scar kept: the album that appears is not an arrival): "empty" stood for "no album
  // a moment ago", and a real album that was empty then has a first photograph that does arrive (below). The album that
  // was not there is `null` now, which the provider reads off the answer's status (`albumOnScreen`).
  it("the FIRST album never glows: an album that was not on screen a moment ago is not an arrival", () => {
    expect(newArrivalIds(null, ids(1, 2, 3)).size).toBe(0);
  });

  it("★ a real album that was empty a moment ago: its first photograph arrives, as on the host's grid (crumbs-30)", () => {
    expect(newArrivalIds([], ids(1))).toEqual(new Set(["m1"]));
    expect(newArrivalIds([], [entry(4), entry(3)])).toEqual(
      new Set(["m4", "m3"]),
    );
  });

  it("a REMOVED item is not an arrival, and neither is what is left", () => {
    expect(newArrivalIds(ids(1, 2, 3), ids(1, 3)).size).toBe(0);
  });

  it("catches a whole burst at once (a hidden tab catching up)", () => {
    expect(newArrivalIds(ids(1), ids(4, 3, 2, 1))).toEqual(
      new Set(["m4", "m3", "m2"]),
    );
  });

  it("reads manifest entries as well as items", () => {
    expect(newArrivalIds([entry(1)], [entry(2), entry(1)])).toEqual(
      new Set(["m2"]),
    );
  });
});

describe("newArrivalIds reads the grammar's first sentence, once (crumbs-27)", () => {
  const ids = (...xs: number[]) => xs.map((i) => ({ id: `m${i}` }));

  it("★ asks the shared diff for what is new, for items and manifest entries alike", () => {
    vi.mocked(newIds).mockClear();
    expect(newArrivalIds(ids(1, 2), ids(3, 1, 2))).toEqual(new Set(["m3"]));
    expect(newArrivalIds([entry(1)], [entry(2), entry(1)])).toEqual(
      new Set(["m2"]),
    );
    expect(newIds).toHaveBeenCalledTimes(2);
    expect(vi.mocked(newIds).mock.calls[0].map((ids) => [...ids])).toEqual([
      ["m1", "m2"],
      ["m3", "m1", "m2"],
    ]);
    expect(vi.mocked(newIds).mock.calls[1].map((ids) => [...ids])).toEqual([
      ["m1"],
      ["m2", "m1"],
    ]);
  });

  // ★ RESHAPED ON PURPOSE (crumbs-30; scar kept: the guest's seed rule is its own line, and it never asks the diff):
  // the rule read an EMPTY last snapshot, which a real empty album is too; it reads an answer that was no album now.
  it("★ the guest's seed rule stays its own line: a last answer that was no album names no arrival, and the diff is never asked", () => {
    // A teaser's answer and a locked page's carry no entries by design, and neither does the album before its first
    // answer, so the album that opens under a mounted provider is not an arrival. A real empty album's emptiness is
    // real: its first photograph is asked of the diff like any other, as the host's grid does.
    vi.mocked(newIds).mockClear();
    expect(newArrivalIds(null, ids(1, 2, 3)).size).toBe(0);
    expect(newIds).not.toHaveBeenCalled();
    expect(newArrivalIds([], ids(1))).toEqual(new Set(["m1"]));
    expect(newIds).toHaveBeenCalledTimes(1);
  });
});

describe("albumOnScreen: which answers are an album at all (crumbs-30)", () => {
  const answer = (
    status: "loading" | "locked" | "teaser" | "ready",
    entries: readonly ManifestEntry[] = [],
  ) => ({ status, entries });

  it("★ a full album is one, empty or not: its entries are what was on screen", () => {
    const none: ManifestEntry[] = [];
    expect(albumOnScreen(answer("ready", none))).toBe(none);
    const some = [entry(2), entry(1)];
    expect(albumOnScreen(answer("ready", some))).toBe(some);
  });

  it("a teaser's, a locked page's and an unanswered album's entries are empty by design, so none is an album", () => {
    for (const status of ["teaser", "locked", "loading"] as const) {
      expect(albumOnScreen(answer(status)), status).toBeNull();
    }
  });
});
