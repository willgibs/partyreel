import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  nextPurgeWindow,
  parseDailySchedule,
  PURGE_CRON_PATH,
  PURGE_SCHEDULE,
  PURGE_WINDOW_MS,
  purgeTimeLabel,
} from "@/lib/lifecycle/purge-time";

/**
 * THE PURGE'S TIME, FROM ONE HOME (lp/account-exit). The deletion dialog, its done state and every
 * sign-in that meets the deletion's ban name the time the purge has run by, in the reader's own
 * zone; the time is vercel.json's cron, and this file holds the two together.
 *
 * What is pinned: the parity (a schedule moved in vercel.json turns this red until the words move
 * with it), the window (the first to START after the moment asked about, its end an hour on), and
 * the words in a zone west of UTC, one far west of it and two east of it, for a moment just before
 * the window, inside it and just after it.
 */

const at = (iso: string) => Date.parse(iso);

describe("the schedule is vercel.json's", () => {
  const vercel = JSON.parse(
    readFileSync(join(process.cwd(), "vercel.json"), "utf8"),
  ) as { crons?: { path: string; schedule: string }[] };
  const purges = (vercel.crons ?? []).filter(
    (cron) => cron.path === PURGE_CRON_PATH,
  );

  it("★ names the purge cron exactly once, on the schedule the words promise", () => {
    expect(purges).toHaveLength(1);
    expect(purges[0].schedule).toBe(PURGE_SCHEDULE);
  });

  it("points at the route that runs the account sweep", () => {
    expect(
      existsSync(join(process.cwd(), `src/app${PURGE_CRON_PATH}/route.ts`)),
    ).toBe(true);
  });

  it("is a once-a-day schedule, and refuses any other shape", () => {
    expect(parseDailySchedule(PURGE_SCHEDULE)).toEqual({ minute: 0, hour: 4 });
    for (const other of [
      "*/5 * * * *",
      "0 4 * * 1",
      "0 4,16 * * *",
      "0 24 * * *",
      "60 4 * * *",
    ]) {
      expect(() => parseDailySchedule(other), other).toThrow(
        /once-a-day schedule/,
      );
    }
  });
});

describe("the next purge window", () => {
  it("is the hour from the scheduled minute (Hobby fires anywhere inside it)", () => {
    const { start, end } = nextPurgeWindow(at("2026-10-02T19:00:00Z"));
    expect(start.toISOString()).toBe("2026-10-03T04:00:00.000Z");
    expect(end.toISOString()).toBe("2026-10-03T05:00:00.000Z");
    expect(end.getTime() - start.getTime()).toBe(PURGE_WINDOW_MS);
  });

  it("just before the window, is tonight's", () => {
    expect(nextPurgeWindow(at("2026-10-03T03:59:59Z")).end.toISOString()).toBe(
      "2026-10-03T05:00:00.000Z",
    );
  });

  it("★ at its first minute and inside it, is tomorrow's: the cron may already have fired", () => {
    for (const moment of ["2026-10-03T04:00:00Z", "2026-10-03T04:30:00Z"]) {
      expect(nextPurgeWindow(at(moment)).end.toISOString(), moment).toBe(
        "2026-10-04T05:00:00.000Z",
      );
    }
  });

  it("just after the window, is tomorrow's", () => {
    expect(nextPurgeWindow(at("2026-10-03T05:00:01Z")).end.toISOString()).toBe(
      "2026-10-04T05:00:00.000Z",
    );
  });

  it("rolls over a month and a year", () => {
    expect(nextPurgeWindow(at("2026-12-31T20:00:00Z")).end.toISOString()).toBe(
      "2027-01-01T05:00:00.000Z",
    );
  });

  it("never ends more than 25 hours away, and never in the past", () => {
    for (let h = 0; h < 48; h += 0.25) {
      const now = at("2026-10-02T00:00:00Z") + h * 3_600_000;
      const { end } = nextPurgeWindow(now);
      expect(end.getTime()).toBeGreaterThan(now);
      expect(end.getTime() - now).toBeLessThanOrEqual(25 * 3_600_000);
    }
  });
});

/** The label for the window that counts from `iso`, in `zone`. */
function label(iso: string, zone: string): string {
  const now = at(iso);
  return purgeTimeLabel(nextPurgeWindow(now).end, now, zone);
}

const NBSP = "\u00a0";

describe("the words, in the reader's own zone", () => {
  it("★ Eastern: 1:00 AM the next morning, whether asked before, inside or after the window", () => {
    const zone = "America/New_York";
    expect(label("2026-10-02T19:00:00Z", zone)).toBe(`1:00${NBSP}AM tomorrow`);
    // Just before (11:59 PM EDT), inside (12:30 AM) and just after (1:01 AM) the window.
    expect(label("2026-10-03T03:59:00Z", zone)).toBe(`1:00${NBSP}AM tomorrow`);
    expect(label("2026-10-03T04:30:00Z", zone)).toBe(`1:00${NBSP}AM tomorrow`);
    expect(label("2026-10-03T05:01:00Z", zone)).toBe(`1:00${NBSP}AM tomorrow`);
  });

  it("★ Pacific: 10:00 PM, tonight before the window and tomorrow inside or after it", () => {
    const zone = "America/Los_Angeles";
    expect(label("2026-10-02T19:00:00Z", zone)).toBe(`10:00${NBSP}PM tonight`);
    expect(label("2026-10-03T03:59:00Z", zone)).toBe(`10:00${NBSP}PM tonight`);
    expect(label("2026-10-03T04:30:00Z", zone)).toBe(`10:00${NBSP}PM tomorrow`);
    expect(label("2026-10-03T05:01:00Z", zone)).toBe(`10:00${NBSP}PM tomorrow`);
  });

  it("★ a zone east of UTC (Berlin): 7:00 AM, today once the evening has passed", () => {
    const zone = "Europe/Berlin";
    expect(label("2026-10-02T19:00:00Z", zone)).toBe(`7:00${NBSP}AM tomorrow`);
    expect(label("2026-10-03T03:59:00Z", zone)).toBe(`7:00${NBSP}AM today`);
    expect(label("2026-10-03T04:30:00Z", zone)).toBe(`7:00${NBSP}AM tomorrow`);
    expect(label("2026-10-03T05:01:00Z", zone)).toBe(`7:00${NBSP}AM tomorrow`);
  });

  it("a half-hour zone (Kolkata) and a far-east one (Sydney)", () => {
    expect(label("2026-10-03T03:59:00Z", "Asia/Kolkata")).toBe(
      `10:30${NBSP}AM today`,
    );
    expect(label("2026-10-02T19:00:00Z", "Australia/Sydney")).toBe(
      `3:00${NBSP}PM today`,
    );
  });

  it("says midnight and noon in words, where a clock reads a day off", () => {
    // Central daylight time: 05:00 UTC is midnight.
    expect(label("2026-10-02T19:00:00Z", "America/Chicago")).toBe(
      "midnight tonight",
    );
    // Bangkok (UTC+7): 05:00 UTC is noon, the same day there as 2:00 AM.
    expect(label("2026-10-02T19:00:00Z", "Asia/Bangkok")).toBe("noon today");
    expect(label("2026-10-02T12:00:00Z", "Asia/Bangkok")).toBe("noon tomorrow");
  });

  it("follows a daylight-saving change (Eastern falls back on 1 November 2026)", () => {
    const zone = "America/New_York";
    // Before the change the window ends at 1:00 AM EDT; after it, at midnight EST.
    expect(label("2026-10-31T20:00:00Z", zone)).toBe(`1:00${NBSP}AM tomorrow`);
    expect(label("2026-11-01T12:00:00Z", zone)).toBe("midnight tonight");
  });

  it("is UTC's own clock where no zone is known", () => {
    expect(label("2026-10-02T19:00:00Z", "UTC")).toBe(`5:00${NBSP}AM tomorrow`);
  });
});
