import { describe, expect, it } from "vitest";

import {
  askedAgo,
  cameInLine,
  listedWouldComeInLine,
  peopleWaiting,
} from "@/lib/event/door/words";

/**
 * THE DOOR'S SMALL WORDS: how long someone waited, and how many wait. Pinned for their arithmetic and
 * their agreement (one person, two people), never their exact phrasing beyond that.
 */
const NOW = Date.parse("2026-09-29T12:00:00Z");
const ago = (ms: number) => new Date(NOW - ms).toISOString();

describe("askedAgo", () => {
  it("counts up from just now, in the largest whole unit", () => {
    expect(askedAgo(ago(20_000), NOW)).toBe("just now");
    expect(askedAgo(ago(60_000), NOW)).toBe("1 minute ago");
    expect(askedAgo(ago(5 * 60_000), NOW)).toBe("5 minutes ago");
    expect(askedAgo(ago(60 * 60_000), NOW)).toBe("1 hour ago");
    expect(askedAgo(ago(26 * 60 * 60_000), NOW)).toBe("yesterday");
    expect(askedAgo(ago(3 * 24 * 60 * 60_000), NOW)).toBe("3 days ago");
  });

  it("a clock a little ahead, or a date it cannot read, is just now", () => {
    expect(askedAgo(ago(-30_000), NOW)).toBe("just now");
    expect(askedAgo("not a date", NOW)).toBe("just now");
  });
});

describe("peopleWaiting", () => {
  it("agrees in number", () => {
    expect(peopleWaiting(1)).toBe("1 person");
    expect(peopleWaiting(2)).toBe("2 people");
    expect(peopleWaiting(1200)).toBe("1,200 people");
  });
});

describe("cameInLine", () => {
  it("says who came in without a press, in number", () => {
    expect(cameInLine(1)).toBe("1 person waiting at the door came in.");
    expect(cameInLine(3)).toBe("3 people waiting at the door came in.");
  });
});

describe("listedWouldComeInLine", () => {
  it("★ says who choosing the invite list would let in, in the door menu's own words, in number", () => {
    expect(listedWouldComeInLine(1)).toBe(
      "Lets in the 1 person waiting at the door who is on your list.",
    );
    expect(listedWouldComeInLine(3)).toBe(
      "Lets in the 3 people waiting at the door who are on your list.",
    );
  });

  it("says nothing where it would let in nobody: a line for an effect that does not happen is a promise not kept", () => {
    expect(listedWouldComeInLine(0)).toBeNull();
    expect(listedWouldComeInLine(-1)).toBeNull();
    expect(listedWouldComeInLine(Number.NaN)).toBeNull();
  });
});
