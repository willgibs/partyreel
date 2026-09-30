import { describe, expect, it } from "vitest";

import { formatBytes } from "@/lib/utils";

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
