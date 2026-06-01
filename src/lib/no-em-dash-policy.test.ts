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
// kept slipping into JSX / OG metadata that the data-only `JSON.stringify` guards never saw.
//
// Scope: the directories that hold user-facing copy. EXPAND `SCAN` as more surfaces are
// swept clean (e.g. the (app)/(guest) UI, emails, notifications). `*.test.ts` is skipped
// (this file names the character to define the policy) as is the generated db/types.ts.

const EM_DASH = "—";
const SRC = join(process.cwd(), "src");

// Surfaces verified em-dash-free (the marketing polish arc). Each is a dir under src/ or a
// specific file. Add more here once their copy has been swept.
const SCAN_DIRS = ["app/(marketing)", "components/marketing", "lib/constants"];
const SCAN_FILES = ["app/opengraph-image.tsx", "app/layout.tsx"];

const SKIP = /\.test\.tsx?$|[/\\]types\.ts$/;

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
    if (isCopy && (node as { text: string }).text.includes(EM_DASH)) {
      hits.push((node as { text: string }).text.trim().slice(0, 80));
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
