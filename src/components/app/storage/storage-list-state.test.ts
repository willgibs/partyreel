/**
 * THE SIZE LIST'S STATE, PINNED BY BEHAVIOUR: pages append in the list's order, a filter keeps
 * its own pages, a selection survives a filter change, "All" toggles what is shown, a deletion
 * for good leads with its result and a failure puts back what did not go, emptying Deleted frees
 * all of it, and every figure on screen is the server's less what this visit freed.
 *
 * ★ RESHAPED ON PURPOSE (trash-in-storage, 2026-10-03; scar kept: a deletion leads with its result,
 * a failure puts back what did not go, each byte counted once). The list's act is Delete for good,
 * which has no Undo, and Deleted, counted in what she stores, empties from its own row.
 */
import { describe, expect, it } from "vitest";

import { GIGABYTE } from "@/lib/constants/tiers";
import type { StorageItem } from "@/lib/db/queries/storage-list";

import { pick } from "./storage-list-rules";
import {
  countNow,
  deletedNow,
  eventsNow,
  freedBytes,
  INITIAL_LIST,
  listReducer,
  storedBefore,
  storedNow,
  type ListAction,
  type ListState,
} from "./storage-list-state";

function item(id: string, gb: number, eventId = "wedding"): StorageItem {
  return {
    id,
    eventId,
    type: "photo",
    bytes: gb * GIGABYTE,
    durationSeconds: null,
    createdAt: "2026-06-14T18:00:00.000000+00:00",
    url: `https://r2.test/${id}`,
    previewUrl: null,
    by: { name: "Sam", isHost: false, isVerified: false },
  };
}

const OVERVIEW = {
  storedBytes: 20 * GIGABYTE,
  deletedBytes: 0,
  events: [
    { id: "wedding", name: "Maya & Theo", bytes: 14 * GIGABYTE, count: 3 },
    { id: "party", name: "Ivy turns one", bytes: 6 * GIGABYTE, count: 2 },
  ],
};

function run(actions: ListAction[], from: ListState = INITIAL_LIST) {
  return actions.reduce(listReducer, from);
}

const firstPage: ListAction = {
  type: "loaded",
  key: "all",
  items: [item("b", 8), item("a", 5), item("p", 4, "party")],
  next: { bytes: 4 * GIGABYTE, id: "p" },
  overview: OVERVIEW,
  more: false,
};

describe("pages", () => {
  it("appends a next page in the list's order, never twice the same item", () => {
    const state = run([
      firstPage,
      {
        type: "loaded",
        key: "all",
        items: [item("p", 4, "party"), item("q", 2, "party"), item("c", 1)],
        next: null,
        overview: null,
        more: true,
      },
    ]);
    expect(state.slots.all.items.map((i) => i.id)).toEqual([
      "b",
      "a",
      "p",
      "q",
      "c",
    ]);
    expect(state.slots.all.next).toBeNull();
    // The first read's overview is kept by a later page that carries none.
    expect(state.overview).toEqual(OVERVIEW);
  });

  it("keeps each filter's pages apart, and a failed page apart from the list", () => {
    const state = run([
      firstPage,
      { type: "filter", filter: "party" },
      { type: "loading", key: "party" },
      { type: "load-failed", key: "party" },
    ]);
    expect(state.slots.party.failed).toBe(true);
    expect(state.failed).toBe(false);
    expect(state.slots.all.items).toHaveLength(3);
  });

  it("fails the whole list only when the first read did", () => {
    const state = run([{ type: "load-failed", key: "all" }]);
    expect(state.failed).toBe(true);
    // A retry clears it while it runs.
    expect(listReducer(state, { type: "loading", key: "all" }).failed).toBe(
      false,
    );
  });
});

describe("the selection", () => {
  it("survives a filter change, and All toggles only what is shown", () => {
    const state = run([
      firstPage,
      { type: "toggle", item: pick(item("b", 8)) },
      { type: "filter", filter: "party" },
      { type: "select-all", shown: [pick(item("p", 4, "party"))] },
    ]);
    expect([...state.selected.keys()]).toEqual(["b", "p"]);
    const cleared = listReducer(state, {
      type: "select-all",
      shown: [pick(item("p", 4, "party"))],
    });
    expect([...cleared.selected.keys()]).toEqual(["b"]);
  });
});

describe("a deletion for good leads with its result", () => {
  const b = pick(item("b", 8));
  const p = pick(item("p", 4, "party"));

  it("fades, then leaves the selection and every figure on screen", () => {
    const state = run([
      firstPage,
      { type: "toggle", item: b },
      { type: "toggle", item: p },
      { type: "leaving", ids: ["b", "p"] },
    ]);
    expect(state.leaving.has("b")).toBe(true);
    const gone = listReducer(state, { type: "deleted", items: [b, p] });
    expect(gone.selected.size).toBe(0);
    expect(gone.leaving.size).toBe(0);
    expect(storedNow(gone)).toBe(8 * GIGABYTE);
    expect(eventsNow(gone).map((e) => [e.id, e.bytes / GIGABYTE])).toEqual([
      ["wedding", 6],
      ["party", 2],
    ]);
    expect(countNow(gone, "all")).toBe(3);
    expect(countNow(gone, "party")).toBe(1);
  });

  it("puts back what a failure did not delete", () => {
    const state = run([
      firstPage,
      { type: "deleted", items: [b, p] },
      { type: "put-back", ids: ["p"] },
    ]);
    expect([...state.deleted.keys()]).toEqual(["b"]);
    expect(storedNow(state)).toBe(12 * GIGABYTE);
  });
});

describe("Deleted, at the head of the list", () => {
  const withDeleted: ListAction = {
    ...firstPage,
    type: "loaded",
    overview: {
      ...OVERVIEW,
      storedBytes: 23 * GIGABYTE,
      deletedBytes: 3 * GIGABYTE,
    },
  } as ListAction;

  it("counts in what she stores until it is emptied, and then frees all of it", () => {
    const loaded = run([withDeleted]);
    expect(deletedNow(loaded)).toBe(3 * GIGABYTE);
    expect(storedNow(loaded)).toBe(23 * GIGABYTE);
    const emptied = listReducer(loaded, {
      type: "emptied",
      bytes: 3 * GIGABYTE,
    });
    expect(deletedNow(emptied)).toBe(0);
    expect(storedNow(emptied)).toBe(20 * GIGABYTE);
    expect(freedBytes(emptied)).toBe(3 * GIGABYTE);
    // Her events never held Deleted: their totals stand.
    expect(eventsNow(emptied).map((e) => e.bytes / GIGABYTE)).toEqual([14, 6]);
  });
});

describe("what she stores", () => {
  it("re-bases on a refused switch's fresher figure, after this visit's deletions", () => {
    // She deleted 8 GB for good (20 -> 12), then a guest added 3 GB: the refusal says 15.
    const state = run([
      firstPage,
      { type: "deleted", items: [pick(item("b", 8))] },
      { type: "rebase", storedBytes: 15 * GIGABYTE },
    ]);
    expect(storedNow(state)).toBe(15 * GIGABYTE);
    // The strip's starting line: the fresher figure plus what this visit already freed, so the
    // 8 GB is counted once, as freed.
    expect(storedBefore(state)).toBe(23 * GIGABYTE);
    // A later put-back of the 8 GB (a failure's) moves it by exactly 8 GB.
    expect(
      storedNow(listReducer(state, { type: "put-back", ids: ["b"] })),
    ).toBe(23 * GIGABYTE);
  });

  it("is unknown until the first read lands", () => {
    expect(storedNow(INITIAL_LIST)).toBeNull();
    expect(countNow(INITIAL_LIST, "all")).toBeNull();
  });
});
