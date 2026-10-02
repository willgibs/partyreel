/**
 * THE DEVELOP AND THE CAMERA'S FACTS AS THEY TRAVEL (20261002200000): what waits, read defensively off the album's
 * answer; the event's own facts, read through the seam's one parser; and when a full sync carries `waiting` at all.
 */
import { describe, expect, it } from "vitest";

import {
  CAPTURES,
  developFactsOf,
  isCapture,
  NOTHING_WAITING,
  parseWaitingFacts,
  waitingFor,
} from "@/lib/disposable/facts";

describe("the capture", () => {
  it("is the CHECK's two values, and nothing else", () => {
    expect(CAPTURES).toEqual(["upload", "camera"]);
    expect(isCapture("camera")).toBe(true);
    expect(isCapture("upload")).toBe(true);
    for (const other of ["disposable", "album", "", null, 1]) {
      expect(isCapture(other)).toBe(false);
    }
  });
});

describe("parseWaitingFacts", () => {
  it("reads the count and its minutes, oldest minute first", () => {
    expect(
      parseWaitingFacts({
        count: 3,
        minutes: [
          [1_790_000_060_000, 1],
          [1_790_000_000_000, 2],
        ],
      }),
    ).toEqual({
      count: 3,
      minutes: [
        [1_790_000_000_000, 2],
        [1_790_000_060_000, 1],
      ],
    });
  });

  it("an answer from before the migration, or one it cannot read, is nothing waiting", () => {
    for (const bad of [null, undefined, [], "3", { minutes: [] }, { count: -1, minutes: [] }, { count: 1.5 }]) {
      expect(parseWaitingFacts(bad)).toEqual(NOTHING_WAITING);
    }
  });

  it("drops a malformed minute, never guesses one, and keeps the answer's own count", () => {
    expect(
      parseWaitingFacts({
        count: 4,
        minutes: [[1_790_000_000_000, 2], ["soon", 1], [1_790_000_000_000], [Number.NaN, 1], [1_790_000_120_000, 0], "x"],
      }),
    ).toEqual({ count: 4, minutes: [[1_790_000_000_000, 2]] });
  });
});

describe("developFactsOf: the seam's one parser", () => {
  it("reads the read's four columns", () => {
    expect(
      developFactsOf({
        capture: "camera",
        roll_size: 24,
        develops_at: "2026-10-03T09:00:00+00:00",
        develop_due: true,
      }),
    ).toEqual({
      capture: "camera",
      rollSize: 24,
      developsAt: "2026-10-03T09:00:00+00:00",
      developDue: true,
    });
  });

  it("a row before the migration, or a value it does not know, reads as free uploads with no develop", () => {
    const plain = { capture: "upload", rollSize: null, developsAt: null, developDue: false };
    expect(developFactsOf({})).toEqual(plain);
    expect(developFactsOf(null)).toEqual(plain);
    expect(developFactsOf({ capture: "film", roll_size: 24, develop_due: "yes", develops_at: 5 })).toEqual(plain);
  });

  it("a roll's size is the camera's alone, and only a whole number of shots", () => {
    expect(developFactsOf({ capture: "upload", roll_size: 24 }).rollSize).toBeNull();
    expect(developFactsOf({ capture: "camera", roll_size: 0 }).rollSize).toBeNull();
    expect(developFactsOf({ capture: "camera", roll_size: 2.5 }).rollSize).toBeNull();
    expect(developFactsOf({ capture: "camera", roll_size: 12 }).rollSize).toBe(12);
  });
});

describe("waitingFor: when a full sync carries what waits", () => {
  const some = { count: 2, minutes: [[1_790_000_000_000, 2] as const] };

  it("whenever something waits, with the develop time or none", () => {
    expect(waitingFor({ developsAt: null }, some)).toEqual({ ...some, developsAt: null });
    expect(waitingFor({ developsAt: "2026-10-03T09:00:00Z" }, some)).toEqual({
      ...some,
      developsAt: "2026-10-03T09:00:00Z",
    });
  });

  it("whenever a develop time is set, even with nothing waiting (the waiting room says when)", () => {
    expect(waitingFor({ developsAt: "2026-10-03T09:00:00Z" }, NOTHING_WAITING)).toEqual({
      count: 0,
      minutes: [],
      developsAt: "2026-10-03T09:00:00Z",
    });
  });

  it("never otherwise: an album that uses neither answers what it always did", () => {
    expect(waitingFor({ developsAt: null }, NOTHING_WAITING)).toBeNull();
  });
});
