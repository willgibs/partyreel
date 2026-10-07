import { existsSync, readFileSync } from "node:fs";
import { dirname, join, posix } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

import { filesUnder } from "@/testing/source-tree";

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
 *
 * ★ EVERY GROUP'S 404 IS THE SAME RULE (crumbs-25). A route group's or segment's own `not-found.tsx` is
 * rendered into every page UNDER it by the same mechanism, so the screen it drew rode each of them: the guest
 * link's about 17.5 KB of HTML on every album load (6 KB gzipped, most of it `GuestBar`'s wordmark path), the
 * guest profile's about 14.7 KB, the host app's about
 * 3.5 KB on every dashboard page and the portal's about 2.2 KB. Each now keeps its metadata and renders one
 * reference into the ONE boundary (`not-found.lazy.tsx`, the root's: a boundary per group was built first, and
 * each carried its own copy of `next/dynamic`'s runtime, 1.3 KB gzipped on every page of the group, more than a
 * small screen had cost), whose `import()` loads the `not-found.screen.tsx` beside the group's file. `GROUPS`
 * names them, and a `not-found.tsx` that is not named there fails the sweep.
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

  it("reaches each surface's and each group's screen through exactly one lazy edge of the boundary", () => {
    const edges = (list: typeof lazy) =>
      list.map((e) => `${e.from} -> ${e.to} (${e.spec})`).sort();
    expect(edges(lazy)).toEqual(
      edges([
        { from: BOUNDARY, to: SITE, spec: "./not-found.site" },
        {
          from: BOUNDARY,
          to: ADMIN,
          spec: "@/components/admin/admin-not-found-screen",
        },
        ...GROUPS.map((g) => ({
          from: BOUNDARY,
          to: g.screen,
          spec: `./${g.screen.slice("src/app/".length).replace(/\.tsx$/, "")}`,
        })),
      ]),
    );
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

/**
 * Every route group's or segment's own 404: where it lives, and the parts of the 404 its screen must still
 * reach (what it drew before it moved behind the boundary: the test that the move lost nothing).
 *
 * `drawnBy` is each page that draws the screen ITSELF, for a link that names nothing (stale-link: a thrown
 * `notFound()` is served as Next's white error shell, so the guest link and the profile never throw one; crumbs-28
 * gave the host app's event pages and the portal's record pages the same answer), and the one line where each does.
 * Rendered only there, the screen rides no found page's payload, which is what the boundary exists to keep; and
 * those pages already reach every client part the screen has (the group's own `error.tsx` draws the same shared
 * screen, its buttons and its links), so importing it costs a found page nothing (measured on `next start` for the
 * album and the profile: their HTML byte for byte as before).
 */
type Group = {
  name: string;
  dir: string;
  draws: string[];
  drawnBy?: { page: string; line: string }[];
};

const GROUP_LIST: Group[] = [
  {
    name: "guest link",
    dir: "src/app/(guest)/e/[token]",
    draws: [
      "src/components/guest/guest-bar.tsx",
      "src/components/shared/not-found-screen.tsx",
      "src/components/ui/button.tsx",
    ],
    drawnBy: [
      {
        page: "src/app/(guest)/e/[token]/page.tsx",
        line: "if (!door) return <GuestNotFoundScreen />;",
      },
    ],
  },
  {
    name: "guest profile",
    dir: "src/app/(guest)/u/[slug]",
    draws: [
      "src/components/guest/guest-bar.tsx",
      "src/components/shared/not-found-screen.tsx",
      "src/components/ui/button.tsx",
    ],
    drawnBy: [
      {
        page: "src/app/(guest)/u/[slug]/page.tsx",
        line: "if (!profile) return <ProfileNotFoundScreen />;",
      },
    ],
  },
  {
    name: "host app",
    dir: "src/app/(app)",
    draws: [
      "src/components/shared/not-found-screen.tsx",
      "src/components/ui/button.tsx",
    ],
    // Review and Guests stand over the hub now (event-header r2, `rooms=over`): their routes only redirect into
    // it, and the hub draws the screen for them.
    drawnBy: [
      "src/app/(app)/dashboard/[eventId]/page.tsx",
      "src/app/(app)/dashboard/[eventId]/reel/page.tsx",
    ]
      .map((page) => ({
        page,
        line: "if (!event) return <AppNotFoundScreen />;",
      }))
      .concat({
        // The print sheet, one of the event's pages outside the group (crumbs-30): the print group draws no shell, so
        // the screen rides in the shell's gutter (`PrintNotFound`), and the root's `error.tsx` already brings the
        // sheet every client part the screen has.
        page: "src/app/(print)/dashboard/[eventId]/print/page.tsx",
        line: "if (!event) return <PrintNotFound />;",
      })
      .concat({
        // See it as a guest, the event's page in a group of its own for the same reason (`rooms=over`): no host
        // shell over a guest's view, so the screen stands in the guest canvas (`AsGuestNotFound`).
        page: "src/app/(as-guest)/dashboard/[eventId]/as-guest/page.tsx",
        line: "if (!view) return <AsGuestNotFound />;",
      }),
  },
  {
    name: "operations portal",
    dir: "src/app/admin",
    draws: [
      "src/components/shared/not-found-screen.tsx",
      "src/components/ui/button.tsx",
    ],
    drawnBy: [
      {
        page: "src/app/admin/albums/[eventId]/page.tsx",
        line: "if (!album) return <AdminNotFoundPageScreen />;",
      },
      {
        page: "src/app/admin/accounts/[id]/page.tsx",
        line: "if (!account) return <AdminNotFoundPageScreen />;",
      },
    ],
  },
];

const GROUPS = GROUP_LIST.map((g) => ({
  ...g,
  entry: `${g.dir}/not-found.tsx`,
  screen: `${g.dir}/not-found.screen.tsx`,
}));

/** Every source file that imports one of the not-found modules, by the module it imports. */
function importersOfNotFoundModules(): Map<string, string[]> {
  const found = new Map<string, string[]>();
  const files = filesUnder("src").filter(
    (f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f),
  );
  for (const file of files) {
    const text = DISK.read(file);
    if (!/not-found\.(lazy|screen|site)/.test(text)) continue;
    for (const { spec } of importsIn(text, file)) {
      const target = resolve(file, spec, DISK);
      if (!target || !/not-found\.(lazy|screen|site)\.tsx$/.test(target))
        continue;
      found.set(target, [...(found.get(target) ?? []), file].sort());
    }
  }
  return found;
}

describe.each(GROUPS)("the $name 404's eager import graph", (group) => {
  const { visited, sheets, lazy } = walk(group.entry);

  it("reaches the one boundary, which is a client module so its import() is a real split", () => {
    // A walk that found nothing would pass everything below: pin that it reached the boundary it must.
    expect(visited).toContain(BOUNDARY);
  });

  it("draws nothing itself: no component module but the boundary is imported eagerly", () => {
    // A Server Component under a not-found renders its whole output into EVERY page under it (an album, a
    // dashboard page, a marketing page), and a client one rides it as a reference whose chunk each fetches.
    const components = [...visited].filter(
      (f) => f.endsWith(".tsx") && f !== group.entry && f !== BOUNDARY,
    );
    expect(
      components,
      `${group.entry} imports a component EAGERLY, so every page under it carries it. Draw it inside the ` +
        `screen ${BOUNDARY} loads instead:\n${components.join("\n")}`,
    ).toEqual([]);
  });

  it("carries no client island but the boundary, whose chunk every page fetches already", () => {
    const clients = [...visited].filter(
      (f) => f !== BOUNDARY && isClientModule(DISK.read(f)),
    );
    expect(clients).toEqual([]);
  });

  it("imports no stylesheet, which Next would preload on every page under it", () => {
    expect(
      sheets,
      `a stylesheet is imported eagerly under ${group.entry}`,
    ).toEqual([]);
  });

  it("has its screen behind exactly one lazy edge of the boundary", () => {
    const own = lazy.filter((edge) => edge.to === group.screen);
    expect(own).toEqual([
      {
        from: BOUNDARY,
        to: group.screen,
        spec: `./${group.screen.slice("src/app/".length).replace(/\.tsx$/, "")}`,
      },
    ]);
  });

  it("the screen still draws what the 404 drew", () => {
    const screen = walk(group.screen);
    for (const file of group.draws) {
      expect(
        screen.visited,
        `${group.screen} no longer reaches ${file}`,
      ).toContain(file);
    }
  });

  it("nothing but the boundary loads the screen, which would put the 404 back on every page", () => {
    // The design lab draws a screen as it ships (a board's "today"): its pages are routes of their own, so a
    // screen imported there rides no production page. Nor does the page that draws its own 404 (`drawnBy`),
    // which renders it on one line, for a link that names nothing, and nowhere else.
    const importers = (
      importersOfNotFoundModules().get(group.screen) ?? []
    ).filter((file) => !file.startsWith("src/app/(dev)/"));
    const drawnBy = group.drawnBy ?? [];
    expect(importers).toEqual([BOUNDARY, ...drawnBy.map((d) => d.page)].sort());
    for (const { page: file, line } of drawnBy) {
      const page = DISK.read(file);
      const component = /return <(\w+) \/>;$/.exec(line)?.[1];
      expect(page, file).toContain(line);
      expect(page.split(`<${component}`).length - 1, file).toBe(1);
    }
  });
});

describe("the one boundary is loaded by the 404s and nothing else", () => {
  it("is imported by the root's not-found.tsx and each group's, and by no page or layout", () => {
    expect(importersOfNotFoundModules().get(BOUNDARY)).toEqual(
      [ENTRY, ...GROUPS.map((g) => g.entry)].sort(),
    );
  });
});

describe("every not-found.tsx under app/ draws nothing itself", () => {
  const entries = filesUnder("src/app").filter(
    (f) => f === "src/app/not-found.tsx" || f.endsWith("/not-found.tsx"),
  );

  it("finds the root's and each group's", () => {
    expect(entries).toContain(ENTRY);
    for (const group of GROUPS) expect(entries).toContain(group.entry);
  });

  it("names every one in this file, so a new 404 gets the boundary before it costs a page anything", () => {
    const known = new Set([ENTRY, ...GROUPS.map((g) => g.entry)]);
    const unnamed = entries.filter((f) => !known.has(f));
    expect(
      unnamed,
      `a not-found.tsx this test does not name: it is rendered into EVERY page under it. Give it the root's ` +
        `shape (a not-found.screen.tsx beside it, loaded from app/not-found.lazy.tsx) and add it to GROUPS:\n${unnamed.join("\n")}`,
    ).toEqual([]);
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
