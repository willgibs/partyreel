import ts from "typescript";
import { describe, expect, it } from "vitest";

import { read, sources } from "@/testing/source-tree";

// Project-wide guard for the no-em-dash copy rule: user-facing copy must never contain
// an em-dash (U+2014) — it reads as an "AI tell".
// Code COMMENTS are exempt, so we parse each file's TypeScript AST and inspect ONLY
// string/template literals + JSX text (comments are trivia, not AST nodes). That means a
// `// foo <emdash> bar` comment never trips this, but a rendered `<p>foo <emdash> bar</p>`
// or a `"foo <emdash> bar"` string does. This ends the manual-grep whack-a-mole: em-dashes
// kept slipping into JSX / email-HTML / metadata that the data-only `JSON.stringify` guards
// never saw.
//
// Scope is now the WHOLE app — `app` + `components` + `lib` cover every user-facing surface
// (marketing, the host/guest/auth UI, API/DB/validation messages, and the email templates).
// We flag both the literal em-dash AND the `&mdash;` HTML entity (email bodies are HTML).
// `*.test.ts` is skipped (this file names the character to define the policy) as is the
// generated db/types.ts.
//
// `components/vendor/` is skipped too, and the reason is worth stating: this scanner reads
// every template literal as user-facing copy, which is right for our code and wrong for a
// vendored CSS-in-JS package, where an em-dash inside a `/* … */` CSS comment sits inside a
// template literal and never reaches a user. The policy is about OUR copy; vendored source
// is third-party text we are contractually not to restyle. If a vendored package ever does
// render user-facing strings, wrap it rather than editing it, and the wrapper gets scanned.

const FORBIDDEN = ["—", "&mdash;"];
/**
 * ★ THE SCAN HAS A BUDGET OF ITS OWN (crumbs-77). It parses through the TypeScript parser every file of the app that
 * holds the character at all (about 450, comments included, which the parse then exempts), CPU work that grows with
 * the tree, and vitest's 5 s default is for a test that waits on nothing: a full run under other lanes' builds timed
 * the whole-tree version out on a tree with no em-dash in it. A budget, not a timing claim: a scan that finds one
 * still fails at once, on its own assertion, and one that hangs fails at the budget.
 */
const SCAN_BUDGET_MS = 60_000;

const SCAN_DIRS = ["src/app", "src/components", "src/lib"];

// ★ MATCHED AGAINST A REPO-RELATIVE PATH (`src/...`), never the absolute one (anchored at the
// glow merge, 2026-08-31). Unanchored, `[/\\]vendor[/\\]` exempted ANY directory
// named vendor under app/components/lib, so a future src/app/(marketing)/vendor/
// would have escaped the policy on real user-facing copy; worse, an absolute match
// meant a checkout living under any path with a `vendor` segment silently skipped
// EVERY file, with nothing asserting that the scan found anything at all. Both
// holes are closed: the path is relative, the vendor clause is anchored to the one
// folder it is for, and the test below asserts a non-empty file list. (Tests and the
// generated db/types.ts are `sources()`'s own skips.)
const VENDOR = /^src\/components\/vendor\//;

// Returns the user-facing em-dash snippets in a file (comments excluded via the AST).
function offenders(file: string): string[] {
  const source = ts.createSourceFile(
    file,
    read(file),
    ts.ScriptTarget.Latest,
    /* setParentNodes */ false,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const hits: string[] = [];
  const visit = (node: ts.Node) => {
    const isCopy =
      ts.isStringLiteralLike(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node) ||
      ts.isJsxText(node);
    if (isCopy) {
      const text = (node as { text: string }).text;
      if (FORBIDDEN.some((bad) => text.includes(bad))) {
        hits.push(text.trim().slice(0, 80));
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return hits;
}

describe("no-em-dash copy policy", { timeout: SCAN_BUDGET_MS }, () => {
  it("has no em-dashes in user-facing copy (comments are exempt)", () => {
    const files = SCAN_DIRS.flatMap((dir) => sources(dir)).filter(
      (file) => !VENDOR.test(file),
    );
    // A guard that scans nothing passes silently. Pin that the walk found the
    // tree: the VENDOR regex above is the one thing that could empty this list.
    expect(files.length, "the scan found no files").toBeGreaterThan(500);
    // Only a file that holds the character (or its entity) anywhere is parsed.
    const found = files
      .filter((file) => FORBIDDEN.some((bad) => read(file).includes(bad)))
      .flatMap((file) => offenders(file).map((hit) => `${file}: "${hit}"`));
    expect(
      found,
      `Found em-dashes in user-facing copy. Recast each naturally in context ` +
        `(a comma, a colon, parentheses, or two sentences):\n${found.join("\n")}`,
    ).toEqual([]);
  });
});
