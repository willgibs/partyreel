import { describe, expect, it } from "vitest";

import { yoursView } from "@/components/guest/yours-filter";

/**
 * THE YOURS FILTER'S CONTRACT.
 *
 * The filter's real risk is not the filtering: it is the DEAD END. A guest
 * turns it on from one of their own tiles and then removes that photograph for
 * ever, and an album still answering "Showing yours" over an empty grid is a
 * state whose only exit is a link the guest has to notice. So `on` is derived
 * here rather than trusted from the caller, and that is what these pins hold.
 */
const album = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }, { id: "e" }];
const mine = new Set(["b", "d"]);

describe("the whole album, until a guest asks for theirs", () => {
  it("passes everything through with the filter off", () => {
    const v = yoursView(album, mine, false);
    expect(v.on).toBe(false);
    expect(v.items.map((m) => m.id)).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("narrows to this guest's own, in the album's own order", () => {
    const v = yoursView(album, mine, true);
    expect(v.on).toBe(true);
    expect(v.items.map((m) => m.id)).toEqual(["b", "d"]);
  });

  it("counts the WHOLE album's share of yours, filtered or not", () => {
    expect(yoursView(album, mine, false).count).toBe(2);
    expect(yoursView(album, mine, true).count).toBe(2);
  });
});

describe("it cannot be live with nothing to show", () => {
  it("refuses the filter for a guest who owns nothing here", () => {
    const v = yoursView(album, new Set(), true);
    expect(v.on).toBe(false);
    expect(v.items).toHaveLength(album.length);
  });

  it("falls back to the whole album when the last of yours is removed", () => {
    // The removal already dropped "b" and "d" from the list; the owned set is
    // the stale one the client still holds for a beat.
    const after = album.filter((m) => !mine.has(m.id));
    const v = yoursView(after, mine, true);
    expect(v.on).toBe(false);
    expect(v.count).toBe(0);
    expect(v.items.map((m) => m.id)).toEqual(["a", "c", "e"]);
  });

  it("never hands back the caller's own array to mutate", () => {
    const v = yoursView(album, mine, false);
    expect(v.items).not.toBe(album);
  });
});
