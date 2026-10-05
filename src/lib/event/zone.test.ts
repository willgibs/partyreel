/**
 * THE PARTY'S OWN ZONE (`zone.ts`): which zones are read, the one fallback, the host's own, the typed seam, and the
 * place a zone names. Each case is a promise a caller leans on: the server stores only a zone it can read, every reader
 * falls back the same way, and a host reads the city she knows.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  deviceZone,
  hostPartyZone,
  PARTY_ZONE_FALLBACK,
  partyZoneOf,
  readableZone,
  sameZone,
  withZone,
  ZONE_MAX_LENGTH,
  zoneOfRow,
  zonePlace,
} from "@/lib/event/zone";

afterEach(() => {
  vi.restoreAllMocks();
});

/** This runtime's own zone, as a browser would name it, made to answer `zone` for one case. */
function deviceSays(zone: string | undefined) {
  vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockReturnValue({
    ...new Intl.DateTimeFormat("en-US", { timeZone: "UTC" }).resolvedOptions(),
    timeZone: zone as string,
  });
}

describe("readableZone: only a zone this runtime reads, in its own spelling", () => {
  it("reads IANA names as given, never in the runtime's legacy spelling", () => {
    expect(readableZone("America/Mexico_City")).toBe("America/Mexico_City");
    expect(readableZone("Pacific/Auckland")).toBe("Pacific/Auckland");
    expect(readableZone("America/Argentina/Buenos_Aires")).toBe(
      "America/Argentina/Buenos_Aires",
    );
    // Node's ICU resolves these to Asia/Calcutta and Europe/Kiev; the browser's own word is kept.
    expect(readableZone("Asia/Kolkata")).toBe("Asia/Kolkata");
    expect(readableZone("Europe/Kyiv")).toBe("Europe/Kyiv");
    expect(readableZone("UTC")).toBe("UTC");
    expect(readableZone("  Europe/London  ")).toBe("Europe/London");
  });

  it("★ refuses what the runtime cannot read, and every shape the column refuses", () => {
    // An offset is a zone to `Intl` and none to the column (a letter first).
    expect(readableZone("+05:30")).toBeNull();
    expect(readableZone("-08:00")).toBeNull();
    // What a browser that knows no system zone reports, and names no runtime holds.
    expect(readableZone("Etc/Unknown")).toBeNull();
    expect(readableZone("Mars/Olympus")).toBeNull();
    expect(readableZone("America/New York")).toBeNull();
    expect(readableZone("")).toBeNull();
    expect(readableZone(`Europe/${"a".repeat(ZONE_MAX_LENGTH)}`)).toBeNull();
    expect(readableZone(null)).toBeNull();
    expect(readableZone(undefined)).toBeNull();
    expect(readableZone(42)).toBeNull();
  });
});

describe("partyZoneOf: the one fallback", () => {
  it("a party's own readable zone, else UTC for a row with none or one the runtime cannot read", () => {
    expect(PARTY_ZONE_FALLBACK).toBe("UTC");
    expect(partyZoneOf("Pacific/Auckland")).toBe("Pacific/Auckland");
    expect(partyZoneOf(null)).toBe("UTC");
    expect(partyZoneOf(undefined)).toBe("UTC");
    expect(partyZoneOf("Mars/Olympus")).toBe("UTC");
    expect(partyZoneOf("+13:00")).toBe("UTC");
  });
});

describe("sameZone: two spellings of one zone are one zone", () => {
  it("reads aliases and the runtime's legacy names as the zone they are", () => {
    expect(sameZone("Asia/Kolkata", "Asia/Calcutta")).toBe(true);
    expect(sameZone("US/Pacific", "America/Los_Angeles")).toBe(true);
    expect(sameZone("Europe/Kyiv", "Europe/Kiev")).toBe(true);
    expect(sameZone("America/Los_Angeles", "America/Denver")).toBe(false);
    // A zone the runtime cannot read is never the same as anything, itself included.
    expect(sameZone("Mars/Olympus", "Mars/Olympus")).toBe(false);
    expect(sameZone(null, "UTC")).toBe(false);
  });
});

describe("the host's own zone", () => {
  it("deviceZone is the browser's word where the runtime reads it, else null", () => {
    deviceSays("Pacific/Auckland");
    expect(deviceZone()).toBe("Pacific/Auckland");
    vi.restoreAllMocks();
    deviceSays("Etc/Unknown");
    expect(deviceZone()).toBeNull();
    vi.restoreAllMocks();
    deviceSays(undefined);
    expect(deviceZone()).toBeNull();
  });

  it("hostPartyZone: the party's own, else hers, else null (the browser's own clock)", () => {
    deviceSays("Europe/London");
    expect(hostPartyZone("America/Mexico_City")).toBe("America/Mexico_City");
    expect(hostPartyZone(null)).toBe("Europe/London");
    expect(hostPartyZone("Mars/Olympus")).toBe("Europe/London");
    vi.restoreAllMocks();
    deviceSays("Etc/Unknown");
    expect(hostPartyZone(null)).toBeNull();
  });
});

describe("the typed seam (until the generated types carry the column)", () => {
  it("zoneOfRow reads the stored text, or null", () => {
    expect(zoneOfRow({ id: "e", time_zone: "Pacific/Auckland" })).toBe(
      "Pacific/Auckland",
    );
    expect(zoneOfRow({ id: "e", time_zone: null })).toBeNull();
    expect(zoneOfRow({ id: "e" })).toBeNull();
    expect(zoneOfRow({ time_zone: 7 })).toBeNull();
    expect(zoneOfRow(null)).toBeNull();
  });

  it("withZone carries the column where there is a zone, and names no column where there is none", () => {
    expect(withZone({ name: "x" }, "Europe/London")).toEqual({
      name: "x",
      time_zone: "Europe/London",
    });
    expect(withZone({ name: "x" }, null)).toEqual({ name: "x" });
    expect("time_zone" in withZone({ name: "x" }, undefined)).toBe(false);
  });
});

describe("zonePlace: the city a host knows", () => {
  it("says the city, in its modern name", () => {
    expect(zonePlace("America/Mexico_City")).toBe("Mexico City");
    expect(zonePlace("America/Argentina/Buenos_Aires")).toBe("Buenos Aires");
    expect(zonePlace("Pacific/Auckland")).toBe("Auckland");
    expect(zonePlace("America/Port-au-Prince")).toBe("Port-au-Prince");
    // ICU's legacy canonical ids, said as the city calls itself.
    expect(zonePlace("Asia/Calcutta")).toBe("Kolkata");
    expect(zonePlace("Europe/Kiev")).toBe("Kyiv");
    expect(zonePlace("Asia/Saigon")).toBe("Ho Chi Minh");
  });

  it("says UTC as UTC, and a fixed offset with POSIX's sign turned the right way", () => {
    expect(zonePlace("UTC")).toBe("UTC");
    expect(zonePlace("Etc/UTC")).toBe("UTC");
    expect(zonePlace("Etc/GMT+5")).toBe("UTC−5");
    expect(zonePlace("Etc/GMT-14")).toBe("UTC+14");
  });
});
