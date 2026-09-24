// @contract-for: src/lib/format/date-in-zone.ts
import { describe, expect, it } from "vitest";

import { formatDateInZone } from "./date-in-zone";

/**
 * A DATE IN AN EXPLICIT ZONE. What is pinned: the SAME instant reads as a
 * different calendar day depending on the zone it is asked in, which is the
 * whole reason a bare `toLocaleDateString()` (the server's zone, silently)
 * was wrong for anyone not standing in that zone.
 */

// 02:00 UTC on the 24th is still the evening of the 23rd on the US west coast.
const LATE_UTC = "2026-09-24T02:00:00.000Z";

describe("formatDateInZone", () => {
  it("renders the day as it falls in the given zone", () => {
    expect(formatDateInZone(LATE_UTC, "UTC")).toBe("September 24, 2026");
    expect(formatDateInZone(LATE_UTC, "America/Los_Angeles")).toBe(
      "September 23, 2026",
    );
  });

  it("takes a Date the same as an ISO string", () => {
    expect(formatDateInZone(new Date(LATE_UTC), "UTC")).toBe(
      formatDateInZone(LATE_UTC, "UTC"),
    );
  });
});
