#!/usr/bin/env node
/**
 * board-card: one screen per board, for cutting a lane from Will's answers fast.
 *
 *   node PartyreelAI/kit/board-card.mjs guest-shape media-viewer   # the cards
 *   node PartyreelAI/kit/board-card.mjs --desk                     # every standing board in desk order, one line each
 *
 * Reads each board's own spec (its title, surface, desk place and lives, its opening, its asks, their context and
 * recommendations, via batch-reader's parser) and the ledger (what he has answered in the round the spec is in).
 * Read-only; TypeScript parsed, never imported.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { readBoards } from "./batch-reader.mjs";
const ROOT = process.cwd();

// Every standing board in desk order, its facts off its own spec (a board is its folder since the lab revamp).
const boards = readBoards();
const rows = new Map(boards.map((b) => [b.board, b]));
const deskOrder = boards.map((b) => b.board);

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
    const spec = rows.get(id); const led = ledger(id, spec?.round) ?? [];
    const answered = new Set(led.filter((e) => e.choice !== null && e.choice !== undefined).map((e) => e.ask));
    console.log(`${String(i + 1).padStart(2)}. ${id.padEnd(16)} r${spec?.round ?? "?"}  ${spec?.decisions.size ?? "?"} asks, ${answered.size} answered  · ${spec.title} (${spec.surface ?? "no surface"}) · desk ${spec.desk ?? "none"} · ${spec.lives.length} lives`);
  });
  process.exit(0);
}
for (const id of args) {
  const spec = rows.get(id); const led = spec ? ledger(id, spec.round) : null;
  if (!spec) { console.log(`\n${"=".repeat(96)}\n${id} · no folder on this tree (retired)`); continue; }
  console.log(`\n${"=".repeat(96)}\n${id} · ${spec.title} · surface ${spec.surface ?? "none"} · desk ${spec.desk ?? "none"} (#${deskOrder.indexOf(id) + 1})`);
  console.log(`  lives (the wiring's owns start here):`);
  for (const l of spec.lives) console.log(`    - ${l}${existsSync(join(ROOT, l)) ? "" : "  (MISSING on this tree)"}`);
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
}
