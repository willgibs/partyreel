import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { describe, expect, it } from "vitest";

import { SANDBOX } from "../touchpoints";
import { LAB_REDIRECTS, TRACED_DOC_GLOBS } from "./legacy-routes";

/**
 * THE OLD LAB URLS, HELD AGAINST THE TREE (the Library x Lab round, 2026-09-15).
 *
 * A redirect is a promise made in config and nothing in Next keeps it: a
 * destination that names no page 307s straight into a 404, the key it forwarded
 * travelling along for nothing. So every destination in the table is resolved to
 * the page file the App Router would serve for it (strip the /design/ prefix,
 * walk into the (shell) group, a `:param` segment landing in its `[param]`
 * directory) and that file must exist. The dynamic case gets the whole
 * population: `/design/lab/:board` is served by the board page only for an id
 * its dispatcher knows, so every standing board in SANDBOX is expanded and
 * looked up in the map the page dispatches from. The traced-doc globs get the
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

  it("carries every dynamic segment across (the same params on both sides)", () => {
    for (const { source, destination } of LAB_REDIRECTS)
      expect(params(destination), source).toEqual(params(source));
  });
});

describe("every destination is a page on disk", () => {
  it.each(LAB_REDIRECTS)("$source -> $destination", ({ destination }) => {
    const page = pageFor(destination);
    expect(existsSync(join(ROOT, page)), page).toBe(true);
  });
});

/**
 * The board page 404s any id missing from the map it indexes by
 * `ruling.id as SandboxId`, and that cast hides a board registered in
 * touchpoints.ts but never wired. The map is found by following the page's own
 * source (the name it indexes, the module it imports that from, the keys at the
 * top of that object literal), so a rename or a move is followed, not pinned.
 */
function dispatchedIds(): string[] {
  const page = readFileSync(join(ROOT, BOARD_PAGE), "utf8");
  const name = page.match(/(\w+)\[ruling\.id as SandboxId\]/)?.[1];
  if (!name) return [];
  const from = page.match(
    new RegExp(`import \\{[^}]*\\b${name}\\b[^}]*\\} from "([^"]+)"`),
  )?.[1];
  const file = from ? resolveImport(from) : BOARD_PAGE;
  if (!file) return [];
  const body = readFileSync(join(ROOT, file), "utf8").match(
    new RegExp(`\\b${name}\\b[^=]*=\\s*\\{([\\s\\S]*?)\\n\\};`),
  )?.[1];
  return topLevelKeys(body ?? "");
}

function resolveImport(spec: string): string | undefined {
  const stem = spec.startsWith("@/")
    ? join("src", spec.slice(2))
    : join(dirname(BOARD_PAGE), spec);
  return [".ts", ".tsx", "/index.ts", "/index.tsx"]
    .map((ext) => stem + ext)
    .find((f) => existsSync(join(ROOT, f)));
}

/** The keys at brace depth zero of an object literal's body. */
function topLevelKeys(body: string): string[] {
  const keys: string[] = [];
  let depth = 0;
  for (const line of body.split("\n")) {
    const key =
      depth === 0 ? line.match(/^\s*(?:"([^"]+)"|([\w$]+))\s*:/) : null;
    if (key) keys.push(key[1] ?? key[2]);
    for (const ch of line)
      depth += "{[(".includes(ch) ? 1 : "}])".includes(ch) ? -1 : 0;
  }
  return keys;
}

describe("the board destination serves every standing board", () => {
  const boardRedirects = LAB_REDIRECTS.filter(
    (r) => pageFor(r.destination) === BOARD_PAGE,
  );
  const dispatched = dispatchedIds();

  it("the old board URL still has a home, and the board page still has a map", () => {
    expect(boardRedirects.length).toBeGreaterThan(0);
    expect(dispatched.length).toBeGreaterThan(0);
  });

  it.each(SANDBOX.map((r) => r.id))("/design/lab/%s", (id) => {
    // One clean segment, or it would fall past [board] into a deeper route.
    expect(id).toMatch(/^[a-z0-9-]+$/);
    for (const { destination } of boardRedirects)
      expect(destination.replace(/:\w+/, id)).toBe(`/design/lab/${id}`);
    expect(dispatched).toContain(id);
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
  return readdirSync(join(ROOT, dir), { withFileTypes: true })
    .filter((e) => e.isFile() && re.test(e.name))
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
