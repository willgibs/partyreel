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
 *   review <board> r<n>: <ask>=<option> "a note"; item:<id>=keep|refine|kill "a note"; call:<id>=yes|no "a note"; note: "a board note"
 *   review <board> r<n>: <ask>=? "what was unclear"     (not answered: the question needs rewording)
 *   review <board> r<n>: <ask>=stands "the earlier ruling stands"   (an overtaken question, left to its ruling)
 *   review library: <entry-id>=keep|redesign|retire "a note"
 *
 * `?` is the reviewer's own answer, "this question is not clear to me" (Will's
 * first review, 2026-09-15, skipped two asks for exactly that reason and the
 * ledger had no way to say so). It always needs a note, it is stored as
 * `choice: null`, and the desk shows the ask as waiting on a clearer question
 * rather than as answered.
 *
 * `item:<id>=<verdict>` is a ruling on ONE catalog card (the revamp,
 * 2026-09-16), which is how an exploration comes back as "keep these three,
 * refine that one, kill the rest" rather than as one answer about twelve
 * things. The `item:` prefix keeps the two namespaces apart: an ask id and a
 * candidate id are both one token, and a board is free to use the same word for
 * both. `review library:` is the same gesture on a Library entry
 * (keep | redesign | retire), landing in docs/reviews/_library.json, which is
 * the redesign queue the desk shows and the Orchestrator cuts tracks from.
 *
 * Every board, round, ask, option, item and verdict is validated against the
 * board's own spec (src/app/(dev)/design/sandbox/<board>/spec.ts), and every
 * Library entry against rules.generated.json, before anything is written,
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
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SANDBOX = ["src", "app", "(dev)", "design", "sandbox"];
const REVIEWS = ["docs", "reviews"];
const RULES = [
  "src",
  "app",
  "(dev)",
  "design",
  "rules",
  "rules.generated.json",
];

/** The two ladders, mirrored from board-spec.ts's ITEM_VERDICTS / LIBRARY_VERDICTS. */
const ITEM_VERDICTS = ["keep", "refine", "kill"];
/**
 * THE RESERVED ANSWER (Will, 2026-09-19): a question a later ruling reached,
 * left to that ruling. "I'd still like to see the explorations that were
 * voided by my decisions ... add an optional trash button to kill the question
 * in the board if no answer"; what that press actually says is that the
 * earlier ruling holds, so it is recorded as the answer it is rather than as a
 * deletion. Mirrored from sandbox/overtaken.ts, which is the desk's side of
 * the mechanism, and read off that file below so the word is only ever
 * accepted on a question the map actually names.
 */
const STANDS = "stands";
const OVERTAKEN = ["src", "app", "(dev)", "design", "sandbox", "overtaken.ts"];
const LIBRARY_VERDICTS = ["keep", "redesign", "retire"];
/** The Library's line carries no round; the ledger stores one ruling per entry. */
export const LIBRARY_LEDGER = "_library";
/** The round's own notes, where an override on an overtaken question is echoed. */
export const WINDOW_LEDGER = "_window";

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

/**
 * The option IDS of an `options: [...]` array, in order. An option is either a
 * bare string (the transitional form) or an object whose `id` is the token
 * the ledger stores; its `label` and `means` are prose and never options, so
 * they are read off each object's own entries rather than swept up by
 * `stringsIn` (which would let a label pass as a choice).
 */
function optionIdsIn(masked, src, range) {
  const open = range[0];
  if (masked[open] !== "[") return stringsIn(src, range);
  const close = matchBracket(masked, open);
  const out = [];
  let i = open + 1;
  while (i < close) {
    const c = masked[i];
    if (c === '"' || c === "'" || c === "`") {
      const end = masked.indexOf(c, i + 1);
      if (end < 0 || end > close) break;
      out.push(src.slice(i + 1, end));
      i = end + 1;
      continue;
    }
    if (c === "{") {
      const end = matchBracket(masked, i);
      const id = entriesOf(masked, i + 1, end).get("id");
      if (id) out.push(stringAt(src, id));
      i = end + 1;
      continue;
    }
    if (c === "[" || c === "(") {
      i = matchBracket(masked, i) + 1;
      continue;
    }
    i++;
  }
  return out.filter((x) => x !== null);
}

function numberAt(src, range) {
  const m = /-?\d+(?:\.\d+)?/.exec(src.slice(range[0], range[1]));
  return m ? Number(m[0]) : null;
}

/**
 * THE CANDIDATE IDS OF A `candidates:` VALUE, or null when they cannot be read
 * off the page.
 *
 * ★ ONE HOP, AND NO FURTHER. An array literal is read where it stands; a bare
 * reference (`candidates: ITEMS`) is resolved to a `const ITEMS = [...]` in the
 * SAME file, because that is the shape every catalog board is scaffolded in and
 * writing the same twelve objects twice would be worse. Anything else, and a
 * `.map` over another module is the case that bit the palette board, reads as
 * NO items: the scanner refuses to guess, and `validate` tells the author to
 * write them out. A silent empty list would accept any item id for ever.
 */
function candidateIdsIn(masked, src, range) {
  if (masked[range[0]] === "[") return optionIdsIn(masked, src, range);
  IDENT.lastIndex = range[0];
  const m = IDENT.exec(masked);
  if (!m || m.index !== range[0]) return null;
  // A reference and nothing else: `ITEMS`, never `ITEMS.map(...)` or a call.
  if (masked.slice(range[0] + m[0].length, range[1]).trim() !== "") return null;
  const at = arrayOfConst(masked, m[0]);
  return at === null ? null : optionIdsIn(masked, src, [at, masked.length]);
}

/** The index of the `[` a `const <name> ... = [` opens, or null. */
function arrayOfConst(masked, name) {
  const decl = new RegExp(`\\bconst\\s+${name}\\b`).exec(masked);
  if (!decl) return null;
  let i = decl.index + decl[0].length;
  // Past the type annotation, whose own `[]` must not be mistaken for the
  // value: the assignment is the first `=` that is not part of =>, ==, >= or !=.
  while (i < masked.length) {
    if (
      masked[i] === "=" &&
      masked[i + 1] !== "=" &&
      masked[i + 1] !== ">" &&
      !"=!<>".includes(masked[i - 1])
    )
      break;
    i++;
  }
  i++;
  while (i < masked.length && /\s/.test(masked[i])) i++;
  return masked[i] === "[" ? i : null;
}

/**
 * One board's spec as the fields this script validates against: the id (the
 * directory, which is the board), the round it is in, every ask with its
 * options, whether its candidates are declared a CATALOG, and their ids, and
 * the ids of every call it carried. Anything else in a spec is for the board
 * page to render.
 */
export function readSpec(id, source) {
  const masked = mask(source);
  /**
   * ★ THE SHAPE IS FOUND, NOT ASSUMED, AND A FILE IT CANNOT READ IS REFUSED.
   *
   * This was `masked.indexOf("{", masked.indexOf("defineBoard("))`, and when
   * `defineBoard(` was absent the inner call returned -1, `indexOf("{", -1)`
   * CLAMPED TO 0, and the scanner read the first `{` anywhere in the file. A
   * spec it did not understand was therefore mis-scanned into
   * `{ round: null, asks: [] }` rather than refused, and a null round skips the
   * round check entirely (`validate`: `if (spec.round !== null && ...)`). The
   * throw could only ever fire on a file with no brace at all.
   *
   * `defineExploration` is the question-first shape (2026-09-17): different
   * constructor, same keys on disk (`id`, `round.n`, `asks[].id`, option ids),
   * because those keys are what this scanner and every ledger already speak.
   */
  const call = /\bdefine(?:Board|Exploration)\s*\(/.exec(masked);
  if (!call)
    throw new ReviewError(
      `${id}/spec.ts: no defineBoard({ ... }) or defineExploration({ ... })`,
    );
  const open = masked.indexOf("{", call.index + call[0].length);
  if (open < 0)
    throw new ReviewError(
      `${id}/spec.ts: ${call[0].trim()} opens no object literal`,
    );
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
      const askId = fields.has("id")
        ? stringAt(source, fields.get("id"))
        : null;
      const options = fields.has("options")
        ? optionIdsIn(masked, source, fields.get("options"))
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
  const carriedRange = top.get("carried");
  const calls = [];
  if (carriedRange) {
    const inside = matchBracket(masked, carriedRange[0]);
    let i = carriedRange[0] + 1;
    while (i < inside) {
      if (masked[i] !== "{") {
        i++;
        continue;
      }
      const close = matchBracket(masked, i);
      const fields = entriesOf(masked, i + 1, close);
      const callId = fields.has("id")
        ? stringAt(source, fields.get("id"))
        : null;
      if (callId) calls.push(callId);
      i = close + 1;
    }
  }
  const catalog = top.has("catalog");
  const items = top.has("candidates")
    ? candidateIdsIn(masked, source, top.get("candidates"))
    : null;
  return { id, round, asks, catalog, items, calls };
}

/**
 * THE ASKS A LATER RULING REACHED, by board, each naming the board that
 * reached it (Will, 2026-09-19).
 *
 * `sandbox/overtaken.ts` is a flat map keyed "<board>.<ask>" whose entries
 * carry a `by`, so the ids come out by the same regex reading the rest of this
 * script uses on a spec: the script never imports TypeScript, and both are
 * quoted literals. A missing file is not an error, it is a round in which
 * nothing was overtaken, and `stands` is then refused everywhere, which is
 * correct.
 */
function readOvertaken(root) {
  const file = join(root, ...OVERTAKEN);
  const out = new Map();
  if (!existsSync(file)) return out;
  const src = readFileSync(file, "utf8");
  const body = /OVERTAKEN[^=]*=\s*\{([\s\S]*)\n\};/.exec(src);
  if (!body) return out;
  const entry =
    /^\s*"([a-z0-9-]+)\.([a-z0-9-]+)":\s*\{([\s\S]*?)^\s*\},$/gm;
  for (const m of body[1].matchAll(entry)) {
    const by =
      /\bby:\s*"([a-z0-9-]+)"/.exec(m[3])?.[1] ??
      /\.\.\.([A-Z_]+)/.exec(m[3])?.[1] ??
      null;
    const asks = out.get(m[1]) ?? new Map();
    asks.set(m[2], by);
    out.set(m[1], asks);
  }
  // A shorthand spread (`...APP_SHAPE`) names a const rather than a board, so
  // resolve it to the board id that const declares.
  const consts = new Map(
    [...src.matchAll(/const\s+([A-Z_]+)\s*=\s*\{\s*by:\s*"([a-z0-9-]+)"/g)].map(
      (m) => [m[1], m[2]],
    ),
  );
  for (const asks of out.values())
    for (const [ask, by] of asks)
      if (by && consts.has(by)) asks.set(ask, consts.get(by));
  return out;
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
  const overtaken = readOvertaken(root);
  for (const id of boards.sort()) {
    const file = join(dir, id, "spec.ts");
    if (!existsSync(file)) continue;
    const spec = readSpec(id, readFileSync(file, "utf8"));
    spec.overtaken = overtaken.get(id) ?? new Map();
    out.set(id, spec);
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
 * `<id>=<value> "an optional note"` from `at`; the shared half of every clause.
 * `words` names the three tokens in the reader's language, so a refusal says
 * "expected an option" on an ask and "expected a verdict" on an item.
 */
function readPair(line, at, lineNo, words) {
  const id = readToken(line, at, lineNo, words.id);
  const idAt = at + 1;
  let i = id.end;
  if (line[i] !== "=") {
    throw new ReviewError(`expected "=" after ${words.after}`, {
      line: lineNo,
      column: i + 1,
    });
  }
  i++;
  const value = readToken(line, i, lineNo, words.value);
  const valueAt = i + 1;
  i = skipSpace(line, value.end);
  let note;
  if (line[i] === '"') {
    const q = readQuoted(line, i, lineNo);
    note = q.value;
    i = q.end;
  }
  return { id: id.value, idAt, value: value.value, valueAt, note, end: i };
}

/** The `;` between entries, or the end of the line. True when there is more. */
function readSeparator(line, at, lineNo) {
  let i = skipSpace(line, at);
  if (i >= line.length) return { more: false, end: i };
  if (line[i] !== ";") {
    throw new ReviewError('expected ";" between entries', {
      line: lineNo,
      column: i + 1,
    });
  }
  return { more: true, end: i + 1 };
}

/**
 * One line of the grammar, with every token's column kept so a refusal can
 * point at it. A blank line and a `#` comment line parse to null.
 *
 * Two heads: `review <board> r<n>:` for a board, `review library:` for the
 * Library's own rulings, which carry no round because the Library is not
 * explored in rounds.
 */
export function parseLine(raw, lineNo = 1) {
  const line = raw.replace(/\s+$/, "");
  if (!line.trim() || line.trim().startsWith("#")) return null;
  const libraryHead = /^\s*review\s+library\s*:/.exec(line);
  if (libraryHead) {
    const entries = [];
    let i = libraryHead[0].length;
    while (true) {
      i = skipSpace(line, i);
      if (i >= line.length) break;
      const pair = readPair(line, i, lineNo, {
        id: "a library entry id",
        after: "the entry",
        value: "a verdict",
      });
      entries.push({
        entry: pair.id,
        entryAt: pair.idAt,
        verdict: pair.value,
        verdictAt: pair.valueAt,
        note: pair.note,
      });
      const sep = readSeparator(line, pair.end, lineNo);
      i = sep.end;
      if (!sep.more) break;
    }
    if (entries.length === 0) {
      throw new ReviewError("the line carries no ruling", {
        line: lineNo,
        column: line.length + 1,
      });
    }
    return { kind: "library", entries, line: lineNo };
  }
  const head = /^\s*review\s+/.exec(line);
  if (!head) {
    throw new ReviewError('a line must start with "review <board> r<n>:"', {
      line: lineNo,
      column: skipSpace(line, 0) + 1,
    });
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
  const items = [];
  const calls = [];
  const notes = [];
  while (true) {
    i = skipSpace(line, i);
    if (i >= line.length) break;
    const noteHead = /^note\s*:/.exec(line.slice(i));
    const itemHead = /^item\s*:/.exec(line.slice(i));
    const callHead = /^call\s*:/.exec(line.slice(i));
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
    } else if (itemHead) {
      // `item:` is checked BEFORE the ask clause because a token may hold a
      // colon: `readToken` would swallow `item:ember` whole.
      const pair = readPair(
        line,
        skipSpace(line, i + itemHead[0].length),
        lineNo,
        { id: "a candidate id", after: "the item", value: "a verdict" },
      );
      items.push({
        item: pair.id,
        itemAt: pair.idAt,
        verdict: pair.value,
        verdictAt: pair.valueAt,
        note: pair.note,
      });
      i = pair.end;
    } else if (callHead) {
      // `call:` is checked BEFORE the ask clause for the same reason as
      // `item:`: a token may hold a colon, and `readToken` would swallow
      // `call:footer-close` whole.
      const pair = readPair(
        line,
        skipSpace(line, i + callHead[0].length),
        lineNo,
        { id: "a carried call id", after: "the call", value: "yes or no" },
      );
      if (pair.value !== "yes" && pair.value !== "no") {
        throw new ReviewError(
          `"${pair.value}" is not an answer to a carried call (yes, no)`,
          { line: lineNo, column: pair.valueAt },
        );
      }
      calls.push({
        call: pair.id,
        callAt: pair.idAt,
        answer: pair.value,
        answerAt: pair.valueAt,
        note: pair.note,
      });
      i = pair.end;
    } else {
      const pair = readPair(line, i, lineNo, {
        id: "an ask id",
        after: "the ask",
        value: "an option",
      });
      answers.push({
        ask: pair.id,
        askAt: pair.idAt,
        choice: pair.value,
        choiceAt: pair.valueAt,
        note: pair.note,
      });
      i = pair.end;
    }
    const sep = readSeparator(line, i, lineNo);
    i = sep.end;
    if (!sep.more) break;
  }
  if (
    answers.length === 0 &&
    items.length === 0 &&
    calls.length === 0 &&
    notes.length === 0
  ) {
    throw new ReviewError("the line carries no answer, no ruling and no note", {
      line: lineNo,
      column: line.length + 1,
    });
  }
  return {
    kind: "board",
    board: board.value,
    boardAt,
    round: Number(round[1]),
    roundAt,
    answers,
    items,
    calls,
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

/**
 * THE BUILD THE MESSAGE WAS COMPOSED ON, when the desk stamped it.
 *
 * ★ WHY THIS IS HERE (Will, 2026-09-17). His third batch arrived as `r7`
 * against a tree already on `r8`, because the alias had not been rebuilt since
 * the board changed, and nothing on the page could have told him: the round,
 * the ledger and the spec all come from one build, so a stale deployment shows
 * an old round agreeing with an old ledger. The line had to be transcribed
 * against a scratch tree holding the older spec.
 *
 * A build cannot know a newer one exists. This process can: it holds the
 * message AND the working tree, which is the one moment both numbers are in
 * the same room. It is a `#` line, which the grammar has always skipped, so an
 * unstamped paste reads exactly as before.
 */
export function buildOf(text) {
  for (const raw of text.split("\n")) {
    const m = /^\s*#\s*build\s+([0-9a-f]{7,40})\s*$/i.exec(raw);
    if (m) return m[1].toLowerCase();
  }
  return null;
}

/** What the tree holds now, or null outside a git checkout. */
function treeHead(root) {
  try {
    return execFileSync("git", ["-C", root, "rev-parse", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .trim()
      .toLowerCase();
  } catch {
    return null;
  }
}

/**
 * One line about the gap between the build he reviewed and the tree being
 * written into. NEVER a refusal: the answers are his either way, and the round
 * check already refuses a line that truly does not fit the spec. This exists so
 * that when that refusal comes, the reason is on screen instead of being
 * guessed at.
 */
export function buildDrift(text, root) {
  const build = buildOf(text);
  if (!build) return null;
  const head = treeHead(root);
  if (!head) return `composed on build ${build}`;
  if (head.startsWith(build))
    return `composed on build ${build}, the tree's own`;
  let behind = null;
  try {
    behind = execFileSync(
      "git",
      ["-C", root, "rev-list", "--count", `${build}..HEAD`],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
  } catch {
    return `composed on build ${build}, which this tree does not know (a different branch, or not fetched)`;
  }
  return behind === "0"
    ? `composed on build ${build}, which is AHEAD of this tree`
    : `composed on build ${build}, ${behind} commit${behind === "1" ? "" : "s"} behind this tree: check the board changed rounds`;
}

const list = (xs) => xs.join(", ");

/**
 * Every Library entry id, from the committed rules artifact. Null when the
 * artifact is missing, which is a refusal rather than a free pass: an
 * unvalidated entry id is a redesign request nobody can open.
 */
export function readLibraryEntries(root) {
  const file = join(root, ...RULES);
  if (!existsSync(file)) return null;
  try {
    const artifact = JSON.parse(readFileSync(file, "utf8"));
    return new Set((artifact.components ?? []).map((c) => c.id));
  } catch {
    throw new ReviewError(
      `${file} is not the rules artifact (pnpm design:rules)`,
    );
  }
}

/* ── A RE-SEND THAT CHANGES NOTHING ──────────────────────────────────────────
 *
 * ★ THE PROBLEM (Will, 2026-09-19). His answers stay in the browser's review
 * store after he pastes a batch, and the store only learns what the LEDGER
 * holds from the build he is reading: on a stale alias that ledger is old, so
 * the next paste carries the first batch again. Today one such line refuses the
 * WHOLE message ("site-chrome is in round 2, not r1"), which is exactly what a
 * stale re-send looks like the day a round-two lane lands, and he loses the new
 * answers in the same paste with it.
 *
 * ★ THE RULE, and it keeps all-or-nothing for everything else. A clause that
 * merely REPEATS what the ledger already holds is a no-op: it is accepted
 * whatever the board has done since (a later round, or no spec at all, because
 * the ledger file outlives the board), and it is printed as `unchanged` rather
 * than written. A clause that carries anything the ledger does NOT hold is
 * judged exactly as before, and the refusal names it. So a stale re-send is
 * free, a changed mind is still a replacement, and a genuinely new answer to a
 * closed round is still refused.
 */

/** A note as the ledger holds it: absent, empty and whitespace are one thing. */
const flat = (text) => (text ?? "").replace(/\s+/g, " ").trim();

/** One round of a ledger, or undefined. `n` is written as a number or a string. */
function ledgerRound(ledger, n) {
  return ledger?.rounds?.find((r) => Number(r.n) === Number(n));
}

/** Whether the ledger already holds this exact answer: same ask, choice and note. */
function heldAnswer(ledger, round, a) {
  const was = ledgerRound(ledger, round)?.answers?.find((x) => x.ask === a.ask);
  if (!was) return false;
  // "?" is a null choice in the ledger and the same answer in the grammar.
  const choice = was.choice === null ? "?" : was.choice;
  return choice === a.choice && flat(was.note) === flat(a.note);
}

/** The same, for a verdict on a catalog card. */
function heldItem(ledger, round, i) {
  const was = ledgerRound(ledger, round)?.items?.find((x) => x.item === i.item);
  return Boolean(
    was && was.verdict === i.verdict && flat(was.note) === flat(i.note),
  );
}

/** The same, for a carried call the ledger already holds an answer for. */
function heldCall(ledger, round, c) {
  const was = ledgerRound(ledger, round)?.calls?.find((x) => x.call === c.call);
  return Boolean(
    was && was.answer === c.answer && flat(was.note) === flat(c.note),
  );
}

/** A board note the round already carries, word for word. */
function heldNote(ledger, round, n) {
  const notes = ledgerRound(ledger, round)?.notes ?? [];
  return notes.some((x) => flat(x.text) === flat(n.text));
}

/** The one place a repeated id on one line is refused, whatever it names. */
function refuseDuplicates(rows, key, what, push) {
  const seen = new Set();
  for (const row of rows) {
    if (seen.has(row[key.id])) {
      push(row[key.at], `"${row[key.id]}" is ${what} twice on this line`);
    }
    seen.add(row[key.id]);
  }
}

/**
 * Every refusal in the message, against the specs; an empty array means go.
 *
 * `ledgerOf` is how the re-send rule above sees what is already recorded; it is
 * injected so the reader stays testable and so a caller that does not care
 * (nothing today) gets the strict reading it always had.
 */
export function validate(
  entries,
  specs,
  library = null,
  ledgerOf = () => null,
) {
  const errors = [];
  const at = (line, column, message) =>
    errors.push(new ReviewError(message, { line, column }));
  for (const e of entries) {
    if (e.kind === "library") {
      validateLibrary(e, library, at);
      continue;
    }
    const spec = specs.get(e.board);
    const ledger = ledgerOf(e.board);
    // Which clauses are pure echoes of the ledger. They are exempt from every
    // check below, including the board's round and the spec's ask list,
    // because repeating a recorded decision cannot record a wrong one.
    const echoAnswer = (a) => heldAnswer(ledger, e.round, a);
    const echoItem = (i) => heldItem(ledger, e.round, i);
    const echoCall = (c) => heldCall(ledger, e.round, c);
    // Everything on this line the ledger does NOT already hold, with the
    // column to point at when it has nowhere to land.
    const news = [
      ...e.answers
        .filter((a) => !echoAnswer(a))
        .map((a) => ({ at: a.askAt, what: `${a.ask}=${a.choice}` })),
      ...e.items
        .filter((i) => !echoItem(i))
        .map((i) => ({ at: i.itemAt, what: `item:${i.item}=${i.verdict}` })),
      ...e.calls
        .filter((c) => !echoCall(c))
        .map((c) => ({ at: c.callAt, what: `call:${c.call}=${c.answer}` })),
      ...e.notes
        .filter((n) => !heldNote(ledger, e.round, n))
        .map(() => ({ at: e.roundAt, what: "the note" })),
    ];
    if (!spec) {
      // ★ A BOARD WITH NO SPEC IS ONE OF TWO THINGS, and the refusal has to
      // tell them apart. A name that was never a board is a typo, and it is
      // refused at the NAME, as it always was. A board that has RETIRED still
      // has its ledger on disk, and a re-send of what that ledger holds is
      // welcome; only a clause the ledger does not hold has nowhere to land.
      const retired = (ledger?.rounds ?? []).length > 0;
      if (!retired) {
        at(
          e.line,
          e.boardAt,
          specs.size === 0
            ? `no board carries a spec yet, so "${e.board}" cannot be checked`
            : `"${e.board}" is not a standing board (${list([...specs.keys()])})`,
        );
        continue;
      }
      for (const n of news)
        at(
          e.line,
          n.at,
          `${e.board} has left the lab, and "${n.what}" is not what its ledger holds (a re-send may only repeat what is recorded)`,
        );
      continue;
    }
    if (spec.round !== null && e.round !== spec.round) {
      // The round has moved on. Everything the ledger already holds for r<n>
      // rides as a no-op; anything new to that round is refused by name.
      for (const n of news)
        at(
          e.line,
          n.at,
          `${e.board} is in round ${spec.round}, not r${e.round}, and "${n.what}" is not what r${e.round} holds`,
        );
      continue;
    }
    for (const a of e.answers) {
      if (echoAnswer(a)) continue;
      const ask = spec.asks.find((x) => x.id === a.ask);
      if (!ask) {
        at(
          e.line,
          a.askAt,
          `"${a.ask}" is not an ask on ${e.board} (${list(spec.asks.map((x) => x.id))})`,
        );
        continue;
      }
      if (a.choice === "?") {
        // "Not clear to me" is only useful with the words that say why.
        if (!a.note || !a.note.trim()) {
          at(
            e.line,
            a.choiceAt,
            `${e.board}.${a.ask}=? needs a note saying what was unclear`,
          );
        }
      } else if (a.choice === STANDS) {
        // ★ THE RESERVED WORD IS CHECKED BEFORE THE OPTIONS, so a board that
        // ever names an option "stands" cannot shadow the answer that leaves a
        // question to the ruling that reached it. It owes its reason for the
        // same reason "?" does: a ledger row nobody can read back has to be
        // reconstructed from memory.
        const reached = spec.overtaken ?? new Map();
        if (!reached.has(a.ask)) {
          at(
            e.line,
            a.choiceAt,
            `${e.board}.${a.ask} is not a question an earlier ruling reached, so nothing can stand over it (sandbox/overtaken.ts names ${list([...reached.keys()])})`,
          );
        } else if (!a.note || !a.note.trim()) {
          at(
            e.line,
            a.choiceAt,
            `${e.board}.${a.ask}=stands needs a note saying which ruling stands`,
          );
        }
      } else if (!ask.options.includes(a.choice)) {
        at(
          e.line,
          a.choiceAt,
          `"${a.choice}" is not an option of ${e.board}.${a.ask} (${list(ask.options)})`,
        );
      }
    }
    validateItems(e, spec, at, echoItem);
    validateCalls(e, spec, at, echoCall);
    refuseDuplicates(
      e.answers,
      { id: "ask", at: "askAt" },
      "answered",
      (column, message) => at(e.line, column, message),
    );
  }
  return errors;
}

/**
 * A board line's `item:` clauses against its spec's catalog.
 *
 * ★ A BOARD WITH NO CATALOG HAS NO ITEMS, and saying so is the point: every
 * board carries candidates, and accepting a verdict on one that the board never
 * offered for ruling would record a decision on something nobody displayed.
 */
function validateItems(e, spec, at, echoItem = () => false) {
  const fresh = e.items.filter((i) => !echoItem(i));
  if (fresh.length === 0) return;
  if (!spec.catalog) {
    at(
      e.line,
      fresh[0].itemAt,
      `${e.board} declares no catalog, so it has no items to rule on`,
    );
    return;
  }
  if (spec.items === null) {
    at(
      e.line,
      fresh[0].itemAt,
      `${e.board}'s candidates cannot be read off its spec: write the items out as a const in spec.ts`,
    );
    return;
  }
  for (const i of fresh) {
    if (!spec.items.includes(i.item)) {
      at(
        e.line,
        i.itemAt,
        `"${i.item}" is not an item on ${e.board} (${list(spec.items)})`,
      );
      continue;
    }
    if (!ITEM_VERDICTS.includes(i.verdict)) {
      at(
        e.line,
        i.verdictAt,
        `"${i.verdict}" is not a verdict (${list(ITEM_VERDICTS)})`,
      );
    }
  }
  refuseDuplicates(
    e.items,
    { id: "item", at: "itemAt" },
    "ruled",
    (column, message) => at(e.line, column, message),
  );
}

/**
 * A board line's `call:` clauses against its spec's carried calls.
 *
 * Unlike `item:`, a call needs no catalog to exist: `carried` and `catalog`
 * are unrelated, so the only question is whether the id is one the spec's
 * `carried` list actually names.
 */
function validateCalls(e, spec, at, echoCall = () => false) {
  const fresh = e.calls.filter((c) => !echoCall(c));
  if (fresh.length === 0) return;
  const known = spec.calls ?? [];
  for (const c of fresh) {
    if (!known.includes(c.call)) {
      at(
        e.line,
        c.callAt,
        `"${c.call}" is not a call ${e.board} carried (${list(known)})`,
      );
    }
  }
  refuseDuplicates(
    e.calls,
    { id: "call", at: "callAt" },
    "answered",
    (column, message) => at(e.line, column, message),
  );
}

/** A `review library:` line against the committed component index. */
function validateLibrary(e, library, at) {
  for (const r of e.entries) {
    if (library === null) {
      at(
        e.line,
        r.entryAt,
        "there is no rules artifact to check an entry against; run pnpm design:rules",
      );
      continue;
    }
    if (!library.has(r.entry)) {
      at(
        e.line,
        r.entryAt,
        `"${r.entry}" is not a library entry (its id is the last segment of its /design/library URL)`,
      );
      continue;
    }
    if (!LIBRARY_VERDICTS.includes(r.verdict)) {
      at(
        e.line,
        r.verdictAt,
        `"${r.verdict}" is not a library verdict (${list(LIBRARY_VERDICTS)})`,
      );
    }
  }
  refuseDuplicates(
    e.entries,
    { id: "entry", at: "entryAt" },
    "ruled",
    (column, message) => at(e.line, column, message),
  );
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

/** The Library's ledger, whose shape is `{ entries: [...] }` and has no rounds. */
function readLibraryLedger(root) {
  const file = ledgerPath(root, LIBRARY_LEDGER);
  if (!existsSync(file)) return { entries: [] };
  try {
    const value = JSON.parse(readFileSync(file, "utf8"));
    if (!value || typeof value !== "object" || !Array.isArray(value.entries)) {
      throw new Error("shape");
    }
    return value;
  } catch {
    throw new ReviewError(
      `${file} is not the library ledger (see docs/reviews/README.md for the shape)`,
    );
  }
}

/**
 * The entries applied to their ledgers, in memory. One answer per ask per
 * round: answering again in the same round overwrites, and git keeps the
 * first, which is exactly what the README promises.
 */
export function applyEntries(root, entries, { by, at }) {
  // Every ledger this message touched, and the ones it actually CHANGED. A
  // message that is nothing but a stale re-send writes no file at all, so a
  // harmless paste leaves the tree exactly as it found it.
  const seen = new Map();
  const changed = new Map();
  const summary = [];
  // The map, and the overrides this message records against it (below).
  const reached = readOvertaken(root);
  const overrides = [];
  for (const e of entries) {
    if (e.kind === "library") {
      const ledger = seen.get(LIBRARY_LEDGER) ?? readLibraryLedger(root);
      seen.set(LIBRARY_LEDGER, ledger);
      changed.set(LIBRARY_LEDGER, ledger);
      if (!Array.isArray(ledger.entries)) ledger.entries = [];
      for (const r of e.entries) {
        const entry = { entry: r.entry, verdict: r.verdict };
        if (r.note) entry.note = r.note;
        entry.by = by;
        entry.at = at;
        const was = ledger.entries.findIndex((x) => x.entry === r.entry);
        if (was < 0) ledger.entries.push(entry);
        else ledger.entries[was] = entry;
        summary.push([
          "library",
          r.entry,
          r.verdict,
          was < 0 ? "new" : "replaced",
        ]);
      }
      continue;
    }
    const ledger = seen.get(e.board) ?? readLedger(root, e.board);
    seen.set(e.board, ledger);
    // What the ledger held BEFORE this message: an echo is judged against the
    // file on disk, never against a clause applied a moment ago on the same
    // line (that one is a duplicate, and the parser refuses those already).
    const was = { rounds: JSON.parse(JSON.stringify(ledger.rounds ?? [])) };
    const echo = {
      answer: (a) => heldAnswer(was, e.round, a),
      item: (i) => heldItem(was, e.round, i),
      call: (c) => heldCall(was, e.round, c),
      note: (n) => heldNote(was, e.round, n),
    };
    const nothingNew =
      e.answers.every(echo.answer) &&
      e.items.every(echo.item) &&
      e.calls.every(echo.call) &&
      e.notes.every(echo.note);
    if (nothingNew) {
      // Not even an empty round is opened for a line that says nothing new.
      for (const a of e.answers)
        summary.push([`${e.board} r${e.round}`, a.ask, a.choice, "unchanged"]);
      for (const i of e.items)
        summary.push([
          `${e.board} r${e.round}`,
          `item:${i.item}`,
          i.verdict,
          "unchanged",
        ]);
      for (const c of e.calls)
        summary.push([
          `${e.board} r${e.round}`,
          `call:${c.call}`,
          c.answer,
          "unchanged",
        ]);
      for (const n of e.notes)
        summary.push([`${e.board} r${e.round}`, "note", n.text, "unchanged"]);
      continue;
    }
    changed.set(e.board, ledger);
    let round = ledger.rounds.find((r) => Number(r.n) === e.round);
    if (!round) {
      round = { n: e.round, opened: at.slice(0, 10), answers: [], notes: [] };
      ledger.rounds.push(round);
      ledger.rounds.sort((a, b) => Number(a.n) - Number(b.n));
    }
    if (!Array.isArray(round.answers)) round.answers = [];
    if (!Array.isArray(round.notes)) round.notes = [];
    if (!Array.isArray(round.items)) round.items = [];
    if (!Array.isArray(round.calls)) round.calls = [];
    for (const a of e.answers) {
      if (echo.answer(a)) {
        // The ledger already says exactly this. Leave `by` and `at` alone: a
        // re-send is not a new decision and must not look like one in git.
        summary.push([`${e.board} r${e.round}`, a.ask, a.choice, "unchanged"]);
        continue;
      }
      // "?" lands as a null choice: the ask stays open on the desk, flagged as
      // waiting on a clearer question, with the reviewer's words beside it.
      // ★ `stands` LANDS AS ITSELF, never null: it is a decision, and the desk
      // counts it as one (sandbox/overtaken.ts, `outcomeOf`).
      const entry = { ask: a.ask, choice: a.choice === "?" ? null : a.choice };
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
      // ★ AN ANSWER TO AN OVERTAKEN QUESTION IS THE NEW RULING (Will,
      // 2026-09-19), and the lane that wired the earlier one has to hear about
      // it. It hears where it already reads: a window note aimed at the board
      // whose ruling was overridden.
      const over = reached.get(e.board)?.get(a.ask);
      if (over && a.choice !== STANDS && a.choice !== "?") {
        overrides.push({
          on: over,
          text: `overridden by ${e.board}.${a.ask}=${a.choice}, ${at.slice(0, 10)}`,
        });
      }
    }
    // One verdict per item per round: ruling again in the same round
    // overwrites, exactly as answering an ask again does.
    for (const i of e.items) {
      if (echo.item(i)) {
        summary.push([
          `${e.board} r${e.round}`,
          `item:${i.item}`,
          i.verdict,
          "unchanged",
        ]);
        continue;
      }
      const entry = { item: i.item, verdict: i.verdict };
      if (i.note) entry.note = i.note;
      entry.by = by;
      entry.at = at;
      const was = round.items.findIndex((x) => x.item === i.item);
      if (was < 0) round.items.push(entry);
      else round.items[was] = entry;
      summary.push([
        `${e.board} r${e.round}`,
        `item:${i.item}`,
        i.verdict,
        was < 0 ? "new" : "replaced",
      ]);
    }
    // One answer per carried call per round, replaced when he answers it
    // again, exactly as an item's verdict is.
    for (const c of e.calls) {
      if (echo.call(c)) {
        summary.push([
          `${e.board} r${e.round}`,
          `call:${c.call}`,
          c.answer,
          "unchanged",
        ]);
        continue;
      }
      const entry = { call: c.call, answer: c.answer };
      if (c.note) entry.note = c.note;
      entry.by = by;
      entry.at = at;
      const was = round.calls.findIndex((x) => x.call === c.call);
      if (was < 0) round.calls.push(entry);
      else round.calls[was] = entry;
      summary.push([
        `${e.board} r${e.round}`,
        `call:${c.call}`,
        c.answer,
        was < 0 ? "new" : "replaced",
      ]);
    }
    for (const n of e.notes) {
      // A note is append-only, so the same words twice would read as two
      // separate remarks. The ledger holding them already is the whole test.
      if (echo.note(n)) {
        summary.push([`${e.board} r${e.round}`, "note", n.text, "unchanged"]);
        continue;
      }
      round.notes.push({ on: null, text: n.text, by, at });
      summary.push([`${e.board} r${e.round}`, "note", n.text, "added"]);
    }
  }
  echoOverrides(root, overrides, { by, at, seen, changed, summary });
  return { ledgers: changed, summary };
}

/**
 * EVERY OVERRIDE, ECHOED INTO THE WINDOW (Will, 2026-09-19).
 *
 * ★ WHY A WINDOW NOTE AND NOT A NEW FILE. When he answers a question a later
 * ruling had already reached, the answer IS the new ruling, and the lane that
 * wired the earlier one is usually already open. A window note aimed at the
 * overtaken board lands where that lane already looks (the desk prints them on
 * the board's row, and `windowNotesFor` hands them to the board page), so the
 * mechanism needs no second place to look and no ledger of its own.
 *
 * ★ AND IT IS IDEMPOTENT, like every other note this script writes: the same
 * sentence twice would read as two separate overrides. Nothing is appended to
 * the window unless something genuinely new was recorded, so a stale re-send
 * still writes no file at all.
 */
function echoOverrides(root, overrides, { by, at, seen, changed, summary }) {
  if (overrides.length === 0) return;
  const ledger = seen.get(WINDOW_LEDGER) ?? readLedger(root, WINDOW_LEDGER);
  seen.set(WINDOW_LEDGER, ledger);
  if (!Array.isArray(ledger.rounds)) ledger.rounds = [];
  let round = ledger.rounds.reduce(
    (a, b) => (a === null || Number(b.n) > Number(a.n) ? b : a),
    null,
  );
  if (!round) {
    round = { n: 1, opened: at.slice(0, 10), answers: [], notes: [] };
    ledger.rounds.push(round);
  }
  if (!Array.isArray(round.notes)) round.notes = [];
  let wrote = false;
  for (const o of overrides) {
    const held = round.notes.some(
      (n) => n.on === o.on && flat(n.text) === flat(o.text),
    );
    if (held) {
      summary.push([`${WINDOW_LEDGER} r${round.n}`, o.on, o.text, "unchanged"]);
      continue;
    }
    round.notes.push({ on: o.on, text: o.text, by, at });
    summary.push([`${WINDOW_LEDGER} r${round.n}`, o.on, o.text, "added"]);
    wrote = true;
  }
  if (wrote) changed.set(WINDOW_LEDGER, ledger);
}

export function writeLedgers(root, ledgers) {
  const dir = join(root, ...REVIEWS);
  mkdirSync(dir, { recursive: true });
  for (const [board, ledger] of ledgers) {
    writeFileSync(
      ledgerPath(root, board),
      `${JSON.stringify(ledger, null, 2)}\n`,
    );
  }
}

/**
 * The whole run: parse, validate against the specs, apply, write. Nothing is
 * written unless every line is good.
 */
export function run(
  text,
  { root = process.cwd(), by = "Will", at, dry = false } = {},
) {
  const stamp = at ?? new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const entries = parseMessage(text);
  if (entries.length === 0) throw new ReviewError("nothing to record");
  const specs = readSpecs(root);
  const errors = validate(entries, specs, readLibraryEntries(root), (board) =>
    readLedger(root, board),
  );
  if (errors.length) return { ok: false, errors, summary: [] };
  const { ledgers, summary } = applyEntries(root, entries, { by, at: stamp });
  if (!dry) writeLedgers(root, ledgers);
  return {
    ok: true,
    errors: [],
    summary,
    boards: [...ledgers.keys()],
    drift: buildDrift(text, root),
  };
}

// ── The command ──────────────────────────────────────────────────────────────

const HELP = `pnpm lab:review "<the pasted line>"

  review <board> r<n>: <ask>=<option> "a note"; <ask>=<option>; note: "a board note"
  review <board> r<n>: <ask>=? "what was unclear"      (not answered; needs the note)
  review <board> r<n>: item:<id>=keep|refine|kill "a note"   (one catalog card)
  review <board> r<n>: call:<id>=yes|no "a note"   (a call the lane carried)
  review <board> r<n>: <ask>=stands "the earlier ruling stands"   (an overtaken question)
  review library: <entry-id>=keep|redesign|retire "a note"   (a Library entry)

  A line that merely repeats what the ledger already holds is a no-op
  (printed as unchanged), whatever round the board has since moved to, so a
  stale re-send costs nothing. Anything new to a closed round is still refused.

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
          drift: result.drift ?? null,
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
  const same = result.summary.filter((r) => r[3] === "unchanged").length;
  const wrote = result.summary.length - same;
  console.log(
    `\n${wrote} recorded${
      result.boards.length
        ? ` in ${result.boards.map((b) => `docs/reviews/${b}.json`).join(", ")}`
        : ""
    }${same ? `, ${same} already recorded (unchanged)` : ""}${argv.includes("--dry") ? " (dry run: nothing written)" : ""}`,
  );
  // The build he composed on, beside the tree being written into. Printed last
  // because it is context for everything above, and only when the desk stamped
  // the paste: an unstamped message says nothing rather than guessing.
  if (result.drift) console.log(result.drift);
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
