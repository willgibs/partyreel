#!/usr/bin/env node
/**
 * batch-reader: Will's review paste, read beside the boards it answers.
 *
 * `pnpm lab:review --dry` says whether a paste PARSES. This says what it MEANS:
 * for every verdict it prints the question, the option he chose (its label and
 * what it means), whether that confirms or overrules the board's recommendation,
 * what the answer lands platform-wide, and his note verbatim. One screen per
 * batch, so the Orchestrator synthesizes lanes from the boards' own words
 * rather than from memory of a walk it did not take.
 *
 * Read-only. Node builtins plus the repo's TypeScript (already a dev dependency):
 * a spec is TypeScript behind the `@/` alias, so it is parsed, never imported.
 *
 *   node PartyreelAI/kit/batch-reader.mjs < batch.txt          # the paste on stdin
 *   node PartyreelAI/kit/batch-reader.mjs --json < batch.txt   # the same as JSON
 *   node PartyreelAI/kit/batch-reader.mjs --board guest-shape  # one board's every ask, no paste
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const ROOT = process.cwd();
const SANDBOX = join(ROOT, "src/app/(dev)/design/sandbox");
const args = process.argv.slice(2);
const asJson = args.includes("--json");
const boardArg = args.includes("--board") ? args[args.indexOf("--board") + 1] : null;

/* ---------- the spec, parsed ---------- */

/** A string value: a literal, a template without holes, or a `+` chain of those. */
function str(node) {
  if (!node) return null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) {
    return node.head.text + node.templateSpans.map((s) => "${…}" + s.literal.text).join("");
  }
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const a = str(node.left), b = str(node.right);
    return a !== null && b !== null ? a + b : null;
  }
  if (ts.isParenthesizedExpression(node)) return str(node.expression);
  if (ts.isAsExpression(node)) return str(node.expression);
  return null;
}
function prop(obj, name) {
  for (const p of obj.properties) {
    if (ts.isPropertyAssignment(p) && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) && p.name.text === name) return p.initializer;
  }
  return null;
}
/** An array literal of strings (a breadcrumb, the opening's lines), or [] when it is anything else. */
function strs(node) {
  return node && ts.isArrayLiteralExpression(node) ? node.elements.map(str).filter((s) => s !== null) : [];
}
function readSpec(board) {
  const file = join(SANDBOX, board, "spec.ts");
  if (!existsSync(file)) return null;
  const src = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const spec = { board, file, round: null, title: null, surface: null, desk: null, lives: [], tracks: [], opening: null, terms: [], decisions: new Map(), items: new Map() };
  const walk = (node) => {
    if (ts.isObjectLiteralExpression(node)) {
      // The board's own object (it names its asks): its title and its desk facts, which are the board's own since the
      // lab revamp (a board is its folder; nothing else lists it).
      if (prop(node, "asks") && prop(node, "round") && prop(node, "id")) {
        spec.title = str(prop(node, "title"));
        spec.surface = str(prop(node, "surface"));
        const desk = prop(node, "desk");
        if (desk && ts.isNumericLiteral(desk)) spec.desk = Number(desk.text);
        spec.lives = strs(prop(node, "lives"));
        spec.tracks = strs(prop(node, "tracks"));
      }
      const q = prop(node, "question"), opts = prop(node, "options"), id = prop(node, "id");
      if (q && opts && id && ts.isArrayLiteralExpression(opts)) {
        // The context layer (2026-09-29) rides beside the question: where it happens, the state that brings
        // someone there, why it matters; and each option's gain and cost.
        const d = {
          id: str(id), question: str(q), where: strs(prop(node, "where")), when: str(prop(node, "when")),
          context: str(prop(node, "context")), matters: str(prop(node, "matters")),
          recommended: str(prop(node, "recommended")), today: str(prop(node, "today")),
          because: str(prop(node, "because")), overrule: str(prop(node, "overrule")), lands: str(prop(node, "lands")),
          options: [],
        };
        for (const o of opts.elements) {
          if (!ts.isObjectLiteralExpression(o)) continue;
          d.options.push({ id: str(prop(o, "id")), label: str(prop(o, "label")), means: str(prop(o, "means")), gains: str(prop(o, "gains")), costs: str(prop(o, "costs")) });
        }
        // A Control also has id+options but no question; only decisions reach here.
        spec.decisions.set(d.id, d);
      }
      const r = prop(node, "round");
      if (r && ts.isObjectLiteralExpression(r)) {
        const n = prop(r, "n");
        if (n && ts.isNumericLiteral(n)) spec.round = Number(n.text);
      }
      // The board's opening and the words it coins, read off the exploration's own object.
      const o = prop(node, "opening");
      if (o && ts.isObjectLiteralExpression(o)) {
        spec.opening = { about: str(prop(o, "about")), settled: strs(prop(o, "settled")), earlier: strs(prop(o, "earlier")) };
      }
      const t = prop(node, "terms");
      if (t && ts.isArrayLiteralExpression(t)) {
        spec.terms = t.elements.filter(ts.isObjectLiteralExpression).map((e) => ({ term: str(prop(e, "term")), means: str(prop(e, "means")) }));
      }
      // defineBoard items: { id, title/label, ... } under `items:`; keep a light index by id.
      const items = prop(node, "items");
      if (items && ts.isArrayLiteralExpression(items)) {
        for (const it of items.elements) {
          if (!ts.isObjectLiteralExpression(it)) continue;
          const iid = str(prop(it, "id"));
          if (iid) spec.items.set(iid, { id: iid, title: str(prop(it, "title")) ?? str(prop(it, "label")) });
        }
      }
    }
    ts.forEachChild(node, walk);
  };
  walk(sf);
  return spec;
}

/* ---------- the paste, parsed (tolerant; the transcript tool is the judge) ---------- */

/** Split on `;` outside double quotes, honouring `\"` escapes. */
function clauses(body) {
  const out = []; let cur = "", inQ = false;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (inQ) { cur += c; if (c === "\\" && i + 1 < body.length) { cur += body[++i]; } else if (c === '"') inQ = false; continue; }
    if (c === '"') { inQ = true; cur += c; continue; }
    if (c === ";") { out.push(cur.trim()); cur = ""; continue; }
    cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
function unquote(s) { return s.replace(/^"|"$/g, "").replace(/\\"/g, '"'); }
function parsePaste(text) {
  const reviews = []; let build = null;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const b = line.match(/^#\s*build\s+([0-9a-f]+)/i); if (b) { build = b[1]; continue; }
    const m = line.match(/^review\s+([a-z0-9-]+)\s+r(\d+):\s*(.*)$/); if (!m) { reviews.push({ raw: line, error: "not a review line" }); continue; }
    const rev = { board: m[1], round: Number(m[2]), verdicts: [], calls: [], items: [], notes: [] };
    for (const cl of clauses(m[3])) {
      const note = cl.match(/^note:\s*(".*")$/); if (note) { rev.notes.push(unquote(note[1])); continue; }
      const kv = cl.match(/^(call:|item:)?([a-z0-9-]+)=([^\s"]+)\s*(".*")?$/);
      if (!kv) { rev.verdicts.push({ ask: cl, choice: null, note: null, error: "unparsed clause" }); continue; }
      const entry = { ask: kv[2], choice: kv[3], note: kv[4] ? unquote(kv[4]) : null };
      if (kv[1] === "call:") rev.calls.push(entry); else if (kv[1] === "item:") rev.items.push(entry); else rev.verdicts.push(entry);
    }
    reviews.push(rev);
  }
  return { build, reviews };
}

/**
 * The desk facts the registry holds for the boards whose specs predate them (`PREDATES` in sandbox/registry.ts), by
 * board id: read off the file so a board that retires takes its line with it.
 */
function readPredates() {
  const file = join(SANDBOX, "registry.ts");
  if (!existsSync(file)) return {};
  const sf = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const out = {};
  const walk = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === "PREDATES" && node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
      for (const p of node.initializer.properties) {
        if (!ts.isPropertyAssignment(p) || !ts.isObjectLiteralExpression(p.initializer)) continue;
        const id = ts.isStringLiteral(p.name) || ts.isIdentifier(p.name) ? p.name.text : null;
        const desk = prop(p.initializer, "desk");
        if (id) out[id] = { surface: str(prop(p.initializer, "surface")), desk: desk && ts.isNumericLiteral(desk) ? Number(desk.text) : null, lives: strs(prop(p.initializer, "lives")), tracks: strs(prop(p.initializer, "tracks")) };
      }
    }
    ts.forEachChild(node, walk);
  };
  walk(sf);
  return out;
}

/**
 * Every standing board (a folder under sandbox/ with a spec.ts), its desk facts filled from PREDATES where its spec has
 * none, in desk order: its own `desk` place, lower first, a tie in id order, as the registry sorts `BOARDS`.
 */
function readBoards() {
  const predates = readPredates();
  const ids = existsSync(SANDBOX) ? readdirSync(SANDBOX, { withFileTypes: true }).filter((e) => e.isDirectory() && existsSync(join(SANDBOX, e.name, "spec.ts"))).map((e) => e.name) : [];
  return ids
    .map((id) => {
      const spec = readSpec(id);
      const facts = predates[id] ?? {};
      return { ...spec, surface: spec.surface ?? facts.surface ?? null, desk: spec.desk ?? facts.desk ?? null, lives: spec.lives.length ? spec.lives : (facts.lives ?? []), tracks: spec.tracks.length ? spec.tracks : (facts.tracks ?? []) };
    })
    .sort((a, b) => (a.desk ?? Infinity) - (b.desk ?? Infinity) || a.board.localeCompare(b.board));
}

export { readSpec, readBoards, parsePaste, reading };

/* ---------- the reading ---------- */

function reading(spec, v) {
  const d = spec?.decisions.get(v.ask);
  if (!d) return { kind: "unknown-ask", text: `no decision "${v.ask}" in the spec` };
  const rec = d.options.find((o) => o.id === d.recommended);
  if (v.choice === "?") return { kind: "unclear", d, rec, text: "not clear to him; the note may carry his own answer" };
  const o = d.options.find((x) => x.id === v.choice);
  if (!o && v.choice === "none") return { kind: "none", d, rec, text: "none of the options; the note says what to try" };
  if (!o) return { kind: "unknown-option", d, rec, text: `"${v.choice}" is not one of ${d.options.map((x) => x.id).join(", ")}` };
  const same = o.id === d.recommended;
  const today = d.today && o.id === d.today;
  return { kind: same ? "confirms" : "overrules", d, rec, o, today, text: same ? "confirms the recommendation" : `overrules the recommendation (${rec?.id ?? d.recommended})` };
}

function wrap(s, width = 100, indent = "      ") {
  if (!s) return "";
  const words = s.split(/\s+/); const lines = []; let cur = "";
  for (const w of words) { if ((cur + " " + w).trim().length > width) { lines.push(cur.trim()); cur = w; } else cur += " " + w; }
  if (cur.trim()) lines.push(cur.trim());
  // A label on the first line only ("    when: "): the lines under it keep its width in spaces, so a wrapped line
  // never reads as a second entry.
  const rest = indent.replace(/\S/g, " ");
  return lines.map((l, i) => (i === 0 ? indent : rest) + l).join("\n");
}

/** The board's opening and its coined words, as the step shows them (the context layer, 2026-09-29). */
function printOpening(spec, indent = "  ") {
  const o = spec.opening;
  if (o?.about) console.log(`${indent}about: ${o.about}`);
  for (const l of o?.settled ?? []) console.log(`${indent}settled: ${l}`);
  for (const l of o?.earlier ?? []) console.log(`${indent}earlier: ${l}`);
  for (const t of spec.terms ?? []) console.log(`${indent}term: ${t.term}: ${t.means}`);
}

function printBoard(spec) {
  console.log(`\n${spec.board} r${spec.round ?? "?"}: ${spec.decisions.size} asks`);
  printOpening(spec);
  for (const d of spec.decisions.values()) {
    console.log(`\n  ${d.id}  (recommended: ${d.recommended}${d.today ? `, today: ${d.today}` : ""})`);
    if (d.where?.length) console.log(`    where: ${d.where.join(" › ")}`);
    if (d.when) console.log(wrap(d.when, 100, "    when: "));
    console.log(wrap(d.question, 100, "    "));
    for (const o of d.options) {
      console.log(`    - ${o.id}: ${o.label}${o.means ? `\n${wrap(o.means, 100, "        ")}` : ""}`);
      if (o.gains) console.log(wrap(o.gains, 100, "        gains: "));
      if (o.costs) console.log(wrap(o.costs, 100, "        costs: "));
    }
    if (d.because) console.log(wrap(d.because, 100, "    because: "));
    if (d.lands) console.log(`    lands: ${d.lands}`);
    if (d.matters) console.log(`    matters: ${d.matters}`);
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
if (boardArg) {
  const spec = readSpec(boardArg);
  if (!spec) { console.error(`no spec for "${boardArg}" under ${SANDBOX}`); process.exit(2); }
  if (asJson) console.log(JSON.stringify({ ...spec, decisions: [...spec.decisions.values()], items: [...spec.items.values()] }, null, 2));
  else printBoard(spec);
  process.exit(0);
}

const paste = readFileSync(0, "utf8");
const { build, reviews } = parsePaste(paste);
const out = { build, boards: [] };
let confirms = 0, overrules = 0, unclear = 0, problems = 0;

for (const rev of reviews) {
  if (rev.error) { out.boards.push(rev); problems++; continue; }
  const spec = readSpec(rev.board);
  const board = { board: rev.board, round: rev.round, specRound: spec?.round ?? null, missing: !spec, verdicts: [], calls: rev.calls, items: rev.items, notes: rev.notes };
  for (const v of rev.verdicts) {
    const r = reading(spec, v);
    if (r.kind === "confirms") confirms++; else if (r.kind === "overrules") overrules++; else if (r.kind === "unclear") unclear++; else if (r.kind.startsWith("unknown")) problems++;
    board.verdicts.push({ ...v, reading: r.kind, question: r.d?.question ?? null, where: r.d?.where ?? [], when: r.d?.when ?? null, chosen: r.o ? { id: r.o.id, label: r.o.label, means: r.o.means, gains: r.o.gains, costs: r.o.costs } : null, recommended: r.rec ? { id: r.rec.id, label: r.rec.label } : null, lands: r.d?.lands ?? null, matters: r.d?.matters ?? null, overrule: r.d?.overrule ?? null, text: r.text });
  }
  out.boards.push(board);
}
out.totals = { confirms, overrules, unclear, problems };

if (asJson) { console.log(JSON.stringify(out, null, 2)); process.exit(problems ? 1 : 0); }

console.log(`build ${build ?? "(none)"} · ${reviews.length} boards · ${confirms} confirm · ${overrules} overrule · ${unclear} unclear${problems ? ` · ${problems} PROBLEMS` : ""}`);
for (const b of out.boards) {
  if (b.error) { console.log(`\n!! ${b.raw}\n   ${b.error}`); continue; }
  const roundNote = b.missing ? "  (NO SPEC on this tree: retired or renamed)" : b.specRound !== null && b.specRound !== b.round ? `  (the spec is at r${b.specRound}: his paste is from an earlier round)` : "";
  console.log(`\n${"=".repeat(100)}\n${b.board} r${b.round}: ${b.verdicts.length} verdicts${b.calls.length ? `, ${b.calls.length} calls` : ""}${b.items.length ? `, ${b.items.length} items` : ""}${roundNote}`);
  for (const v of b.verdicts) {
    const tag = { confirms: "=", overrules: "!", unclear: "?", none: "0", "unknown-ask": "X", "unknown-option": "X" }[v.reading] ?? " ";
    console.log(`\n  [${tag}] ${v.ask}=${v.choice}  ${v.text}`);
    // Where the answer lives and what brought someone there, before the question, as the step printed them.
    if (v.where?.length) console.log(`      where: ${v.where.join(" › ")}`);
    if (v.when) console.log(wrap(v.when, 100, "      when: "));
    if (v.question) console.log(wrap(v.question, 100, "      Q: "));
    // the picture beside the sentence (2026-09-20): the lab's own deep link to the step he answered, so a wiring lane
    // opens the drawing and reads his note together instead of starting from the ledger's option id.
    console.log(`      see: /design/lab/${b.board}?session=${b.board}.${v.ask}`);
    if (v.chosen) console.log(`      → ${v.chosen.label}${v.chosen.means ? `\n${wrap(v.chosen.means, 100, "        ")}` : ""}`);
    if (v.chosen?.gains) console.log(wrap(v.chosen.gains, 100, "        gains: "));
    if (v.chosen?.costs) console.log(wrap(v.chosen.costs, 100, "        costs: "));
    if (v.reading === "overrules" && v.recommended) console.log(`      (was recommended: ${v.recommended.id}, ${v.recommended.label})`);
    if (v.lands) console.log(`      lands: ${v.lands}`);
    if (v.matters) console.log(`      matters: ${v.matters}`);
    if (v.note) console.log(`      HIS NOTE: ${v.note}`);
  }
  for (const c of b.calls) console.log(`\n  [call] ${c.ask}=${c.choice}${c.note ? `  HIS NOTE: ${c.note}` : ""}`);
  for (const it of b.items) console.log(`\n  [item] ${it.ask}=${it.choice}${it.note ? `  HIS NOTE: ${it.note}` : ""}`);
  for (const n of b.notes) console.log(`\n  [board note] ${n}`);
}
process.exit(problems ? 1 : 0);
}
