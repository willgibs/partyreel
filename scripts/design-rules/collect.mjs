// THE DESIGN RULES COLLECTOR (the library phase, 2026-09-11). Derives, from
// code, every rule the repo actually enforces, so the design library can
// render them at /design/rules and Will can keep, merge or drop each one.
//
// Three sources, one artifact (src/app/(dev)/design/rules/rules.generated.json,
// committed; `pnpm design:rules` rewrites it; rules-registry.test.ts fails
// when it drifts):
//
//  - GUARD TESTS: any test under src/ that reads the repo's own source
//    (`process.cwd()` in the file) or whose name ends in -policy / -contract /
//    -parity / -guards / -uniqueness, plus EXTRA_GUARDS, minus NOT_GUARDS.
//    Their describe() and it() titles ARE the rules, in plain language; the
//    TypeScript AST reads them (a regex cannot see nesting or a template
//    title), and the leading comments give provenance: dates, ADRs, and
//    whether Will is named at all.
//  - PROSE RULES: every ★ run in the two design docs. A run starts at a ★ and
//    ends at the next ★ or the end of its block; one bullet can hold four.
//  - THE COMPONENT INDEX: every component file in the library's directories
//    and which library page renders it (parsed from the pages' imports).
//
// Why a committed artifact and not a page that reads the filesystem: the lab
// pages are dynamic (they await searchParams for the gate) and the Vercel
// bundle only traces files it can see through imports, so a request-time
// readFileSync over docs/ and 48 test files would ENOENT in production. The
// page imports this JSON; the freshness guard keeps it honest.
//
// Why JSON and not a .ts module: test titles and ★ runs carry em-dashes and
// must stay verbatim; the no-em-dash policy scans only .ts/.tsx.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, posix, relative, sep } from "node:path";

import ts from "typescript";

export const ARTIFACT_VERSION = 1;

/** A guard test by name: the five house suffixes. */
export const GUARD_SUFFIX =
  /-(policy|contract|parity|guards|uniqueness)\.test\.tsx?$/;

/** Guard tests the heuristic misses (they import the source they pin). */
export const EXTRA_GUARDS = [
  "src/app/(dev)/design/marketing/marketing-library.test.ts",
  "src/app/(dev)/design/touchpoints.test.ts",
  "src/components/marketing/sections/features/album/album-copy.test.ts",
  "src/components/marketing/sections/features/shared/feature-door.test.ts",
  "src/components/marketing/system/screen-lamp.test.ts",
  "src/components/shared/legal-consent-line.test.tsx",
  "src/lib/constants/feature-pages.test.ts",
  "src/lib/constants/marketing-voice.test.ts",
  "src/lib/content/blog-tags.test.ts",
  "src/lib/reel/guest-download-contract.test.ts",
  "src/lib/reel/guest-reel-contract.test.ts",
  "src/lib/reel/quick-add.test.ts",
  "src/lib/reel/upload-contract.test.ts",
];

/** Files the heuristic matches that are not rules of the repo's own source. */
export const NOT_GUARDS = {
  // path -> the reason it is a behaviour suite rather than a rule of the repo's
  // own source. Empty today: strip-metadata.test.ts reads its out-of-repo
  // fixtures without process.cwd(), so the heuristic never sees it.
};

/** The docs whose ★ runs are prose rules. */
export const DOC_SOURCES = [
  "docs/systems/design-system.md",
  "docs/systems/marketing-content.md",
];

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

const DATE_RE = /\b20\d\d-\d\d-\d\d\b/g;
const ADR_RE = /\bADR-\d{4}\b/g;
const WILL_RE = /\bWill\b/;
const TEST_FILE_RE = /\b([\w.-]+\.test\.tsx?)\b/g;
const QUOTE_MAX = 200;

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

/** Every guard test, repo-relative, sorted. */
export function discoverGuardFiles(root) {
  const src = join(root, "src");
  const found = new Set();
  for (const abs of walk(src)) {
    if (!/\.test\.tsx?$/.test(abs)) continue;
    const rel = toPosix(relative(root, abs));
    if (
      GUARD_SUFFIX.test(rel) ||
      readFileSync(abs, "utf8").includes("process.cwd()")
    ) {
      found.add(rel);
    }
  }
  for (const rel of EXTRA_GUARDS) found.add(rel);
  for (const rel of Object.keys(NOT_GUARDS)) found.delete(rel);
  return [...found].sort();
}

/** The heuristic alone (what NOT_GUARDS must actually match). */
export function heuristicMatches(root, rel) {
  const abs = join(root, rel);
  if (!existsSync(abs)) return false;
  return (
    GUARD_SUFFIX.test(rel) ||
    readFileSync(abs, "utf8").includes("process.cwd()")
  );
}

/* ───────────────────────── ids ───────────────────────── */

export function slug(text, max = 8) {
  return text
    .replace(/\{[^}]*\}/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .split("-")
    .filter(Boolean)
    .slice(0, max)
    .join("-");
}

/** Appends ~2, ~3 to ids that collide within one collection. */
function disambiguate(records) {
  const seen = new Map();
  for (const r of records) {
    const n = (seen.get(r.id) ?? 0) + 1;
    seen.set(r.id, n);
    if (n > 1) r.id = `${r.id}~${n}`;
  }
  return records;
}

/* ───────────────────────── provenance ───────────────────────── */

function collapse(text) {
  return text.replace(/\s+/g, " ").trim();
}

function stripComment(raw) {
  return raw
    .replace(/^\/\*+/, "")
    .replace(/\*+\/$/, "")
    .split("\n")
    .map((l) => l.replace(/^\s*\*\s?/, "").replace(/^\s*\/\/\s?/, ""))
    .join(" ");
}

function commentsBefore(sourceText, node) {
  const ranges =
    ts.getLeadingCommentRanges(sourceText, node.getFullStart()) ?? [];
  return ranges.map((r) => stripComment(sourceText.slice(r.pos, r.end)));
}

function provenanceOf(texts) {
  const joined = texts.join(" ");
  const dates = [...new Set(joined.match(DATE_RE) ?? [])].sort();
  const adrs = [...new Set(joined.match(ADR_RE) ?? [])].sort();
  const nearest = texts.find((t) => collapse(t).length > 0);
  return {
    dates,
    adrs,
    ruledBy: WILL_RE.test(joined) ? "will" : "unknown",
    quote: nearest ? collapse(nearest).slice(0, QUOTE_MAX) : null,
  };
}

/* ───────────────────────── guard tests ───────────────────────── */

const SUITE_NAMES = new Set(["describe", "suite"]);
const CASE_NAMES = new Set(["it", "test"]);

/** Resolves `it`, `it.skip`, `describe.only`, `it.each(...)` to its kind. */
function calleeOf(call) {
  let expr = call.expression;
  let mods = [];
  let each = false;
  // it.each(cases)("title", fn): the outer call's expression is a call.
  if (
    ts.isCallExpression(expr) &&
    ts.isPropertyAccessExpression(expr.expression)
  ) {
    if (expr.expression.name.text === "each") {
      each = true;
      expr = expr.expression.expression;
    }
  }
  while (ts.isPropertyAccessExpression(expr)) {
    mods.push(expr.name.text);
    expr = expr.expression;
  }
  if (!ts.isIdentifier(expr)) return null;
  const name = expr.text;
  const kind = SUITE_NAMES.has(name)
    ? "suite"
    : CASE_NAMES.has(name)
      ? "case"
      : null;
  if (!kind) return null;
  return {
    kind,
    skipped: mods.includes("skip") || mods.includes("todo"),
    each,
  };
}

/** A title as text; template holes become {expr}. */
function titleOf(arg) {
  if (!arg) return { title: "", dynamic: true };
  if (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) {
    return { title: arg.text, dynamic: false };
  }
  if (ts.isTemplateExpression(arg)) {
    let out = arg.head.text;
    for (const span of arg.templateSpans) {
      out += `{${collapse(span.expression.getText())}}${span.literal.text}`;
    }
    return { title: out, dynamic: true };
  }
  return { title: `{${collapse(arg.getText())}}`, dynamic: true };
}

function collectTestFile(root, rel) {
  const abs = join(root, rel);
  const text = readFileSync(abs, "utf8");
  const sf = ts.createSourceFile(
    abs,
    text,
    ts.ScriptTarget.Latest,
    true,
    rel.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  // The file header: the first comment block, wherever it sits before code.
  const header = (() => {
    const first = sf.statements.find((s) => !ts.isImportDeclaration(s));
    const texts = first ? commentsBefore(text, first) : [];
    const top = ts.getLeadingCommentRanges(text, 0) ?? [];
    return [
      ...top.map((r) => stripComment(text.slice(r.pos, r.end))),
      ...texts,
    ];
  })();

  const rules = [];
  const suite = [];
  const suiteComments = [];
  const suiteSkipped = [];

  const visit = (node) => {
    if (ts.isCallExpression(node)) {
      const callee = calleeOf(node);
      if (callee) {
        const stmt =
          node.parent && ts.isExpressionStatement(node.parent)
            ? node.parent
            : node;
        const own = commentsBefore(text, stmt);
        const { title, dynamic } = titleOf(node.arguments[0]);
        if (callee.kind === "suite") {
          suite.push(title);
          suiteComments.push(own);
          suiteSkipped.push(callee.skipped);
          ts.forEachChild(node, visit);
          suite.pop();
          suiteComments.pop();
          suiteSkipped.pop();
          return;
        }
        const line =
          sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
        const nearest = [...own, ...suiteComments.flat().reverse(), ...header];
        rules.push({
          id: `t:${rel}#${suite.map((s) => slug(s)).join("/")}/${slug(title)}`,
          source: "test",
          file: rel,
          line,
          suite: [...suite],
          title,
          body: null,
          emphasis: 1,
          dynamic: dynamic || callee.each,
          skipped: callee.skipped || suiteSkipped.some(Boolean),
          provenance: provenanceOf(nearest),
          pins: [],
        });
        return;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return disambiguate(rules);
}

/* ───────────────────────── prose rules ───────────────────────── */

const LIST_START = /^\s*(?:[-*+]|\d+\.)\s+/;
const HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/;

/** GitHub's heading slug, close enough for our headings. */
function headingSlug(title) {
  return title
    .toLowerCase()
    .replace(/[`*_]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** Splits a markdown file into blocks: paragraphs, list items, table rows. */
function blocksOf(lines) {
  const blocks = [];
  let cur = null;
  const flush = () => {
    if (cur) blocks.push(cur);
    cur = null;
  };
  let fenced = false;
  lines.forEach((raw, i) => {
    const line = raw.replace(/\r$/, "");
    if (/^\s*```/.test(line)) {
      fenced = !fenced;
      flush();
      return;
    }
    if (fenced) return;
    if (line.trim() === "") return flush();
    const heading = HEADING.exec(line);
    if (heading) {
      flush();
      blocks.push({
        kind: "heading",
        level: heading[1].length,
        text: heading[2],
        line: i + 1,
        lines: [],
      });
      return;
    }
    const startsItem = LIST_START.test(line) || /^\s*\|/.test(line);
    if (startsItem || !cur) {
      flush();
      cur = { kind: "block", line: i + 1, lines: [line] };
      return;
    }
    cur.lines.push(line);
  });
  flush();
  return blocks;
}

function collectDoc(root, rel) {
  const text = readFileSync(join(root, rel), "utf8");
  const rules = [];
  let anchor = "";
  for (const block of blocksOf(text.split("\n"))) {
    if (block.kind === "heading") {
      anchor = headingSlug(block.text);
      continue;
    }
    const joined = block.lines.map((l) => l.trim()).join(" ");
    if (!joined.includes("★")) continue;
    // Each ★ opens a run that ends at the next ★ or the block's end.
    const parts = joined.split("★").slice(1);
    let emphasisCarry = 0;
    for (const raw of parts) {
      if (raw === "") {
        // A second ★ in a row: ★★ emphasis for the run that follows.
        emphasisCarry += 1;
        continue;
      }
      const emphasis = emphasisCarry > 0 ? 2 : 1;
      emphasisCarry = 0;
      const run = raw.trim();
      const bold = /^\*\*(.+?)\*\*/.exec(run);
      const headline = bold
        ? bold[1].trim()
        : (run.split(/(?<=[.!?])\s/)[0] ?? run).slice(0, 120).trim();
      const body = bold
        ? run
            .slice(bold[0].length)
            .replace(/^[\s:,.-]+/, "")
            .trim()
        : run;
      const pins = [
        ...new Set(
          (run.match(TEST_FILE_RE) ?? []).map((m) => m.replace(/^`/, "")),
        ),
      ];
      rules.push({
        id: `d:${rel}#${anchor}/${slug(headline)}`,
        source: "doc",
        file: rel,
        line: block.line,
        suite: [anchor],
        title: headline,
        body: body || null,
        emphasis,
        dynamic: false,
        skipped: false,
        provenance: provenanceOf([run]),
        pins,
      });
    }
  }
  return disambiguate(rules);
}

/* ───────────────────────── the component index ───────────────────────── */

function exportsOf(abs) {
  const text = readFileSync(abs, "utf8");
  const sf = ts.createSourceFile(
    abs,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
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

function collectComponents(root) {
  const imports = libraryImports(root);
  const components = [];
  for (const dir of COMPONENT_DIRS) {
    const abs = join(root, dir);
    const files = readdirSync(abs)
      .filter((f) => /\.tsx$/.test(f) && !f.includes(".test."))
      .sort();
    // An index.ts that re-exports lets a page import the directory itself.
    const indexPath = join(abs, "index.ts");
    const index = existsSync(indexPath) ? exportsOf(indexPath) : null;
    for (const f of files) {
      const file = `${dir}/${f}`;
      const stem = f.replace(/\.tsx$/, "");
      const { names } = exportsOf(join(abs, f));
      const own = `@/${dir.replace(/^src\//, "")}/${stem}`;
      const viaIndex = index
        ? index.reexports
            .filter((r) => r.from === `./${stem}`)
            .map((r) => r.name)
        : [];
      const specimens = new Set();
      for (const imp of imports) {
        if (imp.specifier === own) specimens.add(imp.route);
        else if (
          viaIndex.length &&
          imp.specifier === `@/${dir.replace(/^src\//, "")}` &&
          imp.names.some((n) => n === "*" || viaIndex.includes(n))
        ) {
          specimens.add(imp.route);
        }
      }
      components.push({ file, names, specimens: [...specimens].sort() });
    }
  }
  return components.sort((a, b) => a.file.localeCompare(b.file));
}

/* ───────────────────────── the artifact ───────────────────────── */

export function collectRules(root = process.cwd()) {
  const rules = [];
  for (const rel of discoverGuardFiles(root))
    rules.push(...collectTestFile(root, rel));
  for (const rel of DOC_SOURCES) rules.push(...collectDoc(root, rel));
  rules.sort((a, b) => a.id.localeCompare(b.id));
  return {
    version: ARTIFACT_VERSION,
    rules,
    components: collectComponents(root),
  };
}
