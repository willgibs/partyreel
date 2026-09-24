import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The surface-paper theme contract (the mixed-theme chapter mechanism).
 * Marketing forces its themes (cinema = dark wrapper, paper pages/chapters =
 * `.surface-paper`), and the whole mechanism is three facts (two in globals.css,
 * the variant in theme.css) a well-meaning refactor could silently drop:
 *
 *  1. the light token block is aliased to `.surface-paper` (subtree re-entry
 *     to the paper theme inside `.dark`),
 *  2. the dark variant carries the `:not(.surface-paper *)` guard (shadcn
 *     `dark:` utilities must not fire inside paper subtrees; the class is
 *     deliberately NOT `.light` — next-themes puts class="light" on <html>),
 *  3. `.surface-paper` fixes color-scheme to light (native widgets).
 *
 * Plus the inverse safety: `.dark` must never be aliased the same way, and
 * PaperChapter must never carry data-mkt-skin (body:has(...) chrome keys off
 * that attribute at PAGE level; a chapter would flip the whole body).
 */

const globals = readFileSync(
  join(process.cwd(), "src/app/globals.css"),
  "utf8",
);

describe("globals.css surface-paper contract", () => {
  it("aliases the light token block to .surface-paper", () => {
    expect(globals).toMatch(/^:root,\s*\.surface-paper \{/m);
  });

  it("guards the dark variant against paper subtrees", () => {
    // The variant moved to theme.css with the @theme block (the library round,
    // 2026-09-02) so the design lab's own Tailwind entry can share it; the
    // guard is the same line.
    const theme = readFileSync(
      join(process.cwd(), "src/app/theme.css"),
      "utf8",
    );
    expect(theme).toContain(
      "@custom-variant dark (&:is(.dark *):not(.surface-paper *));",
    );
  });

  it("fixes light color-scheme on paper subtrees", () => {
    expect(globals).toMatch(/\.surface-paper \{\s*color-scheme: light;\s*\}/);
  });

  it("never aliases the dark block alongside surface-paper", () => {
    expect(globals).not.toMatch(
      /\.dark\s*,\s*\.surface-paper|\.surface-paper\s*,\s*\.dark/,
    );
  });

  it("declares the ink leaf set once, after paper, as .surface-ink", () => {
    // The always-dark slab set (the footer's nine remaps plus the three it
    // never redeclared) lives in one class since the library phase
    // (2026-09-11); it comes after every .surface-paper block so an ink leaf
    // inside a paper chapter wins the cascade at equal specificity.
    const ink = globals.indexOf("\n.surface-ink {");
    const paper = globals.lastIndexOf(".surface-paper {");
    expect(ink, "the .surface-ink block is missing").toBeGreaterThan(0);
    expect(ink, ".surface-ink must come after .surface-paper").toBeGreaterThan(
      paper,
    );
    expect(globals.match(/\.surface-ink \{/g)?.length).toBe(1);
  });
});

describe("PaperChapter", () => {
  it("never carries data-mkt-skin (page-level chrome keys off it)", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/marketing/system/paper-chapter.tsx"),
      "utf8",
    ).replace(/\/\*[\s\S]*?\*\//g, "");
    expect(source).not.toContain("data-mkt-skin");
  });
});
