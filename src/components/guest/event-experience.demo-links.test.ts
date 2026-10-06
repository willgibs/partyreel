import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * THE DEMO'S DOORS TO THE HOME PREFETCH ON INTENT, NEVER ON SIGHT (guest-requests).
 *
 * The demo album draws "Start your own" four times, each a link to the marketing home: the welcome door's
 * (`door/welcome.tsx`), the cover row's and the closing card's (`event-experience.tsx`), and the turn card's after a
 * visitor's upload (`guest-upload.tsx`). Drawn as plain `next/link`, the ones in view at the first paint prefetched the
 * home on sight: six requests a load (the home's route tree, head and four segments) and the home's three sheets,
 * which React preloads from the payload and the album never draws, on every demo load, for a press only some visitors
 * make (measured on `next start` at 390 and 1440, guest-requests). Drawn through the chrome's `ChromeLink` with
 * `prefetchOnIntent`, the home is fetched when a pointer arrives, a finger touches down or focus lands, and not before
 * (`chrome-link.tsx` says why, and `chrome-link.test.tsx` holds the prop itself; the welcome's and the turn card's own
 * tests hold it through the button that draws them).
 *
 * The sources are read for a link to `/` that is not one: a fifth drawn with a plain link would quietly bring the six
 * requests back to every demo load. Pinned for non-emptiness: a scan that finds no door is a broken scan, not a clean
 * page.
 */
const GUEST = join(process.cwd(), "src/components/guest");
const FILES = ["event-experience.tsx", "door/welcome.tsx", "guest-upload.tsx"];

/** A file's source with its comments left out (block, JSX and line), so a comment can never stand in for a link. */
const read = (name: string) =>
  readFileSync(join(GUEST, name), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

/** Every opening tag of a link to the home, by file, as written (whitespace collapsed). */
function homeLinks(): string[] {
  return FILES.flatMap((name) =>
    [...read(name).matchAll(/<(Link|ChromeLink)\b[^>]*\bhref="\/"[^>]*>/g)].map(
      (m) => `${name}: ${m[0].replace(/\s+/g, " ")}`,
    ),
  );
}

describe("the demo's doors to the home", () => {
  it("finds all four", () => {
    expect(homeLinks()).toHaveLength(4);
  });

  it("★ each is a ChromeLink that prefetches on intent, never a plain link that prefetches the home on sight", () => {
    const plain = homeLinks().filter(
      (tag) => !/<ChromeLink\b[^>]*\bprefetchOnIntent\b/.test(tag),
    );
    expect(
      plain,
      "a link to the home in view at the first paint prefetches it on sight: draw it through ChromeLink with prefetchOnIntent",
    ).toEqual([]);
  });
});
