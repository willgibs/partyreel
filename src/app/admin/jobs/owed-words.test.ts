/**
 * WHAT A SIGNAL STILL OWES, IN ITS OWN WORDS (crumbs-75): a card says the work owed past its grace, since when and
 * what happens next, and says nothing at all when nothing is owed.
 */
import { describe, expect, it } from "vitest";

import { owedWords } from "@/app/admin/jobs/owed-words";

describe("owedWords", () => {
  it("says nothing when nothing is owed, or for a signal that owes by no rule of its own", () => {
    expect(owedWords("email_delivery", null)).toBeNull();
    expect(
      owedWords("email_delivery", { ok24h: 3, failed24h: 0, owed: 0 }),
    ).toBeNull();
    expect(owedWords("email_delivery", { ok24h: 3, failed24h: 0 })).toBeNull();
    expect(
      owedWords("abuse_limiter", { ok24h: 3, failed24h: 0, owed: 4 }),
    ).toBeNull();
  });

  it("★ names the notices waiting, since when the oldest has failed, and the day each is given up", () => {
    expect(
      owedWords("email_delivery", {
        ok24h: 0,
        failed24h: 1,
        owed: 2,
        owedSinceMs: Date.parse("2026-10-03T04:00:00.000Z"),
      }),
    ).toEqual({
      term: "Waiting",
      line: "2 one-time notices to send, the oldest failing since Oct 3, 2026, 04:00 UTC. Its sweep tries each again every night, and gives up, said here, 30 days after a first failure.",
    });
    expect(
      owedWords("email_delivery", { ok24h: 0, failed24h: 0, owed: 1 })?.line,
    ).toBe(
      "1 one-time notice to send. Its sweep tries it again every night, and gives up, said here, 30 days after a first failure.",
    );
  });

  it("★ names the downloads with no end, the grace, and where each row is", () => {
    expect(
      owedWords("export_delivery", { ok24h: 5, failed24h: 0, owed: 1 }),
    ).toEqual({
      term: "No end",
      line: "1 download the Worker checked or began never said how it ended, 6 hours on: a lost report or a Worker that died mid-stream (a walk left right after its check reads the same). Each row is on /admin/exports.",
    });
  });
});
