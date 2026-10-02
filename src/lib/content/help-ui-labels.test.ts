import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { getAllArticles } from "./help";

/**
 * The mock-fidelity rule, enforced (the help-catalog round, 2026-09-01):
 * every string an article quotes inside <UiLabel> must exist somewhere in the
 * shipped app source, so a reader who opens the product recognizes every
 * control the help center named. Whitespace is collapsed on both sides and
 * MDX entities are decoded, so a label that wraps in JSX still matches.
 *
 * Scope: every .ts/.tsx under src/ EXCEPT tests, the help pages (which would
 * match their own rendering), the MDX components (which quote nothing), and the
 * lab (`src/app/(dev)/` and its kit, `src/components/lab/`). ★ THE LAB IS NOT
 * THE PRODUCT (crumbs-49): a board quotes the very strings it proposes to
 * retire, so a stale label that only a board still quotes would pass while no
 * control a reader meets says it (help-center's old stub hid "Tap to retry" in
 * two articles that way).
 */
const SKIP =
  /\.test\.tsx?$|\/help\/|mdx-components\.tsx$|\/mdx\/spec-[a-z]+\.tsx$|\/app\/\(dev\)\/|\/components\/lab\//;

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.tsx?$/.test(entry.name) && !SKIP.test(full) ? [full] : [];
  });
}

function normalize(text: string): string {
  return (
    text
      // JSX's explicit space token and the typographic apostrophe both read as
      // their plain forms on screen, so both sides compare in plain form.
      .replace(/\{" "\}/g, " ")
      .replace(/’/g, "'")
      .replace(/&rsquo;|&#39;|&apos;/g, "'")
      .replace(/&ldquo;|&rdquo;|&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&hellip;/g, "…")
      .replace(/\s+/g, " ")
      .trim()
  );
}

describe("the scan reads the product's source and not the lab's", () => {
  // By path, so it holds whatever the repo contains today: a board's file or
  // the lab kit's is out, a guest page, a shared component and a lib are in.
  it.each([
    "/r/src/app/(dev)/design/sandbox/locked-door/board.tsx",
    "/r/src/app/(dev)/design/(shell)/library/patterns/gallery-demos.tsx",
    "/r/src/components/lab/step.tsx",
    "/r/src/components/guest/door/doors.test.tsx",
    "/r/src/components/marketing/help/checklist.tsx",
  ])("skips %s", (path) => {
    expect(SKIP.test(path)).toBe(true);
  });

  it.each([
    "/r/src/components/guest/door/welcome.tsx",
    "/r/src/app/(guest)/e/[token]/page.tsx",
    "/r/src/components/shared/not-found-screen.tsx",
    "/r/src/lib/guest/entry-steps.ts",
  ])("reads %s", (path) => {
    expect(SKIP.test(path)).toBe(false);
  });
});

describe("every <UiLabel> quotes a shipped app string", () => {
  const files = walk(join(process.cwd(), "src"));
  // Pinned for non-emptiness (the policy-test lesson): an empty walk would
  // make every label "missing" or, worse, every label pass.
  expect(files.length).toBeGreaterThan(300);
  expect(files.filter((f) => /\(dev\)|\/components\/lab\//.test(f))).toEqual(
    [],
  );
  const raw = files.map((file) => readFileSync(file, "utf8")).join("\n");
  // Two views of the same source. The RAW view keeps attributes, because many
  // labels live in aria-label/title props. The TEXT view drops tags, because a
  // label that spans a wrapper element ("Reason <span>(optional)</span>") is
  // one string on screen. A label may match either.
  const corpus = normalize(raw);
  const corpusText = corpus.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

  const articles = getAllArticles();
  expect(articles.length).toBeGreaterThan(0);

  for (const article of articles) {
    const labels = [
      ...article.body.matchAll(/<UiLabel>([\s\S]*?)<\/UiLabel>/g),
    ].map((m) => normalize(m[1]));
    if (labels.length === 0) continue;
    it(`${article.slug}: ${labels.length} labels`, () => {
      for (const label of labels) {
        expect(
          label.length,
          `empty UiLabel in ${article.slug}`,
        ).toBeGreaterThan(0);
        expect(
          corpus.includes(label) || corpusText.includes(label),
          `"${label}" (in ${article.slug}) is not a shipped app string`,
        ).toBe(true);
      }
    });
  }
});
