import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { entries } from "@/testing/source-tree";

import { BOARDS } from "../sandbox/registry";
import { LAB_REDIRECTS, TRACED_DOC_GLOBS } from "./legacy-routes";

/**
 * THE OLD LAB URLS, HELD AGAINST THE TREE.
 *
 * A redirect is a promise made in config and nothing in Next keeps it: a
 * destination that names no page 307s straight into a 404, the key it forwarded
 * travelling along for nothing. So every destination in the table is resolved to
 * the page file the App Router would serve for it (strip the /design/ prefix,
 * walk into the (shell) group, a `:param` segment landing in its `[param]`
 * directory) and that file must exist. The dynamic case gets the whole
 * population: `/design/lab/:board` is served by the board page only for a
 * folder that holds a board, so every standing board is expanded and its
 * `board.tsx` looked for on disk. The traced-doc globs get the
 * same treatment, because a glob that matches nothing traces nothing, silently.
 */
const ROOT = process.cwd();
const SHELL = "src/app/(dev)/design/(shell)";
const BOARD_PAGE = `${SHELL}/lab/[board]/page.tsx`;

/** The page file the App Router serves for a lab path (`:x` -> `[x]`). */
function pageFor(path: string): string {
  const segments = path
    .replace(/^\/design\/?/, "")
    .split("/")
    .filter(Boolean)
    .map((s) => (s.startsWith(":") ? `[${s.slice(1)}]` : s));
  return join(SHELL, ...segments, "page.tsx");
}

const params = (path: string) => path.match(/:\w+/g) ?? [];
const sources = LAB_REDIRECTS.map((r) => r.source);
const destinations = LAB_REDIRECTS.map((r) => r.destination);

describe("the table itself", () => {
  it("has only lab paths on both sides", () => {
    for (const p of [...sources, ...destinations])
      expect(p, p).toMatch(/^\/design\/[a-z0-9\-/:]+$/);
  });

  it("names every source once", () => {
    expect(new Set(sources).size).toBe(sources.length);
  });

  it("never redirects a path to itself", () => {
    for (const { source, destination } of LAB_REDIRECTS)
      expect(source).not.toBe(destination);
  });

  it("never chains: no destination is itself a source", () => {
    for (const d of destinations) expect(sources, d).not.toContain(d);
  });

  it("names no dynamic segment in a destination that its source lacks", () => {
    // A retired dynamic page may land on one page for every value (its param
    // dropped); a destination naming a param the source never captured would
    // redirect to a literal `:param`.
    for (const { source, destination } of LAB_REDIRECTS)
      for (const p of params(destination))
        expect(params(source), `${source} -> ${destination}`).toContain(p);
  });
});

describe("every destination is a page on disk", () => {
  it.each(LAB_REDIRECTS)("$source -> $destination", ({ destination }) => {
    const page = pageFor(destination);
    expect(existsSync(join(ROOT, page)), page).toBe(true);
  });
});

/**
 * The board page 404s a folder with no `board.tsx` of its own
 * (`(shell)/lab/[board]/board-components.ts` finds boards by folder, as the
 * registry finds specs), so a spec whose board was never written is a board on
 * the desk that opens onto a 404.
 */
const hasBoard = (id: string) =>
  existsSync(join(ROOT, "src/app/(dev)/design/sandbox", id, "board.tsx"));

describe("the board destination serves every standing board", () => {
  const boardRedirects = LAB_REDIRECTS.filter(
    (r) => pageFor(r.destination) === BOARD_PAGE,
  );

  it("the old board URL still has a home", () => {
    expect(boardRedirects.length).toBeGreaterThan(0);
  });

  it.each(BOARDS.map((b) => b.id))("/design/lab/%s", (id) => {
    // One clean segment, or it would fall past [board] into a deeper route.
    expect(id).toMatch(/^[a-z0-9-]+$/);
    for (const { destination } of boardRedirects)
      expect(destination.replace(/:\w+/, id)).toBe(`/design/lab/${id}`);
    expect(hasBoard(id), `sandbox/${id}/ has no board.tsx`).toBe(true);
  });
});

/**
 * The tiny matcher: a literal path, or one `*` pattern in the basename of one
 * directory (`./docs/tracks/*.md`), which is every shape the trace list uses.
 * fast-glob is not a dependency and Node 22's fs.globSync is untyped under
 * @types/node 20; anything richer throws so it can never be a silent pass.
 */
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function matches(glob: string): string[] {
  const rel = glob.replace(/^\.\//, "");
  const cut = rel.lastIndexOf("/");
  const dir = cut === -1 ? "." : rel.slice(0, cut);
  const name = rel.slice(cut + 1);
  if (dir.includes("*")) throw new Error(`unsupported glob shape: ${glob}`);
  if (!name.includes("*")) return existsSync(join(ROOT, rel)) ? [rel] : [];
  if (!existsSync(join(ROOT, dir))) return [];
  const re = new RegExp(`^${name.split("*").map(escape).join(".*")}$`);
  return entries(dir)
    .filter((e) => !e.isDirectory && re.test(e.name))
    .map((e) => `${dir}/${e.name}`);
}

describe("the traced doc globs", () => {
  it.each(TRACED_DOC_GLOBS)("%s matches at least one file", (glob) => {
    expect(matches(glob), glob).not.toEqual([]);
  });
});

describe("next.config.ts wires both lists", () => {
  const config = readFileSync(join(ROOT, "next.config.ts"), "utf8");

  it("appends the redirects as temporary (a 307 forwards the key; nothing caches it)", () => {
    expect(config).toMatch(/LAB_REDIRECTS\.map\([\s\S]{0,80}permanent: false/);
  });

  it("traces the docs under the one /design/ key", () => {
    expect(config).toMatch(/"\/design\/":\s*TRACED_DOC_GLOBS/);
  });
});
