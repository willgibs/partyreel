#!/usr/bin/env node
/**
 * THE REVIEW TRANSCRIPT (the Library x Lab round, 2026-09-15). Will reviews a
 * board in the lab, the session composes one message in the ledger grammar, he
 * pastes it into chat, and the Orchestrator runs this:
 *
 *   pnpm lab:review 'review light r4: aurora=yes "on paper too"; cadence=8s'
 *   pnpm lab:review < message.txt          # or piped, for a multi-board paste
 *   pnpm lab:review --dry '<line>'         # parse and validate, write nothing
 *
 * The grammar is stated once, in docs/reviews/README.md:
 *
 *   review <board> r<n>: <ask>=<option> "a note"; <ask>=<option>; note: "a board note"
 *
 * Every board, round, ask and option is validated against the board's own spec
 * (src/app/(dev)/design/sandbox/<board>/spec.ts) before anything is written,
 * and a refusal names the line and column of the token it refused. The whole
 * message is all-or-nothing: one bad token writes nothing at all, so a paste is
 * never half-applied.
 *
 * Node builtins only, and the specs are read by a masking scanner rather than
 * imported, because a spec is TypeScript behind the `@/` alias and this has to
 * run with no build step. That is the lab-smoke.mjs precedent (it reads
 * legacy-routes.ts the same way); the safety net is the same too, a real test
 * that holds the reader to a spec on disk. The scanner blanks the inside of
 * every string, template and comment first, so a `because:` sentence that
 * happens to contain "asks:" can never be mistaken for structure.
 *
 * Flags: --root <dir> (default: cwd, and what the test points at a scratch
 * tree), --by <name> (default Will), --at <iso>, --dry, --json, --help.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SANDBOX = ["src", "app", "(dev)", "design", "sandbox"];
const REVIEWS = ["docs", "reviews"];

/** A refusal the reader can act on: what was wrong, and where in the paste. */
export class ReviewError extends Error {
  constructor(message, { line = 0, column = 0 } = {}) {
    super(message);
    this.name = "ReviewError";
    this.line = line;
    this.column = column;
  }
  get display() {
    return this.line
      ? `line ${this.line}, column ${this.column}: ${this.message}`
      : this.message;
  }
}

// ── The TypeScript scanner ───────────────────────────────────────────────────

/**
 * A same-length copy of `src` with the inside of every string, template and
 * comment replaced by spaces. Structure is then found on the mask and values
 * are read from the source at the same offsets, which is what makes a prose
 * sentence inside a spec unable to look like a key.
 */
export function mask(src) {
  const out = new Array(src.length);
  let i = 0;
  const blank = (n) => {
    for (let k = 0; k < n; k++) out[i + k] = " ";
    i += n;
  };
  const keep = () => {
    out[i] = src[i];
    i += 1;
  };
  while (i < src.length) {
    const c = src[i];
    const next = src[i + 1];
    if (c === "/" && next === "/") {
      const end = src.indexOf("\n", i);
      blank((end < 0 ? src.length : end) - i);
      continue;
    }
    if (c === "/" && next === "*") {
      const end = src.indexOf("*/", i + 2);
      blank((end < 0 ? src.length : end + 2) - i);
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      keep(); // the delimiter stays, so a value's extent is still findable
      while (i < src.length && src[i] !== c) {
        if (src[i] === "\\") {
          blank(Math.min(2, src.length - i));
          continue;
        }
        blank(1);
      }
      if (i < src.length) keep();
      continue;
    }
    keep();
  }
  return out.join("");
}

/** The index of the bracket matching the one at `open`, on a masked source. */
function matchBracket(masked, open) {
  const pairs = { "{": "}", "[": "]", "(": ")" };
  const close = pairs[masked[open]];
  if (!close) throw new ReviewError(`not a bracket at ${open}`);
  let depth = 0;
  for (let i = open; i < masked.length; i++) {
    if (masked[i] === masked[open]) depth++;
    else if (masked[i] === close && --depth === 0) return i;
  }
  throw new ReviewError(`unbalanced ${masked[open]} at ${open}`);
}

const IDENT = /[A-Za-z_$][\w$]*/y;

/**
 * The top-level `key: value` pairs between `start` and `end` (the inside of an
 * object literal), as value RANGES into the source. Nested objects and arrays
 * are skipped whole, so only this object's own keys are returned.
 */
function entriesOf(masked, start, end) {
  const out = new Map();
  let i = start;
  let depth = 0;
  while (i < end) {
    const c = masked[i];
    if (c === "{" || c === "[" || c === "(") {
      i = matchBracket(masked, i) + 1;
      continue;
    }
    if (depth === 0) {
      IDENT.lastIndex = i;
      const m = IDENT.exec(masked);
      if (m && m.index === i) {
        let j = i + m[0].length;
        while (j < end && /\s/.test(masked[j])) j++;
        if (masked[j] === ":") {
          let v = j + 1;
          while (v < end && /\s/.test(masked[v])) v++;
          let stop = v;
          while (stop < end) {
            const d = masked[stop];
            if (d === "{" || d === "[" || d === "(") {
              stop = matchBracket(masked, stop) + 1;
              continue;
            }
            if (d === ",") break;
            stop++;
          }
          out.set(m[0], [v, stop]);
          i = stop + 1;
          continue;
        }
        i = j;
        continue;
      }
    }
    i++;
  }
  return out;
}

const STRING = /"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'/g;

function stringsIn(src, range) {
  const slice = src.slice(range[0], range[1]);
  const out = [];
  STRING.lastIndex = 0;
  let m;
  while ((m = STRING.exec(slice)) !== null) out.push(m[1] ?? m[2] ?? "");
  return out;
}

function stringAt(src, range) {
  return stringsIn(src, range)[0] ?? null;
}

function numberAt(src, range) {
  const m = /-?\d+(?:\.\d+)?/.exec(src.slice(range[0], range[1]));
  return m ? Number(m[0]) : null;
}

/**
 * One board's spec as the fields this script validates against: the id (the
 * directory, which is the board), the round it is in, and every ask with its
 * options. Anything else in a spec is for the board page to render.
 */
export function readSpec(id, source) {
  const masked = mask(source);
  const open = masked.indexOf("{", masked.indexOf("defineBoard"));
  if (open < 0) throw new ReviewError(`${id}/spec.ts: no defineBoard({ ... })`);
  const top = entriesOf(masked, open + 1, matchBracket(masked, open));
  const roundRange = top.get("round");
  const round = roundRange
    ? numberAt(
        source,
        entriesOf(
          masked,
          roundRange[0] + 1,
          matchBracket(masked, roundRange[0]),
        ).get("n") ?? roundRange,
      )
    : null;
  const asksRange = top.get("asks");
  const asks = [];
  if (asksRange) {
    const inside = matchBracket(masked, asksRange[0]);
    let i = asksRange[0] + 1;
    while (i < inside) {
      if (masked[i] !== "{") {
        i++;
        continue;
      }
      const close = matchBracket(masked, i);
      const fields = entriesOf(masked, i + 1, close);
      const askId = fields.has("id") ? stringAt(source, fields.get("id")) : null;
      const options = fields.has("options")
        ? stringsIn(source, fields.get("options"))
        : [];
      if (askId) {
        asks.push({
          id: askId,
          question: fields.has("question")
            ? stringAt(source, fields.get("question"))
            : null,
          options,
          recommended: fields.has("recommended")
            ? stringAt(source, fields.get("recommended"))
            : null,
        });
      }
      i = close + 1;
    }
  }
  return { id, round, asks };
}

/** Every standing board's spec, by id. An unreadable spec is a loud failure. */
export function readSpecs(root) {
  const dir = join(root, ...SANDBOX);
  const out = new Map();
  let boards = [];
  try {
    boards = readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    throw new ReviewError(`no sandbox directory at ${dir}`);
  }
  for (const id of boards.sort()) {
    const file = join(dir, id, "spec.ts");
    if (!existsSync(file)) continue;
    out.set(id, readSpec(id, readFileSync(file, "utf8")));
  }
  return out;
}

// ── The message grammar ──────────────────────────────────────────────────────

const TOKEN = /[^\s;"=]+/y;

function readQuoted(line, at, lineNo) {
  let i = at + 1;
  let value = "";
  while (i < line.length) {
    const c = line[i];
    if (c === "\\" && i + 1 < line.length) {
      value += line[i + 1];
      i += 2;
      continue;
    }
    if (c === '"') return { value, end: i + 1 };
    value += c;
    i++;
  }
  throw new ReviewError("a note is missing its closing quote", {
    line: lineNo,
    column: at + 1,
  });
}

function readToken(line, at, lineNo, what) {
  TOKEN.lastIndex = at;
  const m = TOKEN.exec(line);
  if (!m || m.index !== at || m[0] === "") {
    throw new ReviewError(`expected ${what}`, { line: lineNo, column: at + 1 });
  }
  return { value: m[0], end: at + m[0].length };
}

const skipSpace = (line, at) => {
  let i = at;
  while (i < line.length && /\s/.test(line[i])) i++;
  return i;
};

/**
 * One line of the grammar, with every token's column kept so a refusal can
 * point at it. A blank line and a `#` comment line parse to null.
 */
export function parseLine(raw, lineNo = 1) {
  const line = raw.replace(/\s+$/, "");
  if (!line.trim() || line.trim().startsWith("#")) return null;
  const head = /^\s*review\s+/.exec(line);
  if (!head) {
    throw new ReviewError(
      'a line must start with "review <board> r<n>:"',
      { line: lineNo, column: skipSpace(line, 0) + 1 },
    );
  }
  let i = head[0].length;
  const board = readToken(line, i, lineNo, "a board id");
  const boardAt = i + 1;
  i = skipSpace(line, board.end);
  const round = /^r(\d+)/.exec(line.slice(i));
  if (!round) {
    throw new ReviewError('expected the round, as "r4"', {
      line: lineNo,
      column: i + 1,
    });
  }
  const roundAt = i + 1;
  i = skipSpace(line, i + round[0].length);
  if (line[i] !== ":") {
    throw new ReviewError('expected ":" after the round', {
      line: lineNo,
      column: i + 1,
    });
  }
  i++;

  const answers = [];
  const notes = [];
  while (true) {
    i = skipSpace(line, i);
    if (i >= line.length) break;
    const noteHead = /^note\s*:/.exec(line.slice(i));
    if (noteHead) {
      i = skipSpace(line, i + noteHead[0].length);
      if (line[i] !== '"') {
        throw new ReviewError("a board note must be quoted", {
          line: lineNo,
          column: i + 1,
        });
      }
      const q = readQuoted(line, i, lineNo);
      notes.push({ text: q.value, column: i + 1 });
      i = q.end;
    } else {
      const ask = readToken(line, i, lineNo, "an ask id");
      const askAt = i + 1;
      i = ask.end;
      if (line[i] !== "=") {
        throw new ReviewError('expected "=" after the ask', {
          line: lineNo,
          column: i + 1,
        });
      }
      i++;
      const choice = readToken(line, i, lineNo, "an option");
      const choiceAt = i + 1;
      i = skipSpace(line, choice.end);
      let note;
      if (line[i] === '"') {
        const q = readQuoted(line, i, lineNo);
        note = q.value;
        i = q.end;
      }
      answers.push({
        ask: ask.value,
        askAt,
        choice: choice.value,
        choiceAt,
        note,
      });
    }
    i = skipSpace(line, i);
    if (i >= line.length) break;
    if (line[i] !== ";") {
      throw new ReviewError('expected ";" between entries', {
        line: lineNo,
        column: i + 1,
      });
    }
    i++;
  }
  if (answers.length === 0 && notes.length === 0) {
    throw new ReviewError("the line carries no answer and no note", {
      line: lineNo,
      column: line.length + 1,
    });
  }
  return {
    board: board.value,
    boardAt,
    round: Number(round[1]),
    roundAt,
    answers,
    notes,
    line: lineNo,
  };
}

/** Every line of a paste. A parse failure on any line stops the whole message. */
export function parseMessage(text) {
  return text
    .split("\n")
    .map((raw, at) => parseLine(raw, at + 1))
    .filter((x) => x !== null);
}

const list = (xs) => xs.join(", ");

/** Every refusal in the message, against the specs; an empty array means go. */
export function validate(entries, specs) {
  const errors = [];
  const at = (line, column, message) =>
    errors.push(new ReviewError(message, { line, column }));
  for (const e of entries) {
    const spec = specs.get(e.board);
    if (!spec) {
      at(
        e.line,
        e.boardAt,
        specs.size === 0
          ? `no board carries a spec yet, so "${e.board}" cannot be checked`
          : `"${e.board}" is not a standing board (${list([...specs.keys()])})`,
      );
      continue;
    }
    if (spec.round !== null && e.round !== spec.round) {
      at(
        e.line,
        e.roundAt,
        `${e.board} is in round ${spec.round}, not r${e.round}`,
      );
    }
    for (const a of e.answers) {
      const ask = spec.asks.find((x) => x.id === a.ask);
      if (!ask) {
        at(
          e.line,
          a.askAt,
          `"${a.ask}" is not an ask on ${e.board} (${list(spec.asks.map((x) => x.id))})`,
        );
        continue;
      }
      if (!ask.options.includes(a.choice)) {
        at(
          e.line,
          a.choiceAt,
          `"${a.choice}" is not an option of ${e.board}.${a.ask} (${list(ask.options)})`,
        );
      }
    }
    const seen = new Set();
    for (const a of e.answers) {
      if (seen.has(a.ask)) {
        at(e.line, a.askAt, `"${a.ask}" is answered twice on this line`);
      }
      seen.add(a.ask);
    }
  }
  return errors;
}

// ── The ledgers ──────────────────────────────────────────────────────────────

const EMPTY = (board) => ({ board, rounds: [] });

function ledgerPath(root, board) {
  return join(root, ...REVIEWS, `${board}.json`);
}

function readLedger(root, board) {
  const file = ledgerPath(root, board);
  if (!existsSync(file)) return EMPTY(board);
  try {
    const value = JSON.parse(readFileSync(file, "utf8"));
    if (!value || typeof value !== "object" || !Array.isArray(value.rounds)) {
      throw new Error("shape");
    }
    return value;
  } catch {
    throw new ReviewError(
      `${file} is not a ledger (see docs/reviews/README.md for the shape)`,
    );
  }
}

/**
 * The entries applied to their ledgers, in memory. One answer per ask per
 * round: answering again in the same round overwrites, and git keeps the
 * first, which is exactly what the README promises.
 */
export function applyEntries(root, entries, { by, at }) {
  const changed = new Map();
  const summary = [];
  for (const e of entries) {
    const ledger = changed.get(e.board) ?? readLedger(root, e.board);
    changed.set(e.board, ledger);
    let round = ledger.rounds.find((r) => Number(r.n) === e.round);
    if (!round) {
      round = { n: e.round, opened: at.slice(0, 10), answers: [], notes: [] };
      ledger.rounds.push(round);
      ledger.rounds.sort((a, b) => Number(a.n) - Number(b.n));
    }
    if (!Array.isArray(round.answers)) round.answers = [];
    if (!Array.isArray(round.notes)) round.notes = [];
    for (const a of e.answers) {
      const entry = { ask: a.ask, choice: a.choice };
      if (a.note) entry.note = a.note;
      entry.by = by;
      entry.at = at;
      const was = round.answers.findIndex((x) => x.ask === a.ask);
      if (was < 0) round.answers.push(entry);
      else round.answers[was] = entry;
      summary.push([
        `${e.board} r${e.round}`,
        a.ask,
        a.choice,
        was < 0 ? "new" : "replaced",
      ]);
    }
    for (const n of e.notes) {
      round.notes.push({ on: null, text: n.text, by, at });
      summary.push([`${e.board} r${e.round}`, "note", n.text, "added"]);
    }
  }
  return { ledgers: changed, summary };
}

export function writeLedgers(root, ledgers) {
  const dir = join(root, ...REVIEWS);
  mkdirSync(dir, { recursive: true });
  for (const [board, ledger] of ledgers) {
    writeFileSync(ledgerPath(root, board), `${JSON.stringify(ledger, null, 2)}\n`);
  }
}

/**
 * The whole run: parse, validate against the specs, apply, write. Nothing is
 * written unless every line is good.
 */
export function run(text, { root = process.cwd(), by = "Will", at, dry = false } = {}) {
  const stamp = at ?? new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const entries = parseMessage(text);
  if (entries.length === 0) throw new ReviewError("nothing to record");
  const specs = readSpecs(root);
  const errors = validate(entries, specs);
  if (errors.length) return { ok: false, errors, summary: [] };
  const { ledgers, summary } = applyEntries(root, entries, { by, at: stamp });
  if (!dry) writeLedgers(root, ledgers);
  return { ok: true, errors: [], summary, boards: [...ledgers.keys()] };
}

// ── The command ──────────────────────────────────────────────────────────────

const HELP = `pnpm lab:review "<the pasted line>"

  review <board> r<n>: <ask>=<option> "a note"; <ask>=<option>; note: "a board note"

  --root <dir>   the repo to write into (default: this one)
  --by <name>    who answered (default: Will)
  --at <iso>     the timestamp to record (default: now)
  --dry          parse and validate, write nothing
  --json         print the result as JSON
  --help`;

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function main(argv) {
  const flag = (name, fallback) =>
    argv.includes(name) ? (argv[argv.indexOf(name) + 1] ?? fallback) : fallback;
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(HELP);
    return 0;
  }
  const positional = argv.filter(
    (a, i) =>
      !a.startsWith("--") &&
      !["--root", "--by", "--at"].includes(argv[i - 1] ?? ""),
  );
  const text = positional.join("\n") || readStdin();
  if (!text.trim()) {
    console.error("lab-review: nothing to record (pass the line, or pipe it)");
    console.error(HELP);
    return 1;
  }
  let result;
  try {
    result = run(text, {
      root: flag("--root", process.cwd()),
      by: flag("--by", "Will"),
      at: flag("--at", undefined),
      dry: argv.includes("--dry"),
    });
  } catch (err) {
    if (!(err instanceof ReviewError)) throw err;
    console.error(`lab-review refused: ${err.display}`);
    return 1;
  }
  if (argv.includes("--json")) {
    console.log(
      JSON.stringify(
        {
          ok: result.ok,
          summary: result.summary,
          errors: result.errors.map((e) => ({
            line: e.line,
            column: e.column,
            message: e.message,
          })),
        },
        null,
        2,
      ),
    );
    return result.ok ? 0 : 1;
  }
  if (!result.ok) {
    console.error(
      `lab-review refused the message; nothing was written (${result.errors.length} problem${result.errors.length === 1 ? "" : "s"}):`,
    );
    for (const e of result.errors) console.error(`  ${e.display}`);
    return 1;
  }
  const w = (i) => Math.max(...result.summary.map((r) => String(r[i]).length));
  for (const row of result.summary) {
    console.log(
      `${String(row[0]).padEnd(w(0))}  ${String(row[1]).padEnd(w(1))}  ${String(row[2]).padEnd(w(2))}  ${row[3]}`,
    );
  }
  console.log(
    `\n${result.summary.length} recorded in ${result.boards.map((b) => `docs/reviews/${b}.json`).join(", ")}${argv.includes("--dry") ? " (dry run: nothing written)" : ""}`,
  );
  return 0;
}

// Runs only when invoked directly, so the test can import the pieces above.
if (
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  process.exit(main(process.argv.slice(2)));
}

export const __dirnameOfScript = dirname(fileURLToPath(import.meta.url));
