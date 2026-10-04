#!/usr/bin/env node
/**
 * THE MEASURING SERVER (compute-model, 2026-10-04): the production build behind Next's own custom
 * server, recording for every request what it would cost on Vercel.
 *
 *   zsh scripts/build-lock.sh pnpm build        (NEXT_PUBLIC_SITE_URL=http://localhost:<port>)
 *   node scripts/compute-model/server.mjs --port 3131 [--log <requests.jsonl>]
 *
 * `run.mjs` starts it for a scenario run; started by hand it serves like `pnpm start`, with the ledger
 * at `/__compute-model/records`.
 *
 * WHY. Hobby allows 4 Active CPU-hours in a rolling 30 days and pauses every function past it; we
 * spent 3h 56m with zero real users (about 320,000 calls at about 44 ms each). A scaling regression
 * has to fail loudly before it ships, so each user action gets a count of the calls it makes and
 * the CPU they spend, measured here, never on Vercel (★ this binds 127.0.0.1 only, and nothing in
 * this folder sends a request anywhere but localhost).
 *
 * WHAT A RECORD SAYS, per request:
 *   - `proxy`: the proxy ran (`src/proxy.ts`, its matcher decides). ★ On Vercel the proxy is Routing
 *     Middleware on Fluid compute, run BEFORE the CDN cache: its own invocation, billed as one, even
 *     for a page the CDN then serves from cache. Read off `runMiddleware` itself, so the matcher is
 *     the build's, never a copy.
 *   - `fn`: the request reached a function on Vercel (a dynamic page or its RSC, a route handler, a
 *     Server Function). Not one: `/_next/static`, a public file, `/_next/image` (Image Optimization,
 *     billed apart), a config redirect, and a prerendered route (the CDN serves its HTML and RSC).
 *     Decided from the build's own manifests (`routes-manifest`, `prerender-manifest`), which are
 *     what Vercel's build output is made of.
 *   - `cpuMs` (the whole handler, proxy included), `proxyCpuMs`, and `vercelCpuMs`: the part Vercel
 *     bills (the proxy's when it ran, the rest only when `fn`). `process.cpuUsage()` across the
 *     handler, its `after()` work included (see "after()" below).
 *
 * ★ ONE REQUEST AT A TIME. `process.cpuUsage()` is the process's, so a request is only attributable
 * while it is the only one running: requests queue and run one by one (a browser's parallel fetches
 * cost the same calls, just slower). A turn that has not finished in TURN_TIMEOUT_MS releases the
 * queue and is marked `overlap` (a render fetching this server would otherwise deadlock it).
 *
 * ★ after(). Next defers `after()` work past the response (the guest page's link hit, the host
 * layout's activity clock). On Vercel it is `waitUntil` work, billed as Active CPU, so this server
 * hands Next a request context (`@next/request-context`, the hook the platform itself provides) whose
 * `waitUntil` the turn awaits (up to AFTER_TIMEOUT_MS) before reading the CPU.
 *
 * Local CPU is not Vercel's: an Apple-silicon core is faster, a warm process pays no cold start, and
 * Sentry (Vercel-only, `commonInit.enabled`) is off here. `run.mjs` calibrates against the measured
 * 44 ms a call and says the ratio.
 */
import { createServer } from "node:http";
import { appendFileSync, existsSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const require = createRequire(join(ROOT, "package.json"));

const argv = process.argv.slice(2);
const opt = (name, fallback) =>
  argv.includes(name) ? (argv[argv.indexOf(name) + 1] ?? fallback) : fallback;

const port = Number(opt("--port", ""));
// No default port: a lane measuring someone else's port is measuring someone else's tree, and 3000 is the
// Orchestrator's desk.
if (!Number.isInteger(port) || port < 1024 || port === 3000) {
  console.error("compute-model server needs --port <your port> (never 3000)");
  process.exit(2);
}
const logFile = opt("--log", "");
const HOST = "127.0.0.1";
const TURN_TIMEOUT_MS = 30_000;
const AFTER_TIMEOUT_MS = 5_000;
const CONTROL = "/__compute-model/";

if (!existsSync(join(ROOT, ".next", "BUILD_ID"))) {
  console.error(
    "compute-model server: no production build (.next/BUILD_ID); run zsh scripts/build-lock.sh pnpm build first",
  );
  process.exit(2);
}

// ── What the build says each path is ────────────────────────────────────────────────────────────
const readJson = (p) =>
  JSON.parse(readFileSync(join(ROOT, ".next", p), "utf8"));
const routesManifest = readJson("routes-manifest.json");
const prerender = readJson("prerender-manifest.json");
const appPathRoutes = readJson("app-path-routes-manifest.json");

/** The app's pages and route handlers, as patterns: `page` is the route ("/e/[token]"). */
const ROUTES = [
  ...routesManifest.staticRoutes,
  ...routesManifest.dynamicRoutes,
].map((r) => ({ page: r.page, re: new RegExp(r.regex) }));
/** Route handlers (a `route.ts`), by their route. */
const HANDLERS = new Set(
  Object.entries(appPathRoutes)
    .filter(([k]) => k.endsWith("/route"))
    .map(([, v]) => v),
);
/** Concrete paths the build prerendered (static or ISR): the CDN serves these on Vercel. */
const PRERENDERED = new Map(
  Object.entries(prerender.routes).map(([path, r]) => [
    path,
    r.initialRevalidateSeconds,
  ]),
);
/** The files under public/, by URL path: served by the CDN. */
const PUBLIC = new Set();
(function walk(dir) {
  if (!existsSync(dir)) return;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else
      PUBLIC.add(`/${relative(join(ROOT, "public"), p).split("\\").join("/")}`);
  }
})(join(ROOT, "public"));

function routeOf(pathname) {
  for (const r of ROUTES) if (r.re.test(pathname)) return r.page;
  return null;
}

/** The guest link's capability token never lands in a log (the link takes uploads). */
function maskPath(pathname) {
  return pathname.replace(
    /^\/(e|report)\/([^/]+)/,
    (_, seg, tok) => `/${seg}/${tok.slice(0, 4)}…`,
  );
}

/**
 * What the request is and whether it reaches a function on Vercel. Pure over the request's facts and
 * the build's manifests (exported for the runner's self-check).
 */
export function classify({
  method,
  pathname,
  headers,
  status,
  location,
  proxy,
}) {
  const h = (k) => headers[k];
  if (pathname.startsWith("/_next/static/") || pathname === "/favicon.ico")
    return { kind: "asset", fn: false, route: null };
  if (pathname.startsWith("/_next/image"))
    return { kind: "image", fn: false, route: null };
  if (pathname.startsWith("/_vercel/"))
    return { kind: "beacon", fn: false, route: null };
  if (PUBLIC.has(pathname)) return { kind: "public", fn: false, route: null };
  // A config redirect (next.config's redirects) answers before the proxy and any route: the CDN's.
  if (!proxy && (status === 307 || status === 308) && location)
    return { kind: "redirect", fn: false, route: null };
  const route = routeOf(pathname);
  const isAction = method === "POST" && Boolean(h("next-action"));
  const isRsc = h("rsc") === "1";
  const isPrefetch = isRsc && Boolean(h("next-router-prefetch"));
  const kind = isAction
    ? "action"
    : route && HANDLERS.has(route)
      ? "api"
      : isPrefetch
        ? "prefetch"
        : isRsc
          ? "rsc"
          : "page";
  if (isAction) return { kind, fn: true, route };
  // A prerendered page (its HTML, its RSC, its prefetch segments) and a prerendered GET route handler
  // are the CDN's. An unmatched path renders the root not-found: the CDN's too when the build
  // prerendered it.
  const concrete = route ? pathname.replace(/\/$/, "") || "/" : "/_not-found";
  if ((method === "GET" || method === "HEAD") && PRERENDERED.has(concrete)) {
    return {
      kind,
      fn: false,
      route: route ?? "(not-found)",
      prerendered: true,
    };
  }
  return { kind, fn: true, route: route ?? "(not-found)" };
}

// ── The proxy, timed where Next runs it ─────────────────────────────────────────────────────────
let current = null;
const NextNodeServer = require("next/dist/server/next-server").default;
const runMiddleware = NextNodeServer.prototype.runMiddleware;
NextNodeServer.prototype.runMiddleware = async function measuredProxy(params) {
  const rec = current;
  const c0 = process.cpuUsage();
  try {
    return await runMiddleware.call(this, params);
  } finally {
    if (rec) {
      const d = process.cpuUsage(c0);
      rec.proxy = true;
      rec.proxyCpuUs += d.user + d.system;
    }
  }
};

// ── after(): the platform's request context, so its waitUntil work is counted in its turn ───────
globalThis[Symbol.for("@next/request-context")] = {
  get: () =>
    current
      ? { waitUntil: (p) => current.waitUntil.push(Promise.resolve(p)) }
      : undefined,
};

const next = require("next");
const app = next({ dev: false, dir: ROOT, hostname: "localhost", port });
const handle = app.getRequestHandler();

// ── The ledger ──────────────────────────────────────────────────────────────────────────────────
let scenario = "(none)";
let t0 = Date.now();
const records = [];
const round = (us) => Math.round(us / 10) / 100; // µs → ms, 2 places

function finished(res) {
  return new Promise((r) => {
    if (res.writableFinished || res.destroyed) return r();
    res.once("finish", r);
    res.once("close", r);
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function measure(req, res) {
  const url = new URL(req.url ?? "/", `http://${HOST}`);
  // Next strips the RSC headers while it handles a request: read them before.
  const facts = {
    rsc: req.headers.rsc,
    "next-router-prefetch": req.headers["next-router-prefetch"],
    "next-action": req.headers["next-action"],
  };
  // A scenario with two devices on the server at once tells them apart by a cookie only localhost ever sees
  // (`cm_device`; a request header would break the browser's CORS preflight to R2).
  const device =
    /(?:^|;\s*)cm_device=([\w-]+)/.exec(req.headers.cookie ?? "")?.[1] ?? null;
  const rec = {
    scenario,
    device,
    t: Date.now() - t0,
    method: req.method,
    path: maskPath(url.pathname),
    proxy: false,
    proxyCpuUs: 0,
    waitUntil: [],
  };
  current = rec;
  const w0 = performance.now();
  const c0 = process.cpuUsage();
  let overlap = false;
  try {
    handle(req, res);
    const done = await Promise.race([
      finished(res).then(() => true),
      sleep(TURN_TIMEOUT_MS).then(() => false),
    ]);
    if (!done) overlap = true;
    else
      await Promise.race([
        Promise.allSettled(rec.waitUntil),
        sleep(AFTER_TIMEOUT_MS),
      ]);
    await new Promise((r) => setImmediate(r));
  } finally {
    const d = process.cpuUsage(c0);
    if (current === rec) current = null;
    const cpuUs = d.user + d.system;
    const c = classify({
      method: req.method,
      pathname: url.pathname,
      headers: facts,
      status: res.statusCode,
      location: res.getHeader("location"),
      proxy: rec.proxy,
    });
    const handlerUs = Math.max(0, cpuUs - rec.proxyCpuUs);
    const out = {
      scenario: rec.scenario,
      device: rec.device,
      t: rec.t,
      method: rec.method,
      path: rec.path,
      route: c.route,
      kind: c.kind,
      status: res.statusCode,
      cache: res.getHeader("x-nextjs-cache") ?? null,
      proxy: rec.proxy,
      fn: c.fn,
      calls: (rec.proxy ? 1 : 0) + (c.fn ? 1 : 0),
      cpuMs: round(cpuUs),
      proxyCpuMs: round(rec.proxyCpuUs),
      vercelCpuMs: round(
        (rec.proxy ? rec.proxyCpuUs : 0) + (c.fn ? handlerUs : 0),
      ),
      wallMs: Math.round(performance.now() - w0),
      after: rec.waitUntil.length,
      ...(overlap ? { overlap: true } : {}),
    };
    records.push(out);
    if (logFile) appendFileSync(logFile, `${JSON.stringify(out)}\n`);
  }
}

function control(req, res, url) {
  const send = (code, body) => {
    res.writeHead(code, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  };
  const what = url.pathname.slice(CONTROL.length);
  if (what === "health") return send(200, { ok: true, scenario });
  if (what === "scenario") {
    scenario = url.searchParams.get("name") || "(none)";
    t0 = Date.now();
    return send(200, { ok: true, scenario });
  }
  if (what === "records") {
    const name = url.searchParams.get("name");
    return send(
      200,
      name ? records.filter((r) => r.scenario === name) : records,
    );
  }
  if (what === "cpu") return send(200, process.cpuUsage());
  return send(404, { ok: false });
}

// The queue: one turn at a time (see the head note).
let queue = Promise.resolve();
await app.prepare();
createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${HOST}`);
  const remote = req.socket.remoteAddress ?? "";
  if (url.pathname.startsWith(CONTROL)) {
    if (!["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(remote)) {
      res.writeHead(403).end();
      return;
    }
    control(req, res, url);
    return;
  }
  queue = queue
    .then(() => measure(req, res))
    .catch((e) => {
      console.error("compute-model server:", e);
    });
}).listen(port, HOST, () => {
  console.log(
    `compute-model server: http://localhost:${port} (production build, one request at a time)${logFile ? `, ledger ${logFile}` : ""}`,
  );
});
