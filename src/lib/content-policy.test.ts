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

// The human-promise fence (Will's 2026-08-28 neutralization ruling) walks the
// WHOLE user-facing copy surface, not just the claim single-sources: every
// marketing page, marketing component, and copy constant. A tree walk so new
// pages are covered the day they land.
function collectSource(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectSource(full));
    else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name))
      out.push(full);
  }
  return out;
}

// Copy single-sources the fence applies to beyond MDX (careers JD, the golden
// voice lines, the FAQ answers - the FAQ also feeds FAQPage JSON-LD verbatim).
const CLAIM_FILES = [
  "src/lib/constants/careers.ts",
  "src/lib/constants/marketing-voice.ts",
  "src/components/marketing/faq-data.ts",
  // The AI-crawler surfaces (2026-08-28): the llms.txt builders and the shared
  // press boilerplate carry marketing claims straight to model training and
  // retrieval, so the fence covers them like any other claim source.
  "src/lib/content/llms.ts",
  "src/lib/constants/press.ts",
  // The footer's assistant row: its question ships to third-party assistants
  // and is user-facing copy on every page, so it answers to the same fence.
  "src/lib/constants/ask-ai.ts",
  // /about's copy single-source. The claims fence runs over MDX + this list, so
  // before the copy moved here the About PAGE was reachable only by the weaker
  // neutralization fence: social proof written inline on it was caught by
  // nothing at all.
  "src/lib/constants/about.ts",
].map((f) => join(ROOT, f));

function scanLines(
  files: string[],
  hit: (line: string) => string | null,
): string[] {
  // ★ A scan that finds no files passes every rule below in silence. Pinned
  // here, once, because every line-based rule funnels through this walker
  // (the round-0 sweep, 2026-09-01: the em-dash guard had exactly this hole,
  // where an unanchored skip pattern could empty the whole file list).
  if (files.length === 0) throw new Error("content-policy: scanned no files");
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
      {
        why: "ingress cap number",
        re: /\b(?:20|225|300) ?GB\b|\b(?:1\.5|6) ?TB\b/i,
      },
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

  it("promises no human response, no human moderation, and no automation absolutes", () => {
    // Will's neutralization ruling (2026-08-28): published copy commits to
    // OUTCOMES (a reply, a review, host control), never to WHO or WHAT delivers
    // them, so support/moderation tooling can evolve without breaking published
    // (especially legal) language. Deliberately phrase-narrow, like the claims
    // fence: "every upload has a real person behind it" (guest attribution) and
    // careers' "We read every application" stay legal on purpose.
    const BANNED: { why: string; re: RegExp }[] = [
      {
        why: "human-response/-moderation promise",
        re: /a (real )?person (answers|reviews|will get|behind every report)|replies from a real person|human answer|handled by a person|a human (reviews|decides)|made by humans|ask a person|handled personally/i,
      },
      // "Business day" is desk-hours framing; the standard reply line is
      // "Every note gets a reply, usually within a day."
      { why: "desk-hours reply framing", re: /business day/i },
      // Never-automate absolutes trap us exactly like human promises do (an
      // automated first gate for reports would break "never an automatic
      // takedown" the day it ships).
      {
        why: "no-automation absolute",
        re: /automat(ic|ed) takedown|auto-?removed by a machine|never fired off by a filter/i,
      },
    ];
    const surfaces = [
      ...new Set([
        ...mdxFiles,
        ...CLAIM_FILES,
        ...collectSource(join(ROOT, "src/app/(marketing)")),
        ...collectSource(join(ROOT, "src/components/marketing")),
        ...collectSource(join(ROOT, "src/lib/constants")),
      ]),
    ];
    // Whole-file scan with whitespace COLLAPSED, not a line scan: JSX wraps
    // prose mid-phrase ("a real\n  person answers" shipped through the line
    // fence and rendered as the banned phrase on /press, caught live
    // 2026-08-28). Line precision is traded for wrap-proofing; the match
    // excerpt localizes the hit well enough.
    const found: string[] = [];
    expect(surfaces.length, "the surface scan found no files").toBeGreaterThan(
      5,
    );
    expect(BANNED.length, "the banned list is empty").toBeGreaterThan(0);
    for (const file of surfaces) {
      const flat = readFileSync(file, "utf8").replace(/\s+/g, " ");
      for (const { why, re } of BANNED) {
        const m = re.exec(flat);
        if (m) {
          found.push(
            `${relative(ROOT, file)} [${why}]: "...${flat.slice(Math.max(0, m.index - 30), m.index + m[0].length + 10)}..."`,
          );
        }
      }
    }
    expect(
      found,
      `Human-promise/automation-absolute language found (the neutralization fence). ` +
        `Recast actor-free (reviewed / a reply / host control):\n${found.join("\n")}`,
    ).toEqual([]);
  });
});
