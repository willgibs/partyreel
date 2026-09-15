// THE SPECIMEN SOURCE COLLECTOR (the Library x Lab round, 2026-09-15).
//
// A library specimen is worth twice as much when you can read the JSX that
// made it, which is what shadcn's docs do with Preview and Code. The JSX is
// already written, once, in each family's `gallery-demos.tsx`; a `code` field
// on the entry would be a second copy of it and would drift the first time
// somebody edited the markup. So the code is DERIVED from the same
// declaration: this collector lifts each specimen's `node` expression out of
// the entry module's source, and the gallery renders that.
//
// Why a committed artifact and not a read at request time: exactly the reason
// scripts/design-rules/collect.mjs gives. The lab pages are dynamic and the
// Vercel bundle only traces files an import can see, so a request-time
// readFileSync over the entry modules would ENOENT on the preview (the one
// place Will reviews). The JSON is imported, so it always ships.
//
// Regenerate with:  node "src/app/(dev)/design/gallery/collect-specimens.mjs"
// specimens.test.ts fails until the artifact matches what this sees.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";

export const SPECIMENS_VERSION = 1;

/** Where the five family declarations live (the shell route group). */
export const FAMILY_DIR = "src/app/(dev)/design/(shell)/library";
export const FAMILIES = [
  "components",
  "patterns",
  "compositions",
  "foundations",
  "marketing",
];
export const ARTIFACT_PATH =
  "src/app/(dev)/design/gallery/specimens.generated.json";

const entryModule = (family) => `${FAMILY_DIR}/${family}/gallery-demos.tsx`;

/**
 * The text as it reads on its own: getText() gives the first line already
 * flush (the node starts there) and every later line at its source column, so
 * one common indent comes off lines two and down.
 */
function dedent(text) {
  const lines = text.split("\n");
  if (lines.length < 2) return text.trim();
  let indent = Infinity;
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    indent = Math.min(indent, line.length - line.trimStart().length);
  }
  if (!Number.isFinite(indent) || indent === 0) return text.trimEnd();
  return [lines[0], ...lines.slice(1).map((l) => l.slice(indent))]
    .join("\n")
    .trimEnd();
}

const propOf = (object, name) =>
  object.properties.find(
    (p) =>
      ts.isPropertyAssignment(p) &&
      (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) &&
      p.name.text === name,
  )?.initializer;

const stringOf = (node) =>
  node && ts.isStringLiteral(node) ? node.text : undefined;

/** `node: (<X />)` and `node: <X />` both read as the element itself. */
function unwrap(node) {
  let out = node;
  while (ts.isParenthesizedExpression(out)) out = out.expression;
  return out;
}

/**
 * Every entry's specimens, in declaration order, as the source wrote them.
 * Returns { [entryId]: string[] } with one entry per family module; an entry
 * whose specimen is a bare component reference (`<FormDemo />`) is kept as
 * written, because that IS what the library declares.
 */
export function collectSpecimenCode(root) {
  const code = {};
  for (const family of FAMILIES) {
    const rel = entryModule(family);
    const abs = join(root, rel);
    if (!existsSync(abs)) {
      throw new Error(`collect-specimens: ${rel} is gone`);
    }
    const source = ts.createSourceFile(
      abs,
      readFileSync(abs, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    for (const statement of source.statements) {
      if (!ts.isVariableStatement(statement)) continue;
      const exported = (statement.modifiers ?? []).some(
        (m) => m.kind === ts.SyntaxKind.ExportKeyword,
      );
      if (!exported) continue;
      for (const declaration of statement.declarationList.declarations) {
        const list = declaration.initializer;
        if (!list || !ts.isArrayLiteralExpression(list)) continue;
        for (const element of list.elements) {
          if (!ts.isObjectLiteralExpression(element)) continue;
          const id = stringOf(propOf(element, "id"));
          if (!id) continue;
          const specimens = propOf(element, "specimens");
          if (!specimens || !ts.isArrayLiteralExpression(specimens)) continue;
          code[id] = specimens.elements.map((specimen) => {
            if (!ts.isObjectLiteralExpression(specimen)) return "";
            const node = propOf(specimen, "node");
            return node ? dedent(unwrap(node).getText()) : "";
          });
        }
      }
    }
  }
  return { version: SPECIMENS_VERSION, code };
}

// Run directly to rewrite the artifact. Imported by specimens.test.ts, which
// is what keeps the committed file honest.
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const root = process.cwd();
  const artifact = collectSpecimenCode(root);
  writeFileSync(
    join(root, ARTIFACT_PATH),
    JSON.stringify(artifact, null, 2) + "\n",
  );
  const entries = Object.keys(artifact.code).length;
  const specimens = Object.values(artifact.code).reduce(
    (n, list) => n + list.length,
    0,
  );
  console.log(
    `specimen source: ${specimens} specimens on ${entries} entries -> ${ARTIFACT_PATH}`,
  );
}
