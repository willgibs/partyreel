import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * THE MATRIX'S PLAN HEAD FOLLOWS THE HEADER (build 38's red-team, LOW: "when the header hides on scroll, the matrix's
 * sticky plan head stays 64 px down, so rows scroll visibly through the band above it").
 *
 * The site header LEAVES while the reader scrolls away and keeps `--mkt-header-h` (4rem) so its fourteen consumers
 * stay put (header-shell.tsx); the head's sticky offset is one of them, so a head resting 4rem down meant a 4rem band
 * of rows above it whenever the header was out of the way. The head now takes the top of the screen at that moment and
 * goes back under the header when it returns, on the header's own arrival clock.
 *
 * It is a SOURCE pin, as the header's own contract is (header-shell-contract.test.tsx): jsdom has no cascade, so what
 * can be held here is that the head's rule IS the header's hide rule, escapes and all. The header stays when something
 * inside it has focus, when a nav panel is open and when the phone sheet is open, and a head that followed only
 * `data-hidden` would sit under a header that had not left. The pixels are read in a real browser (the lane's
 * Handoff): the head's top at 64 with the header shown and at 0 with it hidden, at 1024 and at 1440.
 */
const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");
const table = read(
  "src/components/marketing/sections/pricing/comparison-table.tsx",
);
const shell = read("src/components/marketing/chrome/header-shell.tsx");

/** What the header must be, to be out of the way: its hide rule's condition, as header-shell.tsx spells it. */
const hidden = shell.match(
  /\[&(\[data-hidden\][^"]*)\]:-translate-y-full/,
)?.[1];

describe("the plan head takes the top of the screen when the header leaves it", () => {
  it("reads the header's own hide rule, escapes included", () => {
    expect(hidden).toBeTruthy();
    expect(hidden).toContain(":not(:focus-within)");
    expect(hidden).toContain(
      ":not(:has([data-slot=navigation-menu-trigger][data-state=open]))",
    );
    expect(hidden).toContain(
      ":not(:has([data-slot=sheet-trigger][data-state=open]))",
    );
  });

  it("★ follows exactly that condition, from lg up where the head sticks", () => {
    // `header ~ *` reaches the page's `main` (the header's later sibling, which holds the matrix), and the condition
    // is the header's own, so the two can never disagree about who is out of the way.
    expect(table).toContain(`lg:[header${hidden}_~_*_&]:top-0`);
  });

  it("rests under the header the rest of the time, on the one height knob", () => {
    expect(table).toContain("lg:top-[var(--mkt-header-h)]");
    // The header's arrival is the head's clock both ways (the head never trails a bar that is coming back, and when
    // the bar leaves the head is ahead of it, under the bar's own glass, never leaving a gap).
    expect(table).toContain("lg:motion-safe:transition-[top]");
    expect(table).toContain("lg:motion-safe:duration-150");
    expect(table).toContain("lg:motion-safe:ease-emphasis");
  });

  it("is one rule on every head cell: the label's and each plan's", () => {
    // `lg:sticky` is spelled once, in the constant every head cell wears, so the cells can never differ.
    expect(table.match(/lg:sticky/g)).toHaveLength(1);
    expect(table.match(/\bSTICKY_HEAD\b/g)!.length).toBeGreaterThanOrEqual(3);
  });
});
