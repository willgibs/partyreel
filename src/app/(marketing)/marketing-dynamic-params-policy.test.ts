import { readFileSync } from "node:fs";
import { join } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

import { filesUnder } from "@/testing/source-tree";

/**
 * AN UNKNOWN SLUG IS ROUTING'S 404, NEVER A RENDER (stale-link). A marketing page under a dynamic segment
 * (`/help/[slug]` and its kin) left `dynamicParams` on, so an unknown slug rendered the page on demand and threw
 * `notFound()`, which Next 16 serves as its error shell: `<html id="__next_error__">` with an empty body, the 404
 * drawn by the client once its script had run (six seconds of white on Slow 4G at 4x CPU, measured on
 * `next start`), and never for a reader with no script. With `dynamicParams = false` Next answers an unknown slug
 * before any render, as it answers a mistyped URL: a 404 with the site's screen in the HTML. Every marketing slug
 * is content that ships with the build, so `generateStaticParams` names each real one.
 *
 * ★ Pinned for non-emptiness: a sweep that finds no dynamic page is a broken sweep, not a clean site.
 */

const ROOT = process.cwd();
/** A page whose own route has a dynamic segment: `[slug]`, `[...rest]` or `[[...rest]]` in its path. */
const DYNAMIC = filesUnder("src/app/(marketing)")
  .filter((file) => file.endsWith("/page.tsx"))
  .filter((file) => /\/\[[^/]+\]\//.test(file));

/** The value a module exports under `name` as a `const` literal, if it does. */
function exportedConst(file: string, name: string): string | undefined {
  const source = ts.createSourceFile(
    file,
    readFileSync(join(ROOT, file), "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  for (const statement of source.statements) {
    if (
      !ts.isVariableStatement(statement) ||
      !statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    )
      continue;
    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === name &&
        declaration.initializer
      )
        return declaration.initializer.getText(source);
    }
  }
  return undefined;
}

function exportsFunction(file: string, name: string): boolean {
  return new RegExp(`export (async )?function ${name}\\b`).test(
    readFileSync(join(ROOT, file), "utf8"),
  );
}

describe("the marketing site's dynamic pages", () => {
  it("are found at all: help, blog, careers and the event types", () => {
    expect(DYNAMIC.length).toBeGreaterThanOrEqual(4);
    for (const route of ["/help/", "/blog/", "/careers/", "/events/"]) {
      expect(
        DYNAMIC.some((file) => file.includes(`${route}[`)),
        route,
      ).toBe(true);
    }
  });

  it.each(DYNAMIC)(
    "%s answers an unknown slug with routing's 404: dynamicParams off, every real slug listed",
    (file) => {
      expect(
        exportedConst(file, "dynamicParams"),
        `${file} must export \`dynamicParams = false\`: left on, an unknown slug renders the page and its ` +
          `notFound() is served as Next's white error shell`,
      ).toBe("false");
      expect(exportsFunction(file, "generateStaticParams"), file).toBe(true);
    },
  );

  it("★ leaves the site ONE 404, the root's: no not-found of the marketing group's own", () => {
    // marketing-crumbs: the cinema group's `not-found.tsx` retired. With every slug answered by routing (above),
    // no marketing page throws a notFound() a reader can reach, so a group 404 never drew, and it still rode every
    // cinema page's payload as a reference. A notFound() a page does throw falls to the root's boundary, which
    // stands OUTSIDE the group's layout and brings its own chrome (the trail on paper), so nothing doubles.
    const own = filesUnder("src/app/(marketing)").filter((file) =>
      /\/not-found(\.screen)?\.tsx$/.test(file),
    );
    expect(own).toEqual([]);
  });
});
