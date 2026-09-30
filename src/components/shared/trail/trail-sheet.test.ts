import { existsSync, readFileSync } from "node:fs";
import { dirname, join, posix } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * THE 404'S SHEET IS NOT PRELOADED ON EVERY PAGE (crumbs-22, from crumbs-10's red-team of the home).
 *
 * Next lists the stylesheets of a root `not-found.tsx` with the root layout's assets and preloads them on
 * EVERY route (measured: `/`, `/pricing`, `/help`, `/login` and `/about` each carried
 * `<link rel="preload" as="style" href=".../trail.css">` in the head, and Chrome warned "preloaded using
 * link preload but not used" once per load, site-wide), because the 404 is the one route that draws the
 * image trail and the trail imported its own sheet. So nothing under the root 404's import graph may
 * import a stylesheet, and the trail's rules ride `globals.css`, which every page loads anyway.
 *
 * The walk follows every import the 404 can execute: static, side-effect (`import "./x.css"`), re-export
 * and `import()`. A dynamic import in a Server Component is NOT code-split (Next's lazy-loading guide), so
 * a lazily imported client component carries its sheet onto the 404's list just the same. A type-only
 * import is erased and never loads anything.
 */

const ROOT = process.cwd();
const ENTRY = "src/app/not-found.tsx";
const TRAIL = "src/components/shared/trail/trail.tsx";
const TRAIL_SHEET = "src/components/shared/trail/trail.css";

type Import = { spec: string; line: number };

/** Every module a file loads when it runs: static imports and re-exports, and `import()` calls. */
export function importsIn(text: string, fileName: string): Import[] {
  const source = ts.createSourceFile(
    fileName,
    text,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const found: Import[] = [];
  const at = (node: ts.Node) =>
    source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
  const visit = (node: ts.Node) => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      !node.importClause?.isTypeOnly
    ) {
      found.push({ spec: node.moduleSpecifier.text, line: at(node) });
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      !node.isTypeOnly
    ) {
      found.push({ spec: node.moduleSpecifier.text, line: at(node) });
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteralLike(node.arguments[0])
    ) {
      found.push({ spec: node.arguments[0].text, line: at(node) });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

/** Where the walk reads from: the repo on disk, or (in the scan's own tests) a map of files. */
type Files = {
  read: (rel: string) => string;
  exists: (rel: string) => boolean;
};

const DISK: Files = {
  read: (rel) => readFileSync(join(ROOT, rel), "utf8"),
  exists: (rel) => existsSync(join(ROOT, rel)),
};

const EXTENSIONS = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];

/** The repo file a specifier names, when it is ours (`@/`, or relative); packages are not this walk's. */
function resolve(from: string, spec: string, files: Files): string | null {
  const base = spec.startsWith("@/")
    ? `src/${spec.slice(2)}`
    : spec.startsWith(".")
      ? posix.join(dirname(from), spec)
      : null;
  if (base === null) return null;
  for (const ext of EXTENSIONS) {
    const candidate = `${base}${ext}`;
    if (/\.\w+$/.test(candidate) && files.exists(candidate)) return candidate;
  }
  return null;
}

/** The stylesheets a walk from `entry` reaches, each with the file that imports it, and every file visited. */
function walk(entry: string, files: Files = DISK) {
  const visited = new Set<string>([entry]);
  const sheets: string[] = [];
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.shift()!;
    if (!/\.tsx?$/.test(file)) continue;
    for (const { spec, line } of importsIn(files.read(file), file)) {
      if (spec.endsWith(".css")) {
        sheets.push(`${file}:${line}  ${spec}`);
        continue;
      }
      const next = resolve(file, spec, files);
      if (next && !visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }
  return { visited, sheets };
}

describe("the root 404's import graph", () => {
  const { visited, sheets } = walk(ENTRY);

  it("reaches the trail it draws, through the whole graph it can run", () => {
    // A walk that reaches nothing passes silently: pin that it found the 404's chrome and the trail.
    expect(visited.size, "the walk found almost nothing").toBeGreaterThan(20);
    expect(visited).toContain(TRAIL);
    expect(visited).toContain(
      "src/components/marketing/chrome/marketing-header.tsx",
    );
  });

  it("imports no stylesheet, which Next would preload on every route", () => {
    expect(
      sheets,
      `A stylesheet is imported under the root not-found.tsx, so Next preloads it on EVERY route ` +
        `("preloaded but not used", site-wide). Put its rules in src/app/globals.css (\`@import\` the file there) ` +
        `and leave the component with no CSS import:\n${sheets.join("\n")}`,
    ).toEqual([]);
  });
});

describe("the trail's rules still reach the 404", () => {
  it("are loaded by globals.css, which every page loads", () => {
    expect(existsSync(join(ROOT, TRAIL_SHEET))).toBe(true);
    const globals = readFileSync(
      join(ROOT, "src/app/globals.css"),
      "utf8",
    ).replace(/\/\*[\s\S]*?\*\//g, "");
    // The relative path the `@import` resolves from src/app/, so a moved sheet breaks here and not in a browser.
    const wanted = `@import "${posix.relative("src/app", TRAIL_SHEET)}";`;
    expect(globals).toContain(wanted);
  });

  it("are not imported by the component, which would put them back on the 404's list", () => {
    const own = importsIn(readFileSync(join(ROOT, TRAIL), "utf8"), TRAIL);
    expect(own.filter((i) => i.spec.endsWith(".css"))).toEqual([]);
  });
});

describe("the scan itself", () => {
  const specs = (code: string, name = "f.tsx") =>
    importsIn(code, name).map((i) => i.spec);

  it("finds every way a file loads another", () => {
    expect(specs(`import "./a.css";`)).toEqual(["./a.css"]);
    expect(specs(`import x from "./b";`)).toEqual(["./b"]);
    expect(specs(`import { y } from "@/c";`)).toEqual(["@/c"]);
    expect(specs(`export { z } from "./d";`)).toEqual(["./d"]);
    expect(specs(`export * from "./e";`)).toEqual(["./e"]);
    expect(specs(`const L = dynamic(() => import("./f"));`)).toEqual(["./f"]);
    expect(specs(`import "./g.module.css";`)).toEqual(["./g.module.css"]);
  });

  it("leaves a type-only import out: it is erased and loads nothing", () => {
    expect(specs(`import type { T } from "./a.css";`)).toEqual([]);
    expect(specs(`import { type T } from "./b";`)).toEqual(["./b"]);
    expect(specs(`export type { U } from "./c";`)).toEqual([]);
  });

  it("walks through a dynamic import to the sheet two files down, and past a type-only one", () => {
    const map: Record<string, string> = {
      "src/app/not-found.tsx": `import dynamic from "next/dynamic"; import type { P } from "@/lib/p.css"; const T = dynamic(() => import("@/components/t"));`,
      "src/components/t.tsx": `import { u } from "./u"; export const T = u;`,
      "src/components/u.ts": `import "./u.css"; export const u = 1;`,
    };
    const files: Files = {
      read: (rel) => map[rel],
      exists: (rel) => rel in map,
    };
    const { visited, sheets } = walk("src/app/not-found.tsx", files);
    expect([...visited]).toEqual([
      "src/app/not-found.tsx",
      "src/components/t.tsx",
      "src/components/u.ts",
    ]);
    expect(sheets).toEqual(["src/components/u.ts:1  ./u.css"]);
  });

  it("finds nothing under a graph with no sheet in it", () => {
    const map: Record<string, string> = {
      "src/app/not-found.tsx": `import { a } from "@/lib/a";`,
      "src/lib/a.ts": `export const a = 1;`,
    };
    const files: Files = {
      read: (rel) => map[rel],
      exists: (rel) => rel in map,
    };
    expect(walk("src/app/not-found.tsx", files).sheets).toEqual([]);
  });
});
