import { readFileSync } from "node:fs";
import { join } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

import { filesUnder } from "@/testing/source-tree";

/**
 * NO LINK THE LAB RENDERS ITSELF PREFETCHES, AND THE SHELL MOUNTS THE NET UNDER THE REST (lab-prefetch, from
 * build 38's red-team LOW; the admin portal's `admin-prefetch-policy.test.ts` is the model).
 *
 * Every lab URL carries `?key=`, and Next fetches the route tree of any prefetched URL that has a query again
 * WITHOUT it (scheduler `pingRoute`), which the proxy gate 404s: a console error per link, on a production build
 * only (Next prefetches nowhere else). `prefetch={false}` is the whole of the fix for a link the lab renders:
 * Next 16 gives it no viewport, hover or touch prefetch. The links a board or the Library DRAWS cannot be
 * switched off from the frame (`next/link` reads no context of ours), so `PrefetchGuard` answers those, and the
 * shell has to keep mounting it.
 *
 * It reads the source, not the render, so a link a state hides (an About panel, an unknown step) is held as
 * much as one on screen. ★ THE LIBRARY'S OWN PAGES AND THE GALLERY'S CHROME ARE SCANNED TOO (crumbs-49): a family
 * page draws a title and an `open` link for every entry, and on a production build each is a keyed request. What a
 * SPECIMEN draws is not the lab's: the Library's `*-demos.tsx` modules put production components on the page as
 * production draws them, links included, so a link there is the guard's to answer, and `prefetch={false}` on it
 * would change the thing the specimen shows.
 */
const ROOT = process.cwd();
const DIRS = [
  "src/app/(dev)/design/(shell)/_shell",
  "src/app/(dev)/design/(shell)/lab",
  "src/components/lab",
  "src/app/(dev)/design/(shell)/library",
  "src/app/(dev)/design/gallery",
];

/**
 * The Library's specimen modules: production components drawn as production draws them (the header says why they are
 * not the lab's). By path, since `lab/kit/kit-demos.tsx` is the lab's own and is read.
 */
const SPECIMENS = /\/library\/.*-demos\.tsx$/;

/** Every component under `dir` (repo-relative), its tests aside. */
const sources = (dir: string) =>
  filesUnder(dir).filter((f) => /\.tsx$/.test(f) && !/\.test\.tsx$/.test(f));

function parse(file: string): ts.SourceFile {
  return ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
}

type Opening = ts.JsxOpeningElement | ts.JsxSelfClosingElement;

/** Every JSX element in a file whose tag is one of `names`. */
function elements(source: ts.SourceFile, names: Set<string>): Opening[] {
  const found: Opening[] = [];
  const visit = (node: ts.Node) => {
    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      names.has(node.tagName.getText(source))
    )
      found.push(node);
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

/** The `prefetch` attribute of an element, if it has one. */
function prefetchOf(node: Opening, source: ts.SourceFile) {
  return node.attributes.properties.find(
    (p): p is ts.JsxAttribute =>
      ts.isJsxAttribute(p) && p.name.getText(source) === "prefetch",
  );
}

/** Whether the attribute is exactly `prefetch={false}`. */
const isFalse = (attribute: ts.JsxAttribute | undefined) =>
  attribute?.initializer !== undefined &&
  ts.isJsxExpression(attribute.initializer) &&
  attribute.initializer.expression?.kind === ts.SyntaxKind.FalseKeyword;

const lineOf = (node: ts.Node, source: ts.SourceFile) =>
  source.getLineAndCharacterOfPosition(node.getStart()).line + 1;

/**
 * Whether an element sits in the function that defines `LabLink`: the one wrapper that hands a `prefetch`
 * it was given on to its link. It defaults to false, and `optingIn` holds everyone who calls it.
 */
function insideLabLink(node: ts.Node): boolean {
  for (let up = node.parent; up; up = up.parent)
    if (ts.isFunctionDeclaration(up) && up.name?.text === "LabLink")
      return true;
  return false;
}

/** The lines of every `next/link` element in a file that does not say `prefetch={false}`. */
function prefetching(file: string): number[] {
  const source = parse(file);
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
  return elements(source, names)
    .filter((node) => !isFalse(prefetchOf(node, source)))
    .filter((node) => !insideLabLink(node))
    .map((node) => lineOf(node, source));
}

/** The lines of every `LabLink` that opts back in: it prefetches only when it says so. */
function optingIn(file: string): number[] {
  const source = parse(file);
  return elements(source, new Set(["LabLink"]))
    .filter((node) => {
      const attribute = prefetchOf(node, source);
      return attribute !== undefined && !isFalse(attribute);
    })
    .map((node) => lineOf(node, source));
}

const everything = DIRS.flatMap((dir) => sources(dir));
const files = everything.filter((f) => !SPECIMENS.test(f));

describe("the lab's own links never prefetch", () => {
  it("scanned the shell, the lab's pages, the kit, the Library's pages and the gallery's chrome", () => {
    expect(files.length).toBeGreaterThan(60);
    for (const expected of [
      "_shell/markdown.tsx",
      "_shell/shell-context.tsx",
      "lab/page.tsx",
      "components/lab/step.tsx",
      "components/lab/dock.tsx",
      "library/page.tsx",
      "library/index-list.tsx",
      "library/[id]/page.tsx",
      "gallery/gallery-ui.tsx",
      "gallery/family-gallery.tsx",
    ])
      expect(files.some((f) => f.endsWith(expected))).toBe(true);
  });

  it("leaves out only the Library's specimen modules: the lab's own `kit-demos.tsx` is still read", () => {
    expect(everything.filter((f) => SPECIMENS.test(f)).length).toBeGreaterThan(
      0,
    );
    expect(files.some((f) => f.endsWith("lab/kit/kit-demos.tsx"))).toBe(true);
  });

  it("★ every next/link the lab renders says prefetch={false}", () => {
    const offenders = files.flatMap((f) =>
      prefetching(join(ROOT, f)).map((line) => `${f}:${line}`),
    );
    expect(
      offenders,
      "each of these may prefetch, and a prefetch of a link whose href carries ?key= sends Next's keyless sibling request, which the gate 404s (design-system.md, 'The /design lab')",
    ).toEqual([]);
  });

  it("★ LabLink defaults to no prefetch, and no caller opts back in", () => {
    const source = parse(
      join(ROOT, "src/app/(dev)/design/(shell)/_shell/shell-context.tsx"),
    );
    let defaultsToFalse = false;
    const visit = (node: ts.Node) => {
      if (ts.isFunctionDeclaration(node) && node.name?.text === "LabLink") {
        const pattern = node.parameters[0]?.name;
        defaultsToFalse =
          !!pattern &&
          ts.isObjectBindingPattern(pattern) &&
          pattern.elements.some(
            (e) =>
              e.name.getText(source) === "prefetch" &&
              e.initializer?.kind === ts.SyntaxKind.FalseKeyword,
          );
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
    expect(defaultsToFalse, "LabLink's `prefetch` must default to false").toBe(
      true,
    );

    const offenders = files.flatMap((f) =>
      optingIn(join(ROOT, f)).map((line) => `${f}:${line}`),
    );
    expect(offenders).toEqual([]);
  });
});

describe("the net under the links a board draws", () => {
  it("★ the shell mounts the PrefetchGuard", () => {
    const shell = join(ROOT, "src/app/(dev)/design/(shell)/_shell/shell.tsx");
    const source = parse(shell);
    expect(
      elements(source, new Set(["PrefetchGuard"])).length,
      'the shell no longer mounts PrefetchGuard: a production <Link href="#"> a board draws is a keyless 404 again (prefetch-guard.tsx)',
    ).toBe(1);
  });
});
