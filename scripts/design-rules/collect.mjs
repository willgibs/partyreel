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

export const ARTIFACT_VERSION = 2;

/** The directive a contract test opens with; one target per line. */
export const CONTRACT_DIRECTIVE =
  /^\s*(?:\/\/|\/\*+|\*)\s*@contract-for:\s*(\S+)/;

/** How far down a test file the directive may sit: the header, not the body. */
const DIRECTIVE_WINDOW = 40;

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

/**
 * Every contract test with the files it names, repo-relative, sorted. A
 * directive naming a file that does not exist throws: the freshness guard
 * calls this, so a typo fails `pnpm test` with the path in the message.
 */
export function discoverContractFiles(root) {
  const found = [];
  for (const abs of walk(join(root, "src"))) {
    if (!/\.test\.tsx?$/.test(abs)) continue;
    const head = readFileSync(abs, "utf8").split("\n", DIRECTIVE_WINDOW);
    const targets = new Set();
    for (const line of head) {
      const m = CONTRACT_DIRECTIVE.exec(line);
      if (m) targets.add(m[1]);
    }
    if (targets.size === 0) continue;
    const rel = toPosix(relative(root, abs));
    for (const t of targets) {
      if (!existsSync(join(root, t))) {
        throw new Error(`${rel}: @contract-for names a missing file: ${t}`);
      }
    }
    found.push({ file: rel, targets: [...targets].sort() });
  }
  return found.sort((a, b) => a.file.localeCompare(b.file));
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
    const route =
      "/design" +
      (rel.includes("/") ? "/" + rel.slice(0, rel.lastIndexOf("/")) : "");
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

const stemOf = (file) =>
  file.slice(file.lastIndexOf("/") + 1).replace(/\.tsx?$/, "");

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
  };
}
