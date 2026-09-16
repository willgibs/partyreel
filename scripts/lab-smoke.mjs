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
 * `--production` adds the closed door (no key, wrong key: 404); `--base <origin>`
 * points elsewhere; `--timeout <ms>` widens the 20s a cold dev compile can
 * exceed; `--dry` prints the plan and fetches nothing. Exit 1 on any failure,
 * never a hang (every request is aborted at the timeout). Node builtins only:
 * the tables come out of src/app/(dev)/design/_data/legacy-routes.ts by regex,
 * because the file is data (legacy-routes.test.ts imports it for real and
 * holds every destination and traced glob against the disk).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const DATA = "src/app/(dev)/design/_data/legacy-routes.ts";
// The crawl starts at the two areas, plus the two iframe scene routes an href
// crawl can never reach (a board builds their src client-side, key included).
const SEEDS = ["/design/library", "/design/lab"];
const SCENES = [
  "/design/sandbox/floating-surfaces",
  "/design/sandbox/rounding/screen",
];
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
function print() {
  const w = (i) => Math.max(HEAD[i].length, ...rows.map((r) => r[i].length));
  const line = (r) =>
    `${r[0].padEnd(w(0))}  ${r[1].padEnd(w(1))}  ${r[2].padStart(w(2))}  ${r[3]}`;
  for (const r of [HEAD, ...rows]) console.log(line(r));
  console.log(`\n${rows.length} checks, ${failures} failing`);
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
}

const { redirects, globs } = readTables();
if (dry) plan(redirects, globs);
else {
  const seen = await crawl();
  await legacy(redirects, seen);
  if (production) await closedDoor(redirects);
  print();
}
process.exit(failures ? 1 : 0);
