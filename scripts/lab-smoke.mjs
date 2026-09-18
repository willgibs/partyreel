#!/usr/bin/env node
/**
 * THE LAB SMOKE (the Library x Lab round, 2026-09-15): every lab route answers,
 * every old URL lands where the table says, and the key travels the whole way.
 * Run it after EVERY shell change (a moved page, a new board, a nav edit)
 * against `pnpm dev`, and before a merge against the production build, where
 * the gate is real:
 *
 *   pnpm lab:smoke [--key <key>]       # dev is open; a key proves it travels
 *   pnpm build && pnpm start && pnpm lab:smoke --production --key "$DESIGN_PREVIEW_KEY"
 *
 * IT ALSO MEASURES THE READING (the revamp, 2026-09-16). Will's note on the
 * palette board's fifth round was that it read like "a PhD on color theory",
 * and no test could say so: a board's length is a property of the rendered
 * page, not of any file. So every board page is weighed here, in the words a
 * reviewer actually MEETS (what is inside a closed fold, or hidden, does not
 * count, which is the whole point of folding it), against LIMITS.readingWords
 * in board-spec.ts. A board that truly needs more says why in its spec
 * (`reading: { words, why }`) and the smoke prints the reason.
 *
 * `--production` adds the closed door (no key, wrong key: 404); `--base <origin>`
 * points elsewhere; `--timeout <ms>` widens the 20s a cold dev compile can
 * exceed; `--dry` prints the plan and fetches nothing. Exit 1 on any failure,
 * never a hang (every request is aborted at the timeout). Node builtins only:
 * the tables come out of src/app/(dev)/design/_data/legacy-routes.ts by regex,
 * because the file is data (legacy-routes.test.ts imports it for real and
 * holds every destination and traced glob against the disk). The budget and the
 * per-board overrides are read the same way, and `registry.test.ts` holds every
 * spec to the real module.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DATA = "src/app/(dev)/design/_data/legacy-routes.ts";
const SPEC = "src/components/lab/board-spec.ts";
const SANDBOX_DIR = "src/app/(dev)/design/sandbox";
// The crawl starts at the two areas, plus any iframe scene route an href crawl
// can never reach (a board builds its src client-side, key included).
const SEEDS = ["/design/library", "/design/lab"];
// EMPTY, AND THAT IS CORRECT, NOT A GAP: no standing board draws its stage in
// an iframe scene route any more. type-scale's and floating-surfaces' scenes
// left with their boards on 2026-09-17, and rounding's `screen/` (the last one)
// left with its board at its ruling on 2026-09-18. A board that adds a scene
// route adds it here in the same change, or the crawl never visits it.
const SCENES = [];
// The boundary probe throws during server render on purpose (its page.tsx).
// Whether that surfaces as a 500 or inside a 200 depends on where the shell's
// Suspense boundary sits, so both pass; only the gate's 404 or no answer fails.
const EXPECT = { "/design/lab/tools/boom": [200, 500] };
const MAX_PAGES = 400;

const argv = process.argv.slice(2);
const opt = (name, fallback) =>
  argv.includes(name) ? (argv[argv.indexOf(name) + 1] ?? fallback) : fallback;
const base = opt("--base", "http://localhost:3000").replace(/\/+$/, "");
const key = opt("--key", "");
const timeout = Number(opt("--timeout", 20_000));
const production = argv.includes("--production");
const dry = argv.includes("--dry");
if (production && !key)
  throw new Error("--production needs --key: the gate is closed without one.");

function readTables() {
  const src = readFileSync(join(process.cwd(), DATA), "utf8");
  const pair = /source:\s*"([^"]+)",\s*destination:\s*"([^"]+)"/g;
  const redirects = [...src.matchAll(pair)].map((m) => [m[1], m[2]]);
  const list = src.match(/TRACED_DOC_GLOBS\s*=\s*\[([\s\S]*?)\]/)?.[1] ?? "";
  const globs = [...list.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  if (!redirects.length || !globs.length)
    throw new Error(`could not read the tables out of ${DATA}`);
  return { redirects, globs };
}
const routeOf = (u) => u.pathname + u.search;
function url(route, k = key) {
  const u = new URL(route, base);
  u.searchParams.delete("key");
  if (k) u.searchParams.set("key", k);
  return u;
}
const bare = (href) => routeOf(url(href, ""));
const labPath = (loc) => new URL(loc, base).pathname.startsWith("/design/");
const carriesKey = (loc) =>
  !key || new URL(loc, base).searchParams.get("key") === key;
const wanted = (route) => EXPECT[route] ?? [200];
const since = (t0) => performance.now() - t0;
const reason = (e) =>
  e?.name === "AbortError"
    ? `no answer in ${timeout}ms`
    : (e?.cause?.code ?? e?.message ?? String(e));

async function get(u) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeout);
  const t0 = performance.now();
  try {
    const res = await fetch(u, { redirect: "manual", signal: ctl.signal });
    const type = res.headers.get("content-type") ?? "";
    const html = type.includes("text/html") ? await res.text() : "";
    const location = res.headers.get("location");
    return { status: res.status, location, html, ms: since(t0) };
  } catch (err) {
    return { status: 0, html: "", ms: since(t0), error: reason(err) };
  } finally {
    clearTimeout(timer);
  }
}
const rows = [];
let failures = 0;
function report(route, status, ms, note, ok = true) {
  rows.push([route, String(status), String(Math.round(ms)), note]);
  if (!ok) failures++;
}
// A 307 to a lab route is followed exactly once: the Location must carry the
// key and the landing must answer as expected. Returns the landing route.
async function follow(route, res, expected) {
  const to = new URL(res.location, base);
  const target = bare(routeOf(to));
  const bad = [];
  if (expected && !target.startsWith(expected))
    bad.push(`expected ${expected}, got ${target}`);
  if (!carriesKey(res.location)) bad.push("Location drops the key");
  const end = await get(to);
  if (!wanted(target).includes(end.status))
    bad.push(`landed ${end.status} ${end.error ?? ""}`.trim());
  const note = bad.join("; ") || `-> ${target}`;
  report(route, `307 -> ${end.status}`, res.ms + end.ms, note, !bad.length);
  return target;
}
// ★ THE STYLESHEET CHECK (the revamp, 2026-09-16). A dev server names its CSS
// chunks by path, so a browser can hold an old copy while the server is right;
// the smoke proves the SERVER's side: every page that renders the shell links a
// stylesheet that contains the shell's grid rule. Each stylesheet is fetched
// once for the whole crawl.
const sheets = new Map();
async function sheetHasShell(href) {
  if (!sheets.has(href)) {
    sheets.set(
      href,
      fetch(new URL(href, base))
        .then((r) => (r.ok ? r.text() : ""))
        .then((css) => css.includes(".lab-shell-body"))
        .catch(() => false),
    );
  }
  return sheets.get(href);
}
async function shellStyled(html) {
  if (!html.includes('class="lab-shell')) return true;
  const hrefs = [
    ...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g),
  ].map((m) => m[1].replace(/&amp;/g, "&"));
  const results = await Promise.all(hrefs.map(sheetHasShell));
  return results.some(Boolean);
}

/* ── The reading budget (the revamp, 2026-09-16) ──────────────────────────── */

/** The cap, read off board-spec.ts, which is where the density limits live. */
function readBudget() {
  const src = readFileSync(join(process.cwd(), SPEC), "utf8");
  const n = Number(/readingWords:\s*(\d+)/.exec(src)?.[1]);
  if (!Number.isFinite(n))
    throw new Error(`could not read LIMITS.readingWords out of ${SPEC}`);
  return n;
}

/** Every board directory with a spec, and the override that spec declares. */
function readBoards() {
  const dir = join(process.cwd(), SANDBOX_DIR);
  const out = new Map();
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    let src = "";
    try {
      src = readFileSync(join(dir, entry.name, "spec.ts"), "utf8");
    } catch {
      continue;
    }
    const m =
      /reading:\s*\{\s*words:\s*(\d+),\s*why:\s*"((?:[^"\\]|\\.)*)"/.exec(src);
    out.set(entry.name, m ? { words: Number(m[1]), why: m[2] } : null);
  }
  return out;
}

const VOID = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);
const ENTITY = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  rsquo: "’",
  lsquo: "‘",
  ldquo: "“",
  rdquo: "”",
  hellip: "…",
  mdash: "—",
  ndash: "–",
};
const decode = (t) =>
  t
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) =>
      String.fromCodePoint(parseInt(n, 16)),
    )
    .replace(/&([a-z]+);/gi, (m, name) => ENTITY[name.toLowerCase()] ?? m);

/** The board's own root (`<div data-board="...">`), not the shell around it. */
function boardRoot(html, id) {
  const at = html.indexOf(`data-board="${id}"`);
  if (at < 0) return null;
  const open = html.lastIndexOf("<", at);
  const tags = /<\/?([a-zA-Z][\w-]*)([^>]*)>/g;
  tags.lastIndex = open;
  let depth = 0;
  let m;
  while ((m = tags.exec(html)) !== null) {
    const [tag, name, attrs] = m;
    if (tag[1] === "/") {
      depth--;
      if (depth === 0) return html.slice(open, m.index);
      continue;
    }
    if (!VOID.has(name.toLowerCase()) && !attrs.trimEnd().endsWith("/"))
      depth++;
  }
  return html.slice(open);
}

/**
 * The words a reader MEETS on a page: everything outside a closed `<details>`
 * (its summary still counts, because that is the line he reads), outside
 * anything `hidden` or `aria-hidden`, and outside script, style and template.
 *
 * ★ A SPECIMEN IS NOT PROSE, and this is the line that makes the budget mean
 * anything. A board showing the real home page renders the home page's copy,
 * on purpose. Those are words to LOOK at, not words to read, so everything inside a stage (`data-stage-fit`), on a
 * production ground (`data-ground`), inside a frame or inside a `<pre>` paste is excluded. What is left
 * is the board's own voice: its answer, its ledes, its labels and its notes,
 * which is exactly what "it reads like a PhD" was about.
 *
 * ★ AND A FOLD IS THE ANSWER, NOT A LOOPHOLE. The template already collapses a
 * section's argument and a card's rationale, so a board that has done the work
 * passes this without losing a word of what it knows; a board that puts the
 * argument above the fold is the one this is for.
 */
export function visibleWords(html) {
  const clean = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<template[\s\S]*?<\/template>/gi, " ");
  const tags = /<\/?([a-zA-Z][\w-]*)([^>]*)>/g;
  const out = [];
  let depth = 0;
  let last = 0;
  let skip = null;
  let summary = 0;
  let m;
  const take = (upto) => {
    if (skip === null || summary > 0) out.push(clean.slice(last, upto));
  };
  while ((m = tags.exec(clean)) !== null) {
    take(m.index);
    last = m.index + m[0].length;
    const [tag, raw, attrs] = m;
    const name = raw.toLowerCase();
    if (tag[1] === "/") {
      if (name === "summary" && summary === depth) summary = 0;
      depth--;
      if (skip !== null && depth < skip) skip = null;
      continue;
    }
    if (VOID.has(name) || attrs.trimEnd().endsWith("/")) continue;
    depth++;
    if (skip === null) {
      const hidden =
        /\shidden(?=[\s>=])/.test(attrs) || /aria-hidden="true"/.test(attrs);
      const folded = name === "details" && !/\sopen(?=[\s>=])/.test(attrs);
      // ★ NOT `data-ground`: BoardPage writes `data-<controlId>` on the board
      // ROOT and three boards declare a control called `ground`, so keying off
      // it blanked three whole boards to zero words.
      const specimen =
        name === "iframe" ||
        /\sdata-stage-fit(?=[\s>=])/.test(attrs) ||
        /\sdata-lab-specimen(?=[\s>=])/.test(attrs);
      // A paste block (`<pre>`: the CSS a ruling would land) is copied, not
      // read; the palette's weighed 695 words of tokens (2026-09-16).
      const paste = name === "pre";
      if (hidden || folded || specimen || paste) skip = depth;
    } else if (name === "summary" && depth === skip + 1 && summary === 0) {
      summary = depth;
    }
  }
  take(clean.length);
  return decode(out.join(" ")).split(/\s+/).filter(Boolean).length;
}

const reading = [];
let over = 0;
/** One board's page, weighed. `html` is the crawled response body. */
function weigh(id, html, budget, override) {
  const root = boardRoot(html, id);
  if (root === null) {
    reading.push([
      id,
      "-",
      "-",
      "no board root (a legacy board draws its own)",
    ]);
    return;
  }
  const words = visibleWords(root);
  const cap = override?.words ?? budget;
  const ok = words <= cap;
  const note = override
    ? `over ${budget} by declaration: ${override.why}`
    : ok
      ? ""
      : "a paper: collapse the argument or cut it";
  reading.push([id, String(words), String(cap), note]);
  if (!ok) {
    over++;
    report(`/design/lab/${id} (reading)`, words, 0, `over ${cap} words`, false);
  }
}

async function crawl() {
  const seen = new Set();
  const queue = [...SEEDS, ...SCENES];
  while (queue.length && seen.size < MAX_PAGES) {
    const route = bare(queue.shift());
    if (seen.has(route)) continue;
    seen.add(route);
    const res = await get(url(route));
    if (res.status === 307 && res.location && labPath(res.location)) {
      queue.push(await follow(route, res));
      continue;
    }
    let ok = wanted(route).includes(res.status);
    let note = ok ? "" : (res.error ?? `want ${wanted(route)}`);
    if (ok && res.status === 200 && !(await shellStyled(res.html))) {
      ok = false;
      note = "no stylesheet with the shell (stale or missing design.css chunk)";
    }
    report(route, res.status, res.ms, note, ok);
    const board = /^\/design\/lab\/([a-z0-9-]+)$/.exec(route)?.[1];
    if (ok && board && boards.has(board))
      weigh(board, res.html, budget, boards.get(board));
    // React writes `&` as `&amp;` inside attributes; fragments are dropped.
    for (const m of ok ? res.html.matchAll(/href="(\/design\/[^"#]*)/g) : [])
      queue.push(m[1].replace(/&amp;/g, "&"));
  }
  if (queue.some((r) => !seen.has(bare(r))))
    report("(crawl)", "-", 0, `stopped at ${MAX_PAGES} pages`, false);
  return seen;
}
async function legacy(redirects, seen) {
  // :board stands in for the first board the crawl reached (so it is real).
  const board = [...seen]
    .map((r) => r.match(/^\/design\/lab\/([a-z0-9-]+)$/)?.[1])
    .find((id) => id && id !== "tools");
  for (const [source, destination] of redirects) {
    if (source.includes(":") && !board) {
      report(source, "-", 0, "the crawl reached no board to stand in", false);
      continue;
    }
    const from = source.replace(/:\w+/g, board);
    const to = destination.replace(/:\w+/g, board);
    const res = await get(url(from));
    if (res.status === 307 && res.location) await follow(from, res, to);
    else report(from, res.status, res.ms, res.error ?? "want 307", false);
  }
}
// The production gate: three routes, each without a key and with a wrong one.
const doorRoutes = (redirects) =>
  [...SEEDS, redirects.find(([, d]) => !d.includes(":"))?.[1]].filter(Boolean);
async function closedDoor(redirects) {
  const doors = { "no key": "", "wrong key": `${key}-wrong` };
  for (const route of doorRoutes(redirects)) {
    for (const [label, k] of Object.entries(doors)) {
      const res = await get(url(route, k));
      const ok = res.status === 404;
      const note = ok ? "closed" : "expected 404";
      report(`${route} (${label})`, res.status, res.ms, note, ok);
    }
  }
}

const HEAD = ["route", "status", "ms", "note"];
const READ_HEAD = ["board", "words", "budget", "note"];
function table(head, body) {
  const w = (i) => Math.max(head[i].length, ...body.map((r) => r[i].length));
  const line = (r) =>
    `${r[0].padEnd(w(0))}  ${r[1].padEnd(w(1))}  ${r[2].padStart(w(2))}  ${r[3]}`;
  for (const r of [head, ...body]) console.log(line(r));
}
function print() {
  table(HEAD, rows);
  if (reading.length) {
    console.log(`\nthe reading, outside every closed fold (budget ${budget}):`);
    table(READ_HEAD, reading);
  }
  // The two halves are said apart on purpose: a route that does not answer is
  // broken, a board that reads long is work. Both fail the run.
  const routes = failures - over;
  console.log(
    `\n${rows.length} checks, ${failures} failing` +
      (over
        ? ` (${routes} route${routes === 1 ? "" : "s"}, ${over} over the reading budget)`
        : ""),
  );
}
function plan(redirects, globs) {
  const say = (s) => console.log(s);
  say(`dry run: ${base}, key ${key ? "set" : "none"}`);
  say(`\ncrawl, every href="/design/..." followed, up to ${MAX_PAGES} pages:`);
  for (const r of [...SEEDS, ...SCENES]) say(`  ${url(r).href}`);
  say(
    `\nlegacy (${redirects.length}), each a 307 carrying the key to its page:`,
  );
  for (const [s, d] of redirects) say(`  ${s} -> ${d}`);
  if (production)
    say(`\nclosed door (no key, wrong key -> 404): ${doorRoutes(redirects)}`);
  say(`\ntraced doc globs (${globs.length}), held to disk by the test:`);
  for (const g of globs) say(`  ${g}`);
  say(`\nthe reading budget: ${budget} words outside every closed fold, on`);
  for (const [id, override] of boards)
    say(
      `  ${id}${override ? ` (declares ${override.words}: ${override.why})` : ""}`,
    );
}

const { redirects, globs } = readTables();
const budget = readBudget();
const boards = readBoards();
if (dry) plan(redirects, globs);
else {
  const seen = await crawl();
  await legacy(redirects, seen);
  if (production) await closedDoor(redirects);
  print();
}
process.exit(failures ? 1 : 0);
