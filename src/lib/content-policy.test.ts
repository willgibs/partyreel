import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

// Content-policy guard for the marketing/reading surfaces (Track B, B3). Two halves:
//
//   1. The em-dash walk over `content/**/*.mdx`. The AST guard
//      (no-em-dash-policy.test.ts) only parses TypeScript under src/, so MDX prose
//      (and frontmatter, which renders as descriptions/meta) was uncovered. MDX is
//      plain text to us here - a whole-file line scan is the right tool, and unlike
//      the AST guard there are no comments to exempt (MDX comments are rare and
//      user-invisible either way; keeping the scan total keeps it simple).
//
//   2. The claims scan: the T2.5 hard "must not claim" fence (docs/decisions/
//      t2p5-marketing-ia.md) bans fabricated social proof (Stripe is in TEST mode:
//      no "trusted by", no user/host counts, no testimonials), CSAM/NCMEC/
//      law-enforcement language (counsel + ESP registration pending), and marketing
//      the ingress backstop numbers (an anti-abuse bound, deliberately unmarketed -
//      see MONTHLY_INGRESS_BYTES / monthlyIngressCap in lib/constants/tiers.ts:
//      free 20 GB flat; derived 225 GB event-pass and 300 GB / 1.5 TB / 6 TB pro).
//      Scope = every MDX file + the marketing copy single-sources. Deliberately
//      NARROW patterns - a false positive here would train people to ignore it.
//
// Numbers that ARE marketed (2 GB free, 75 GB pass, 100 GB / 500 GB / 2 TB pro)
// must reach MDX via the spec-tag components (UploadSize/FreeStorage/...), so a
// literal ingress figure in content is always a mistake, never a legit spec.

const ROOT = process.cwd();

function collectMdx(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectMdx(full));
    // .md too (R6): content/help/AUTHORING.md is the content agent's brief and
    // must obey the same policy it teaches (it never renders — the loader only
    // reads .mdx — but its text trains the library's voice).
    else if (/\.mdx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

const mdxFiles = collectMdx(join(ROOT, "content"));

// Copy single-sources the fence applies to beyond MDX (careers JD, the golden
// voice lines, the FAQ answers - the FAQ also feeds FAQPage JSON-LD verbatim).
const CLAIM_FILES = [
  "src/lib/constants/careers.ts",
  "src/lib/constants/marketing-voice.ts",
  "src/components/marketing/faq-data.ts",
].map((f) => join(ROOT, f));

function scanLines(
  files: string[],
  hit: (line: string) => string | null,
): string[] {
  const found: string[] = [];
  for (const file of files) {
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, i) => {
        const match = hit(line);
        if (match !== null) {
          found.push(
            `${relative(ROOT, file)}:${i + 1} [${match}]: "${line.trim().slice(0, 80)}"`,
          );
        }
      });
  }
  return found;
}

describe("content policy", () => {
  it("has no em-dashes in MDX content (prose or frontmatter)", () => {
    // U+2014 + the HTML entity, mirroring the AST guard's FORBIDDEN set.
    const FORBIDDEN = ["—", "&mdash;"];
    const found = scanLines(mdxFiles, (line) =>
      FORBIDDEN.some((bad) => line.includes(bad)) ? "em-dash" : null,
    );
    expect(
      found,
      `Em-dashes in MDX content (the no-em-dash copy policy covers content/ too). ` +
        `Recast each naturally (a comma, a colon, parentheses, or two sentences):\n${found.join("\n")}`,
    ).toEqual([]);
  });

  it("makes none of the fenced claims in content or the marketing copy sources", () => {
    const BANNED: { why: string; re: RegExp }[] = [
      {
        why: "fabricated social proof",
        re: /trusted by|thousands of (hosts|users|events)|testimonial/i,
      },
      {
        why: "law-enforcement / CSAM language",
        re: /NCMEC|CSAM|law enforcement/i,
      },
      // The word itself: content should never discuss the ingress backstop at all.
      { why: "ingress backstop", re: /\bingress\b/i },
      // The literal byte numbers (word-bounded so 100 GB / 500 GB / 2 TB stay legal).
      { why: "ingress cap number", re: /\b(?:20|225|300) ?GB\b|\b(?:1\.5|6) ?TB\b/i },
    ];
    const found = scanLines([...mdxFiles, ...CLAIM_FILES], (line) => {
      for (const { why, re } of BANNED) if (re.test(line)) return why;
      return null;
    });
    expect(
      found,
      `Fenced marketing claims found (the T2.5 "must not claim" fence):\n${found.join("\n")}`,
    ).toEqual([]);
  });
});
