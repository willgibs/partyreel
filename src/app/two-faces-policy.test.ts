import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * TWO FACES, AND ONLY TWO (bible 7, Will's ruling 2026-09-14: "kill mono
 * entirely"; the kill-mono sweep). There is no mono face in the product: no
 * `font-mono` class anywhere in src, no `--font-mono` token in the theme, no
 * mono loader in the root layout. Comments may still say the word (this file
 * does); a class string, a token line or an import may not. A bare <code>,
 * <pre>, <kbd> or <samp> still renders in a mono stack through preflight, so
 * the sweep gave those `font-sans` and the prose wrappers `prose-code:font-sans`;
 * that half is held at review (the grep cannot see an element with no class).
 */
const ROOT = process.cwd();

function filesUnder(dir: string, exts: string[]): string[] {
  return readdirSync(join(ROOT, dir), { recursive: true })
    .map(String)
    .filter((f) => exts.some((e) => f.endsWith(e)))
    .map((f) => `${dir}/${f}`);
}

const SKIP = /\.test\.tsx?$|rules\.generated\.json$/;

describe("two faces, and only two", () => {
  const sources = filesUnder("src", [".ts", ".tsx", ".css"]).filter(
    (f) => !SKIP.test(f),
  );

  it("scanned the tree", () => {
    expect(sources.length).toBeGreaterThan(500);
  });

  it("uses no font-mono class outside a comment", () => {
    const hits: string[] = [];
    for (const rel of sources) {
      const lines = readFileSync(join(ROOT, rel), "utf8").split("\n");
      lines.forEach((line, i) => {
        if (!line.includes("font-mono")) return;
        const t = line.trimStart();
        // A comment line may name the class (this policy, a why-comment); a
        // class string may not.
        if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*"))
          return;
        hits.push(`${rel}:${i + 1}`);
      });
    }
    expect(
      hits,
      "font-mono is used here; the product has no mono face",
    ).toEqual([]);
  });

  it("loads no mono face and declares no mono token", () => {
    const layout = readFileSync(join(ROOT, "src/app/layout.tsx"), "utf8");
    // A loader call or a font import, not the word in a comment.
    expect(layout).not.toMatch(
      /\b\w*Mono\s*\(|import[^;]*Mono[^;]*from\s*["']next\/font/,
    );
    const theme = readFileSync(join(ROOT, "src/app/theme.css"), "utf8");
    expect(theme).not.toMatch(/^\s*--font-mono\s*:/m);
  });
});
