#!/usr/bin/env node
/**
 * board-card: one screen per board, for cutting a lane from Will's answers fast.
 *
 *   node PartyreelAI/kit/board-card.mjs guest-shape media-viewer   # the cards
 *   node PartyreelAI/kit/board-card.mjs --desk                     # every standing board in desk order, one line each
 *
 * Reads touchpoints.ts (the board's row: title, surface, asks, lives; DESK_ORDER), the spec (its opening, its asks,
 * their context and recommendations, via batch-reader's parser), and the ledger (what he has answered in the round the
 * spec is in). Read-only; TypeScript parsed, never imported.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { readSpec } from "./batch-reader.mjs";
const require = createRequire(import.meta.url);
const ts = require("typescript");
const ROOT = process.cwd();

function str(n) { return n && (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) ? n.text : null; }
function prop(o, k) { for (const p of o.properties) if (ts.isPropertyAssignment(p) && p.name.text === k) return p.initializer; return null; }

const tp = readFileSync(join(ROOT, "src/app/(dev)/design/touchpoints.ts"), "utf8");
const sf = ts.createSourceFile("touchpoints.ts", tp, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const rows = new Map(); let deskOrder = [];
const walk = (n) => {
  if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer) {
    const init = ts.isAsExpression(n.initializer) ? n.initializer.expression : n.initializer;
    if (n.name.text === "RULINGS" && ts.isArrayLiteralExpression(init)) {
      for (const o of init.elements) if (ts.isObjectLiteralExpression(o)) {
        const lives = prop(o, "lives"); const board = prop(o, "board");
        rows.set(str(prop(o, "id")), {
          id: str(prop(o, "id")), title: str(prop(o, "title")), surface: str(prop(o, "surface")),
          asks: str(prop(o, "asks")),
          lives: lives && ts.isArrayLiteralExpression(lives) ? lives.elements.map(str).filter(Boolean) : [],
          onDesk: !!board,
          variants: board && ts.isObjectLiteralExpression(board) && prop(board, "variants") && ts.isArrayLiteralExpression(prop(board, "variants")) ? prop(board, "variants").elements.map(str) : [],
        });
      }
    }
    if (n.name.text === "DESK_ORDER" && ts.isArrayLiteralExpression(init)) deskOrder = init.elements.map(str).filter(Boolean);
  }
  ts.forEachChild(n, walk);
};
walk(sf);


/**
 * ★ THE ANSWERS OF THE ROUND THE SPEC IS IN, AND NO OTHER (disposable-mode r2's finding): an ask that keeps its id
 * into a new round is open again, and reading every round counted an earlier round's answer as this one's. The desk
 * reads the round the same way (`_desk/queue.ts`'s round guard). [] when the ledger has not opened that round.
 */
function ledger(board, round) {
  const f = join(ROOT, "docs/reviews", `${board}.json`);
  if (!existsSync(f)) return null;
  const j = JSON.parse(readFileSync(f, "utf8"));
  const r = (j.rounds ?? []).find((x) => x.n === round);
  return r?.answers ?? [];
}

const args = process.argv.slice(2);
if (args.includes("--desk")) {
  deskOrder.forEach((id, i) => {
    const r = rows.get(id); const spec = readSpec(id); const led = ledger(id, spec?.round) ?? [];
    const answered = new Set(led.filter((e) => e.choice !== null && e.choice !== undefined).map((e) => e.ask));
    console.log(`${String(i + 1).padStart(2)}. ${id.padEnd(16)} r${spec?.round ?? "?"}  ${spec?.decisions.size ?? "?"} asks, ${answered.size} answered  ${r ? `· ${r.title} (${r.surface}) · ${r.lives.length} lives` : "· (no RULINGS row)"}`);
  });
  process.exit(0);
}
for (const id of args) {
  const r = rows.get(id); const spec = readSpec(id); const led = spec ? ledger(id, spec.round) : null;
  console.log(`\n${"=".repeat(96)}\n${id}${r ? ` · ${r.title} · surface ${r.surface} · desk #${deskOrder.indexOf(id) + 1 || "off"}` : " · no RULINGS row"}`);
  if (r) {
    console.log(`  asks: ${r.asks?.slice(0, 220)}${r.asks && r.asks.length > 220 ? "…" : ""}`);
    console.log(`  lives (the wiring's owns start here):`);
    for (const l of r.lives) console.log(`    - ${l}${existsSync(join(ROOT, l)) ? "" : "  (MISSING on this tree)"}`);
  }
  if (!spec) { console.log("  spec: none on this tree (retired)"); continue; }
  const answered = new Map((led ?? []).map((e) => [e.ask, e]));
  console.log(`  spec: round ${spec.round ?? "?"}, ${spec.decisions.size} asks; ledger: ${led ? `${led.length} answers this round` : "none"}`);
  // The opening his sitting enters the board on, and the words it glosses (the context layer, 2026-09-29).
  if (spec.opening?.about) console.log(`  about: ${spec.opening.about}`);
  for (const l of spec.opening?.settled ?? []) console.log(`    settled: ${l}`);
  for (const l of spec.opening?.earlier ?? []) console.log(`    earlier: ${l}`);
  if (spec.terms?.length) console.log(`  terms: ${spec.terms.map((t) => t.term).join(" · ")}`);
  for (const d of spec.decisions.values()) {
    const a = answered.get(d.id);
    const state = a ? (a.choice === null ? "? (unclear)" : `answered: ${a.choice}`) : "OPEN";
    console.log(`    ${d.id.padEnd(22)} rec ${String(d.recommended).padEnd(12)} ${state}`);
    if (d.where?.length) console.log(`        where: ${d.where.join(" › ")}`);
    if (d.when) console.log(`        when: ${d.when}`);
    if (d.matters) console.log(`        matters: ${d.matters}`);
    const bare = d.options.filter((o) => !o.gains || !o.costs).map((o) => o.id);
    const missing = [!d.where?.length && "where", !d.when && "when", !d.matters && "matters", bare.length && `gains/costs on ${bare.join(", ")}`].filter(Boolean);
    if (!a && missing.length) console.log(`        context missing: ${missing.join(", ")}`);
  }
  if (r?.variants?.length) console.log(`  board.variants: ${r.variants.join(" · ")}`);
}
