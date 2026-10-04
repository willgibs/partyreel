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
//   2. The claims scan: the T2.5 hard "must not claim" fence (in git:
//      git show 44090827:docs/decisions/t2p5-marketing-ia.md) bans fabricated social proof (Stripe is in TEST mode:
//      no "trusted by", no user/host counts, no testimonials), CSAM/NCMEC/
//      law-enforcement language (counsel + ESP registration pending), and naming
//      the abuse machinery behind the plans: the word "ingress" (the backstop's
//      own name; the published row is "Uploads") and the unpublished circuit
//      breakers' numbers (an account's uploads an hour, its events a day), which
//      no real host meets and so no page should give a host to plan around.
//      ★ REFINED ON PURPOSE by Ladder A (pricing-wiring; scar kept: content never
//      names the backstop or a breaker's number): the uploads allowance is
//      PUBLISHED now, each plan's own number in the pricing table's Uploads row,
//      so the numbers this fence used to derive and refuse (3x every cap) are
//      legal, and the breakers' numbers are read from the SQL that enforces them
//      so the fence follows them the way it followed the caps.
//      Scope = every MDX file + the marketing copy single-sources. Deliberately
//      NARROW patterns - a false positive here would train people to ignore it.
//
// Numbers that ARE marketed (every price, storage and uploads number in
// tiers.ts) reach MDX through the spec-tag components (UploadSize, PlanStorage,
// PlanUploads, ...), so a plan number is never typed into content.

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

/**
 * An unpublished breaker's number, read from the newest migration that sets it (`c_<name> constant integer := N`),
 * so the fence follows the SQL that enforces it and no number is typed here. Throws when it cannot read one: a fence
 * whose number is gone would pass everything.
 */
function breaker(name: string): number {
  const dir = join(ROOT, "supabase", "migrations");
  let found: number | null = null;
  for (const file of readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    const sql = readFileSync(join(dir, file), "utf8").replace(/--[^\n]*/g, "");
    for (const m of sql.matchAll(
      new RegExp(`\\b${name} constant integer := (\\d+);`, "g"),
    )) {
      found = Number(m[1]);
    }
  }
  if (found === null)
    throw new Error(`content-policy: no ${name} in the migrations`);
  return found;
}

/** "20,000" or "20000", word-bounded, so either spelling of a breaker's number is caught. */
const spelled = (n: number) =>
  `(?:${n.toLocaleString("en-US").replace(/,/g, ",?")})`;

/**
 * The breakers' numbers beside what they count: an account's uploads an hour, its events a day. Narrow on purpose:
 * "100" alone is everywhere ("100 MB", "100 guests"), so only the number WITH its unit and its window is a claim.
 */
const BREAKER_NUMBERS_RE = new RegExp(
  [
    `\\b${spelled(breaker("c_uploads_an_hour"))} (?:uploads|photos|files)(?: an| a| per| every) hour\\b`,
    `\\b${spelled(breaker("c_events_a_day"))} events(?: a| per| every) day\\b`,
    `\\b${spelled(breaker("c_events_a_day"))} events in (?:any|a) 24 hours\\b`,
  ].join("|"),
  "i",
);

// The human-promise fence (the neutralization pass) walks the
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

// THE CONSTANTS THE CLAIMS FENCE READS PAST, each with its reason. Every other
// source under src/lib/constants/ is scanned, so a copy constant is fenced the
// day it lands rather than the day someone remembers to list it: the list this
// replaced was opt-in, and the events pages' copy (`events.ts`: every type's
// statement, help lines and FAQ answers) sat outside it for as long as it existed.
// ★ None today (Ladder A): tiers.ts was exempt while it defined the unpublished uploads backstop, whose name and
// numbers its comments had to say; the allowance is published now and the file names neither, so it is read like
// every other constant.
const CLAIM_EXEMPT_CONSTANTS: Record<string, string> = {};

// The copy the claims fence reads beyond MDX: every constant (above) and the two
// copy sources that live outside src/lib/constants, the FAQ answers (which also
// feed FAQPage JSON-LD verbatim) and the llms.txt builders (which carry marketing
// claims straight to model training and retrieval). The constants hold the legal
// documents too, where a stray cap number or a child-safety acronym would read as
// a binding claim, and the footer's assistant row, which ships its question to
// third-party assistants.
const CLAIM_FILES = [
  ...collectSource(join(ROOT, "src/lib/constants")).filter(
    (file) => !(relative(ROOT, file) in CLAIM_EXEMPT_CONSTANTS),
  ),
  join(ROOT, "src/components/marketing/faq-data.ts"),
  join(ROOT, "src/lib/content/llms.ts"),
];

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
      // The word itself: content never discusses the backstop by its name; the published row is "Uploads".
      { why: "ingress backstop", re: /\bingress\b/i },
      // An unpublished breaker's number with what it counts (the published allowances stay legal).
      {
        why: "unpublished breaker number",
        re: BREAKER_NUMBERS_RE,
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

  it("reads every constant's claims but the ones it names, the events pages' copy included", () => {
    const scanned = new Set(CLAIM_FILES.map((file) => relative(ROOT, file)));
    // The gap this walk closed: the events pages' copy single-source.
    expect(scanned).toContain("src/lib/constants/events.ts");
    for (const file of collectSource(join(ROOT, "src/lib/constants"))) {
      const rel = relative(ROOT, file);
      expect(
        scanned.has(rel) || rel in CLAIM_EXEMPT_CONSTANTS,
        `${rel} is neither scanned nor exempt with a reason`,
      ).toBe(true);
    }
    // An exemption is a reason about a real file: one whose file is gone is stale.
    for (const rel of Object.keys(CLAIM_EXEMPT_CONSTANTS)) {
      expect(
        collectSource(join(ROOT, "src/lib/constants")).map((f) =>
          relative(ROOT, f),
        ),
        `${rel} is exempt from the claims fence but no longer exists`,
      ).toContain(rel);
    }
  });

  it("promises no human response, no human moderation, and no automation absolutes", () => {
    // The neutralization rule: published copy commits to
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

  it('never promises "no account" (a host may require one)', () => {
    // A truth, not a voice preference: a host may require an account, and
    // Require verified emails defaults ON for a new event, so a line promising
    // "no app" AND "no account" together is false on most events. "No app
    // required." is the shipped swap that survives (`voice` r1 `absence=named`;
    // marketing-voice.ts's head comment), and "no app" alone stays legal as a
    // named benefit.
    // Block comments are stripped before the scan: marketing-voice.ts,
    // trust-strip.tsx and ask-ai.ts each quote the retired literal verbatim
    // ("No app, no account.") in a JSDoc block to document the change, which is
    // history, not shipped copy - a narrow scan should not relitigate its own record.
    //
    // The second pattern is the same promise in other words (the event pages' close said "Your
    // guests need nothing but their phones." until crumbs-34): a guest who must confirm an email
    // needs an inbox as well as a phone.
    const BANNED = [
      /\bno apps?\b,?\s*(?:or|and)?\s*(?:no\s+)?account\b/i,
      /\bnothing but (?:their |a |your )?phones?\b/i,
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
    const found: string[] = [];
    for (const file of surfaces) {
      const withoutBlockComments = readFileSync(file, "utf8").replace(
        /\/\*[\s\S]*?\*\//g,
        "",
      );
      withoutBlockComments.split("\n").forEach((line, i) => {
        if (BANNED.some((re) => re.test(line))) {
          found.push(
            `${relative(ROOT, file)}:${i + 1}: "${line.trim().slice(0, 80)}"`,
          );
        }
      });
    }
    expect(
      found,
      `A line promises "no app" and "no account" together, or that guests need ` +
        `nothing but a phone (never: a host may require an email). Say "No app ` +
        `required." instead:\n${found.join("\n")}`,
    ).toEqual([]);
  });
});
