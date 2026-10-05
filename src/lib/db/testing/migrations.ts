/**
 * THE MIGRATION SET, READ ONCE AND REPLAYED THE WAY THE DATABASE APPLIED IT (crumbs-77). The SQL guard tests
 * (`row-cap-policy.test.ts`, `row-cap-sql.test.ts`, `migration-guards.test.ts`) each carried a reader of their
 * own, and only some of them knew a `drop function`: `latestDefinition` scanned `create` statements alone, so a
 * function a later file drops still read as defined, and every pin on its body went on passing while it guarded a
 * function that no longer exists. Three readers also meant three answers to what a comment, a string and a
 * dollar-quoted body are. This is the one reader: it lexes each file the way Postgres does (line and block
 * comments, strings, quoted names, dollar-quoted bodies), splits it into statements, and replays the creates and
 * drops of `public` functions in file order. What is left standing is what the live database holds.
 *
 * ★ A FUNCTION IS ITS NAME AND ITS ARGUMENT TYPES. `create or replace` of the same types replaces; of other types
 * it adds an overload (a migration that changes a signature drops the old one on purpose, and the live reel's
 * `upsert_reel_config` held both for a deploy window). A drop names its types and takes exactly that overload, so
 * `drop function public.f(int)` after `create function public.f(p_x integer)` matches: `int`, `integer` and `int4`
 * are one type here, as are the other spellings the files use (`timestamptz`, `double precision`, `public.tier_type`
 * and `tier_type`, a type's size, an array's brackets).
 *
 * ★ THE REPLAY CHECKS ITSELF AGAINST THE FILES' OWN HISTORY. Every file applied cleanly once, so a `create function`
 * (no `or replace`) over an overload the replay holds live, or a `drop function` (no `if exists`) of one it does
 * not, means the replay disagrees with the database: a type the normaliser spells two ways, a statement it could not
 * read. They come back as `conflicts` and `strayDrops`, which `migrations.test.ts` holds to nothing over the real set
 * (but the two `if exists` drops it names), so a reader bug fails there, loudly, instead of leaving a guard quietly
 * reading a stale function.
 *
 * Pure but for the folder read: `replayFunctions` takes the files it replays, so a test hands it fixtures.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** The folder the database's migrations live in (`supabase/migrations/`). */
export const MIGRATIONS_DIR = fileURLToPath(
  new URL("../../../../supabase/migrations", import.meta.url),
);

export type MigrationFile = { file: string; sql: string };

/** One function the set leaves standing: the last statement that wrote this name and these types. */
export type SqlFunction = {
  /** Lower-case unless it was quoted; always in schema `public`. */
  name: string;
  /** The IN argument types, spelled one way each: the overload's identity beside its name. */
  types: string[];
  /** The file whose statement wrote it. */
  file: string;
  /** That whole file as written: a function's grants live outside its body. */
  fileSql: string;
  /** The statement as written, `create` to its `;`, comments kept. */
  raw: string;
  /** The same statement as code: comments gone (inside the body too), whitespace collapsed. */
  code: string;
  /** What sits between the name's parens, as code: `p_x uuid, p_limit integer default null`. */
  params: string;
  /** What follows RETURNS, as code: `jsonb`, `setof uuid`, `table( id uuid, n integer )`; empty when absent. */
  returns: string;
};

export type FunctionReplay = {
  /** Every function standing, in the order each was last written. */
  live: SqlFunction[];
  /** Every drop that took a live function out, in order: what a guard on a dropped name is told. */
  drops: { name: string; types: string[]; file: string }[];
  /** A `drop function` that took nothing: harmless with `if exists`, a replay bug without it. */
  strayDrops: { file: string; statement: string; ifExists: boolean }[];
  /** A `create function` (no `or replace`) over an overload already live: a replay bug, as above. */
  conflicts: { file: string; name: string; types: string[] }[];
};

/* ─────────────────────────────── the files ─────────────────────────────── */

const filesByDir = new Map<string, MigrationFile[]>();

/** Every `.sql` file of a folder, in file-name order: the order the database applied them (each name starts with its version). */
export function readMigrations(dir: string = MIGRATIONS_DIR): MigrationFile[] {
  let files = filesByDir.get(dir);
  if (!files) {
    files = readdirSync(dir)
      .filter((file) => file.endsWith(".sql"))
      .sort()
      .map((file) => ({ file, sql: readFileSync(join(dir, file), "utf8") }));
    filesByDir.set(dir, files);
  }
  return files;
}

let everything: string | null = null;

/** Every migration as written, one string, for a fact that is no function's body (a column, a constraint, a policy). */
export function allMigrations(): string {
  everything ??= readMigrations()
    .map(({ sql }) => sql)
    .join("\n");
  return everything;
}

let executable: MigrationFile[] | null = null;

/** Every migration as code (comments gone, whitespace collapsed), one entry a file: a grant quoted in prose is no grant. */
export function executableMigrations(): MigrationFile[] {
  executable ??= readMigrations().map(({ file, sql }) => ({
    file,
    sql: executableSql(sql, file),
  }));
  return executable;
}

/* ─────────────────────────────── the lexer ─────────────────────────────── */

type Span =
  | { kind: "code" | "comment" | "string" | "ident"; from: number; to: number }
  /** A dollar-quoted string: its inside, `[open, close)`, is a function's body. */
  | { kind: "dollar"; from: number; to: number; open: number; close: number };

/** `$tag$` or `$$`: a tag starts like a name and holds no `$`, so `$1` (a parameter) is never one. */
const DOLLAR_TAG = /\$(?:[A-Za-z_\u0080-\uffff][A-Za-z0-9_\u0080-\uffff]*)?\$/y;

const lineOf = (sql: string, at: number) => sql.slice(0, at).split("\n").length;

/**
 * The text in runs: code, comments, strings (`''` escapes), quoted names (`""`) and dollar-quoted strings, which
 * hold function bodies, so a `;` or a `--` inside one is no statement's end and no comment. Block comments nest, as
 * Postgres's do. A run that never closes is a bug in the file or in this lexer, and says which file and line, since
 * a guard that read past it would read the rest of the set wrong.
 */
function spansOf(sql: string, where: string): Span[] {
  const spans: Span[] = [];
  const n = sql.length;
  let i = 0;
  let codeFrom = 0;
  const emit = (span: Span) => {
    if (span.from > codeFrom) {
      spans.push({ kind: "code", from: codeFrom, to: span.from });
    }
    spans.push(span);
    i = codeFrom = span.to;
  };
  while (i < n) {
    const c = sql[i];
    if (c === "-" && sql[i + 1] === "-") {
      // To the end of the line: the newline itself stays code.
      const end = sql.indexOf("\n", i);
      emit({ kind: "comment", from: i, to: end === -1 ? n : end });
    } else if (c === "/" && sql[i + 1] === "*") {
      let depth = 1;
      let j = i + 2;
      while (j < n && depth > 0) {
        if (sql[j] === "/" && sql[j + 1] === "*") {
          depth += 1;
          j += 2;
        } else if (sql[j] === "*" && sql[j + 1] === "/") {
          depth -= 1;
          j += 2;
        } else {
          j += 1;
        }
      }
      if (depth > 0) {
        throw new Error(
          `${where}: the block comment opened at line ${lineOf(sql, i)} never closes`,
        );
      }
      emit({ kind: "comment", from: i, to: j });
    } else if (c === "'" || c === '"') {
      let j = i + 1;
      for (;;) {
        const k = sql.indexOf(c, j);
        if (k === -1) {
          throw new Error(
            `${where}: the ${c === "'" ? "string" : "quoted name"} opened at line ${lineOf(sql, i)} never closes`,
          );
        }
        // A doubled quote is the escape, not the end.
        if (sql[k + 1] === c) {
          j = k + 2;
          continue;
        }
        j = k + 1;
        break;
      }
      emit({ kind: c === "'" ? "string" : "ident", from: i, to: j });
    } else if (c === "$" && !/[A-Za-z0-9_$]/.test(sql[i - 1] ?? "")) {
      DOLLAR_TAG.lastIndex = i;
      const tag = DOLLAR_TAG.exec(sql);
      if (!tag) {
        i += 1;
        continue;
      }
      const open = i + tag[0].length;
      const close = sql.indexOf(tag[0], open);
      if (close === -1) {
        throw new Error(
          `${where}: the ${tag[0]} body opened at line ${lineOf(sql, i)} never closes`,
        );
      }
      emit({
        kind: "dollar",
        from: i,
        to: close + tag[0].length,
        open,
        close,
      });
    } else {
      i += 1;
    }
  }
  if (n > codeFrom) spans.push({ kind: "code", from: codeFrom, to: n });
  return spans;
}

/** `text` with every character but the line breaks a space, so what follows keeps its offsets and its lines. */
const blank = (text: string) => text.replace(/[^\n]/g, " ");

const collapse = (sql: string) => sql.replace(/\s+/g, " ");

/** The text with its comments blanked and nothing else touched (a body's own comments stay), the same length. */
function maskedOf(sql: string, spans: Span[]): string {
  let out = "";
  for (const span of spans) {
    const text = sql.slice(span.from, span.to);
    out += span.kind === "comment" ? blank(text) : text;
  }
  return out;
}

/**
 * The text with its comments blanked (line and block, never one inside a string or a quoted name), the same
 * length it was. A function body is lexed too, since its comments are comments to Postgres as well; a body that is
 * no SQL at all (prose in a dollar-quoted `comment on`) falls back to the one rule every file follows, `--` to the
 * end of the line.
 */
export function stripComments(sql: string, where = "SQL"): string {
  let out = "";
  for (const span of spansOf(sql, where)) {
    if (span.kind === "comment") {
      out += blank(sql.slice(span.from, span.to));
    } else if (span.kind === "dollar") {
      const inside = sql.slice(span.open, span.close);
      let stripped: string;
      try {
        stripped = stripComments(inside, where);
      } catch {
        stripped = inside.replace(/--[^\n]*/g, blank);
      }
      out +=
        sql.slice(span.from, span.open) +
        stripped +
        sql.slice(span.close, span.to);
    } else {
      out += sql.slice(span.from, span.to);
    }
  }
  return out;
}

/** One file as code a guard can match against: comments gone, whitespace collapsed (never trimmed: a pin may start at a space). */
export function executableSql(sql: string, where = "SQL"): string {
  return collapse(stripComments(sql, where));
}

/**
 * The text with its comments blanked and, inside strings and dollar-quoted bodies, everything blanked too: what is
 * left is the statements' own structure, so a paren or a comma counted in it is never one in a literal. The same
 * length as the file, so an offset in it is an offset in the file.
 */
function skeletonOf(sql: string, spans: Span[]): string {
  let out = "";
  for (const span of spans) {
    const text = sql.slice(span.from, span.to);
    if (span.kind === "comment") out += blank(text);
    else if (span.kind === "string") out += `'${blank(text.slice(1, -1))}'`;
    else if (span.kind === "dollar")
      out +=
        sql.slice(span.from, span.open) +
        blank(sql.slice(span.open, span.close)) +
        sql.slice(span.close, span.to);
    else out += text;
  }
  return out;
}

/** The statements, `[from, to)` with `to` just past the `;`: a `;` ends one only as code, never inside a literal or a body. */
function statementsOf(
  sql: string,
  spans: Span[],
): { from: number; to: number }[] {
  const statements: { from: number; to: number }[] = [];
  let from = -1;
  let last = 0;
  for (const span of spans) {
    if (span.kind === "comment") continue;
    if (span.kind !== "code") {
      if (from === -1) from = span.from;
      last = span.to;
      continue;
    }
    for (let at = span.from; at < span.to; at += 1) {
      const ch = sql[at];
      if (ch === ";") {
        if (from !== -1) statements.push({ from, to: at + 1 });
        from = -1;
      } else if (!/\s/.test(ch)) {
        if (from === -1) from = at;
        last = at + 1;
      }
    }
  }
  if (from !== -1) statements.push({ from, to: last });
  return statements;
}

/* ─────────────────────────────── the parser ─────────────────────────────── */

/** The index of the paren that closes the one at `open` (in a skeleton, where no literal can hold one), or -1. */
function closeOf(text: string, open: number): number {
  let depth = 0;
  for (let at = open; at < text.length; at += 1) {
    if (text[at] === "(") depth += 1;
    else if (text[at] === ")" && (depth -= 1) === 0) return at;
  }
  return -1;
}

/** `text` split at the commas that sit outside every paren. */
function splitTop(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let from = 0;
  for (let at = 0; at < text.length; at += 1) {
    if (text[at] === "(") depth += 1;
    else if (text[at] === ")") depth -= 1;
    else if (text[at] === "," && depth === 0) {
      parts.push(text.slice(from, at));
      from = at + 1;
    }
  }
  parts.push(text.slice(from));
  return parts;
}

/** A name, quoted or not, optionally with its schema. */
const NAME = `(?:"[^"]+"|[A-Za-z_][A-Za-z0-9_$]*)`;
const QUALIFIED = new RegExp(`^${NAME}(?:\\s*\\.\\s*${NAME})?`);
const CREATE = /^create\s+(or\s+replace\s+)?function\s+/i;
const DROP = /^drop\s+function\s+(if\s+exists\s+)?/i;

/** `public.foo`, `"foo"` or `foo` as `foo`; null for any other schema's function. */
function publicName(qualified: string): string | null {
  const parts = qualified
    .split(/\s*\.\s*/)
    .map((part) =>
      part.startsWith('"') ? part.slice(1, -1) : part.toLowerCase(),
    );
  if (parts.length === 1) return parts[0];
  return parts[0] === "public" ? parts[1] : null;
}

/** The spellings a file may use for one type: Postgres's own aliases, which a drop and a create need not share. */
const TYPE_ALIASES: Record<string, string> = {
  int: "integer",
  int4: "integer",
  int8: "bigint",
  int2: "smallint",
  bool: "boolean",
  float4: "real",
  float8: "double precision",
  float: "double precision",
  decimal: "numeric",
  varchar: "character varying",
  char: "character",
  bpchar: "character",
  timestamptz: "timestamp with time zone",
  timestamp: "timestamp without time zone",
  timetz: "time with time zone",
  time: "time without time zone",
};

/** The types spelled with more than one word, joined so an argument splits into its name and its type. */
const MULTI_WORD: [RegExp, string][] = [
  [/\bdouble\s+precision\b/gi, "double_precision"],
  [/\bcharacter\s+varying\b/gi, "varchar"],
  [/\bbit\s+varying\b/gi, "varbit"],
  [/\b(timestamp|time)\s+with\s+time\s+zone\b/gi, "$1tz"],
  [/\b(timestamp|time)\s+without\s+time\s+zone\b/gi, "$1"],
];

/** One type, spelled the one way: no schema of ours, no size, its aliases resolved, an array as `[]` (its dimensions are no part of the type). */
function typeOf(raw: string): string {
  let type = raw.toLowerCase().replace(/"/g, "").trim();
  const array = /\s*\[\s*\d*\s*\]|\s+array\b/.test(type);
  type = type
    .replace(/\s*\[\s*\d*\s*\]/g, "")
    .replace(/\s+array\b/g, "")
    .replace(/\(.*\)$/, "")
    .replace(/^(?:public|pg_catalog)\./, "")
    .replace("double_precision", "double precision")
    .trim();
  return (TYPE_ALIASES[type] ?? type) + (array ? "[]" : "");
}

/** The type an argument contributes to its function's identity, or null for an OUT argument (a result column, not an input). */
function argumentType(argument: string): string | null {
  // A size and an array's brackets belong to the word before them (`numeric (10,2)`, `uuid []`, `uuid array`).
  let text = argument
    .trim()
    .replace(/\s+\(/g, "(")
    .replace(/\s+array\b/gi, "[]")
    .replace(/\s+\[/g, "[");
  // A default is no part of a signature.
  const cut = /\s+default\b|\s*=/i.exec(text);
  if (cut) text = text.slice(0, cut.index);
  const mode = /^(inout|in|out|variadic)\s+/i.exec(text);
  if (mode) {
    if (mode[1].toLowerCase() === "out") return null;
    text = text.slice(mode[0].length);
  }
  for (const [pattern, joined] of MULTI_WORD)
    text = text.replace(pattern, joined);
  // `p_name type` in a create, `type` alone in a drop.
  const words = text.trim().split(/\s+/);
  return typeOf(words.length > 1 ? words.slice(1).join(" ") : words[0]);
}

/** The identity types of an argument list's text (a skeleton's, between the parens). */
function typesOf(list: string): string[] {
  if (list.trim() === "") return [];
  return splitTop(list)
    .map(argumentType)
    .filter((type): type is string => type !== null);
}

/** What follows RETURNS, from the text after the parameter list: a `table( ... )` whole, else up to the first clause. */
function returnsOf(tail: string): string {
  const returns = /^\s*returns\s+/i.exec(tail);
  if (!returns) return "";
  const rest = tail.slice(returns[0].length);
  if (/^table\s*\(/i.test(rest)) {
    const close = closeOf(rest, rest.indexOf("("));
    return collapse(close === -1 ? rest : rest.slice(0, close + 1)).trim();
  }
  const clause =
    /\s(?:language|stable|immutable|volatile|security|set|as|strict|called|parallel|cost|rows|leakproof|window|return|not)\b/i.exec(
      rest,
    );
  return collapse(clause ? rest.slice(0, clause.index) : rest).trim();
}

const identity = (name: string, types: string[]) =>
  `${name}(${types.join(",")})`;

/**
 * Replay the creates and drops of `public` functions across the files, in file order and statement by statement,
 * and say what is left standing. The header says what a function is, and what `conflicts` and `strayDrops` mean.
 */
export function replayFunctions(
  files: readonly MigrationFile[],
): FunctionReplay {
  const live = new Map<string, SqlFunction>();
  const replay: FunctionReplay = {
    live: [],
    drops: [],
    strayDrops: [],
    conflicts: [],
  };
  for (const { file, sql } of files) {
    const spans = spansOf(sql, file);
    const skeleton = skeletonOf(sql, spans);
    const masked = maskedOf(sql, spans);
    for (const { from, to } of statementsOf(sql, spans)) {
      const statement = skeleton.slice(from, to);

      const create = CREATE.exec(statement);
      if (create) {
        const afterKeyword = from + create[0].length;
        const named = QUALIFIED.exec(skeleton.slice(afterKeyword, to));
        const name = named && publicName(named[0]);
        if (!named || name === null) continue;
        const afterName = afterKeyword + named[0].length;
        const paren = /^\s*\(/.exec(skeleton.slice(afterName, to));
        const open = paren ? afterName + paren[0].length - 1 : -1;
        const close = open === -1 ? -1 : closeOf(skeleton, open);
        if (close === -1 || close >= to) {
          throw new Error(
            `${file}: the parameter list of ${name} (line ${lineOf(sql, from)}) is not one the reader can find`,
          );
        }
        const types = typesOf(skeleton.slice(open + 1, close));
        const key = identity(name, types);
        if (live.has(key) && !create[1]) {
          replay.conflicts.push({ file, name, types });
        }
        // Written again, so it moves to the end: the order is the order each was last written in.
        live.delete(key);
        const raw = sql.slice(from, to);
        live.set(key, {
          name,
          types,
          file,
          fileSql: sql,
          raw,
          code: collapse(stripComments(raw, file)).trim(),
          params: collapse(masked.slice(open + 1, close)).trim(),
          returns: returnsOf(skeleton.slice(close + 1, to)),
        });
        continue;
      }

      const drop = DROP.exec(statement);
      if (!drop) continue;
      // A drop may name several functions, `drop function a(uuid), b() cascade;`
      const list = statement
        .slice(drop[0].length)
        .replace(/\s+(?:cascade|restrict)\s*;?\s*$/i, "")
        .replace(/;\s*$/, "");
      for (const item of splitTop(list).map((part) => part.trim())) {
        const named = QUALIFIED.exec(item);
        const name = named && publicName(named[0]);
        if (!named || name === null) continue;
        const rest = item.slice(named[0].length).trim();
        let hit: SqlFunction | undefined;
        if (rest.startsWith("(")) {
          const close = closeOf(rest, 0);
          if (close === -1) {
            throw new Error(
              `${file}: a drop of ${name} (line ${lineOf(sql, from)}) has a list the reader cannot close`,
            );
          }
          hit = live.get(identity(name, typesOf(rest.slice(1, close))));
        } else {
          // `drop function f;` names the one overload there is.
          const overloads = [...live.values()].filter((f) => f.name === name);
          if (overloads.length === 1) hit = overloads[0];
        }
        if (hit) {
          live.delete(identity(hit.name, hit.types));
          replay.drops.push({ name, types: hit.types, file });
        } else {
          replay.strayDrops.push({
            file,
            statement: collapse(sql.slice(from, to)).trim(),
            ifExists: Boolean(drop[1]),
          });
        }
      }
    }
  }
  replay.live = [...live.values()];
  return replay;
}

/* ─────────────────────────── the real set, read once ─────────────────────────── */

let real: FunctionReplay | null = null;

/** The real set's replay, made on first use: a test file reads it many times, and the files do not change under it. */
export function realReplay(): FunctionReplay {
  real ??= replayFunctions(readMigrations());
  return real;
}

/** Every `public` function the real migration set leaves standing. */
export const liveFunctions = (): SqlFunction[] => realReplay().live;

/**
 * The definition that wins on the live database for a name: the last one written of the overloads standing. A name
 * the set drops (and never makes again) throws and says which file took it out, because a pin on a dropped
 * function's body is a pin on nothing.
 */
export function liveFunction(name: string): SqlFunction {
  const { live, drops } = realReplay();
  const standing = live.filter((f) => f.name === name);
  if (standing.length > 0) return standing[standing.length - 1];
  const dropped = drops.filter((d) => d.name === name).pop();
  throw new Error(
    dropped
      ? `public.${name} is not live: ${dropped.file} drops it, and nothing later makes it again`
      : `public.${name} is defined nowhere in the migrations`,
  );
}
