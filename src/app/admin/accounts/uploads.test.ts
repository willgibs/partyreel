import { describe, expect, it } from "vitest";

import type { AccountUploads } from "@/lib/db/queries/accounts";
import {
  GIGABYTE,
  MEGABYTE,
  planById,
  uploadAllowance,
} from "@/lib/constants/tiers";
import { readMigrations } from "@/lib/db/testing/migrations";

import {
  allowanceLabel,
  hourLabel,
  hourState,
  lapsedBadge,
  lapsedSentence,
  lapsedSinceDate,
  NO_READING,
  PASS_LAPSED,
  PRO_PENDING,
  UPLOADS_AN_HOUR,
  UPLOADS_REFUSED,
  uploadsState,
  usedLabel,
  windowLabel,
} from "./uploads";

/**
 * ★ THE OPERATOR READS THE REFUSALS THE PRODUCT MAKES, in one set of words: a host's window against her plan's
 * allowance, and the hour against the breaker. A reading that was not taken is "No reading", never a zero, and a pass
 * that has lapsed is lapsed, never "0 B" of an allowance she cannot use.
 */

const free = (usedBytes: number): AccountUploads => ({
  window: "month",
  allowanceBytes: planById("free").uploadsBytes,
  used: { ok: true, value: usedBytes },
  lapsed: null,
});

describe("the breaker's ceiling is the SQL's, read off the migrations", () => {
  /** The newest migration that sets `c_uploads_an_hour` wins, as the live function is the last one created. */
  function ceilingInSql(): number {
    let found: number | null = null;
    for (const migration of readMigrations()) {
      const sql = migration.sql.replace(/--[^\n]*/g, "");
      for (const m of sql.matchAll(
        /\bc_uploads_an_hour constant integer := (\d+);/g,
      )) {
        found = Number(m[1]);
      }
    }
    if (found === null)
      throw new Error("no c_uploads_an_hour in the migrations");
    return found;
  }

  it("★ UPLOADS_AN_HOUR equals the constant meter_upload refuses at", () => {
    expect(UPLOADS_AN_HOUR).toBe(ceilingInSql());
  });
});

describe("a window against its allowance", () => {
  it("is within while her uploads are under the plan's number", () => {
    expect(uploadsState(free(299 * MEGABYTE))).toBe("within");
    expect(usedLabel(free(212 * MEGABYTE))).toBe("212 MB");
  });

  it("★ is at the allowance at exactly the line the advisories read (used >= allowance), and past it", () => {
    expect(uploadsState(free(300 * MEGABYTE))).toBe("at");
    expect(uploadsState(free(301 * MEGABYTE))).toBe("at");
  });

  it("★ a failed read is unread, says No reading and is never a zero or a calm state", () => {
    const failed: AccountUploads = {
      ...free(0),
      used: { ok: false, message: "boom" },
    };
    expect(uploadsState(failed)).toBe("unread");
    expect(usedLabel(failed)).toBe(NO_READING);
    expect(usedLabel(failed)).not.toMatch(/^0/);
  });

  it("a real zero is a reading: a month with no uploads says 0 B", () => {
    expect(uploadsState(free(0))).toBe("within");
    expect(usedLabel(free(0))).toBe("0 B");
  });

  it("a Pro with no cap on record is unmetered, however much it has uploaded (fail OPEN, as the SQL does)", () => {
    const unmetered: AccountUploads = {
      window: "month",
      allowanceBytes: uploadAllowance("pro", null),
      used: { ok: true, value: 900 * GIGABYTE },
      lapsed: null,
    };
    expect(unmetered.allowanceBytes).toBeNull();
    expect(uploadsState(unmetered)).toBe("unmetered");
    expect(allowanceLabel(unmetered)).toBe("Unmetered");
  });
});

describe("a lapsed pass (billing-locks): every upload refused until the recompute, never 0 B of room", () => {
  /** A pass holder whose last pass ended: her window is no window, so `uploads_used` reads 0 over it. */
  const lapsed = (since: string | null, converted = false): AccountUploads => ({
    window: "year",
    allowanceBytes: planById("event_pass").uploadsBytes,
    used: { ok: true, value: 0 },
    lapsed: { since, converted },
  });

  it("★ is lapsed, never within: her 0 B of 50 GB was room she could not use", () => {
    expect(uploadsState(lapsed("2026-10-03T14:00:00+00:00"))).toBe("lapsed");
    // The figure a lapsed pass reads, without the flag, is exactly the calm row this replaces.
    expect(uploadsState({ ...lapsed(null), lapsed: null })).toBe("within");
  });

  it("★ its allowance says uploads are refused, not the plan's number no live pass holds", () => {
    expect(allowanceLabel(lapsed("2026-10-03T14:00:00+00:00"))).toBe(
      UPLOADS_REFUSED,
    );
    expect(UPLOADS_REFUSED).toBe("Uploads refused");
    expect(PASS_LAPSED).toBe("Pass lapsed");
  });

  it("says since when: the day in the list, the minute on the page, and nothing it does not know", () => {
    const since = "2026-10-03T14:05:00+00:00";
    expect(lapsedSinceDate({ since, converted: false })).toBe(
      "Oct 3, 2026 UTC",
    );
    expect(lapsedSentence({ since, converted: false })).toBe(
      "Her pass ended Oct 3, 2026, 14:05 UTC: new uploads, hers and her guests', are refused until the nightly recompute moves her to Free.",
    );
    expect(lapsedBadge({ since, converted: false })).toBe(PASS_LAPSED);
    // No pass of hers ever was live (a tier set by hand): no date is invented.
    expect(lapsedSinceDate({ since: null, converted: false })).toBeNull();
    expect(lapsedSentence({ since: null, converted: false })).toBe(
      "She holds no live pass: new uploads, hers and her guests', are refused until the nightly recompute moves her to Free.",
    );
  });

  it("★ a pass converted to Pro credit before her Pro plan landed is Pro pending, never 'ended ... moves her to Free'", () => {
    const since = "2026-10-05T09:30:00+00:00";
    const converted = lapsed(since, true);
    expect(uploadsState(converted)).toBe("lapsed");
    expect(allowanceLabel(converted)).toBe(UPLOADS_REFUSED);
    expect(lapsedBadge(converted.lapsed!)).toBe(PRO_PENDING);
    expect(PRO_PENDING).toBe("Pro pending");
    expect(lapsedSentence(converted.lapsed!)).toBe(
      "Her passes became Pro credit Oct 5, 2026, 09:30 UTC and her Pro plan has not landed yet: new uploads, hers and her guests', are refused until it does.",
    );
    expect(lapsedSentence({ since: null, converted: true })).toBe(
      "Her passes became Pro credit and her Pro plan has not landed yet: new uploads, hers and her guests', are refused until it does.",
    );
  });

  it("★ a failed read outranks it: No reading, and the plan's own number, never a refusal it did not read", () => {
    const failed: AccountUploads = {
      ...lapsed("2026-10-03T14:00:00+00:00"),
      used: { ok: false, message: "boom" },
    };
    expect(uploadsState(failed)).toBe("unread");
    expect(allowanceLabel(failed)).toBe("50 GB / yr");
  });
});

describe("the allowance as a table says it", () => {
  it("names the window: a month for Free and Pro, the year for a pass", () => {
    expect(allowanceLabel(free(0))).toBe("300 MB / mo");
    expect(
      allowanceLabel({
        window: "month",
        allowanceBytes: planById("pro_200").uploadsBytes,
        used: { ok: true, value: 0 },
        lapsed: null,
      }),
    ).toBe("200 GB / mo");
    expect(
      allowanceLabel({
        window: "year",
        allowanceBytes: planById("event_pass").uploadsBytes,
        used: { ok: true, value: 0 },
        lapsed: null,
      }),
    ).toBe("50 GB / yr");
  });

  it("names the window on the account's page", () => {
    expect(windowLabel("month")).toBe("This month");
    expect(windowLabel("year")).toBe("Pass year");
  });
});

describe("the hour against the breaker", () => {
  it("reads the tally against the ceiling", () => {
    expect(hourLabel({ ok: true, value: 312 })).toBe("312 of 20,000");
    expect(hourState({ ok: true, value: 312 })).toBe("within");
  });

  it("★ is at the breaker when the next presign is refused (hour_uploads >= the ceiling)", () => {
    expect(hourState({ ok: true, value: UPLOADS_AN_HOUR - 1 })).toBe("within");
    expect(hourState({ ok: true, value: UPLOADS_AN_HOUR })).toBe("at");
  });

  it("★ a failed read says No reading, never 0 of the ceiling", () => {
    expect(hourLabel({ ok: false, message: "boom" })).toBe(NO_READING);
    expect(hourState({ ok: false, message: "boom" })).toBe("unread");
  });
});
