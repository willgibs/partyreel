// THE DESIGN RULES COLLECTOR (the "less is more" reset, 2026-09-12; first
// written in the library phase, 2026-09-11). Derives, from code, the two
// things the library renders on /design/rules and the /design index, and NOT
// the design law itself:
//
//  - THE COMPONENT INDEX: every component file in the library's directories
//    (COMPONENT_DIRS) and which library page renders it, parsed from the
//    pages' imports, plus every file a contract test names.
//  - CONTRACTS: a test file whose first lines carry
//    `// @contract-for: <repo-relative path>` (one line per target; a file may
//    name two) is that file's functional contract, and its it() titles render
//    on the component's block. A test WITHOUT the line is a test, not a rule.
//    Will's ruling (2026-09-12): a contract guards a component's function
//    (structure, accessibility, single-source, its engine), never its look.
//  - POLICIES (v3, the Library x Lab round, 2026-09-15): a test file whose
//    header carries `// @policy: <scope> \u00b7 <Title>` plus
//    `// @refuses: <one sentence>` is a POLICY, the level above precedent and
//    below a contract: an agent-written line held across the whole tree. A
//    file may carry both directives (the glow tests are a component's contract
//    AND the lamp-placement policy).
//
// Both directives live in the file's HEADER (the first 40 lines). A directive
// below that window is an error, not a silent miss: `plan.test.ts` carried a
// real `@contract-for` at line 247 for weeks and the board's JSX guard never
// reached the library. The collector now throws with the path and the line.
//
// The bible, the global design law, is hand-authored in
// src/app/(dev)/design/rules/bible.ts and never derived. The first registry
// (433 rules: every guard test's titles plus every ★ run in two docs, chosen
// by a heuristic rather than a person) is what "less is more" replaced; ★ in
// a doc now means a landmine, never a rule.
//
// Why a committed artifact and not a page that reads the filesystem: the lab
// pages are dynamic (they await searchParams for the gate) and the Vercel
// bundle only traces files it can see through imports, so a request-time
// readFileSync over test files would ENOENT in production. The page imports
// this JSON; rules-registry.test.ts keeps it fresh.
//
// Why JSON and not a .ts module: test titles carry em-dashes and must stay
// verbatim; the no-em-dash policy scans only .ts/.tsx.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, posix, relative, sep } from "node:path";

import ts from "typescript";

export const ARTIFACT_VERSION = 3;

/** The directive a contract test opens with; one target per line. */
export const CONTRACT_DIRECTIVE =
  /^\s*(?:\/\/|\/\*+|\*)\s*@contract-for:\s*(\S+)/;

/**
 * `// @policy: <scope> \u00b7 <Title>`. The title is optional (the file stem
 * stands in); the scope is not, and must be one of POLICY_SCOPES.
 */
export const POLICY_DIRECTIVE =
  /^\s*(?:\/\/|\/\*+|\*)\s*@policy:\s*([a-z-]+)\s*(?:\u00b7\s*(.+?))?\s*$/;

/** `// @refuses: <one sentence>`: what a red gate on this file means. */
export const REFUSES_DIRECTIVE =
  /^\s*(?:\/\/|\/\*+|\*)\s*@refuses:\s*(.+?)\s*$/;

/**
 * A policy's reach. The six design scopes need a bible rule to cite them
 * (rules-registry.test.ts refuses an uncited one, because a policy nothing
 * points at is an agent's habit, not a line anyone agreed to); `engineering`
 * is the carve-out for the guards that are not design at all (a keyframe name
 * collision, one constant in two modules, the lane manifests).
 */
export const POLICY_SCOPES = [
  "global",
  "marketing",
  "guest",
  "host",
  "shared",
  "lab",
  "engineering",
];

export const DESIGN_SCOPES = POLICY_SCOPES.filter((s) => s !== "engineering");

/** Any of the three directives, at the start of a comment line. */
const ANY_DIRECTIVE = /^\s*(?:\/\/|\/\*+|\*)\s*@(contract-for|policy|refuses):/;

/** How far down a test file a directive may sit: the header, not the body. */
export const DIRECTIVE_WINDOW = 40;

/** The directories whose every component the library must render or excuse. */
export const COMPONENT_DIRS = [
  "src/components/ui",
  "src/components/shared",
  "src/components/marketing/system",
  "src/components/marketing/sections/shared",
  "src/components/marketing/frames",
  "src/components/marketing/sections/features/shared",
];

export const LIBRARY_DIR = "src/app/(dev)/design";

/* ───────────────────────── files ───────────────────────── */

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const toPosix = (p) => p.split(sep).join(posix.sep);

const scriptKind = (p) =>
  p.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;

const stemOf = (file) =>
  file.slice(file.lastIndexOf("/") + 1).replace(/\.tsx?$/, "");

/**
 * Every test file under src/, with its header lines and the repo-relative
 * path. The ONE walk both directive readers share, and the ONE place the
 * header window is enforced: a directive below it throws with the path and
 * the line, because the alternative is what happened to `plan.test.ts` (a
 * real contract at line 247, silently invisible for weeks).
 */
function testHeaders(root) {
  const out = [];
  for (const abs of walk(join(root, "src"))) {
    if (!/\.test\.tsx?$/.test(abs)) continue;
    const rel = toPosix(relative(root, abs));
    const lines = readFileSync(abs, "utf8").split("\n");
    for (let i = DIRECTIVE_WINDOW; i < lines.length; i++) {
      const m = ANY_DIRECTIVE.exec(lines[i]);
      if (!m) continue;
      throw new Error(
        `${rel}:${i + 1}: @${m[1]} sits past the header window (the first ` +
          `${DIRECTIVE_WINDOW} lines), so the collector would never see it. ` +
          `Move the directive to the top of the file, or split the block it ` +
          `introduces into its own test file.`,
      );
    }
    out.push({ file: rel, head: lines.slice(0, DIRECTIVE_WINDOW) });
  }
  return out.sort((a, b) => a.file.localeCompare(b.file));
}

/**
 * Every contract test with the files it names, repo-relative, sorted. A
 * directive naming a file that does not exist throws: the freshness guard
 * calls this, so a typo fails `pnpm test` with the path in the message.
 */
export function discoverContractFiles(root) {
  const found = [];
  for (const { file: rel, head } of testHeaders(root)) {
    const targets = new Set();
    for (const line of head) {
      const m = CONTRACT_DIRECTIVE.exec(line);
      if (m) targets.add(m[1]);
    }
    if (targets.size === 0) continue;
    for (const t of targets) {
      if (!existsSync(join(root, t))) {
        throw new Error(`${rel}: @contract-for names a missing file: ${t}`);
      }
    }
    found.push({ file: rel, targets: [...targets].sort() });
  }
  return found;
}

/** The stem as a sentence, for a `@policy:` line that named no title. */
function titleFromStem(rel) {
  const stem = stemOf(rel).replace(/\.test$/, "");
  const words = stem.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Every policy test, repo-relative and sorted: the scope it holds, the title
 * it renders under, the one sentence a red gate means, and the line the
 * directive sits on (the library links straight at it). An unknown scope or a
 * missing `@refuses:` throws with the path: a policy that cannot say what it
 * refuses is not a policy anyone can read.
 */
export function discoverPolicies(root) {
  const found = [];
  for (const { file: rel, head } of testHeaders(root)) {
    let hit = null;
    let summary = null;
    head.forEach((line, i) => {
      const p = POLICY_DIRECTIVE.exec(line);
      if (p && !hit) hit = { scope: p[1], title: p[2] ?? null, line: i + 1 };
      const r = REFUSES_DIRECTIVE.exec(line);
      if (r && !summary) summary = r[1];
    });
    if (!hit) continue;
    if (!POLICY_SCOPES.includes(hit.scope)) {
      throw new Error(
        `${rel}:${hit.line}: @policy names an unknown scope "${hit.scope}" ` +
          `(one of ${POLICY_SCOPES.join(", ")}).`,
      );
    }
    if (!summary) {
      throw new Error(
        `${rel}: @policy without a @refuses line. Say in one sentence what a ` +
          `red gate on this file means; the library renders it.`,
      );
    }
    found.push({
      file: rel,
      scope: hit.scope,
      title: hit.title ?? titleFromStem(rel),
      summary,
      line: hit.line,
    });
  }
  return found;
}

/* ───────────────────────── contract titles ───────────────────────── */

const SUITE_NAMES = new Set(["describe", "suite"]);
const CASE_NAMES = new Set(["it", "test"]);

function collapse(text) {
  return text.replace(/\s+/g, " ").trim();
}

/** Resolves `it`, `it.skip`, `describe.only`, `it.each(...)` to its kind. */
function calleeOf(call) {
  let expr = call.expression;
  // it.each(cases)("title", fn): the outer call's expression is a call.
  if (
    ts.isCallExpression(expr) &&
    ts.isPropertyAccessExpression(expr.expression) &&
    expr.expression.name.text === "each"
  ) {
    expr = expr.expression.expression;
  }
  while (ts.isPropertyAccessExpression(expr)) expr = expr.expression;
  if (!ts.isIdentifier(expr)) return null;
  if (SUITE_NAMES.has(expr.text)) return "suite";
  if (CASE_NAMES.has(expr.text)) return "case";
  return null;
}

/** A title as text; template holes become {expr}. */
function titleOf(arg) {
  if (!arg) return "";
  if (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) {
    return arg.text;
  }
  if (ts.isTemplateExpression(arg)) {
    let out = arg.head.text;
    for (const span of arg.templateSpans) {
      out += `{${collapse(span.expression.getText())}}${span.literal.text}`;
    }
    return out;
  }
  return `{${collapse(arg.getText())}}`;
}

/** The it() titles of one contract test, with their describe path. */
function collectContracts(root, rel) {
  const abs = join(root, rel);
  const text = readFileSync(abs, "utf8");
  const sf = ts.createSourceFile(
    abs,
    text,
    ts.ScriptTarget.Latest,
    true,
    scriptKind(rel),
  );
  const contracts = [];
  const suite = [];
  const visit = (node) => {
    if (ts.isCallExpression(node)) {
      const kind = calleeOf(node);
      if (kind === "suite") {
        suite.push(titleOf(node.arguments[0]));
        ts.forEachChild(node, visit);
        suite.pop();
        return;
      }
      if (kind === "case") {
        contracts.push({
          title: titleOf(node.arguments[0]),
          suite: [...suite],
          file: rel,
          line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1,
        });
        return;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return contracts;
}

/* ───────────────────────── the component index ───────────────────────── */

function exportsOf(abs) {
  const text = readFileSync(abs, "utf8");
  const sf = ts.createSourceFile(
    abs,
    text,
    ts.ScriptTarget.Latest,
    true,
    scriptKind(abs),
  );
  const names = new Set();
  const reexports = [];
  for (const s of sf.statements) {
    const exported = (s.modifiers ?? []).some(
      (m) => m.kind === ts.SyntaxKind.ExportKeyword,
    );
    if (
      exported &&
      (ts.isFunctionDeclaration(s) || ts.isClassDeclaration(s)) &&
      s.name
    ) {
      names.add(s.name.text);
    } else if (exported && ts.isVariableStatement(s)) {
      for (const d of s.declarationList.declarations) {
        if (ts.isIdentifier(d.name)) names.add(d.name.text);
      }
    } else if (
      ts.isExportDeclaration(s) &&
      s.exportClause &&
      ts.isNamedExports(s.exportClause)
    ) {
      const from =
        s.moduleSpecifier && ts.isStringLiteral(s.moduleSpecifier)
          ? s.moduleSpecifier.text
          : null;
      for (const el of s.exportClause.elements) {
        names.add(el.name.text);
        if (from)
          reexports.push({
            name: el.name.text,
            from,
            local: (el.propertyName ?? el.name).text,
          });
      }
    }
  }
  return {
    names: [...names].filter((n) => /^[A-Z]/.test(n)).sort(),
    reexports,
  };
}

/** The library pages' imports: specifier -> { names, route }. */
function libraryImports(root) {
  const dir = join(root, LIBRARY_DIR);
  const pages = walk(dir).filter((abs) => {
    const rel = toPosix(relative(dir, abs));
    if (rel.startsWith("sandbox/")) return false;
    return /(^|\/)page\.tsx$/.test(rel) || /-demos\.tsx$/.test(rel);
  });
  const imports = [];
  for (const abs of pages) {
    const rel = toPosix(relative(dir, abs));
    // A route group like `(shell)/` is a directory, never a URL segment (the
    // Library x Lab round, 2026-09-15).
    const routeRel = rel.replace(/\([^)]+\)\//g, "");
    const route =
      "/design" +
      (routeRel.includes("/")
        ? "/" + routeRel.slice(0, routeRel.lastIndexOf("/"))
        : "");
    const text = readFileSync(abs, "utf8");
    const sf = ts.createSourceFile(
      abs,
      text,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const visit = (node) => {
      if (
        ts.isImportDeclaration(node) &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        const names = [];
        const clause = node.importClause;
        if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) {
          for (const el of clause.namedBindings.elements)
            names.push((el.propertyName ?? el.name).text);
        }
        if (clause?.name) names.push("default");
        imports.push({ specifier: node.moduleSpecifier.text, names, route });
      } else if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments[0] &&
        ts.isStringLiteral(node.arguments[0])
      ) {
        imports.push({
          specifier: node.arguments[0].text,
          names: ["*"],
          route,
        });
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
  return imports;
}

/** The library routes whose page imports the file, by its own specifier or its directory's index. */
function specimensOf(root, file, imports) {
  const dir = file.slice(0, file.lastIndexOf("/"));
  const stem = file.slice(file.lastIndexOf("/") + 1).replace(/\.tsx?$/, "");
  const alias = dir.replace(/^src\//, "");
  const indexPath = join(root, dir, "index.ts");
  const index = existsSync(indexPath) ? exportsOf(indexPath) : null;
  const viaIndex = index
    ? index.reexports.filter((r) => r.from === `./${stem}`).map((r) => r.name)
    : [];
  const specimens = new Set();
  for (const imp of imports) {
    if (imp.specifier === `@/${alias}/${stem}`) specimens.add(imp.route);
    else if (
      viaIndex.length &&
      imp.specifier === `@/${alias}` &&
      imp.names.some((n) => n === "*" || viaIndex.includes(n))
    ) {
      specimens.add(imp.route);
    }
  }
  return [...specimens].sort();
}

function collectComponents(root) {
  const imports = libraryImports(root);

  const contractsByTarget = new Map();
  for (const { file, targets } of discoverContractFiles(root)) {
    const contracts = collectContracts(root, file);
    for (const t of targets) {
      contractsByTarget.set(t, [
        ...(contractsByTarget.get(t) ?? []),
        ...contracts,
      ]);
    }
  }

  const indexed = new Set();
  for (const dir of COMPONENT_DIRS) {
    for (const f of readdirSync(join(root, dir))) {
      if (/\.tsx$/.test(f) && !f.includes(".test.")) indexed.add(`${dir}/${f}`);
    }
  }
  const files = new Set([...indexed, ...contractsByTarget.keys()]);

  // Ids are file stems; a stem shared by two directories takes its parent's name.
  const stems = new Map();
  for (const f of files) stems.set(stemOf(f), (stems.get(stemOf(f)) ?? 0) + 1);
  const idOf = (f) =>
    stems.get(stemOf(f)) === 1
      ? stemOf(f)
      : `${f.split("/").at(-2)}-${stemOf(f)}`;

  return [...files].sort().map((file) => ({
    id: idOf(file),
    file,
    names: exportsOf(join(root, file)).names,
    specimens: specimensOf(root, file, imports),
    indexed: indexed.has(file),
    contracts: (contractsByTarget.get(file) ?? [])
      .slice()
      .sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line),
  }));
}

/* ───────────────────────── the artifact ───────────────────────── */

export function collectRules(root = process.cwd()) {
  return {
    version: ARTIFACT_VERSION,
    components: collectComponents(root),
    policies: discoverPolicies(root),
  };
}
