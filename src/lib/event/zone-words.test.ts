/**
 * THE FAR-FROM-HOME WORDS (`zone-words.ts`): a time on the party's clock with its place named, and the develop field's
 * wall clock there, both ways, across both clock changes. Nothing here reads the machine's zone: every case names one.
 */
import { describe, expect, it } from "vitest";

import {
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
    // A field that sends seconds is still a whole time.
    expect(fromZoneInput("2026-10-04T09:00:00", MX)?.toISOString()).toBe(iso);
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
