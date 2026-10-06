/**
 * THE FAR-FROM-HOME WORDS (`zone-words.ts`): a time on the party's clock with its place named, and the develop field's
 * wall clock there, both ways, across both clock changes. Nothing here reads the machine's zone: every case names one.
 */
import { describe, expect, it } from "vitest";

import {
  bothClocksWhen,
  clockThere,
  fromZoneInput,
  toZoneInput,
  zoneTimeWords,
  zoneWhen,
} from "@/lib/event/zone-words";

const MX = "America/Mexico_City";

describe("the words: the party's clock, its place named", () => {
  it("★ Settings' develop time says the party's clock and where: 9:00 AM in Mexico City, whoever reads it", () => {
    // 15:00 UTC is 9:00 in Mexico City (UTC-6), 8:00 in Los Angeles, 16:00 in London.
    expect(zoneTimeWords("2026-10-04T15:00:00.000Z", MX)).toBe(
      "Sun, Oct 4, 9:00 AM in Mexico City",
    );
    expect(zoneTimeWords(null, MX)).toBeNull();
    expect(zoneTimeWords("soon", MX)).toBeNull();
  });

  it("★ a phrase after a verb always names its day, never 'tomorrow' (a relative day read across two zones is nobody's)", () => {
    expect(zoneWhen("2026-10-04T15:00:00.000Z", MX)).toBe(
      "Sun, Oct 4 at 9 am in Mexico City",
    );
    expect(zoneWhen("2026-10-04T15:30:00.000Z", MX)).toBe(
      "Sun, Oct 4 at 9:30 am in Mexico City",
    );
    // Midnight and noon as a person says them.
    expect(zoneWhen("2026-10-04T06:00:00.000Z", MX)).toBe(
      "Sun, Oct 4 at 12 am in Mexico City",
    );
    expect(zoneWhen("2026-10-04T18:00:00.000Z", MX)).toBe(
      "Sun, Oct 4 at 12 pm in Mexico City",
    );
  });

  it("the clock there now, as the city list says it", () => {
    expect(clockThere(Date.parse("2026-10-05T22:12:00Z"), MX)).toBe("4:12 PM");
    expect(
      clockThere(Date.parse("2026-10-05T22:12:00Z"), "Pacific/Auckland"),
    ).toBe("11:12 AM");
  });
});

describe("the field: the party's wall clock, both ways", () => {
  it("holds an instant as the party's wall time, and reads it back to the same instant", () => {
    const iso = "2026-10-04T15:00:00.000Z";
    expect(toZoneInput(iso, MX)).toBe("2026-10-04T09:00");
    expect(fromZoneInput("2026-10-04T09:00", MX)?.toISOString()).toBe(iso);
    expect(fromZoneInput("2026-10-04T09:45", MX)?.toISOString()).toBe(
      "2026-10-04T15:45:00.000Z",
    );
    // A clock that carries seconds keeps them (a field with a step, a bare Exif wall clock).
    expect(fromZoneInput("2026-10-04T09:00:00", MX)?.toISOString()).toBe(iso);
    expect(fromZoneInput("2026-10-04T09:00:42.5", MX)?.toISOString()).toBe(
      "2026-10-04T15:00:42.000Z",
    );
    expect(fromZoneInput("2026-10-04T09:00:60", MX)).toBeNull();
  });

  it("★ both clock changes in the party's zone: 9 am is 9 am by its wall clock", () => {
    const LA = "America/Los_Angeles";
    // Falls back on 1 November 2026 (PST, UTC-8), springs forward on 14 March 2027 (PDT, UTC-7).
    expect(fromZoneInput("2026-11-01T09:00", LA)?.toISOString()).toBe(
      "2026-11-01T17:00:00.000Z",
    );
    expect(fromZoneInput("2027-03-14T09:00", LA)?.toISOString()).toBe(
      "2027-03-14T16:00:00.000Z",
    );
    expect(toZoneInput("2027-03-14T16:00:00.000Z", LA)).toBe(
      "2027-03-14T09:00",
    );
  });

  it("a value that is no whole time is no instant", () => {
    for (const typed of [
      "",
      "2026-10-04",
      "2026-10-04T",
      "2026-10-04T9:00",
      "2026-10-04T24:00",
      "2026-10-04T09:60",
      "soon",
    ]) {
      expect(fromZoneInput(typed, MX), typed).toBeNull();
    }
    expect(toZoneInput("soon", MX)).toBe("");
  });
});

describe("★ both clocks, for a guest far from the party (crumbs-85)", () => {
  it("says the party's clock with its day and place, then hers, her weekday named where her day is not the party's", () => {
    // 01:00 UTC on 4 October: 9 am Sunday in Bali (UTC+8), 6 pm Saturday in Los Angeles (UTC-7).
    expect(
      bothClocksWhen(
        "2026-10-04T01:00:00.000Z",
        "Asia/Makassar",
        "America/Los_Angeles",
      ),
    ).toBe("Sun, Oct 4 at 9 am in Makassar, Sat 6 pm yours");
    // 08:00 UTC: 4 pm in Makassar, 9 am in London (BST): the same Sunday, so no weekday.
    expect(
      bothClocksWhen(
        "2026-10-04T08:00:00.000Z",
        "Asia/Makassar",
        "Europe/London",
      ),
    ).toBe("Sun, Oct 4 at 4 pm in Makassar, 9 am yours");
    expect(bothClocksWhen("soon", "Asia/Makassar", "Europe/London")).toBe("");
  });
});
