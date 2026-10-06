/**
 * THE PARTY'S CITY, FOUND BY NAME (`zone-places.ts`): the list is cities, never `Etc` or a legacy alias; each says the city
 * a host knows; the other names attach whatever spelling the browser lists a zone under; and the search puts the city
 * she typed first, finds a country or a destination, and ignores case and accents.
 */
import { describe, expect, it } from "vitest";

import { findPlaces, searchable, zonePlaces } from "@/lib/event/zone-places";

const RUNTIME = Intl.supportedValuesOf("timeZone");

describe("zonePlaces: cities, said as a host knows them", () => {
  it("keeps every city of an IANA area and nothing else", () => {
    const places = zonePlaces([
      "America/Mexico_City",
      "Etc/GMT+5",
      "UTC",
      "EST5EDT",
      "US/Pacific",
      "America/Argentina/Buenos_Aires",
      "Mars/Olympus",
    ]);
    expect(places.map((p) => p.zone)).toEqual([
      "America/Argentina/Buenos_Aires",
      "America/Mexico_City",
    ]);
    expect(places[0]).toMatchObject({
      city: "Buenos Aires",
      region: "Argentina",
    });
    expect(places[1]).toMatchObject({
      city: "Mexico City",
      region: "Americas",
    });
  });

  it("★ attaches a country's name whatever spelling the browser lists its zone under", () => {
    // ICU's canonical names, as Chrome lists them: India's zone is Asia/Calcutta there.
    const [calcutta] = zonePlaces(["Asia/Calcutta"]);
    expect(calcutta?.city).toBe("Kolkata");
    expect(calcutta?.also).toContain("India");
    const [kolkata] = zonePlaces(["Asia/Kolkata"]);
    expect(kolkata?.also).toContain("India");
  });

  it("builds from this runtime's own list: hundreds of cities, every one with a city's name", () => {
    const places = zonePlaces(RUNTIME);
    expect(places.length).toBeGreaterThan(300);
    for (const p of places) expect(p.city, p.zone).not.toMatch(/[_/]/);
  });
});

describe("findPlaces: what she typed, best first", () => {
  const places = zonePlaces(RUNTIME);
  const cities = (q: string) => findPlaces(places, q).map((p) => p.city);

  it("★ finds a destination by the name a host knows it by", () => {
    expect(cities("Bali")[0]).toBe("Makassar");
    expect(cities("Tuscany")[0]).toBe("Rome");
    expect(cities("cabo")[0]).toBe("Mazatlan");
    expect(cities("Hawaii")[0]).toBe("Honolulu");
    expect(cities("India")[0]).toBe("Kolkata");
  });

  it("puts the city she typed before a place that is merely called something like it", () => {
    expect(cities("Mexico")[0]).toBe("Mexico City");
    expect(cities("lon")[0]).toBe("London");
    expect(cities("new y")[0]).toBe("New York");
  });

  it("ignores case, accents and punctuation; finds nothing for nothing", () => {
    expect(searchable("  Zürich, Switzerland ")).toBe("zurich switzerland");
    expect(cities("TÜRKIYE")[0]).toBe("Istanbul");
    expect(findPlaces(places, "   ")).toEqual([]);
    expect(findPlaces(places, "Atlantis Prime")).toEqual([]);
  });

  it("answers at most eight", () => {
    expect(findPlaces(places, "a").length).toBeLessThanOrEqual(8);
    expect(findPlaces(places, "a", 3)).toHaveLength(3);
  });
});
