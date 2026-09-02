import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * THE LEGAL PRINT SHEET (the launch-runbook round, 2026-09-02).
 *
 * /privacy and /terms are the two pages people put on paper, and printing is
 * the one surface no test tool and no screenshot ever shows you: the sheet
 * only exists inside a print dialog. So the CONTRACT is pinned instead. Both
 * halves have to hold, because either half alone is silent:
 *
 *   - the @media print block exists in globals.css and still carries each rule
 *     the sheet depends on (light room, revealed slots, breaks, link targets);
 *   - the legal shell still SETS the hooks that block selects on, so the block
 *     cannot quietly become dead CSS.
 *
 * The rendered result (margins, where a break actually lands) is a human's
 * print-to-PDF check; this is the tripwire that says the mechanism is still
 * wired.
 */

const ROOT = process.cwd();
const globals = readFileSync(join(ROOT, "src/app/globals.css"), "utf8");
const shell = readFileSync(
  join(ROOT, "src/components/marketing/legal/legal-document.tsx"),
  "utf8",
);

/** The @media print block that opens after the legal print comment, braces matched. */
function legalPrintBlock(): string {
  const marker = globals.indexOf("/* PRINT: the legal documents");
  expect(marker, "the legal print block's comment is gone").toBeGreaterThan(-1);
  const open = globals.indexOf("@media print {", marker);
  expect(
    open,
    "no @media print follows the legal print comment",
  ).toBeGreaterThan(-1);
  let depth = 0;
  for (let i = globals.indexOf("{", open); i < globals.length; i++) {
    if (globals[i] === "{") depth++;
    else if (globals[i] === "}" && --depth === 0)
      return globals.slice(open, i + 1);
  }
  throw new Error("the legal print block is unbalanced");
}

const block = legalPrintBlock();

describe("the legal print block", () => {
  it("opts in on one hook and never fires on a page without it", () => {
    expect(block).toContain("[data-print-legal]");
    // Every selector in the block is scoped to the hook, directly or through
    // body:has(): a bare `header { display: none }` in print would take the
    // header off every printed page on the site.
    const selectors = block
      .split("\n")
      .filter((line) => line.trim().endsWith("{") && !line.includes("@media"))
      .map((line) => line.trim());
    const unscoped = selectors.filter((s) => !s.includes("data-print-legal"));
    expect(unscoped, `unscoped selectors:\n${unscoped.join("\n")}`).toEqual([]);
  });

  it("prints the cinema room light", () => {
    // The dark is a token flip on the wrapper plus a body paint in
    // marketing.css, so both have to be answered.
    expect(block).toMatch(/body:has\(\[data-print-legal\]\),/);
    expect(block).toContain('[data-mkt-skin="cinema"]');
    expect(block).toContain("--background: #fff");
    expect(block).toContain("--foreground: #111");
    expect(block).toContain("--muted-foreground:");
    expect(block).toContain("color-scheme: light");
  });

  it("reveals the in-view slots (paper has no viewport)", () => {
    expect(block).toMatch(
      /\[data-mkt-reveal\]\s*\{\s*opacity: 1 !important;\s*transform: none !important;/,
    );
  });

  it("breaks pages between sections and never after a heading", () => {
    expect(block).toMatch(
      /\[data-print-legal\] > section \{\s*break-inside: avoid;/,
    );
    expect(block).toMatch(
      /\[data-print-legal\] h2,[\s\S]*?break-after: avoid;/,
    );
    expect(block).toContain("display: table-header-group");
  });

  it("spells out where every link goes", () => {
    expect(block).toContain('a[href^="/"]::after');
    expect(block).toContain('content: " (partyreel.com" attr(href) ")"');
    expect(block).toContain('a[href^="http"]::after');
    // An in-document anchor and the mailto stay bare: the target is on the
    // sheet, and the mailto's label already is the address.
    expect(block).not.toContain('a[href^="#"]::after');
    expect(block).not.toContain('a[href^="mailto:"]::after');
  });

  it("sets no @page rule (it cannot be scoped, so it would re-margin help too)", () => {
    expect(block).not.toContain("@page");
  });
});

describe("the legal shell's print hooks", () => {
  it("marks the document body with the opt-in hook", () => {
    expect(shell).toContain("data-print-legal");
  });

  it("marks the screen-only furniture with the shared hide hook", () => {
    // The chip ToC (below-lg, and a print sheet is ~816px wide), the sticky
    // rail, and the "Read next" foot: three sites, all navigation.
    expect(shell.match(/data-print-hide/g)?.length ?? 0).toBeGreaterThanOrEqual(
      3,
    );
  });

  it("prints the document's own address", () => {
    expect(shell).toContain("data-print-url");
    expect(shell).toContain("partyreel.com{meta.path}");
  });
});
