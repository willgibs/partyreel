import { readFileSync } from "node:fs";
import { join } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

import { filesUnder } from "@/testing/source-tree";

/**
 * NO LINK IN THE PORTAL PREFETCHES, WHEREVER IT SITS (crumbs-39, from the chrome's own rule in
 * `admin-chrome-prefetch.test.tsx`).
 *
 * `next/link` prefetches every link that paints, and each prefetch of a portal route is two reads of
 * Supabase's auth server (the proxy, then the layout's own `getUser()`). The chrome's rail, dropdown and
 * bar are pinned by rendering them; this holds the rest, the links a PAGE draws: a queue row's action,
 * every row of an inbox (a long inbox is a long run of distinct routes), a tile's event name, a filter's
 * tabs, the band that shows on every view on a bad day. A prefetch buys an operator nothing (one person,
 * one click at a time, on a console that is read, not browsed). A page's own `getUser()` is untouched:
 * this only stops the pages nobody opened from being rendered.
 *
 * It reads the source, not the render, so a link a state hides (a dropdown's row, a band that is not
 * there on a healthy day) is held as much as one on screen. `prefetch={false}` is the whole of the
 * contract: Next's docs say it never prefetches, on entering the viewport or on hover.
 */
const ROOT = process.cwd();
const DIRS = ["src/components/admin", "src/app/admin"];

/**
 * A page another live lane is rewriting, so its two links cannot take the prop in this lane's tree.
 * Each entry is deleted when its page says `prefetch={false}` (the second test fails until then),
 * so the list can only shrink.
 */
const PENDING: Record<string, string> = {};

/** Every component under `dir` (repo-relative), its tests aside. */
const sources = (dir: string) =>
  filesUnder(dir).filter((f) => /\.tsx$/.test(f) && !/\.test\.tsx$/.test(f));

/** The lines of every `next/link` element in a file that does not say `prefetch={false}`. */
function prefetching(file: string): number[] {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  // Whatever name the file binds next/link's default export to.
  const names = new Set<string>();
  source.forEachChild((node) => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text === "next/link" &&
      node.importClause?.name
    )
      names.add(node.importClause.name.text);
  });
  const lines: number[] = [];
  const visit = (node: ts.Node) => {
    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      names.has(node.tagName.getText(source))
    ) {
      const prefetch = node.attributes.properties.find(
        (p): p is ts.JsxAttribute =>
          ts.isJsxAttribute(p) && p.name.getText(source) === "prefetch",
      );
      const off =
        prefetch?.initializer !== undefined &&
        ts.isJsxExpression(prefetch.initializer) &&
        prefetch.initializer.expression?.kind === ts.SyntaxKind.FalseKeyword;
      if (!off)
        lines.push(
          source.getLineAndCharacterOfPosition(node.getStart()).line + 1,
        );
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return lines;
}

const files = DIRS.flatMap((dir) => sources(dir));

describe("the portal's links never prefetch", () => {
  it("scanned the portal's components and pages", () => {
    expect(files.length).toBeGreaterThan(20);
    expect(
      files.some((f) => f.endsWith("components/admin/queue-list.tsx")),
    ).toBe(true);
  });

  it("★ every next/link in the portal says prefetch={false}", () => {
    const offenders = files
      .filter((f) => !(f in PENDING))
      .flatMap((f) => prefetching(join(ROOT, f)).map((line) => `${f}:${line}`));
    expect(
      offenders,
      "each of these may prefetch: a prefetch of a portal route is two reads of Supabase's auth server (admin-observability.md, 'The portal's links never prefetch')",
    ).toEqual([]);
  });

  it("holds only pending pages that still prefetch, so the list can only shrink", () => {
    for (const [file, why] of Object.entries(PENDING)) {
      expect(
        prefetching(join(ROOT, file)).length,
        `${file} no longer prefetches: delete its entry (${why})`,
      ).toBeGreaterThan(0);
    }
  });
});
