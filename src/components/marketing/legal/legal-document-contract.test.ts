// @contract-for: src/components/marketing/legal/legal-document.tsx
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * SOURCE-TEXT PINS for the legal shell (the footer-contract.test.ts pattern).
 * Each guards something that fails silently: a rail that stops tracking, a
 * heading a deep link can no longer clear. The shell's look (the hero scale,
 * the retired mono status line, no `dark:` utilities) was pinned here until
 * the "less is more" reset (2026-09-12); a contract never freezes a look.
 */
const read = (rel: string) =>
  readFileSync(join(process.cwd(), rel), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

const shell = read("src/components/marketing/legal/legal-document.tsx");
const blocks = read("src/components/marketing/legal/legal-blocks.tsx");

describe("the legal document shell contract", () => {
  it("runs the shared reading spine and anchors", () => {
    expect(shell).toContain("ArticleToc");
    expect(shell).toContain("progress={{ targetId: ARTICLE_BODY_ID }}");
    expect(shell).toContain("HeadingAnchorsDelegate");
    expect(shell).toContain("ChipToc");
    expect(shell).toContain("HEADING_SCROLL_MT");
    expect(blocks).toContain("HEADING_SCROLL_MT");
  });

  it("the rail can stretch and can scroll", () => {
    // items-start would collapse the rail to content height (sticky gets no
    // runway); a 22-entry list needs its own overflow under the offset.
    expect(shell).toContain("lg:self-stretch");
    expect(shell).toContain("overflow-y-auto");
  });

  it("the meta card is not a <header> (ArticleToc measures the first header)", () => {
    expect(shell).not.toMatch(/<header[\s>]/);
  });
});
