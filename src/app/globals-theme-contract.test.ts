import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The surface-paper theme contract (the mixed-theme chapter mechanism).
 * Marketing forces its themes (cinema = dark wrapper, paper pages/chapters =
 * `.surface-paper`), and the whole mechanism is three globals.css facts a
 * well-meaning refactor could silently drop:
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
    expect(globals).toContain(
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
});

describe("PaperChapter doctrine", () => {
  it("never carries data-mkt-skin (page-level chrome keys off it)", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/marketing/system/paper-chapter.tsx"),
      "utf8",
    ).replace(/\/\*[\s\S]*?\*\//g, "");
    expect(source).not.toContain("data-mkt-skin");
  });
});
