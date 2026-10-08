import { describe, expect, it } from "vitest";

import { GIGABYTE, MEGABYTE } from "@/lib/constants/tiers";

import {
  CREDIT_WHY,
  creditByline,
  creditLine,
  creditMegabytes,
  creditRefusalWords,
  creditRoom,
  creditTotal,
  creditTotalWords,
  isCreditWhy,
  UPLOADS_CREDIT_MAX_LIVE,
  UPLOADS_CREDIT_MAX_MB,
  UPLOADS_CREDIT_MIN_BYTES,
  windowEndWords,
  type UploadsCredit,
} from "./uploads-credit";

/**
 * ★ THE OPERATOR'S CREDIT, SAID IN ONE SET OF WORDS (crumbs-92, X6): what she may still be credited, what a typed
 * amount means, why a refusal refused, and how a live credit reads on the card and in the list. The figures the SQL holds
 * are `uploads-credit-sql.test.ts`'s (read off the migration).
 */

const credit = (over: Partial<UploadsCredit> = {}): UploadsCredit => ({
  id: "c1",
  bytes: 100 * MEGABYTE,
  windowEndsAt: "2026-11-01T00:00:00+00:00",
  grantedAt: "2026-10-08T12:03:00+00:00",
  reason: "She wrote in: her guests were refused",
  operator: "hi@willgibs.com",
  ...over,
});

describe("the room a new credit may still take", () => {
  it("is the plan's allowance less what is held, never below zero, and nothing to lift while unmetered", () => {
    expect(creditRoom(300 * MEGABYTE, 0)).toBe(300 * MEGABYTE);
    expect(creditRoom(300 * MEGABYTE, 100 * MEGABYTE)).toBe(200 * MEGABYTE);
    expect(creditRoom(300 * MEGABYTE, 300 * MEGABYTE)).toBe(0);
    // A plan that moved down under credits already made: held past the allowance reads zero room, not a negative.
    expect(creditRoom(100 * MEGABYTE, 300 * MEGABYTE)).toBe(0);
    expect(creditRoom(null, 0)).toBeNull();
  });
});

describe("the amount as typed", () => {
  it("is whole megabytes or gigabytes, to the whole megabytes the action sends", () => {
    expect(creditMegabytes("100", "MB")).toEqual({
      ok: true,
      megabytes: 100,
    });
    expect(creditMegabytes(" 2 ", "GB")).toEqual({
      ok: true,
      megabytes: 2048,
    });
    expect(creditMegabytes("1", "MB")).toEqual({ ok: true, megabytes: 1 });
  });

  it("★ refuses what is not a whole positive number, in words, before anything is asked", () => {
    for (const bad of [
      "",
      "  ",
      "abc",
      "1.5",
      "-5",
      "1e3",
      "٣",
      "0x10",
      "1,000",
    ]) {
      expect(creditMegabytes(bad, "MB"), JSON.stringify(bad)).toEqual({
        ok: false,
        message: "Enter a whole number.",
      });
    }
    expect(creditMegabytes("0", "MB")).toEqual({
      ok: false,
      message: "A credit is at least 1 MB.",
    });
    expect(creditMegabytes("0", "GB")).toEqual({
      ok: false,
      message: "A credit is at least 1 MB.",
    });
  });

  it("★ stops a slipped digit at a sanity ceiling, not at the plan's number (the database's)", () => {
    expect(creditMegabytes(String(UPLOADS_CREDIT_MAX_MB), "MB").ok).toBe(true);
    expect(creditMegabytes(String(UPLOADS_CREDIT_MAX_MB + 1), "MB")).toEqual({
      ok: false,
      message: "That is more than any plan's allowance.",
    });
    expect(creditMegabytes("1025", "GB").ok).toBe(false);
    expect(creditMegabytes("1024", "GB").ok).toBe(true);
    // Seven digits is the longest a whole number may run: eight is refused as no number.
    expect(creditMegabytes("12345678", "MB").ok).toBe(false);
  });
});

describe("why nothing was credited", () => {
  it("★ has a sentence for every refusal the function answers, and none of them is a code", () => {
    for (const why of CREDIT_WHY) {
      const words = creditRefusalWords(why, { liveCount: 10 });
      expect(words.length, why).toBeGreaterThan(10);
      expect(words, why).not.toMatch(/over_bound|too_many|too_small|_/);
    }
  });

  it("says the figures it was given", () => {
    expect(creditRefusalWords("too_small", { minBytes: MEGABYTE })).toBe(
      "A credit is at least 1 MB.",
    );
    expect(creditRefusalWords("too_many", { liveCount: 10 })).toContain(
      "10 live credits",
    );
    // The bound names what still fits, or that nothing does.
    expect(
      creditRefusalWords("over_bound", {
        maxBytes: 300 * MEGABYTE,
        liveBytes: 250 * MEGABYTE,
      }),
    ).toContain("50 MB more fits");
    expect(
      creditRefusalWords("over_bound", {
        maxBytes: 300 * MEGABYTE,
        liveBytes: 300 * MEGABYTE,
      }),
    ).toBe(
      "Her live credits already add one more of her plan's allowance, the most a window takes.",
    );
    expect(creditRefusalWords("over_bound")).toContain(
      "the most a window takes",
    );
  });

  it("recognizes only the refusals the function gives", () => {
    expect(CREDIT_WHY.every(isCreditWhy)).toBe(true);
    for (const other of ["", "granted", "refused", "OVER_BOUND", null, 3]) {
      expect(isCreditWhy(other), String(other)).toBe(false);
    }
  });

  it("holds the credit's figures at the SQL's (the migration is read in uploads-credit-sql.test.ts)", () => {
    expect(UPLOADS_CREDIT_MIN_BYTES).toBe(MEGABYTE);
    expect(UPLOADS_CREDIT_MAX_LIVE).toBe(10);
    // The ceiling is a terabyte of megabytes: above any plan's allowance (Pro's largest is 500 GB a month).
    expect(UPLOADS_CREDIT_MAX_MB * MEGABYTE).toBe(1024 * GIGABYTE);
  });
});

describe("a live credit on the card and in the list", () => {
  it("says the amount and where it ends, who made it and when, to the minute in UTC", () => {
    expect(creditLine(credit())).toBe("+100 MB until Nov 1, 2026 UTC");
    expect(creditByline(credit())).toBe(
      "Granted Oct 8, 2026, 12:03 UTC by hi@willgibs.com",
    );
    // An operator whose address cannot be read: the act is still on record by id, and the line does not invent a name.
    expect(creditByline(credit({ operator: null }))).toBe(
      "Granted Oct 8, 2026, 12:03 UTC",
    );
  });

  it("adds what she holds together, and wears it in the list as a credit", () => {
    expect(creditTotal([])).toBe(0);
    expect(
      creditTotal([credit(), credit({ id: "c2", bytes: 50 * MEGABYTE })]),
    ).toBe(150 * MEGABYTE);
    expect(creditTotalWords(150 * MEGABYTE)).toBe("+150 MB credit");
  });
});

describe("the window's end in words", () => {
  it("is the turn of the UTC month for Free and Pro, in any zone the clock is read in", () => {
    expect(windowEndWords("month", Date.UTC(2026, 9, 8, 12, 3))).toBe(
      "Nov 1, 2026 UTC, when the month turns",
    );
    // December turns into the next year; the last second of a month still ends at its turn.
    expect(windowEndWords("month", Date.UTC(2026, 11, 31, 23, 59, 59))).toBe(
      "Jan 1, 2027 UTC, when the month turns",
    );
  });

  it("is her soonest live pass for a pass holder, whose end the page does not hold", () => {
    expect(windowEndWords("year", Date.UTC(2026, 9, 8))).toBe(
      "her soonest live pass ends",
    );
  });
});
