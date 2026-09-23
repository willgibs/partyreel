#!/usr/bin/env node
// review-sheet.mjs <batch.txt> [out.html] [--captures dir,dir]: Will's paste as one page, each verdict beside the drawing it
// answered: the question, the option he chose (its label and what it lands), whether it confirms or overrules the board's
// recommendation, his note verbatim, the deep link to the live step, and the lane's capture of that option when one exists
// (searched by ask and option in the capture dirs; a file:// reference, so the page is for the machine that holds them).
// Born 2026-09-20 from the ideas note "the note beside the drawing": a wiring lane, or Will himself, should start from the
// picture and the sentence together, never from the ledger's option id alone.
import fs from "node:fs"; import path from "node:path";
import { readSpec, parsePaste, reading } from "./batch-reader.mjs";
const args = process.argv.slice(2); const file = args[0]; if (!file) { console.error("usage: review-sheet.mjs <batch.txt> [out.html] [--captures dir,dir]"); process.exit(1); }
const out = args[1] && !args[1].startsWith("--") ? args[1] : null;
const capArg = args.includes("--captures") ? args[args.indexOf("--captures") + 1] : "";
const S = process.env.S || "/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/924675e3-0148-4e81-9dca-d9c2f1952d0a/scratchpad";
const capDirs = capArg ? capArg.split(",") : fs.readdirSync(S).map((d) => path.join(S, d)).filter((d) => { try { return fs.statSync(d).isDirectory(); } catch { return false; } });
const pngs = capDirs.flatMap((d) => { try { return fs.readdirSync(d).filter((f) => f.endsWith(".png")).map((f) => path.join(d, f)); } catch { return []; } });
const pick = (board, ask, choice) => {
  const lc = (s) => s.toLowerCase(); const tries = [
    (f) => lc(f).includes(lc(ask)) && choice && lc(f).includes(lc(choice)) && f.includes("1440"),
    (f) => lc(f).includes(lc(ask)) && choice && lc(f).includes(lc(choice)),
    (f) => lc(f).includes(`${lc(board)}.${lc(ask)}`) && f.includes("1440"),
    (f) => lc(path.basename(f)).startsWith(`${lc(ask)}-1440`),
  ];
  for (const t of tries) { const hit = pngs.find((p) => t(path.basename(p))); if (hit) return hit; }
  return null;
};
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const { build, reviews } = parsePaste(fs.readFileSync(file, "utf8"));
const ALIAS = "https://partyreel-git-launch-prep-partyreel.vercel.app";
let rows = ""; let n = 0, confirms = 0, overrules = 0, pictured = 0;
for (const r of reviews) {
  if (r.error) continue; let spec = null; try { spec = readSpec(r.board); } catch {}
  rows += `<h2>${esc(r.board)} <span class="dim">round ${r.round} · ${r.verdicts.length} verdicts</span></h2>`;
  for (const v of r.verdicts) {
    n++; const d = spec?.decisions?.get?.(v.ask) ?? null; const opt = d?.options?.find((o) => o.id === v.choice) ?? null;
    const rec = d?.recommended ?? null; const tag = v.choice === "?" ? "unclear" : rec == null ? "" : v.choice === rec ? "confirms" : "overrules";
    if (tag === "confirms") confirms++; if (tag === "overrules") overrules++;
    const cap = pick(r.board, v.ask, v.choice); if (cap) pictured++;
    const link = `${ALIAS}/design/lab/${r.board}?session=${r.board}.${v.ask}`;
    rows += `<section class="v"><div class="pic">${cap ? `<img src="file://${cap}" alt="${esc(r.board)} ${esc(v.ask)} ${esc(v.choice)}">` : `<div class="nopic">no capture of this option on this machine<br><a href="${link}">open the step</a></div>`}</div>
<div class="txt"><div class="ask"><span class="id">${esc(v.ask)}</span> = <b>${esc(v.choice)}</b> ${tag ? `<span class="tag ${tag}">${tag}${rec && tag === "overrules" ? ` ${esc(rec)}` : ""}</span>` : ""}</div>
${d ? `<p class="q">${esc(d.question)}</p>` : ""}${opt ? `<p class="opt"><b>${esc(opt.label)}</b>${opt.means ? ` ${esc(opt.means)}` : ""}</p>` : ""}${d?.lands ? `<p class="lands">lands: ${esc(d.lands)}</p>` : ""}
${v.note ? `<blockquote>${esc(v.note)}</blockquote>` : `<p class="dim">no note</p>`}<p class="link"><a href="${link}">the step on the alias</a></p></div></section>`;
  }
}
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Review sheet ${esc(build || "")}</title>
<style>:root{--ground:#0b0b10;--ink:#e8e6f0;--dim:rgba(232,230,240,.5);--line:rgba(232,230,240,.1);--ok:#7bd88f;--warn:#f0b35a;--q:#9aa4ff}
html,body{margin:0;background:var(--ground);color:var(--ink);font:15px/1.55 -apple-system,"Segoe UI",Helvetica,Arial,sans-serif}main{max-width:1180px;margin:0 auto;padding:28px 16px 60px}
h1{font-size:22px;margin:0 0 4px}h2{font-size:16px;margin:36px 0 10px;padding-top:14px;border-top:1px solid var(--line)}.dim{color:var(--dim);font-weight:400}
.v{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,4fr);gap:18px;padding:14px 0;border-top:1px dashed var(--line)}@media (max-width:760px){.v{grid-template-columns:1fr}}
.pic img{width:100%;height:auto;border-radius:6px;border:1px solid var(--line)}.nopic{aspect-ratio:16/10;display:flex;align-items:center;justify-content:center;text-align:center;color:var(--dim);border:1px dashed var(--line);border-radius:6px;font-size:13px}
.ask{font-size:15px}.id{color:var(--q)}.tag{font-size:11px;padding:2px 7px;border-radius:999px;border:1px solid var(--line);margin-left:6px;color:var(--dim)}.tag.overrules{color:var(--warn);border-color:var(--warn)}.tag.confirms{color:var(--ok);border-color:var(--ok)}
.q{color:var(--dim);margin:6px 0}.opt{margin:6px 0}.lands{color:var(--dim);font-size:13px;margin:4px 0}blockquote{margin:10px 0;padding:8px 12px;border-left:3px solid var(--q);background:rgba(154,164,255,.06);border-radius:0 6px 6px 0}
.link a,.nopic a{color:var(--q);font-size:13px}</style></head><body><main><h1>Review sheet <span class="dim">build ${esc(build || "?")}</span></h1>
<p class="dim">${n} verdicts · ${confirms} confirm the board's recommendation · ${overrules} overrule it · ${pictured} with the lane's own capture on this machine. Each verdict beside the drawing it answered; his note verbatim.</p>${rows}</main></body></html>`;
const target = out || path.join(S, "review-sheets", `${build || "batch"}.html`); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, html);
console.log(`${target}: ${n} verdicts, ${confirms} confirm, ${overrules} overrule, ${pictured} pictured`);
