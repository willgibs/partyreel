#!/usr/bin/env node
/**
 * board-card: one screen per board, for cutting a lane from Will's answers fast.
 *
 *   node PartyreelAI/kit/board-card.mjs guest-shape media-viewer   # the cards
 *   node PartyreelAI/kit/board-card.mjs --desk                     # every standing board in desk order, one line each
 *
 * Reads touchpoints.ts (the RULINGS row: title, surface, ruled, lives; DESK_ORDER), the spec (its asks and
 * recommendations, via batch-reader's parser), and the ledger (what he has answered). Read-only; TypeScript parsed, never imported.
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
          ruled: str(prop(o, "ruled")), shipped: str(prop(o, "shipped")),
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


function ledger(board) {
  const f = join(ROOT, "docs/reviews", `${board}.json`);
  if (!existsSync(f)) return null;
  const j = JSON.parse(readFileSync(f, "utf8"));
  const found = [];
  const dig = (v) => { if (Array.isArray(v)) v.forEach(dig); else if (v && typeof v === "object") { if ("ask" in v && "choice" in v) found.push(v); else Object.values(v).forEach(dig); } };
  dig(j);
  return found;
}

const args = process.argv.slice(2);
if (args.includes("--desk")) {
  deskOrder.forEach((id, i) => {
    const r = rows.get(id); const spec = readSpec(id); const led = ledger(id) ?? [];
    const answered = new Set(led.filter((e) => e.choice !== null && e.choice !== undefined).map((e) => e.ask));
    console.log(`${String(i + 1).padStart(2)}. ${id.padEnd(16)} r${spec?.round ?? "?"}  ${spec?.decisions.size ?? "?"} asks, ${answered.size} answered  ${r ? `· ${r.title} (${r.surface}) · ${r.lives.length} lives` : "· (no RULINGS row)"}`);
  });
  process.exit(0);
}
for (const id of args) {
  const r = rows.get(id); const spec = readSpec(id); const led = ledger(id);
  console.log(`\n${"=".repeat(96)}\n${id}${r ? ` · ${r.title} · surface ${r.surface} · desk #${deskOrder.indexOf(id) + 1 || "off"}` : " · no RULINGS row"}`);
  if (r) {
    console.log(`  ruled: ${r.ruled?.slice(0, 220)}${r.ruled && r.ruled.length > 220 ? "…" : ""}`);
    if (r.shipped) console.log(`  shipped: ${r.shipped}`);
    console.log(`  lives (the wiring's owns start here):`);
    for (const l of r.lives) console.log(`    - ${l}${existsSync(join(ROOT, l)) ? "" : "  (MISSING on this tree)"}`);
  }
  if (!spec) { console.log("  spec: none on this tree (retired)"); continue; }
  const answered = new Map((led ?? []).map((e) => [e.ask, e]));
  console.log(`  spec: round ${spec.round ?? "?"}, ${spec.decisions.size} asks; ledger: ${led ? `${led.length} entries` : "none"}`);
  for (const d of spec.decisions.values()) {
    const a = answered.get(d.id);
    const state = a ? (a.choice === null ? "? (unclear)" : `answered: ${a.choice}`) : "OPEN";
    console.log(`    ${d.id.padEnd(22)} rec ${String(d.recommended).padEnd(12)} ${state}`);
  }
  if (r?.variants?.length) console.log(`  board.variants: ${r.variants.join(" · ")}`);
}
