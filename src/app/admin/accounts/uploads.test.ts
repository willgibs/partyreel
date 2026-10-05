import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type { AccountUploads } from "@/lib/db/queries/accounts";
import {
  GIGABYTE,
  MEGABYTE,
  planById,
  uploadAllowance,
} from "@/lib/constants/tiers";

import {
  allowanceLabel,
  hourLabel,
  hourState,
  NO_READING,
  UPLOADS_AN_HOUR,
  uploadsState,
  usedLabel,
  windowLabel,
} from "./uploads";

/**
 * ★ THE OPERATOR READS THE REFUSALS THE PRODUCT MAKES, in one set of words: a host's window against her plan's
 * allowance, and the hour against the breaker. A reading that was not taken is "No reading", never a zero.
 */

const free = (usedBytes: number): AccountUploads => ({
  window: "month",
  allowanceBytes: planById("free").uploadsBytes,
  used: { ok: true, value: usedBytes },
});

describe("the breaker's ceiling is the SQL's, read off the migrations", () => {
  /** The newest migration that sets `c_uploads_an_hour` wins, as the live function is the last one created. */
  function ceilingInSql(): number {
    const dir = join(process.cwd(), "supabase", "migrations");
    let found: number | null = null;
    for (const file of readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .sort()) {
      const sql = readFileSync(join(dir, file), "utf8").replace(
        /--[^\n]*/g,
        "",
      );
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
    };
    expect(unmetered.allowanceBytes).toBeNull();
    expect(uploadsState(unmetered)).toBe("unmetered");
    expect(allowanceLabel(unmetered)).toBe("Unmetered");
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
      }),
    ).toBe("200 GB / mo");
    expect(
      allowanceLabel({
        window: "year",
        allowanceBytes: planById("event_pass").uploadsBytes,
        used: { ok: true, value: 0 },
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
