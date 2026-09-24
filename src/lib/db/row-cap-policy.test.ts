// @policy: engineering · Every read reaches its last row
// @refuses: an unbounded PostgREST read, an unchunked .in() list, an unpaged set-returning RPC, a MAX_ROWS off config.toml, and a row-cap marker over a statement that no longer offends.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

import { MAX_ROWS } from "@/lib/db/read-all";

/**
 * EVERY READ REACHES ITS LAST ROW: the static guard of the 1,000-row round (2026-09-23). The six
 * rules and why they exist are in `read-all.ts`'s header; the runtime twin is
 * `src/lib/supabase/row-cap-tripwire.ts`. PostgREST cuts a read at 1,000 rows with no error and no
 * flag, so the only way to be sure no read is cut is to refuse every shape that CAN be cut, in the
 * source, before it ships. This walks `src/**` (tests, the generated types and the test fakes
 * aside) and `scripts/**` `.mjs`, and refuses:
 *
 *  A. AN UNBOUNDED READ: a chain holding `.from("<table>")` then `.select(` with none of `.limit(`,
 *     `.range(`, `.single(`, `.maybeSingle(`, `head: true` in the select's options, or an
 *     `.in("id", ...)` over a fixed list or the `inChunks` chunk (one row an id, from a bounded
 *     list), or with a literal `.limit(n)` above `MAX_ROWS` (clipped all the same). A bound on an
 *     embed (`{ referencedTable }`) bounds the embed, not the read. The CHAIN is the expression as
 *     written: a bound added later through a variable is not seen, so write it into the chain. A
 *     write (`.insert(`, `.update(`, `.upsert(`, `.delete(`, even with a `.select(` after it) is
 *     not a read: PostgREST returned all 1,040 rows a PATCH touched on the probe.
 *     `storage.from(...)`, `Array.from(...)` and the like never match (the argument is a string
 *     literal and a PostgREST method follows it).
 *  B. AN UNCHUNKED ID LIST: `.in("<col>", <expr>)` whose list is not an array literal (a spread
 *     `[...ids]` is not one), and `.not(col, "in", ...)` / `.filter(col, "in", ...)` with a
 *     computed list, unless it sits in the callback handed to `inChunks(` and passes that
 *     callback's chunk. A write is not exempt here: its list rides the URL all the same.
 *  C. AN UNPAGED SET-RETURNING RPC: `.rpc("<name>", <args>)` whose LATEST definition in
 *     `supabase/migrations/` returns `table (...)` or `setof`, with no `p_limit` key in an object
 *     literal `<args>` and no bound on the chain. Drops count (a function dropped later is gone),
 *     and `SINGLE_ROW` names the functions that return one row by construction, each with why.
 *  D. `MAX_ROWS` DRIFTING FROM THE PLATFORM: it must equal `supabase/config.toml`'s
 *     `[api] max_rows`, because `readAllPages` reads a short page as the last one.
 *
 * A BOUND ON PURPOSE, OR THE WORK LIST, SAYS SO in a marker on the comment lines directly above the
 * statement that holds the offender (its leading comments; the INNERMOST statement, so inside a
 * callback it is the callback's own statement):
 *
 *     // row-cap: <why this read is bounded>                 permanent, reviewed at the merge
 *     // row-cap-todo: <ID...> <why>                          a tracked fix: ids from TODO_IDS
 *
 * A marker whose statement no longer offends FAILS, so a fix removes its marker in the same
 * change; a todo marker must name ids from `TODO_IDS`, which is empty while no fix is outstanding,
 * so today any todo marker fails. Every failure prints `file:line rule hint`.
 */

/**
 * Offenders tracked for a fix, by audit id. EMPTY: every read reaches its last row or carries a
 * reviewed `// row-cap:` why. A future audit lists its ids here while its fixes land, and empties
 * it with the last one.
 */
const TODO_IDS: readonly string[] = [];

/**
 * Set-returning by signature, one row by construction: each with the reason it cannot be cut.
 * `SINGLE_ROW` is checked against the migrations too: an entry that names no live set-returning
 * function fails, so the list cannot outlive its reasons.
 */
const SINGLE_ROW: Readonly<Record<string, string>> = {
  get_event_by_qr_token:
    "its body ends in `limit 1`: one event per token or custom slug",
  host_storage_summary: "one aggregate row per host asked",
  tier_limits: "one row: the limits of the one tier asked",
  purge_media_rows:
    "one row per host among at most its input ids; the cron lane pins every caller to at most MAX_ROWS ids",
};

const ROOT = process.cwd();

/* ─────────────────────────────── the walk ─────────────────────────────── */

/** Not scanned: tests, the generated types, and the test fakes (which speak PostgREST's words). */
const SRC_SKIP =
  /\.test\.tsx?$|\.d\.ts$|^src\/lib\/db\/types\.ts$|^src\/lib\/db\/testing\//;

function filesUnder(dir: string, keep: (rel: string) => boolean): string[] {
  return readdirSync(join(ROOT, dir), { recursive: true })
    .map((f) => `${dir}/${String(f).replace(/\\/g, "/")}`)
    .filter(keep)
    .sort();
}

const SOURCES = [
  ...filesUnder("src", (rel) => /\.tsx?$/.test(rel) && !SRC_SKIP.test(rel)),
  ...filesUnder("scripts", (rel) => rel.endsWith(".mjs")),
];

/* ───────────────────────────── the migrations ──────────────────────────── */

/** Every migration's SQL, in timestamp order (the reader below strips the comments). */
function readMigrations(): { file: string; sql: string }[] {
  const dir = join(ROOT, "supabase/migrations");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((file) => ({ file, sql: readFileSync(join(dir, file), "utf8") }));
}

/** The index just past the parenthesis that closes the one at `open`, or -1. */
function closeParen(sql: string, open: number): number {
  let depth = 0;
  for (let i = open; i < sql.length; i++) {
    if (sql[i] === "(") depth++;
    else if (sql[i] === ")" && --depth === 0) return i + 1;
  }
  return -1;
}

/** `public.foo`, `"foo"`, `foo` as `foo`; null for another schema's function. */
function publicName(raw: string): string | null {
  const bare = raw.replace(/"/g, "").trim().toLowerCase();
  const dot = bare.lastIndexOf(".");
  if (dot === -1) return bare;
  return bare.slice(0, dot) === "public" ? bare.slice(dot + 1) : null;
}

/**
 * THE DROP-AWARE READER: the functions standing after the whole set, replayed statement by
 * statement, each mapped to whether its LATEST definition is set-returning (`returns table (...)`,
 * `returns table(` with no space, `returns setof`, over as many lines as its signature takes). A
 * `drop function` removes the name until a later `create` brings it back; a drop may name several
 * functions. Per name, not per signature: PostgREST refuses overloads, so a name is one function.
 * (`migration-guards.test.ts`' `latestDefinition` sees only creates, which is why this is its own.)
 */
function setReturningFunctions(
  migrations: { file: string; sql: string }[],
): Map<string, boolean> {
  const live = new Map<string, boolean>();
  const statement =
    /\b(create(?:\s+or\s+replace)?|drop)\s+function\s+(if\s+exists\s+)?/gi;
  for (const { sql: raw } of migrations) {
    const sql = raw.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/--[^\n]*/g, "");
    for (const m of sql.matchAll(statement)) {
      const from = m.index + m[0].length;
      if (m[1].toLowerCase() === "drop") {
        const end = sql.indexOf(";", from);
        let list = sql.slice(from, end === -1 ? undefined : end);
        // Take out every argument list, so `numeric(10,2)` cannot split a name.
        for (
          let open = list.indexOf("(");
          open !== -1;
          open = list.indexOf("(")
        ) {
          const close = closeParen(list, open);
          list = list.slice(0, open) + (close === -1 ? "" : list.slice(close));
        }
        for (const part of list.split(",")) {
          const name = publicName(part.replace(/\b(cascade|restrict)\b/gi, ""));
          if (name) live.delete(name);
        }
        continue;
      }
      const head =
        /^((?:"?[a-z_][a-z0-9_]*"?\.)?"?[a-z_][a-z0-9_]*"?)\s*\(/i.exec(
          sql.slice(from),
        );
      if (!head) continue;
      const name = publicName(head[1]);
      if (!name) continue;
      const close = closeParen(sql, from + head[0].length - 1);
      if (close === -1) continue;
      live.set(
        name,
        /^\s*returns\s+(?:setof\b|table\s*\()/i.test(sql.slice(close)),
      );
    }
  }
  return live;
}

/** `[api] max_rows` in a config.toml, or null. */
function configMaxRows(toml: string): number | null {
  let section = "";
  for (const line of toml.split("\n")) {
    const header = /^\s*\[([^\]]+)\]\s*(?:#.*)?$/.exec(line);
    if (header) {
      section = header[1].trim();
      continue;
    }
    const value = /^\s*max_rows\s*=\s*(\d+)\s*(?:#.*)?$/.exec(line);
    if (value && section === "api") return Number(value[1]);
  }
  return null;
}

/* ─────────────────────────────── the scan ─────────────────────────────── */

type Rule = "A" | "B" | "C";
type Offence = { rule: Rule; line: number; hint: string; statement: ts.Node };
type Marker = {
  line: number;
  pos: number;
  todo: boolean;
  ids: string[];
  why: string;
};
type Scan = { text: string; offences: Offence[]; markers: Marker[] };

const READ_BOUNDS = new Set(["limit", "range", "single", "maybeSingle"]);

/** A marker: a whole-line `//` comment whose text opens `row-cap:` or `row-cap-todo:`. */
const MARKER = /^[ \t]*(\/\/[ \t]*row-cap(-todo)?:(.*))$/gm;

function isStringy(
  node: ts.Node | undefined,
): node is ts.StringLiteral | ts.NoSubstitutionTemplateLiteral {
  return (
    node !== undefined &&
    (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
  );
}

/** Parentheses, `as`, `satisfies` and `!` add nothing to what an expression is. */
function bare(node: ts.Expression): ts.Expression {
  let cur = node;
  while (
    ts.isParenthesizedExpression(cur) ||
    ts.isAsExpression(cur) ||
    ts.isSatisfiesExpression(cur) ||
    ts.isNonNullExpression(cur) ||
    ts.isTypeAssertionExpression(cur)
  ) {
    cur = cur.expression;
  }
  return cur;
}

/** The method a chain link calls: `x.select(...)` is `select`. */
function methodOf(call: ts.CallExpression): string | null {
  return ts.isPropertyAccessExpression(call.expression)
    ? call.expression.name.text
    : null;
}

/** The calls chained onto `call`, outward: from `a.from("t")` in `a.from("t").select().eq()`, [select, eq]. */
function chainAbove(call: ts.CallExpression): ts.CallExpression[] {
  const links: ts.CallExpression[] = [];
  let cur: ts.Node = call;
  for (;;) {
    const access = cur.parent;
    if (
      !access ||
      !ts.isPropertyAccessExpression(access) ||
      access.expression !== cur
    )
      break;
    const next = access.parent;
    if (!next || !ts.isCallExpression(next) || next.expression !== access)
      break;
    links.push(next);
    cur = next;
  }
  return links;
}

function propertyName(name: ts.PropertyName): string | null {
  return ts.isIdentifier(name) || ts.isStringLiteral(name) ? name.text : null;
}

/** An object literal holding `key`, as `key: value` or shorthand. */
function hasKey(node: ts.Expression | undefined, key: string): boolean {
  if (!node) return false;
  const object = bare(node);
  return (
    ts.isObjectLiteralExpression(object) &&
    object.properties.some(
      (p) =>
        (ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p)) &&
        propertyName(p.name) === key,
    )
  );
}

/** `{ head: true }`, literally. */
function headTrue(options: ts.Expression | undefined): boolean {
  if (!options) return false;
  const object = bare(options);
  return (
    ts.isObjectLiteralExpression(object) &&
    object.properties.some(
      (p) =>
        ts.isPropertyAssignment(p) &&
        propertyName(p.name) === "head" &&
        p.initializer.kind === ts.SyntaxKind.TrueKeyword,
    )
  );
}

/** A modifier aimed at an embed (`{ referencedTable }` or `{ foreignTable }`) bounds the embed only. */
function onEmbed(call: ts.CallExpression): boolean {
  const last = call.arguments[call.arguments.length - 1];
  return hasKey(last, "referencedTable") || hasKey(last, "foreignTable");
}

function numberLiteral(node: ts.Expression | undefined): number | null {
  if (!node) return null;
  const value = bare(node);
  return ts.isNumericLiteral(value) ? Number(value.text) : null;
}

/** A fixed list: an array literal with no spread in it. */
function fixedList(node: ts.Expression): boolean {
  const list = bare(node);
  return (
    ts.isArrayLiteralExpression(list) &&
    list.elements.every((e) => !ts.isSpreadElement(e))
  );
}

function mentions(node: ts.Node, name: string): boolean {
  if (ts.isIdentifier(node) && node.text === name) return true;
  return (
    ts.forEachChild(node, (child) =>
      mentions(child, name) ? true : undefined,
    ) === true
  );
}

/**
 * `.in("id", <a fixed list, or the inChunks chunk>)`: at most one row an id from a bounded list, so
 * the read is bounded by construction (every table here keys on `id`). A chunk of PARENTS
 * (`.in("event_id", chunk)`) bounds nothing: 150 events can hold far more than 1,000 rows.
 */
function byIdList(call: ts.CallExpression): boolean {
  const [column, list] = call.arguments;
  return (
    methodOf(call) === "in" &&
    isStringy(column) &&
    column.text === "id" &&
    list !== undefined &&
    (fixedList(list) || chunked(call, list))
  );
}

/** Inside the callback handed to `inChunks(`, passing that callback's chunk (its first parameter)? */
function chunked(node: ts.Node, list: ts.Expression): boolean {
  for (let cur = node.parent; cur; cur = cur.parent) {
    if (!ts.isArrowFunction(cur) && !ts.isFunctionExpression(cur)) continue;
    const call = cur.parent;
    if (
      !call ||
      !ts.isCallExpression(call) ||
      !call.arguments.some((a) => a === cur)
    )
      continue;
    const callee = bare(call.expression);
    const name = ts.isIdentifier(callee)
      ? callee.text
      : ts.isPropertyAccessExpression(callee)
        ? callee.name.text
        : null;
    if (name !== "inChunks") continue;
    const param = cur.parameters[0];
    return (
      param !== undefined &&
      ts.isIdentifier(param.name) &&
      mentions(list, param.name.text)
    );
  }
  return false;
}

/** The innermost statement holding a node: where its marker goes. */
function statementOf(node: ts.Node): ts.Node {
  for (let cur: ts.Node | undefined = node; cur; cur = cur.parent) {
    switch (cur.kind) {
      case ts.SyntaxKind.VariableStatement:
      case ts.SyntaxKind.ExpressionStatement:
      case ts.SyntaxKind.ReturnStatement:
      case ts.SyntaxKind.IfStatement:
      case ts.SyntaxKind.ForStatement:
      case ts.SyntaxKind.ForOfStatement:
      case ts.SyntaxKind.ForInStatement:
      case ts.SyntaxKind.WhileStatement:
      case ts.SyntaxKind.DoStatement:
      case ts.SyntaxKind.ThrowStatement:
      case ts.SyntaxKind.SwitchStatement:
      case ts.SyntaxKind.LabeledStatement:
      case ts.SyntaxKind.ExportAssignment:
      case ts.SyntaxKind.FunctionDeclaration:
      case ts.SyntaxKind.ClassDeclaration:
      case ts.SyntaxKind.PropertyDeclaration:
      case ts.SyntaxKind.SourceFile:
        return cur;
    }
  }
  return node.getSourceFile();
}

function snippet(node: ts.Node, sf: ts.SourceFile): string {
  const text = node.getText(sf).replace(/\s+/g, " ");
  return text.length > 40 ? `${text.slice(0, 37)}...` : text;
}

/**
 * Every offence in one file and every marker in it. `paged` is the set-returning functions that
 * must take `p_limit` (the live set-returning functions, less `SINGLE_ROW`).
 */
function scanSource(
  rel: string,
  text: string,
  paged: ReadonlySet<string>,
): Scan {
  const kind = rel.endsWith(".tsx")
    ? ts.ScriptKind.TSX
    : rel.endsWith(".mjs")
      ? ts.ScriptKind.JS
      : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true, kind);
  const offences: Offence[] = [];
  const literals: [number, number][] = [];
  const lineOf = (node: ts.Node) =>
    sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
  const flag = (rule: Rule, at: ts.Node, holder: ts.Node, hint: string) =>
    offences.push({
      rule,
      line: lineOf(at),
      hint,
      statement: statementOf(holder),
    });

  const visit = (node: ts.Node): void => {
    if (
      ts.isStringLiteralLike(node) ||
      ts.isTemplateExpression(node) ||
      ts.isJsxText(node)
    ) {
      literals.push([node.getStart(sf), node.getEnd()]);
    }
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression)
    ) {
      const method = node.expression.name;
      const [first, second, third] = node.arguments;

      // Rule A: a read with no bound.
      if (method.text === "from" && isStringy(first)) {
        const chain = chainAbove(node);
        if (chain.length > 0 && methodOf(chain[0]) === "select") {
          const bounded =
            chain.some(
              (c) =>
                (READ_BOUNDS.has(methodOf(c) ?? "") && !onEmbed(c)) ||
                byIdList(c),
            ) || headTrue(chain[0].arguments[1]);
          if (!bounded) {
            flag(
              "A",
              method,
              node,
              `.from("${first.text}").select() has no bound: read it whole with readAllPages, count it with head: true, bound it with .limit/.range/.maybeSingle, or say why in a // row-cap: marker`,
            );
          }
          for (const c of chain) {
            const n =
              methodOf(c) === "limit" && !onEmbed(c)
                ? numberLiteral(c.arguments[0])
                : null;
            if (n !== null && n > MAX_ROWS) {
              flag(
                "A",
                c.expression,
                node,
                `.limit(${n}) asks past MAX_ROWS (${MAX_ROWS}): PostgREST clips it silently`,
              );
            }
          }
        }
      }

      // Rule B: a runtime list in the URL.
      if (
        method.text === "in" &&
        isStringy(first) &&
        second &&
        !fixedList(second) &&
        !chunked(node, second)
      ) {
        flag(
          "B",
          method,
          node,
          `.in("${first.text}", ${snippet(second, sf)}) takes a runtime list: chunk it through inChunks, filter on the parent, or pass a uuid[] to an RPC`,
        );
      }
      if (
        (method.text === "not" || method.text === "filter") &&
        isStringy(second) &&
        /^(not\.)?in$/.test(second.text) &&
        third &&
        !isStringy(third) &&
        !chunked(node, third)
      ) {
        flag(
          "B",
          method,
          node,
          `.${method.text}(.., "${second.text}", ${snippet(third, sf)}) puts a runtime list in the URL: chunk it through inChunks`,
        );
      }

      // Rule C: a set-returning function called with no page.
      if (method.text === "rpc" && isStringy(first) && paged.has(first.text)) {
        const bounded =
          hasKey(second, "p_limit") ||
          chainAbove(node).some(
            (c) => READ_BOUNDS.has(methodOf(c) ?? "") && !onEmbed(c),
          );
        if (!bounded) {
          flag(
            "C",
            method,
            node,
            `rpc("${first.text}") is set-returning and passes no p_limit: page it on p_after and p_limit, or make it return one row`,
          );
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  const markers: Marker[] = [];
  for (const m of text.matchAll(MARKER)) {
    const pos = m.index + m[0].indexOf(m[1]);
    if (literals.some(([start, end]) => pos >= start && pos < end)) continue;
    const words = m[3].trim().split(/\s+/).filter(Boolean);
    const todo = Boolean(m[2]);
    const ids: string[] = [];
    if (todo)
      while (words.length > 0 && /^[A-Z]+\d+$/.test(words[0]))
        ids.push(words.shift()!);
    markers.push({
      line: sf.getLineAndCharacterOfPosition(pos).line + 1,
      pos,
      todo,
      ids,
      why: words.join(" "),
    });
  }
  return { text, offences, markers };
}

/** The failures in one scanned file, each `file:line rule hint`. */
function verdicts(
  rel: string,
  scan: Scan,
  todoIds: readonly string[],
): string[] {
  const failures: string[] = [];
  const used = new Set<Marker>();
  const byStatement = new Map<ts.Node, Offence[]>();
  for (const offence of scan.offences) {
    byStatement.set(offence.statement, [
      ...(byStatement.get(offence.statement) ?? []),
      offence,
    ]);
  }
  for (const [statement, offences] of byStatement) {
    const leading =
      ts.getLeadingCommentRanges(scan.text, statement.getFullStart()) ?? [];
    const markers = scan.markers.filter((m) =>
      leading.some((r) => r.pos === m.pos),
    );
    if (markers.length === 0) {
      const opens =
        ts.getLineAndCharacterOfPosition(
          statement.getSourceFile(),
          statement.getStart(),
        ).line + 1;
      for (const o of offences) {
        failures.push(
          `${rel}:${o.line} ${o.rule} ${o.hint} (its statement opens at line ${opens})`,
        );
      }
    }
    for (const m of markers) used.add(m);
  }
  for (const m of scan.markers) {
    if (!used.has(m)) {
      failures.push(
        `${rel}:${m.line} marker sits above no offending statement (fixed, or misplaced): remove it, or move it directly above the statement that holds the offender`,
      );
      continue;
    }
    if (m.todo && m.ids.length === 0) {
      failures.push(
        `${rel}:${m.line} marker a row-cap-todo names its ids first: // row-cap-todo: <ID...> <why>`,
      );
    }
    for (const id of m.ids) {
      if (!todoIds.includes(id))
        failures.push(`${rel}:${m.line} marker ${id} is not in TODO_IDS`);
    }
    if (m.why.length < 8)
      failures.push(
        `${rel}:${m.line} marker says why, in words, after the marker`,
      );
  }
  return failures;
}

/* ─────────────────────────────── the guard ─────────────────────────────── */

const LIVE = setReturningFunctions(readMigrations());
const PAGED = new Set(
  [...LIVE]
    .filter(([name, sets]) => sets && !(name in SINGLE_ROW))
    .map(([name]) => name),
);
const SCANS = SOURCES.map((rel) => ({
  rel,
  scan: scanSource(rel, readFileSync(join(ROOT, rel), "utf8"), PAGED),
}));

describe("the row-cap policy", () => {
  it("scanned the tree: the app, the scripts and the migrations", () => {
    // A guard that scans nothing passes silently; the walk is the one thing that could empty it.
    expect(SOURCES.length, "the scan found too few files").toBeGreaterThan(500);
    expect(SOURCES).toContain("scripts/seed-demo-event.mjs");
    expect(
      LIVE.size,
      "the migration reader found too few functions",
    ).toBeGreaterThan(40);
    expect(PAGED.size, "no set-returning function to page").toBeGreaterThan(0);
  });

  it("D: MAX_ROWS equals supabase/config.toml's [api] max_rows", () => {
    expect(
      configMaxRows(readFileSync(join(ROOT, "supabase/config.toml"), "utf8")),
    ).toBe(MAX_ROWS);
  });

  it("C: every SINGLE_ROW entry names a live set-returning function", () => {
    const stale = Object.keys(SINGLE_ROW).filter(
      (name) => LIVE.get(name) !== true,
    );
    expect(
      stale,
      `SINGLE_ROW names what the migrations no longer define as set-returning: ${stale.join(", ")}`,
    ).toEqual([]);
  });

  it("A, B, C: every offender carries a marker, and every marker an offender", () => {
    const failures = SCANS.flatMap(({ rel, scan }) =>
      verdicts(rel, scan, TODO_IDS),
    );
    expect(failures, `\n${failures.join("\n")}\n`).toEqual([]);
  });
});

/* ─────────────────────── the walker, on fixtures ─────────────────────── */

describe("the walker, on fixtures", () => {
  const run = (
    source: string,
    paged: string[] = [],
    rel = "src/lib/fixture.ts",
  ) => verdicts(rel, scanSource(rel, source, new Set(paged)), ["C1", "N4"]);
  const rules = (source: string, paged: string[] = []) =>
    run(source, paged).map((f) => f.split(" ")[1]);

  it("A: flags an unbounded read, and passes each bound", () => {
    expect(
      rules(`const r = await db.from("media").select("id").eq("event_id", e);`),
    ).toEqual(["A"]);
    for (const bound of [
      `.limit(1000)`,
      `.range(0, 999)`,
      `.single()`,
      `.maybeSingle()`,
    ]) {
      expect(
        rules(
          `const r = await db.from("media").select("id").eq("event_id", e)${bound};`,
        ),
      ).toEqual([]);
    }
    expect(
      rules(
        `const r = await db.from("media").select("id", { count: "exact", head: true });`,
      ),
    ).toEqual([]);
  });

  it("A: a limit past the cap and a bound on an embed are not bounds", () => {
    expect(
      rules(`const r = await db.from("media").select("id").limit(5000);`),
    ).toEqual(["A"]);
    expect(
      rules(
        `const r = await db.from("events").select("id, media(id)").limit(5, { referencedTable: "media" });`,
      ),
    ).toEqual(["A"]);
  });

  it("A: a write is not a read, and storage, Array and Buffer are not PostgREST", () => {
    expect(
      rules(
        `await db.from("media").update({ status: "x" }).eq("id", id).select("id");`,
      ),
    ).toEqual([]);
    expect(rules(`await db.from("media").insert(rows).select();`)).toEqual([]);
    expect(rules(`await admin.storage.from("avatars").list();`)).toEqual([]);
    expect(
      rules(
        `const a = Array.from("abc").map((c) => c); const b = Buffer.from("x");`,
      ),
    ).toEqual([]);
  });

  it("A: a bound added later through a variable is not seen (write it into the chain)", () => {
    expect(
      rules(`let q = db.from("media").select("id"); q = q.limit(10); await q;`),
    ).toEqual(["A"]);
  });

  it("B: flags a runtime list and a spread, and passes a fixed list", () => {
    expect(
      rules(`await db.from("media").select("id").in("id", ids).limit(10);`),
    ).toEqual(["B"]);
    expect(
      rules(
        `await db.from("media").select("id").in("id", [...ids]).limit(10);`,
      ),
    ).toEqual(["B"]);
    expect(rules(`await db.from("media").update(x).in("id", ids);`)).toEqual([
      "B",
    ]);
    expect(
      rules(
        `await db.from("media").select("id").in("status", ["approved", "pending"]).limit(10);`,
      ),
    ).toEqual([]);
    expect(
      rules(
        `await db.from("media").select("id").not("id", "in", \`(\${ids.join(",")})\`).limit(1);`,
      ),
    ).toEqual(["B"]);
  });

  it("B: passes the chunk inside an inChunks callback, and flags the whole list there", () => {
    // By id, the chunk bounds the read too: one row an id, at most IN_CHUNK ids.
    expect(
      rules(
        `const r = await inChunks("x", ids, (chunk) => mustQuery(db.from("m").select("id").in("id", chunk), "x"));`,
      ),
    ).toEqual([]);
    // A chunk of parents bounds nothing: 150 events can hold far more than 1,000 rows.
    expect(
      rules(
        `const r = await inChunks("x", ids, (chunk) => mustQuery(db.from("m").select("id").in("event_id", chunk), "x"));`,
      ),
    ).toEqual(["A"]);
    expect(
      rules(
        `const r = await inChunks("x", ids, (chunk) => mustQuery(db.from("m").select("id").in("id", ids).limit(150), "x"));`,
      ),
    ).toEqual(["B"]);
    expect(
      rules(
        `const r = await inChunks("x", ids, async (part) => { const { data } = await db.from("m").select("id").in("id", part.map(String)).limit(150); return data; });`,
      ),
    ).toEqual([]);
  });

  it("C: flags a set-returning function with no p_limit, and passes a page, a bound or a scalar function", () => {
    expect(
      rules(`await db.rpc("get_rows", { p_event_id: e });`, ["get_rows"]),
    ).toEqual(["C"]);
    expect(rules(`await db.rpc("get_rows", args);`, ["get_rows"])).toEqual([
      "C",
    ]);
    expect(
      rules(`await db.rpc("get_rows", { p_event_id: e, p_limit: MAX_ROWS });`, [
        "get_rows",
      ]),
    ).toEqual([]);
    expect(
      rules(`await db.rpc("get_rows", { p_event_id: e }).maybeSingle();`, [
        "get_rows",
      ]),
    ).toEqual([]);
    expect(
      rules(`await db.rpc("count_rows", { p_event_id: e });`, ["get_rows"]),
    ).toEqual([]);
  });

  it("markers: a todo or a permanent marker directly above the statement passes", () => {
    expect(
      run(
        `// row-cap-todo: C1 the album list; stage 2 pages it\nconst r = await db.from("media").select("id");`,
      ),
    ).toEqual([]);
    expect(
      run(
        `// Why this reads the table.\n// row-cap: a few config rows, never more\nconst r = await db.from("ops_flags").select("*");`,
      ),
    ).toEqual([]);
    expect(
      run(
        `// row-cap-todo: C1 N4 two reads in one statement\nconst [a, b] = await Promise.all([db.from("a").select("id"), db.from("b").select("id")]);`,
      ),
    ).toEqual([]);
  });

  it("markers: the innermost statement holds the offender, so a marker above the outer one fails", () => {
    const failures = run(
      `// row-cap-todo: C1 misplaced\nconst r = await Promise.all(ids.map(async (id) => {\n  const { data } = await db.from("m").select("id").eq("e", id);\n  return data;\n}));`,
    );
    expect(failures.map((f) => f.split(" ").slice(0, 2).join(" "))).toEqual([
      "src/lib/fixture.ts:3 A",
      "src/lib/fixture.ts:1 marker",
    ]);
  });

  it("markers: a marker over a fixed statement fails, so a fix removes it", () => {
    const failures = run(
      `// row-cap-todo: C1 was unbounded\nconst r = await db.from("media").select("id").limit(1000);`,
    );
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(
      /^src\/lib\/fixture\.ts:1 marker sits above no offending statement/,
    );
  });

  it("markers: a todo names ids from TODO_IDS, first, and every marker says why", () => {
    const read = `\nconst r = await db.from("media").select("id");`;
    expect(run(`// row-cap-todo: X9 unknown id${read}`)).toEqual([
      "src/lib/fixture.ts:1 marker X9 is not in TODO_IDS",
    ]);
    expect(run(`// row-cap-todo: the ids are missing${read}`)[0]).toMatch(
      /names its ids first/,
    );
    expect(run(`// row-cap: ok${read}`)[0]).toMatch(/says why/);
  });

  it("markers: a marker-shaped line inside a string is not a marker", () => {
    expect(run("const s = `\n// row-cap: inside a template\n`;")).toEqual([]);
  });

  it("the migration reader: drops count, the latest definition wins, and signatures span lines", () => {
    const live = setReturningFunctions([
      {
        file: "1.sql",
        sql: "create function public.a(p uuid) returns table (id uuid) language sql as $$ select 1 $$;",
      },
      {
        file: "2.sql",
        sql: "create or replace function public.b(\n  p_x int,\n  p_y numeric(10,2) default 1\n)\n returns table(\n id uuid) as $$ $$;",
      },
      {
        file: "3.sql",
        sql: "CREATE FUNCTION public.c() RETURNS SETOF uuid AS $$ $$; create function private.d() returns setof uuid as $$ $$;",
      },
      {
        file: "4.sql",
        sql: "drop function if exists public.a(uuid), public.c() cascade;\n-- create function public.e() returns setof uuid as $$ $$;",
      },
      {
        file: "5.sql",
        sql: "create or replace function public.b(p_x int) returns jsonb as $$ $$;",
      },
    ]);
    expect([...live]).toEqual([["b", false]]);
  });

  it("the config reader: max_rows under [api] only", () => {
    expect(
      configMaxRows(
        "[db]\nmax_rows = 5\n[api]\nenabled = true\nmax_rows = 1000 # the cap\n",
      ),
    ).toBe(1000);
    expect(configMaxRows("[db]\nmax_rows = 5\n")).toBeNull();
  });
});
