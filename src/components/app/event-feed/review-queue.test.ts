/**
 * THE REVIEW ROOM'S QUEUE RULES (host-curation's seven, curation-wiring).
 *
 * What a host leans on: an upload that comes back (a refused write, an Undo) returns to its own
 * place and never twice; arrivals fold in above the queue in the server's order; a verdict's toast
 * counts in the right noun; the keys walk every tile of a grid, a shorter last row included, and
 * land on the next upload once one leaves; and the live album's word on the queue holds new
 * uploads behind the line and drops only what left it somewhere else, never what the room just
 * acted on, until the album has read that write back.
 */
import { describe, expect, it } from "vitest";

import type { GridMedia } from "@/components/app/media-grid";

import {
  arrivals,
  departed,
  isGridKey,
  knownIds,
  nextAfter,
  ownWrite,
  putBack,
  ranked,
  rankedAbove,
  readBack,
  stepIndex,
  uploadsWords,
  verdictWords,
} from "./review-queue";

const photo = (id: string): GridMedia => ({ id, type: "photo", url: id });
const video = (id: string): GridMedia => ({ id, type: "video", url: id });
const ids = (list: readonly { id: string }[]) => list.map((i) => i.id);

describe("a queue's order", () => {
  it("ranks the server's queue in its own order, and arrivals above it, newest first", () => {
    const queue = ranked([photo("a"), photo("b")]);
    expect(queue.map((q) => q.rank)).toEqual([0, 1]);
    const joined = rankedAbove([photo("n1"), photo("n2")], 0);
    expect(joined.map((q) => q.rank)).toEqual([-2, -1]);
    expect(ids(putBack(queue, joined))).toEqual(["n1", "n2", "a", "b"]);
  });

  it("returns what comes back to its own place, and never twice", () => {
    const [a, b, c] = ranked([photo("a"), photo("b"), photo("c")]);
    expect(ids(putBack([a, c], [b]))).toEqual(["a", "b", "c"]);
    expect(ids(putBack([a, b, c], [b]))).toEqual(["a", "b", "c"]);
    const same = [a, b];
    expect(putBack(same, [a])).toBe(same);
  });
});

describe("a verdict's words", () => {
  it("counts photos, videos, or uploads when they are mixed", () => {
    expect(uploadsWords([photo("a")])).toBe("1 photo");
    expect(uploadsWords([photo("a"), photo("b")])).toBe("2 photos");
    expect(uploadsWords([video("a")])).toBe("1 video");
    expect(uploadsWords([photo("a"), video("b")])).toBe("2 uploads");
    expect(
      uploadsWords(Array.from({ length: 1500 }, (_, i) => photo(`p${i}`))),
    ).toBe("1,500 photos");
  });

  it("says the verb the host pressed", () => {
    expect(verdictWords("approve", [photo("a"), photo("b")])).toBe(
      "Approved 2 photos",
    );
    expect(verdictWords("reject", [video("a")])).toBe("Rejected 1 video");
  });
});

describe("where the keys and the peek land", () => {
  const order = ["a", "b", "c", "d"];

  it("moves on to the next upload that stays, else the one before, else nowhere", () => {
    expect(nextAfter(order, "b", new Set(["b"]))).toBe("c");
    expect(nextAfter(order, "b", new Set(["b", "c"]))).toBe("d");
    expect(nextAfter(order, "d", new Set(["d"]))).toBe("c");
    expect(nextAfter(order, "d", new Set(["d", "c", "b"]))).toBe("a");
    expect(nextAfter(order, "a", new Set(order))).toBeNull();
    expect(nextAfter(order, "x", new Set())).toBeNull();
  });

  it("walks a grid by reading order and by column, reaching a shorter last row", () => {
    // 7 uploads in 3 columns: a b c / d e f / g
    expect(stepIndex(0, "ArrowRight", 3, 7)).toBe(1);
    expect(stepIndex(0, "ArrowLeft", 3, 7)).toBe(0);
    expect(stepIndex(6, "ArrowRight", 3, 7)).toBe(6);
    expect(stepIndex(1, "ArrowDown", 3, 7)).toBe(4);
    // Below `e` there is nothing, but a row below exists: land on its last item.
    expect(stepIndex(4, "ArrowDown", 3, 7)).toBe(6);
    expect(stepIndex(6, "ArrowDown", 3, 7)).toBe(6);
    expect(stepIndex(4, "ArrowUp", 3, 7)).toBe(1);
    expect(stepIndex(1, "ArrowUp", 3, 7)).toBe(1);
    expect(stepIndex(3, "Home", 3, 7)).toBe(0);
    expect(stepIndex(3, "End", 3, 7)).toBe(6);
  });

  it("puts a first key on the first upload (End on the last), and has nowhere to go in an empty queue", () => {
    expect(stepIndex(-1, "ArrowDown", 3, 7)).toBe(0);
    expect(stepIndex(-1, "End", 3, 7)).toBe(6);
    expect(stepIndex(-1, "ArrowRight", 3, 0)).toBe(-1);
  });

  it("knows its keys", () => {
    for (const key of [
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
    ]) {
      expect(isGridKey(key)).toBe(true);
    }
    expect(isGridKey("Enter")).toBe(false);
    expect(isGridKey("PageDown")).toBe(false);
  });
});

describe("what the live album says about the queue", () => {
  it("holds every waiting upload the room has not shown behind the line, newest first", () => {
    expect(arrivals(["n2", "n1", "a", "b"], new Set(["a", "b"]))).toEqual([
      "n2",
      "n1",
    ]);
    expect(arrivals(["a"], new Set(["a"]))).toEqual([]);
  });

  it("drops an upload decided elsewhere or taken back by its guest", () => {
    const live = { waiting: ["a"], decided: new Set(["b"]) };
    const seen = new Set(["a", "b", "c"]);
    expect([
      ...departed(
        [{ id: "a" }, { id: "b" }, { id: "c" }],
        live,
        seen,
        new Set(),
      ),
    ]).toEqual(["b", "c"]);
  });

  it("never drops one the room acted on, nor one the album has not seen yet", () => {
    const live = { waiting: [], decided: new Set(["b"]) };
    // `b` was just acted on (its Undo put it back); `d` arrived after the album's last read.
    expect([
      ...departed(
        [{ id: "b" }, { id: "d" }],
        live,
        new Set(["b"]),
        new Set(["b"]),
      ),
    ]).toEqual([]);
  });
});

describe("the room's own writes, until the album reads them back", () => {
  it("holds what the room acted on as known beside its grid, so a stale poll never counts it new", () => {
    const writes = ownWrite(new Map(), ["a"], 1);
    const known = knownIds([{ id: "b" }], writes);
    expect([...known].sort()).toEqual(["a", "b"]);
    expect(arrivals(["a", "b", "n"], known)).toEqual(["n"]);
  });

  it("★ lets it go once its write is read back, so its return from elsewhere is an arrival", () => {
    const writes = readBack(ownWrite(new Map(), ["a"], 1), ["a"], 1);
    expect(writes.size).toBe(0);
    expect(arrivals(["a", "b"], knownIds([{ id: "b" }], writes))).toEqual([
      "a",
    ]);
  });

  it("a read-back settles only its own write: a later write on the upload keeps the room's claim", () => {
    // Approved (1), then its Undo (2) before the verdict's catch-up answered.
    const writes = ownWrite(ownWrite(new Map(), ["a", "b"], 1), ["a"], 2);
    const after = readBack(writes, ["a", "b"], 1);
    expect([...after.entries()]).toEqual([["a", 2]]);
    expect(readBack(after, ["a"], 2).size).toBe(0);
  });

  it("hands back the same map when nothing it names is still on that write", () => {
    const writes = ownWrite(new Map(), ["a"], 3);
    expect(readBack(writes, ["a"], 2)).toBe(writes);
    expect(readBack(writes, ["z"], 3)).toBe(writes);
  });

  it("drops an upload put back here and decided elsewhere once its Undo is read back", () => {
    const live = { waiting: [], decided: new Set(["a"]) };
    const unread = ownWrite(new Map(), ["a"], 2);
    expect([...departed([{ id: "a" }], live, new Set(["a"]), unread)]).toEqual(
      [],
    );
    expect([
      ...departed(
        [{ id: "a" }],
        live,
        new Set(["a"]),
        readBack(unread, ["a"], 2),
      ),
    ]).toEqual(["a"]);
  });
});
