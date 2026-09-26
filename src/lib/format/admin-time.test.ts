import { describe, expect, it } from "vitest";

import { formatAdminDate, formatAdminTimestamp } from "./admin-time";

/**
 * ADMIN TIMESTAMPS SAY UTC (the 1,000-row round's follow-on, 2026-09-24): the
 * jobs page's own bug report was "9/23/2026, 4:48:23 AM" read as local by an
 * operator in New York when it was 04:48 UTC. What is pinned is the shape and
 * the label, not a look: the same instant renders identically whatever the
 * runtime's own locale or zone is set to.
 */

const INSTANT = "2026-09-23T04:48:23.000Z";

describe("formatAdminTimestamp", () => {
  it("renders in UTC and says so", () => {
    expect(formatAdminTimestamp(INSTANT)).toBe("Sep 23, 2026, 04:48 UTC");
  });

  it("never prints a 24-hour midnight", () => {
    expect(formatAdminTimestamp("2026-01-01T00:05:00.000Z")).toBe(
      "Jan 1, 2026, 00:05 UTC",
    );
  });

  it("takes a Date or an epoch millisecond the same as an ISO string", () => {
    const ms = Date.parse(INSTANT);
    expect(formatAdminTimestamp(ms)).toBe(formatAdminTimestamp(INSTANT));
    expect(formatAdminTimestamp(new Date(INSTANT))).toBe(
      formatAdminTimestamp(INSTANT),
    );
  });
});

describe("formatAdminDate", () => {
  it("renders the UTC calendar day, labelled, with no time of day", () => {
    // The instant is 04:48 UTC on the 23rd; a naive server-local read (any
    // zone west of UTC) would print the 22nd instead.
    expect(formatAdminDate(INSTANT)).toBe("Sep 23, 2026 UTC");
  });
});
