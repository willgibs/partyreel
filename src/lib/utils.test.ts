import { afterEach, describe, expect, it, vi } from "vitest";

import { runAsGermanRuntime } from "@/lib/test-utils/german-runtime";
import { formatBytes, formatEventDate, formatMonthYear } from "@/lib/utils";
import { filesUnder, read } from "@/testing/source-tree";

const MB = 1024 ** 2;
const GB = 1024 ** 3;
const TB = 1024 ** 4;

/**
 * A SIZE IS READ OFF THE NUMBER IT PRINTS (crumbs-28). `formatBytes` decided its ".0" on the value before rounding,
 * so a size just under 41 GB printed "41.0 GB" (the storage list's event chips and rows showed it, from
 * `storage-wiring`), and a size just under a unit's edge printed "1024.0 MB". The storage guard's `formatBytesUp`
 * already tested after rounding; the two are one ladder now, rounded to nearest here and up there.
 */
describe("formatBytes", () => {
  it("★ prints a value that rounds to a whole number whole", () => {
    expect(formatBytes(40.99 * GB)).toBe("41 GB");
    expect(formatBytes(40.96 * GB)).toBe("41 GB");
    expect(formatBytes(9.97 * MB)).toBe("10 MB");
  });

  it("★ carries a value that rounds up to 1,024 of a unit into the next one", () => {
    expect(formatBytes(GB - 1)).toBe("1 GB");
    expect(formatBytes(1023.97 * MB)).toBe("1 GB");
    expect(formatBytes(TB - MB)).toBe("1 TB");
  });

  it("keeps a tenth where the tenth is there", () => {
    expect(formatBytes(4.3 * MB)).toBe("4.3 MB");
    expect(formatBytes(40.94 * GB)).toBe("40.9 GB");
    expect(formatBytes(1023.9 * MB)).toBe("1023.9 MB");
  });

  it("prints an exact value exactly", () => {
    expect(formatBytes(500 * GB)).toBe("500 GB");
    expect(formatBytes(2 * TB)).toBe("2 TB");
    expect(formatBytes(100 * MB)).toBe("100 MB");
    expect(formatBytes(1)).toBe("1 B");
  });

  it("says nothing for nothing", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(-5)).toBe("0 B");
  });

  it("holds more digits when asked, rounding before it reads them", () => {
    expect(formatBytes(1.5 * GB, 2)).toBe("1.50 GB");
    expect(formatBytes(40.999 * GB, 2)).toBe("41 GB");
  });

  it("rounds UP when asked, the storage guard's instruction, on the same ladder", () => {
    expect(formatBytes(40.04 * GB, 1, "up")).toBe("40.1 GB");
    expect(formatBytes(140 * GB, 1, "up")).toBe("140 GB");
    // Up past a unit's edge is one of the next, and still enough.
    expect(formatBytes(1023.95 * MB, 1, "up")).toBe("1 GB");
  });
});

/**
 * ★ ONE PINNED DATE FORMAT (crumbs-33, from `hardening`). A date printed in the RUNTIME's locale reads one way on the
 * server and another in a browser that is not en-US, which is a hydration mismatch, and a server page prints
 * whatever its runtime's locale is. Another runtime is simulated here the only way a test can be: every formatting
 * call that names no locale is answered in German (`runAsGermanRuntime`, the one simulation the count tests share),
 * and the process's zone is moved west of UTC. A pinned formatter reads the same through both.
 */
describe("the pinned dates", () => {
  const ORIGINAL_TZ = process.env.TZ;

  afterEach(() => {
    vi.restoreAllMocks();
    if (ORIGINAL_TZ === undefined) delete process.env.TZ;
    else process.env.TZ = ORIGINAL_TZ;
  });

  it("★ prints an event's day in en-US, byte for byte what it always printed, whatever the runtime's locale", () => {
    runAsGermanRuntime();
    expect(formatEventDate("2026-06-01")).toBe("June 1, 2026");
    expect(formatEventDate("2026-12-31")).toBe("December 31, 2026");
  });

  it("★ prints an event's own day in every zone a page renders in", () => {
    for (const zone of [
      "Pacific/Honolulu",
      "America/New_York",
      "UTC",
      "Asia/Tokyo",
      "Pacific/Kiritimati",
    ]) {
      process.env.TZ = zone;
      expect(formatEventDate("2026-06-01"), zone).toBe("June 1, 2026");
      expect(formatEventDate("2027-01-01"), zone).toBe("January 1, 2027");
    }
  });

  it("★ prints a month and year in en-US, read in UTC, whatever the runtime", () => {
    runAsGermanRuntime();
    process.env.TZ = "America/Los_Angeles";
    expect(formatMonthYear("2026-09-14T12:00:00Z")).toBe("September 2026");
    // Two in the morning in UTC on the first is still the last evening of September in Los Angeles.
    expect(formatMonthYear("2026-10-01T02:00:00Z")).toBe("October 2026");
    expect(formatMonthYear(new Date("2026-10-01T02:00:00Z"))).toBe(
      "October 2026",
    );
  });

  it("★ no product page prints a date in the runtime's locale", () => {
    // The scan reads the product's own source: the dev routes (the lab and the Library) are not the product, and a
    // test file may name the calls it pins. A date's own calls only: `toLocaleString()` is a number's too, so a
    // count is `formatCount`'s to answer, and reading the runtime's ZONE (`resolvedOptions()`, the viewer's day)
    // formats nothing.
    const ROOT = "src";
    const SKIP = /\/\(dev\)\/|\.test\.tsx?$/;
    const RUNTIME_LOCALE =
      /\.toLocale(?:Date|Time)String\(\s*(?:undefined\b|\))|Intl\.DateTimeFormat\(\s*(?:undefined\b|\)(?!\.resolvedOptions\(\)))/;
    const found: string[] = [];
    for (const path of filesUnder(ROOT)) {
      if (/\.tsx?$/.test(path) && !SKIP.test(path)) {
        const source = read(path);
        for (const [i, line] of source.split("\n").entries()) {
          if (/^\s*(?:\*|\/\/)/.test(line)) continue;
          if (RUNTIME_LOCALE.test(line))
            found.push(`${path.slice(ROOT.length)}:${i + 1}: ${line.trim()}`);
        }
      }
    }
    expect(found).toEqual([]);
  });
});
