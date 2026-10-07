import { describe, expect, it } from "vitest";

import {
  INACTIVE_DAYS,
  INACTIVE_MONTHS,
  WARN_BEFORE_DAYS,
  inactivityAction,
} from "@/lib/lifecycle/inactivity";
import { filesUnder, read } from "@/testing/source-tree";

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

  it("'remove' at/after the window's threshold", () => {
    expect(inactivityAction(ageDays(INACTIVE_DAYS), now)).toBe("remove");
    expect(inactivityAction(ageDays(INACTIVE_DAYS + 60), now)).toBe("remove");
  });
});

/**
 * ★ THE IDLE WINDOW IN MONTHS IS DERIVED ONCE (crumbs-36, from crumbs-34). Every page that says the Free plan's
 * one exception ("about 24 months") used to compute `Math.round(INACTIVE_DAYS / 30)` for itself: seven copies (the
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
    const ROOT = "src";
    const OWN_HOME = "lib/lifecycle/inactivity.ts";
    // Any division of the day count by a literal is a unit conversion of the window (months, weeks): its home is
    // here. A product (`INACTIVE_DAYS * 86_400_000`) is the sweep's time arithmetic, not a way of saying it.
    const CONVERSION = /INACTIVE_DAYS\s*\/\s*\d/;
    const found: string[] = [];
    for (const path of filesUnder(ROOT)) {
      if (
        /\.tsx?$/.test(path) &&
        !/\.test\.tsx?$/.test(path) &&
        !path.endsWith(OWN_HOME)
      ) {
        for (const [i, line] of read(path).split("\n").entries()) {
          if (/^\s*(?:\*|\/\/)/.test(line)) continue;
          if (CONVERSION.test(line))
            found.push(`${path.slice(ROOT.length)}:${i + 1}: ${line.trim()}`);
        }
      }
    }
    expect(found).toEqual([]);
  });
});

/**
 * ★ NO SURFACE STATES THE WINDOW IN WORDS OF ITS OWN (crumbs-92, K5). `INACTIVE_MONTHS` is the pages' one derivation,
 * but a line that types "six months" beside "untouched" is a copy the derivation never sees: the pricing FAQ, the
 * warning mail and the operator's jobs line each did, and each went on saying the old window after the sweep's
 * moved. A product line (not a comment, not a test) that pairs a figure of months or years with the idle words is
 * refused; the figure comes from the constants (`${INACTIVE_MONTHS} months`), which this scan strips first.
 */
describe("the window is stated only through the constants", () => {
  const FIGURE = new RegExp(
    "\\b(?:\\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|eighteen|twenty[- ]four)[ -](?:months?|years?)\\b",
    "i",
  );
  const IDLE =
    /\binactiv(?:e|ity)\b|untouched|nobody touches|no activity|without activity|goes unused/i;

  it("★ no product line pairs a figure of months or years with the idle words", () => {
    const found: string[] = [];
    for (const path of [
      ...filesUnder("src").filter(
        (p) => /\.tsx?$/.test(p) && !/\.test\.tsx?$/.test(p),
      ),
      ...filesUnder("content").filter((p) => /\.mdx$/.test(p)),
    ]) {
      for (const [i, line] of read(path).split("\n").entries()) {
        if (/^\s*(?:\*|\/\/|\/\*|\{\/\*)/.test(line)) continue;
        // The constants' own placeholders are the right way to say it, and a trailing comment is not a surface.
        const bare = line.replace(/\$\{[^}]*\}/g, "").replace(/\s\/\/.*$/, "");
        if (IDLE.test(bare) && FIGURE.test(bare))
          found.push(`${path}:${i + 1}: ${line.trim().slice(0, 140)}`);
      }
    }
    expect(found).toEqual([]);
  });
});

/**
 * ★ THE TERMS AND THE PRIVACY POLICY STATE NO FIGURE FOR THE IDLE REMOVAL (Will, K5, 2026-10-07: "Legal terms
 * should not bind us to this"; the PRD's legal-text principle: never a number that would box out a later choice).
 * Not the window, in any unit, and not the warning's lead, which is the same tunable policy. The two documents'
 * other figures (the 30-day bin, the 45-day grace, a pass's year, the liability look-back) are other promises.
 */
describe("the legal texts", () => {
  const TERMS = "src/lib/constants/legal-terms.tsx";
  const PRIVACY = "src/lib/constants/legal-privacy.tsx";
  /** The text between two markers, whitespace-flattened (JSX wraps at the formatter's width: the words are the contract). */
  const excerpt = (path: string, from: string, to: string) => {
    const flat = read(path).replace(/\s+/g, " ");
    const a = flat.indexOf(from);
    expect(a, `${path} lost "${from}"`).toBeGreaterThan(-1);
    const b = flat.indexOf(to, a + from.length);
    expect(b, `${path}: no "${to}" after "${from}"`).toBeGreaterThan(-1);
    return flat.slice(a, b + to.length);
  };
  // Where the idle removal is told: the Terms' summary line and paragraph, the Privacy table's row.
  const TOLD = [
    [
      "the Terms' summary",
      // The summary's last clause: the 30-day bin and the 45-day grace before it are other promises.
      () => excerpt(TERMS, "and a free event left idle", '",'),
    ],
    [
      "the Terms' paragraph",
      () => excerpt(TERMS, "Inactive free events.", "</>"),
    ],
    [
      "the Privacy Policy's row",
      () =>
        excerpt(PRIVACY, '"Events on free accounts with no activity"', '",'),
    ],
  ] as const;
  // The bin's own promise shares the paragraph; every other digit, or a counted span, would be the idle policy's.
  const COUNTED =
    /\d|\b(?:two|three|four|six|twelve|eighteen|twenty[- ]four)[ -](?:day|week|month|year)s?\b/i;

  it.each(TOLD)("%s names no window and no warning lead", (_where, text) => {
    expect(text().replace(/\b30-day\b/g, "")).not.toMatch(COUNTED);
  });

  it("★ and neither document carries the window's figure anywhere (in days or in months)", () => {
    for (const path of [TERMS, PRIVACY]) {
      const prose = read(path)
        .split("\n")
        .filter((line) => !/^\s*(?:\*|\/\/|\/\*)/.test(line))
        .join("\n");
      expect(prose, path).not.toMatch(
        new RegExp(`\\b${INACTIVE_DAYS}[ -]days?\\b`, "i"),
      );
      expect(prose, path).not.toMatch(
        new RegExp(`\\b${INACTIVE_MONTHS}[ -]months?\\b`, "i"),
      );
    }
  });

  it("still says what happens to an idle free event, in words that carry no figure", () => {
    const flat = (path: string) => read(path).replace(/\s+/g, " ");
    expect(flat(TERMS)).toContain("a long period with no activity");
    expect(flat(PRIVACY)).toContain("a long period without activity");
  });
});
