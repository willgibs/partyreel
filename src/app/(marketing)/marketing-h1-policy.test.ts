// @policy: marketing · The marketing h1 never moves
// @refuses: a reveal-hidden or animated state on a marketing h1, which delays the page's largest paint.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

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
function tsx(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return tsx(full);
    return entry.name.endsWith(".tsx") ? [full] : [];
  });
}

const ROOT = process.cwd();
const FILES = [
  ...tsx(join(ROOT, "src/app/(marketing)")),
  ...tsx(join(ROOT, "src/components/marketing")),
];

/** Every `<h1 ...>` opening tag in the file, attributes included. */
function h1Tags(code: string): string[] {
  return [...code.matchAll(/<h1\b[^>]*>/g)].map((m) => m[0]);
}

describe("the marketing h1 policy", () => {
  it("finds the site's h1s at all", () => {
    const tags = FILES.flatMap((f) => h1Tags(readFileSync(f, "utf8")));
    // Nine after the hero registers round (2026-09-11) moved the utility trio
    // and /pricing onto PageHero: the bespoke heroes, the article and role
    // headers, and PageHero's own h1.
    expect(tags.length).toBeGreaterThan(5);
  });

  it("never gates an h1 on the cut, the rise or the blur-rise", () => {
    const offenders: string[] = [];
    for (const file of FILES) {
      const code = readFileSync(file, "utf8").replace(
        /\{\/\*[\s\S]*?\*\/\}/g,
        "",
      );
      for (const tag of h1Tags(code)) {
        if (
          /data-mkt-cut|data-mkt-reveal|mkt-line|\.\.\.cut\(|\.\.\.rise\(|\.\.\.mark\(/.test(
            tag,
          )
        ) {
          offenders.push(
            `${file.replace(ROOT + "/", "")}: ${tag.slice(0, 60)}`,
          );
        }
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
