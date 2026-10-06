import ts from "typescript";
import { describe, expect, it } from "vitest";

import { filesUnder, lineOf, read, syntax } from "./source-tree";

/**
 * NO TEST LISTS A DIRECTORY ITSELF (test-slim). `source-tree.ts` is the one walk of the repository: about 120 tests
 * each carried a walker of their own, each re-reading (and the policies re-parsing) the whole tree in its own
 * process, with six ideas of what to skip. A test that needs files asks `filesUnder`, `sources` or `entries`, and
 * reads them with `read` and `syntax`; a SQL guard asks `readMigrations()` (`src/lib/db/testing/migrations.ts`),
 * which asks `filesUnder`. So a new policy costs a filter, never a walk, and a parse only of the files that could
 * offend.
 *
 * WHAT IS REFUSED, in every test and test helper but `source-tree.ts`: a directory-listing function of `node:fs`
 * (`readdirSync`, `readdir`, `opendirSync`, `opendir`, `globSync`, `glob`), imported by name or called off the
 * module (`fs.readdirSync`). Reading one known file is no walk and stays free.
 */

const HOME = "src/testing/source-tree.ts";
const FS = new Set(["fs", "node:fs", "fs/promises", "node:fs/promises"]);
const LISTERS = new Set([
  "readdirSync",
  "readdir",
  "opendirSync",
  "opendir",
  "globSync",
  "glob",
]);

/** A test, or a helper only tests import: what this rule holds. */
const TEST_CODE = /\.test\.tsx?$|\/testing\/|\/test-utils\//;

/** Every directory listing in one file: an fs lister imported by name, or called off an fs module's binding. */
function listingsIn(tree: ts.SourceFile): number[] {
  const modules = new Set<string>();
  const lines: number[] = [];
  for (const statement of tree.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      !FS.has(statement.moduleSpecifier.text)
    )
      continue;
    const clause = statement.importClause;
    if (clause?.name) modules.add(clause.name.text);
    const bindings = clause?.namedBindings;
    if (bindings && ts.isNamespaceImport(bindings))
      modules.add(bindings.name.text);
    if (bindings && ts.isNamedImports(bindings)) {
      for (const element of bindings.elements) {
        if (LISTERS.has((element.propertyName ?? element.name).text)) {
          lines.push(lineOf(element, tree));
        }
      }
    }
  }
  const visit = (node: ts.Node) => {
    if (
      ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      modules.has(node.expression.text) &&
      LISTERS.has(node.name.text)
    ) {
      lines.push(lineOf(node, tree));
    }
    ts.forEachChild(node, visit);
  };
  if (modules.size > 0) visit(tree);
  return lines;
}

const probe = (code: string) =>
  listingsIn(
    ts.createSourceFile("probe.ts", code, ts.ScriptTarget.Latest, true),
  );

describe("no test lists a directory itself", () => {
  it("★ finds no listing outside source-tree.ts: ask filesUnder, sources or entries", () => {
    const suite = filesUnder("src").filter(
      (path) => /\.tsx?$/.test(path) && TEST_CODE.test(path),
    );
    expect(suite.length, "the suite was not found").toBeGreaterThan(900);
    const offenders = suite
      .filter(
        (path) => path !== HOME && /readdir|opendir|glob/.test(read(path)),
      )
      .flatMap((path) =>
        listingsIn(syntax(path)).map((line) => `${path}:${line}`),
      );
    expect(
      offenders,
      `A test walks the tree on its own again. List files with filesUnder / sources / entries from ` +
        `"@/testing/source-tree" (readMigrations() for the SQL), which walk once and let a filter decide what is parsed:\n` +
        offenders.join("\n"),
    ).toEqual([]);
  });

  it("is not blind: an import by name, a renamed one and a call off the module each count", () => {
    expect(probe(`import { readdirSync } from "node:fs";`)).toEqual([1]);
    expect(probe(`import { readdir as ls } from "fs/promises";`)).toEqual([1]);
    expect(probe(`import fs from "node:fs";\nfs.readdirSync(".");`)).toEqual([
      2,
    ]);
    expect(
      probe(`import * as fs from "fs";\nconst a = 1;\nfs.globSync("*");`),
    ).toEqual([3]);
    // Reading a known file, and the word in a comment or a string, are no listing.
    expect(
      probe(
        `import { readFileSync } from "node:fs";\n// readdirSync\nconst s = "readdirSync";`,
      ),
    ).toEqual([]);
  });
});
