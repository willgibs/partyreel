import { existsSync, readFileSync } from "node:fs";
import { dirname, join, posix } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * THE ROOT 404 COSTS NOTHING ON A PAGE THAT IS NOT ONE (perf-404; the walk is crumbs-22's, which kept the
 * trail's sheet and code off every page, widened here to everything the 404 draws).
 *
 * Next renders the root `not-found.tsx` into EVERY route's payload: it is the root layout's not-found
 * fallback, built eagerly whether or not the route 404s. A Server Component under it serialises its whole
 * output into every page's HTML, and a client module under it is a reference whose chunks every page fetches
 * as the payload decodes (its stylesheets are preloaded too: crumbs-10 read "preloaded but not used" for
 * `trail.css` site-wide). Measured on `next start` against a 404 that drew nothing, the marketing chrome drawn
 * inline cost `/login`, `/pricing`, `/about`, `/help`, the home and the guest album about 110 KB of HTML and
 * 43 to 56 KB of gzipped JS each. So `not-found.tsx` draws nothing itself: it renders one reference into
 * `not-found.lazy.tsx`, a client module whose `import()`s are real splits (Next does not split a dynamic
 * import made from a Server Component), and each surface's screen loads behind it, on a 404 and nowhere else.
 *
 * The walk follows every import the 404 can execute at once: static, side-effect (`import "./x.css"`) and
 * re-export imports, and an `import()` made from a SERVER module (not split, so as good as static). It stops at
 * an `import()` made from a client module, which is the lazy edge. A type-only import is erased.
 */

const ROOT = process.cwd();
const ENTRY = "src/app/not-found.tsx";
const BOUNDARY = "src/app/not-found.lazy.tsx";
const SITE = "src/app/not-found.site.tsx";
const ADMIN = "src/components/admin/admin-not-found-screen.tsx";
const LAYOUT = "src/app/layout.tsx";
const TRAIL_FILES = [
  "src/components/shared/trail/trail.tsx",
  "src/components/shared/trail/trail-engine.ts",
  "src/components/shared/trail/trail-frames.ts",
];
const TRAIL = TRAIL_FILES[0];

type Import = { spec: string; line: number; dynamic: boolean };

/** Whether a module opens with the `"use client"` directive. */
export function isClientModule(text: string): boolean {
  const source = ts.createSourceFile(
    "f.tsx",
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  for (const statement of source.statements) {
    if (
      !ts.isExpressionStatement(statement) ||
      !ts.isStringLiteral(statement.expression)
    )
      return false;
    if (statement.expression.text === "use client") return true;
  }
  return false;
}

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
      found.push({
        spec: node.moduleSpecifier.text,
        line: at(node),
        dynamic: false,
      });
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      !node.isTypeOnly
    ) {
      found.push({
        spec: node.moduleSpecifier.text,
        line: at(node),
        dynamic: false,
      });
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteralLike(node.arguments[0])
    ) {
      found.push({
        spec: node.arguments[0].text,
        line: at(node),
        dynamic: true,
      });
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

/**
 * What a walk from `entry` loads EAGERLY: every file visited, the stylesheets imported, and the lazy edges
 * it stopped at (an `import()` from a client module, with the file it names when that is ours).
 */
function walk(entry: string, files: Files = DISK) {
  const visited = new Set<string>([entry]);
  const sheets: string[] = [];
  const lazy: { from: string; to: string | null; spec: string }[] = [];
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.shift()!;
    if (!/\.tsx?$/.test(file)) continue;
    const text = files.read(file);
    const client = isClientModule(text);
    for (const { spec, line, dynamic } of importsIn(text, file)) {
      if (dynamic && client) {
        lazy.push({ from: file, to: resolve(file, spec, files), spec });
        continue;
      }
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
  return { visited, sheets, lazy };
}

describe("the root 404's eager import graph", () => {
  const { visited, sheets, lazy } = walk(ENTRY);

  it("reaches the boundary, and the boundary is a client module so its import() is a real split", () => {
    // A walk that found nothing would pass everything below: pin that it reached the boundary it must.
    expect(visited).toContain(BOUNDARY);
    expect(
      isClientModule(DISK.read(BOUNDARY)),
      "not-found.lazy.tsx must be a client module",
    ).toBe(true);
  });

  it("draws nothing itself: no component module but the boundary is imported eagerly", () => {
    // A .tsx under the 404 is a component: a Server Component renders its whole output into EVERY page's
    // payload, and a client one rides it as a reference whose chunk every page fetches. Plain modules (the
    // surface rule, the env) run on the server and cost a page nothing.
    const components = [...visited].filter(
      (f) => f.endsWith(".tsx") && f !== ENTRY && f !== BOUNDARY,
    );
    expect(
      components,
      `The root not-found.tsx imports a component EAGERLY, so every route carries it (the 404's chrome ` +
        `once cost every page about 110 KB of HTML and 43 to 56 KB of gzipped JS). Draw it inside the screen ` +
        `not-found.lazy.tsx loads instead:\n${components.join("\n")}`,
    ).toEqual([]);
  });

  it("carries no client island but the boundary, whose chunk would be fetched on every page", () => {
    const clients = [...visited].filter(
      (f) => f !== BOUNDARY && isClientModule(DISK.read(f)),
    );
    expect(clients).toEqual([]);
  });

  it("imports no stylesheet, which Next would preload on every route", () => {
    expect(
      sheets,
      `A stylesheet is imported EAGERLY under the root not-found.tsx, so Next preloads it on EVERY route ` +
        `("preloaded but not used", site-wide). Import it from the screen not-found.lazy.tsx loads, or put its ` +
        `rules in src/app/globals.css:\n${sheets.join("\n")}`,
    ).toEqual([]);
  });

  it("holds none of the trail's code, which would ride every page's payload", () => {
    for (const file of TRAIL_FILES) {
      expect(
        visited.has(file),
        `${file} is imported eagerly under the root not-found.tsx: reach it through not-found.lazy.tsx`,
      ).toBe(false);
    }
  });

  it("reaches each surface's screen through exactly one lazy edge of the boundary", () => {
    expect(lazy).toEqual([
      { from: BOUNDARY, to: SITE, spec: "./not-found.site" },
      {
        from: BOUNDARY,
        to: ADMIN,
        spec: "@/components/admin/admin-not-found-screen",
      },
    ]);
  });
});

describe("the screens behind the boundary still draw the whole 404", () => {
  it("the site's reaches its chrome, its words and the trail, whose sheet the chunk brings with it", () => {
    const site = walk(SITE);
    for (const file of [
      "src/components/marketing/chrome/marketing-header.tsx",
      "src/components/marketing/chrome/marketing-footer.tsx",
      "src/components/marketing/marketing-not-found.tsx",
      TRAIL,
    ]) {
      expect(
        site.visited,
        `the site's 404 no longer reaches ${file}`,
      ).toContain(file);
    }
    expect(
      site.sheets.some((s) => s.endsWith("./trail.css")),
      "trail.tsx no longer imports trail.css, and nothing else does: the 404's trail would be unstyled",
    ).toBe(true);
    expect(
      existsSync(join(ROOT, "src/components/shared/trail/trail.css")),
    ).toBe(true);
  });

  it("the root layout reaches neither screen, which would put the 404 back on every page", () => {
    const { visited } = walk(LAYOUT);
    expect(
      visited.size,
      "the layout's walk found almost nothing",
    ).toBeGreaterThan(3);
    for (const file of [SITE, ADMIN, BOUNDARY, TRAIL]) {
      expect(visited.has(file), `app/layout.tsx reaches ${file}`).toBe(false);
    }
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

  it("marks an import() as dynamic and leaves a type-only import out", () => {
    expect(importsIn(`const L = () => import("./a");`, "f.ts")).toMatchObject([
      { spec: "./a", dynamic: true },
    ]);
    expect(importsIn(`import { a } from "./a";`, "f.ts")).toMatchObject([
      { dynamic: false },
    ]);
    expect(specs(`import type { T } from "./a.css";`)).toEqual([]);
    expect(specs(`import { type T } from "./b";`)).toEqual(["./b"]);
    expect(specs(`export type { U } from "./c";`)).toEqual([]);
  });

  it("knows a client module by its directive, and only when it opens the file", () => {
    expect(isClientModule(`"use client";\nimport a from "./a";`)).toBe(true);
    expect(isClientModule(`'use client'\nexport const a = 1;`)).toBe(true);
    expect(isClientModule(`// note\n"use client";\nexport const a = 1;`)).toBe(
      true,
    );
    expect(isClientModule(`import a from "./a";\n"use client";`)).toBe(false);
    expect(isClientModule(`export const a = "use client";`)).toBe(false);
    expect(isClientModule(`export const a = 1;`)).toBe(false);
  });

  const fake = (map: Record<string, string>): Files => ({
    read: (rel) => map[rel],
    exists: (rel) => rel in map,
  });

  it("stops at an import() made from a client module, and follows one made from a server module", () => {
    const client = walk(
      "src/app/not-found.tsx",
      fake({
        "src/app/not-found.tsx": `import { W } from "@/components/w";`,
        "src/components/w.tsx": `"use client";\nimport dynamic from "next/dynamic";\nexport const W = dynamic(() => import("./t"));`,
        "src/components/t.tsx": `import "./t.css";\nexport const T = 1;`,
      }),
    );
    expect([...client.visited]).toEqual([
      "src/app/not-found.tsx",
      "src/components/w.tsx",
    ]);
    expect(client.sheets).toEqual([]);
    expect(client.lazy).toEqual([
      { from: "src/components/w.tsx", to: "src/components/t.tsx", spec: "./t" },
    ]);

    // The same wrapper without the directive is a Server Component's dynamic import: not split, so its sheet counts.
    const server = walk(
      "src/app/not-found.tsx",
      fake({
        "src/app/not-found.tsx": `import { W } from "@/components/w";`,
        "src/components/w.tsx": `import dynamic from "next/dynamic";\nexport const W = dynamic(() => import("./t"));`,
        "src/components/t.tsx": `import "./t.css";\nexport const T = 1;`,
      }),
    );
    expect(server.sheets).toEqual(["src/components/t.tsx:1  ./t.css"]);
    expect(server.lazy).toEqual([]);
  });

  it("walks through static imports to a sheet several files down, and past a type-only one", () => {
    const { visited, sheets } = walk(
      "src/app/not-found.tsx",
      fake({
        "src/app/not-found.tsx": `import type { P } from "@/lib/p.css"; import { t } from "@/components/t";`,
        "src/components/t.tsx": `import { u } from "./u"; export const t = u;`,
        "src/components/u.ts": `import "./u.css"; export const u = 1;`,
      }),
    );
    expect([...visited]).toEqual([
      "src/app/not-found.tsx",
      "src/components/t.tsx",
      "src/components/u.ts",
    ]);
    expect(sheets).toEqual(["src/components/u.ts:1  ./u.css"]);
  });
});
