#!/usr/bin/env node
/**
 * THE LAB'S SCOPE (the lab revamp, 2026-09-29): what a change touched, in the
 * lab's own terms, so `lab:smoke` and `lab:demo` (and the kit's gate) run the
 * boards a merge changed rather than every board on the desk.
 *
 *   node scripts/lab-scope.mjs                      # this tree against origin/launch-prep
 *   node scripts/lab-scope.mjs --since HEAD^1       # a merge against its first parent
 *   git diff --name-only A B | node scripts/lab-scope.mjs --stdin
 *   node scripts/lab-scope.mjs --since HEAD^1 --json
 *   FULL=1 node scripts/lab-scope.mjs               # the whole lab, whatever changed
 *
 * It answers four things: `all` (the whole lab: the kit, the shell, the
 * registry, a config file, or a path it does not know), `boards` (the board
 * folders a change reaches: its own folder, its ledger, or a production file
 * its drawings import), `library` (the Library, which renders the product's
 * components, so any production path reaches it) and `shell` (the lab's own
 * pages: the desk, the kit, the tools, the tracks and the proposals; the desk
 * alone rides along with any board, since it lists every board). And
 * `premise`: the boards whose `lives` a change touched, whose open asks may
 * describe code that just moved (ROADMAP's "an open ask whose premise rots").
 *
 * ★ IT NEVER NARROWS ON DOUBT. A path it cannot class, a diff git cannot take
 * and `FULL=1` all answer `all`: a scope too wide costs minutes, one too narrow
 * ships a broken board. Tests, supabase/, workers/, usher/ and prose reach
 * nothing the lab renders.
 *
 * Node builtins plus the repo's TypeScript (a dev dependency): a board's imports
 * are read with `ts.preProcessFile`, never by importing the board.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, normalize } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");

export const SANDBOX = "src/app/(dev)/design/sandbox";
const DESIGN = "src/app/(dev)/design";
const REVIEWS = "docs/reviews";

/** The folders under sandbox/ that hold a spec: the standing boards. */
export function boardFolders(root) {
  const dir = join(root, SANDBOX);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(dir, e.name, "spec.ts")))
    .map((e) => e.name)
    .sort();
}

/* ── one path, classed ───────────────────────────────────────────────────── */

const CONFIG_ALL =
  /^(?:package\.json|pnpm-lock\.yaml|next\.config\.[cm]?[jt]s|tsconfig\.json|postcss\.config\.[cm]?[jt]s|src\/proxy\.ts|src\/instrumentation[^/]*)$/;
const CONFIG_NONE =
  /^(?:vitest\.(?:config|setup)\.[cm]?[jt]s|eslint\.config\.[cm]?[jt]s|\.prettier[^/]*|\.gitignore|\.nvmrc|\.github\/.*|\.claude\/.*|\.agents\/.*|README\.md|AGENTS\.md|CLAUDE\.md)$/;
/** The files every lab page renders through, so a change to one is the whole lab. */
const RENDERS_ALL =
  /^src\/app\/(?:globals\.css|theme\.css|layout\.tsx|error\.tsx|global-error\.tsx|not-found\.tsx)$|^src\/lib\/design-gate\//;

/**
 * What one changed path reaches: `{ all }`, `{ board }`, `{ library }`,
 * `{ shell }`, `{ production }` (a src/ path outside the lab, resolved to the
 * boards that import it later), `{ none }`, each with the reason.
 */
export function classify(path, folders) {
  const p = path.trim();
  if (!p) return { none: true };
  if (/\.test\.[cm]?[jt]sx?$/.test(p)) return { none: true, why: "a test" };
  if (/^(?:supabase|workers|usher|kit)\//.test(p))
    return { none: true, why: "outside what the lab renders" };
  if (CONFIG_NONE.test(p))
    return { none: true, why: "tooling the lab never renders" };
  if (CONFIG_ALL.test(p))
    return { all: true, why: `${p} (every page builds through it)` };
  if (RENDERS_ALL.test(p))
    return { all: true, why: `${p} (every page renders through it)` };

  // The ledgers: a board's own changes what its steps ask; the window's and
  // the Library's change the desk.
  const ledger = p.match(/^docs\/reviews\/([a-z0-9-]+)\.json$/);
  if (ledger)
    return folders.includes(ledger[1])
      ? { board: ledger[1], why: `its ledger` }
      : { shell: true, why: `${p} (the desk reads it)` };
  if (/^docs\/.*\.(?:[cm]?[jt]sx?|css)$/.test(p))
    return { all: true, why: `${p} (code under docs/)` };
  // The desk, the tracks and the proposals pages read docs/ at request time.
  if (p.startsWith("docs/"))
    return { shell: true, why: `${p} (the lab's pages read docs/)` };
  if (/\.md$/.test(p) && !/^(?:src|content)\//.test(p))
    return { none: true, why: "prose" };

  if (p.startsWith(`${SANDBOX}/`)) {
    const rest = p.slice(SANDBOX.length + 1);
    const folder = rest.split("/")[0];
    // A file in a board's folder is that board's, and a folder that is gone
    // (the board just retired) is the desk's.
    if (rest.includes("/"))
      return folders.includes(folder)
        ? { board: folder, why: "its own folder" }
        : { shell: true, why: `${folder} left the desk` };
    // A shared file beside the boards (a fixture two boards import) is the
    // boards that import it; the registry itself is every board.
    if (/^registry\.[cm]?[jt]s$/.test(rest))
      return { all: true, why: `${p} (every board is found through it)` };
    return {
      production: true,
      boardsOnly: true,
      why: `${p} (shared by the boards that import it)`,
    };
  }
  if (
    p.startsWith(`${DESIGN}/(shell)/library/`) ||
    p.startsWith(`${DESIGN}/gallery/`)
  )
    return { library: true, why: `${p} (the Library's)` };
  if (
    /^src\/app\/\(dev\)\/design\/\(shell\)\/lab\/(?:tools|kit|tracks|proposals)\//.test(
      p,
    )
  )
    return { shell: true, why: `${p} (a lab page of its own)` };
  if (p.startsWith(`${DESIGN}/`) || p.startsWith("src/components/lab/"))
    return {
      all: true,
      why: `${p} (the lab's shell or kit: every board renders through it)`,
    };
  if (/^scripts\/(?:lab-[a-z-]+|new-board)\.mjs$/.test(p))
    return { all: true, why: `${p} (the lab's own tool)` };
  if (p.startsWith("scripts/"))
    return { none: true, why: "a script the lab never renders" };
  if (p.startsWith("public/") || p.startsWith("content/"))
    return { library: true, why: `${p} (the Library draws it)` };
  if (p.startsWith("src/")) return { production: true, why: p };
  return { all: true, why: `${p} (a path the scope does not know widens it)` };
}

/* ── which boards a production file reaches ──────────────────────────────── */

const EXTENSIONS = [
  "",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".css",
  "/index.ts",
  "/index.tsx",
  "/index.js",
];

/** A specifier from `file`, as a repo path, or null when it is a package. */
function resolve(root, file, spec) {
  let base;
  if (spec.startsWith("@/")) base = join("src", spec.slice(2));
  else if (spec.startsWith("./") || spec.startsWith("../"))
    base = join(dirname(file), spec);
  else return null;
  for (const ext of EXTENSIONS) {
    const candidate = normalize(base + ext);
    const full = join(root, candidate);
    if (existsSync(full) && statSync(full).isFile()) return candidate;
  }
  return null;
}

/** Every repo file one board's folder reaches through its imports, its own files included. */
export function boardClosure(root, folder) {
  const seen = new Set();
  const queue = [];
  const walkDir = (dir) => {
    for (const e of readdirSync(join(root, dir), { withFileTypes: true })) {
      const rel = join(dir, e.name);
      if (e.isDirectory()) walkDir(rel);
      else if (/\.(?:[cm]?[jt]sx?|css)$/.test(e.name)) queue.push(rel);
    }
  };
  walkDir(join(SANDBOX, folder));
  while (queue.length) {
    const file = queue.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    if (!/\.[cm]?[jt]sx?$/.test(file)) continue;
    let text = "";
    try {
      text = readFileSync(join(root, file), "utf8");
    } catch {
      continue;
    }
    const info = ts.preProcessFile(text, true, true);
    for (const ref of info.importedFiles) {
      const hit = resolve(root, file, ref.fileName);
      if (hit && !seen.has(hit)) queue.push(hit);
    }
  }
  return seen;
}

/* ── the premise: the boards whose lives a change touched ────────────────── */

/** A board's own `lives`, its round and its asks' ids, read off its spec (never imported). */
function readSpecFacts(root, folder) {
  const file = join(root, SANDBOX, folder, "spec.ts");
  const sf = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const facts = { lives: [], round: null, asks: [] };
  const strings = (node) =>
    node && ts.isArrayLiteralExpression(node)
      ? node.elements.filter(ts.isStringLiteralLike).map((e) => e.text)
      : [];
  const prop = (obj, name) =>
    obj.properties.find(
      (p) => ts.isPropertyAssignment(p) && p.name.getText(sf) === name,
    )?.initializer;
  const walk = (node) => {
    if (
      ts.isObjectLiteralExpression(node) &&
      prop(node, "asks") &&
      prop(node, "round")
    ) {
      facts.lives = strings(prop(node, "lives"));
      const round = prop(node, "round");
      const n =
        round && ts.isObjectLiteralExpression(round) ? prop(round, "n") : null;
      if (n && ts.isNumericLiteral(n)) facts.round = Number(n.text);
      const asks = prop(node, "asks");
      if (asks && ts.isArrayLiteralExpression(asks))
        for (const a of asks.elements) {
          const id = ts.isObjectLiteralExpression(a) ? prop(a, "id") : null;
          if (id && ts.isStringLiteralLike(id)) facts.asks.push(id.text);
        }
    }
    ts.forEachChild(node, walk);
  };
  walk(sf);
  return facts;
}

/** The asks of a board with no answer in the round its spec is in. */
function openAsks(root, folder, facts) {
  let answered = new Set();
  try {
    const led = JSON.parse(
      readFileSync(join(root, REVIEWS, `${folder}.json`), "utf8"),
    );
    const round = (led.rounds ?? []).find((r) => r.n === facts.round);
    answered = new Set((round?.answers ?? []).map((a) => a.ask));
  } catch {
    // No ledger: nothing answered yet.
  }
  return facts.asks.filter((a) => !answered.has(a));
}

/* ── the scope ───────────────────────────────────────────────────────────── */

/**
 * The lab's scope for a set of changed paths. `all` is a string when the whole
 * lab runs (the reason), else false; `boards` the folders reached, each with
 * why; `premise` the boards with open asks whose `lives` a path touched.
 */
export function labScope(paths, { root = process.cwd(), full = false } = {}) {
  const folders = boardFolders(root);
  const out = {
    all: false,
    boards: new Map(),
    library: false,
    shell: false,
    why: [],
    premise: [],
  };
  if (full) out.all = "FULL=1";
  const production = [];
  for (const path of paths) {
    const c = classify(path, folders);
    if (c.none) continue;
    if (c.all && !out.all) out.all = c.why;
    if (c.board && !out.boards.has(c.board)) out.boards.set(c.board, c.why);
    if (c.library) out.library = true;
    if (c.shell) out.shell = true;
    if (c.production) {
      production.push(path.trim());
      // The Library renders the product's components; a fixture beside the
      // boards is theirs alone.
      if (!c.boardsOnly) out.library = true;
    }
    if (c.why) out.why.push(`${path.trim()}: ${c.why}`);
  }
  // A production file reaches the boards whose drawings import it.
  if (production.length && !out.all) {
    for (const folder of folders) {
      if (out.boards.has(folder)) continue;
      const closure = boardClosure(root, folder);
      const hit = production.find((p) => closure.has(p));
      if (hit) out.boards.set(folder, `it imports ${hit}`);
    }
  }
  // The premise: every board whose lives a path touched, with its open asks.
  const changed = paths.map((p) => p.trim()).filter(Boolean);
  for (const folder of folders) {
    const facts = readSpecFacts(root, folder);
    const touched = facts.lives.filter((l) =>
      changed.some((c) => c === l || (l.endsWith("/") && c.startsWith(l))),
    );
    if (touched.length === 0) continue;
    const open = openAsks(root, folder, facts);
    if (open.length) out.premise.push({ board: folder, open, touched });
  }
  if (out.all) {
    out.boards = new Map(folders.map((f) => [f, "the whole lab"]));
    out.library = true;
    out.shell = true;
  }
  return {
    ...out,
    boards: [...out.boards.keys()],
    boardWhy: Object.fromEntries(out.boards),
  };
}

/** The paths this tree changed against a revision: committed, staged, unstaged and untracked. */
export function changedSince(rev, root = process.cwd()) {
  const git = (...args) =>
    execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  const tracked = git("diff", "--no-renames", "--name-only", rev).split("\n");
  const untracked = git("ls-files", "--others", "--exclude-standard").split(
    "\n",
  );
  return [
    ...new Set([...tracked, ...untracked].map((l) => l.trim()).filter(Boolean)),
  ];
}

/** The revision a lane's own change is measured from: where it left launch-prep. */
export function defaultSince(root = process.cwd()) {
  return execFileSync("git", ["merge-base", "origin/launch-prep", "HEAD"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

/**
 * The scope a lab check runs on, from its own argv: `--all` or `FULL=1` for the
 * whole lab, `--board a,b` for named boards, else `--since <rev>` (default: the
 * merge base with origin/launch-prep). A git that cannot answer widens it.
 */
export function scopeFromArgs(argv, root = process.cwd()) {
  const opt = (name) =>
    argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined;
  if (argv.includes("--all") || process.env.FULL === "1")
    return labScope([], { root, full: true });
  const named = opt("--board");
  if (named) {
    const boards = named
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      all: false,
      boards,
      boardWhy: Object.fromEntries(boards.map((b) => [b, "named"])),
      library: false,
      shell: false,
      why: [],
      premise: [],
      named: true,
    };
  }
  let since = opt("--since");
  try {
    since = since ?? defaultSince(root);
    return { ...labScope(changedSince(since, root), { root }), since };
  } catch (error) {
    const scope = labScope([], { root, full: true });
    return {
      ...scope,
      all: `git could not diff against ${since ?? "origin/launch-prep"}, so the whole lab (${String(error.message ?? error).split("\n")[0]})`,
    };
  }
}

/** One line per fact of a scope, as the checks print it. */
export function describeScope(scope) {
  const lines = [];
  if (scope.all) lines.push(`SCOPE all: ${scope.all}`);
  else {
    lines.push(
      `SCOPE boards: ${scope.boards.length ? scope.boards.map((b) => `${b} (${scope.boardWhy[b]})`).join(", ") : "none"}`,
    );
    lines.push(
      `SCOPE library: ${scope.library ? "yes" : "no"} · shell: ${scope.shell ? "yes" : "no"}${scope.since ? ` · since ${scope.since.slice(0, 8)}` : ""}`,
    );
  }
  for (const p of scope.premise)
    lines.push(
      `PREMISE ${p.board}: ${p.open.length} open ask${p.open.length === 1 ? "" : "s"} (${p.open.join(", ")}) describe ${p.touched.join(", ")}, which this change touched: re-read them before his next sitting`,
    );
  return lines;
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const argv = process.argv.slice(2);
  const root = process.cwd();
  let scope;
  if (argv.includes("--stdin")) {
    const paths = readFileSync(0, "utf8").split("\n");
    scope = labScope(paths, {
      root,
      full: argv.includes("--all") || process.env.FULL === "1",
    });
  } else scope = scopeFromArgs(argv, root);
  if (argv.includes("--json")) console.log(JSON.stringify(scope, null, 2));
  else if (argv.includes("--boards"))
    console.log(scope.all ? "all" : scope.boards.join("\n"));
  else for (const line of describeScope(scope)) console.log(line);
}
