/**
 * THE ONE WALK OF THE TREE (test-slim). Every test that reads the repository as data (a policy scanning the app's
 * source, a SQL guard reading the migrations, a check on the docs, the help articles or `public/`) lists its files
 * here: about 120 tests each carried a walker of their own, six lines apiece with six different ideas of what to
 * skip, and each re-read and re-parsed the whole tree inside its own process. `walk-policy.test.ts` refuses a
 * directory listing anywhere else in the suite, so a new policy starts from this file instead of another copy.
 *
 * The repository's own files are read once per test file (vitest isolates each file, so nothing is shared across
 * files, and no test writes into the repository, so nothing goes stale inside one): two policies in one file walk,
 * read and parse once. An ABSOLUTE path (a test's own fixtures in a temporary folder, which it writes and lists
 * again) is read fresh every time.
 *
 * ★ A WHOLE-TREE PARSE IS THE EXPENSIVE PART, so a policy that hunts one shape parses only the files whose text could
 * hold it: `sources().filter((p) => read(p).includes("signOut"))` before `syntax(p)`. Parsing all 1,800 sources with
 * parents set takes about two seconds of one core (alone; up to nine inside a loaded gate, where such scans timed out
 * more than once), and a token filter takes it to the dozen files that matter. The token must be one the offending
 * shape cannot be written without (the call's name, the attribute's name), never a guess at a likely spelling.
 *
 * ★ A WALK OF THE REPOSITORY THAT FINDS NOTHING THROWS. A guard over an empty list passes silently, and the cause is
 * always a path (a folder renamed, a checkout under a surprising root): `filesUnder` and `entries` refuse a missing
 * or empty folder of the repository, so no caller needs its own "the scan found files" count to learn the walk ran.
 * A test's own temporary folder may be empty: that is a state its test reads, never a broken walk.
 */
import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { isAbsolute, join, resolve, sep } from "node:path";

import type * as TS from "typescript";

/** The repository's root: vitest runs from it, so a relative path here is relative to it. */
export const ROOT = process.cwd();

const posix = (path: string) =>
  (sep === "/" ? path : path.split(sep).join("/")).replace(/\/+$/, "");

/** Only the repository's own files are remembered: a test's temporary folder changes under it. */
const remembered = <T>(
  cache: Map<string, T>,
  path: string,
  load: () => T,
): T => {
  if (isAbsolute(path)) return load();
  let value = cache.get(path);
  if (value === undefined) {
    value = load();
    cache.set(path, value);
  }
  return value;
};

const listings = new Map<string, readonly string[]>();

/** Folders that are never the repository's own source: installed packages, build output, git's store. */
const NOT_OURS = new Set(["node_modules", ".next", ".git"]);

function walk(at: string, prefix: string, out: string[]): string[] {
  for (const entry of readdirSync(at, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!NOT_OURS.has(entry.name))
        walk(join(at, entry.name), `${prefix}/${entry.name}`, out);
    } else if (entry.isFile()) {
      out.push(`${prefix}/${entry.name}`);
    }
  }
  return out;
}

/**
 * Every FILE under `dir`, at any depth, as `dir/<path>` with forward slashes, sorted. `dir` is relative to the
 * repository's root (`"src"`, `"supabase/migrations"`, `"src/components/marketing"`); an absolute folder comes back
 * as absolute paths. A `node_modules`, `.next` or `.git` folder is never entered (a worker's installed packages
 * would be thousands of files no test means).
 */
export function filesUnder(dir: string): readonly string[] {
  const key = posix(dir);
  return remembered(listings, key, () => {
    const files = walk(resolve(ROOT, key), key, []).sort();
    if (files.length === 0 && !isAbsolute(key))
      throw new Error(`source-tree: no files under ${key}`);
    return files;
  });
}

export type Entry = { name: string; isDirectory: boolean };

/**
 * The names directly inside `dir`, files and folders alike, sorted: a folder's own roster (the sandbox's boards, the
 * admin portal's segments, a folder of articles), where `filesUnder` would reach into the subfolders. Never
 * remembered, so a test that writes into its own folder lists what is there now.
 */
export function entries(dir: string): readonly Entry[] {
  const listed = readdirSync(resolve(ROOT, posix(dir)), { withFileTypes: true })
    .map((entry) => ({ name: entry.name, isDirectory: entry.isDirectory() }))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  if (listed.length === 0 && !isAbsolute(dir))
    throw new Error(`source-tree: nothing in ${dir}`);
  return listed;
}

/** No test, no declaration file and not the generated `src/lib/db/types.ts`, which no policy is about. */
const NOT_SOURCE = /\.test\.tsx?$|\.d\.ts$|^src\/lib\/db\/types\.ts$/;

/**
 * Every `.ts` and `.tsx` file under `dir` (default `src`) but tests, declarations and the generated database types:
 * the source the policies read. A test helper (`testing/`, `test-utils/`) is source here, as it always was to them.
 */
export function sources(dir = "src"): readonly string[] {
  return filesUnder(dir).filter(
    (path) => /\.tsx?$/.test(path) && !NOT_SOURCE.test(path),
  );
}

const texts = new Map<string, string>();

/** A file's text: a path from `filesUnder` or `sources`, or any path relative to the repository's root. */
export function read(path: string): string {
  return remembered(texts, path, () =>
    readFileSync(resolve(ROOT, path), "utf8"),
  );
}

// TypeScript loads on the first parse, never in a test that only lists or reads: a tenth of a second per test
// file, and most of this module's callers never parse.
let typescript: typeof TS | undefined;
const loadTypescript = () =>
  (typescript ??= createRequire(import.meta.url)("typescript") as typeof TS);

const trees = new Map<string, TS.SourceFile>();

/**
 * A source file's syntax tree, parsed once, with parents set (so `node.parent`, `node.getText()` and
 * `node.getStart()` work without the file handed in). JSX parses in a `.tsx` file only, as the compiler's does.
 */
export function syntax(path: string): TS.SourceFile {
  return remembered(trees, path, () => {
    const ts = loadTypescript();
    return ts.createSourceFile(
      path,
      read(path),
      ts.ScriptTarget.Latest,
      true,
      path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
  });
}

/** The 1-based line a node starts on. */
export function lineOf(
  node: TS.Node,
  tree: TS.SourceFile = node.getSourceFile(),
): number {
  return tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1;
}
