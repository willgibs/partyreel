import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  INACTIVE_DAYS,
  INACTIVE_MONTHS,
  WARN_BEFORE_DAYS,
  inactivityAction,
} from "@/lib/lifecycle/inactivity";

const DAY = 86_400_000;
const now = Date.UTC(2026, 0, 1);
const ageDays = (d: number) => now - d * DAY;

describe("inactivityAction", () => {
  it("'none' while recently active", () => {
    expect(inactivityAction(now, now)).toBe("none");
    expect(inactivityAction(ageDays(10), now)).toBe("none");
    expect(
      inactivityAction(ageDays(INACTIVE_DAYS - WARN_BEFORE_DAYS - 1), now),
    ).toBe("none");
  });

  it("'warn' inside the warning window before the deadline", () => {
    expect(
      inactivityAction(ageDays(INACTIVE_DAYS - WARN_BEFORE_DAYS), now),
    ).toBe("warn");
    expect(inactivityAction(ageDays(INACTIVE_DAYS - 1), now)).toBe("warn");
  });

  it("'remove' at/after the 6-month threshold", () => {
    expect(inactivityAction(ageDays(INACTIVE_DAYS), now)).toBe("remove");
    expect(inactivityAction(ageDays(INACTIVE_DAYS + 60), now)).toBe("remove");
  });
});

/**
 * ★ THE IDLE WINDOW IN MONTHS IS DERIVED ONCE (crumbs-36, from crumbs-34). Every page that says the Free plan's
 * one exception ("about 6 months") used to compute `Math.round(INACTIVE_DAYS / 30)` for itself: seven copies (the
 * home FAQ, the JSON-LD, the help's `<InactivityMonths />`, the album page, the privacy page, the llms files and
 * the event pages), so a retune of the day count meant seven edits, and a copy edited alone was a page contradicting
 * the sweep. The months are `INACTIVE_MONTHS`'s, beside the days they come from.
 */
describe("INACTIVE_MONTHS", () => {
  it("is the day count in the months the pages say it in", () => {
    expect(INACTIVE_MONTHS).toBe(Math.round(INACTIVE_DAYS / 30));
    expect(Number.isInteger(INACTIVE_MONTHS)).toBe(true);
  });

  it("★ is the only derivation: no source file converts the day count to months itself", () => {
    // The product's own source: a test file may name the arithmetic it pins, and this module is where it lives.
    const ROOT = join(__dirname, "..", "..");
    const OWN_HOME = join("lib", "lifecycle", "inactivity.ts");
    // Any division of the day count by a literal is a unit conversion of the window (months, weeks): its home is
    // here. A product (`INACTIVE_DAYS * 86_400_000`) is the sweep's time arithmetic, not a way of saying it.
    const CONVERSION = /INACTIVE_DAYS\s*\/\s*\d/;
    const found: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) walk(path);
        else if (
          /\.tsx?$/.test(entry.name) &&
          !/\.test\.tsx?$/.test(entry.name) &&
          !path.endsWith(OWN_HOME)
        ) {
          for (const [i, line] of readFileSync(path, "utf8")
            .split("\n")
            .entries()) {
            if (/^\s*(?:\*|\/\/)/.test(line)) continue;
            if (CONVERSION.test(line))
              found.push(`${path.slice(ROOT.length)}:${i + 1}: ${line.trim()}`);
          }
        }
      }
    };
    walk(ROOT);
    expect(found).toEqual([]);
  });
});
