import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * THE CHROME DRAWS ITS DOOR TO THE HOME ONCE, THROUGH `HomeLink` (crumbs-50).
 *
 * The wordmark is in view from the first paint, so a plain `<Link href="/">` prefetched the home into every
 * other page and React preloaded its three sheets from the payload and drew none (three "preloaded but not
 * used" warnings a load, and about 73 KB over 11 requests; `chrome-link.tsx` says why and
 * `chrome-link.test.tsx` holds the prop). The header's, the footer's and the phone menu's wordmarks are three
 * sites of one decision, so it lives in one component, and a fourth drawn with a plain link would quietly
 * bring the warnings back to whichever page it sits on: the chrome's sources are read for a link to `/` that
 * is not a `HomeLink`. Pinned for non-emptiness: a scan that finds no wordmark is a broken scan, not a clean
 * chrome.
 */
const DIR = join(process.cwd(), "src/components/marketing/chrome");

const FILES = readdirSync(DIR).filter(
  (name) =>
    name.endsWith(".tsx") &&
    !name.endsWith(".test.tsx") &&
    name !== "chrome-link.tsx",
);

const read = (name: string) =>
  readFileSync(join(DIR, name), "utf8").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

describe("the chrome's door to the home", () => {
  it("finds the wordmarks at all", () => {
    expect(
      FILES.filter((name) => /<HomeLink\b/.test(read(name))).sort(),
    ).toEqual([
      "marketing-footer.tsx",
      "marketing-header.tsx",
      "mobile-menu.tsx",
    ]);
  });

  it("★ is never a plain link, which would prefetch the home on sight", () => {
    const plain = FILES.flatMap((name) =>
      [
        ...read(name).matchAll(/<(?:Link|ChromeLink)\b[^>]*\bhref="\/"[^>]*>/g),
      ].map((m) => `${name}: ${m[0].replace(/\s+/g, " ")}`),
    );
    expect(
      plain,
      "a link to the home that prefetches on sight preloads sheets no other page draws: draw a HomeLink",
    ).toEqual([]);
  });
});
