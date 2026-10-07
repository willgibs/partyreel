/**
 * THE PARTY'S MORNING AFTER (`zone-morning.ts`'s develop, `defaultDevelopAt` read in the party's zone): a develop defaults
 * to 9 am the morning after the party's LAST day in the party's own zone, one instant whoever reads it, through both
 * clock changes, with one fallback.
 *
 * ★ Each case reads the party's zone and never a reader's: nothing here takes one, which is the lane's whole promise
 * (Will, 2026-10-05: "It feels unfair to unlock the album at different times for certain guests based on geographical
 * location").
 *
 * ★ RESHAPED ON PURPOSE (crumbs-91, call AY1; scar kept: the party's 9 am read once in its own zone, both clock changes,
 * the one fallback). The expired reason: the album turning at that morning. The album turns at her close or at the
 * develop itself (`album-order.test.ts`), so these cases hold the morning where it still lives, the default develop.
 */
import { describe, expect, it } from "vitest";

import { defaultDevelopAt } from "@/lib/disposable/reveal";
import { wallTimeIn } from "@/lib/event/wall-time";
import { developDefaultIn, developToKeep } from "@/lib/event/zone-morning";

const at = (iso: string) => Date.parse(iso);

describe("the party's 9 am, read once in its own zone", () => {
  // Read well before the party, so the morning after its last day is the develop's default.
  const before = at("2026-09-01T00:00:00Z");
  const morning = (
    zone: string | null,
    eventDate: string,
    eventEndDate?: string,
  ) =>
    developDefaultIn(zone, {
      eventDate,
      eventEndDate,
      nowMs: before,
    }).getTime();

  it("★ a party in Auckland develops at 9 am the morning after, in Auckland, for everyone", () => {
    // Sunday 4 October, 9:00 NZDT (UTC+13).
    expect(morning("Pacific/Auckland", "2026-10-03")).toBe(
      at("2026-10-03T20:00:00Z"),
    );
  });

  it("a range develops the morning after its LAST day", () => {
    // Monday 9:00 CST (UTC-6).
    expect(morning("America/Mexico_City", "2026-10-02", "2026-10-04")).toBe(
      at("2026-10-05T15:00:00Z"),
    );
  });

  it("★ both clock changes in the party's zone: the morning after is 9 am by its own wall clock", () => {
    // Los Angeles: falls back on 1 November 2026, springs forward on 14 March 2027.
    expect(morning("America/Los_Angeles", "2026-10-31")).toBe(
      at("2026-11-01T17:00:00Z"),
    );
    expect(morning("America/Los_Angeles", "2027-03-13")).toBe(
      at("2027-03-14T16:00:00Z"),
    );
    // Auckland: springs forward on 27 September 2026, falls back on 4 April 2027.
    expect(morning("Pacific/Auckland", "2026-09-26")).toBe(
      at("2026-09-26T20:00:00Z"),
    );
    expect(morning("Pacific/Auckland", "2027-04-03")).toBe(
      at("2027-04-03T21:00:00Z"),
    );
  });

  it("a party with no zone, or one the runtime cannot read, is read in the one fallback (UTC)", () => {
    for (const zone of [null, "Mars/Olympus", "+13:00"]) {
      expect(morning(zone, "2026-10-03"), String(zone)).toBe(
        at("2026-10-04T09:00:00Z"),
      );
    }
  });

  it("wallTimeIn names an hour in a zone's own wall clock", () => {
    expect(wallTimeIn("2026-07-01", 9, "Asia/Kolkata")).toBe(
      at("2026-07-01T03:30:00Z"),
    );
    expect(wallTimeIn("2026-01-15", 9, "Australia/Sydney")).toBe(
      at("2026-01-14T22:00:00Z"),
    );
  });
});

describe("developDefaultIn: the develop's 9 am is the party's", () => {
  it("★ a party ahead develops at 9 am the morning after its last day there", () => {
    const develop = developDefaultIn("Pacific/Auckland", {
      eventDate: "2026-10-09",
      eventEndDate: "2026-10-11",
      nowMs: at("2026-10-05T22:00:00Z"),
    });
    expect(develop.toISOString()).toBe("2026-10-11T20:00:00.000Z"); // Monday 9:00 NZDT
  });

  it("a party passed, or undated, develops at 9 am tomorrow by the PARTY's calendar", () => {
    // 22:00 UTC on 5 October: already 6 October, 11:00, in Auckland; still 5 October, 15:00, in Los Angeles.
    const nowMs = at("2026-10-05T22:00:00Z");
    expect(
      developDefaultIn("Pacific/Auckland", {
        eventDate: null,
        nowMs,
      }).toISOString(),
    ).toBe("2026-10-06T20:00:00.000Z"); // 7 October, 9:00 NZDT
    expect(
      developDefaultIn("America/Los_Angeles", {
        eventDate: "2026-09-12",
        nowMs,
      }).toISOString(),
    ).toBe("2026-10-06T16:00:00.000Z"); // 6 October, 9:00 PDT
  });

  it("a party today, in its zone, develops the morning after today", () => {
    expect(
      developDefaultIn("Pacific/Auckland", {
        eventDate: "2026-10-06",
        nowMs: at("2026-10-05T22:00:00Z"),
      }).toISOString(),
    ).toBe("2026-10-06T20:00:00.000Z");
  });
});

describe("developToKeep: the develop a style keeps", () => {
  const nowMs = at("2026-10-05T22:00:00Z");

  it("keeps a time still ahead, whatever the zone", () => {
    expect(
      developToKeep("2026-10-20T01:00:00.000Z", "Pacific/Auckland", {
        eventDate: null,
        nowMs,
      }),
    ).toBe("2026-10-20T01:00:00.000Z");
  });

  it("★ offers the party's own 9 am for a time passed or none, never the browser's", () => {
    for (const developsAt of [null, "2026-10-01T09:00:00.000Z"]) {
      expect(
        developToKeep(developsAt, "Pacific/Auckland", {
          eventDate: null,
          nowMs,
        }),
      ).toBe("2026-10-06T20:00:00.000Z");
    }
  });

  it("where no zone can be named at all, keeps the browser's own clock (as before the party kept a zone)", () => {
    expect(developToKeep(null, null, { eventDate: "2026-10-09", nowMs })).toBe(
      defaultDevelopAt({
        eventDate: "2026-10-09",
        now: new Date(nowMs),
      }).toISOString(),
    );
  });
});
