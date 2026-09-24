import { describe, expect, it } from "vitest";

import type { Deadline } from "@/lib/lifecycle/sweep-budget";
import { NO_DEADLINE } from "@/lib/lifecycle/sweep-budget";
import {
  forEachInRotation,
  resumeFields,
} from "@/lib/lifecycle/sweeps/rotation";

function passesAfter(n: number): Deadline {
  let asked = 0;
  return { at: 0, passed: () => asked++ >= n };
}

const ids = ["d", "a", "c", "b", "e"];
const key = (id: string) => id;
const noop = () => {};

describe("forEachInRotation", () => {
  it("takes every candidate in id order and hands back no cursor when it gets through them all", async () => {
    const seen: string[] = [];
    const { tally, resumeAfter } = await forEachInRotation(
      ids,
      key,
      null,
      NO_DEADLINE,
      async (id) => {
        seen.push(id);
      },
      noop,
    );
    expect(seen).toEqual(["a", "b", "c", "d", "e"]);
    expect(tally.processed).toBe(5);
    expect(resumeAfter).toBeNull();
  });

  it("starts after the cursor, wraps round, and stops at the deadline with the last one it attempted", async () => {
    const seen: string[] = [];
    const { tally, resumeAfter } = await forEachInRotation(
      ids,
      key,
      "c",
      passesAfter(3),
      async (id) => {
        seen.push(id);
        if (id === "e") throw new Error("a bad row still counts as attempted");
      },
      noop,
    );
    expect(seen).toEqual(["d", "e", "a"]);
    expect(tally).toMatchObject({ processed: 2, failed: 1, unreached: 2 });
    expect(resumeAfter).toBe("a");
  });

  it("keeps the old cursor when the deadline leaves it no time at all", async () => {
    const { tally, resumeAfter } = await forEachInRotation(
      ids,
      key,
      "c",
      passesAfter(0),
      async () => {},
      noop,
    );
    expect(tally.unreached).toBe(5);
    expect(resumeAfter).toBe("c");
  });

  it("resumes after the last attempt when consecutive failures abort the loop", async () => {
    const { tally, resumeAfter } = await forEachInRotation(
      ["a", "b", "c", "d", "e", "f", "g"],
      key,
      null,
      NO_DEADLINE,
      async () => {
        throw new Error("the dependency is down");
      },
      noop,
    );
    expect(tally).toMatchObject({ failed: 5, skipped: 2, aborted: true });
    expect(resumeAfter).toBe("e");
  });
});

describe("resumeFields", () => {
  it("stores the cursor under the resume key, and nothing once the turn is complete", () => {
    expect(resumeFields("abc")).toEqual({ resume_after: "abc" });
    expect(resumeFields(null)).toEqual({});
  });
});
