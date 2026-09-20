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
function readSpec(board) {
  const file = join(SANDBOX, board, "spec.ts");
  if (!existsSync(file)) return null;
  const src = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const spec = { board, file, round: null, decisions: new Map(), items: new Map() };
  const walk = (node) => {
    if (ts.isObjectLiteralExpression(node)) {
      const q = prop(node, "question"), opts = prop(node, "options"), id = prop(node, "id");
      if (q && opts && id && ts.isArrayLiteralExpression(opts)) {
        const d = {
          id: str(id), question: str(q), context: str(prop(node, "context")),
          recommended: str(prop(node, "recommended")), today: str(prop(node, "today")),
          because: str(prop(node, "because")), overrule: str(prop(node, "overrule")), lands: str(prop(node, "lands")),
          options: [],
        };
        for (const o of opts.elements) {
          if (!ts.isObjectLiteralExpression(o)) continue;
          d.options.push({ id: str(prop(o, "id")), label: str(prop(o, "label")), means: str(prop(o, "means")) });
        }
        // A Control also has id+options but no question; only decisions reach here.
        spec.decisions.set(d.id, d);
      }
      const r = prop(node, "round");
      if (r && ts.isObjectLiteralExpression(r)) {
        const n = prop(r, "n");
        if (n && ts.isNumericLiteral(n)) spec.round = Number(n.text);
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

export { readSpec, parsePaste, reading };

/* ---------- the reading ---------- */

function reading(spec, v) {
  const d = spec?.decisions.get(v.ask);
  if (!d) return { kind: "unknown-ask", text: `no decision "${v.ask}" in the spec` };
  const rec = d.options.find((o) => o.id === d.recommended);
  if (v.choice === "?") return { kind: "unclear", d, rec, text: "not clear to him; the note may carry his own answer" };
  if (v.choice === "stands") return { kind: "stands", d, rec, text: "left to the earlier ruling" };
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
  return lines.map((l) => indent + l).join("\n");
}

function printBoard(spec) {
  console.log(`\n${spec.board} r${spec.round ?? "?"}: ${spec.decisions.size} asks`);
  for (const d of spec.decisions.values()) {
    console.log(`\n  ${d.id}  (recommended: ${d.recommended}${d.today ? `, today: ${d.today}` : ""})`);
    console.log(wrap(d.question, 100, "    "));
    for (const o of d.options) console.log(`    - ${o.id}: ${o.label}${o.means ? `\n${wrap(o.means, 100, "        ")}` : ""}`);
    if (d.lands) console.log(`    lands: ${d.lands}`);
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
let confirms = 0, overrules = 0, unclear = 0, stands = 0, problems = 0;

for (const rev of reviews) {
  if (rev.error) { out.boards.push(rev); problems++; continue; }
  const spec = readSpec(rev.board);
  const board = { board: rev.board, round: rev.round, specRound: spec?.round ?? null, missing: !spec, verdicts: [], calls: rev.calls, items: rev.items, notes: rev.notes };
  for (const v of rev.verdicts) {
    const r = reading(spec, v);
    if (r.kind === "confirms") confirms++; else if (r.kind === "overrules") overrules++; else if (r.kind === "unclear") unclear++; else if (r.kind === "stands") stands++; else if (r.kind.startsWith("unknown")) problems++;
    board.verdicts.push({ ...v, reading: r.kind, question: r.d?.question ?? null, chosen: r.o ? { id: r.o.id, label: r.o.label, means: r.o.means } : null, recommended: r.rec ? { id: r.rec.id, label: r.rec.label } : null, lands: r.d?.lands ?? null, overrule: r.d?.overrule ?? null, text: r.text });
  }
  out.boards.push(board);
}
out.totals = { confirms, overrules, unclear, stands, problems };

if (asJson) { console.log(JSON.stringify(out, null, 2)); process.exit(problems ? 1 : 0); }

console.log(`build ${build ?? "(none)"} · ${reviews.length} boards · ${confirms} confirm · ${overrules} overrule · ${unclear} unclear · ${stands} stand${problems ? ` · ${problems} PROBLEMS` : ""}`);
for (const b of out.boards) {
  if (b.error) { console.log(`\n!! ${b.raw}\n   ${b.error}`); continue; }
  const roundNote = b.missing ? "  (NO SPEC on this tree: retired or renamed)" : b.specRound !== null && b.specRound !== b.round ? `  (the spec is at r${b.specRound}: his paste is from an earlier round)` : "";
  console.log(`\n${"=".repeat(100)}\n${b.board} r${b.round}: ${b.verdicts.length} verdicts${b.calls.length ? `, ${b.calls.length} calls` : ""}${b.items.length ? `, ${b.items.length} items` : ""}${roundNote}`);
  for (const v of b.verdicts) {
    const tag = { confirms: "=", overrules: "!", unclear: "?", stands: "~", none: "0", "unknown-ask": "X", "unknown-option": "X" }[v.reading] ?? " ";
    console.log(`\n  [${tag}] ${v.ask}=${v.choice}  ${v.text}`);
    if (v.question) console.log(wrap(v.question, 100, "      Q: "));
    // the picture beside the sentence (2026-09-20): the lab's own deep link to the step he answered, so a wiring lane
    // opens the drawing and reads his note together instead of starting from the ledger's option id.
    console.log(`      see: /design/lab/${b.board}?session=${b.board}.${v.ask}`);
    if (v.chosen) console.log(`      → ${v.chosen.label}${v.chosen.means ? `\n${wrap(v.chosen.means, 100, "        ")}` : ""}`);
    if (v.reading === "overrules" && v.recommended) console.log(`      (was recommended: ${v.recommended.id}, ${v.recommended.label})`);
    if (v.lands) console.log(`      lands: ${v.lands}`);
    if (v.note) console.log(`      HIS NOTE: ${v.note}`);
  }
  for (const c of b.calls) console.log(`\n  [call] ${c.ask}=${c.choice}${c.note ? `  HIS NOTE: ${c.note}` : ""}`);
  for (const it of b.items) console.log(`\n  [item] ${it.ask}=${it.choice}${it.note ? `  HIS NOTE: ${it.note}` : ""}`);
  for (const n of b.notes) console.log(`\n  [board note] ${n}`);
}
process.exit(problems ? 1 : 0);
}
