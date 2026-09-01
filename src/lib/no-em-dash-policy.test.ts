import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

// Project-wide guard for the no-em-dash copy policy (CLAUDE.md "Working conventions"):
// user-facing copy must never contain an em-dash (U+2014) — it reads as an "AI tell".
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
const SRC = join(process.cwd(), "src");

const SCAN_DIRS = ["app", "components", "lib"];
const SCAN_FILES: string[] = [];

const SKIP = /\.test\.tsx?$|[/\\]types\.ts$|[/\\]vendor[/\\]/;

function collectFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectFiles(full));
    else if (/\.tsx?$/.test(entry.name) && !SKIP.test(full)) out.push(full);
  }
  return out;
}

// Returns the user-facing em-dash snippets in a file (comments excluded via the AST).
function offenders(file: string): string[] {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
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

describe("no-em-dash copy policy", () => {
  it("has no em-dashes in user-facing copy (comments are exempt)", () => {
    const files = [
      ...SCAN_DIRS.flatMap((d) => collectFiles(join(SRC, d))),
      ...SCAN_FILES.map((f) => join(SRC, f)),
    ];
    const found = files.flatMap((file) =>
      offenders(file).map((hit) => `src/${relative(SRC, file)}: "${hit}"`),
    );
    expect(
      found,
      `Found em-dashes in user-facing copy. Recast each naturally in context ` +
        `(a comma, a colon, parentheses, or two sentences):\n${found.join("\n")}`,
    ).toEqual([]);
  });
});
