import { describe, expect, it } from "vitest";

import { filesUnder, read } from "@/testing/source-tree";

/**
 * THE H1 NEVER MOVES (the LCP rule, made mechanical at the feature-pages
 * round, 2026-09-01). A marketing h1 is the page's LCP element on a type-led
 * hero; a reveal-hidden state on it delays the largest paint for nothing and,
 * on the six-page feature family, read as a flash after hydration. PageHero
 * cannot mark its h1 by construction; this scan holds the same line for every
 * hand-rolled hero in the marketing tree, so the bug the sweep closed on
 * /features/album cannot come back one page at a time.
 *
 * The blur-rise trio carried the same hole as a CLASS (`.mkt-line` rests at
 * opacity 0) until the hero registers round (2026-09-11) moved the trio onto
 * PageHero's blur entrance; the scan refuses that form too.
 *
 * ★ Pinned for non-emptiness (the round-0 rule): a scan that finds no h1 is a
 * broken scan, not a clean site.
 */
const tsx = (dir: string) => filesUnder(dir).filter((f) => f.endsWith(".tsx"));

const FILES = [
  ...tsx("src/app/(marketing)"),
  ...tsx("src/components/marketing"),
];

/** Every `<h1 ...>` opening tag in the file, attributes included. */
function h1Tags(code: string): string[] {
  return [...code.matchAll(/<h1\b[^>]*>/g)].map((m) => m[0]);
}

describe("the marketing h1 policy", () => {
  it("finds the site's h1s at all", () => {
    const tags = FILES.flatMap((f) => h1Tags(read(f)));
    // Nine after the hero registers round (2026-09-11) moved the utility trio
    // and /pricing onto PageHero: the bespoke heroes, the article and role
    // headers, and PageHero's own h1.
    expect(tags.length).toBeGreaterThan(5);
  });

  it("never gates an h1 on the cut, the rise or the blur-rise", () => {
    const offenders: string[] = [];
    for (const file of FILES) {
      const code = read(file).replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
      for (const tag of h1Tags(code)) {
        if (
          /data-mkt-cut|data-mkt-reveal|mkt-line|\.\.\.cut\(|\.\.\.rise\(|\.\.\.mark\(/.test(
            tag,
          )
        ) {
          offenders.push(`${file}: ${tag.slice(0, 60)}`);
        }
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
